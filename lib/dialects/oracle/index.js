// Oracle Client
// -------
const { ReturningHelper } = require('./utils');
const { isConnectionError } = require('./utils');
const Client = require('../../client');
const SchemaCompiler = require('./schema/oracle-compiler');
const ColumnBuilder = require('./schema/oracle-columnbuilder');
const ColumnCompiler = require('./schema/oracle-columncompiler');
const TableCompiler = require('./schema/oracle-tablecompiler');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
class Client_Oracle extends Client {
  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  }

  columnBuilder() {
    return new ColumnBuilder(this, ...arguments);
  }

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  }

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  }

  // Return the database for the Oracle client.
  database() {
    return this.connectionSettings.database;
  }

  // Position the bindings for the query.
  positionBindings(sql) {
    let questionCount = 0;
    return sql.replace(/\?/g, function () {
      questionCount += 1;
      return `:${questionCount}`;
    });
  }

  _stream(connection, obj, stream, options) {
    if (!obj.sql) throw new Error('The query is empty');

    return new Promise(function (resolver, rejecter) {
      stream.on('error', (err) => {
        if (isConnectionError(err)) {
          connection.__knex__disposed = err;
        }
        rejecter(err);
      });
      stream.on('end', resolver);
      const queryStream = connection.queryStream(
        obj.sql,
        obj.bindings,
        options
      );
      queryStream.pipe(stream);
      queryStream.on('error', function (error) {
        rejecter(error);
        stream.emit('error', error);
      });
    });
  }

  // Formatter part

  alias(first, second) {
    return first + ' ' + second;
  }

  parameter(value, builder, formatter) {
    // Returning helper uses always ROWID as string
    if (value instanceof ReturningHelper && this.driver) {
      value = new this.driver.OutParam(this.driver.OCCISTRING);
    } else if (typeof value === 'boolean') {
      value = value ? 1 : 0;
    }
    return super.parameter(value, builder, formatter);
  }
}

Object.assign(Client_Oracle.prototype, {
  dialect: 'oracle',

  driverName: 'oracle',
});

module.exports = Client_Oracle;
