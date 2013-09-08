// sqlite3
// -------

// All of the "when.js" promise components needed in this module.
var when            = require('when');
var nodefn          = require('when/node/function');

// Other dependencies, including the `sqlite3` library,
// which needs to be added as a dependency to the project
// using this database.
var _               = require('underscore');
var sqlite3         = require('sqlite3');

// All other local project modules needed in this scope.
var SQLite3Base     = require('../base/sqlite3');
var Builder         = require('../../lib/builder').Builder;
var transaction     = require('../../lib/transaction').transaction;
var SchemaInterface = require('../../lib/schemainterface').SchemaInterface;

// Constructor for the SQLite3Client.
var SQLite3Client = exports.Client = SQLite3Base.extend({

  // Retrieves a connection from the connection pool,
  // returning a promise.
  getConnection: function() {
    return nodefn.call(this.pool.acquire);
  },

  // Releases a connection from the connection pool,
  // returning a promise.
  releaseConnection: function(conn) {
    return nodefn.call(this.pool.release, conn);
  },

  // Prepare the query...
  prepareQuery: function(connection) {
    if (builder.sql === '__rename_column__') {
      return transaction.call(builder, function(trx) {
        instance.alterSchema.call(instance, builder, trx);
      });
    }
  },

  poolDefaults: {
    max: 1,
    min: 1,
    destroy: function(client) { client.close(); }
  },

  getRawConnection: function(callback) {
    var client = new sqlite3.Database(this.connectionSettings.filename, function(err) {
      callback(err, client);
    });
  },

  // Begins a transaction statement on the instance,
  // resolving with the connection of the current transaction.
  startTransaction: function(connection) {
    return this.getConnection().tap(function(connection) {
      return nodefn.call(connection.run.bind(connection), 'begin transaction;', []);
    });
  },

  finishTransaction: function(type, trans, dfd, msg) {
    var ctx = this;
    nodefn.call(trans.connection.run.bind(trans.connection), type + ';', []).then(function(resp) {
      if (type === 'commit') dfd.resolve(msg || resp);
      if (type === 'rollback') dfd.reject(msg || resp);
    }).ensure(function() {
      ctx.releaseConnection(trans.connection);
      trans.connection = null;
    });
  },

  // This needs to be refactored... badly.
  alterSchema: function(builder, trx) {
    var instance = this;
    var connection = trx.connection;
    var currentCol, command;

    return when.all([
      nodefn.call(connection.all.bind(connection), 'PRAGMA table_info(' + builder.table + ')', []),
      nodefn.call(connection.all.bind(connection), 'SELECT name, sql FROM sqlite_master WHERE type="table" AND name="' + builder.table + '"', [])
    ])
    .tap(function(resp) {
      var pragma = resp[0];
      var sql    = resp[1][0];
      command = builder.commands[builder.currentIndex];
      if (!(currentCol = _.findWhere(pragma, {name: command.from}))) {
        throw new Error('The column ' + command.from + ' is not in the current table');
      }
      return nodefn.call(connection.all.bind(connection), 'ALTER TABLE ' + sql.name + ' RENAME TO __migrate__' + sql.name);
    }).spread(function(pragma, sql) {
      sql = sql[0];
      var currentColumn = '"' + command.from + '" ' + currentCol.type;
      var newColumn     = '"' + command.to   + '" ' + currentCol.type;
      if (sql.sql.indexOf(currentColumn) === -1) {
        return trx.reject('Unable to find the column to change');
      }
      return when.all([
        nodefn.call(connection.all.bind(connection), sql.sql.replace(currentColumn, newColumn)),
        nodefn.call(connection.all.bind(connection), 'SELECT * FROM "__migrate__' + sql.name + '"'),
      ]);
    }).spread(function(createTable, selected) {
      var qb = new Builder(instance).transacting(trx);
          qb.table = builder.table;
      return when.all([
        qb.insert(_.map(selected, function(row) {
          row[command.to] = row[command.from];
          return _.omit(row, command.from);
        })),
        nodefn.call(connection.all.bind(connection), 'DROP TABLE "__migrate__' + builder.table + '"')
      ]);
    }).then(trx.commit, trx.rollback);
  }

});

var Query = exports.Query = BaseQuery.extend({

  runQuery: function() {
    // var method = (builder.type === 'insert' ||
    //   builder.type === 'update' || builder.type === 'delete') ? 'run' : 'all';

    // // Call the querystring and then release the client
    // conn[method](builder.sql, builder.bindings, function (err, resp) {

    //   if (err) return dfd.reject(err);

    //   if (builder._source === 'Raw') return dfd.resolve(resp);

    //   if (builder._source === 'SchemaBuilder') {
    //     if (builder.type === 'tableExists') {
    //       return dfd.resolve(resp.length > 0);
    //     } else if (builder.type === 'columnExists') {
    //       return dfd.resolve(_.findWhere(resp, {name: builder.bindings[1]}) != null);
    //     } else {
    //       return dfd.resolve(null);
    //     }
    //   }

    //   if (builder.type === 'select') {
    //     resp = base.skim(resp);
    //   } else if (builder.type === 'insert') {
    //     resp = [this.lastID];
    //   } else if (builder.type === 'delete' || builder.type === 'update') {
    //     resp = this.changes;
    //   } else {
    //     resp = '';
    //   }

    //   dfd.resolve(resp);
    // });
  }

});
