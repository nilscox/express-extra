const expect = require('./expect');
const { Validator, ValueValidator, ValidationError, ValidationErrors, InvalidValueTypeError, MissingValueError } = require('../index');

const expectError = expected => e => {
  if (expected instanceof Array) {
    expect(e).to.be.an.instanceof(ValidationErrors);

    if (typeof expected[0] === 'string') {
      expect(e).to.have.property('field', expected[0]);
      expected.shift();
    }

    expect(e.errors).to.have.lengthOf(expected.length);
    expected.map(expectError).forEach((f, n) => f(e.errors[n]));
  } else {
    if (expected.type)
      expect(e).to.be.an.instanceof(expected.type);

    if (expected.field)
      expect(e).to.have.property('field', expected.field);

    if (expected.message)
      expect(e).to.have.property('message', expected.message);

    if (expected.ftype)
      expect(e).to.have.property('type', expected.ftype);
  }
}

describe('Validator', () => {

  describe('without ValueValidator', () => {

    it('should validate an object with a validation function', async () => {
      const itemValidator = Validator({
        count: (value, opts) => {
          expect(opts).to.deep.eql({});

          if (value < 0)
            throw new ValidationError('this field must be positive');

          return value + 1;
        },
      });

      await expect(itemValidator({ count: 5 })).to.eventually.deep.eql({ count: 6 });
      await expect(itemValidator({ count: -5 })).to.be.rejected
        .then(expectError([{ field: 'count', message: 'this field must be positive' }]));
    });

    it('should validate an object with multiple fields', async () => {
      const itemValidator = Validator({
        a: v => v,
        b: v => v,
      });

      await expect(itemValidator({ a: 5, b: 'foo' })).to.eventually.deep.eql({ a: 5, b: 'foo' });
      await expect(itemValidator({ a: 5 })).to.eventually.deep.eql({ a: 5, b: undefined });
    });

    it('should validate an object with multiple invalid fields', async () => {
      const itemValidator = Validator({
        a: v => { throw new ValidationError('a is invalid'); },
        b: v => { throw new ValidationError('b is invalid'); },
      });

      await expect(itemValidator({ a: 5, b: 'foo' })).to.be.rejected
        .then(expectError([
          { field: 'a', message: 'a is invalid' },
          { field: 'b', message: 'b is invalid' },
        ]));
    });

    it('should validate an object with an extra field', async () => {
      const itemValidator = Validator({
        a: v => v,
      });

      await expect(itemValidator({ a: 5, b: 'foo' })).to.eventually.deep.eql({ a: 5 });
    });

    it('should validate multiple objects', async () => {
      const itemValidator = Validator({
        a: v => v,
      });

      await expect(itemValidator.many([{ a: 5 }, { a: 8 }])).to.eventually.deep.eql([{ a: 5 }, { a: 8 }]);
    });

    it('should forward options to field validators', async () => {
      const itemValidator = Validator({
        a: (value, opts) => {
          expect(opts).to.deep.eql({ foo: 'bar' });
          return value;
        },
      });

      await expect(itemValidator({ a: 42 }, { a: { foo: 'bar' } })).to.eventually.deep.eql({ a: 42 });
    });

    it('should skip a field validator if the option is set to false', async () => {
      const itemValidator = Validator({
        a: () => { throw new ValidationError('a is invalid') },
      });

      await expect(itemValidator({ a: 42 }, { a: false })).to.eventually.deep.eql({});
    });

  });

  describe('with ValueValidator', () => {

    const itemValidator = Validator({
      foo: ValueValidator({
        type: 'string',
      }),
      bar: ValueValidator({
        type: 'number',
        required: true,
      }),
      baz: ValueValidator({
        type: 'boolean',
        allowNull: true,
      }),
      qux: ValueValidator({
        type: 'number',
        many: true,
        required: true,
      }),
    });

    it('should validate an single object using ValueValidator', async () => {

      await expect(itemValidator({ foo: 'foo', bar: 42, baz: true, qux: [1, 2, 3] })).to.eventually.deep.eql({ foo: 'foo', bar: 42, baz: true, qux: [1, 2, 3] });
      await expect(itemValidator({ bar: 42, qux: [1, 2, 3] })).to.eventually.deep.eql({ foo: undefined, bar: 42, baz: true, baz: undefined, qux: [1, 2, 3] });
      await expect(itemValidator({ foo: 'foo', bar: 42, baz: null, qux: [] })).to.eventually.deep.eql({ foo: 'foo', bar: 42, baz: null, qux: [] });
      
      await expect(itemValidator('salut')).to.be.rejected
        .then(expectError({ field: undefined, ftype: 'Object' }));
      
      await expect(itemValidator({ foo: null, bar: 42, baz: true, qux: [1, 2, 3] })).to.be.rejected
        .then(expectError([
          { type: InvalidValueTypeError, field: 'foo', ftype: 'string' },
        ]));

      await expect(itemValidator({ foo: 'foo', bar: 42, baz: true })).to.be.rejected
        .then(expectError([
          { type: MissingValueError, field: 'qux' },
        ]));

      await expect(itemValidator({ foo: null, baz: null, qux: [1, 'quarante-deux'] })).to.be.rejected
        .then(expectError([
          { type: InvalidValueTypeError, field: 'foo', ftype: 'string' },
          { type: MissingValueError, field: 'bar' },
          [
            { type: InvalidValueTypeError, field: '[1]', ftype: 'number' },
          ],
        ]));
    });

    it('should validate multiple objects using ValueValidator', async () => {      
      await expect(itemValidator.many([
        { foo: 'foo', bar: 42, baz: null, qux: [] },
        { bar: 69, baz: false, qux: [0, 0] },
      ])).to.eventually.deep.eql([
        { foo: 'foo', bar: 42, baz: null, qux: [] },
        { foo: undefined, bar: 69, baz: false, qux: [0, 0] },
      ]);

      await expect(itemValidator.many('salut')).to.be.rejected
        .then(expectError({ type: InvalidValueTypeError, ftype: 'Array' }));

      await expect(itemValidator.many([
        { foo: 'foo', baz: null, qux: false },
        { bar: 69, baz: false, qux: [5, null, 5] },
      ])).to.be.rejected
        .then(expectError([
          [
            '[0]',
            { type: MissingValueError, field: 'bar' },
            { type: InvalidValueTypeError, field: 'qux', ftype: 'Array<number>' },
          ],
          [
            '[1]',
            [
              'qux',
              { type: InvalidValueTypeError, field: '[1]', ftype: 'number' },
            ],
          ],
        ]));
    });

    it('should validate an object using nested validators', async () => {
      const thingValidator = Validator({
        count: ValueValidator({
          type: 'number',
          required: true,
        }),
        item: ValueValidator({
          validate: itemValidator,
        }),
      });

      await expect(thingValidator({ count: 1, item: { bar: 2, qux: [3] } })).to.eventually.deep.eql({ count: 1, item: { foo: undefined, bar: 2, baz: undefined, qux: [3] } });

      await expect(thingValidator.many([
        { count: 1, item: { bar: 2, qux: [3] } },
        { count: -1 },
        { count: 6, item: { foo: 'yellow', bar: 2, baz: null, qux: [6, 6, 6] } },
      ])).to.eventually.deep.eql([
        { count: 1, item: { foo: undefined, bar: 2, baz: undefined, qux: [3] } },
        { count: -1, item: undefined },
        { count: 6, item: { foo: 'yellow', bar: 2, baz: null, qux: [6, 6, 6] } },
      ]);

      await expect(thingValidator({})).to.be.rejected
        .then(expectError([
          { type: MissingValueError, field: 'count' },
        ]));

      await expect(thingValidator({ count: 1, item: null })).to.be.rejected
        .then(expectError([
          { type: InvalidValueTypeError, field: 'item', ftype: 'Object' },
        ]));

      await expect(thingValidator({ count: 1, item: { foo: NaN, bar: 2, qux: NaN, } })).to.be.rejected
        .then(expectError([
          [
            'item',
            { type: InvalidValueTypeError, field: 'foo', ftype: 'string' },
            { type: InvalidValueTypeError, field: 'qux', ftype: 'Array<number>' },
          ]
        ]));

      await expect(thingValidator.many([
        { count: 1, item: { foo: 'hello', baz: null, qux: [3], } },
        { count: 0 },
        { count: 2, item: { bar: 2, qux: [1, 2, [3]] } },
      ])).to.be.rejected
        .then(expectError([
          [
            '[0]',
            [
              'item',
              { type: MissingValueError, field: 'bar' },
            ],
          ],
          [
            '[2]',
            [
              'item',
              [
                'qux',
                { type: InvalidValueTypeError, field: '[2]', ftype: 'number' },
              ],
            ],
          ],
        ]));
    });

    it('should set the correct type when using nested validators', async () => {
      const thingValidator = Validator({
        item: ValueValidator({
          type: 'Item',
          validate: itemValidator,
        }),
        items: ValueValidator({
          type: 'Item',
          many: true,
          validate: itemValidator,
        }),
        items2: ValueValidator({
          type: 'Item',
          many: true,
          validate: itemValidator,
        }),
      });

      await expect(thingValidator({ item: true, items: true, items2: [true] })).to.be.rejected
        .then(expectError([
          { type: InvalidValueTypeError, field: 'item', ftype: 'Item' },
          { type: InvalidValueTypeError, field: 'items', ftype: 'Array<Item>' },
          [
            'items2',
            { type: InvalidValueTypeError, field: '[0]', ftype: 'Item' },
          ],
        ]));
    });

    it('should validate an object using a recursive validator', async () => {
      const recursiveValidator = Validator({
        single: ValueValidator({
          allowNull: true,
          validate: () => recursiveValidator,
        }),
        multiple: ValueValidator({
          allowNull: true,
          many: true,
          validate: () => recursiveValidator,
        }),
      });

      await expect(recursiveValidator({})).to.eventually.deep.eql({ single: undefined, multiple: undefined });

      await expect(recursiveValidator({
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
      })).to.eventually.deep.eql({
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

      await expect(recursiveValidator(NaN)).to.be.rejected
        .then(expectError({ type: InvalidValueTypeError, ftype: 'Object' }));

      await expect(recursiveValidator({
        single: null,
        multiple: [
          { single: 42, multiple: false },
          {},
          { single: null, multiple: {} },
        ],
      })).to.be.rejected
        .then(expectError([
          [
            'multiple',
            [
              '[0]',
              { type: InvalidValueTypeError, field: 'single', ftype: 'Object' },
              { type: InvalidValueTypeError, field: 'multiple', ftype: 'Array' },
            ],
            [
              '[2]',
              { type: InvalidValueTypeError, field: 'multiple', ftype: 'Array' },
            ],
          ],
        ]));
    });

    it('should validate an object using mutually recursive validators', async () => {
      const someValidator = Validator({
        foo: ValueValidator({ type: 'number' }),
        thing: ValueValidator({
          validate: () => thingValidator,
        }),
      });

      const thingValidator = Validator({
        bar: ValueValidator({ type: 'number' }),
        some: ValueValidator({
          validate: () => someValidator,
        }),
      });

      await expect(someValidator({
        foo: 1,
        thing: {
          bar: 2,
          some: {
            foo: 3,
          },
        },
      })).to.eventually.eql({
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

    it('should forward opts to validation functions', async () => {
      const someValidator = Validator({
        count: ValueValidator({
          type: 'number',
          validate: (value, opts) => {
            expect(opts).to.deep.eql({ foobar: 42 });
          },
        }),
      });

      await expect(someValidator({ count: 1 }, { count: { foobar: 42 } })).to.eventually.deep.eql({ count: 1 });
    });

    it('should forward opts to validation functions when using nested validators', async () => {
      const someValidator = Validator({
        some: ValueValidator({
          type: 'Some',
          validate: Validator({
            thing: ValueValidator({
              validate: (value, opts) => {
                expect(opts).to.deep.eql({ foobar: 42 });
              },
            }),
          }),
        }),
      });

      await expect(someValidator({ some: { thing: 51 } }, { some: { thing: { foobar: 42 } } })).to.eventually.deep.eql({ some: { thing : 51 } });
    });

  });

  describe.skip('readme examples', () => {

    const carValidatorBrandTank = {
      brand: ValueValidator({
        type: 'string',
        required: true,
        validate: value => {
          if (value === '')
            throw new ValidationError('this field cannot be empty');
        },
      }),
      tank: ValueValidator({
        type: 'number',
        required: false,
        validate: value => {
          if (value < 0)
            throw new ValidationError('this field cannot be negative');

          return Math.round(value);
        },
      }),
    };

    const voyagerValidator = Validator({
      name: ValueValidator({ type: 'string' }),
      age: ValueValidator({ type: 'number' }),
    });

    it('full example', async () => {
      const voyagerValidator = Validator({
        name: ValueValidator({
          type: 'string',
          required: true,
        }),
        age: ValueValidator({
          type: 'number',
          required: false,
          allowNull: true,
          validate: value => {
            if (value <= 0)
              throw new ValidationError('this field cannot be negative');
          },
        }),
      });

      const carValidator = Validator({
        brand: ValueValidator({
          type: 'string',
          required: true,
          validate: value => {
            if (value === '')
              throw new ValidationError('this field cannot be empty');
          },
        }),
        tank: ValueValidator({
          type: 'number',
          required: true,
          validate: (value, opts) => {
            if (value < 0)
              throw new ValidationError('this field cannot be negative');

            if (value > opts.max)
              throw new ValidationError('this field cannot be over ' + opts.max);

            return Math.round(value);
          },
        }),
        driver: voyagerValidator,
        voyagers: ValueValidator({
          many: true,
          defaultValue: [],
          validate: voyagerValidator,
        }),
      });

      const myCar = await carValidator({
        brand: 'ford',
        tank: 43.2,
        speed: 69,
        driver: {
          name: 'Harrison',
          age: 51,
        },
        voyagers: [
          { name: 'Tom' },
          { name: 'Jeanne', age: null },
        ],
      });

      expect(myCar).to.deep.eql({
        brand: 'ford',
        tank: 43,
        driver: {
          name: 'Harrison',
          age: 51,
        },
        voyagers: [
          { name: 'Tom', age: undefined },
          { name: 'Jeanne', age: null },
        ],
      });

      await expect(carValidator({
          brand: NaN,
          tank: 5000,
          driver: { age: -5 },
          voyagers: [
            { name: 'Mano', age: 10 },
            { name: false, age: '10' },
            null,
          ],
        }, { tank: { max: 100 } })).to.be.rejected
        .then(e => {
          expect(e.message).to.eql(`ValidationErrors: 7 errors
  brand => Invalid value type
  tank => this field cannot be over 100
  driver.name => Missing value
  driver.age => this field cannot be negative
  voyagers.[1].name => Invalid value type
  voyagers.[1].age => Invalid value type
  voyagers.[2] => Invalid value type`);
        });
    });

    it('object validation', async () => {
      const carValidator = Validator({
        brand: (value) => {
          if (typeof value !== 'string')
            throw new InvalidValueTypeError('string');

          if (value === '')
            throw new ValidationError('this field cannot be empty');

          return value;
        },
        tank: (value) => {
          // not required
          if (value === undefined)
            return;

          if (typeof value !== 'number')
            throw new InvalidValueTypeError('number');

          if (value < 0)
            throw new ValidationError('this field cannot be negative');

          return Math.round(value);
        },
      });

      const myCar = await carValidator({ brand: 'peugeot', tank: 43.2, speed: 123 });

      expect(myCar).to.deep.eql({ brand: 'peugeot', tank: 43 });

      const myCars = await carValidator.many([
          { brand: 'peugeot', tank: 43.2, speed: 123 },
          { brand: 'ferrari' },
          { brand: 'batmobile', tank: 0 },
        ]);

      expect(myCars).to.deep.eql([
          { brand: 'peugeot', tank: 43 },
          { brand: 'ferrari', tank: undefined },
          { brand: 'batmobile', tank: 0 },
        ]);
    });

    describe('single value validation', () => {

      it('single value validation 1', async () => {
        const validateSpeed = ValueValidator({
          type: 'number',
          required: true,
          allowNull: true,
          validate: value => {
            if (value < 0)
              throw new ValidationError('this field cannot be negative');
          },
        });

        expect(await validateSpeed(69)).to.eql(69);
        expect(await validateSpeed(null)).to.be.null;

        await expect(validateSpeed(-8)).to.be.rejectedWith(/cannot be negative/);
        await expect(validateSpeed()).to.be.rejected
      });

      it('single value validation 2', async () => {
        const carValidator = Validator(carValidatorBrandTank);

        const myCar = await carValidator({ brand: 'peugeot', tank: 43.2 });

        expect(myCar).to.deep.eql({ brand: 'peugeot', tank: 43 });
      });

      it('single value validation 3', async () => {
        const carValidator = Validator({
          ...carValidatorBrandTank,
          voyagers: ValueValidator({
            type: 'string',
            many: true,
          }),
        });

        const myCar = await carValidator({
          brand: 'renault',
          tank: 43.2,
          voyagers: ['Nils', 'Tom', 'Jeanne'],
        });

        expect(myCar).to.deep.eql({ brand: 'renault', tank: 43, voyagers: ['Nils', 'Tom', 'Jeanne'] });
      });

    });

    describe('nesting validators', () => {

      it('nesting validators 1', async () => {
        const carValidator = Validator({
          ...carValidatorBrandTank,
          driver: voyagerValidator,
          passengers: ValueValidator({
            required: true,
            many: true,
            defaultValue: [],
            validate: voyagerValidator,
          }),
        });

        const myCar = await carValidator({
          brand: 'dominus',
          tank: 43.2,
          driver: { name: 'Nils', age: 51 },
          passengers: [
            { name: 'Tom', age: 8 },
            { name: 'Jeanne', age: 27 },
          ],
        });

        expect(myCar).to.deep.eql({
          brand: 'dominus',
          tank: 43,
          driver: { name: 'Nils', age: 51 },
          passengers: [
            { name: 'Tom', age: 8 },
            { name: 'Jeanne', age: 27 },
          ],
        });
      });

      it('nesting validators 2', async () => {
        const carValidator = Validator({
          ...carValidatorBrandTank,
          driver: ValueValidator({
            required: true,
            validate: async value => {
              await voyagerValidator(value);

              if (value.age < 16)
                throw new ValidationError('you\'re too young to drive!');
            },
          }),
        });

        await expect(carValidator({
          brand: 'takumi',
          tank: 42.3,
          driver: { name: 'Nils', age: 12 },
        })).to.be.rejectedWith(/too young/);
      });

    });

    it('parameterized validators', async () => {
      const carValidator = Validator({
        ...carValidatorBrandTank,
        tank: ValueValidator({
          type: 'number',
          validate: (value, opts) => {
            if (value < 0)
              throw new ValidationError('this field cannot be negative');

            if (value > opts.max)
              throw new ValidationError('this field cannot be over ' + opts.max);

            return opts.round ? Math.round(value) : value;
          },
        }),
      });

      await expect(carValidator({ brand: 'twingo', tank: 43.2 }, { tank: { max: 100, round: true } })).to.eventually.deep.eql({
        brand: 'twingo',
        tank: 43,
      });

      await expect(carValidator({ brand: 'twingo', tank: 123.4 }, { tank: { max: 100, round: false } })).to.be.rejected
        .then(e => {
          expect(e.errors).to.have.lengthOf(1);
          expect(e.errors[0]).to.match(/over 100/);
        });
    });

    it.skip('partial validation ', async () => {
      const carValidator = Validator({
        brand: ValueValidator({ type: 'string', required: true }),
        tank: ValueValidator({ type: 'number', required: true }),
      });

      const myCar = await carValidator({ tank: 51 }, { partial: true });

      expect(myCar).to.deep.eql({ brand: undefined, tank: 51 });
    });

  });

});
