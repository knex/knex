/*global describe, it, expect*/
'use strict';

var path     = require('path');
var rimraf   = require('rimraf');

module.exports = function(knex) {

  describe('knex.seed.make', function() {
    it('should create a new seed file with the make method', function () {
      return knex.seed.make('test').then(function (name) {
        rimraf.sync(path.dirname(name));
        expect(path.basename(name)).to.equal('test.js');
      });
    });
  });

  describe('knex.seed.run', function() {
    it('should run all seed files in the configured seed directory', function() {
      return knex.seed.run({directory: 'test/integration/seed/test'}).spread(function(data) {
        expect(path.basename(data[0])).to.equal('seed1.js');
        expect(path.basename(data[1])).to.equal('seed2.js');
      });
    });
  });

};
