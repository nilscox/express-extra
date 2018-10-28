# Formatting

The values stored in an application will often need to be transformed into an
object representation, so it can be serialized (i.e. as a response body).
Formatters are functions that, given an object such as a model instance, will
return a plain object ready to be display to the end user.

- see the [full example](#full-example) for an overview of the authorization system
- read the [API](./api.md#formatting)

## Using formatters

### Object formatter

Formatter functions will transform a value instance into a plain object. It is
created using the `extra.Formatter` function, providing an object mapping the
fields of the output object to functions that will be invoked with the whole
instance, and that must return the formatted value (or a promise resolving it).

```js
const userFormatter = Formatter({
  fullName: user => {
    return user.firstName + ' ' + user.lastName.toUpperCase();
  },
  age: user => {
    if (user.age < 18)
      return;

    return user.age;
  },
  email: user => user.email,
});

const user = await userFormatter({
  firstName: 'Mano',
  lastName: 'Cox',
  age: 16,
  email: 'mano@cox.tld',
});

// user = { fullName: 'Mano COX', email: 'mano@cox.tld' }
```

Formatting multiple object can be achieve using the `formatter.many`
auxilliary function.

```js
const userFormatter = Formatter(/* ... */);

const users = await userFormatter.many([
  { firstName: 'Mano', lastName: 'Cox', age: 16, email: null },
  { firstName: 'nain', lastName: 'djardin', age: 24, email: null },
]);

/*
users = [
  { fullName: 'Mano COX', email: null },
  { fullName: 'nain DJARDIN', age: 24, email: null },
]
*/
```

### Nesting formatters

Formatters can be used inside an object's field formatter, allowing to create
nested object representations. Also, nothing will stop you to use them
recursively.

```js
const itemFormatter = Formatter({
  name: item => item.name,
  shape: item => item.shape === 1 ? 'square' : 'not square',
});

const userFormatter = Formatter({
  firstName: user => user.firstName,
  item: user => itemFormatter(user.item),
  friends: user => {
    if (!user.friends)
      return [];

    return userFormatter.many(user.friends);
  },
});

const user = await userFormatter({
  name: 'jondo',
  item: {
    name: 'sword',
    shape: 8,
  },
  friends: [
    {
      name: 'janda',
      item: {
        name: 'earth',
        shape: 1,
      },
      friends: null,
    },
  ],
});

/*
user = {
  name: 'jondo',
  item: { name: 'sword', shape: 'not square' },
  friends: [
    {
      name: 'janda',
      item: { name: 'earth', shape: 'square' },
      friends: [],
    },
  ],
}
```

### Parameterized formatters

Sometimes, we want to format a value differently, according to the context. For
instance, if we want to hide the email from the object returned by a formatter,
we can use an options object given when formatting a value, which is forwarded
to all fields formatter functions.

```js
const userFormatter = Formatter({
  email: (user, opts) => {
    if (opts.hideEmail)
      return '*****';

    return user.email;
  },
});

const user = userFormatter({ email: 'mano@cox.tld' }, { hideEmail: true });

// user = { email: '*****' }
```
