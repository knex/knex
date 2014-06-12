// Table Compiler
// -------
var _ = require('lodash');

var helpers = require('../helpers');

function TableCompiler(tableBuilder) {
  this.method         = tableBuilder._method;
  this.tableNameRaw   = tableBuilder._tableName;
  this.single         = tableBuilder._single;
  this.grouped        = _.groupBy(tableBuilder._statements, 'grouping');
  this.initCompiler();
}

// Convert the tableCompiler toSQL
TableCompiler.prototype.toSQL = function() {
  this[this.method]();
  return this.sequence;
};

// Column Compilation
// -------

// If this is a table "creation", we need to first run through all
// of the columns to build them into a single string,
// and then run through anything else and push it to the query sequence.
TableCompiler.prototype.create = function() {
  var columns = this.getColumns();
  var columnTypes = this.getColumnTypes(columns);
  this.createQuery(columnTypes);
  this.columnQueries(columns);
  delete this.single.comment;
  this.alterTable();
};

// If we're altering the table, we need to one-by-one
// go through and handle each of the queries associated
// with altering the table's schema.
TableCompiler.prototype.alter = function() {
  var columns = this.getColumns();
  var columnTypes = this.getColumnTypes(columns);
  this.addColumns(columnTypes);
  this.columnQueries(columns);
  this.alterTable();
};

TableCompiler.prototype.foreign = function(foreignData) {
  if (foreignData.inTable && foreignData.references) {
    var keyName    = this._indexCommand('foreign', this.tableNameRaw, foreignData.column);
    var column     = this.formatter.columnize(foreignData.column);
    var references = this.formatter.columnize(foreignData.references);
    var inTable    = this.formatter.wrap(foreignData.inTable);
    var onUpdate   = foreignData.onUpdate ? ' on update ' + foreignData.onUpdate : '';
    var onDelete   = foreignData.onDelete ? ' on delete ' + foreignData.onDelete : '';
    this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + keyName + ' ' +
      'foreign key (' + column + ') references ' + inTable + ' (' + references + ')' + onUpdate + onDelete);
  }
};

// Get all of the column sql & bindings individually for building the table queries.
TableCompiler.prototype.getColumnTypes = function(columns) {
  return _.reduce(_.map(columns, _.first), function(memo, column) {
    memo.sql.push(column.sql);
    memo.bindings.concat(column.bindings);
    return memo;
  }, {sql: [], bindings: []});
};

// Adds all of the additional queries from the "column"
TableCompiler.prototype.columnQueries = function(columns) {
  var queries = _.reduce(_.map(columns, _.rest), function(memo, column) {
    if (!_.isEmpty(column)) return memo.concat(column);
    return memo;
  }, []);
  for (var i = 0, l = queries.length; i < l; i++) {
    this.pushQuery(queries[i]);
  }
};

// Add a new column.
TableCompiler.prototype.addColumnsPrefix = 'add column ';

// All of the columns to "add" for the query
TableCompiler.prototype.addColumns = function(columns) {
  if (columns.sql.length > 0) {
    var columnSql = _.map(columns.sql, function(column) {
      return this.addColumnsPrefix + column;
    }, this);
    this.pushQuery({
      sql: 'alter table ' + this.tableName() + ' ' + columnSql.join(', '),
      bindings: columns.bindings
    });
  }
};

// Compile the columns as needed for the current create or alter table
TableCompiler.prototype.getColumns = function() {
  var compiledColumns = [], columns = this.grouped.columns || [];
  var ColumnCompiler = this.client.ColumnCompiler;
  for (var i = 0, l = columns.length; i < l; i++) {
    compiledColumns.push(new ColumnCompiler(this, columns[i].builder).toSQL());
  }
  return compiledColumns;
};

TableCompiler.prototype.tableName = function() {
  return this.formatter.wrap(this.tableNameRaw);
};

// Generate all of the alter column statements necessary for the query.
TableCompiler.prototype.alterTable = function() {
  var alterTable = this.grouped.alterTable || [];
  for (var i = 0, l = alterTable.length; i < l; i++) {
    var statement = alterTable[i];
    if (this[statement.method]) {
      this[statement.method].apply(this, statement.args);
    } else {
      console.error('Debug: ' + statement.method + ' does not exist');
    }
  }
  for (var item in this.single) {
    if (_.isFunction(this[item])) this[item](this.single[item]);
  }
};

// Drop the index on the current table.
TableCompiler.prototype.dropIndex = function(value) {
  this.pushQuery('drop index' + value);
};

// Drop the unique
TableCompiler.prototype.dropUnique =
TableCompiler.prototype.dropForeign = function() {
  throw new Error('Method implemented in the dialect driver');
};

TableCompiler.prototype.dropColumnPrefix = 'drop column ';
TableCompiler.prototype.dropColumn = function() {
  var columns = helpers.normalizeArr.apply(null, arguments);
  var drops = _.map(_.isArray(columns) ? columns : [columns], function(column) {
    return this.dropColumnPrefix + this.formatter.wrap(column);
  }, this);
  this.pushQuery('alter table ' + this.tableName() + ' ' + drops.join(', '));
};

// If no name was specified for this index, we will create one using a basic
// convention of the table name, followed by the columns, followed by an
// index type, such as primary or index, which makes the index unique.
TableCompiler.prototype._indexCommand = function(type, tableName, columns) {
  if (!_.isArray(columns)) columns = columns ? [columns] : [];
  var table = tableName.replace(/\.|-/g, '_');
  return (table + '_' + columns.join('_') + '_' + type).toLowerCase();
};

module.exports = TableCompiler;