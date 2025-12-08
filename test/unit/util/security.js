const { expect } = require('chai');
const { setHiddenProperty } = require('../../../lib/util/security');

describe('setHiddenProperty', () => {
  it('hides password property when only target object is passed', () => {
    const target = { password: 'xyz' };
    expect(Object.keys(target)).to.contain('password'); // sanity check

    setHiddenProperty(target);
    expect(Object.keys(target)).to.not.contain('password');

    // Although not enumerable, it is still present
    expect(target).to.have.property('password');
    expect(target.password).to.equal('xyz');
  });

  it('sets property from source even when it is not enumerable', () => {
    const source = Object.create(
      {},
      {
        password: {
          enumerable: false,
          value: 'xyz',
        },
      }
    );

    expect(Object.keys(source)).to.not.contain('password'); // sanity check
    expect(source).to.have.property('password'); // sanity check
    expect(source.password).to.equal('xyz'); // sanity check

    const target = {};
    setHiddenProperty(target, source);

    expect(Object.keys(target)).to.not.contain('password');
    expect(target).to.have.property('password');
    expect(target.password).to.equal('xyz');
  });
});
