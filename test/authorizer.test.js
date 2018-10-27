const expect = require('./expect');
const { Authorizer, errors } = require('../index');

const { AuthorizationError } = errors;
const { and, or, not } = Authorizer;

describe('Authorizer', () => {

  it('should call an authorizer function', async () => {
    let called = [false, false, false];

    const authorize1 = Authorizer((data) => {
      called[0] = true;
      expect(data).to.have.property('pi', 3.1);
    });

    const authorize2 = Authorizer((data) => {
      called[1] = true;
      expect(data).to.have.property('pi', 3.1);
      throw new AuthorizationError();
    });

    const authorize3 = Authorizer((data) => {
      called[2] = true;
      expect(data).to.have.property('pi', 3.1);
      return false;
    }, 'some message');

    await expect(authorize1({ pi: 3.1 })).to.be.fulfilled;
    expect(called[0]).to.be.true;

    await expect(authorize2({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
    expect(called[1]).to.be.true;

    await expect(authorize3({ pi: 3.1 })).to.be.rejectedWith('some message');
    expect(called[2]).to.be.true;
  });

  it('should process an authorizer array', async () => {
    let calleds = [[false, false], [false, false], [false, false]];

    const authorize1 = Authorizer([
      (data) => calleds[0][0] = true,
      (data) => calleds[0][1] = true,
    ]);

    const authorize2 = Authorizer([
      (data) => {
        calleds[1][0] = true;
        throw new AuthorizationError();
      },
      (data) => calleds[1][1] = true,
    ]);

    const authorize3 = Authorizer([
      (data) => calleds[2][0] = true,
      (data) => {
        calleds[2][1] = true;
        throw new AuthorizationError();
      },
    ]);

    await expect(authorize1({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[0]).to.deep.eql([true, true]);

    await expect(authorize2({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
    expect(calleds[1]).to.deep.eql([true, false]);

    await expect(authorize3({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
    expect(calleds[2]).to.deep.eql([true, true]);
  });

  it('should process an authorize with logical not', async () => {
    let called = [false, false, false];

    const authorize1 = not((data) => {
      called[0] = true;
      expect(data).to.have.property('pi', 3.1);
    });

    const authorize2 = not((data) => {
      called[1] = true;
      expect(data).to.have.property('pi', 3.1);
      throw new AuthorizationError();
    });

    const authorize3 = not((data) => {
      called[2] = true;
      expect(data).to.have.property('pi', 3.1);
    }, 'some message');

    await expect(authorize1({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
    expect(called[0]).to.be.true;

    await expect(authorize2({ pi: 3.1 })).to.be.fulfilled;
    expect(called[1]).to.be.true;

    await expect(authorize3({ pi: 3.1 })).to.be.rejectedWith('some message');
    expect(called[2]).to.be.true;
  });

  it('should process an authorizer with logical and', async () => {
    let calleds = [[false, false], [false, false], [false, false], [false, false]];

    const authorize1 = Authorizer(and([
      (data) => calleds[0][0] = true,
      (data) => calleds[0][1] = true,
    ]));

    const authorize2 = Authorizer(and([
      (data) => {
        calleds[1][0] = true;
        throw new AuthorizationError();
      },
      (data) => calleds[1][1] = true,
    ]));

    const authorize3 = Authorizer(and([
      (data) => calleds[2][0] = true,
      (data) => {
        calleds[2][1] = true;
        throw new AuthorizationError();
      },
    ]));

    const authorize4 = Authorizer(and([
      (data) => {
        calleds[3][0] = true;
        throw new AuthorizationError();
      },
      (data) => {
        calleds[3][1] = true;
        throw new AuthorizationError();
      },
    ]));

    await expect(authorize1({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[0]).to.deep.eql([true, true]);

    await expect(authorize2({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
    expect(calleds[1]).to.deep.eql([true, false]);

    await expect(authorize3({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
    expect(calleds[2]).to.deep.eql([true, true]);

    await expect(authorize4({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
    expect(calleds[3]).to.deep.eql([true, false]);
  });

  it('should process an authorizer with logical or', async () => {
    let calleds = [[false, false], [false, false], [false, false], [false, false]];

    const authorize1 = Authorizer(or([
      (data) => calleds[0][0] = true,
      (data) => calleds[0][1] = true,
    ]));

    const authorize2 = Authorizer(or([
      (data) => {
        calleds[1][0] = true;
        throw new AuthorizationError();
      },
      (data) => calleds[1][1] = true,
    ]));

    const authorize3 = Authorizer(or([
      (data) => calleds[2][0] = true,
      (data) => {
        calleds[2][1] = true;
        throw new AuthorizationError();
      },
    ]));

    const authorize4 = Authorizer(or([
      (data) => {
        calleds[3][0] = true;
        throw new AuthorizationError();
      },
      (data) => {
        calleds[3][1] = true;
        throw new AuthorizationError();
      },
    ]));

    await expect(authorize1({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[0]).to.deep.eql([true, false]);

    await expect(authorize2({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[1]).to.deep.eql([true, true]);

    await expect(authorize3({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[2]).to.deep.eql([true, false]);

    await expect(authorize4({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
    expect(calleds[3]).to.deep.eql([true, true]);
  });

  it('should process an authorizer with mixed and and or', async () => {
    let calleds = [[false, false, false], [false, false, false, false]];
    const authorize1 = Authorizer(and([
      (data) => calleds[0][0] = true,
      or([
        (data) => calleds[0][1] = true,
        (data) => calleds[0][2] = true,
      ]),
    ]));

    const authorize2 = Authorizer(or([
      (data) => {
        calleds[1][0] = true;
        throw new AuthorizationError();
      },
      and([
        (data) => calleds[1][1] = true,
        (data) => calleds[1][2] = true,
      ]),
      (data) => {
        calleds[1][3] = true;
        throw new AuthorizationError();
      },
    ]));

    await expect(authorize1({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[0]).to.deep.eql([true, true, false]);

    await expect(authorize2({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[1]).to.deep.eql([true, true, true, false]);
  });

  it('should not process an invalid object', async () => {
    await expect(Authorizer({})({ pi: 3.1 })).to.be.rejectedWith(/missing operator/);
    await expect(Authorizer({ op: true })({ pi: 3.1 })).to.be.rejectedWith(/invalid operator true/);
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
      const adminAuthorizer = Authorizer(data => data.isAdmin === true);

      await expect(adminAuthorizer({ isAdmin: true })).to.be.fulfilled;
      await expect(adminAuthorizer({ isAdmin: false })).to.be.rejectedWith(AuthorizationError);
    });

    it('logical operators', async () => {
      const isSignedIn = data => data.user !== undefined;
      const isAdmin = data => data.admin === true;

      const canCreateUser = Authorizer(
        or([
          not(isSignedIn),
          isAdmin,
        ]),
      );

      const canDeleteUser = Authorizer(
        and([
          isSignedIn,
          isAdmin,
        ]),
      );

      await expect(canCreateUser({})).to.be.fulfilled;
      await expect(canCreateUser({ user: true, admin: true })).to.be.fulfilled;
      await expect(canCreateUser({ user: true })).to.be.rejectedWith(AuthorizationError);

      await expect(canDeleteUser({ user: true, admin: true })).to.be.fulfilled;
      await expect(canDeleteUser({})).to.be.rejectedWith(AuthorizationError);
      await expect(canDeleteUser({ user: true, admin: false })).to.be.rejectedWith(AuthorizationError);
    });

  });

});
