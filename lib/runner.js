'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _promise = require('./promise');

var _promise2 = _interopRequireDefault(_promise);

var _helpers = require('./helpers');

var helpers = _interopRequireWildcard(_helpers);

var PassThrough = undefined;

// The "Runner" constructor takes a "builder" (query, schema, or raw)
// and runs through each of the query statements, calling any additional
// "output" method provided alongside the query and bindings.
function Runner(client, builder) {
  this.client = client;
  this.builder = builder;
  this.queries = [];

  // The "connection" object is set on the runner when
  // "run" is called.
  this.connection = void 0;
}

_lodash.assign(Runner.prototype, {

  // "Run" the target, calling "toSQL" on the builder, returning
  // an object or array of queries to run, each of which are run on
  // a single connection.
  run: function run() {
    var runner = this;
    return _promise2['default'].using(this.ensureConnection(), function (connection) {
      runner.connection = connection;

      runner.client.emit('start', runner.builder);
      runner.builder.emit('start', runner.builder);
      var sql = runner.builder.toSQL();

      if (runner.builder._debug) {
        helpers.debugLog(sql);
      }

      if (_lodash.isArray(sql)) {
        return runner.queryArray(sql);
      }
      return runner.query(sql);
    })

    // If there are any "error" listeners, we fire an error event
    // and then re-throw the error to be eventually handled by
    // the promise chain. Useful if you're wrapping in a custom `Promise`.
    ['catch'](function (err) {
      if (runner.builder._events && runner.builder._events.error) {
        runner.builder.emit('error', err);
      }
      throw err;
    })

    // Fire a single "end" event on the builder when
    // all queries have successfully completed.
    .tap(function () {
      runner.builder.emit('end');
    });
  },

  // Stream the result set, by passing through to the dialect's streaming
  // capabilities. If the options are
  stream: function stream(options, handler) {

    // If we specify stream(handler).then(...
    if (arguments.length === 1) {
      if (typeof options === 'function') {
        handler = options;
        options = {};
      }
    }

    // Determines whether we emit an error or throw here.
    var hasHandler = typeof handler === 'function';

    // Lazy-load the "PassThrough" dependency.
    PassThrough = PassThrough || require('readable-stream').PassThrough;

    var runner = this;
    var stream = new PassThrough({ objectMode: true });
    var promise = _promise2['default'].using(this.ensureConnection(), function (connection) {
      runner.connection = connection;
      var sql = runner.builder.toSQL();
      var err = new Error('The stream may only be used with a single query statement.');
      if (_lodash.isArray(sql)) {
        if (hasHandler) throw err;
        stream.emit('error', err);
      }
      return runner.client.stream(runner.connection, sql, stream, options);
    });

    // If a function is passed to handle the stream, send the stream
    // there and return the promise, otherwise just return the stream
    // and the promise will take care of itsself.
    if (hasHandler) {
      handler(stream);
      return promise;
    }
    return stream;
  },

  // Allow you to pipe the stream to a writable stream.
  pipe: function pipe(writable, options) {
    return this.stream(options).pipe(writable);
  },

  // "Runs" a query, returning a promise. All queries specified by the builder are guaranteed
  // to run in sequence, and on the same connection, especially helpful when schema building
  // and dealing with foreign key constraints, etc.
  query: _promise2['default'].method(function (obj) {
    var _this = this;

    this.builder.emit('query', _lodash.assign({ __knexUid: this.connection.__knexUid }, obj));
    var runner = this;
    var queryPromise = this.client.query(this.connection, obj);

    if (obj.timeout) {
      queryPromise = queryPromise.timeout(obj.timeout);
    }

    return queryPromise.then(function (resp) {
      var processedResponse = _this.client.processResponse(resp, runner);
      _this.builder.emit('query-response', processedResponse, _lodash.assign({ __knexUid: _this.connection.__knexUid }, obj), _this.builder);
      _this.client.emit('query-response', processedResponse, _lodash.assign({ __knexUid: _this.connection.__knexUid }, obj), _this.builder);
      return processedResponse;
    })['catch'](_promise2['default'].TimeoutError, function (error) {
      var timeout = obj.timeout;
      var sql = obj.sql;
      var bindings = obj.bindings;

      var cancelQuery = undefined;
      if (obj.cancelOnTimeout) {
        cancelQuery = _this.client.cancelQuery(_this.connection);
      } else {
        cancelQuery = _promise2['default'].resolve();
      }

      return cancelQuery['catch'](function (cancelError) {
        // cancellation failed
        throw _lodash.assign(cancelError, {
          message: 'After query timeout of ' + timeout + 'ms exceeded, cancelling of query failed.',
          sql: sql, bindings: bindings, timeout: timeout
        });
      }).then(function () {
        // cancellation succeeded, rethrow timeout error
        throw _lodash.assign(error, {
          message: 'Defined query timeout of ' + timeout + 'ms exceeded when running query.',
          sql: sql, bindings: bindings, timeout: timeout
        });
      });
    })['catch'](function (error) {
      _this.builder.emit('query-error', error, _lodash.assign({ __knexUid: _this.connection.__knexUid }, obj));
      throw error;
    });
  }),

  // In the case of the "schema builder" we call `queryArray`, which runs each
  // of the queries in sequence.
  queryArray: function queryArray(queries) {
    return queries.length === 1 ? this.query(queries[0]) : _promise2['default'].bind(this)['return'](queries).reduce(function (memo, query) {
      return this.query(query).then(function (resp) {
        memo.push(resp);
        return memo;
      });
    }, []);
  },

  // Check whether there's a transaction flag, and that it has a connection.
  ensureConnection: function ensureConnection() {
    var runner = this;
    var acquireConnectionTimeout = runner.client.config.acquireConnectionTimeout || 60000;
    return _promise2['default']['try'](function () {
      return runner.connection || new _promise2['default'](function (resolver, rejecter) {
        var acquireConnection = runner.client.acquireConnection();

        acquireConnection.completed.timeout(acquireConnectionTimeout).then(resolver)['catch'](_promise2['default'].TimeoutError, function (error) {
          var timeoutError = new Error('Knex: Timeout acquiring a connection. The pool is probably full. ' + 'Are you missing a .transacting(trx) call?');
          var additionalErrorInformation = {
            timeoutStack: error.stack
          };

          if (runner.builder) {
            additionalErrorInformation.sql = runner.builder.sql;
            additionalErrorInformation.bindings = runner.builder.bindings;
          }

          _lodash.assign(timeoutError, additionalErrorInformation);

          // Let the pool know that this request for a connection timed out
          acquireConnection.abort('Knex: Timeout acquiring a connection.');

          rejecter(timeoutError);
        })['catch'](rejecter);
      });
    }).disposer(function () {
      if (runner.connection.__knex__disposed) return;
      runner.client.releaseConnection(runner.connection);
    });
  }

});

exports['default'] = Runner;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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QUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFBO0tBQ25ELENBQUMsQ0FBQTtHQUNIOztDQUVGLENBQUMsQ0FBQTs7cUJBRWEsTUFBTSIsImZpbGUiOiJydW5uZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhc3NpZ24sIGlzQXJyYXkgfSBmcm9tICdsb2Rhc2gnXG5pbXBvcnQgUHJvbWlzZSBmcm9tICcuL3Byb21pc2UnO1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuL2hlbHBlcnMnO1xuXG5sZXQgUGFzc1Rocm91Z2g7XG5cbi8vIFRoZSBcIlJ1bm5lclwiIGNvbnN0cnVjdG9yIHRha2VzIGEgXCJidWlsZGVyXCIgKHF1ZXJ5LCBzY2hlbWEsIG9yIHJhdylcbi8vIGFuZCBydW5zIHRocm91Z2ggZWFjaCBvZiB0aGUgcXVlcnkgc3RhdGVtZW50cywgY2FsbGluZyBhbnkgYWRkaXRpb25hbFxuLy8gXCJvdXRwdXRcIiBtZXRob2QgcHJvdmlkZWQgYWxvbmdzaWRlIHRoZSBxdWVyeSBhbmQgYmluZGluZ3MuXG5mdW5jdGlvbiBSdW5uZXIoY2xpZW50LCBidWlsZGVyKSB7XG4gIHRoaXMuY2xpZW50ID0gY2xpZW50XG4gIHRoaXMuYnVpbGRlciA9IGJ1aWxkZXJcbiAgdGhpcy5xdWVyaWVzID0gW11cblxuICAvLyBUaGUgXCJjb25uZWN0aW9uXCIgb2JqZWN0IGlzIHNldCBvbiB0aGUgcnVubmVyIHdoZW5cbiAgLy8gXCJydW5cIiBpcyBjYWxsZWQuXG4gIHRoaXMuY29ubmVjdGlvbiA9IHZvaWQgMFxufVxuXG5hc3NpZ24oUnVubmVyLnByb3RvdHlwZSwge1xuXG4gIC8vIFwiUnVuXCIgdGhlIHRhcmdldCwgY2FsbGluZyBcInRvU1FMXCIgb24gdGhlIGJ1aWxkZXIsIHJldHVybmluZ1xuICAvLyBhbiBvYmplY3Qgb3IgYXJyYXkgb2YgcXVlcmllcyB0byBydW4sIGVhY2ggb2Ygd2hpY2ggYXJlIHJ1biBvblxuICAvLyBhIHNpbmdsZSBjb25uZWN0aW9uLlxuICBydW4oKSB7XG4gICAgY29uc3QgcnVubmVyID0gdGhpc1xuICAgIHJldHVybiBQcm9taXNlLnVzaW5nKHRoaXMuZW5zdXJlQ29ubmVjdGlvbigpLCBmdW5jdGlvbihjb25uZWN0aW9uKSB7XG4gICAgICBydW5uZXIuY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG5cbiAgICAgIHJ1bm5lci5jbGllbnQuZW1pdCgnc3RhcnQnLCBydW5uZXIuYnVpbGRlcilcbiAgICAgIHJ1bm5lci5idWlsZGVyLmVtaXQoJ3N0YXJ0JywgcnVubmVyLmJ1aWxkZXIpXG4gICAgICBjb25zdCBzcWwgPSBydW5uZXIuYnVpbGRlci50b1NRTCgpO1xuXG4gICAgICBpZiAocnVubmVyLmJ1aWxkZXIuX2RlYnVnKSB7XG4gICAgICAgIGhlbHBlcnMuZGVidWdMb2coc3FsKVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNBcnJheShzcWwpKSB7XG4gICAgICAgIHJldHVybiBydW5uZXIucXVlcnlBcnJheShzcWwpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJ1bm5lci5xdWVyeShzcWwpO1xuXG4gICAgfSlcblxuICAgIC8vIElmIHRoZXJlIGFyZSBhbnkgXCJlcnJvclwiIGxpc3RlbmVycywgd2UgZmlyZSBhbiBlcnJvciBldmVudFxuICAgIC8vIGFuZCB0aGVuIHJlLXRocm93IHRoZSBlcnJvciB0byBiZSBldmVudHVhbGx5IGhhbmRsZWQgYnlcbiAgICAvLyB0aGUgcHJvbWlzZSBjaGFpbi4gVXNlZnVsIGlmIHlvdSdyZSB3cmFwcGluZyBpbiBhIGN1c3RvbSBgUHJvbWlzZWAuXG4gICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgaWYgKHJ1bm5lci5idWlsZGVyLl9ldmVudHMgJiYgcnVubmVyLmJ1aWxkZXIuX2V2ZW50cy5lcnJvcikge1xuICAgICAgICBydW5uZXIuYnVpbGRlci5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSlcblxuICAgIC8vIEZpcmUgYSBzaW5nbGUgXCJlbmRcIiBldmVudCBvbiB0aGUgYnVpbGRlciB3aGVuXG4gICAgLy8gYWxsIHF1ZXJpZXMgaGF2ZSBzdWNjZXNzZnVsbHkgY29tcGxldGVkLlxuICAgIC50YXAoZnVuY3Rpb24oKSB7XG4gICAgICBydW5uZXIuYnVpbGRlci5lbWl0KCdlbmQnKTtcbiAgICB9KVxuXG4gIH0sXG5cbiAgLy8gU3RyZWFtIHRoZSByZXN1bHQgc2V0LCBieSBwYXNzaW5nIHRocm91Z2ggdG8gdGhlIGRpYWxlY3QncyBzdHJlYW1pbmdcbiAgLy8gY2FwYWJpbGl0aWVzLiBJZiB0aGUgb3B0aW9ucyBhcmVcbiAgc3RyZWFtKG9wdGlvbnMsIGhhbmRsZXIpIHtcblxuICAgIC8vIElmIHdlIHNwZWNpZnkgc3RyZWFtKGhhbmRsZXIpLnRoZW4oLi4uXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBoYW5kbGVyID0gb3B0aW9ucztcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERldGVybWluZXMgd2hldGhlciB3ZSBlbWl0IGFuIGVycm9yIG9yIHRocm93IGhlcmUuXG4gICAgY29uc3QgaGFzSGFuZGxlciA9IHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nO1xuXG4gICAgLy8gTGF6eS1sb2FkIHRoZSBcIlBhc3NUaHJvdWdoXCIgZGVwZW5kZW5jeS5cbiAgICBQYXNzVGhyb3VnaCA9IFBhc3NUaHJvdWdoIHx8IHJlcXVpcmUoJ3JlYWRhYmxlLXN0cmVhbScpLlBhc3NUaHJvdWdoO1xuXG4gICAgY29uc3QgcnVubmVyID0gdGhpcztcbiAgICBjb25zdCBzdHJlYW0gPSBuZXcgUGFzc1Rocm91Z2goe29iamVjdE1vZGU6IHRydWV9KTtcbiAgICBjb25zdCBwcm9taXNlID0gUHJvbWlzZS51c2luZyh0aGlzLmVuc3VyZUNvbm5lY3Rpb24oKSwgZnVuY3Rpb24oY29ubmVjdGlvbikge1xuICAgICAgcnVubmVyLmNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgICAgY29uc3Qgc3FsID0gcnVubmVyLmJ1aWxkZXIudG9TUUwoKVxuICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdUaGUgc3RyZWFtIG1heSBvbmx5IGJlIHVzZWQgd2l0aCBhIHNpbmdsZSBxdWVyeSBzdGF0ZW1lbnQuJyk7XG4gICAgICBpZiAoaXNBcnJheShzcWwpKSB7XG4gICAgICAgIGlmIChoYXNIYW5kbGVyKSB0aHJvdyBlcnI7XG4gICAgICAgIHN0cmVhbS5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcnVubmVyLmNsaWVudC5zdHJlYW0ocnVubmVyLmNvbm5lY3Rpb24sIHNxbCwgc3RyZWFtLCBvcHRpb25zKTtcbiAgICB9KVxuXG4gICAgLy8gSWYgYSBmdW5jdGlvbiBpcyBwYXNzZWQgdG8gaGFuZGxlIHRoZSBzdHJlYW0sIHNlbmQgdGhlIHN0cmVhbVxuICAgIC8vIHRoZXJlIGFuZCByZXR1cm4gdGhlIHByb21pc2UsIG90aGVyd2lzZSBqdXN0IHJldHVybiB0aGUgc3RyZWFtXG4gICAgLy8gYW5kIHRoZSBwcm9taXNlIHdpbGwgdGFrZSBjYXJlIG9mIGl0c3NlbGYuXG4gICAgaWYgKGhhc0hhbmRsZXIpIHtcbiAgICAgIGhhbmRsZXIoc3RyZWFtKTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgICByZXR1cm4gc3RyZWFtO1xuICB9LFxuXG4gIC8vIEFsbG93IHlvdSB0byBwaXBlIHRoZSBzdHJlYW0gdG8gYSB3cml0YWJsZSBzdHJlYW0uXG4gIHBpcGUod3JpdGFibGUsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5zdHJlYW0ob3B0aW9ucykucGlwZSh3cml0YWJsZSk7XG4gIH0sXG5cbiAgLy8gXCJSdW5zXCIgYSBxdWVyeSwgcmV0dXJuaW5nIGEgcHJvbWlzZS4gQWxsIHF1ZXJpZXMgc3BlY2lmaWVkIGJ5IHRoZSBidWlsZGVyIGFyZSBndWFyYW50ZWVkXG4gIC8vIHRvIHJ1biBpbiBzZXF1ZW5jZSwgYW5kIG9uIHRoZSBzYW1lIGNvbm5lY3Rpb24sIGVzcGVjaWFsbHkgaGVscGZ1bCB3aGVuIHNjaGVtYSBidWlsZGluZ1xuICAvLyBhbmQgZGVhbGluZyB3aXRoIGZvcmVpZ24ga2V5IGNvbnN0cmFpbnRzLCBldGMuXG4gIHF1ZXJ5OiBQcm9taXNlLm1ldGhvZChmdW5jdGlvbihvYmopIHtcbiAgICB0aGlzLmJ1aWxkZXIuZW1pdCgncXVlcnknLCBhc3NpZ24oe19fa25leFVpZDogdGhpcy5jb25uZWN0aW9uLl9fa25leFVpZH0sIG9iaikpXG4gICAgY29uc3QgcnVubmVyID0gdGhpc1xuICAgIGxldCBxdWVyeVByb21pc2UgPSB0aGlzLmNsaWVudC5xdWVyeSh0aGlzLmNvbm5lY3Rpb24sIG9iailcblxuICAgIGlmKG9iai50aW1lb3V0KSB7XG4gICAgICBxdWVyeVByb21pc2UgPSBxdWVyeVByb21pc2UudGltZW91dChvYmoudGltZW91dClcbiAgICB9XG5cbiAgICByZXR1cm4gcXVlcnlQcm9taXNlXG4gICAgICAudGhlbigocmVzcCkgPT4ge1xuICAgICAgICBjb25zdCBwcm9jZXNzZWRSZXNwb25zZSA9IHRoaXMuY2xpZW50LnByb2Nlc3NSZXNwb25zZShyZXNwLCBydW5uZXIpO1xuICAgICAgICB0aGlzLmJ1aWxkZXIuZW1pdChcbiAgICAgICAgICAncXVlcnktcmVzcG9uc2UnLFxuICAgICAgICAgIHByb2Nlc3NlZFJlc3BvbnNlLFxuICAgICAgICAgIGFzc2lnbih7X19rbmV4VWlkOiB0aGlzLmNvbm5lY3Rpb24uX19rbmV4VWlkfSwgb2JqKSxcbiAgICAgICAgICB0aGlzLmJ1aWxkZXJcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5jbGllbnQuZW1pdChcbiAgICAgICAgICAncXVlcnktcmVzcG9uc2UnLFxuICAgICAgICAgIHByb2Nlc3NlZFJlc3BvbnNlLFxuICAgICAgICAgIGFzc2lnbih7X19rbmV4VWlkOiB0aGlzLmNvbm5lY3Rpb24uX19rbmV4VWlkfSwgb2JqKSxcbiAgICAgICAgICB0aGlzLmJ1aWxkZXJcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NlZFJlc3BvbnNlO1xuICAgICAgfSkuY2F0Y2goUHJvbWlzZS5UaW1lb3V0RXJyb3IsIGVycm9yID0+IHtcbiAgICAgICAgY29uc3QgeyB0aW1lb3V0LCBzcWwsIGJpbmRpbmdzIH0gPSBvYmo7XG5cbiAgICAgICAgbGV0IGNhbmNlbFF1ZXJ5O1xuICAgICAgICBpZiAob2JqLmNhbmNlbE9uVGltZW91dCkge1xuICAgICAgICAgIGNhbmNlbFF1ZXJ5ID0gdGhpcy5jbGllbnQuY2FuY2VsUXVlcnkodGhpcy5jb25uZWN0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYW5jZWxRdWVyeSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNhbmNlbFF1ZXJ5XG4gICAgICAgICAgLmNhdGNoKChjYW5jZWxFcnJvcikgPT4ge1xuICAgICAgICAgICAgLy8gY2FuY2VsbGF0aW9uIGZhaWxlZFxuICAgICAgICAgICAgdGhyb3cgYXNzaWduKGNhbmNlbEVycm9yLCB7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGBBZnRlciBxdWVyeSB0aW1lb3V0IG9mICR7dGltZW91dH1tcyBleGNlZWRlZCwgY2FuY2VsbGluZyBvZiBxdWVyeSBmYWlsZWQuYCxcbiAgICAgICAgICAgICAgc3FsLCBiaW5kaW5ncywgdGltZW91dFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBjYW5jZWxsYXRpb24gc3VjY2VlZGVkLCByZXRocm93IHRpbWVvdXQgZXJyb3JcbiAgICAgICAgICAgIHRocm93IGFzc2lnbihlcnJvciwge1xuICAgICAgICAgICAgICBtZXNzYWdlOiBgRGVmaW5lZCBxdWVyeSB0aW1lb3V0IG9mICR7dGltZW91dH1tcyBleGNlZWRlZCB3aGVuIHJ1bm5pbmcgcXVlcnkuYCxcbiAgICAgICAgICAgICAgc3FsLCBiaW5kaW5ncywgdGltZW91dFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICB0aGlzLmJ1aWxkZXIuZW1pdCgncXVlcnktZXJyb3InLCBlcnJvciwgYXNzaWduKHtfX2tuZXhVaWQ6IHRoaXMuY29ubmVjdGlvbi5fX2tuZXhVaWR9LCBvYmopKVxuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH0pO1xuICB9KSxcblxuICAvLyBJbiB0aGUgY2FzZSBvZiB0aGUgXCJzY2hlbWEgYnVpbGRlclwiIHdlIGNhbGwgYHF1ZXJ5QXJyYXlgLCB3aGljaCBydW5zIGVhY2hcbiAgLy8gb2YgdGhlIHF1ZXJpZXMgaW4gc2VxdWVuY2UuXG4gIHF1ZXJ5QXJyYXkocXVlcmllcykge1xuICAgIHJldHVybiBxdWVyaWVzLmxlbmd0aCA9PT0gMSA/IHRoaXMucXVlcnkocXVlcmllc1swXSkgOiBQcm9taXNlLmJpbmQodGhpcylcbiAgICAgIC5yZXR1cm4ocXVlcmllcylcbiAgICAgIC5yZWR1Y2UoZnVuY3Rpb24obWVtbywgcXVlcnkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVlcnkocXVlcnkpLnRoZW4oZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAgIG1lbW8ucHVzaChyZXNwKVxuICAgICAgICAgIHJldHVybiBtZW1vO1xuICAgICAgICB9KTtcbiAgICAgIH0sIFtdKVxuICB9LFxuXG4gIC8vIENoZWNrIHdoZXRoZXIgdGhlcmUncyBhIHRyYW5zYWN0aW9uIGZsYWcsIGFuZCB0aGF0IGl0IGhhcyBhIGNvbm5lY3Rpb24uXG4gIGVuc3VyZUNvbm5lY3Rpb24oKSB7XG4gICAgY29uc3QgcnVubmVyID0gdGhpc1xuICAgIGNvbnN0IGFjcXVpcmVDb25uZWN0aW9uVGltZW91dCA9IHJ1bm5lci5jbGllbnQuY29uZmlnLmFjcXVpcmVDb25uZWN0aW9uVGltZW91dCB8fCA2MDAwMDtcbiAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xuICAgICAgcmV0dXJuIHJ1bm5lci5jb25uZWN0aW9uIHx8IG5ldyBQcm9taXNlKChyZXNvbHZlciwgcmVqZWN0ZXIpID0+IHtcbiAgICAgICAgY29uc3QgYWNxdWlyZUNvbm5lY3Rpb24gPSBydW5uZXIuY2xpZW50LmFjcXVpcmVDb25uZWN0aW9uKCk7XG5cbiAgICAgICAgYWNxdWlyZUNvbm5lY3Rpb24uY29tcGxldGVkXG4gICAgICAgICAgLnRpbWVvdXQoYWNxdWlyZUNvbm5lY3Rpb25UaW1lb3V0KVxuICAgICAgICAgIC50aGVuKHJlc29sdmVyKVxuICAgICAgICAgIC5jYXRjaChQcm9taXNlLlRpbWVvdXRFcnJvciwgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0aW1lb3V0RXJyb3IgPSBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICdLbmV4OiBUaW1lb3V0IGFjcXVpcmluZyBhIGNvbm5lY3Rpb24uIFRoZSBwb29sIGlzIHByb2JhYmx5IGZ1bGwuICcgK1xuICAgICAgICAgICAgICAnQXJlIHlvdSBtaXNzaW5nIGEgLnRyYW5zYWN0aW5nKHRyeCkgY2FsbD8nXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgYWRkaXRpb25hbEVycm9ySW5mb3JtYXRpb24gPSB7XG4gICAgICAgICAgICAgIHRpbWVvdXRTdGFjazogZXJyb3Iuc3RhY2tcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYocnVubmVyLmJ1aWxkZXIpIHtcbiAgICAgICAgICAgICAgYWRkaXRpb25hbEVycm9ySW5mb3JtYXRpb24uc3FsID0gcnVubmVyLmJ1aWxkZXIuc3FsO1xuICAgICAgICAgICAgICBhZGRpdGlvbmFsRXJyb3JJbmZvcm1hdGlvbi5iaW5kaW5ncyA9IHJ1bm5lci5idWlsZGVyLmJpbmRpbmdzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhc3NpZ24odGltZW91dEVycm9yLCBhZGRpdGlvbmFsRXJyb3JJbmZvcm1hdGlvbilcblxuICAgICAgICAgICAgLy8gTGV0IHRoZSBwb29sIGtub3cgdGhhdCB0aGlzIHJlcXVlc3QgZm9yIGEgY29ubmVjdGlvbiB0aW1lZCBvdXRcbiAgICAgICAgICAgIGFjcXVpcmVDb25uZWN0aW9uLmFib3J0KCdLbmV4OiBUaW1lb3V0IGFjcXVpcmluZyBhIGNvbm5lY3Rpb24uJylcblxuICAgICAgICAgICAgcmVqZWN0ZXIodGltZW91dEVycm9yKVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKHJlamVjdGVyKVxuICAgICAgfSlcbiAgICB9KS5kaXNwb3NlcihmdW5jdGlvbigpIHtcbiAgICAgIGlmIChydW5uZXIuY29ubmVjdGlvbi5fX2tuZXhfX2Rpc3Bvc2VkKSByZXR1cm5cbiAgICAgIHJ1bm5lci5jbGllbnQucmVsZWFzZUNvbm5lY3Rpb24ocnVubmVyLmNvbm5lY3Rpb24pXG4gICAgfSlcbiAgfVxuXG59KVxuXG5leHBvcnQgZGVmYXVsdCBSdW5uZXI7XG4iXX0=