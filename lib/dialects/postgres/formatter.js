// Formatter
// ---------------
module.exports = function(client) {

var Formatter = require('../../formatter');

// The "formatter" is used to ensure all output is properly
// escaped & parameterized.
function Formatter_PG() {
  this.client = client;
  this.paramCount = 0;
  Formatter.apply(this, arguments);
}
inherits(Formatter_PG, Formatter);

// Set the correct query binding identifier for the query.
Formatter_PG.prototype.placeholder = function() {
  this.paramCount++;
  return '$' + this.paramCount;
};

// Wraps a value (column, tableName) with the correct ticks.
Formatter_PG.prototype.wrapValue = function(value) {
  return (value !== '*' ? '"' + value + '"' : '*');
};

// Memoize the calls to "wrap" for a little extra perf.
var wrapperMemo = (function(){
  var memo = Object.create(null);
  return function(key) {
    if (memo.key === void 0) {
      memo[key] = this._wrapString(key);
    }
    return memo[key];
  };
}());

Formatter_PG.prototype._wrap = wrapperMemo;

// Assign the formatter to the the client.
client.Formatter = Formatter_PG;

};