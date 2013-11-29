var equal    = require('assert').equal;
var path     = require('path');
var rimraf   = require('rimraf');
var Promise  = require('../../../lib/promise').Promise;

module.exports = function(knex) {

  var migrationConfig = {
    directory: path.join(__dirname, './migration/')
  };

  require('rimraf').sync(path.join(__dirname, './migration'));

  describe('knex.migrate', function () {

    it('should create a new migration file with the create method', function() {
      return knex.migrate.make('test', migrationConfig).then(function(name) {
        expect(name.split('_')[0]).to.have.length(14);
        expect(name.split('_')[1].split('.')[0]).to.equal('test');
      });
    });

    it('should list the current migration state with the currentVersion method', function() {
      return knex.migrate.currentVersion(migrationConfig).then(function(version) {
        equal(version, 'none');
      });
    });

    var tables = ['migration_test_1', 'migration_test_2', 'migration_test_2_1'];

    describe('knex.migrate.latest', function() {
      before(function() {
        return knex.migrate.latest({directory: __dirname + '/test'});
      });

      it('should run all migration files in the specified directory', function() {
        return knex('knex_migrations').select('*').then(function(data) {
          expect(data.length).to.equal(2);
        });
      });

      it('should run the migrations from oldest to newest', function() {
        return knex('knex_migrations').orderBy('id', 'asc').select('*').then(function(data) {
          expect(data[0].name).to.equal('20131019235242_migration_1.js');
          expect(data[1].name).to.equal('20131019235306_migration_2.js');
        });
      });

      it('should create all specified tables and columns', function() {
        // Map the table names to promises that evaluate chai expectations to
        // confirm that the table exists and the 'id' and 'name' columns exist
        // within the table
        return Promise.map(tables, function(table) {
          return knex.schema.hasTable(table).then(function(exists) {
            expect(exists).to.be.true;
            if (exists) {
              return Promise.all([
                knex.schema.hasColumn(table, 'id').then(function(exists) {
                  expect(exists).to.be.true;
                }),
                knex.schema.hasColumn(table, 'name').then(function(exists) {
                  expect(exists).to.be.true;
                })
              ]);
            }
          });
        });
      });

    });

    describe('knex.migrate.rollback', function() {
      it('should delete the most recent batch from the migration log', function() {
        return knex.migrate.rollback({directory: __dirname + '/test'}).then(function() {
          return knex('knex_migrations').select('*').then(function(data) {
            expect(data.length).to.equal(0);
          });
        });
      });

      it('should drop tables as specified in the batch', function() {
        return Promise.map(tables, function(table) {
          return knex.schema.hasTable(table).then(function(exists) {
            expect(exists).to.be.false;
          });
        });
      });
    });

    after(function() {
      rimraf.sync(path.join(__dirname, './migration'));
    });

  });

};