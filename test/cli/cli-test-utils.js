'use strict';

const path = require('path');
const { FileTestHelper } = require('cli-testlab');

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

function migrationMatchesStub(stubPath, migrationGlobPath, fileHelper) {
  // accepts full or relative stub path
  const relativeStubPath = stubPath.replace('test/jake-util/', '');
  const stubContent = fileHelper.getFileTextContent(relativeStubPath);
  const [migrationContent] = fileHelper.getFileGlobTextContent(
    migrationGlobPath
  );

  return stubContent === migrationContent;
}

function setupFileHelper() {
  const fileHelper = new FileTestHelper(
    path.resolve(__dirname, '../jake-util')
  );
  fileHelper.deleteFile('test.sqlite3');
  fileHelper.registerForCleanup('test.sqlite3');

  return fileHelper;
}

module.exports = {
  migrationStubOptionSetup,
  migrationMatchesStub,
  setupFileHelper,
};
