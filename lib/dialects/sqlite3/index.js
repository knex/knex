
// SQLite3
// -------
'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _promise = require('../../promise');

var _promise2 = _interopRequireDefault(_promise);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _lodash = require('lodash');

var _client = require('../../client');

var _client2 = _interopRequireDefault(_client);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _queryCompiler = require('./query/compiler');

var _queryCompiler2 = _interopRequireDefault(_queryCompiler);

var _schemaCompiler = require('./schema/compiler');

var _schemaCompiler2 = _interopRequireDefault(_schemaCompiler);

var _schemaColumncompiler = require('./schema/columncompiler');

var _schemaColumncompiler2 = _interopRequireDefault(_schemaColumncompiler);

var _schemaTablecompiler = require('./schema/tablecompiler');

var _schemaTablecompiler2 = _interopRequireDefault(_schemaTablecompiler);

var _schemaDdl = require('./schema/ddl');

var _schemaDdl2 = _interopRequireDefault(_schemaDdl);

function Client_SQLite3(config) {
  _client2['default'].call(this, config);
  if (_lodash.isUndefined(config.useNullAsDefault)) {
    helpers.warn('sqlite does not support inserting default values. Set the ' + '`useNullAsDefault` flag to hide this warning. ' + '(see docs http://knexjs.org/#Builder-insert).');
  }
}
_inherits2['default'](Client_SQLite3, _client2['default']);

_lodash.assign(Client_SQLite3.prototype, {

  dialect: 'sqlite3',

  driverName: 'sqlite3',

  _driver: function _driver() {
    return require('sqlite3');
  },

  SchemaCompiler: _schemaCompiler2['default'],

  QueryCompiler: _queryCompiler2['default'],

  ColumnCompiler: _schemaColumncompiler2['default'],

  TableCompiler: _schemaTablecompiler2['default'],

  ddl: function ddl(compiler, pragma, connection) {
    return new _schemaDdl2['default'](this, compiler, pragma, connection);
  },

  // Get a raw connection from the database, returning a promise with the connection object.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    return new _promise2['default'](function (resolve, reject) {
      var db = new client.driver.Database(client.connectionSettings.filename, function (err) {
        if (err) return reject(err);
        resolve(db);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool when
  // a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.close();
    cb();
  },

  // Runs the query on the specified connection, providing the bindings and any
  // other necessary prep work.
  _query: function _query(connection, obj) {
    var method = obj.method;

    var callMethod = undefined;
    switch (method) {
      case 'insert':
      case 'update':
      case 'counter':
      case 'del':
        callMethod = 'run';
        break;
      default:
        callMethod = 'all';
    }
    return new _promise2['default'](function (resolver, rejecter) {
      if (!connection || !connection[callMethod]) {
        return rejecter(new Error('Error calling ' + callMethod + ' on connection.'));
      }
      connection[callMethod](obj.sql, obj.bindings, function (err, response) {
        if (err) return rejecter(err);
        obj.response = response;

        // We need the context here, as it contains
        // the "this.lastID" or "this.changes"
        obj.context = this;
        return resolver(obj);
      });
    });
  },

  _stream: function _stream(connection, sql, stream) {
    var client = this;
    return new _promise2['default'](function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      return client._query(connection, sql).then(function (obj) {
        return obj.response;
      }).map(function (row) {
        stream.write(row);
      })['catch'](function (err) {
        stream.emit('error', err);
      }).then(function () {
        stream.end();
      });
    });
  },

  // Ensures the response is returned in the same format as other clients.
  processResponse: function processResponse(obj, runner) {
    var ctx = obj.context;
    var response = obj.response;

    if (obj.output) return obj.output.call(runner, response);
    switch (obj.method) {
      case 'select':
      case 'pluck':
      case 'first':
        response = helpers.skim(response);
        if (obj.method === 'pluck') response = _lodash.map(response, obj.pluck);
        return obj.method === 'first' ? response[0] : response;
      case 'insert':
        return [ctx.lastID];
      case 'del':
      case 'update':
      case 'counter':
        return ctx.changes;
      default:
        return response;
    }
  },

  poolDefaults: function poolDefaults(config) {
    return _lodash.assign(_client2['default'].prototype.poolDefaults.call(this, config), {
      min: 1,
      max: 1
    });
  },

  ping: function ping(resource, callback) {
    resource.each('SELECT 1', callback);
  }

});

exports['default'] = Client_SQLite3;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9zcWxpdGUzL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O3VCQUdvQixlQUFlOzs7O3dCQUVkLFVBQVU7Ozs7c0JBQ1UsUUFBUTs7c0JBRTlCLGNBQWM7Ozs7dUJBQ1IsZUFBZTs7SUFBNUIsT0FBTzs7NkJBRU8sa0JBQWtCOzs7OzhCQUNqQixtQkFBbUI7Ozs7b0NBQ25CLHlCQUF5Qjs7OzttQ0FDMUIsd0JBQXdCOzs7O3lCQUMxQixjQUFjOzs7O0FBRXRDLFNBQVMsY0FBYyxDQUFDLE1BQU0sRUFBRTtBQUM5QixzQkFBTyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3pCLE1BQUksb0JBQVksTUFBTSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7QUFDeEMsV0FBTyxDQUFDLElBQUksQ0FDViw0REFBNEQsR0FDNUQsZ0RBQWdELEdBQ2hELCtDQUErQyxDQUNoRCxDQUFDO0dBQ0g7Q0FDRjtBQUNELHNCQUFTLGNBQWMsc0JBQVMsQ0FBQTs7QUFFaEMsZUFBTyxjQUFjLENBQUMsU0FBUyxFQUFFOztBQUUvQixTQUFPLEVBQUUsU0FBUzs7QUFFbEIsWUFBVSxFQUFFLFNBQVM7O0FBRXJCLFNBQU8sRUFBQSxtQkFBRztBQUNSLFdBQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0dBQzFCOztBQUVELGdCQUFjLDZCQUFBOztBQUVkLGVBQWEsNEJBQUE7O0FBRWIsZ0JBQWMsbUNBQUE7O0FBRWQsZUFBYSxrQ0FBQTs7QUFFYixLQUFHLEVBQUEsYUFBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRTtBQUNoQyxXQUFPLDJCQUFnQixJQUFJLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQTtHQUMzRDs7O0FBR0Qsc0JBQW9CLEVBQUEsZ0NBQUc7QUFDckIsUUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFdBQU8seUJBQVksVUFBUyxP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WyJcbi8vIFNRTGl0ZTNcbi8vIC0tLS0tLS1cbmltcG9ydCBQcm9taXNlIGZyb20gJy4uLy4uL3Byb21pc2UnO1xuXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuaW1wb3J0IHsgaXNVbmRlZmluZWQsIG1hcCwgYXNzaWduIH0gZnJvbSAnbG9kYXNoJ1xuXG5pbXBvcnQgQ2xpZW50IGZyb20gJy4uLy4uL2NsaWVudCc7XG5pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4uLy4uL2hlbHBlcnMnO1xuXG5pbXBvcnQgUXVlcnlDb21waWxlciBmcm9tICcuL3F1ZXJ5L2NvbXBpbGVyJztcbmltcG9ydCBTY2hlbWFDb21waWxlciBmcm9tICcuL3NjaGVtYS9jb21waWxlcic7XG5pbXBvcnQgQ29sdW1uQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvY29sdW1uY29tcGlsZXInO1xuaW1wb3J0IFRhYmxlQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvdGFibGVjb21waWxlcic7XG5pbXBvcnQgU1FMaXRlM19EREwgZnJvbSAnLi9zY2hlbWEvZGRsJztcblxuZnVuY3Rpb24gQ2xpZW50X1NRTGl0ZTMoY29uZmlnKSB7XG4gIENsaWVudC5jYWxsKHRoaXMsIGNvbmZpZylcbiAgaWYgKGlzVW5kZWZpbmVkKGNvbmZpZy51c2VOdWxsQXNEZWZhdWx0KSkge1xuICAgIGhlbHBlcnMud2FybihcbiAgICAgICdzcWxpdGUgZG9lcyBub3Qgc3VwcG9ydCBpbnNlcnRpbmcgZGVmYXVsdCB2YWx1ZXMuIFNldCB0aGUgJyArXG4gICAgICAnYHVzZU51bGxBc0RlZmF1bHRgIGZsYWcgdG8gaGlkZSB0aGlzIHdhcm5pbmcuICcgK1xuICAgICAgJyhzZWUgZG9jcyBodHRwOi8va25leGpzLm9yZy8jQnVpbGRlci1pbnNlcnQpLidcbiAgICApO1xuICB9XG59XG5pbmhlcml0cyhDbGllbnRfU1FMaXRlMywgQ2xpZW50KVxuXG5hc3NpZ24oQ2xpZW50X1NRTGl0ZTMucHJvdG90eXBlLCB7XG5cbiAgZGlhbGVjdDogJ3NxbGl0ZTMnLFxuXG4gIGRyaXZlck5hbWU6ICdzcWxpdGUzJyxcblxuICBfZHJpdmVyKCkge1xuICAgIHJldHVybiByZXF1aXJlKCdzcWxpdGUzJylcbiAgfSxcblxuICBTY2hlbWFDb21waWxlcixcblxuICBRdWVyeUNvbXBpbGVyLFxuXG4gIENvbHVtbkNvbXBpbGVyLFxuXG4gIFRhYmxlQ29tcGlsZXIsXG5cbiAgZGRsKGNvbXBpbGVyLCBwcmFnbWEsIGNvbm5lY3Rpb24pIHtcbiAgICByZXR1cm4gbmV3IFNRTGl0ZTNfRERMKHRoaXMsIGNvbXBpbGVyLCBwcmFnbWEsIGNvbm5lY3Rpb24pXG4gIH0sXG5cbiAgLy8gR2V0IGEgcmF3IGNvbm5lY3Rpb24gZnJvbSB0aGUgZGF0YWJhc2UsIHJldHVybmluZyBhIHByb21pc2Ugd2l0aCB0aGUgY29ubmVjdGlvbiBvYmplY3QuXG4gIGFjcXVpcmVSYXdDb25uZWN0aW9uKCkge1xuICAgIGNvbnN0IGNsaWVudCA9IHRoaXM7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgY29uc3QgZGIgPSBuZXcgY2xpZW50LmRyaXZlci5EYXRhYmFzZShjbGllbnQuY29ubmVjdGlvblNldHRpbmdzLmZpbGVuYW1lLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIHJlamVjdChlcnIpXG4gICAgICAgIHJlc29sdmUoZGIpXG4gICAgICB9KVxuICAgIH0pXG4gIH0sXG5cbiAgLy8gVXNlZCB0byBleHBsaWNpdGx5IGNsb3NlIGEgY29ubmVjdGlvbiwgY2FsbGVkIGludGVybmFsbHkgYnkgdGhlIHBvb2wgd2hlblxuICAvLyBhIGNvbm5lY3Rpb24gdGltZXMgb3V0IG9yIHRoZSBwb29sIGlzIHNodXRkb3duLlxuICBkZXN0cm95UmF3Q29ubmVjdGlvbihjb25uZWN0aW9uLCBjYikge1xuICAgIGNvbm5lY3Rpb24uY2xvc2UoKVxuICAgIGNiKClcbiAgfSxcblxuICAvLyBSdW5zIHRoZSBxdWVyeSBvbiB0aGUgc3BlY2lmaWVkIGNvbm5lY3Rpb24sIHByb3ZpZGluZyB0aGUgYmluZGluZ3MgYW5kIGFueVxuICAvLyBvdGhlciBuZWNlc3NhcnkgcHJlcCB3b3JrLlxuICBfcXVlcnkoY29ubmVjdGlvbiwgb2JqKSB7XG4gICAgY29uc3QgeyBtZXRob2QgfSA9IG9iajtcbiAgICBsZXQgY2FsbE1ldGhvZDtcbiAgICBzd2l0Y2ggKG1ldGhvZCkge1xuICAgICAgY2FzZSAnaW5zZXJ0JzpcbiAgICAgIGNhc2UgJ3VwZGF0ZSc6XG4gICAgICBjYXNlICdjb3VudGVyJzpcbiAgICAgIGNhc2UgJ2RlbCc6XG4gICAgICAgIGNhbGxNZXRob2QgPSAncnVuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjYWxsTWV0aG9kID0gJ2FsbCc7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlciwgcmVqZWN0ZXIpIHtcbiAgICAgIGlmICghY29ubmVjdGlvbiB8fCAhY29ubmVjdGlvbltjYWxsTWV0aG9kXSkge1xuICAgICAgICByZXR1cm4gcmVqZWN0ZXIobmV3IEVycm9yKGBFcnJvciBjYWxsaW5nICR7Y2FsbE1ldGhvZH0gb24gY29ubmVjdGlvbi5gKSlcbiAgICAgIH1cbiAgICAgIGNvbm5lY3Rpb25bY2FsbE1ldGhvZF0ob2JqLnNxbCwgb2JqLmJpbmRpbmdzLCBmdW5jdGlvbihlcnIsIHJlc3BvbnNlKSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3RlcihlcnIpXG4gICAgICAgIG9iai5yZXNwb25zZSA9IHJlc3BvbnNlO1xuXG4gICAgICAgIC8vIFdlIG5lZWQgdGhlIGNvbnRleHQgaGVyZSwgYXMgaXQgY29udGFpbnNcbiAgICAgICAgLy8gdGhlIFwidGhpcy5sYXN0SURcIiBvciBcInRoaXMuY2hhbmdlc1wiXG4gICAgICAgIG9iai5jb250ZXh0ID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHJlc29sdmVyKG9iailcbiAgICAgIH0pXG4gICAgfSlcbiAgfSxcblxuICBfc3RyZWFtKGNvbm5lY3Rpb24sIHNxbCwgc3RyZWFtKSB7XG4gICAgY29uc3QgY2xpZW50ID0gdGhpcztcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZXIsIHJlamVjdGVyKSB7XG4gICAgICBzdHJlYW0ub24oJ2Vycm9yJywgcmVqZWN0ZXIpXG4gICAgICBzdHJlYW0ub24oJ2VuZCcsIHJlc29sdmVyKVxuICAgICAgcmV0dXJuIGNsaWVudC5fcXVlcnkoY29ubmVjdGlvbiwgc3FsKS50aGVuKG9iaiA9PiBvYmoucmVzcG9uc2UpLm1hcChmdW5jdGlvbihyb3cpIHtcbiAgICAgICAgc3RyZWFtLndyaXRlKHJvdylcbiAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBzdHJlYW0uZW1pdCgnZXJyb3InLCBlcnIpXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBzdHJlYW0uZW5kKClcbiAgICAgIH0pXG4gICAgfSlcbiAgfSxcblxuICAvLyBFbnN1cmVzIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZCBpbiB0aGUgc2FtZSBmb3JtYXQgYXMgb3RoZXIgY2xpZW50cy5cbiAgcHJvY2Vzc1Jlc3BvbnNlKG9iaiwgcnVubmVyKSB7XG4gICAgY29uc3QgY3R4ID0gb2JqLmNvbnRleHQ7XG4gICAgbGV0IHsgcmVzcG9uc2UgfSA9IG9iajtcbiAgICBpZiAob2JqLm91dHB1dCkgcmV0dXJuIG9iai5vdXRwdXQuY2FsbChydW5uZXIsIHJlc3BvbnNlKVxuICAgIHN3aXRjaCAob2JqLm1ldGhvZCkge1xuICAgICAgY2FzZSAnc2VsZWN0JzpcbiAgICAgIGNhc2UgJ3BsdWNrJzpcbiAgICAgIGNhc2UgJ2ZpcnN0JzpcbiAgICAgICAgcmVzcG9uc2UgPSBoZWxwZXJzLnNraW0ocmVzcG9uc2UpXG4gICAgICAgIGlmIChvYmoubWV0aG9kID09PSAncGx1Y2snKSByZXNwb25zZSA9IG1hcChyZXNwb25zZSwgb2JqLnBsdWNrKVxuICAgICAgICByZXR1cm4gb2JqLm1ldGhvZCA9PT0gJ2ZpcnN0JyA/IHJlc3BvbnNlWzBdIDogcmVzcG9uc2U7XG4gICAgICBjYXNlICdpbnNlcnQnOlxuICAgICAgICByZXR1cm4gW2N0eC5sYXN0SURdO1xuICAgICAgY2FzZSAnZGVsJzpcbiAgICAgIGNhc2UgJ3VwZGF0ZSc6XG4gICAgICBjYXNlICdjb3VudGVyJzpcbiAgICAgICAgcmV0dXJuIGN0eC5jaGFuZ2VzO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH1cbiAgfSxcblxuICBwb29sRGVmYXVsdHMoY29uZmlnKSB7XG4gICAgcmV0dXJuIGFzc2lnbihDbGllbnQucHJvdG90eXBlLnBvb2xEZWZhdWx0cy5jYWxsKHRoaXMsIGNvbmZpZyksIHtcbiAgICAgIG1pbjogMSxcbiAgICAgIG1heDogMVxuICAgIH0pXG4gIH0sXG5cbiAgcGluZyhyZXNvdXJjZSwgY2FsbGJhY2spIHtcbiAgICByZXNvdXJjZS5lYWNoKCdTRUxFQ1QgMScsIGNhbGxiYWNrKTtcbiAgfVxuXG59KVxuXG5leHBvcnQgZGVmYXVsdCBDbGllbnRfU1FMaXRlM1xuIl19