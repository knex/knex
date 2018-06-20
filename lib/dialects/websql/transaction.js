'use strict';

exports.__esModule = true;

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _makeKnex = require('../../util/make-knex');

var _makeKnex2 = _interopRequireDefault(_makeKnex);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _events = require('events');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Transaction_WebSQL(client, container) {
  client.logger.warn('WebSQL transactions will run queries, but do not commit or rollback');
  var trx = this;
  this._promise = _bluebird2.default.try(function () {
    container((0, _makeKnex2.default)(makeClient(trx, client)));
  });
}
(0, _inherits2.default)(Transaction_WebSQL, _events.EventEmitter);

function makeClient(trx, client) {

  var trxClient = (0, _create2.default)(client.constructor.prototype);
  trxClient.config = client.config;
  trxClient.connectionSettings = client.connectionSettings;
  trxClient.transacting = true;

  trxClient.on('query', function (arg) {
    trx.emit('query', arg);
    client.emit('query', arg);
  });
  trxClient.commit = function () {};
  trxClient.rollback = function () {};

  return trxClient;
}

var promiseInterface = ['then', 'bind', 'catch', 'finally', 'asCallback', 'spread', 'map', 'reduce', 'tap', 'thenReturn', 'return', 'yield', 'ensure', 'exec', 'reflect', 'get', 'mapSeries', 'delay'];

// Creates a method which "coerces" to a promise, by calling a
// "then" method on the current `Target`
promiseInterface.forEach(function (method) {
  Transaction_WebSQL.prototype[method] = function () {
    return this._promise = this._promise[method].apply(this._promise, arguments);
  };
});

exports.default = Transaction_WebSQL;
module.exports = exports['default'];