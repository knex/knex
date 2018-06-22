/*global after, before, beforeEach, expect, describe, it*/
/*eslint no-var:0, indent:0, max-len:0 */
'use strict';

var mockFs = require('mock-fs');
var knex = require('../../../knex');

var config = {
  client: 'pg',
  connection: {
    user: 'postgres',
    password: '',
    host: '127.0.0.1',
    database: 'knex_test'
  },
  migrations: {
    directory: 'test/integration/migrate/migration'
  }
};

describe('Migrator.loadExtensions', function () {
  var migrator;

  before(function() {
    mockFs({
      'test/integration/migrate/migration': {
        'co-migration.co': 'co migation content',
        'coffee-migration.coffee': 'coffee migation content',
        'eg-migration.eg': 'eg migation content',
        'iced-migration.iced': 'iced migation content',
        'js-migration.js': 'js migation content',
        'litcoffee-migration.litcoffee': 'litcoffee migation content',
        'ls-migration.ls': 'ls migation content',
        'ts-migration.ts': 'ts migation content',
        'useless.txt': 'i am not a migration'
      }
    });
  });

  after(function() {
    mockFs.restore();
  });

  beforeEach(function () {
    migrator = knex(config).migrate;
  });

  it('should include all supported extensions by default', function () {
    return migrator._listAll()
      .then(function(list){
        expect(list).to.eql([
          'co-migration.co',
          'coffee-migration.coffee',
          'eg-migration.eg',
          'iced-migration.iced',
          'js-migration.js',
          'litcoffee-migration.litcoffee',
          'ls-migration.ls',
          'ts-migration.ts'
        ])
      })
  });

  it('should include only files with specified extensions', function () {
    return migrator._listAll({ loadExtensions: ['.ts', '.js'] })
      .then(function(list){
        expect(list).to.eql([
          'js-migration.js',
          'ts-migration.ts',
        ])
      })
  });

});

describe('Migrator.validateMigrationList', function () {
  it('should throw error if migrations list is invalid', function () {
    var migrator = knex(config).migrate;
    var result;
    try {
      result = migrator.validateMigrationList([[], ['absent']]);
    } catch (err) {
      result = err;
    }
    return expect(result).to.be.an.instanceof(Error);
  });

  it('should return if migrations list is invalid', function () {
    var customMigrator = knex(Object.assign(config, {migrations: {validateMigrationList: false}})).migrate;
    return expect(customMigrator.validateMigrationList([[], ['absent']])).to.eql(undefined)
  });

  it('should return if migrations list is valid', function () {
    var migrator = knex(config).migrate;
    return expect(migrator.validateMigrationList([['present'], ['present']])).to.eql(undefined)
  });
});
