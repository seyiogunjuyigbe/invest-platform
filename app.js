require( 'dotenv' ).config();
const express = require('express');
const path = require('path');
const bParser = require( 'body-parser' );
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { dev, MONGO_URL, NODE_ENV, PORT } = require('./config/remotes')
const allowedOrigins = ["https://production.app.com"];
const Database = require("./config/db")
const cors = require( './config/cors' );

if ( dev ) {
  const allowedDevOrigins = [ 'http://localhost:8882' ];
  allowedOrigins.push( ...allowedDevOrigins )
}
new Database( ).connect( MONGO_URL );

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();
app.use( bParser.json( { limit : '50mb' } ) );
app.use( bParser.urlencoded( { limit : "50mb" , extended : true , parameterLimit : 500000 } ) );
app.use( cors( allowedOrigins ) );
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
