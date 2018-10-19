global.Promise = require('bluebird');

module.exports.Validator = require('./src/validator');
module.exports.ValueValidator = require('./src/value-validator');
module.exports.errors = require('./src/errors');
