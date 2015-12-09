
var inherits        = require('inherits')
var assign          = require('lodash/object/assign')
var Formatter       = require('../../formatter')

function MSSQL_Formatter(client) {
  Formatter.call(this, client)
}
inherits(MSSQL_Formatter, Formatter)

assign(MSSQL_Formatter.prototype, {

  // Accepts a string or array of columns to wrap as appropriate.
  columnizeWithPrefix: function(prefix, target) {
    var columns = typeof target === 'string' ? [target] : target
    var str = '', i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ', '
      str += prefix + this.wrap(columns[i])
    }
    return str
  },

})

module.exports = MSSQL_Formatter