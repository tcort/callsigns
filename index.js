#!/usr/bin/node

"use strict";

var hbs = require('hbs');
var paginate = require('handlebars-paginate');
var favicon = require('serve-favicon');
var mysql = require('mysql');
var pool = mysql.createPool(require('./config'));
process.on('exit', function () {
    pool.end();
});

var express = require('express');
var helmet = require('helmet');
var path = require('path');

hbs.registerHelper('paginate', paginate);

var app = express();

app.set('view engine', 'hbs');

app.use(helmet());

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

// lookup last_update timestamp
app.get('/', function (req, res, next) {

    pool.getConnection(function (err, conn) {
        if (err) {
            res.render('index', { err: { code: 500, type: 'danger', message: "Database error. Please try again later." }, result: null, resultSet: null });
            if (conn) {
                conn.release();
            }
            return;
        }
        conn.query('select max(last_update) as last_update from sync', function (err, result) {
            if (err || result.length !== 1) {
                res.render('index', { err: { code: 500, type: 'danger', message: "Database error. Please try again later." }, result: null, resultSet: null });
            } else {
                res.locals.last_update = result[0].last_update;
                next();
            }
            conn.release();
        });
    });
});

// perform search (if criterion is supplied), render the page, result set, or error. If a single result is found, redirect to that page
app.get('/', function (req, res) {

    // render page if no search criterion was supplied (no error, no result, no result set)
    if (!req.query.criterion || typeof req.query.criterion !== 'string') {
        res.render('index', { err: null, result: null, resultSet: null });
        return;
    }

    var page = req.query.page || 1;
    var limit = 42;
    var offset = limit * (page - 1);

    pool.getConnection(function (err, conn) {
        if (err) {
            res.render('index', { err: { code: 500, type: 'danger', message: "Database error. Please try again later." }, result: null, resultSet: null });
            if (conn) {
                conn.release();
            }
            return;
        }
        conn.query('SELECT SQL_CALC_FOUND_ROWS *, MATCH(`callsign`,`first_name`,`surname`,`address_line`,`city`,`prov_cd`,`postal_code`,`club_name`,`club_name_2`,`club_address`,`club_city`,`club_prov_cd`,`club_postal_code`) AGAINST (? IN NATURAL LANGUAGE MODE) AS relevance FROM callsigns WHERE MATCH(`callsign`,`first_name`,`surname`,`address_line`,`city`,`prov_cd`,`postal_code`,`club_name`,`club_name_2`,`club_address`,`club_city`,`club_prov_cd`,`club_postal_code`) AGAINST (? IN NATURAL LANGUAGE MODE) HAVING relevance > 0.2 ORDER BY relevance DESC LIMIT ?, ?; SELECT FOUND_ROWS() AS num_results', [ req.query.criterion, req.query.criterion, offset, limit ], function (err, results) {
            if (err) { // error, display error
                res.render('index', { err: { code: 500, type: 'danger', message: "Database error. Please try again later." }, result: null, resultSet: null });
            } else if (results[0].length === 0) { // no results, display no results message
                res.render('index', { err: { code: 404, type: 'info', message: "No results found."}, result: null, resultSet: null });
            } else if (results[0].length === 1 && !req.query.page) { // one result, display it
                res.redirect('/callsigns/' + results[0][0].callsign);
            } else { // many results, display a paginated list
                res.render('index', { err: null, result: null, resultSet: results[0], pagination: { page: page, pageCount: Math.ceil(results[1][0].num_results / limit) }, num_results: results[1][0].num_results, criterion: req.query.criterion });
            }
            conn.release();
        });
    });
});

// Display a single result
// TODO consider making this return JSON if the user requested json
app.get('/callsigns/:callsign', function (req, res) {
    pool.getConnection(function (err, conn) {
        if (err) {
            res.render('index', { err: { code: 500, type: 'danger', message: "Database error. Please try again later." }, result: null, resultSet: null });
            if (conn) {
                conn.release();
            }
            return;
        }
        conn.query('SELECT * FROM callsigns WHERE callsign = ?', [ req.params.callsign ], function (err, results) {
            if (err || results.length > 1) { // error, display error
                res.render('index', { err: { code: 500, type: 'danger', message: "Database error. Please try again later." }, result: null, resultSet: null });
            } else if (results.length === 0) { // no results, display no results message
                res.render('index', { err: { code: 404, type: 'info', message: "No results found."}, result: null, resultSet: null });
            } else if (results.length === 1) { // one result, display it
                res.render('index', { err: null, result: results[0], resultSet: null });
            }
            conn.release();
        });
    });    
});


app.listen(3000);
