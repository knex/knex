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
  '=', '!=', '^=', '<>', 'ÿ=',
  '>', '>=', '<', '<=',
  'like', 'not like', 'between', 'not between',
  '&', '|', '^', '<<', '>>'
];

// based on http://docs.oracle.com/cd/B28359_01/appdev.111/b31231/appb.htm#CJHIIICD
Formatter_Oracle.prototype.reservedWords = [
  'access', 'add', 'all', 'alter', 'and', 'any', 'arraylen', 'as', 'asc',
  'audit', 'between', 'by', 'char', 'check', 'cluster', 'column', 'comment',
  'compress', 'connect', 'create', 'current', 'date', 'decimal', 'default',
  'delete', 'desc', 'distinct', 'drop', 'else', 'exclusive', 'exists', 'file',
  'float', 'for', 'from', 'grant', 'group', 'having', 'identified', 'immediate',
  'in', 'increment', 'index', 'initial', 'insert', 'integer', 'intersect',
  'into', 'is', 'level', 'like', 'lock', 'long', 'maxextents', 'minus', 'mode',
  'modify', 'noaudit', 'nocompress', 'not', 'notfound', 'nowait', 'null',
  'number', 'of', 'offline', 'on', 'online', 'option', 'or', 'order', 'pctfree',
  'prior', 'privileges', 'public', 'raw', 'rename', 'resource', 'revoke', 'row',
  'rowid', 'rowlabel', 'rownum', 'rows', 'select', 'session', 'set', 'share',
  'size', 'smallint', 'sqlbuf', 'start', 'successful', 'synonym', 'sysdate',
  'table', 'then', 'to', 'trigger', 'uid', 'union', 'unique', 'update', 'user',
  'validate', 'values', 'varchar', 'varchar2', 'view', 'whenever', 'where',
  'with'
];

// Wraps a value (column, tableName) with the correct ticks.
Formatter_Oracle.prototype.wrapValue = function(value) {
  // only wrap values that are not lower case
  return (value === '*' || (
      !this.isQuoting() &&
      /^([a-z_])+([a-z0-9_]*)$/.test(value) &&
      this.reservedWords.indexOf(value) === -1
    )) ? value : '"' + value + '"';
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

Formatter_Oracle.prototype._wrap = Formatter.prototype._wrapString;

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
