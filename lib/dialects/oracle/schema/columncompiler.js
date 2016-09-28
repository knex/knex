'use strict';

exports.__esModule = true;

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _uniq2 = require('lodash/uniq');

var _uniq3 = _interopRequireDefault(_uniq2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _utils = require('../utils');

var utils = _interopRequireWildcard(_utils);

var _raw = require('../../../raw');

var _raw2 = _interopRequireDefault(_raw);

var _columncompiler = require('../../../schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Column Compiler
// -------

function ColumnCompiler_Oracle() {
  this.modifiers = ['defaultTo', 'checkIn', 'nullable', 'comment'];
  _columncompiler2.default.apply(this, arguments);
}
(0, _inherits2.default)(ColumnCompiler_Oracle, _columncompiler2.default);

(0, _assign3.default)(ColumnCompiler_Oracle.prototype, {

  // helper function for pushAdditional in increments() and bigincrements()
  _createAutoIncrementTriggerAndSequence: function _createAutoIncrementTriggerAndSequence() {
    // TODO Add warning that sequence etc is created
    this.pushAdditional(function () {
      var sequenceName = this.tableCompiler._indexCommand('seq', this.tableCompiler.tableNameRaw);
      var triggerName = this.tableCompiler._indexCommand('trg', this.tableCompiler.tableNameRaw, this.getColumnName());
      var tableName = this.tableCompiler.tableName();
      var columnName = this.formatter.wrap(this.getColumnName());
      var createTriggerSQL = 'create or replace trigger ' + triggerName + ' before insert on ' + tableName + ' for each row' + ' declare' + ' checking number := 1;' + ' begin' + (' if (:new.' + columnName + ' is null) then') + ' while checking >= 1' + ' loop' + (' select ' + sequenceName + '.nextval into :new.' + columnName + ' from dual;') + (' select count(' + columnName + ') into checking from ' + tableName) + (' where ' + columnName + ' = :new.' + columnName + ';') + ' end loop;' + ' end if;' + ' end;';
      this.pushQuery(utils.wrapSqlWithCatch('create sequence ' + sequenceName, -955));
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
  integer: function integer(length) {
    return length ? 'number(' + this._num(length, 11) + ')' : 'integer';
  },


  tinyint: 'smallint',

  smallint: 'smallint',

  mediumint: 'integer',

  biginteger: 'number(20, 0)',

  text: 'clob',

  enu: function enu(allowed) {
    allowed = (0, _uniq3.default)(allowed);
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
    this.pushAdditional(function () {
      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' + this.formatter.wrap(this.args[0]) + " is '" + (_comment || '') + "'");
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
      value = (0, _map3.default)(value, function (v) {
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