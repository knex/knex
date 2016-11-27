import { assign, isArray } from 'lodash'
import Promise from 'bluebird';
import * as helpers from './helpers';

let PassThrough;

// The "Runner" constructor takes a "builder" (query, schema, or raw)
// and runs through each of the query statements, calling any additional
// "output" method provided alongside the query and bindings.
function Runner(client, builder) {
  this.client = client
  this.builder = builder
  this.queries = []

  // The "connection" object is set on the runner when
  // "run" is called.
  this.connection = void 0
}

assign(Runner.prototype, {

  // "Run" the target, calling "toSQL" on the builder, returning
  // an object or array of queries to run, each of which are run on
  // a single connection.
  run() {
    const runner = this
    return Promise.using(this.ensureConnection(), function(connection) {
      runner.connection = connection;

      runner.client.emit('start', runner.builder)
      runner.builder.emit('start', runner.builder)
      const sql = runner.builder.toSQL();

      if (runner.builder._debug) {
        helpers.debugLog(sql)
      }

      if (isArray(sql)) {
        return runner.queryArray(sql);
      }
      return runner.query(sql);

    })

    // If there are any "error" listeners, we fire an error event
    // and then re-throw the error to be eventually handled by
    // the promise chain. Useful if you're wrapping in a custom `Promise`.
    .catch(function(err) {
      if (runner.builder._events && runner.builder._events.error) {
        runner.builder.emit('error', err);
      }
      throw err;
    })

    // Fire a single "end" event on the builder when
    // all queries have successfully completed.
    .tap(function() {
      runner.builder.emit('end');
    })

  },

  // Stream the result set, by passing through to the dialect's streaming
  // capabilities. If the options are
  stream(options, handler) {

    // If we specify stream(handler).then(...
    if (arguments.length === 1) {
      if (typeof options === 'function') {
        handler = options;
        options = {};
      }
    }

    // Determines whether we emit an error or throw here.
    const hasHandler = typeof handler === 'function';

    // Lazy-load the "PassThrough" dependency.
    PassThrough = PassThrough || require('readable-stream').PassThrough;

    const runner = this;
    const stream = new PassThrough({objectMode: true});
    const promise = Promise.using(this.ensureConnection(), function(connection) {
      runner.connection = connection;
      const sql = runner.builder.toSQL()
      const err = new Error('The stream may only be used with a single query statement.');
      if (isArray(sql)) {
        if (hasHandler) throw err;
        stream.emit('error', err);
      }
      return runner.client.stream(runner.connection, sql, stream, options);
    })

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
  pipe(writable, options) {
    return this.stream(options).pipe(writable);
  },

  // "Runs" a query, returning a promise. All queries specified by the builder are guaranteed
  // to run in sequence, and on the same connection, especially helpful when schema building
  // and dealing with foreign key constraints, etc.
  query: Promise.method(function(obj) {
    this.builder.emit('query', assign({__knexUid: this.connection.__knexUid}, obj))
    const runner = this
    let queryPromise = this.client.query(this.connection, obj)

    if(obj.timeout) {
      queryPromise = queryPromise.timeout(obj.timeout)
    }

    return queryPromise
      .then((resp) => {
        const processedResponse = this.client.processResponse(resp, runner);
        this.builder.emit(
          'query-response',
          processedResponse,
          assign({__knexUid: this.connection.__knexUid}, obj),
          this.builder
        );
        this.client.emit(
          'query-response',
          processedResponse,
          assign({__knexUid: this.connection.__knexUid}, obj),
          this.builder
        );
        return processedResponse;
      }).catch(Promise.TimeoutError, error => {
        const { timeout, sql, bindings } = obj;

        let cancelQuery;
        if (obj.cancelOnTimeout) {
          cancelQuery = this.client.cancelQuery(this.connection);
        } else {
          cancelQuery = Promise.resolve();
        }

        return cancelQuery
          .catch((cancelError) => {
            // cancellation failed
            throw assign(cancelError, {
              message: `After query timeout of ${timeout}ms exceeded, cancelling of query failed.`,
              sql, bindings, timeout
            });
          })
          .then(() => {
            // cancellation succeeded, rethrow timeout error
            throw assign(error, {
              message: `Defined query timeout of ${timeout}ms exceeded when running query.`,
              sql, bindings, timeout
            });
          });
      })
      .catch((error) => {
        this.builder.emit('query-error', error, assign({__knexUid: this.connection.__knexUid}, obj))
        throw error;
      });
  }),

  // In the case of the "schema builder" we call `queryArray`, which runs each
  // of the queries in sequence.
  queryArray(queries) {
    return queries.length === 1 ? this.query(queries[0]) : Promise.bind(this)
      .return(queries)
      .reduce(function(memo, query) {
        return this.query(query).then(function(resp) {
          memo.push(resp)
          return memo;
        });
      }, [])
  },

  // Check whether there's a transaction flag, and that it has a connection.
  ensureConnection() {
    return Promise.try(() => {
      return this.connection || new Promise((resolver, rejecter) => {
        // need to return promise or null from handler to prevent warning from bluebird
        return this.client.acquireConnection()
          .then(resolver)
          .catch(Promise.TimeoutError, (error) => {
            if (this.builder) {
              error.sql = this.builder.sql;
              error.bindings = this.builder.bindings;
            }
            throw error
          })
          .catch(rejecter)
      })
    }).disposer(() => {
      // need to return promise or null from handler to prevent warning from bluebird
      return this.client.releaseConnection(this.connection)
    })
  }

})

export default Runner;
