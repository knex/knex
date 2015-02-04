'use strict';

// FDB SQL Layer Function Helper
// This file was adapted from the PostgreSQL Function Helper

module.exports = function(client) {

var FunctionHelper = require('../../functionhelper');

var FunctionHelper_FDB = Object.create(FunctionHelper);
FunctionHelper_FDB.client = client;

// Assign the newly extended `FunctionHelper` constructor to the client object.
client.FunctionHelper = FunctionHelper_FDB;

};
