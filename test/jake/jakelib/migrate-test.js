#!/usr/bin/env jake
'use strict';
/* eslint-disable no-undef */
/* eslint-disable no-console */

const os = require('os');
const fs = require('fs');
const rimrafSync = require('rimraf').sync;
const path = require('path');
const sqlite3 = require('sqlite3');
const { assert } = require('chai');
const { assertExec } = require('../../jake-util/helpers/migration-test-helper');
const knexfile = require('../../jake-util/knexfile/knexfile.js');

const KNEX = path.normalize(__dirname + '/../../../bin/cli.js');

/* * * HELPERS * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const taskList = [];
function test(description, func) {
  const tmpDirPath = os.tmpdir() + '/knex-test-';
  let itFails = false;
  rimrafSync(tmpDirPath);
  const tempFolder = fs.mkdtempSync(tmpDirPath);
  fs.mkdirSync(tempFolder + '/migrations');
  desc(description);
  const taskName = description.replace(/[^a-z0-9]/g, '');
  taskList.push(taskName);
  task(taskName, { async: true }, () =>
    func(tempFolder)
      .then(() => console.log('☑ ' + description))
      .catch((err) => {
        console.log('☒ ' + err.message);
        itFails = true;
      })
      .then(() => {
        jake.exec(`rm -r ${tempFolder}`);
        if (itFails) {
          process.exit(1);
        }
      })
  );
}

/* * * TESTS * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

test('Create a migration file', (temp) =>
  assertExec(`${KNEX} migrate:make \
               --client=sqlite3 \
               --migrations-directory=${temp}/migrations \
               create_rule_table`)
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
    ));

test('Create a migration file without client passed', (temp) =>
  assertExec(`${KNEX} migrate:make \
               --migrations-directory=${temp}/migrations \
               create_rule_table`)
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
    ));

test('Run migrations', (temp) =>
  new Promise((resolve, reject) =>
    fs.writeFile(
      temp + '/migrations/000_create_rule_table.js',
      `
            exports.up = (knex)=> knex.schema.createTable('rules', (table)=> {
                table.string('name');
            });
            exports.down = (knex)=> knex.schema.dropTable('rules');
        `,
      (err) => (err ? reject(err) : resolve())
    )
  )
    .then(() =>
      assertExec(`${KNEX} migrate:latest \
                   --client=sqlite3 --connection=${temp}/db \
                   --migrations-directory=${temp}/migrations \
                   create_rule_table`)
    )
    .then(() => assertExec(`ls ${temp}/db`, 'Find the database file'))
    .then(() => new sqlite3.Database(temp + '/db'))
    .then(
      (db) =>
        new Promise((resolve, reject) =>
          db.get('SELECT name FROM knex_migrations', function(err, row) {
            err ? reject(err) : resolve(row);
          })
        )
    )
    .then((row) => assert.equal(row.name, '000_create_rule_table.js')));

test('migrate:latest prints non verbose logs', (temp) => {
  const db = knexfile.connection.filename;
  if (fs.existsSync(db)) {
    fs.unlinkSync(db);
  }

  return assertExec(
    `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js`
  ).then(({ stdout }) => {
    assert.include(stdout, 'Batch 1 run: 1 migrations');
    assert.notInclude(stdout, 'simple_migration.js');
  });
});

test('migrate:rollback prints non verbose logs', (temp) => {
  return assertExec(
    `node ${KNEX} migrate:rollback --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js`
  ).then(({ stdout }) => {
    assert.include(stdout, 'Batch 1 rolled back: 1 migrations');
    assert.notInclude(stdout, 'simple_migration.js');
  });
});

test('migrate:latest prints verbose logs', (temp) => {
  return assertExec(
    `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js --verbose`
  ).then(({ stdout }) => {
    assert.include(stdout, 'Batch 1 run: 1 migrations');
    assert.include(stdout, 'simple_migration.js');
  });
});

test('migrate:rollback prints verbose logs', (temp) => {
  return assertExec(
    `node ${KNEX} migrate:rollback --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js --verbose`
  ).then(({ stdout }) => {
    assert.include(stdout, 'Batch 1 rolled back: 1 migrations');
    assert.include(stdout, 'simple_migration.js');
  });
});

test('migrate:rollback --all rolls back all completed migrations', (temp) => {
  const migrationFile1 = '001_create_users_table.js';
  const migrationFile2 = '002_add_age_column_to_users_table.js';
  const migrationFile3 = '003_add_last_name_column_to_users_table.js';
  const migrationFile4 = '004_add_email_to_users_table.js';

  fs.writeFileSync(
    `${temp}/migrations/${migrationFile1}`,
    `
      exports.up = (knex) => knex.schema
        .createTable('users', (table) => {
          table.string('first_name');
        });

      exports.down = (knex) => knex.schema.dropTable('users');
    `
  );

  return assertExec(
    `node ${KNEX} migrate:latest \
    --client=sqlite3 \
    --connection=${temp}/db \
    --migrations-directory=${temp}/migrations`,
    'create_users_table'
  )
    .then(() => {
      fs.writeFileSync(
        `${temp}/migrations/${migrationFile2}`,
        `
          exports.up = (knex) => knex.schema
            .table('users', (table) => {
              table.integer('age');
            });
    
          exports.down = (knex) => knex.schema
            .table('users', (table) => {
              table.dropColumn('age');
            });
        `
      );

      return assertExec(
        `node ${KNEX} migrate:latest \
        --client=sqlite3 \
        --connection=${temp}/db \
        --migrations-directory=${temp}/migrations`,
        'add_age_column_to_users_table'
      );
    })
    .then(() => {
      fs.writeFileSync(
        `${temp}/migrations/${migrationFile3}`,
        `
        exports.up = (knex) => knex.schema
          .table('users', (table) => {
            table.string('last_name');
          });
  
        exports.down = (knex) => knex.schema
          .table('users', (table) => {
            table.dropColumn('last_name');
          });
      `
      );

      return assertExec(
        `node ${KNEX} migrate:latest \
      --client=sqlite3 \
      --connection=${temp}/db \
      --migrations-directory=${temp}/migrations`,
        'add_last_name_column_to_user_table'
      );
    })
    .then(() => {
      fs.writeFileSync(
        `${temp}/migrations/${migrationFile4}`,
        `
        exports.up = (knex) => knex.schema
          .table('users', (table) => {
            table.string('email');
          });
  
        exports.down = (knex) => knex.schema
          .table('users', (table) => {
            table.dropColumn('email');
          });
      `
      );
    })
    .then(() => {
      const db = new sqlite3.Database(`${temp}/db`);

      return new Promise((resolve, reject) =>
        db.all('SELECT * FROM knex_migrations', (err, rows) => {
          const migrationsWithoutMigrationTime = rows.map((row) => {
            return {
              id: row.id,
              name: row.name,
              batch: row.batch,
            };
          });

          assert.includeDeepOrderedMembers(migrationsWithoutMigrationTime, [
            {
              id: 1,
              name: migrationFile1,
              batch: 1,
            },
            {
              id: 2,
              name: migrationFile2,
              batch: 2,
            },
            {
              id: 3,
              name: migrationFile3,
              batch: 3,
            },
          ]);

          err ? reject(err) : resolve(rows);
        })
      );
    })
    .then(() => {
      return assertExec(
        `node ${KNEX} migrate:rollback --all \
      --client=sqlite3 \
      --connection=${temp}/db \
      --migrations-directory=${temp}/migrations`
      ).then(({ stdout }) => {
        assert.include(stdout, 'Batch 3 rolled back: 3 migrations');
      });
    });
});

module.exports = {
  taskList,
};
