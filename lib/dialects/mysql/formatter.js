'use strict';

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

// based on http://docs.oracle.com/cd/B10501_01/win.920/a97249/ch3.htm
Formatter_MySQL.prototype.reservedWords = [
  'abort', 'accept', 'access', 'add', 'all', 'alter', 'and', 'any', 'array',
  'arraylen', 'as', 'asc', 'assert', 'assign', 'at', 'audit', 'authorization',
  'avg', 'base_table', 'begin', 'between', 'binary_integer', 'body', 'boolean',
  'by', 'case', 'char', 'char_base', 'check', 'close', 'cluster', 'clusters',
  'colauth', 'column', 'comment', 'commit', 'compress', 'connect', 'constant',
  'crash', 'create', 'current', 'currval', 'cursor', 'data_base', 'database',
  'date', 'dba', 'debugoff', 'debugon', 'decimal', 'declare', 'default',
  'definition', 'delay', 'delete', 'desc', 'digits', 'dispose', 'distinct',
  'do', 'drop', 'else', 'elsif', 'end', 'entry', 'exception', 'exception_init',
  'exclusive', 'exists', 'exit', 'false', 'fetch', 'file', 'float', 'for',
  'form', 'from', 'function', 'generic', 'goto', 'grant', 'group', 'having',
  'identified', 'if', 'immediate', 'in', 'increment', 'index', 'indexes',
  'indicator', 'initial', 'insert', 'integer', 'interface', 'intersect', 'into',
  'is', 'level', 'like', 'limited', 'lock', 'long', 'loop', 'max', 'maxextents',
  'min', 'minus', 'mlslabel', 'mod', 'mode', 'modify', 'natural', 'naturaln',
  'network', 'new', 'nextval', 'noaudit', 'nocompress', 'not', 'nowait', 'null',
  'number', 'number_base', 'of', 'offline', 'on', 'online', 'open', 'option',
  'or', 'order', 'others', 'out', 'package', 'partition', 'pctfree',
  'pls_integer', 'positive', 'positiven', 'pragma', 'prior', 'private',
  'privileges', 'procedure', 'public', 'raise', 'range', 'raw', 'real',
  'record', 'ref', 'release', 'remr', 'rename', 'resource', 'return', 'reverse',
  'revoke', 'rollback', 'row', 'rowid', 'rowlabel', 'rownum', 'rows', 'rowtype',
  'run', 'savepoint', 'schema', 'select', 'seperate', 'session', 'set', 'share',
  'signtype', 'size', 'smallint', 'space', 'sql', 'sqlcode', 'sqlerrm', 'start',
  'statement', 'stddev', 'subtype', 'successful', 'sum', 'synonym', 'sysdate',
  'tabauth', 'table', 'tables', 'task', 'terminate', 'then', 'to', 'trigger',
  'true', 'type', 'uid', 'union', 'unique', 'update', 'use', 'user', 'validate',
  'values', 'varchar', 'varchar2', 'variance', 'view', 'views', 'when',
  'whenever', 'where', 'while', 'with', 'work', 'write', 'xor'
];

// Wraps a value (column, tableName) with the correct ticks.
Formatter_MySQL.prototype.wrapValue = function(value) {
  return (value === '*' || (
    !this.isQuoting() &&
    /^([a-z_])+([a-z0-9_]*)$/.test(value) &&
    this.reservedWords.indexOf(value) === -1
  )) ? value : '`' + value + '`';
};

Formatter_MySQL.prototype._wrap = Formatter.prototype._wrapString;

// Assign the formatter to the the client.
client.Formatter = Formatter_MySQL;

};