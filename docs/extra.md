# Extra request handler

The core of *express-extra* is the `extra` function, that unify the
authorization, validation and formatting systems. It is a function that you
must call with the actual request handler, as you would with express, and
an options object in which you can set authorizers, validators, and more...

This function returns an array of express middlewares, that can be used as the
request handlers for your express app or router.

```js
const app = express();

app.get('/some-endpoint', extra(async (req, res) => {
  const data = /* fetch some data from a database */;

  /* handle the request as you wish */

  return data;
}, {
  authorize: Authorizer(/* ... */),
  validate: Validator(/* ... */),
  format: Formatter(/* ... */),
}));
```

## Request handling

The request handler is a *function* invoked when the request has been approved
by the authorization system, and the request payload is checked by the
validators. It can possibly be an `async` function, or return a `Promise`.

The function is **not** invoked with a `next` callback as third argument, as
you would expect with an express middleware. Instead it can throw an `Error` or
return a rejecting promise if something goes wrong.

Finally, it should return a value (or a promise resolving a value) that will be
given to the formatter.

If the resulting value is `undefined`, then the request will end with a
status code `204` (no content), if it is a `string`, it will be sent with
`res.text`, and anything else will result in a call to `res.json`.

## Authorization, validation and formatting

The options object in `extra`'s second parameter allows you set an authorizer,
a validator and a formatter to the request handler. All options can be omited.
If any function throws an `Error`, or return a rejecting `Promise`, then the
error is caught and the underlying express middleware's `next` callback is
invoked with the error.

The authorizer and the validator, if any, are called with the `req` object. The
validated data returned by the validator is stored in `req.validated`, and can
be accessed in the authorizer and the handler. The value returned or resolved
by the handler is then provided to the formatter, if any, to build the final
value that will be sent in the response.

Options can be set on the three systems with the `authorizeOpts`,
`validateOpts`, and `formatOpts` options.

```js
app.get('/post/:id/edit', extra(/* handler */, {
  authorize: or([
    isAdmin,
    and([isSignedIn, canEditPost]),
  ]),
  authorizeOpts: {
    blackList: ['niko', 'okras'],
  },
  validate: req => postValidator(req.body, { partial: true }),
  format: postFormatter,
});
```

## Before / After hooks

Express middlewares can be added before and after the whole request handling
with the `opts.before` and `opts.after` options respectively. The after hook
can be a good place if you need some custom error handling. It can be either a
function (`(req, res, next) => any`) or an array of functions of the same
shape.

```js
app.get('/some-endpoint', extra(/* handler */, {
  before: (req, res, next) => {
    // do something before the authorizer is called
    next();
  },
  after: (err, req, res, next) => {
    // handle the error
    res.status(418).end();
  },
});
```

> Note: before and after hooks are real express middlewares, it cannot
> be async functions or return a Promise.

## Full example

Let's build a route allowing a user to edit its profile. First, we need to
verify that the user is signed in, or is an admin. We can now build two
authorizers that will be used in the request handler.

```js
const isSignedIn = Authorizer(req => !!req.session.userId, 'you must be signed in');
const isAdmin = Authorizer(req => !!req.session.isAdmin, 'you must be an admin');
```

Now, we need to check that the data sent in the request is valid. We want our
user to have a first name, a last name, an email and a password.

```js
const userValidator = Validator({
  firstName: ValueValidator({ type: 'string', required: true }),
  lastName: ValueValidator({ type: 'string', required: true }),
  email: ValueValidator({
    type: 'string',
    required: true,
    validate: value => {
      if (!value.match(/.+@.+/))
        throw new ValidationError('invalid email');
    },
  }),
  password: ValueValidator({
    type: 'string',
    required: true,
    validate: value => {
      if (value.length < 6)
        throw new ValidationError('this password is too weak');
    },
  }),
});
```

Great, now we want the response to be formatted a bit differently than the
actual data stored in the database. Let's create a formatter to do that.

```js
const userFormatter = Formatter({
  fullName: user => user.get('firstName') + ' ' + user.get('lastName'),
  email: user => user.get('email'),
});
```

We're now ready to build the actual express request handler using all the
elements above. We assume that the current user id is stored in a session.

```
const app = express();

app.put('/user', extra(async (req, res) => {
  let user = await User.findById(req.session.userId);

  user = await user.update(req.validated);
  console.log('user updated #' + user.get('id'));

  return user;
}, {
  authorize: or([isAdmin, isSignedIn]),
  validate: userValidator,
  validateOpts: { partial: true },
  formatter: userFormatter,
}));
```
