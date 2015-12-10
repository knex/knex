
// MSSQL Table Builder & Compiler
// -------
'use strict';

var inherits = require('inherits');
var TableCompiler = require('../../../schema/tablecompiler');
var helpers = require('../../../helpers');
var Promise = require('../../../promise');
var assign = require('lodash/object/assign');

// Table Compiler
// ------

function TableCompiler_MSSQL() {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_MSSQL, TableCompiler);

assign(TableCompiler_MSSQL.prototype, {

  createQuery: function createQuery(columns, ifNot) {
    var createStatement = ifNot ? 'if object_id(\'' + this.tableName() + '\', \'U\') is not null create table ' : 'create table ';
    var client = this.client,
        conn = {},
        sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')';

    // Check if the connection settings are set.
    if (client.connectionSettings) {
      conn = client.connectionSettings;
    }

    //var collation = this.single.collate || conn.collate || '';
    //if (collation) sql += ' COLLATE ' + collation;

    if (this.single.comment) {
      var comment = this.single.comment || '';
      if (comment.length > 60) helpers.warn('The max length for a table comment is 60 characters');
    }

    this.pushQuery(sql);
  },

  addColumnsPrefix: 'add ',

  dropColumnPrefix: 'drop column ',

  // Compiles the comment on the table.
  comment: function comment() {},

  changeType: function changeType() {},

  // Renames a column on the table.
  renameColumn: function renameColumn(from, to) {
    this.pushQuery('exec sp_rename ' + this.formatter.parameter(this.tableName() + '.' + from) + ', ' + this.formatter.parameter(to) + ', \'COLUMN\'');
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
  dropFKRefs: function dropFKRefs(runner, refs) {
    var formatter = this.client.formatter();
    return Promise.all(refs.map(function (ref) {
      var constraintName = formatter.wrap(ref.CONSTRAINT_NAME);
      var tableName = formatter.wrap(ref.TABLE_NAME);
      return runner.query({
        sql: 'alter table ' + tableName + ' drop constraint ' + constraintName
      });
    }));
  },
  createFKRefs: function createFKRefs(runner, refs) {
    var formatter = this.client.formatter();

    return Promise.all(refs.map(function (ref) {
      var tableName = formatter.wrap(ref.TABLE_NAME);
      var keyName = formatter.wrap(ref.CONSTRAINT_NAME);
      var column = formatter.columnize(ref.COLUMN_NAME);
      var references = formatter.columnize(ref.REFERENCED_COLUMN_NAME);
      var inTable = formatter.wrap(ref.REFERENCED_TABLE_NAME);
      var onUpdate = ' ON UPDATE ' + ref.UPDATE_RULE;
      var onDelete = ' ON DELETE ' + ref.DELETE_RULE;

      return runner.query({
        sql: 'alter table ' + tableName + ' add constraint ' + keyName + ' foreign key (' + column + ') refrences ' + inTable + ' (' + references + ')' + onUpdate + onDelete
      });
    }));
  },
  index: function index(columns, indexName) {
    indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
  },

  primary: function primary(columns, indexName) {
    indexName = indexName || this._indexCommand('primary', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' add primary key (' + this.formatter.columnize(columns) + ')');
  },

  unique: function unique(columns, indexName) {
    indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery('create unique index ' + indexName + ' on ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
  },

  // Compile a drop index command.
  dropIndex: function dropIndex(columns, indexName) {
    indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('drop index ' + indexName + ' on ' + this.tableName());
  },

  // Compile a drop foreign key command.
  dropForeign: function dropForeign(columns, indexName) {
    indexName = indexName || this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
  },

  // Compile a drop primary key command.
  dropPrimary: function dropPrimary() {
    this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
  },

  // Compile a drop unique key command.
  dropUnique: function dropUnique(column, indexName) {
    indexName = indexName || this._indexCommand('unique', this.tableNameRaw, column);
    this.pushQuery('drop index ' + indexName + ' on ' + this.tableName());
  }

});

module.exports = TableCompiler_MSSQL;