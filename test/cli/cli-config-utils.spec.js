'use strict';

const path = require('path');
const { execCommand } = require('cli-testlab');

const EXIT = path.normalize(__dirname + '/_justexit.js');

describe('cli-config-utils exit()', () => {
  it('Prints Error contents', () => {
    return execCommand(`node ${EXIT} error`, {
      expectedErrorMessage: 'exit(Error)',
    });
  });
  it('Prints string contents', () => {
    return execCommand(`node ${EXIT} string`, {
      expectedErrorMessage: 'exit(string)',
    });
  });
  it('Prints stringable contents', () => {
    return execCommand(`node ${EXIT} stringable`, {
      expectedErrorMessage: [
        '[BUG] exit() was called with an unexpected value',
        'normal object',
      ],
    });
  });
  it('Prints non-stringable contents', () => {
    return execCommand(`node ${EXIT} non-stringable`, {
      expectedErrorMessage: [
        '[BUG] exit() was called with an unexpected value',
        'Object: null prototype',
        'null-prototype object',
      ],
    });
  });
});
