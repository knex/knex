'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var assign = require('lodash/object/assign');
var utils = require('../utils');
var Raw = require('../../../raw');
var ColumnCompiler = require('../../../schema/columncompiler');

// Column Compiler
// -------

function ColumnCompiler_Oracle() {
  this.modifiers = ['defaultTo', 'checkIn', 'nullable', 'comment'];
  ColumnCompiler.apply(this, arguments);
}
inherits(ColumnCompiler_Oracle, ColumnCompiler);

assign(ColumnCompiler_Oracle.prototype, {

  // helper function for pushAdditional in increments() and bigincrements()
  _createAutoIncrementTriggerAndSequence: function _createAutoIncrementTriggerAndSequence() {
    // TODO Add warning that sequence etc is created
    this.pushAdditional(function () {
      var sequenceName = this.tableCompiler._indexCommand('seq', this.tableCompiler.tableNameRaw);
      var triggerName = this.tableCompiler._indexCommand('trg', this.tableCompiler.tableNameRaw, this.getColumnName());
      var tableName = this.tableCompiler.tableName();
      var columnName = this.formatter.wrap(this.getColumnName());
      var createTriggerSQL = 'create or replace trigger ' + triggerName + ' before insert on ' + tableName + ' for each row' + ' when (new.' + columnName + ' is null) ' + ' begin' + ' select ' + sequenceName + '.nextval into :new.' + columnName + ' from dual;' + ' end;';
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
    allowed = _.uniq(allowed);
    var maxLength = (allowed || []).reduce(function (maxLength, name) {
      return Math.max(maxLength, String(name).length);
    }, 1);

    // implicitly add the enum values as checked values
    this.columnBuilder._modifiers.checkIn = [allowed];

    return 'varchar2(' + maxLength + ')';
  },

  time: 'timestamp',

  datetime: 'timestamp',

  timestamp: 'timestamp',

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
      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' + this.formatter.wrap(this.args[0]) + ' is \'' + (_comment || '') + '\'');
    }, _comment);
  },

  checkIn: function checkIn(value) {
    // TODO: Maybe accept arguments also as array
    // TODO: value(s) should be escaped properly
    if (value === undefined) {
      return '';
    } else if (value instanceof Raw) {
      value = value.toQuery();
    } else if (Array.isArray(value)) {
      value = _.map(value, function (v) {
        return '\'' + v + '\'';
      }).join(', ');
    } else {
      value = '\'' + value + '\'';
    }
    return 'check (' + this.formatter.wrap(this.args[0]) + ' in (' + value + '))';
  }

});

module.exports = ColumnCompiler_Oracle;