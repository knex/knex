'use strict';

exports.__esModule = true;

var _filter2 = require('lodash/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _tablecompiler = require('../../../schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _helpers = require('../../../helpers');

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Table Compiler
// -------

function TableCompiler_SQLite3() {
  _tablecompiler2.default.apply(this, arguments);
  this.primaryKey = void 0;
}
(0, _inherits2.default)(TableCompiler_SQLite3, _tablecompiler2.default);

// Create a new table.
TableCompiler_SQLite3.prototype.createQuery = function (columns, ifNot) {
  var createStatement = ifNot ? 'create table if not exists ' : 'create table ';
  var sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ');

  // SQLite forces primary keys to be added when the table is initially created
  // so we will need to check for a primary key commands and add the columns
  // to the table's declaration here so they can be created on the tables.
  sql += this.foreignKeys() || '';
  sql += this.primaryKeys() || '';
  sql += ')';

  this.pushQuery(sql);
};

TableCompiler_SQLite3.prototype.addColumns = function (columns) {
  for (var i = 0, l = columns.sql.length; i < l; i++) {
    this.pushQuery({
      sql: 'alter table ' + this.tableName() + ' add column ' + columns.sql[i],
      bindings: columns.bindings[i]
    });
  }
};

// Compile a drop unique key command.
TableCompiler_SQLite3.prototype.dropUnique = function (columns, indexName) {
  indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
  this.pushQuery('drop index ' + indexName);
};

TableCompiler_SQLite3.prototype.dropIndex = function (columns, indexName) {
  indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('drop index ' + indexName);
};

// Compile a unique key command.
TableCompiler_SQLite3.prototype.unique = function (columns, indexName) {
  indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
  columns = this.formatter.columnize(columns);
  this.pushQuery('create unique index ' + indexName + ' on ' + this.tableName() + ' (' + columns + ')');
};

// Compile a plain index key command.
TableCompiler_SQLite3.prototype.index = function (columns, indexName) {
  indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
  columns = this.formatter.columnize(columns);
  this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + ' (' + columns + ')');
};

TableCompiler_SQLite3.prototype.primary = TableCompiler_SQLite3.prototype.foreign = function () {
  if (this.method !== 'create' && this.method !== 'createIfNot') {
    helpers.warn('SQLite3 Foreign & Primary keys may only be added on create');
  }
};

TableCompiler_SQLite3.prototype.primaryKeys = function () {
  var pks = (0, _filter3.default)(this.grouped.alterTable || [], { method: 'primary' });
  if (pks.length > 0 && pks[0].args.length > 0) {
    var args = Array.isArray(pks[0].args[0]) ? pks[0].args[0] : pks[0].args;
    return ', primary key (' + this.formatter.columnize(args) + ')';
  }
};

TableCompiler_SQLite3.prototype.foreignKeys = function () {
  var sql = '';
  var foreignKeys = (0, _filter3.default)(this.grouped.alterTable || [], { method: 'foreign' });
  for (var i = 0, l = foreignKeys.length; i < l; i++) {
    var foreign = foreignKeys[i].args[0];
    var column = this.formatter.columnize(foreign.column);
    var references = this.formatter.columnize(foreign.references);
    var foreignTable = this.formatter.wrap(foreign.inTable);
    sql += ', foreign key(' + column + ') references ' + foreignTable + '(' + references + ')';
    if (foreign.onDelete) sql += ' on delete ' + foreign.onDelete;
    if (foreign.onUpdate) sql += ' on update ' + foreign.onUpdate;
  }
  return sql;
};

TableCompiler_SQLite3.prototype.createTableBlock = function () {
  return this.getColumns().concat().join(',');
};

// Compile a rename column command... very complex in sqlite
TableCompiler_SQLite3.prototype.renameColumn = function (from, to) {
  var compiler = this;
  this.pushQuery({
    sql: 'PRAGMA table_info(' + this.tableName() + ')',
    output: function output(pragma) {
      return compiler.client.ddl(compiler, pragma, this.connection).renameColumn(from, to);
    }
  });
};

TableCompiler_SQLite3.prototype.dropColumn = function (column) {
  var compiler = this;
  this.pushQuery({
    sql: 'PRAGMA table_info(' + this.tableName() + ')',
    output: function output(pragma) {
      return compiler.client.ddl(compiler, pragma, this.connection).dropColumn(column);
    }
  });
};

exports.default = TableCompiler_SQLite3;
module.exports = exports['default'];