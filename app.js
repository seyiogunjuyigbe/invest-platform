require('dotenv').config();
const express = require('express');
const path = require('path');
const bParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { load } = require('js-yaml');
const { readFileSync } = require('fs');

const routes = require('./routes');
const { dev, MONGO_URL } = require('./config/remotes');
const Database = require('./config/db');
const cors = require('./config/cors');
const errorHandler = require('./middlewares/error-handler');
const { loadDefinitions, loadPaths } = require('./documentations');
const ejs = require('ejs');

const allowedOrigins = ['https://production.app.com'];

if (dev) {
  const allowedDevOrigins = ['http://localhost:8882'];
  allowedOrigins.push(...allowedDevOrigins);
}

new Database().connect(MONGO_URL);

const app = express();
app.use(bParser.json({ limit: '50mb' }));
app.use(
  bParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 500000 })
);
app.use(cors(allowedOrigins));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1', routes);

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
app.use(errorHandler);
app.use((req, res) => res.status(404).json({ message: 'URL Not Found' }));

require('./config/passport');

module.exports = app;
