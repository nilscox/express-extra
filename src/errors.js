class ExpressExtraError extends Error {

  constructor(status, message) {
    super(message);

    this.status = status;
  }

  toJSON() {
    return { error: this.message };
  }

}

class BadRequestError extends ExpressExtraError {

  constructor(message) {
    super(400, message);
  }

}

class ValidationError extends BadRequestError {

  constructor(message, field) {
    super(message);
    this.field = field;
  }

  toJSON() {
    if (!this.field)
      return this.message;

    return { [this.field]: this.message };
  }

}

class ValidationErrors extends ValidationError {

  constructor(errors, field) {
    const message = errors.reduce((arr, error) => {
      if (error instanceof ValidationError) {
        const json = error.toJSON();

        Object.keys(json).forEach(key => {
          arr.push(`  ${key} => ${json[key]}`);
        });
      } else {
        arr.push(error.message);
      }

      return arr;
    }, []).join('\n');

    super('ValidationErrors:\n' + message, field);
    this.errors = errors;
  }

  toJSON() {
    return this.errors.reduce((obj, error) => {
      const json = error.toJSON();

      Object.keys(json).forEach(key => {
        if (this.field)
          obj[this.field + '.' + key] = json[key];
        else
          obj[key] = json[key];
      });

      return obj;
    }, {});
  }

}

class MissingValueError extends ValidationError {

  constructor(field) {
    super('this field is required', field);
  }

}

class InvalidValueTypeError extends ValidationError {

  constructor(type, field) {
    super(`this field must be of type ${type}`, field);
    this.type = type;
  }

}

module.exports = {
  ExpressExtraError,
  BadRequestError,
  ValidationErrors,
  ValidationError,
  MissingValueError,
  InvalidValueTypeError,
};
