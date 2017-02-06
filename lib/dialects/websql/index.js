'use strict';

exports.__esModule = true;

var _clone2 = require('lodash/clone');

var _clone3 = _interopRequireDefault(_clone2);

var _uniqueId2 = require('lodash/uniqueId');

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _sqlite = require('../sqlite3');

var _sqlite2 = _interopRequireDefault(_sqlite);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* globals openDatabase:false */

// WebSQL
// -------
function Client_WebSQL(config) {
  _sqlite2.default.call(this, config);
  this.name = config.name || 'knex_database';
  this.version = config.version || '1.0';
  this.displayName = config.displayName || this.name;
  this.estimatedSize = config.estimatedSize || 5 * 1024 * 1024;
}
(0, _inherits2.default)(Client_WebSQL, _sqlite2.default);

(0, _assign3.default)(Client_WebSQL.prototype, {
  transaction: function transaction() {
    return new (Function.prototype.bind.apply(_transaction2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },


  dialect: 'websql',

  // Get a raw connection from the database, returning a promise with the connection object.
  acquireConnection: function acquireConnection() {
    var _this = this;

    return new _bluebird2.default(function (resolve, reject) {
      try {
        /*jslint browser: true*/
        var db = openDatabase(_this.name, _this.version, _this.displayName, _this.estimatedSize);
        db.transaction(function (t) {
          t.__knexUid = (0, _uniqueId3.default)('__knexUid');
          resolve(t);
        });
      } catch (e) {
        reject(e);
      }
    });
  },


  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  releaseConnection: function releaseConnection() {
    return _bluebird2.default.resolve();
  },


  // Runs the query on the specified connection,
  // providing the bindings and any other necessary prep work.
  _query: function _query(connection, obj) {
    return new _bluebird2.default(function (resolver, rejecter) {
      if (!connection) return rejecter(new Error('No connection provided.'));
      connection.executeSql(obj.sql, obj.bindings, function (trx, response) {
        obj.response = response;
        return resolver(obj);
      }, function (trx, err) {
        rejecter(err);
      });
    });
  },
  _stream: function _stream(connection, sql, stream) {
    var client = this;
    return new _bluebird2.default(function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      return client._query(connection, sql).then(function (obj) {
        return client.processResponse(obj);
      }).map(function (row) {
        stream.write(row);
      }).catch(function (err) {
        stream.emit('error', err);
      }).then(function () {
        stream.end();
      });
    });
  },
  processResponse: function processResponse(obj, runner) {
    var resp = obj.response;
    if (obj.output) return obj.output.call(runner, resp);
    switch (obj.method) {
      case 'pluck':
      case 'first':
      case 'select':
        {
          var results = [];
          for (var i = 0, l = resp.rows.length; i < l; i++) {
            results[i] = (0, _clone3.default)(resp.rows.item(i));
          }
          if (obj.method === 'pluck') results = (0, _map3.default)(results, obj.pluck);
          return obj.method === 'first' ? results[0] : results;
        }
      case 'insert':
        return [resp.insertId];
      case 'delete':
      case 'update':
      case 'counter':
        return resp.rowsAffected;
      default:
        return resp;
    }
  }
});

exports.default = Client_WebSQL;
module.exports = exports['default'];