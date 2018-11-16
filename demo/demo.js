const request = require('superagent');

const agent = request.agent();

const r = async (method, route, opts = {}) => {
  let res = null;

  res = {
    GET: agent.get.bind(agent),
    POST: agent.post.bind(agent),
  }[method]('localhost:4242' + route);

  if (opts.headers)
    Object.keys(opts.headers).map(k => res = res.set(k, opts.headers[k]))

  if (opts.body)
    res = res.send(opts.body);

  try {
    res = await res;
  } catch (e) {
    if (!e.response)
      throw e;

    res = e.response;
  }

  console.log(method, route, res.status);

  if (opts && opts.body)
    console.log(JSON.stringify(opts.body, 2, 2));

  if (res.type.match(/^text\//))
    console.log(res.text);
  else if (res.type.match(/\/json$/))
    console.log(JSON.stringify(res.body, 2, 2));

  console.log();
};

const get = (route, opts) => r('GET', route, opts);
const post = (route, opts) => r('POST', route, opts);

const main = async () => {
  await get('/api/author');
  await get('/api/book');
  await get('/api/book/2');

  await post('/api/author', {
    headers: { token: 'zorglub' },
    body: {
      firstname: 'Gorges',
      lastname: 'Martin',
      middlename: 'R.R.'
    },
  });

  await get('/api/author');
  await get('/api/author/1');

  await post('/api/book', {
    headers: { token: 'zorglub' },
    body: {
      title: 'Game of thrones',
      EAN: '1234567890123',
      nbPages: 645,
      authorId: 1,
    },
  });

  await post('/api/book', {
    headers: { token: 'zorglub' },
    body: {
      title: 'The hichicker\'s guide to the galaxy',
      EAN: '1230123456789',
      nbPages: 137,
      author: {
        firstname: 'Douglas',
        lastname: 'Adams',
      },
    },
  });

  await post('/api/book', {
    headers: { token: 'zorglub' },
    body: {
      title: 'Dirk Genlty\'s holistic detective agency',
      EAN: '1231234567890',
      nbPages: 239,
      authorId: 2,
    },
  });

  await post('/api/book', {
    headers: { token: 'zorglub' },
    body: {
      title: null,
      nbPages: -8,
      author: {
        firstname: true,
        lastname: '   ',
      },
    },
  });

  await get('/api/book');
  await get('/api/book/1');
  await get('/api/author/2');

  await post('/api/book/1/rent');
  await post('/api/book/1/rent');
  await post('/api/book/2/rent');
  await post('/api/book/3/rent');

  await post('/api/book/2/return');
  await post('/api/book/3/rent');

  await post('/api/book/2/rent');
  await post('/api/book/2/rent', {
    headers: { token: 'zorglub' },
  });
};

(async () => {
  try { await main() }
  catch (e) { console.error(e); }
})();
