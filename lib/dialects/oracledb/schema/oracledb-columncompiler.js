const ColumnCompiler_Oracle = require('../../oracle/schema/oracle-columncompiler');
const { isObject } = require('../../../util/is');

class ColumnCompiler_Oracledb extends ColumnCompiler_Oracle {
  constructor() {
    super(...arguments);
    this.modifiers = ['defaultTo', 'nullable', 'comment', 'checkJson'];
    this._addCheckModifiers();
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

  checkRegex(regex, constraintName) {
    return this._check(
      `REGEXP_LIKE(${this.formatter.wrap(
        this.getColumnName()
      )},${this.client._escapeBinding(regex)})`,
      constraintName
    );
  }

  json() {
    // implicitly add the check for json
    this.columnBuilder._modifiers.checkJson = [
      this.formatter.columnize(this.getColumnName()),
    ];
    return 'varchar2(4000)';
  }

  jsonb() {
    return this.json();
  }

  checkJson(column) {
    return `check (${column} is json)`;
  }
}

ColumnCompiler_Oracledb.prototype.time = 'timestamp with local time zone';
ColumnCompiler_Oracledb.prototype.uuid = ({ useBinaryUuid = false } = {}) =>
  useBinaryUuid ? 'raw(16)' : 'char(36)';

module.exports = ColumnCompiler_Oracledb;
