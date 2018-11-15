const fs = require('fs');
const request = require('supertest');
const app = require('../src/app');
const { Author, Book } = require('../src/db');

describe('demo', () => {

  before(async () => {
    await Author.sync({ force: true });
    await Book.sync({ force: true });
  });

  after(done => {
    if (process.env.DEMO_DB)
      fs.unlink(process.env.DEMO_DB, done);
    else
      done();
  });


  const agent = request.agent(app);

  const GM = { id: 1, name: 'Gorges MARTIN' };
  const DA = { id: 2, name: 'Douglas ADAMS' };

  const GOT = { id: 1, title: 'Game of thrones', nbPages: 645 };
  const H2G2 = { id: 2, title: 'The hichicker\'s guide to the galaxy', nbPages: 137 };
  const DG = { id: 3, title: 'Dirk Genlty\'s holistic detective agency', nbPages: 239 };


  it('demo', async () => {
    await agent.get('/api/author')
      .expect(200, []);

    await agent.get('/api/book')
      .expect(200, []);

    await agent.post('/api/author')
      .set('token', 'zorglub')
      .send({ firstname: 'Gorges', lastname: 'Martin' })
      .expect(201, GM);

    await agent.get('/api/author')
      .expect(200, [{ ...GM, books: [] }]);

    await agent.get('/api/author/1')
      .expect(200, { ...GM, books: [] });

    await agent.post('/api/book')
      .set('token', 'zorglub')
      .send({
        title: 'Game of thrones',
        EAN: '1234567890123',
        nbPages: 645,
        authorId: 1,
      })
      .expect(201, { ...GOT, author: GM });

    await agent.post('/api/book')
      .set('token', 'zorglub')
      .send({
        title: 'The hichicker\'s guide to the galaxy',
        EAN: '1230123456789',
        nbPages: 137,
        author: {
          firstname: 'Douglas',
          lastname: 'Adams',
        },
      })
      .expect(201, { ...H2G2, author: DA });

    await agent.post('/api/book')
      .set('token', 'zorglub')
      .send({
        title: 'Dirk Genlty\'s holistic detective agency',
        EAN: '1231234567890',
        nbPages: 239,
        authorId: 2,
      })
      .expect(201, { ...DG, author: DA });

    await agent.get('/api/book')
      .expect(200, [{ ...GOT, author: GM }, { ...H2G2, author: DA }, { ...DG, author: DA }]);

    await agent.get('/api/book/1')
      .expect(200, { ...GOT, author: GM });

    await agent.get('/api/author/2')
      .expect(200, { ...DA, books: [H2G2, DG] });
  });

});
