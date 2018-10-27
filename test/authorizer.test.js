const expect = require('./expect');
const { Authorizer, errors } = require('../index');

const { AuthorizationError } = errors;
const { and, or, not } = Authorizer;

describe('Authorizer', () => {

  describe('authorizer function', () => {

    it('should call an authorizer function 1', async () => {
      let called = false;

      const authorize = Authorizer((data) => {
        called = true;
        expect(data).to.have.property('pi', 3.1);
      });

      await expect(authorize({ pi: 3.1 })).to.be.fulfilled;
      expect(called).to.be.true;
    });

    it('should call an authorizer function 2', async () => {
      let called = false;

      const authorize = Authorizer((data) => {
        called = true;
        expect(data).to.have.property('pi', 3.1);
        throw new AuthorizationError();
      });

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
      expect(called).to.be.true;
    });

    it('should call an authorizer function 3', async () => {
      let called = false;

      const authorize = Authorizer((data) => {
        called = true;
        expect(data).to.have.property('pi', 3.1);
        return false;
      }, 'some message');

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith('some message');
      expect(called).to.be.true;
    });

  });

  describe('authorizer array', () => {

    it('should process an authorizer array, ok', async () => {
      const calleds = [false, false];

      const authorize = Authorizer([
        (data) => calleds[0] = true,
        (data) => calleds[1] = true,
      ]);

      await expect(authorize({ pi: 3.1 })).to.be.fulfilled;
      expect(calleds).to.deep.eql([true, true]);
    });

    it('should process an authorizer array, first fail', async () => {
      const calleds = [false, false];

      const authorize = Authorizer([
        (data) => {
          calleds[0] = true;
          throw new AuthorizationError();
        },
        (data) => calleds[1] = true,
      ]);

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
      expect(calleds).to.deep.eql([true, false]);
    });

    it('should process an authorizer array, first fail with a message', async () => {
      const calleds = [false, false];

      const authorize = Authorizer([
        (data) => {
          calleds[0] = true;
          return false;
        },
        (data) => calleds[1] = true,
      ], 'some message');

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith('some message');
      expect(calleds).to.deep.eql([true, false]);
    });

    it('should process an authorizer array, second fail', async () => {
      const calleds = [false, false];

      const authorize = Authorizer([
        (data) => calleds[0] = true,
        (data) => {
          calleds[1] = true;
          throw new AuthorizationError();
        },
      ]);

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
      expect(calleds).to.deep.eql([true, true]);
    });

    it('should process an authorizer array, second fail with a message', async () => {
      const calleds = [false, false];
      
      const authorize = Authorizer([
        (data) => calleds[0] = true,
        (data) => {
          calleds[1] = true;
          return false;
        },
      ], 'some message');

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith('some message');
      expect(calleds).to.deep.eql([true, true]);
    });

  });

  describe('logical not', () => {

    it('should process a logical not, fail', async () => {
      let called = false;

      const authorize = not((data) => {
        called = true;
        expect(data).to.have.property('pi', 3.1);
      });

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
      expect(called).to.be.true;
    });

    it('should process a logical not, fail with a message', async () => {
      let called = false;

      const authorize = not((data) => {
        called = true;
        expect(data).to.have.property('pi', 3.1);
      }, 'some message');

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith('some message');
      expect(called).to.be.true;
    });

    it('should process a logical not, ok', async () => {
      let called = false;

      const authorize = not((data) => {
        called = true;
        expect(data).to.have.property('pi', 3.1);
        throw new AuthorizationError();
      });

      await expect(authorize({ pi: 3.1 })).to.be.fulfilled;
      expect(called).to.be.true;
    });

  });

  describe('logical and', () => {

    it('should process a logical and, ok', async () => {
      const calleds = [false, false];

      const authorize = and([
        (data) => calleds[0] = true,
        (data) => calleds[1] = true,
      ]);

      await expect(authorize({ pi: 3.1 })).to.be.fulfilled;
      expect(calleds).to.deep.eql([true, true]);
    });

    it('should process a logical and, first fail', async () => {
      const calleds = [false, false];
 
      const authorize = and([
        (data) => {
          calleds[0] = true;
          throw new AuthorizationError();
        },
        (data) => calleds[1] = true,
      ]);

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
      expect(calleds).to.deep.eql([true, false]);
    });

    it('should process a logical and, first fail with a message', async () => {
      const calleds = [false, false];
 
      const authorize = and([
        (data) => {
          calleds[0] = true;
          return false;
        },
        (data) => calleds[1] = true,
      ], 'some message');

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith('some message');
      expect(calleds).to.deep.eql([true, false]);
    });

    it('should process a logical and, second fail', async () => {
      const calleds = [false, false];

      const authorize = and([
        (data) => calleds[0] = true,
        (data) => {
          calleds[1] = true;
          throw new AuthorizationError();
        },
      ]);

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
      expect(calleds).to.deep.eql([true, true]);
    });

    it('should process a logical and, second fail with a message', async () => {
      const calleds = [false, false];

      const authorize = and([
        (data) => calleds[0] = true,
        (data) => {
          calleds[1] = true;
          return false;
        },
      ], 'some message');

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith('some message');
      expect(calleds).to.deep.eql([true, true]);
    });

    it('should process a logical and, both fail', async () => {
      const calleds = [false, false];

      const authorize = and([
        (data) => {
          calleds[0] = true;
          throw new AuthorizationError();
        },
        (data) => {
          calleds[1] = true;
          throw new AuthorizationError();
        },
      ]);

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
      expect(calleds).to.deep.eql([true, false]);
    });

    it('should process a logical and, both fail with a message', async () => {
      const calleds = [false, false];

      const authorize = and([
        (data) => {
          calleds[0] = true;
          return false;
        },
        (data) => {
          calleds[1] = true;
          return false;
        },
      ], 'some message');

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith('some message');
      expect(calleds).to.deep.eql([true, false]);
    });

  });

  describe('logical or', () => {

    it('should process a logical or, ok', async () => {
      const calleds = [false, false];

      const authorize = or([
        (data) => calleds[0] = true,
        (data) => calleds[1] = true,
      ]);

      await expect(authorize({ pi: 3.1 })).to.be.fulfilled;
      expect(calleds).to.deep.eql([true, false]);
    });

    it('should process a logical or, first fail', async () => {
      const calleds = [false, false];
 
      const authorize = or([
        (data) => {
          calleds[0] = true;
          throw new AuthorizationError();
        },
        (data) => calleds[1] = true,
      ]);

      await expect(authorize({ pi: 3.1 })).to.be.fulfilled;
      expect(calleds).to.deep.eql([true, true]);
    });

    it('should process a logical or, first fail with a message', async () => {
      const calleds = [false, false];
 
      const authorize = or([
        (data) => {
          calleds[0] = true;
          return false;
        },
        (data) => calleds[1] = true,
      ], 'some message');

      await expect(authorize({ pi: 3.1 })).to.be.fulfilled;
      expect(calleds).to.deep.eql([true, true]);
    });

    it('should process a logical or, second fail', async () => {
      const calleds = [false, false];

      const authorize = or([
        (data) => calleds[0] = true,
        (data) => {
          calleds[1] = true;
          throw new AuthorizationError();
        },
      ]);

      await expect(authorize({ pi: 3.1 })).to.be.fulfilled;
      expect(calleds).to.deep.eql([true, false]);
    });

    it('should process a logical or, second fail with a message', async () => {
      const calleds = [false, false];

      const authorize = or([
        (data) => calleds[0] = true,
        (data) => {
          calleds[1] = true;
          return false;
        },
      ], 'some message');

      await expect(authorize({ pi: 3.1 })).to.be.fulfilled;
      expect(calleds).to.deep.eql([true, false]);
    });

    it('should process a logical or, both fail', async () => {
      const calleds = [false, false];

      const authorize = or([
        (data) => {
          calleds[0] = true;
          throw new AuthorizationError();
        },
        (data) => {
          calleds[1] = true;
          throw new AuthorizationError();
        },
      ]);

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
      expect(calleds).to.deep.eql([true, true]);
    });

    it('should process a logical or, both fail with a message', async () => {
      const calleds = [false, false];

      const authorize = or([
        (data) => {
          calleds[0] = true;
          return false;
        },
        (data) => {
          calleds[1] = true;
          return false;
        },
      ], 'some message');

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith('some message');
      expect(calleds).to.deep.eql([true, true]);
    });

  });

  describe('mixed logical operators', () => {
  
    it('should process mixed logical operators 1', async () => {
      const calleds = [false, false, false, false];
      const authorize = Authorizer(and([
        (data) => calleds[0] = true,
        not((data) => { calleds[1] = true; return false; }),
        or([
          (data) => calleds[2] = true,
          (data) => calleds[3] = true,
        ]),
      ]));

      await expect(authorize({ pi: 3.1 })).to.be.fulfilled;
      expect(calleds).to.deep.eql([true, true, true, false]);
    });

    it('should process mixed logical operators 2', async () => {
      let called = false;

      const authorize = or([
        and([
          (data) => { called = true; return false; },
        ], 'other message'),
      ], 'some message');

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith('some message');
      expect(called).to.be.true;
    });

    it('should process mixed logical operators 3', async () => {
      const calleds = [false, false, false, false, false, false, false];

      const authorize = or([
        (data) => {
          calleds[0] = true;
          throw new AuthorizationError();
        },
        and([
          (data) => calleds[1] = true,
          not((data) => { calleds[2] = true; throw new AuthorizationError(); }),
          or([
            (data) => { calleds[3] = true; return false; },
            (data) => calleds[4] = true,
            (data) => calleds[5] = true,
          ]),
          (data) => { calleds[6] = true; return false; },
        ], 'other message'),
      ], 'some message');

      await expect(authorize({ pi: 3.1 })).to.be.rejectedWith('some message');
      expect(calleds).to.deep.eql([true, true, true, true, true, false, true]);
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
