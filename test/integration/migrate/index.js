/*global after, before, describe, expect, it*/
'use strict';

var equal    = require('assert').equal;
var path     = require('path');
var rimraf   = require('rimraf');
var Promise  = require('bluebird');

module.exports = function(knex) {

  require('rimraf').sync(path.join(__dirname, './migration'));

  before(function() {
    // make sure lock was not left from previous failed test run
    return knex.migrate.forceFreeMigrationsLock({directory: 'test/integration/migrate/test'});
  });

  describe('knex.migrate', function () {

    it('should create a new migration file with the create method', function() {
      return knex.migrate.make('test').then(function(name) {
        name = path.basename(name);
        expect(name.split('_')[0]).to.have.length(14);
        expect(name.split('_')[1].split('.')[0]).to.equal('test');
      });
    });

    it('should list the current migration state with the currentVersion method', function() {
      return knex.migrate.currentVersion().then(function(version) {
        equal(version, 'none');
      });
    });

    var tables = ['migration_test_1', 'migration_test_2', 'migration_test_2_1'];

    describe('knex.migrate.status', function() {

      beforeEach(function() {
        return knex.migrate.latest({directory: 'test/integration/migrate/test'});
      });

      afterEach(function() {
        return knex.migrate.rollback({directory: 'test/integration/migrate/test'});
      });

      it('should create a migrations lock table', function() {
        return knex.schema.hasTable('knex_migrations_lock').then(function(exists) {
          expect(exists).to.equal(true);

          return knex.schema.hasColumn('knex_migrations_lock', 'is_locked').then(function(exists) {
            expect(exists).to.equal(true);
          });
        });
      });

      it('should return 0 if code matches DB', function() {
        return knex.migrate.status({directory: 'test/integration/migrate/test'}).then(function(migrationLevel) {
          expect(migrationLevel).to.equal(0);
        });
      });

      it('should return a negative number if the DB is behind', function() {
        return knex.migrate.rollback({directory: 'test/integration/migrate/test'}).then(function () {
          return knex.migrate.status({directory: 'test/integration/migrate/test'}).then(function(migrationLevel) {
            expect(migrationLevel).to.equal(-2);
          });
        });
      });

      it('should return a positive number if the DB is ahead', function() {
        return Promise.all([
          knex('knex_migrations').returning('id').insert({
            name: 'foobar',
            batch: 5,
            migration_time: new Date()
          }),
          knex('knex_migrations').returning('id').insert({
            name: 'foobar',
            batch: 5,
            migration_time: new Date()
          }),
          knex('knex_migrations').returning('id').insert({
            name: 'foobarbaz',
            batch: 6,
            migration_time: new Date()
          })
        ])
          .spread(function(migration1, migration2, migration3) {
            return knex.migrate.status({directory: 'test/integration/migrate/test'}).then(function(migrationLevel) {
              expect(migrationLevel).to.equal(3);
            })
            .then(function() {
              // Cleanup the added migrations
              return knex('knex_migrations')
                .where('id', migration1[0])
                .orWhere('id', migration2[0])
                .orWhere('id', migration3[0])
                .del()
            });
          });
      });

    });

    describe('knex.migrate.latest', function() {

      before(function() {
        return knex.migrate.latest({directory: 'test/integration/migrate/test'});
      });

      it('should remove the record in the lock table once finished', function() {
        return knex('knex_migrations_lock').select('*').then(function(data) {
          expect(data[0]).to.have.property('is_locked');
          expect(data[0].is_locked).to.not.be.ok;
        });
      });

      it('should throw error if the migrations are already running', function() {
        return knex('knex_migrations_lock')
          .update({ is_locked: 1 })
          .then(function() {
            return knex.migrate.latest({directory: 'test/integration/migrate/test'})
              .then(function() {
                throw new Error('then should not execute');
              });
          })
          .catch(function(error) {
            expect(error).to.have.property('message', 'Migration table is already locked');
            return knex('knex_migrations_lock').select('*');
          })
          .then(function(data) {
            expect(data[0].is_locked).to.equal(1);

            // Clean up lock for other tests
            return knex('knex_migrations_lock').update({ is_locked: 0 })
          });
      });

      it('should release lock if non-locking related error is thrown', function() {
        return knex.migrate.latest({directory: 'test/integration/migrate/test'})
          .then(function() {
            throw new Error('then should not execute');
          })
          .catch(function(error) {
            // This will fail because of the invalid migration
            expect(error).to.have.property('message');
            return knex('knex_migrations_lock').select('*')
          })
          .then(function(data) {
            expect(data[0].is_locked).to.not.be.ok;
          });
      });

      it('should run all migration files in the specified directory', function() {
        return knex('knex_migrations').select('*').then(function(data) {
          expect(data.length).to.equal(2);
        });
      });

      it('should run the migrations from oldest to newest', function() {
        if (knex.client.dialect === 'oracle') {
          return knex('knex_migrations').orderBy('migration_time', 'asc').select('*').then(function(data) {
            expect(path.basename(data[0].name)).to.equal('20131019235242_migration_1.js');
            expect(path.basename(data[1].name)).to.equal('20131019235306_migration_2.js');
          });
        } else {
          return knex('knex_migrations').orderBy('id', 'asc').select('*').then(function(data) {
            expect(path.basename(data[0].name)).to.equal('20131019235242_migration_1.js');
            expect(path.basename(data[1].name)).to.equal('20131019235306_migration_2.js');
          });
        }
      });

      it('should create all specified tables and columns', function() {
        // Map the table names to promises that evaluate chai expectations to
        // confirm that the table exists and the 'id' and 'name' columns exist
        // within the table
        return Promise.map(tables, function(table) {
          return knex.schema.hasTable(table).then(function(exists) {
            expect(exists).to.equal(true);
            if (exists) {
              return Promise.all([
                knex.schema.hasColumn(table, 'id').then(function(exists) {
                  expect(exists).to.equal(true);
                }),
                knex.schema.hasColumn(table, 'name').then(function(exists) {
                  expect(exists).to.equal(true);
                })
              ]);
            }
          });
        });
      });
    });

    describe('knex.migrate.rollback', function() {
      it('should delete the most recent batch from the migration log', function() {
        return knex.migrate.rollback({directory: 'test/integration/migrate/test'}).spread(function(batchNo, log) {
          expect(batchNo).to.equal(1);
          expect(log).to.have.length(2);
          var migrationPath = ['test', 'integration', 'migrate', 'test'].join(path.sep); //Test fails on windows if explicitly defining /test/integration/.. ~wubzz
          expect(log[0]).to.contain(migrationPath);
          return knex('knex_migrations').select('*').then(function(data) {
            expect(data.length).to.equal(0);
          });
        });
      });

      it('should drop tables as specified in the batch', function() {
        return Promise.map(tables, function(table) {
          return knex.schema.hasTable(table).then(function(exists) {
            expect(!!exists).to.equal(false);
          });
        });
      });
    });

    after(function() {
      rimraf.sync(path.join(__dirname, './migration'));
    });

  });

  describe('knex.migrate.latest in parallel', function() {

    afterEach(function() {
      return knex.migrate.rollback({directory: 'test/integration/migrate/test'});
    });

    if (knex.client.dialect === 'postgres' || knex.client.dialect === 'mssql') {
      it("is able to run two migrations in parallel (if no implicit DDL commits)", function () {
        return Promise.all([
          knex.migrate.latest({directory: 'test/integration/migrate/test'}),
          knex.migrate.latest({directory: 'test/integration/migrate/test'})
        ])
        .then(function () {
          return knex('knex_migrations').select('*').then(function (data) {
            expect(data.length).to.equal(2);
          });
        });
      });
    }

    it("is not able to run two migrations in parallel when transactions are disabled", function () {
      return Promise.map([
        knex.migrate.latest({directory: 'test/integration/migrate/test', disableTransactions: true})
          .catch(function (err) {return err}),
        knex.migrate.latest({directory: 'test/integration/migrate/test', disableTransactions: true})
          .catch(function (err) {return err})
      ], function (res) {return res && res.name})
        .then(function (res) {
          // One should fail:
          var hasLockError = res[0] === "MigrationLocked" || res[1] === "MigrationLocked";
          expect(hasLockError).to.equal(true);

          // But the other should succeed:
          return knex('knex_migrations').select('*').then(function(data) {
            expect(data.length).to.equal(2);
          })
        });
    });
  });

  describe('knex.migrate (transactions disabled)', function () {

    describe('knex.migrate.latest (all transactions disabled)', function() {

      before(function() {
        return knex.migrate.latest({directory: 'test/integration/migrate/test_with_invalid', disableTransactions: true}).catch(function() {});
      });

      // Same test as before, but this time, because
      // transactions are off, the column gets created for all dialects always.
      it('should create column even in invalid migration', function() {
        return knex.schema.hasColumn('migration_test_1', 'transaction').then(function(exists) {
          expect(exists).to.equal(true);
        });
      });

      after(function() {
        return knex.migrate.rollback({directory: 'test/integration/migrate/test_with_invalid'});
      });

    });

    describe('knex.migrate.latest (per-migration transaction disabled)', function() {

      before(function() {
        return knex.migrate.latest({directory: 'test/integration/migrate/test_per_migration_trx_disabled'}).catch(function() {});
      });

      it('should run all working migration files in the specified directory', function() {
        return knex('knex_migrations').select('*').then(function(data) {
          expect(data.length).to.equal(1);
        });
      });

      it('should create column in invalid migration with transaction disabled', function() {
        return knex.schema.hasColumn('migration_test_trx_1', 'transaction').then(function(exists) {
          expect(exists).to.equal(true);
        });
      });

      after(function() {
        return knex.migrate.rollback({directory: 'test/integration/migrate/test_per_migration_trx_disabled'});
      });

    });

    describe('knex.migrate.latest (per-migration transaction enabled)', function() {

      before(function() {
        return knex.migrate.latest({directory: 'test/integration/migrate/test_per_migration_trx_enabled', disableTransactions: true}).catch(function() {});
      });

      it('should run all working migration files in the specified directory', function() {
        return knex('knex_migrations').select('*').then(function(data) {
          expect(data.length).to.equal(1);
        });
      });

      it('should not create column for invalid migration with transaction enabled', function() {
        return knex.schema.hasColumn('migration_test_trx_1', 'transaction').then(function(exists) {
          // MySQL / Oracle commit transactions implicit for most common
          // migration statements (e.g. CREATE TABLE, ALTER TABLE, DROP TABLE),
          // so we need to check for dialect
          if (knex.client.dialect === 'mysql' || knex.client.dialect === 'mariadb' || knex.client.dialect === 'oracle') {
            expect(exists).to.equal(true);
          } else {
            expect(exists).to.equal(false);
          }
        });
      });

      after(function() {
        return knex.migrate.rollback({directory: 'test/integration/migrate/test_per_migration_trx_enabled'});
      });

    });

  });

};
