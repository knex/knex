// modifiers.js
// Used for designating additional column info
// during the table "create" / "alter" statements.
var _   = require('lodash');

// NOTE: All methods are called with the context of the "TableCompiler" object.
module.exports = {

  nullable: function Modifiers$nullable(nullable) {
    return nullable === false ? 'not null' : 'null';
  },

  defaultTo: function Modifiers$defaultTo(value) {
    if (value === void 0) return '';
    // TODO: instanceof Raw
    if (value && value.sql) {
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
  }

};