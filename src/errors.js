class ExpressExtraError extends Error {

  constructor(message, status) {
    super(message || ExpressExtraError.message);
    this.status = status || ExpressExtraError.status;
  }

  toJSON() {
    return { error: this.message };
  }

}

ExpressExtraError.message = 'Error';
ExpressExtraError.status = 500;

class BadRequestError extends ExpressExtraError {

  constructor(message) {
    super(message || BadRequestError.message, BadRequestError.status);
  }

}

BadRequestError.message = 'Bad request';
BadRequestError.status = 400;

class NotFoundError extends ExpressExtraError {

  constructor(resource, message) {
    super(message || NotFoundError.message, NotFoundError.status);
    this.resource = resource;
  }

  toJSON() {
    const json = super.toJSON();

    if (this.resource)
      json.resource = this.resource;

    return json;
  }

}

NotFoundError.message = 'Not found';
NotFoundError.status = 404;

class AuthorizationError extends ExpressExtraError {

  constructor(message) {
    super(message || AuthorizationError.message, AuthorizationError.status);
  }

}

AuthorizationError.message = 'Unauthorized';
AuthorizationError.status = 401;

class ValidationError extends BadRequestError {

  constructor(message, field) {
    super(message || ValidationError.message);
    this.field = field;
  }

  toJSON() {
    if (!this.field)
      return this.message;

    return { [this.field]: this.message };
  }

}

ValidationError.message = 'Invalid';

class ValidationErrors extends ValidationError {

  constructor(errors, field) {
    let total = 0;

    const message = errors.reduce((arr, error) => {
      if (error instanceof ValidationError) {
        const json = error.toJSON();

        Object.keys(json).forEach(key => {
          arr.push(`  ${key} => ${json[key]}`);
          total++;
        });
      } else {
        arr.push(error.message);
        total++;
      }

      return arr;
    }, []).join('\n');

    super(`ValidationErrors: ${total} error${total > 1 ? 's' : ''}\n` + message, field);
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

  constructor(message, field) {
    super(message || MissingValueError.message, field);
  }

}

MissingValueError.message = 'Missing value';

class ReadOnlyValueError extends ValidationError {

  constructor(message, field) {
    super(message || ReadOnlyValueError.message, field);
  }

}

ReadOnlyValueError.message = 'Read only value';

class InvalidValueTypeError extends ValidationError {

  constructor(type, message, field) {
    super(message || InvalidValueTypeError.message, field);
    this.type = type;
  }

}

InvalidValueTypeError.message = 'Invalid value type';

module.exports = {
  ExpressExtraError,
  BadRequestError,
  NotFoundError,
  AuthorizationError,
  ValidationErrors,
  ValidationError,
  MissingValueError,
  ReadOnlyValueError,
  InvalidValueTypeError,
};
