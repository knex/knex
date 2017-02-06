'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _transaction = require('../../transaction');

var _transaction2 = _interopRequireDefault(_transaction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('knex:tx');

var Transaction_MSSQL = function (_Transaction) {
  (0, _inherits3.default)(Transaction_MSSQL, _Transaction);

  function Transaction_MSSQL() {
    (0, _classCallCheck3.default)(this, Transaction_MSSQL);
    return (0, _possibleConstructorReturn3.default)(this, _Transaction.apply(this, arguments));
  }

  Transaction_MSSQL.prototype.begin = function begin(conn) {
    debug('%s: begin', this.txid);
    return conn.tx_.begin().then(this._resolver, this._rejecter);
  };

  Transaction_MSSQL.prototype.savepoint = function savepoint(conn) {
    var _this2 = this;

    debug('%s: savepoint at', this.txid);
    return _bluebird2.default.resolve().then(function () {
      return _this2.query(conn, 'SAVE TRANSACTION ' + _this2.txid);
    });
  };

  Transaction_MSSQL.prototype.commit = function commit(conn, value) {
    var _this3 = this;

    this._completed = true;
    debug('%s: commit', this.txid);
    return conn.tx_.commit().then(function () {
      return _this3._resolver(value);
    }, this._rejecter);
  };

  Transaction_MSSQL.prototype.release = function release(conn, value) {
    return this._resolver(value);
  };

  Transaction_MSSQL.prototype.rollback = function rollback(conn, error) {
    var _this4 = this;

    this._completed = true;
    debug('%s: rolling back', this.txid);
    return conn.tx_.rollback().then(function () {
      return _this4._rejecter(error);
    }, function (err) {
      if (error) err.originalError = error;
      return _this4._rejecter(err);
    });
  };

  Transaction_MSSQL.prototype.rollbackTo = function rollbackTo(conn, error) {
    var _this5 = this;

    debug('%s: rolling backTo', this.txid);
    return _bluebird2.default.resolve().then(function () {
      return _this5.query(conn, 'ROLLBACK TRANSACTION ' + _this5.txid, 2, error);
    }).then(function () {
      return _this5._rejecter(error);
    });
  };

  // Acquire a connection and create a disposer - either using the one passed
  // via config or getting one off the client. The disposer will be called once
  // the original promise is marked completed.


  Transaction_MSSQL.prototype.acquireConnection = function acquireConnection(config) {
    var t = this;
    var configConnection = config && config.connection;
    return _bluebird2.default.try(function () {
      return (t.outerTx ? t.outerTx.conn : null) || configConnection || t.client.acquireConnection();
    }).tap(function (conn) {
      if (!t.outerTx) {
        t.conn = conn;
        conn.tx_ = conn.transaction();
      }
    }).disposer(function (conn) {
      if (t.outerTx) return;
      if (conn.tx_) {
        if (!t._completed) {
          debug('%s: unreleased transaction', t.txid);
          conn.tx_.rollback();
        }
        conn.tx_ = null;
      }
      t.conn = null;
      if (!configConnection) {
        debug('%s: releasing connection', t.txid);
        t.client.releaseConnection(conn);
      } else {
        debug('%s: not releasing external connection', t.txid);
      }
    });
  };

  return Transaction_MSSQL;
}(_transaction2.default);

exports.default = Transaction_MSSQL;
module.exports = exports['default'];