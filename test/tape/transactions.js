'use strict';
const harness = require('./harness');
const tape = require('tape');
const JSONStream = require('JSONStream');
const { isOracle, isMssql, isPostgreSQL } = require('../util/db-helpers');

module.exports = function (knex) {
  tape(knex.client.driverName + ' - transactions: before', function (t) {
    knex.schema
      .dropTableIfExists('test_table')
      .createTable('test_table', function (t) {
        t.integer('id');
        t.string('name');
      })
      .then(function () {
        t.end();
      });
  });

  const test = harness('test_table', knex);

  test('transaction', async function (t) {
    await knex.transaction((trx) =>
      trx.insert({ id: 1, name: 'A' }).into('test_table')
    );

    const results = await knex.select('*').from('test_table');

    t.equal(results.length, 1, 'One row inserted');
  });

  test('transaction rollback on returned rejected promise', async function (t) {
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
      t.equal(err, testError, 'Expected error reported');
      trxRejected = true;
    } finally {
      // BEGIN, INSERT, ROLLBACK
      // oracle & mssql: BEGIN & ROLLBACK not reported as queries
      const expectedQueryCount = isOracle(knex) || isMssql(knex) ? 1 : 3;

      t.equal(
        trxQueryCount,
        expectedQueryCount,
        'Expected number of transaction SQL queries executed'
      );
      t.equal(trxRejected, true, 'Transaction promise rejected');

      const results = await knex.select('*').from('test_table');
      t.equal(results.length, 0, 'No rows inserted');
    }
  });

  test('transaction rollback on error throw', async function (t) {
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
      t.equal(err, testError, 'Expected error reported');
      trxRejected = true;
    } finally {
      // BEGIN, ROLLBACK
      // oracle & mssql: BEGIN & ROLLBACK not reported as queries
      const expectedQueryCount = isOracle(knex) || isMssql(knex) ? 0 : 2;

      t.equal(
        trxQueryCount,
        expectedQueryCount,
        'Expected number of transaction SQL queries executed'
      );
      t.equal(trxRejected, true, 'Transaction promise rejected');
    }
  });

  test('transaction savepoint rollback on returned rejected promise', async function (t) {
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
                          t.equal(results.length, 2, 'Two rows inserted');
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
              t.equal(err, testError, 'Expected error reported');
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
      let expectedTrx1QueryCount = isOracle(knex) || isMssql(knex) ? 1 : 3;
      const expectedTrx2QueryCount = 4;
      expectedTrx1QueryCount += expectedTrx2QueryCount;
      t.equal(
        trx1QueryCount,
        expectedTrx1QueryCount,
        'Expected number of parent transaction SQL queries executed'
      );
      t.equal(
        trx2QueryCount,
        expectedTrx2QueryCount,
        'Expected number of nested transaction SQL queries executed'
      );
      t.equal(trx2Rejected, true, 'Nested transaction promise rejected');

      const results = await knex.select('*').from('test_table');
      t.equal(results.length, 1, 'One row inserted');
    }
  });

  test('transaction savepoint rollback on error throw', async function (t) {
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
              t.equal(err, testError, 'Expected error reported');
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
      let expectedTrx1QueryCount = isOracle(knex) || isMssql(knex) ? 1 : 3;
      const expectedTrx2QueryCount = 2;
      expectedTrx1QueryCount += expectedTrx2QueryCount;
      t.equal(
        trx1QueryCount,
        expectedTrx1QueryCount,
        'Expected number of parent transaction SQL queries executed'
      );
      t.equal(
        trx2QueryCount,
        expectedTrx2QueryCount,
        'Expected number of nested transaction SQL queries executed'
      );
      t.equal(trx2Rejected, true, 'Nested transaction promise rejected');
      const results = await knex.select('*').from('test_table');
      t.equal(results.length, 1, 'One row inserted');
    }
  });

  test('sibling nested transactions - second created after first one commits', async function (t) {
    let secondTransactionCompleted = false;
    try {
      await knex.transaction(function (trx) {
        return trx
          .transaction(function (trx1) {
            return trx1
              .insert({ id: 1, name: 'A' })
              .into('test_table')
              .then(function () {
                return trx1.insert({ id: 2, name: 'B' }).into('test_table');
              });
          })
          .then(function () {
            return trx.transaction(function (trx2) {
              return trx2('test_table').then(function (results) {
                secondTransactionCompleted = true;
                t.equal(
                  results.length,
                  2,
                  'First sibling transaction committed before starting the second one'
                );
              });
            });
          });
      });
    } finally {
      t.equal(
        secondTransactionCompleted,
        true,
        'Second sibling transaction completed'
      );
    }
  });

  test('sibling nested transactions - both chained sibling transactions committed', async function (t) {
    try {
      await knex.transaction(function (trx) {
        return trx
          .transaction(function (trx1) {
            return trx1.insert({ id: 1, name: 'A' }).into('test_table');
          })
          .then(function () {
            return trx.transaction(function (trx2) {
              return trx2.insert({ id: 2, name: 'B' }).into('test_table');
            });
          });
      });
    } finally {
      const results = await knex('test_table');
      t.equal(results.length, 2, 'Parent transaction inserted 2 records');
    }
  });

  test('sibling nested transactions - second created after first one rolls back by returning a rejected promise', async function (t) {
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
            t.equal(
              err.message,
              'test rollback',
              'First sibling transaction rolled back before starting the second one'
            );
            return trx.transaction(function (trx2) {
              return trx2('test_table').then(function () {
                secondTransactionCompleted = true;
              });
            });
          });
      });
    } finally {
      t.equal(
        secondTransactionCompleted,
        true,
        'Second sibling transaction completed'
      );
    }
  });

  test('sibling nested transactions - second commits data after first one rolls back by returning a rejected promise', async (t) => {
    try {
      await knex.transaction(function (trx) {
        return trx
          .transaction(async function (trx1) {
            await trx1.insert({ id: 1, name: 'A' }).into('test_table');

            throw new Error('test rollback');
          })
          .catch(function (err) {
            t.equal(
              err.message,
              'test rollback',
              'First sibling transaction rolled back before starting the second one'
            );
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
      t.equal(results.length, 2, 'Parent transaction inserted two records');
    }
  });

  test('sibling nested transactions - second created after first one rolls back by throwing', async function (t) {
    let secondTransactionCompleted = false;
    try {
      await knex.transaction(function (trx) {
        return trx
          .transaction(function () {
            throw new Error('test rollback');
          })
          .catch(function (err) {
            t.equal(
              err.message,
              'test rollback',
              'First sibling transaction rolled back before starting the second one'
            );
            return trx.transaction(function (trx2) {
              return trx2('test_table').then(function () {
                secondTransactionCompleted = true;
              });
            });
          });
      });
    } finally {
      t.equal(
        secondTransactionCompleted,
        true,
        'Second sibling transaction completed'
      );
    }
  });

  test('sibling nested transactions - second commits data after first one rolls back by throwing', async function (t) {
    try {
      await knex.transaction(function (trx) {
        return trx
          .transaction(function () {
            throw new Error('test rollback');
          })
          .catch(function (err) {
            t.equal(
              err.message,
              'test rollback',
              'First sibling transaction rolled back before starting the second one'
            );
            return trx.transaction(function (trx2) {
              return trx2.insert([{ id: 1, name: 'A' }]).into('test_table');
            });
          });
      });
    } finally {
      const results = await knex('test_table');
      t.equal(results.length, 1, 'Parent transaction inserted one record');
    }
  });

  test('sibling nested transactions - first commits data even though second one rolls back by returning a rejected promise', async (t) => {
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
      t.equal(
        secondTransactionCompleted,
        true,
        'Second sibling transaction completed'
      );
      const results = await knex('test_table');
      t.equal(results.length, 1, 'Parent transaction inserted one record');
    }
  });

  test('sibling nested transactions - first commits data even though second one rolls back by throwing', async (t) => {
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
      t.equal(
        secondTransactionCompleted,
        true,
        'Second sibling transaction completed'
      );
      const results = await knex('test_table');
      t.equal(results.length, 1, 'Parent transaction inserted one record');
    }
  });

  test('#625 - streams/transactions', 'postgresql', (t) => {
    let cid,
      queryCount = 0;

    const runCommands = async (tx, commands) => {
      for (const command of commands) {
        await tx.raw(command);
      }
    };
    return knex
      .transaction(function (tx) {
        runCommands(tx, [
          'SET join_collapse_limit to 1',
          'SET enable_nestloop = off',
        ])
          .then(function () {
            const stream = tx.table('test_table').stream();
            stream.on('end', function () {
              tx.commit();
              t.equal(queryCount, 5, 'Five queries run');
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

  test('#785 - skipping extra transaction statements after commit / rollback', async function (t) {
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
                  t.error(resp);
                })
                .catch(function () {});
            });
        })
        .on('query', function () {
          queryCount++;
        });
    } catch (err) {
      t.equal(
        err.message,
        'Rolled back',
        'Transaction promise rejected with expected error'
      );
    } finally {
      // oracle & mssql: BEGIN & ROLLBACK not reported as queries
      const expectedQueryCount = isOracle(knex) || isMssql(knex) ? 1 : 3;
      t.equal(
        queryCount,
        expectedQueryCount,
        'Expected number of transaction SQL queries executed'
      );
    }
  });

  test('#805 - nested ddl transaction', async function () {
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

  if (isPostgreSQL(knex)) {
    // TODO: fix to work without old tables from mocha tests
    tape(
      'allows postgres ? operator in knex.raw() if no bindings given #519 and #888',
      async function (t) {
        t.plan(1);
        try {
          const result = await knex
            .from('test_table_two')
            .whereRaw("(json_data->'me')::jsonb \\?& array['keyOne', 'keyTwo']")
            .where('id', '>', 1);
          t.equal(result.length, 0, 'Table should have been empty');
        } finally {
          t.end();
        }
      }
    );
  }

  test('transaction savepoint do not rollback when instructed', async function (t) {
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
      let expectedTrx1QueryCount = isOracle(knex) || isMssql(knex) ? 1 : 3;
      const expectedTrx2QueryCount = 2;
      expectedTrx1QueryCount += expectedTrx2QueryCount;
      t.equal(
        trx1QueryCount,
        expectedTrx1QueryCount,
        'Expected number of parent transaction SQL queries executed'
      );
      t.equal(
        trx2QueryCount,
        expectedTrx2QueryCount,
        'Expected number of nested transaction SQL queries executed'
      );
      t.equal(trx2Rejected, true, 'Nested transaction promise rejected');
      const results = await knex.select('*').from('test_table');
      t.equal(results.length, 1, 'One row inserted');
    }
  });
};
