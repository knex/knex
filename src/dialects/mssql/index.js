// MSSQL Client
// -------
import { assign, map, flatten, values, mapValues } from "lodash";
import inherits from "inherits";

import Client from "../../client";
import Promise from "bluebird";

import Formatter from "../../formatter";
import Transaction from "./transaction";
import QueryCompiler from "./query/compiler";
import SchemaCompiler from "./schema/compiler";
import TableCompiler from "./schema/tablecompiler";
import ColumnCompiler from "./schema/columncompiler";

import * as tedious from "tedious";

const debug = require("debug")("knex:mssql");

const { isArray } = Array;

const SQL_INT4 = { MIN: -2147483648, MAX: 2147483647 };
const SQL_BIGINT_SAFE = { MIN: -9007199254740991, MAX: 9007199254740991 };

// Always initialize with the "QueryBuilder" and "QueryCompiler" objects, which
// extend the base 'lib/query/builder' and 'lib/query/compiler', respectively.
function Client_MSSQL(config) {
  // #1235 mssql module wants 'server', not 'host'. This is to enforce the same
  // options object across all dialects.
  if (config && config.connection && config.connection.host) {
    config.connection.server = config.connection.host;
  }
  Client.call(this, config);
}
inherits(Client_MSSQL, Client);

assign(Client_MSSQL.prototype, {
  dialect: "mssql",

  driverName: "mssql",

  _driver() {
    return tedious;
  },

  formatter() {
    return new MSSQL_Formatter(this, ...arguments);
  },

  transaction() {
    return new Transaction(this, ...arguments);
  },

  queryCompiler() {
    return new QueryCompiler(this, ...arguments);
  },

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  },

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  },

  wrapIdentifierImpl(value) {
    return value !== "*" ? `[${value.replace(/\[/g, "[")}]` : "*";
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new Promise((resolve, reject) => {
      const config = Object.assign({}, { 
        server: this.config.connection.host,
        userName: this.config.connection.user,
        options: {
          useColumnNames: true,
        }
      }, this.config.connection);

      const connection = new tedious.Connection(config);
      debug("connection::connection new connection requested");

      connection.once("connect", err => {
        if (err) {
          debug("connection::connect error: %s", err.message);
          return reject(err);
        }

        debug("connection::connect connected to server");

        connection.connected = true;
        connection.on("error", e => {
          debug("connection::error message=%s", err.message);
          connection.__knex__disposed = e;
        });

        connection.once("end", () => {
          connection.connected = false;
          connection.__knex__disposed = "Connection to server was terminated.";
          debug("connection::end connection ended.");
        });

        return resolve(connection);
      });
    });
  },

  validateConnection(connection) {
    return connection && connection.connected;
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection) {
    debug("connection::destroy");
    return new Promise((resolve, reject) => {
      connection.once('end', () => {
        resolve();
      });

      connection.close();
    });
  },

  // Position the bindings for the query.
  positionBindings(sql) {
    let questionCount = -1;
    return sql.replace(/\?/g, function() {
      questionCount += 1;
      return `@p${questionCount}`;
    });
  },

  // Grab a connection, run the query via the MSSQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream(connection, obj, stream, options) {
    options = options || {};
    if (!obj || typeof obj === "string") obj = { sql: obj };
    return new Promise((resolver, rejecter) => {
      stream.on("error", err => {
        rejecter(err);
      });
      stream.on("end", resolver);
      const { sql } = obj;
      if (!sql) return resolver();
      const req = (connection.tx_ || connection).request();
      //req.verbose = true;
      req.multiple = true;
      req.stream = true;
      if (obj.bindings) {
        for (let i = 0; i < obj.bindings.length; i++) {
          this._setReqInput(req, i, obj.bindings[i]);
        }
      }
      req.pipe(stream);
      req.query(sql);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _queryOld(connection, obj) {
    const client = this;
    if (!obj || typeof obj === "string") obj = { sql: obj };
    return new Promise((resolver, rejecter) => {
      const { sql } = obj;
      if (!sql) return resolver();
      const req = (connection.tx_ || connection).request();
      // req.verbose = true;
      req.multiple = true;
      if (obj.bindings) {
        for (let i = 0; i < obj.bindings.length; i++) {
          const binding = obj.bindings[i];
          const type = client._typeForBinding(binding);

          client._setReqInput(req, i, binding, type);
        }
      }
      req.query(sql, (err, recordset) => {
        if (err) {
          return rejecter(err);
        }
        obj.response = recordset.recordsets[0];
        resolver(obj);
      });
    });
  },

  _query(connection, query) {
    const sql = typeof query === "string" ? query : query.sql;

    return new Promise((resolve, reject) => {
      const request = new tedious.Request(sql, (err, rowCount) => {
        if (err) {
          debug("request::error message=%s", err.message);
          return reject(err);
        }

        if (!query.response) {
          query.response = new Array(rowCount);
        }
        debug("request::callback rowCount=%d", rowCount);
        resolve(query);
      });

      request.on('prepared', () => {
        debug("request %s::request prepared", this.id);
      });

      request.on("row", row => {
        debug("request::row");
        if (!query.response) {
          query.response = [];
        }

        query.response.push(mapValues(row, 'value'));
      });

      request.on("done", (rowCount, more) => {
        debug("request::done rowCount=%d more=%s", rowCount, more);
      });
      
      request.on("doneProc", (rowCount, more) => {
        debug("request::doneProc id=%s rowCount=%d more=%s", request.id, rowCount, more);
      });

      request.on("doneInProc", (rowCount, more) => {
        debug("request::doneInProc id=%s rowCount=%d more=%s", request.id, rowCount, more);
      });

      request.on('requestCompleted', () => {
        debug("request::completed id=%s", request.id);
      });

      if (Array.isArray(query.bindings)) {
        for (let i = 0; i < query.bindings.length; i++) {
          const binding = query.bindings[i];
          const type = this._typeForBinding(binding);

          this._setReqInput(request, i, binding, type);
          debug("request::binding pos=%d type=%s value=%s", i, type.name, binding);
        }
      }

      connection.execSql(request);
      debug("connection::query executing query");
    });
  },

  // sets a request input parameter. Detects bigints and decimals and sets type appropriately.
  _setReqInput(req, i, binding, type = tedious.TYPES.NVarChar) {
    const tediousType = this._typeForBinding(binding);
    const bindingName = "p".concat(i);
    let scale;

    if (typeof binding == "number") {
      if (binding % 1 !== 0) {
        scale = this._scaleForBinding(binding);
      }
    }

    req.addParameter(bindingName, tediousType, binding, scale);
  },

  _scaleForBinding(binding) {
    if (binding % 1 === 0) {
      throw new Error(`The binding value ${binding} must be a decimal number.`);
    }

    return { scale: 10 };
  },

  _typeForBinding(binding) {
    switch (typeof binding) {
      case "string":
        return tedious.TYPES.NVarChar;
      case "boolean":
        return tedious.TYPES.Bit;
      case "number": {
        if (binding % 1 !== 0) {
          return tedious.TYPES.Decimal;
        }

        if (binding < SQL_INT4.MIN || binding > SQL_INT4.MAX) {
          if (binding < SQL_BIGINT_SAFE.MIN || binding > SQL_BIGINT_SAFE.MAX) {
            throw new Error(
              `Bigint must be safe integer or must be passed as string, saw ${binding}`
            );
          }

          return tedious.TYPES.BigInt;
        }

        return tedious.TYPES.Int;
      }
      default: {
        if (binding === null) {
          return tedious.TYPES.Null;
        }

        if (binding instanceof Date) {
          return tedious.TYPES.DateTime;
        }

        return tedious.TYPES.NVarChar;
      }
    }
  },

  // Process the response as returned from the query.
  processResponse(obj, runner) {
    if (obj == null) return;
    const { response, method } = obj;
    if (obj.output) return obj.output.call(runner, response);

    if (!response || !response.length) {
      return;
    }

    switch (method) {
      case "select":
      case "pluck":
      case "first":
        if (method === "pluck") return map(response, obj.pluck);
        return method === "first" ? mapValues(response[0], 'value') : response;
      case "insert":
      case "del":
      case "update":
      case "counter":
        if (obj.returning) {
          if (obj.returning === "@@rowcount") {
            return response[0][""];
          }

          if (
            (isArray(obj.returning) && obj.returning.length > 1) ||
            obj.returning[0] === "*"
          ) {
            return response;
          }
          // return an array with values if only one returning value was specified
          return flatten(map(response, values));
        }
        return response;
      default:
        return response;
    }
  }
});

class MSSQL_Formatter extends Formatter {
  // Accepts a string or array of columns to wrap as appropriate.
  columnizeWithPrefix(prefix, target) {
    const columns = typeof target === "string" ? [target] : target;
    let str = "",
      i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ", ";
      str += prefix + this.wrap(columns[i]);
    }
    return str;
  }
}

export default Client_MSSQL;
