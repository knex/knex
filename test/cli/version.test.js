'use strict';

const path = require('path');
const { execCommand } = require('cli-testlab');

const cliPkg = require('../../package');
const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

describe('version', () => {
  it('Print correct knex CLI version', () => {
    const expectedKnexCliVersion = cliPkg.version;

    return execCommand(`node ${KNEX} --version`, {
      expectedOutput: expectedKnexCliVersion,
    });
  });

  it('Print correct knex CLI version using -V flag', () => {
    const expectedKnexCliVersion = cliPkg.version;

    return execCommand(`node ${KNEX} -V`, {
      expectedOutput: expectedKnexCliVersion,
    });
  });
});
