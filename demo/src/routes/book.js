const express = require('express');
const { extra, Authorizer, BadRequestError, NotFoundError, ValidationError } = require('express-extra');
const { Author, Book } = require('../db');
const { isAdmin, isUser, hasEnoughQuota } = require('../authorization');
const { bookValidator } = require('../validators');
const { bookFormatter } = require('../formatters');

const router = module.exports = express.Router();

router.param('id', async (req, res, next, id) => {
  try {
    const book = await Book.findByPk(id, { include: [Author] });

    if (!book)
      throw new NotFoundError('book');

    req.book = book;
    next();
  } catch (e) {
    next(e);
  }
});

router.get('/', extra(async () => {
  return await Book.findAll({ include: [Author] });
}, {
  format: bookFormatter.many,
}));

router.get('/:id', extra(req => req.book, {
  format: bookFormatter,
}));

router.post('/', extra(async req => {
  const { validated } = req;
  let created = null;

  if (validated.author)
    created = await Book.create(req.validated, { include: [Author] });
  else
    created = await Book.create(req.validated);

  await created.reload({ include: [Author] });

  return created;
}, {
  authorize: isAdmin,
  validate: req => bookValidator(req.body),
  format: bookFormatter,
  status: 201,
}));

router.post('/:id/rent', extra(req => {
  if (req.user)
    req.user.books.push(req.book.id);

  return `Have fun reading ${req.book.title}!`;
}, {
  authorize: Authorizer.or([
    isAdmin,
    Authorizer.and([
      isUser,
      hasEnoughQuota,
    ]),
  ]),
  validate: req => {
    if (req.user && req.user.books.includes(req.book.id))
      throw new BadRequestError('you already have this book');
  },
}));

router.post('/:id/return', extra(req => {
  if (req.user)
    req.user.books.splice(req.validated.bookIdx, 1);

  return `Thank you for returning ${req.book.title}.`;
}, {
  authorize: Authorizer.or([
    isAdmin,
    isUser,
  ]),
  validate: req => {
    if (req.user) {
      const idx = req.user.books.indexOf(req.book.id);

      if (idx < 0)
        throw new BadRequestError('you don\'t have this book');

      return { bookIdx: idx };
    }
  },
}));
