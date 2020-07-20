'use strict';

const path = require('path');
const { execCommand } = require('cli-testlab');

const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

describe('seed:run', () => {
  before(() => {
    process.env.KNEX_PATH = '../knex.js';
  });

  it('prints non verbose logs', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile.js`,
      {
        expectedOutput: 'Ran 2 seed files',
        notExpectedOutput: ['first.js', 'second.js'],
      }
    );
  });

  it('supports async configuration', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile-async.js`,
      {
        expectedOutput: 'Ran 2 seed files',
        notExpectedOutput: ['first.js', 'second.js'],
      }
    );
  });

  it('prints verbose logs', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile.js --verbose`,
      {
        expectedOutput: ['Ran 2 seed files', 'first.js', 'second.js'],
      }
    );
  });

  it('runs specific file', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile.js --specific=second.js`,
      {
        expectedOutput: 'Ran 1 seed files',
        notExpectedOutput: ['first.js', 'second.js'],
      }
    );
  });

  it('handles seeding errors correctly', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-error-knexfile.js`,
      {
        expectedErrorMessage: ['Error while executing', 'seeds.js', 'Boom'],
      }
    );
  });

  it('runs "esm" files', () => {
    return execCommand(
      `node ${KNEX} --esm seed:run --knexfile=test/jake-util/knexfile-esm/knexfile.js`,
      {
        expectedOutput: 'Ran 1 seed files',
        notExpectedOutput: ['first.js', 'second.js'],
      }
    );
  });

  it('runs "esm" files from "module"', () => {
    const cwd = path.resolve(__dirname, '../jake-util/knexfile-esm-module');
    return execCommand(
      `node ${KNEX} --cwd=${cwd} --esm seed:run --knexfile=./knexfile.js`,
      {
        expectedOutput: 'Ran 1 seed files',
        notExpectedOutput: ['first.js', 'second.js'],
      }
    );
  });

  it('throws when runs "esm" files from "module" without --esm flag', () => {
    const cwd = path.resolve(__dirname, '../jake-util/knexfile-esm-module');
    const version = Number((/v(\d+)/i.exec(process.version) || [])[1]);
    return execCommand(
      `node ${KNEX} --cwd=${cwd} seed:run --knexfile=./knexfile.js`,
      {
        expectedErrorMessage:
          version === 10
            ? 'Unexpected token export'
            : 'Must use import to load ES Module',
      }
    );
  });
});
