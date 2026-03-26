'use strict';

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { execCommand } = require('cli-testlab');
const { getRootDir, setupFileHelper, cleanupLeftoverFiles } = require('./cli-test-utils');

const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

describe('migrate:latest', () => {
  beforeAll(() => {
    process.env.KNEX_PATH = '../knex.js';
    process.env.NODE_ENV = 'development';
  });

  let fileHelper;
  const rootDir = getRootDir();
  const dbPath = path.resolve(rootDir, 'db');
  beforeEach(() => {
    cleanupLeftoverFiles();
    fileHelper = setupFileHelper();
    fileHelper.registerForCleanup(dbPath);
    // Ensure the db file is removed before each test
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });
  afterEach(() => {
    fileHelper.cleanup();
  });

  it('Run migrations', async () => {
    fileHelper.createFile(
      'migrations/000_create_rule_table.js',
      `
            exports.up = (knex)=> knex.schema.createTable('rules', (table)=> {
                table.string('name');
            });
            exports.down = (knex)=> knex.schema.dropTable('rules');
        `,
      { willBeCleanedUp: true, isPathAbsolute: false }
    );

    expect(fileHelper.fileExists(dbPath)).toBe(false);
    await execCommand(`node ${KNEX} migrate:latest \
                 --client=sqlite3 --connection=${dbPath} \
                 --migrations-directory=${rootDir}/migrations \
                 create_rule_table`);
    expect(fileHelper.fileExists(dbPath)).toBe(true);
    const db = await new sqlite3.Database(dbPath);

    const getPromise = new Promise((resolve, reject) => {
      db.get('SELECT name FROM knex_migrations', {}, (err, row) => {
        if (err) {
          reject(err);
        }
        resolve(row);
      });
    });
    const row = await getPromise;
    expect(row.name).toBe('000_create_rule_table.js');
    db.close();
  });

  it('CLI Options override knexfile', async () => {
    const path = process.cwd() + '/knexfile.js';
    fileHelper.createFile(
      path,
      `
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: '${dbPath}',
  },
  migrations: {
    directory: __dirname + '/test//jake-util/knexfile_migrations',
  },
};
      `,
      { isPathAbsolute: true }
    );

    fileHelper.createFile(
      'migrations/subdirectory/000_create_rule_table.js',
      `
            exports.up = (knex)=> knex.schema.createTable('rules', (table)=> {
                table.string('name');
            });
            exports.down = (knex)=> knex.schema.dropTable('rules');
        `,
      { willBeCleanedUp: true, isPathAbsolute: false }
    );

    expect(fileHelper.fileExists(dbPath)).toBe(false);

    await execCommand(`node ${KNEX} migrate:latest \
                 --knexpath=../knexfile.js \
                 --migrations-directory=${rootDir}/migrations/subdirectory/ \
                 --migrations-table-name=migration_table \
                 create_rule_table`);
    expect(fileHelper.fileExists(dbPath)).toBe(true);

    const db = await new sqlite3.Database(dbPath);
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT name FROM migration_table', {}, (err, row) => {
        if (err) {
          reject(err);
        }
        resolve(row);
      });
    });
    expect(row.name).toBe('000_create_rule_table.js');
    db.close();
  });
});
