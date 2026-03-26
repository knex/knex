const knex = require('../../../knex');
const pgDialect = require('../../../lib/dialects/postgres/index.js');
const _ = require('lodash');
const { isFunction } = require('../../../lib/util/is');

describe('Postgres Unit Tests', function () {
  let checkVersionStub, querySpy;
  beforeAll(() => {
    const fakeConnection = {
      query: (...args) => {
        const cb = args.find((arg) => {
          return isFunction(arg);
        });
        cb();
      },
      on: _.noop,
    };
    querySpy = vi.fn().mockImplementation(fakeConnection.query);
    fakeConnection.query = querySpy;

    checkVersionStub = vi
      .spyOn(pgDialect.prototype, 'checkVersion')
      .mockImplementation(function () {
        return Promise.resolve('9.6');
      });
    vi.spyOn(pgDialect.prototype, '_acquireOnlyConnection').mockReturnValue(
      Promise.resolve(fakeConnection)
    );
  });
  afterEach(() => {
    querySpy.mockClear();
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('does not resolve client version if specified explicitly', () => {
    const knexInstance = knex({
      client: 'postgres',
      version: '10.5',
      connection: {
        pool: {
          min: 0,
        },
      },
    });
    return knexInstance.raw('select 1 as 1').then((result) => {
      expect(checkVersionStub).not.toHaveBeenCalled();
      return knexInstance.destroy();
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
    expect(sql.sql).toBe(
      'select * from "projects" where "id = 1 UNION SELECT 1, version();" = ?'
    );

    const sql2 = knexInstance('projects')
      .where('id = 1" UNION SELECT 1, version();', 1)
      .toSQL();
    expect(sql2.sql).toBe(
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
      expect(checkVersionStub).toHaveBeenCalledOnce();
      knexInstance.destroy();
    });
  });

  it('Validates searchPath as Array/String', function () {
    const knexInstance = knex({
      client: 'pg',
    });

    expect(function () {
      knexInstance.client.setSchemaSearchPath(null, {});
    }).toThrow(TypeError);

    expect(function () {
      knexInstance.client.setSchemaSearchPath(null, 4);
    }).toThrow(TypeError);

    const fakeQueryFn = function (expectedSearchPath) {
      return {
        query: function (sql, callback) {
          try {
            expect(sql).toBe('set search_path to ' + expectedSearchPath);
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
      expect(querySpy).toHaveBeenCalledOnce();
      expect(querySpy).toHaveBeenCalledWith(
        {
          text: 'select 1 as $1',
          values: ['foo'],
        },
        expect.any(Function)
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
    const loadStub = vi
      .spyOn(Module, '_load')
      .mockImplementation((request, parent, isMain) => {
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
      ).toThrow(
        "knex PostgreSQL query streaming requires the 'pg-query-stream' package. Please install it (e.g. `npm i pg-query-stream`)."
      );
    } finally {
      loadStub.mockRestore();
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
    const loadStub = vi
      .spyOn(Module, '_load')
      .mockImplementation((request, parent, isMain) => {
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
            expect(err).toBeInstanceOf(TypeError);
            expect(err.message).not.toContain('Please install it');
          }
        );

      expect(loadStub).not.toHaveBeenCalledWith('pg-query-stream');
    } finally {
      process.browser = originalBrowser;
      loadStub.mockRestore();
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
    const loadStub = vi
      .spyOn(Module, '_load')
      .mockImplementation((request, parent, isMain) => {
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

      expect(thrown).toBeInstanceOf(Error);
      expect(thrown.message).toBe('access denied');
      expect(thrown.code).toBe('EACCES');
    } finally {
      loadStub.mockRestore();
      await knexInstance.destroy();
    }
  });
});
