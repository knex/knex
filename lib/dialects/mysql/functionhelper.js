'use strict';

module.exports = function(client) {

var FunctionHelper = require('../../functionhelper');

var FunctionHelper_MySQL = Object.create(FunctionHelper);
FunctionHelper_MySQL.client = client;

// Assign the newly extended `FunctionHelper` constructor to the client object.
client.FunctionHelper = FunctionHelper_MySQL;

};