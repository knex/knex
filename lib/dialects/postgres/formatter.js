'use strict';

// PostgreSQL Formatter
// -------
module.exports = function(client) {

var Formatter = require('../../formatter');
var inherits  = require('inherits');

// The "formatter" is used to ensure all output is properly
// escaped & parameterized.
function Formatter_PG() {
  this.client = client;
  this.paramCount = 0;
  Formatter.apply(this, arguments);
}
inherits(Formatter_PG, Formatter);

Formatter_PG.prototype.operators = [
  '=', '<', '>', '<=', '>=', '<>', '!=',
  'like', 'not like', 'between', 'ilike', '~', '~*', '!~', '!~*',
  '&', '|', '#', '<<', '>>', '&&', '^', '@>', '<@', '||'
];

// based on http://www.postgresql.org/docs/9.3/static/sql-keywords-appendix.html
// also included reserved that can be used as function/name
Formatter_PG.prototype.reservedWords = [
  'all', 'analyse', 'analyze', 'and', 'any', 'array', 'as', 'asc', 'asymmetric',
  'authorization', 'between', 'bigint', 'binary', 'bit', 'boolean', 'both',
  'case', 'cast', 'check', 'collate', 'collation', 'column', 'concurrently',
  'constraint', 'create', 'cross', 'current_catalog', 'current_date',
  'current_role', 'current_schema', 'current_time', 'current_timestamp',
  'current_user',  'default', 'deferrable', 'desc', 'distinct', 'do', 'else',
  'end', 'except', 'exists', 'extract', 'false', 'fetch', 'float', 'for',
  'foreign', 'freeze', 'from', 'full', 'grant', 'group', 'having', 'ilike',
  'in', 'initially', 'intersect', 'into', 'is', 'isnull', 'join', 'lateral',
  'leading', 'left', 'like', 'limit', 'localtime', 'localtimestamp', 'national',
  'natural', 'nchar', 'none', 'not', 'notnull', 'null', 'offset', 'on', 'only',
  'or', 'order', 'out', 'outer', 'over', 'overlaps', 'overlay', 'placing',
  'position', 'precision', 'primary', 'real', 'references', 'returning',
  'right', 'row', 'select', 'session_user', 'setof', 'similar', 'some',
  'substring', 'symmetric', 'table', 'then', 'to', 'trailing', 'treat', 'trim',
  'true', 'union', 'unique', 'user', 'using', 'values', 'varchar', 'variadic',
  'verbose', 'when', 'where', 'window', 'with', 'xmlattributes', 'xmlconcat',
  'xmlelement', 'xmlexists', 'xmlforest', 'xmlparse', 'xmlpi', 'xmlroot',
  'xmlserialize'
];

// Wraps a value (column, tableName) with the correct ticks.
Formatter_PG.prototype.wrapValue = function(value) {
  // special handling for array index
  var matched = value.match(/(.*?)((?:\[\d+\]){1,})$/);
  if (matched) return this.wrapValue(matched[1]) + matched[2];

  return (value === '*' || (
      !this.isQuoting() &&
      /^([a-z_])+([a-z0-9_]*)$/.test(value) &&
      this.reservedWords.indexOf(value) === -1
    )) ? value : '"' + value + '"';
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

Formatter_PG.prototype._wrap = wrapperMemo;

// Assign the formatter to the the client.
client.Formatter = Formatter_PG;

};
