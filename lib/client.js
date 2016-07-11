'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _promise = require('./promise');

var _promise2 = _interopRequireDefault(_promise);

var _helpers = require('./helpers');

var helpers = _interopRequireWildcard(_helpers);

var _raw = require('./raw');

var _raw2 = _interopRequireDefault(_raw);

var _runner = require('./runner');

var _runner2 = _interopRequireDefault(_runner);

var _formatter = require('./formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _queryBuilder = require('./query/builder');

var _queryBuilder2 = _interopRequireDefault(_queryBuilder);

var _queryCompiler = require('./query/compiler');

var _queryCompiler2 = _interopRequireDefault(_queryCompiler);

var _schemaBuilder = require('./schema/builder');

var _schemaBuilder2 = _interopRequireDefault(_schemaBuilder);

var _schemaCompiler = require('./schema/compiler');

var _schemaCompiler2 = _interopRequireDefault(_schemaCompiler);

var _schemaTablebuilder = require('./schema/tablebuilder');

var _schemaTablebuilder2 = _interopRequireDefault(_schemaTablebuilder);

var _schemaTablecompiler = require('./schema/tablecompiler');

var _schemaTablecompiler2 = _interopRequireDefault(_schemaTablecompiler);

var _schemaColumnbuilder = require('./schema/columnbuilder');

var _schemaColumnbuilder2 = _interopRequireDefault(_schemaColumnbuilder);

var _schemaColumncompiler = require('./schema/columncompiler');

var _schemaColumncompiler2 = _interopRequireDefault(_schemaColumncompiler);

var _pool2 = require('pool2');

var _pool22 = _interopRequireDefault(_pool2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _events = require('events');

var _queryString = require('./query/string');

var _queryString2 = _interopRequireDefault(_queryString);

var _lodash = require('lodash');

var debug = require('debug')('knex:client');
var debugQuery = require('debug')('knex:query');

// The base client provides the general structure
// for a dialect specific client object.
function Client() {
  var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  this.config = config;
  this.connectionSettings = _lodash.cloneDeep(config.connection || {});
  if (this.driverName && config.connection) {
    this.initializeDriver();
    if (!config.pool || config.pool && config.pool.max !== 0) {
      this.initializePool(config);
    }
  }
  this.valueForUndefined = this.raw('DEFAULT');
  if (config.useNullAsDefault) {
    this.valueForUndefined = null;
  }
}
_inherits2['default'](Client, _events.EventEmitter);

_lodash.assign(Client.prototype, {

  Formatter: _formatter2['default'],

  formatter: function formatter() {
    return new this.Formatter(this);
  },

  QueryBuilder: _queryBuilder2['default'],

  queryBuilder: function queryBuilder() {
    return new this.QueryBuilder(this);
  },

  QueryCompiler: _queryCompiler2['default'],

  queryCompiler: function queryCompiler(builder) {
    return new this.QueryCompiler(this, builder);
  },

  SchemaBuilder: _schemaBuilder2['default'],

  schemaBuilder: function schemaBuilder() {
    return new this.SchemaBuilder(this);
  },

  SchemaCompiler: _schemaCompiler2['default'],

  schemaCompiler: function schemaCompiler(builder) {
    return new this.SchemaCompiler(this, builder);
  },

  TableBuilder: _schemaTablebuilder2['default'],

  tableBuilder: function tableBuilder(type, tableName, fn) {
    return new this.TableBuilder(this, type, tableName, fn);
  },

  TableCompiler: _schemaTablecompiler2['default'],

  tableCompiler: function tableCompiler(tableBuilder) {
    return new this.TableCompiler(this, tableBuilder);
  },

  ColumnBuilder: _schemaColumnbuilder2['default'],

  columnBuilder: function columnBuilder(tableBuilder, type, args) {
    return new this.ColumnBuilder(this, tableBuilder, type, args);
  },

  ColumnCompiler: _schemaColumncompiler2['default'],

  columnCompiler: function columnCompiler(tableBuilder, columnBuilder) {
    return new this.ColumnCompiler(this, tableBuilder, columnBuilder);
  },

  Runner: _runner2['default'],

  runner: function runner(connection) {
    return new this.Runner(this, connection);
  },

  SqlString: _queryString2['default'],

  Transaction: _transaction2['default'],

  transaction: function transaction(container, config, outerTx) {
    return new this.Transaction(this, container, config, outerTx);
  },

  Raw: _raw2['default'],

  raw: function raw() {
    var raw = new this.Raw(this);
    return raw.set.apply(raw, arguments);
  },

  query: function query(connection, obj) {
    var _this = this;

    if (typeof obj === 'string') obj = { sql: obj };
    this.emit('query', _lodash.assign({ __knexUid: connection.__knexUid }, obj));
    debugQuery(obj.sql);
    return this._query.call(this, connection, obj)['catch'](function (err) {
      err.message = _queryString2['default'].format(obj.sql, obj.bindings) + ' - ' + err.message;
      _this.emit('query-error', err, _lodash.assign({ __knexUid: connection.__knexUid }, obj));
      throw err;
    });
  },

  stream: function stream(connection, obj, _stream, options) {
    if (typeof obj === 'string') obj = { sql: obj };
    this.emit('query', _lodash.assign({ __knexUid: connection.__knexUid }, obj));
    debugQuery(obj.sql);
    return this._stream.call(this, connection, obj, _stream, options);
  },

  prepBindings: function prepBindings(bindings) {
    return bindings;
  },

  wrapIdentifier: function wrapIdentifier(value) {
    return value !== '*' ? '"' + value.replace(/"/g, '""') + '"' : '*';
  },

  initializeDriver: function initializeDriver() {
    try {
      this.driver = this._driver();
    } catch (e) {
      helpers.exit('Knex: run\n$ npm install ' + this.driverName + ' --save\n' + e.stack);
    }
  },

  Pool: _pool22['default'],

  initializePool: function initializePool(config) {
    if (this.pool) this.destroy();
    this.pool = new this.Pool(_lodash.assign(this.poolDefaults(config.pool || {}), config.pool));
    this.pool.on('error', function (err) {
      helpers.error('Pool2 - ' + err);
    });
    this.pool.on('warn', function (msg) {
      helpers.warn('Pool2 - ' + msg);
    });
  },

  poolDefaults: function poolDefaults(poolConfig) {
    var client = this;
    return {
      min: 2,
      max: 10,
      acquire: function acquire(callback) {
        client.acquireRawConnection().tap(function (connection) {
          connection.__knexUid = _lodash.uniqueId('__knexUid');
          if (poolConfig.afterCreate) {
            return _promise2['default'].promisify(poolConfig.afterCreate)(connection);
          }
        }).asCallback(callback);
      },
      dispose: function dispose(connection, callback) {
        if (poolConfig.beforeDestroy) {
          poolConfig.beforeDestroy(connection, function () {
            if (connection !== undefined) {
              client.destroyRawConnection(connection, callback);
            }
          });
        } else if (connection !== void 0) {
          client.destroyRawConnection(connection, callback);
        }
      },
      ping: function ping(resource, callback) {
        return client.ping(resource, callback);
      }
    };
  },

  // Acquire a connection from the pool.
  acquireConnection: function acquireConnection() {
    var client = this;
    var request = null;
    var completed = new _promise2['default'](function (resolver, rejecter) {
      if (!client.pool) {
        return rejecter(new Error('There is no pool defined on the current client'));
      }
      request = client.pool.acquire(function (err, connection) {
        if (err) return rejecter(err);
        debug('acquired connection from pool: %s', connection.__knexUid);
        resolver(connection);
      });
    });
    var abort = function abort(reason) {
      if (request && !request.fulfilled) {
        request.abort(reason);
      }
    };
    return {
      completed: completed,
      abort: abort
    };
  },

  // Releases a connection back to the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection: function releaseConnection(connection) {
    var pool = this.pool;

    return new _promise2['default'](function (resolver) {
      debug('releasing connection to pool: %s', connection.__knexUid);
      pool.release(connection);
      resolver();
    });
  },

  // Destroy the current connection pool for the client.
  destroy: function destroy(callback) {
    var client = this;
    var promise = new _promise2['default'](function (resolver) {
      if (!client.pool) return resolver();
      client.pool.end(function () {
        client.pool = undefined;
        resolver();
      });
    });
    // Allow either a callback or promise interface for destruction.
    if (typeof callback === 'function') {
      promise.asCallback(callback);
    } else {
      return promise;
    }
  },

  // Return the database being used by this client.
  database: function database() {
    return this.connectionSettings.database;
  },

  toString: function toString() {
    return '[object KnexClient]';
  },

  canCancelQuery: false,

  assertCanCancelQuery: function assertCanCancelQuery() {
    if (!this.canCancelQuery) {
      throw new Error("Query cancelling not supported for this dialect");
    }
  },

  cancelQuery: function cancelQuery() {
    throw new Error("Query cancelling not supported for this dialect");
  }

});

exports['default'] = Client;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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QUFFO0FBQ2hCLFFBQU0sTUFBTSxHQUFHLElBQUksQ0FBQTtBQUNuQixRQUFNLE9BQU8sR0FBRyx5QkFBWSxVQUFTLFFBQVEsRUFBRTtBQUM3QyxVQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLFFBQVEsRUFBRSxDQUFBO0FBQ25DLFlBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVc7QUFDekIsY0FBTSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUE7QUFDdkIsZ0JBQVEsRUFBRSxDQUFBO09BQ1gsQ0FBQyxDQUFBO0tBQ0gsQ0FBQyxDQUFBOztBQUVGLFFBQUksT0FBTyxRQUFRLEtBQUssVUFBVSxFQUFFO0FBQ2xDLGFBQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUE7S0FDN0IsTUFBTTtBQUNMLGFBQU8sT0FBTyxDQUFBO0tBQ2Y7R0FDRjs7O0FBR0QsVUFBUSxFQUFBLG9CQUFHO0FBQ1QsV0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFBO0dBQ3hDOztBQUVELFVBQVEsRUFBQSxvQkFBRztBQUNULFdBQU8scUJBQXFCLENBQUE7R0FDN0I7O0FBRUQsZ0JBQWMsRUFBRSxLQUFLOztBQUVyQixzQkFBb0IsRUFBQSxnQ0FBRztBQUNyQixRQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRTtBQUN4QixZQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUM7S0FDcEU7R0FDRjs7QUFFRCxhQUFXLEVBQUEsdUJBQUc7QUFDWixVQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUE7R0FDbkU7O0NBRUYsQ0FBQyxDQUFBOztxQkFFYSxNQUFNIiwiZmlsZSI6ImNsaWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IFByb21pc2UgZnJvbSAnLi9wcm9taXNlJztcbmltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi9oZWxwZXJzJztcblxuaW1wb3J0IFJhdyBmcm9tICcuL3Jhdyc7XG5pbXBvcnQgUnVubmVyIGZyb20gJy4vcnVubmVyJztcbmltcG9ydCBGb3JtYXR0ZXIgZnJvbSAnLi9mb3JtYXR0ZXInO1xuaW1wb3J0IFRyYW5zYWN0aW9uIGZyb20gJy4vdHJhbnNhY3Rpb24nO1xuXG5pbXBvcnQgUXVlcnlCdWlsZGVyIGZyb20gJy4vcXVlcnkvYnVpbGRlcic7XG5pbXBvcnQgUXVlcnlDb21waWxlciBmcm9tICcuL3F1ZXJ5L2NvbXBpbGVyJztcblxuaW1wb3J0IFNjaGVtYUJ1aWxkZXIgZnJvbSAnLi9zY2hlbWEvYnVpbGRlcic7XG5pbXBvcnQgU2NoZW1hQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvY29tcGlsZXInO1xuaW1wb3J0IFRhYmxlQnVpbGRlciBmcm9tICcuL3NjaGVtYS90YWJsZWJ1aWxkZXInO1xuaW1wb3J0IFRhYmxlQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvdGFibGVjb21waWxlcic7XG5pbXBvcnQgQ29sdW1uQnVpbGRlciBmcm9tICcuL3NjaGVtYS9jb2x1bW5idWlsZGVyJztcbmltcG9ydCBDb2x1bW5Db21waWxlciBmcm9tICcuL3NjaGVtYS9jb2x1bW5jb21waWxlcic7XG5cbmltcG9ydCBQb29sMiBmcm9tICdwb29sMic7XG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCBTcWxTdHJpbmcgZnJvbSAnLi9xdWVyeS9zdHJpbmcnO1xuXG5pbXBvcnQgeyBhc3NpZ24sIHVuaXF1ZUlkLCBjbG9uZURlZXAgfSBmcm9tICdsb2Rhc2gnXG5cbmNvbnN0IGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgna25leDpjbGllbnQnKVxuY29uc3QgZGVidWdRdWVyeSA9IHJlcXVpcmUoJ2RlYnVnJykoJ2tuZXg6cXVlcnknKVxuXG4vLyBUaGUgYmFzZSBjbGllbnQgcHJvdmlkZXMgdGhlIGdlbmVyYWwgc3RydWN0dXJlXG4vLyBmb3IgYSBkaWFsZWN0IHNwZWNpZmljIGNsaWVudCBvYmplY3QuXG5mdW5jdGlvbiBDbGllbnQoY29uZmlnID0ge30pIHtcbiAgdGhpcy5jb25maWcgPSBjb25maWdcbiAgdGhpcy5jb25uZWN0aW9uU2V0dGluZ3MgPSBjbG9uZURlZXAoY29uZmlnLmNvbm5lY3Rpb24gfHwge30pXG4gIGlmICh0aGlzLmRyaXZlck5hbWUgJiYgY29uZmlnLmNvbm5lY3Rpb24pIHtcbiAgICB0aGlzLmluaXRpYWxpemVEcml2ZXIoKVxuICAgIGlmICghY29uZmlnLnBvb2wgfHwgKGNvbmZpZy5wb29sICYmIGNvbmZpZy5wb29sLm1heCAhPT0gMCkpIHtcbiAgICAgIHRoaXMuaW5pdGlhbGl6ZVBvb2woY29uZmlnKVxuICAgIH1cbiAgfVxuICB0aGlzLnZhbHVlRm9yVW5kZWZpbmVkID0gdGhpcy5yYXcoJ0RFRkFVTFQnKTtcbiAgaWYgKGNvbmZpZy51c2VOdWxsQXNEZWZhdWx0KSB7XG4gICAgdGhpcy52YWx1ZUZvclVuZGVmaW5lZCA9IG51bGxcbiAgfVxufVxuaW5oZXJpdHMoQ2xpZW50LCBFdmVudEVtaXR0ZXIpXG5cbmFzc2lnbihDbGllbnQucHJvdG90eXBlLCB7XG5cbiAgRm9ybWF0dGVyLFxuXG4gIGZvcm1hdHRlcigpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMuRm9ybWF0dGVyKHRoaXMpXG4gIH0sXG5cbiAgUXVlcnlCdWlsZGVyLFxuXG4gIHF1ZXJ5QnVpbGRlcigpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMuUXVlcnlCdWlsZGVyKHRoaXMpXG4gIH0sXG5cbiAgUXVlcnlDb21waWxlcixcblxuICBxdWVyeUNvbXBpbGVyKGJ1aWxkZXIpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMuUXVlcnlDb21waWxlcih0aGlzLCBidWlsZGVyKVxuICB9LFxuXG4gIFNjaGVtYUJ1aWxkZXIsXG5cbiAgc2NoZW1hQnVpbGRlcigpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMuU2NoZW1hQnVpbGRlcih0aGlzKVxuICB9LFxuXG4gIFNjaGVtYUNvbXBpbGVyLFxuXG4gIHNjaGVtYUNvbXBpbGVyKGJ1aWxkZXIpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMuU2NoZW1hQ29tcGlsZXIodGhpcywgYnVpbGRlcilcbiAgfSxcblxuICBUYWJsZUJ1aWxkZXIsXG5cbiAgdGFibGVCdWlsZGVyKHR5cGUsIHRhYmxlTmFtZSwgZm4pIHtcbiAgICByZXR1cm4gbmV3IHRoaXMuVGFibGVCdWlsZGVyKHRoaXMsIHR5cGUsIHRhYmxlTmFtZSwgZm4pXG4gIH0sXG5cbiAgVGFibGVDb21waWxlcixcblxuICB0YWJsZUNvbXBpbGVyKHRhYmxlQnVpbGRlcikge1xuICAgIHJldHVybiBuZXcgdGhpcy5UYWJsZUNvbXBpbGVyKHRoaXMsIHRhYmxlQnVpbGRlcilcbiAgfSxcblxuICBDb2x1bW5CdWlsZGVyLFxuXG4gIGNvbHVtbkJ1aWxkZXIodGFibGVCdWlsZGVyLCB0eXBlLCBhcmdzKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzLkNvbHVtbkJ1aWxkZXIodGhpcywgdGFibGVCdWlsZGVyLCB0eXBlLCBhcmdzKVxuICB9LFxuXG4gIENvbHVtbkNvbXBpbGVyLFxuXG4gIGNvbHVtbkNvbXBpbGVyKHRhYmxlQnVpbGRlciwgY29sdW1uQnVpbGRlcikge1xuICAgIHJldHVybiBuZXcgdGhpcy5Db2x1bW5Db21waWxlcih0aGlzLCB0YWJsZUJ1aWxkZXIsIGNvbHVtbkJ1aWxkZXIpXG4gIH0sXG5cbiAgUnVubmVyLFxuXG4gIHJ1bm5lcihjb25uZWN0aW9uKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzLlJ1bm5lcih0aGlzLCBjb25uZWN0aW9uKVxuICB9LFxuXG4gIFNxbFN0cmluZyxcblxuICBUcmFuc2FjdGlvbixcblxuICB0cmFuc2FjdGlvbihjb250YWluZXIsIGNvbmZpZywgb3V0ZXJUeCkge1xuICAgIHJldHVybiBuZXcgdGhpcy5UcmFuc2FjdGlvbih0aGlzLCBjb250YWluZXIsIGNvbmZpZywgb3V0ZXJUeClcbiAgfSxcblxuICBSYXcsXG5cbiAgcmF3KCkge1xuICAgIGNvbnN0IHJhdyA9IG5ldyB0aGlzLlJhdyh0aGlzKVxuICAgIHJldHVybiByYXcuc2V0LmFwcGx5KHJhdywgYXJndW1lbnRzKVxuICB9LFxuXG4gIHF1ZXJ5KGNvbm5lY3Rpb24sIG9iaikge1xuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnc3RyaW5nJykgb2JqID0ge3NxbDogb2JqfVxuICAgIHRoaXMuZW1pdCgncXVlcnknLCBhc3NpZ24oe19fa25leFVpZDogY29ubmVjdGlvbi5fX2tuZXhVaWR9LCBvYmopKVxuICAgIGRlYnVnUXVlcnkob2JqLnNxbClcbiAgICByZXR1cm4gdGhpcy5fcXVlcnkuY2FsbCh0aGlzLCBjb25uZWN0aW9uLCBvYmopLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGVyci5tZXNzYWdlID0gU3FsU3RyaW5nLmZvcm1hdChvYmouc3FsLCBvYmouYmluZGluZ3MpICsgJyAtICcgKyBlcnIubWVzc2FnZVxuICAgICAgdGhpcy5lbWl0KCdxdWVyeS1lcnJvcicsIGVyciwgYXNzaWduKHtfX2tuZXhVaWQ6IGNvbm5lY3Rpb24uX19rbmV4VWlkfSwgb2JqKSlcbiAgICAgIHRocm93IGVyclxuICAgIH0pXG4gIH0sXG5cbiAgc3RyZWFtKGNvbm5lY3Rpb24sIG9iaiwgc3RyZWFtLCBvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdzdHJpbmcnKSBvYmogPSB7c3FsOiBvYmp9XG4gICAgdGhpcy5lbWl0KCdxdWVyeScsIGFzc2lnbih7X19rbmV4VWlkOiBjb25uZWN0aW9uLl9fa25leFVpZH0sIG9iaikpXG4gICAgZGVidWdRdWVyeShvYmouc3FsKVxuICAgIHJldHVybiB0aGlzLl9zdHJlYW0uY2FsbCh0aGlzLCBjb25uZWN0aW9uLCBvYmosIHN0cmVhbSwgb3B0aW9ucylcbiAgfSxcblxuICBwcmVwQmluZGluZ3MoYmluZGluZ3MpIHtcbiAgICByZXR1cm4gYmluZGluZ3M7XG4gIH0sXG5cbiAgd3JhcElkZW50aWZpZXIodmFsdWUpIHtcbiAgICByZXR1cm4gKHZhbHVlICE9PSAnKicgPyBgXCIke3ZhbHVlLnJlcGxhY2UoL1wiL2csICdcIlwiJyl9XCJgIDogJyonKVxuICB9LFxuXG4gIGluaXRpYWxpemVEcml2ZXIoKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuZHJpdmVyID0gdGhpcy5fZHJpdmVyKClcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBoZWxwZXJzLmV4aXQoYEtuZXg6IHJ1blxcbiQgbnBtIGluc3RhbGwgJHt0aGlzLmRyaXZlck5hbWV9IC0tc2F2ZVxcbiR7ZS5zdGFja31gKVxuICAgIH1cbiAgfSxcblxuICBQb29sOiBQb29sMixcblxuICBpbml0aWFsaXplUG9vbChjb25maWcpIHtcbiAgICBpZiAodGhpcy5wb29sKSB0aGlzLmRlc3Ryb3koKVxuICAgIHRoaXMucG9vbCA9IG5ldyB0aGlzLlBvb2woYXNzaWduKHRoaXMucG9vbERlZmF1bHRzKGNvbmZpZy5wb29sIHx8IHt9KSwgY29uZmlnLnBvb2wpKVxuICAgIHRoaXMucG9vbC5vbignZXJyb3InLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgIGhlbHBlcnMuZXJyb3IoYFBvb2wyIC0gJHtlcnJ9YClcbiAgICB9KVxuICAgIHRoaXMucG9vbC5vbignd2FybicsIGZ1bmN0aW9uKG1zZykge1xuICAgICAgaGVscGVycy53YXJuKGBQb29sMiAtICR7bXNnfWApXG4gICAgfSlcbiAgfSxcblxuICBwb29sRGVmYXVsdHMocG9vbENvbmZpZykge1xuICAgIGNvbnN0IGNsaWVudCA9IHRoaXNcbiAgICByZXR1cm4ge1xuICAgICAgbWluOiAyLFxuICAgICAgbWF4OiAxMCxcbiAgICAgIGFjcXVpcmUoY2FsbGJhY2spIHtcbiAgICAgICAgY2xpZW50LmFjcXVpcmVSYXdDb25uZWN0aW9uKClcbiAgICAgICAgICAudGFwKGZ1bmN0aW9uKGNvbm5lY3Rpb24pIHtcbiAgICAgICAgICAgIGNvbm5lY3Rpb24uX19rbmV4VWlkID0gdW5pcXVlSWQoJ19fa25leFVpZCcpXG4gICAgICAgICAgICBpZiAocG9vbENvbmZpZy5hZnRlckNyZWF0ZSkge1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5wcm9taXNpZnkocG9vbENvbmZpZy5hZnRlckNyZWF0ZSkoY29ubmVjdGlvbilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICAgIC5hc0NhbGxiYWNrKGNhbGxiYWNrKVxuICAgICAgfSxcbiAgICAgIGRpc3Bvc2UoY29ubmVjdGlvbiwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHBvb2xDb25maWcuYmVmb3JlRGVzdHJveSkge1xuICAgICAgICAgIHBvb2xDb25maWcuYmVmb3JlRGVzdHJveShjb25uZWN0aW9uLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgY2xpZW50LmRlc3Ryb3lSYXdDb25uZWN0aW9uKGNvbm5lY3Rpb24sIGNhbGxiYWNrKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSBpZiAoY29ubmVjdGlvbiAhPT0gdm9pZCAwKSB7XG4gICAgICAgICAgY2xpZW50LmRlc3Ryb3lSYXdDb25uZWN0aW9uKGNvbm5lY3Rpb24sIGNhbGxiYWNrKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgcGluZyhyZXNvdXJjZSwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGNsaWVudC5waW5nKHJlc291cmNlLCBjYWxsYmFjayk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vIEFjcXVpcmUgYSBjb25uZWN0aW9uIGZyb20gdGhlIHBvb2wuXG4gIGFjcXVpcmVDb25uZWN0aW9uKCkge1xuICAgIGNvbnN0IGNsaWVudCA9IHRoaXNcbiAgICBsZXQgcmVxdWVzdCA9IG51bGxcbiAgICBjb25zdCBjb21wbGV0ZWQgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlciwgcmVqZWN0ZXIpIHtcbiAgICAgIGlmICghY2xpZW50LnBvb2wpIHtcbiAgICAgICAgcmV0dXJuIHJlamVjdGVyKG5ldyBFcnJvcignVGhlcmUgaXMgbm8gcG9vbCBkZWZpbmVkIG9uIHRoZSBjdXJyZW50IGNsaWVudCcpKVxuICAgICAgfVxuICAgICAgcmVxdWVzdCA9IGNsaWVudC5wb29sLmFjcXVpcmUoZnVuY3Rpb24oZXJyLCBjb25uZWN0aW9uKSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3RlcihlcnIpXG4gICAgICAgIGRlYnVnKCdhY3F1aXJlZCBjb25uZWN0aW9uIGZyb20gcG9vbDogJXMnLCBjb25uZWN0aW9uLl9fa25leFVpZClcbiAgICAgICAgcmVzb2x2ZXIoY29ubmVjdGlvbilcbiAgICAgIH0pXG4gICAgfSlcbiAgICBjb25zdCBhYm9ydCA9IGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgaWYgKHJlcXVlc3QgJiYgIXJlcXVlc3QuZnVsZmlsbGVkKSB7XG4gICAgICAgIHJlcXVlc3QuYWJvcnQocmVhc29uKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgY29tcGxldGVkOiBjb21wbGV0ZWQsXG4gICAgICBhYm9ydDogYWJvcnRcbiAgICB9XG4gIH0sXG5cbiAgLy8gUmVsZWFzZXMgYSBjb25uZWN0aW9uIGJhY2sgdG8gdGhlIGNvbm5lY3Rpb24gcG9vbCxcbiAgLy8gcmV0dXJuaW5nIGEgcHJvbWlzZSByZXNvbHZlZCB3aGVuIHRoZSBjb25uZWN0aW9uIGlzIHJlbGVhc2VkLlxuICByZWxlYXNlQ29ubmVjdGlvbihjb25uZWN0aW9uKSB7XG4gICAgY29uc3QgeyBwb29sIH0gPSB0aGlzXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmVyKSB7XG4gICAgICBkZWJ1ZygncmVsZWFzaW5nIGNvbm5lY3Rpb24gdG8gcG9vbDogJXMnLCBjb25uZWN0aW9uLl9fa25leFVpZClcbiAgICAgIHBvb2wucmVsZWFzZShjb25uZWN0aW9uKVxuICAgICAgcmVzb2x2ZXIoKVxuICAgIH0pXG4gIH0sXG5cbiAgLy8gRGVzdHJveSB0aGUgY3VycmVudCBjb25uZWN0aW9uIHBvb2wgZm9yIHRoZSBjbGllbnQuXG4gIGRlc3Ryb3koY2FsbGJhY2spIHtcbiAgICBjb25zdCBjbGllbnQgPSB0aGlzXG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmVyKSB7XG4gICAgICBpZiAoIWNsaWVudC5wb29sKSByZXR1cm4gcmVzb2x2ZXIoKVxuICAgICAgY2xpZW50LnBvb2wuZW5kKGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGllbnQucG9vbCA9IHVuZGVmaW5lZFxuICAgICAgICByZXNvbHZlcigpXG4gICAgICB9KVxuICAgIH0pXG4gICAgLy8gQWxsb3cgZWl0aGVyIGEgY2FsbGJhY2sgb3IgcHJvbWlzZSBpbnRlcmZhY2UgZm9yIGRlc3RydWN0aW9uLlxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHByb21pc2UuYXNDYWxsYmFjayhjYWxsYmFjaylcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHByb21pc2VcbiAgICB9XG4gIH0sXG5cbiAgLy8gUmV0dXJuIHRoZSBkYXRhYmFzZSBiZWluZyB1c2VkIGJ5IHRoaXMgY2xpZW50LlxuICBkYXRhYmFzZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uU2V0dGluZ3MuZGF0YWJhc2VcbiAgfSxcblxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gJ1tvYmplY3QgS25leENsaWVudF0nXG4gIH0sXG5cbiAgY2FuQ2FuY2VsUXVlcnk6IGZhbHNlLFxuXG4gIGFzc2VydENhbkNhbmNlbFF1ZXJ5KCkge1xuICAgIGlmICghdGhpcy5jYW5DYW5jZWxRdWVyeSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUXVlcnkgY2FuY2VsbGluZyBub3Qgc3VwcG9ydGVkIGZvciB0aGlzIGRpYWxlY3RcIik7XG4gICAgfVxuICB9LFxuXG4gIGNhbmNlbFF1ZXJ5KCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlF1ZXJ5IGNhbmNlbGxpbmcgbm90IHN1cHBvcnRlZCBmb3IgdGhpcyBkaWFsZWN0XCIpXG4gIH1cblxufSlcblxuZXhwb3J0IGRlZmF1bHQgQ2xpZW50XG4iXX0=