// PostgreSQL Schema Types
// -------
module.exports = function(client) {

  var _ = require('lodash');
  var baseTypes = require('../../../../schema/tablecompiler/types');

  // Specific types for the current
  return _.extend({}, baseTypes, {
    bigincrements: 'bigserial primary key',
    bigint: 'bigint',
    binary: 'bytea',
    bit: function(column) {
      return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
    },
    bool: 'boolean',
    datetime: 'timestamp',
    // Create the column definition for an enum type.
    // Using method "2" here: http://stackoverflow.com/a/10984951/525714
    enu: function(allowed) {
      var column = this.currentColumn;
      return 'text check (' + column.args[0] + " in ('" + allowed.join("', '")  + "'))";
    },
    double: 'double precision',
    floating: 'real',
    increments: 'serial primary key',
    // Create the column definition for a json type,
    // checking whether the json type is supported - falling
    // back to "text" if it's not.
    json: function() {
      if (parseFloat(client.version) >= 9.2) return 'json';
      return 'text';
    },
    smallint: 'smallint',
    tinyint: 'smallint',
    timestamp: 'timestamp',
    uuid: 'uuid'
  });

};