const {
  getKnexForSqlite,
  getKnexForBetterSqlite,
} = require('../util/knex-instance-provider');
const Client_SQLite3 = require('../../../lib/dialects/sqlite3');
const Transaction_Sqlite = require('../../../lib/dialects/sqlite3/execution/sqlite-transaction');

const configs = [
  { driver: 'sqlite3', factory: getKnexForSqlite },
  { driver: 'better-sqlite3', factory: getKnexForBetterSqlite },
];

for (const { driver, factory } of configs) {
  const knexChecked = factory(true);
  const knexUnchecked = factory(false);

  describe(`Sqlite3 dialect (${driver})`, () => {
    describe('strict transactions', () => {
      /** @type {Client_SQLite3} checked */
      let checked;

      /** @type {Client_SQLite3} unchecked */
      let unchecked;

      beforeAll(() => {
        expect(knexChecked.client).toBeInstanceOf(Client_SQLite3);
        checked = knexChecked.client;

        expect(knexUnchecked.client).toBeInstanceOf(Client_SQLite3);
        unchecked = knexUnchecked.client;
      });

      it('should require `enforceForeignKeyCheck` to be specified', async () => {
        const strict = checked._strict();

        for (const missing of [undefined, {}]) {
          await expect(
            strict.transaction((trx) => trx.select(1), missing)
          ).rejects.toThrow(
            /^Refusing to create.*transaction.*strictForeignKeyPragma is true.*enforceForeignCheck is unspecified/
          );
        }

        expect(
          await strict.transaction((trx) => trx.select(1), {
            enforceForeignCheck: null,
          })
        ).toEqual([{ 1: 1 }]);
      });

      const table1 = [
        { before: true, enforce: null, expected: true },
        { before: true, enforce: true, expected: true },
        { before: true, enforce: false, expected: false },
        { before: false, enforce: null, expected: false },
        { before: false, enforce: true, expected: true },
        { before: false, enforce: false, expected: false },
      ];

      const expectPragma = async (knex, expected) => {
        const result = await knex.raw('PRAGMA foreign_keys');
        expect(result).toEqual([
          {
            foreign_keys: expected ? 1 : 0,
          },
        ]);
      };

      for (const { before, enforce, expected } of table1) {
        it(`should have foreign_keys=${expected} inside the transaction when foreign_keys=${before} and enforceForeignKeyCheck=${enforce}`, async () => {
          const knex = before ? knexChecked : knexUnchecked;

          // ensure we have the expected starting state
          await expectPragma(knex, before);

          // should work here but not be required
          await knex.transaction(async (trx) => {
            // verify it has changed to what it should be
            await expectPragma(trx, before);
          });

          await knex.transaction(
            async (trx) => {
              // verify it has changed to what it should be
              await expectPragma(trx, expected);
            },
            { enforceForeignCheck: enforce }
          );

          // should work here and also be required
          await knex.client._strict().transaction(
            async (trx) => {
              // verify it has changed to what it should be
              await expectPragma(trx, expected);
            },
            { enforceForeignCheck: enforce }
          );

          // ensure it has changed back
          await expectPragma(knex, before);
        });
      }

      it('should refuse a transaction if updating the foreign key check fails', async () => {
        class FailTransaction extends Transaction_Sqlite {
          async _setForeignCheck(conn, enforce) {
            throw new Error('oh noes');
          }
        }

        class FailClient extends Client_SQLite3 {
          transaction() {
            return new FailTransaction(this, ...arguments);
          }
        }
        const client = new FailClient(unchecked.config);

        const promise = client.transaction(
          (trx) => {
            trx.select(1);
          },
          {
            enforceForeignCheck: true,
          }
        );
        await expect(promise).rejects.toThrow(
          /^Refusing.*failed to set.*foreign_keys/
        );
      });

      it('should fail in a nested transaction when foreign_keys pragma must change', async () => {
        class FailClient extends Client_SQLite3 {
          constructor(config) {
            super(config);
            this.transacting = true;
          }
          transaction() {
            return new Transaction_Sqlite(this, ...arguments);
          }
        }

        const fakeTransacting = new FailClient(unchecked.config);

        // should not fail outside of strict mode
        await fakeTransacting.transaction(async (trx2) => trx2.select(1), {
          enforceForeignCheck: true,
        });

        // should fail in strict mode
        await expect(
          fakeTransacting
            ._strict()
            .transaction(async (trx2) => trx2.select(1), {
              enforceForeignCheck: true,
            })
        ).rejects.toThrow(
          /^Refusing to create transaction.*foreign_keys.*nested transaction/
        );
      });

      it('should allow DDL operations inside a transaction (issue #6402)', async () => {
        const knex = factory(true);
        try {
          await knex.schema.createTable('issue_6402_users', (t) => {
            t.increments('id');
          });
          await knex.schema.createTable('issue_6402_accounts', (t) => {
            t.increments('id');
            t.integer('user_id').unsigned().references('issue_6402_users.id');
          });
          const colsBefore = await knex.raw(
            "PRAGMA table_info('issue_6402_accounts')"
          );
          const colNamesBefore = colsBefore.map((c) => c.name);
          expect(colNamesBefore).to.deep.equal(['id', 'user_id']);

          const trx = await knex.transaction();
          try {
            await trx.schema.table('issue_6402_accounts', (t) => {
              t.dropForeign(['user_id']);
            });
            await trx.schema.table('issue_6402_accounts', (t) => {
              t.dropColumn('user_id');
            });
            await trx.commit();
          } catch (e) {
            await trx.rollback();
            throw e;
          }

          // verify the column was actually dropped
          const cols = await knex.raw(
            "PRAGMA table_info('issue_6402_accounts')"
          );
          const colNamesAfter = cols.map((c) => c.name);
          expect(colNamesAfter).to.deep.equal(['id']);
        } finally {
          await knex.schema.dropTableIfExists('issue_6402_accounts');
          await knex.schema.dropTableIfExists('issue_6402_users');
          await knex.destroy();
        }
      });

      it('should fail a DDL transaction that leaves foreign key violations', async () => {
        const id = 39579; // arbitrarily chosen to be unique to this file
        const parent = `test_parent_${id}`;
        const child = `test_child_${id}`;

        const promise = checked._strict().transaction(
          /** @param {import('../../../types/index').Knex} trx */
          async (trx) => {
            await trx.schema.createTable(parent, (tb) => {
              tb.increments('id').primary();
            });
            await trx.schema.createTable(child, (tb) => {
              tb.increments('id').primary();
              tb.integer('parent_id').references('id').inTable(parent);
            });
            await trx.insert({ id: 1, parent_id: 123 }).into(child);
          },
          { enforceForeignCheck: false }
        );
        await expect(promise).rejects.toThrow(
          /foreign key violation/
        );
      });

      it('should log a warning and dispose the connection if setting the pragma back fails', async () => {
        const warnings = [];

        class FailTransaction extends Transaction_Sqlite {
          async _restoreForeignCheck() {
            throw new Error('oh noes');
          }
        }

        class FailClient extends Client_SQLite3 {
          constructor(config) {
            super(config);
            this.logger = {
              warn: (message) => {
                warnings.push(message);
              },
            };
          }
          transaction() {
            return new FailTransaction(this, ...arguments);
          }
        }
        const client = new FailClient(unchecked.config);

        // successful transaction
        expect(
          await client.transaction((trx) => trx.select(1), {
            enforceForeignCheck: true,
          })
        ).toEqual([{ 1: 1 }]);

        expect(warnings.length).toBe(1);
        expect(warnings.pop()).toMatch(/failed to restore foreign check/i);

        // unsuccessful transaction
        await expect(
          client.transaction((trx) => Promise.reject('reject in transaction'), {
            enforceForeignCheck: true,
          })
        ).rejects.toThrow('reject in transaction');

        expect(warnings.length).toBe(2);
        expect(warnings.pop()).toMatch(/failed to restore foreign check/i);
        expect(warnings.pop()).toMatch(
          /Connection error.*failed to restore foreign check/i
        );
      });
    });
  });
}
