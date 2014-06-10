// SQLite3 Formatter
// -------
module.exports = function(client) {

var Formatter = require('../../formatter');
var inherits  = require('inherits');

// The "formatter" is used to ensure all output is properly
// escaped & parameterized.
function Formatter_SQLite3() {
  this.client = client;
  Formatter.apply(this, arguments);
}
inherits(Formatter_SQLite3, Formatter);

Formatter_SQLite3.prototype.operators = [
  '=', '<', '>', '<=', '>=', '<>', '!=',
  'like', 'not like', 'between', 'ilike',
  '&', '|', '<<', '>>'
];

// Wraps a value (column, tableName) with the correct ticks.
Formatter_SQLite3.prototype.wrapValue = function(value) {
  return (value !== '*' ? '"' + value + '"' : '*');
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

Formatter_SQLite3.prototype._wrap = wrapperMemo;

// Assign the formatter to the the client.
client.Formatter = Formatter_SQLite3;

};