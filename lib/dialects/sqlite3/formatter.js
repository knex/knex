'use strict';

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

// based on http://www.sqlite.org/lang_keywords.html
Formatter_SQLite3.prototype.reservedWords = [
  'abort', 'action', 'add', 'after', 'all', 'alter', 'analyze', 'and', 'as',
  'asc', 'attach', 'autoincrement', 'before', 'begin', 'between', 'by',
  'cascade', 'case', 'cast', 'check', 'collate', 'column', 'commit', 'conflict',
  'constraint', 'create', 'cross', 'current_date', 'current_time',
  'current_timestamp', 'database', 'default', 'deferrable', 'deferred',
  'delete', 'desc', 'detach', 'distinct', 'drop', 'each', 'else', 'end',
  'escape', 'except', 'exclusive', 'exists', 'explain', 'fail', 'for',
  'foreign', 'from', 'full', 'glob', 'group', 'having', 'if', 'ignore',
  'immediate', 'in', 'index', 'indexed', 'initially', 'inner', 'insert',
  'instead', 'intersect', 'into', 'is', 'isnull', 'join', 'key', 'left',
  'like', 'limit', 'match', 'natural', 'no', 'not', 'notnull', 'null', 'of',
  'offset', 'on', 'or', 'order', 'outer', 'plan', 'pragma', 'primary', 'query',
  'raise', 'recursive', 'references', 'regexp', 'reindex', 'release', 'rename',
  'replace', 'restrict', 'right', 'rollback', 'row', 'savepoint', 'select',
  'set', 'table', 'temp', 'temporary', 'then', 'to', 'transaction', 'trigger',
  'union', 'unique', 'update', 'using', 'vacuum', 'values', 'view', 'virtual',
  'when', 'where', 'with', 'without'
];

// Wraps a value (column, tableName) with the correct ticks.
Formatter_SQLite3.prototype.wrapValue = function(value) {
  return (value === '*' || (
    !this.isQuoting() &&
    /^([a-z_])+([a-z0-9_]*)$/.test(value) &&
    this.reservedWords.indexOf(value) === -1
  )) ? value : '"' + value + '"';
};

Formatter_SQLite3.prototype._wrap = Formatter.prototype._wrapString;

// Assign the formatter to the the client.
client.Formatter = Formatter_SQLite3;

};
