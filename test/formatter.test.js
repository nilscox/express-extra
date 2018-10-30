const expect = require('./expect');
const { Formatter } = require('../index');

describe('Formatter', () => {

  it('should format an object', async () => {
    const format = Formatter({
      message: data => data.msg.toUpperCase(),
      integer: data => Math.round(data.number),
    });

    expect(await format({ msg: 'Coucou !', number: 42.69 })).to.deep.eql({ message: 'COUCOU !', integer: 43 });
  });

  it('should format multiple objects', async () => {
    const format = Formatter({
      message: data => data.msg.toUpperCase(),
      integer: data => Math.round(data.number),
    });

    expect(await format.many([
      { msg: 'Coucou !', number: 42.69 },
      { msg: 'yo', number: 12.34 },
    ], { many: true })).to.deep.eql([
      { message: 'COUCOU !', integer: 43 },
      { message: 'YO', integer: 12 },
    ]);
  });

  it('should forward opts to the formatter function', async () => {
    const format = Formatter({
      message: (data, opts) => {
        expect(opts).to.have.property('yo', 'lo');
        return 'loyo';
      },
    });

    expect(await format({}, { yo: 'lo' })).to.deep.eql({ message: 'loyo' });
  });

  it('should format nested objects', async () => {
    const itemFormatter = Formatter({
      message: data => data.msg.toUpperCase(),
    });

    const formatter = Formatter({
      item: data => itemFormatter(data.item),
      items: data => itemFormatter.many(data.items),
    });

    expect(await formatter({
      item: { msg: 'Coucou !'},
      items: [
        { msg: 'yo'},
        { msg: 'lo'},
      ],
    })).to.deep.eql({
      item: { message: 'COUCOU !' },
      items: [
        { message: 'YO' },
        { message: 'LO' },
      ],
    });
  });

  describe('readme example', () => {

    const userFormatter = Formatter({
      fullName: user => {
        return user.firstName + ' ' + user.lastName.toUpperCase();
      },
      age: user => {
        if (user.age < 18)
          return;

        return user.age;
      },
      email: user => user.email,
    });

    it('object formatter', async () => {
      const user = await userFormatter({
        firstName: 'Mano',
        lastName: 'Cox',
        age: 16,
        email: 'mano@cox.tld',
      });

      expect(user).to.deep.eql({ fullName: 'Mano COX', email: 'mano@cox.tld' });
    });

    it('object formatter, multiple', async () => {
      const users = await userFormatter.many([
        { firstName: 'Mano', lastName: 'Cox', age: 16, email: null },
        { firstName: 'nain', lastName: 'djardin', age: 24, email: null },
      ]);

      expect(users).to.deep.eql([
        { fullName: 'Mano COX', email: null },
        { fullName: 'nain DJARDIN', age: 24, email: null },
      ]);
    });

    it('nesting formatters', async () => {
      const itemFormatter = Formatter({
        name: item => item.name,
        shape: item => item.shape === 1 ? 'square' : 'not square',
      });

      const userFormatter = Formatter({
        firstName: user => user.firstName,
        item: user => itemFormatter(user.item),
        friends: user => {
          if (!user.friends)
            return [];

          return userFormatter.many(user.friends);
        },
      });

      const user = await userFormatter({
        firstName: 'jondo',
        item: {
          name: 'sword',
          shape: 8,
        },
        friends: [
          {
            firstName: 'janda',
            item: {
              name: 'earth',
              shape: 1,
            },
            friends: null,
          },
        ],
      });

      expect(user).to.deep.eql({
        firstName: 'jondo',
        item: { name: 'sword', shape: 'not square' },
        friends: [
          {
            firstName: 'janda',
            item: { name: 'earth', shape: 'square' },
            friends: [],
          },
        ],
      });
    });

    it('parameterized formatters', async () => {
      const userFormatter = Formatter({
        email: (user, opts) => {
          if (opts.hideEmail)
            return '*****';

          return user.email;
        },
      });

      const user = await userFormatter({ email: 'mano@cox.tld' }, { hideEmail: true });

      expect(user).to.deep.eql({ email: '*****' });
    });

  });

});
