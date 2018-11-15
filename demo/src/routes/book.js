const express = require('express');
const { extra, Authorizer } = require('express-extra');
const { Author, Book } = require('../db');
const { isAdmin, isUser, hasEnoughAuthorQuota, hasEnoughBookQuota } = require('../authorization');
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

  if (req.user) {
    req.user.quotas.book++;

    if (validated.author)
      req.user.quotas.author++;
  }

  return created;
}, {
  authorize: Authorizer.or([
    isAdmin,
    Authorizer.and([
      isUser,
      hasEnoughBookQuota,
      async req => {
        if (req.body.author)
          return await hasEnoughAuthorQuota(req);
      },
    ]),
  ]),
  validate: req => bookValidator(req.body),
  format: bookFormatter,
  status: 201,
}));

router.delete('/:id', extra(async (req) => {
  await req.book.destroy();
}, {
  authorize: isAdmin,
}));