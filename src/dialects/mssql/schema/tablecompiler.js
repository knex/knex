
// MSSQL Table Builder & Compiler
// -------
var inherits      = require('inherits');
var TableCompiler = require('../../../schema/tablecompiler');
var helpers       = require('../../../helpers');
var Promise       = require('../../../promise');
var assign        = require('lodash/object/assign');

// Table Compiler
// ------

function TableCompiler_MSSQL() {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_MSSQL, TableCompiler);

assign(TableCompiler_MSSQL.prototype, {
  
  createQuery: function(columns, ifNot) {
    var createStatement = ifNot ? 'if object_id(\'' + this.tableName() +'\', \'U\') is not null CREATE TABLE ' : 'CREATE TABLE ';
    var client = this.client, conn = {}, 
      sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')';

    // Check if the connection settings are set.
    if (client.connectionSettings) {
      conn = client.connectionSettings;
    }

    //var collation = this.single.collate || conn.collate || '';
    //if (collation) sql += ' COLLATE ' + collation;

    if (this.single.comment) {
      var comment = (this.single.comment || '');
      if (comment.length > 60) helpers.warn('The max length for a table comment is 60 characters');
    }

    this.pushQuery(sql);
  },

  lowerCase: false,
  
  addColumnsPrefix: 'ADD ',
  
  dropColumnPrefix: 'DROP COLUMN ',

  // Compiles the comment on the table.
  comment: function() {
  },

  changeType: function() {
  },

  // Renames a column on the table.
  renameColumn: function(from, to) {
    this.pushQuery('exec sp_rename ' +  this.formatter.parameter(this.tableName() + '.' + from) + ', ' + this.formatter.parameter(to) + ', \'COLUMN\'');
  },

  // getFKRefs: function (runner) {
  //   var formatter = this.client.formatter();
  //   var sql = 'SELECT KCU.CONSTRAINT_NAME, KCU.TABLE_NAME, KCU.COLUMN_NAME, '+
  //             '       KCU.REFERENCED_TABLE_NAME, KCU.REFERENCED_COLUMN_NAME, '+
  //             '       RC.UPDATE_RULE, RC.DELETE_RULE '+
  //             'FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KCU '+
  //             'JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS AS RC '+
  //             '       USING(CONSTRAINT_NAME)' +
  //             'WHERE KCU.REFERENCED_TABLE_NAME = ' + formatter.parameter(this.tableNameRaw) + ' '+
  //             '  AND KCU.CONSTRAINT_SCHEMA = ' + formatter.parameter(this.client.database()) + ' '+
  //             '  AND RC.CONSTRAINT_SCHEMA = ' + formatter.parameter(this.client.database());
  //   return runner.query({
  //     sql: sql,
  //     bindings: formatter.bindings
  //   });
  // },
  dropFKRefs: function (runner, refs) {
    var formatter = this.client.formatter();
    return Promise.all(refs.map(function (ref) {
      var constraintName = formatter.wrap(ref.CONSTRAINT_NAME);
      var tableName = formatter.wrap(ref.TABLE_NAME);
      return runner.query({
        sql: 'ALTER TABLE ' + tableName + ' DROP CONSTRAINT ' + constraintName
      });
    }));
  },
  createFKRefs: function (runner, refs) {
    var formatter = this.client.formatter();
    
    return Promise.all(refs.map(function (ref) {
      var tableName  = formatter.wrap(ref.TABLE_NAME);
      var keyName    = formatter.wrap(ref.CONSTRAINT_NAME);
      var column     = formatter.columnize(ref.COLUMN_NAME);
      var references = formatter.columnize(ref.REFERENCED_COLUMN_NAME);
      var inTable    = formatter.wrap(ref.REFERENCED_TABLE_NAME);
      var onUpdate   = ' ON UPDATE ' + ref.UPDATE_RULE;
      var onDelete   = ' ON DELETE ' + ref.DELETE_RULE;
      
      return runner.query({
        sql: 'ALTER TABLE ' + tableName + ' ADD CONSTRAINT ' + keyName + 
          ' FOREIGN KEY (' + column + ') REFERENCES ' + inTable + ' (' + references + ')' + onUpdate + onDelete
      });
    }));
  },
  index: function(columns, indexName) {
    indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('CREATE INDEX ' + indexName + ' ON ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
  },

  primary: function(columns, indexName) {
    indexName = indexName || this._indexCommand('primary', this.tableNameRaw, columns);
    this.pushQuery('ALTER TABLE ' + this.tableName() + ' ADD PRIMARY KEY (' + this.formatter.columnize(columns) + ')');
  },

  unique: function(columns, indexName) {
    indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery('CREATE UNIQUE INDEX ' + indexName + ' ON ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
  },

  // Compile a drop index command.
  dropIndex: function(columns, indexName) {
    indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('DROP INDEX ' + indexName + ' ON ' + this.tableName());
  },

  // Compile a drop foreign key command.
  dropForeign: function(columns, indexName) {
    indexName = indexName || this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery('ALTER TABLE ' + this.tableName() + ' DROP CONSTRAINT ' + indexName);
  },

  // Compile a drop primary key command.
  dropPrimary: function() {
    this.pushQuery('ALTER TABLE ' + this.tableName() + ' DROP PRIMARY KEY');
  },

  // Compile a drop unique key command.
  dropUnique: function(column, indexName) {
    indexName = indexName || this._indexCommand('unique', this.tableNameRaw, column);
    this.pushQuery('DROP INDEX ' + indexName + ' ON ' + this.tableName());
  }

})

module.exports = TableCompiler_MSSQL;
