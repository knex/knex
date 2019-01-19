// Firebird Client
// -------
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

var _formatter = require('./formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _lodash = require('lodash');

var _string = require('../../query/string');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function ab2str(arrayBuffer) {
  return String.fromCharCode.apply(null, new global.Uint16Array(arrayBuffer));
}

function str2ab(str) {
  var buf = new global.ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new global.Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }

  return buf;
}

function parseResults(results) {
  if (Array.isArray(results)) {
    results = (0, _lodash.map)(results, function(item) {
      return parseResults(item);
    });
  } else if (
    (0, _lodash.isObject)(results) &&
    (0, _lodash.isFunction)(results.toJSON) &&
    (0, _lodash.upperCase)(results.toJSON().type) === 'BUFFER'
  ) {
    results = ab2str(results);
  } else if ((0, _lodash.isObject)(results)) {
    (0, _lodash.each)(results, function(value, key) {
      results[key] = parseResults(value);
    });
  }

  return results;
}

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_Firebird(config) {
  _client2.default.call(this, config);
}
(0, _inherits2.default)(Client_Firebird, _client2.default);

(0, _lodash.assign)(Client_Firebird.prototype, {
  dialect: 'firebird',

  driverName: 'node-firebird',

  _driver: function _driver() {
    return require('node-firebird');
  },
  queryCompiler: function queryCompiler() {
    return new (Function.prototype.bind.apply(
      _compiler2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  schemaCompiler: function schemaCompiler() {
    return new (Function.prototype.bind.apply(
      _compiler4.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  tableCompiler: function tableCompiler() {
    return new (Function.prototype.bind.apply(
      _tablecompiler2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  columnCompiler: function columnCompiler() {
    return new (Function.prototype.bind.apply(
      _columncompiler2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  transaction: function transaction() {
    return new (Function.prototype.bind.apply(
      _transaction2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },

  _escapeBinding: (0, _string.makeEscape)(),

  formatter: function formatter() {
    return new (Function.prototype.bind.apply(
      _formatter2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  wrapIdentifierImpl: function wrapIdentifierImpl(value) {
    if (value === '*') return value;
    var matched = value.match(/(.*?)(\[[0-9]\])/);
    if (matched) return this.wrapIdentifierImpl(matched[1]) + matched[2];
    return ('' + value + '').toUpperCase();
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    var driver = client.driver;
    var connectionSettings = client.connectionSettings;

    return new _bluebird2.default(function(resolver, rejecter) {
      driver.attach(connectionSettings, function(err, db) {
        if (err) return rejecter(err);
        db.on('error', connectionErrorHandler.bind(null, client, db));
        db.on('end', connectionErrorHandler.bind(null, client, db));
        resolver(db);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    if (typeof cb.detach === 'function') {
      cb.detach();
    }
  },
  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new _bluebird2.default(function(resolver, rejecter) {
      var sql = obj.sql;
      if (!sql) return resolver();

      connection.query(sql, obj.bindings, function(err, rows, fields) {
        if (err) return rejecter(err);
        obj.response = [rows, fields, obj.bindings];
        resolver(obj);
      });
    });
  },

  // Process the response as returned from the query.
  processResponse: function processResponse(obj, runner) {
    if (obj == null) return;
    var response = obj.response,
      method = obj.method;

    var rows = response[0];
    var fields = response[1];
    var bindings = response[2];
    if (obj.output) return obj.output.call(runner, rows, fields);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        if (method === 'pluck') {
          return parseResults((0, _lodash.map)(rows, obj.pluck));
        }

        return parseResults(method === 'first' ? rows[0] : rows);
      case 'insert':
      case 'del':
      case 'update':
        if (rows && obj.returning) {
          return [rows[obj.returning]];
        }

        if (rows && rows.affectedRows) {
          rows.affectedRows;
        } else if (!rows) {
          // Firebird affectedRows not implemented
          rows = {
            affectedRows: [0],
          };
        }
        return rows.affectedRows;
      case 'counter':
        if (rows && rows.affectedRows) {
          rows.affectedRows;
        } else {
          rows.affectedRows = [0];
        }
        return rows.affectedRows;
      default:
        response[0] = parseResults(response[0]);
        return response;
    }
  },

  ping: function ping(resource, callback) {
    resource.query('select 1 from rdb$database', callback);
  },
});

// Firebird Specific error handler
function connectionErrorHandler(client, connection, err) {
  if (connection && err && err.fatal) {
    if (connection.__knex__disposed) return;
    connection.__knex__disposed = true;
    client.pool.destroy(connection);
  }
}

exports.default = Client_Firebird;
module.exports = exports['default'];
