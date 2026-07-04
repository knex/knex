'use strict';

const { expect } = require('chai');
const { KnexfileRuntimeError } = require('../../bin/knexfile-runtime-error');

describe('KnexfileRuntimeError.message', () => {
  it('includes the failure reason', () => {
    expect(
      new KnexfileRuntimeError('something broke', 'path', new Error('foo'))
        .message
    ).to.include('something broke');
    expect(
      new KnexfileRuntimeError('something broke', 'path', null).message
    ).to.include('something broke');
  });
  it('includes the source error', () => {
    const source = new Error('source error');
    const err = new KnexfileRuntimeError('something broke', 'path', source);
    expect(err.message).to.include(source.stack);
  });
  it('formats unexpected caught values', () => {
    const err = new KnexfileRuntimeError('something broke', 'path', {
      foo: 'bar',
    });
    expect(err.message).to.match(/something broke/);
    expect(err.message).to.match(/A non-Error value was thrown/);
    expect(err.message).to.match(/\{.*foo.*bar.*\}/s);
  });
});
