#!/usr/bin/node

"use strict";

var mysql = require('mysql');
var pool = mysql.createPool(require('./config'));
process.on('exit', function onExit() {
    pool.end();
});

var uuid = require('uuid/v1');
var log = require('ssi-logger');
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
var pkg = require('./package.json');

// configure logging

process.on('log', log.syslogTransport('LOG_LOCAL5', 'INFO'));

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

// i18n
i18n.configure({
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    cookie: 'locale',
    directory: __dirname + '/locales',
    logDebugFn: function (msg) {
        log('DEBUG', msg);
    },
    logWarnFn: function (msg) {
        log('WARN', msg);
    },
    logErrorFn: function (msg) {
        log('ERR', msg);
    }
});

// handlebars helpers

hbs.registerHelper('__', function __() {
  return i18n.__.apply(this, arguments);
});

hbs.registerHelper('__n', function __n() {
  return i18n.__n.apply(this, arguments);
});

hbs.registerHelper('paginate', paginate);

// express

var app = express();

app.set('trust proxy', 'loopback');
app.set('view engine', 'hbs');
app.disable('x-powered-by');
app.disable('etag');

app.use(function loggingConfig(req, res, next) {
    req.id = uuid();
    req.log = log.defaults({
        request_id: req.id,
        client_ip: req.ip
    });
    res.set('X-Request-ID', req.id);
    res.locals.request_id = req.id;
    next();
});

app.use(cookieParser());    // needed for i18n
app.use(i18n.init);         // setup i18n before we do anything that outputs text in a particular language
app.use(function i18n(req, res, next) {
    res.header('Content-Language', res.getLocale());
    res.locals.locale = res.getLocale();
    res.locals.locales = Object.keys(res.getCatalog(''));
    res.locals[res.locals.locale] = true;
    next();
});

app.use(morgan('combined', { stream: accessLogStream })); // logging

// when in production, cache for a year
var staticOpts = app.get('env') === "production" ? { maxAge: "1y" } : { };

// static routes first -- there is more static content than dynamic.
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use('/static/' + pkg.version + '/', express.static(path.join(__dirname, 'public'), staticOpts));
app.use('/static/' + pkg.version + '/', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist'), staticOpts));
app.use('/static/' + pkg.version + '/js/', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist'), staticOpts));

app.use(expressPackageJson(path.join(__dirname, 'package.json'))); // make package.json available to templates via res.locals.pkg

// landing page
app.get('/', function getRoot(req, res) {
    req.log('INFO', 'Landing Page Visit');
    res.render('index');
});

// perform search, render the page, result set, or error. If a single result is found, redirect to that page
app.get('/search', function getSearchResults(req, res) {
    var page = req.query.page || 1;
    var limit = 10;
    var offset = limit * (page - 1);

    var q = typeof req.query.q === 'string' ? req.query.q.replace(/[^A-Za-z0-9_]/g, ' ').trim() + '*' : '';

    pool.query('SELECT SQL_CALC_FOUND_ROWS *, MATCH(`callsign`,`first_name`,`surname`,`address_line`,`city`,`prov_cd`,`postal_code`,`club_name`,`club_name_2`,`club_address`,`club_city`,`club_prov_cd`,`club_postal_code`) AGAINST (? IN BOOLEAN MODE) AS relevance FROM callsigns HAVING relevance > 0.2 ORDER BY relevance DESC LIMIT ?, ?; SELECT FOUND_ROWS() AS num_results', [ q, offset, limit ], function query(err, results) {
        if (err) { // error, display error
            req.log('ERR', 'Callsign Query: Error', err, { q: q });
            res.status(500).render('index', { err: { code: 500, type: 'danger', message: res.__("Database error. Please try again later.") }, result: null, resultSet: null });
        } else if (results[0].length === 0) { // no results, display no results message
            req.log('INFO', 'Callsign Query: No results', { q: q });
            res.status(404).render('index', { err: { code: 404, type: 'info', message: res.__("No results found.") }, result: null, resultSet: null });
        } else if (results[0].length === 1 && !req.query.page) { // one result, display it
            req.log('INFO', 'Callsign Query: Single Result', { q: q, callsign: results[0][0].callsign });
            res.redirect('/callsigns/' + results[0][0].callsign);
        } else { // many results, display a paginated list
            req.log('INFO', 'Callsign Query: Multiple Results', { q: q, count: results[1][0].num_results });
            res.render('index', { err: null, result: null, resultSet: results[0], pagination: { page: page, pageCount: Math.ceil(results[1][0].num_results / limit) }, num_results: results[1][0].num_results, q: q });
        }
    });
});

// Display a single result
app.get('/callsigns/:callsign', function getCallsign(req, res) {
    pool.query('SELECT * FROM callsigns WHERE callsign = ?', [ req.params.callsign ], function query(err, results) {
        if (err || results.length > 1) { // error, display error
            req.log('ERR', 'Callsign Lookup: Error', err, { callsign: req.params.callsign });
            res.status(500).render('index', { err: { code: 500, type: 'danger', message: res.__("Database error. Please try again later.") }, result: null, resultSet: null });
        } else if (results.length === 0) { // no results, display no results message
            req.log('INFO', 'Callsign Lookup: Not Found', { callsign: req.params.callsign });
            res.status(404).render('index', { err: { code: 404, type: 'info', message: res.__("No results found.") }, result: null, resultSet: null });
        } else if (results.length === 1) { // one result, display it
            req.log('INFO', 'Callsign Lookup: Found', { callsign: req.params.callsign });
            res.render('index', { err: null, result: results[0], resultSet: null });
        }
    });    
});

// Set the locale cookie and redirect back to '/'
app.get('/lang/:locale', function setLang(req, res) {
    req.log('INFO', 'Changing locale', { from_locale: res.getLocale(), to_locale: req.params.locale });
    res.cookie('locale', req.params.locale, { httpOnly: true });
    res.redirect('back');
});

app.listen(3000, function () {
    log('INFO', 'Service Available');
});
