const ValueValidator = require('./value-validator');
const { ValidationError, ValidationErrors, InvalidValueTypeError } = require('./errors');

const Validator = module.exports = (fields) => {

  const validateArray = async (data, opts) => {
    const validated = [];
    const errors = [];

    if (!(data instanceof Array))
      throw new InvalidValueTypeError('Array');

    for (let i = 0; i < data.length; ++i) {
      try {
        validated[i] = await validateObject(data[i], opts);
      } catch (e) {
        if (!(e instanceof ValidationError))
          throw e;

        e.field = `[${i}]`;
        errors.push(e);
      }
    }

    if (errors.length > 0)
      throw new ValidationErrors(errors);

    return validated;
  };

  const validateObject = async (data, opts) => {
    const validated = {};
    const errors = [];
    const keys = Object.keys(fields);

    if (!(data instanceof Object))
      throw new InvalidValueTypeError('Object');

    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];

      try {
        validated[key] = await fields[key](data[key], opts);
      } catch (e) {
        if (!(e instanceof ValidationError))
          throw e;

        e.field = key;
        errors.push(e);
      }
    }

    if (errors.length > 0)
      throw new ValidationErrors(errors);

    return validated;
  };

  return async (data, opts = {}) => {
    if (opts.many) {
      return await ValueValidator({
        many: true,
        validate: validateObject,
      })(data, { ...opts, many: false });
    }
    else
      return await validateObject(data, opts);
  };
};
