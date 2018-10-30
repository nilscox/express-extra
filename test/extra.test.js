const sinon = require('sinon');
const expect = require('./expect');
const { extra, AuthorizationError, ValidationError } = require('../index');

const runMiddlewares = async middlewares => {
  const req = { req: true };
  const res = {
    res: true,
    mock: {},
  };

  ['status', 'end', 'json', 'send'].forEach(m => {
    res[m] = sinon.spy(arg => {
      res.mock[m] = arg || true;
      return res;
    });
  });

  for (let i = 0; i < middlewares.length; ++i) {
    await new Promise((resolve, reject) => {
      middlewares[i](req, res, e => {
        if (e) reject(e);
        else resolve();
      });
    });
  }

  return { req, res };
};

describe('extra', () => {

  describe('handle', () => {

    it('should invoke the handler function that returns nothing', async () => {
      const spy = sinon.spy((req, res) => {
        expect(req).to.have.property('req', true);
        expect(res).to.have.property('res', true);
      });

      const middlewares = extra(spy);
      const { req, res } = await runMiddlewares(middlewares);

      expect(middlewares).to.have.lengthOf(1);
      expect(spy.called).to.be.true;
      expect(res.status.called).to.be.true;
      expect(res.mock.status).to.eql(204);
      expect(res.end.called).to.be.true;
    });

    it('should invoke the handler function that returns a string', async () => {
      const middlewares = extra(() => 'hello');
      const { req, res } = await runMiddlewares(middlewares);

      expect(res.send.called).to.be.true;
      expect(res.mock.send).to.eql('hello');
    });

    it('should invoke the handler function that returns an object', async () => {
      const middlewares = extra(() => ({ helli: 'hello' }));
      const { req, res } = await runMiddlewares(middlewares);

      expect(res.json.called).to.be.true;
      expect(res.mock.json).to.deep.eql({ helli: 'hello' });
    });

  });

  describe('authorization', () => {

    it('should invoke an authorization function', async () => {
      const spy = sinon.spy((req, opts) => {
        expect(req).to.have.property('req', true);
        expect(opts).to.deep.eql({ ki: 'kou' });
      });

      const middlewares = extra(() => {}, {
        authorize: spy,
        authorizeOpts: { ki: 'kou'},
      });

      const { req, res } = await runMiddlewares(middlewares);

      expect(middlewares).to.have.lengthOf(2);
      expect(spy.called).to.be.true;
    });

    it('should invoke an authorization function that throws an error', async () => {
      const spy = sinon.spy(() => {
        throw new AuthorizationError();
      });

      const middlewares = extra(() => {}, {
        authorize: spy,
      }).map(m => sinon.spy(m));

      try {
        await runMiddlewares(middlewares);
      } catch (e) {
        expect(e).to.be.an.instanceof(AuthorizationError);
      } finally {
        expect(middlewares).to.have.lengthOf(2);
        expect(spy.called).to.be.true;
      }
    });

  });

  describe('validation', () => {

    it('should invoke a validation function', async () => {
      const spy = sinon.spy((req, opts) => {
        expect(req).to.have.property('req', true);
        expect(opts).to.deep.eql({ ki: 'kou' });

        return 'valid';
      });

      const middlewares = extra(() => {}, {
        validate: spy,
        validateOpts: { ki: 'kou'},
      });

      const { req, res } = await runMiddlewares(middlewares);

      expect(middlewares).to.have.lengthOf(2);
      expect(spy.called).to.be.true;
      expect(req.validated).to.equal('valid');
    });

    it('should invoke a validation function that throws an error', async () => {
      const spy = sinon.spy(() => {
        throw new ValidationError();
      });

      const middlewares = extra(() => {}, {
        validate: spy,
      }).map(m => sinon.spy(m));

      try {
        await runMiddlewares(middlewares);
      } catch (e) {
        expect(e).to.be.an.instanceof(ValidationError);
      } finally {
        expect(middlewares).to.have.lengthOf(2);
        expect(spy.called).to.be.true;
      }
    });

  });

  describe('before / after hooks', () => {

    // TODO, but I think it works

  });

  describe('format', () => {

    it('should invoke a formatting function', async () => {
      const spy = sinon.spy((data, opts) => {
        expect(data).to.have.property('some', 'data');
        expect(opts).to.deep.eql({ ki: 'kou' });

        return { some: data.some.toUpperCase() };
      });

      const middlewares = extra(() => ({ some: 'data' }), {
        format: spy,
        formatOpts: { ki: 'kou'},
      });

      const { req, res } = await runMiddlewares(middlewares);

      expect(middlewares).to.have.lengthOf(1);
      expect(spy.called).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.mock.json).to.deep.eql({ some: 'DATA' });
    });

  });

  describe('readme examples', () => {

  });

});
