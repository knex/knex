'use strict';

var inherits = require('inherits');
var assign = require('lodash/object/assign');
var Formatter = require('../../formatter');

function Oracle_Formatter(client) {
  Formatter.call(this, client);
}
inherits(Oracle_Formatter, Formatter);

assign(Oracle_Formatter.prototype, {

  alias: function alias(first, second) {
    return first + ' ' + second;
  }

});

module.exports = Oracle_Formatter;