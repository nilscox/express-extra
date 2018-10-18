const expect = require('./expect');
const { validator, validate, errors } = require('../index');

const { ValidationError, ValidationErrors, InvalidFieldTypeError, MissingFieldError } = errors;

describe('validator', () => {

  describe('without validate', () => {

    it('should validate an object with a validation function', async () => {
      const itemValidator = validator({
        count: (value, opts) => {
          expect(opts).to.deep.eql({ many: false, partial: false });

          if (value < 0)
            throw new ValidationError('this field must be positive');

          return value + 1;
        },
      });

      expect(await itemValidator({ count: 5 })).to.deep.eql({ count: 6 });
      await expect(itemValidator({ count: -5 })).to.be.rejectedWith(/must be positive/);
    });

    it('should validate an object with a multiple fields', async () => {
      const itemValidator = validator({
        a: v => v,
        b: v => v,
      });

      expect(await itemValidator({ a: 5, b: 'foo' })).to.deep.eql({ a: 5, b: 'foo' });
      expect(await itemValidator({ a: 5 })).to.deep.eql({ a: 5, b: undefined });
    });

    it('should validate an object with a multiple invalid fields', async () => {
      const itemValidator = validator({
        a: v => { throw new ValidationError('a is invalid'); },
        b: v => { throw new ValidationError('b is invalid'); },
      });

      await expect(itemValidator({ a: 5, b: 'foo' })).to.be.rejectedWith(/a is invalid\n.*b is invalid/);
    });

    it('should validate an object with an extra field', async () => {
      const itemValidator = validator({
        a: v => v,
      });

      expect(await itemValidator({ a: 5, b: 'foo' })).to.eql({ a: 5 });
    });

  });

  describe('with validate', () => {

    const itemValidator = validator({
      foo: validate({
        type: 'string',
      }),
      bar: validate({
        type: 'number',
        required: true,
      }),
      baz: validate({
        type: 'boolean',
        allowNull: true,
      }),
      qux: validate({
        type: 'number',
        many: true,
        required: true,
      }),
    }, 'Item');

    it('should validate an single object using validate', async () => {

      expect(await itemValidator({ foo: 'foo', bar: 42, baz: true, qux: [1, 2, 3] })).to.deep.eql({ foo: 'foo', bar: 42, baz: true, qux: [1, 2, 3] });
      expect(await itemValidator({ bar: 42, qux: [1, 2, 3] })).to.deep.eql({ foo: undefined, bar: 42, baz: true, baz: undefined, qux: [1, 2, 3] });
      expect(await itemValidator({ foo: 'foo', bar: 42, baz: null, qux: [] })).to.deep.eql({ foo: 'foo', bar: 42, baz: null, qux: [] });
      
      await expect(itemValidator('salut')).to.be.rejectedWith(InvalidFieldTypeError)
        .then(e => {
          expect(e).to.have.property('field', undefined);
          expect(e).to.have.property('type', 'Item');
        });
      
      await expect(itemValidator({ foo: null, bar: 42, baz: true, qux: [1, 2, 3] })).to.be.rejectedWith(ValidationErrors)
        .then(e => {
          expect(e.errors).to.have.lengthOf(1);
          expect(e.errors[0]).to.be.an.instanceof(InvalidFieldTypeError);
          expect(e.errors[0]).to.have.property('field', 'foo');
          expect(e.errors[0]).to.have.property('type', 'string');
        });

      await expect(itemValidator({ foo: 'foo', bar: 42, baz: true })).to.be.rejectedWith(ValidationErrors)
        .then(e => {
          expect(e.errors).to.have.lengthOf(1);
          expect(e.errors[0]).to.be.an.instanceof(MissingFieldError);
          expect(e.errors[0]).to.have.property('field', 'qux');
        });

      await expect(itemValidator({ foo: null, baz: null, qux: [1, 'quarante-deux'] })).to.be.rejectedWith(ValidationErrors)
        .then(e => {
          expect(e.errors).to.have.lengthOf(3);

          expect(e.errors[0]).to.be.an.instanceof(InvalidFieldTypeError);
          expect(e.errors[0]).to.have.property('field', 'foo');
          expect(e.errors[0]).to.have.property('type', 'string');

          expect(e.errors[1]).to.be.an.instanceof(MissingFieldError);
          expect(e.errors[1]).to.have.property('field', 'bar');

          expect(e.errors[2]).to.be.an.instanceof(ValidationErrors);
          expect(e.errors[2].errors).to.have.lengthOf(1);
          expect(e.errors[2].errors[0]).to.be.an.instanceof(InvalidFieldTypeError);
          expect(e.errors[2].errors[0]).to.have.property('field', '[1]');
          expect(e.errors[2].errors[0]).to.have.property('type', 'number');
        });
    });

    it('should validate multiple objects using validate', async () => {      
      expect(await itemValidator([
        { foo: 'foo', bar: 42, baz: null, qux: [] },
        { bar: 69, baz: false, qux: [0, 0] },
      ], { many: true })).to.deep.eql([
        { foo: 'foo', bar: 42, baz: null, qux: [] },
        { foo: undefined, bar: 69, baz: false, qux: [0, 0] },
      ]);

      await expect(itemValidator('salut', { many: true })).to.be.rejectedWith(InvalidFieldTypeError)
        .then(e => {
          expect(e).to.have.property('field', undefined);
          expect(e).to.have.property('type', 'Array<Item>');
        });

      await expect(itemValidator([
        { foo: 'foo', baz: null, qux: false },
        { bar: 69, baz: false, qux: [5, null, 5] },
      ], { many: true })).to.be.rejectedWith(ValidationErrors)
        .then(e => {
          expect(e.errors).to.have.lengthOf(2);

          expect(e.errors[0]).to.be.an.instanceof(ValidationErrors);
          expect(e.errors[0]).to.have.property('field', '[0]');
          expect(e.errors[0].errors).to.have.lengthOf(2);

          expect(e.errors[0].errors[0]).to.be.an.instanceof(MissingFieldError);
          expect(e.errors[0].errors[0]).to.have.property('field', 'bar');

          expect(e.errors[0].errors[1]).to.be.an.instanceof(InvalidFieldTypeError);
          expect(e.errors[0].errors[1]).to.have.property('field', 'qux');
          expect(e.errors[0].errors[1]).to.have.property('type', 'Array<number>');

          expect(e.errors[1]).to.be.an.instanceof(ValidationErrors);
          expect(e.errors[1]).to.have.property('field', '[1]');
          expect(e.errors[1].errors).to.have.lengthOf(1);

          expect(e.errors[1].errors[0]).to.be.an.instanceof(ValidationErrors);
          expect(e.errors[1].errors[0]).to.have.property('field', 'qux');
          expect(e.errors[1].errors[0].errors).to.have.lengthOf(1);

          expect(e.errors[1].errors[0].errors[0]).to.have.property('field', '[1]');
          expect(e.errors[1].errors[0].errors[0]).to.have.property('type', 'number');
        });
    });

    it('should validate an object using nested validators', async () => {
      const thingValidator = validator({
        count: validate({
          type: 'number',
          required: true,
        }),
        item: validate({
          validate: itemValidator,
        }),
      });

      expect(await thingValidator({ count: 1, item: { bar: 2, qux: [3] } })).to.deep.eql({ count: 1, item: { foo: undefined, bar: 2, baz: undefined, qux: [3] } });

      expect(await thingValidator([
        { count: 1, item: { bar: 2, qux: [3] } },
        { count: -1 },
        { count: 6, item: { foo: 'yellow', bar: 2, baz: null, qux: [6, 6, 6] } },
      ], { many: true })).to.deep.eql([
        { count: 1, item: { foo: undefined, bar: 2, baz: undefined, qux: [3] } },
        { count: -1, item: undefined },
        { count: 6, item: { foo: 'yellow', bar: 2, baz: null, qux: [6, 6, 6] } },
      ]);

      await expect(thingValidator({})).to.be.rejectedWith(ValidationErrors)
        .then(e => {
          expect(e.errors).to.have.lengthOf(1);
          expect(e.errors[0]).to.be.an.instanceof(MissingFieldError);
          expect(e.errors[0]).to.have.property('field', 'count');
        });

      await expect(thingValidator({ count: 1, item: null })).to.be.rejectedWith(ValidationErrors)
        .then(e => {
          expect(e.errors).to.have.lengthOf(1);
          expect(e.errors[0]).to.be.an.instanceof(InvalidFieldTypeError);
          expect(e.errors[0]).to.have.property('field', 'item');
          expect(e.errors[0]).to.have.property('type', 'Item');
        });

      await expect(thingValidator({ count: 1, item: { foo: NaN, bar: 2, qux: NaN, } })).to.be.rejectedWith(ValidationErrors)
        .then(e => {
          expect(e.errors).to.have.lengthOf(1);
          
          expect(e.errors[0]).to.be.an.instanceof(ValidationErrors);
          expect(e.errors[0].errors).to.have.lengthOf(2);

          expect(e.errors[0].errors[0]).to.be.an.instanceof(InvalidFieldTypeError);
          expect(e.errors[0].errors[0]).to.have.property('field', 'foo');
          expect(e.errors[0].errors[0]).to.have.property('type', 'string');

          expect(e.errors[0].errors[1]).to.be.an.instanceof(InvalidFieldTypeError);
          expect(e.errors[0].errors[1]).to.have.property('field', 'qux');
          expect(e.errors[0].errors[1]).to.have.property('type', 'Array<number>');
        });

      await expect(thingValidator([
        { count: 1, item: { foo: 'hello', baz: null, qux: [3], } },
        { count: 0 },
        { count: 2, item: { bar: 2, qux: [1, 2, [3]] } },
      ], { many: true })).to.be.rejectedWith(ValidationErrors)
        .then(e => {
          expect(e.errors).to.have.lengthOf(2);
          
          expect(e.errors[0]).to.be.an.instanceof(ValidationErrors);
          expect(e.errors[0]).to.have.property('field', '[0]');
          expect(e.errors[0].errors).to.have.lengthOf(1);

          expect(e.errors[0].errors[0]).to.be.an.instanceof(ValidationErrors);
          expect(e.errors[0].errors[0]).to.have.property('field', 'item');
          expect(e.errors[0].errors[0].errors).to.have.lengthOf(1);

          expect(e.errors[0].errors[0].errors[0]).to.be.an.instanceof(MissingFieldError);
          expect(e.errors[0].errors[0].errors[0]).to.have.property('field', 'bar');

          expect(e.errors[1]).to.be.an.instanceof(ValidationErrors);
          expect(e.errors[1]).to.have.property('field', '[2]');
          expect(e.errors[1].errors).to.have.lengthOf(1);

          expect(e.errors[1].errors[0]).to.be.an.instanceof(ValidationErrors);
          expect(e.errors[1].errors[0]).to.have.property('field', 'item');
          expect(e.errors[1].errors[0].errors).to.have.lengthOf(1);

          expect(e.errors[1].errors[0].errors[0]).to.be.an.instanceof(ValidationErrors);
          expect(e.errors[1].errors[0].errors[0]).to.have.property('field', 'qux');
          expect(e.errors[1].errors[0].errors[0].errors).to.have.lengthOf(1);

          expect(e.errors[1].errors[0].errors[0].errors[0]).to.be.an.instanceof(InvalidFieldTypeError);
          expect(e.errors[1].errors[0].errors[0].errors[0]).to.have.property('field', '[2]');
          expect(e.errors[1].errors[0].errors[0].errors[0]).to.have.property('type', 'number');
        });
    });

    it('should validate an object using a recursive validator', async () => {
      const recursiveValidator = validator({
        single: validate({
          allowNull: true,
          validate: () => recursiveValidator,
        }),
        multiple: validate({
          allowNull: true,
          many: true,
          validate: () => recursiveValidator,
        }),
      }, 'Recuuuursion');

      expect(await recursiveValidator({})).to.deep.eql({ single: undefined, multiple: undefined });

      expect(await recursiveValidator({
        single: {
          single: null,
          multiple: [
            { single: null },
            { multiple: null },
            {},
          ],
        },
        multiple: [
          { single: {}, multiple: [] },
        ],
      })).to.deep.eql({
        single: {
          single: null,
          multiple: [
            { single: null, multiple: undefined },
            { single: undefined, multiple: null },
            { single: undefined, multiple: undefined },
          ],
        },
        multiple: [
          {
            single: {
              single: undefined,
              multiple: undefined,
            },
            multiple: [],
          },
        ],
      });

      await expect(recursiveValidator(NaN)).to.be.rejectedWith(InvalidFieldTypeError)
        .then(e => {
          expect(e.type).to.eql('Recuuuursion');
        });

      await expect(recursiveValidator({
        single: null,
        multiple: [
          { single: 42, multiple: false },
          {},
          { single: null, multiple: {} },
        ],
      })).to.be.rejectedWith(ValidationErrors)
        .then(e => {
          expect(e.errors).to.have.lengthOf(1);

          expect(e.errors[0]).to.be.an.instanceof(ValidationErrors);
          expect(e.errors[0]).to.have.property('field', 'multiple');
          expect(e.errors[0].errors).to.have.lengthOf(2);

          expect(e.errors[0].errors[0]).to.be.an.instanceof(ValidationErrors);
          expect(e.errors[0].errors[0]).to.have.property('field', '[0]');
          expect(e.errors[0].errors[0].errors).to.have.lengthOf(2);

          expect(e.errors[0].errors[0].errors[0]).to.be.an.instanceof(InvalidFieldTypeError);
          expect(e.errors[0].errors[0].errors[0]).to.have.property('field', 'single');
          expect(e.errors[0].errors[0].errors[0]).to.have.property('type', 'Recuuuursion');

          expect(e.errors[0].errors[0].errors[1]).to.be.an.instanceof(InvalidFieldTypeError);
          expect(e.errors[0].errors[0].errors[1]).to.have.property('field', 'multiple');
          expect(e.errors[0].errors[0].errors[1]).to.have.property('type', 'Array');

          expect(e.errors[0].errors[1]).to.be.an.instanceof(ValidationErrors);
          expect(e.errors[0].errors[1]).to.have.property('field', '[2]');
          expect(e.errors[0].errors[1].errors).to.have.lengthOf(1);

          expect(e.errors[0].errors[1].errors[0]).to.be.an.instanceof(InvalidFieldTypeError);
          expect(e.errors[0].errors[1].errors[0]).to.have.property('field', 'multiple');
          expect(e.errors[0].errors[1].errors[0]).to.have.property('type', 'Array');
        });
    });

    it('should validate an object using mutually recursive validators', async () => {
      const someValidator = validator({
        foo: validate({ type: 'number' }),
        thing: validate({
          validate: () => thingValidator,
        }),
      });

      const thingValidator = validator({
        bar: validate({ type: 'number' }),
        some: validate({
          validate: () => someValidator,
        }),
      });

      expect(await someValidator({
        foo: 1,
        thing: {
          bar: 2,
          some: {
            foo: 3,
          },
        },
      })).to.eql({
        foo: 1,
        thing: {
          bar: 2,
          some: {
            foo: 3,
            thing: undefined,
          },
        },
      });
    });

    it('should partially validate an object using validate', async () => {
      expect(await itemValidator({}, { partial: true }))
        .to.deep.eql({ foo: undefined, bar: undefined, baz: undefined, qux: undefined });
    });

    it('should forward opts to validation functions', async () => {
      const someValidator = validator({
        count: validate({
          type: 'number',
          validate: (value, opts) => {
            expect(opts).to.deep.eql({ foobar: 42 });
          },
        }),
      });

      expect(await someValidator({ count: 1 }, { foobar: 42 })).to.deep.eql({ count: 1 });
    });

    it('should forward opts to validation functions when using nested validators', async () => {
      const someValidator = validator({
        some: validate({
          type: 'Some',
          validate: validator({
            thing: validate({
              validate: (value, opts) => {
                expect(opts).to.deep.eql({ foobar: 42 });
              },
            }),
          }),
        }),
      });

      expect(await someValidator({ some: { thing: 51 } }, { foobar: 42 })).to.deep.eql({ some: { thing : 51 } });
    });

  });

});
