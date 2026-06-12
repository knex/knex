// Postgres Spanner Driver (postgres-spanner)
// -------
const Client_PG = require('../postgres');

const QueryCompiler = require('./query/pg-spanner-querycompiler');
const SchemaCompiler = require('./schema/pg-spanner-compiler');

class Client_PgSpanner extends Client_PG {
  queryCompiler(builder, formatter) {
    return new QueryCompiler(this, builder, formatter);
  }

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  }
}

Object.assign(Client_PgSpanner.prototype, {
  // The "dialect", for reference elsewhere.
  dialect: 'postgresql-spanner',
  driverName: 'postgres-spanner',
});

module.exports = Client_PgSpanner;
