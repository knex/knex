'use strict';

// FDB SQL Layer raw
// This file was adapted from the PostgreSQL raw

module.exports = function(client) {

var Raw = require('../../raw');
var inherits = require('inherits');

// Inherit from the `Raw` constructor's prototype,
// so we can add the correct `then` method.
function Raw_FDB() {
  this.client = client;
  Raw.apply(this, arguments);
}
inherits(Raw_FDB, Raw);

// Assign the newly extended `Raw` constructor to the client object.
client.Raw = Raw_FDB;

};
