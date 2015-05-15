/*global after, before, describe, expect, it*/
'use strict';

var equal    = require('assert').equal;
var path     = require('path');
var rimraf   = require('rimraf');
var Promise  = require('../../../lib/promise');

module.exports = function(knex) {
  describe('knex.migrate', function () {

    var tables = ['migration_test_1', 'migration_test_2', 'migration_test_2_1', 'migration_test_3'];

    var config = {directory: 'test/integration/migrate/test'};

    function resetTables() {
      return Promise.all(['knex_migrations'].concat(tables).map(function(table) {
        return knex.schema.dropTableIfExists(table);
      }));
    }

    function getCompletedMigrations() {
      var orderBy = knex.client.dialect === 'oracle' ? 'migration_time' : 'id';
      return knex('knex_migrations').orderBy(orderBy, 'asc').select('*')
        .then(function(rows) {
          return rows.map(function(row) {
            return row.name;
          });
        });
    }

    describe('knex.migrate.make', function() {

      after(function() {
        rimraf.sync(path.join(__dirname, './migration'));
      });

      it('should create a new migration file with the create method', function() {
        return knex.migrate.make('test').then(function(name) {
          name = path.basename(name);
          expect(name.split('_')[0]).to.have.length(14);
          expect(name.split('_')[1].split('.')[0]).to.equal('test');
        });
      });

    });

    describe('knex.migrate.latest', function() {

      before(function() {
        return knex.migrate.latest(config);
      });

      after(function() {
        return resetTables();
      });

      it('should run all migration files in the specified directory', function() {
        return knex('knex_migrations').select('*').then(function(data) {
          expect(data.length).to.equal(3);
        });
      });

      it('should run the migrations from oldest to newest', function() {
        return getCompletedMigrations().then(function(names) {
          expect(names).to.deep.equal([
            '20131019235242_migration_1.js',
            '20131019235306_migration_2.js',
            '20141001120000_migration_3.js'
          ]);
        });
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

      it('should not create column for invalid migration', function() {
        knex.schema.hasColumn('migration_test_1', 'transaction').then(function(exists) {
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

      it('should not proceed after invalid migration', function() {
        return knex.schema.hasTable('should_not_be_run').then(function(exists) {
          expect(exists).to.equal(false);
        });
      });

    });

    describe('knex.migrate.rollback', function() {

      before(function() {
        return knex.migrate.latest(config)
          .then(function() {
            return knex.migrate.rollback(config);
          });
      });

      it('should delete the most recent batch from the migration log', function() {
        return knex('knex_migrations').select('*').then(function(data) {
          expect(data.length).to.equal(0);
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

    describe('knex.migrate.to', function() {

      it('unknown version fails', function() {
        return knex.migrate.to('i_am_not_here', config)
          .then(function() {
            throw new Error('Incorrect version name should fail.');
          }, function(e) {
            expect(e.message).to.equal('A migration file named `i_am_not_here` does not exist.');
          });
      });

      describe('migrating up', function() {

        before(function() {
          return knex.migrate.to('20131019235306_migration_2.js', config);
        });

        after(function() {
          return resetTables();
        });

        it('runs up-migrations up to and including the target', function() {
          return getCompletedMigrations().then(function(names) {
            expect(names).to.deep.equal([
              '20131019235242_migration_1.js',
              '20131019235306_migration_2.js'
            ]);
          });
        });

      });

      describe('migrating down', function() {

        before(function() {
          return knex.migrate.latest(config)
            .then(function() {
              return knex.migrate.to('20131019235242_migration_1.js', config);
            });
        });

        after(function() {
          return resetTables();
        });

        it('runs down-migrations down to excluding the target', function() {
          return getCompletedMigrations().then(function(names) {
            expect(names).to.deep.equal([
              '20131019235242_migration_1.js'
            ]);
          });
        });

      });

      describe('migrating down to nothing', function() {

        before(function() {
          return knex.migrate.latest(config)
            .then(function() {
              return knex.migrate.to(null, config);
            });
        });

        after(function() {
          return resetTables();
        });

        it('runs all down-migrations', function() {
          return getCompletedMigrations().then(function(names) {
            expect(names).to.deep.equal([]);
          });
        });

      });

      describe('to current version', function() {

        before(function() {
          return knex.migrate.to('20131019235242_migration_1.js', config)
            .then(function() {
              return knex.migrate.to('20131019235242_migration_1.js', config);
            });
        });

        after(function() {
          return resetTables();
        });

        it('does nothing', function() {
          return getCompletedMigrations().then(function(names) {
            expect(names).to.deep.equal([
              '20131019235242_migration_1.js'
            ]);
          });
        });

      });

      describe('using only integer part of migration name', function() {

        before(function() {
          return knex.migrate.to(20131019235306, config);
        });

        after(function() {
          return resetTables();
        });

        it('runs up-migrations up to and including the target', function() {
          return getCompletedMigrations().then(function(names) {
            expect(names).to.deep.equal([
              '20131019235242_migration_1.js',
              '20131019235306_migration_2.js'
            ]);
          });
        });

      });

      describe('from empty to empty', function() {
        before(function() {
          return knex.migrate.to(null, config);
        });

        it('does nothing', function() {
          return getCompletedMigrations().then(function(names) {
            expect(names).to.deep.equal([]);
          });
        });

      });

    });

    describe('knex.migrate.before', function() {

      it('unknown version fails', function() {
        return knex.migrate.before('i_am_not_here', config)
          .then(function() {
            throw new Error('Incorrect version name should fail.');
          }, function(e) {
            expect(e.message).to.equal('A migration file named `i_am_not_here` does not exist.');
          });
      });

      describe('migrating up', function() {

        before(function() {
          return knex.migrate.before('20131019235306_migration_2.js', config);
        });

        after(function() {
          return resetTables();
        });

        it('runs up-migrations up to excluding the target', function() {
          return getCompletedMigrations().then(function(names) {
            expect(names).to.deep.equal([
              '20131019235242_migration_1.js'
            ]);
          });
        });

      });

      describe('migrating down', function() {

        before(function() {
          return knex.migrate.latest(config)
            .then(function() {
              return knex.migrate.before('20131019235306_migration_2.js', config);
            });
        });

        after(function() {
          return resetTables();
        });

        it('runs down-migrations down to and including the target', function() {
          return getCompletedMigrations().then(function(names) {
            expect(names).to.deep.equal([
              '20131019235242_migration_1.js'
            ]);
          });
        });

      });

      describe('to current version', function() {

        before(function() {
          return knex.migrate.before('20131019235306_migration_2.js', config)
            .then(function() {
              return knex.migrate.before('20131019235306_migration_2.js', config);
            });
        });

        after(function() {
          return resetTables();
        });

        it('does nothing', function() {
          return getCompletedMigrations().then(function(names) {
            expect(names).to.deep.equal([
              '20131019235242_migration_1.js'
            ]);
          });
        });

      });

      describe('using only integer part of migration name', function() {

        before(function() {
          return knex.migrate.before(20131019235306, config);
        });

        after(function() {
          return resetTables();
        });

        it('runs up-migrations up to excluding the target', function() {
          return getCompletedMigrations().then(function(names) {
            expect(names).to.deep.equal([
              '20131019235242_migration_1.js'
            ]);
          });
        });

      });

      describe('from empty to empty', function() {
        before(function() {
          return knex.migrate.before('20131019235242_migration_1.js', config);
        });

        it('does nothing', function() {
          return getCompletedMigrations().then(function(names) {
            expect(names).to.deep.equal([]);
          });
        });

      });

    });

    describe('knex.migrate.currentVersion', function() {

      describe('when empty', function() {

        it('should return none', function() {
          return knex.migrate.currentVersion().then(function(version) {
            equal(version, 'none');
          });
        });

      });

      describe('when up-to-date', function() {

        before(function() {
          return knex.migrate.latest(config);
        });

        after(function() {
          return resetTables();
        });

        it('should return timestamp of latest migration', function() {
          return knex.migrate.currentVersion().then(function(version) {
            equal(version, '20141001120000');
          });
        });

      });

      describe('when at specific version', function() {

        before(function() {
          return knex.migrate.to('20131019235242_migration_1.js', config);
        });

        after(function() {
          return resetTables();
        });

        it('should return timestamp of the target migration', function() {
          return knex.migrate.currentVersion().then(function(version) {
            equal(version, '20131019235242');
          });
        });

      });

    });

  });
};
