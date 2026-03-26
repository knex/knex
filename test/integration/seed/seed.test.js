'use strict';

const path = require('path');
const rimraf = require('rimraf');
const { getAllDbs, getKnexForDb } = require('../../integration2/util/knex-instance-provider');

getAllDbs().forEach((db) => {
  describe(`${db} - Seed`, () => {
    let knex;
    beforeAll(() => {
      knex = getKnexForDb(db);
    });
    afterAll(() => knex.destroy());

    describe('knex.seed.make', () => {
      it('should create a new seed file with the make method', async () => {
        const name = await knex.seed.make('test');

        rimraf.sync(path.dirname(name));
        expect(path.basename(name)).toBe('test.js');
      });
    });

    describe('knex.seed.run', () => {
      it('should run all seed files in the configured seed directory', async () => {
        const [data] = await knex.seed.run({
          directory: 'test/integration/seed/test',
        });

        expect(path.basename(data[0])).toBe('seed1.js');
        expect(path.basename(data[1])).toBe('seed2.js');
      });

      it('should run specific seed file in the configured seed directory', async () => {
        const [data] = await knex.seed.run({
          directory: 'test/integration/seed/test',
          specific: 'seed2.js',
        });

        expect(data.length).toBe(1);
        expect(path.basename(data[0])).toBe('seed2.js');
      });
    });
  });
});
