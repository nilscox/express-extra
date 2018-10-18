global.Promise = require('bluebird');

module.exports.validate = require('./src/validate');
module.exports.validator = require('./src/validator');
module.exports.errors = require('./src/errors');
