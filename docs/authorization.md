# Authorization

The authorization system allows to define some rules that must be respected in
order to allow users to perform specific actions. We call thoses rules
*permissions*, they are just functions that will be invoked with a context (an
object of your choice), and which must throw an `AuthorizationError` if the
context does not meet the requirements.

- see the [full example](#full-example) for an overview of the authorization system
- read the [API](#api)

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

If the function returns false, the AuthorizationError will be created with an
optional message. The same authorizer can be written as:

```js
const adminAuthorizer = Authorizer(data => data.isAdmin === true, 'you must be an admin');
```

### Logical operators

Authorizers can be combined with logical operators using the `extra.and` and
`extra.or` functions. They both expect an array of authorizers as only
parameter. There is also a `extra.not` function that will negate a given
authorizer.

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
]);

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

## API

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

If the authorizer is an array, it will be treated as a logical and.

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
