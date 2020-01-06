'use strict';

const path = require('path');
const { FileTestHelper, execCommand } = require('cli-testlab');

const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

describe('knexfile resolution', () => {
  /**
   * @type FileTestHelper
   */
  let fileHelper;
  beforeEach(() => {
    fileHelper = new FileTestHelper(path.resolve(__dirname, '../jake-util'));
    fileHelper.deleteFile('test.sqlite3');
    fileHelper.registerForCleanup('test.sqlite3');
  });

  afterEach(() => {
    fileHelper.cleanup();
  });

  before(() => {
    process.env.KNEX_PATH = '../knex.js';
  });

  it('Run migrations with knexfile passed', () => {
    return execCommand(
      `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js`,
      {
        expectedOutput: 'Batch 1 run: 1 migrations',
      }
    );
  });

  it('Resolves migrations relatively to knexfile', () => {
    return execCommand(
      `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile-relative/knexfile.js --knexpath=../knex.js`,
      {
        expectedOutput: 'Batch 1 run: 2 migrations',
      }
    );
  });

  it('Throws informative error when no knexfile is found', () => {
    return execCommand(`node ${KNEX} migrate:latest --knexpath=../knex.js`, {
      expectedErrorMessage: 'No configuration file found',
    });
  });

  it('Resolves default knexfile in working directory correctly', () => {
    const path = process.cwd() + '/knexfile.js';
    fileHelper.createFile(
      path,
      `
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/test/jake-util/test.sqlite3',
  },
  migrations: {
    directory: __dirname + '/test//jake-util/knexfile_migrations',
  },
};
    `,
      { isPathAbsolute: true }
    );

    return execCommand(`node ${KNEX} migrate:latest --knexpath=../knex.js`, {
      expectedOutput: 'Batch 1 run: 1 migrations',
    });
  });

  context('--cwd is specified', function() {
    context('and --knexfile is also specified', function() {
      it('uses the indicated knexfile', function() {
        // Notice: the Knexfile is using Typescript.  This means that Knex
        // is pre-loading the appropriate Typescript modules before loading
        // the Knexfile.
        return execCommand(
          `node ${KNEX} migrate:latest --cwd=test/jake-util/knexfile --knexfile=test/jake-util/knexfile-ts/custom-config.ts`,
          {
            expectedOutput: 'Batch 1 run: 1 migrations',
          }
        );
      });
    });

    context('but --knexfile is NOT specified', function() {

      it('resolves knexfile relative to the specified cwd', () => {
        return execCommand(
          `node ${KNEX} migrate:latest --cwd=test/jake-util/knexfile`,
          {
            expectedOutput: 'Batch 1 run: 1 migrations',
          }
        );
      });

    });

  });

});
