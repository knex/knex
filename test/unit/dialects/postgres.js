const knex = require('../../../knex');
const expect = require('chai').expect;
const sinon = require('sinon');
const pgDialect = require('../../../lib/dialects/postgres/index.js');
const _ = require('lodash');
const { isFunction } = require('../../../lib/util/is');

describe('Postgres Unit Tests', function () {
  let checkVersionStub, querySpy;
  before(() => {
    const fakeConnection = {
      query: (...args) => {
        const cb = args.find((arg) => {
          return isFunction(arg);
        });
        cb();
      },
      on: _.noop,
    };
    querySpy = sinon.spy(fakeConnection, 'query');

    checkVersionStub = sinon
      .stub(pgDialect.prototype, 'checkVersion')
      .callsFake(function () {
        return Promise.resolve('9.6');
      });
    sinon
      .stub(pgDialect.prototype, '_acquireOnlyConnection')
      .returns(Promise.resolve(fakeConnection));
  });
  afterEach(() => {
    querySpy.resetHistory();
  });
  after(() => {
    sinon.restore();
  });

  it('does not resolve client version if specified explicitly', () => {
    const knexInstance = knex({
      client: 'postgres',
      version: '10.5',
      connection: {
        pool: {},
      },
    });
    return knexInstance.raw('select 1 as 1').then((result) => {
      expect(checkVersionStub.notCalled).to.equal(true);
      knexInstance.destroy();
    });
  });

  it('escape statements correctly', async () => {
    const knexInstance = knex({
      client: 'postgresql',
      version: '10.5',
      connection: {
        pool: {},
      },
    });
    const sql = knexInstance('projects')
      .where('id = 1 UNION SELECT 1, version();', 1)
      .toSQL();
    expect(sql.sql).to.equal(
      'select * from "projects" where "id = 1 UNION SELECT 1, version();" = ?'
    );

    const sql2 = knexInstance('projects')
      .where('id = 1" UNION SELECT 1, version();', 1)
      .toSQL();
    expect(sql2.sql).to.equal(
      'select * from "projects" where "id = 1"" UNION SELECT 1, version();" = ?'
    );
  });

  it('resolve client version if not specified explicitly', () => {
    const knexInstance = knex({
      client: 'postgresql',
      connection: {
        pool: {},
      },
    });
    return knexInstance.raw('select 1 as 1').then((result) => {
      expect(checkVersionStub.calledOnce).to.equal(true);
      knexInstance.destroy();
    });
  });

  it('Validates searchPath as Array/String', function () {
    const knexInstance = knex({
      client: 'pg',
    });

    expect(function () {
      knexInstance.client.setSchemaSearchPath(null, {});
    }).to.throw(TypeError);

    expect(function () {
      knexInstance.client.setSchemaSearchPath(null, 4);
    }).to.throw(TypeError);

    const fakeQueryFn = function (expectedSearchPath) {
      return {
        query: function (sql, callback) {
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
      .then(function () {
        return knexInstance.client.setSchemaSearchPath(
          fakeQueryFn('"public","knex"'),
          ['public', 'knex']
        );
      })
      .then(function () {
        return knexInstance.client.setSchemaSearchPath(
          fakeQueryFn('"public"'),
          'public'
        );
      });
  });

  it('Uses documented query config as param when providing bindings', () => {
    const knexInstance = knex({
      client: 'postgresql',
      connection: {},
    });
    return knexInstance.raw('select 1 as ?', ['foo']).then((result) => {
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
    });
  });

  it("throws a helpful error when pg-query-stream isn't installed", async () => {
    const knexInstance = knex({
      client: 'postgresql',
      version: '10.5',
      connection: {
        pool: {},
      },
    });

    const Module = require('module');
    const originalLoad = Module._load;
    const loadStub = sinon
      .stub(Module, '_load')
      .callsFake((request, parent, isMain) => {
        if (request === 'pg-query-stream') {
          const err = new Error("Cannot find module 'pg-query-stream'");
          err.code = 'MODULE_NOT_FOUND';
          throw err;
        }
        return originalLoad(request, parent, isMain);
      });

    try {
      expect(() =>
        knexInstance.client._stream(
          {
            query() {
              throw new Error('connection.query should not be called');
            },
          },
          { sql: 'select 1', bindings: [] },
          { on: _.noop, emit: _.noop }
        )
      ).to.throw(
        "knex PostgreSQL query streaming requires the 'pg-query-stream' package. Please install it (e.g. `npm i pg-query-stream`)."
      );
    } finally {
      loadStub.restore();
      await knexInstance.destroy();
    }
  });

  it('does not require pg-query-stream in browser mode', async () => {
    const knexInstance = knex({
      client: 'postgresql',
      version: '10.5',
      connection: {
        pool: {},
      },
    });

    const Module = require('module');
    const originalLoad = Module._load;
    const loadStub = sinon
      .stub(Module, '_load')
      .callsFake((request, parent, isMain) => {
        if (request === 'pg-query-stream') {
          throw new Error('pg-query-stream should not be required in browser');
        }
        return originalLoad(request, parent, isMain);
      });

    const originalBrowser = process.browser;
    process.browser = true;

    try {
      const connection = {
        query() {
          throw new Error('connection.query should not be called');
        },
      };

      await knexInstance.client
        ._stream(
          connection,
          { sql: 'select 1', bindings: [] },
          { on: _.noop, emit: _.noop }
        )
        .then(
          () => {
            throw new Error('expected stream to reject in browser mode');
          },
          (err) => {
            expect(err).to.be.instanceOf(TypeError);
            expect(err.message).to.not.include('Please install it');
          }
        );

      expect(loadStub.calledWith('pg-query-stream')).to.equal(false);
    } finally {
      process.browser = originalBrowser;
      loadStub.restore();
      await knexInstance.destroy();
    }
  });

  it('rethrows non-MODULE_NOT_FOUND errors when loading pg-query-stream', async () => {
    const knexInstance = knex({
      client: 'postgresql',
      version: '10.5',
      connection: {
        pool: {},
      },
    });

    const Module = require('module');
    const originalLoad = Module._load;
    const loadStub = sinon
      .stub(Module, '_load')
      .callsFake((request, parent, isMain) => {
        if (request === 'pg-query-stream') {
          const err = new Error('access denied');
          err.code = 'EACCES';
          throw err;
        }
        return originalLoad(request, parent, isMain);
      });

    try {
      const connection = {
        query() {
          throw new Error('connection.query should not be called');
        },
      };
      let thrown;

      try {
        knexInstance.client._stream(
          connection,
          { sql: 'select 1', bindings: [] },
          { on: _.noop, emit: _.noop }
        );
      } catch (err) {
        thrown = err;
      }

      expect(thrown).to.be.instanceOf(Error);
      expect(thrown.message).to.equal('access denied');
      expect(thrown.code).to.equal('EACCES');
    } finally {
      loadStub.restore();
      await knexInstance.destroy();
    }
  });
});
