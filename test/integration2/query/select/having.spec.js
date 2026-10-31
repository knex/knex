'use strict';

const { expect } = require('chai');
const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');

describe('Wrapped HAVING filters', () => {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;
      const table = 'wrapped_having_test';

      before(async () => {
        knex = getKnexForDb(db);
        await knex.schema.dropTableIfExists(table);
        await knex.schema.createTable(table, (t) => {
          t.integer('category');
          t.integer('score');
        });
        await knex(table).insert([
          { category: 1, score: 1 },
          { category: 2, score: 10 },
          { category: 2, score: 20 },
        ]);
      });

      after(async () => {
        await knex.schema.dropTableIfExists(table);
        await knex.destroy();
      });

      it('filters aggregate results with a nested having callback', async () => {
        const rows = await knex(table)
          .select('category')
          .groupBy('category')
          .having(function () {
            this.having(knex.raw('sum(??)', ['score']), '>', 5);
          });

        expect(rows).to.deep.equal([{ category: 2 }]);
      });

      it('combines legacy where predicates and nested having groups', async () => {
        const rows = await knex(table)
          .select('category')
          .groupBy('category')
          .havingWrapped(function () {
            this.where('category', '>', 0)
              .having(knex.raw('sum(??)', ['score']), '>', 5)
              .orHaving(function () {
                this.having('category', '=', 1).having(
                  knex.raw('sum(??)', ['score']),
                  '>',
                  5
                );
              });
          });

        expect(rows).to.deep.equal([{ category: 2 }]);
      });
    });
  });
});
