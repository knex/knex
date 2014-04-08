module.exports = function(client) {

var _             = require('lodash');
var inherits      = require('inherits');

var Promise       = require('../../promise');

var SchemaBuilder  = require('../../schema/builder');
var SchemaCompiler = require('../../schema/compiler');

var TableBuilder   = require('../../schema/tablebuilder');
var TableCompiler  = require('../../schema/tablecompiler');

var ColumnBuilder  = require('../../schema/columnbuilder');
var ColumnCompiler = require('../../schema/columncompiler');

function SchemaBuilder_PG() {
  SchemaBuilder.apply(this, arguments);
}

// TODO: Regex this in the schema's runner.
// if (parseFloat(client.version) >= 9.2)

SchemaBuilder_PG.prototype.toSql = function() {
  for (var i = 0, l = this.sequence.length; i < l; i++) {
    new SchemaCompiler();
  }
};

function SchemaCompiler_PG() {
  this.Formatter = client.Formatter;
  SchemaCompiler.apply(this, arguments);
}

// Check whether the current table
SchemaCompiler_PG.prototype.hasTable = function(tableName) {
  this.push({
    sql: 'select * from information_schema.tables where table_name = ' + this.formatter.parameter(tableName),
    output: function(resp) {
      return resp.rows.length > 0;
    }
  });
};

// Compile the query to determine if a column exists in a table.
SchemaCompiler_PG.prototype.hasColumn = function(tableName, columnName) {
  this.push({
    sql: 'select * from information_schema.columns where table_name = ' +
      this.formatter.parameter(tableName) + ' and column_name = ' + this.formatter.parameter(columnName),
    output: function(resp) {
      return resp.rows.length > 0;
    }
  });
};

// Compile a rename table command.
SchemaCompiler_PG.prototype.renameTable = function(from, to) {
  this.push('alter table ' + this.formatter.wrap(from) + ' rename to ' + this.formatter.wrap(to));
};

function TableCompiler_PG() {
  this.modifiers = ['nullable', 'defaultTo', 'comment'];
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_PG, TableCompiler);

// Compile a rename column command.
TableCompiler.prototype.renameColumn = function(from, to) {
  return {
    sql: 'alter table ' + this.tableName + ' rename '+ this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
  };
};

TableCompiler.prototype.compileAdd = function(builder) {
  var table = this.formatter.wrap(builder);
  var columns = this.prefixArray('add column', this.getColumns(builder));
  return {
    sql: 'alter table ' + table + ' ' + columns.join(', ')
  };
};

TableCompiler.prototype.create = function() {
  this.push('create table ' + this.tableName() + ' (' + this.getColumns().join(', ') + ')');
  this.alterColumns();
  this.addIndexes();
  var hasComment = _.has(this._single, 'comment');
  if (hasComment) {
    this.push({sql: 'comment on table ' + this.tableName() + ' is ' + "'" + this.attributes.comment + "'"});
  }
};

function ColumnCompiler_PG() {
  ColumnCompiler.apply(this, arguments);
}
inherits(ColumnCompiler_PG, ColumnCompiler);

ColumnCompiler_PG.prototype.bigincrements = 'bigserial primary key',

ColumnCompiler_PG.prototype.bigint = 'bigint',

ColumnCompiler_PG.prototype.binary = 'bytea',

ColumnCompiler_PG.prototype.bit = function(column) {
  return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
};

ColumnCompiler_PG.prototype.bool = 'boolean',

ColumnCompiler_PG.prototype.datetime = 'timestamp',

// Create the column definition for an enum type.
// Using method "2" here: http://stackoverflow.com/a/10984951/525714
ColumnCompiler_PG.prototype.enu = function(allowed) {
  var column = this.currentColumn;
  return 'text check (' + column.args[0] + " in ('" + allowed.join("', '")  + "'))";
};

ColumnCompiler_PG.prototype.double = 'double precision',

ColumnCompiler_PG.prototype.floating = 'real',

ColumnCompiler_PG.prototype.increments = 'serial primary key',

ColumnCompiler_PG.prototype.json = 'json';

ColumnCompiler_PG.prototype.smallint =
ColumnCompiler_PG.prototype.tinyint = 'smallint';

ColumnCompiler_PG.prototype.timestamp = 'timestamp';

ColumnCompiler_PG.prototype.uuid = 'uuid';

ColumnCompiler_PG.prototype.comment = function(comment) {
  this.returnSql.push({
    sql: 'comment on column ' + this.tableName + '.' + this.formatter.wrap(this.currentColumn.args[0]) + " is " + (comment ? "'" + comment + "'" : 'NULL')
  });
};


primary = function(columns) {
  return {
    sql: 'alter table ' + this.tableName + " add primary key (" + this.formatter.columnize(columns) + ")"
  };
},

unique = function(columns, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
  return {
    sql: 'alter table ' + this.tableName + ' add constraint ' + indexName + ' unique (' + this.formatter.columnize(columns) + ')'
  };
},

index = function(columns, indexName) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  return {
    sql: 'create index ' + indexName + ' on ' + this.tableName + ' (' + this.formatter.columnize(columns) + ')'
  };
},

dropColumn = function(builder, command) {
  var table   = this.tableName;
  var columns = _.map(command.columns, function(col) {
    return 'drop column' + this.formatter.wrap(col);
  }, this);
  return {
    sql: 'alter table ' + this.tableName + ' ' + columns.join(', ')
  };
},

dropIndex = function(index) {
  return {
    sql: 'drop index ' + index
  };
},

dropUnique = function(index) {
  return {
    sql: 'alter table ' + this.tableName + ' drop constraint ' + index
  };
},

dropForeign = function(index) {
  return {
    sql: 'alter table ' + this.tableName + ' drop constraint ' + index
  };
},

dropPrimary = function(builder) {
  return {
    sql: 'alter table ' + this.tableName + " drop constraint " + this.tableNameRaw + "_pkey"
  };
},

// Compile a foreign key command.
foreign = function(foreignData) {
  var sql = '';
  if (foreignData.inTable && foreignData.references) {
    var keyName    = this._indexCommand('foreign', this.tableNameRaw, foreignData.column);
    var column     = this.formatter.columnize(foreignData.column);
    var references = this.formatter.columnize(foreignData.references);
    var inTable    = this.formatter.wrap(foreignData.inTable);

    sql = 'alter table ' + this.tableName + ' add constraint ' + keyName + ' ';
    sql += 'foreign key (' + column + ') references ' + inTable + ' (' + references + ')';
  }
  return {
    sql: sql
  };
}

};

return PGKeys;

};

};