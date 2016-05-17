
var inherits      = require('inherits');
var utils         = require('../utils');
var TableCompiler = require('../../../schema/tablecompiler');
var helpers       = require('../../../helpers');

import {assign} from 'lodash'

// Table Compiler
// ------

function TableCompiler_Sqlanywhere() {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_Sqlanywhere, TableCompiler);

assign(TableCompiler_Sqlanywhere.prototype, {

  // Compile a rename column command.
  renameColumn: function(from, to) {
    return this.pushQuery({
      sql: 'alter table ' + this.tableName() + ' rename ' +
        this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
    });
  },

  compileAdd: function(builder) {
    var table = this.formatter.wrap(builder);
    var columns = this.prefixArray('add column', this.getColumns(builder));
    return this.pushQuery({
      sql: 'alter table ' + table + ' ' + columns.join(', ')
    });
  },

  // Adds the "create" query to the query sequence.
  createQuery: function(columns, ifNot) {
    var sql = 'create table ';
    if( ifNot ) {
      sql += 'if not exists ';   
    }
    sql += this.tableName() + ' (' + columns.sql.join(', ') + ')';
    this.pushQuery({
      sql: sql,
      bindings: columns.bindings
    });
    if (this.single.comment) this.comment(this.single.comment);
  },

  // Compiles the comment on the table.
  comment: function(comment) {
    this.pushQuery('comment on table ' + this.tableName() + ' is ' + "'" + (comment || '') + "'");
  },

  addColumnsPrefix: 'add ',

  dropColumn: function() {
    var columns = helpers.normalizeArr.apply(null, arguments);
    var sql = 'alter table ' + this.tableName();
    var i = -1;
    while( ++i < columns.length ) {
       sql += ' drop ' + this.formatter.wrap(columns[i]);
    }
    this.pushQuery(sql);
  },

  changeType: function() {
    // alter table + table + ' modify ' + wrapped + '// type';
  },

  _indexCommand: function(type, tableName, columns) {
    return this.formatter.wrap(utils.generateCombinedName(type, tableName, columns));
  },

  primary: function(columns) {
    this.pushQuery('alter table ' + this.tableName() + " add primary key (" + this.formatter.columnize(columns) + ")");
  },

  dropPrimary: function() {
    this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
  },

  index: function(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('create index ' + indexName + ' on ' + this.tableName() +
      ' (' + this.formatter.columnize(columns) + ')');
  },

  dropIndex: function(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('drop index ' + indexName);
  },

  unique: function(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery('create unique index ' + indexName + ' on ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
  },

  dropUnique: function(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery('drop index ' + indexName);
  },

  dropForeign: function(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
  }

})

module.exports = TableCompiler_Sqlanywhere;
