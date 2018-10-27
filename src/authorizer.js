const { AuthorizationError } = require('./errors');

const not = (authorizer, message) => Authorizer(async data => {
  let result = false;

  try {
    result = await authorizer(data);
  } catch (e) {
    if (!(e instanceof AuthorizationError))
      throw e;
  } finally {
    if (result !== false)
      throw new AuthorizationError(message);
  }
});

const and = arr => Authorizer({ op: 'and', authorizer: arr });
const or = arr => Authorizer({ op: 'or', authorizer: arr });

const Authorizer = module.exports = (authorizer, message) => {

  const authorize = async data => {

    const authorize_function = async (data, f) => {
      if (await f(data) === false)
        throw new AuthorizationError(message);
    };

    const authorize_and = async (data, arr) => await Promise.mapSeries(arr, a => Authorizer(a)(data));

    const authorize_or = async (data, arr) => {
      let error = null;

      for (let i = 0; i < arr.length; ++i) {
        try {
          return await Authorizer(arr[i])(data);
        } catch (e) {
          if (!(e instanceof AuthorizationError))
            throw e;

          error = e;
        }
      }

      if (error)
        throw error;
    };

    const authorize_object = async (data, obj) => {
      const { op, authorizer: a } = authorizer;

      if (op === 'and')
        await authorize_and(data, a);
      else if (op === 'or')
        await authorize_or(data, a);
      else if (op === undefined)
        throw new Error('authorizer: missing operator');
      else
        throw new Error('authorizer: invalid operator ' + op);
    };

    if (typeof authorizer === 'function')
      await authorize_function(data, authorizer);
    else if (authorizer instanceof Array)
      await authorize_and(data, authorizer);
    else if (typeof authorizer === 'object')
      await authorize_object(data);
  };

  return authorize;
};

module.exports.not = not;
module.exports.or = or;
module.exports.and = and;
