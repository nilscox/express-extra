const Formatter = module.exports = fields => {
  const keys = Object.keys(fields);

  const format = async (obj, opts = {}) => {
    const data = {};

    for (let i = 0; i < keys.length; ++i) {
      const field = keys[i];
      const formatter = fields[field];

      if (opts[field] === false)
        continue;

      const formatted = await formatter(obj, opts[field]);

      if (typeof formatted !== 'undefined')
        data[field] = formatted;
    }

    return data;
  };

  format.many = (arr, opts = {}) => Promise.all(arr.map(item => format(item, opts)));

  return format;
};
