
// Redshift Column Compiler
// -------

var inherits       = require('inherits');
var ColumnCompiler = require('../../../schema/columncompiler');
var assign         = require('lodash/object/assign');

function ColumnCompiler_Redshift() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = ['nullable', 'defaultTo', 'comment']
}
inherits(ColumnCompiler_Redshift, ColumnCompiler);

assign(ColumnCompiler_Redshift.prototype, {

  // Types
  // ------

  // doesn't exist
  bigincrements: 'bigserial primary key',

  // doesn't exist
  bigint: 'bigint',

  binary: 'bytea',

  bit: function(column) {
    return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
  },

  bool: 'boolean',

  // Create the column definition for an enum type.
  // Using method "2" here: http://stackoverflow.com/a/10984951/525714
  enu: function(allowed) {
    return 'text check (' + this.formatter.wrap(this.args[0]) + " in ('" + allowed.join("', '")  + "'))";
  },

  double: 'double precision',
  floating: 'real',

  // doesn't exist
  increments: 'serial primary key',

  // doesn't exist
  json: function() {
    return 'character varying(65535)';
  },

  // doesn't exist
  jsonb: 'character varying(65535)',

  // doesn't exist
  smallint: 'smallint',

  // doesn't exist
  tinyint:  'smallint',
  datetime: function() {
    return 'timestamp';
  },
  timestamp: function() {
    return 'timestamp';
  },
  text: 'character varying(65535)',
  uuid: 'character varying(256)',

  // Modifiers:
  // ------
  comment: function(comment) {
    this.pushAdditional(function() {
      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' +
        this.formatter.wrap(this.args[0]) + " is " + (comment ? "'" + comment + "'" : 'NULL'));
    }, comment);
  }

})

module.exports = ColumnCompiler_Redshift;
