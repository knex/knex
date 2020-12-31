'use strict';

const fs = require('fs');
const path = require('path');
const { execCommand } = require('cli-testlab');
const { expect } = require('chai');
const { createTemp } = require('../../lib/migrations/util/fs');

const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

const NODE = 'node';
// To enable debug change to:
// const NODE = 'node --inspect-brk';

const {
  seedStubOptionSetup,
  expectContentMatchesStub,
  setupFileHelper,
} = require('./cli-test-utils');

describe('seed:make', () => {
  describe('-x option: make seed using a specific extension', () => {
    /**
     * @type FileTestHelper
     */
    let fileHelper;
    beforeEach(() => {
      fileHelper = setupFileHelper();
    });

    afterEach(() => {
      fileHelper.cleanup();
    });

    before(() => {
      process.env.KNEX_PATH = '../knex.js';
    });

    it('Creates new seed auto-creating seed directory when it does not exist', async () => {
      const tmpDir = await createTemp();
      const seedsDirectory = path.join(tmpDir, 'abc/xyz/temp/seeds');
      const knexfileContents = `
        module.exports = {
          client: 'sqlite3',
          connection: {
            filename: __dirname + '/test/jake-util/test.sqlite3',
          },
          seeds: {
            directory: '${seedsDirectory}',
          },
        };`;

      fileHelper.createFile(
        path.join(process.cwd(), 'knexfile.js'),
        knexfileContents,
        { isPathAbsolute: true }
      );

      await execCommand(
        `${NODE} ${KNEX} seed:make somename --knexpath=../knex.js`,
        {
          expectedOutput: 'Created seed file',
        }
      );

      expect(fs.existsSync(`${seedsDirectory}/somename.js`)).to.equal(true);
    });

    it('Creates new seed with js knexfile passed', async () => {
      fileHelper.registerGlobForCleanup(
        'test/jake-util/knexfile_seeds/somename.js'
      );

      await execCommand(
        `${NODE} ${KNEX} seed:make somename --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js`,
        {
          expectedOutput: 'Created seed file',
        }
      );

      const fileCount = fileHelper.fileGlobExists(
        'test/jake-util/knexfile_seeds/somename.js'
      );
      expect(fileCount).to.equal(1);
    });

    it('Creates new seed with ts knexfile passed', async () => {
      fileHelper.registerGlobForCleanup(
        'test/jake-util/knexfile_seeds/somename.ts'
      );
      await execCommand(
        `${NODE} ${KNEX} seed:make somename --knexfile=test/jake-util/knexfile-ts/knexfile.ts --knexpath=../knex.js`,
        {
          expectedOutput: 'Created seed file',
        }
      );

      const fileCount = fileHelper.fileGlobExists(
        'test/jake-util/knexfile_seeds/somename.ts'
      );
      expect(fileCount).to.equal(1);
    });

    it('Creates new seed with default knexfile', async () => {
      fileHelper.registerGlobForCleanup(
        'test/jake-util/knexfile_seeds/somename.js'
      );
      fileHelper.createFile(
        process.cwd() + '/knexfile.js',
        `
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/test/jake-util/test.sqlite3',
  },
  seeds: {
    directory: __dirname + '/test/jake-util/knexfile_seeds',
  },
};
    `,
        { isPathAbsolute: true }
      );
      await execCommand(
        `${NODE} ${KNEX} seed:make somename --knexpath=../knex.js`,
        {
          expectedOutput: 'Created seed file',
        }
      );

      const fileCount = fileHelper.fileGlobExists(
        'test/jake-util/knexfile_seeds/somename.js'
      );
      expect(fileCount).to.equal(1);
    });

    it('Creates new seed with default ts knexfile', async () => {
      fileHelper.registerGlobForCleanup(
        'test/jake-util/knexfile_seeds/somename.ts'
      );
      fileHelper.createFile(
        process.cwd() + '/knexfile.ts',
        `
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/test/jake-util/test.sqlite3',
  },
  seeds: {
    directory: __dirname + '/test/jake-util/knexfile_seeds',
  },
};
    `,
        { isPathAbsolute: true }
      );
      await execCommand(
        `${NODE} ${KNEX} seed:make somename --knexpath=../knex.js`,
        {
          expectedOutput: 'Created seed file',
        }
      );

      const fileCount = fileHelper.fileGlobExists(
        'test/jake-util/knexfile_seeds/somename.ts'
      );
      expect(fileCount).to.equal(1);
    });

    it('Creates new seed with ts extension using -x switch', async () => {
      fileHelper.registerGlobForCleanup(
        'test/jake-util/knexfile_seeds/somename.ts'
      );
      await execCommand(
        `${NODE} ${KNEX} seed:make somename -x ts --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js`,
        {
          expectedOutput: 'Created seed file',
        }
      );

      const fileCount = fileHelper.fileGlobExists(
        'test/jake-util/knexfile_seeds/somename.ts'
      );
      expect(fileCount).to.equal(1);
    });

    it('Creates new seed with ts extension using "extension" knexfile param', async () => {
      fileHelper.registerGlobForCleanup(
        'test/jake-util/knexfile_seeds/somename.ts'
      );
      fileHelper.createFile(
        process.cwd() + '/knexfile.js',
        `
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/test/jake-util/test.sqlite3',
  },
  seeds: {
    extension: 'ts',
    directory: __dirname + '/test/jake-util/knexfile_seeds',
  },
};
    `,
        { isPathAbsolute: true }
      );
      await execCommand(
        `${NODE} ${KNEX} seed:make somename --knexpath=../knex.js`,
        {
          expectedOutput: 'Created seed file',
        }
      );

      const fileCount = fileHelper.fileGlobExists(
        'test/jake-util/knexfile_seeds/somename.ts'
      );
      expect(fileCount).to.equal(1);
    });

    it('Creates new seed with ts extension using environment "extension" knexfile param', async () => {
      fileHelper.registerGlobForCleanup(
        'test/jake-util/knexfile_seeds/somename.ts'
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
  seeds: {
    extension: 'ts',
    directory: __dirname + '/test/jake-util/knexfile_seeds',
  },
  }
};
    `,
        { isPathAbsolute: true }
      );
      await execCommand(
        `${NODE} ${KNEX} seed:make somename --knexpath=../knex.js`,
        {
          expectedOutput: 'Created seed file',
        }
      );

      const fileCount = fileHelper.fileGlobExists(
        'test/jake-util/knexfile_seeds/somename.ts'
      );
      expect(fileCount).to.equal(1);
    });
  });

  describe('--stub option: make seed using specific stub file', () => {
    /**
     * @type FileTestHelper
     */
    let fileHelper;
    beforeEach(() => {
      fileHelper = setupFileHelper();
    });

    afterEach(() => {
      fileHelper.cleanup();
    });

    before(() => {
      process.env.KNEX_PATH = '../knex.js';
    });

    it('Creates a new seed using --stub </file/path> relative to the knexfile', async () => {
      const { seedGlobPath } = seedStubOptionSetup(fileHelper);
      const stubPath = 'test/jake-util/knexfile-stubs/seed.stub';

      await execCommand(
        `${NODE} ${KNEX} seed:make somename --stub ${stubPath} --knexpath=../knex.js`,
        {
          expectedOutput: 'Created seed file',
        }
      );

      const fileCount = fileHelper.fileGlobExists(
        'test/jake-util/knexfile_seeds/somename.js'
      );
      expect(fileCount).to.equal(1);
      expectContentMatchesStub(stubPath, seedGlobPath, fileHelper);
    });

    it('Creates a new seed with stub parameter in knexfile', async () => {
      const seedGlobPath = 'test/jake-util/knexfile-stubs/somename.js';
      fileHelper.registerGlobForCleanup(seedGlobPath);

      await execCommand(
        `${NODE} ${KNEX} seed:make somename --knexfile=test/jake-util/knexfile-stubs/knexfile.js --knexpath=../knex.js`,
        {
          expectedOutput: 'Created seed file',
        }
      );

      const fileCount = fileHelper.fileGlobExists(
        'test/jake-util/knexfile-stubs/somename.js'
      );

      const stubName = 'seed.stub';
      const stubPath = `test/jake-util/knexfile-stubs/${stubName}`;
      expect(fileCount).to.equal(1);
      expectContentMatchesStub(stubPath, seedGlobPath, fileHelper);
    });

    it('Creates a new seed with --stub <name> in config.seeds.directory', async () => {
      const { seedGlobPath } = seedStubOptionSetup(fileHelper);

      const stubName = 'seed2.stub';
      const stubPath = `test/jake-util/knexfile_seeds/${stubName}`;

      await execCommand(
        `${NODE} ${KNEX} seed:make somename --stub ${stubName} --knexpath=../knex.js`,
        {
          expectedOutput: 'Created seed file',
        }
      );

      const fileCount = fileHelper.fileGlobExists(
        'test/jake-util/knexfile_seeds/somename.js'
      );
      expect(fileCount).to.equal(1);
      expectContentMatchesStub(stubPath, seedGlobPath, fileHelper);
    });

    it('fails to create a new seed with --stub <name> when file does not exist', async () => {
      seedStubOptionSetup(fileHelper);
      const stubName = 'non-existat.stub';
      await execCommand(
        `${NODE} ${KNEX} seed:make somename --stub ${stubName} --knexpath=../knex.js`,
        {
          expectedErrorMessage: 'ENOENT:',
        }
      );
    });

    it('fails to create a new seed with --stub </file/path> when file does not exist', async () => {
      seedStubOptionSetup(fileHelper);
      const stubPath = '/path/non-existat.stub';
      await execCommand(
        `${NODE} ${KNEX} seed:make somename --stub ${stubPath} --knexpath=../knex.js`,
        {
          expectedErrorMessage: 'ENOENT:',
        }
      );
    });

    it('fails to create a seed with --stub <name> when config.seeds.directory not defined', async () => {
      fileHelper.createFile(
        process.cwd() + '/knexfile.js',
        `
  module.exports = {
    development: {
      client: 'sqlite3',
      connection: {
        filename: __dirname + '/test/jake-util/test.sqlite3',
      },
      seeds: {
        // directory not defined
      },
    }
  };
      `,
        { isPathAbsolute: true }
      );

      const stubName = 'table-foreign.stub';
      await execCommand(
        `${NODE} ${KNEX} seed:make somename --stub ${stubName} --knexpath=../knex.js`,
        {
          expectedErrorMessage:
            'config.seeds.directory in knexfile must be defined',
        }
      );
    });
  });

  describe('--timestamp-filename-prefix option: make seed with timestamp filename prefix', () => {
    /**
     * @type FileTestHelper
     */
    let fileHelper;

    beforeEach(() => {
      fileHelper = setupFileHelper();
    });

    afterEach(() => {
      fileHelper.cleanup();
    });

    it('Creates a new seed using --timestamp-filename-prefix CLI flag', async () => {
      const seedGlobPath = `${process.cwd()}/seeds/*_somename.js`;
      fileHelper.registerGlobForCleanup(seedGlobPath);

      await execCommand(
        `${NODE} ${KNEX} seed:make somename --timestamp-filename-prefix --knexpath=../knex.js`,
        {
          expectedOutput: 'Created seed file',
        }
      );

      const fileCount = fileHelper.fileGlobExists(seedGlobPath);

      expect(fileCount).to.equal(1);
    });

    it('Creates a new seed using timestampFilenamePrefix parameter in knexfile', async () => {
      const seedsDirectory = `${process.cwd()}/seeds`;
      const seedGlobPath = `${seedsDirectory}/*_somename.js`;
      fileHelper.registerGlobForCleanup(seedGlobPath);

      const knexfileContents = `
        module.exports = {
          client: 'sqlite3',
          connection: {
            filename: __dirname + '/test/jake-util/test.sqlite3',
          },
          seeds: {
            directory: '${seedsDirectory}',
            timestampFilenamePrefix: true
          },
        };`;

      fileHelper.createFile(
        path.join(process.cwd(), 'knexfile.js'),
        knexfileContents,
        { isPathAbsolute: true }
      );

      await execCommand(
        `${NODE} ${KNEX} seed:make somename --knexpath=../knex.js`,
        {
          expectedOutput: 'Created seed file',
        }
      );

      const fileCount = fileHelper.fileGlobExists(seedGlobPath);

      expect(fileCount).to.equal(1);
    });
  });
});
