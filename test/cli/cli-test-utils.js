'use strict';

const path = require('path');
const { FileTestHelper } = require('cli-testlab');
const { expect } = require('chai');

function migrationStubOptionSetup(fileHelper) {
  const migrationGlobPath = 'test/jake-util/knexfile_migrations/*_somename.js';

  fileHelper.registerGlobForCleanup(migrationGlobPath);
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

  return { migrationGlobPath };
}

function seedStubOptionSetup(fileHelper) {
  const seedGlobPath = 'test/jake-util/knexfile_seeds/*.js';

  fileHelper.registerGlobForCleanup(seedGlobPath);
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
            directory: __dirname + '/test/jake-util/knexfile_seeds',
          },
        }
      };
      `,
    { isPathAbsolute: true }
  );

  return { seedGlobPath };
}

function expectContentMatchesStub(stubPath, globPath, fileHelper) {
  // accepts full or relative stub path
  const relativeStubPath = stubPath.replace('test/jake-util/', '');
  const stubContent = fileHelper.getFileTextContent(relativeStubPath);
  const [content] = fileHelper.getFileGlobTextContent(globPath);

  expect(content).equals(stubContent);
}

function getRootDir() {
  return path.resolve(__dirname, '../jake-util');
}

function setupFileHelper() {
  const fileHelper = new FileTestHelper(getRootDir());
  fileHelper.deleteFile('test.sqlite3');
  fileHelper.registerForCleanup('test.sqlite3');

  return fileHelper;
}

module.exports = {
  expectContentMatchesStub,
  getRootDir,
  migrationStubOptionSetup,
  seedStubOptionSetup,
  setupFileHelper,
};
