'use strict';

exports.__esModule = true;

var _lodash = require('lodash');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _raw = require('../../../raw');

var _raw2 = _interopRequireDefault(_raw);

var _columncompiler = require('../../../schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _trigger = require('./trigger');

var _trigger2 = _interopRequireDefault(_trigger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Column Compiler
// -------

function ColumnCompiler_Oracle() {
  _columncompiler2.default.apply(this, arguments);
  this.modifiers = ['defaultTo', 'checkIn', 'nullable', 'comment'];
}
(0, _inherits2.default)(ColumnCompiler_Oracle, _columncompiler2.default);

(0, _lodash.assign)(ColumnCompiler_Oracle.prototype, {

  // helper function for pushAdditional in increments() and bigincrements()
  _createAutoIncrementTriggerAndSequence: function _createAutoIncrementTriggerAndSequence() {
    // TODO Add warning that sequence etc is created
    this.pushAdditional(function () {
      var tableName = this.tableCompiler.tableNameRaw;
      var createTriggerSQL = _trigger2.default.createAutoIncrementTrigger(this.client.logger, tableName);
      this.pushQuery(createTriggerSQL);
    });
  },
  increments: function increments() {
    this._createAutoIncrementTriggerAndSequence();
    return 'integer not null primary key';
  },
  bigincrements: function bigincrements() {
    this._createAutoIncrementTriggerAndSequence();
    return 'number(20, 0) not null primary key';
  },
  floating: function floating(precision) {
    var parsedPrecision = this._num(precision, 0);
    return 'float' + (parsedPrecision ? '(' + parsedPrecision + ')' : '');
  },
  double: function double(precision, scale) {
    // if (!precision) return 'number'; // TODO: Check If default is ok
    return 'number(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
  },
  decimal: function decimal(precision, scale) {
    if (precision === null) return 'decimal';
    return 'decimal(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
  },
  integer: function integer(length) {
    return length ? 'number(' + this._num(length, 11) + ')' : 'integer';
  },


  tinyint: 'smallint',

  smallint: 'smallint',

  mediumint: 'integer',

  biginteger: 'number(20, 0)',

  text: 'clob',

  enu: function enu(allowed) {
    allowed = (0, _lodash.uniq)(allowed);
    var maxLength = (allowed || []).reduce(function (maxLength, name) {
      return Math.max(maxLength, String(name).length);
    }, 1);

    // implicitly add the enum values as checked values
    this.columnBuilder._modifiers.checkIn = [allowed];

    return 'varchar2(' + maxLength + ')';
  },


  time: 'timestamp with time zone',

  datetime: function datetime(without) {
    return without ? 'timestamp' : 'timestamp with time zone';
  },
  timestamp: function timestamp(without) {
    return without ? 'timestamp' : 'timestamp with time zone';
  },


  bit: 'clob',

  json: 'clob',

  bool: function bool() {
    // implicitly add the check for 0 and 1
    this.columnBuilder._modifiers.checkIn = [[0, 1]];
    return 'number(1, 0)';
  },
  varchar: function varchar(length) {
    return 'varchar2(' + this._num(length, 255) + ')';
  },


  // Modifiers
  // ------

  comment: function comment(_comment) {
    var columnName = this.args[0] || this.defaults('columnName');

    this.pushAdditional(function () {
      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' + this.formatter.wrap(columnName) + " is '" + (_comment || '') + "'");
    }, _comment);
  },
  checkIn: function checkIn(value) {
    // TODO: Maybe accept arguments also as array
    // TODO: value(s) should be escaped properly
    if (value === undefined) {
      return '';
    } else if (value instanceof _raw2.default) {
      value = value.toQuery();
    } else if (Array.isArray(value)) {
      value = (0, _lodash.map)(value, function (v) {
        return '\'' + v + '\'';
      }).join(', ');
    } else {
      value = '\'' + value + '\'';
    }
    return 'check (' + this.formatter.wrap(this.args[0]) + ' in (' + value + '))';
  }
});

exports.default = ColumnCompiler_Oracle;
module.exports = exports['default'];