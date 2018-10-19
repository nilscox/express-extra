# Validation

Data validation should be handled carefully when building an app that recieve
inputs from a user. You will eventually need to validate that an object is in an
expected format, thus checking the types and values of each fields.

ExpressExtra validation system works with the concept of *Validator*, a
function that accepts some data and returns the validated value, throwing
exceptions if the validation fails.

A **validator** is a *function* that takes a piece of data and an options
object, and returns the validated value. It must throw an instance of
ValidationError or one of its sub-class if the validation fails.

```js
Validator: (data: any, opts: {}) => (validated: any)
```

See the [full example](#full-example) for an overview of the validation system.
[Read the full API](#api)

## Using validators

### Object validation

An object validator is a function verifying that an object (or an array of
objects), respect a given set of rules. It can be created using the
`extra.Validator` function, providing an object mapping the keys of the
expected object to a function that will be invoked with the data to validate.

If a condition is not met on the data to validate, the validation function must
throw an instance of ValidationError, or one of its children. See
[errors](#errors). The function must return the validated value.

```js
const { Validator } = require('express-extra');

const carValidator = Validator({
  brand: (value) => {
    if (typeof value !== 'string')
      throw new InvalidFieldTypeError('string');

    if (value === '')
      throw new ValidationError('this field cannot be empty');

    return value;
  },
  tank: (value) => {
    // not required
    if (value === undefined)
      return;

    if (typeof value !== 'number')
      throw new InvalidFieldTypeError('number');

    if (value < 0)
      throw new ValidationError('this field cannot be negative');

    return Math.round(value);
  },
});
```

`carValidator` is an *object validator*, a function verifying that an object
contains two keys : "brand", a non-empty string and "tank", a positive number
which can be ommited. If extra fields are given, they will be discarded.

```js
const myCar = await carValidator({ brand: 'peugeot', tank: 43.2, speed: 123 });
// myCar = { brand: 'peugeot', tank: 43 }
```

To validate an array of objects, we should set `many` to `true` in the
validator's options.

```js
const myCars = await carValidator([car1, car2, car3], { many: true });
```

### Single value validation

Now this is a tedious way to perform data validation. A single field's value
can often be checked using the `extra.ValueValidator` function. It creates a
single value validator, that will check the value against a set of conditions
that the value should meet to be concidered as valid.

```js
const validateSpeed = ValueValidator({
  type: 'number',
  required: true,
  allowNull: true,
  validate: value => {
    if (value < 0)
      throw new ValidationError('this field cannot be negative');
  },
});
```

`validateSpeed` is a *value validator*, a function verifying that a value
is a positive number, allowing null as a valid value.

```js
await validateSpeed(69); // => 69
await validateSpeed(null); // => null
await validateSpeed(-8); // ValidationError!
await validateSpeed(); // MissingFieldError!
```

> Note: unlike in a validator, if the `validate` function does not return a
value, the original one will be concidered as valid.

Rewriting the validator using validate:

```js
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
    required: false,
    validate: value => {
      if (value < 0)
        throw new ValidationError('this field cannot be negative');

      return Math.round(value);
    },
  }),
});
```

Checking an array of values can be done using `many` in validate's options.
It will perform data validation for each values in the array. If a single value
fails, a `ValidationErrors` is thrown.

```js
const carValidator = await Validator({
  // ..,
  voyagers: ValueValidator({
    type: 'string',
    many: true,
  }),
});

const myCar = carValidator({
  brand: 'renault',
  tank: 43.2,
  voyagers: ['Nils', 'Tom', 'Jeanne'],
});

// myCar = { brand: 'renault', tank: 43, voyagers: ['Nils', 'Tom', 'Jeanne'] }
```

### Nesting validators

Validating an object's field being another object can be achieve using a
validator as a `validate` function.

```js
const voyagerValidator = Validator({
  name: ValueValidator({ type: 'string' }),
  age: ValueValidator({ type: 'number' }),
});

const carValidator = Validator({
  // ..,
  driver: voyagerValidator,
  passengers: ValueValidator({
    required: true,
    many: true,
    validate: voyagerValidator,
  }),
});

const myCar = carValidator({
  brand: 'dominus',
  tank: 43.2,
  driver: { name: 'Nils', age: 51 },
  passengers: [
    { name: 'Tom', age: 8 },
    { name: 'Jeanne', age: 27 },
  ],
});
```

The `validate` parameter of a ValueValidator can also be an array of
validators. In this case, the initial data value will be reduced through all
the validators in `validate`.

```js
const carValidator = Validator({
  // ..,
  driver: ValueValidator({
    required: true,
    validate: [
      voyagerValidator,
      value => {
        if (value.age < 16)
          throw new ValidationError('you\'re too young to drive!');  
      },
    ],
  }),
});
```

### Parameterized validators

Sometimes, validation can be performed a bit differently depending on the
context. In answer to this, an `opts` object is passed down all validators,
allowing you to set some custom options. It is forwarded to all field
validators in an objet validator, and to all `validate` callbacks in value
validators.

```js
const carValidator = Validator({
  // ..,
  tank: ValueValidator({
    type: 'number',
    validate: (value, opts) => {
      if (value < 0)
        throw new ValidationError('this field cannot be negative');

      if (value > opts.tankMax)
        throw new ValidationError('this field cannot be over ' + opts.tankMax);

      return opts.tankRound ? Math.round(value) : value;
    },
  }),
});

carValidator({ brand: 'twingo', tank: 43.2 }, { tankMax: 100, tankRound: true }); // ok
carValidator({ brand: 'twingo', tank: 123.4 }, { tankMax: 100, tankRound: false }); // fail!
```

### Partial validation

If for some reason, you don't require all values to be set even if the
`required` rule is set to true in a value validator, then the `partial` option
should be set to `true`. This will also perform a partial validation for nested
validators.

```js
const carValidator = Validator({
  brand: ValueValidator({ type: 'string', required: true }),
  tank: ValueValidator({ type: 'number', required: true }),
});

const myCar = await carValidator({ tank: 51 }, { partial: true });
// myCar = { brand: undefined, tank: 51 }
```

## Full example

This example creates a voyager validator verifying that an object has at least
the keys "name" (string) and "age" (positive number or null, but can be omitted).

In the same way, it creates a car validator with the fields "brand" (a non-empty
string) and "tank" (a positive number), "driver" (an object that will be
checked with a voyager validator), and "passengers" (an array of voyagers).

```js
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

      if (value > opts.tankMax)
        throw new ValidationError('this field cannot be over ' + opts.tankMax);

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
    name: 'Harisson',
    age: 51,
  },
  voyagers: [
    { name: 'Tom' },
    { name: 'Jeanne', age: 27 },
  ],
});

/*
myCar = {
  brand: 'ford',
  tank: 43,
  driver: {
    name: 'Harrison',
    age: 51,
  },
  voyagers: [
    { name: 'Tom', age: undefined },
    { name: 'Jeanne', age: 27 },
  ],
}
*/
```

## API

### Validator type

```js
Validator: (data: any, opts: {}) => any | Promise<any>
```

A Validator is a function that takes a piece of data and some options, and
must throw (or reject with) an instance of ValidationError (or one of its
sub-class) if the validation fails. The returned value must be the validated
data.

The `opts` object allows to create parameterized validators. It should contain
informations that you will need about how to validate the data, if necessary.

### Validator

```js
Validator(fields: {[string]: Validator}, type?: string) => Validator
```

Create an object validator.

- fields: an object mapping the keys of the expected object to validators
- type (optional): a string representing the object's type

The returned value is a Validator function that will check an object's fields
against each fields validators, and return the validated value. If `many` is
set to `true` in the validator's options, the expected data value is an array
of object rather than a single one. Other values in `opts` will be forwarded
to all fields validators.

### ValueValidator

```js
ValueValidator(params: {}) => Validator
```

Create a single value validator.

The `params` object can define several validation rules:

- type (string): the value's type (if primitive)
- required (boolean, default: false): throw a MissingFieldError if the value is undefined
- allowNull (boolean, default: false): accepts `null` as a valid value
- defaultValue (any): set a default value if not provided
- many (boolean, default: false): accepts an array as value
- validate (Validator | Array<Validator>): custom validation rules

The returned validator is a function that will check a value against all rules
defined in the `params` object. In the validator's options, setting `partial`
to `true` allows for partial validation (i.e. set required to `false` for all
fields).

`params.validate` is a custom validator that can perform other validation rules
as your needs. It will be invoked with the data value to validate, and the
`opts` object will be forwarded.

If `validate` is an array of validators, then the value is [reduced](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
through all of them, returning the validated value.

If a custom validator does not return a value, then the original data is
concidered valid.

A custom validator can return another validator, in this case it will be
invoked with the original data and the `opts` object will be forwarded. This
allows to build recursive validators.

> Note: here, original data refers to the data passed in the function's first argument
