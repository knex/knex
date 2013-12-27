// MySQL Schema Types
// -------
module.exports = function() {
  var _ = require('lodash');
  return _.extend({}, require('../../../../schema/tablecompiler/types'), {
    increments: 'int unsigned not null auto_increment primary key',
    bigincrements: 'bigint unsigned not null auto_increment primary key',
    bigint: 'bigint',
    double: function(precision, scale) {
      if (!precision) return 'double';
      return 'double(' + num(precision, 8) + ', ' + num(scale, 2) + ')';
    },
    integer: function(length) {
      length = length ? '(' + num(length, 11) + ')' : '';
      return 'int' + length;
    },
    mediumint: 'mediumint',
    smallint: 'smallint',
    tinyint: function(length) {
      length = length ? '(' + num(length, 1) + ')' : '';
      return 'tinyint' + length;
    },
    text: function(column) {
      switch (column) {
        case 'medium':
        case 'mediumtext':
          return 'mediumtext';
        case 'long':
        case 'longtext':
          return 'longtext';
        default:
          return 'text';
      }
    },
    mediumtext: function() {
      return this.text('medium');
    },
    longtext: function() {
      return this.text('long');
    },
    float: function(precision, scale) {
      return 'float(' + precision + ',' + scale + ')';
    },
    typeDecimal: function(precision, scale) {
      return 'decimal(' + precision + ', ' + scale + ')';
    },
    enu: function(allowed) {
      return "enum('" + allowed.join("', '")  + "')";
    },
    datetime: 'datetime',
    timestamp: 'timestamp',
    bit: function(length) {
      return length ? 'bit(' + length + ')' : 'bit';
    }
  });

  function num(val, fallback) {
    if (val == null) return fallback;
    var number = parseInt(val, 10);
    return isNaN(number) ? fallback : number;
  }
};