// TableInterface

// Takes the function passed to the "createTable" or "table/editTable"
// functions and calls it with the "TableInterface" as both the context and
// the first argument. Inside this function we can specify what happens to the
// method, pushing everything we want to do onto the "allStatements" array,
// which is then compiled into sql.
// -------
var Helpers = require('../helpers');
var _       = require('lodash');

var TableInterface = module.exports = function(method, tableName, fn) {
  this.__method = method;
  this.__tableName = tableName;
  this.__columns = [];
  this.__statements = [];
  this.__attributes = {};

  // If we're altering a table, include the statements
  // that are associated with altering a table.
  if (method === 'alter') {
    _.extend(this, AlterMethods);
  }

  fn.call(this, this);
};

var AlterMethods = {

  // Drop a column from the current table.
  // TODO: Convert to this.column(columnName).drop()
  dropColumn: function(columnName) {
    this.__statements.push({
      type: 'alterColumns',
      method: 'dropColumn',
      args: Helpers.normalizeArr.apply(null, arguments)
    });
  },

  // Drop more than one column.
  dropColumns: function() {
    return this.dropColumn.apply(this, arguments);
  },

  // Renames the current column `from` the current
  // TODO: this.column(from).rename(to)
  renameColumn: function(from, to) {
    this.__statements.push({
      type: 'alterColumns',
      method: 'renameColumn',
      args: [from, to]
    });
  },

  dropTimestamps: function() {
    return this.dropColumns(['created_at', 'updated_at']);
  }

  // TODO: changeType
};

// Warn if we're not in MySQL, since that's the only time these
// three are supported.
var specialMethods = ['engine', 'charset', 'collate'];
_.each(specialMethods, function(method) {
  TableInterface.prototype[method] = function(value) {
    if (false) {
      warn('Knex only supports ' + method + ' statement with mysql.');
    } if (this.__method === 'alter') {
      warn('Knex does not support altering the ' + method + ' outside of the create table, please use knex.raw statement.');
    } else {
      this.__attributes[method] = value;
    }
  };
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
  'float': 'floating',
  'enum': 'enu',
  'boolean': 'bool',
  'string': 'varchar',
  'bigint': 'bigInteger'
};

// For each of the column methods, create a new "Chainable" interface,
// push it onto the "allStatements" stack, and then return the interface,
// with which we can add indexes, etc.
_.each(columnMethods, function(method) {
  TableInterface.prototype[method] = function() {
    var args = Helpers.args.apply(null, arguments);

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
    var chainable = new Chainable(this, aliased, args[0]);
    this.__columns.push({
      method: aliased,
      originalMethod: method,
      args: args,
      chainable: chainable
    });
    return chainable;
  };

});

// Each of the index methods can be called individually, with the
// column name to be used, e.g. table.unique('column').
var indexMethods = ['index', 'primary', 'unique'];
var allIndexMethods = indexMethods.concat(['dropPrimary', 'dropUnique', 'dropIndex', 'dropForeign']);

_.each(allIndexMethods, function(method) {
  TableInterface.prototype[method] = function() {
    if (this.__method === 'create' && method.indexOf('drop') === 0) {
      warn('The ' + method + ' command has no effect within in the "createTable" clause.');
    } else {
      this.__statements.push({
        method: method,
        args: Helpers.args.apply(null, arguments),
        type: 'indexes'
      });
    }
  };
});

// The chainable interface off the original "column" method.
var Chainable = function(tableInterface, method, column) {
  this.__column = column;
  this.__method = method;
  this.__tableInterface = tableInterface;
  this.__modifiers = {};
};

// All of the modifier methods that can be used to modify the current query.
var chainableMethods = indexMethods.concat([
  'defaultsTo', 'defaultTo', 'unsigned', 'nullable',
  'notNull', 'notNullable', 'after', 'comment'
]);

// Aliases for convenience.
var aliasChainable = {
  defaultsTo: 'defaultTo',
  notNull: 'notNullable'
};

// If we call any of the "indexMethods" on the chainable, we pretend
// as though we're calling `table.method(column)` directly.
_.each(chainableMethods, function(method) {
  Chainable.prototype[method] = function() {
    var args = Helpers.args.apply(null, arguments);
    if (_.contains(indexMethods, method) && this.__method.indexOf('increments') === -1) {
      this.__tableInterface[method].apply(this.__tableInterface, [this.__column].concat(args));
    } else {
      if (aliasChainable[method]) method = aliasChainable[method];

      // We'll treat notNull / notNullable as an alias for .nullable(false)
      if (method === 'notNullable') {
        method = 'nullable';
        args = [false];
      }
      this.__modifiers[method] = args;
    }
    return this;
  };
});

// The complex chainable for the foreign key creation.
TableInterface.prototype.foreign = function(column) {
  var foreignData = {
    column: column
  };
  var currentChain = this.__currentChain;
  this.__statements.push({
    type: 'indexes',
    method: 'foreign',
    args: [foreignData]
  });
  var extended = _.extend(currentChain || {}, {
    onUpdate: function(statement) {
      foreignData.onUpdate = statement;
      return extended;
    },
    onDelete: function(statement) {
      foreignData.onDelete = statement;
      return extended;
    }
  });
  return {
    references: function(tableColumn) {
      var pieces;
      if (_.isString(tableColumn)) {
        pieces = tableColumn.split('.');
      }
      if (!pieces || pieces.length === 1) {
        foreignData.references = pieces ? pieces[0] : tableColumn;
        return {
          on: function(tableName) {
            foreignData.inTable = tableName;
            return extended;
          },
          inTable: function() {
            return this.on.apply(this, arguments);
          }
        };
      }
      foreignData.inTable = pieces[0];
      foreignData.references = pieces[1];
      return extended;
    }
  };
};

// Set the comment value for a table.
TableInterface.prototype.comment = function(value) {
  this.__attributes.comment = value;
};

// The starting interface for specifying a foreign key on column creation.
Chainable.prototype.references = function(tableColumn) {
  this.__currentChain = this;
  var foreignChain = this.__tableInterface.foreign(this.__column).references(tableColumn);
  this.__currentChain = void 0;
  return foreignChain;
};
