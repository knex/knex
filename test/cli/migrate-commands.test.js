'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sqlite3 = require('sqlite3');
const rimrafSync = require('rimraf').sync;
const knexfile = require('../jake-util/knexfile/knexfile.js');

const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

function assertExec(cmd, desc) {
  desc = desc || 'Run ' + cmd;
  return new Promise((resolve, reject) => {
    require('child_process').exec(cmd, (error, stdout, stderr) => {
      if (error) reject(Error(desc + ' FAIL. ' + stderr));
      else resolve({ cmd, stdout, stderr });
    });
  });
}

function assertExecError(cmd, desc) {
  desc = desc || 'Run ' + cmd;
  return new Promise((resolve, reject) => {
    require('child_process').exec(cmd, (error, stdout, stderr) => {
      if (error) resolve(stderr);
      else reject(new Error('Error was expected, but none thrown'));
    });
  });
}

function withTempDir(fn) {
  const tmpDirPath = os.tmpdir() + '/knex-test-';
  rimrafSync(tmpDirPath);
  const tempFolder = fs.mkdtempSync(tmpDirPath);
  fs.mkdirSync(tempFolder + '/migrations');
  return fn(tempFolder).finally(() => {
    rimrafSync(tmpDirPath);
  });
}

describe('migrate CLI commands', () => {
  it('Create a migration file', () =>
    withTempDir((temp) =>
      assertExec(
        `node ${KNEX} migrate:make --client=sqlite3 --migrations-directory=${temp}/migrations create_rule_table`
      )
        .then(() =>
          assertExec(
            `ls ${temp}/migrations/*_create_rule_table.js`,
            'Find the migration file'
          )
        )
        .then(() =>
          assertExec(
            `grep exports.up ${temp}/migrations/*_create_rule_table.js`,
            'Migration created with boilerplate'
          )
        )
    ));

  it('Create a migration file without client passed', () =>
    withTempDir((temp) =>
      assertExec(
        `node ${KNEX} migrate:make --migrations-directory=${temp}/migrations create_rule_table`
      )
        .then(() =>
          assertExec(
            `ls ${temp}/migrations/*_create_rule_table.js`,
            'Find the migration file'
          )
        )
        .then(() =>
          assertExec(
            `grep exports.up ${temp}/migrations/*_create_rule_table.js`,
            'Migration created with boilerplate'
          )
        )
    ));

  it('run migrations without knexfile and with --migrations-table-name', () =>
    withTempDir((temp) =>
      assertExec(
        `node ${KNEX} migrate:latest --client=sqlite3 --connection=${temp}/db --migrations-directory=test/jake-util/knexfile_migrations --migrations-table-name=custom_migrations_table`
      )
        .then(() => new sqlite3.Database(temp + '/db'))
        .then(
          (db) =>
            new Promise((resolve, reject) =>
              db.get(
                "SELECT name FROM sqlite_master where type='table' AND name='custom_migrations_table'",
                function (err, row) {
                  err ? reject(err) : resolve(row);
                }
              )
            )
        )
        .then((row) => expect(row.name).toBe('custom_migrations_table'))
    ));

  it('migrate:latest prints non verbose logs', () => {
    const db = knexfile.connection.filename;
    if (fs.existsSync(db)) {
      fs.unlinkSync(db);
    }

    return assertExec(
      `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js`
    ).then(({ stdout }) => {
      expect(stdout).toContain('Batch 1 run: 1 migrations');
      expect(stdout).not.toContain('simple_migration.js');
    });
  });

  it('migrate:rollback prints non verbose logs', () => {
    return assertExec(
      `node ${KNEX} migrate:rollback --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js`
    ).then(({ stdout }) => {
      expect(stdout).toContain('Batch 1 rolled back: 1 migrations');
      expect(stdout).not.toContain('simple_migration.js');
    });
  });

  it('migrate:latest prints verbose logs', () => {
    return assertExec(
      `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js --verbose`
    ).then(({ stdout }) => {
      expect(stdout).toContain('Batch 1 run: 1 migrations');
      expect(stdout).toContain('simple_migration.js');
    });
  });

  it('migrate:rollback prints verbose logs', () => {
    return assertExec(
      `node ${KNEX} migrate:rollback --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js --verbose`
    ).then(({ stdout }) => {
      expect(stdout).toContain('Batch 1 rolled back: 1 migrations');
      expect(stdout).toContain('simple_migration.js');
    });
  });

  it('migrate:rollback --all rolls back all completed migrations', () =>
    withTempDir((temp) => {
      const migrationFile1 = '001_create_users_table.js';
      const migrationFile2 = '002_add_age_column_to_users_table.js';
      const migrationFile3 = '003_add_last_name_column_to_users_table.js';
      const migrationFile4 = '004_add_email_to_users_table.js';

      fs.writeFileSync(
        `${temp}/migrations/${migrationFile1}`,
        `exports.up = (knex) => knex.schema.createTable('users', (t) => { t.string('first_name'); });
         exports.down = (knex) => knex.schema.dropTable('users');`
      );

      return assertExec(
        `node ${KNEX} migrate:latest --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      )
        .then(() => {
          fs.writeFileSync(
            `${temp}/migrations/${migrationFile2}`,
            `exports.up = (knex) => knex.schema.table('users', (t) => { t.integer('age'); });
             exports.down = (knex) => knex.schema.table('users', (t) => { t.dropColumn('age'); });`
          );
          return assertExec(
            `node ${KNEX} migrate:latest --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
          );
        })
        .then(() => {
          fs.writeFileSync(
            `${temp}/migrations/${migrationFile3}`,
            `exports.up = (knex) => knex.schema.table('users', (t) => { t.string('last_name'); });
             exports.down = (knex) => knex.schema.table('users', (t) => { t.dropColumn('last_name'); });`
          );
          return assertExec(
            `node ${KNEX} migrate:latest --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
          );
        })
        .then(() => {
          fs.writeFileSync(
            `${temp}/migrations/${migrationFile4}`,
            `exports.up = (knex) => knex.schema.table('users', (t) => { t.string('email'); });
             exports.down = (knex) => knex.schema.table('users', (t) => { t.dropColumn('email'); });`
          );
        })
        .then(() => {
          const db = new sqlite3.Database(`${temp}/db`);
          return new Promise((resolve, reject) =>
            db.all('SELECT * FROM knex_migrations', (err, rows) => {
              const cleaned = rows.map((r) => ({
                id: r.id,
                name: r.name,
                batch: r.batch,
              }));
              expect(cleaned).toEqual(
                expect.arrayContaining([
                  { id: 1, name: migrationFile1, batch: 1 },
                  { id: 2, name: migrationFile2, batch: 2 },
                  { id: 3, name: migrationFile3, batch: 3 },
                ])
              );
              err ? reject(err) : resolve(rows);
            })
          );
        })
        .then(() =>
          assertExec(
            `node ${KNEX} migrate:rollback --all --client=sqlite3 --connection=${temp}/db --disable-transactions --migrations-directory=${temp}/migrations`
          ).then(({ stdout }) => {
            expect(stdout).toContain('Batch 3 rolled back: 3 migrations');
          })
        );
    }));

  it('migrate:up runs only the next unrun migration', () =>
    withTempDir((temp) => {
      const migrationFile1 = '001_create_books_table.js';
      const migrationFile2 = '002_add_pages_column_to_books_table.js';

      fs.writeFileSync(
        `${temp}/migrations/${migrationFile1}`,
        `exports.up = (knex) => knex.schema.createTable('books', (t) => { t.string('title'); });
         exports.down = (knex) => knex.schema.dropTable('books');`
      );
      fs.writeFileSync(
        `${temp}/migrations/${migrationFile2}`,
        `exports.up = (knex) => knex.schema.table('books', (t) => { t.integer('pages'); });
         exports.down = (knex) => knex.schema.table('books', (t) => { t.dropColumn('pages'); });`
      );

      return assertExec(
        `node ${KNEX} migrate:up --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      )
        .then(({ stdout }) => {
          expect(stdout).toContain(
            `Batch 1 ran the following migrations:\n${migrationFile1}`
          );
        })
        .then(() =>
          assertExec(
            `node ${KNEX} migrate:up --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
          )
        )
        .then(({ stdout }) => {
          expect(stdout).toContain(
            `Batch 2 ran the following migrations:\n${migrationFile2}`
          );
        })
        .then(() =>
          assertExec(
            `node ${KNEX} migrate:up --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
          )
        )
        .then(({ stdout }) => {
          expect(stdout).toContain('Already up to date');
        });
    }));

  it('migrate:up <name> runs only the defined unrun migration', () =>
    withTempDir(async (temp) => {
      const migrationFile1 = '001_one.js';
      const migrationFile2 = '002_two.js';
      const migrationData = `exports.up = () => Promise.resolve(); exports.down = () => Promise.resolve();`;

      fs.writeFileSync(`${temp}/migrations/${migrationFile1}`, migrationData);
      fs.writeFileSync(`${temp}/migrations/${migrationFile2}`, migrationData);

      const { stdout } = await assertExec(
        `node ${KNEX} migrate:up ${migrationFile2} --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );
      expect(stdout).toContain(
        `Batch 1 ran the following migrations:\n${migrationFile2}`
      );
      expect(stdout).not.toContain(migrationFile1);
    }));

  it('migrate:up <name> throws an error for missing migration', () =>
    withTempDir(async (temp) => {
      const stderr = await assertExecError(
        `node ${KNEX} migrate:up 001_one.js --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );
      expect(stderr).toContain('Migration "001_one.js" not found.');
    }));

  it('migrate:up <name> handles already completed migration gracefully', () =>
    withTempDir(async (temp) => {
      const migrationFile1 = '001_one.js';
      fs.writeFileSync(
        `${temp}/migrations/${migrationFile1}`,
        `exports.up = () => Promise.resolve(); exports.down = () => Promise.resolve();`
      );

      await assertExec(
        `node ${KNEX} migrate:latest --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );

      const { stdout } = await assertExec(
        `node ${KNEX} migrate:up ${migrationFile1} --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );
      expect(stdout).toContain('Already up to date');
    }));

  it('migrate:down undos only the last run migration', () =>
    withTempDir(async (temp) => {
      const migrationFile1 = '001_create_address_table.js';
      const migrationFile2 = '002_add_zip_to_address_table.js';

      fs.writeFileSync(
        `${temp}/migrations/${migrationFile1}`,
        `exports.up = (knex) => knex.schema.createTable('address', (t) => { t.string('street'); });
         exports.down = (knex) => knex.schema.dropTable('address');`
      );
      fs.writeFileSync(
        `${temp}/migrations/${migrationFile2}`,
        `exports.up = (knex) => knex.schema.table('address', (t) => { t.integer('zip_code'); });
         exports.down = (knex) => knex.schema.table('address', (t) => { t.dropColumn('zip_code'); });`
      );

      await assertExec(
        `node ${KNEX} migrate:latest --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );

      const { stdout: down1 } = await assertExec(
        `node ${KNEX} migrate:down --client=sqlite3 --connection=${temp}/db --disable-transactions --migrations-directory=${temp}/migrations`
      );
      expect(down1).toContain(
        `Batch 1 rolled back the following migrations:\n${migrationFile2}`
      );

      const { stdout: down2 } = await assertExec(
        `node ${KNEX} migrate:down --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );
      expect(down2).toContain(
        `Batch 1 rolled back the following migrations:\n${migrationFile1}`
      );

      const { stdout: down3 } = await assertExec(
        `node ${KNEX} migrate:down --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );
      expect(down3).toContain('Already at the base migration');
    }));

  it('migrate:down <name> undos only the defined run migration', () =>
    withTempDir(async (temp) => {
      const migrationFile1 = '001_one.js';
      const migrationFile2 = '002_two.js';
      const migrationData = `exports.up = () => Promise.resolve(); exports.down = () => Promise.resolve();`;

      fs.writeFileSync(`${temp}/migrations/${migrationFile1}`, migrationData);
      fs.writeFileSync(`${temp}/migrations/${migrationFile2}`, migrationData);

      await assertExec(
        `node ${KNEX} migrate:latest --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );

      const { stdout } = await assertExec(
        `node ${KNEX} migrate:down ${migrationFile1} --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );
      expect(stdout).toContain(
        `Batch 1 rolled back the following migrations:\n${migrationFile1}`
      );
      expect(stdout).not.toContain(migrationFile2);
    }));

  it('migrate:down <name> throws an error for unrun migration', () =>
    withTempDir(async (temp) => {
      const stderr = await assertExecError(
        `node ${KNEX} migrate:down 001_one.js --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );
      expect(stderr).toContain('Migration "001_one.js" was not run.');
    }));

  it('migrate:list prints migrations both completed and pending', () =>
    withTempDir(async (temp) => {
      const migrationFile1 = '001_create_animals_table.js';
      const migrationFile2 = '002_add_age_column_to_animals_table.js';

      const { stdout: empty } = await assertExec(
        `node ${KNEX} migrate:list --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );
      expect(empty).toContain('No Completed Migration files Found.');
      expect(empty).toContain('No Pending Migration files Found.');

      fs.writeFileSync(
        `${temp}/migrations/${migrationFile1}`,
        `exports.up = (knex) => knex.schema.createTable('animals', (t) => { t.string('title'); });
         exports.down = (knex) => knex.schema.dropTable('animals');`
      );
      fs.writeFileSync(
        `${temp}/migrations/${migrationFile2}`,
        `exports.up = (knex) => knex.schema.table('animals', (t) => { t.integer('age'); });
         exports.down = (knex) => knex.schema.table('animals', (t) => { t.dropColumn('age'); });`
      );

      const { stdout: up1 } = await assertExec(
        `node ${KNEX} migrate:up --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );
      expect(up1).toContain(
        `Batch 1 ran the following migrations:\n${migrationFile1}`
      );

      const { stdout: list1 } = await assertExec(
        `NO_COLOR= node ${KNEX} migrate:list --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );
      expect(list1).toContain('Found 1 Completed Migration file/files.');
      expect(list1).toContain(migrationFile1);
      expect(list1).toContain('Found 1 Pending Migration file/files.');
      expect(list1).toContain(migrationFile2);

      await assertExec(
        `node ${KNEX} migrate:up --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );

      const { stdout: list2 } = await assertExec(
        `NO_COLOR= node ${KNEX} migrate:list --client=sqlite3 --connection=${temp}/db --migrations-directory=${temp}/migrations`
      );
      expect(list2).toContain('Found 2 Completed Migration file/files.');
      expect(list2).toContain('No Pending Migration files Found.');
    }));
});
