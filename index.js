global.Promise = require('bluebird');

const extra = require('./src/extra');
const errors = require('./src/errors');
const Authorizer = require('./src/authorizer');
const Validator = require('./src/validator');
const ValueValidator = require('./src/value-validator');
const Formatter = require('./src/formatter');

module.exports = extra;

module.exports.extra = extra;
module.exports.Authorizer = Authorizer;
module.exports.Validator = Validator;
module.exports.ValueValidator = ValueValidator;
module.exports.Formatter = Formatter;

Object.keys(errors).forEach(e => module.exports[e] = errors[e]);
