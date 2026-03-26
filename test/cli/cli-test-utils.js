'use strict';

const fs = require('fs');
const path = require('path');
const { FileTestHelper } = require('cli-testlab');
const del = require('del');
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

function createTable(db, ddl) {
  return new Promise((resolve, reject) =>
    db.exec(`create TABLE if not exists ${ddl};`, (err) => {
      if (err) reject(err);
      else resolve();
    })
  );
}

/**
 * Removes leftover knexfile.js/knexfile.ts from cwd and generated
 * migration/seed files that may leak between test files when running
 * in vitest's singleFork mode.
 */
function cleanupLeftoverFiles() {
  const cwd = process.cwd();
  // Remove leftover knexfile.js/knexfile.ts from cwd
  ['knexfile.js', 'knexfile.ts'].forEach((f) => {
    const p = path.join(cwd, f);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  });
  // Remove any generated migration files (timestamped) from knexfile_migrations
  del.sync('test/jake-util/knexfile_migrations/[0-9]*_*');
  // Remove any generated seed files from knexfile_seeds (not seed2.stub or other fixtures)
  del.sync('test/jake-util/knexfile_seeds/somename.*');
  // Remove the default migrations directory that may be created in cwd
  const migrationsDir = path.join(cwd, 'migrations');
  if (fs.existsSync(migrationsDir)) {
    del.sync(path.join(migrationsDir, '**'));
    try {
      fs.rmdirSync(migrationsDir);
    } catch (e) {
      // ignore
    }
  }
  // Remove the default seeds directory that may be created in cwd
  const seedsDir = path.join(cwd, 'seeds');
  if (fs.existsSync(seedsDir)) {
    del.sync(path.join(seedsDir, '**'));
    try {
      fs.rmdirSync(seedsDir);
    } catch (e) {
      // ignore
    }
  }
}

module.exports = {
  cleanupLeftoverFiles,
  expectContentMatchesStub,
  getRootDir,
  migrationStubOptionSetup,
  seedStubOptionSetup,
  setupFileHelper,
  createTable,
};
