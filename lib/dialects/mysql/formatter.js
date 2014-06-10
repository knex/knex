// MySQL Formatter
// ------
module.exports = function(client) {

var Formatter = require('../../formatter');
var inherits  = require('inherits');

// The "formatter" is used to ensure all output is properly
// escaped & parameterized.
function Formatter_MySQL() {
  this.client = client;
  Formatter.apply(this, arguments);
}
inherits(Formatter_MySQL, Formatter);

Formatter_MySQL.prototype.operators = [
  '=', '<', '>', '<=', '>=', '<>', '!=',
  'like', 'not like', 'between', 'ilike',
  '&', '|', '^', '<<', '>>',
  'rlike', 'regexp', 'not regexp'
];

// Wraps a value (column, tableName) with the correct ticks.
Formatter_MySQL.prototype.wrapValue = function(value) {
  return (value !== '*' ? '`' + value + '`' : '*');
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

Formatter_MySQL.prototype._wrap = wrapperMemo;

// Assign the formatter to the the client.
client.Formatter = Formatter_MySQL;

};