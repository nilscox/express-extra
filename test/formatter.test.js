const expect = require('./expect');
const { Formatter, errors } = require('../index');

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

});
