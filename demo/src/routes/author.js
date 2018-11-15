const express = require('express');
const { extra, NotFoundError, BadRequestError, Authorizer } = require('express-extra');
const { Author, Book } = require('../db');
const { isAdmin, isUser, hasEnoughAuthorQuota } = require('../authorization');
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
  const created = await Author.create(req.validated);

  if (req.user)
    req.user.quotas.author++;

  return created;
}, {
  authorize: Authorizer.or([
    isAdmin,
    Authorizer.and([
      isUser,
      hasEnoughAuthorQuota,
    ]),
  ]),
  validate: req => authorValidator(req.body),
  format: value => authorFormatter(value, { books: false }),
  status: 201,
}));

router.delete('/:id', extra(async (req, res) => {
  const { author } = req;

  if (await author.countBooks() > 0)
    throw new BadRequestError('this author still has books');

  await author.destroy();
}, {
  authorize: isAdmin,
}));
