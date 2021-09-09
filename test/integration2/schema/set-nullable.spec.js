const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const {
  isSQLite,
  isPostgreSQL,
  isMysql,
  isOracle,
} = require('../../util/db-helpers');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('Schema', () => {
  describe('alter nullable', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;

        before(function () {
          knex = getKnexForDb(db);
          if (isSQLite(knex)) {
            return this.skip();
          }
        });

        after(() => {
          return knex.destroy();
        });

        beforeEach(async () => {
          await knex.schema.createTable('primary_table', (table) => {
            table.integer('id_nullable').nullable();
            table.integer('id_not_nullable').notNull();
          });
        });

        afterEach(async () => {
          await knex.schema.dropTable('primary_table');
        });

        describe('setNullable', () => {
          it('sets column to be nullable', async () => {
            await knex.schema.table('primary_table', (table) => {
              table.setNullable('id_not_nullable');
            });

            await knex('primary_table').insert({
              id_nullable: null,
              id_not_nullable: null,
            });
          });
        });

        describe('dropNullable', () => {
          it('sets column to be not nullable', async () => {
            await knex.schema.table('primary_table', (table) => {
              table.dropNullable('id_nullable');
            });

            let errorMessage;
            if (isPostgreSQL(knex)) {
              errorMessage = 'violates not-null constraint';
            } else if (isMysql(knex)) {
              errorMessage = 'cannot be null';
            } else if (isOracle(knex)) {
              errorMessage = 'ORA-01400: cannot insert NULL into';
            }

            await expect(
              knex('primary_table').insert({
                id_nullable: null,
                id_not_nullable: 1,
              })
            ).to.eventually.be.rejectedWith(errorMessage);
          });
        });
      });
    });
  });
});
