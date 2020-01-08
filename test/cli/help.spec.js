'use strict';

const path = require('path');
const { execCommand } = require('cli-testlab');

const cliPkg = require('../../package');
const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

describe('help', () => {
  it('Prints help', () => {
    return execCommand(`node ${KNEX} --help`, {
      expectedOutput: 'Usage',
    });
  });

  it('Prints help using -h flag', () => {
    return execCommand(`node ${KNEX} -h`, {
      expectedOutput: 'Usage',
    });
  });

  it('Prints help when no arguments are given', () => {
    return execCommand(`node ${KNEX}`, {
      expectedOutput: 'Usage',
    });
  });

  it('Does not print help when argument is given', () => {
    return execCommand(`node ${KNEX} -V`).then(({ stdout, _ }) => {
      expect(stdout).to.not.include('Usage');
    });
  });
});
