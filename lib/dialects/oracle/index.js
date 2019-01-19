'use strict';

exports.__esModule = true;
exports.default = Client_Oracle;

var _lodash = require('lodash');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _client = require('../../client');

var _client2 = _interopRequireDefault(_client);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _string = require('../../query/string');

var _formatter = require('./formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _compiler = require('./query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _compiler3 = require('./schema/compiler');

var _compiler4 = _interopRequireDefault(_compiler3);

var _columnbuilder = require('./schema/columnbuilder');

var _columnbuilder2 = _interopRequireDefault(_columnbuilder);

var _columncompiler = require('./schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _tablecompiler = require('./schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _utils = require('./utils');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_Oracle(config) {
  _client2.default.call(this, config);
} // Oracle Client
// -------

(0, _inherits2.default)(Client_Oracle, _client2.default);

(0, _lodash.assign)(Client_Oracle.prototype, {
  dialect: 'oracle',

  driverName: 'oracle',

  _driver: function _driver() {
    return require('oracle');
  },
  transaction: function transaction() {
    return new (Function.prototype.bind.apply(
      _transaction2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  formatter: function formatter() {
    return new (Function.prototype.bind.apply(
      _formatter2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
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
  columnBuilder: function columnBuilder() {
    return new (Function.prototype.bind.apply(
      _columnbuilder2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  columnCompiler: function columnCompiler() {
    return new (Function.prototype.bind.apply(
      _columncompiler2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  tableCompiler: function tableCompiler() {
    return new (Function.prototype.bind.apply(
      _tablecompiler2.default,
      [null].concat([this], Array.prototype.slice.call(arguments))
    ))();
  },
  prepBindings: function prepBindings(bindings) {
    var _this = this;

    return (0, _lodash.map)(bindings, function(value) {
      // returning helper uses always ROWID as string
      if (value instanceof _utils.ReturningHelper && _this.driver) {
        return new _this.driver.OutParam(_this.driver.OCCISTRING);
      } else if (typeof value === 'boolean') {
        return value ? 1 : 0;
      } else if (Buffer.isBuffer(value)) {
        return (0, _string.bufferToString)(value);
      }
      return value;
    });
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var _this2 = this;

    return new _bluebird2.default(function(resolver, rejecter) {
      _this2.driver.connect(
        _this2.connectionSettings,
        function(err, connection) {
          if (err) return rejecter(err);
          _bluebird2.default.promisifyAll(connection);
          if (_this2.connectionSettings.prefetchRowCount) {
            connection.setPrefetchRowCount(
              _this2.connectionSettings.prefetchRowCount
            );
          }
          resolver(connection);
        }
      );
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection) {
    return _bluebird2.default.fromCallback(connection.close.bind(connection));
  },

  // Return the database for the Oracle client.
  database: function database() {
    return this.connectionSettings.database;
  },

  // Position the bindings for the query.
  positionBindings: function positionBindings(sql) {
    var questionCount = 0;
    return sql.replace(/\?/g, function() {
      questionCount += 1;
      return ':' + questionCount;
    });
  },
  _stream: function _stream(connection, obj, stream, options) {
    return new _bluebird2.default(function(resolver, rejecter) {
      stream.on('error', function(err) {
        if (isConnectionError(err)) {
          connection.__knex__disposed = err;
        }
        rejecter(err);
      });
      stream.on('end', resolver);
      var queryStream = connection.queryStream(obj.sql, obj.bindings, options);
      queryStream.pipe(stream);
      queryStream.on('error', function(error) {
        rejecter(error);
        stream.emit('error', error);
      });
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    if (!obj.sql) throw new Error('The query is empty');

    return connection
      .executeAsync(obj.sql, obj.bindings)
      .then(function(response) {
        if (!obj.returning) return response;
        var rowIds = obj.outParams.map(function(v, i) {
          return response['returnParam' + (i ? i : '')];
        });
        return connection.executeAsync(obj.returningSql, rowIds);
      })
      .then(function(response) {
        obj.response = response;
        obj.rowsAffected = response.updateCount;
        return obj;
      })
      .catch(function(err) {
        if (isConnectionError(err)) {
          connection.__knex__disposed = err;
        }
        throw err;
      });
  },

  // Process the response as returned from the query.
  processResponse: function processResponse(obj, runner) {
    var response = obj.response;
    var method = obj.method;

    if (obj.output) return obj.output.call(runner, response);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        if (obj.method === 'pluck')
          response = (0, _lodash.map)(response, obj.pluck);
        return obj.method === 'first' ? response[0] : response;
      case 'insert':
      case 'del':
      case 'update':
      case 'counter':
        if (obj.returning) {
          if (obj.returning.length > 1 || obj.returning[0] === '*') {
            return response;
          }
          // return an array with values if only one returning value was specified
          return (0, _lodash.flatten)(
            (0, _lodash.map)(response, _lodash.values)
          );
        }
        return obj.rowsAffected;
      default:
        return response;
    }
  },
});

// If the error is any of these, we'll assume we need to
// mark the connection as failed
var connectionErrors = [
  'ORA-12514',
  'NJS-040',
  'NJS-024',
  'NJS-003',
  'NJS-024',
];

function isConnectionError(err) {
  return connectionErrors.some(function(prefix) {
    return err.message.indexOf(prefix) === 0;
  });
}
module.exports = exports['default'];
