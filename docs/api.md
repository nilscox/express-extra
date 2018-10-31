# ExpressExtra API reference

## Extra request handler

```js
extra(handler: Handler, opts?: ExtraOpts) => Array<ExpressMiddleware>

ExpressMiddleware: (req, res, next) => any
Handler: (req: Request, res: Response) => any | Promise<any>
ExtraOpts: {
  authorize?: Authorizer,
  authorizeOpts?: any,
  validate?: Validator,
  validateOpts?: any,
  format?: Formatter,
  formatOpts?: any,
  before: ExpressMiddleware || Array<ExpressMiddleware>,
  after: ExpressMiddleware || Array<ExpressMiddleware>,
}
```

Create an express-complient request handler, supporting authorization, data
validation and response formatting. The handler can be [`async`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
or return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

- handler: the actual handler
- opts: the handler's options (self descriptive)

The value returned or resolved by the validator is stored in `req.validated`,
and can be accessed by the authorizer and the handler. The value returned or
resolved by the handler is forwarded to the formatter, if any.

If the final value (returned by the handler, and eventually formatted), can be
of type:

- `undefined`: the response status will is set to 204, and the request ends.
- `string`: the request ends with [`res.send`](http://expressjs.com/en/4x/api.html#res.send).
- anything else: the request ends with [`res.json`](http://expressjs.com/en/4x/api.html#res.json).

## Authorization

### Authorizer type

```js
Authorizer: (data: any) => any | Promise<any>
```

An Authorizer is a function that takes a piece of data, and must throw (or
reject with) an instance of AuthorizationError (or one of its sub-class) if the
data does not match the set of permissions. If the returned (or resolved) value
is `false`, then an instance of AuthorizationError will be thrown. It is
otherwise is discarded.

### Authorize

```js
Authorize(authorizer: Authorizer | Array<Authorizer>, message?: string) => Authorizer
```

Create an authorizer function.

- authorizer: the authorizer function or array
- message (optional): the error message if an authorizer function fails by returning false

The created authorizer always returns a Promise. If the authorizer is an array,
it will be treated as a logical and.

### Logical not

```js
Authorize.not(authorizer: Authorizer, message?: string) => Authorizer
```

- authorizer: the authorizer to negate
- message (optional): the error message if the authorizer succeed

Create an authorizer function that will succeed if the given authorizer fails.
It will then throw an instance of `AuthorizationError`.

### Logical or

```js
Authorize.or(authorizers: Array<Authorizer>) => Authorizer
```

- authorizers: the authorizers array

Create an authorizer function that will succeed if at least one of the
authorizers provided in its parameter succeeds.

### Logical and

```js
Authorize.and(authorizers: Array<Authorizer>) => Authorizer
```

- authorizers: the authorizers array

Create an authorizer function that will succeed if all the authorizers
provided in its parameter succeeds.

## Validation

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
Validator(fields: {[string]: Validator}) => Validator
```

Create an object validator.

- fields: an object mapping the keys of the expected object to validators

The returned value is a Validator function that will check an object's fields
against each fields validators, and return a Promise resolving the validated
value. The `opts` object will be forwarded to all fields validators.

The returned validator has a `many` auxilliary function, which validates an
array of object instead of a single one.

```js
const validator = Validator(...);

validator.many<T: any>: (data: Array<T>, opts: {}) => Array<T> | Promise<Array<T>>
```

### ValueValidator

```js
ValueValidator(params: {}) => Validator
```

Create a single value validator.

The `params` object can define several validation rules:

- type (string): the value's type (if primitive)
- required (boolean, default: false): throw a MissingValueError if the value is undefined
- allowNull (boolean, default: false): accepts `null` as a valid value
- defaultValue (any): set a default value if not provided
- many (boolean, default: false): accepts an array as value
- validate (Validator | Array<Validator>): custom validation rules

The returned validator is a function that will check a value against all rules
defined in the `params` object. In the validator's options, setting `partial`
to `true` allows for partial validation (i.e. set required to `false` for all
fields). The value validator always returns a Promise resolving the validated
value.

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

> Note: here, original data refers to the data passed in the function's first
> argument.
