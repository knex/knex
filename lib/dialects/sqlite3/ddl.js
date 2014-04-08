// SQLite3 Specific DDL Things
// -------
module.exports = function(client) {

var _ = require('lodash');

// So altering the schema in SQLite3 is a major pain.
// We have our own object to deal with the renaming and altering the types
// for sqlite3 things.
function SQLite3_DDL(tableCompiler, pragma, runner) {
  this.tableCompiler = tableCompiler;
  this.pragma = pragma;
  this.runner = runner;

  this.tableName = this.tableCompiler.tableName;
  this.tableNameRaw = this.tableCompiler.tableNameRaw;
  this.alteredName = '_knex_temp_alter' + _.uniqueId();
}

SQLite3_DDL.prototype.getColumn = Promise.method(function(column) {
  var currentCol = _.findWhere(this.pragma, {name: column});
  if (!currentCol) throw new Error('The column ' + column + ' is not in the ' + this.tableName + ' table');
});

SQLite3_DDL.prototype.checkTransaction = Promise.method(function() {
  if (this.connection.__knexTransaction !== 1) {
    return this.runner.query({sql: 'begin transaction;'});
  }
});

SQLite3_DDL.prototype.commitTransaction = Promise.method(function() {
  if (this.connection.__knexTransaction !== 1) {
    return this.runner.query({sql: 'commit;'});
  }
});

SQLite3_DDL.prototype.rollbackTransaction = function(e) {
  if (this.connection.__knexTransaction !== 1) {
    return this.runner.query({sql: 'rollback;'});
  }
  throw e;
};

SQLite3_DDL.prototype.getTableSql = function() {
  return this.runner.query({sql: 'SELECT name, sql FROM sqlite_master WHERE type="table" AND name=' + this.tableName + ''});
};

SQLite3_DDL.prototype.renameTable = Promise.method(function() {
  return this.runner.query({sql: 'ALTER TABLE ' + this.tableName + ' RENAME TO ' + this.alteredName});
});

SQLite3_DDL.prototype.renameColumn = function() {
  return this.runner.query({sql: ''});
};

SQLite3_DDL.prototype.dropTempTable = function() {
  return this.runner.query({sql: 'DROP TABLE "' + this.alteredName + '"'});
};

SQLite3_DDL.prototype.reinsertData = Promise.method(function() {
  return new client.QueryBuilder().table(tableNameRaw).insert(_.map(selected, function(row) {
    row[to] = row[from];
    return _.omit(row, from);
  }));
});

SQLite3_DDL.prototype.renameColumn = Promise.method(function(from, to) {
  return this.getColumn(from)
    .bind(this)
    .then(this.getTableSql)
    .then(function(sql) {
      var createTable   = sql[0];
      var currentColumn = wrappedFrom + ' ' + currentCol.type;
      var newColumn     = wrappedTo   + ' ' + currentCol.type;
      if (createTable.sql.indexOf(currentColumn) === -1) {
        throw new Error('Unable to find the column to change');
      }
      return Promise.all([
        this.runner.query({sql: createTable.sql.replace(currentColumn, newColumn)}),
        this.runner.query({sql: 'SELECT * FROM "_knex_temp_rename_column_' + tableNameRaw + '"'})
      ]);
    })
    .tap(this.commitTransaction)
    .catch(this.rollbackTransaction);
});

SQLite3_DDL.prototype.dropColumn = Promise.method(function(column) {
  return this.getColumn(column)
    .then(function() {

    });
});

client.SQLite3_DDL = SQLite3_DDL;

return SQLite3_DDL;
};