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
