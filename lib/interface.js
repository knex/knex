'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _helpers = require('./helpers');

var helpers = _interopRequireWildcard(_helpers);

var _lodash = require('lodash');

exports['default'] = function (Target) {

  Target.prototype.toQuery = function (tz) {
    var _this = this;

    var data = this.toSQL(this._method, tz);
    if (!_lodash.isArray(data)) data = [data];
    return _lodash.map(data, function (statement) {
      return _this._formatQuery(statement.sql, statement.bindings, tz);
    }).join(';\n');
  };

  // Format the query as sql, prepping bindings as necessary.
  Target.prototype._formatQuery = function (sql, bindings, tz) {
    return this.client.SqlString.format(sql, bindings, tz);
  };

  // Create a new instance of the `Runner`, passing in the current object.
  Target.prototype.then = function () /* onFulfilled, onRejected */{
    var result = this.client.runner(this).run();
    return result.then.apply(result, arguments);
  };

  // Add additional "options" to the builder. Typically used for client specific
  // items, like the `mysql` and `sqlite3` drivers.
  Target.prototype.options = function (opts) {
    this._options = this._options || [];
    this._options.push(_lodash.clone(opts) || {});
    this._cached = undefined;
    return this;
  };

  // Sets an explicit "connnection" we wish to use for this query.
  Target.prototype.connection = function (connection) {
    this._connection = connection;
    return this;
  };

  // Set a debug flag for the current schema query stack.
  Target.prototype.debug = function (enabled) {
    this._debug = arguments.length ? enabled : true;
    return this;
  };

  // Set the transaction object for this query.
  Target.prototype.transacting = function (t) {
    if (t && t.client) {
      if (!t.client.transacting) {
        helpers.warn('Invalid transaction value: ' + t.client);
      } else {
        this.client = t.client;
      }
    }
    return this;
  };

  // Initializes a stream.
  Target.prototype.stream = function (options) {
    return this.client.runner(this).stream(options);
  };

  // Initialize a stream & pipe automatically.
  Target.prototype.pipe = function (writable, options) {
    return this.client.runner(this).pipe(writable, options);
  };

  // Creates a method which "coerces" to a promise, by calling a
  // "then" method on the current `Target`
  _lodash.each(['bind', 'catch', 'finally', 'asCallback', 'spread', 'map', 'reduce', 'tap', 'thenReturn', 'return', 'yield', 'ensure', 'exec', 'reflect'], function (method) {
    Target.prototype[method] = function () {
      var then = this.then();
      then = then[method].apply(then, arguments);
      return then;
    };
  });
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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T0FBTyxDQUFDLENBQUM7R0FDakQsQ0FBQzs7O0FBR0YsUUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsVUFBUyxRQUFRLEVBQUUsT0FBTyxFQUFFO0FBQ2xELFdBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztHQUN6RCxDQUFDOzs7O0FBSUYsZUFBSyxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFDNUMsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFDOUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxFQUFFLFVBQVMsTUFBTSxFQUFFO0FBQ2xFLFVBQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsWUFBVztBQUNwQyxVQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDdkIsVUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQzNDLGFBQU8sSUFBSSxDQUFDO0tBQ2IsQ0FBQztHQUNILENBQUMsQ0FBQztDQUVKIiwiZmlsZSI6ImludGVyZmFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgaXNBcnJheSwgbWFwLCBjbG9uZSwgZWFjaCB9IGZyb20gJ2xvZGFzaCdcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oVGFyZ2V0KSB7XG5cbiAgVGFyZ2V0LnByb3RvdHlwZS50b1F1ZXJ5ID0gZnVuY3Rpb24odHopIHtcbiAgICBsZXQgZGF0YSA9IHRoaXMudG9TUUwodGhpcy5fbWV0aG9kLCB0eik7XG4gICAgaWYgKCFpc0FycmF5KGRhdGEpKSBkYXRhID0gW2RhdGFdO1xuICAgIHJldHVybiBtYXAoZGF0YSwgKHN0YXRlbWVudCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuX2Zvcm1hdFF1ZXJ5KHN0YXRlbWVudC5zcWwsIHN0YXRlbWVudC5iaW5kaW5ncywgdHopO1xuICAgIH0pLmpvaW4oJztcXG4nKTtcbiAgfTtcblxuICAvLyBGb3JtYXQgdGhlIHF1ZXJ5IGFzIHNxbCwgcHJlcHBpbmcgYmluZGluZ3MgYXMgbmVjZXNzYXJ5LlxuICBUYXJnZXQucHJvdG90eXBlLl9mb3JtYXRRdWVyeSA9IGZ1bmN0aW9uKHNxbCwgYmluZGluZ3MsIHR6KSB7XG4gICAgcmV0dXJuIHRoaXMuY2xpZW50LlNxbFN0cmluZy5mb3JtYXQoc3FsLCBiaW5kaW5ncywgdHopO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYFJ1bm5lcmAsIHBhc3NpbmcgaW4gdGhlIGN1cnJlbnQgb2JqZWN0LlxuICBUYXJnZXQucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbigvKiBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCAqLykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuY2xpZW50LnJ1bm5lcih0aGlzKS5ydW4oKVxuICAgIHJldHVybiByZXN1bHQudGhlbi5hcHBseShyZXN1bHQsIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgLy8gQWRkIGFkZGl0aW9uYWwgXCJvcHRpb25zXCIgdG8gdGhlIGJ1aWxkZXIuIFR5cGljYWxseSB1c2VkIGZvciBjbGllbnQgc3BlY2lmaWNcbiAgLy8gaXRlbXMsIGxpa2UgdGhlIGBteXNxbGAgYW5kIGBzcWxpdGUzYCBkcml2ZXJzLlxuICBUYXJnZXQucHJvdG90eXBlLm9wdGlvbnMgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5fb3B0aW9ucyA9IHRoaXMuX29wdGlvbnMgfHwgW107XG4gICAgdGhpcy5fb3B0aW9ucy5wdXNoKGNsb25lKG9wdHMpIHx8IHt9KTtcbiAgICB0aGlzLl9jYWNoZWQgPSB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBTZXRzIGFuIGV4cGxpY2l0IFwiY29ubm5lY3Rpb25cIiB3ZSB3aXNoIHRvIHVzZSBmb3IgdGhpcyBxdWVyeS5cbiAgVGFyZ2V0LnByb3RvdHlwZS5jb25uZWN0aW9uID0gZnVuY3Rpb24oY29ubmVjdGlvbikge1xuICAgIHRoaXMuX2Nvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8vIFNldCBhIGRlYnVnIGZsYWcgZm9yIHRoZSBjdXJyZW50IHNjaGVtYSBxdWVyeSBzdGFjay5cbiAgVGFyZ2V0LnByb3RvdHlwZS5kZWJ1ZyA9IGZ1bmN0aW9uKGVuYWJsZWQpIHtcbiAgICB0aGlzLl9kZWJ1ZyA9IGFyZ3VtZW50cy5sZW5ndGggPyBlbmFibGVkIDogdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBTZXQgdGhlIHRyYW5zYWN0aW9uIG9iamVjdCBmb3IgdGhpcyBxdWVyeS5cbiAgVGFyZ2V0LnByb3RvdHlwZS50cmFuc2FjdGluZyA9IGZ1bmN0aW9uKHQpIHtcbiAgICBpZiAodCAmJiB0LmNsaWVudCkge1xuICAgICAgaWYgKCF0LmNsaWVudC50cmFuc2FjdGluZykge1xuICAgICAgICBoZWxwZXJzLndhcm4oYEludmFsaWQgdHJhbnNhY3Rpb24gdmFsdWU6ICR7dC5jbGllbnR9YClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2xpZW50ID0gdC5jbGllbnRcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gSW5pdGlhbGl6ZXMgYSBzdHJlYW0uXG4gIFRhcmdldC5wcm90b3R5cGUuc3RyZWFtID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzLmNsaWVudC5ydW5uZXIodGhpcykuc3RyZWFtKG9wdGlvbnMpO1xuICB9O1xuXG4gIC8vIEluaXRpYWxpemUgYSBzdHJlYW0gJiBwaXBlIGF1dG9tYXRpY2FsbHkuXG4gIFRhcmdldC5wcm90b3R5cGUucGlwZSA9IGZ1bmN0aW9uKHdyaXRhYmxlLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuY2xpZW50LnJ1bm5lcih0aGlzKS5waXBlKHdyaXRhYmxlLCBvcHRpb25zKTtcbiAgfTtcblxuICAvLyBDcmVhdGVzIGEgbWV0aG9kIHdoaWNoIFwiY29lcmNlc1wiIHRvIGEgcHJvbWlzZSwgYnkgY2FsbGluZyBhXG4gIC8vIFwidGhlblwiIG1ldGhvZCBvbiB0aGUgY3VycmVudCBgVGFyZ2V0YFxuICBlYWNoKFsnYmluZCcsICdjYXRjaCcsICdmaW5hbGx5JywgJ2FzQ2FsbGJhY2snLFxuICAgICdzcHJlYWQnLCAnbWFwJywgJ3JlZHVjZScsICd0YXAnLCAndGhlblJldHVybicsXG4gICAgJ3JldHVybicsICd5aWVsZCcsICdlbnN1cmUnLCAnZXhlYycsICdyZWZsZWN0J10sIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgIFRhcmdldC5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgbGV0IHRoZW4gPSB0aGlzLnRoZW4oKTtcbiAgICAgIHRoZW4gPSB0aGVuW21ldGhvZF0uYXBwbHkodGhlbiwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGVuO1xuICAgIH07XG4gIH0pO1xuXG59XG4iXX0=