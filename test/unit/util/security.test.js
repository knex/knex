const { setHiddenProperty } = require('../../../lib/util/security');

describe('setHiddenProperty', () => {
  it('hides password property when only target object is passed', () => {
    const target = { password: 'xyz' };
    expect(Object.keys(target)).toContain('password'); // sanity check

    setHiddenProperty(target);
    expect(Object.keys(target)).not.toContain('password');

    // Although not enumerable, it is still present
    expect(target).toHaveProperty('password');
    expect(target.password).toBe('xyz');
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

    expect(Object.keys(source)).not.toContain('password'); // sanity check
    expect(source).toHaveProperty('password'); // sanity check
    expect(source.password).toBe('xyz'); // sanity check

    const target = {};
    setHiddenProperty(target, source);

    expect(Object.keys(target)).not.toContain('password');
    expect(target).toHaveProperty('password');
    expect(target.password).toBe('xyz');
  });
});
