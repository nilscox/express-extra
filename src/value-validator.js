const {
  ValidationError,
  ValidationErrors,
  MissingValueError,
  InvalidValueTypeError,
  ReadOnlyValueError,
} = require('./errors');

const DEFAULT_FIELD = {
  type: undefined,
  required: false,
  readOnly: false,
  allowNull: false,
  defaultValue: undefined,
  many: false,
  validate: () => {},
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

const ValueValidator = module.exports = field => async (data, opts = {}) => {
  const {
    type,
    required,
    readOnly,
    allowNull,
    defaultValue,
    many,
    validate,
  } = { ...DEFAULT_FIELD, ...field, ...opts };

  if (readOnly) {
    if (data === undefined)
      return;
    else
      throw new ReadOnlyValueError();
  }

  if (data === undefined)
    data = defaultValue;

  if (data === undefined) {
    if (!required)
      return;
    else
      throw new MissingValueError();
  }

  if (allowNull && data === null)
    return null;

  const callValidate = async (data, validate) => {
    try {
      const validated = await validate(data, opts);

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

  if (many) {
    const validated = [];
    const errors = [];

    if (!(data instanceof Array))
      throw new InvalidValueTypeError('Array' + (type ? `<${type}>` : ''));

    for (let i = 0; i < data.length; ++i) {
      try {
        if (isPrimitiveType(type) && typeof data[i] !== type)
          throw new InvalidValueTypeError(type);

        validated[i] = await callValidate(data[i], validate);
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

  return callValidate(data, validate);
};
