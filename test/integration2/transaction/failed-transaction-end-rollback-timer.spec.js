const { expect } = require('chai');
const pg = require('pg');
const knex = require('../../../lib');
const {
  getAllDbs,
  getKnexForDb,
  testConfigs,
} = require('../util/knex-instance-provider');
const { isPostgreSQL } = require('../../util/db-helpers');

describe('Transaction', () => {
  describe('ROLLBACK outlasting the 5 s rollback timer (#6546)', () => {
    getAllDbs().forEach((dialect) => {
      describe(dialect, () => {
        before(function () {
          const probe = getKnexForDb(dialect);
          const postgres = isPostgreSQL(probe);
          return probe.destroy().then(() => {
            if (!postgres) this.skip();
          });
        });

        // rollback() stops waiting after 5 s, and the connection is released.
        // With query_timeout above 5 s, the queued ROLLBACK is dropped only
        // afterwards: the timer fires at 11 s, the ROLLBACK is dropped unsent
        // at 12 s, and pg_sleep ends at 14 s. A connection released unmarked
        // hands the next borrower the old transaction.
        async function outlastRollbackTimer(db) {
          await db.schema.dropTableIfExists('failed_tx_end_timer');
          await db.schema.createTable('failed_tx_end_timer', (table) => {
            table.text('code').primary();
          });
          let first;
          await db
            .transaction(async (trx) => {
              first = (await trx.raw('select pg_backend_pid() as pid')).rows[0]
                .pid;
              await trx('failed_tx_end_timer').insert({ code: 'doomed' });
              await trx.raw('select pg_sleep(14)');
            })
            .catch(() => {});
          let second;
          await db.transaction(async (trx) => {
            second = (await trx.raw('select pg_backend_pid() as pid')).rows[0]
              .pid;
            await trx('failed_tx_end_timer').insert({ code: 'next' });
          });
          // Read the rows once the first session has ended, so that an
          // uncommitted doomed row cannot pass for a rolled-back one.
          const deadline = Date.now() + 10000;
          while (Date.now() < deadline) {
            const { n } = (
              await db.raw(
                'select count(*)::int as n from pg_stat_activity where pid = ?',
                [first]
              )
            ).rows[0];
            if (n === 0) break;
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          const codes = (
            await db('failed_tx_end_timer').select('code').orderBy('code')
          ).map((row) => row.code);
          return { first, second, codes };
        }

        it('does not reuse a connection when query_timeout drops ROLLBACK after the timer released it', async function () {
          this.timeout(40000);
          const db = getKnexForDb(dialect, {
            connection: { query_timeout: 6000 },
            pool: { min: 0, max: 1 },
          });
          try {
            const { first, second, codes } = await outlastRollbackTimer(db);
            expect(codes).to.deep.equal(['next']);
            expect(second).to.not.equal(first);
          } finally {
            await db.schema.dropTableIfExists('failed_tx_end_timer');
            await db.destroy();
          }
        });

        it('discards a native-pool connection when query_timeout drops ROLLBACK after the timer released it', async function () {
          this.timeout(40000);
          const nativePool = new pg.Pool({
            ...testConfigs.postgres.connection,
            query_timeout: 6000,
            max: 1,
          });
          const db = knex({ client: 'pg', connectionPool: nativePool });
          try {
            const { first, second, codes } = await outlastRollbackTimer(db);
            expect(codes).to.deep.equal(['next']);
            expect(second).to.not.equal(first);
          } finally {
            await db.schema.dropTableIfExists('failed_tx_end_timer');
            await db.destroy();
            await nativePool.end();
          }
        });
      });
    });
  });
});
