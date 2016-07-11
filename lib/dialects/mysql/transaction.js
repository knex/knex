'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _transaction = require('../../transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _lodash = require('lodash');

var debug = _debug2['default']('knex:tx');

function Transaction_MySQL() {
  _transaction2['default'].apply(this, arguments);
}
_inherits2['default'](Transaction_MySQL, _transaction2['default']);

_lodash.assign(Transaction_MySQL.prototype, {

  query: function query(conn, sql, status, value) {
    var t = this;
    var q = this.trxClient.query(conn, sql)['catch'](function (err) {
      return err.errno === 1305;
    }, function () {
      helpers.warn('Transaction was implicitly committed, do not mix transactions and ' + 'DDL with MySQL (#805)');
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

exports['default'] = Transaction_MySQL;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9teXNxbC90cmFuc2FjdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OzsyQkFDd0IsbUJBQW1COzs7O3dCQUN0QixVQUFVOzs7O3FCQUNiLE9BQU87Ozs7dUJBQ0EsZUFBZTs7SUFBNUIsT0FBTzs7c0JBQ0ksUUFBUTs7QUFFL0IsSUFBTSxLQUFLLEdBQUcsbUJBQU0sU0FBUyxDQUFDLENBQUM7O0FBRS9CLFNBQVMsaUJBQWlCLEdBQUc7QUFDM0IsMkJBQVksS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQTtDQUNuQztBQUNELHNCQUFTLGlCQUFpQiwyQkFBYyxDQUFBOztBQUV4QyxlQUFPLGlCQUFpQixDQUFDLFNBQVMsRUFBRTs7QUFFbEMsT0FBSyxFQUFBLGVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO0FBQzlCLFFBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQTtBQUNkLFFBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsU0FDakMsQ0FBQyxVQUFBLEdBQUc7YUFBSSxHQUFHLENBQUMsS0FBSyxLQUFLLElBQUk7S0FBQSxFQUFFLFlBQVc7QUFDM0MsYUFBTyxDQUFDLElBQUksQ0FDVixvRUFBb0UsR0FDcEUsdUJBQXVCLENBQ3hCLENBQUE7S0FDRixDQUFDLFNBQ0ksQ0FBQyxVQUFTLEdBQUcsRUFBRTtBQUNuQixZQUFNLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsV0FBSyxHQUFHLEdBQUcsQ0FBQTtBQUNYLE9BQUMsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFBO0FBQ25CLFdBQUssQ0FBQyxvQ0FBb0MsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDcEQsQ0FBQyxDQUNELEdBQUcsQ0FBQyxZQUFXO0FBQ2QsVUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDcEMsVUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7S0FDckMsQ0FBQyxDQUFBO0FBQ0osUUFBSSxNQUFNLEtBQUssQ0FBQyxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDaEMsT0FBQyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUE7S0FDcEI7QUFDRCxXQUFPLENBQUMsQ0FBQztHQUNWOztDQUVGLENBQUMsQ0FBQTs7cUJBRWEsaUJBQWlCIiwiZmlsZSI6InRyYW5zYWN0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgVHJhbnNhY3Rpb24gZnJvbSAnLi4vLi4vdHJhbnNhY3Rpb24nO1xuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcbmltcG9ydCBEZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4uLy4uL2hlbHBlcnMnO1xuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnbG9kYXNoJ1xuXG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdrbmV4OnR4Jyk7XG5cbmZ1bmN0aW9uIFRyYW5zYWN0aW9uX015U1FMKCkge1xuICBUcmFuc2FjdGlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5pbmhlcml0cyhUcmFuc2FjdGlvbl9NeVNRTCwgVHJhbnNhY3Rpb24pXG5cbmFzc2lnbihUcmFuc2FjdGlvbl9NeVNRTC5wcm90b3R5cGUsIHtcblxuICBxdWVyeShjb25uLCBzcWwsIHN0YXR1cywgdmFsdWUpIHtcbiAgICBjb25zdCB0ID0gdGhpc1xuICAgIGNvbnN0IHEgPSB0aGlzLnRyeENsaWVudC5xdWVyeShjb25uLCBzcWwpXG4gICAgICAuY2F0Y2goZXJyID0+IGVyci5lcnJubyA9PT0gMTMwNSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGhlbHBlcnMud2FybihcbiAgICAgICAgICAnVHJhbnNhY3Rpb24gd2FzIGltcGxpY2l0bHkgY29tbWl0dGVkLCBkbyBub3QgbWl4IHRyYW5zYWN0aW9ucyBhbmQgJyArXG4gICAgICAgICAgJ0RETCB3aXRoIE15U1FMICgjODA1KSdcbiAgICAgICAgKVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgc3RhdHVzID0gMlxuICAgICAgICB2YWx1ZSA9IGVyclxuICAgICAgICB0Ll9jb21wbGV0ZWQgPSB0cnVlXG4gICAgICAgIGRlYnVnKCclcyBlcnJvciBydW5uaW5nIHRyYW5zYWN0aW9uIHF1ZXJ5JywgdC50eGlkKVxuICAgICAgfSlcbiAgICAgIC50YXAoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChzdGF0dXMgPT09IDEpIHQuX3Jlc29sdmVyKHZhbHVlKVxuICAgICAgICBpZiAoc3RhdHVzID09PSAyKSB0Ll9yZWplY3Rlcih2YWx1ZSlcbiAgICAgIH0pXG4gICAgaWYgKHN0YXR1cyA9PT0gMSB8fCBzdGF0dXMgPT09IDIpIHtcbiAgICAgIHQuX2NvbXBsZXRlZCA9IHRydWVcbiAgICB9XG4gICAgcmV0dXJuIHE7XG4gIH1cblxufSlcblxuZXhwb3J0IGRlZmF1bHQgVHJhbnNhY3Rpb25fTXlTUUxcbiJdfQ==