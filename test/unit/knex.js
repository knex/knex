const Knex = require('../../lib/index');
const QueryBuilder = require('../../lib/query/querybuilder');
const { expect } = require('chai');
const sqliteConfig = require('../knexfile').sqlite3;
const sqlite3 = require('sqlite3');
const { noop } = require('lodash');
const sinon = require('sinon');

describe('knex', () => {
  describe('supports passing existing connection', () => {
    let connection;
    beforeEach(() => {
      connection = new sqlite3.Database(':memory:');
    });

    afterEach(() => {
      connection.close();
    });

    it('happy path', (done) => {
      const knex = Knex({ client: 'sqlite3' });
      knex
        .connection(connection)
        .select(knex.raw('"0" as value'))
        .then((result) => {
          expect(result[0].value).to.equal('0');
          done();
        });
    });
  });

  it('throws error on unsupported config client value', () => {
    expect(() => {
      Knex({
        client: 'dummy',
      });
    }).to.throw(
      /Unknown configuration option 'client' value dummy. Note that it is case-sensitive, check documentation for supported values/
    );
  });

  it('accepts supported config client value', () => {
    expect(() => {
      Knex({
        client: 'mysql',
      });
    }).not.to.throw();
  });

  it('accepts supported config client value alias', () => {
    expect(() => {
      Knex({
        client: 'sqlite',
      });
    }).not.to.throw();
  });

  it('supports creating copy with userParams', () => {
    const knex = Knex({
      client: 'sqlite',
    });

    const knexWithParams = knex.withUserParams({ userParam: '451' });

    expect(knexWithParams).to.be.a('function');
    expect(knexWithParams.userParams).to.deep.equal({ userParam: '451' });
    expect(knexWithParams.client.config.client).to.equal('sqlite');
    expect(knexWithParams.migrate).to.be.a('object');
  });

  it('supports passing user params in config', () => {
    const knexWithParams = Knex({
      client: 'sqlite',
      userParams: {
        userParam: '451',
      },
    });

    expect(knexWithParams).to.be.a('function');
    expect(knexWithParams.userParams).to.deep.equal({ userParam: '451' });
    expect(knexWithParams.client.config.client).to.equal('sqlite');
    expect(knexWithParams.migrate).to.be.a('object');
  });

  it('migrator of a copy with userParams has reference to correct Knex', () => {
    const knex = Knex({
      client: 'sqlite',
    });

    const knexWithParams = knex.withUserParams({ userParam: '451' });

    expect(knexWithParams.migrate.knex.userParams).to.deep.equal({
      userParam: '451',
    });
  });

  it('copying does not result in duplicate listeners', () => {
    const knex = Knex({
      client: 'sqlite',
      connection: ':memory:',
    });
    const knexWithParams = knex.withUserParams();

    expect(knex.client.listeners('start').length).to.equal(1);
    expect(knex.client.listeners('query').length).to.equal(1);
    expect(knex.client.listeners('query-error').length).to.equal(1);
    expect(knex.client.listeners('query-response').length).to.equal(1);

    expect(knexWithParams.client.listeners('start').length).to.equal(1);
    expect(knexWithParams.client.listeners('query').length).to.equal(1);
    expect(knexWithParams.client.listeners('query-error').length).to.equal(1);
    expect(knexWithParams.client.listeners('query-response').length).to.equal(
      1
    );

    return knex.destroy();
  });

  it('listeners added to knex directly get copied correctly', () => {
    const knex = Knex({
      client: 'sqlite',
      connection: ':memory:',
    });
    const onQueryResponse = function (response, obj, builder) {};
    expect(knex.listeners('query-response').length).to.equal(0);
    knex.on('query-response', onQueryResponse);

    const knexWithParams = knex.withUserParams();

    expect(knex.listeners('query-response').length).to.equal(1);
    expect(knexWithParams.listeners('query-response').length).to.equal(1);

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

    expect(startWasPropagated).to.equal(true);
    expect(queryWasPropagated).to.equal(true);
    expect(queryResponseWasPropagated).to.equal(true);

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

    expect(startWasPropagated).to.equal(true);
    expect(queryWasPropagated).to.equal(true);
    expect(queryResponseWasPropagated).to.equal(true);

    return knex.destroy();
  });

  it('adding listener to copy does not affect base knex', () => {
    const knex = Knex({
      client: 'sqlite',
      connection: ':memory:',
    });

    expect(knex.client.listeners('start').length).to.equal(1);
    expect(knex.client.listeners('query').length).to.equal(1);
    expect(knex.client.listeners('query-error').length).to.equal(1);
    expect(knex.client.listeners('query-response').length).to.equal(1);

    const knexWithParams = knex.withUserParams();
    knexWithParams.client.on('query', (obj) => {
      knexWithParams.emit('query', obj);
    });

    expect(knex.client.listeners('start').length).to.equal(1);
    expect(knex.client.listeners('query').length).to.equal(1);
    expect(knex.client.listeners('query-error').length).to.equal(1);
    expect(knex.client.listeners('query-response').length).to.equal(1);
    expect(knexWithParams.client.listeners('query').length).to.equal(2);

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

    expect(knex.client.config.postProcessResponse).to.equal(noop);
    expect(knexWithParams.client.config.postProcessResponse).to.equal(null);
    expect(builderForTable.client.config.postProcessResponse).to.equal(noop);
    expect(
      builderWithParamsForTable.client.config.postProcessResponse
    ).to.equal(null);

    return knex.destroy();
  });

  it('passes queryContext to wrapIdentifier in raw query', async function () {
    if (!sqliteConfig) {
      return this.skip();
    }

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
        return knex.schema.queryContext({ someStuff: true }).dropTable('test');
      });

    return knex.destroy();
  });

  it('passes queryContext to wrapIdentifier in raw query in transaction', async function () {
    if (!sqliteConfig) {
      return this.skip();
    }

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
          return trx.schema.queryContext({ someStuff: true }).dropTable('test');
        });
    });

    return knex.destroy();
  });

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

    expect(knex.client.config.postProcessResponse).to.equal(noop);
    expect(knexWithParams.client.config.postProcessResponse).to.equal(null);
    expect(builderForTable.client.config.postProcessResponse).to.equal(noop);
    expect(
      builderWithParamsForTable.client.config.postProcessResponse
    ).to.equal(null);

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
    }).to.throw('Knex: run\n$ npm install foo-bar --save\nCannot require...');
  });

  describe('transaction', () => {
    before(function skipSuiteIfSqliteConfigAbsent() {
      // This is the case when the |DB| environment parameter does not include |sqlite|.
      if (!sqliteConfig) {
        return this.skip();
      }
    });

    it('transaction of a copy with userParams retains userparams', async function () {
      const knex = Knex(sqliteConfig);

      const knexWithParams = knex.withUserParams({ userParam: '451' });

      await knexWithParams.transaction(async (trx) => {
        expect(trx.userParams).to.deep.equal({
          userParam: '451',
        });
      });

      knex.destroy();
    });

    it('propagates error correctly when all connections are in use', async function () {
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
          expect(err.message).to.include('Timeout acquiring a connection');
        });

      expect(wasAsserted).to.equal(true);
      trx.commit();
      return knex.destroy();
    });

    it('supports direct retrieval of a transaction from provider', async function () {
      const knex = Knex(sqliteConfig);
      const trxProvider = knex.transactionProvider();
      const trxPromise = trxProvider();

      let transaction;
      await trxPromise
        .then((trx) => {
          transaction = trx;
          expect(trx.client.transacting).to.equal(true);
          return knex.transacting(trx).select(knex.raw('1 as result'));
        })
        .then((rows) => {
          expect(rows[0].result).to.equal(1);
          return transaction.commit();
        })
        .then(() => {
          return transaction.executionPromise;
        });

      return knex.destroy();
    });

    it('supports nested transaction for promise transactions', async () => {
      const knex = Knex(sqliteConfig);
      const trx = await knex.transaction();
      const nestedTrx = await trx.transaction();
      const nestedTrx2 = await nestedTrx.transaction();
      expect(nestedTrx.name).to.equal('knex');
      expect(nestedTrx2.name).to.equal('knex');

      trx.commit();
      return knex.destroy();
    });

    it('does not reject rolled back nested transactions by default', async () => {
      const knex = Knex(sqliteConfig);
      const trx = await knex.transaction();
      const nestedTrx = await trx.transaction();
      await nestedTrx.rollback();

      trx.commit();
      return knex.destroy();
    });

    it('supports accessing execution promise from standalone transaction', async () => {
      const knex = Knex(sqliteConfig);

      const trx = await knex.transaction();
      const executionPromise = trx.executionPromise;
      expect(executionPromise).to.be.ok;

      expect(trx.client.transacting).to.equal(true);
      const rows = await knex.transacting(trx).select(knex.raw('1 as result'));
      expect(rows[0].result).to.equal(1);
      await trx.commit();

      const result = await executionPromise;
      expect(result).to.be.undefined;
      return knex.destroy();
    });

    it('supports accessing execution promise from transaction with a callback', async () => {
      const knex = Knex(sqliteConfig);
      const trxPromise = new Promise((resolve, reject) => {
        knex.transaction((transaction) => {
          resolve(transaction);
        });
      });
      const trx = await trxPromise;
      const executionPromise = trx.executionPromise;
      expect(executionPromise).to.be.ok;

      expect(trx.client.transacting).to.equal(true);
      const rows = await knex.transacting(trx).select(knex.raw('1 as result'));
      expect(rows[0].result).to.equal(1);
      await trx.commit();

      const result = await executionPromise;
      expect(result).to.be.undefined;
      return knex.destroy();
    });

    it('resolves execution promise if there was a manual rollback and transaction is set not to reject', async () => {
      const knex = Knex(sqliteConfig);

      const trx = await knex.transaction();
      const executionPromise = trx.executionPromise;

      expect(trx.client.transacting).to.equal(true);
      const rows = await knex.transacting(trx).select(knex.raw('1 as result'));
      expect(rows[0].result).to.equal(1);
      await trx.rollback();

      const result = await executionPromise;
      expect(result).to.be.undefined;
      return knex.destroy();
    });

    it('does not reject transaction by default when handler is provided and there is a rollback', async () => {
      const knex = Knex(sqliteConfig);
      await knex.transaction((trx) => {
        trx.rollback();
      });

      return knex.destroy();
    });

    it('rejects execution promise if there was a manual rollback and transaction is set to reject', async () => {
      const knex = Knex(sqliteConfig);

      const trx = await knex.transaction(undefined, {
        doNotRejectOnRollback: false,
      });
      const executionPromise = trx.executionPromise;

      expect(trx.client.transacting).to.equal(true);
      const rows = await knex.transacting(trx).select(knex.raw('1 as result'));
      expect(rows[0].result).to.equal(1);
      await trx.rollback();

      let errorWasThrown;
      try {
        await executionPromise;
      } catch (err) {
        errorWasThrown = true;
        expect(err.message).to.equal(
          'Transaction rejected with non-error: undefined'
        );
      }
      expect(errorWasThrown).to.be.true;
      return knex.destroy();
    });

    it('does not reject promise when rolling back a transaction', async () => {
      const knex = Knex(sqliteConfig);
      const trxProvider = knex.transactionProvider();
      const trx = await trxProvider();

      await trx.rollback();
      await trx.executionPromise;
      return knex.destroy();
    });

    it('returns false when calling isCompleted on a transaction that is not complete', async () => {
      const knex = Knex(sqliteConfig);
      const trxProvider = knex.transactionProvider();
      const trx = await trxProvider();

      const completed = trx.isCompleted();
      expect(completed).to.be.false;

      trx.commit();
      return knex.destroy();
    });

    it('returns true when calling isCompleted on a transaction that is committed', async () => {
      const knex = Knex(sqliteConfig);
      const trxProvider = knex.transactionProvider();
      const trx = await trxProvider();

      await trx.commit();

      const completed = trx.isCompleted();
      expect(completed).to.be.true;
      return knex.destroy();
    });

    it('returns true when calling isCompleted on a transaction that is rolled back', async () => {
      const knex = Knex(sqliteConfig);
      const trxProvider = knex.transactionProvider();
      const trx = await trxProvider();

      await trx.rollback();

      const completed = trx.isCompleted();
      expect(completed).to.be.true;
      return knex.destroy();
    });

    it('returns false when calling isCompleted within a transaction handler', async () => {
      const knex = Knex(sqliteConfig);
      await knex.transaction((trx) => {
        expect(trx.isCompleted()).to.be.false;

        return trx.select(trx.raw('1 as result'));
      });
      return knex.destroy();
    });

    it('creating transaction copy with user params should throw an error', async function () {
      const knex = Knex(sqliteConfig);

      await knex.transaction(async (trx) => {
        expect(() => {
          trx.withUserParams({ userParam: '451' });
        }).to.throw(
          /Cannot set user params on a transaction - it can only inherit params from main knex instance/
        );
      });

      return knex.destroy();
    });
  });

  describe('async stack traces', () => {
    it('should capture stack trace on query builder instantiation', async function () {
      if (!sqliteConfig) {
        return this.skip();
      }

      const knex = Knex(
        Object.assign({}, sqliteConfig, { asyncStackTraces: true })
      );

      await knex('some_nonexisten_table')
        .select()
        .catch((err) => {
          expect(err.stack.split('\n')[1]).to.match(
            /at Object.queryBuilder \(/
          ); // the index 1 might need adjustment if the code is refactored
          expect(typeof err.originalStack).to.equal('string');
        });

      return knex.destroy();
    });
  });

  describe('extend query builder', () => {
    before(function skipSuiteIfSqliteConfigAbsent() {
      // This is the case when the |DB| environment parameter does not include |sqlite|.
      if (!sqliteConfig) {
        return this.skip();
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

    it('should extend default queryBuilder', (done) => {
      Knex.QueryBuilder.extend('customSelect', function (value) {
        return this.select(this.client.raw(`${value} as value`));
      });

      const knex = Knex({ client: 'sqlite3' });
      knex
        .connection(connection)
        .customSelect(42)
        .then((result) => {
          expect(result[0].value).to.equal(42);
          done();
        });
    });

    it('should have custom method with transaction', async () => {
      Knex.QueryBuilder.extend('customSelect', function (value) {
        return this.select(this.client.raw(`${value} as value`));
      });

      const knex = Knex(sqliteConfig);
      const trx = await knex.transaction();

      const result = await trx.customSelect(42);
      expect(result[0].value).to.equal(42);

      trx.commit();
      return knex.destroy();
    });

    context('const trx = knex.transaction(cb)', function () {
      context('and cb returns a Promise', function () {
        if (Promise.prototype.finally) {
          it('returns a Transaction that defines a `finally(..)` method', async function () {
            const knex = Knex(sqliteConfig);
            const trx = knex.transaction(async (tx) => {});
            try {
              expect(trx.finally).to.be.a('function');
            } finally {
              await trx;
            }
            return knex.destroy();
          });
        } else {
          it('returns a Transaction that does NOT define a `finally(..)` method', async function () {
            const knex = Knex(sqliteConfig);
            const trx = knex.transaction(async (tx) => {});
            try {
              expect(trx.finally).to.equal(undefined);
            } finally {
              await trx;
            }
            return knex.destroy();
          });
        }
      });
    });

    it('should have custom method on knex with user params', async () => {
      Knex.QueryBuilder.extend('customSelect', function (value) {
        return this.select(this.client.raw(`${value} as value`));
      });

      const knex = Knex(sqliteConfig);
      const knewWithParams = knex.withUserParams({ foo: 'bar' });
      const result = await knewWithParams.customSelect(42);
      expect(result[0].value).to.equal(42);

      return knex.destroy();
    });

    it('should throw exception when extending existing method', () => {
      expect(() =>
        Knex.QueryBuilder.extend('select', function (value) {})
      ).to.throw(`Can't extend QueryBuilder with existing method ('select')`);
    });

    it('should contain the query context on a query-error event', async function () {
      const spy = sinon.spy();
      const context = { aPrimitive: true };
      const knex = Knex(sqliteConfig)
        .from('test')
        .queryContext(context)
        .on('query-error', spy);

      try {
        await knex.from('banana');
        // eslint-disable-next-line no-empty
      } catch (_e) {}

      expect(spy).to.be.calledOnce;
      const [[error, errorArgs]] = spy.args;
      expect(error).to.be.instanceOf(Error);
      expect(errorArgs).to.be.ok;
      expect(errorArgs.queryContext).to.equal(context);
    });

    it('should show compiled sql on error message when compileSqlOnError is true', async function () {
      const spy = sinon.spy();
      const knex = Knex({ ...sqliteConfig, compileSqlOnError: true })
        .from('test')
        .on('query-error', spy);

      try {
        await knex.insert({ foo: 'bar' });
        // eslint-disable-next-line no-empty
      } catch (_e) {}

      expect(spy).to.be.calledOnce;
      const [[error]] = spy.args;
      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.equal(
        "insert into `test` (`foo`) values ('bar') - SQLITE_ERROR: no such table: test"
      );
    });

    it('should show parameterized sql on error message when compileSqlOnError is false', async function () {
      const spy = sinon.spy();
      const knex = Knex({ ...sqliteConfig, compileSqlOnError: false })
        .from('test')
        .on('query-error', spy);

      try {
        await knex.insert({ foo: 'bar' });
        // eslint-disable-next-line no-empty
      } catch (_e) {}

      expect(spy).to.be.calledOnce;
      const [[error]] = spy.args;
      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.equal(
        'insert into `test` (`foo`) values (?) - SQLITE_ERROR: no such table: test'
      );
    });

    // TODO: Consider moving these somewhere that tests the
    //       QueryBuilder interface more directly.
    context('qb = knex.select(1)', function () {
      if (Promise.prototype.finally) {
        it('returns a QueryBuilder that defines a `.finally(..)` method', async function () {
          const knex = Knex(sqliteConfig);
          const p = knex.select(1);
          try {
            expect(p.finally).to.be.a('function');
          } finally {
            await p;
          }
          return knex.destroy();
        });
      } else {
        it('returns a QueryBuilder that does NOT define a `.finally(..)` method', async function () {
          const knex = Knex(sqliteConfig);
          const p = knex.select(1);
          try {
            expect(p.finally).to.equal(undefined);
          } finally {
            await p;
          }
          return knex.destroy();
        });
      }
    });
  });
});
