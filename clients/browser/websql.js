// SQLite3 - WebSQL
// ----------
var _       = require('lodash');

// All other local project modules needed in this scope.
var ClientBase      = require('./base');
var Builder         = require('../../lib/builder').Builder;
var Transaction     = require('../../lib/transaction').Transaction;
var SchemaInterface = require('../../lib/schemainterface').SchemaInterface;
var Promise         = require('../../lib/promise').Promise;

// Constructor for the SQLite3Client.
var WebSQL = ClientBase.extend({

  dialect: 'sqlite3',

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

exports.Client = WebSQL;