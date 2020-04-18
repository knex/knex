const Knex = require('../../lib/index');
const QueryBuilder = require('../../lib/query/builder');
const { expect } = require('chai');
const sqliteConfig = require('../knexfile').sqlite3;
const sqlite3 = require('sqlite3');
const { noop } = require('lodash');
const inherits = require('inherits');

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
  });

  it('listeners added to knex directly get copied correctly', () => {
    const knex = Knex({
      client: 'sqlite',
    });
    const onQueryResponse = function (response, obj, builder) {};
    expect(knex.listeners('query-response').length).to.equal(0);
    knex.on('query-response', onQueryResponse);

    const knexWithParams = knex.withUserParams();

    expect(knex.listeners('query-response').length).to.equal(1);
    expect(knexWithParams.listeners('query-response').length).to.equal(1);
  });

  it('adding listener to copy does not affect base knex', () => {
    const knex = Knex({
      client: 'sqlite',
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
  });

  it('passes queryContext to wrapIdentifier in raw query', function () {
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

    return knex.schema
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
  });

  it('passes queryContext to wrapIdentifier in raw query in transaction', function () {
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

    return knex.transaction((trx) => {
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
  });

  it('sets correct postProcessResponse for chained builders', () => {
    const knex = Knex({
      client: 'sqlite',
      postProcessResponse: noop,
    });

    const knexWithParams = knex.withUserParams();
    knexWithParams.client.config.postProcessResponse = null;
    const builderForTable = knex('tableName').where('1 = 1');
    const builderWithParamsForTable = knexWithParams('tableName').where(
      '1 = 1'
    );

    expect(knex.client.config.postProcessResponse).to.equal(noop);
    expect(knexWithParams.client.config.postProcessResponse).to.equal(null);
    expect(builderForTable.client.config.postProcessResponse).to.equal(noop);
    expect(
      builderWithParamsForTable.client.config.postProcessResponse
    ).to.equal(null);
  });

  it('transaction of a copy with userParams retains userparams', function () {
    if (!sqliteConfig) {
      return this.skip();
    }

    const knex = Knex(sqliteConfig);

    const knexWithParams = knex.withUserParams({ userParam: '451' });

    return knexWithParams.transaction(async (trx) => {
      expect(trx.userParams).to.deep.equal({
        userParam: '451',
      });
    });
  });

  it('propagates error correctly when all connections are in use', function () {
    this.timeout(2000);
    const knex = Knex(sqliteConfig);
    return knex
      .transaction()
      .then(() => {
        return knex.transaction();
      })
      .then(() => {
        throw new Error('Should not reach here');
      })
      .catch((err) => {
        expect(err.message).to.include('Timeout acquiring a connection');
      });
  });

  it('supports direct retrieval of a transaction from provider', () => {
    const knex = Knex(sqliteConfig);
    const trxProvider = knex.transactionProvider();
    const trxPromise = trxProvider();

    let transaction;
    return trxPromise
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
  });

  it('supports nested transaction for promise transactions', async () => {
    const knex = Knex(sqliteConfig);
    const trx = await knex.transaction();
    const nestedTrx = await trx.transaction();
    const nestedTrx2 = await nestedTrx.transaction();
    expect(nestedTrx.name).to.equal('knex');
    expect(nestedTrx2.name).to.equal('knex');
  });

  it('does not reject rolled back nested transactions by default', async () => {
    const knex = Knex(sqliteConfig);
    const trx = await knex.transaction();
    const nestedTrx = await trx.transaction();
    await nestedTrx.rollback();
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
  });

  it('does not reject promise when rolling back a transaction', async () => {
    const knex = Knex(sqliteConfig);
    const trxProvider = knex.transactionProvider();
    const trx = await trxProvider();

    await trx.rollback();
    await trx.executionPromise;
  });

  it('returns false when calling isCompleted on a transaction that is not complete', async () => {
    const knex = Knex(sqliteConfig);
    const trxProvider = knex.transactionProvider();
    const trx = await trxProvider();

    const completed = trx.isCompleted();
    expect(completed).to.be.false;
  });

  it('returns true when calling isCompleted on a transaction that is committed', async () => {
    const knex = Knex(sqliteConfig);
    const trxProvider = knex.transactionProvider();
    const trx = await trxProvider();

    await trx.commit();

    const completed = trx.isCompleted();
    expect(completed).to.be.true;
  });

  it('returns true when calling isCompleted on a transaction that is rolled back', async () => {
    const knex = Knex(sqliteConfig);
    const trxProvider = knex.transactionProvider();
    const trx = await trxProvider();

    await trx.rollback();

    const completed = trx.isCompleted();
    expect(completed).to.be.true;
  });

  it('returns false when calling isCompleted within a transaction handler', async () => {
    const knex = Knex(sqliteConfig);
    await knex.transaction((trx) => {
      expect(trx.isCompleted()).to.be.false;

      return trx.select(trx.raw('1 as result'));
    });
  });

  it('creating transaction copy with user params should throw an error', function () {
    if (!sqliteConfig) {
      return this.skip();
    }

    const knex = Knex(sqliteConfig);

    return knex.transaction(async (trx) => {
      expect(() => {
        trx.withUserParams({ userParam: '451' });
      }).to.throw(
        /Cannot set user params on a transaction - it can only inherit params from main knex instance/
      );
    });
  });

  it('throws if client module has not been installed', () => {
    // create dummy dialect which always fails when trying to load driver
    const SqliteClient = require(`../../lib/dialects/sqlite3/index.js`);
    function ClientFoobar(config) {
      SqliteClient.call(this, config);
    }

    inherits(ClientFoobar, SqliteClient);

    ClientFoobar.prototype._driver = () => {
      throw new Error('Cannot require...');
    };
    ClientFoobar.prototype.driverName = 'foo-bar';

    expect(() => {
      Knex({ client: ClientFoobar, connection: {} });
    }).to.throw('Knex: run\n$ npm install foo-bar --save\nCannot require...');
  });

  describe('async stack traces', () => {
    it('should capture stack trace on query builder instantiation', function () {
      if (!sqliteConfig) {
        return this.skip();
      }

      const knex = Knex(
        Object.assign({}, sqliteConfig, { asyncStackTraces: true })
      );

      return knex('some_nonexisten_table')
        .select()
        .catch((err) => {
          expect(err.stack.split('\n')[1]).to.match(/at createQueryBuilder \(/); // the index 1 might need adjustment if the code is refactored
          expect(typeof err.originalStack).to.equal('string');
        });
    });
  });

  describe('extend query builder', () => {
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
    });

    it('should throw exception when extending existing method', () => {
      expect(() =>
        Knex.QueryBuilder.extend('select', function (value) {})
      ).to.throw(`Can't extend QueryBuilder with existing method ('select')`);
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
        });
      }
    });
  });
});
