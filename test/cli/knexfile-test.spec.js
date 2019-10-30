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
        expectedOutput: 'Already up to date',
      }
    );
  });

  it('Throws informative error when no knexfile is found', () => {
    return execCommand(`node ${KNEX} migrate:latest --knexpath=../knex.js`, {
      expectedErrorMessage: 'No default configuration file',
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
});

it('resolves knexfile correctly with cwd specified', () => {
  return execCommand(
    `node ${KNEX} migrate:latest --cwd=test/jake-util/knexfile --knexfile=knexfile.js`,
    {
      expectedOutput: 'Batch 1 run: 1 migrations',
    }
  );
});
