'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _client = require('../../client');

var _client2 = _interopRequireDefault(_client);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _compiler = require('./query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _compiler3 = require('./schema/compiler');

var _compiler4 = _interopRequireDefault(_compiler3);

var _tablecompiler = require('./schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _columncompiler = require('./schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _lodash = require('lodash');

var _string = require('../../query/string');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.

// MySQL Client
// -------
function Client_MySQL(config) {
  _client2.default.call(this, config);
}
(0, _inherits2.default)(Client_MySQL, _client2.default);

(0, _lodash.assign)(Client_MySQL.prototype, {

  dialect: 'mysql',

  driverName: 'mysql',

  _driver() {
    return require('mysql');
  },

  queryCompiler() {
    return new _compiler2.default(this, ...arguments);
  },

  schemaCompiler() {
    return new _compiler4.default(this, ...arguments);
  },

  tableCompiler() {
    return new _tablecompiler2.default(this, ...arguments);
  },

  columnCompiler() {
    return new _columncompiler2.default(this, ...arguments);
  },

  transaction() {
    return new _transaction2.default(this, ...arguments);
  },

  _escapeBinding: (0, _string.makeEscape)(),

  wrapIdentifierImpl(value) {
    return value !== '*' ? `\`${value.replace(/`/g, '``')}\`` : '*';
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new _bluebird2.default((resolver, rejecter) => {
      const connection = this.driver.createConnection(this.connectionSettings);
      connection.on('error', err => {
        connection.__knex__disposed = err;
      });
      connection.connect(err => {
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
  destroyRawConnection(connection) {
    return _bluebird2.default.fromCallback(connection.end.bind(connection)).catch(err => {
      connection.__knex__disposed = err;
    }).finally(() => connection.removeAllListeners());
  },

  validateConnection(connection) {
    if (connection.state === 'connected' || connection.state === 'authenticated') {
      return true;
    }
    return false;
  },

  // Grab a connection, run the query via the MySQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream(connection, obj, stream, options) {
    options = options || {};
    const queryOptions = (0, _lodash.assign)({ sql: obj.sql }, obj.options);
    return new _bluebird2.default((resolver, rejecter) => {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      connection.query(queryOptions, obj.bindings).stream(options).pipe(stream);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new _bluebird2.default(function (resolver, rejecter) {
      if (!obj.sql) {
        resolver();
        return;
      }
      const queryOptions = (0, _lodash.assign)({ sql: obj.sql }, obj.options);
      connection.query(queryOptions, obj.bindings, function (err, rows, fields) {
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
      case 'first':
        {
          if (method === 'pluck') return (0, _lodash.map)(rows, obj.pluck);
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

  cancelQuery(connectionToKill) {
    const acquiringConn = this.acquireConnection();

    // Error out if we can't acquire connection in time.
    // Purposely not putting timeout on `KILL QUERY` execution because erroring
    // early there would release the `connectionToKill` back to the pool with
    // a `KILL QUERY` command yet to finish.
    return acquiringConn.timeout(100).then(conn => this.query(conn, {
      method: 'raw',
      sql: 'KILL QUERY ?',
      bindings: [connectionToKill.threadId],
      options: {}
    })).finally(() => {
      // NOT returning this promise because we want to release the connection
      // in a non-blocking fashion
      acquiringConn.then(conn => this.releaseConnection(conn));
    });
  }

});

exports.default = Client_MySQL;
module.exports = exports['default'];