require('dotenv').config();
const express = require('express');
const path = require('path');
const bParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { load } = require('js-yaml');
const { readFileSync } = require('fs');

const ejs = require('ejs');
const cors = require('cors');
const routes = require('./routes');
const { dev, MONGO_URL } = require('./config/remotes');
const Database = require('./config/db');
const errorHandler = require('./middlewares/error-handler');
const { loadDefinitions, loadPaths } = require('./documentations');

const allowedOrigins = [
  'https://production.app.com',
  'http://black-gold.herokuapp.com/',
  'https://black-gold.herokuapp.com/',
];

if (dev) {
  const allowedDevOrigins = ['http://localhost:8882', 'http://localhost:3000'];
  allowedOrigins.push(...allowedDevOrigins);
}

new Database().connect(MONGO_URL);

const app = express();
app.use(cors());
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'pug');
app.use(bParser.json({ limit: '50mb' }));
app.use(
  bParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 500000 })
);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/swagger.json', (req, res) => {
  const data = {
    paths: loadPaths() || '',
    definitions: loadDefinitions() || '',
  };
  const swaggerTemplate = readFileSync(
    path.join(__dirname, './documentations/swagger.yaml'),
    'utf8'
  );
  const swaggerSchema = ejs.render(swaggerTemplate, data);

  res.setHeader('Content-Type', 'application/json');
  res.send(load(swaggerSchema));
});
app.get('/', (req, res) => res.render('index'));

app.use('/api/v1', routes);

app.use(errorHandler);

app.use((req, res) => res.status(404).json({ message: 'URL Not Found' }));

require('./config/passport');
require('./bootstrap')();
require('./jobs')();

module.exports = app;
