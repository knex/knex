// SQLite3
// -------

// Other dependencies, including the `sqlite3` library,
// which needs to be added as a dependency to the project
// using this database.
var _       = require('lodash');
var sqlite3 = require('sqlite3');

// All other local project modules needed in this scope.
var ServerBase      = require('./base').ServerBase;
var Builder         = require('../../lib/builder').Builder;
var Transaction     = require('../../lib/transaction').Transaction;
var SchemaInterface = require('../../lib/schemainterface').SchemaInterface;
var Helpers         = require('../../lib/helpers').Helpers;
var Promise         = require('../../lib/promise').Promise;

var grammar         = require('./sqlite3/grammar').grammar;
var schemaGrammar   = require('./sqlite3/schemagrammar').schemaGrammar;

// Constructor for the SQLite3Client.
var SQLite3Client = exports.Client = ServerBase.extend({

  dialect: 'sqlite3',

  // Attach the appropriate grammar definitions onto the current client.
  attachGrammars: function() {
    this.grammar = grammar;
    this.schemaGrammar = schemaGrammar;
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  runQuery: function(connection, sql, bindings, builder) {
    if (!connection) throw new Error('No database connection exists for the query');
    if (sql === '__rename_column__') {
      return this.ddl(connection, sql, bindings, builder);
    }
    var method = (builder.type === 'insert' ||
      builder.type === 'update' || builder.type === 'delete') ? 'run' : 'all';
    // Call the querystring and then release the client
    var dfd = Promise.pending();
    connection[method](sql, bindings, function(err, resp) {
      if (err) return dfd.reject(err);
      // We need the context here, because it has the "this.lastID" or "this.changes"
      return dfd.fulfill([resp, this]);
    });
    return dfd.promise;
  },

  poolDefaults: {
    max: 1,
    min: 1,
    destroy: function(client) { client.close(); }
  },

  ddl: function(connection, sql, bindings, builder) {
    var client = this;
    return Promise.promisify(connection.run, connection)('begin transaction;').then(function() {
      var transaction  = new Transaction({client: client});
      var containerObj = transaction.getContainerObject(connection);
      return transaction.initiateDeferred(function(trx) {
        client.alterSchema.call(client, builder, trx);
      })(containerObj);
    });
  },

  getRawConnection: function() {
    var dfd = Promise.pending();
    var db = new sqlite3.Database(this.connectionSettings.filename, function(err) {
      if (err) return dfd.reject(err);
      dfd.fulfill(db);
    });
    return dfd.promise;
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function(connection) {
    connection.close();
  },

  // Begins a transaction statement on the instance,
  // resolving with the connection of the current transaction.
  startTransaction: function(connection) {
    return this.getConnection().tap(function(connection) {
      return Promise.promisify(connection.run, connection)('begin transaction;');
    });
  },

  // Finishes the transaction statement on the instance.
  finishTransaction: function(type, transaction, msg) {
    var client = this;
    var dfd    = transaction.dfd;
    return Promise
      .promisify(transaction.connection.run, transaction.connection)(type + ';')
      .then(function(resp) {
        if (type === 'commit') dfd.fulfill(msg || resp);
        if (type === 'rollback') dfd.reject(msg || resp);
      }, function (err) {
        dfd.reject(err);
      }).ensure(function() {
        return client.releaseConnection(transaction.connection).tap(function() {
          transaction.connection = null;
        });
      });
  },

  // This needs to be refactored... badly.
  alterSchema: function(builder, trx) {
    var currentCol, command;
    var connection = trx.connection;
    var query = Promise.promisify(connection.all, connection);

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
    }).then(trx.commit, trx.rollback);
  }

});
