'use strict';

var inherits = require('inherits');
var assign = require('lodash/object/assign');
var Formatter = require('../../formatter');
var ReturningHelper = require('./utils').ReturningHelper;

function Firebird_Formatter(client) {
  Formatter.call(this, client);
}
inherits(Firebird_Formatter, Formatter);

assign(Firebird_Formatter.prototype, {

  alias: function alias(first, second) {
    return first + ' ' + second;
  },

  parameter: function parameter(value, notSetValue) {
    if (value instanceof ReturningHelper && this.client.driver) {
      value = new this.client.driver.OutParam(this.client.driver.OCCISTRING);
    } else if (typeof value === 'boolean') {
      value = value ? 1 : 0;
    }
    return Formatter.prototype.parameter.call(this, value, notSetValue);
  }

});

module.exports = Firebird_Formatter;
