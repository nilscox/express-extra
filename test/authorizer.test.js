const sinon = require('sinon');
const expect = require('./expect');
const { Authorizer, errors } = require('../index');

const { AuthorizationError } = errors;
const { and, or, not } = Authorizer;

describe('Authorizer', () => {

  let spies = [];

  const addSpy = (spy, call) => {
    spy.expected = call;
    spies.push(spy);
    return spy;
  };

  const PASS = (call) => addSpy(sinon.spy(data => {
    expect(data).to.deep.eql({ pi: 3.14 });
  }), call);

  const FALSE = (call) => addSpy(sinon.spy(data => {
    expect(data).to.deep.eql({ pi: 3.14 });
    return false;
  }), call);

  const THROW = (call, message) => addSpy(sinon.spy(data => {
    expect(data).to.deep.eql({ pi: 3.14 });    
    throw new AuthorizationError(message);
  }), call);

  const test = async ({ authorize, payload = { pi: 3.14 }, rejectedWith }) => {
    if (rejectedWith)
      await expect(authorize(payload)).to.be.rejectedWith(rejectedWith);
    else
      await expect(authorize(payload)).to.be.fulfilled;
  };

  afterEach(() => {
    const msg = (n, expect) => (expect ? 'Expected' : 'Didn\'t expect') + ' spy ' + (n + 1) + ' to be called';

    spies.forEach((s, n) => expect(s.called).to.equal(s.expected, msg(n, s.expected)));
    spies = [];
  });

  describe('authorizer function', () => {

    it('should call an authorizer function, ok', async () => {
      await test({
        authorize: Authorizer(PASS(true)),
      });

      await test({
        authorize: Authorizer(PASS(true), 'some message'),
      });
    });

    it('should call an authorizer function, fail', async () => {
      await test({
        authorize: Authorizer(THROW(true)),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: Authorizer(THROW(true, 'some message')),
        rejectedWith: 'some message',
      });

      await test({
        authorize: Authorizer(THROW(true, 'some message'), 'other message'),
        rejectedWith: 'some message',
      });

      await test({
        authorize: Authorizer(FALSE(true)),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: Authorizer(FALSE(true), 'other message'),
        rejectedWith: 'other message',
      });
    });

  });

  describe('logical not', () => {

    it('should process a logical not, ok', async () => {
      await test({
        authorize: not(THROW(true)),
      });

      await test({
        authorize: not(THROW(true, 'message')),
      });

      await test({
        authorize: not(THROW(true), 'other message'),
      });

      await test({
        authorize: not(THROW(true, 'message'), 'other message'),
      });

      await test({
        authorize: not(FALSE(true)),
      });

      await test({
        authorize: not(FALSE(true), 'other message'),
      });
    });

    it('should process a logical not, fail', async () => {
      await test({
        authorize: not(PASS(true)),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: not(PASS(true), 'message'),
        rejectedWith: 'message',
      });
    });

  });

  describe('logical and', () => {

    it('should process a logical and, ok', async () => {
      await test({
        authorize: and([PASS(true), PASS(true)]),
      });
    });

    it('should process a logical and, first fail', async () => {
      await test({
        authorize: and([THROW(true), PASS(false)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: and([THROW(true, 'first message'), PASS(false)]),
        rejectedWith: 'first message',
      });

      await test({
        authorize: and([THROW(true, 'first message'), PASS(false)], 'other message'),
        rejectedWith: 'other message',
      });

      await test({
        authorize: and([FALSE(true), PASS(false)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: and([FALSE(true), PASS(false)], 'first message'),
        rejectedWith: 'first message',
      });
    });

    it('should process a logical and, second fail', async () => {
      await test({
        authorize: and([PASS(true), THROW(true)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: and([PASS(true), THROW(true, 'second message')]),
        rejectedWith: 'second message',
      });

      await test({
        authorize: and([PASS(true), THROW(true, 'second message')], 'other message'),
        rejectedWith: 'other message',
      });

      await test({
        authorize: and([PASS(true), FALSE(true)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: and([PASS(true), FALSE(true)], 'other message'),
        rejectedWith: 'other message',
      });
    });

    it('should process a logical and, both fail', async () => {
      await test({
        authorize: and([THROW(true), THROW(false)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: and([THROW(true), THROW(false, 'second message')]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: and([THROW(true), THROW(false, 'second message')], 'other message'),
        rejectedWith: 'other message',
      });

      await test({
        authorize: and([THROW(true), FALSE(false)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: and([THROW(true), FALSE(false)], 'other message'),
        rejectedWith: 'other message',
      });


      await test({
        authorize: and([THROW(true, 'first message'), THROW(false)]),
        rejectedWith: 'first message',
      });

      await test({
        authorize: and([THROW(true, 'first message'), THROW(false, 'second message')]),
        rejectedWith: 'first message',
      });

      await test({
        authorize: and([THROW(true, 'first message'), THROW(false, 'second message')], 'other message'),
        rejectedWith: 'other message',
      });

      await test({
        authorize: and([THROW(true, 'first message'), FALSE(false)]),
        rejectedWith: 'first message',
      });

      await test({
        authorize: and([THROW(true, 'first message'), FALSE(false)], 'other message'),
        rejectedWith: 'other message',
      });


      await test({
        authorize: and([FALSE(true), THROW(false)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: and([FALSE(true), THROW(false, 'second message')]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: and([FALSE(true), THROW(false, 'second message')], 'other message'),
        rejectedWith: 'other message',
      });

      await test({
        authorize: and([FALSE(true), FALSE(false)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: and([FALSE(true), FALSE(false)], 'other message'),
        rejectedWith: 'other message',
      });

    });

  });

  describe('logical or', () => {

    it('should process a logical or, ok', async () => {
      await test({
        authorize: or([PASS(true), PASS(false)]),
      });
    });

    it('should process a logical or, first fail', async () => {
      await test({
        authorize: or([THROW(true), PASS(true)]),
      });

      await test({
        authorize: or([THROW(true, 'some message'), PASS(true)]),
      });

      await test({
        authorize: or([THROW(true, 'some message'), PASS(true)], 'other message'),
      });

      await test({
        authorize: or([FALSE(true), PASS(true)]),
      });

      await test({
        authorize: or([FALSE(true), PASS(true)], 'some message'),
      });
    });

    it('should process a logical or, second fail', async () => {
      await test({
        authorize: or([PASS(true), THROW(false)]),
      });

      await test({
        authorize: or([PASS(true), THROW(false, 'second message')]),
      });

      await test({
        authorize: or([PASS(true), THROW(false, 'second message')], 'other message'),
      });

      await test({
        authorize: or([PASS(true), FALSE(false)]),
      });

      await test({
        authorize: or([PASS(true), FALSE(false)], 'other message'),
      });
    });

    it('should process a logical or, both fail', async () => {
      await test({
        authorize: or([THROW(true), THROW(true)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: or([THROW(true), THROW(true, 'second message')]),
        rejectedWith: 'second message',
      });

      await test({
        authorize: or([THROW(true), THROW(true, 'second message')], 'other message'),
        rejectedWith: 'other message',
      });

      await test({
        authorize: or([THROW(true), FALSE(true)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: or([THROW(true), FALSE(true)], 'second message'),
        rejectedWith: 'second message',
      });


      await test({
        authorize: or([THROW(true, 'first message'), THROW(true)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: or([THROW(true, 'first message'), THROW(true, 'second message')]),
        rejectedWith: 'second message',
      });

      await test({
        authorize: or([THROW(true, 'first message'), THROW(true, 'second message')], 'other message'),
        rejectedWith: 'other message',
      });

      await test({
        authorize: or([THROW(true, 'first message'), FALSE(true)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: or([THROW(true, 'first message'), FALSE(true)], 'second message'),
        rejectedWith: 'second message',
      });


      await test({
        authorize: or([FALSE(true), THROW(true)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: or([FALSE(true), THROW(true, 'second message')]),
        rejectedWith: 'second message',
      });

      await test({
        authorize: or([FALSE(true), THROW(true, 'second message')], 'other message'),
        rejectedWith: 'other message',
      });

      await test({
        authorize: or([FALSE(true), FALSE(true)]),
        rejectedWith: 'undefined',
      });

      await test({
        authorize: or([FALSE(true), FALSE(true)], 'second message'),
        rejectedWith: 'second message',
      });

    });

  });

  describe('mixed logical operators', () => {
  
    it('should process mixed logical operators 1', async () => {
      await test({
        authorize: and([
          or([FALSE(true), THROW(true), PASS(true)]),
          not(and([PASS(true), PASS(true), THROW(true), FALSE(false)])),
          or([PASS(true), PASS(false), THROW(false), FALSE(false)]),
          and([
            PASS(true),
            or([THROW(true), not(PASS(true)), not(FALSE(true)), not(PASS(false))]),
          ]),
        ]),
      });
    });

  });

  describe('invalid states', () => {

    it('should not process an invalid object', async () => {
      await expect(Authorizer({})({ pi: 3.1 })).to.be.rejectedWith(/missing operator/);
      await expect(Authorizer({ op: true })({ pi: 3.1 })).to.be.rejectedWith(/invalid operator true/);
    });

  });

  describe('readme examples', () => {

    it('full example', async () => {
      const permissions = {
        isSignedIn: req => req.user !== undefined,
        isPostOwner: req => {
          if (req.post.owner !== req.user)
            throw new AuthorizationError('you must be owner');
        },
        isAdmin: req => req.admin === true,
      };

      const adminAuthorizer = Authorizer(permissions.isAdmin);

      const canEditPostAuthorizer = Authorizer(
        or([
          and([permissions.isSignedIn, permissions.isPostOwner]),
          adminAuthorizer,
        ],
      ));

      await expect(adminAuthorizer({ admin: true })).to.be.fulfilled;
      await expect(adminAuthorizer({ admin: false })).to.be.rejectedWith(AuthorizationError);

      await expect(canEditPostAuthorizer({ user: 8, post: { owner: 8 } })).to.be.fulfilled;
      await expect(canEditPostAuthorizer({ user: 8, post: { owner: 4 } })).to.be.rejectedWith(AuthorizationError);
      await expect(canEditPostAuthorizer({ post: { owner: 8 } })).to.be.rejectedWith(AuthorizationError);
      await expect(canEditPostAuthorizer({ admin: true, post: { owner: 8 } })).to.be.fulfilled;
    });

    it('authorizer function', async () => {
      const adminAuthorizer1 = Authorizer(data => {
        if (data.isAdmin !== true)
          throw new AuthorizationError('you must be an admin');
      });

      const adminAuthorizer2 = Authorizer(data => data.isAdmin === true, 'you must be an admin');

      await expect(adminAuthorizer1({ isAdmin: true })).to.be.fulfilled;
      await expect(adminAuthorizer1({ isAdmin: false })).to.be.rejectedWith(AuthorizationError);

      await expect(adminAuthorizer2({ isAdmin: true })).to.be.fulfilled;
      await expect(adminAuthorizer2({ isAdmin: false })).to.be.rejectedWith(AuthorizationError);
    });

    it('logical operators', async () => {
      const isSignedIn = Authorizer(data => data.user !== undefined);
      const isNotSignedIn = not(isSignedIn);
      const isAdmin = Authorizer(data => data.admin === true);

      const canCreateUser = or([
        isNotSignedIn,
        isAdmin,
      ]);

      const canDeleteUser = and([
        isSignedIn,
        isAdmin,
      ]);

      await expect(canCreateUser({})).to.be.fulfilled;
      await expect(canCreateUser({ user: true, admin: true })).to.be.fulfilled;
      await expect(canCreateUser({ user: true })).to.be.rejectedWith(AuthorizationError);

      await expect(canDeleteUser({ user: true, admin: true })).to.be.fulfilled;
      await expect(canDeleteUser({})).to.be.rejectedWith(AuthorizationError);
      await expect(canDeleteUser({ user: true, admin: false })).to.be.rejectedWith(AuthorizationError);
    });

  });

});
