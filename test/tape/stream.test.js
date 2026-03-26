'use strict';

const stream = require('stream');
const { isPostgreSQL } = require('../util/db-helpers');
const {
  getAllDbs,
  getKnexForDb,
} = require('../integration2/util/knex-instance-provider');

getAllDbs().forEach((db) => {
  describe(`${db} - stream`, () => {
    let knex;

    beforeAll(() => {
      knex = getKnexForDb(db);
    });

    afterAll(() => knex.destroy());

    it('streams properly in postgres', async () => {
      if (!isPostgreSQL(knex)) {
        return;
      }

      await new Promise((resolve, reject) => {
        const w = new stream.Writable({
          objectMode: true,
        });
        w._write = function (chunk, _, next) {
          setTimeout(next, 10);
        };
        knex
          .raw('select * from generate_series(0, 10, 1)')
          .pipe(w)
          .on('finish', function () {
            expect(true).toBe(true);
            resolve();
          })
          .on('error', reject);
      });
    });
  });
});
