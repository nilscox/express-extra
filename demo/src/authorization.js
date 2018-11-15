const { Authorizer, AuthorizationError } = require('express-extra');

const isAdmin = Authorizer(req => req.get('token') === 'zorglub', 'you must be admin');

const isUser = Authorizer(req => {
  if (!req.session.user)
    req.session.user = { quotas: { author: 0, book: 0 } };

  req.user = req.session.user;
});

const hasEnoughAuthorQuota = Authorizer(req => {
  const { quotas } = req.user;

  if (quotas.author >= 5)
    throw new AuthorizationError('author creation quota exceeded');
});

const hasEnoughBookQuota = Authorizer(req => {
  const { quotas } = req.user;

  if (quotas.book >= 3)
    throw new AuthorizationError('book creation quota exceeded');
});

module.exports = {
  isAdmin,
  isUser,
  hasEnoughAuthorQuota,
  hasEnoughBookQuota,
};
