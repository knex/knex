'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _columncompiler = require('../../../schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _helpers = require('../../../helpers');

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ColumnCompiler_PG() {
  _columncompiler2.default.apply(this, arguments);
  this.modifiers = ['nullable', 'defaultTo', 'comment'];
}
// PostgreSQL Column Compiler
// -------

(0, _inherits2.default)(ColumnCompiler_PG, _columncompiler2.default);

(0, _assign3.default)(ColumnCompiler_PG.prototype, {

  // Types
  // ------
  bigincrements: 'bigserial primary key',
  bigint: 'bigint',
  binary: 'bytea',

  bit: function bit(column) {
    return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
  },


  bool: 'boolean',

  // Create the column definition for an enum type.
  // Using method "2" here: http://stackoverflow.com/a/10984951/525714
  enu: function enu(allowed) {
    return 'text check (' + this.formatter.wrap(this.args[0]) + ' in (\'' + allowed.join("', '") + '\'))';
  },


  double: 'double precision',
  floating: 'real',
  increments: 'serial primary key',
  json: function json(jsonb) {
    if (jsonb) helpers.deprecate('json(true)', 'jsonb()');
    return jsonColumn(this.client, jsonb);
  },
  jsonb: function jsonb() {
    return jsonColumn(this.client, true);
  },

  smallint: 'smallint',
  tinyint: 'smallint',
  datetime: function datetime(without) {
    return without ? 'timestamp' : 'timestamptz';
  },
  timestamp: function timestamp(without) {
    return without ? 'timestamp' : 'timestamptz';
  },

  uuid: 'uuid',

  // Modifiers:
  // ------
  comment: function comment(_comment) {
    this.pushAdditional(function () {
      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' + this.formatter.wrap(this.args[0]) + " is " + (_comment ? '\'' + _comment + '\'' : 'NULL'));
    }, _comment);
  }
});

function jsonColumn(client, jsonb) {
  if (!client.version || parseFloat(client.version) >= 9.2) return jsonb ? 'jsonb' : 'json';
  return 'text';
}

exports.default = ColumnCompiler_PG;
module.exports = exports['default'];