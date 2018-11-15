const { Formatter } = require('express-extra');

const authorFormatter = Formatter({
  id: inst => inst.get('id'),
  name: inst => [
    inst.get('firstname'),
    inst.get('lastname').toUpperCase(),
  ].join(' '),
  books: async inst => {
    if (inst.books)
      return await bookFormatter.many(inst.books, { author: false });
  },
});

const bookFormatter = Formatter({
  id: inst => inst.get('id'),
  title: inst => inst.get('title'),
  nbPages: inst => inst.get('nbPages'),
  author: async inst => {
    if (inst.author)
      return await authorFormatter(inst.author, { books: false });
  },
});

module.exports = {
  authorFormatter,
  bookFormatter,
};
