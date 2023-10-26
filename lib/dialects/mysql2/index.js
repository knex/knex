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

  initializeDriver() {
    try {
      this.driver = this._driver();
    } catch (e) {
      let message = `Knex: run\n$ npm install ${this.driverName}`;

      const nodeMajorVersion = process.version.replace(/^v/, '').split('.')[0];
      if (nodeMajorVersion <= 12) {
        message += `@3.2.0`;
        this.logger.error(
          'Mysql2 version 3.2.0 is the latest version to support Node.js 12 or lower.'
        );
      }
      message += ` --save`;
      this.logger.error(`${message}\n${e.message}\n${e.stack}`);
      throw new Error(`${message}\n${e.message}`);
    }
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
