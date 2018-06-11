'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _sqlite = require('../sqlite3');

var _sqlite2 = _interopRequireDefault(_sqlite);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Client_WebSQL(config) {
  _sqlite2.default.call(this, config);
  this.name = config.name || 'knex_database';
  this.version = config.version || '1.0';
  this.displayName = config.displayName || this.name;
  this.estimatedSize = config.estimatedSize || 5 * 1024 * 1024;
} /* globals openDatabase:false */

// WebSQL
// -------

(0, _inherits2.default)(Client_WebSQL, _sqlite2.default);

(0, _lodash.assign)(Client_WebSQL.prototype, {

  transaction() {
    return new _transaction2.default(this, ...arguments);
  },

  dialect: 'websql',

  // Get a raw connection from the database, returning a promise with the connection object.
  acquireConnection() {
    return new _bluebird2.default((resolve, reject) => {
      try {
        /*jslint browser: true*/
        const db = openDatabase(this.name, this.version, this.displayName, this.estimatedSize);
        db.transaction(function (t) {
          t.__knexUid = (0, _lodash.uniqueId)('__knexUid');
          resolve(t);
        });
      } catch (e) {
        reject(e);
      }
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  releaseConnection() {
    return _bluebird2.default.resolve();
  },

  // Runs the query on the specified connection,
  // providing the bindings and any other necessary prep work.
  _query(connection, obj) {
    return new _bluebird2.default((resolver, rejecter) => {
      if (!connection) return rejecter(new Error('No connection provided.'));
      connection.executeSql(obj.sql, obj.bindings, (trx, response) => {
        obj.response = response;
        return resolver(obj);
      }, (trx, err) => {
        rejecter(err);
      });
    });
  },

  _stream(connection, sql, stream) {
    const client = this;
    return new _bluebird2.default(function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      return client._query(connection, sql).then(obj => client.processResponse(obj)).map(row => {
        stream.write(row);
      }).catch(err => {
        stream.emit('error', err);
      }).then(() => {
        stream.end();
      });
    });
  },

  processResponse(obj, runner) {
    const resp = obj.response;
    if (obj.output) return obj.output.call(runner, resp);
    switch (obj.method) {
      case 'pluck':
      case 'first':
      case 'select':
        {
          let results = [];
          for (let i = 0, l = resp.rows.length; i < l; i++) {
            results[i] = (0, _lodash.clone)(resp.rows.item(i));
          }
          if (obj.method === 'pluck') results = (0, _lodash.map)(results, obj.pluck);
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