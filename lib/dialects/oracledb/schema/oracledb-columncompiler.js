const ColumnCompiler_Oracle = require('../../oracle/schema/oracle-columncompiler');
const { isObject } = require('../../../util/is');

class ColumnCompiler_Oracledb extends ColumnCompiler_Oracle {
  constructor() {
    super(...arguments);
  }

  datetime(withoutTz) {
    let useTz;
    if (isObject(withoutTz)) {
      ({ useTz } = withoutTz);
    } else {
      useTz = !withoutTz;
    }
    return useTz ? 'timestamp with local time zone' : 'timestamp';
  }

  timestamp(withoutTz) {
    let useTz;
    if (isObject(withoutTz)) {
      ({ useTz } = withoutTz);
    } else {
      useTz = !withoutTz;
    }
    return useTz ? 'timestamp with local time zone' : 'timestamp';
  }

  json() {
    return `varchar2(4000) check (${this.formatter.columnize(
      this.getColumnName()
    )} is json)`;
  }

  jsonb() {
    return this.json();
  }
}

ColumnCompiler_Oracledb.prototype.time = 'timestamp with local time zone';

module.exports = ColumnCompiler_Oracledb;
