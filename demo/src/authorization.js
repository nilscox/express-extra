const { Authorizer, AuthorizationError } = require('express-extra');

const isAdmin = Authorizer(req => req.get('token') === 'zorglub', 'you must be admin');

const isUser = Authorizer(req => {
  if (!req.session.user)
    req.session.user = { quota: 0 };

  req.user = req.session.user;
});

const hasEnoughQuota = Authorizer(req => {
  const { quota } = req.user;

  if (quota >= 2)
    throw new AuthorizationError('quota exceeded');
});

module.exports = {
  isAdmin,
  isUser,
  hasEnoughQuota,
};
