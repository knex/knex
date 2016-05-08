
// Table Compiler
// -------
var helpers = require('./helpers');
var normalizeArr = require('../helpers').normalizeArr
import {groupBy, reduce, map, first, tail, isEmpty, indexOf, isArray} from 'lodash'

function TableCompiler(client, tableBuilder) {
  this.client = client
  this.method = tableBuilder._method;
  this.schemaNameRaw = tableBuilder._schemaName;
  this.tableNameRaw = tableBuilder._tableName;
  this.single = tableBuilder._single;
  this.grouped = groupBy(tableBuilder._statements, 'grouping');
  this.formatter = client.formatter();
  this.sequence = [];
  this._formatting = client.config && client.config.formatting
}

TableCompiler.prototype.alterColumnPrefix = 'modify column';

TableCompiler.prototype.pushQuery = helpers.pushQuery

TableCompiler.prototype.pushAdditional = helpers.pushAdditional

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
      this.pushQuery((!this.forCreate ? 'alter table ' + this.tableName() + ' add ' : '') + 'constraint ' + keyName + ' ' +
        'foreign key (' + column + ') references ' + inTable + ' (' + references + ')' + onUpdate + onDelete);
    } else {
      this.pushQuery((!this.forCreate ? 'ALTER TABLE ' + this.tableName() + ' ADD ' : '') + 'CONSTRAINT ' + keyName + ' ' +
        'FOREIGN KEY (' + column + ') REFERENCES ' + inTable + ' (' + references + ')' + onUpdate + onDelete);
    }
  }
};

// Get all of the column sql & bindings individually for building the table queries.
TableCompiler.prototype.getColumnTypes = function (columns) {
  return reduce(map(columns, first), function (memo, column) {
    memo.sql.push(column.sql);
    memo.bindings.concat(column.bindings);
    return memo;
  }, { sql: [], bindings: [] });
};

// Adds all of the additional queries from the "column"
TableCompiler.prototype.columnQueries = function (columns) {
  var queries = reduce(map(columns, tail), function (memo, column) {
    if (!isEmpty(column)) return memo.concat(column);
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
  if (columns.sql.length > 0) {
    var columnSql = map(columns.sql, (column) => {
      return this.addColumnsPrefix + column;
    });
    this.pushQuery({
      sql: (this.lowerCase ? 'alter table ' : 'ALTER TABLE ') + this.tableName() + ' ' + columnSql.join(', '),
      bindings: columns.bindings
    });
  }
};

// Compile the columns as needed for the current create or alter table
TableCompiler.prototype.getColumns = function () {
  var i = -1, compiledColumns = [], columns = this.grouped.columns || [];
  while (++i < columns.length) {
    compiledColumns.push(this.client.columnCompiler(this, columns[i].builder).toSQL())
  }
  return compiledColumns;
};

TableCompiler.prototype.tableName = function () {
  var name = this.schemaNameRaw ?
    `${this.schemaNameRaw}.${this.tableNameRaw}`
    : this.tableNameRaw;

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
      console.error('Debug: ' + statement.method + ' does not exist');
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
    if (indexOf(this.createAlterTableMethods, statement.method) < 0) {
      this.grouped.alterTable.push(statement);
      continue;
    }
    if (this[statement.method]) {
      this.sequence = [];
      this[statement.method].apply(this, statement.args);
      columnTypes.sql.push(this.sequence[0].sql);
    } else {
      console.error('Debug: ' + statement.method + ' does not exist');
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
TableCompiler.prototype.dropUnique =
TableCompiler.prototype.dropForeign = function () {
  throw new Error('Method implemented in the dialect driver');
};

TableCompiler.prototype.dropColumnPrefix = 'drop column ';
TableCompiler.prototype.dropColumn = function () {
  var columns = normalizeArr.apply(null, arguments);
  var drops = map(isArray(columns) ? columns : [columns], (column) => {
    return this.dropColumnPrefix + this.formatter.wrap(column);
  });
  this.pushQuery((this.lowerCase ? 'alter table ' : 'ALTER TABLE ') + this.tableName() + ' ' + drops.join(', '));
};

// If no name was specified for this index, we will create one using a basic
// convention of the table name, followed by the columns, followed by an
// index type, such as primary or index, which makes the index unique.
TableCompiler.prototype._indexCommand = function (type, tableName, columns) {
  if (!isArray(columns)) columns = columns ? [columns] : [];
  var table = tableName.replace(/\.|-/g, '_');
  var indexName = (table + '_' + columns.join('_') + '_' + type).toLowerCase();
  return this.formatter.wrap(indexName);
};


//Default implementation of setNullable. Overwrite on dialect-specific tablecompiler when needed
//(See postgres/mssql for reference)
TableCompiler.prototype._setNullableState = function(column, nullable) {
  let tableName = this.tableName();
  let columnName = this.formatter.columnize(column);
  let alterColumnPrefix = this.alterColumnPrefix;
  return this.pushQuery({
    sql: 'SELECT 1',
    output: () => {
      return this.client.queryBuilder().from(this.tableNameRaw).columnInfo(column)
        .then((columnInfo) => {
          if(isEmpty(columnInfo)) {
            throw new Error(`.setNullable: Column ${columnName} does not exist in table ${tableName}.`)
          }
          let nullableType = nullable ? 'null' : 'not null';
          let columnType = columnInfo.type + (columnInfo.maxLength ? `(${columnInfo.maxLength})` : '');
          let defaultValue = (columnInfo.defaultValue !== null && columnInfo.defaultValue !== void 0) ? `default '${columnInfo.defaultValue}'` : '';
          let sql = `alter table ${tableName} ${alterColumnPrefix} ${columnName} ${columnType} ${nullableType} ${defaultValue}`;
          return this.client.raw(sql);
        });
    }
  });
};


TableCompiler.prototype.setNullable = function(column) {
  return this._setNullableState(column, true);
};

TableCompiler.prototype.dropNullable = function(column) {
  return this._setNullableState(column, false);
};

module.exports = TableCompiler;
