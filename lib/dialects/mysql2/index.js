// MySQL2 Client
// -------
const Client_MySQL = require('../mysql');
const Transaction = require('./transaction');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
class Client_MySQL2 extends Client_MySQL {
  transaction() {
    return new Transaction(this, ...arguments);
  }

  _driver() {
    return require('mysql2');
  }
  validateConnection(connection) {
    return (
      connection &&
      !connection._fatalError &&
      !connection._protocolError &&
      !connection._closing &&
      !connection.stream.destroyed
    );
  }
}

Object.assign(Client_MySQL2.prototype, {
  // The "dialect", for reference elsewhere.
  driverName: 'mysql2',
});

module.exports = Client_MySQL2;
