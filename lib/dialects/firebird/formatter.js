'use strict';

var inherits = require('inherits');
var assign = require('lodash/object/assign');
var Formatter = require('../../formatter');

function Firebird_Formatter(client) {
  Formatter.call(this, client);
}
inherits(Firebird_Formatter, Formatter);

assign(Firebird_Formatter.prototype, {

  alias: function alias(first, second) {
    return first + ' ' + second;
  },

  parameter: function parameter(value, notSetValue) {
    return Formatter.prototype.parameter.call(this, value, notSetValue);
  }

});

module.exports = Firebird_Formatter;