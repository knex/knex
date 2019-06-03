const knex = require('../../../knex');
const expect = require('chai').expect;
const sinon = require('sinon');
const pgDialect = require('../../../src/dialects/postgres/index.js');
const pg = require('pg');
const Promise = require('bluebird');
const _ = require('lodash');

describe('Postgres Unit Tests', function() {
  let checkVersionStub, querySpy;
  before(() => {
    const fakeConnection = {
      query: (...args) => {
        const cb = args.find((arg) => {
          return _.isFunction(arg);
        });
        cb();
      },
      on: _.noop,
    };
    querySpy = sinon.spy(fakeConnection, 'query');

    checkVersionStub = sinon
      .stub(pgDialect.prototype, 'checkVersion')
      .callsFake(function() {
        return Promise.resolve('9.6');
      });

    sinon.stub(pg.Client.prototype, 'connect').callsFake(function(cb) {
      cb(null, fakeConnection);
    });
  });
  afterEach(() => {
    querySpy.resetHistory();
  });
  after(() => {
    sinon.restore();
  });

  it('does not resolve client version if specified explicitly', (done) => {
    const knexInstance = knex({
      client: 'postgresql',
      version: '10.5',
      connection: {
        pool: {},
      },
    });
    knexInstance.raw('select 1 as 1').then((result) => {
      expect(checkVersionStub.notCalled).to.equal(true);
      knexInstance.destroy();
      done();
    });
  });

  it('resolve client version if not specified explicitly', (done) => {
    const knexInstance = knex({
      client: 'postgresql',
      connection: {
        pool: {},
      },
    });
    knexInstance.raw('select 1 as 1').then((result) => {
      expect(checkVersionStub.calledOnce).to.equal(true);
      knexInstance.destroy();
      done();
    });
  });

  it('Validates searchPath as Array/String', function() {
    const knexInstance = knex({
      client: 'pg',
    });

    expect(function() {
      knexInstance.client.setSchemaSearchPath(null, {});
    }).to.throw(TypeError);

    expect(function() {
      knexInstance.client.setSchemaSearchPath(null, 4);
    }).to.throw(TypeError);

    const fakeQueryFn = function(expectedSearchPath) {
      return {
        query: function(sql, callback) {
          try {
            expect(sql).to.equal('set search_path to ' + expectedSearchPath);
            callback(null);
          } catch (error) {
            callback(error);
          }
        },
      };
    };

    return knexInstance.client
      .setSchemaSearchPath(fakeQueryFn('"public,knex"'), 'public,knex')
      .then(function() {
        return knexInstance.client.setSchemaSearchPath(
          fakeQueryFn('"public","knex"'),
          ['public', 'knex']
        );
      })
      .then(function() {
        return knexInstance.client.setSchemaSearchPath(
          fakeQueryFn('"public"'),
          'public'
        );
      });
  });
  it('Uses documented query config as param when providing bindings', (done) => {
    const knexInstance = knex({
      client: 'postgresql',
      connection: {},
    });
    knexInstance.raw('select 1 as ?', ['foo']).then((result) => {
      sinon.assert.calledOnce(querySpy);
      sinon.assert.calledWithExactly(
        querySpy,
        {
          text: 'select 1 as $1',
          values: ['foo'],
        },
        sinon.match.func
      );
      knexInstance.destroy();
      done();
    });
  });
});
