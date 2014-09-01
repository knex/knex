'use strict';

module.exports = function(client) {

var FunctionHelper = require('../../functionhelper');

var FunctionHelper_SQLite3 = Object.create(FunctionHelper);
FunctionHelper_SQLite3.client = client;

// Assign the newly extended `FunctionHelper` constructor to the client object.
client.FunctionHelper = FunctionHelper_SQLite3;

};