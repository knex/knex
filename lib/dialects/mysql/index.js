// MySQL Client
// -------
const defer = require('lodash/defer');
const map = require('lodash/map');
const { promisify, inherits } = require('util');
const Client = require('../../client');

const Transaction = require('./transaction');
const QueryCompiler = require('./query/compiler');
const SchemaCompiler = require('./schema/compiler');
const TableCompiler = require('./schema/tablecompiler');
const ColumnCompiler = require('./schema/columncompiler');

const { makeEscape } = require('../../query/string');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL(config) {
  Client.call(this, config);
}

inherits(Client_MySQL, Client);

Object.assign(Client_MySQL.prototype, {
  dialect: 'mysql',

  driverName: 'mysql',

  _driver() {
    return require('mysql');
  },

  queryCompiler() {
    return new QueryCompiler(this, ...arguments);
  },

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  },

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  },

  transaction() {
    return new Transaction(this, ...arguments);
  },

  _escapeBinding: makeEscape(),

  wrapIdentifierImpl(value) {
    return value !== '*' ? `\`${value.replace(/`/g, '``')}\`` : '*';
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new Promise((resolver, rejecter) => {
      const connection = this.driver.createConnection(this.connectionSettings);
      connection.on('error', (err) => {
        connection.__knex__disposed = err;
      });
      connection.connect((err) => {
        if (err) {
          // if connection is rejected, remove listener that was registered above...
          connection.removeAllListeners();
          return rejecter(err);
        }
        resolver(connection);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  async destroyRawConnection(connection) {
    try {
      const end = promisify((cb) => connection.end(cb));
      return await end();
    } catch (err) {
      connection.__knex__disposed = err;
    } finally {
      // see discussion https://github.com/knex/knex/pull/3483
      defer(() => connection.removeAllListeners());
    }
  },

  validateConnection(connection) {
    if (
      connection.state === 'connected' ||
      connection.state === 'authenticated'
    ) {
      return true;
    }
    return false;
  },

  // Grab a connection, run the query via the MySQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream(connection, obj, stream, options) {
    options = options || {};
    const queryOptions = Object.assign({ sql: obj.sql }, obj.options);
    return new Promise((resolver, rejecter) => {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      const queryStream = connection
        .query(queryOptions, obj.bindings)
        .stream(options);

      queryStream.on('error', (err) => {
        rejecter(err);
        stream.emit('error', err);
      });

      queryStream.pipe(stream);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new Promise(function (resolver, rejecter) {
      if (!obj.sql) {
        resolver();
        return;
      }
      const queryOptions = Object.assign({ sql: obj.sql }, obj.options);
      connection.query(queryOptions, obj.bindings, function (
        err,
        rows,
        fields
      ) {
        if (err) return rejecter(err);
        obj.response = [rows, fields];
        resolver(obj);
      });
    });
  },

  // Process the response as returned from the query.
  processResponse(obj, runner) {
    if (obj == null) return;
    const { response } = obj;
    const { method } = obj;
    const rows = response[0];
    const fields = response[1];
    if (obj.output) return obj.output.call(runner, rows, fields);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first': {
        if (method === 'pluck') {
          return map(rows, obj.pluck);
        }
        return method === 'first' ? rows[0] : rows;
      }
      case 'insert':
        return [rows.insertId];
      case 'del':
      case 'update':
      case 'counter':
        return rows.affectedRows;
      default:
        return response;
    }
  },

  canCancelQuery: true,

  async cancelQuery(connectionToKill) {
    const conn = await this.acquireConnection();
    try {
      return await this.query(conn, {
        method: 'raw',
        sql: 'KILL QUERY ?',
        bindings: [connectionToKill.threadId],
        options: {},
      });
    } finally {
      await this.releaseConnection(conn);
    }
  },
});

module.exports = Client_MySQL;
