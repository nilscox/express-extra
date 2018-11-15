const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { ExpressExtraError } = require('express-extra');
const pkg = require('../package');
const api = require('./routes');
const { Author, Book } = require('./db');

const app = module.exports = express();

app.use(bodyParser.json());
app.use(session({
  secret: 's3cr3t',
  resave: true,
  saveUninitialized: true,
}));

app.get('/version', (req, res) => res.send(pkg.version));
app.use('/api', api);

app.use((err, req, res, next) => {
  if (err instanceof ExpressExtraError)
    res.status(err.status).json(err.toJSON());
  else {
    console.error(err);
    res.status(500).send(err.toString());
  }
});
