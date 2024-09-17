// Sql.js
// -------
const defaults = require('lodash/defaults');
const map = require('lodash/map');
const { promisify } = require('util');

const Client = require('../../client');

const Raw = require('../../raw');
const Transaction = require('./execution/sqljs-transaction');
const SqljsQueryCompiler = require('./query/sqljs-querycompiler');
const SchemaCompiler = require('./schema/sqljs-compiler');
const ColumnCompiler = require('./schema/sqljs-columncompiler');
const TableCompiler = require('./schema/sqljs-tablecompiler');
const ViewCompiler = require('./schema/sqljs-viewcompiler');
const SQLJS_DDL = require('./schema/ddl');
const Formatter = require('../../formatter');
const QueryBuilder = require('./query/sqljs-querybuilder');

class Client_SQLJS extends Client {
  constructor(config) {
    super(config);

    if (config.useNullAsDefault === undefined) {
      this.logger.warn(
        'sqljs does not support inserting default values. Set the ' +
          '`useNullAsDefault` flag to hide this warning. ' +
          '(see docs https://knexjs.org/guide/query-builder.html#insert).'
      );
    }
  }

  _driver() {
    return require('./driver');
  }

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  }

  transaction() {
    return new Transaction(this, ...arguments);
  }

  queryCompiler(builder, formatter) {
    return new SqljsQueryCompiler(this, builder, formatter);
  }

  queryBuilder() {
    return new QueryBuilder(this);
  }

  viewCompiler(builder, formatter) {
    return new ViewCompiler(this, builder, formatter);
  }

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  }

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  }

  ddl(compiler, pragma, connection) {
    return new SQLJS_DDL(this, compiler, pragma, connection);
  }

  wrapIdentifierImpl(value) {
    return value !== '*' ? `\`${value.replace(/`/g, '``')}\`` : '*';
  }

  prepBindings(bindings) {
    return map(bindings, (value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
  }

  // Get a raw connection from the database, returning a promise with the connection object.
  acquireRawConnection() {
    return new Promise((resolve, reject) => {
      try {
        const db = new this.driver.Database(this.connectionSettings, (err) => {
          if (err) {
            return reject(err);
          }
          resolve(db);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Used to explicitly close a connection, called internally by the pool when
  // a connection times out or the pool is shutdown.
  async destroyRawConnection(connection) {
    const close = promisify((cb) => connection.close(cb));
    return close();
  }

  // Runs the query on the specified connection, providing the bindings and any
  // other necessary prep work.
  _query(connection, obj) {
    if (!obj.sql) throw new Error('The query is empty');

    const { method } = obj;
    let callMethod;
    switch (method) {
      case 'insert':
      case 'update':
        callMethod = obj.returning ? 'all' : 'run';
        break;
      case 'counter':
      case 'del':
        callMethod = 'run';
        break;
      default:
        callMethod = 'all';
    }
    return new Promise(function (resolver, rejecter) {
      if (!connection || !connection[callMethod]) {
        return rejecter(
          new Error(`Error calling ${callMethod} on connection.`)
        );
      }
      connection[callMethod](obj.sql, obj.bindings, function (err, response) {
        if (err) return rejecter(err);
        obj.response = response;

        // We need the context here, as it contains
        // the "this.lastID" or "this.changes"
        obj.context = this;

        return resolver(obj);
      });
    });
  }

  _stream(connection, obj, stream) {
    if (!obj.sql) throw new Error('The query is empty');

    const client = this;
    return new Promise(function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);

      return client
        ._query(connection, obj)
        .then((obj) => obj.response)
        .then((rows) => rows.forEach((row) => stream.write(row)))
        .catch(function (err) {
          stream.emit('error', err);
        })
        .then(function () {
          stream.end();
        });
    });
  }

  // Ensures the response is returned in the same format as other clients.
  processResponse(obj, runner) {
    const ctx = obj.context;
    const { response, returning } = obj;
    if (obj.output) return obj.output.call(runner, response);
    switch (obj.method) {
      case 'select':
        return response;
      case 'first':
        return response[0];
      case 'pluck':
        return map(response, obj.pluck);
      case 'insert': {
        if (returning) {
          if (response) {
            return response;
          }
        }
        return [ctx.lastID];
      }
      case 'update': {
        if (returning) {
          if (response) {
            return response;
          }
        }
        return ctx.changes;
      }
      case 'del':
      case 'counter':
        return ctx.changes;
      default: {
        return response;
      }
    }
  }

  poolDefaults() {
    return defaults({ min: 1, max: 1 }, super.poolDefaults());
  }

  formatter(builder) {
    return new Formatter(this, builder);
  }

  values(values, builder, formatter) {
    if (Array.isArray(values)) {
      if (Array.isArray(values[0])) {
        return `( values ${values
          .map(
            (value) =>
              `(${this.parameterize(value, undefined, builder, formatter)})`
          )
          .join(', ')})`;
      }
      return `(${this.parameterize(values, undefined, builder, formatter)})`;
    }

    if (values instanceof Raw) {
      return `(${this.parameter(values, builder, formatter)})`;
    }

    return this.parameter(values, builder, formatter);
  }
}

Object.assign(Client_SQLJS.prototype, {
  dialect: 'sqljs',

  driverName: 'sqljs',
});

module.exports = Client_SQLJS;
