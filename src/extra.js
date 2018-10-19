const { AuthenticationError } = require('./errors');

const authorizeRequest = async (req, authorize) => {
  if (!authorize)
    return;

  const authorize_function = (req, f) => Promise.resolve(f(req));
  const authorize_and = (req, arr) => Promise.mapSeries(arr, a => authorizeRequest(req, a));
  const authorize_or = async (req, arr) => {
    let error = null;

    for (let i = 0; i < arr.length; ++i) {
      try {
        return await authorizeRequest(req, arr[i]);
      } catch (e) {
        if (!(e instanceof AuthenticationError))
          throw e;

        error = e;
      }
    }

    if (error)
      throw error;
  };

  const authorize_object = (req, obj) => {
    const keys = Object.keys(obj);

    for (let i = 0; i < keys.length; ++i) {
      const op = keys[i];

      switch (op) {
      case 'or':
        return authorize_or(req, obj[op]);

      case 'and':
        return authorize_and(req, obj[op]);

      default:
        throw new Error('invalid operator ' + op);
      }
    }
  };

  if (typeof authorize === 'function')
    await authorize_function(req, authorize);
  else if (authorize instanceof Array)
    await authorize_and(req, authorize);
  else if (typeof authorize === 'object')
    await authorize_object(req, authorize);
  else
    throw new Error('invalid authorizer type: ' + typeof authorize);
};

const validateRequest = async (req, validate) => {
  if (typeof validate !== 'function')
    throw new Error('invalid validator type: ' + typeof validator);

  req.validated = await validate(req);
};

module.exports = (handle, opts) => {
  const middlewares = [];

  const trycatch = f => async (req, res, next) => {
    try {
      await f(req, res, next);
      next();
    } catch (e) {
      next(e);
    }
  };

  if (opts.authorize) {
    middlewares.push(trycatch(async (req, res, next) => {
      await authorizeRequest(req, opts.authorize);
    }));
  }

  if (opts.validate) {
    middlewares.push(trycatch(async (req, res, next) => {
      await validateRequest(req, opts.validate);
    }));
  }

  if (opts.middlewares) {
    opts.middlewares.forEach(m => middlewares.push((req, res, next) => {
      try {
        m(req, res, next);
      } catch (e) {
        next(e);
      }
    }));
  }

  middlewares.push(trycatch(async (req, res, next) => {
    let result = await handle(req, res);

    if (opts.format)
      result = await opts.format(result);

    if (typeof result === 'undefined')
      res.status(204).end();
    else if (typeof result === 'string')
      res.send(result);
    else
      res.json(result);
  }));

  return middlewares;
};
