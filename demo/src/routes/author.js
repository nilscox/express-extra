const express = require('express');
const { extra, NotFoundError, BadRequestError, Authorizer } = require('express-extra');
const { Author, Book } = require('../db');
const { isAdmin } = require('../authorization');
const { authorValidator } = require('../validators');
const { authorFormatter } = require('../formatters');

const router = module.exports = express.Router();

router.param('id', async (req, res, next, id) => {
  try {
    const author = await Author.findByPk(id, { include: [Book] });

    if (!author)
      throw new NotFoundError('author');

    req.author = author;
    next();
  } catch (e) {
    next(e);
  }
});

router.get('/', extra(async (req) => {
  return await Author.findAll({ include: [Book] });
}, {
  format: authorFormatter.many,
}));

router.get('/:id', extra((req) => {
  return req.author;
}, {
  format: authorFormatter,
}));

router.post('/', extra(async (req, res) => {
  return await Author.create(req.validated);
}, {
  authorize: isAdmin,
  validate: req => authorValidator(req.body),
  format: value => authorFormatter(value, { books: false }),
  status: 201,
}));
