const { ValidationError, ValidationErrors, MissingValueError, InvalidValueTypeError } = require('./errors');

const DEFAULT_FIELD = {
  type: undefined,
  required: false,
  allowNull: false,
  defaultValue: undefined,
  many: false,
  validate: () => {},
};

const DEFAULT_OPTS = {
  partial: false,
};

const isPrimitiveType = t => {
  return [
    'boolean',
    'null',
    'undefined',
    'number',
    'string',
    'symbol',
  ].indexOf(t) >= 0;
};

const ValueValidator = module.exports = field => async (data, opts = DEFAULT_OPTS) => {
  const { type, required, allowNull, defaultValue, many, validate } = { ...DEFAULT_FIELD, ...field };
  const { partial } = { ...DEFAULT_OPTS, ...opts };

  if (data === undefined)
    data = defaultValue;

  const isset = data !== undefined;

  if ((partial || !required) && !isset)
    return;

  if (required && !isset)
    throw new MissingValueError();

  if (allowNull && data === null)
    return null;

  const validateData = async data => {
    const callValidate = async (data, validate) => {
      try {
        const validated = await validate(data, opts);
  
        // call validateData?
        if (typeof validated === 'function')
          return await callValidate(data, validated);

        if (validated !== undefined)
          return validated;

        return data;
      } catch (e) {
        if (type && !isPrimitiveType(type) && e instanceof InvalidValueTypeError)
          e.type = type;

        throw e;
      }
    };

    if (validate instanceof Array)
      return await Promise.reduce(validate, callValidate, data);
    else
      return await callValidate(data, validate);
  };

  if (many) {
    const validated = [];
    const errors = [];

    if (!(data instanceof Array))
      throw new InvalidValueTypeError('Array' + (type ? `<${type}>` : ''));

    for (let i = 0; i < data.length; ++i) {
      try {
        if (isPrimitiveType(type) && typeof data[i] !== type)
          throw new InvalidValueTypeError(type);

        validated[i] = await validateData(data[i]);
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
  }

  if (isPrimitiveType(type) && typeof data !== type)
    throw new InvalidValueTypeError(type);

  return validateData(data);
};
