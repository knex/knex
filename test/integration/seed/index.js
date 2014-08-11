var equal    = require('assert').equal;
var path     = require('path');
var rimraf   = require('rimraf');
var Promise  = require('../../../lib/promise');

module.exports = function(knex) {

  require('rimraf').sync(path.join(__dirname, './seed'));

  describe('knex.seed.make', function() {
    it('should create a new seed file with the make method', function () {
      return knex.seed.make('test').then(function (name) {
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

  after(function() {
    rimraf.sync(path.join(__dirname, './seed'));
  });

};