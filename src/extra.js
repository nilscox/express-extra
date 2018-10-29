module.exports = (handle, opts = {}) => {
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
      await opts.authorize(req, opts.authorizeOpts);
    }));
  }

  if (opts.validate) {
    middlewares.push(trycatch(async (req, res, next) => {
      req.validated = await opts.validate(req, opts.validateOpts);
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
      result = await opts.format(result, opts.formatOpts);

    if (typeof result === 'undefined')
      res.status(204).end();
    else if (typeof result === 'string')
      res.send(result);
    else
      res.json(result);
  }));

  return middlewares;
};
