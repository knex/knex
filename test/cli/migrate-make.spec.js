'use strict';

const fs = require('fs');
const path = require('path');
const { FileTestHelper, execCommand } = require('cli-testlab');
const expect = require('chai').expect;

const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

// start: utils for --stub option tests //
const migrationStubSetup = (fileHelper) => {
  fileHelper.registerGlobForCleanup(
    'test/jake-util/knexfile_migrations/*_somename.js'
  );
  fileHelper.createFile(
    process.cwd() + '/knexfile.js',
    `
      module.exports = {
        development: {
          client: 'sqlite3',
          connection: {
            filename: __dirname + '/test/jake-util/test.sqlite3',
          },
          migrations: {
            directory: __dirname + '/test/jake-util/knexfile_migrations',
          },
        }
      };
      `,
    { isPathAbsolute: true }
  );
};

const getMigrationFileContents = (fileHelper) => {
  const [migrationFileName] = fs
    .readdirSync(path.resolve(__dirname, '../jake-util/knexfile_migrations'))
    .filter((fileName) => /\d+_somename\.js/.test(fileName));

  return fileHelper.getFileTextContent(
    `knexfile_migrations/${migrationFileName}`
  );
};

const migrationMatchesStub = (stubPath, fileHelper) => {
  // accepts full or relative stub path
  const relativeStubPath = stubPath.replace('test/jake-util/', '');

  const migrationContents = getMigrationFileContents(fileHelper);
  const stubContents = fileHelper.getFileTextContent(relativeStubPath);
  return stubContents === migrationContents;
};

// end: utils for --stub option tests //

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

  it('Create new migration with js knexfile passed', async () => {
    fileHelper.registerGlobForCleanup(
      'test/jake-util/knexfile_migrations/*_somename.js'
    );

    await execCommand(
      `node ${KNEX} migrate:make somename --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js`,
      {
        expectedOutput: 'Created Migration',
      }
    );

    const fileCount = fileHelper.fileGlobExists(
      'test/jake-util/knexfile_migrations/*_somename.js'
    );
    expect(fileCount).to.equal(1);
  });

  it('Create new migration with ts knexfile passed', async () => {
    fileHelper.registerGlobForCleanup(
      'test/jake-util/knexfile_migrations/*_somename.ts'
    );
    await execCommand(
      `node ${KNEX} migrate:make somename --knexfile=test/jake-util/knexfile-ts/knexfile.ts --knexpath=../knex.js`,
      {
        expectedOutput: 'Created Migration',
      }
    );

    const fileCount = fileHelper.fileGlobExists(
      'test/jake-util/knexfile_migrations/*_somename.ts'
    );
    expect(fileCount).to.equal(1);
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

  it('Create new migration with default ts knexfile', async () => {
    fileHelper.registerGlobForCleanup(
      'test/jake-util/knexfile_migrations/*_somename.ts'
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

  it('Create new migration with ts extension using environment "extension" knexfile param', async () => {
    fileHelper.registerGlobForCleanup(
      'test/jake-util/knexfile_migrations/*_somename.ts'
    );
    fileHelper.createFile(
      process.cwd() + '/knexfile.js',
      `
module.exports = {
development: {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/test/jake-util/test.sqlite3',
  },
  migrations: {
    extension: 'ts',
    directory: __dirname + '/test/jake-util/knexfile_migrations',
  },
  }
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

  it('Create a new migration using --stub </file/path> relative to the knexfile', async () => {
    migrationStubSetup(fileHelper);

    const stubPath = 'test/jake-util/migration-stubs/table.stub';

    await execCommand(
      `node ${KNEX} migrate:make somename --stub ${stubPath} --knexpath=../knex.js`,
      {
        expectedOutput: 'Created Migration',
      }
    );

    const fileCount = fileHelper.fileGlobExists(
      'test/jake-util/knexfile_migrations/*_somename.js'
    );
    expect(fileCount).to.equal(1);
    expect(migrationMatchesStub(stubPath, fileHelper)).equal(true);
  });

  it('Create a new migration with --stub <name> in config.migrations.directory', async () => {
    migrationStubSetup(fileHelper);

    const stubName = 'table-foreign.stub';
    const stubPath = `test/jake-util/knexfile_migrations/${stubName}`;

    await execCommand(
      `node ${KNEX} migrate:make somename --stub ${stubName} --knexpath=../knex.js`,
      {
        expectedOutput: 'Created Migration',
      }
    );

    const fileCount = fileHelper.fileGlobExists(
      'test/jake-util/knexfile_migrations/*_somename.js'
    );
    expect(fileCount).to.equal(1);
    expect(migrationMatchesStub(stubPath, fileHelper)).equal(true);
  });

  it('Create a new migration with --stub <name> when file does not exist', async () => {
    migrationStubSetup(fileHelper);
    const stubName = 'non-existat.stub';
    await execCommand(
      `node ${KNEX} migrate:make somename --stub ${stubName} --knexpath=../knex.js`,
      {
        expectedErrorMessage: 'ENOENT:',
      }
    );
  });

  it('Create a new migration with --stub </file/path> when file does not exist', async () => {
    migrationStubSetup(fileHelper);
    const stubPath = '/path/non-existat.stub';
    await execCommand(
      `node ${KNEX} migrate:make somename --stub ${stubPath} --knexpath=../knex.js`,
      {
        expectedErrorMessage: 'ENOENT:',
      }
    );
  });

  it('Create a new migration with --stub <name> when config.migrations.directory not defined', async () => {
    fileHelper.createFile(
      process.cwd() + '/knexfile.js',
      `
module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: __dirname + '/test/jake-util/test.sqlite3',
    },
    migrations: {
      // directory not defined
    },
  }
};
    `,
      { isPathAbsolute: true }
    );

    const stubName = 'table-foreign.stub';
    await execCommand(
      `node ${KNEX} migrate:make somename --stub ${stubName} --knexpath=../knex.js`,
      {
        expectedErrorMessage:
          'config.migrations.directory in knexfile must be defined',
      }
    );
  });
});
