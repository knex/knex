// CockroachDB Client
// -------
const Client_PostgreSQL = require('../postgres');
const Transaction = require('../postgres/execution/pg-transaction');
const QueryCompiler = require('./crdb-querycompiler');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
class Client_CockroachDB extends Client_PostgreSQL {
  transaction() {
    return new Transaction(this, ...arguments);
  }

  queryCompiler(builder, formatter) {
    return new QueryCompiler(this, builder, formatter);
  }

  _parseVersion(versionString) {
    return versionString.split(' ')[2];
  }

  async cancelQuery(connectionToKill) {
    try {
      await this._wrappedCancelQueryCall(null, connectionToKill);
    } catch (err) {
      this.logger.warn(`Connection Error: ${err}`);
      throw err;
    }
  }

  _wrappedCancelQueryCall(emptyConnection, connectionToKill) {
    return connectionToKill.cancel(
      connectionToKill,
      connectionToKill.activeQuery
    );
  }
}

Object.assign(Client_CockroachDB.prototype, {
  // The "dialect", for reference elsewhere.
  driverName: 'cockroachdb',
});

module.exports = Client_CockroachDB;
