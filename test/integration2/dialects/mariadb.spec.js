const { expect } = require('chai');
const {
  getAllDbs,
  getKnexForDb,
  Db,
} = require('../util/knex-instance-provider');

describe('MariaDB dialect', () => {
  describe('Connection configuration', () => {
    const dbs = getAllDbs().filter((db) => db === Db.MariaDB);

    dbs.forEach((db) => {
      describe(db, () => {
        describe(`${db} - wrong port`, () => {
          let knex;
          before(() => {
            knex = getKnexForDb(db, {
              connection: {
                host: '127.0.0.1',
                port: 601,
                user: 'root',
                password: 'test',
                database: 'test',
              },
            });
          });

          after(() => {
            return knex.destroy();
          });

          it('rejects connection to wrong port', async () => {
            try {
              await knex.schema.raw('SELECT 1 as 1');
              throw new Error('Should not reach here');
            } catch (err) {
              expect(err.message).to.include('connect ECONNREFUSED');
            }
          });
        });

        describe(`${db} - basic queries`, () => {
          let knex;
          before(() => {
            knex = getKnexForDb(db);
          });

          after(() => {
            return knex.destroy();
          });

          it('can execute a raw query', async () => {
            const result = await knex.raw('SELECT 1 as val');
            expect(result[0][0].val).to.equal(1);
          });

          it('can execute a select query', async () => {
            const result = await knex.raw('SELECT 1 + 1 as sum');
            expect(result[0][0].sum).to.equal(2);
          });
        });

        describe(`${db} - schema and CRUD operations`, () => {
          let knex;
          const testTable = 'mariadb_test_table';

          before(async () => {
            knex = getKnexForDb(db);
            await knex.schema.dropTableIfExists(testTable);
            await knex.schema.createTable(testTable, (table) => {
              table.increments('id').primary();
              table.string('name');
              table.integer('value');
            });
          });

          after(async () => {
            await knex.schema.dropTableIfExists(testTable);
            await knex.destroy();
          });

          beforeEach(async () => {
            await knex(testTable).truncate();
          });

          it('can insert a row', async () => {
            const [insertId] = await knex(testTable).insert({
              name: 'test',
              value: 42,
            });
            expect(insertId).to.be.a('number');
            expect(insertId).to.be.greaterThan(0);
          });

          it('can select inserted rows', async () => {
            await knex(testTable).insert([
              { name: 'alice', value: 1 },
              { name: 'bob', value: 2 },
            ]);

            const rows = await knex(testTable).select('*').orderBy('name');
            expect(rows).to.have.length(2);
            expect(rows[0].name).to.equal('alice');
            expect(rows[1].name).to.equal('bob');
          });

          it('can update rows', async () => {
            await knex(testTable).insert({ name: 'alice', value: 1 });
            const updated = await knex(testTable)
              .where({ name: 'alice' })
              .update({ value: 99 });
            expect(updated).to.equal(1);

            const [row] = await knex(testTable).where({ name: 'alice' });
            expect(row.value).to.equal(99);
          });

          it('can delete rows', async () => {
            await knex(testTable).insert({ name: 'alice', value: 1 });
            const deleted = await knex(testTable)
              .where({ name: 'alice' })
              .del();
            expect(deleted).to.equal(1);

            const rows = await knex(testTable).select('*');
            expect(rows).to.have.length(0);
          });
        });

        describe(`${db} - transactions`, () => {
          let knex;
          const testTable = 'mariadb_trx_test';

          before(async () => {
            knex = getKnexForDb(db);
            await knex.schema.dropTableIfExists(testTable);
            await knex.schema.createTable(testTable, (table) => {
              table.increments('id').primary();
              table.string('name');
            });
          });

          after(async () => {
            await knex.schema.dropTableIfExists(testTable);
            await knex.destroy();
          });

          beforeEach(async () => {
            await knex(testTable).truncate();
          });

          it('can commit a transaction', async () => {
            await knex.transaction(async (trx) => {
              await trx(testTable).insert({ name: 'committed' });
            });

            const rows = await knex(testTable).select('*');
            expect(rows).to.have.length(1);
            expect(rows[0].name).to.equal('committed');
          });

          it('can rollback a transaction', async () => {
            try {
              await knex.transaction(async (trx) => {
                await trx(testTable).insert({ name: 'rolled_back' });
                throw new Error('force rollback');
              });
            } catch {
              // expected
            }

            const rows = await knex(testTable).select('*');
            expect(rows).to.have.length(0);
          });
        });
      });
    });
  });
});
