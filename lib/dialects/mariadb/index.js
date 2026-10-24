// MariaDB Client
// -------
const Client_MySQL = require('../mysql');
const Transaction = require('./transaction');
const QueryCompiler = require('./query/mariadb-querycompiler');
const ColumnCompiler = require('./schema/mariadb-columncompiler');

class Client_MariaDB extends Client_MySQL {
  transaction() {
    return new Transaction(this, ...arguments);
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
