// CockroachDB Client
// -------
const Client_PostgreSQL = require('../postgres');
const Transaction = require('../postgres/execution/pg-transaction');
const QueryCompiler = require('./crdb-querycompiler');
const TableCompiler = require('./crdb-tablecompiler');
const ViewCompiler = require('./crdb-viewcompiler');
const QueryBuilder = require('./crdb-querybuilder');

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

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  }

  viewCompiler() {
    return new ViewCompiler(this, ...arguments);
  }

  queryBuilder() {
    return new QueryBuilder(this);
  }

  _parseVersion(versionString) {
    return versionString.split(' ')[2];
  }

  async cancelQuery(connectionToKill) {
    try {
      return await this._wrappedCancelQueryCall(null, connectionToKill);
    } catch (err) {
      this.logger.warn(`Connection Error: ${err}`);
      throw err;
    }
  }

  _wrappedCancelQueryCall(emptyConnection, connectionToKill) {
    // FixMe https://github.com/cockroachdb/cockroach/issues/41335
    if (
      connectionToKill.activeQuery.processID === 0 &&
      connectionToKill.activeQuery.secretKey === 0
    ) {
      return;
    }

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
