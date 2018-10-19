const DEFAULT_OPTS = {
  many: false,
  fields: {},
};

module.exports = (fields) => {
  const keys = Object.keys(fields);

  const formatInstance = async (inst, opts) => {
    opts = Object.assign({}, DEFAULT_OPTS, opts);

    if (opts.many)
      return Promise.all(inst.map(i => formatInstance(i, { ...opts, many: false })));

    const data = {};

    for (let i = 0; i < keys.length; ++i) {
      const field = keys[i];
      const formatter = fields[field];

      const value = await formatter(inst, opts.fields[field]);

      if (typeof value !== 'undefined')
        data[field] = value;
    }

    return data;
  };

  return opts => inst => formatInstance(inst, opts);
};
