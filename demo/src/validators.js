const { Validator, ValueValidator, ValidationError, MissingValueError } = require('express-extra');
const { Author } = require('./db');

const stringTrim = () => value => value.trim();

const stringNotEmtpy = () => value => {
  if (value === '')
    throw new ValidationError('this field must not be empty');
};

const numberPositive = () => value => {
  if (value < 0)
    throw new ValidationError('this field must be positive');
}

const stringIsEAN = () => value => {
  if (value.length !== 13)
    throw new ValidationError('this field must be 13 charaters');

  for (let i = 0; i < value.length; ++i) {
    if (value[i] != ~~value[i])
      throw new ValidationError('this field must be only numbers');
  }
};

const authorValidator = Validator({
  firstname: ValueValidator({
    type: 'string',
    required: true,
    validate: [
      stringTrim(),
      stringNotEmtpy(),
    ],
  }),
  lastname: ValueValidator({
    type: 'string',
    required: true,
    validate: (value, opts) => ([
      stringTrim(),
      stringNotEmtpy(),
    ]),
  }),
});

const bookValidator = Validator({
  title: ValueValidator({
    type: 'string',
    required: true,
    validate: [
      stringTrim(),
      stringNotEmtpy(),
    ],
  }),
  nbPages: ValueValidator({
    type: 'number',
    required: true,
    validate: numberPositive(),
  }),
  EAN: ValueValidator({
    type: 'string',
    required: true,
    validate: stringIsEAN(),
  }),
  authorId: ValueValidator({
    type: 'number',
    required: false,
    validate: async value => {
      const author = await Author.findByPk(value);

      if (!author)
        throw new ValidationError('author not found');
    },
  }),
  author: ValueValidator({
    type: 'Author',
    required: false,
    validate: authorValidator,
  }),
}, async data => {
  if (!data.authorId && !data.author)
    throw new MissingValueError(null, 'authorId');

  if (data.authorId && data.author)
    delete data.author;
});

module.exports = {
  authorValidator,
  bookValidator,
};
