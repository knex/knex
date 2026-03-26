'use strict';

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { execCommand } = require('cli-testlab');
const { getRootDir, createTable } = require('./cli-test-utils');
const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

describe('migrate:unlock', () => {
  const rootDir = getRootDir();
  const dbPath = path.resolve(rootDir, 'db');
  let db;

  beforeAll(async () => {
    process.env.KNEX_PATH = '../knex.js';
    process.env.NODE_ENV = 'development';
    // Remove any leftover db file to start clean
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    db = await new sqlite3.Database(dbPath);
    // Create the lock table that these tests depend on
    await createTable(
      db,
      'knex_migrations_lock (index_id integer primary key autoincrement, is_locked integer)'
    );
    // Create the migrations table (needed by the unlock command)
    await createTable(
      db,
      'knex_migrations (id integer primary key autoincrement, name varchar(255), batch integer, migration_time timestamp)'
    );
  });

  afterAll(async () => {
    db.close();
    // Clean up the db file
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  async function verifyMigrationsUnlocked() {
    const rows = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM knex_migrations_lock', {}, (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });
    expect(rows.length).toBe(1);
    expect(rows[0].is_locked).toBe(0);
  }

  function runUnlockCommand() {
    return execCommand(`node ${KNEX} migrate:unlock \
            --client=sqlite3 --connection=${dbPath} \
            --migrations-directory=${rootDir}/migrations test_unlock`);
  }

  it('should create row in lock table if none exists', async () => {
    // Purge the lock table to ensure none exists
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM knex_migrations_lock', (err) =>
        err ? reject(err) : resolve()
      );
    });
    await runUnlockCommand();
    await verifyMigrationsUnlocked();
  });

  it('should restore lock table to one row with is_locked=0 if multiple rows exist', async () => {
    // Seed multiple rows into the lock table
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO knex_migrations_lock(is_locked) VALUES (?),(?),(?)',
        [1, 0, 1],
        (err) => {
          err ? reject(err) : resolve();
        }
      );
    });
    await runUnlockCommand();
    await verifyMigrationsUnlocked();
  });
});
