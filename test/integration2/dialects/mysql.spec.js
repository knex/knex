const { expect } = require('chai');
const {
  getKnexForDb,
  getAllDbs,
  Db,
} = require('../util/knex-instance-provider');

describe('MySQL dialect', () => {
  getAllDbs()
    .filter((db) => db === Db.MySQL)
    .forEach((db) => {
      let knex;
      before(async () => {
        knex = getKnexForDb(db);
      });

      describe('Upsert operation', () => {
        const testTable = 'test_users_mysql';

        before(async () => {
          await knex.schema.createTable(testTable, function () {
            this.increments('id').primary();
            this.decimal('balance');
            this.string('username');
          });
        });

        after(async () => {
          await knex.schema.dropTable(testTable);
          await knex.destroy();
        });

        it('should insert value if it does not exist', async () => {
          const initValues = { id: 1, username: 'user 1', balance: 10 };
          await checkNoRecords(initValues.id);

          const inserted = await knex(testTable).upsert(initValues);
          expect(inserted[0].affectedRows).equals(1);
          expect(inserted[0].insertId).equals(initValues.id);

          const results = await testTableData(initValues.id);
          expect(results.length).equals(1);
          expect(results[0].username).equals(initValues.username);
          expect(results[0].balance).equals(initValues.balance);
        });

        it('should update value if it does exist', async () => {
          const id = 2;
          const initValues = { id, username: 'user 2', balance: 20 };
          const changedValues = { id, username: 'second', balance: 100 };
          await checkNoRecords(initValues.id);

          // inserted
          const inserted = await knex(testTable).upsert(initValues);
          expect(inserted[0].affectedRows).to.equal(1);

          let results = await testTableData(initValues.id);
          expect(results[0].username).equals(initValues.username);
          expect(results[0].balance).equals(initValues.balance);

          // updated
          const updated = await knex(testTable).upsert(changedValues);
          expect(updated[0].affectedRows).to.equal(2);

          results = await testTableData(changedValues.id);
          expect(results[0].username).equals(changedValues.username);
          expect(results[0].balance).equals(changedValues.balance);
        });

        async function checkNoRecords(id) {
          const results = await knex(testTable).where('id', id).select('id');
          expect(results.length).to.equal(0);
        }

        async function testTableData(id) {
          return knex(testTable)
            .where('id', id)
            .select('id', 'username', 'balance');
        }
      });
    });
});
