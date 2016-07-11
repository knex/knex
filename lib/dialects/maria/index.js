
// MariaSQL Client
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

var _queryString = require('../../query/string');

var _queryString2 = _interopRequireDefault(_queryString);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _lodash = require('lodash');

function Client_MariaSQL(config) {
  _mysql2['default'].call(this, config);
}
_inherits2['default'](Client_MariaSQL, _mysql2['default']);

_lodash.assign(Client_MariaSQL.prototype, {

  dialect: 'mariadb',

  driverName: 'mariasql',

  Transaction: _transaction2['default'],

  _driver: function _driver() {
    return require('mariasql');
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var connection = new this.driver();
    connection.connect(_lodash.assign({ metadata: true }, this.connectionSettings));
    return new _promise2['default'](function (resolver, rejecter) {
      connection.on('ready', function () {
        connection.removeAllListeners('end');
        connection.removeAllListeners('error');
        resolver(connection);
      }).on('error', rejecter);
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.end();
    cb();
  },

  // Return the database for the MariaSQL client.
  database: function database() {
    return this.connectionSettings.db;
  },

  // Grab a connection, run the query via the MariaSQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream: function _stream(connection, sql, stream) {
    return new _promise2['default'](function (resolver, rejecter) {
      connection.query(sql.sql, sql.bindings).on('result', function (res) {
        res.on('error', rejecter).on('end', function () {
          resolver(res.info);
        }).on('data', function (data) {
          stream.write(handleRow(data, res.info.metadata));
        });
      }).on('error', rejecter);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    var tz = this.connectionSettings.timezone || 'local';
    return new _promise2['default'](function (resolver, rejecter) {
      if (!obj.sql) return resolver();
      var sql = _queryString2['default'].format(obj.sql, obj.bindings, tz);
      connection.query(sql, function (err, rows) {
        if (err) {
          return rejecter(err);
        }
        handleRows(rows, rows.info.metadata);
        obj.response = [rows, rows.info];
        resolver(obj);
      });
    });
  },

  // Process the response as returned from the query.
  processResponse: function processResponse(obj, runner) {
    var response = obj.response;
    var method = obj.method;

    var rows = response[0];
    var data = response[1];
    if (obj.output) return obj.output.call(runner, rows /*, fields*/);
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
        return [data.insertId];
      case 'del':
      case 'update':
      case 'counter':
        return parseInt(data.affectedRows, 10);
      default:
        return response;
    }
  },

  ping: function ping(resource, callback) {
    resource.query('SELECT 1', callback);
  }

});

function parseType(value, type) {
  switch (type) {
    case 'DATETIME':
    case 'TIMESTAMP':
      return new Date(value);
    case 'INTEGER':
      return parseInt(value, 10);
    default:
      return value;
  }
}

function handleRow(row, metadata) {
  var keys = Object.keys(metadata);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var type = metadata[key].type;

    row[key] = parseType(row[key], type);
  }
  return row;
}

function handleRows(rows, metadata) {
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    handleRow(row, metadata);
  }
  return rows;
}

exports['default'] = Client_MariaSQL;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9tYXJpYS9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozt3QkFHcUIsVUFBVTs7OztxQkFDTixVQUFVOzs7O3VCQUNmLGVBQWU7Ozs7MkJBQ2Isb0JBQW9COzs7O3VCQUNqQixlQUFlOztJQUE1QixPQUFPOzsyQkFDSyxlQUFlOzs7O3NCQUVYLFFBQVE7O0FBRXBDLFNBQVMsZUFBZSxDQUFDLE1BQU0sRUFBRTtBQUMvQixxQkFBYSxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO0NBQ2hDO0FBQ0Qsc0JBQVMsZUFBZSxxQkFBZSxDQUFBOztBQUV2QyxlQUFPLGVBQWUsQ0FBQyxTQUFTLEVBQUU7O0FBRWhDLFNBQU8sRUFBRSxTQUFTOztBQUVsQixZQUFVLEVBQUUsVUFBVTs7QUFFdEIsYUFBVywwQkFBQTs7QUFFWCxTQUFPLEVBQUEsbUJBQUc7QUFDUixXQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQTtHQUMzQjs7OztBQUlELHNCQUFvQixFQUFBLGdDQUFHO0FBQ3JCLFFBQU0sVUFBVSxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3JDLGNBQVUsQ0FBQyxPQUFPLENBQUMsZUFBTyxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO0FBQ3RFLFdBQU8seUJBQVksVUFBUyxRQUFRLEVBQUUsUUFBUSxFQUFFO0FBQzlDLGdCQUFVLENBQ1AsRUFBRSxDQUFDLE9BQU8sRUFBRSxZQUFXO0FBQ3RCLGtCQUFVLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDckMsa0JBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN2QyxnQkFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO09BQ3RCLENBQUMsQ0FDRCxFQUFFLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFD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LEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDWixJQUFJLEdBQUssUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUF0QixJQUFJOztBQUNaLE9BQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQ3RDO0FBQ0QsU0FBTyxHQUFHLENBQUM7Q0FDWjs7QUFFRCxTQUFTLFVBQVUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO0FBQ2xDLE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3BDLFFBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQixhQUFTLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0dBQzFCO0FBQ0QsU0FBTyxJQUFJLENBQUM7Q0FDYjs7cUJBRWMsZUFBZSIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8gTWFyaWFTUUwgQ2xpZW50XG4vLyAtLS0tLS0tXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuaW1wb3J0IENsaWVudF9NeVNRTCBmcm9tICcuLi9teXNxbCc7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICcuLi8uLi9wcm9taXNlJztcbmltcG9ydCBTcWxTdHJpbmcgZnJvbSAnLi4vLi4vcXVlcnkvc3RyaW5nJztcbmltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi4vLi4vaGVscGVycyc7XG5pbXBvcnQgVHJhbnNhY3Rpb24gZnJvbSAnLi90cmFuc2FjdGlvbic7XG5cbmltcG9ydCB7IGFzc2lnbiwgbWFwIH0gZnJvbSAnbG9kYXNoJ1xuXG5mdW5jdGlvbiBDbGllbnRfTWFyaWFTUUwoY29uZmlnKSB7XG4gIENsaWVudF9NeVNRTC5jYWxsKHRoaXMsIGNvbmZpZylcbn1cbmluaGVyaXRzKENsaWVudF9NYXJpYVNRTCwgQ2xpZW50X015U1FMKVxuXG5hc3NpZ24oQ2xpZW50X01hcmlhU1FMLnByb3RvdHlwZSwge1xuXG4gIGRpYWxlY3Q6ICdtYXJpYWRiJyxcblxuICBkcml2ZXJOYW1lOiAnbWFyaWFzcWwnLFxuXG4gIFRyYW5zYWN0aW9uLFxuXG4gIF9kcml2ZXIoKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJ21hcmlhc3FsJylcbiAgfSxcblxuICAvLyBHZXQgYSByYXcgY29ubmVjdGlvbiwgY2FsbGVkIGJ5IHRoZSBgcG9vbGAgd2hlbmV2ZXIgYSBuZXdcbiAgLy8gY29ubmVjdGlvbiBuZWVkcyB0byBiZSBhZGRlZCB0byB0aGUgcG9vbC5cbiAgYWNxdWlyZVJhd0Nvbm5lY3Rpb24oKSB7XG4gICAgY29uc3QgY29ubmVjdGlvbiA9IG5ldyB0aGlzLmRyaXZlcigpO1xuICAgIGNvbm5lY3Rpb24uY29ubmVjdChhc3NpZ24oe21ldGFkYXRhOiB0cnVlfSwgdGhpcy5jb25uZWN0aW9uU2V0dGluZ3MpKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZXIsIHJlamVjdGVyKSB7XG4gICAgICBjb25uZWN0aW9uXG4gICAgICAgIC5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjb25uZWN0aW9uLnJlbW92ZUFsbExpc3RlbmVycygnZW5kJyk7XG4gICAgICAgICAgY29ubmVjdGlvbi5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2Vycm9yJyk7XG4gICAgICAgICAgcmVzb2x2ZXIoY29ubmVjdGlvbik7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignZXJyb3InLCByZWplY3Rlcik7XG4gICAgfSlcbiAgfSxcblxuICAvLyBVc2VkIHRvIGV4cGxpY2l0bHkgY2xvc2UgYSBjb25uZWN0aW9uLCBjYWxsZWQgaW50ZXJuYWxseSBieSB0aGUgcG9vbFxuICAvLyB3aGVuIGEgY29ubmVjdGlvbiB0aW1lcyBvdXQgb3IgdGhlIHBvb2wgaXMgc2h1dGRvd24uXG4gIGRlc3Ryb3lSYXdDb25uZWN0aW9uKGNvbm5lY3Rpb24sIGNiKSB7XG4gICAgY29ubmVjdGlvbi5lbmQoKVxuICAgIGNiKClcbiAgfSxcblxuICAvLyBSZXR1cm4gdGhlIGRhdGFiYXNlIGZvciB0aGUgTWFyaWFTUUwgY2xpZW50LlxuICBkYXRhYmFzZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uU2V0dGluZ3MuZGI7XG4gIH0sXG5cbiAgLy8gR3JhYiBhIGNvbm5lY3Rpb24sIHJ1biB0aGUgcXVlcnkgdmlhIHRoZSBNYXJpYVNRTCBzdHJlYW1pbmcgaW50ZXJmYWNlLFxuICAvLyBhbmQgcGFzcyB0aGF0IHRocm91Z2ggdG8gdGhlIHN0cmVhbSB3ZSd2ZSBzZW50IGJhY2sgdG8gdGhlIGNsaWVudC5cbiAgX3N0cmVhbShjb25uZWN0aW9uLCBzcWwsIHN0cmVhbSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlciwgcmVqZWN0ZXIpIHtcbiAgICAgIGNvbm5lY3Rpb24ucXVlcnkoc3FsLnNxbCwgc3FsLmJpbmRpbmdzKVxuICAgICAgICAub24oJ3Jlc3VsdCcsIGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHJlc1xuICAgICAgICAgICAgLm9uKCdlcnJvcicsIHJlamVjdGVyKVxuICAgICAgICAgICAgLm9uKCdlbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIocmVzLmluZm8pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbignZGF0YScsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgIHN0cmVhbS53cml0ZShoYW5kbGVSb3coZGF0YSwgcmVzLmluZm8ubWV0YWRhdGEpKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICAgIC5vbignZXJyb3InLCByZWplY3Rlcik7XG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gUnVucyB0aGUgcXVlcnkgb24gdGhlIHNwZWNpZmllZCBjb25uZWN0aW9uLCBwcm92aWRpbmcgdGhlIGJpbmRpbmdzXG4gIC8vIGFuZCBhbnkgb3RoZXIgbmVjZXNzYXJ5IHByZXAgd29yay5cbiAgX3F1ZXJ5KGNvbm5lY3Rpb24sIG9iaikge1xuICAgIGNvbnN0IHR6ID0gdGhpcy5jb25uZWN0aW9uU2V0dGluZ3MudGltZXpvbmUgfHwgJ2xvY2FsJztcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZXIsIHJlamVjdGVyKSB7XG4gICAgICBpZiAoIW9iai5zcWwpIHJldHVybiByZXNvbHZlcigpXG4gICAgICBjb25zdCBzcWwgPSBTcWxTdHJpbmcuZm9ybWF0KG9iai5zcWwsIG9iai5iaW5kaW5ncywgdHopO1xuICAgICAgY29ubmVjdGlvbi5xdWVyeShzcWwsIGZ1bmN0aW9uIChlcnIsIHJvd3MpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiByZWplY3RlcihlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGhhbmRsZVJvd3Mocm93cywgcm93cy5pbmZvLm1ldGFkYXRhKTtcbiAgICAgICAgb2JqLnJlc3BvbnNlID0gW3Jvd3MsIHJvd3MuaW5mb107XG4gICAgICAgIHJlc29sdmVyKG9iaik7XG4gICAgICB9KVxuICAgIH0pO1xuICB9LFxuXG4gIC8vIFByb2Nlc3MgdGhlIHJlc3BvbnNlIGFzIHJldHVybmVkIGZyb20gdGhlIHF1ZXJ5LlxuICBwcm9jZXNzUmVzcG9uc2Uob2JqLCBydW5uZXIpIHtcbiAgICBjb25zdCB7IHJlc3BvbnNlIH0gPSBvYmo7XG4gICAgY29uc3QgeyBtZXRob2QgfSA9IG9iajtcbiAgICBjb25zdCByb3dzID0gcmVzcG9uc2VbMF07XG4gICAgY29uc3QgZGF0YSA9IHJlc3BvbnNlWzFdO1xuICAgIGlmIChvYmoub3V0cHV0KSByZXR1cm4gb2JqLm91dHB1dC5jYWxsKHJ1bm5lciwgcm93cy8qLCBmaWVsZHMqLyk7XG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICBjYXNlICdwbHVjayc6XG4gICAgICBjYXNlICdmaXJzdCc6IHtcbiAgICAgICAgY29uc3QgcmVzcCA9IGhlbHBlcnMuc2tpbShyb3dzKTtcbiAgICAgICAgaWYgKG1ldGhvZCA9PT0gJ3BsdWNrJykgcmV0dXJuIG1hcChyZXNwLCBvYmoucGx1Y2spO1xuICAgICAgICByZXR1cm4gbWV0aG9kID09PSAnZmlyc3QnID8gcmVzcFswXSA6IHJlc3A7XG4gICAgICB9XG4gICAgICBjYXNlICdpbnNlcnQnOlxuICAgICAgICByZXR1cm4gW2RhdGEuaW5zZXJ0SWRdO1xuICAgICAgY2FzZSAnZGVsJzpcbiAgICAgIGNhc2UgJ3VwZGF0ZSc6XG4gICAgICBjYXNlICdjb3VudGVyJzpcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KGRhdGEuYWZmZWN0ZWRSb3dzLCAxMCk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfVxuICB9LFxuXG4gIHBpbmcocmVzb3VyY2UsIGNhbGxiYWNrKSB7XG4gICAgcmVzb3VyY2UucXVlcnkoJ1NFTEVDVCAxJywgY2FsbGJhY2spO1xuICB9XG5cbn0pXG5cbmZ1bmN0aW9uIHBhcnNlVHlwZSh2YWx1ZSwgdHlwZSkge1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICdEQVRFVElNRSc6XG4gICAgY2FzZSAnVElNRVNUQU1QJzpcbiAgICAgIHJldHVybiBuZXcgRGF0ZSh2YWx1ZSk7XG4gICAgY2FzZSAnSU5URUdFUic6XG4gICAgICByZXR1cm4gcGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVJvdyhyb3csIG1ldGFkYXRhKSB7XG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhtZXRhZGF0YSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IGtleXNbaV07XG4gICAgY29uc3QgeyB0eXBlIH0gPSBtZXRhZGF0YVtrZXldO1xuICAgIHJvd1trZXldID0gcGFyc2VUeXBlKHJvd1trZXldLCB0eXBlKTtcbiAgfVxuICByZXR1cm4gcm93O1xufVxuXG5mdW5jdGlvbiBoYW5kbGVSb3dzKHJvd3MsIG1ldGFkYXRhKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm93cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJvdyA9IHJvd3NbaV07XG4gICAgaGFuZGxlUm93KHJvdywgbWV0YWRhdGEpO1xuICB9XG4gIHJldHVybiByb3dzO1xufVxuXG5leHBvcnQgZGVmYXVsdCBDbGllbnRfTWFyaWFTUUxcbiJdfQ==