'use strict';

const { KnexfileRuntimeError } = require('../../bin/knexfile-runtime-error');

describe('KnexfileRuntimeError.message', () => {
  it('includes the failure reason', () => {
    expect(
      new KnexfileRuntimeError('something broke', 'path', new Error('foo'))
        .message
    ).toContain('something broke');
    expect(
      new KnexfileRuntimeError('something broke', 'path', null).message
    ).toContain('something broke');
  });
  it('includes the source error', () => {
    const source = new Error('source error');
    const err = new KnexfileRuntimeError('something broke', 'path', source);
    expect(err.message).toContain(source.stack);
  });
  it('formats unexpected caught values', () => {
    const err = new KnexfileRuntimeError('something broke', 'path', {
      foo: 'bar',
    });
    expect(err.message).toMatch(/something broke/);
    expect(err.message).toMatch(/A non-Error value was thrown/);
    expect(err.message).toMatch(/\{.*foo.*bar.*\}/s);
  });
});
