'use strict';

var inherits = require('inherits');
var assign = require('lodash/object/assign');
var ColumnCompiler_Oracle = require('../../oracle/schema/columncompiler');

function ColumnCompiler_Oracledb() {
  ColumnCompiler_Oracle.apply(this, arguments);
}

inherits(ColumnCompiler_Oracledb, ColumnCompiler_Oracle);

assign(ColumnCompiler_Oracledb.prototype, {

  time: 'timestamp with local time zone',

  datetime: function datetime(without) {
    return without ? 'timestamp' : 'timestamp with local time zone';
  },

  timestamp: function timestamp(without) {
    return without ? 'timestamp' : 'timestamp with local time zone';
  }

});

module.exports = ColumnCompiler_Oracledb;