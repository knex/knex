
// MySQL Client
// -------
'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _client = require('../../client');

var _client2 = _interopRequireDefault(_client);

var _promise = require('../../promise');

var _promise2 = _interopRequireDefault(_promise);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _queryCompiler = require('./query/compiler');

var _queryCompiler2 = _interopRequireDefault(_queryCompiler);

var _schemaCompiler = require('./schema/compiler');

var _schemaCompiler2 = _interopRequireDefault(_schemaCompiler);

var _schemaTablecompiler = require('./schema/tablecompiler');

var _schemaTablecompiler2 = _interopRequireDefault(_schemaTablecompiler);

var _schemaColumncompiler = require('./schema/columncompiler');

var _schemaColumncompiler2 = _interopRequireDefault(_schemaColumncompiler);

var _lodash = require('lodash');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL(config) {
  _client2['default'].call(this, config);
}
_inherits2['default'](Client_MySQL, _client2['default']);

_lodash.assign(Client_MySQL.prototype, {

  dialect: 'mysql',

  driverName: 'mysql',

  _driver: function _driver() {
    return require('mysql');
  },

  QueryCompiler: _queryCompiler2['default'],

  SchemaCompiler: _schemaCompiler2['default'],

  TableCompiler: _schemaTablecompiler2['default'],

  ColumnCompiler: _schemaColumncompiler2['default'],

  Transaction: _transaction2['default'],

  wrapIdentifier: function wrapIdentifier(value) {
    return value !== '*' ? '`' + value.replace(/`/g, '``') + '`' : '*';
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    var connection = this.driver.createConnection(this.connectionSettings);
    return new _promise2['default'](function (resolver, rejecter) {
      connection.connect(function (err) {
        if (err) return rejecter(err);
        connection.on('error', client._connectionErrorHandler.bind(null, client, connection));
        connection.on('end', client._connectionErrorHandler.bind(null, client, connection));
        resolver(connection);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.end(cb);
  },

  // Grab a connection, run the query via the MySQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream: function _stream(connection, obj, stream, options) {
    options = options || {};
    return new _promise2['default'](function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      connection.query(obj.sql, obj.bindings).stream(options).pipe(stream);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new _promise2['default'](function (resolver, rejecter) {
      var _obj = obj;
      var sql = _obj.sql;

      if (!sql) return resolver();
      if (obj.options) sql = _lodash.assign({ sql: sql }, obj.options);
      connection.query(sql, obj.bindings, function (err, rows, fields) {
        if (err) return rejecter(err);
        obj.response = [rows, fields];
        resolver(obj);
      });
    });
  },

  // Process the response as returned from the query.
  processResponse: function processResponse(obj, runner) {
    if (obj == null) return;
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

  // MySQL Specific error handler
  _connectionErrorHandler: function _connectionErrorHandler(client, connection, err) {
    if (connection && err && err.fatal && !connection.__knex__disposed) {
      connection.__knex__disposed = true;
      client.pool.destroy(connection);
    }
  },

  ping: function ping(resource, callback) {
    resource.query('SELECT 1', callback);
  },

  canCancelQuery: true,

  cancelQuery: function cancelQuery(connectionToKill) {
    var _this = this;

    var acquiringConn = this.acquireConnection().completed;

    // Error out if we can't acquire connection in time.
    // Purposely not putting timeout on `KILL QUERY` execution because erroring
    // early there would release the `connectionToKill` back to the pool with
    // a `KILL QUERY` command yet to finish.
    return acquiringConn.timeout(100).then(function (conn) {
      return _this.query(conn, {
        method: 'raw',
        sql: 'KILL QUERY ?',
        bindings: [connectionToKill.threadId],
        options: {}
      });
    })['finally'](function () {
      // NOT returning this promise because we want to release the connection
      // in a non-blocking fashion
      acquiringConn.then(function (conn) {
        return _this.releaseConnection(conn);
      });
    });
  }

});

exports['default'] = Client_MySQL;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9teXNxbC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozt3QkFHcUIsVUFBVTs7OztzQkFFWixjQUFjOzs7O3VCQUNiLGVBQWU7Ozs7dUJBQ1YsZUFBZTs7SUFBNUIsT0FBTzs7MkJBRUssZUFBZTs7Ozs2QkFDYixrQkFBa0I7Ozs7OEJBQ2pCLG1CQUFtQjs7OzttQ0FDcEIsd0JBQXdCOzs7O29DQUN2Qix5QkFBeUI7Ozs7c0JBRXhCLFFBQVE7Ozs7O0FBS3BDLFNBQVMsWUFBWSxDQUFDLE1BQU0sRUFBRTtBQUM1QixzQkFBTyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0NBQzNCO0FBQ0Qsc0JBQVMsWUFBWSxzQkFBUyxDQUFDOztBQUUvQixlQUFPLFlBQVksQ0FBQyxTQUFTLEVBQUU7O0FBRTdCLFNBQU8sRUFBRSxPQUFPOztBQUVoQixZQUFVLEVBQUUsT0FBTzs7QUFFbkIsU0FBTyxFQUFBLG1CQUFHO0FBQ1IsV0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUE7R0FDeEI7O0FBRUQsZUFBYSw0QkFBQTs7QUFFYixnQkFBYyw2QkFBQTs7QUFFZCxlQUFhLGtDQUFBOztBQUViLGdCQUFjLG1DQUFBOztBQUVkLGFBQVcsMEJBQUE7O0FBRVgsZ0JBQWMsRUFBQSx3QkFBQyxLQUFLLEVBQUU7QUFDcEIsV0FBUSxLQUFLLEtBQUssR0FBRyxTQUFRLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFPLEdBQUcsQ0FBQztHQUNsRTs7OztBQUlELHNCQUFvQixFQUFBLGdDQUFHO0FBQ3JCLFFBQU0sTUFBTSxHQUFHLElBQUksQ0FBQTtBQUNuQixRQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO0FBQ3hFLFdBQU8seUJBQVksVUFBUyxRQUFRLEVBQUUsUUFBUSxF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YUFBYSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLFNBQVMsQ0FBQTs7Ozs7O0FBTXhELFdBQU8sYUFBYSxDQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLENBQ1osSUFBSSxDQUFDLFVBQUMsSUFBSTthQUFLLE1BQUssS0FBSyxDQUFDLElBQUksRUFBRTtBQUMvQixjQUFNLEVBQUUsS0FBSztBQUNiLFdBQUcsRUFBRSxjQUFjO0FBQ25CLGdCQUFRLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUM7QUFDckMsZUFBTyxFQUFFLEVBQUU7T0FDWixDQUFDO0tBQUEsQ0FBQyxXQUNLLENBQUMsWUFBTTs7O0FBR2IsbUJBQWEsQ0FDVixJQUFJLENBQUMsVUFBQyxJQUFJO2VBQUssTUFBSyxpQkFBaUIsQ0FBQyxJQUFJLENBQUM7T0FBQSxDQUFDLENBQUM7S0FDakQsQ0FBQyxDQUFDO0dBQ047O0NBRUYsQ0FBQyxDQUFBOztxQkFFYSxZQUFZIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBNeVNRTCBDbGllbnRcbi8vIC0tLS0tLS1cbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5cbmltcG9ydCBDbGllbnQgZnJvbSAnLi4vLi4vY2xpZW50JztcbmltcG9ydCBQcm9taXNlIGZyb20gJy4uLy4uL3Byb21pc2UnO1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuLi8uLi9oZWxwZXJzJztcblxuaW1wb3J0IFRyYW5zYWN0aW9uIGZyb20gJy4vdHJhbnNhY3Rpb24nO1xuaW1wb3J0IFF1ZXJ5Q29tcGlsZXIgZnJvbSAnLi9xdWVyeS9jb21waWxlcic7XG5pbXBvcnQgU2NoZW1hQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvY29tcGlsZXInO1xuaW1wb3J0IFRhYmxlQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvdGFibGVjb21waWxlcic7XG5pbXBvcnQgQ29sdW1uQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvY29sdW1uY29tcGlsZXInO1xuXG5pbXBvcnQgeyBhc3NpZ24sIG1hcCB9IGZyb20gJ2xvZGFzaCdcblxuLy8gQWx3YXlzIGluaXRpYWxpemUgd2l0aCB0aGUgXCJRdWVyeUJ1aWxkZXJcIiBhbmQgXCJRdWVyeUNvbXBpbGVyXCJcbi8vIG9iamVjdHMsIHdoaWNoIGV4dGVuZCB0aGUgYmFzZSAnbGliL3F1ZXJ5L2J1aWxkZXInIGFuZFxuLy8gJ2xpYi9xdWVyeS9jb21waWxlcicsIHJlc3BlY3RpdmVseS5cbmZ1bmN0aW9uIENsaWVudF9NeVNRTChjb25maWcpIHtcbiAgQ2xpZW50LmNhbGwodGhpcywgY29uZmlnKTtcbn1cbmluaGVyaXRzKENsaWVudF9NeVNRTCwgQ2xpZW50KTtcblxuYXNzaWduKENsaWVudF9NeVNRTC5wcm90b3R5cGUsIHtcblxuICBkaWFsZWN0OiAnbXlzcWwnLFxuXG4gIGRyaXZlck5hbWU6ICdteXNxbCcsXG5cbiAgX2RyaXZlcigpIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnbXlzcWwnKVxuICB9LFxuXG4gIFF1ZXJ5Q29tcGlsZXIsXG5cbiAgU2NoZW1hQ29tcGlsZXIsXG5cbiAgVGFibGVDb21waWxlcixcblxuICBDb2x1bW5Db21waWxlcixcblxuICBUcmFuc2FjdGlvbixcblxuICB3cmFwSWRlbnRpZmllcih2YWx1ZSkge1xuICAgIHJldHVybiAodmFsdWUgIT09ICcqJyA/IGBcXGAke3ZhbHVlLnJlcGxhY2UoL2AvZywgJ2BgJyl9XFxgYCA6ICcqJylcbiAgfSxcblxuICAvLyBHZXQgYSByYXcgY29ubmVjdGlvbiwgY2FsbGVkIGJ5IHRoZSBgcG9vbGAgd2hlbmV2ZXIgYSBuZXdcbiAgLy8gY29ubmVjdGlvbiBuZWVkcyB0byBiZSBhZGRlZCB0byB0aGUgcG9vbC5cbiAgYWNxdWlyZVJhd0Nvbm5lY3Rpb24oKSB7XG4gICAgY29uc3QgY2xpZW50ID0gdGhpc1xuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSB0aGlzLmRyaXZlci5jcmVhdGVDb25uZWN0aW9uKHRoaXMuY29ubmVjdGlvblNldHRpbmdzKVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlciwgcmVqZWN0ZXIpIHtcbiAgICAgIGNvbm5lY3Rpb24uY29ubmVjdChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIHJlamVjdGVyKGVycilcbiAgICAgICAgY29ubmVjdGlvbi5vbignZXJyb3InLCBjbGllbnQuX2Nvbm5lY3Rpb25FcnJvckhhbmRsZXIuYmluZChudWxsLCBjbGllbnQsIGNvbm5lY3Rpb24pKVxuICAgICAgICBjb25uZWN0aW9uLm9uKCdlbmQnLCBjbGllbnQuX2Nvbm5lY3Rpb25FcnJvckhhbmRsZXIuYmluZChudWxsLCBjbGllbnQsIGNvbm5lY3Rpb24pKVxuICAgICAgICByZXNvbHZlcihjb25uZWN0aW9uKVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gVXNlZCB0byBleHBsaWNpdGx5IGNsb3NlIGEgY29ubmVjdGlvbiwgY2FsbGVkIGludGVybmFsbHkgYnkgdGhlIHBvb2xcbiAgLy8gd2hlbiBhIGNvbm5lY3Rpb24gdGltZXMgb3V0IG9yIHRoZSBwb29sIGlzIHNodXRkb3duLlxuICBkZXN0cm95UmF3Q29ubmVjdGlvbihjb25uZWN0aW9uLCBjYikge1xuICAgIGNvbm5lY3Rpb24uZW5kKGNiKTtcbiAgfSxcblxuICAvLyBHcmFiIGEgY29ubmVjdGlvbiwgcnVuIHRoZSBxdWVyeSB2aWEgdGhlIE15U1FMIHN0cmVhbWluZyBpbnRlcmZhY2UsXG4gIC8vIGFuZCBwYXNzIHRoYXQgdGhyb3VnaCB0byB0aGUgc3RyZWFtIHdlJ3ZlIHNlbnQgYmFjayB0byB0aGUgY2xpZW50LlxuICBfc3RyZWFtKGNvbm5lY3Rpb24sIG9iaiwgc3RyZWFtLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZXIsIHJlamVjdGVyKSB7XG4gICAgICBzdHJlYW0ub24oJ2Vycm9yJywgcmVqZWN0ZXIpXG4gICAgICBzdHJlYW0ub24oJ2VuZCcsIHJlc29sdmVyKVxuICAgICAgY29ubmVjdGlvbi5xdWVyeShvYmouc3FsLCBvYmouYmluZGluZ3MpLnN0cmVhbShvcHRpb25zKS5waXBlKHN0cmVhbSlcbiAgICB9KVxuICB9LFxuXG4gIC8vIFJ1bnMgdGhlIHF1ZXJ5IG9uIHRoZSBzcGVjaWZpZWQgY29ubmVjdGlvbiwgcHJvdmlkaW5nIHRoZSBiaW5kaW5nc1xuICAvLyBhbmQgYW55IG90aGVyIG5lY2Vzc2FyeSBwcmVwIHdvcmsuXG4gIF9xdWVyeShjb25uZWN0aW9uLCBvYmopIHtcbiAgICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqID09PSAnc3RyaW5nJykgb2JqID0ge3NxbDogb2JqfVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlciwgcmVqZWN0ZXIpIHtcbiAgICAgIGxldCB7IHNxbCB9ID0gb2JqXG4gICAgICBpZiAoIXNxbCkgcmV0dXJuIHJlc29sdmVyKClcbiAgICAgIGlmIChvYmoub3B0aW9ucykgc3FsID0gYXNzaWduKHtzcWx9LCBvYmoub3B0aW9ucylcbiAgICAgIGNvbm5lY3Rpb24ucXVlcnkoc3FsLCBvYmouYmluZGluZ3MsIGZ1bmN0aW9uKGVyciwgcm93cywgZmllbGRzKSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3RlcihlcnIpXG4gICAgICAgIG9iai5yZXNwb25zZSA9IFtyb3dzLCBmaWVsZHNdXG4gICAgICAgIHJlc29sdmVyKG9iailcbiAgICAgIH0pXG4gICAgfSlcbiAgfSxcblxuICAvLyBQcm9jZXNzIHRoZSByZXNwb25zZSBhcyByZXR1cm5lZCBmcm9tIHRoZSBxdWVyeS5cbiAgcHJvY2Vzc1Jlc3BvbnNlKG9iaiwgcnVubmVyKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm47XG4gICAgY29uc3QgeyByZXNwb25zZSB9ID0gb2JqXG4gICAgY29uc3QgeyBtZXRob2QgfSA9IG9ialxuICAgIGNvbnN0IHJvd3MgPSByZXNwb25zZVswXVxuICAgIGNvbnN0IGZpZWxkcyA9IHJlc3BvbnNlWzFdXG4gICAgaWYgKG9iai5vdXRwdXQpIHJldHVybiBvYmoub3V0cHV0LmNhbGwocnVubmVyLCByb3dzLCBmaWVsZHMpXG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICBjYXNlICdwbHVjayc6XG4gICAgICBjYXNlICdmaXJzdCc6IHtcbiAgICAgICAgY29uc3QgcmVzcCA9IGhlbHBlcnMuc2tpbShyb3dzKVxuICAgICAgICBpZiAobWV0aG9kID09PSAncGx1Y2snKSByZXR1cm4gbWFwKHJlc3AsIG9iai5wbHVjaylcbiAgICAgICAgcmV0dXJuIG1ldGhvZCA9PT0gJ2ZpcnN0JyA/IHJlc3BbMF0gOiByZXNwXG4gICAgICB9XG4gICAgICBjYXNlICdpbnNlcnQnOlxuICAgICAgICByZXR1cm4gW3Jvd3MuaW5zZXJ0SWRdXG4gICAgICBjYXNlICdkZWwnOlxuICAgICAgY2FzZSAndXBkYXRlJzpcbiAgICAgIGNhc2UgJ2NvdW50ZXInOlxuICAgICAgICByZXR1cm4gcm93cy5hZmZlY3RlZFJvd3NcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiByZXNwb25zZVxuICAgIH1cbiAgfSxcblxuICAvLyBNeVNRTCBTcGVjaWZpYyBlcnJvciBoYW5kbGVyXG4gIF9jb25uZWN0aW9uRXJyb3JIYW5kbGVyOiAoY2xpZW50LCBjb25uZWN0aW9uLCBlcnIpID0+IHtcbiAgICBpZihjb25uZWN0aW9uICYmIGVyciAmJiBlcnIuZmF0YWwgJiYgIWNvbm5lY3Rpb24uX19rbmV4X19kaXNwb3NlZCkge1xuICAgICAgY29ubmVjdGlvbi5fX2tuZXhfX2Rpc3Bvc2VkID0gdHJ1ZTtcbiAgICAgIGNsaWVudC5wb29sLmRlc3Ryb3koY29ubmVjdGlvbik7XG4gICAgfVxuICB9LFxuXG4gIHBpbmcocmVzb3VyY2UsIGNhbGxiYWNrKSB7XG4gICAgcmVzb3VyY2UucXVlcnkoJ1NFTEVDVCAxJywgY2FsbGJhY2spO1xuICB9LFxuXG4gIGNhbkNhbmNlbFF1ZXJ5OiB0cnVlLFxuXG4gIGNhbmNlbFF1ZXJ5KGNvbm5lY3Rpb25Ub0tpbGwpIHtcbiAgICBjb25zdCBhY3F1aXJpbmdDb25uID0gdGhpcy5hY3F1aXJlQ29ubmVjdGlvbigpLmNvbXBsZXRlZFxuXG4gICAgLy8gRXJyb3Igb3V0IGlmIHdlIGNhbid0IGFjcXVpcmUgY29ubmVjdGlvbiBpbiB0aW1lLlxuICAgIC8vIFB1cnBvc2VseSBub3QgcHV0dGluZyB0aW1lb3V0IG9uIGBLSUxMIFFVRVJZYCBleGVjdXRpb24gYmVjYXVzZSBlcnJvcmluZ1xuICAgIC8vIGVhcmx5IHRoZXJlIHdvdWxkIHJlbGVhc2UgdGhlIGBjb25uZWN0aW9uVG9LaWxsYCBiYWNrIHRvIHRoZSBwb29sIHdpdGhcbiAgICAvLyBhIGBLSUxMIFFVRVJZYCBjb21tYW5kIHlldCB0byBmaW5pc2guXG4gICAgcmV0dXJuIGFjcXVpcmluZ0Nvbm5cbiAgICAgIC50aW1lb3V0KDEwMClcbiAgICAgIC50aGVuKChjb25uKSA9PiB0aGlzLnF1ZXJ5KGNvbm4sIHtcbiAgICAgICAgbWV0aG9kOiAncmF3JyxcbiAgICAgICAgc3FsOiAnS0lMTCBRVUVSWSA/JyxcbiAgICAgICAgYmluZGluZ3M6IFtjb25uZWN0aW9uVG9LaWxsLnRocmVhZElkXSxcbiAgICAgICAgb3B0aW9uczoge30sXG4gICAgICB9KSlcbiAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgLy8gTk9UIHJldHVybmluZyB0aGlzIHByb21pc2UgYmVjYXVzZSB3ZSB3YW50IHRvIHJlbGVhc2UgdGhlIGNvbm5lY3Rpb25cbiAgICAgICAgLy8gaW4gYSBub24tYmxvY2tpbmcgZmFzaGlvblxuICAgICAgICBhY3F1aXJpbmdDb25uXG4gICAgICAgICAgLnRoZW4oKGNvbm4pID0+IHRoaXMucmVsZWFzZUNvbm5lY3Rpb24oY29ubikpO1xuICAgICAgfSk7XG4gIH1cblxufSlcblxuZXhwb3J0IGRlZmF1bHQgQ2xpZW50X015U1FMXG4iXX0=