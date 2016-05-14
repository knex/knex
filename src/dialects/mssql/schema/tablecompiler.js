
// MSSQL Table Builder & Compiler
// -------
var inherits = require('inherits');
var TableCompiler = require('../../../schema/tablecompiler');
var helpers = require('../../../helpers');
var Promise = require('../../../promise');

import {assign} from 'lodash'

// Table Compiler
// ------

function TableCompiler_MSSQL() {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_MSSQL, TableCompiler);

assign(TableCompiler_MSSQL.prototype, {

  createAlterTableMethods: ['foreign', 'primary', 'unique'],
  createQuery: function (columns, ifNot) {
    var createStatement = ifNot ? 'if object_id(\'' + this.tableName() + '\', \'U\') is null CREATE TABLE ' : 'CREATE TABLE ';
    var sql = createStatement + this.tableName() + (this._formatting ? ' (\n    ' : ' (') + columns.sql.join(this._formatting ? ',\n    ' : ', ') + ')';

    if (this.single.comment) {
      var comment = (this.single.comment || '');
      if (comment.length > 60) helpers.warn('The max length for a table comment is 60 characters');
    }

    this.pushQuery(sql);
  },

  lowerCase: false,

  addColumnsPrefix: 'ADD ',

  dropColumnPrefix: 'DROP COLUMN ',

  // Compiles column add.  Multiple columns need only one ADD clause (not one ADD per column) so core addColumns doesn't work.  #1348
  addColumns : function (columns) {
    if (columns.sql.length > 0) {
      this.pushQuery({
        sql: (this.lowerCase ? 'alter table ' : 'ALTER TABLE ') + this.tableName() + ' ' + this.addColumnsPrefix + columns.sql.join(', '),
        bindings: columns.bindings
      });
    }
  },

  // Compiles column drop.  Multiple columns need only one DROP clause (not one DROP per column) so core dropColumn doesn't work.  #1348
  dropColumn: function () {
    var _this2 = this;
    var columns = helpers.normalizeArr.apply(null, arguments);

    var drops = (Array.isArray(columns) ? columns : [columns]).map(function (column) {
      return _this2.formatter.wrap(column);
    });
    this.pushQuery((this.lowerCase ? 'alter table ' : 'ALTER TABLE ') + this.tableName() + ' ' + this.dropColumnPrefix + drops.join(', '));
  },

  // Compiles the comment on the table.
  comment: function () {
  },

  changeType: function () {
  },

  // Renames a column on the table.
  renameColumn: function (from, to) {
    this.pushQuery('exec sp_rename ' + this.formatter.parameter(this.tableName() + '.' + from) + ', ' + this.formatter.parameter(to) + ', \'COLUMN\'');
  },

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
      var tableName = formatter.wrap(ref.TABLE_NAME);
      var keyName = formatter.wrap(ref.CONSTRAINT_NAME);
      var column = formatter.columnize(ref.COLUMN_NAME);
      var references = formatter.columnize(ref.REFERENCED_COLUMN_NAME);
      var inTable = formatter.wrap(ref.REFERENCED_TABLE_NAME);
      var onUpdate = ' ON UPDATE ' + ref.UPDATE_RULE;
      var onDelete = ' ON DELETE ' + ref.DELETE_RULE;

      return runner.query({
        sql: 'ALTER TABLE ' + tableName + ' ADD CONSTRAINT ' + keyName +
        ' FOREIGN KEY (' + column + ') REFERENCES ' + inTable + ' (' + references + ')' + onUpdate + onDelete
      });
    }));
  },

  index: function (columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('CREATE INDEX ' + indexName + ' ON ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
  },

  primary: function (columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('primary', this.tableNameRaw, columns);
    if (!this.forCreate) {
      this.pushQuery('ALTER TABLE ' + this.tableName() + ' ADD PRIMARY KEY (' + this.formatter.columnize(columns) + ')');
    } else {
      this.pushQuery('CONSTRAINT ' + indexName + ' PRIMARY KEY (' + this.formatter.columnize(columns) + ')');
    }
  },

  unique: function (columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    if (!this.forCreate) {
      this.pushQuery('CREATE UNIQUE INDEX ' + indexName + ' ON ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
    } else {
      this.pushQuery('CONSTRAINT ' + indexName + ' UNIQUE (' + this.formatter.columnize(columns) + ')');
    }
  },

  // Compile a drop index command.
  dropIndex: function (columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('DROP INDEX ' + indexName + ' ON ' + this.tableName());
  },

  // Compile a drop foreign key command.
  dropForeign: function (columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery('ALTER TABLE ' + this.tableName() + ' DROP CONSTRAINT ' + indexName);
  },

  // Compile a drop primary key command.
  dropPrimary: function () {
    this.pushQuery('ALTER TABLE ' + this.tableName() + ' DROP PRIMARY KEY');
  },

  // Compile a drop unique key command.
  dropUnique: function (column, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, column);
    this.pushQuery('ALTER TABLE ' + this.tableName() + ' DROP CONSTRAINT ' + indexName);
  }

})

module.exports = TableCompiler_MSSQL;
