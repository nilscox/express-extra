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

  if (opts.before) {
    if (opts.before instanceof Array)
      opts.before.forEach(middlewares.push.bind(middlewares));
    else
      middlewares.push(opts.before);
  }

  if (opts.authorize) {
    middlewares.push(trycatch(async (req, res, next) => {
      await opts.authorize(req);
    }));
  }

  if (opts.validate) {
    middlewares.push(trycatch(async (req, res, next) => {
      req.validated = await opts.validate(req);
    }));
  }

  middlewares.push(async (req, res, next) => {
    try {
      let result = await handle(req, res);

      if (opts.format)
        result = await opts.format(result);

      if (opts.finish)
        return await opts.finish(req, res, result);

      if (opts.status)
        res.status(opts.status);

      if (typeof result === 'undefined') {
        if (!opts.status)
          res.status(204);

        res.end();
      } else if (typeof result === 'string')
        res.send(result);
      else
        res.json(result);
    } catch (e) {
      next(e);
    }
  });

  if (opts.after) {
    if (opts.after instanceof Array)
      opts.after.forEach(middlewares.push.bind(middlewares));
    else
      middlewares.push(opts.after);
  }

  return middlewares;
};
