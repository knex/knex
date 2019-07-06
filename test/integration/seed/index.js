/*global describe, it, expect*/
'use strict';

const path = require('path');
const rimraf = require('rimraf');

module.exports = function(knex) {
  describe('knex.seed.make', () => {
    it('should create a new seed file with the make method', () => {
      return knex.seed.make('test').then((name) => {
        rimraf.sync(path.dirname(name));
        expect(path.basename(name)).to.equal('test.js');
      });
    });
  });

  describe('knex.seed.run', () => {
    it('should run all seed files in the configured seed directory', () => {
      return knex.seed
        .run({ directory: 'test/integration/seed/test' })
        .then(([data]) => {
          expect(path.basename(data[0])).to.equal('seed1.js');
          expect(path.basename(data[1])).to.equal('seed2.js');
        });
    });

    it('should run specific seed file in the configured seed directory', () => {
      return knex.seed
        .run({ directory: 'test/integration/seed/test', specific: 'seed2.js' })
        .then(([data]) => {
          expect(data.length).to.equal(1);
          expect(path.basename(data[0])).to.equal('seed2.js');
        });
    });
  });
};
