'use strict';

// Oracle Column Builder & Compiler
// -------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');
var Raw      = require('../raw');
var Schema   = require('../../../schema');
var utils    = require('../utils');

// Column Builder
// -------

function ColumnBuilder_Oracle() {
  Schema.ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_Oracle, Schema.ColumnBuilder);

// checkIn added to the builder to allow the column compiler to change the
// order via the modifiers ("check" must be after "default")
ColumnBuilder_Oracle.prototype.checkIn = function () {
  this._modifiers.checkIn = _.toArray(arguments);
  return this;
};

// Column Compiler
// -------

function ColumnCompiler_Oracle() {
  this.modifiers = ['defaultTo', 'checkIn', 'nullable', 'comment'];
  this.Formatter = client.Formatter;
  Schema.ColumnCompiler.apply(this, arguments);
}
inherits(ColumnCompiler_Oracle, Schema.ColumnCompiler);

// Types
// ------

// helper function for pushAdditional in increments() and bigincrements()
ColumnCompiler_Oracle.prototype._createAutoIncrementTriggerAndSequence = function () {
  // TODO Add warning that sequence etc is created
  this.pushAdditional(function () {
    var sequenceName = this.tableCompiler._indexCommand('seq', this.tableCompiler.tableNameRaw);
    var triggerName = this.tableCompiler._indexCommand('trg', this.tableCompiler.tableNameRaw, this.getColumnName());
    var tableName = this.tableCompiler.tableName();
    var columnName = this.formatter.wrap(this.getColumnName());
    var createTriggerSQL = 'create or replace trigger ' + triggerName + ' before insert on ' + tableName +
      ' for each row' +
      ' when (new.' + columnName + ' is null) ' +
      ' begin' +
      ' select ' + sequenceName + '.nextval into :new.' + columnName + ' from dual;' +
      ' end;';
    this.pushQuery(utils.wrapSqlWithCatch('create sequence ' + sequenceName, -955));
    this.pushQuery(createTriggerSQL);
  });
};

ColumnCompiler_Oracle.prototype.increments = function () {
  this._createAutoIncrementTriggerAndSequence();
  return 'integer not null primary key';
};

ColumnCompiler_Oracle.prototype.bigincrements = function () {
  this._createAutoIncrementTriggerAndSequence();
  return 'number(20, 0) not null primary key';
};

ColumnCompiler_Oracle.prototype.double = function(precision, scale) {
  // if (!precision) return 'number'; // TODO: Check If default is ok
  return 'number(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
};

ColumnCompiler_Oracle.prototype.integer = function(length) {
    return length ? 'number(' + this._num(length, 11) + ')' : 'integer';
};

ColumnCompiler_Oracle.prototype.tinyint =
ColumnCompiler_Oracle.prototype.smallint = 'smallint';

ColumnCompiler_Oracle.prototype.mediumint = 'integer';

ColumnCompiler_Oracle.prototype.biginteger = 'number(20, 0)';

ColumnCompiler_Oracle.prototype.text = 'clob';

ColumnCompiler_Oracle.prototype.enu = function (allowed) {
  allowed = _.uniq(allowed);
  var maxLength = (allowed || []).reduce(function (maxLength, name) {
    return Math.max(maxLength, String(name).length);
  }, 1);

  // implicitly add the enum values as checked values
  this.columnBuilder._modifiers.checkIn = [allowed];

  return "varchar2(" + maxLength + ")";
};

ColumnCompiler_Oracle.prototype.time =
ColumnCompiler_Oracle.prototype.datetime =
ColumnCompiler_Oracle.prototype.timestamp = 'timestamp';

ColumnCompiler_Oracle.prototype.bit = 'clob';
ColumnCompiler_Oracle.prototype.json = 'clob';
ColumnCompiler_Oracle.prototype.text = 'clob';

ColumnCompiler_Oracle.prototype.bool = function () {
  // implicitly add the check for 0 and 1
  this.columnBuilder._modifiers.checkIn = [[0, 1]];
  return 'number(1, 0)';
};

ColumnCompiler_Oracle.prototype.varchar = function(length) {
  return 'varchar2(' + this._num(length, 255) + ')';
};

// Modifiers
// ------

ColumnCompiler_Oracle.prototype.comment = function(comment) {
  this.pushAdditional(function() {
    this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' +
      this.formatter.wrap(this.args[0]) + " is '" + (comment || '')+ "'");
  }, comment);
};

ColumnCompiler_Oracle.prototype.checkIn = function (value) {
  // TODO: Maybe accept arguments also as array
  // TODO: value(s) should be escaped properly
  if (value === undefined) {
    return '';
  } else if (value instanceof Raw) {
    value = value.toQuery();
  } else if (_.isArray(value)) {
    value = _.map(value, function (v) {
      return "'" + v + "'";
    }).join(', ');
  } else {
    value = "'" + value + "'";
  }
  return 'check (' + this.formatter.wrap(this.args[0]) + ' in (' + value + '))';
};

client.ColumnBuilder = ColumnBuilder_Oracle;
client.ColumnCompiler = ColumnCompiler_Oracle;

};