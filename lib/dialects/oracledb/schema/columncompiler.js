'use strict';

var _lodash = require('lodash');

const inherits = require('inherits');
const ColumnCompiler_Oracle = require('../../oracle/schema/columncompiler');

function ColumnCompiler_Oracledb() {
  ColumnCompiler_Oracle.apply(this, arguments);
}

inherits(ColumnCompiler_Oracledb, ColumnCompiler_Oracle);

(0, _lodash.assign)(ColumnCompiler_Oracledb.prototype, {

  time: 'timestamp with local time zone',

  datetime: function (without) {
    return without ? 'timestamp' : 'timestamp with local time zone';
  },

  timestamp: function (without) {
    return without ? 'timestamp' : 'timestamp with local time zone';
  }

});

module.exports = ColumnCompiler_Oracledb;