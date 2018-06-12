'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Promise = require('bluebird');
var Transaction = require('../../transaction');
var debugTx = require('debug')('knex:tx');

var Oracle_Transaction = function (_Transaction) {
  (0, _inherits3.default)(Oracle_Transaction, _Transaction);

  function Oracle_Transaction() {
    (0, _classCallCheck3.default)(this, Oracle_Transaction);
    return (0, _possibleConstructorReturn3.default)(this, _Transaction.apply(this, arguments));
  }

  // disable autocommit to allow correct behavior (default is true)
  Oracle_Transaction.prototype.begin = function begin() {
    return Promise.resolve();
  };

  Oracle_Transaction.prototype.commit = function commit(conn, value) {
    this._completed = true;
    return conn.commitAsync().return(value).then(this._resolver, this._rejecter);
  };

  Oracle_Transaction.prototype.release = function release(conn, value) {
    return this._resolver(value);
  };

  Oracle_Transaction.prototype.rollback = function rollback(conn, err) {
    var self = this;
    this._completed = true;
    debugTx('%s: rolling back', this.txid);
    return conn.rollbackAsync().timeout(5000).catch(Promise.TimeoutError, function (e) {
      self._rejecter(e);
    }).then(function () {
      if ((0, _lodash.isUndefined)(err)) {
        err = new Error('Transaction rejected with non-error: ' + err);
      }
      self._rejecter(err);
    });
  };

  Oracle_Transaction.prototype.savepoint = function savepoint(conn) {
    return this.query(conn, 'SAVEPOINT ' + this.txid);
  };

  Oracle_Transaction.prototype.acquireConnection = function acquireConnection(config) {
    var t = this;
    return Promise.try(function () {
      return t.client.acquireConnection().then(function (cnx) {
        cnx.__knexTxId = t.txid;
        cnx.isTransaction = true;
        return cnx;
      });
    }).disposer(function (connection) {
      debugTx('%s: releasing connection', t.txid);
      connection.isTransaction = false;
      connection.commitAsync().then(function (err) {
        if (err) {
          this._rejecter(err);
        }
        if (!config.connection) {
          t.client.releaseConnection(connection);
        } else {
          debugTx('%s: not releasing external connection', t.txid);
        }
      });
    });
  };

  return Oracle_Transaction;
}(Transaction);

exports.default = Oracle_Transaction;
module.exports = exports['default'];