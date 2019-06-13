'use strict';

const path = require('path');
const { FileTestHelper, execCommand } = require('cli-testlab');
const expect = require('chai').expect;

const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

describe('migrate:make', () => {
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

  it('Create new migration without knexfile passed or existing in default location', () => {
    return execCommand(
      `node ${KNEX} migrate:make somename --knexpath=../knex.js`,
      {
        expectedErrorMessage:
          'Failed to resolve config file, knex cannot determine where to generate migrations',
      }
    );
  });

  it('Create new migration with js knexfile passed', () => {
    fileHelper.registerGlobForCleanup(
      'test/jake-util/knexfile_migrations/*_somename.js'
    );
    return execCommand(
      `node ${KNEX} migrate:make somename --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js`,
      {
        expectedOutput: 'Created Migration',
      }
    );
  });

  it('Create new migration with default knexfile', () => {
    fileHelper.registerGlobForCleanup(
      'test/jake-util/knexfile_migrations/*_somename.js'
    );
    fileHelper.createFile(
      process.cwd() + '/knexfile.js',
      `
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/test/jake-util/test.sqlite3',
  },
  migrations: {
    directory: __dirname + '/test/jake-util/knexfile_migrations',
  },
};    
    `,
      { isPathAbsolute: true }
    );
    return execCommand(
      `node ${KNEX} migrate:make somename --knexpath=../knex.js`,
      {
        expectedOutput: 'Created Migration',
      }
    );
  });

  it('Create new migration with default ts knexfile', () => {
    fileHelper.registerGlobForCleanup(
      'test/jake-util/knexfile_migrations/*_somename.js'
    );
    fileHelper.createFile(
      process.cwd() + '/knexfile.ts',
      `
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/test/jake-util/test.sqlite3',
  },
  migrations: {
    directory: __dirname + '/test/jake-util/knexfile_migrations',
  },
};    
    `,
      { isPathAbsolute: true }
    );
    return execCommand(
      `node ${KNEX} migrate:make somename --knexpath=../knex.js`,
      {
        expectedOutput: 'Created Migration',
      }
    );
  });

  it('Create new migration with ts extension using -x switch', async () => {
    fileHelper.registerGlobForCleanup(
      'test/jake-util/knexfile_migrations/*_somename.ts'
    );
    await execCommand(
      `node ${KNEX} migrate:make somename -x ts --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js`,
      {
        expectedOutput: 'Created Migration',
      }
    );

    const fileCount = fileHelper.fileGlobExists(
      'test/jake-util/knexfile_migrations/*_somename.ts'
    );
    expect(fileCount).to.equal(1);
  });

  it('Create new migration with ts extension using "extension" knexfile param', async () => {
    fileHelper.registerGlobForCleanup(
      'test/jake-util/knexfile_migrations/*_somename.ts'
    );
    fileHelper.createFile(
      process.cwd() + '/knexfile.js',
      `
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/test/jake-util/test.sqlite3',
  },
  migrations: {
    extension: 'ts',
    directory: __dirname + '/test/jake-util/knexfile_migrations',
  },
};    
    `,
      { isPathAbsolute: true }
    );
    await execCommand(
      `node ${KNEX} migrate:make somename --knexpath=../knex.js`,
      {
        expectedOutput: 'Created Migration',
      }
    );

    const fileCount = fileHelper.fileGlobExists(
      'test/jake-util/knexfile_migrations/*_somename.ts'
    );
    expect(fileCount).to.equal(1);
  });
});
