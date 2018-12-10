const Knex = require('../../lib/index');
const { expect } = require('chai');
const bluebird = require('bluebird');
const sqliteConfig = require('../knexfile').sqlite3;
const sqlite3 = require('sqlite3');
const { noop } = require('lodash');

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
    expect(Knex({ client: 'oracle' })).to.throw(
      /Knex: run\n$ npm install oracle/
    );
  });

  describe('async stack traces', () => {
    it('should capture stack trace on query builder instantiation', () => {
      const knex = Knex({
        ...sqliteConfig,
        asyncStackTraces: true,
      });

      return knex('some_nonexisten_table')
        .select()
        .catch((err) => {
          expect(err.stack.split('\n')[1]).to.match(/at createQueryBuilder \(/); // the index 1 might need adjustment if the code is refactored
          expect(typeof err.originalStack).to.equal('string');
        });
    });
  });
});
