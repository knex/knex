const { expect } = require('chai');
const {
  getKnexForDb,
  getAllDbs,
  Db,
} = require('../util/knex-instance-provider');
const { isArray } = require('lodash');

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

        it('should insert row using an object', async () => {
          const initValues = { id: 1, username: 'user 1', balance: 10 };
          await checkNoRecords(initValues.id);

          const inserted = await knex(testTable).upsert(initValues);
          expect(inserted[0].affectedRows).equals(1);
          expect(inserted[0].insertId).equals(initValues.id);

          const results = await selectTableData(initValues.id);
          expect(results.length).equals(1);
          expect(results[0].username).equals(initValues.username);
          expect(results[0].balance).equals(initValues.balance);
        });

        it('should update row using an object', async () => {
          const id = 2;
          const initValues = { id, username: 'user 2', balance: 12 };
          const changedValues = { id, username: 'second', balance: 100 };
          await checkNoRecords(initValues.id);

          // insert
          const inserted = await knex(testTable).upsert(initValues);
          expect(inserted[0].affectedRows).to.equal(1);

          let results = await selectTableData(initValues.id);
          expect(results[0].username).equals(initValues.username);
          expect(results[0].balance).equals(initValues.balance);

          // update
          const updated = await knex(testTable).upsert(changedValues);
          expect(updated[0].affectedRows).to.equal(2);

          results = await selectTableData(changedValues.id);
          expect(results[0].username).equals(changedValues.username);
          expect(results[0].balance).equals(changedValues.balance);
        });

        it('should insert rows using an array', async () => {
          const initValues = [
            { id: 3, username: 'user 3', balance: 13 },
            { id: 4, username: 'user 4', balance: 14 },
          ];
          const ids = initValues.map((el) => el.id);
          await checkNoRecords(ids);

          const inserted = await knex(testTable).upsert(initValues);
          expect(inserted[0].affectedRows).equals(2);

          const results = await selectTableData(ids);
          results.forEach((result, idx) => {
            expect(result).deep.equals(initValues[idx]);
          });
        });

        it('should update rows using an array', async () => {
          const id1 = 5;
          const id2 = 6;
          const initValues = [
            { id: id1, username: 'user 3', balance: 15 },
            { id: id2, username: 'user 4', balance: 16 },
          ];
          await checkNoRecords([id1, id2]);

          // insert
          const inserted = await knex(testTable).upsert(initValues);
          expect(inserted[0].affectedRows).equals(2);
          let results = await selectTableData([id1, id2]);
          results.forEach((result, idx) => {
            expect(result).deep.equals(initValues[idx]);
          });

          const changedValues = [
            { id: id1, username: 'third user', balance: 15 },
            { id: id2, username: 'user 4', balance: 106 },
          ];

          // update
          const updated = await knex(testTable).upsert(changedValues);
          expect(updated[0].affectedRows).equals(4);
          results = await selectTableData([id1, id2]);
          results.forEach((result, idx) => {
            expect(result).deep.equals(changedValues[idx]);
          });
        });

        it('should insert row using an object with a default value', async () => {
          const initValues = { id: 7, balance: 17 };
          await checkNoRecords(initValues.id);

          const inserted = await knex(testTable).upsert(initValues);
          expect(inserted[0].affectedRows).equals(1);
          expect(inserted[0].insertId).equals(initValues.id);

          const results = await selectTableData(initValues.id);
          expect(results.length).equals(1);
          expect(results[0].username).to.be.null;
          expect(results[0].balance).equals(initValues.balance);
        });

        async function checkNoRecords(id) {
          if (!isArray(id)) {
            id = [id];
          }
          const results = await knex(testTable).whereIn('id', id).select('id');
          expect(results.length).to.equal(0);
        }

        async function selectTableData(id) {
          if (!isArray(id)) {
            id = [id];
          }

          return knex(testTable)
            .whereIn('id', id)
            .select('id', 'username', 'balance');
        }
      });
    });
});
