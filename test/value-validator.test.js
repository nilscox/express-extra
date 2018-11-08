const expect = require('./expect');
const {
  ValueValidator,
  ValidationError,
  ValidationErrors,
  MissingValueError,
  ReadOnlyValueError,
  InvalidValueTypeError,
} = require('../index');

describe('ValueValidator', () => {

  it('should validate a field type', async () => {
    const validateTypeNumber = ValueValidator({
      type: 'number',
    });

    await expect(validateTypeNumber(42)).to.eventually.eql(42);
    await expect(validateTypeNumber(null)).to.be.rejectedWith(InvalidValueTypeError);
    await expect(validateTypeNumber('foo')).to.be.rejectedWith(InvalidValueTypeError);
  });

  it('should validate a field type, allowing null', async () => {
    const validateTypeNumber = ValueValidator({
      type: 'number',
      allowNull: true,
    });

    await expect(validateTypeNumber(42)).to.eventually.eql(42);
    await expect(validateTypeNumber(null)).to.eventually.eql(null);
    await expect(validateTypeNumber('foo')).to.be.rejectedWith(InvalidValueTypeError);
  });

  it('should validate a required field', async () => {
    const validateRequired = ValueValidator({
      required: true,
    });

    await expect(validateRequired(42)).to.eventually.eql(42);
    await expect(validateRequired('foo')).to.eventually.eql('foo');
    await expect(validateRequired(null)).to.eventually.eql(null);
    await expect(validateRequired(undefined)).to.be.rejectedWith(MissingValueError);
  });

  it('should validate a field with a default value', async () => {
    const validateDefault = ValueValidator({
      defaultValue: 321,
    });

    await expect(validateDefault(42)).to.eventually.eql(42);
    await expect(validateDefault('foo')).to.eventually.eql('foo');
    await expect(validateDefault(null)).to.eventually.eql(null);
    await expect(validateDefault(undefined)).to.eventually.eql(321);
  });

  it('should validate a required field with a default value', async () => {
    const validateDefault = ValueValidator({
      required: true,
      defaultValue: 321,
    });

    await expect(validateDefault(undefined)).to.eventually.eql(321);
  });

  it('should validate a required field with a default value of an incorrect type', async () => {
    const validateDefault = ValueValidator({
      type: 'number',
      required: true,
      defaultValue: 'coucou',
    });

    await expect(validateDefault(undefined)).to.be.rejectedWith(InvalidValueTypeError);
  });

  it('should validate a readOnly field', async () => {
    const validateDefault = ValueValidator({
      readOnly: true,
    });

    await expect(validateDefault(42)).to.be.rejectedWith(ReadOnlyValueError);
    await expect(validateDefault(undefined)).to.eventually.be.undefined;
  });

  it('should validate a field through a validation function', async () => {
    const validateFunc = ValueValidator({
      type: 'number',
      validate: (value, opts) => {
        expect(opts).to.deep.eql({});

        if (value < 0)
          throw new ValidationError('this field must be positive');
      },
    });

    await expect(validateFunc(42)).to.eventually.eql(42);
    await expect(validateFunc(-69)).to.be.rejectedWith(/must be positive/);
  });

  it('should validate a field through a validation function returning a value', async () => {
    const validateFunc = ValueValidator({
      type: 'number',
      validate: value => value + 1,
    });

    await expect(validateFunc(42)).to.eventually.eql(43);
  });

  it('should validate a field through a validation function returning a validation function', async () => {
    const validateFunc = ValueValidator({
      type: 'number',
      validate: a => b => c => a + b + c,
    });

    await expect(validateFunc(4)).to.eventually.eql(12);
  });

it('should validate a field through multiple validation functions', async () => {
    const validateFunc = ValueValidator({
      type: 'number',
      validate: [
        value => {
          if (value < 0)
            throw new ValidationError('this field must be positive');
        },
        value => {
          if (value > 100)
            throw new ValidationError('this field must be < 100');
        },
      ],
    });

    await expect(validateFunc(42)).to.eventually.eql(42);
    await expect(validateFunc(-69)).to.be.rejectedWith(/must be positive/);
    await expect(validateFunc(123)).to.be.rejectedWith(/must be < 100/);
  });

  it('should validate a field through multiple validation functions returning values', async () => {
    const validateFunc = ValueValidator({
      type: 'number',
      validate: [
        value => value + 1,
        value => {
          if (value > 100)
            throw new ValidationError('this field must be < 100');
        },
        value => value * 2,
      ],
    });

    await expect(validateFunc(4)).to.eventually.eql(10);
    await expect(validateFunc(666)).to.be.rejectedWith(/must be < 100/);
  });

  it('should validate a field through multiple validation functions returning validation functions', async () => {
    const validateFunc = ValueValidator({
      type: 'number',
      validate: [
        a => b => a + b,
        c => c + 1,
        d => e => d * 2 + e,
      ],
    });

    await expect(validateFunc(4)).to.eventually.eql(27);
  });

  it('should validate an array', async () => {
    const validateArray = ValueValidator({
      many: true,
    });

    await expect(validateArray([])).to.eventually.eql([]);
    await expect(validateArray([1, 2, 3])).to.eventually.eql([1, 2, 3]);
    await expect(validateArray(['foo', 'bar'])).to.eventually.eql(['foo', 'bar']);
    await expect(validateArray(null)).to.be.rejectedWith(InvalidValueTypeError);
  });

  it('should validate an array, allowing null', async () => {
    const validateArray = ValueValidator({
      many: true,
      allowNull: true,
    });

    await expect(validateArray([])).to.eventually.eql([]);
    await expect(validateArray([1, 2, 3])).to.eventually.eql([1, 2, 3]);
    await expect(validateArray(['foo', 'bar'])).to.eventually.eql(['foo', 'bar']);
    await expect(validateArray(null)).to.eventually.eql(null);
  });

  it('should validate an array of numbers', async () => {
    const validateArrayNumber = ValueValidator({
      type: 'number',
      many: true,
    });

    await expect(validateArrayNumber([])).to.eventually.eql([]);
    await expect(validateArrayNumber([1, 2, 3])).to.eventually.eql([1, 2, 3]);
    await expect(validateArrayNumber(null)).to.be.rejectedWith(InvalidValueTypeError).then(e => expect(e.type).to.eql('Array<number>'));
    await expect(validateArrayNumber('foo')).to.be.rejectedWith(InvalidValueTypeError).then(e => expect(e.type).to.eql('Array<number>'));
    await expect(validateArrayNumber([1, 'foo', 3])).to.be.rejectedWith(ValidationErrors).then(e => expect(e.errors[0].type).to.eql('number'));
  });

  it('should validate an array of numbers, allowing null', async () => {
    const validateArrayNumber = ValueValidator({
      type: 'number',
      many: true,
      allowNull: true,
    });

    await expect(validateArrayNumber([])).to.eventually.eql([]);
    await expect(validateArrayNumber([1, 2, 3])).to.eventually.eql([1, 2, 3]);
    await expect(validateArrayNumber(null)).to.eventually.eql(null);
    await expect(validateArrayNumber('foo')).to.be.rejectedWith(InvalidValueTypeError);
    await expect(validateArrayNumber([1, 'foo', 3])).to.be.rejectedWith(ValidationErrors);
  });

  it('should forward the options to a validation function', async () => {
    const validateFunc = ValueValidator({
      validate: (value, opts) => {
        expect(opts.foo).to.eql(42);
      },
    });

    await validateFunc(null, { foo: 42 });
  });

  it('should override field specs with the options', async () => {
    const validateRequire = ValueValidator({
      type: 'number',
      required: true,
    });

    await expect(validateRequire(undefined, { required: false })).to.eventually.eql(undefined);
    await expect(validateRequire([1, 2, 3], { many: true })).to.be.eventually.eql([1, 2, 3]);
    await expect(validateRequire(null, { allowNull: true })).to.be.eventually.eql(null);
    await expect(validateRequire(1234, { readOnly: true })).to.be.rejectedWith(ReadOnlyValueError);
    await expect(validateRequire(undefined, { defaultValue: 42 })).to.be.eventually.eql(42);
  });

});
