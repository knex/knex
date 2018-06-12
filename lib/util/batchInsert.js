'use strict';

exports.__esModule = true;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

exports.default = batchInsert;

var _lodash = require('lodash');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function batchInsert(client, tableName, batch) {
  var chunkSize = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1000;


  var _returning = void 0;
  var autoTransaction = true;
  var transaction = null;

  var getTransaction = function getTransaction() {
    return new _bluebird2.default(function (resolve, reject) {
      if (transaction) {
        autoTransaction = false;
        return resolve(transaction);
      }

      autoTransaction = true;
      client.transaction(resolve).catch(reject);
    });
  };

  var wrapper = (0, _lodash.assign)(new _bluebird2.default(function (resolve, reject) {
    var chunks = (0, _lodash.chunk)(batch, chunkSize);

    if (!(0, _lodash.isNumber)(chunkSize) || chunkSize < 1) {
      return reject(new TypeError('Invalid chunkSize: ' + chunkSize));
    }

    if (!(0, _lodash.isArray)(batch)) {
      return reject(new TypeError('Invalid batch: Expected array, got ' + (typeof batch === 'undefined' ? 'undefined' : (0, _typeof3.default)(batch))));
    }

    //Next tick to ensure wrapper functions are called if needed
    return _bluebird2.default.delay(1).then(getTransaction).then(function (tr) {
      return _bluebird2.default.mapSeries(chunks, function (items) {
        return tr(tableName).insert(items, _returning);
      }).then(function (result) {
        result = (0, _lodash.flatten)(result || []);

        if (autoTransaction) {
          //TODO: -- Oracle tr.commit() does not return a 'thenable' !? Ugly hack for now.
          return (tr.commit(result) || _bluebird2.default.resolve()).then(function () {
            return result;
          });
        }

        return result;
      }).catch(function (error) {
        if (autoTransaction) {
          return tr.rollback(error).then(function () {
            return _bluebird2.default.reject(error);
          });
        }

        return _bluebird2.default.reject(error);
      });
    }).then(resolve).catch(reject);
  }), {
    returning: function returning(columns) {
      _returning = columns;

      return this;
    },
    transacting: function transacting(tr) {
      transaction = tr;

      return this;
    }
  });

  return wrapper;
}
module.exports = exports['default'];