
// PostgreSQL
// -------
'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _client = require('../../client');

var _client2 = _interopRequireDefault(_client);

var _promise = require('../../promise');

var _promise2 = _interopRequireDefault(_promise);

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

var _queryCompiler = require('./query/compiler');

var _queryCompiler2 = _interopRequireDefault(_queryCompiler);

var _schemaColumncompiler = require('./schema/columncompiler');

var _schemaColumncompiler2 = _interopRequireDefault(_schemaColumncompiler);

var _schemaTablecompiler = require('./schema/tablecompiler');

var _schemaTablecompiler2 = _interopRequireDefault(_schemaTablecompiler);

var _schemaCompiler = require('./schema/compiler');

var _schemaCompiler2 = _interopRequireDefault(_schemaCompiler);

function Client_PG(config) {
  _client2['default'].apply(this, arguments);
  if (config.returning) {
    this.defaultReturning = config.returning;
  }

  if (config.searchPath) {
    this.searchPath = config.searchPath;
  }
}
_inherits2['default'](Client_PG, _client2['default']);

_lodash.assign(Client_PG.prototype, {

  QueryCompiler: _queryCompiler2['default'],

  ColumnCompiler: _schemaColumncompiler2['default'],

  SchemaCompiler: _schemaCompiler2['default'],

  TableCompiler: _schemaTablecompiler2['default'],

  dialect: 'postgresql',

  driverName: 'pg',

  _driver: function _driver() {
    return require('pg');
  },

  wrapIdentifier: function wrapIdentifier(value) {
    if (value === '*') return value;
    var matched = value.match(/(.*?)(\[[0-9]\])/);
    if (matched) return this.wrapIdentifier(matched[1]) + matched[2];
    return '"' + value.replace(/"/g, '""') + '"';
  },

  // Prep the bindings as needed by PostgreSQL.
  prepBindings: function prepBindings(bindings, tz) {
    var _this = this;

    return _lodash.map(bindings, function (binding) {
      return utils.prepareValue(binding, tz, _this.valueForUndefined);
    });
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    return new _promise2['default'](function (resolver, rejecter) {
      var connection = new client.driver.Client(client.connectionSettings);
      connection.connect(function (err, connection) {
        if (err) return rejecter(err);
        connection.on('error', client.__endConnection.bind(client, connection));
        connection.on('end', client.__endConnection.bind(client, connection));
        if (!client.version) {
          return client.checkVersion(connection).then(function (version) {
            client.version = version;
            resolver(connection);
          });
        }
        resolver(connection);
      });
    }).tap(function setSearchPath(connection) {
      return client.setSchemaSearchPath(connection);
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.end();
    cb();
  },

  // In PostgreSQL, we need to do a version check to do some feature
  // checking on the database.
  checkVersion: function checkVersion(connection) {
    return new _promise2['default'](function (resolver, rejecter) {
      connection.query('select version();', function (err, resp) {
        if (err) return rejecter(err);
        resolver(/^PostgreSQL (.*?)( |$)/.exec(resp.rows[0].version)[1]);
      });
    });
  },

  // Position the bindings for the query. The escape sequence for question mark
  // is \? (e.g. knex.raw("\\?") since javascript requires '\' to be escaped too...)
  positionBindings: function positionBindings(sql) {
    var questionCount = 0;
    return sql.replace(/(\\*)(\?)/g, function (match, escapes) {
      if (escapes.length % 2) {
        return '?';
      } else {
        questionCount++;
        return '$' + questionCount;
      }
    });
  },

  setSchemaSearchPath: function setSchemaSearchPath(connection, searchPath) {
    var path = searchPath || this.searchPath;

    if (!path) return _promise2['default'].resolve(true);

    return new _promise2['default'](function (resolver, rejecter) {
      connection.query('set search_path to ' + path, function (err) {
        if (err) return rejecter(err);
        resolver(true);
      });
    });
  },

  _stream: function _stream(connection, obj, stream, options) {
    var PGQueryStream = process.browser ? undefined : require('pg-query-stream');
    var sql = obj.sql = this.positionBindings(obj.sql);
    return new _promise2['default'](function (resolver, rejecter) {
      var queryStream = connection.query(new PGQueryStream(sql, obj.bindings, options));
      queryStream.on('error', rejecter);
      // 'error' is not propagated by .pipe, but it breaks the pipe
      stream.on('error', rejecter);
      // 'end' IS propagated by .pipe, by default
      stream.on('end', resolver);
      queryStream.pipe(stream);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    var sql = obj.sql = this.positionBindings(obj.sql);
    if (obj.options) sql = _lodash.extend({ text: sql }, obj.options);
    return new _promise2['default'](function (resolver, rejecter) {
      connection.query(sql, obj.bindings, function (err, response) {
        if (err) return rejecter(err);
        obj.response = response;
        resolver(obj);
      });
    });
  },

  // Ensures the response is returned in the same format as other clients.
  processResponse: function processResponse(obj, runner) {
    var resp = obj.response;
    if (obj.output) return obj.output.call(runner, resp);
    if (obj.method === 'raw') return resp;
    var returning = obj.returning;

    if (resp.command === 'SELECT') {
      if (obj.method === 'first') return resp.rows[0];
      if (obj.method === 'pluck') return _lodash.map(resp.rows, obj.pluck);
      return resp.rows;
    }
    if (returning) {
      var returns = [];
      for (var i = 0, l = resp.rows.length; i < l; i++) {
        var row = resp.rows[i];
        if (returning === '*' || Array.isArray(returning)) {
          returns[i] = row;
        } else {
          returns[i] = row[returning];
        }
      }
      return returns;
    }
    if (resp.command === 'UPDATE' || resp.command === 'DELETE') {
      return resp.rowCount;
    }
    return resp;
  },

  __endConnection: function __endConnection(connection) {
    if (!connection || connection.__knex__disposed) return;
    if (this.pool) {
      connection.__knex__disposed = true;
      this.pool.destroy(connection);
    }
  },

  ping: function ping(resource, callback) {
    resource.query('SELECT 1', [], callback);
  }

});

exports['default'] = Client_PG;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9wb3N0Z3Jlcy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztzQkFHb0MsUUFBUTs7d0JBQ3ZCLFVBQVU7Ozs7c0JBQ1osY0FBYzs7Ozt1QkFDYixlQUFlOzs7O3FCQUNaLFNBQVM7O0lBQXBCLEtBQUs7OzZCQUVTLGtCQUFrQjs7OztvQ0FDakIseUJBQXlCOzs7O21DQUMxQix3QkFBd0I7Ozs7OEJBQ3ZCLG1CQUFtQjs7OztBQUU5QyxTQUFTLFNBQVMsQ0FBQyxNQUFNLEVBQUU7QUFDekIsc0JBQU8sS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQTtBQUM3QixNQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUU7QUFDcEIsUUFBSSxDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7R0FDMUM7O0FBRUQsTUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFO0FBQ3JCLFFBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztHQUNyQztDQUNGO0FBQ0Qsc0JBQVMsU0FBUyxzQkFBUyxDQUFBOztBQUUzQixlQUFPLFNBQVMsQ0FBQyxTQUFTLEVBQUU7O0FBRTFCLGVBQWEsNEJBQUE7O0FBRWIsZ0JBQWMsbUNBQUE7O0FBRWQsZ0JBQWMsNkJBQUE7O0FBRWQsZUFBYSxrQ0FBQTs7QUFFYixTQUFPLEVBQUUsWUFBWTs7QUFFckIsWUFBVSxFQUFFLElBQUk7O0FBRWhCLFNBQU8sRUFBQSxtQkFBRztBQUNSLFdBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBO0dBQ3JCOztBQUVELGdCQUFjLEVBQUEsd0JBQUMsS0FBSyxFQUFFO0FBQ3BCLFFBQUksS0FBSyxLQUFLLEdBQUcsRUFBRSxPQUFPLEtBQUssQ0FBQztBQUNoQyxRQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDaEQsUUFBSSxPQUFPLEVBQUUsT0FBTyxJ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QVUsQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPO0FBQ3ZELFFBQUksSUFBSSxDQUFDLElBQUksRUFBRTtBQUNiLGdCQUFVLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0FBQ25DLFVBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQy9CO0dBQ0Y7O0FBRUQsTUFBSSxFQUFBLGNBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRTtBQUN2QixZQUFRLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7R0FDMUM7O0NBR0YsQ0FBQyxDQUFBOztxQkFFYSxTQUFTIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBQb3N0Z3JlU1FMXG4vLyAtLS0tLS0tXG5pbXBvcnQgeyBhc3NpZ24sIG1hcCwgZXh0ZW5kIH0gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcbmltcG9ydCBDbGllbnQgZnJvbSAnLi4vLi4vY2xpZW50JztcbmltcG9ydCBQcm9taXNlIGZyb20gJy4uLy4uL3Byb21pc2UnO1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi91dGlscyc7XG5cbmltcG9ydCBRdWVyeUNvbXBpbGVyIGZyb20gJy4vcXVlcnkvY29tcGlsZXInO1xuaW1wb3J0IENvbHVtbkNvbXBpbGVyIGZyb20gJy4vc2NoZW1hL2NvbHVtbmNvbXBpbGVyJztcbmltcG9ydCBUYWJsZUNvbXBpbGVyIGZyb20gJy4vc2NoZW1hL3RhYmxlY29tcGlsZXInO1xuaW1wb3J0IFNjaGVtYUNvbXBpbGVyIGZyb20gJy4vc2NoZW1hL2NvbXBpbGVyJztcblxuZnVuY3Rpb24gQ2xpZW50X1BHKGNvbmZpZykge1xuICBDbGllbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICBpZiAoY29uZmlnLnJldHVybmluZykge1xuICAgIHRoaXMuZGVmYXVsdFJldHVybmluZyA9IGNvbmZpZy5yZXR1cm5pbmc7XG4gIH1cblxuICBpZiAoY29uZmlnLnNlYXJjaFBhdGgpIHtcbiAgICB0aGlzLnNlYXJjaFBhdGggPSBjb25maWcuc2VhcmNoUGF0aDtcbiAgfVxufVxuaW5oZXJpdHMoQ2xpZW50X1BHLCBDbGllbnQpXG5cbmFzc2lnbihDbGllbnRfUEcucHJvdG90eXBlLCB7XG5cbiAgUXVlcnlDb21waWxlcixcblxuICBDb2x1bW5Db21waWxlcixcblxuICBTY2hlbWFDb21waWxlcixcblxuICBUYWJsZUNvbXBpbGVyLFxuXG4gIGRpYWxlY3Q6ICdwb3N0Z3Jlc3FsJyxcblxuICBkcml2ZXJOYW1lOiAncGcnLFxuXG4gIF9kcml2ZXIoKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJ3BnJylcbiAgfSxcblxuICB3cmFwSWRlbnRpZmllcih2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gJyonKSByZXR1cm4gdmFsdWU7XG4gICAgY29uc3QgbWF0Y2hlZCA9IHZhbHVlLm1hdGNoKC8oLio/KShcXFtbMC05XVxcXSkvKTtcbiAgICBpZiAobWF0Y2hlZCkgcmV0dXJuIHRoaXMud3JhcElkZW50aWZpZXIobWF0Y2hlZFsxXSkgKyBtYXRjaGVkWzJdO1xuICAgIHJldHVybiBgXCIke3ZhbHVlLnJlcGxhY2UoL1wiL2csICdcIlwiJyl9XCJgO1xuICB9LFxuXG4gIC8vIFByZXAgdGhlIGJpbmRpbmdzIGFzIG5lZWRlZCBieSBQb3N0Z3JlU1FMLlxuICBwcmVwQmluZGluZ3MoYmluZGluZ3MsIHR6KSB7XG4gICAgcmV0dXJuIG1hcChiaW5kaW5ncywgKGJpbmRpbmcpID0+IHtcbiAgICAgIHJldHVybiB1dGlscy5wcmVwYXJlVmFsdWUoYmluZGluZywgdHosIHRoaXMudmFsdWVGb3JVbmRlZmluZWQpXG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gR2V0IGEgcmF3IGNvbm5lY3Rpb24sIGNhbGxlZCBieSB0aGUgYHBvb2xgIHdoZW5ldmVyIGEgbmV3XG4gIC8vIGNvbm5lY3Rpb24gbmVlZHMgdG8gYmUgYWRkZWQgdG8gdGhlIHBvb2wuXG4gIGFjcXVpcmVSYXdDb25uZWN0aW9uKCkge1xuICAgIGNvbnN0IGNsaWVudCA9IHRoaXM7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmVyLCByZWplY3Rlcikge1xuICAgICAgY29uc3QgY29ubmVjdGlvbiA9IG5ldyBjbGllbnQuZHJpdmVyLkNsaWVudChjbGllbnQuY29ubmVjdGlvblNldHRpbmdzKTtcbiAgICAgIGNvbm5lY3Rpb24uY29ubmVjdChmdW5jdGlvbihlcnIsIGNvbm5lY3Rpb24pIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIHJlamVjdGVyKGVycik7XG4gICAgICAgIGNvbm5lY3Rpb24ub24oJ2Vycm9yJywgY2xpZW50Ll9fZW5kQ29ubmVjdGlvbi5iaW5kKGNsaWVudCwgY29ubmVjdGlvbikpO1xuICAgICAgICBjb25uZWN0aW9uLm9uKCdlbmQnLCBjbGllbnQuX19lbmRDb25uZWN0aW9uLmJpbmQoY2xpZW50LCBjb25uZWN0aW9uKSk7XG4gICAgICAgIGlmICghY2xpZW50LnZlcnNpb24pIHtcbiAgICAgICAgICByZXR1cm4gY2xpZW50LmNoZWNrVmVyc2lvbihjb25uZWN0aW9uKS50aGVuKGZ1bmN0aW9uKHZlcnNpb24pIHtcbiAgICAgICAgICAgIGNsaWVudC52ZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgICAgIHJlc29sdmVyKGNvbm5lY3Rpb24pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJlc29sdmVyKGNvbm5lY3Rpb24pO1xuICAgICAgfSk7XG4gICAgfSkudGFwKGZ1bmN0aW9uIHNldFNlYXJjaFBhdGgoY29ubmVjdGlvbikge1xuICAgICAgcmV0dXJuIGNsaWVudC5zZXRTY2hlbWFTZWFyY2hQYXRoKGNvbm5lY3Rpb24pO1xuICAgIH0pO1xuICB9LFxuXG4gIC8vIFVzZWQgdG8gZXhwbGljaXRseSBjbG9zZSBhIGNvbm5lY3Rpb24sIGNhbGxlZCBpbnRlcm5hbGx5IGJ5IHRoZSBwb29sXG4gIC8vIHdoZW4gYSBjb25uZWN0aW9uIHRpbWVzIG91dCBvciB0aGUgcG9vbCBpcyBzaHV0ZG93bi5cbiAgZGVzdHJveVJhd0Nvbm5lY3Rpb24oY29ubmVjdGlvbiwgY2IpIHtcbiAgICBjb25uZWN0aW9uLmVuZCgpXG4gICAgY2IoKVxuICB9LFxuXG4gIC8vIEluIFBvc3RncmVTUUwsIHdlIG5lZWQgdG8gZG8gYSB2ZXJzaW9uIGNoZWNrIHRvIGRvIHNvbWUgZmVhdHVyZVxuICAvLyBjaGVja2luZyBvbiB0aGUgZGF0YWJhc2UuXG4gIGNoZWNrVmVyc2lvbihjb25uZWN0aW9uKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmVyLCByZWplY3Rlcikge1xuICAgICAgY29ubmVjdGlvbi5xdWVyeSgnc2VsZWN0IHZlcnNpb24oKTsnLCBmdW5jdGlvbihlcnIsIHJlc3ApIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIHJlamVjdGVyKGVycik7XG4gICAgICAgIHJlc29sdmVyKC9eUG9zdGdyZVNRTCAoLio/KSggfCQpLy5leGVjKHJlc3Aucm93c1swXS52ZXJzaW9uKVsxXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICAvLyBQb3NpdGlvbiB0aGUgYmluZGluZ3MgZm9yIHRoZSBxdWVyeS4gVGhlIGVzY2FwZSBzZXF1ZW5jZSBmb3IgcXVlc3Rpb24gbWFya1xuICAvLyBpcyBcXD8gKGUuZy4ga25leC5yYXcoXCJcXFxcP1wiKSBzaW5jZSBqYXZhc2NyaXB0IHJlcXVpcmVzICdcXCcgdG8gYmUgZXNjYXBlZCB0b28uLi4pXG4gIHBvc2l0aW9uQmluZGluZ3Moc3FsKSB7XG4gICAgbGV0IHF1ZXN0aW9uQ291bnQgPSAwO1xuICAgIHJldHVybiBzcWwucmVwbGFjZSgvKFxcXFwqKShcXD8pL2csIGZ1bmN0aW9uIChtYXRjaCwgZXNjYXBlcykge1xuICAgICAgaWYgKGVzY2FwZXMubGVuZ3RoICUgMikge1xuICAgICAgICByZXR1cm4gJz8nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcXVlc3Rpb25Db3VudCsrO1xuICAgICAgICByZXR1cm4gYCQke3F1ZXN0aW9uQ291bnR9YDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBzZXRTY2hlbWFTZWFyY2hQYXRoKGNvbm5lY3Rpb24sIHNlYXJjaFBhdGgpIHtcbiAgICBjb25zdCBwYXRoID0gKHNlYXJjaFBhdGggfHwgdGhpcy5zZWFyY2hQYXRoKTtcblxuICAgIGlmICghcGF0aCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0cnVlKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlciwgcmVqZWN0ZXIpIHtcbiAgICAgIGNvbm5lY3Rpb24ucXVlcnkoYHNldCBzZWFyY2hfcGF0aCB0byAke3BhdGh9YCwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3RlcihlcnIpO1xuICAgICAgICByZXNvbHZlcih0cnVlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIF9zdHJlYW0oY29ubmVjdGlvbiwgb2JqLCBzdHJlYW0sIG9wdGlvbnMpIHtcbiAgICBjb25zdCBQR1F1ZXJ5U3RyZWFtID0gcHJvY2Vzcy5icm93c2VyID8gdW5kZWZpbmVkIDogcmVxdWlyZSgncGctcXVlcnktc3RyZWFtJyk7XG4gICAgY29uc3Qgc3FsID0gb2JqLnNxbCA9IHRoaXMucG9zaXRpb25CaW5kaW5ncyhvYmouc3FsKVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlciwgcmVqZWN0ZXIpIHtcbiAgICAgIGNvbnN0IHF1ZXJ5U3RyZWFtID0gY29ubmVjdGlvbi5xdWVyeShuZXcgUEdRdWVyeVN0cmVhbShzcWwsIG9iai5iaW5kaW5ncywgb3B0aW9ucykpO1xuICAgICAgcXVlcnlTdHJlYW0ub24oJ2Vycm9yJywgcmVqZWN0ZXIpO1xuICAgICAgLy8gJ2Vycm9yJyBpcyBub3QgcHJvcGFnYXRlZCBieSAucGlwZSwgYnV0IGl0IGJyZWFrcyB0aGUgcGlwZVxuICAgICAgc3RyZWFtLm9uKCdlcnJvcicsIHJlamVjdGVyKTtcbiAgICAgIC8vICdlbmQnIElTIHByb3BhZ2F0ZWQgYnkgLnBpcGUsIGJ5IGRlZmF1bHRcbiAgICAgIHN0cmVhbS5vbignZW5kJywgcmVzb2x2ZXIpO1xuICAgICAgcXVlcnlTdHJlYW0ucGlwZShzdHJlYW0pO1xuICAgIH0pO1xuICB9LFxuXG4gIC8vIFJ1bnMgdGhlIHF1ZXJ5IG9uIHRoZSBzcGVjaWZpZWQgY29ubmVjdGlvbiwgcHJvdmlkaW5nIHRoZSBiaW5kaW5nc1xuICAvLyBhbmQgYW55IG90aGVyIG5lY2Vzc2FyeSBwcmVwIHdvcmsuXG4gIF9xdWVyeShjb25uZWN0aW9uLCBvYmopIHtcbiAgICBsZXQgc3FsID0gb2JqLnNxbCA9IHRoaXMucG9zaXRpb25CaW5kaW5ncyhvYmouc3FsKVxuICAgIGlmIChvYmoub3B0aW9ucykgc3FsID0gZXh0ZW5kKHt0ZXh0OiBzcWx9LCBvYmoub3B0aW9ucyk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmVyLCByZWplY3Rlcikge1xuICAgICAgY29ubmVjdGlvbi5xdWVyeShzcWwsIG9iai5iaW5kaW5ncywgZnVuY3Rpb24oZXJyLCByZXNwb25zZSkge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gcmVqZWN0ZXIoZXJyKTtcbiAgICAgICAgb2JqLnJlc3BvbnNlID0gcmVzcG9uc2U7XG4gICAgICAgIHJlc29sdmVyKG9iaik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICAvLyBFbnN1cmVzIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZCBpbiB0aGUgc2FtZSBmb3JtYXQgYXMgb3RoZXIgY2xpZW50cy5cbiAgcHJvY2Vzc1Jlc3BvbnNlKG9iaiwgcnVubmVyKSB7XG4gICAgY29uc3QgcmVzcCA9IG9iai5yZXNwb25zZTtcbiAgICBpZiAob2JqLm91dHB1dCkgcmV0dXJuIG9iai5vdXRwdXQuY2FsbChydW5uZXIsIHJlc3ApO1xuICAgIGlmIChvYmoubWV0aG9kID09PSAncmF3JykgcmV0dXJuIHJlc3A7XG4gICAgY29uc3QgeyByZXR1cm5pbmcgfSA9IG9iajtcbiAgICBpZiAocmVzcC5jb21tYW5kID09PSAnU0VMRUNUJykge1xuICAgICAgaWYgKG9iai5tZXRob2QgPT09ICdmaXJzdCcpIHJldHVybiByZXNwLnJvd3NbMF07XG4gICAgICBpZiAob2JqLm1ldGhvZCA9PT0gJ3BsdWNrJykgcmV0dXJuIG1hcChyZXNwLnJvd3MsIG9iai5wbHVjayk7XG4gICAgICByZXR1cm4gcmVzcC5yb3dzO1xuICAgIH1cbiAgICBpZiAocmV0dXJuaW5nKSB7XG4gICAgICBjb25zdCByZXR1cm5zID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMCwgbCA9IHJlc3Aucm93cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgY29uc3Qgcm93ID0gcmVzcC5yb3dzW2ldO1xuICAgICAgICBpZiAocmV0dXJuaW5nID09PSAnKicgfHwgQXJyYXkuaXNBcnJheShyZXR1cm5pbmcpKSB7XG4gICAgICAgICAgcmV0dXJuc1tpXSA9IHJvdztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm5zW2ldID0gcm93W3JldHVybmluZ107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXR1cm5zO1xuICAgIH1cbiAgICBpZiAocmVzcC5jb21tYW5kID09PSAnVVBEQVRFJyB8fCByZXNwLmNvbW1hbmQgPT09ICdERUxFVEUnKSB7XG4gICAgICByZXR1cm4gcmVzcC5yb3dDb3VudDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3A7XG4gIH0sXG5cbiAgX19lbmRDb25uZWN0aW9uKGNvbm5lY3Rpb24pIHtcbiAgICBpZiAoIWNvbm5lY3Rpb24gfHwgY29ubmVjdGlvbi5fX2tuZXhfX2Rpc3Bvc2VkKSByZXR1cm47XG4gICAgaWYgKHRoaXMucG9vbCkge1xuICAgICAgY29ubmVjdGlvbi5fX2tuZXhfX2Rpc3Bvc2VkID0gdHJ1ZTtcbiAgICAgIHRoaXMucG9vbC5kZXN0cm95KGNvbm5lY3Rpb24pO1xuICAgIH1cbiAgfSxcblxuICBwaW5nKHJlc291cmNlLCBjYWxsYmFjaykge1xuICAgIHJlc291cmNlLnF1ZXJ5KCdTRUxFQ1QgMScsIFtdLCBjYWxsYmFjayk7XG4gIH1cblxuXG59KVxuXG5leHBvcnQgZGVmYXVsdCBDbGllbnRfUEdcbiJdfQ==