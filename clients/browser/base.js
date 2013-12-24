// WebBase
// -------
var _          = require('lodash');

var ClientBase = require('../base').ClientBase;
var Promise    = require('../../lib/promise').Promise;

var grammar       = require('./sqlite3/grammar').grammar;
var schemaGrammar = require('./sqlite3/schemagrammar').schemaGrammar;

var ServerBase = module.exports = ClientBase.extend({

  // Pass a config object into the constructor,
  // which then initializes the pool and
  constructor: function(config) {
    if (config.debug) this.isDebugging = true;
    this.name = config.name || 'knex_database';
    this.attachGrammars();
    this.connectionSettings = config.connection;
  },

  // Attach the appropriate grammar definitions onto the current client.
  attachGrammars: function() {
    this.grammar = grammar;
    this.schemaGrammar = schemaGrammar;
  },

  // Execute a query on the specified Builder or QueryBuilder
  // interface. If a `connection` is specified, use it, otherwise
  // acquire a connection, and then dispose of it when we're done.
  query: Promise.method(function(builder) {
    var conn, client = this;
    var sql        = builder.toSql(builder);
    var bindings   = builder.getBindings();

    var chain = this.getConnection(builder)
      .bind(builder)
      .then(function(connection) {
        if (client.isDebugging || this.flags.debug) {
          client.debug(sql, bindings, connection, this);
        }
        conn = connection;
        if (_.isArray(sql)) {
          var current = Promise.fulfilled();
          return Promise.map(sql, function(query, i) {
            current = current.then(function () {
              builder.currentIndex = i;
              return client.runQuery(connection, query, bindings, builder);
            });
            return current;
          });
        }
        return client.runQuery(connection, sql, bindings, builder);
      });

    // Since we usually only need the `sql` and `bindings` to help us debug the query, output them
    // into a new error... this way, it `console.log`'s nicely for debugging, but you can also
    // parse them out with a `JSON.parse(error.message)`. Also, use the original `clientError` from the
    // database client is retained as a property on the `newError`, for any additional info.
    return chain.then(builder.handleResponse).caught(function(error) {
      var newError = new Error(error.message + ', sql: ' + sql + ', bindings: ' + bindings);
          newError.sql = sql;
          newError.bindings = bindings;
          newError.clientError = error;
      throw newError;
    });
  }),

  // Debug a query.
  debug: function(sql, bindings, connection, builder) {
    if (typeof console !== "undefined") {
      console.log('Debug: ' + JSON.stringify({sql: sql, bindings: bindings, cid: connection.__cid}));
    }
  },

  // Retrieves a connection from the connection pool,
  // returning a promise.
  getConnection: Promise.method(function(builder) {
    if (builder && builder.usingConnection) return builder.usingConnection;
    var db = openDatabase(this.name, '1.0', this.name, 65536);
    var dfd = Promise.defer();
    db.transaction(function(t) {
      t.__cid = _.uniqueId('__cid');
      if (builder) builder.usingConnection = builder;
      dfd.resolve(t);
    });
    return dfd.promise;
  }),

  // Begins a transaction statement on the instance,
  // resolving with the connection of the current transaction.
  startTransaction: Promise.method(function() {
    return this.getConnection();
  }),

  // Finishes the transaction statement on the instance.
  finishTransaction: Promise.method(function(type, transaction, msg) {
    if (msg instanceof Error) {
      throw msg;
    } else {
      throw new Error(msg);
    }
  })

});