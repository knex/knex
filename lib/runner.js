'use strict';

exports.__esModule = true;

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _helpers = require('./helpers');

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PassThrough = void 0;

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

(0, _assign3.default)(Runner.prototype, {

  // "Run" the target, calling "toSQL" on the builder, returning
  // an object or array of queries to run, each of which are run on
  // a single connection.
  run: function run() {
    var runner = this;
    return _bluebird2.default.using(this.ensureConnection(), function (connection) {
      runner.connection = connection;

      runner.client.emit('start', runner.builder);
      runner.builder.emit('start', runner.builder);
      var sql = runner.builder.toSQL();

      if (runner.builder._debug) {
        helpers.debugLog(sql);
      }

      if ((0, _isArray3.default)(sql)) {
        return runner.queryArray(sql);
      }
      return runner.query(sql);
    })

    // If there are any "error" listeners, we fire an error event
    // and then re-throw the error to be eventually handled by
    // the promise chain. Useful if you're wrapping in a custom `Promise`.
    .catch(function (err) {
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
    var promise = _bluebird2.default.using(this.ensureConnection(), function (connection) {
      runner.connection = connection;
      var sql = runner.builder.toSQL();
      var err = new Error('The stream may only be used with a single query statement.');
      if ((0, _isArray3.default)(sql)) {
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
  query: _bluebird2.default.method(function (obj) {
    var _this = this;

    this.builder.emit('query', (0, _assign3.default)({ __knexUid: this.connection.__knexUid }, obj));
    var runner = this;
    var queryPromise = this.client.query(this.connection, obj);

    if (obj.timeout) {
      queryPromise = queryPromise.timeout(obj.timeout);
    }

    return queryPromise.then(function (resp) {
      var processedResponse = _this.client.processResponse(resp, runner);
      _this.builder.emit('query-response', processedResponse, (0, _assign3.default)({ __knexUid: _this.connection.__knexUid }, obj), _this.builder);
      _this.client.emit('query-response', processedResponse, (0, _assign3.default)({ __knexUid: _this.connection.__knexUid }, obj), _this.builder);
      return processedResponse;
    }).catch(_bluebird2.default.TimeoutError, function (error) {
      var timeout = obj.timeout;
      var sql = obj.sql;
      var bindings = obj.bindings;


      var cancelQuery = void 0;
      if (obj.cancelOnTimeout) {
        cancelQuery = _this.client.cancelQuery(_this.connection);
      } else {
        cancelQuery = _bluebird2.default.resolve();
      }

      return cancelQuery.catch(function (cancelError) {
        // cancellation failed
        throw (0, _assign3.default)(cancelError, {
          message: 'After query timeout of ' + timeout + 'ms exceeded, cancelling of query failed.',
          sql: sql, bindings: bindings, timeout: timeout
        });
      }).then(function () {
        // cancellation succeeded, rethrow timeout error
        throw (0, _assign3.default)(error, {
          message: 'Defined query timeout of ' + timeout + 'ms exceeded when running query.',
          sql: sql, bindings: bindings, timeout: timeout
        });
      });
    }).catch(function (error) {
      _this.builder.emit('query-error', error, (0, _assign3.default)({ __knexUid: _this.connection.__knexUid }, obj));
      throw error;
    });
  }),

  // In the case of the "schema builder" we call `queryArray`, which runs each
  // of the queries in sequence.
  queryArray: function queryArray(queries) {
    return queries.length === 1 ? this.query(queries[0]) : _bluebird2.default.bind(this).return(queries).reduce(function (memo, query) {
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
    return _bluebird2.default.try(function () {
      return runner.connection || new _bluebird2.default(function (resolver, rejecter) {
        var acquireConnection = runner.client.acquireConnection();

        acquireConnection.completed.timeout(acquireConnectionTimeout).then(resolver).catch(_bluebird2.default.TimeoutError, function (error) {
          var timeoutError = new Error('Knex: Timeout acquiring a connection. The pool is probably full. ' + 'Are you missing a .transacting(trx) call?');
          var additionalErrorInformation = {
            timeoutStack: error.stack
          };

          if (runner.builder) {
            additionalErrorInformation.sql = runner.builder.sql;
            additionalErrorInformation.bindings = runner.builder.bindings;
          }

          (0, _assign3.default)(timeoutError, additionalErrorInformation);

          // Let the pool know that this request for a connection timed out
          acquireConnection.abort('Knex: Timeout acquiring a connection.');

          rejecter(timeoutError);
        }).catch(rejecter);
      });
    }).disposer(function () {
      runner.client.releaseConnection(runner.connection);
    });
  }
});

exports.default = Runner;
module.exports = exports['default'];