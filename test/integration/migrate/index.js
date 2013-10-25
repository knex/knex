var equal      = require('assert').equal;
var when       = require('when');
var path       = require('path');
var rimraf     = require('rimraf');

module.exports = function(knex) {

  var migrationConfig = {
    directory: path.join(__dirname, './migration/')
  };

  require('rimraf').sync(path.join(__dirname, './migration'));

  describe('knex.migrate', function () {

    it('should create a new migration file with the create method', function() {
      return knex.migrate.generate('test', migrationConfig).then(function(name) {
        expect(name.split('_')[0]).to.have.length(14);
      });
    });

    it('should list all available migrations with the listAll method', function() {
      return knex.migrate.listAll(migrationConfig).then(function(versions) {
        equal(versions.length, 1);
      });
    });

    it('should list the current migration state with the currentVersion method', function() {
      return knex.migrate.currentVersion(migrationConfig).then(function(version) {
        equal(version, 'none');
      });
    });

    it('should migrate up to the latest migration with knex.migrate.up()');

    it('should migrate up to the latest migration with knex.migrate.down()');

    after(function() {
      rimraf.sync(path.join(__dirname, './migration'));
    });

  });

};