/*eslint no-var:0, max-len:0 */
/*eslint-env mocha */

'use strict';

var expect = require('expect');
var path = require('path');
var rimraf = require('rimraf');

module.exports = function(knex) {

  describe('knex.seed.make', function() {
    it('should create a new seed file with the make method', function () {
      return knex.seed.make('test').then(function (name) {
        rimraf.sync(path.dirname(name));
        expect(path.basename(name)).toEqual('test.js');
      });
    });
  });

  describe('knex.seed.run', function() {
    it('should run all seed files in the configured seed directory', function() {
      return knex.seed.run({directory: 'test/integration/seed/test'}).spread(function(data) {
        expect(path.basename(data[0])).toEqual('seed1.js');
        expect(path.basename(data[1])).toEqual('seed2.js');
      });
    });
  });

};
