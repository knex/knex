const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const { isMssql, isOracle, isPostgreSQL } = require('../../util/db-helpers');

describe('Transaction', () => {
  describe('setDeferrableConstraint', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;
        const tableName = 'deferrableTestTable';
        const tableName1 = 'deferrableTestTable1';
        before(function () {
          knex = getKnexForDb(db);
          if (!isPostgreSQL(knex) && !isOracle(knex)) {
            return this.skip();
          }
          if (isMssql(knex)) {
            // Enable the snapshot isolation level required by certain transaction tests.
            return knex.raw(
              `ALTER DATABASE :db: SET ALLOW_SNAPSHOT_ISOLATION ON`,
              { db: knex.context.client.config.connection.database }
            );
          }
        });

        after(() => {
          return knex.destroy();
        });

        beforeEach(async () => {
          await knex.schema.createTable(tableName, (table) => {
            table.integer('id').primary().notNull();
          });
          await knex.schema.createTable(tableName1, (table) => {
            table.integer('id').primary().notNull();
          });
        });

        afterEach(async () => {
          await knex.schema.dropTable(tableName);
          await knex.schema.dropTable(tableName1);
        });

        it('deferrable initially immediate unique constraint all row are checked at end of update', async () => {
          await knex.schema.table(tableName, (table) => {
            table.integer('value').unique({ deferrable: 'immediate' });
          });
          await knex.schema.table(tableName1, (table) => {
            table.integer('value').unique({ deferrable: 'immediate' });
          });
          const trx = await knex.transaction({
            isolationLevel: 'read committed',
          });
          await trx(tableName).select();
          await trx(tableName).insert({ id: 1, value: 1 });
          await trx(tableName).insert({ id: 2, value: 2 });
          //This usually fail but deferrable initially immediate allow check to be performed at the end of update isntead
          await trx(tableName).update({
            value: knex.raw('?? + 1', ['value']),
          });
          await trx.commit();
        });

        it('deferred unique constraint are only checked when transaction is committed', async () => {
          await knex.schema.table(tableName, (table) => {
            table.integer('value').unique({ deferrable: 'deferred' });
          });
          const trx = await knex.transaction({
            isolationLevel: 'read committed',
          });
          await trx(tableName).insert({ id: 1, value: 1 });
          await trx(tableName).insert({ id: 2, value: 2 });
          //This usually fail but deferrable initially deferred allow constraint to be checked at the commit instead
          await trx(tableName).insert({ id: 3, value: 1 });
          await trx(tableName).insert({ id: 4, value: 2 });
          await trx(tableName).delete().where({ id: 3 });
          await trx(tableName).delete().where({ id: 4 });
          await trx.commit();
        });

        it('deferred foreign constraint are only checked when transaction is committed', async () => {
          await knex.schema.table(tableName, (table) => {
            table.integer('value');
            table
              .foreign('value')
              .deferrable('deferred')
              .references(`${tableName1}.id`)
              .withKeyName('fk1');
          });
          await knex.schema.table(tableName1, (table) => {
            table.integer('value');
            table
              .foreign('value')
              .deferrable('deferred')
              .references(`${tableName}.id`)
              .withKeyName('fk');
          });
          const trx = await knex.transaction({
            isolationLevel: 'read committed',
          });
          await trx(tableName).select();
          await trx(tableName).insert({ id: 1, value: 1 });
          await trx(tableName).insert({ id: 2, value: 2 });
          await trx(tableName1).insert({ id: 1, value: 1 });
          await trx(tableName1).insert({ id: 2, value: 2 });
          await trx.commit();
          await knex.schema.table(tableName, (table) => {
            table.dropForeign('value', 'fk1');
          });
          await knex.schema.table(tableName1, (table) => {
            table.dropForeign('value', 'fk');
          });
        });
      });
    });
  });
});
