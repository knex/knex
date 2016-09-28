'use strict';

exports.__esModule = true;

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _indexOf2 = require('lodash/indexOf');

var _indexOf3 = _interopRequireDefault(_indexOf2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _tail2 = require('lodash/tail');

var _tail3 = _interopRequireDefault(_tail2);

var _first2 = require('lodash/first');

var _first3 = _interopRequireDefault(_first2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _reduce2 = require('lodash/reduce');

var _reduce3 = _interopRequireDefault(_reduce2);

var _groupBy2 = require('lodash/groupBy');

var _groupBy3 = _interopRequireDefault(_groupBy2);

var _helpers = require('./helpers');

var _helpers2 = require('../helpers');

var helpers = _interopRequireWildcard(_helpers2);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint max-len:0 */

// Table Compiler
// -------
function TableCompiler(client, tableBuilder) {
  this.client = client;
  this.method = tableBuilder._method;
  this.schemaNameRaw = tableBuilder._schemaName;
  this.tableNameRaw = tableBuilder._tableName;
  this.single = tableBuilder._single;
  this.grouped = (0, _groupBy3.default)(tableBuilder._statements, 'grouping');
  this.formatter = client.formatter();
  this.sequence = [];
  this._formatting = client.config && client.config.formatting;
}

TableCompiler.prototype.pushQuery = _helpers.pushQuery;

TableCompiler.prototype.pushAdditional = _helpers.pushAdditional;

// Convert the tableCompiler toSQL
TableCompiler.prototype.toSQL = function () {
  this[this.method]();
  return this.sequence;
};

TableCompiler.prototype.lowerCase = true;

// Column Compilation
// -------

// If this is a table "creation", we need to first run through all
// of the columns to build them into a single string,
// and then run through anything else and push it to the query sequence.
TableCompiler.prototype.createAlterTableMethods = null;
TableCompiler.prototype.create = function (ifNot) {
  var columns = this.getColumns();
  var columnTypes = this.getColumnTypes(columns);
  if (this.createAlterTableMethods) {
    this.alterTableForCreate(columnTypes);
  }
  this.createQuery(columnTypes, ifNot);
  this.columnQueries(columns);
  delete this.single.comment;
  this.alterTable();
};

// Only create the table if it doesn't exist.
TableCompiler.prototype.createIfNot = function () {
  this.create(true);
};

// If we're altering the table, we need to one-by-one
// go through and handle each of the queries associated
// with altering the table's schema.
TableCompiler.prototype.alter = function () {
  var columns = this.getColumns();
  var columnTypes = this.getColumnTypes(columns);
  this.addColumns(columnTypes);
  this.columnQueries(columns);
  this.alterTable();
};

TableCompiler.prototype.foreign = function (foreignData) {
  if (foreignData.inTable && foreignData.references) {
    var keyName = this._indexCommand('foreign', this.tableNameRaw, foreignData.column);
    var column = this.formatter.columnize(foreignData.column);
    var references = this.formatter.columnize(foreignData.references);
    var inTable = this.formatter.wrap(foreignData.inTable);
    var onUpdate = foreignData.onUpdate ? (this.lowerCase ? ' on update ' : ' ON UPDATE ') + foreignData.onUpdate : '';
    var onDelete = foreignData.onDelete ? (this.lowerCase ? ' on delete ' : ' ON DELETE ') + foreignData.onDelete : '';
    if (this.lowerCase) {
      this.pushQuery((!this.forCreate ? 'alter table ' + this.tableName() + ' add ' : '') + 'constraint ' + keyName + ' ' + 'foreign key (' + column + ') references ' + inTable + ' (' + references + ')' + onUpdate + onDelete);
    } else {
      this.pushQuery((!this.forCreate ? 'ALTER TABLE ' + this.tableName() + ' ADD ' : '') + 'CONSTRAINT ' + keyName + ' ' + 'FOREIGN KEY (' + column + ') REFERENCES ' + inTable + ' (' + references + ')' + onUpdate + onDelete);
    }
  }
};

// Get all of the column sql & bindings individually for building the table queries.
TableCompiler.prototype.getColumnTypes = function (columns) {
  return (0, _reduce3.default)((0, _map3.default)(columns, _first3.default), function (memo, column) {
    memo.sql.push(column.sql);
    memo.bindings.concat(column.bindings);
    return memo;
  }, { sql: [], bindings: [] });
};

// Adds all of the additional queries from the "column"
TableCompiler.prototype.columnQueries = function (columns) {
  var queries = (0, _reduce3.default)((0, _map3.default)(columns, _tail3.default), function (memo, column) {
    if (!(0, _isEmpty3.default)(column)) return memo.concat(column);
    return memo;
  }, []);
  for (var i = 0, l = queries.length; i < l; i++) {
    this.pushQuery(queries[i]);
  }
};

// Add a new column.
TableCompiler.prototype.addColumnsPrefix = 'add column ';

// All of the columns to "add" for the query
TableCompiler.prototype.addColumns = function (columns) {
  var _this = this;

  if (columns.sql.length > 0) {
    var columnSql = (0, _map3.default)(columns.sql, function (column) {
      return _this.addColumnsPrefix + column;
    });
    this.pushQuery({
      sql: (this.lowerCase ? 'alter table ' : 'ALTER TABLE ') + this.tableName() + ' ' + columnSql.join(', '),
      bindings: columns.bindings
    });
  }
};

// Compile the columns as needed for the current create or alter table
TableCompiler.prototype.getColumns = function () {
  var _this2 = this;

  var columns = this.grouped.columns || [];
  return columns.map(function (column) {
    return _this2.client.columnCompiler(_this2, column.builder).toSQL();
  });
};

TableCompiler.prototype.tableName = function () {
  var name = this.schemaNameRaw ? this.schemaNameRaw + '.' + this.tableNameRaw : this.tableNameRaw;

  return this.formatter.wrap(name);
};

// Generate all of the alter column statements necessary for the query.
TableCompiler.prototype.alterTable = function () {
  var alterTable = this.grouped.alterTable || [];
  for (var i = 0, l = alterTable.length; i < l; i++) {
    var statement = alterTable[i];
    if (this[statement.method]) {
      this[statement.method].apply(this, statement.args);
    } else {
      helpers.error('Debug: ' + statement.method + ' does not exist');
    }
  }
  for (var item in this.single) {
    if (typeof this[item] === 'function') this[item](this.single[item]);
  }
};

TableCompiler.prototype.alterTableForCreate = function (columnTypes) {
  this.forCreate = true;
  var savedSequence = this.sequence;
  var alterTable = this.grouped.alterTable || [];
  this.grouped.alterTable = [];
  for (var i = 0, l = alterTable.length; i < l; i++) {
    var statement = alterTable[i];
    if ((0, _indexOf3.default)(this.createAlterTableMethods, statement.method) < 0) {
      this.grouped.alterTable.push(statement);
      continue;
    }
    if (this[statement.method]) {
      this.sequence = [];
      this[statement.method].apply(this, statement.args);
      columnTypes.sql.push(this.sequence[0].sql);
    } else {
      helpers.error('Debug: ' + statement.method + ' does not exist');
    }
  }
  this.sequence = savedSequence;
  this.forCreate = false;
};

// Drop the index on the current table.
TableCompiler.prototype.dropIndex = function (value) {
  this.pushQuery('drop index' + value);
};

// Drop the unique
TableCompiler.prototype.dropUnique = TableCompiler.prototype.dropForeign = function () {
  throw new Error('Method implemented in the dialect driver');
};

TableCompiler.prototype.dropColumnPrefix = 'drop column ';
TableCompiler.prototype.dropColumn = function () {
  var _this3 = this;

  var columns = helpers.normalizeArr.apply(null, arguments);
  var drops = (0, _map3.default)((0, _isArray3.default)(columns) ? columns : [columns], function (column) {
    return _this3.dropColumnPrefix + _this3.formatter.wrap(column);
  });
  this.pushQuery((this.lowerCase ? 'alter table ' : 'ALTER TABLE ') + this.tableName() + ' ' + drops.join(', '));
};

// If no name was specified for this index, we will create one using a basic
// convention of the table name, followed by the columns, followed by an
// index type, such as primary or index, which makes the index unique.
TableCompiler.prototype._indexCommand = function (type, tableName, columns) {
  if (!(0, _isArray3.default)(columns)) columns = columns ? [columns] : [];
  var table = tableName.replace(/\.|-/g, '_');
  var indexName = (table + '_' + columns.join('_') + '_' + type).toLowerCase();
  return this.formatter.wrap(indexName);
};

exports.default = TableCompiler;
module.exports = exports['default'];