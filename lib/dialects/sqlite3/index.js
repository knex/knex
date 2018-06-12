'use strict';

exports.__esModule = true;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _lodash = require('lodash');

var _client = require('../../client');

var _client2 = _interopRequireDefault(_client);

var _compiler = require('./query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _compiler3 = require('./schema/compiler');

var _compiler4 = _interopRequireDefault(_compiler3);

var _columncompiler = require('./schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _tablecompiler = require('./schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _ddl = require('./schema/ddl');

var _ddl2 = _interopRequireDefault(_ddl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Client_SQLite3(config) {
  _client2.default.call(this, config);
  if ((0, _lodash.isUndefined)(config.useNullAsDefault)) {
    this.logger.warn('sqlite does not support inserting default values. Set the ' + '`useNullAsDefault` flag to hide this warning. ' + '(see docs http://knexjs.org/#Builder-insert).');
  }
}
// SQLite3
// -------

(0, _inherits2.default)(Client_SQLite3, _client2.default);

(0, _lodash.assign)(Client_SQLite3.prototype, {

  dialect: 'sqlite3',

  driverName: 'sqlite3',

  _driver: function _driver() {
    return require('sqlite3');
  },
  schemaCompiler: function schemaCompiler() {
    return new (Function.prototype.bind.apply(_compiler4.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  queryCompiler: function queryCompiler() {
    return new (Function.prototype.bind.apply(_compiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  columnCompiler: function columnCompiler() {
    return new (Function.prototype.bind.apply(_columncompiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  tableCompiler: function tableCompiler() {
    return new (Function.prototype.bind.apply(_tablecompiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  ddl: function ddl(compiler, pragma, connection) {
    return new _ddl2.default(this, compiler, pragma, connection);
  },
  wrapIdentifierImpl: function wrapIdentifierImpl(value) {
    return value !== '*' ? '`' + value.replace(/`/g, '``') + '`' : '*';
  },


  // Get a raw connection from the database, returning a promise with the connection object.
  acquireRawConnection: function acquireRawConnection() {
    var _this = this;

    return new _bluebird2.default(function (resolve, reject) {
      var db = new _this.driver.Database(_this.connectionSettings.filename, function (err) {
        if (err) {
          return reject(err);
        }
        resolve(db);
      });
    });
  },


  // Used to explicitly close a connection, called internally by the pool when
  // a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection) {
    return _bluebird2.default.fromCallback(connection.close.bind(connection));
  },


  // Runs the query on the specified connection, providing the bindings and any
  // other necessary prep work.
  _query: function _query(connection, obj) {
    var method = obj.method;

    var callMethod = void 0;
    switch (method) {
      case 'insert':
      case 'update':
      case 'counter':
      case 'del':
        callMethod = 'run';
        break;
      default:
        callMethod = 'all';
    }
    return new _bluebird2.default(function (resolver, rejecter) {
      if (!connection || !connection[callMethod]) {
        return rejecter(new Error('Error calling ' + callMethod + ' on connection.'));
      }
      connection[callMethod](obj.sql, obj.bindings, function (err, response) {
        if (err) return rejecter(err);
        obj.response = response;

        // We need the context here, as it contains
        // the "this.lastID" or "this.changes"
        obj.context = this;
        return resolver(obj);
      });
    });
  },
  _stream: function _stream(connection, sql, stream) {
    var client = this;
    return new _bluebird2.default(function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      return client._query(connection, sql).then(function (obj) {
        return obj.response;
      }).map(function (row) {
        stream.write(row);
      }).catch(function (err) {
        stream.emit('error', err);
      }).then(function () {
        stream.end();
      });
    });
  },


  // Ensures the response is returned in the same format as other clients.
  processResponse: function processResponse(obj, runner) {
    var ctx = obj.context;
    var response = obj.response;

    if (obj.output) return obj.output.call(runner, response);
    switch (obj.method) {
      case 'select':
      case 'pluck':
      case 'first':
        if (obj.method === 'pluck') response = (0, _lodash.map)(response, obj.pluck);
        return obj.method === 'first' ? response[0] : response;
      case 'insert':
        return [ctx.lastID];
      case 'del':
      case 'update':
      case 'counter':
        return ctx.changes;
      default:
        return response;
    }
  },
  poolDefaults: function poolDefaults() {
    return (0, _lodash.defaults)({ min: 1, max: 1 }, _client2.default.prototype.poolDefaults.call(this));
  }
});

exports.default = Client_SQLite3;
module.exports = exports['default'];