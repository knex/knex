/* globals openDatabase:false */

// WebSQL
// -------
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _sqlite3 = require('../sqlite3');

var _sqlite32 = _interopRequireDefault(_sqlite3);

var _promise = require('../../promise');

var _promise2 = _interopRequireDefault(_promise);

var _lodash = require('lodash');

function Client_WebSQL(config) {
  _sqlite32['default'].call(this, config);
  this.name = config.name || 'knex_database';
  this.version = config.version || '1.0';
  this.displayName = config.displayName || this.name;
  this.estimatedSize = config.estimatedSize || 5 * 1024 * 1024;
}
_inherits2['default'](Client_WebSQL, _sqlite32['default']);

_lodash.assign(Client_WebSQL.prototype, {

  Transaction: _transaction2['default'],

  dialect: 'websql',

  // Get a raw connection from the database, returning a promise with the connection object.
  acquireConnection: function acquireConnection() {
    var client = this;
    return new _promise2['default'](function (resolve, reject) {
      try {
        /*jslint browser: true*/
        var db = openDatabase(client.name, client.version, client.displayName, client.estimatedSize);
        db.transaction(function (t) {
          t.__knexUid = _lodash.uniqueId('__knexUid');
          resolve(t);
        });
      } catch (e) {
        reject(e);
      }
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  releaseConnection: function releaseConnection() {
    return _promise2['default'].resolve();
  },

  // Runs the query on the specified connection,
  // providing the bindings and any other necessary prep work.
  _query: function _query(connection, obj) {
    return new _promise2['default'](function (resolver, rejecter) {
      if (!connection) return rejecter(new Error('No connection provided.'));
      connection.executeSql(obj.sql, obj.bindings, function (trx, response) {
        obj.response = response;
        return resolver(obj);
      }, function (trx, err) {
        rejecter(err);
      });
    });
  },

  _stream: function _stream(connection, sql, stream) {
    var client = this;
    return new _promise2['default'](function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      return client._query(connection, sql).then(function (obj) {
        return client.processResponse(obj);
      }).map(function (row) {
        stream.write(row);
      })['catch'](function (err) {
        stream.emit('error', err);
      }).then(function () {
        stream.end();
      });
    });
  },

  processResponse: function processResponse(obj, runner) {
    var resp = obj.response;
    if (obj.output) return obj.output.call(runner, resp);
    switch (obj.method) {
      case 'pluck':
      case 'first':
      case 'select':
        {
          var results = [];
          for (var i = 0, l = resp.rows.length; i < l; i++) {
            results[i] = _lodash.clone(resp.rows.item(i));
          }
          if (obj.method === 'pluck') results = _lodash.map(results, obj.pluck);
          return obj.method === 'first' ? results[0] : results;
        }
      case 'insert':
        return [resp.insertId];
      case 'delete':
      case 'update':
      case 'counter':
        return resp.rowsAffected;
      default:
        return resp;
    }
  },

  ping: function ping(resource, callback) {
    callback();
  }

});

exports['default'] = Client_WebSQL;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy93ZWJzcWwvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozt3QkFJcUIsVUFBVTs7OzsyQkFFUCxlQUFlOzs7O3VCQUNaLFlBQVk7Ozs7dUJBQ25CLGVBQWU7Ozs7c0JBQ1UsUUFBUTs7QUFFckQsU0FBUyxhQUFhLENBQUMsTUFBTSxFQUFFO0FBQzdCLHVCQUFlLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDbEMsTUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxJQUFJLGVBQWUsQ0FBQztBQUMzQyxNQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDO0FBQ3ZDLE1BQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ25ELE1BQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLGFBQWEsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztDQUM5RDtBQUNELHNCQUFTLGFBQWEsdUJBQWlCLENBQUM7O0FBRXhDLGVBQU8sYUFBYSxDQUFDLFNBQVMsRUFBRTs7QUFFOUIsYUFBVywwQkFBQTs7QUFFWCxTQUFPLEVBQUUsUUFBUTs7O0FBR2pCLG1CQUFpQixFQUFBLDZCQUFHO0FBQ2xCLFFBQU0sTUFBTSxHQUFHLElBQUksQ0FBQztBQUNwQixXQUFPLHlCQUFZLFVBQVMsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUMzQyxVQUFJOztBQUVGLFlBQU0sRUFBRSxHQUFHLFlBQVksQ0FDckIsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FDdEUsQ0FBQztBQUNGLFVBQUUsQ0FBQyxXQUFXLENBQUMsVUFBUyxDQUFDLEVBQUU7QUFDekIsV0FBQyxDQUFDLFNBQVMsR0FBRyxp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RUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUQsaUJBQU8sR0FBRyxDQUFDLE1BQU0sS0FBSyxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQztTQUN0RDtBQUFBLEFBQ0QsV0FBSyxRQUFRO0FBQ1gsZUFBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUFBLEFBQ3pCLFdBQUssUUFBUSxDQUFDO0FBQ2QsV0FBSyxRQUFRLENBQUM7QUFDZCxXQUFLLFNBQVM7QUFDWixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7QUFBQSxBQUMzQjtBQUNFLGVBQU8sSUFBSSxDQUFDO0FBQUEsS0FDZjtHQUNGOztBQUVELE1BQUksRUFBQSxjQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUU7QUFDdkIsWUFBUSxFQUFFLENBQUM7R0FDWjs7Q0FFRixDQUFDLENBQUE7O3FCQUVhLGFBQWEiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIG9wZW5EYXRhYmFzZTpmYWxzZSAqL1xuXG4vLyBXZWJTUUxcbi8vIC0tLS0tLS1cbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5cbmltcG9ydCBUcmFuc2FjdGlvbiBmcm9tICcuL3RyYW5zYWN0aW9uJztcbmltcG9ydCBDbGllbnRfU1FMaXRlMyBmcm9tICcuLi9zcWxpdGUzJztcbmltcG9ydCBQcm9taXNlIGZyb20gJy4uLy4uL3Byb21pc2UnO1xuaW1wb3J0IHsgYXNzaWduLCBtYXAsIHVuaXF1ZUlkLCBjbG9uZSB9IGZyb20gJ2xvZGFzaCdcblxuZnVuY3Rpb24gQ2xpZW50X1dlYlNRTChjb25maWcpIHtcbiAgQ2xpZW50X1NRTGl0ZTMuY2FsbCh0aGlzLCBjb25maWcpO1xuICB0aGlzLm5hbWUgPSBjb25maWcubmFtZSB8fCAna25leF9kYXRhYmFzZSc7XG4gIHRoaXMudmVyc2lvbiA9IGNvbmZpZy52ZXJzaW9uIHx8ICcxLjAnO1xuICB0aGlzLmRpc3BsYXlOYW1lID0gY29uZmlnLmRpc3BsYXlOYW1lIHx8IHRoaXMubmFtZTtcbiAgdGhpcy5lc3RpbWF0ZWRTaXplID0gY29uZmlnLmVzdGltYXRlZFNpemUgfHwgNSAqIDEwMjQgKiAxMDI0O1xufVxuaW5oZXJpdHMoQ2xpZW50X1dlYlNRTCwgQ2xpZW50X1NRTGl0ZTMpO1xuXG5hc3NpZ24oQ2xpZW50X1dlYlNRTC5wcm90b3R5cGUsIHtcblxuICBUcmFuc2FjdGlvbixcblxuICBkaWFsZWN0OiAnd2Vic3FsJyxcblxuICAvLyBHZXQgYSByYXcgY29ubmVjdGlvbiBmcm9tIHRoZSBkYXRhYmFzZSwgcmV0dXJuaW5nIGEgcHJvbWlzZSB3aXRoIHRoZSBjb25uZWN0aW9uIG9iamVjdC5cbiAgYWNxdWlyZUNvbm5lY3Rpb24oKSB7XG4gICAgY29uc3QgY2xpZW50ID0gdGhpcztcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB0cnkge1xuICAgICAgICAvKmpzbGludCBicm93c2VyOiB0cnVlKi9cbiAgICAgICAgY29uc3QgZGIgPSBvcGVuRGF0YWJhc2UoXG4gICAgICAgICAgY2xpZW50Lm5hbWUsIGNsaWVudC52ZXJzaW9uLCBjbGllbnQuZGlzcGxheU5hbWUsIGNsaWVudC5lc3RpbWF0ZWRTaXplXG4gICAgICAgICk7XG4gICAgICAgIGRiLnRyYW5zYWN0aW9uKGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgICB0Ll9fa25leFVpZCA9IHVuaXF1ZUlkKCdfX2tuZXhVaWQnKTtcbiAgICAgICAgICByZXNvbHZlKHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIC8vIFVzZWQgdG8gZXhwbGljaXRseSBjbG9zZSBhIGNvbm5lY3Rpb24sIGNhbGxlZCBpbnRlcm5hbGx5IGJ5IHRoZSBwb29sXG4gIC8vIHdoZW4gYSBjb25uZWN0aW9uIHRpbWVzIG91dCBvciB0aGUgcG9vbCBpcyBzaHV0ZG93bi5cbiAgcmVsZWFzZUNvbm5lY3Rpb24oKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gIH0sXG5cbiAgLy8gUnVucyB0aGUgcXVlcnkgb24gdGhlIHNwZWNpZmllZCBjb25uZWN0aW9uLFxuICAvLyBwcm92aWRpbmcgdGhlIGJpbmRpbmdzIGFuZCBhbnkgb3RoZXIgbmVjZXNzYXJ5IHByZXAgd29yay5cbiAgX3F1ZXJ5KGNvbm5lY3Rpb24sIG9iaikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlciwgcmVqZWN0ZXIpIHtcbiAgICAgIGlmICghY29ubmVjdGlvbikgcmV0dXJuIHJlamVjdGVyKG5ldyBFcnJvcignTm8gY29ubmVjdGlvbiBwcm92aWRlZC4nKSk7XG4gICAgICBjb25uZWN0aW9uLmV4ZWN1dGVTcWwob2JqLnNxbCwgb2JqLmJpbmRpbmdzLCBmdW5jdGlvbih0cngsIHJlc3BvbnNlKSB7XG4gICAgICAgIG9iai5yZXNwb25zZSA9IHJlc3BvbnNlO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZXIob2JqKTtcbiAgICAgIH0sIGZ1bmN0aW9uKHRyeCwgZXJyKSB7XG4gICAgICAgIHJlamVjdGVyKGVycik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICBfc3RyZWFtKGNvbm5lY3Rpb24sIHNxbCwgc3RyZWFtKSB7XG4gICAgY29uc3QgY2xpZW50ID0gdGhpcztcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZXIsIHJlamVjdGVyKSB7XG4gICAgICBzdHJlYW0ub24oJ2Vycm9yJywgcmVqZWN0ZXIpXG4gICAgICBzdHJlYW0ub24oJ2VuZCcsIHJlc29sdmVyKVxuICAgICAgcmV0dXJuIGNsaWVudC5fcXVlcnkoY29ubmVjdGlvbiwgc3FsKS50aGVuKG9iaiA9PlxuICAgICAgICBjbGllbnQucHJvY2Vzc1Jlc3BvbnNlKG9iailcbiAgICAgICkubWFwKHJvdyA9PiB7XG4gICAgICAgIHN0cmVhbS53cml0ZShyb3cpXG4gICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBzdHJlYW0uZW1pdCgnZXJyb3InLCBlcnIpXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgc3RyZWFtLmVuZCgpXG4gICAgICB9KVxuICAgIH0pXG4gIH0sXG5cbiAgcHJvY2Vzc1Jlc3BvbnNlKG9iaiwgcnVubmVyKSB7XG4gICAgY29uc3QgcmVzcCA9IG9iai5yZXNwb25zZTtcbiAgICBpZiAob2JqLm91dHB1dCkgcmV0dXJuIG9iai5vdXRwdXQuY2FsbChydW5uZXIsIHJlc3ApO1xuICAgIHN3aXRjaCAob2JqLm1ldGhvZCkge1xuICAgICAgY2FzZSAncGx1Y2snOlxuICAgICAgY2FzZSAnZmlyc3QnOlxuICAgICAgY2FzZSAnc2VsZWN0Jzoge1xuICAgICAgICBsZXQgcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IHJlc3Aucm93cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICByZXN1bHRzW2ldID0gY2xvbmUocmVzcC5yb3dzLml0ZW0oaSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmoubWV0aG9kID09PSAncGx1Y2snKSByZXN1bHRzID0gbWFwKHJlc3VsdHMsIG9iai5wbHVjayk7XG4gICAgICAgIHJldHVybiBvYmoubWV0aG9kID09PSAnZmlyc3QnID8gcmVzdWx0c1swXSA6IHJlc3VsdHM7XG4gICAgICB9XG4gICAgICBjYXNlICdpbnNlcnQnOlxuICAgICAgICByZXR1cm4gW3Jlc3AuaW5zZXJ0SWRdO1xuICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgIGNhc2UgJ3VwZGF0ZSc6XG4gICAgICBjYXNlICdjb3VudGVyJzpcbiAgICAgICAgcmV0dXJuIHJlc3Aucm93c0FmZmVjdGVkO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfVxuICB9LFxuXG4gIHBpbmcocmVzb3VyY2UsIGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2soKTtcbiAgfVxuXG59KVxuXG5leHBvcnQgZGVmYXVsdCBDbGllbnRfV2ViU1FMO1xuIl19