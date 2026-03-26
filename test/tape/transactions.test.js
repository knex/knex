'use strict';

const JSONStream = require('JSONStream');
const {
  isOracle,
  isMssql,
  isPgBased,
  isCockroachDB,
} = require('../util/db-helpers');
const {
  createTestTableTwo,
  dropTables,
} = require('../util/tableCreatorHelper');
const {
  getAllDbs,
  getKnexForDb,
} = require('../integration2/util/knex-instance-provider');

getAllDbs().forEach((db) => {
  describe(`${db} - transactions (tape)`, () => {
    let knex;

    beforeAll(async () => {
      knex = getKnexForDb(db);
      await knex.schema
        .dropTableIfExists('test_table')
        .createTable('test_table', function (t) {
          t.integer('id');
          t.string('name');
        });
    });

    afterAll(async () => {
      await knex.schema.dropTableIfExists('test_table');
      await knex.destroy();
    });

    afterEach(async () => {
      await knex('test_table').truncate();
    });

    it('transaction', async () => {
      await knex.transaction((trx) =>
        trx.insert({ id: 1, name: 'A' }).into('test_table')
      );

      const results = await knex.select('*').from('test_table');
      expect(results.length).toBe(1);
    });

    it('transaction rollback on returned rejected promise', async () => {
      const testError = new Error('Not inserting');
      let trxQueryCount = 0;
      let trxRejected;
      try {
        await knex
          .transaction(function (trx) {
            return trx
              .insert({ id: 1, name: 'A' })
              .into('test_table')
              .then(function () {
                throw testError;
              });
          })
          .on('query', function () {
            ++trxQueryCount;
          });
      } catch (err) {
        expect(err).toBe(testError);
        trxRejected = true;
      } finally {
        // BEGIN, INSERT, ROLLBACK
        // oracle & mssql: BEGIN & ROLLBACK not reported as queries
        const expectedQueryCount =
          isOracle(knex) || isMssql(knex) ? 1 : 3;

        expect(trxQueryCount).toBe(expectedQueryCount);
        expect(trxRejected).toBe(true);

        const results = await knex.select('*').from('test_table');
        expect(results.length).toBe(0);
      }
    });

    it('transaction rollback on error throw', async () => {
      const testError = new Error('Boo!!!');
      let trxQueryCount = 0;
      let trxRejected;
      try {
        await knex
          .transaction(function () {
            throw testError;
          })
          .on('query', function () {
            ++trxQueryCount;
          });
      } catch (err) {
        expect(err).toBe(testError);
        trxRejected = true;
      } finally {
        // BEGIN, ROLLBACK
        // oracle & mssql: BEGIN & ROLLBACK not reported as queries
        const expectedQueryCount =
          isOracle(knex) || isMssql(knex) ? 0 : 2;

        expect(trxQueryCount).toBe(expectedQueryCount);
        expect(trxRejected).toBe(true);
      }
    });

    it('transaction savepoint rollback on returned rejected promise', async () => {
      const testError = new Error('Rolling Back Savepoint');
      let trx1QueryCount = 0;
      let trx2QueryCount = 0;
      let trx2Rejected = false;
      try {
        await knex
          .transaction(function (trx1) {
            return trx1
              .insert({ id: 1, name: 'A' })
              .into('test_table')
              .then(function () {
                // Nested transaction (savepoint)
                return trx1
                  .transaction(function (trx2) {
                    // Insert and then roll back to savepoint
                    return trx2
                      .table('test_table')
                      .insert({ id: 2, name: 'B' })
                      .then(function () {
                        return trx2('test_table')
                          .then(function (results) {
                            expect(results.length).toBe(2);
                          })
                          .then(() => {
                            throw testError;
                          });
                      });
                  })
                  .on('query', function () {
                    ++trx2QueryCount;
                  });
              })
              .catch(function (err) {
                expect(err).toBe(testError);
                trx2Rejected = true;
              });
          })
          .on('query', function () {
            ++trx1QueryCount;
          });
      } finally {
        // trx1: BEGIN, INSERT, ROLLBACK
        // trx2: SAVEPOINT, INSERT, SELECT, ROLLBACK TO SAVEPOINT
        // oracle & mssql: BEGIN & ROLLBACK not reported as queries
        let expectedTrx1QueryCount =
          isOracle(knex) || isMssql(knex) ? 1 : 3;
        const expectedTrx2QueryCount = 4;
        expectedTrx1QueryCount += expectedTrx2QueryCount;
        expect(trx1QueryCount).toBe(expectedTrx1QueryCount);
        expect(trx2QueryCount).toBe(expectedTrx2QueryCount);
        expect(trx2Rejected).toBe(true);

        const results = await knex.select('*').from('test_table');
        expect(results.length).toBe(1);
      }
    });

    it('transaction savepoint rollback on error throw', async () => {
      const testError = new Error('Rolling Back Savepoint');
      let trx1QueryCount = 0;
      let trx2QueryCount = 0;
      let trx2Rejected = false;
      try {
        await knex
          .transaction(function (trx1) {
            return trx1
              .insert({ id: 1, name: 'A' })
              .into('test_table')
              .then(function () {
                // Nested transaction (savepoint)
                return trx1
                  .transaction(function () {
                    // trx2
                    // Roll back to savepoint
                    throw testError;
                  })
                  .on('query', function () {
                    ++trx2QueryCount;
                  });
              })
              .catch(function (err) {
                expect(err).toBe(testError);
                trx2Rejected = true;
              });
          })
          .on('query', function () {
            ++trx1QueryCount;
          });
      } finally {
        // trx1: BEGIN, INSERT, ROLLBACK
        // trx2: SAVEPOINT, ROLLBACK TO SAVEPOINT
        // oracle & mssql: BEGIN & ROLLBACK not reported as queries
        let expectedTrx1QueryCount =
          isOracle(knex) || isMssql(knex) ? 1 : 3;
        const expectedTrx2QueryCount = 2;
        expectedTrx1QueryCount += expectedTrx2QueryCount;
        expect(trx1QueryCount).toBe(expectedTrx1QueryCount);
        expect(trx2QueryCount).toBe(expectedTrx2QueryCount);
        expect(trx2Rejected).toBe(true);
        const results = await knex.select('*').from('test_table');
        expect(results.length).toBe(1);
      }
    });

    it('sibling nested transactions - second created after first one commits', async () => {
      let secondTransactionCompleted = false;
      try {
        await knex.transaction(function (trx) {
          return trx
            .transaction(function (trx1) {
              return trx1
                .insert({ id: 1, name: 'A' })
                .into('test_table')
                .then(function () {
                  return trx1
                    .insert({ id: 2, name: 'B' })
                    .into('test_table');
                });
            })
            .then(function () {
              return trx.transaction(function (trx2) {
                return trx2('test_table').then(function (results) {
                  secondTransactionCompleted = true;
                  expect(results.length).toBe(2);
                });
              });
            });
        });
      } finally {
        expect(secondTransactionCompleted).toBe(true);
      }
    });

    it('sibling nested transactions - both chained sibling transactions committed', async () => {
      try {
        await knex.transaction(function (trx) {
          return trx
            .transaction(function (trx1) {
              return trx1.insert({ id: 1, name: 'A' }).into('test_table');
            })
            .then(function () {
              return trx.transaction(function (trx2) {
                return trx2
                  .insert({ id: 2, name: 'B' })
                  .into('test_table');
              });
            });
        });
      } finally {
        const results = await knex('test_table');
        expect(results.length).toBe(2);
      }
    });

    it('sibling nested transactions - second created after first one rolls back by returning a rejected promise', async () => {
      let secondTransactionCompleted = false;
      try {
        await knex.transaction(function (trx) {
          return trx
            .transaction(function (trx1) {
              return trx1
                .insert({ id: 1, name: 'A' })
                .into('test_table')
                .then(function () {
                  throw new Error('test rollback');
                });
            })
            .catch(function (err) {
              expect(err.message).toBe('test rollback');
              return trx.transaction(function (trx2) {
                return trx2('test_table').then(function () {
                  secondTransactionCompleted = true;
                });
              });
            });
        });
      } finally {
        expect(secondTransactionCompleted).toBe(true);
      }
    });

    it('sibling nested transactions - second commits data after first one rolls back by returning a rejected promise', async () => {
      try {
        await knex.transaction(function (trx) {
          return trx
            .transaction(async function (trx1) {
              await trx1.insert({ id: 1, name: 'A' }).into('test_table');

              throw new Error('test rollback');
            })
            .catch(function (err) {
              expect(err.message).toBe('test rollback');
              return trx.transaction(function (trx2) {
                return trx2
                  .insert([
                    { id: 2, name: 'B' },
                    { id: 3, name: 'C' },
                  ])
                  .into('test_table');
              });
            });
        });
      } finally {
        const results = await knex('test_table');
        expect(results.length).toBe(2);
      }
    });

    it('sibling nested transactions - second created after first one rolls back by throwing', async () => {
      let secondTransactionCompleted = false;
      try {
        await knex.transaction(function (trx) {
          return trx
            .transaction(function () {
              throw new Error('test rollback');
            })
            .catch(function (err) {
              expect(err.message).toBe('test rollback');
              return trx.transaction(function (trx2) {
                return trx2('test_table').then(function () {
                  secondTransactionCompleted = true;
                });
              });
            });
        });
      } finally {
        expect(secondTransactionCompleted).toBe(true);
      }
    });

    it('sibling nested transactions - second commits data after first one rolls back by throwing', async () => {
      try {
        await knex.transaction(function (trx) {
          return trx
            .transaction(function () {
              throw new Error('test rollback');
            })
            .catch(function (err) {
              expect(err.message).toBe('test rollback');
              return trx.transaction(function (trx2) {
                return trx2
                  .insert([{ id: 1, name: 'A' }])
                  .into('test_table');
              });
            });
        });
      } finally {
        const results = await knex('test_table');
        expect(results.length).toBe(1);
      }
    });

    it('sibling nested transactions - first commits data even though second one rolls back by returning a rejected promise', async () => {
      let secondTransactionCompleted = false;
      try {
        await knex.transaction(function (trx) {
          return trx
            .transaction(function (trx1) {
              return trx1.insert({ id: 1, name: 'A' }).into('test_table');
            })
            .then(function () {
              return trx
                .transaction(function (trx2) {
                  return trx2
                    .insert([
                      { id: 2, name: 'B' },
                      { id: 3, name: 'C' },
                    ])
                    .into('test_table')
                    .then(function () {
                      secondTransactionCompleted = true;
                      throw new Error('test rollback');
                    });
                })
                .catch(function () {});
            });
        });
      } finally {
        expect(secondTransactionCompleted).toBe(true);
        const results = await knex('test_table');
        expect(results.length).toBe(1);
      }
    });

    it('sibling nested transactions - first commits data even though second one rolls back by throwing', async () => {
      let secondTransactionCompleted = false;
      try {
        await knex.transaction(function (trx) {
          return trx
            .transaction(function (trx1) {
              return trx1.insert({ id: 1, name: 'A' }).into('test_table');
            })
            .then(function () {
              return trx
                .transaction(function () {
                  secondTransactionCompleted = true;
                  throw new Error('test rollback');
                })
                .catch(function () {});
            });
        });
      } finally {
        expect(secondTransactionCompleted).toBe(true);
        const results = await knex('test_table');
        expect(results.length).toBe(1);
      }
    });

    // 'unimplemented: the configuration setting "join_collapse_limit" is not supported'
    it('#625 - streams/transactions', async () => {
      if (isCockroachDB(knex) || !isPgBased(knex)) {
        return;
      }

      let cid;
      let queryCount = 0;

      const runCommands = async (tx, commands) => {
        for (const command of commands) {
          await tx.raw(command);
        }
      };

      await knex
        .transaction(function (tx) {
          runCommands(tx, [
            'SET join_collapse_limit to 1',
            'SET enable_nestloop = off',
          ])
            .then(function () {
              const stream = tx.table('test_table').stream();
              stream.on('end', function () {
                tx.commit();
                expect(queryCount).toBe(5);
              });
              stream.pipe(JSONStream.stringify());
            })
            .catch(tx.rollback);
        })
        .on('query', function (q) {
          if (!cid) {
            cid = q.__knexUid;
          } else {
            if (cid !== q.__knexUid) {
              throw new Error('Invalid connection ID');
            }
          }
          queryCount++;
        });
    });

    it('#785 - skipping extra transaction statements after commit / rollback', async () => {
      let queryCount = 0;

      try {
        await knex
          .transaction(function (trx) {
            knex('test_table')
              .transacting(trx)
              .insert({ name: 'Inserted before rollback called.' })
              .then(function () {
                trx.rollback(new Error('Rolled back'));
              })
              .then(function () {
                return knex('test_table')
                  .transacting(trx)
                  .insert({ name: 'Inserted after rollback called.' })
                  .then(function (resp) {
                    expect(resp).toBeFalsy();
                  })
                  .catch(function () {});
              });
          })
          .on('query', function () {
            queryCount++;
          });
      } catch (err) {
        expect(err.message).toBe('Rolled back');
      } finally {
        // oracle & mssql: BEGIN & ROLLBACK not reported as queries
        const expectedQueryCount =
          isOracle(knex) || isMssql(knex) ? 1 : 3;
        expect(queryCount).toBe(expectedQueryCount);
      }
    });

    it('#805 - nested ddl transaction', async () => {
      try {
        await knex.transaction(function (knex) {
          return knex.transaction(function (trx) {
            return trx.schema.createTable('ages', function (t) {
              t.increments('id').primary();
              t.string('name').unique().notNull();
            });
          });
        });
      } finally {
        await knex.schema.dropTableIfExists('ages');
      }
    });

    it('allows postgres ? operator in knex.raw() if no bindings given #519 and #888', async () => {
      if (!isPgBased(knex)) {
        return;
      }

      await dropTables(knex);
      await createTestTableTwo(knex, true);

      try {
        const result = await knex
          .from('test_table_two')
          .whereRaw(
            "(json_data->'me')::jsonb \\?& array['keyOne', 'keyTwo']"
          )
          .where('id', '>', 1);
        expect(result.length).toBe(0);
      } finally {
        await dropTables(knex);
      }
    });

    it('transaction savepoint do not rollback when instructed', async () => {
      let trx1QueryCount = 0;
      let trx2QueryCount = 0;
      let trx2Rejected = false;

      try {
        await knex
          .transaction(function (trx1) {
            return trx1
              .insert({ id: 1, name: 'A' })
              .into('test_table')
              .then(function () {
                // Nested transaction (savepoint)
                return trx1
                  .transaction(
                    function (trx2) {
                      return trx2.rollback();
                    },
                    { doNotRejectOnRollback: true }
                  )
                  .on('query', function () {
                    ++trx2QueryCount;
                  });
              })
              .then(function () {
                trx2Rejected = true;
              });
          })
          .on('query', function () {
            ++trx1QueryCount;
          });
      } finally {
        // trx1: BEGIN, INSERT, ROLLBACK
        // trx2: SAVEPOINT, ROLLBACK TO SAVEPOINT
        // oracle & mssql: BEGIN & ROLLBACK not reported as queries
        let expectedTrx1QueryCount =
          isOracle(knex) || isMssql(knex) ? 1 : 3;
        const expectedTrx2QueryCount = 2;
        expectedTrx1QueryCount += expectedTrx2QueryCount;
        expect(trx1QueryCount).toBe(expectedTrx1QueryCount);
        expect(trx2QueryCount).toBe(expectedTrx2QueryCount);
        expect(trx2Rejected).toBe(true);
        const results = await knex.select('*').from('test_table');
        expect(results.length).toBe(1);
      }
    });
  });
});
