const { getAllDbs, getKnexForDb } = require('./util/knex-instance-provider');

describe('knex', () => {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;
      before(() => {
        knex = getKnexForDb(db);
      });

      after(() => {
        return knex.destroy();
      });

      describe('destroy', () => {
        it('works correctly when called multiple times', async () => {
          await knex.destroy();
          await knex.destroy();
        });
      });
    });
  });
});
