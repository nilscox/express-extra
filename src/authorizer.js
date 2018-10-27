const { AuthorizationError } = require('./errors');

const not = (authorizer, message) => Authorizer({ op: 'not', authorizer }, message);
const and = (arr, message) => Authorizer({ op: 'and', authorizer: arr }, message);
const or = (arr, message) => Authorizer({ op: 'or', authorizer: arr }, message);

const Authorizer = module.exports = (authorizer, message) => {

  const authorize = async data => {

    const authorize_function = async (data, f) => {
      if (await f(data) === false)
        throw new AuthorizationError(message);
    };

    const authorize_not = async (data, authorizer) => {
      let result = undefined;

      try {
        result = await Authorizer(authorizer, message)(data);
      } catch (e) {
        if (!(e instanceof AuthorizationError))
          throw e;

        result = false;
      } finally {
        if (result !== false)  
          throw new AuthorizationError(message);
      }
    };

    const authorize_and = async (data, arr) => {
      for (let i = 0; i < arr.length; ++i) {
        try {
          if ((await Authorizer(arr[i], message)(data)) === false)
            throw AuthorizationError(message);
        } catch (e) {
          if (!(e instanceof AuthorizationError))
            throw e;

          if (message)
            throw new AuthorizationError(message);

          throw e;
        }
      }
    };

    const authorize_or = async (data, arr) => {
      let error = null;

      for (let i = 0; i < arr.length; ++i) {
        try {
          return await Authorizer(arr[i], message)(data);
        } catch (e) {
          if (!(e instanceof AuthorizationError))
            throw e;

          if (message)
            error = new AuthorizationError(message);
          else
            error = e;
        }
      }

      if (error)
        throw error;
    };

    const authorize_object = async (data, obj) => {
      const { op, authorizer: a } = authorizer;

      if (op === 'not')
        await authorize_not(data, a);
      else if (op === 'and')
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
