"use strict";

exports.__esModule = true;

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _transaction = require("../../transaction");

var _transaction2 = _interopRequireDefault(_transaction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require("debug")("knex:tx");

var Transaction_MSSQL = function (_Transaction) {
  (0, _inherits3.default)(Transaction_MSSQL, _Transaction);

  function Transaction_MSSQL() {
    (0, _classCallCheck3.default)(this, Transaction_MSSQL);
    return (0, _possibleConstructorReturn3.default)(this, _Transaction.apply(this, arguments));
  }

  Transaction_MSSQL.prototype.begin = function begin(conn) {
    var _this2 = this;

    debug("transaction::begin id=%s", this.txid);

    return new _bluebird2.default(function (resolve, reject) {
      conn.beginTransaction(function (err) {
        if (err) {
          debug("transaction::begin error id=%s message=%s", _this2.txid, err.message);
          return reject(err);
        }
        resolve();
      }, _this2.txid);
    }).then(this._resolver, this._rejecter);
  };

  Transaction_MSSQL.prototype.savepoint = function savepoint(conn) {
    var _this3 = this;

    debug("transaction::savepoint id=%s", this.txid);

    return new _bluebird2.default(function (resolve, reject) {
      conn.saveTransaction(function (err) {
        if (err) {
          debug("transaction::savepoint id=%s message=%s", _this3.txid, err.message);
          return reject(err);
        }

        resolve();
      }, _this3.txid);
    });
  };

  Transaction_MSSQL.prototype.commit = function commit(conn, value) {
    var _this4 = this;

    debug("transaction::commit id=%s", this.txid);

    return new _bluebird2.default(function (resolve, reject) {
      conn.commitTransaction(function (err) {
        if (err) {
          debug("transaction::commit error id=%s message=%s", _this4.txid, err.message);
          return reject(err);
        }

        _this4._completed = true;
        resolve(value);
      }, _this4.txid);
    }).then(function () {
      return _this4._resolver(value);
    }, this._rejecter);
  };

  Transaction_MSSQL.prototype.release = function release(conn, value) {
    return this._resolver(value);
  };

  Transaction_MSSQL.prototype.rollback = function rollback(conn, error) {
    var _this5 = this;

    this._completed = true;
    debug("transaction::rollback id=%s", this.txid);

    return new _bluebird2.default(function (resolve, reject) {
      conn.rollbackTransaction(function (err) {
        if (err) {
          debug("transaction::rollback error id=%s message=%s", _this5.txid, err.message);
        }

        reject(err || error || new Error('Transaction rejected with non-error: undefined'));
      }, _this5.txid);
    }).then(function () {
      return _this5._rejecter(error);
    }, function (err) {
      err.originalError = error;
      _this5._rejecter(err);
    });
  };

  // Acquire a connection and create a disposer - either using the one passed
  // via config or getting one off the client. The disposer will be called once
  // the original promise is marked completed.
  // acquireConnection(client, config, txid) {
  //   const configConnection = config && config.connection;
  //   return Promise.try(() => configConnection || client.acquireRawConnection())
  //     .then(function(connection) {
  //       connection.__knexTxId = txid;

  //       return connection;
  //     })
  //     .disposer(function(connection) {
  //       if (!configConnection) {
  //         debug("%s: releasing connection", txid);
  //         client.releaseConnection(connection);
  //       } else {
  //         debug("%s: not releasing external connection", txid);
  //       }
  //     });
  // }

  // rollbackTo(conn, error) {
  //   // debug('%s: rolling backTo', this.txid)
  //   // return Promise.resolve()
  //   //   .then(() => this.query(conn, `ROLLBACK TRANSACTION ${this.txid}`, 2, error))
  //   //   .then(() => this._rejecter(error))
  // }


  return Transaction_MSSQL;
}(_transaction2.default);

exports.default = Transaction_MSSQL;
module.exports = exports["default"];