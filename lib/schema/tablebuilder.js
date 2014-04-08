// TableBuilder

// Takes the function passed to the "createTable" or "table/editTable"
// functions and calls it with the "TableBuilder" as both the context and
// the first argument. Inside this function we can specify what happens to the
// method, pushing everything we want to do onto the "allStatements" array,
// which is then compiled into sql.
// -------
var _ = require('lodash');

function TableBuilder(tableName) {
  this._tableName  = tableName;
  this._statements = [];
  this._single     = {};
}

// Compile the "alter" query for the table.
// We attach any "alter" methods to the object
// before invoking the function, so as to
TableBuilder.prototype._alter = function(fn) {
  this._method = 'alter';
  _.extend(this, AlterMethods);
  fn.call(this, this);
  return this;
};

// Compile the "create" query for the table.
TableBuilder.prototype._create = function(fn) {
  this._method = 'create';
  fn.call(this, this);
  return this;
};

var AlterMethods = {

  // Renames the current column `from` the current
  // TODO: this.column(from).rename(to)
  renameColumn: function(from, to) {
    this._statements.push({
      grouping: 'alterColumns',
      type: 'renameColumn',
      args: [from, to]
    });
    return this;
  },

  dropTimestamps: function() {
    return this.dropColumns(['created_at', 'updated_at']);
  }

  // TODO: changeType
};

// Drop a column from the current table.
// TODO: Enable this.column(columnName).drop();
AlterMethods.dropColumn =
AlterMethods.dropColumns = function() {
  this._statements.push({
    grouping: 'alterColumns',
    type: 'dropColumn',
    args: Helpers.normalizeArr.apply(null, arguments)
  });
  return this;
};

_.each(['dropPrimary', 'dropUnique', 'dropIndex', 'dropForeign'], function(method) {
  AlterMethods[method] = function() {
    this._statements.push({
      grouping: 'indexes',
      type: method,
      args: _.toArray(arguments)
    });
    return this;
  };
});

// Warn if we're not in MySQL, since that's the only time these
// three are supported.
var specialMethods = ['engine', 'charset', 'collate'];
_.each(specialMethods, function(method) {
  if (false) {
    warn('Knex only supports ' + method + ' statement with mysql.');
  } if (this.__method === 'alter') {
    warn('Knex does not support altering the ' + method + ' outside of the create table, please use knex.raw statement.');
  }
  this._single[method] = value;
});

// For each of the column types that we can add, we just push it onto the "allStatements"
// stack and then return the appropriate chainable interface for the column.
var columnMethods = [

  // Numeric
  'tinyint',
  'smallint',
  'mediumint',
  'int',
  'bigint',
  'decimal',
  'float',
  'double',
  'real',
  'bit',
  'boolean',
  'serial',

  // Date / Time
  'date',
  'datetime',
  'timestamp',
  'time',
  'year',

  // String
  'char',
  'varchar',
  'tinytext',
  'tinyText',
  'text',
  'mediumtext',
  'mediumText',
  'longtext',
  'longText',
  'binary',
  'varbinary',
  'tinyblob',
  'tinyBlob',
  'mediumblob',
  'mediumBlob',
  'blob',
  'longblob',
  'longBlob',
  'enum',
  'set',

  // Increments, Aliases, and Additional
  'bool',
  'dateTime',
  'increments',
  'bigincrements',
  'bigIncrements',
  'integer',
  'biginteger',
  'bigInteger',
  'string',
  'timestamps',
  'json',
  'uuid',
  'enu',
  'specificType'
];

// "SPATIAL"
//   geometry
//   point
//   linestring
//   polygon
//   multipoint
//   multilinestring
//   multipolygon
//   geometrycollection

/*
// SQLITE3 Definitions:

// type: integer (1)
  int
  integer
  tinyint
  smallint
  mediumint
  bigint
  unsigned BIG INT
  int2
  int8

// type: text (2)
  character(20)
  varchar(255)
  varying CHARACTER(255)
  nchar(55)
  native CHARACTER(70)
  nvarchar(100)
  text
  clob

// type: no datatype specified (none)  (3)
  blob

// type: float / real  (4)
  real
  double
  double precision

// type numeric (5)
  numeric
  decimal(10,5)
  boolean
  date
  datetime
*/

// Alias a few methods for clarity when processing.
var aliasColumn = {
  'float'  : 'floating',
  'enum'   : 'enu',
  'boolean': 'bool',
  'string' : 'varchar',
  'bigint' : 'bigInteger'
};

// For each of the column methods, create a new "ColumnBuilder" interface,
// push it onto the "allStatements" stack, and then return the interface,
// with which we can add indexes, etc.
_.each(columnMethods, function(method) {
  TableBuilder.prototype[method] = function() {
    var args = _.toArray(arguments);

    // The "timestamps" call is really a compound call to set the
    // `created_at` and `updated_at` columns.
    if (method === 'timestamps') {
      if (args[0] === true) {
        this.timestamp('created_at');
        this.timestamp('updated_at');
      } else {
        this.datetime('created_at');
        this.datetime('updated_at');
      }
      return;
    }

    var aliased = (aliasColumn[method] || method).toLowerCase();
    var chainable = new ColumnBuilder(this, args[0]).type(aliased);

    this._statements.push({
      grouping: 'column',
      method: aliased,
      originalMethod: method,
      args: args,
      builder: builder
    });
    return chainable;
  };

});

// Each of the index methods can be called individually, with the
// column name to be used, e.g. table.unique('column').
var indexMethods = ['index', 'primary', 'unique'];

_.each(indexMethods, function(method) {
  TableBuilder.prototype[method] = function() {
    this._statements.push({
      type: 'indexes',
      method: method,
      args: _.toArray(arguments)
    });
  };
});

// Set the comment value for a table, they're only allowed to be called
// once per table.
TableBuilder.prototype.comment = function(value) {
  this._single.comment = value;
};

module.exports = TableBuilder;