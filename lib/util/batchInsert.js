'use strict';

exports.__esModule = true;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _flatten2 = require('lodash/flatten');

var _flatten3 = _interopRequireDefault(_flatten2);

var _chunk2 = require('lodash/chunk');

var _chunk3 = _interopRequireDefault(_chunk2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _isNumber2 = require('lodash/isNumber');

var _isNumber3 = _interopRequireDefault(_isNumber2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BatchInsert = function () {
  function BatchInsert(client, tableName, batch) {
    var chunkSize = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1000;
    (0, _classCallCheck3.default)(this, BatchInsert);

    if (!(0, _isNumber3.default)(chunkSize) || chunkSize < 1) {
      throw new TypeError('Invalid chunkSize: ' + chunkSize);
    }

    if (!(0, _isArray3.default)(batch)) {
      throw new TypeError('Invalid batch: Expected array, got ' + (typeof batch === 'undefined' ? 'undefined' : (0, _typeof3.default)(batch)));
    }

    this.client = client;
    this.tableName = tableName;
    this.batch = (0, _chunk3.default)(batch, chunkSize);
    this._returning = void 0;
    this._transaction = null;
    this._autoTransaction = true;

    if (client.transacting) {
      this.transacting(client);
    }
  }

  /**
   * Columns to return from the batch operation.
   * @param returning
   */


  BatchInsert.prototype.returning = function returning(_returning) {
    if ((0, _isArray3.default)(_returning) || (0, _isString3.default)(_returning)) {
      this._returning = _returning;
    }
    return this;
  };

  /**
   * User may supply their own transaction. If this is the case,
   * `autoTransaction = false`, meaning we don't automatically commit/rollback
   * the transaction. The responsibility instead falls on the user.
   *
   * @param transaction
   */


  BatchInsert.prototype.transacting = function transacting(transaction) {
    this._transaction = transaction;
    this._autoTransaction = false;
    return this;
  };

  BatchInsert.prototype._getTransaction = function _getTransaction() {
    var _this = this;

    return new _bluebird2.default(function (resolve) {
      if (_this._transaction) {
        return resolve(_this._transaction);
      }
      _this.client.transaction(function (tr) {
        return resolve(tr);
      });
    });
  };

  BatchInsert.prototype.then = function then() {
    var _this2 = this;

    var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};

    return this._getTransaction().then(function (transaction) {
      return _bluebird2.default.all(_this2.batch.map(function (items) {
        return transaction(_this2.tableName).insert(items, _this2._returning);
      })).then(function (result) {
        if (_this2._autoTransaction) {
          transaction.commit();
        }
        return callback((0, _flatten3.default)(result || []));
      }).catch(function (error) {
        if (_this2._autoTransaction) {
          transaction.rollback(error);
        }
        throw error;
      });
    });
  };

  return BatchInsert;
}();

exports.default = BatchInsert;
module.exports = exports['default'];