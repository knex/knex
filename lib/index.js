'use strict';

exports.__esModule = true;
exports['default'] = Knex;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _raw = require('./raw');

var _raw2 = _interopRequireDefault(_raw);

var _helpers = require('./helpers');

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _utilMakeClient = require('./util/make-client');

var _utilMakeClient2 = _interopRequireDefault(_utilMakeClient);

var _utilMakeKnex = require('./util/make-knex');

var _utilMakeKnex2 = _interopRequireDefault(_utilMakeKnex);

var _utilParseConnection = require('./util/parse-connection');

var _utilParseConnection2 = _interopRequireDefault(_utilParseConnection);

var _lodash = require('lodash');

// The client names we'll allow in the `{name: lib}` pairing.
var aliases = {
  'mariadb': 'maria',
  'mariasql': 'maria',
  'pg': 'postgres',
  'postgresql': 'postgres',
  'sqlite': 'sqlite3'
};

function Knex(config) {
  if (typeof config === 'string') {
    return new Knex(_lodash.assign(_utilParseConnection2['default'](config), arguments[2]));
  }
  var Dialect = undefined;
  if (arguments.length === 0 || !config.client && !config.dialect) {
    Dialect = _utilMakeClient2['default'](_client2['default']);
  } else if (typeof config.client === 'function' && config.client.prototype instanceof _client2['default']) {
    Dialect = _utilMakeClient2['default'](config.client);
  } else {
    var clientName = config.client || config.dialect;
    Dialect = _utilMakeClient2['default'](require('./dialects/' + (aliases[clientName] || clientName) + '/index.js'));
  }
  if (typeof config.connection === 'string') {
    config = _lodash.assign({}, config, { connection: _utilParseConnection2['default'](config.connection).connection });
  }
  return _utilMakeKnex2['default'](new Dialect(config));
}

// Expose Client on the main Knex namespace.
Knex.Client = _client2['default'];

// Expose Knex version on the main Knex namespace.
Knex.VERSION = require('../package.json').version;

// Run a "raw" query, though we can't do anything with it other than put
// it in a query statement.
Knex.raw = function (sql, bindings) {
  return new _raw2['default']({}).set(sql, bindings);
};

// Create a new "knex" instance with the appropriate configured client.
Knex.initialize = function (config) {
  _helpers.warn('knex.initialize is deprecated, pass your config object directly to the knex module');
  return new Knex(config);
};

// Bluebird
Knex.Promise = require('./promise');

// Doing this ensures Browserify works. Still need to figure out
// the best way to do some of this.
if (process.browser) {
  require('./dialects/websql/index.js');
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7cUJBb0J3QixJQUFJOzs7O21CQW5CWixPQUFPOzs7O3VCQUNGLFdBQVc7O3NCQUNiLFVBQVU7Ozs7OEJBRU4sb0JBQW9COzs7OzRCQUN0QixrQkFBa0I7Ozs7bUNBQ1gseUJBQXlCOzs7O3NCQUU5QixRQUFROzs7QUFHL0IsSUFBTSxPQUFPLEdBQUc7QUFDZCxXQUFTLEVBQUssT0FBTztBQUNyQixZQUFVLEVBQUksT0FBTztBQUNyQixNQUFJLEVBQVUsVUFBVTtBQUN4QixjQUFZLEVBQUUsVUFBVTtBQUN4QixVQUFRLEVBQU0sU0FBUztDQUN4QixDQUFDOztBQUVhLFNBQVMsSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNuQyxNQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRTtBQUM5QixXQUFPLElBQUksSUFBSSxDQUFDLGVBQU8saUNBQWdCLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FDL0Q7QUFDRCxNQUFJLE9BQU8sWUFBQSxDQUFDO0FBQ1osTUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxBQUFDLEVBQUU7QUFDakUsV0FBTyxHQUFHLGdEQUFrQixDQUFBO0dBQzdCLE1BQU0sSUFBSSxPQUFPLE1BQU0sQ0FBQyxNQUFNLEtBQUssVUFBVSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUywrQkFBa0IsRUFBRTtBQUMzRixXQUFPLEdBQUcsNEJBQVcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0dBQ3BDLE1BQU07QUFDTCxRQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUE7QUFDbEQsV0FBTyxHQUFHLDRCQUFXLE9BQU8sa0JBQWUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLFVBQVUsQ0FBQSxlQUFZLENBQUMsQ0FBQTtHQUMxRjtBQUNELE1BQUksT0FBTyxNQUFNLENBQUMsVUFBVSxLQUFLLFFBQVEsRUFBRTtBQUN6QyxVQUFNLEdBQUcsZUFBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUMsVUFBVSxFQUFFLGlDQUFnQixNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsVUFBVSxFQUFDLENBQUMsQ0FBQTtHQUN6RjtBQUNELFNBQU8sMEJBQVMsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtDQUNyQzs7O0FBR0QsSUFBSSxDQUFDLE1BQU0sc0JBQVMsQ0FBQTs7O0FBR3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsT0FBTyxDQUFBOzs7O0FBSWpELElBQUksQ0FBQyxHQUFHLEdBQUcsVUFBQyxHQUFHLEVBQUUsUUFBUTtTQUFLLHFCQUFRLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDO0NBQUEsQ0FBQTs7O0FBRzVELElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBUyxNQUFNLEVBQUU7QUFDakMsZ0JBQUssb0ZBQW9GLENBQUMsQ0FBQTtBQUMxRixTQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0NBQ3hCLENBQUE7OztBQUdELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFBOzs7O0FBSW5DLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRTtBQUNuQixTQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQTtDQUN0QyIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IFJhdyBmcm9tICcuL3Jhdyc7XG5pbXBvcnQgeyB3YXJuIH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCBDbGllbnQgZnJvbSAnLi9jbGllbnQnO1xuXG5pbXBvcnQgbWFrZUNsaWVudCBmcm9tICcuL3V0aWwvbWFrZS1jbGllbnQnO1xuaW1wb3J0IG1ha2VLbmV4IGZyb20gJy4vdXRpbC9tYWtlLWtuZXgnO1xuaW1wb3J0IHBhcnNlQ29ubmVjdGlvbiBmcm9tICcuL3V0aWwvcGFyc2UtY29ubmVjdGlvbic7XG5cbmltcG9ydCB7IGFzc2lnbiB9IGZyb20gJ2xvZGFzaCdcblxuLy8gVGhlIGNsaWVudCBuYW1lcyB3ZSdsbCBhbGxvdyBpbiB0aGUgYHtuYW1lOiBsaWJ9YCBwYWlyaW5nLlxuY29uc3QgYWxpYXNlcyA9IHtcbiAgJ21hcmlhZGInICAgOiAnbWFyaWEnLFxuICAnbWFyaWFzcWwnICA6ICdtYXJpYScsXG4gICdwZycgICAgICAgIDogJ3Bvc3RncmVzJyxcbiAgJ3Bvc3RncmVzcWwnOiAncG9zdGdyZXMnLFxuICAnc3FsaXRlJyAgICA6ICdzcWxpdGUzJ1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gS25leChjb25maWcpIHtcbiAgaWYgKHR5cGVvZiBjb25maWcgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIG5ldyBLbmV4KGFzc2lnbihwYXJzZUNvbm5lY3Rpb24oY29uZmlnKSwgYXJndW1lbnRzWzJdKSlcbiAgfVxuICBsZXQgRGlhbGVjdDtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDAgfHwgKCFjb25maWcuY2xpZW50ICYmICFjb25maWcuZGlhbGVjdCkpIHtcbiAgICBEaWFsZWN0ID0gbWFrZUNsaWVudChDbGllbnQpXG4gIH0gZWxzZSBpZiAodHlwZW9mIGNvbmZpZy5jbGllbnQgPT09ICdmdW5jdGlvbicgJiYgY29uZmlnLmNsaWVudC5wcm90b3R5cGUgaW5zdGFuY2VvZiBDbGllbnQpIHtcbiAgICBEaWFsZWN0ID0gbWFrZUNsaWVudChjb25maWcuY2xpZW50KVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNsaWVudE5hbWUgPSBjb25maWcuY2xpZW50IHx8IGNvbmZpZy5kaWFsZWN0XG4gICAgRGlhbGVjdCA9IG1ha2VDbGllbnQocmVxdWlyZShgLi9kaWFsZWN0cy8ke2FsaWFzZXNbY2xpZW50TmFtZV0gfHwgY2xpZW50TmFtZX0vaW5kZXguanNgKSlcbiAgfVxuICBpZiAodHlwZW9mIGNvbmZpZy5jb25uZWN0aW9uID09PSAnc3RyaW5nJykge1xuICAgIGNvbmZpZyA9IGFzc2lnbih7fSwgY29uZmlnLCB7Y29ubmVjdGlvbjogcGFyc2VDb25uZWN0aW9uKGNvbmZpZy5jb25uZWN0aW9uKS5jb25uZWN0aW9ufSlcbiAgfVxuICByZXR1cm4gbWFrZUtuZXgobmV3IERpYWxlY3QoY29uZmlnKSlcbn1cblxuLy8gRXhwb3NlIENsaWVudCBvbiB0aGUgbWFpbiBLbmV4IG5hbWVzcGFjZS5cbktuZXguQ2xpZW50ID0gQ2xpZW50XG5cbi8vIEV4cG9zZSBLbmV4IHZlcnNpb24gb24gdGhlIG1haW4gS25leCBuYW1lc3BhY2UuXG5LbmV4LlZFUlNJT04gPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKS52ZXJzaW9uXG5cbi8vIFJ1biBhIFwicmF3XCIgcXVlcnksIHRob3VnaCB3ZSBjYW4ndCBkbyBhbnl0aGluZyB3aXRoIGl0IG90aGVyIHRoYW4gcHV0XG4vLyBpdCBpbiBhIHF1ZXJ5IHN0YXRlbWVudC5cbktuZXgucmF3ID0gKHNxbCwgYmluZGluZ3MpID0+IG5ldyBSYXcoe30pLnNldChzcWwsIGJpbmRpbmdzKVxuXG4vLyBDcmVhdGUgYSBuZXcgXCJrbmV4XCIgaW5zdGFuY2Ugd2l0aCB0aGUgYXBwcm9wcmlhdGUgY29uZmlndXJlZCBjbGllbnQuXG5LbmV4LmluaXRpYWxpemUgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgd2Fybigna25leC5pbml0aWFsaXplIGlzIGRlcHJlY2F0ZWQsIHBhc3MgeW91ciBjb25maWcgb2JqZWN0IGRpcmVjdGx5IHRvIHRoZSBrbmV4IG1vZHVsZScpXG4gIHJldHVybiBuZXcgS25leChjb25maWcpXG59XG5cbi8vIEJsdWViaXJkXG5LbmV4LlByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuXG4vLyBEb2luZyB0aGlzIGVuc3VyZXMgQnJvd3NlcmlmeSB3b3Jrcy4gU3RpbGwgbmVlZCB0byBmaWd1cmUgb3V0XG4vLyB0aGUgYmVzdCB3YXkgdG8gZG8gc29tZSBvZiB0aGlzLlxuaWYgKHByb2Nlc3MuYnJvd3Nlcikge1xuICByZXF1aXJlKCcuL2RpYWxlY3RzL3dlYnNxbC9pbmRleC5qcycpXG59XG4iXX0=