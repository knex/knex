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

module.exports = {
  migrationStubOptionSetup,
  migrationMatchesStub,
};
