// MSSQL Client
// -------
const flatten = require('lodash/flatten');
const map = require('lodash/map');
const values = require('lodash/values');
const mssql = require('mssql');

const Client = require('../../client');

const Transaction = require('./transaction');
const QueryCompiler = require('./query/mssql-querycompiler');
const SchemaCompiler = require('./schema/mssql-compiler');
const TableCompiler = require('./schema/mssql-tablecompiler');
const ColumnCompiler = require('./schema/mssql-columncompiler');
const MSSQL_Formatter = require('./mssql-formatter');

const SQL_INT4 = { MIN: -2147483648, MAX: 2147483647 };
const SQL_BIGINT_SAFE = { MIN: -9007199254740991, MAX: 9007199254740991 };

// Always initialize with the "QueryBuilder" and "QueryCompiler" objects, which
// extend the base 'lib/query/builder' and 'lib/query/compiler', respectively.
class Client_MSSQL extends Client {
  constructor(config = {}) {
    super(config);
    // #1235 mssql module wants 'server', not 'host'. This is to enforce the same
    // options object across all dialects.
    if (config && config.connection && config.connection.host) {
      config.connection.server = config.connection.host;
    }

    // mssql always creates pool :( lets try to unpool it as much as possible
    this.mssqlPoolSettings = config.pool;
  }

  _driver() {}

  usesInternalTarnPool() {
    return true;
  }

  setFromInternalTarnPool(connection) {
    this.pool = connection.pool;
  }

  formatter() {
    return new MSSQL_Formatter(this, ...arguments);
  }

  transaction() {
    return new Transaction(this, ...arguments);
  }

  queryCompiler(builder, formatter) {
    return new QueryCompiler(this, builder, formatter);
  }

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  }

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  }

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  }

  wrapIdentifierImpl(value) {
    if (value === '*') {
      return '*';
    }

    return `[${value.replace(/[[\]]+/g, '')}]`;
  }

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new Promise((resolver, rejecter) => {
      const settings = Object.assign({}, this.connectionSettings);
      settings.pool = this.mssqlPoolSettings;

      const connection = new mssql.ConnectionPool(settings);
      connection.connect((err) => {
        if (err) {
          return rejecter(err);
        }
        connection.on('error', (err) => {
          connection.__knex__disposed = err;
        });
        resolver(connection);
      });
    });
  }

  validateConnection(connection) {
    if (connection.connected === true) {
      return true;
    }

    return false;
  }

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection) {
    return connection.close().catch((err) => {
      // some times close will reject just because pool has already been destoyed
      // internally by the driver there is nothing we can do in this case
    });
  }

  // Position the bindings for the query.
  positionBindings(sql) {
    let questionCount = -1;
    return sql.replace(/\\?\?/g, (match) => {
      if (match === '\\?') {
        return '?';
      }

      questionCount += 1;
      return `@p${questionCount}`;
    });
  }

  // Grab a connection, run the query via the MSSQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream(connection, obj, stream) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new Promise((resolver, rejecter) => {
      stream.on('error', (err) => {
        rejecter(err);
      });
      stream.on('end', resolver);
      const { sql } = obj;
      if (!sql) return resolver();
      const req = (connection.tx_ || connection).request();
      //req.verbose = true;
      req.multiple = true;
      req.stream = true;
      if (obj.bindings) {
        for (let i = 0; i < obj.bindings.length; i++) {
          this._setReqInput(req, i, obj.bindings[i]);
        }
      }
      req.pipe(stream);
      req.query(sql);
    });
  }

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    const client = this;
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new Promise((resolver, rejecter) => {
      const { sql } = obj;
      if (!sql) return resolver();
      const req = (connection.tx_ || connection).request();
      // req.verbose = true;
      req.multiple = true;
      if (obj.bindings) {
        for (let i = 0; i < obj.bindings.length; i++) {
          client._setReqInput(req, i, obj.bindings[i]);
        }
      }
      req.query(sql, (err, recordset) => {
        if (err) {
          return rejecter(err);
        }
        obj.response = recordset.recordsets[0];
        resolver(obj);
      });
    });
  }

  // sets a request input parameter. Detects bigints and decimals and sets type appropriately.
  _setReqInput(req, i, binding) {
    if (typeof binding == 'number') {
      if (binding % 1 !== 0) {
        req.input(`p${i}`, this.driver.Float(53), binding);
      } else if (binding < SQL_INT4.MIN || binding > SQL_INT4.MAX) {
        if (binding < SQL_BIGINT_SAFE.MIN || binding > SQL_BIGINT_SAFE.MAX) {
          throw new Error(
            `Bigint must be safe integer or must be passed as string, saw ${binding}`
          );
        }
        req.input(`p${i}`, this.driver.BigInt, binding);
      } else {
        req.input(`p${i}`, this.driver.Int, binding);
      }
    } else {
      req.input(`p${i}`, binding);
    }
  }

  // Process the response as returned from the query.
  processResponse(obj, runner) {
    if (obj == null) return;
    const { response, method } = obj;
    if (obj.output) return obj.output.call(runner, response);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        if (method === 'pluck') return map(response, obj.pluck);
        return method === 'first' ? response[0] : response;
      case 'insert':
      case 'del':
      case 'update':
      case 'counter':
        if (obj.returning) {
          if (obj.returning === '@@rowcount') {
            return response[0][''];
          }

          if (
            (Array.isArray(obj.returning) && obj.returning.length > 1) ||
            obj.returning[0] === '*'
          ) {
            return response;
          }
          // return an array with values if only one returning value was specified
          return flatten(map(response, values));
        }
        return response;
      default:
        return response;
    }
  }
}

Object.assign(Client_MSSQL.prototype, {
  dialect: 'mssql',

  driverName: 'mssql',
});

module.exports = Client_MSSQL;
