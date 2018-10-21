/**
Authorizer: (data) => ()
*/

const { AuthorizationError } = require('./errors');

const Authorizer = module.exports = authorizer => {

  const authorize = async data => {

    const authorize_function = async (data, f) => await f(data);

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

    const authorize_object = (data, obj) => {
      const keys = Object.keys(obj);
      const arr = keys.map(op => data => {
        switch (op) {
        case 'or':
          return authorize_or(data, obj[op]);

        case 'and':
          return authorize_and(data, obj[op]);

        default:
          throw new Error('invalid operator ' + op);
        }
      });

      return authorize_or(data, arr);
    };

    if (typeof authorizer === 'function')
      await authorize_function(data, authorizer);
    else if (authorizer instanceof Array)
      await authorize_and(data, authorizer);
    else if (typeof authorizer === 'object')
      await authorize_object(data, authorizer);
  };

  return authorize;
};