'use strict';

// SQLite3_DDL
//
// All of the SQLite3 specific DDL helpers for renaming/dropping
// columns and changing datatypes.
// -------
module.exports = function(client) {

var _       = require('lodash');
var Promise = require('../../../promise');

// So altering the schema in SQLite3 is a major pain.
// We have our own object to deal with the renaming and altering the types
// for sqlite3 things.
function SQLite3_DDL(runner, tableCompiler, pragma) {
  this.tableCompiler = tableCompiler;
  this.pragma = pragma;
  this.runner = runner;
  this.formatter = new client.Formatter();
  this.tableName = this.tableCompiler.tableNameRaw;
  this.alteredName = '_knex_temp_alter' + _.uniqueId();
}

SQLite3_DDL.prototype.getColumn = Promise.method(function(column) {
  var currentCol = _.findWhere(this.pragma, {name: column});
  if (!currentCol) throw new Error('The column ' + column + ' is not in the ' + this.tableName + ' table');
  return currentCol;
});

SQLite3_DDL.prototype.ensureTransaction = Promise.method(function() {
  if (!this.runner.transaction) {
    return this.runner.beginTransaction();
  }
});

SQLite3_DDL.prototype.commitTransaction = Promise.method(function() {
  if (!this.runner.transaction) {
    return this.runner.commitTransaction();
  }
});

SQLite3_DDL.prototype.rollbackTransaction = function(e) {
  if (this.runner.transaction) throw e;
  return this.runner.rollbackTransaction().throw(e);
};

SQLite3_DDL.prototype.getTableSql = function() {
  return this.runner.query({sql: 'SELECT name, sql FROM sqlite_master WHERE type="table" AND name="' + this.tableName + '"'});
};

SQLite3_DDL.prototype.renameTable = Promise.method(function() {
  return this.runner.query({sql: 'ALTER TABLE "' + this.tableName + '" RENAME TO "' + this.alteredName + '"'});
});

SQLite3_DDL.prototype.dropOriginal = function() {
  return this.runner.query({sql: 'DROP TABLE "' + this.tableName + '"'});
};

SQLite3_DDL.prototype.dropTempTable = function() {
  return this.runner.query({sql: 'DROP TABLE "' + this.alteredName + '"'});
};

SQLite3_DDL.prototype.copyData = function() {
  return this.runner.query({sql: 'SELECT * FROM "' + this.tableName + '"'})
    .bind(this)
    .then(this.insertChunked(20, this.alteredName));
};

SQLite3_DDL.prototype.reinsertData = function(iterator) {
  return function() {
    return this.runner.query({sql: 'SELECT * FROM "' + this.alteredName + '"'})
      .bind(this)
      .then(this.insertChunked(20, this.tableName, iterator));
  };
};

SQLite3_DDL.prototype.insertChunked = function(amount, target, iterator) {
  iterator = iterator || function(noop) { return noop; };
  return function(result) {
    var batch = [];
    var ddl = this;
    return Promise.reduce(result, function(memo, row) {
      memo++;
      batch.push(row);
      if (memo % 20 === 0 || memo === result.length) {
        return new client.QueryBuilder()
          .connection(ddl.runner.connection)
          .table(target)
          .insert(_.map(batch, iterator))
          .then(function() { batch = []; })
          .thenReturn(memo);
      }
      return memo;
    }, 0);
  };
};

SQLite3_DDL.prototype.createTempTable = function(createTable) {
  return function() {
    return this.runner.query({sql: createTable.sql.replace(this.tableName, this.alteredName)});
  };
};

// Boy, this is quite a method.
SQLite3_DDL.prototype.renameColumn = Promise.method(function(from, to) {
  var currentCol;
  return this.ensureTransaction()
    .bind(this)
    .then(function() {
      return this.getColumn(from);
    })
    .tap(function(col) { currentCol = col; })
    .then(this.getTableSql)
    .then(function(sql) {
      var createTable = sql[0];
      var a = this.formatter.wrap(from) + ' ' + currentCol.type;
      var b = this.formatter.wrap(to)   + ' ' + currentCol.type;
      if (createTable.sql.indexOf(a) === -1) {
        throw new Error('Unable to find the column to change');
      }
      return Promise.bind(this)
      .then(this.createTempTable(createTable))
      .then(this.copyData)
      .then(this.dropOriginal)
      .then(function() {
        return this.runner.query({sql: createTable.sql.replace(a, b)});
      })
      .then(this.reinsertData(function(row) {
        row[to] = row[from];
        return _.omit(row, from);
      }))
      .then(this.dropTempTable);
    })
    .tap(this.commitTransaction)
    .catch(this.rollbackTransaction);
});

SQLite3_DDL.prototype.dropColumn = Promise.method(function(column) {
   var currentCol;
   return this.ensureTransaction()
    .bind(this)
    .then(function() {
      return this.getColumn(column);
    })
    .tap(function(col) { currentCol = col; })
    .then(this.getTableSql)
    .then(function(sql) {
      var createTable = sql[0];
      var a = this.formatter.wrap(column) + ' ' + currentCol.type + ', ';
      if (createTable.sql.indexOf(a) === -1) {
        throw new Error('Unable to find the column to change');
      }
      return Promise.bind(this)
        .then(this.createTempTable(createTable))
        .then(this.copyData)
        .then(this.dropOriginal)
        .then(function() {
          return this.runner.query({sql: createTable.sql.replace(a, '')});
        })
        .then(this.reinsertData(function(row) {
          return _.omit(row, column);
        }))
        .then(this.dropTempTable);
    })
    .tap(this.commitTransaction)
    .catch(this.rollbackTransaction);
});

client.SQLite3_DDL = SQLite3_DDL;

};
