const expect = require('./expect');
const { validate, errors } = require('../index');

const { ValidationError } = errors;

describe('validate', () => {

  it('should validate a field type', async () => {
    const validateTypeNumber = validate({
      type: 'number',
    });

    expect(await validateTypeNumber(42)).to.eql(42);
    await expect(validateTypeNumber(null)).to.be.rejectedWith(/of type number/);
    await expect(validateTypeNumber('foo')).to.be.rejectedWith(/of type number/);
  });

  it('should validate a field type, allowing null', async () => {
    const validateTypeNumber = validate({
      type: 'number',
      allowNull: true,
    });

    expect(await validateTypeNumber(42)).to.eql(42);
    expect(await validateTypeNumber(null)).to.eql(null);
    await expect(validateTypeNumber('foo')).to.be.rejectedWith(/of type number/);
  });

  it('should validate a required field', async () => {
    const validateRequired = validate({
      required: true,
    });

    expect(await validateRequired(42)).to.eql(42);
    expect(await validateRequired('foo')).to.eql('foo');
    expect(await validateRequired(null)).to.eql(null);
    await expect(validateRequired(undefined)).to.be.rejectedWith(/is required/);
  });

  it('should validate a field with a default value', async () => {
    const validateDefault = validate({
      defaultValue: 321,
    });

    expect(await validateDefault(42)).to.eql(42);
    expect(await validateDefault('foo')).to.eql('foo');
    expect(await validateDefault(null)).to.eql(null);
    expect(await validateDefault(undefined)).to.eql(321);
  });

  it('should validate a required field with a default value', async () => {
    const validateDefault = validate({
      required: true,
      defaultValue: 321,
    });

    expect(await validateDefault(undefined)).to.eql(321);
  });

  it('should validate a required field with a default value of an incorrect type', async () => {
    const validateDefault = validate({
      type: 'number',
      required: true,
      defaultValue: 'coucou',
    });

    await expect(validateDefault(undefined)).to.be.rejectedWith(/of type number/);
  });

  it('should validate a field through a validation function', async () => {
    const validateFunc = validate({
      type: 'number',
      validate: (value, opts) => {
        expect(opts).to.deep.eql({ partial: false });

        if (value < 0)
          throw new ValidationError('this field must be positive');
      },
    });

    expect(await validateFunc(42)).to.eql(42);
    await expect(validateFunc(-69)).to.be.rejectedWith(/must be positive/);
  });

  it('should validate a field through a validation function returning a value', async () => {
    const validateFunc = validate({
      type: 'number',
      validate: value => value + 1,
    });

    expect(await validateFunc(42)).to.eql(43);
  });

  it('should validate a field through multiple validation functions', async () => {
    const validateFunc = validate({
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

    expect(await validateFunc(42)).to.eql(42);
    await expect(validateFunc(-69)).to.be.rejectedWith(/must be positive/);
    await expect(validateFunc(123)).to.be.rejectedWith(/must be < 100/);
  });

  it('should validate a field through multiple validation functions returning values', async () => {
    const validateFunc = validate({
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

    expect(await validateFunc(4)).to.eql(10);
    await expect(validateFunc(666)).to.be.rejectedWith(/must be < 100/);
  });

  it('should validate a field through a validation function returning a validation function', async () => {
    const validateFunc = validate({
      type: 'number',
      validate: a => b => c => a + b + c,
    });

    expect(await validateFunc(4)).to.eql(12);
  });

  it('should validate a field through multiple validation functions returning validation functions', async () => {
    const validateFunc = validate({
      type: 'number',
      validate: [
        a => b => a + b,
        c => c + 1,
        d => e => d * 2 + e,
      ],
    });

    expect(await validateFunc(4)).to.eql(27);
  });

  it('should validate an array', async () => {
    const validateArray = validate({
      many: true,
    });

    expect(await validateArray([])).to.eql([]);
    expect(await validateArray([1, 2, 3])).to.eql([1, 2, 3]);
    expect(await validateArray(['foo', 'bar'])).to.eql(['foo', 'bar']);
    await expect(validateArray(null)).to.be.rejectedWith(/of type Array/);
  });

  it('should validate an array, allowing null', async () => {
    const validateArray = validate({
      many: true,
      allowNull: true,
    });

    expect(await validateArray([])).to.eql([]);
    expect(await validateArray([1, 2, 3])).to.eql([1, 2, 3]);
    expect(await validateArray(['foo', 'bar'])).to.eql(['foo', 'bar']);
    expect(await validateArray(null)).to.eql(null);
  });

  it('should validate an array of numbers', async () => {
    const validateArrayNumber = validate({
      type: 'number',
      many: true,
    });

    expect(await validateArrayNumber([])).to.eql([]);
    expect(await validateArrayNumber([1, 2, 3])).to.eql([1, 2, 3]);
    await expect(validateArrayNumber(null)).to.be.rejectedWith(/of type Array<number>/);
    await expect(validateArrayNumber('foo')).to.be.rejectedWith(/of type Array<number>/);
    await expect(validateArrayNumber([1, 'foo', 3])).to.be.rejectedWith(/\[1\] => .* of type number/);
  });

  it('should validate an array of numbers, allowing null', async () => {
    const validateArrayNumber = validate({
      type: 'number',
      many: true,
      allowNull: true,
    });

    expect(await validateArrayNumber([])).to.eql([]);
    expect(await validateArrayNumber([1, 2, 3])).to.eql([1, 2, 3]);
    expect(await validateArrayNumber(null)).to.eql(null);
    await expect(validateArrayNumber('foo')).to.be.rejectedWith(/of type Array<number>/);
    await expect(validateArrayNumber([1, 'foo', 3])).to.be.rejectedWith(/\[1\] => .* of type number/);
  });

  it('should forward opts to a validation function', async () => {
    const validateFunc = validate({
      validate: (value, opts) => {
        expect(opts.foo).to.eql(42);
      },
    });

    await validateFunc(null, { foo: 42 });
  });

  it('should partially validate a required field', async () => {
    const validateRequire = validate({
      required: true,
    });

    expect(await validateRequire(undefined, { partial: true })).to.eql(undefined);
  });

});
