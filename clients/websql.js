// SQLite3 - WebSQL
// ----------
var _       = require('lodash');

// All other local project modules needed in this scope.
var ClientBase      = require('./base').ClientBase;
var Builder         = require('../lib/builder').Builder;
var Transaction     = require('../lib/transaction').Transaction;
var SchemaInterface = require('../lib/schemainterface').SchemaInterface;
var Promise         = require('../lib/promise').Promise;

var grammar         = require('./websql/grammar').grammar;
var schemaGrammar   = require('./websql/schemagrammar').schemaGrammar;

// Constructor for the SQLite3Client.
var WebSQL = exports.Client = ClientBase.extend({

  dialect: 'websql',

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
  }),

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  runQuery: Promise.method(function(connection, sql, bindings, builder) {
    if (!connection) throw new Error('No database connection exists for the query');
    if (sql === '__rename_column__') {
      return this.ddl(connection, sql, bindings, builder);
    }
    // Call the querystring and then release the client
    var dfd = Promise.pending();
    connection.executeSql(sql, bindings, function(trx, resp) {
      dfd.fulfill(resp, trx);
    }, function(trx, err) {
      dfd.reject(err, trx);
      return true;
    });
    return dfd.promise;
  }),

  ddl: function(connection, sql, bindings, builder) {
    return this.alterSchema.call(client, builder, connection);
  },

  // This needs to be refactored... badly.
  alterSchema: function(builder, trx) {
    var currentCol, command;
    var query = function() {
      return new Promise(function(resolve, reject) {
        trx.executeSql(connection, function(trx, data) {
          resolve(data, trx);
        }, function(trx, err) {
          reject(err, trx);
        });
      });
    };

    return Promise.all([
      query('PRAGMA table_info(' + builder.table + ')', []),
      query('SELECT name, sql FROM sqlite_master WHERE type="table" AND name="' + builder.table + '"', [])
    ])
    .tap(function(resp) {
      var pragma = resp[0];
      var sql    = resp[1][0];
      command = builder.commands[builder.currentIndex];
      if (!(currentCol = _.findWhere(pragma, {name: command.from}))) {
        throw new Error('The column ' + command.from + ' is not in the current table');
      }
      return query('ALTER TABLE ' + sql.name + ' RENAME TO __migrate__' + sql.name);
    }).spread(function(pragma, sql) {
      sql = sql[0];
      var currentColumn = '"' + command.from + '" ' + currentCol.type;
      var newColumn     = '"' + command.to   + '" ' + currentCol.type;
      if (sql.sql.indexOf(currentColumn) === -1) {
        return trx.reject('Unable to find the column to change');
      }
      return Promise.all([
        query(sql.sql.replace(currentColumn, newColumn)),
        query('SELECT * FROM "__migrate__' + sql.name + '"'),
      ]);
    }).spread(function(createTable, selected) {
      var qb = new Builder(builder.knex).transacting(trx);
          qb.table = builder.table;
      return Promise.all([
        qb.insert(_.map(selected, function(row) {
          row[command.to] = row[command.from];
          return _.omit(row, command.from);
        })),
        query('DROP TABLE "__migrate__' + builder.table + '"')
      ]);
    });
  }

});