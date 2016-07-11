
// MSSQL Client
// -------
'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _formatter = require('./formatter');

var _formatter2 = _interopRequireDefault(_formatter);

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

var isArray = Array.isArray;

var SQL_INT4 = { MIN: -2147483648, MAX: 2147483647 };
var SQL_BIGINT_SAFE = { MIN: -9007199254740991, MAX: 9007199254740991 };

// Always initialize with the "QueryBuilder" and "QueryCompiler" objects, which
// extend the base 'lib/query/builder' and 'lib/query/compiler', respectively.
function Client_MSSQL(config) {
  // #1235 mssql module wants 'server', not 'host'. This is to enforce the same
  // options object across all dialects.
  if (config && config.connection && config.connection.host) {
    config.connection.server = config.connection.host;
  }
  _client2['default'].call(this, config);
}
_inherits2['default'](Client_MSSQL, _client2['default']);

_lodash.assign(Client_MSSQL.prototype, {

  dialect: 'mssql',

  driverName: 'mssql',

  _driver: function _driver() {
    return require('mssql');
  },

  Transaction: _transaction2['default'],

  Formatter: _formatter2['default'],

  QueryCompiler: _queryCompiler2['default'],

  SchemaCompiler: _schemaCompiler2['default'],

  TableCompiler: _schemaTablecompiler2['default'],

  ColumnCompiler: _schemaColumncompiler2['default'],

  wrapIdentifier: function wrapIdentifier(value) {
    return value !== '*' ? '[' + value.replace(/\[/g, '\[') + ']' : '*';
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    var connection = new this.driver.Connection(this.connectionSettings);
    return new _promise2['default'](function (resolver, rejecter) {
      connection.connect(function (err) {
        if (err) return rejecter(err);
        connection.on('error', connectionErrorHandler.bind(null, client, connection));
        connection.on('end', connectionErrorHandler.bind(null, client, connection));
        resolver(connection);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.close(cb);
  },

  // Position the bindings for the query.
  positionBindings: function positionBindings(sql) {
    var questionCount = -1;
    return sql.replace(/\?/g, function () {
      questionCount += 1;
      return '@p' + questionCount;
    });
  },

  // Grab a connection, run the query via the MSSQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream: function _stream(connection, obj, stream, options) {
    var client = this;
    options = options || {};
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    // convert ? params into positional bindings (@p1)
    obj.sql = this.positionBindings(obj.sql);
    return new _promise2['default'](function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      var _obj = obj;
      var sql = _obj.sql;

      if (!sql) return resolver();
      if (obj.options) {
        ;

        var _assign = _lodash.assign({ sql: sql }, obj.options);

        sql = _assign.sql;
      }var req = (connection.tx_ || connection).request();
      //req.verbose = true;
      req.multiple = true;
      req.stream = true;
      if (obj.bindings) {
        for (var i = 0; i < obj.bindings.length; i++) {
          client._setReqInput(req, i, obj.bindings[i]);
        }
      }
      req.pipe(stream);
      req.query(sql);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    var client = this;
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    // convert ? params into positional bindings (@p1)
    obj.sql = this.positionBindings(obj.sql);
    return new _promise2['default'](function (resolver, rejecter) {
      var _obj2 = obj;
      var sql = _obj2.sql;

      if (!sql) return resolver();
      if (obj.options) {
        ;

        var _assign2 = _lodash.assign({ sql: sql }, obj.options);

        sql = _assign2.sql;
      }var req = (connection.tx_ || connection).request();
      // req.verbose = true;
      req.multiple = true;
      if (obj.bindings) {
        for (var i = 0; i < obj.bindings.length; i++) {
          client._setReqInput(req, i, obj.bindings[i]);
        }
      }
      req.query(sql, function (err, recordset) {
        if (err) return rejecter(err);
        obj.response = recordset[0];
        resolver(obj);
      });
    });
  },

  // sets a request input parameter. Detects bigints and sets type appropriately.
  _setReqInput: function _setReqInput(req, i, binding) {
    if (typeof binding == 'number' && (binding < SQL_INT4.MIN || binding > SQL_INT4.MAX)) {
      if (binding < SQL_BIGINT_SAFE.MIN || binding > SQL_BIGINT_SAFE.MAX) {
        throw new Error('Bigint must be safe integer or must be passed as string, saw ' + binding);
      }
      req.input('p' + i, this.driver.BigInt, binding);
    } else {
      req.input('p' + i, binding);
    }
  },

  // Process the response as returned from the query.
  processResponse: function processResponse(obj, runner) {
    if (obj == null) return;
    var response = obj.response;
    var method = obj.method;

    if (obj.output) return obj.output.call(runner, response);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        response = helpers.skim(response);
        if (method === 'pluck') return _lodash.map(response, obj.pluck);
        return method === 'first' ? response[0] : response;
      case 'insert':
      case 'del':
      case 'update':
      case 'counter':
        if (obj.returning) {
          if (obj.returning === '@@rowcount') {
            return response[0][''];
          }

          if (isArray(obj.returning) && obj.returning.length > 1 || obj.returning[0] === '*') {
            return response;
          }
          // return an array with values if only one returning value was specified
          return _lodash.flatten(_lodash.map(response, _lodash.values));
        }
        return response;
      default:
        return response;
    }
  },

  ping: function ping(resource, callback) {
    resource.request().query('SELECT 1', callback);
  }

});

// MSSQL Specific error handler
function connectionErrorHandler(client, connection, err) {
  if (connection && err && err.fatal) {
    if (connection.__knex__disposed) return;
    connection.__knex__disposed = true;
    client.pool.destroy(connection);
  }
}

exports['default'] = Client_MSSQL;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9tc3NxbC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztzQkFHNkMsUUFBUTs7d0JBQ2hDLFVBQVU7Ozs7eUJBRVQsYUFBYTs7OztzQkFDaEIsY0FBYzs7Ozt1QkFDYixlQUFlOzs7O3VCQUNWLGVBQWU7O0lBQTVCLE9BQU87OzJCQUVLLGVBQWU7Ozs7NkJBQ2Isa0JBQWtCOzs7OzhCQUNqQixtQkFBbUI7Ozs7bUNBQ3BCLHdCQUF3Qjs7OztvQ0FDdkIseUJBQXlCOzs7O0lBRTVDLE9BQU8sR0FBSyxLQUFLLENBQWpCLE9BQU87O0FBRWYsSUFBTSxRQUFRLEdBQUcsRUFBRSxHQUFHLEVBQUcsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBQyxDQUFBO0FBQ3RELElBQU0sZUFBZSxHQUFHLEVBQUUsR0FBRyxFQUFHLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFLGdCQUFnQixFQUFDLENBQUE7Ozs7QUFJekUsU0FBUyxZQUFZLENBQUMsTUFBTSxFQUFFOzs7QUFHNUIsTUFBRyxNQUFNLElBQUksTUFBTSxDQUFDLFVBQVUsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRTtBQUN4RCxVQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztHQUNuRDtBQUNELHNCQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7Q0FDM0I7QUFDRCxzQkFBUyxZQUFZLHNCQUFTLENBQUM7O0FBRS9CLGVBQU8sWUFBWSxDQUFDLFNBQVMsRUFBRTs7QUFFN0IsU0FBTyxFQUFFLE9BQU87O0FBRWhCLFlBQVUsRUFBRSxPQUFPOztBQUVuQixTQUFPLEVBQUEsbUJBQUc7QUFDUixXQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztHQUN6Qjs7QUFFRCxhQUFXLDBCQUFBOztBQUVYLFdBQVMsd0JBQUE7O0FBRVQs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LFFBQVEsaUJBQVMsQ0FBQyxDQUFDO1NBQ3ZDO0FBQ0QsZUFBTyxRQUFRLENBQUM7QUFBQSxBQUNsQjtBQUNFLGVBQU8sUUFBUSxDQUFBO0FBQUEsS0FDbEI7R0FDRjs7QUFFRCxNQUFJLEVBQUEsY0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFO0FBQ3ZCLFlBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0dBQ2hEOztDQUVGLENBQUMsQ0FBQTs7O0FBR0YsU0FBUyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRTtBQUN2RCxNQUFJLFVBQVUsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtBQUNsQyxRQUFJLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPO0FBQ3hDLGNBQVUsQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDbkMsVUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7R0FDakM7Q0FDRjs7cUJBRWMsWUFBWSIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8gTVNTUUwgQ2xpZW50XG4vLyAtLS0tLS0tXG5pbXBvcnQgeyBhc3NpZ24sIG1hcCwgZmxhdHRlbiwgdmFsdWVzIH0gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcblxuaW1wb3J0IEZvcm1hdHRlciBmcm9tICcuL2Zvcm1hdHRlcic7XG5pbXBvcnQgQ2xpZW50IGZyb20gJy4uLy4uL2NsaWVudCc7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICcuLi8uLi9wcm9taXNlJztcbmltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi4vLi4vaGVscGVycyc7XG5cbmltcG9ydCBUcmFuc2FjdGlvbiBmcm9tICcuL3RyYW5zYWN0aW9uJztcbmltcG9ydCBRdWVyeUNvbXBpbGVyIGZyb20gJy4vcXVlcnkvY29tcGlsZXInO1xuaW1wb3J0IFNjaGVtYUNvbXBpbGVyIGZyb20gJy4vc2NoZW1hL2NvbXBpbGVyJztcbmltcG9ydCBUYWJsZUNvbXBpbGVyIGZyb20gJy4vc2NoZW1hL3RhYmxlY29tcGlsZXInO1xuaW1wb3J0IENvbHVtbkNvbXBpbGVyIGZyb20gJy4vc2NoZW1hL2NvbHVtbmNvbXBpbGVyJztcblxuY29uc3QgeyBpc0FycmF5IH0gPSBBcnJheTtcblxuY29uc3QgU1FMX0lOVDQgPSB7IE1JTiA6IC0yMTQ3NDgzNjQ4LCBNQVg6IDIxNDc0ODM2NDd9XG5jb25zdCBTUUxfQklHSU5UX1NBRkUgPSB7IE1JTiA6IC05MDA3MTk5MjU0NzQwOTkxLCBNQVg6IDkwMDcxOTkyNTQ3NDA5OTF9XG5cbi8vIEFsd2F5cyBpbml0aWFsaXplIHdpdGggdGhlIFwiUXVlcnlCdWlsZGVyXCIgYW5kIFwiUXVlcnlDb21waWxlclwiIG9iamVjdHMsIHdoaWNoXG4vLyBleHRlbmQgdGhlIGJhc2UgJ2xpYi9xdWVyeS9idWlsZGVyJyBhbmQgJ2xpYi9xdWVyeS9jb21waWxlcicsIHJlc3BlY3RpdmVseS5cbmZ1bmN0aW9uIENsaWVudF9NU1NRTChjb25maWcpIHtcbiAgLy8gIzEyMzUgbXNzcWwgbW9kdWxlIHdhbnRzICdzZXJ2ZXInLCBub3QgJ2hvc3QnLiBUaGlzIGlzIHRvIGVuZm9yY2UgdGhlIHNhbWVcbiAgLy8gb3B0aW9ucyBvYmplY3QgYWNyb3NzIGFsbCBkaWFsZWN0cy5cbiAgaWYoY29uZmlnICYmIGNvbmZpZy5jb25uZWN0aW9uICYmIGNvbmZpZy5jb25uZWN0aW9uLmhvc3QpIHtcbiAgICBjb25maWcuY29ubmVjdGlvbi5zZXJ2ZXIgPSBjb25maWcuY29ubmVjdGlvbi5ob3N0O1xuICB9XG4gIENsaWVudC5jYWxsKHRoaXMsIGNvbmZpZyk7XG59XG5pbmhlcml0cyhDbGllbnRfTVNTUUwsIENsaWVudCk7XG5cbmFzc2lnbihDbGllbnRfTVNTUUwucHJvdG90eXBlLCB7XG5cbiAgZGlhbGVjdDogJ21zc3FsJyxcblxuICBkcml2ZXJOYW1lOiAnbXNzcWwnLFxuXG4gIF9kcml2ZXIoKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJ21zc3FsJyk7XG4gIH0sXG5cbiAgVHJhbnNhY3Rpb24sXG5cbiAgRm9ybWF0dGVyLFxuXG4gIFF1ZXJ5Q29tcGlsZXIsXG5cbiAgU2NoZW1hQ29tcGlsZXIsXG5cbiAgVGFibGVDb21waWxlcixcblxuICBDb2x1bW5Db21waWxlcixcblxuICB3cmFwSWRlbnRpZmllcih2YWx1ZSkge1xuICAgIHJldHVybiAodmFsdWUgIT09ICcqJyA/IGBbJHt2YWx1ZS5yZXBsYWNlKC9cXFsvZywgJ1xcWycpfV1gIDogJyonKVxuICB9LFxuXG4gIC8vIEdldCBhIHJhdyBjb25uZWN0aW9uLCBjYWxsZWQgYnkgdGhlIGBwb29sYCB3aGVuZXZlciBhIG5ld1xuICAvLyBjb25uZWN0aW9uIG5lZWRzIHRvIGJlIGFkZGVkIHRvIHRoZSBwb29sLlxuICBhY3F1aXJlUmF3Q29ubmVjdGlvbigpIHtcbiAgICBjb25zdCBjbGllbnQgPSB0aGlzO1xuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBuZXcgdGhpcy5kcml2ZXIuQ29ubmVjdGlvbih0aGlzLmNvbm5lY3Rpb25TZXR0aW5ncyk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmVyLCByZWplY3Rlcikge1xuICAgICAgY29ubmVjdGlvbi5jb25uZWN0KGZ1bmN0aW9uKGVycikge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gcmVqZWN0ZXIoZXJyKTtcbiAgICAgICAgY29ubmVjdGlvbi5vbignZXJyb3InLCBjb25uZWN0aW9uRXJyb3JIYW5kbGVyLmJpbmQobnVsbCwgY2xpZW50LCBjb25uZWN0aW9uKSk7XG4gICAgICAgIGNvbm5lY3Rpb24ub24oJ2VuZCcsIGNvbm5lY3Rpb25FcnJvckhhbmRsZXIuYmluZChudWxsLCBjbGllbnQsIGNvbm5lY3Rpb24pKTtcbiAgICAgICAgcmVzb2x2ZXIoY29ubmVjdGlvbik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICAvLyBVc2VkIHRvIGV4cGxpY2l0bHkgY2xvc2UgYSBjb25uZWN0aW9uLCBjYWxsZWQgaW50ZXJuYWxseSBieSB0aGUgcG9vbFxuICAvLyB3aGVuIGEgY29ubmVjdGlvbiB0aW1lcyBvdXQgb3IgdGhlIHBvb2wgaXMgc2h1dGRvd24uXG4gIGRlc3Ryb3lSYXdDb25uZWN0aW9uKGNvbm5lY3Rpb24sIGNiKSB7XG4gICAgY29ubmVjdGlvbi5jbG9zZShjYik7XG4gIH0sXG5cbiAgLy8gUG9zaXRpb24gdGhlIGJpbmRpbmdzIGZvciB0aGUgcXVlcnkuXG4gIHBvc2l0aW9uQmluZGluZ3Moc3FsKSB7XG4gICAgbGV0IHF1ZXN0aW9uQ291bnQgPSAtMVxuICAgIHJldHVybiBzcWwucmVwbGFjZSgvXFw/L2csIGZ1bmN0aW9uKCkge1xuICAgICAgcXVlc3Rpb25Db3VudCArPSAxXG4gICAgICByZXR1cm4gYEBwJHtxdWVzdGlvbkNvdW50fWBcbiAgICB9KVxuICB9LFxuXG4gIC8vIEdyYWIgYSBjb25uZWN0aW9uLCBydW4gdGhlIHF1ZXJ5IHZpYSB0aGUgTVNTUUwgc3RyZWFtaW5nIGludGVyZmFjZSxcbiAgLy8gYW5kIHBhc3MgdGhhdCB0aHJvdWdoIHRvIHRoZSBzdHJlYW0gd2UndmUgc2VudCBiYWNrIHRvIHRoZSBjbGllbnQuXG4gIF9zdHJlYW0oY29ubmVjdGlvbiwgb2JqLCBzdHJlYW0sIG9wdGlvbnMpIHtcbiAgICBjb25zdCBjbGllbnQgPSB0aGlzO1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gICAgaWYgKCFvYmogfHwgdHlwZW9mIG9iaiA9PT0gJ3N0cmluZycpIG9iaiA9IHtzcWw6IG9ian1cbiAgICAvLyBjb252ZXJ0ID8gcGFyYW1zIGludG8gcG9zaXRpb25hbCBiaW5kaW5ncyAoQHAxKVxuICAgIG9iai5zcWwgPSB0aGlzLnBvc2l0aW9uQmluZGluZ3Mob2JqLnNxbCk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmVyLCByZWplY3Rlcikge1xuICAgICAgc3RyZWFtLm9uKCdlcnJvcicsIHJlamVjdGVyKTtcbiAgICAgIHN0cmVhbS5vbignZW5kJywgcmVzb2x2ZXIpO1xuICAgICAgbGV0IHsgc3FsIH0gPSBvYmpcbiAgICAgIGlmICghc3FsKSByZXR1cm4gcmVzb2x2ZXIoKVxuICAgICAgaWYgKG9iai5vcHRpb25zKSAoeyBzcWwgfSA9IGFzc2lnbih7c3FsfSwgb2JqLm9wdGlvbnMpKVxuICAgICAgY29uc3QgcmVxID0gKGNvbm5lY3Rpb24udHhfIHx8IGNvbm5lY3Rpb24pLnJlcXVlc3QoKTtcbiAgICAgIC8vcmVxLnZlcmJvc2UgPSB0cnVlO1xuICAgICAgcmVxLm11bHRpcGxlID0gdHJ1ZTtcbiAgICAgIHJlcS5zdHJlYW0gPSB0cnVlO1xuICAgICAgaWYgKG9iai5iaW5kaW5ncykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9iai5iaW5kaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNsaWVudC5fc2V0UmVxSW5wdXQocmVxLCBpLCBvYmouYmluZGluZ3NbaV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlcS5waXBlKHN0cmVhbSlcbiAgICAgIHJlcS5xdWVyeShzcWwpXG4gICAgfSlcbiAgfSxcblxuICAvLyBSdW5zIHRoZSBxdWVyeSBvbiB0aGUgc3BlY2lmaWVkIGNvbm5lY3Rpb24sIHByb3ZpZGluZyB0aGUgYmluZGluZ3NcbiAgLy8gYW5kIGFueSBvdGhlciBuZWNlc3NhcnkgcHJlcCB3b3JrLlxuICBfcXVlcnkoY29ubmVjdGlvbiwgb2JqKSB7XG4gICAgY29uc3QgY2xpZW50ID0gdGhpcztcbiAgICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqID09PSAnc3RyaW5nJykgb2JqID0ge3NxbDogb2JqfVxuICAgIC8vIGNvbnZlcnQgPyBwYXJhbXMgaW50byBwb3NpdGlvbmFsIGJpbmRpbmdzIChAcDEpXG4gICAgb2JqLnNxbCA9IHRoaXMucG9zaXRpb25CaW5kaW5ncyhvYmouc3FsKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZXIsIHJlamVjdGVyKSB7XG4gICAgICBsZXQgeyBzcWwgfSA9IG9ialxuICAgICAgaWYgKCFzcWwpIHJldHVybiByZXNvbHZlcigpXG4gICAgICBpZiAob2JqLm9wdGlvbnMpICh7IHNxbCB9ID0gYXNzaWduKHtzcWx9LCBvYmoub3B0aW9ucykpXG4gICAgICBjb25zdCByZXEgPSAoY29ubmVjdGlvbi50eF8gfHwgY29ubmVjdGlvbikucmVxdWVzdCgpO1xuICAgICAgLy8gcmVxLnZlcmJvc2UgPSB0cnVlO1xuICAgICAgcmVxLm11bHRpcGxlID0gdHJ1ZTtcbiAgICAgIGlmIChvYmouYmluZGluZ3MpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvYmouYmluZGluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjbGllbnQuX3NldFJlcUlucHV0KHJlcSwgaSwgb2JqLmJpbmRpbmdzW2ldKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXEucXVlcnkoc3FsLCBmdW5jdGlvbihlcnIsIHJlY29yZHNldCkge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gcmVqZWN0ZXIoZXJyKVxuICAgICAgICBvYmoucmVzcG9uc2UgPSByZWNvcmRzZXRbMF1cbiAgICAgICAgcmVzb2x2ZXIob2JqKVxuICAgICAgfSlcbiAgICB9KVxuICB9LFxuXG4gIC8vIHNldHMgYSByZXF1ZXN0IGlucHV0IHBhcmFtZXRlci4gRGV0ZWN0cyBiaWdpbnRzIGFuZCBzZXRzIHR5cGUgYXBwcm9wcmlhdGVseS5cbiAgX3NldFJlcUlucHV0KHJlcSwgaSwgYmluZGluZykge1xuICAgIGlmICh0eXBlb2YgYmluZGluZyA9PSAnbnVtYmVyJyAmJiAoYmluZGluZyA8IFNRTF9JTlQ0Lk1JTiB8fCBiaW5kaW5nID4gU1FMX0lOVDQuTUFYKSkge1xuICAgICAgaWYgKGJpbmRpbmcgPCBTUUxfQklHSU5UX1NBRkUuTUlOIHx8IGJpbmRpbmcgPiBTUUxfQklHSU5UX1NBRkUuTUFYKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQmlnaW50IG11c3QgYmUgc2FmZSBpbnRlZ2VyIG9yIG11c3QgYmUgcGFzc2VkIGFzIHN0cmluZywgc2F3ICR7YmluZGluZ31gKVxuICAgICAgfVxuICAgICAgcmVxLmlucHV0KGBwJHtpfWAsIHRoaXMuZHJpdmVyLkJpZ0ludCwgYmluZGluZylcbiAgICB9IGVsc2Uge1xuICAgICAgcmVxLmlucHV0KGBwJHtpfWAsIGJpbmRpbmcpXG4gICAgfVxuICB9LFxuXG4gIC8vIFByb2Nlc3MgdGhlIHJlc3BvbnNlIGFzIHJldHVybmVkIGZyb20gdGhlIHF1ZXJ5LlxuICBwcm9jZXNzUmVzcG9uc2Uob2JqLCBydW5uZXIpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybjtcbiAgICBsZXQgeyByZXNwb25zZSB9ID0gb2JqXG4gICAgY29uc3QgeyBtZXRob2QgfSA9IG9ialxuICAgIGlmIChvYmoub3V0cHV0KSByZXR1cm4gb2JqLm91dHB1dC5jYWxsKHJ1bm5lciwgcmVzcG9uc2UpXG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICBjYXNlICdwbHVjayc6XG4gICAgICBjYXNlICdmaXJzdCc6XG4gICAgICAgIHJlc3BvbnNlID0gaGVscGVycy5za2ltKHJlc3BvbnNlKVxuICAgICAgICBpZiAobWV0aG9kID09PSAncGx1Y2snKSByZXR1cm4gbWFwKHJlc3BvbnNlLCBvYmoucGx1Y2spXG4gICAgICAgIHJldHVybiBtZXRob2QgPT09ICdmaXJzdCcgPyByZXNwb25zZVswXSA6IHJlc3BvbnNlXG4gICAgICBjYXNlICdpbnNlcnQnOlxuICAgICAgY2FzZSAnZGVsJzpcbiAgICAgIGNhc2UgJ3VwZGF0ZSc6XG4gICAgICBjYXNlICdjb3VudGVyJzpcbiAgICAgICAgaWYgKG9iai5yZXR1cm5pbmcpIHtcbiAgICAgICAgICBpZiAob2JqLnJldHVybmluZyA9PT0gJ0BAcm93Y291bnQnKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2VbMF1bJyddXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgKGlzQXJyYXkob2JqLnJldHVybmluZykgJiYgb2JqLnJldHVybmluZy5sZW5ndGggPiAxKSB8fFxuICAgICAgICAgICAgb2JqLnJldHVybmluZ1swXSA9PT0gJyonXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHJldHVybiBhbiBhcnJheSB3aXRoIHZhbHVlcyBpZiBvbmx5IG9uZSByZXR1cm5pbmcgdmFsdWUgd2FzIHNwZWNpZmllZFxuICAgICAgICAgIHJldHVybiBmbGF0dGVuKG1hcChyZXNwb25zZSwgdmFsdWVzKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlXG4gICAgfVxuICB9LFxuXG4gIHBpbmcocmVzb3VyY2UsIGNhbGxiYWNrKSB7XG4gICAgcmVzb3VyY2UucmVxdWVzdCgpLnF1ZXJ5KCdTRUxFQ1QgMScsIGNhbGxiYWNrKTtcbiAgfVxuXG59KVxuXG4vLyBNU1NRTCBTcGVjaWZpYyBlcnJvciBoYW5kbGVyXG5mdW5jdGlvbiBjb25uZWN0aW9uRXJyb3JIYW5kbGVyKGNsaWVudCwgY29ubmVjdGlvbiwgZXJyKSB7XG4gIGlmIChjb25uZWN0aW9uICYmIGVyciAmJiBlcnIuZmF0YWwpIHtcbiAgICBpZiAoY29ubmVjdGlvbi5fX2tuZXhfX2Rpc3Bvc2VkKSByZXR1cm47XG4gICAgY29ubmVjdGlvbi5fX2tuZXhfX2Rpc3Bvc2VkID0gdHJ1ZTtcbiAgICBjbGllbnQucG9vbC5kZXN0cm95KGNvbm5lY3Rpb24pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENsaWVudF9NU1NRTFxuIl19