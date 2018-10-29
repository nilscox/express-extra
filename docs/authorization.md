# Authorization

The authorization system allows to define some rules that must be respected in
order to allow users to perform specific actions. We call thoses rules
*permissions*, they are just functions that will be invoked with a context (an
object of your choice), and which must throw an `AuthorizationError` if the
context does not meet the requirements.

- see the [full example](#full-example) for an overview of the authorization system
- read the [API](./api.md#authorization)

## Using authorizers

An authorizer can be created using the `extra.Authorizer` function. We can call
it with an [authorizer function](#authorizer-function) directly, or a
combinaison of authorizers using [logical `and` and `or`](#logical-operators)
operators.

Authorizer functions can return a (eventually rejecting) promise, or be an
async function.

### Authorizer function

An **authorizer** is a *function* that takes a piece of data, and should throw
an instance of `AuthorizationError` or one of its sub-class if the authorization
fails. It can also return `false`, in which case the `AuthorizationError` will
be thrown for you.

> Note: the value given to the authorizer can be anything, though it will often
> make sense to pass down the [request object](http://expressjs.com/en/4x/api.html#req).

```js
const adminAuthorizer = Authorizer(data => {
  if (data.isAdmin !== true)
    throw new AuthorizationError('you must be an admin');
});

adminAuthorizer({ isAdmin: true }); // ok
adminAuthorizer({ isAdmin: false }); // fails!
```

If the function returns `false`, the AuthorizationError will be created with an
optional message. The same authorizer can be written as:

```js
const adminAuthorizer = Authorizer(data => data.isAdmin === true, 'you must be an admin');
```

### Parameterized authorization

When authorization differs according to the context, you can provide an
additional option object to the authorizer, that will be forwarded to all
authorization functions.

```js
const adminAuthorizer = Authorizer((data, opts) => {
  if (opts.bypassAdmin)
    return;

  if (data.isAdmin !== true)
    throw new AuthorizationError('you must be an admin');
});

adminAuthorizer({ isAdmin: false }); // fails
adminAuthorizer({ isAdmin: false }, { bypassAdmin: true }); // ok!
```

### Logical operators

Authorizers can be combined with logical operators using the `extra.and` and
`extra.or` functions. They both expect an array of authorizers as parameter,
and an optional message. There is also a `extra.not` function that will negate
a given authorizer.

```js
const isSignedIn = Authorizer(data => data.user !== undefined);
const isNotSignedIn = not(isSignedIn);
const isAdmin = Authorizer(data => data.admin === true);

const canCreateUser = or([
  isNotSignedIn,
  isAdmin,
]);

const canDeleteUser = and([
  isSignedIn,
  isAdmin,
], 'you cannot delete a user');

await canCreateUser({}); // ok
await canCreateUser({ user: true, admin: true }); // ok
await canCreateUser({ user: true }); // fail!

await canDeleteUser({ user: true, admin: true }); // ok
await canDeleteUser({}); // fail!
await canDeleteUser({ user: true, admin: false }); // fail!
```

Operators can be mixed together (see the full example below).

## Full example

```js
const permissions = {
  isSignedIn: req => req.user !== undefined,
  isPostOwner: req => {
    if (req.post.owner !== req.user)
      throw new AuthorizationError('you must be owner');
  },
  isAdmin: req => req.admin === true,
};

const adminAuthorizer = Authorizer(permissions.isAdmin);

const canEditPostAuthorizer = Authorizer(
  or([
    and([permissions.isSignedIn, permissions.isPostOwner]),
    adminAuthorizer,
  ],
));

await adminAuthorizer({ admin: true }); // ok
await adminAuthorizer({ admin: false }); // fail!

await canEditPostAuthorizer({ user: 8, post: { owner: 8 } }); // ok
await canEditPostAuthorizer({ user: 8, post: { owner: 4 } }); // fail!
await canEditPostAuthorizer({ post: { owner: 8 } }); // fail! "you must be owner"
await canEditPostAuthorizer({ admin: true, post: { owner: 8 } }); // ok
```
