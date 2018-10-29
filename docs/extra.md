# Extra request handler

The core of *express-extra* is the handler function, that unify the
authorization, validation and formatting systems. It is a function that you
must call with the actual request handler, as you would with express, and
an options object in which you can set authorizers, validators, and so on...

This function returns an array of express middlewares, that can be used as the
request handlers for your express routes.

```js
const app = express();

app.get('/some-endpoint', extra(async (req, res) => {
  const data = /* fetch some data from a database */;

  /* handle the request as you like */

  return data;
}, {
  authorize: Authorizer(/* ... */),
  validate: Validator(/* ... */),
  format: Formatter(/* ... */),
}));
```

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
