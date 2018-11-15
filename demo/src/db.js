const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  operatorsAliases: false,
  storage: process.env.DEMO_DB || './database.sqlite',
  logging: () => {},
});

const Author = sequelize.define('author', {
  firstname: Sequelize.STRING,
  lastname: Sequelize.STRING,
});

const Book = sequelize.define('book', {
  title: Sequelize.STRING,
  nbPages: Sequelize.INTEGER,
  EAN: Sequelize.STRING,
});

Author.hasMany(Book);
Book.belongsTo(Author);

module.exports = {
  Author,
  Book,
};
