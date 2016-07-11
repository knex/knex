'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilMakeKnex = require('../../util/make-knex');

var _utilMakeKnex2 = _interopRequireDefault(_utilMakeKnex);

var _promise = require('../../promise');

var _promise2 = _interopRequireDefault(_promise);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _events = require('events');

function Transaction_WebSQL(client, container) {
  helpers.warn('WebSQL transactions will run queries, but do not commit or rollback');
  var trx = this;
  this._promise = _promise2['default']['try'](function () {
    container(_utilMakeKnex2['default'](makeClient(trx, client)));
  });
}
_inherits2['default'](Transaction_WebSQL, _events.EventEmitter);

function makeClient(trx, client) {

  var trxClient = Object.create(client.constructor.prototype);
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

var promiseInterface = ['then', 'bind', 'catch', 'finally', 'asCallback', 'spread', 'map', 'reduce', 'tap', 'thenReturn', 'return', 'yield', 'ensure', 'exec', 'reflect'];

// Creates a method which "coerces" to a promise, by calling a
// "then" method on the current `Target`
promiseInterface.forEach(function (method) {
  Transaction_WebSQL.prototype[method] = function () {
    return this._promise = this._promise[method].apply(this._promise, arguments);
  };
});

exports['default'] = Transaction_WebSQL;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy93ZWJzcWwvdHJhbnNhY3Rpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7NEJBQ3FCLHNCQUFzQjs7Ozt1QkFDdkIsZUFBZTs7Ozt1QkFDVixlQUFlOztJQUE1QixPQUFPOzt3QkFDRSxVQUFVOzs7O3NCQUNGLFFBQVE7O0FBRXJDLFNBQVMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRTtBQUM3QyxTQUFPLENBQUMsSUFBSSxDQUFDLHFFQUFxRSxDQUFDLENBQUE7QUFDbkYsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFBO0FBQ2hCLE1BQUksQ0FBQyxRQUFRLEdBQUcsMkJBQVcsQ0FBQyxZQUFXO0FBQ3JDLGFBQVMsQ0FBQywwQkFBUyxVQUFVLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUM3QyxDQUFDLENBQUE7Q0FDSDtBQUNELHNCQUFTLGtCQUFrQix1QkFBZSxDQUFBOztBQUUxQyxTQUFTLFVBQVUsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFOztBQUUvQixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDN0QsV0FBUyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFBO0FBQ2hDLFdBQVMsQ0FBQyxrQkFBa0IsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUE7QUFDeEQsV0FBUyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUE7O0FBRTVCLFdBQVMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVMsR0FBRyxFQUFFO0FBQ2xDLE9BQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQ3RCLFVBQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0dBQzFCLENBQUMsQ0FBQTtBQUNGLFdBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBVyxFQUFFLENBQUE7QUFDaEMsV0FBUyxDQUFDLFFBQVEsR0FBRyxZQUFXLEVBQUUsQ0FBQTs7QUFFbEMsU0FBTyxTQUFTLENBQUE7Q0FDakI7O0FBRUQsSUFBTSxnQkFBZ0IsR0FBRyxDQUN2QixNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUNoRCxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUM5QyxRQUFRLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUMvQyxDQUFBOzs7O0FBSUQsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFVBQVMsTUFBTSxFQUFFO0FBQ3hDLG9CQUFrQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxZQUFXO0FBQ2hELFdBQVEsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0dBQy9FLENBQUE7Q0FDRixDQUFDLENBQUE7O3FCQUVhLGtCQUFrQiIsImZpbGUiOiJ0cmFuc2FjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IG1ha2VLbmV4IGZyb20gJy4uLy4uL3V0aWwvbWFrZS1rbmV4JztcbmltcG9ydCBQcm9taXNlIGZyb20gJy4uLy4uL3Byb21pc2UnO1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuLi8uLi9oZWxwZXJzJztcbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xuXG5mdW5jdGlvbiBUcmFuc2FjdGlvbl9XZWJTUUwoY2xpZW50LCBjb250YWluZXIpIHtcbiAgaGVscGVycy53YXJuKCdXZWJTUUwgdHJhbnNhY3Rpb25zIHdpbGwgcnVuIHF1ZXJpZXMsIGJ1dCBkbyBub3QgY29tbWl0IG9yIHJvbGxiYWNrJylcbiAgY29uc3QgdHJ4ID0gdGhpc1xuICB0aGlzLl9wcm9taXNlID0gUHJvbWlzZS50cnkoZnVuY3Rpb24oKSB7XG4gICAgY29udGFpbmVyKG1ha2VLbmV4KG1ha2VDbGllbnQodHJ4LCBjbGllbnQpKSlcbiAgfSlcbn1cbmluaGVyaXRzKFRyYW5zYWN0aW9uX1dlYlNRTCwgRXZlbnRFbWl0dGVyKVxuXG5mdW5jdGlvbiBtYWtlQ2xpZW50KHRyeCwgY2xpZW50KSB7XG5cbiAgY29uc3QgdHJ4Q2xpZW50ID0gT2JqZWN0LmNyZWF0ZShjbGllbnQuY29uc3RydWN0b3IucHJvdG90eXBlKVxuICB0cnhDbGllbnQuY29uZmlnID0gY2xpZW50LmNvbmZpZ1xuICB0cnhDbGllbnQuY29ubmVjdGlvblNldHRpbmdzID0gY2xpZW50LmNvbm5lY3Rpb25TZXR0aW5nc1xuICB0cnhDbGllbnQudHJhbnNhY3RpbmcgPSB0cnVlXG5cbiAgdHJ4Q2xpZW50Lm9uKCdxdWVyeScsIGZ1bmN0aW9uKGFyZykge1xuICAgIHRyeC5lbWl0KCdxdWVyeScsIGFyZylcbiAgICBjbGllbnQuZW1pdCgncXVlcnknLCBhcmcpXG4gIH0pXG4gIHRyeENsaWVudC5jb21taXQgPSBmdW5jdGlvbigpIHt9XG4gIHRyeENsaWVudC5yb2xsYmFjayA9IGZ1bmN0aW9uKCkge31cblxuICByZXR1cm4gdHJ4Q2xpZW50XG59XG5cbmNvbnN0IHByb21pc2VJbnRlcmZhY2UgPSBbXG4gICd0aGVuJywgJ2JpbmQnLCAnY2F0Y2gnLCAnZmluYWxseScsICdhc0NhbGxiYWNrJyxcbiAgJ3NwcmVhZCcsICdtYXAnLCAncmVkdWNlJywgJ3RhcCcsICd0aGVuUmV0dXJuJyxcbiAgJ3JldHVybicsICd5aWVsZCcsICdlbnN1cmUnLCAnZXhlYycsICdyZWZsZWN0J1xuXVxuXG4vLyBDcmVhdGVzIGEgbWV0aG9kIHdoaWNoIFwiY29lcmNlc1wiIHRvIGEgcHJvbWlzZSwgYnkgY2FsbGluZyBhXG4vLyBcInRoZW5cIiBtZXRob2Qgb24gdGhlIGN1cnJlbnQgYFRhcmdldGBcbnByb21pc2VJbnRlcmZhY2UuZm9yRWFjaChmdW5jdGlvbihtZXRob2QpIHtcbiAgVHJhbnNhY3Rpb25fV2ViU1FMLnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICh0aGlzLl9wcm9taXNlID0gdGhpcy5fcHJvbWlzZVttZXRob2RdLmFwcGx5KHRoaXMuX3Byb21pc2UsIGFyZ3VtZW50cykpXG4gIH1cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IFRyYW5zYWN0aW9uX1dlYlNRTFxuIl19