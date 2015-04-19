var inherits  = require('inherits')
var Formatter = require('../../formatter')
var assign    = require('lodash/object/assign')

function Oracle_Formatter(client) {
  Formatter.call(this, client)
}
inherits(Oracle_Formatter, Formatter)

assign(Oracle_Formatter.prototype, {

  alias: function(first, second) {
    return this.wrap(first) + ' ' + this.wrap(second);
  }

})

module.exports = Oracle_Formatter