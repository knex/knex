'use strict';

// FDB SQL Layer Formatter
// This file was adapted from the PostgreSQL Formatter

module.exports = function(client) {

var Formatter = require('../../formatter');
var inherits  = require('inherits');

// The "formatter" is used to ensure all output is properly
// escaped & parameterized.
function Formatter_FDB() {
  this.client = client;
  this.paramCount = 0;
  Formatter.apply(this, arguments);
}
inherits(Formatter_FDB, Formatter);

Formatter_FDB.prototype.operators = [
  '=', '<', '>', '<=', '>=', '<>', '!=',
  'like', 'not like', 'between', 'ilike',
  '&', '|', '#', '<<', '>>', '&&', '^', '||'
];

// Wraps a value (column, tableName) with the correct ticks.
Formatter_FDB.prototype.wrapValue = function(value) {
  if (value === '*') return value;
  return this.escapeIdentifier(value);
};

// Properly escapes identifier for query.
Formatter_FDB.prototype.escapeIdentifier = function(str) {
  var escaped = '"';
  for(var i = 0; i < str.length; i++) {
    var c = str[i];
    if(c === '"') {
      escaped += c + c;
    } else {
      escaped += c;
    }
  }
  escaped += '"';
  return escaped;
};

// Memoize the calls to "wrap" for a little extra perf.
var wrapperMemo = (function(){
  var memo = Object.create(null);
  return function(key) {
    if (memo[key] === void 0) {
      memo[key] = this._wrapString(key);
    }
    return memo[key];
  };
}());

Formatter_FDB.prototype._wrap = wrapperMemo;

// Assign the formatter to the the client.
client.Formatter = Formatter_FDB;

};
