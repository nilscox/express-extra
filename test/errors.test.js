const expect = require('./expect');
const {
  ExpressExtraError,
  BadRequestError,
  NotFoundError,
  AuthorizationError,
  ValidationError,
  ValidationErrors,
  MissingValueError,
  ReadOnlyValueError,
  InvalidValueTypeError,
} = require('../index');

describe('errors', () => {

  const DEFAULT_MESSAGES = {};

  before(() => {
    Object.assign(DEFAULT_MESSAGES, {
      ExpressExtraError: ExpressExtraError.message,
      BadRequestError: BadRequestError.message,
      NotFoundError: NotFoundError.message,
      AuthorizationError: AuthorizationError.message,
      ValidationError: ValidationError.message,
      MissingValueError: MissingValueError.message,
      ReadOnlyValueError: ReadOnlyValueError.message,
      InvalidValueTypeError: InvalidValueTypeError.message,
    });
  });

  afterEach(() => {
    ExpressExtraError.message = DEFAULT_MESSAGES.ExpressExtraError;
    BadRequestError.message = DEFAULT_MESSAGES.BadRequestError;
    NotFoundError.message = DEFAULT_MESSAGES.NotFoundError;
    AuthorizationError.message = DEFAULT_MESSAGES.AuthorizationError;
    ValidationError.message = DEFAULT_MESSAGES.ValidationError;
    MissingValueError.message = DEFAULT_MESSAGES.MissingValueError;
    ReadOnlyValueError.message = DEFAULT_MESSAGES.ReadOnlyValueError;
    InvalidValueTypeError.message = DEFAULT_MESSAGES.InvalidValueTypeError;
  });

  describe('ExpressExtraError', () => {

    it('should have a default message', () => {
      const err = new ExpressExtraError();

      expect(err).to.have.property('message', 'Error');
      expect(err).to.have.property('status', 500);
      expect(err.toJSON()).to.deep.eql({ error: 'Error' });

      expect(new ExpressExtraError('message')).have.property('message', 'message');
    });

    it('should set the default error message', () => {
      ExpressExtraError.message = 'ERROR';

      const err = new ExpressExtraError();

      expect(err).to.have.property('message', 'ERROR');
      expect(err.toJSON()).to.deep.eql({ error: 'ERROR' });
    });

  });

  describe('BadRequestError', () => {

    it('should have a default message', () => {
      const err = new BadRequestError();

      expect(err).to.have.property('message', 'Bad request');
      expect(err).to.have.property('status', 400);
      expect(err.toJSON()).to.deep.eql({ error: 'Bad request' });

      expect(new BadRequestError('message')).have.property('message', 'message');
    });

    it('should set the default error message', () => {
      BadRequestError.message = 'BAD_REQUEST';

      const err = new BadRequestError();

      expect(err).to.have.property('message', 'BAD_REQUEST');
      expect(err.toJSON()).to.deep.eql({ error: 'BAD_REQUEST' });
    });

  });

  describe('NotFoundError', () => {

    it('should have a default message', () => {
      const err = new NotFoundError();

      expect(err).to.have.property('message', 'Not found');
      expect(err).to.have.property('status', 404);
      expect(err.toJSON()).to.deep.eql({ error: 'Not found' });

      expect(new NotFoundError(null, 'message')).have.property('message', 'message');
    });

    it('should store the resource name', () => {
      const err = new NotFoundError('res');

      expect(err).to.have.property('resource', 'res');
      expect(err.toJSON()).to.deep.eql({ error: 'Not found', resource: 'res' });
    });

    it('should set the default error message', () => {
      NotFoundError.message = 'NOT_FOUND';

      const err = new NotFoundError();

      expect(err).to.have.property('message', 'NOT_FOUND');
      expect(err.toJSON()).to.deep.eql({ error: 'NOT_FOUND' });
    });

  });

  describe('AuthorizationError', () => {

    it('should have a default message', () => {
      const err = new AuthorizationError();

      expect(err).to.have.property('message', 'Unauthorized');
      expect(err).to.have.property('status', 401);
      expect(err.toJSON()).to.deep.eql({ error: 'Unauthorized' });

      expect(new AuthorizationError('message')).have.property('message', 'message');
    });

    it('should set the default error message and status', () => {
      AuthorizationError.message = 'UNAUTHORIZED';

      const err = new AuthorizationError();

      expect(err).to.have.property('message', 'UNAUTHORIZED');
      expect(err.toJSON()).to.deep.eql({ error: 'UNAUTHORIZED' });
    });

  });

  describe('ValidationError', () => {

    it('should have a default message', () => {
      const err = new ValidationError();

      expect(err).to.have.property('message', 'Invalid');
      expect(err.toJSON()).to.deep.eql('Invalid');

      expect(new ValidationError('message')).have.property('message', 'message');
    });

    it('should store the field name', () => {
      const err = new ValidationError(null, 'field');

      expect(err).have.property('field', 'field');
      expect(err.toJSON()).deep.eql({ field: 'Invalid' });
    });

    it('should set the default error message', () => {
      ValidationError.message = 'INVALID';

      const err = new ValidationError();

      expect(err).to.have.property('message', 'INVALID');
      expect(err.toJSON()).to.deep.eql('INVALID');

      expect(new ValidationError(null, 'field').toJSON()).to.deep.eql({ field: 'INVALID' });
    });

  });

  describe('ValidationErrors', () => {

    it('should create an empty ValidationErrors', () => {
      const err = new ValidationErrors([]);

      expect(err).to.have.property('message', 'ValidationErrors: 0 error\n');
      expect(err).to.have.property('errors').that.has.lengthOf(0);
      expect(err.toJSON()).to.deep.eql({});
    });

    it('should create a ValidationErrors', () => {
      const err = new ValidationErrors([
        new ValidationError('err1', 'field1'),
        new ValidationError('err2', 'field2'),
      ]);

      expect(err).to.have.property('message').that.matches(/^ValidationErrors: 2 errors/);
      expect(err).to.have.property('errors').that.has.lengthOf(2);
      expect(err.toJSON()).to.deep.eql({ field1: 'err1', field2: 'err2' });
    });

    it('should create a ValidationErrors with nested errors', () => {
      const err = new ValidationErrors([
        new ValidationError('err1', 'field1'),
        new ValidationErrors([
          new ValidationError('err2', 'field3'),
        ], 'field2'),
      ]);

      expect(err).to.have.property('message').that.matches(/^ValidationErrors: 2 errors/);
      expect(err).to.have.property('errors').that.has.lengthOf(2);
      expect(err.toJSON()).to.deep.eql({ field1: 'err1', 'field2.field3': 'err2' });
    });

  });

  describe('MissingValueError', () => {

    it('should have a default message', () => {
      const err = new MissingValueError();

      expect(err).to.have.property('message', 'Missing value');
      expect(err.toJSON()).to.deep.eql('Missing value');

      expect(new MissingValueError('message')).have.property('message', 'message');
    });

    it('should set the default error message', () => {
      MissingValueError.message = 'MISSING_VALUE';

      const err = new MissingValueError();

      expect(err).to.have.property('message', 'MISSING_VALUE');
      expect(err.toJSON()).to.deep.eql('MISSING_VALUE');

      expect(new MissingValueError(null, 'field').toJSON()).to.deep.eql({ field: 'MISSING_VALUE' });
    });

  });

  describe('ReadOnlyValueError', () => {

    it('should have a default message', () => {
      const err = new ReadOnlyValueError();

      expect(err).to.have.property('message', 'Read only value');
      expect(err.toJSON()).to.deep.eql('Read only value');

      expect(new ReadOnlyValueError('message')).have.property('message', 'message');
    });

    it('should set the default error message', () => {
      ReadOnlyValueError.message = 'READ_ONLY_VALUE';

      const err = new ReadOnlyValueError();

      expect(err).to.have.property('message', 'READ_ONLY_VALUE');
      expect(err.toJSON()).to.deep.eql('READ_ONLY_VALUE');

      expect(new ReadOnlyValueError(null, 'field').toJSON()).to.deep.eql({ field: 'READ_ONLY_VALUE' });
    });

  });

  describe('InvalidValueTypeError', () => {

    it('should have a default message', () => {
      const err = new InvalidValueTypeError();

      expect(err).to.have.property('message', 'Invalid value type');
      expect(err.toJSON()).to.deep.eql('Invalid value type');

      expect(new InvalidValueTypeError(null, 'message')).have.property('message', 'message');
    });

    it('should set the default error message', () => {
      InvalidValueTypeError.message = 'INVALID_VALUE_TYPE';

      const err = new InvalidValueTypeError();

      expect(err).to.have.property('message', 'INVALID_VALUE_TYPE');
      expect(err.toJSON()).to.deep.eql('INVALID_VALUE_TYPE');

      expect(new InvalidValueTypeError('type')).to.have.property('type', 'type');
      expect(new InvalidValueTypeError(null, null, 'field').toJSON()).to.deep.eql({ field: 'INVALID_VALUE_TYPE' });
    });

  });

});
