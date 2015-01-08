'use strict';

module.exports = function(client) {

var Raw = require('../../raw');
var inherits = require('inherits');

// Inherit from the `Raw` constructor's prototype,
// so we can add the correct `then` method.
function Raw_PG() {
  this.client = client;
  Raw.apply(this, arguments);
}
inherits(Raw_PG, Raw);

Raw_PG.prototype.interpolateBindings = function() {
  if (this.bindings.length === 0) {
    this.sql = this.sql.replace(/\?/g, function() {
      return '$Q';
    });
  }
  return Raw.prototype.interpolateBindings.apply(this, arguments);
};

// Assign the newly extended `Raw` constructor to the client object.
client.Raw = Raw_PG;

};