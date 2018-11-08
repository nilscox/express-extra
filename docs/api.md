# ExpressExtra API reference

## Extra request handler

```js
extra(handler: Handler, opts?: ExtraOpts) => Array<ExpressMiddleware>

ExpressMiddleware: (req, res, next) => any
Handler: (req: Request, res: Response) => any | Promise<any>
ExtraOpts: {
  authorize?: Authorizer,
  validate?: Validator,
  format?: Formatter,
  before?: ExpressMiddleware || Array<ExpressMiddleware>,
  after?: ExpressMiddleware || Array<ExpressMiddleware>,
  finish?: (req: Request, res: Response, result: any) => any | Promise<any>,
  status?: number,
}
```

Create an express-complient request handler, supporting authorization, data
validation and response formatting. The handler can be [`async`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
or return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

- handler: the actual handler function
- opts.authorize: an authorizer that will be invoked with the `req` object.
- opts.validate: a validator that will be invoked with the `req` object. The
  value it returns or resolves is stored in `req.validated`.
- opts.format: a formatter that will be invoked with the value returned or
  resolved by the handler.
- opts.before: an express middleware invoked before the request is processed.
- opts.after: an express middleware invoked after the request has been processed.
- opts.finish: a function invoked to end the request.
- opts.status: the status code to set if the request ends correctly.

None of the options are mandatory. If any function throws an error, then the
`next` callback is invoked with the error. It can be handled by the
`opts.after` callback, or by an error middleware handler later in the whole
chain.

If the `opts.finish` callback is not provided, a default one will process the
value returned by the handler (and eventually formatted) according to its type,
and call [`res.status`](http://expressjs.com/en/4x/api.html#res.status) with
`opts.status`, if any. If the value is of type:

- `undefined`: the request ends with [`res.end`](http://expressjs.com/en/4x/api.html#res.end).
  If `opts.status` is not provided, the status code is set to 204 (No content).
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
extra.Authorize(authorizer: Authorizer | Array<Authorizer>, message?: string) => Authorizer
```

Create an authorizer function.

- authorizer: the authorizer function or array
- message (optional): the error message if an authorizer function fails by returning false

The created authorizer always returns a Promise. If the authorizer is an array,
it will be treated as a logical and.

### Logical not

```js
extra.Authorize.not(authorizer: Authorizer, message?: string) => Authorizer
```

- authorizer: the authorizer to negate
- message (optional): the error message if the authorizer succeed

Create an authorizer function that will succeed if the given authorizer fails.
It will then throw an instance of `AuthorizationError`.

### Logical or

```js
extra.Authorize.or(authorizers: Array<Authorizer>) => Authorizer
```

- authorizers: the authorizers array

Create an authorizer function that will succeed if at least one of the
authorizers provided in its parameter succeeds.

### Logical and

```js
extra.Authorize.and(authorizers: Array<Authorizer>) => Authorizer
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
extra.Validator(fields: {[string]: Validator}) => Validator
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
extra.ValueValidator(params: {}) => Validator
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

## Formatting

### Formatter type

```js
Formatter: (value, opts) => any | Promise<any>
```

A formatter is a function that takes a piece of data and some options, and must
return the formatted value, or a promise resolving it.

### Formatter

```js
extra.Formatter(fields: {[string]: Formatter}) => Formatter
```

Create a formatter.

- fields: an object mapping the fields of the formatted object to formatter functions

The returned value is a formatter function, that can be invoked with any value
as first argument, and which will be forwarded to all fields formatter
functions, as long with `opts`. The created formatter always return a Promise
resolving the formatted value.

The returned function has a `formatter.many` auxilliary function that expects
an array of values instead of a single one, and returns a Promise resolving
an array of formatted values.
