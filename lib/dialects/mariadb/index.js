// MariaDB Client
// -------
const Client_MySQL = require('../mysql');
const Cast = require('../../cast');
const Transaction = require('./transaction');
const QueryCompiler = require('./query/mariadb-querycompiler');
const ColumnCompiler = require('./schema/mariadb-columncompiler');

class Client_MariaDB extends Client_MySQL {
  transaction() {
    return new Transaction(this, ...arguments);
  }

  // MariaDB does not support `CAST(... AS JSON)` (unlike MySQL); its JSON type
  // is an alias for LONGTEXT, so we cast to `char` instead.
  castJson(value, alias) {
    return new Cast(this).cast(value, 'char', alias);
  }

  castJsonb(value, alias) {
    return new Cast(this).cast(value, 'char', alias);
  }

  // MariaDB does not accept `REAL` as a CAST target; `REAL` is a synonym for
  // `DOUBLE`, which it does support.
  castReal(value, alias) {
    return new Cast(this).cast(value, 'double', alias);
  }

  queryCompiler(builder, formatter) {
    return new QueryCompiler(this, builder, formatter);
  }

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  }

  _driver() {
    return require('mariadb/callback');
  }

  processResponse(obj, runner) {
    if (obj == null) return;
    if (obj.returning) {
      const rows = obj.response[0];
      const fields = obj.response[1];
      if (obj.output) {
        return obj.output.call(runner, rows, fields);
      }
      return rows;
    }
    return super.processResponse(obj, runner);
  }

  validateConnection(connection) {
    if (typeof connection.isValid === 'function') {
      return connection.isValid();
    }
    return (
      connection &&
      !connection._fatalError &&
      !connection._protocolError &&
      !connection._closing
    );
  }
}

Object.assign(Client_MariaDB.prototype, {
  driverName: 'mariadb',
});

module.exports = Client_MariaDB;
