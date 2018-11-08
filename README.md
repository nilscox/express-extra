# ExpressExtra

[![Build Status](https://travis-ci.org/nilscox/express-extra.svg?branch=master)](https://travis-ci.org/nilscox/express-extra)
[![Coverage Status](https://coveralls.io/repos/github/nilscox/express-extra/badge.svg?branch=master)](https://coveralls.io/github/nilscox/express-extra?branch=master)

This package aims to provide *extra* functionnalities to an express app, such
as authorizations, input validation, and response formatting.

## Documentation

- [extra request handler](./docs/extra.md)
- [validation](./docs/validation.md)
- [authorization](./docs/authorization.md)
- [formatting](./docs/formatting.md)
- [errors](./docs/errors.md)
- [API reference](./docs/api.md)

## Overview

The `extra` function allows to create an express milldeware with superpowers.
Its first argument will be the actual request handler, a function that is
invoked when the request has been approved by the authorizer and its payload
validated. The value it returns (or resolves) will eventually be transformed by
a formatter, and then sent in the response payload.

```js
const express = require('express');
const extra = require('express-extra');

const app = express();

app.get('/some-endpoint', extra(async (req, res) => {
  /* handle the request */
  return /* a result */;
}, {
  authorize: /* authorizer function */,
  validate: /* validator function */,
  format: /* formatter function */,
}));
```

## Contributing

This tool is currently in development, I would really appreciate any kind of
contribution, if you are willing to spend some time to it. This could be by
opening issues, discuss about some improvments or features, review the code,
write some more tests...

I think `express-extra` can be a great tool, and I'm trying my best to produce
a simple API, a good documentation and a strong test suite. As a junior
developer, I definitly know that thoses can be improved even more, and
I'm really open to any suggestion. In fact, I need you to make *extra* awesome!
