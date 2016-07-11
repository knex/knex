
// MySQL2 Client
// -------
'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _mysql = require('../mysql');

var _mysql2 = _interopRequireDefault(_mysql);

var _promise = require('../../promise');

var _promise2 = _interopRequireDefault(_promise);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _lodash = require('lodash');

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var configOptions = ['isServer', 'stream', 'host', 'port', 'localAddress', 'socketPath', 'user', 'password', 'passwordSha1', 'database', 'connectTimeout', 'insecureAuth', 'supportBigNumbers', 'bigNumberStrings', 'decimalNumbers', 'dateStrings', 'debug', 'trace', 'stringifyObjects', 'timezone', 'flags', 'queryFormat', 'pool', 'ssl', 'multipleStatements', 'namedPlaceholders', 'typeCast', 'charsetNumber', 'compress'];

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL2(config) {
  _mysql2['default'].call(this, config);
}
_inherits2['default'](Client_MySQL2, _mysql2['default']);

_lodash.assign(Client_MySQL2.prototype, {

  // The "dialect", for reference elsewhere.
  driverName: 'mysql2',

  Transaction: _transaction2['default'],

  _driver: function _driver() {
    return require('mysql2');
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    var connection = this.driver.createConnection(_lodash.pick(this.connectionSettings, configOptions));
    return new _promise2['default'](function (resolver, rejecter) {
      connection.connect(function (err) {
        if (err) return rejecter(err);
        connection.on('error', client._connectionErrorHandler.bind(null, client, connection));
        resolver(connection);
      });
    });
  },

  processResponse: function processResponse(obj, runner) {
    var response = obj.response;
    var method = obj.method;

    var rows = response[0];
    var fields = response[1];
    if (obj.output) return obj.output.call(runner, rows, fields);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        {
          var resp = helpers.skim(rows);
          if (method === 'pluck') return _lodash.map(resp, obj.pluck);
          return method === 'first' ? resp[0] : resp;
        }
      case 'insert':
        return [rows.insertId];
      case 'del':
      case 'update':
      case 'counter':
        return rows.affectedRows;
      default:
        return response;
    }
  },

  ping: function ping(resource, callback) {
    resource.query('SELECT 1', callback);
  }

});

exports['default'] = Client_MySQL2;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9teXNxbDIvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7d0JBR3FCLFVBQVU7Ozs7cUJBQ04sVUFBVTs7Ozt1QkFDZixlQUFlOzs7O3VCQUNWLGVBQWU7O0lBQTVCLE9BQU87O3NCQUNlLFFBQVE7OzJCQUNsQixlQUFlOzs7O0FBRXZDLElBQU0sYUFBYSxHQUFHLENBQ3BCLFVBQVUsRUFDVixRQUFRLEVBQ1IsTUFBTSxFQUNOLE1BQU0sRUFDTixjQUFjLEVBQ2QsWUFBWSxFQUNaLE1BQU0sRUFDTixVQUFVLEVBQ1YsY0FBYyxFQUNkLFVBQVUsRUFDVixnQkFBZ0IsRUFDaEIsY0FBYyxFQUNkLG1CQUFtQixFQUNuQixrQkFBa0IsRUFDbEIsZ0JBQWdCLEVBQ2hCLGFBQWEsRUFDYixPQUFPLEVBQ1AsT0FBTyxFQUNQLGtCQUFrQixFQUNsQixVQUFVLEVBQ1YsT0FBTyxFQUNQLGFBQWEsRUFDYixNQUFNLEVBQ04sS0FBSyxFQUNMLG9CQUFvQixFQUNwQixtQkFBbUIsRUFDbkIsVUFBVSxFQUNWLGVBQWUsRUFDZixVQUFVLENBQ1gsQ0FBQzs7Ozs7QUFLRixTQUFTLGFBQWEsQ0FBQyxNQUFNLEVBQUU7QUFDN0IscUJBQWEsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtDQUNoQztBQUNELHNCQUFTLGFBQWEscUJBQWUsQ0FBQTs7QUFFckMsZUFBTyxhQUFhLENBQUMsU0FBUyxFQUFFOzs7QUFHOUIsWUFBVSxFQUFFLFFBQVE7O0FBRXBCLGFBQVcsMEJBQUE7O0FBRVgsU0FBTyxFQUFBLG1CQUFHO0FBQ1IsV0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7R0FDekI7Ozs7QUFJRCxzQkFBb0IsRUFBQSxnQ0FBRztBQUNyQixRQUFNLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDcEIsUUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFLLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFBO0FBQzdGLFdBQU8seUJBQVksVUFBUyxRQUFRLEVBQUUsUUFBUSxFQUFFO0FBQzlDLGdCQUFVLENBQUMsT0FBTyxDQUFDLFVBQVMsR0FBRyxFQUFFO0FBQy9CLFlBQUksR0FBRyxFQUFFLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQzdCLGtCQUFVLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQTtBQUNyRixnQkFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFBO09BQ3JCLENBQUMsQ0FBQTtLQUNILENBQUMsQ0FBQTtHQUNIOztBQUVELGlCQUFlLEVBQUEseUJBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRTtRQUNuQixRQUFRLEdBQUssR0FBRyxDQUFoQixRQUFRO1FBQ1IsTUFBTSxHQUFLLEdBQUcsQ0FBZCxNQUFNOztBQUNkLFFBQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUN4QixRQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDMUIsUUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUM1RCxZQUFRLE1BQU07QUFDWixXQUFLLFFBQVEsQ0FBQztBQUNkLFdBQUssT0FBTyxDQUFDO0FBQ2IsV0FBSyxPQUFPO0FBQUU7QUFDWixjQUFNLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQy9CLGNBQUksTUFBTSxLQUFLLE9BQU8sRUFBRSxPQUFPLFlBQUksSUFBSSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUNuRCxpQkFBTyxNQUFNLEtBQUssT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUE7U0FDM0M7QUFBQSxBQUNELFdBQUssUUFBUTtBQUNYLGVBQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7QUFBQSxBQUN4QixXQUFLLEtBQUssQ0FBQztBQUNYLFdBQUssUUFBUSxDQUFDO0FBQ2QsV0FBSyxTQUFTO0FBQ1osZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFBO0FBQUEsQUFDMUI7QUFDRSxlQUFPLFFBQVEsQ0FBQTtBQUFBLEtBQ2xCO0dBQ0Y7O0FBRUQsTUFBSSxFQUFBLGNBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRTtBQUN2QixZQUFRLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztHQUN0Qzs7Q0FFRixDQUFDLENBQUE7O3FCQUVhLGFBQWEiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8vIE15U1FMMiBDbGllbnRcbi8vIC0tLS0tLS1cbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5pbXBvcnQgQ2xpZW50X015U1FMIGZyb20gJy4uL215c3FsJztcbmltcG9ydCBQcm9taXNlIGZyb20gJy4uLy4uL3Byb21pc2UnO1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuLi8uLi9oZWxwZXJzJztcbmltcG9ydCB7IHBpY2ssIG1hcCwgYXNzaWduIH0gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IFRyYW5zYWN0aW9uIGZyb20gJy4vdHJhbnNhY3Rpb24nO1xuXG5jb25zdCBjb25maWdPcHRpb25zID0gW1xuICAnaXNTZXJ2ZXInLFxuICAnc3RyZWFtJyxcbiAgJ2hvc3QnLFxuICAncG9ydCcsXG4gICdsb2NhbEFkZHJlc3MnLFxuICAnc29ja2V0UGF0aCcsXG4gICd1c2VyJyxcbiAgJ3Bhc3N3b3JkJyxcbiAgJ3Bhc3N3b3JkU2hhMScsXG4gICdkYXRhYmFzZScsXG4gICdjb25uZWN0VGltZW91dCcsXG4gICdpbnNlY3VyZUF1dGgnLFxuICAnc3VwcG9ydEJpZ051bWJlcnMnLFxuICAnYmlnTnVtYmVyU3RyaW5ncycsXG4gICdkZWNpbWFsTnVtYmVycycsXG4gICdkYXRlU3RyaW5ncycsXG4gICdkZWJ1ZycsXG4gICd0cmFjZScsXG4gICdzdHJpbmdpZnlPYmplY3RzJyxcbiAgJ3RpbWV6b25lJyxcbiAgJ2ZsYWdzJyxcbiAgJ3F1ZXJ5Rm9ybWF0JyxcbiAgJ3Bvb2wnLFxuICAnc3NsJyxcbiAgJ211bHRpcGxlU3RhdGVtZW50cycsXG4gICduYW1lZFBsYWNlaG9sZGVycycsXG4gICd0eXBlQ2FzdCcsXG4gICdjaGFyc2V0TnVtYmVyJyxcbiAgJ2NvbXByZXNzJ1xuXTtcblxuLy8gQWx3YXlzIGluaXRpYWxpemUgd2l0aCB0aGUgXCJRdWVyeUJ1aWxkZXJcIiBhbmQgXCJRdWVyeUNvbXBpbGVyXCJcbi8vIG9iamVjdHMsIHdoaWNoIGV4dGVuZCB0aGUgYmFzZSAnbGliL3F1ZXJ5L2J1aWxkZXInIGFuZFxuLy8gJ2xpYi9xdWVyeS9jb21waWxlcicsIHJlc3BlY3RpdmVseS5cbmZ1bmN0aW9uIENsaWVudF9NeVNRTDIoY29uZmlnKSB7XG4gIENsaWVudF9NeVNRTC5jYWxsKHRoaXMsIGNvbmZpZylcbn1cbmluaGVyaXRzKENsaWVudF9NeVNRTDIsIENsaWVudF9NeVNRTClcblxuYXNzaWduKENsaWVudF9NeVNRTDIucHJvdG90eXBlLCB7XG5cbiAgLy8gVGhlIFwiZGlhbGVjdFwiLCBmb3IgcmVmZXJlbmNlIGVsc2V3aGVyZS5cbiAgZHJpdmVyTmFtZTogJ215c3FsMicsXG5cbiAgVHJhbnNhY3Rpb24sXG5cbiAgX2RyaXZlcigpIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnbXlzcWwyJylcbiAgfSxcblxuICAvLyBHZXQgYSByYXcgY29ubmVjdGlvbiwgY2FsbGVkIGJ5IHRoZSBgcG9vbGAgd2hlbmV2ZXIgYSBuZXdcbiAgLy8gY29ubmVjdGlvbiBuZWVkcyB0byBiZSBhZGRlZCB0byB0aGUgcG9vbC5cbiAgYWNxdWlyZVJhd0Nvbm5lY3Rpb24oKSB7XG4gICAgY29uc3QgY2xpZW50ID0gdGhpcztcbiAgICBjb25zdCBjb25uZWN0aW9uID0gdGhpcy5kcml2ZXIuY3JlYXRlQ29ubmVjdGlvbihwaWNrKHRoaXMuY29ubmVjdGlvblNldHRpbmdzLCBjb25maWdPcHRpb25zKSlcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZXIsIHJlamVjdGVyKSB7XG4gICAgICBjb25uZWN0aW9uLmNvbm5lY3QoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3RlcihlcnIpXG4gICAgICAgIGNvbm5lY3Rpb24ub24oJ2Vycm9yJywgY2xpZW50Ll9jb25uZWN0aW9uRXJyb3JIYW5kbGVyLmJpbmQobnVsbCwgY2xpZW50LCBjb25uZWN0aW9uKSlcbiAgICAgICAgcmVzb2x2ZXIoY29ubmVjdGlvbilcbiAgICAgIH0pXG4gICAgfSlcbiAgfSxcblxuICBwcm9jZXNzUmVzcG9uc2Uob2JqLCBydW5uZXIpIHtcbiAgICBjb25zdCB7IHJlc3BvbnNlIH0gPSBvYmpcbiAgICBjb25zdCB7IG1ldGhvZCB9ID0gb2JqXG4gICAgY29uc3Qgcm93cyA9IHJlc3BvbnNlWzBdXG4gICAgY29uc3QgZmllbGRzID0gcmVzcG9uc2VbMV1cbiAgICBpZiAob2JqLm91dHB1dCkgcmV0dXJuIG9iai5vdXRwdXQuY2FsbChydW5uZXIsIHJvd3MsIGZpZWxkcylcbiAgICBzd2l0Y2ggKG1ldGhvZCkge1xuICAgICAgY2FzZSAnc2VsZWN0JzpcbiAgICAgIGNhc2UgJ3BsdWNrJzpcbiAgICAgIGNhc2UgJ2ZpcnN0Jzoge1xuICAgICAgICBjb25zdCByZXNwID0gaGVscGVycy5za2ltKHJvd3MpXG4gICAgICAgIGlmIChtZXRob2QgPT09ICdwbHVjaycpIHJldHVybiBtYXAocmVzcCwgb2JqLnBsdWNrKVxuICAgICAgICByZXR1cm4gbWV0aG9kID09PSAnZmlyc3QnID8gcmVzcFswXSA6IHJlc3BcbiAgICAgIH1cbiAgICAgIGNhc2UgJ2luc2VydCc6XG4gICAgICAgIHJldHVybiBbcm93cy5pbnNlcnRJZF1cbiAgICAgIGNhc2UgJ2RlbCc6XG4gICAgICBjYXNlICd1cGRhdGUnOlxuICAgICAgY2FzZSAnY291bnRlcic6XG4gICAgICAgIHJldHVybiByb3dzLmFmZmVjdGVkUm93c1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlXG4gICAgfVxuICB9LFxuXG4gIHBpbmcocmVzb3VyY2UsIGNhbGxiYWNrKSB7XG4gICAgcmVzb3VyY2UucXVlcnkoJ1NFTEVDVCAxJywgY2FsbGJhY2spO1xuICB9XG5cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IENsaWVudF9NeVNRTDI7XG4iXX0=