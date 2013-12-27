// types.js
// Used for designating column types
// during the table "create" / "alter" statements.

module.exports = {
  increments: 'integer not null primary key autoincrement',
  bigincrements: 'integer not null primary key autoincrement',
  integer: 'integer',
  smallint: 'integer',
  mediumint: 'integer',
  biginteger: 'bigint',
  varchar: function(length) {
    return 'varchar(' + num(length, 255) + ')';
  },
  text: 'text',
  tinyint: 'tinyint',
  floating: function(precision, scale) {
    return 'float(' + num(precision, 8) + ', ' + num(scale, 2) + ')';
  },
  decimal: function(precision, scale) {
    return 'decimal(' + num(precision, 8) + ', ' + num(scale, 2) + ')';
  },
  bool: 'boolean',
  date: 'date',
  datetime: 'datetime',
  time: 'time',
  timestamp: 'timestamp',
  enu: 'varchar',
  bit: 'text',
  binary: 'blob',
  json: 'text',
  uuid: 'char(36)',
  specificType: function(type) {
    return type;
  }
};

function num(val, fallback) {
  if (val == null) return fallback;
  var number = parseInt(val, 10);
  return isNaN(number) ? fallback : number;
}