'use strict';

const path = require('path');
const { execCommand } = require('cli-testlab');

const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

describe('help', () => {
  it('Prints help', () => {
    return execCommand(`node ${KNEX} --help`, {
      expectedOutput: { expectedText: 'Usage', exactlyTimes: 1 },
    });
  });

  it('Prints help using -h flag', () => {
    return execCommand(`node ${KNEX} -h`, {
      expectedOutput: { expectedText: 'Usage', exactlyTimes: 1 },
    });
  });

  it('Prints help when no arguments are given', () => {
    return execCommand(`node ${KNEX}`, {
      expectedErrorMessage: 'Usage: cli [options] [command]',
    });
  });

  it('Does not print help when argument is given', () => {
    return execCommand(`node ${KNEX} -V`, {
      notExpectedOutput: 'Usage',
    });
  });
});
