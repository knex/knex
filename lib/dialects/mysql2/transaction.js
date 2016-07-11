'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _transaction = require('../../transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _lodash = require('lodash');

var debug = require('debug')('knex:tx');

function Transaction_MySQL2() {
  _transaction2['default'].apply(this, arguments);
}
_inherits2['default'](Transaction_MySQL2, _transaction2['default']);

_lodash.assign(Transaction_MySQL2.prototype, {

  query: function query(conn, sql, status, value) {
    var t = this;
    var q = this.trxClient.query(conn, sql)['catch'](function (err) {
      return err.code === 'ER_SP_DOES_NOT_EXIST';
    }, function () {
      helpers.warn('Transaction was implicitly committed, do not mix transactions and' + 'DDL with MySQL (#805)');
    })['catch'](function (err) {
      status = 2;
      value = err;
      t._completed = true;
      debug('%s error running transaction query', t.txid);
    }).tap(function () {
      if (status === 1) t._resolver(value);
      if (status === 2) t._rejecter(value);
    });
    if (status === 1 || status === 2) {
      t._completed = true;
    }
    return q;
  }

});

exports['default'] = Transaction_MySQL2;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9teXNxbDIvdHJhbnNhY3Rpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7MkJBQ3dCLG1CQUFtQjs7Ozt3QkFDdEIsVUFBVTs7Ozt1QkFFTixlQUFlOztJQUE1QixPQUFPOztzQkFFSSxRQUFROztBQUgvQixJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUE7O0FBS3pDLFNBQVMsa0JBQWtCLEdBQUc7QUFDNUIsMkJBQVksS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQTtDQUNuQztBQUNELHNCQUFTLGtCQUFrQiwyQkFBYyxDQUFBOztBQUV6QyxlQUFPLGtCQUFrQixDQUFDLFNBQVMsRUFBRTs7QUFFbkMsT0FBSyxFQUFBLGVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO0FBQzlCLFFBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQTtBQUNkLFFBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsU0FDakMsQ0FBQyxVQUFBLEdBQUc7YUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLHNCQUFzQjtLQUFBLEVBQUUsWUFBVztBQUM1RCxhQUFPLENBQUMsSUFBSSxDQUNWLG1FQUFtRSxHQUNuRSx1QkFBdUIsQ0FDeEIsQ0FBQTtLQUNGLENBQUMsU0FDSSxDQUFDLFVBQVMsR0FBRyxFQUFFO0FBQ25CLFlBQU0sR0FBRyxDQUFDLENBQUE7QUFDVixXQUFLLEdBQUcsR0FBRyxDQUFBO0FBQ1gsT0FBQyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUE7QUFDbkIsV0FBSyxDQUFDLG9DQUFvQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUNwRCxDQUFDLENBQ0QsR0FBRyxDQUFDLFlBQVc7QUFDZCxVQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUNwQyxVQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtLQUNyQyxDQUFDLENBQUE7QUFDSixRQUFJLE1BQU0sS0FBSyxDQUFDLElBQUksTUFBTSxLQUFLLENBQUMsRUFBRTtBQUNoQyxPQUFDLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQTtLQUNwQjtBQUNELFdBQU8sQ0FBQyxDQUFDO0dBQ1Y7O0NBRUYsQ0FBQyxDQUFBOztxQkFFYSxrQkFBa0IiLCJmaWxlIjoidHJhbnNhY3Rpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBUcmFuc2FjdGlvbiBmcm9tICcuLi8uLi90cmFuc2FjdGlvbic7XG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuY29uc3QgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdrbmV4OnR4JylcbmltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi4vLi4vaGVscGVycyc7XG5cbmltcG9ydCB7IGFzc2lnbiB9IGZyb20gJ2xvZGFzaCdcblxuZnVuY3Rpb24gVHJhbnNhY3Rpb25fTXlTUUwyKCkge1xuICBUcmFuc2FjdGlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5pbmhlcml0cyhUcmFuc2FjdGlvbl9NeVNRTDIsIFRyYW5zYWN0aW9uKVxuXG5hc3NpZ24oVHJhbnNhY3Rpb25fTXlTUUwyLnByb3RvdHlwZSwge1xuXG4gIHF1ZXJ5KGNvbm4sIHNxbCwgc3RhdHVzLCB2YWx1ZSkge1xuICAgIGNvbnN0IHQgPSB0aGlzXG4gICAgY29uc3QgcSA9IHRoaXMudHJ4Q2xpZW50LnF1ZXJ5KGNvbm4sIHNxbClcbiAgICAgIC5jYXRjaChlcnIgPT4gZXJyLmNvZGUgPT09ICdFUl9TUF9ET0VTX05PVF9FWElTVCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBoZWxwZXJzLndhcm4oXG4gICAgICAgICAgJ1RyYW5zYWN0aW9uIHdhcyBpbXBsaWNpdGx5IGNvbW1pdHRlZCwgZG8gbm90IG1peCB0cmFuc2FjdGlvbnMgYW5kJyArXG4gICAgICAgICAgJ0RETCB3aXRoIE15U1FMICgjODA1KSdcbiAgICAgICAgKVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgc3RhdHVzID0gMlxuICAgICAgICB2YWx1ZSA9IGVyclxuICAgICAgICB0Ll9jb21wbGV0ZWQgPSB0cnVlXG4gICAgICAgIGRlYnVnKCclcyBlcnJvciBydW5uaW5nIHRyYW5zYWN0aW9uIHF1ZXJ5JywgdC50eGlkKVxuICAgICAgfSlcbiAgICAgIC50YXAoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChzdGF0dXMgPT09IDEpIHQuX3Jlc29sdmVyKHZhbHVlKVxuICAgICAgICBpZiAoc3RhdHVzID09PSAyKSB0Ll9yZWplY3Rlcih2YWx1ZSlcbiAgICAgIH0pXG4gICAgaWYgKHN0YXR1cyA9PT0gMSB8fCBzdGF0dXMgPT09IDIpIHtcbiAgICAgIHQuX2NvbXBsZXRlZCA9IHRydWVcbiAgICB9XG4gICAgcmV0dXJuIHE7XG4gIH1cblxufSlcblxuZXhwb3J0IGRlZmF1bHQgVHJhbnNhY3Rpb25fTXlTUUwyXG4iXX0=