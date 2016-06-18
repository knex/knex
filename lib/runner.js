'use strict';

var _ = require('lodash');
var Promise = require('./promise');
var assign = require('lodash/object/assign');

var PassThrough;

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

assign(Runner.prototype, {

  // "Run" the target, calling "toSQL" on the builder, returning
  // an object or array of queries to run, each of which are run on
  // a single connection.
  run: function run() {
    var runner = this;
    return Promise.using(this.ensureConnection(), function (connection) {
      runner.connection = connection;

      runner.client.emit('start', runner.builder);
      runner.builder.emit('start', runner.builder);
      var sql = runner.builder.toSQL();

      if (runner.builder._debug) {
        console.log(sql);
      }

      if (_.isArray(sql)) {
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
    var promise = Promise.using(this.ensureConnection(), function (connection) {
      runner.connection = connection;
      var sql = runner.builder.toSQL();
      var err = new Error('The stream may only be used with a single query statement.');
      if (_.isArray(sql)) {
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
  query: Promise.method(function (obj) {
    this.builder.emit('query', assign({ __knexUid: this.connection.__knexUid }, obj));
    var runner = this;
    return this.client.query(this.connection, obj).then(function (resp) {
      return runner.client.processResponse(resp, runner);
    });
  }),

  // In the case of the "schema builder" we call `queryArray`, which runs each
  // of the queries in sequence.
  queryArray: function queryArray(queries) {
    return queries.length === 1 ? this.query(queries[0]) : Promise.bind(this)['return'](queries).reduce(function (memo, query) {
      return this.query(query).then(function (resp) {
        memo.push(resp);
        return memo;
      });
    }, []);
  },

  // Check whether there's a transaction flag, and that it has a connection.
  ensureConnection: function ensureConnection() {
    var runner = this;
    return Promise['try'](function () {
      return runner.connection || runner.client.acquireConnection();
    }).disposer(function () {
      if (runner.connection.__knex__disposed) return;
      runner.client.releaseConnection(runner.connection);
    });
  }

});

module.exports = Runner;
//# sourceMappingURL=data:application/json;base64,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LENBQUMsQ0FBQTs7QUFFRixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyIsImZpbGUiOiJydW5uZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBfICAgICAgID0gcmVxdWlyZSgnbG9kYXNoJylcbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcbnZhciBhc3NpZ24gID0gcmVxdWlyZSgnbG9kYXNoL29iamVjdC9hc3NpZ24nKTtcblxudmFyIFBhc3NUaHJvdWdoO1xuXG4vLyBUaGUgXCJSdW5uZXJcIiBjb25zdHJ1Y3RvciB0YWtlcyBhIFwiYnVpbGRlclwiIChxdWVyeSwgc2NoZW1hLCBvciByYXcpXG4vLyBhbmQgcnVucyB0aHJvdWdoIGVhY2ggb2YgdGhlIHF1ZXJ5IHN0YXRlbWVudHMsIGNhbGxpbmcgYW55IGFkZGl0aW9uYWxcbi8vIFwib3V0cHV0XCIgbWV0aG9kIHByb3ZpZGVkIGFsb25nc2lkZSB0aGUgcXVlcnkgYW5kIGJpbmRpbmdzLlxuZnVuY3Rpb24gUnVubmVyKGNsaWVudCwgYnVpbGRlcikge1xuICB0aGlzLmNsaWVudCAgPSBjbGllbnRcbiAgdGhpcy5idWlsZGVyID0gYnVpbGRlclxuICB0aGlzLnF1ZXJpZXMgPSBbXVxuXG4gIC8vIFRoZSBcImNvbm5lY3Rpb25cIiBvYmplY3QgaXMgc2V0IG9uIHRoZSBydW5uZXIgd2hlblxuICAvLyBcInJ1blwiIGlzIGNhbGxlZC5cbiAgdGhpcy5jb25uZWN0aW9uID0gdm9pZCAwXG59XG5cbmFzc2lnbihSdW5uZXIucHJvdG90eXBlLCB7XG5cbiAgLy8gXCJSdW5cIiB0aGUgdGFyZ2V0LCBjYWxsaW5nIFwidG9TUUxcIiBvbiB0aGUgYnVpbGRlciwgcmV0dXJuaW5nXG4gIC8vIGFuIG9iamVjdCBvciBhcnJheSBvZiBxdWVyaWVzIHRvIHJ1biwgZWFjaCBvZiB3aGljaCBhcmUgcnVuIG9uXG4gIC8vIGEgc2luZ2xlIGNvbm5lY3Rpb24uXG4gIHJ1bjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJ1bm5lciA9IHRoaXNcbiAgICByZXR1cm4gUHJvbWlzZS51c2luZyh0aGlzLmVuc3VyZUNvbm5lY3Rpb24oKSwgZnVuY3Rpb24oY29ubmVjdGlvbikge1xuICAgICAgcnVubmVyLmNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuXG4gICAgICBydW5uZXIuY2xpZW50LmVtaXQoJ3N0YXJ0JywgcnVubmVyLmJ1aWxkZXIpXG4gICAgICBydW5uZXIuYnVpbGRlci5lbWl0KCdzdGFydCcsIHJ1bm5lci5idWlsZGVyKVxuICAgICAgdmFyIHNxbCA9IHJ1bm5lci5idWlsZGVyLnRvU1FMKCk7XG5cbiAgICAgIGlmIChydW5uZXIuYnVpbGRlci5fZGVidWcpIHtcbiAgICAgICAgY29uc29sZS5sb2coc3FsKVxuICAgICAgfVxuXG4gICAgICBpZiAoXy5pc0FycmF5KHNxbCkpIHtcbiAgICAgICAgcmV0dXJuIHJ1bm5lci5xdWVyeUFycmF5KHNxbCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcnVubmVyLnF1ZXJ5KHNxbCk7XG5cbiAgICB9KVxuXG4gICAgLy8gSWYgdGhlcmUgYXJlIGFueSBcImVycm9yXCIgbGlzdGVuZXJzLCB3ZSBmaXJlIGFuIGVycm9yIGV2ZW50XG4gICAgLy8gYW5kIHRoZW4gcmUtdGhyb3cgdGhlIGVycm9yIHRvIGJlIGV2ZW50dWFsbHkgaGFuZGxlZCBieVxuICAgIC8vIHRoZSBwcm9taXNlIGNoYWluLiBVc2VmdWwgaWYgeW91J3JlIHdyYXBwaW5nIGluIGEgY3VzdG9tIGBQcm9taXNlYC5cbiAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICBpZiAocnVubmVyLmJ1aWxkZXIuX2V2ZW50cyAmJiBydW5uZXIuYnVpbGRlci5fZXZlbnRzLmVycm9yKSB7XG4gICAgICAgIHJ1bm5lci5idWlsZGVyLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycjtcbiAgICB9KVxuXG4gICAgLy8gRmlyZSBhIHNpbmdsZSBcImVuZFwiIGV2ZW50IG9uIHRoZSBidWlsZGVyIHdoZW5cbiAgICAvLyBhbGwgcXVlcmllcyBoYXZlIHN1Y2Nlc3NmdWxseSBjb21wbGV0ZWQuXG4gICAgLnRhcChmdW5jdGlvbigpIHtcbiAgICAgIHJ1bm5lci5idWlsZGVyLmVtaXQoJ2VuZCcpO1xuICAgIH0pXG5cbiAgfSxcblxuICAvLyBTdHJlYW0gdGhlIHJlc3VsdCBzZXQsIGJ5IHBhc3NpbmcgdGhyb3VnaCB0byB0aGUgZGlhbGVjdCdzIHN0cmVhbWluZ1xuICAvLyBjYXBhYmlsaXRpZXMuIElmIHRoZSBvcHRpb25zIGFyZVxuICBzdHJlYW06IGZ1bmN0aW9uKG9wdGlvbnMsIGhhbmRsZXIpIHtcbiAgICBcbiAgICAvLyBJZiB3ZSBzcGVjaWZ5IHN0cmVhbShoYW5kbGVyKS50aGVuKC4uLlxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaGFuZGxlciA9IG9wdGlvbnM7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEZXRlcm1pbmVzIHdoZXRoZXIgd2UgZW1pdCBhbiBlcnJvciBvciB0aHJvdyBoZXJlLlxuICAgIHZhciBoYXNIYW5kbGVyID0gdHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbic7XG5cbiAgICAvLyBMYXp5LWxvYWQgdGhlIFwiUGFzc1Rocm91Z2hcIiBkZXBlbmRlbmN5LlxuICAgIFBhc3NUaHJvdWdoID0gUGFzc1Rocm91Z2ggfHwgcmVxdWlyZSgncmVhZGFibGUtc3RyZWFtJykuUGFzc1Rocm91Z2g7XG4gICAgXG4gICAgdmFyIHJ1bm5lciA9IHRoaXM7XG4gICAgdmFyIHN0cmVhbSAgPSBuZXcgUGFzc1Rocm91Z2goe29iamVjdE1vZGU6IHRydWV9KTtcbiAgICB2YXIgcHJvbWlzZSA9IFByb21pc2UudXNpbmcodGhpcy5lbnN1cmVDb25uZWN0aW9uKCksIGZ1bmN0aW9uKGNvbm5lY3Rpb24pIHtcbiAgICAgIHJ1bm5lci5jb25uZWN0aW9uID0gY29ubmVjdGlvbjtcbiAgICAgIHZhciBzcWwgPSBydW5uZXIuYnVpbGRlci50b1NRTCgpXG4gICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdUaGUgc3RyZWFtIG1heSBvbmx5IGJlIHVzZWQgd2l0aCBhIHNpbmdsZSBxdWVyeSBzdGF0ZW1lbnQuJyk7XG4gICAgICBpZiAoXy5pc0FycmF5KHNxbCkpIHtcbiAgICAgICAgaWYgKGhhc0hhbmRsZXIpIHRocm93IGVycjtcbiAgICAgICAgc3RyZWFtLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBydW5uZXIuY2xpZW50LnN0cmVhbShydW5uZXIuY29ubmVjdGlvbiwgc3FsLCBzdHJlYW0sIG9wdGlvbnMpO1xuICAgIH0pXG5cbiAgICAvLyBJZiBhIGZ1bmN0aW9uIGlzIHBhc3NlZCB0byBoYW5kbGUgdGhlIHN0cmVhbSwgc2VuZCB0aGUgc3RyZWFtXG4gICAgLy8gdGhlcmUgYW5kIHJldHVybiB0aGUgcHJvbWlzZSwgb3RoZXJ3aXNlIGp1c3QgcmV0dXJuIHRoZSBzdHJlYW1cbiAgICAvLyBhbmQgdGhlIHByb21pc2Ugd2lsbCB0YWtlIGNhcmUgb2YgaXRzc2VsZi5cbiAgICBpZiAoaGFzSGFuZGxlcikge1xuICAgICAgaGFuZGxlcihzdHJlYW0pO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHJldHVybiBzdHJlYW07XG4gIH0sXG5cbiAgLy8gQWxsb3cgeW91IHRvIHBpcGUgdGhlIHN0cmVhbSB0byBhIHdyaXRhYmxlIHN0cmVhbS5cbiAgcGlwZTogZnVuY3Rpb24od3JpdGFibGUsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5zdHJlYW0ob3B0aW9ucykucGlwZSh3cml0YWJsZSk7XG4gIH0sXG5cbiAgLy8gXCJSdW5zXCIgYSBxdWVyeSwgcmV0dXJuaW5nIGEgcHJvbWlzZS4gQWxsIHF1ZXJpZXMgc3BlY2lmaWVkIGJ5IHRoZSBidWlsZGVyIGFyZSBndWFyYW50ZWVkXG4gIC8vIHRvIHJ1biBpbiBzZXF1ZW5jZSwgYW5kIG9uIHRoZSBzYW1lIGNvbm5lY3Rpb24sIGVzcGVjaWFsbHkgaGVscGZ1bCB3aGVuIHNjaGVtYSBidWlsZGluZ1xuICAvLyBhbmQgZGVhbGluZyB3aXRoIGZvcmVpZ24ga2V5IGNvbnN0cmFpbnRzLCBldGMuXG4gIHF1ZXJ5OiBQcm9taXNlLm1ldGhvZChmdW5jdGlvbihvYmopIHtcbiAgICB0aGlzLmJ1aWxkZXIuZW1pdCgncXVlcnknLCBhc3NpZ24oe19fa25leFVpZDogdGhpcy5jb25uZWN0aW9uLl9fa25leFVpZH0sIG9iaikpXG4gICAgdmFyIHJ1bm5lciA9IHRoaXNcbiAgICByZXR1cm4gdGhpcy5jbGllbnQucXVlcnkodGhpcy5jb25uZWN0aW9uLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgIHJldHVybiBydW5uZXIuY2xpZW50LnByb2Nlc3NSZXNwb25zZShyZXNwLCBydW5uZXIpXG4gICAgICB9KTtcbiAgfSksXG5cbiAgLy8gSW4gdGhlIGNhc2Ugb2YgdGhlIFwic2NoZW1hIGJ1aWxkZXJcIiB3ZSBjYWxsIGBxdWVyeUFycmF5YCwgd2hpY2ggcnVucyBlYWNoXG4gIC8vIG9mIHRoZSBxdWVyaWVzIGluIHNlcXVlbmNlLlxuICBxdWVyeUFycmF5OiBmdW5jdGlvbihxdWVyaWVzKSB7XG4gICAgcmV0dXJuIHF1ZXJpZXMubGVuZ3RoID09PSAxID8gdGhpcy5xdWVyeShxdWVyaWVzWzBdKSA6IFByb21pc2UuYmluZCh0aGlzKVxuICAgICAgLnJldHVybihxdWVyaWVzKVxuICAgICAgLnJlZHVjZShmdW5jdGlvbihtZW1vLCBxdWVyeSkge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeShxdWVyeSkudGhlbihmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgICAgbWVtby5wdXNoKHJlc3ApXG4gICAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgICAgIH0pO1xuICAgICAgfSwgW10pXG4gIH0sXG5cbiAgLy8gQ2hlY2sgd2hldGhlciB0aGVyZSdzIGEgdHJhbnNhY3Rpb24gZmxhZywgYW5kIHRoYXQgaXQgaGFzIGEgY29ubmVjdGlvbi5cbiAgZW5zdXJlQ29ubmVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJ1bm5lciA9IHRoaXNcbiAgICByZXR1cm4gUHJvbWlzZS50cnkoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcnVubmVyLmNvbm5lY3Rpb24gfHwgcnVubmVyLmNsaWVudC5hY3F1aXJlQ29ubmVjdGlvbigpXG4gICAgfSkuZGlzcG9zZXIoZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocnVubmVyLmNvbm5lY3Rpb24uX19rbmV4X19kaXNwb3NlZCkgcmV0dXJuXG4gICAgICBydW5uZXIuY2xpZW50LnJlbGVhc2VDb25uZWN0aW9uKHJ1bm5lci5jb25uZWN0aW9uKVxuICAgIH0pXG4gIH1cblxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBSdW5uZXI7XG4iXX0=