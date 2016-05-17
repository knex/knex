
var inherits        = require('inherits')
var Formatter       = require('../../formatter')

import {assign} from 'lodash'

function Sqlanywhere_Formatter(client) {
  Formatter.call(this, client)
}
inherits(Sqlanywhere_Formatter, Formatter)

assign(Sqlanywhere_Formatter.prototype, {

  alias: function(first, second) {
    return first + ' ' + second;
  },

  parameter: function(value, notSetValue) {
    // Returning helper uses always ROWID as string
    if (typeof value === 'boolean') {
      value = value ? 1 : 0
    }
    return Formatter.prototype.parameter.call(this, value, notSetValue)
  }

})

module.exports = Sqlanywhere_Formatter
