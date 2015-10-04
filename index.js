#!/usr/bin/node

"use strict";

var mysql = require('mysql');
var pool = mysql.createPool(require('./config'));
process.on('exit', function () {
    pool.end();
});

var express = require('express');
var helmet = require('helmet');
var path = require('path');

var app = express();

app.set('view engine', 'hbs');

app.use(helmet());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

// lookup last_update timestamp
app.get('/', function (req, res, next) {

    pool.getConnection(function (err, conn) {
        if (err) {
            res.render('index', { err: { code: 500, type: 'danger', message: "Database error. Please try again later." }, result: null });
            if (conn) {
                conn.release();
            }
            return;
        }
        conn.query('select max(last_update) as last_update from sync', function (err, result) {
            if (err || result.length !== 1) {
                res.render('index', { err: { code: 500, type: 'danger', message: "Database error. Please try again later." }, result: null });
            } else {
                res.locals.last_update = result[0].last_update;
                next();
            }
            conn.release();
        });
    });
});

// render page if no callsign supplied (no error, no result)
app.get('/', function (req, res, next) {

    if (!req.query.callsign || typeof req.query.callsign !== 'string') {
        res.render('index', { err: null, result: null });
        return;
    }

    next();
});

// look up callsign, render page with result or error
app.get('/', function (req, res) {

    pool.getConnection(function (err, conn) {
        if (err) {
            res.render('index', { err: { code: 500, type: 'danger', message: "Database error. Please try again later." }, result: null });
            if (conn) {
                conn.release();
            }
            return;
        }
        conn.query('SELECT * FROM callsigns WHERE callsign = ?', [ req.query.callsign.toUpperCase() ], function (err, result) {
            if (err || result.length > 1) {
                res.render('index', { err: { code: 500, type: 'danger', message: "Database error. Please try again later." }, result: null });
            } else if (result.length === 0) {
                res.render('index', { err: { code: 404, type: 'info', message: "Callsign not found."}, result: null });
            } else {
                res.render('index', { err: null, result: result[0] });
            }
            conn.release();
        });
    });    
});

app.listen(3000);
