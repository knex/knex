'use strict';

var _            = require('lodash');
var Promise      = require('./promise');
var inherits     = require('inherits')
var EventEmitter = require('events').EventEmitter

// The "Runner" constructor takes a "builder" (query, schema, or raw)
// and runs through each of the query statements, calling any additional
// "output" method provided alongside the query and bindings.
function Runner(client, connection) {
  this.queries    = []
  this.client     = client
  this.builder    = builder
  this.connection = connection
}
inherits(Runner, EventEmitter)

// "Run" the target, calling "toSQL" on the builder, returning
// an object or array of queries to run, each of which are run on
// a single connection.
Runner.prototype.read = function(type, obj) {
  var sql = this.builder.toSQL();
  this.emit('start', this);
}

//   if (_.isArray(sql)) {
//     return this.queryArray(sql);
//   }
//   return this.query(sql);

//     // If there are any "error" listeners, we fire an error event
//     // and then re-throw the error to be eventually handled by
//     // the promise chain. Useful if you're wrapping in a custom `Promise`.
//     .catch(function(err) {
//       if (this.builder._events && this.builder._events.error) {
//         this.builder.emit('error', err);
//       }
//       throw err;
//     })

//     // Fire a single "end" event on the builder when
//     // all queries have successfully completed.
//     .tap(function() {
//       this.builder.emit('end');
//     })
// }

// Stream the result set, by passing through to the dialect's streaming
// capabilities. If the options are
var PassThrough;
Runner.prototype.stream = function(options, handler) {
  var runner     = this
  var connection = this.connection
  var client     = this.client

  // If we specify stream(handler).then(...
  if (arguments.length === 1) {
    if (_.isFunction(options)) {
      handler = options;
      options = {};
    }
  }

  // Determines whether we emit an error or throw here.
  var hasHandler = _.isFunction(handler);

  // Lazy-load the "PassThrough" dependency.
  PassThrough = PassThrough || require('readable-stream').PassThrough;
  var stream  = new PassThrough({objectMode: true});
  var promise = Promise.bind(this)
    .then(function() {
      var sql = this.builder.toSQL();
      var err = new Error('The stream may only be used with a single query statement.');
      if (_.isArray(sql)) {
        if (hasHandler) throw err;
        stream.emit('error', err);
      }
      return sql;
    })
    .then(function(sql) {
      return this._stream(sql, stream, options);
    })
    .finally(function() {
      this.client.releaseConnection(this.connection)
    });

  // If a function is passed to handle the stream, send the stream
  // there and return the promise, otherwise just return the stream
  // and the promise will take care of itsself.
  if (hasHandler) {
    handler(stream);
    return promise;
  }
  return stream;
};

// Allow you to pipe the stream to a writable stream.
Runner.prototype.pipe = function(writable) {
  return this.stream().pipe(writable);
};

// "Runs" a query, returning a promise. All queries specified by the builder are guaranteed
// to run in sequence, and on the same connection, especially helpful when schema building
// and dealing with foreign key constraints, etc.
Runner.prototype.query = function(obj) {
  obj.__knexUid = this.connection.__knexUid;
  this.emit('query', obj)
  this.builder.emit('query', obj);
  this.client.emit('query', obj);
  return this._query(obj).bind(this).then(this.processResponse);
}

// In the case of the "schema builder" we call `queryArray`, which runs each
// of the queries in sequence.
Runner.prototype.queryArray = Promise.method(function(queries) {
  return queries.length === 1 ? this.query(queries[0]) : Promise.bind(this)
    .thenReturn(queries)
    .reduce(function(memo, query) {
      return this.query(query).then(function(resp) {
        memo.push(resp);
        return memo;
      })
    }, [])
})

// Check whether we're "debugging", based on either calling `debug` on the query.
Runner.prototype.isDebugging = function() {
  return this.builder._debug || (this.client.isDebugging === true && this.builder._debug !== false);
}

module.exports = Runner;
