const expect = require('./expect');
const { Authorizer, errors } = require('../index');

const { AuthorizationError } = errors;

describe('Authorizer', () => {

  it('should call an authorizer function', async () => {
    let called = false;
    const authorize = Authorizer((data) => {
      called = true;
      expect(data).to.have.property('pi', 3.1);
    });

    await authorize({ pi: 3.1 });
    expect(called).to.be.true;
  });

  it('should call a failing authorizer function', async () => {
    const authorize = Authorizer((data) => {
      throw new AuthorizationError();
    });

    await expect(authorize({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
  });

  it('should process an authorizer array', async () => {
    let calleds = [false, false];
    const authorize = Authorizer([
      (data) => {
        calleds[0] = true;
        expect(data).to.have.property('pi', 3.1);
      },
      (data) => {
        calleds[1] = true;
        expect(data).to.have.property('pi', 3.1);
      },
    ]);

    await authorize({ pi: 3.1 });
    expect(calleds).to.deep.eql([true, true]);
  });

  it('should process an authorizer array, first item failing', async () => {
    let calleds = [false, false];
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

  it('should process an authorizer array, second item failing', async () => {
    let calleds = [false, false];
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

  it('should process an authorizer object with and', async () => {
    let calleds = [[false, false], [false, false]];
    const authorize1 = Authorizer({
      and: [
        (data) => {
          calleds[0][0] = true;
          throw new AuthorizationError();
        },
        (data) => calleds[0][1] = true,
      ],
    });

    const authorize2 = Authorizer({
      and: [
        (data) => calleds[1][0] = true,
        (data) => {
          calleds[1][1] = true;
          throw new AuthorizationError();
        },
      ],
    });

    await expect(authorize1({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
    expect(calleds[0]).to.deep.eql([true, false]);

    await expect(authorize2({ pi: 3.1 })).to.be.rejectedWith(AuthorizationError);
    expect(calleds[1]).to.deep.eql([true, true]);
  });

  it('should process an authorizer object with or', async () => {
    let calleds = [[false, false], [false, false]];
    const authorize1 = Authorizer({
      or: [
        (data) => {
          calleds[0][0] = true;
          throw new AuthorizationError();
        },
        (data) => calleds[0][1] = true,
      ],
    });

    const authorize2 = Authorizer({
      or: [
        (data) => calleds[1][0] = true,
        (data) => {
          calleds[1][1] = true;
          throw new AuthorizationError();
        },
      ],
    });

    await expect(authorize1({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[0]).to.deep.eql([true, true]);

    await expect(authorize2({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[1]).to.deep.eql([true, false]);
  });

  it('should process an authorizer object with mixed and and or', async () => {
    let calleds = [[false, false, false, false], [false, false, false, false]];
    const authorize1 = Authorizer({
      and: [
        (data) => calleds[0][0] = true,
        (data) => calleds[0][1] = true,
      ],
      or: [
        (data) => calleds[0][2] = true,
        (data) => calleds[0][3] = true,
      ],
    });

    const authorize2 = Authorizer({
      or: [
        (data) => calleds[1][0] = true,
        (data) => calleds[1][1] = true,
      ],
      and: [
        (data) => calleds[1][2] = true,
        (data) => calleds[1][3] = true,
      ],
    });

    await expect(authorize1({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[0]).to.deep.eql([true, true, false, false]);

    await expect(authorize2({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[1]).to.deep.eql([true, false, false, false]);
  });

  it('should process an authorizer object with mixed and and or, first one failing', async () => {
    let calleds = [[false, false, false, false], [false, false, false, false]];
    const authorize1 = Authorizer({
      and: [
        (data) => {
          calleds[0][0] = true;
          throw new AuthorizationError();
        },
        (data) => calleds[0][1] = true,
      ],
      or: [
        (data) => {
          calleds[0][2] = true;
          throw new AuthorizationError();
        },
        (data) => calleds[0][3] = true,
      ],
    });

    const authorize2 = Authorizer({
      or: [
        (data) => {
          calleds[1][0] = true;
          throw new AuthorizationError();
        },
        (data) => calleds[1][1] = true,
      ],
      and: [
        (data) => {
          calleds[1][2] = true;
          throw new AuthorizationError();
        },
        (data) => calleds[1][3] = true,
      ],
    });

    await expect(authorize1({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[0]).to.deep.eql([true, false, true, true]);

    await expect(authorize2({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[1]).to.deep.eql([true, true, false, false]);
  });

  it('should process an authorizer object with mixed and and or, second one failing', async () => {
    let calleds = [[false, false, false, false], [false, false, false, false]];
    const authorize1 = Authorizer({
      and: [
        (data) => calleds[0][0] = true,
        (data) => {
          calleds[0][1] = true;
          throw new AuthorizationError();
        },
      ],
      or: [
        (data) => calleds[0][2] = true,
        (data) => {
          calleds[0][3] = true;
          throw new AuthorizationError();
        },
      ],
    });

    const authorize2 = Authorizer({
      or: [
        (data) => calleds[1][0] = true,
        (data) => {
          calleds[1][1] = true;
          throw new AuthorizationError();
        },
      ],
      and: [
        (data) => calleds[1][2] = true,
        (data) => {
          calleds[1][3] = true;
          throw new AuthorizationError();
        },
      ],
    });

    await expect(authorize1({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[0]).to.deep.eql([true, true, true, false]);

    await expect(authorize2({ pi: 3.1 })).to.be.fulfilled;
    expect(calleds[1]).to.deep.eql([true, false, false, false]);
  });

  it.skip('should process an authorizer object with nested objects', async () => {
    // TODO
  });

  it('should faild processing an authorizer object with an unexpected key', async () => {
    const authorize = Authorizer({ some: [] });

    await expect(authorize({ pi: 3.1 })).to.be.rejectedWith(/invalid operator some/)
  });

});
