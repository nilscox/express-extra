const app = require('./src/app');
const { Author, Book } = require('./src/db');

const PORT = parseInt(process.env.DEMO_PORT) || 4242;

(async () => {
  try {
    await Author.sync({ force: true });
    await Book.sync({ force: true });

    app.listen(PORT, () => {
      console.log(`server started on port ${PORT}`);
    });
  } catch (e) {
    console.error(e);
  }
})();
