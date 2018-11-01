const expect = require('./expect');
const { ValueValidator, ValidationError } = require('../index');

describe('ValueValidator', () => {

  it('should validate a field type', async () => {
    const validateTypeNumber = ValueValidator({
      type: 'number',
    });

    expect(await validateTypeNumber(42)).to.eql(42);
    await expect(validateTypeNumber(null)).to.be.rejectedWith(/of type number/);
    await expect(validateTypeNumber('foo')).to.be.rejectedWith(/of type number/);
  });

  it('should validate a field type, allowing null', async () => {
    const validateTypeNumber = ValueValidator({
      type: 'number',
      allowNull: true,
    });

    expect(await validateTypeNumber(42)).to.eql(42);
    expect(await validateTypeNumber(null)).to.eql(null);
    await expect(validateTypeNumber('foo')).to.be.rejectedWith(/of type number/);
  });

  it('should validate a required field', async () => {
    const validateRequired = ValueValidator({
      required: true,
    });

    expect(await validateRequired(42)).to.eql(42);
    expect(await validateRequired('foo')).to.eql('foo');
    expect(await validateRequired(null)).to.eql(null);
    await expect(validateRequired(undefined)).to.be.rejectedWith(/is required/);
  });

  it('should validate a field with a default value', async () => {
    const validateDefault = ValueValidator({
      defaultValue: 321,
    });

    expect(await validateDefault(42)).to.eql(42);
    expect(await validateDefault('foo')).to.eql('foo');
    expect(await validateDefault(null)).to.eql(null);
    expect(await validateDefault(undefined)).to.eql(321);
  });

  it('should validate a required field with a default value', async () => {
    const validateDefault = ValueValidator({
      required: true,
      defaultValue: 321,
    });

    expect(await validateDefault(undefined)).to.eql(321);
  });

  it('should validate a required field with a default value of an incorrect type', async () => {
    const validateDefault = ValueValidator({
      type: 'number',
      required: true,
      defaultValue: 'coucou',
    });

    await expect(validateDefault(undefined)).to.be.rejectedWith(/of type number/);
  });

  it('should validate a readOnly field', async () => {
    const validateDefault = ValueValidator({
      readOnly: true,
    });

    await expect(validateDefault(42)).to.be.rejectedWith(/read only/);
    expect(await validateDefault(undefined)).to.be.undefined;
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

    expect(await validateFunc(42)).to.eql(42);
    await expect(validateFunc(-69)).to.be.rejectedWith(/must be positive/);
  });

  it('should validate a field through a validation function returning a value', async () => {
    const validateFunc = ValueValidator({
      type: 'number',
      validate: value => value + 1,
    });

    expect(await validateFunc(42)).to.eql(43);
  });

  it('should validate a field through a validation function returning a validation function', async () => {
    const validateFunc = ValueValidator({
      type: 'number',
      validate: a => b => c => a + b + c,
    });

    expect(await validateFunc(4)).to.eql(12);
  });

  it('should validate an array', async () => {
    const validateArray = ValueValidator({
      many: true,
    });

    expect(await validateArray([])).to.eql([]);
    expect(await validateArray([1, 2, 3])).to.eql([1, 2, 3]);
    expect(await validateArray(['foo', 'bar'])).to.eql(['foo', 'bar']);
    await expect(validateArray(null)).to.be.rejectedWith(/of type Array/);
  });

  it('should validate an array, allowing null', async () => {
    const validateArray = ValueValidator({
      many: true,
      allowNull: true,
    });

    expect(await validateArray([])).to.eql([]);
    expect(await validateArray([1, 2, 3])).to.eql([1, 2, 3]);
    expect(await validateArray(['foo', 'bar'])).to.eql(['foo', 'bar']);
    expect(await validateArray(null)).to.eql(null);
  });

  it('should validate an array of numbers', async () => {
    const validateArrayNumber = ValueValidator({
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
    const validateArrayNumber = ValueValidator({
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

  it('should forward the options to a validation function', async () => {
    const validateFunc = ValueValidator({
      validate: (value, opts) => {
        expect(opts.foo).to.eql(42);
      },
    });

    await validateFunc(null, { foo: 42 });
  });

  it.skip('should partially validate a required field', async () => {
    const validateRequire = ValueValidator({
      required: true,
    });

    expect(await validateRequire(undefined, { partial: true })).to.eql(undefined);
  });

  it('should override field specs with the options', async () => {
    const validateRequire = ValueValidator({
      required: true,
    });

    expect(await validateRequire(undefined, { required: false })).to.eql(undefined);
    await expect(validateRequire(null, { many: true })).to.be.rejectedWith(/of type Array/);
  });

});
