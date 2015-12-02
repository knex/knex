'use strict';

var inherits = require('inherits');
var assign = require('lodash/object/assign');
var Oracle_Formatter = require('../oracle/formatter');

function Oracledb_Formatter(client) {
  Oracle_Formatter.call(this, client);
}
inherits(Oracledb_Formatter, Oracle_Formatter);

assign(Oracle_Formatter.prototype, {

  bindOutString: function bindOutString() {
    if (this.client.driver) {
      return { type: this.client.driver.STRING, dir: this.client.driver.BIND_OUT };
    }
  }

});

module.exports = Oracledb_Formatter;