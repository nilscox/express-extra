const sinon = require('sinon');
const expect = require('./expect');
const { extra, AuthorizationError, ValidationError } = require('../index');

const runMiddlewares = async middlewares => {
  const req = { req: true };
  const res = {
    res: true,
    mock: {},
  };

  for (let i = 0; i < middlewares.length; ++i) {
    await new Promise((resolve, reject) => {
      ['status', 'end', 'json', 'send'].forEach(m => {
        res[m] = sinon.spy(arg => {
          res.mock[m] = arg || true;

          if (m !== 'status')
            setTimeout(resolve, 0);

          return res;
        });
      });

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
      const spy = sinon.spy(req => {
        expect(req).to.have.property('req', true);
      });

      const middlewares = extra(() => {}, {
        authorize: spy,
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
      const spy = sinon.spy(req => {
        expect(req).to.have.property('req', true);

        return 'valid';
      });

      const middlewares = extra(() => {}, {
        validate: spy,
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

    it('should invoke the before hook before all middlewares', async () => {
      const spy = sinon.spy((req, res, next) => {
        expect(req).to.have.property('req', true);
        expect(res).to.have.property('res', true);
        expect(next).to.be.a('function');

        req.data = 42;

        next();
      });

      const middlewares = extra((req) => {
        expect(req).to.have.property('data', 42);
      }, {
        before: spy,
        authorize: req => expect(req).to.have.property('data', 42),
        validate: req => expect(req).to.have.property('data', 42),
      });

      await runMiddlewares(middlewares);

      expect(middlewares).to.have.lengthOf(4);
      expect(spy.called).to.be.true;
    });

    it('should invoke the after hook after all middlewares', async () => {
      const spy = sinon.spy((req, res, next) => {
        expect(req).to.have.property('req', true);
        expect(res).to.have.property('res', true);
        expect(next).to.be.a('function');

        next();
      });

      const middlewares = extra(() => {}, {
        after: spy,
      });

      await runMiddlewares(middlewares);

      expect(middlewares).to.have.lengthOf(2);
      expect(spy.called).to.be.true;
    });

  });

  describe('format', () => {

    it('should invoke a formatting function', async () => {
      const spy = sinon.spy(data => {
        expect(data).to.have.property('some', 'data');

        return { some: data.some.toUpperCase() };
      });

      const middlewares = extra(() => ({ some: 'data' }), {
        format: spy,
      });

      const { req, res } = await runMiddlewares(middlewares);

      expect(middlewares).to.have.lengthOf(1);
      expect(spy.called).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.mock.json).to.deep.eql({ some: 'DATA' });
    });

  });

  describe('finish', () => {

    it('should invoke the finish callback', async () => {
      const spy = sinon.spy((req, res, result) => {
        expect(req).to.have.property('req', true);
        expect(res).to.have.property('res', true);
        expect(result).to.have.property('some', 'data');
        res.end();
      });

      const middlewares = extra(() => ({ some: 'data' }), {
        finish: spy,
      });

      const { req, res } = await runMiddlewares(middlewares);

      expect(middlewares).to.have.lengthOf(1);
      expect(spy.called).to.be.true;
      expect(res.end.called).to.be.true;
    });

    it('should set a given status', async () => {
      const middlewares = extra(() => {}, {
        status: 418,
      });

      const { req, res } = await runMiddlewares(middlewares);

      expect(middlewares).to.have.lengthOf(1);
      expect(res.status.called).to.be.true;
      expect(res.mock.status).to.eql(418);
    });

    it('should finish a request with undefined', async () => {
      const middlewares = extra(() => {});

      const { req, res } = await runMiddlewares(middlewares);

      expect(middlewares).to.have.lengthOf(1);
      expect(res.mock.status).to.eql(204);
      expect(res.end.called).to.be.true;
    });

    it('should finish a request with a string', async () => {
      const middlewares = extra(() => 'hello ello');

      const { req, res } = await runMiddlewares(middlewares);

      expect(middlewares).to.have.lengthOf(1);
      expect(res.send.called).to.be.true;
    });

    it('should finish a request with something else', async () => {
      const middlewares = extra(() => 42.24);

      const { req, res } = await runMiddlewares(middlewares);

      expect(middlewares).to.have.lengthOf(1);
      expect(res.json.called).to.be.true;
    });

  });

  describe('readme examples', () => {

  });

});
