var equal      = require('assert').equal;
var when       = require('when');
var path       = require('path');
var rimraf     = require('rimraf');

module.exports = function(Knex, dbType) {

  var dfd = when.defer();

  var migrationConfig = {
    directory: path.join(__dirname, './migration/', dbType)
  };

  require('rimraf').sync(path.join(__dirname, './migration'));

  describe('Knex.Migrate', function () {

    it('should create a new migration file with the create method', function (ok) {

      Knex.Migrate.create('test', migrationConfig).then(function(name) {
        equal(name.split('_')[0].length, 14);
        ok();
      }).then(null, ok);

    });

    it('should list all available migrations with the listAll method', function(ok) {
      Knex.Migrate.listAll(migrationConfig).then(function(versions) {
        equal(versions.length, 1);
        ok();
      });
    });

    it('should list the current migration state with the currentVersion method', function(ok) {
      Knex.Migrate.currentVersion(migrationConfig).then(function(version) {
        equal(version, 'none');
        ok();
      }).then(null, ok);
    });

    after(function(ok) {
      rimraf.sync(path.join(__dirname, './migration'));
      dfd.resolve();
      ok();
    });

  });

  return dfd.promise;

};