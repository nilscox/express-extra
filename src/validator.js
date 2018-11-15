const ValueValidator = require('./value-validator');
const { ValidationError, ValidationErrors, InvalidValueTypeError } = require('./errors');

const Validator = module.exports = (fields, globalValidation) => {

  const validateObject = async (data, opts = {}, globalOpts = {}) => {
    const validated = {};
    const errors = [];
    const keys = Object.keys(fields);

    if (!(data instanceof Object))
      throw new InvalidValueTypeError('Object');

    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];

      try {
        if (opts[key] !== false)
          validated[key] = await fields[key](data[key], opts[key] || {});
      } catch (e) {
        if (!(e instanceof ValidationError))
          throw e;

        e.field = key;
        errors.push(e);
      }
    }

    if (errors.length > 0)
      throw new ValidationErrors(errors);

    if (globalValidation)
      await globalValidation(validated, globalOpts);

    return validated;
  };

  validateObject.many = (data, opts = {}) => {
    return ValueValidator({
      many: true,
      validate: validateObject,
    })(data, opts);
  };

  return validateObject;
};
