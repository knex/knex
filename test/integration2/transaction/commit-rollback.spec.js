const assert = require('assert').strict;
const { Db, withDbs } = require('../util/knex-instance-provider');

withDbs([Db.PostgresSQL, Db.PgNative], (knex, db) => {
  describe(`PostgreSQL COMMIT outcomes (${db})`, () => {
    const tableName = 'test_commit_rollback_outcome';
    const rollbackMessage = 'Transaction was rolled back by the database';

    beforeEach(async () => {
      await knex.schema.createTable(tableName, (table) => {
        table.integer('id').primary();
      });
      await knex(tableName).insert({ id: 1 });
    });

    afterEach(async () => {
      await knex.schema.dropTableIfExists(tableName);
    });

    after(() => knex.destroy());

    for (const doNotRejectOnRollback of [true, false]) {
      it(`rejects executionPromise on a server rollback with doNotRejectOnRollback=${doNotRejectOnRollback}`, async () => {
        const trx = await knex.transaction({ doNotRejectOnRollback });
        await trx(tableName).insert({ id: 2 });
        await assert.rejects(trx(tableName).insert({ id: 1 }), {
          code: '23505',
        });

        // commit() still resolves with the server response; only the transaction
        // outcome rejects, including when explicit rollbacks would resolve.
        await Promise.all([
          trx.commit('not committed').then((result) => {
            assert.equal(result.response.command, 'ROLLBACK');
          }),
          assert.rejects(trx.executionPromise, { message: rollbackMessage }),
        ]);
        assert.equal(trx.isCompleted(), true);
        assert.deepEqual(await knex(tableName).orderBy('id'), [{ id: 1 }]);
      });
    }

    it('rejects a handler transaction after a caught statement error', async () => {
      await assert.rejects(
        knex.transaction(async (trx) => {
          await trx(tableName).insert({ id: 2 });
          await assert.rejects(trx(tableName).insert({ id: 1 }), {
            code: '23505',
          });
          return 'not committed';
        }),
        { message: rollbackMessage }
      );
      assert.deepEqual(await knex(tableName).orderBy('id'), [{ id: 1 }]);
    });

    it('preserves successful manual commit responses and outcome values', async () => {
      const trx = await knex.transaction();
      await trx(tableName).insert({ id: 2 });
      const committed = trx.commit('committed');
      assert.equal(trx.isCompleted(), true);
      assert.equal((await committed).response.command, 'COMMIT');
      assert.equal(await trx.executionPromise, 'committed');
      assert.deepEqual(await knex(tableName).orderBy('id'), [
        { id: 1 },
        { id: 2 },
      ]);
    });

    it('preserves successful handler return values', async () => {
      const result = await knex.transaction(async (trx) => {
        await trx(tableName).insert({ id: 2 });
        return 'committed';
      });
      assert.equal(result, 'committed');
      assert.deepEqual(await knex(tableName).orderBy('id'), [
        { id: 1 },
        { id: 2 },
      ]);
    });

    it('preserves the original error when a deferred constraint fails at commit', async () => {
      await knex.schema.table(tableName, (table) => {
        table.integer('value').unique({ deferrable: 'deferred' });
      });
      const trx = await knex.transaction();
      await trx(tableName).insert([
        { id: 2, value: 1 },
        { id: 3, value: 1 },
      ]);
      await Promise.all([
        trx.commit().then((result) => assert.equal(result, undefined)),
        assert.rejects(trx.executionPromise, { code: '23505' }),
      ]);
      assert.deepEqual(await knex(tableName).select('id').orderBy('id'), [
        { id: 1 },
      ]);
    });

    it('can commit after recovering a statement error through a savepoint', async () => {
      const result = await knex.transaction(async (trx) => {
        await trx(tableName).insert({ id: 2 });
        await assert.rejects(
          trx.transaction(async (nested) => {
            await nested(tableName).insert({ id: 1 });
          }),
          { code: '23505' }
        );
        await trx(tableName).insert({ id: 3 });
        return 'recovered';
      });
      assert.equal(result, 'recovered');
      assert.deepEqual(await knex(tableName).orderBy('id'), [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);
    });
  });
});
