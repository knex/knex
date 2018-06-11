// MSSQL Client
// -------
import { assign, map, flatten, values, mapValues, chain } from "lodash";
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
  requestQueue: [],

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
      const config = Object.assign(
        {},
        {
          server: this.config.connection.host,
          userName: this.config.connection.user,
          options: {}
        },
        this.config.connection
      );

      Object.assign(
        config.options,
        { database: this.config.connection.database },
        this.config.connection.options
      );

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
          connection.connected = false;
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
      connection.once("end", () => {
        resolve();
      });

      connection.close();
    });
  },

  // Position the bindings for the query.
  positionBindings(sql) {
    let questionCount = 0;
    return sql.replace(/\?/g, function() {
      return `@p${questionCount++}`;
    });
  },

  _chomp(connection) {
    if (connection.state.name === "LoggedIn") {
      const nextRequest = this.requestQueue.pop();
      if (nextRequest) {
        debug(
          "connection::query executing query, %d more in queue",
          this.requestQueue.length
        );

        nextRequest.once("requestCompleted", () => {
          setImmediate(() => this._chomp(connection));
        });

        connection.execSql(nextRequest);
      }
    }
  },

  _enqueueRequest(request, connection) {
    this.requestQueue.push(request);
    this._chomp(connection);
  },

  _makeRequest(query, callback) {
    const sql = typeof query === "string" ? query : query.sql;
    let rowCount = 0;

    const request = new tedious.Request(sql, (err, remoteRowCount) => {
      if (err) {
        debug("request::error message=%s", err.message);
        return callback(err);
      }

      rowCount = remoteRowCount;
      debug("request::callback rowCount=%d", rowCount);
    });

    request.on("prepared", () => {
      debug("request %s::request prepared", this.id);
    });

    request.on("done", (rowCount, more) => {
      debug("request::done rowCount=%d more=%s", rowCount, more);
    });

    request.on("doneProc", (rowCount, more) => {
      debug(
        "request::doneProc id=%s rowCount=%d more=%s",
        request.id,
        rowCount,
        more
      );
    });

    request.on("doneInProc", (rowCount, more) => {
      debug(
        "request::doneInProc id=%s rowCount=%d more=%s",
        request.id,
        rowCount,
        more
      );
    });

    request.once("requestCompleted", () => {
      debug("request::completed id=%s", request.id);
      return callback(null, rowCount);
    });

    request.on("error", err => {
      debug("request::error id=%s message=%s", request.id, err.message);
      return callback(err);
    });

    return request;
  },

  _stream(connection, query, stream) {
    return new Promise((resolve, reject) => {
      const request = this._makeRequest(query, err => {
        if (err) {
          return reject(err);
        }

        resolve();
      });

      request.on("row", row => stream.push(mapValues(row, "value")));
      request.on("error", err => stream.emit("error", err));
      request.once("requestCompleted", () => stream.push(null /* EOF */));

      this._assignBindings(request, query.bindings);
      this._enqueueRequest(request, connection);
    });
  },

  _assignBindings(request, bindings) {
    if (Array.isArray(bindings)) {
      for (let i = 0; i < bindings.length; i++) {
        const binding = bindings[i];
        this._setReqInput(request, i, binding);
      }
    }
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, query) {
    return new Promise((resolve, reject) => {
      const rows = [];
      const request = this._makeRequest(query, (err, count) => {
        if (err) {
          return reject(err);
        }

        query.response = rows;
        query.response.rowCount = count;

        resolve(query);
      });

      request.on("row", row => {
        debug("request::row");
        rows.push(row);
      });

      this._assignBindings(request, query.bindings);
      this._enqueueRequest(request, connection);
    });
  },

  // sets a request input parameter. Detects bigints and decimals and sets type appropriately.
  _setReqInput(req, i, binding) {
    const tediousType = this._typeForBinding(binding);
    const bindingName = "p".concat(i);
    let options;

    if (typeof binding === "number" && binding % 1 !== 0) {
      options = this._scaleForBinding(binding);
    }

    debug(
      "request::binding pos=%d type=%s value=%s",
      i,
      tediousType.name,
      binding
    );
    req.addParameter(bindingName, tediousType, binding, options);
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
        // if (binding === null || typeof binding === 'undefined') {
        //   return tedious.TYPES.Null;
        // }

        if (binding instanceof Date) {
          return tedious.TYPES.DateTime;
        }

        return tedious.TYPES.NVarChar;
      }
    }
  },

  // Process the response as returned from the query.
  processResponse(query, runner) {
    if (query == null) return;

    let { response } = query;
    const { method } = query;
    const { rowCount } = response;

    if (query.output) {
      return query.output.call(runner, response);
    }

    response = response.map(row => row.reduce((columns, r) => {
      const colName = r.metadata.colName;

      if (columns.hasOwnProperty(colName)) {
        if (!Array.isArray(columns[colName])) {
          columns[colName] = [columns[colName]];
        }
        
        columns[colName].push(r.value);
      } else {
        columns[colName] = r.value;
      }

      return columns;
    }, {}));

    // response = response.map(r =>
    //   chain(r)
    //     .keyBy(k => k.metadata.colName)
    //     .mapValues("value")
    //     .value()
    // );

    switch (method) {
      case "select":
      case "pluck":
      case "first":
        if (method === "pluck") return map(response, query.pluck);
        return method === "first" ? response[0] : response;
      case "insert":
      case "del":
      case "update":
      case "counter":
        if (query.returning) {
          if (query.returning === "@@rowcount") {
            return rowCount || 0;
          }

          if (
            (isArray(query.returning) && query.returning.length > 1) ||
            query.returning[0] === "*"
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
