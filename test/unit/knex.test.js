const Knex = require('../../lib/index');
const QueryBuilder = require('../../lib/query/querybuilder');
const sqliteConfig = require('../knexfile').sqlite3;
const sqlite3 = require('sqlite3');
const { noop } = require('lodash');

describe('knex', () => {
  describe('supports passing existing connection', () => {
    let connection;
    beforeEach(() => {
      connection = new sqlite3.Database(':memory:');
    });

    afterEach(() => {
      connection.close();
    });

    it('happy path', async () => {
      const knex = Knex({ client: 'sqlite3' });
      const result = await knex
        .connection(connection)
        .select(knex.raw('"0" as value'));
      expect(result[0].value).toBe('0');
    });
  });

  it('throws error on unsupported config client value', () => {
    expect(() => {
      Knex({
        client: 'dummy',
      });
    }).toThrow(
      /Unknown configuration option 'client' value dummy. Note that it is case-sensitive, check documentation for supported values/
    );
  });

  it('accepts supported config client value', () => {
    expect(() => {
      Knex({
        client: 'mysql',
      });
    }).not.toThrow();
  });

  it('accepts supported config client value alias', () => {
    expect(() => {
      Knex({
        client: 'sqlite',
      });
    }).not.toThrow();
  });

  it('supports creating copy with userParams', () => {
    const knex = Knex({
      client: 'sqlite',
    });

    const knexWithParams = knex.withUserParams({ userParam: '451' });

    expect(typeof knexWithParams).toBe('function');
    expect(knexWithParams.userParams).toEqual({ userParam: '451' });
    expect(knexWithParams.client.config.client).toBe('sqlite');
    expect(typeof knexWithParams.migrate).toBe('object');
  });

  it('supports passing user params in config', () => {
    const knexWithParams = Knex({
      client: 'sqlite',
      userParams: {
        userParam: '451',
      },
    });

    expect(typeof knexWithParams).toBe('function');
    expect(knexWithParams.userParams).toEqual({ userParam: '451' });
    expect(knexWithParams.client.config.client).toBe('sqlite');
    expect(typeof knexWithParams.migrate).toBe('object');
  });

  it('migrator of a copy with userParams has reference to correct Knex', () => {
    const knex = Knex({
      client: 'sqlite',
    });

    const knexWithParams = knex.withUserParams({ userParam: '451' });

    expect(knexWithParams.migrate.knex.userParams).toEqual({
      userParam: '451',
    });
  });

  it('copying does not result in duplicate listeners', () => {
    const knex = Knex({
      client: 'sqlite',
      connection: ':memory:',
    });
    const knexWithParams = knex.withUserParams();

    expect(knex.client.listeners('start').length).toBe(1);
    expect(knex.client.listeners('query').length).toBe(1);
    expect(knex.client.listeners('query-error').length).toBe(1);
    expect(knex.client.listeners('query-response').length).toBe(1);

    expect(knexWithParams.client.listeners('start').length).toBe(1);
    expect(knexWithParams.client.listeners('query').length).toBe(1);
    expect(knexWithParams.client.listeners('query-error').length).toBe(1);
    expect(knexWithParams.client.listeners('query-response').length).toBe(1);

    return knex.destroy();
  });

  it('listeners added to knex directly get copied correctly', () => {
    const knex = Knex({
      client: 'sqlite',
      connection: ':memory:',
    });
    const onQueryResponse = function (response, obj, builder) {};
    expect(knex.listeners('query-response').length).toBe(0);
    knex.on('query-response', onQueryResponse);

    const knexWithParams = knex.withUserParams();

    expect(knex.listeners('query-response').length).toBe(1);
    expect(knexWithParams.listeners('query-response').length).toBe(1);

    return knex.destroy();
  });

  it('listeners added to knex propagate to callback transaction correctly', async () => {
    const knex = Knex({
      client: 'sqlite',
      connection: ':memory:',
    });
    let queryResponseWasPropagated = false;
    let queryWasPropagated = false;
    let startWasPropagated = false;
    knex.on('start', () => {
      startWasPropagated = true;
    });
    knex.on('query', () => {
      queryWasPropagated = true;
    });
    knex.on('query-response', () => {
      queryResponseWasPropagated = true;
    });

    await knex.transaction(async (trx) => {
      await trx().select(1);
    });

    expect(startWasPropagated).toBe(true);
    expect(queryWasPropagated).toBe(true);
    expect(queryResponseWasPropagated).toBe(true);

    return knex.destroy();
  });

  it('listeners added to knex propagate to promise transaction correctly', async () => {
    const knex = Knex({
      client: 'sqlite',
      connection: ':memory:',
    });
    let queryResponseWasPropagated = false;
    let queryWasPropagated = false;
    let startWasPropagated = false;
    knex.on('start', () => {
      startWasPropagated = true;
    });
    knex.on('query', () => {
      queryWasPropagated = true;
    });
    knex.on('query-response', () => {
      queryResponseWasPropagated = true;
    });

    const trx = await knex.transaction();
    await trx.select(1);
    trx.commit();

    expect(startWasPropagated).toBe(true);
    expect(queryWasPropagated).toBe(true);
    expect(queryResponseWasPropagated).toBe(true);

    return knex.destroy();
  });

  it('adding listener to copy does not affect base knex', () => {
    const knex = Knex({
      client: 'sqlite',
      connection: ':memory:',
    });

    expect(knex.client.listeners('start').length).toBe(1);
    expect(knex.client.listeners('query').length).toBe(1);
    expect(knex.client.listeners('query-error').length).toBe(1);
    expect(knex.client.listeners('query-response').length).toBe(1);

    const knexWithParams = knex.withUserParams();
    knexWithParams.client.on('query', (obj) => {
      knexWithParams.emit('query', obj);
    });

    expect(knex.client.listeners('start').length).toBe(1);
    expect(knex.client.listeners('query').length).toBe(1);
    expect(knex.client.listeners('query-error').length).toBe(1);
    expect(knex.client.listeners('query-response').length).toBe(1);
    expect(knexWithParams.client.listeners('query').length).toBe(2);

    return knex.destroy();
  });

  it('sets correct postProcessResponse for builders instantiated from clone', () => {
    const knex = Knex({
      client: 'sqlite',
      postProcessResponse: noop,
    });

    const knexWithParams = knex.withUserParams();
    knexWithParams.client.config.postProcessResponse = null;
    const builderForTable = knex('tableName');
    const builderWithParamsForTable = knexWithParams('tableName');

    expect(knex.client.config.postProcessResponse).toBe(noop);
    expect(knexWithParams.client.config.postProcessResponse).toBe(null);
    expect(builderForTable.client.config.postProcessResponse).toBe(noop);
    expect(builderWithParamsForTable.client.config.postProcessResponse).toBe(
      null
    );

    return knex.destroy();
  });

  it.skipIf(!sqliteConfig)(
    'passes queryContext to wrapIdentifier in raw query',
    async () => {
      const knex = Knex(
        Object.assign({}, sqliteConfig, {
          wrapIdentifier: (str, origImpl, queryContext) => {
            if (!queryContext) {
              throw Error('We should have queryContext here right?');
            }

            if (str === 'iAmGoingToBeConvertedToId') {
              str = 'id';
            }
            return origImpl(str);
          },
        })
      );

      await knex.schema
        .queryContext({ someStuff: true })
        .dropTableIfExists('test')
        .then(() => {
          return knex.schema
            .queryContext({ someStuff: true })
            .createTable('test', (table) => {
              table.increments('id');
              table.string('text');
            });
        })
        .then(() => {
          return knex('test')
            .queryContext({ someStuff: true })
            .select('id')
            .whereRaw('id = ??', 'iAmGoingToBeConvertedToId');
        })
        .then(() => {
          return knex.schema
            .queryContext({ someStuff: true })
            .dropTable('test');
        });

      return knex.destroy();
    }
  );

  it.skipIf(!sqliteConfig)(
    'passes queryContext to wrapIdentifier in raw query in transaction',
    async () => {
      const knex = Knex(
        Object.assign({}, sqliteConfig, {
          wrapIdentifier: (str, origImpl, queryContext) => {
            if (!queryContext) {
              throw Error('We should have queryContext here right?');
            }

            if (str === 'iAmGoingToBeConvertedToId') {
              str = 'id';
            }
            return origImpl(str);
          },
        })
      );

      await knex.transaction((trx) => {
        return trx.schema
          .queryContext({ someStuff: true })
          .dropTableIfExists('test')
          .then(() => {
            return trx.schema
              .queryContext({ someStuff: true })
              .createTable('test', (table) => {
                table.increments('id');
                table.string('text');
              });
          })
          .then(() => {
            return trx('test')
              .queryContext({ someStuff: true })
              .select('id')
              .whereRaw('id = ??', 'iAmGoingToBeConvertedToId');
          })
          .then(() => {
            return trx.schema
              .queryContext({ someStuff: true })
              .dropTable('test');
          });
      });

      return knex.destroy();
    }
  );

  it('sets correct postProcessResponse for chained builders', () => {
    const knex = Knex({
      client: 'sqlite',
      postProcessResponse: noop,
    });

    const knexWithParams = knex.withUserParams();
    knexWithParams.client.config.postProcessResponse = null;
    const builderForTable = knex('tableName').where('1 = 1');
    const builderWithParamsForTable =
      knexWithParams('tableName').where('1 = 1');

    expect(knex.client.config.postProcessResponse).toBe(noop);
    expect(knexWithParams.client.config.postProcessResponse).toBe(null);
    expect(builderForTable.client.config.postProcessResponse).toBe(noop);
    expect(builderWithParamsForTable.client.config.postProcessResponse).toBe(
      null
    );

    knex.destroy();
  });

  it('throws if client module has not been installed', () => {
    // create dummy dialect which always fails when trying to load driver
    const SqliteClient = require(`../../lib/dialects/sqlite3/index.js`);
    class ClientFoobar extends SqliteClient {}

    ClientFoobar.prototype._driver = () => {
      throw new Error('Cannot require...');
    };
    ClientFoobar.prototype.driverName = 'foo-bar';

    expect(() => {
      Knex({ client: ClientFoobar, connection: {} });
    }).toThrow('Knex: run\n$ npm install foo-bar --save\nCannot require...');
  });

  describe('transaction', () => {
    beforeAll(() => {
      // This is the case when the |DB| environment parameter does not include |sqlite|.
      if (!sqliteConfig) {
        return;
      }
    });

    it.skipIf(!sqliteConfig)(
      'transaction of a copy with userParams retains userparams',
      async () => {
        const knex = Knex(sqliteConfig);

        const knexWithParams = knex.withUserParams({ userParam: '451' });

        await knexWithParams.transaction(async (trx) => {
          expect(trx.userParams).toEqual({
            userParam: '451',
          });
        });

        knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'propagates error correctly when all connections are in use',
      async () => {
        const knex = Knex(sqliteConfig);
        let trx;
        let wasAsserted = false;

        await knex
          .transaction()
          .then((newTrx) => {
            trx = newTrx;
            return knex.transaction();
          })
          .then(() => {
            throw new Error('Should not reach here');
          })
          .catch((err) => {
            wasAsserted = true;
            expect(err.message).toContain('Timeout acquiring a connection');
          });

        expect(wasAsserted).toBe(true);
        trx.commit();
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'supports direct retrieval of a transaction from provider',
      async () => {
        const knex = Knex(sqliteConfig);
        const trxProvider = knex.transactionProvider();
        const trxPromise = trxProvider();

        let transaction;
        await trxPromise
          .then((trx) => {
            transaction = trx;
            expect(trx.client.transacting).toBe(true);
            return knex.transacting(trx).select(knex.raw('1 as result'));
          })
          .then((rows) => {
            expect(rows[0].result).toBe(1);
            return transaction.commit();
          })
          .then(() => {
            return transaction.executionPromise;
          });

        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'supports nested transaction for promise transactions',
      async () => {
        const knex = Knex(sqliteConfig);
        const trx = await knex.transaction();
        const nestedTrx = await trx.transaction();
        const nestedTrx2 = await nestedTrx.transaction();
        expect(nestedTrx.name).toBe('knex');
        expect(nestedTrx2.name).toBe('knex');

        await nestedTrx2.commit();
        await trx.commit();
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'does not reject rolled back nested transactions by default',
      async () => {
        const knex = Knex(sqliteConfig);
        const trx = await knex.transaction();
        const nestedTrx = await trx.transaction();
        await nestedTrx.rollback();

        trx.commit();
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'supports accessing execution promise from standalone transaction',
      async () => {
        const knex = Knex(sqliteConfig);

        const trx = await knex.transaction();
        const executionPromise = trx.executionPromise;
        expect(executionPromise).toBeTruthy();

        expect(trx.client.transacting).toBe(true);
        const rows = await knex
          .transacting(trx)
          .select(knex.raw('1 as result'));
        expect(rows[0].result).toBe(1);
        await trx.commit();

        const result = await executionPromise;
        expect(result).toBeUndefined();
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'supports accessing execution promise from transaction with a callback',
      async () => {
        const knex = Knex(sqliteConfig);
        const trxPromise = new Promise((resolve, reject) => {
          knex.transaction((transaction) => {
            resolve(transaction);
          });
        });
        const trx = await trxPromise;
        const executionPromise = trx.executionPromise;
        expect(executionPromise).toBeTruthy();

        expect(trx.client.transacting).toBe(true);
        const rows = await knex
          .transacting(trx)
          .select(knex.raw('1 as result'));
        expect(rows[0].result).toBe(1);
        await trx.commit();

        const result = await executionPromise;
        expect(result).toBeUndefined();
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'resolves execution promise if there was a manual rollback and transaction is set not to reject',
      async () => {
        const knex = Knex(sqliteConfig);

        const trx = await knex.transaction();
        const executionPromise = trx.executionPromise;

        expect(trx.client.transacting).toBe(true);
        const rows = await knex
          .transacting(trx)
          .select(knex.raw('1 as result'));
        expect(rows[0].result).toBe(1);
        await trx.rollback();

        const result = await executionPromise;
        expect(result).toBeUndefined();
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'does not reject transaction by default when handler is provided and there is a rollback',
      async () => {
        const knex = Knex(sqliteConfig);
        await knex.transaction((trx) => {
          trx.rollback();
        });

        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'rejects execution promise if there was a manual rollback and transaction is set to reject',
      async () => {
        const knex = Knex(sqliteConfig);

        const trx = await knex.transaction(undefined, {
          doNotRejectOnRollback: false,
        });
        const executionPromise = trx.executionPromise;

        expect(trx.client.transacting).toBe(true);
        const rows = await knex
          .transacting(trx)
          .select(knex.raw('1 as result'));
        expect(rows[0].result).toBe(1);
        await trx.rollback();

        let errorWasThrown;
        try {
          await executionPromise;
        } catch (err) {
          errorWasThrown = true;
          expect(err.message).toBe(
            'Transaction rejected with non-error: undefined'
          );
        }
        expect(errorWasThrown).toBe(true);
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'does not reject promise when rolling back a transaction',
      async () => {
        const knex = Knex(sqliteConfig);
        const trxProvider = knex.transactionProvider();
        const trx = await trxProvider();

        await trx.rollback();
        await trx.executionPromise;
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'returns false when calling isCompleted on a transaction that is not complete',
      async () => {
        const knex = Knex(sqliteConfig);
        const trxProvider = knex.transactionProvider();
        const trx = await trxProvider();

        const completed = trx.isCompleted();
        expect(completed).toBe(false);

        trx.commit();
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'returns true when calling isCompleted on a transaction that is committed',
      async () => {
        const knex = Knex(sqliteConfig);
        const trxProvider = knex.transactionProvider();
        const trx = await trxProvider();

        await trx.commit();

        const completed = trx.isCompleted();
        expect(completed).toBe(true);
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'returns true when calling isCompleted on a transaction that is rolled back',
      async () => {
        const knex = Knex(sqliteConfig);
        const trxProvider = knex.transactionProvider();
        const trx = await trxProvider();

        await trx.rollback();

        const completed = trx.isCompleted();
        expect(completed).toBe(true);
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'returns false when calling isCompleted within a transaction handler',
      async () => {
        const knex = Knex(sqliteConfig);
        await knex.transaction((trx) => {
          expect(trx.isCompleted()).toBe(false);

          return trx.select(trx.raw('1 as result'));
        });
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'creating transaction copy with user params should throw an error',
      async () => {
        const knex = Knex(sqliteConfig);

        await knex.transaction(async (trx) => {
          expect(() => {
            trx.withUserParams({ userParam: '451' });
          }).toThrow(
            /Cannot set user params on a transaction - it can only inherit params from main knex instance/
          );
        });

        return knex.destroy();
      }
    );
  });

  describe('async stack traces', () => {
    it.skipIf(!sqliteConfig)(
      'should capture stack trace on query builder instantiation',
      async () => {
        const knex = Knex(
          Object.assign({}, sqliteConfig, { asyncStackTraces: true })
        );

        await knex('some_nonexisten_table')
          .select()
          .catch((err) => {
            expect(err.stack.split('\n')[1]).toMatch(
              /at Object.queryBuilder \(/
            ); // the index 1 might need adjustment if the code is refactored
            expect(typeof err.originalStack).toBe('string');
          });

        return knex.destroy();
      }
    );
  });

  describe('extend query builder', () => {
    beforeAll(() => {
      // This is the case when the |DB| environment parameter does not include |sqlite|.
      if (!sqliteConfig) {
        return;
      }
    });

    let connection;
    beforeEach(() => {
      connection = new sqlite3.Database(':memory:');
    });

    afterEach(() => {
      connection.close();
      delete QueryBuilder.prototype.customSelect;
    });

    it('should extend default queryBuilder', async () => {
      Knex.QueryBuilder.extend('customSelect', function (value) {
        return this.select(this.client.raw(`${value} as value`));
      });

      const knex = Knex({ client: 'sqlite3' });
      const result = await knex.connection(connection).customSelect(42);
      expect(result[0].value).toBe(42);
    });

    it.skipIf(!sqliteConfig)(
      'should have custom method with transaction',
      async () => {
        Knex.QueryBuilder.extend('customSelect', function (value) {
          return this.select(this.client.raw(`${value} as value`));
        });

        const knex = Knex(sqliteConfig);
        const trx = await knex.transaction();

        const result = await trx.customSelect(42);
        expect(result[0].value).toBe(42);

        trx.commit();
        return knex.destroy();
      }
    );

    describe('const trx = knex.transaction(cb)', () => {
      describe('and cb returns a Promise', () => {
        if (Promise.prototype.finally) {
          it.skipIf(!sqliteConfig)(
            'returns a Transaction that defines a `finally(..)` method',
            async () => {
              const knex = Knex(sqliteConfig);
              const trx = knex.transaction(async (tx) => {});
              try {
                expect(typeof trx.finally).toBe('function');
              } finally {
                await trx;
              }
              return knex.destroy();
            }
          );
        } else {
          it.skipIf(!sqliteConfig)(
            'returns a Transaction that does NOT define a `finally(..)` method',
            async () => {
              const knex = Knex(sqliteConfig);
              const trx = knex.transaction(async (tx) => {});
              try {
                expect(trx.finally).toBe(undefined);
              } finally {
                await trx;
              }
              return knex.destroy();
            }
          );
        }
      });
    });

    it.skipIf(!sqliteConfig)(
      'should have custom method on knex with user params',
      async () => {
        Knex.QueryBuilder.extend('customSelect', function (value) {
          return this.select(this.client.raw(`${value} as value`));
        });

        const knex = Knex(sqliteConfig);
        const knewWithParams = knex.withUserParams({ foo: 'bar' });
        const result = await knewWithParams.customSelect(42);
        expect(result[0].value).toBe(42);

        return knex.destroy();
      }
    );

    it('should throw exception when extending existing method', () => {
      expect(() =>
        Knex.QueryBuilder.extend('select', function (value) {})
      ).toThrow(`Can't extend QueryBuilder with existing method ('select')`);
    });

    it.skipIf(!sqliteConfig)(
      'should contain the query context on a query-error event',
      async () => {
        const spy = vi.fn();
        const context = { aPrimitive: true };
        const knex = Knex(sqliteConfig);
        const knexChain = knex
          .from('test')
          .queryContext(context)
          .on('query-error', spy);

        try {
          await knexChain.from('banana');
          // eslint-disable-next-line no-empty
        } catch (_e) {}

        expect(spy).toHaveBeenCalledOnce();
        const [[error, errorArgs]] = spy.mock.calls;
        expect(error).toBeInstanceOf(Error);
        expect(errorArgs).toBeTruthy();
        expect(errorArgs.queryContext).toBe(context);
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'should show compiled sql on error message when compileSqlOnError is true',
      async () => {
        const spy = vi.fn();
        const knex = Knex({ ...sqliteConfig, compileSqlOnError: true });
        const knexChain = knex.from('test').on('query-error', spy);

        try {
          await knexChain.insert({ foo: 'bar' });
          // eslint-disable-next-line no-empty
        } catch (_e) {}

        expect(spy).toHaveBeenCalledOnce();
        const [[error]] = spy.mock.calls;
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe(
          "insert into `test` (`foo`) values ('bar') - SQLITE_ERROR: no such table: test"
        );
        return knex.destroy();
      }
    );

    it.skipIf(!sqliteConfig)(
      'should show parameterized sql on error message when compileSqlOnError is false',
      async () => {
        const spy = vi.fn();
        const knex = Knex({ ...sqliteConfig, compileSqlOnError: false });
        const knexChain = knex.from('test').on('query-error', spy);

        try {
          await knexChain.insert({ foo: 'bar' });
          // eslint-disable-next-line no-empty
        } catch (_e) {}

        expect(spy).toHaveBeenCalledOnce();
        const [[error]] = spy.mock.calls;
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe(
          'insert into `test` (`foo`) values (?) - SQLITE_ERROR: no such table: test'
        );
        return knex.destroy();
      }
    );

    // TODO: Consider moving these somewhere that tests the
    //       QueryBuilder interface more directly.
    describe('qb = knex.select(1)', () => {
      if (Promise.prototype.finally) {
        it.skipIf(!sqliteConfig)(
          'returns a QueryBuilder that defines a `.finally(..)` method',
          async () => {
            const knex = Knex(sqliteConfig);
            const p = knex.select(1);
            try {
              expect(typeof p.finally).toBe('function');
            } finally {
              await p;
            }
            return knex.destroy();
          }
        );
      } else {
        it.skipIf(!sqliteConfig)(
          'returns a QueryBuilder that does NOT define a `.finally(..)` method',
          async () => {
            const knex = Knex(sqliteConfig);
            const p = knex.select(1);
            try {
              expect(p.finally).toBe(undefined);
            } finally {
              await p;
            }
            return knex.destroy();
          }
        );
      }
    });
  });
});
