#!/usr/bin/node

"use strict";

var mysql = require('mysql');
var pool = mysql.createPool(require('./config'));
process.on('exit', function onExit() {
    pool.end();
});

var hbs = require('hbs');
var paginate = require('handlebars-paginate');
var express = require('express');
var expressPackageJson = require('express-package-json');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var path = require('path');
var fs = require('fs');
var FileStreamRotator = require('file-stream-rotator');
var morgan = require('morgan');
var i18n = require('i18n');

// i18n
i18n.configure({
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    cookie: 'locale',
    directory: __dirname + '/locales'
});

// handlebars helpers

hbs.registerHelper('__', function __() {
  return i18n.__.apply(this, arguments);
});

hbs.registerHelper('__n', function __n() {
  return i18n.__n.apply(this, arguments);
});

hbs.registerHelper('paginate', paginate);

// configure logging
var logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

var accessLogStream = FileStreamRotator.getStream({
    filename: path.join(logDirectory, 'access-%DATE%.log'),
    frequency: 'daily',
    verbose: false,
    date_format: 'YYYY-MM-DD'
});

// express

var app = express();

app.set('trust proxy', 'loopback');
app.set('view engine', 'hbs');
app.disable('x-powered-by');

app.use(cookieParser());    // needed for i18n
app.use(i18n.init);         // setup i18n before we do anything that outputs text in a particular language
app.use(function (req, res, next) {
    res.locals.locale = res.getLocale();
    res.locals.locales = Object.keys(res.getCatalog(''));
    next();
});

app.use(morgan('combined', { stream: accessLogStream })); // logging

// static routes first -- there is more static content than dynamic.
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

app.use(expressPackageJson(path.join(__dirname, 'package.json'))); // make package.json available to templates via res.locals.pkg

// perform search (if q is supplied), render the page, result set, or error. If a single result is found, redirect to that page
app.get('/', function getRoot(req, res) {

    // render page if no search q was supplied (no error, no result, no result set)
    if (!req.query.q || typeof req.query.q !== 'string') {
        res.render('index', { err: null, result: null, resultSet: null });
        return;
    }

    var page = req.query.page || 1;
    var limit = 10;
    var offset = limit * (page - 1);

    pool.query('SELECT SQL_CALC_FOUND_ROWS *, MATCH(`callsign`,`first_name`,`surname`,`address_line`,`city`,`prov_cd`,`postal_code`,`club_name`,`club_name_2`,`club_address`,`club_city`,`club_prov_cd`,`club_postal_code`) AGAINST (? IN NATURAL LANGUAGE MODE) AS relevance FROM callsigns WHERE MATCH(`callsign`,`first_name`,`surname`,`address_line`,`city`,`prov_cd`,`postal_code`,`club_name`,`club_name_2`,`club_address`,`club_city`,`club_prov_cd`,`club_postal_code`) AGAINST (? IN NATURAL LANGUAGE MODE) HAVING relevance > 0.2 ORDER BY relevance DESC LIMIT ?, ?; SELECT FOUND_ROWS() AS num_results', [ req.query.q, req.query.q, offset, limit ], function query(err, results) {
        if (err) { // error, display error
            res.status(500).render('index', { err: { code: 500, type: 'danger', message: res.__("Database error. Please try again later.") }, result: null, resultSet: null });
        } else if (results[0].length === 0) { // no results, display no results message
            res.status(404).render('index', { err: { code: 404, type: 'info', message: res.__("No results found.") }, result: null, resultSet: null });
        } else if (results[0].length === 1 && !req.query.page) { // one result, display it
            res.redirect('/callsigns/' + results[0][0].callsign);
        } else { // many results, display a paginated list
            res.render('index', { err: null, result: null, resultSet: results[0], pagination: { page: page, pageCount: Math.ceil(results[1][0].num_results / limit) }, num_results: results[1][0].num_results, q: req.query.q });
        }
    });
});

// Display a single result
app.get('/callsigns/:callsign', function getCallsign(req, res) {
    pool.query('SELECT * FROM callsigns WHERE callsign = ?', [ req.params.callsign ], function query(err, results) {
        if (err || results.length > 1) { // error, display error
            res.status(500).render('index', { err: { code: 500, type: 'danger', message: res.__("Database error. Please try again later.") }, result: null, resultSet: null });
        } else if (results.length === 0) { // no results, display no results message
            res.status(404).render('index', { err: { code: 404, type: 'info', message: res.__("No results found.") }, result: null, resultSet: null });
        } else if (results.length === 1) { // one result, display it
            res.render('index', { err: null, result: results[0], resultSet: null });
        }
    });    
});

// Set the locale cookie and redirect back to '/'
app.get('/lang/:locale', function setLang(req, res) {
    res.cookie('locale', req.params.locale, { maxAge: 60*60*24*30 /* 30 days */, httpOnly: true });
    res.redirect('back');
});

app.listen(3000);
