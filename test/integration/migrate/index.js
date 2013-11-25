var equal      = require('assert').equal;
var path       = require('path');
var rimraf     = require('rimraf');

module.exports = function(knex) {

  var migrationConfig = {
    directory: path.join(__dirname, './migration/')
  };

  require('rimraf').sync(path.join(__dirname, './migration'));

  describe('knex.migrate', function () {

    it('should create a new migration file with the create method', function() {
      return knex.migrate.make('test', migrationConfig).then(function(name) {
        expect(name.split('_')[0]).to.have.length(14);
      });
    });

    it('should list the current migration state with the currentVersion method', function() {
      return knex.migrate.currentVersion(migrationConfig).then(function(version) {
        equal(version, 'none');
      });
    });

    it('should migrate up to the latest migration with knex.migrate.latest()', function() {
      return knex.migrate.latest({directory: __dirname + '/test'}).then(function() {
        return knex('knex_migrations').select('*').then(function(data) {
          expect(data.length).to.equal(2);
        });
      });
    });
    it('should revert the latest migration group with knex.migrate.rollback()', function() {
      return knex.migrate.rollback({directory: __dirname + '/test'}).then(function() {
        return knex('knex_migrations').select('*').then(function(data) {
          expect(data.length).to.equal(0);
        });
      });
    });

    after(function() {
      rimraf.sync(path.join(__dirname, './migration'));
    });

  });

};