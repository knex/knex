
// PostgreSQL Column Compiler
// -------

var inherits       = require('inherits');
var ColumnCompiler = require('../../../schema/columncompiler');
var assign         = require('lodash/object/assign');
var helpers        = require('../../../helpers');

function ColumnCompiler_PG() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = ['nullable', 'defaultTo', 'comment']
}
inherits(ColumnCompiler_PG, ColumnCompiler);

assign(ColumnCompiler_PG.prototype, {

  // Types
  // ------
  bigincrements: 'bigserial primary key',
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
  increments: 'serial primary key',
  json: function(jsonb) {
    if (jsonb) helpers.deprecate('json(true)', 'jsonb()')
    return jsonColumn(this.client, jsonb);
  },
  jsonb: function() {
    return jsonColumn(this.client, true);
  },
  smallint: 'smallint',
  tinyint:  'smallint',
  datetime: function(without) {
    return without ? 'timestamp' : 'timestamptz';
  },
  timestamp: function(without) {
    return without ? 'timestamp' : 'timestamptz';
  },
  uuid: 'uuid',

  // Modifiers:
  // ------
  comment: function(comment) {
    this.pushAdditional(function() {
      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' +
        this.formatter.wrap(this.args[0]) + " is " + (comment ? "'" + comment + "'" : 'NULL'));
    }, comment);
  }

})

function jsonColumn(client, jsonb) {
  if (!client.version || parseFloat(client.version) >= 9.2) return jsonb ? 'jsonb' : 'json';
  return 'text';
}

module.exports = ColumnCompiler_PG;
