// Column Compiler
// Used for designating column definitions
// during the table "create" / "alter" statements.
// -------
function ColumnCompiler(columnBuilder, tableCompiler) {
  this.grouped = _.groupBy(columnBuilder._statements, 'grouped');
  this.single  = columnBuilder._single;
}

ColumnCompiler.prototype.create = function() {

};
ColumnCompiler.prototype.alter = function() {

};

ColumnCompiler.prototype.increments = 'integer not null primary key autoincrement';

ColumnCompiler.prototype.bigincrements = 'integer not null primary key autoincrement';

ColumnCompiler.prototype.integer =
ColumnCompiler.prototype.smallint =
ColumnCompiler.prototype.mediumint = 'integer';

ColumnCompiler.prototype.biginteger = 'bigint';

ColumnCompiler.prototype.varchar = function(length) {
  return 'varchar(' + this._num(length, 255) + ')';
};

ColumnCompiler.prototype.text = 'text';

ColumnCompiler.prototype.tinyint = 'tinyint';

ColumnCompiler.prototype.floating = function(precision, scale) {
  return 'float(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
};

ColumnCompiler.prototype.decimal = function(precision, scale) {
  return 'decimal(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
};

ColumnCompiler.prototype.binary = 'blob',

ColumnCompiler.prototype.bool = 'boolean',

ColumnCompiler.prototype.date = 'date',

ColumnCompiler.prototype.datetime = 'datetime',

ColumnCompiler.prototype.time = 'time',

ColumnCompiler.prototype.timestamp = 'timestamp',

ColumnCompiler.prototype.enu = 'varchar',

ColumnCompiler.prototype.bit =
ColumnCompiler.prototype.json = 'text',

ColumnCompiler.prototype.uuid = 'char(36)',

ColumnCompiler.prototype.specificType = function(type) {
  return type;
};

ColumnCompiler.prototype._num = function(val, fallback) {
  if (val == null) return fallback;
  var number = parseInt(val, 10);
  return isNaN(number) ? fallback : number;
};

ColumnCompiler.prototype.nullable = function(nullable) {
  return nullable === false ? 'not null' : 'null';
};

ColumnCompiler.prototype.defaultTo = function(value) {
  if (value === void 0) return '';
  if (value instanceof Raw) {
    value = value.sql;
  } else if (this.method === 'bool') {
    if (value === 'false') value = 0;
    value = (value ? 1 : 0);
  } else if (value === true || value === false) {
    value = parseInt(value, 10);
  } else {
    value = "'" + value + "'";
  }
  return 'default ' + value;
};

// var foreignData = {
//   column: column
// };
// var currentChain = this.__currentChain;
// this._statements.push({
//   type: 'indexes',
//   method: 'foreign',
//   args: [foreignData]
// });
// var extended = _.extend(currentChain || {}, {
//   onUpdate: function(statement) {
//     foreignData.onUpdate = statement;
//     return extended;
//   },
//   onDelete: function(statement) {
//     foreignData.onDelete = statement;
//     return extended;
//   }
// });
// return {
//   references: function(tableColumn) {
//     var pieces;
//     if (_.isString(tableColumn)) {
//       pieces = tableColumn.split('.');
//     }
//     if (!pieces || pieces.length === 1) {
//       foreignData.references = pieces ? pieces[0] : tableColumn;
//       return {
//         on: function(tableName) {
//           foreignData.inTable = tableName;
//           return extended;
//         },
//         inTable: function() {
//           return this.on.apply(this, arguments);
//         }
//       };
//     }
//     foreignData.inTable = pieces[0];
//     foreignData.references = pieces[1];
//     return extended;
//   }
// };