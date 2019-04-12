const Knex = require('../../lib/index');
const { expect } = require('chai');
const bluebird = require('bluebird');
const sqliteConfig = require('../knexfile').sqlite3;
const sqlite3 = require('sqlite3');
const { noop } = require('lodash');
const { isNode6 } = require('../../lib/util/version-helper');

describe('knex', () => {
  it('preserves global Bluebird Promise', () => {
    const oldPromise = global.Promise;
    global.Promise = bluebird;
    expect(Promise.map).to.be.a('function'); // eslint-disable-line no-undef
    require('../../knex');
    expect(Promise.map).to.be.a('function'); // eslint-disable-line no-undef
    global.Promise = oldPromise;
  });

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
    if (isNode6()) {
      return;
    }

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
    const onQueryResponse = function(response, obj, builder) {};
    expect(knex.listeners('query-response').length).to.equal(0);
    knex.on('query-response', onQueryResponse);

    const knexWithParams = knex.withUserParams();

    expect(knex.listeners('query-response').length).to.equal(1);
    expect(knexWithParams.listeners('query-response').length).to.equal(1);
  });

  it('adding listener to copy does not affect base knex', () => {
    if (isNode6()) {
      return;
    }

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

  it('passes queryContext to wrapIdentifier in raw query', () => {
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

  it('passes queryContext to wrapIdentifier in raw query in transaction', () => {
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

  it('transaction of a copy with userParams retains userparams', (done) => {
    const knex = Knex(sqliteConfig);

    const knexWithParams = knex.withUserParams({ userParam: '451' });

    knexWithParams.transaction((trx) => {
      expect(trx.userParams).to.deep.equal({
        userParam: '451',
      });
      done();
      return bluebird.resolve();
    });
  });

  it('creating transaction copy with user params should throw an error', (done) => {
    const knex = Knex(sqliteConfig);

    knex.transaction((trx) => {
      expect(() => {
        trx.withUserParams({ userParam: '451' });
      }).to.throw(
        /Cannot set user params on a transaction - it can only inherit params from main knex instance/
      );
      done();
      return bluebird.resolve();
    });
  });

  it('throws if client module has not been installed', () => {
    expect(() => {
      Knex({ client: 'oracledb', connection: {} });
    }).to.throw(
      "Knex: run\n$ npm install oracledb --save\nCannot find module 'oracledb'"
    );
  });

  describe('async stack traces', () => {
    it('should capture stack trace on query builder instantiation', () => {
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
});
