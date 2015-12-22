
var inherits        = require('inherits')
var assign          = require('lodash/object/assign')
var Formatter       = require('../../formatter')

function Firebird_Formatter(client) {
  Formatter.call(this, client)
}
inherits(Firebird_Formatter, Formatter)

assign(Firebird_Formatter.prototype, {

  alias: function(first, second) {
    return first + ' ' + second;
  },

  parameter: function(value, notSetValue) {
    return Formatter.prototype.parameter.call(this, this.client.driver.escape(value), notSetValue)
  }

})

module.exports = Firebird_Formatter