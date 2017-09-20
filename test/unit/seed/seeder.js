/*global after, before, beforeEach, expect, describe, it*/
/*eslint no-var:0, indent:0, max-len:0 */
'use strict';

var mockFs = require('mock-fs');
var knex = require('../../../knex');

describe('Seeder.loadExtensions', function () {
  var config = {
    client: 'pg',
    connection: {
      user: 'postgres',
      password: '',
      host: '127.0.0.1',
      database: 'knex_test'
    },
    seeds: {
      directory: 'test/integration/seed/seeds'
    }
  };
  var seeder;

  before(function() {
    mockFs({
      'test/integration/seed/seeds': {
        'co-seed.co': 'co seed content',
        'coffee-seed.coffee': 'coffee seed content',
        'eg-seed.eg': 'eg seed content',
        'iced-seed.iced': 'iced seed content',
        'js-seed.js': 'js seed content',
        'litcoffee-seed.litcoffee': 'litcoffee seed content',
        'ls-seed.ls': 'ls seed content',
        'ts-seed.ts': 'ts seed content',
        'useless.txt': 'i am not a seed'
      },
    });
  });

  after(function() {
    mockFs.restore();
  });

  beforeEach(function () {
    seeder = knex(config).seed;
  });

  it('should include all supported extensions by default', function () {
    return seeder._listAll()
      .then(function(list){
        expect(list).to.eql([
          'co-seed.co',
          'coffee-seed.coffee',
          'eg-seed.eg',
          'iced-seed.iced',
          'js-seed.js',
          'litcoffee-seed.litcoffee',
          'ls-seed.ls',
          'ts-seed.ts'
        ])
      })
  });

  it('should list only files with specified extensions', function () {
    return seeder._listAll({ loadExtensions: ['.ts', '.js'] })
      .then(function(list){
        expect(list).to.eql([
          'js-seed.js',
          'ts-seed.ts',
        ])
      })
  });

});
