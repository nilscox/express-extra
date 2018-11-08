# Extra request handler

The core of *express-extra* is the `extra` function, that unify the
authorization, validation and formatting systems. It lets you create a request
handler function that is invoked when the request is approved by an and its
data is concidered valid by a validator. The value it returns is then formatted
and sent in the response payload.

```js
const extra = require('express-extra');

const app = express();

app.get('/some-endpoint', extra(async (req, res) => {
  const data = /* fetch some data from a database */;

  /* handle the request as you wish */
  /* you may use req.validated at some point */

  return data;
}, {
  authorize: req => /* ... */,
  validate: req => /* ... */,
  format: value => /* ... */,
}));
```

The request handler *function* is **not** invoked with a `next` callback as
third argument, as you would expect with an express middleware. Instead it can
throw an instance of `Error` or return a rejecting promise if something goes
wrong. The error will be caught, and `next` will be called with it internally.

Also, it should return or resolve a value that contains the response's data.
It would perfectly makes sens to return a database model instance, for example.
This value is then eventually transformed by a formatter, and sent in the
response body.

By default, if the resulting value is `undefined`, then the request will end
with a status code `204` (No content), if it is a `string`, it will be sent
with `res.text`, and anything else will result in a call to `res.json`. This
behavior can be implemented differently uning the `opts.finish` callback.

## Handler options

The options object in `extra`'s second parameter allows you set an authorizer,
a validator and a formatter to the request handler. All options can be omited.
If any function throws an `Error`, or return a rejecting `Promise`, then the
error is caught and the underlying express middleware's `next` callback is
invoked with the error.

The authorizer and the validator, if any, are called with the `req` object. The
value returned by the validator is then stored in `req.validated`, and can be
accessed in the handler function. The value returned by the handler is then
transformed by the formatter (if any), into a final value.

Express middlewares can be added before and after the whole request processing
with `opts.before` and `opts.after` respectively. The after hook can be a good
place if you need some custom error handling for this handler.

> Note: before and after hooks are real express middlewares, it cannot
> be async functions or return a Promise.

Finally, a `opts.finish` callback can be provided to handle terminating the
request (by calling `res.end` or equivalent). It is invoked with `req`, `res`,
and the final value returned by the handler and eventually formatted. If this
callback is not set, a default one will terminate the request according to the
final value's type (see the [API](./api.md#extra-request-handler) for more
information).

```js
const someAuthorizer = Authorizer(/* ... */);
const someValidator = Validator(/* ... */);
const someFormatter = Formatter(/* ... */);

app.get('/some-endpoint', extra(/* handler */, {
  authorize: someAuthorizer,
  validate: req => someValidator(req.body),
  format: value => someFormatter(value, { with: 'options' }),

  before: (req, res, next) => {
    // do something before the authorizer is called
    next();
  },
  after: (err, req, res, next) => {
    // handle the error
    res.status(418).end();
  },

  finish: (req, res, result) => {
    res.json({ ok: true, result });
  },

});
```
