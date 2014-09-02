'use strict';

module.exports = function(client) {

var FunctionHelper = require('../../functionhelper');

var FunctionHelper_PG = Object.create(FunctionHelper);
FunctionHelper_PG.client = client;

// Assign the newly extended `FunctionHelper` constructor to the client object.
client.FunctionHelper = FunctionHelper_PG;

};