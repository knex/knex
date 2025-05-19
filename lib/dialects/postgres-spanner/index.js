// Postgres Spanner Driver (postgres-spanner)
// -------
const Client_PG = require('../postgres');

const QueryCompiler = require('./query/pg-spanner-querycompiler');
const SchemaCompiler = require('./schema/pg-spanner-compiler');

class Client_PgSpanner extends Client_PG {
  constructor(...args) {
    super(...args);
    this.driverName = 'postgres-spanner';
  }

  queryCompiler(builder, formatter) {
    return new QueryCompiler(this, builder, formatter);
  }

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  }
}

Object.assign(Client_PG.prototype, {
  dialect: 'postgresql-spanner',
})

module.exports = Client_PgSpanner;
