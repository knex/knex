'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const { expect } = chai;
const { FileTestHelper } = require('cli-testlab');

const equal = require('assert').equal;
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const knexLib = require('../../../knex');
const logger = require('../../integration/logger');
const config = require('../../knexfile');
const delay = require('../../../lib/execution/internal/delay');
const _ = require('lodash');
const testMemoryMigrations = require('./memory-migrations');
const {
  isPostgreSQL,
  isOracle,
  isMssql,
  isMysql,
  isSQLite,
  isRedshift,
} = require('../../util/db-helpers');
const { assertNumber } = require('../../util/assertHelper');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const {
  ensureTable,
} = require('../../../lib/migrations/migrate/table-creator');

describe('Migrations', function () {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;

      before(async () => {
        rimraf.sync(path.join(__dirname, './migration'));
        knex = logger(getKnexForDb(db));
        // make sure lock was not left from previous failed test run
        await knex.schema.dropTableIfExists('knex_migrations');
        await knex.schema.dropTableIfExists('migration_test_1');
        await knex.schema.dropTableIfExists('migration_test_2');
        await knex.schema.dropTableIfExists('migration_test_2_1');
        await knex.migrate.forceFreeMigrationsLock({
          directory: 'test/integration2/migrate/test',
        });
      });

      describe('knex.migrate', function () {
        it('should not fail on null default for timestamp', async () => {
          try {
            await knex.schema.dropTableIfExists('null_date');

            await knex.migrate.latest({
              directory: 'test/integration2/migrate/null_timestamp_default',
            });

            await knex.into('null_date').insert({
              dummy: 'cannot insert empty object',
            });

            const rows = await knex('null_date').first();
            expect(rows.deleted_at).to.equal(null);
          } finally {
            await knex.migrate.rollback({
              directory: 'test/integration2/migrate/null_timestamp_default',
            });
          }
        });

        it('should not fail drop-and-recreate-column operation when using promise chain', () => {
          return knex.migrate
            .latest({
              directory: 'test/integration2/migrate/drop-and-recreate',
            })
            .then(() => {
              return knex.migrate.rollback({
                directory: 'test/integration2/migrate/drop-and-recreate',
              });
            });
        });

        if (isPostgreSQL(knex)) {
          it('should not fail drop-and-recreate-column operation when using promise chain and schema', () => {
            return knex.migrate
              .latest({
                directory:
                  'test/integration2/migrate/drop-and-recreate-with-schema',
              })
              .then(() => {
                return knex.migrate.rollback({
                  directory:
                    'test/integration2/migrate/drop-and-recreate-with-schema',
                });
              });
          });
        }

        if (isSQLite(knex)) {
          it('should not fail rename-and-drop-column with multiline sql from legacy db', async () => {
            const knexConfig = _.extend({}, config.sqlite3, {
              connection: {
                filename: __dirname + '/../../multilineCreateMaster.sqlite3',
              },
              migrations: {
                directory:
                  'test/integration2/migrate/rename-and-drop-column-with-multiline-sql-from-legacy-db',
              },
            });
            const knexInstance = knexLib(knexConfig);
            const db = logger(knexInstance);

            await db.migrate.latest();
            await db.migrate.rollback();
            await knexInstance.destroy();
          });

          it('should not fail alter-table-ignore-case-sensitive', async () => {
            await knex.migrate.latest({
              directory:
                'test/integration2/migrate/alter-table-ignore-case-sensitive',
            });
            expect(await knex.schema.hasColumn('Some_Table', 'id')).to.be.true;
            expect(await knex.schema.hasColumn('Some_Table', 'other_id')).to.be
              .true;
            expect(await knex.schema.hasColumn('Some_Table', 'name')).to.be
              .true;
            // try different case
            expect(await knex.schema.hasColumn('some_table', 'id')).to.be.true;
            expect(await knex.schema.hasColumn('some_table', 'other_id')).to.be
              .true;
            expect(await knex.schema.hasColumn('some_table', 'name')).to.be
              .true;

            await knex.migrate.rollback({
              directory:
                'test/integration2/migrate/alter-table-ignore-case-sensitive',
            });
            expect(await knex.schema.hasTable('Some_Table')).to.be.false;
            expect(await knex.schema.hasTable('some_table')).to.be.false;
          });
        }

        it('should not fail drop-and-recreate-column operation when using async/await', () => {
          return knex.migrate
            .latest({
              directory:
                'test/integration2/migrate/async-await-drop-and-recreate',
            })
            .then(() => {
              return knex.migrate.rollback({
                directory:
                  'test/integration2/migrate/async-await-drop-and-recreate',
              });
            });
        });

        if (isPostgreSQL(knex)) {
          it('should not fail drop-and-recreate-column operation when using async/await and schema', () => {
            return knex.migrate
              .latest({
                directory:
                  'test/integration2/migrate/async-await-drop-and-recreate-with-schema',
              })
              .then(() => {
                return knex.migrate.rollback({
                  directory:
                    'test/integration2/migrate/async-await-drop-and-recreate-with-schema',
                });
              });
          });
        }

        it('should create a new migration file with the create method', function () {
          return knex.migrate.make('test').then(function (name) {
            name = path.basename(name);
            expect(name.split('_')[0]).to.have.length(14);
            expect(name.split('_')[1].split('.')[0]).to.equal('test');
          });
        });

        it('should list the current migration state with the currentVersion method', function () {
          return knex.migrate.currentVersion().then(function (version) {
            equal(version, 'none');
          });
        });

        const tables = [
          'migration_test_1',
          'migration_test_2',
          'migration_test_2_1',
        ];

        describe('knex.migrate.status', function () {
          this.timeout(process.env.KNEX_TEST_TIMEOUT || 30000);

          beforeEach(function () {
            return knex.migrate.latest({
              directory: 'test/integration2/migrate/test',
            });
          });

          afterEach(function () {
            return knex.migrate.rollback({
              directory: 'test/integration2/migrate/test',
            });
          });

          it('should create a migrations lock table', function () {
            return knex.schema
              .hasTable('knex_migrations_lock')
              .then(function (exists) {
                expect(exists).to.equal(true);

                return knex.schema
                  .hasColumn('knex_migrations_lock', 'is_locked')
                  .then(function (exists) {
                    expect(exists).to.equal(true);
                  });
              });
          });

          it('should return 0 if code matches DB', function () {
            return knex.migrate
              .status({ directory: 'test/integration2/migrate/test' })
              .then(function (migrationLevel) {
                expect(migrationLevel).to.equal(0);
              });
          });

          it('should return a negative number if the DB is behind', function () {
            return knex.migrate
              .rollback({ directory: 'test/integration2/migrate/test' })
              .then(function () {
                return knex.migrate
                  .status({ directory: 'test/integration2/migrate/test' })
                  .then(function (migrationLevel) {
                    expect(migrationLevel).to.equal(-2);
                  });
              });
          });

          it('should return a positive number if the DB is ahead', async () => {
            const [migration1, migration2, migration3] = await Promise.all([
              knex('knex_migrations').returning('id').insert({
                name: 'foobar',
                batch: 5,
                migration_time: new Date(),
              }),
              knex('knex_migrations').returning('id').insert({
                name: 'foobar',
                batch: 5,
                migration_time: new Date(),
              }),
              knex('knex_migrations').returning('id').insert({
                name: 'foobarbaz',
                batch: 6,
                migration_time: new Date(),
              }),
            ]);
            return knex.migrate
              .status({ directory: 'test/integration2/migrate/test' })
              .then(function (migrationLevel) {
                expect(migrationLevel).to.equal(3);
              })
              .then(function () {
                // Cleanup the added migrations
                if (isRedshift(knex)) {
                  return knex('knex_migrations')
                    .where('name', 'like', '%foobar%')
                    .del();
                }
                return knex('knex_migrations')
                  .where(
                    'id',
                    !isNaN(migration1[0]) ? migration1[0] : migration1[0].id
                  )
                  .orWhere(
                    'id',
                    !isNaN(migration2[0]) ? migration2[0] : migration2[0].id
                  )
                  .orWhere(
                    'id',
                    !isNaN(migration3[0]) ? migration3[0] : migration3[0].id
                  )
                  .del();
              });
          });
        });

        describe('knex.migrate.latest', function () {
          before(function () {
            return knex.migrate.latest({
              directory: 'test/integration2/migrate/test',
            });
          });

          it('should remove the record in the lock table once finished', function () {
            return knex('knex_migrations_lock')
              .select('*')
              .then(function (data) {
                expect(data[0]).to.have.property('is_locked');
                expect(Number.parseInt(data[0].is_locked)).to.not.be.ok;
              });
          });

          it('should throw error if the migrations are already running', function () {
            return knex('knex_migrations_lock')
              .update({ is_locked: 1 })
              .then(function () {
                return knex.migrate
                  .latest({ directory: 'test/integration2/migrate/test' })
                  .then(function () {
                    throw new Error('then should not execute');
                  });
              })
              .catch(function (error) {
                expect(error).to.have.property(
                  'message',
                  'Migration table is already locked'
                );
                return knex('knex_migrations_lock').select('*');
              })
              .then(function (data) {
                assertNumber(knex, data[0].is_locked, 1);

                // Clean up lock for other tests
                return knex('knex_migrations_lock').update({ is_locked: 0 });
              });
          });

          it('should work with concurent calls to _lockMigrations', async function () {
            if (isSQLite(knex)) {
              // sqlite doesn't support concurrency
              this.skip();
              return;
            }

            const migrator = knex.migrate;
            try {
              // Start two transactions and call _lockMigrations in each of them.
              // Simulate a race condition by waiting until both are started before
              // attempting to commit either one. Exactly one should succeed.
              //
              // Both orderings are legitimate, but in practice the first transaction
              // to start will be the one that succeeds in all currently supported
              // databases (CockroachDB 1.x is an example of a database where the
              // second transaction would win, but this changed in 2.0). This test
              // assumes the first transaction wins, but could be refactored to support
              // both orderings if desired.
              const trx1 = await knex.transaction();
              await migrator._lockMigrations(trx1);
              const trx2 = await knex.transaction();
              // trx1 has a pending write lock, so the second call to _lockMigrations
              // will block (unless we're on a DB that resolves the transaction in
              // the other order as mentioned above).
              // Save the promise, then wait a short time to ensure it's had time
              // to start its query and get blocked.
              const trx2Promise = migrator._lockMigrations(trx2);
              await delay(100);
              const isTrx2PromisePending = await Promise.race([
                delay(10).then(() => true),
                trx2Promise.catch(() => {}).then(() => false),
              ]);
              if (!isTrx2PromisePending) {
                throw new Error('expected trx2 to be pending');
              }
              await trx1.commit();
              // trx1 has completed and unblocked trx2, which should now fail.
              try {
                await trx2Promise;
                throw new Error('expected trx2 to fail');
              } catch (error) {
                expect(error)
                  .to.have.property('message')
                  .that.includes('already locked');
                await trx2.rollback();
              }
            } finally {
              // Clean up after ourselves (I'm not sure why the before() at the
              // top of this file isn't doing it, but if this test fails without
              // this call it tends to cause cascading failures).
              await migrator._freeLock();
            }
          });

          it('should report failing migration', function () {
            const migrator = knex.migrate;
            return migrator
              .latest({
                directory: 'test/integration2/migrate/test_with_invalid',
              })
              .then(function () {
                throw new Error('then should not execute');
              })
              .catch(function (error) {
                // This will fail because of the invalid migration
                expect(error)
                  .to.have.property('message')
                  .that.includes('unknown_table');
                expect(migrator)
                  .to.have.property('_activeMigration')
                  .to.have.property(
                    'fileName',
                    '20150109002832_invalid_migration.js'
                  );
              })
              .then(function (data) {
                // Clean up lock for other tests
                // TODO: Remove this code to reproduce https://github.com/tgriesser/knex/issues/2925
                // It is only relevant for Oracle, most likely there is a bug somewhere that needs fixing
                return knex('knex_migrations_lock').update({ is_locked: 0 });
              });
          });

          it('should release lock if non-locking related error is thrown', function () {
            return knex('knex_migrations_lock')
              .select('*')
              .then(function (data) {
                expect(Number.parseInt(data[0].is_locked)).to.not.be.ok;
              });
          });

          it('should run all migration files in the specified directory', function () {
            return knex('knex_migrations')
              .select('*')
              .then(function (data) {
                expect(data.length).to.equal(2);
              });
          });

          it('should run the migrations from oldest to newest', function () {
            if (isOracle(knex)) {
              return knex('knex_migrations')
                .orderBy('migration_time', 'asc')
                .select('*')
                .then(function (data) {
                  expect(path.basename(data[0].name)).to.equal(
                    '20131019235242_migration_1.js'
                  );
                  expect(path.basename(data[1].name)).to.equal(
                    '20131019235306_migration_2.js'
                  );
                });
            } else {
              return knex('knex_migrations')
                .orderBy('id', 'asc')
                .select('*')
                .then(function (data) {
                  expect(path.basename(data[0].name)).to.equal(
                    '20131019235242_migration_1.js'
                  );
                  expect(path.basename(data[1].name)).to.equal(
                    '20131019235306_migration_2.js'
                  );
                });
            }
          });

          it('should create all specified tables and columns', function () {
            // Map the table names to promises that evaluate chai expectations to
            // confirm that the table exists and the 'id' and 'name' columns exist
            // within the table
            return Promise.all(
              tables.map(function (table) {
                return knex.schema.hasTable(table).then(function (exists) {
                  expect(exists).to.equal(true);
                  if (exists) {
                    return Promise.all([
                      knex.schema
                        .hasColumn(table, 'id')
                        .then(function (exists) {
                          expect(exists).to.equal(true);
                        }),
                      knex.schema
                        .hasColumn(table, 'name')
                        .then(function (exists) {
                          expect(exists).to.equal(true);
                        }),
                    ]);
                  }
                });
              })
            );
          });
        });

        describe('knex.migrate.latest - multiple directories', () => {
          before(() => {
            return knex.migrate.latest({
              directory: [
                'test/integration2/migrate/test',
                'test/integration2/migrate/test2',
              ],
            });
          });

          after(() => {
            return knex.migrate.rollback({
              directory: [
                'test/integration2/migrate/test',
                'test/integration2/migrate/test2',
              ],
            });
          });

          it('should create tables specified in both directories', () => {
            // Map the table names to promises that evaluate chai expectations to
            // confirm that the table exists
            const expectedTables = [
              'migration_test_1',
              'migration_test_2',
              'migration_test_2_1',
              'migration_test_3',
              'migration_test_4',
              'migration_test_4_1',
            ];

            return Promise.all(
              expectedTables.map(function (table) {
                return knex.schema.hasTable(table).then(function (exists) {
                  expect(exists).to.equal(true);
                });
              })
            );
          });
        });

        describe('knex.migrate.rollback', function () {
          it('should delete the most recent batch from the migration log', function () {
            return knex.migrate
              .rollback({ directory: 'test/integration2/migrate/test' })
              .then(([batchNo, log]) => {
                assertNumber(knex, batchNo, 1);
                expect(log).to.have.length(2);
                expect(log[0]).to.contain(batchNo);
                return knex('knex_migrations')
                  .select('*')
                  .then(function (data) {
                    expect(data.length).to.equal(0);
                  });
              });
          });

          it('should drop tables as specified in the batch', function () {
            return Promise.all(
              tables.map(function (table) {
                return knex.schema.hasTable(table).then(function (exists) {
                  expect(!!exists).to.equal(false);
                });
              })
            );
          });
        });

        describe('knex.migrate.rollback - all', () => {
          before(() => {
            return knex.migrate
              .latest({
                directory: ['test/integration2/migrate/test'],
              })
              .then(function () {
                return knex.migrate.latest({
                  directory: [
                    'test/integration2/migrate/test',
                    'test/integration2/migrate/test2',
                  ],
                });
              });
          });

          it('should delete all batches from the migration log', () => {
            return knex.migrate
              .rollback(
                {
                  directory: [
                    'test/integration2/migrate/test',
                    'test/integration2/migrate/test2',
                  ],
                },
                true
              )
              .then(([batchNo, log]) => {
                assertNumber(knex, batchNo, 2);
                expect(log).to.have.length(4);
                return knex('knex_migrations')
                  .select('*')
                  .then(function (data) {
                    expect(data.length).to.equal(0);
                  });
              });
          });

          it('should drop tables as specified in the batch', () => {
            return Promise.all(
              tables.map(function (table) {
                return knex.schema.hasTable(table).then(function (exists) {
                  expect(!!exists).to.equal(false);
                });
              })
            );
          });
        });

        describe('knex.migrate.rollback - all', () => {
          before(() => {
            return knex.migrate.latest({
              directory: ['test/integration2/migrate/test'],
            });
          });

          it('should only rollback migrations that have been completed and in reverse chronological order', () => {
            return knex.migrate
              .rollback(
                {
                  directory: [
                    'test/integration2/migrate/test',
                    'test/integration2/migrate/test2',
                  ],
                },
                true
              )
              .then(([batchNo, log]) => {
                assertNumber(knex, batchNo, 1);
                expect(log).to.have.length(2);

                fs.readdirSync('test/integration2/migrate/test')
                  .reverse()
                  .forEach((fileName, index) => {
                    expect(fileName).to.equal(log[index]);
                  });

                return knex('knex_migrations')
                  .select('*')
                  .then(function (data) {
                    expect(data.length).to.equal(0);
                  });
              });
          });

          it('should drop tables as specified in the batch', () => {
            return Promise.all(
              tables.map(function (table) {
                return knex.schema.hasTable(table).then(function (exists) {
                  expect(!!exists).to.equal(false);
                });
              })
            );
          });
        });

        describe('knex.migrate.up', () => {
          afterEach(() => {
            return knex.migrate.rollback(
              { directory: 'test/integration2/migrate/test' },
              true
            );
          });

          it('should only run the first migration if no migrations have run', function () {
            return knex.migrate
              .up({
                directory: 'test/integration2/migrate/test',
              })
              .then(() => {
                return knex('knex_migrations')
                  .select('*')
                  .then(function (data) {
                    expect(data).to.have.length(1);
                    expect(path.basename(data[0].name)).to.equal(
                      '20131019235242_migration_1.js'
                    );
                  });
              });
          });

          it('should only run the next migration that has not yet run if other migrations have already run', function () {
            return knex.migrate
              .up({
                directory: 'test/integration2/migrate/test',
              })
              .then(() => {
                return knex.migrate
                  .up({
                    directory: 'test/integration2/migrate/test',
                  })
                  .then(() => {
                    return knex('knex_migrations')
                      .select('*')
                      .then(function (data) {
                        expect(data).to.have.length(2);
                        expect(path.basename(data[0].name)).to.equal(
                          '20131019235242_migration_1.js'
                        );
                        expect(path.basename(data[1].name)).to.equal(
                          '20131019235306_migration_2.js'
                        );
                      });
                  });
              });
          });

          it('should not error if all migrations have already been run', function () {
            return knex.migrate
              .latest({
                directory: 'test/integration2/migrate/test',
              })
              .then(() => {
                return knex.migrate
                  .up({
                    directory: 'test/integration2/migrate/test',
                  })
                  .then((data) => {
                    expect(data).to.be.an('array');
                  });
              });
          });

          it('should drop a column with a default constraint (mssql)', async () => {
            await knex.migrate.latest({
              directory:
                'test/integration2/migrate/drop-with-default-constraint',
            });

            await knex.migrate.rollback({
              directory:
                'test/integration2/migrate/drop-with-default-constraint',
            });
          });

          describe('with transactions disabled', () => {
            beforeEach(async () => {
              await knex.migrate.up({
                directory:
                  'test/integration2/migrate/test_single_per_migration_trx_disabled',
                name: 'create_table.js',
              });
              await knex.table('test_transactions').insert({ value: 0 });
            });

            afterEach(async () => {
              await knex.migrate.rollback(
                {
                  directory:
                    'test/integration2/migrate/test_single_per_migration_trx_disabled',
                },
                true
              );
            });

            it('should partially run', async () => {
              await expect(
                knex.migrate.up({
                  directory:
                    'test/integration2/migrate/test_single_per_migration_trx_disabled',
                  name: 'up.js',
                })
              ).to.eventually.be.rejected;
              const { value } = await knex
                .table('test_transactions')
                .select('value')
                .first();
              assertNumber(knex, value, 1); // updated by migration before error
            });
          });
        });

        describe('knex.migrate.down', () => {
          describe('with transactions enabled', () => {
            beforeEach(async () => {
              await knex.migrate.latest({
                directory: ['test/integration2/migrate/test'],
              });
            });

            afterEach(async () => {
              await knex.migrate.rollback(
                { directory: ['test/integration2/migrate/test'] },
                true
              );
            });

            it('should only undo the last migration that was run if all migrations have run', async () => {
              await knex.migrate.down({
                directory: ['test/integration2/migrate/test'],
              });
              const data = await knex('knex_migrations').select('*');
              expect(data).to.have.length(1);
              expect(path.basename(data[0].name)).to.equal(
                '20131019235242_migration_1.js'
              );
            });

            it('should only undo the last migration that was run if there are other migrations that have not yet run', async () => {
              await knex.migrate.down({
                directory: ['test/integration2/migrate/test'],
              });
              await knex.migrate.down({
                directory: ['test/integration2/migrate/test'],
              });
              const data = await knex('knex_migrations').select('*');
              expect(data).to.have.length(0);
            });

            it('should not error if all migrations have already been undone', async () => {
              await knex.migrate.rollback(
                { directory: ['test/integration2/migrate/test'] },
                true
              );
              const data = await knex.migrate.down({
                directory: ['test/integration2/migrate/test'],
              });
              expect(data).to.be.an('array');
            });
          });

          describe('with transactions disabled', () => {
            beforeEach(async () => {
              await knex.migrate.up({
                directory:
                  'test/integration2/migrate/test_single_per_migration_trx_disabled',
                name: 'create_table.js',
              });
              await knex.table('test_transactions').insert({ value: 0 });
            });

            afterEach(async () => {
              await knex.migrate.rollback(
                {
                  directory:
                    'test/integration2/migrate/test_single_per_migration_trx_disabled/rollback',
                },
                true
              );
            });

            it('should partially run', async () => {
              await knex.migrate.up({
                directory:
                  'test/integration2/migrate/test_single_per_migration_trx_disabled',
                name: 'down.js',
              });
              await expect(
                knex.migrate.down({
                  directory:
                    'test/integration2/migrate/test_single_per_migration_trx_disabled',
                  name: 'down.js',
                })
              ).to.eventually.be.rejected;
              const { value } = await knex
                .table('test_transactions')
                .select('value')
                .first();
              assertNumber(knex, value, -1); // updated by migration before error
            });
          });
        });

        describe('knex.migrate.list', () => {
          const availableMigrations = [
            '20131019235242_migration_1.js',
            '20131019235306_migration_2.js',
          ];

          const knexConfig = {
            directory: ['test/integration2/migrate/test'],
          };

          beforeEach(async () => {
            await knex.migrate.rollback(knexConfig, true);
          });

          describe('should list pending and completed migrations', () => {
            it('as an array of arrays of pending and completed migrations', async () => {
              const listedMigrations = await knex.migrate.list(knexConfig);
              expect(listedMigrations).to.have.lengthOf(2);
              expect(listedMigrations[0]).to.be.an.instanceof(Array);
              expect(listedMigrations[1]).to.be.an.instanceof(Array);
            });

            it('in the right quantity', async () => {
              let [completed, pending] = await knex.migrate.list(knexConfig);

              expect(completed).to.have.lengthOf(0);
              expect(pending).to.have.lengthOf(2);

              await knex.migrate.latest(knexConfig);

              [completed, pending] = await knex.migrate.list(knexConfig);

              expect(completed).to.have.lengthOf(2);
              expect(pending).to.have.lengthOf(0);
            });

            it('with the right object structure for pending migrations', async () => {
              const [completed, pending] = await knex.migrate.list(knexConfig);

              expect(completed).to.deep.equal([]);
              expect(pending).to.deep.equal(
                availableMigrations.map((migration) => ({
                  file: migration,
                  directory: knexConfig.directory[0],
                }))
              );
            });

            it('with the right object structure for completed migrations', async () => {
              await knex.migrate.latest(knexConfig);
              const [completed, pending] = await knex.migrate.list(knexConfig);

              expect(completed).to.deep.equal(
                availableMigrations.map((migration) => ({
                  name: migration,
                }))
              );
              expect(pending).to.deep.equal([]);
            });
          });
        });

        after(function () {
          rimraf.sync(path.join(__dirname, './migration'));
        });
      });

      describe('knex.migrate.latest in parallel', function () {
        afterEach(function () {
          return knex.migrate.rollback({
            directory: 'test/integration2/migrate/test',
          });
        });

        if (isPostgreSQL(knex) || isMssql(knex)) {
          it('is able to run two migrations in parallel (if no implicit DDL commits)', function () {
            return Promise.all([
              knex.migrate.latest({
                directory: 'test/integration2/migrate/test',
              }),
              knex.migrate.latest({
                directory: 'test/integration2/migrate/test',
              }),
            ]).then(function () {
              return knex('knex_migrations')
                .select('*')
                .then(function (data) {
                  expect(data.length).to.equal(2);
                });
            });
          });
        }

        /** TODO : fix me and enabled it.
         * Fail randomly with (mostly with PostgreSQL, PgNative, CockroachDb):
         *  knex.migrate.latest in parallel
         *    is not able to run two migrations in parallel when transactions are disabled:

         *    AssertionError: expected false to equal true
         *    + expected - actual

         *    -false
         *    +true

         *    at /home/runner/work/knex/knex/test/integration2/migrate/migration-integration.spec.js:944:37
         *    at runMicrotasks (<anonymous>)
         *    at processTicksAndRejections (internal/process/task_queues.js:95:5)
         */
        it.skip('is not able to run two migrations in parallel when transactions are disabled', function () {
          const migrations = [
            knex.migrate
              .latest({
                directory: 'test/integration2/migrate/test',
                disableTransactions: true,
              })
              .catch(function (err) {
                return err;
              }),
            knex.migrate
              .latest({
                directory: 'test/integration2/migrate/test',
                disableTransactions: true,
              })
              .catch(function (err) {
                return err;
              }),
          ];

          return Promise.all(
            migrations.map((migration) =>
              migration.then((res) => res && res.name)
            )
          ).then(function (res) {
            // One should fail:
            const hasLockError =
              res[0] === 'MigrationLocked' || res[1] === 'MigrationLocked';
            expect(hasLockError).to.equal(true);

            // But the other should succeed:
            return knex('knex_migrations')
              .select('*')
              .then(function (data) {
                expect(data.length).to.equal(2);
              });
          });
        });
      });

      describe('knex.migrate (transactions disabled)', function () {
        describe('knex.migrate.latest (all transactions disabled)', function () {
          before(function () {
            return knex.migrate
              .latest({
                directory: 'test/integration2/migrate/test_with_invalid',
                disableTransactions: true,
              })
              .catch(function () {});
          });

          // Same test as before, but this time, because
          // transactions are off, the column gets created for all dialects always.
          it('should create column even in invalid migration', function () {
            return knex.schema
              .hasColumn('migration_test_1', 'transaction')
              .then(function (exists) {
                expect(exists).to.equal(true);
              });
          });

          after(function () {
            return knex.migrate.rollback({
              directory: 'test/integration2/migrate/test_with_invalid',
            });
          });
        });

        describe('knex.migrate.latest (per-migration transaction disabled)', function () {
          before(function () {
            return knex.migrate
              .latest({
                directory:
                  'test/integration2/migrate/test_per_migration_trx_disabled',
              })
              .catch(function () {});
          });

          it('should run all working migration files in the specified directory', function () {
            return knex('knex_migrations')
              .select('*')
              .then(function (data) {
                expect(data.length).to.equal(1);
              });
          });

          it('should create column in invalid migration with transaction disabled', function () {
            return knex.schema
              .hasColumn('migration_test_trx_1', 'transaction')
              .then(function (exists) {
                expect(exists).to.equal(true);
              });
          });

          after(function () {
            return knex.migrate.rollback({
              directory:
                'test/integration2/migrate/test_per_migration_trx_disabled',
            });
          });
        });

        describe('knex.migrate.latest (per-migration transaction enabled)', function () {
          before(function () {
            return knex.migrate
              .latest({
                directory:
                  'test/integration2/migrate/test_per_migration_trx_enabled',
                disableTransactions: true,
              })
              .catch(function () {});
          });

          it('should run all working migration files in the specified directory', function () {
            return knex('knex_migrations')
              .select('*')
              .then(function (data) {
                expect(data.length).to.equal(1);
              });
          });

          it('should not create column for invalid migration with transaction enabled', function () {
            return knex.schema
              .hasColumn('migration_test_trx_1', 'transaction')
              .then(function (exists) {
                // MySQL / Oracle commit transactions implicit for most common
                // migration statements (e.g. CREATE TABLE, ALTER TABLE, DROP TABLE),
                // so we need to check for dialect
                if (isMysql(knex) || isOracle(knex)) {
                  expect(exists).to.equal(true);
                } else {
                  expect(exists).to.equal(false);
                }
              });
          });

          after(function () {
            return knex.migrate.rollback({
              directory:
                'test/integration2/migrate/test_per_migration_trx_enabled',
            });
          });
        });

        if (isPostgreSQL(knex)) {
          describe('knex.migrate.latest with specific changelog schema', function () {
            before(() => {
              return knex.raw(`CREATE SCHEMA IF NOT EXISTS "testschema"`);
            });
            after(() => {
              return knex.raw(`DROP SCHEMA "testschema" CASCADE`);
            });

            it('should create changelog in the correct schema without transactions', function (done) {
              knex.migrate
                .latest({
                  directory: 'test/integration2/migrate/test',
                  disableTransactions: true,
                  schemaName: 'testschema',
                })
                .then(() => {
                  return knex('testschema.knex_migrations')
                    .select('*')
                    .then(function (data) {
                      expect(data.length).to.equal(2);
                      done();
                    });
                });
            });

            it('should create changelog in the correct schema with transactions', function (done) {
              knex.migrate
                .latest({
                  directory: 'test/integration2/migrate/test',
                  disableTransactions: false,
                  schemaName: 'testschema',
                })
                .then(() => {
                  return knex('testschema.knex_migrations')
                    .select('*')
                    .then(function (data) {
                      expect(data.length).to.equal(2);
                      done();
                    });
                });
            });

            afterEach(function () {
              return knex.migrate.rollback({
                directory: 'test/integration2/migrate/test',
                disableTransactions: true,
                schemaName: 'testschema',
              });
            });
          });
        }
      });

      describe('migrationSource config', function () {
        const migrationSource = {
          getMigrations() {
            return Promise.resolve(Object.keys(testMemoryMigrations).sort());
          },
          getMigrationName(migration) {
            return migration;
          },
          getMigration(migration) {
            return testMemoryMigrations[migration];
          },
        };

        before(() => {
          return knex.migrate.latest({
            migrationSource,
          });
        });

        after(() => {
          return knex.migrate.rollback({
            migrationSource,
          });
        });

        it('can accept a custom migration source', function () {
          return knex.schema
            .hasColumn('migration_source_test_1', 'name')
            .then(function (exists) {
              expect(exists).to.equal(true);
            });
        });
      });

      describe('migrationSource config as class', function () {
        const migrations = {
          migration1: {
            up(knex) {
              return knex.schema.createTable(
                'migration_source_test_1',
                function (t) {
                  t.increments();
                  t.string('name');
                }
              );
            },
            down(knex) {
              return knex.schema.dropTable('migration_source_test_1');
            },
          },
        };

        class MigrationSource {
          getMigrations() {
            return Promise.resolve(Object.keys(migrations));
          }
          getMigrationName(migration) {
            return 'migration1';
          }
          getMigration(migration) {
            return migrations[migration];
          }
        }
        const migrationSource = new MigrationSource();

        before(() => {
          return knex.migrate.latest({
            migrationSource,
          });
        });

        after(() => {
          return knex.migrate.rollback({
            migrationSource,
          });
        });

        it('can accept a custom migration source', function () {
          return knex.schema
            .hasColumn('migration_source_test_1', 'name')
            .then(function (exists) {
              expect(exists).to.equal(true);
            });
        });
      });

      describe('migrationSource config as class for migrate:make', function () {
        class MigrationSource {
          getMigrations() {
            return Promise.resolve([]);
          }
          getMigrationName(migration) {
            return undefined;
          }
          getMigration(migration) {
            return {};
          }
        }

        it('does not reset a custom migration source', async () => {
          const oldLogger = knex.client.logger;
          const warnMessages = [];
          knex.client.logger = {
            warn: (msg) => {
              warnMessages.push(msg);
            },
          };

          const migrationSource = new MigrationSource();
          const fileHelper = new FileTestHelper();

          await knex.migrate.make('testMigration', {
            migrationSource,
          });

          fileHelper.deleteFileGlob(
            `test/integration2/migrate/migration/*testMigration.js`
          );
          knex.client.logger = oldLogger;
          expect(warnMessages.length).equal(0);
        });
      });

      describe('knex.migrate.latest with custom config parameter for table name', function () {
        before(function () {
          return knex
            .withUserParams({ customTableName: 'migration_test_2_1a' })
            .migrate.latest({
              directory: 'test/integration2/migrate/test',
            });
        });

        it('should create all specified tables and columns', function () {
          const tables = [
            'migration_test_1',
            'migration_test_2',
            'migration_test_2_1a',
          ];
          return Promise.all(
            tables.map(function (table) {
              return knex.schema.hasTable(table).then(function (exists) {
                expect(exists).to.equal(true);
                if (exists) {
                  return Promise.all([
                    knex.schema.hasColumn(table, 'id').then(function (exists) {
                      expect(exists).to.equal(true);
                    }),
                    knex.schema
                      .hasColumn(table, 'name')
                      .then(function (exists) {
                        expect(exists).to.equal(true);
                      }),
                  ]);
                }
              });
            })
          );
        });

        it('should not create unexpected tables', function () {
          const table = 'migration_test_2_1';
          return knex.schema.hasTable(table).then(function (exists) {
            expect(exists).to.equal(false);
          });
        });

        after(function () {
          return knex
            .withUserParams({ customTableName: 'migration_test_2_1a' })
            .migrate.rollback({
              directory: 'test/integration2/migrate/test',
            });
        });
      });

      describe('knex.migrate.latest with disableValidateMigrationList', function () {
        it('should not fail if there is a missing migration', async () => {
          try {
            await knex.migrate.latest({
              directory: 'test/integration2/migrate/test',
            });

            await knex.migrate.latest({
              directory:
                'test/integration2/migrate/test_with_missing_first_migration',
              disableMigrationsListValidation: true,
            });
          } finally {
            await knex.migrate.rollback({
              directory: 'test/integration2/migrate/test',
            });
          }
        });
      });

      describe('Test lock row', async () => {
        beforeEach(async () => {
          await knex.schema.dropTableIfExists('test_lock');
        });

        it('should insert is_locked value to 1 if lock table not exists', async () => {
          const result = await ensureTable('test', undefined, knex);

          expect(!!(result || result.length)).is.true;
          const data = await knex('test_lock').select('*');
          expect(data[0]).to.have.property('is_locked');
          expect(Number.parseInt(data[0].is_locked)).to.not.be.ok;
        });

        it('should is_locked value still be 1 if row already exists', async () => {
          await knex.schema.createTable('test_lock', (t) => {
            t.increments('index').primary();
            t.integer('is_locked');
          });
          await knex('test_lock').insert({ is_locked: 1 });

          const result = await ensureTable('test', undefined, knex);
          expect(result).to.false;
          const data = await knex('test_lock').select('*');
          expect(data[0]).to.have.property('is_locked');
          expect(Number.parseInt(data[0].is_locked)).to.be.ok;
        });
      });
    });
  });
});
