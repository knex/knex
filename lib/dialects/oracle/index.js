// Oracle Client
// -------
const { inherits } = require('util');
const Client = require('../../client');

const SchemaCompiler = require('./schema/compiler');
const ColumnBuilder = require('./schema/columnbuilder');
const ColumnCompiler = require('./schema/columncompiler');
const TableCompiler = require('./schema/tablecompiler');
const { isConnectionError } = require('./utils');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_Oracle(config) {
  Client.call(this, config);
}

inherits(Client_Oracle, Client);

Object.assign(Client_Oracle.prototype, {
  dialect: 'oracle',

  driverName: 'oracle',

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  },

  columnBuilder() {
    return new ColumnBuilder(this, ...arguments);
  },

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  },

  // Return the database for the Oracle client.
  database() {
    return this.connectionSettings.database;
  },

  // Position the bindings for the query.
  positionBindings(sql) {
    let questionCount = 0;
    return sql.replace(/\?/g, function () {
      questionCount += 1;
      return `:${questionCount}`;
    });
  },

  _stream(connection, obj, stream, options) {
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
  },
});

module.exports = Client_Oracle;
