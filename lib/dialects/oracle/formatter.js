'use strict';

// Oracle Formatter
// ------
module.exports = function(client) {

var Formatter = require('../../formatter');
var inherits  = require('inherits');

// The "formatter" is used to ensure all output is properly
// escaped & parameterized.
function Formatter_Oracle() {
  this.client = client;
  Formatter.apply(this, arguments);
}
inherits(Formatter_Oracle, Formatter);

Formatter_Oracle.prototype.operators = [
  '=', '<', '>', '<=', '>=', '<>', '!=',
  'like', 'not like', 'between', 'ilike',
  '&', '|', '^', '<<', '>>',
  'rlike', 'regexp', 'not regexp'
];

// Wraps a value (column, tableName) with the correct ticks.
Formatter_Oracle.prototype.wrapValue = function(value) {
  return (value !== '*' ? '"' + value + '"' : '*');
};


// Coerce to string to prevent strange errors when it's not a string.
Formatter_Oracle.prototype._wrapString = function(value) {
  var segments, asIndex = value.toLowerCase().indexOf(' as ');
  if (asIndex !== -1) {
    var first  = value.slice(0, asIndex);
    var second = value.slice(asIndex + 4);
    return this.wrap(first) + ' ' + this.wrap(second);
  }
  var wrapped = [];
  segments = value.split('.');
  for (var i = 0, l = segments.length; i < l; i = ++i) {
    value = segments[i];
    if (i === 0 && segments.length > 1) {
      wrapped.push(this.wrap((value || '').trim()));
    } else {
      wrapped.push(this.wrapValue((value || '').trim()));
    }
  }
  return wrapped.join('.');
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

Formatter_Oracle.prototype._wrap = wrapperMemo;

// Ensures the query is aliased if necessary.
Formatter_Oracle.prototype.outputQuery = function(compiled, alwaysWrapped) {
  var sql = compiled.sql || '';
  if (sql) {
    if (compiled.method === 'select' && alwaysWrapped || compiled.as) {
      sql = '(' + sql + ')';
      if (compiled.as) sql += ' ' + this.wrap(compiled.as);
    }
  }
  return sql;
};


// Assign the formatter to the the client.
client.Formatter = Formatter_Oracle;

};
