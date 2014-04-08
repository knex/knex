// Table Compiler
// -------
var _ = require('lodash');

var Raw         = require('../raw');
var util        = require('../util');

function TableCompiler(schemaCompiler, tableBuilder) {
  this.schemaCompiler = schemaCompiler;
  this.formatter      = schemaCompiler.formatter;

  this.tableBuilder   = tableBuilder;
  this.tableNameRaw   = tableBuilder.tableName;

  this.grouped        = _.groupBy(schemaCompiler._statements, 'grouping');
  this.single         = schemaCompiler._single;
}

// Push onto the schemaCompiler's stack of queries
TableCompiler.prototype.push = function(obj) {
  this.schemaCompiler.push(obj);
  this.formatter = this.schemaCompiler.formatter;
  return this;
};

TableCompiler.prototype.create = function() {
  this.push('create table ' + this.tableName() + ' (' + this.getColumns().join(', ') + ')');
  this.alterColumns();
  this.addIndexes();
};

TableCompiler.prototype.alter = function() {
  this.addColumns();
  this.alterColumns();
  this.addIndexes();
};

TableCompiler.prototype.tableName = function() {
  return this.formatter.wrap(this.tableNameRaw);
};

TableCompiler.prototype.addColumnsPrefix = 'add column ';

// All of the columns to "add" for the query
TableCompiler.prototype.addColumns = function() {
  var columns = this.getColumns();
  if (columns.length > 0) {
    columns = _.map(columns, function(column) {
      return this.addColumnsPrefix + column;
    }, this);
    this.push('alter table ' + this.tableName() + ' ' + columns.join(', '));
  }
};

// Generate all of the alter column statements necessary for the query.
TableCompiler.prototype.alterColumns = function() {
  var alterColumns = _.where(this.statements, {type: 'alterColumns'});
  for (var i = 0, l = alterColumns.length; i < l; i++) {
    var statement = alterColumns[i];
    this.push(this[statement.method].apply(this, statement.args));
  }
};

// Add indexes on the statements.
TableCompiler.prototype.addIndexes = function() {
  var indexStatements = _.where(this.statements, {type: 'indexes'});
  for (var i = 0, l = indexStatements.length; i < l; i++) {
    var statement = indexStatements[i];
    var obj = this.keys[statement.method].apply(this, statement.args);
    if (obj) this.push(obj);
  }
};

// Compile the columns as needed for the current create or alter table
TableCompiler.prototype.getColumns = function() {
  var compiledColumns = [], columns = this.columns;
  for (var i = 0, l = columns.length; i < l; i++) {
    compiledColumns.push(this.compileColumn(columns[i]));
  }
  return compiledColumns;
};

TableCompiler.prototype.compileColumn = function(column) {
  return this.formatter.wrap(this.getColumnName(column)) + ' ' + this.getColumnType(column) + this.getModifiers(column);
};

TableCompiler.prototype.getColumnType = function(column) {
  var type = this.types[column.method];
  return _.isFunction(type) ? type.apply(this, _.rest(column.args)) : type;
};

TableCompiler.prototype.getModifiers = function(column) {
  var modifiers = [];
  if (column.method !== 'timestamps' && column.method.indexOf('increments') === -1) {
    var modifierTypes = this.modifierTypes;
    var statements = column.chainable.__modifiers;
    for (var i = 0, l = modifierTypes.length; i < l; i++) {
      var modifier = modifierTypes[i];
      var statement = statements[modifier];
      if (statement) {
        var val = this.modifiers[modifier].apply(this, statement);
        if (val) modifiers.push(val);
      }
    }
  }
  return modifiers.length > 0 ? ' ' + modifiers.join(' ') : '';
};

  // Assumes that the autoincrementing key is named `id` if not otherwise specified.
TableCompiler.prototype.getColumnName = function(column) {
  var value = _.first(column.args);
  if (value) return value;
  if (column.method === 'timestamps') return '';
  if (column.method.indexOf('increments') !== -1) {
    return 'id';
  } else {
    throw new Error('You did not specify a column name for the ' + column.originalMethod + 'column on ' + this.tableName());
  }
};

TableCompiler.prototype.dropUnique = function(value) {
  this.push('drop index ' + value);
};

// dropColumnPrefix: 'drop column ',

TableCompiler.prototype.dropColumn = function() {
  var columns = util.normalizeArr.apply(null, arguments);
  var drops = _.map(_.isArray(columns) ? columns : [columns], function(column) {
    return this.dropColumnPrefix + this.formatter.wrap(column);
  }, this);
  this.push('alter table ' + this.tableName() + ' ' + drops.join(', '));
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