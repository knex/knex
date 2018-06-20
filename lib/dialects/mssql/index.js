"use strict";

exports.__esModule = true;

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _setImmediate2 = require("babel-runtime/core-js/set-immediate");

var _setImmediate3 = _interopRequireDefault(_setImmediate2);

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _lodash = require("lodash");

var _inherits4 = require("inherits");

var _inherits5 = _interopRequireDefault(_inherits4);

var _client = require("../../client");

var _client2 = _interopRequireDefault(_client);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _formatter = require("../../formatter");

var _formatter2 = _interopRequireDefault(_formatter);

var _transaction = require("./transaction");

var _transaction2 = _interopRequireDefault(_transaction);

var _compiler = require("./query/compiler");

var _compiler2 = _interopRequireDefault(_compiler);

var _compiler3 = require("./schema/compiler");

var _compiler4 = _interopRequireDefault(_compiler3);

var _tablecompiler = require("./schema/tablecompiler");

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _columncompiler = require("./schema/columncompiler");

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _tedious = require("tedious");

var tedious = _interopRequireWildcard(_tedious);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require("debug")("knex:mssql"); // MSSQL Client
// -------
var isArray = Array.isArray;


var SQL_INT4 = { MIN: -2147483648, MAX: 2147483647 };
var SQL_BIGINT_SAFE = { MIN: -9007199254740991, MAX: 9007199254740991 };

// Always initialize with the "QueryBuilder" and "QueryCompiler" objects, which
// extend the base 'lib/query/builder' and 'lib/query/compiler', respectively.
function Client_MSSQL(config) {
  // #1235 mssql module wants 'server', not 'host'. This is to enforce the same
  // options object across all dialects.
  if (config && config.connection && config.connection.host) {
    config.connection.server = config.connection.host;
  }
  _client2.default.call(this, config);
}
(0, _inherits5.default)(Client_MSSQL, _client2.default);

(0, _lodash.assign)(Client_MSSQL.prototype, {
  requestQueue: [],

  dialect: "mssql",

  driverName: "tedious",

  _driver: function _driver() {
    return tedious;
  },
  formatter: function formatter() {
    return new (Function.prototype.bind.apply(MSSQL_Formatter, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  transaction: function transaction() {
    return new (Function.prototype.bind.apply(_transaction2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  queryCompiler: function queryCompiler() {
    return new (Function.prototype.bind.apply(_compiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  schemaCompiler: function schemaCompiler() {
    return new (Function.prototype.bind.apply(_compiler4.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  tableCompiler: function tableCompiler() {
    return new (Function.prototype.bind.apply(_tablecompiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  columnCompiler: function columnCompiler() {
    return new (Function.prototype.bind.apply(_columncompiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  wrapIdentifierImpl: function wrapIdentifierImpl(value) {
    return value !== "*" ? "[" + value.replace(/\[/g, "[") + "]" : "*";
  },


  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var _this = this;

    return new _bluebird2.default(function (resolve, reject) {
      var config = (0, _assign2.default)({}, {
        server: _this.config.connection.host,
        userName: _this.config.connection.user,
        options: {}
      }, _this.config.connection);

      (0, _assign2.default)(config.options, { database: _this.config.connection.database }, _this.config.connection.options);

      var connection = new tedious.Connection(config);
      debug("connection::connection new connection requested");

      connection.once("connect", function (err) {
        if (err) {
          debug("connection::connect error: %s", err.message);
          return reject(err);
        }

        debug("connection::connect connected to server");

        connection.connected = true;
        connection.on("error", function (e) {
          debug("connection::error message=%s", e.message);
          connection.__knex__disposed = e;
          connection.connected = false;
        });

        connection.once("end", function () {
          connection.connected = false;
          connection.__knex__disposed = "Connection to server was terminated.";
          debug("connection::end connection ended.");
        });

        return resolve(connection);
      });
    });
  },
  validateConnection: function validateConnection(connection) {
    return connection && connection.connected;
  },


  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection) {
    debug("connection::destroy");
    return new _bluebird2.default(function (resolve, reject) {
      connection.once("end", function () {
        resolve();
      });

      connection.close();
    });
  },


  // Position the bindings for the query.
  positionBindings: function positionBindings(sql) {
    var questionCount = 0;
    return sql.replace(/\?/g, function () {
      return "@p" + questionCount++;
    });
  },
  _chomp: function _chomp(connection) {
    var _this2 = this;

    if (connection.state.name === "LoggedIn") {
      var nextRequest = this.requestQueue.pop();
      if (nextRequest) {
        debug("connection::query executing query, %d more in queue", this.requestQueue.length);

        nextRequest.once("requestCompleted", function () {
          (0, _setImmediate3.default)(function () {
            return _this2._chomp(connection);
          });
        });

        connection.execSql(nextRequest);
      }
    }
  },
  _enqueueRequest: function _enqueueRequest(request, connection) {
    this.requestQueue.push(request);
    this._chomp(connection);
  },
  _makeRequest: function _makeRequest(query, callback) {
    var _this3 = this;

    var sql = typeof query === "string" ? query : query.sql;
    var rowCount = 0;

    var request = new tedious.Request(sql, function (err, remoteRowCount) {
      if (err) {
        debug("request::error message=%s", err.message);
        return callback(err);
      }

      rowCount = remoteRowCount;
      debug("request::callback rowCount=%d", rowCount);
    });

    request.on("prepared", function () {
      debug("request %s::request prepared", _this3.id);
    });

    request.on("done", function (rowCount, more) {
      debug("request::done rowCount=%d more=%s", rowCount, more);
    });

    request.on("doneProc", function (rowCount, more) {
      debug("request::doneProc id=%s rowCount=%d more=%s", request.id, rowCount, more);
    });

    request.on("doneInProc", function (rowCount, more) {
      debug("request::doneInProc id=%s rowCount=%d more=%s", request.id, rowCount, more);
    });

    request.once("requestCompleted", function () {
      debug("request::completed id=%s", request.id);
      return callback(null, rowCount);
    });

    request.on("error", function (err) {
      debug("request::error id=%s message=%s", request.id, err.message);
      return callback(err);
    });

    return request;
  },
  _stream: function _stream(connection, query, stream) {
    var _this4 = this;

    return new _bluebird2.default(function (resolve, reject) {
      var request = _this4._makeRequest(query, function (err) {
        if (err) {
          return reject(err);
        }

        resolve();
      });

      request.on("row", function (row) {
        return stream.push((0, _lodash.mapValues)(row, "value"));
      });
      request.on("error", function (err) {
        return stream.emit("error", err);
      });
      request.once("requestCompleted", function () {
        return stream.push(null /* EOF */);
      });

      _this4._assignBindings(request, query.bindings);
      _this4._enqueueRequest(request, connection);
    });
  },
  _assignBindings: function _assignBindings(request, bindings) {
    if (Array.isArray(bindings)) {
      for (var i = 0; i < bindings.length; i++) {
        var binding = bindings[i];
        this._setReqInput(request, i, binding);
      }
    }
  },


  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, query) {
    var _this5 = this;

    return new _bluebird2.default(function (resolve, reject) {
      var rows = [];
      var request = _this5._makeRequest(query, function (err, count) {
        if (err) {
          return reject(err);
        }

        query.response = rows;
        query.response.rowCount = count;

        resolve(query);
      });

      request.on("row", function (row) {
        debug("request::row");
        rows.push(row);
      });

      _this5._assignBindings(request, query.bindings);
      _this5._enqueueRequest(request, connection);
    });
  },


  // sets a request input parameter. Detects bigints and decimals and sets type appropriately.
  _setReqInput: function _setReqInput(req, i, binding) {
    var tediousType = this._typeForBinding(binding);
    var bindingName = "p".concat(i);
    var options = void 0;

    if (typeof binding === "number" && binding % 1 !== 0) {
      options = this._scaleForBinding(binding);
    }

    debug("request::binding pos=%d type=%s value=%s", i, tediousType.name, binding);
    req.addParameter(bindingName, tediousType, binding, options);
  },
  _scaleForBinding: function _scaleForBinding(binding) {
    if (binding % 1 === 0) {
      throw new Error("The binding value " + binding + " must be a decimal number.");
    }

    return { scale: 10 };
  },
  _typeForBinding: function _typeForBinding(binding) {
    switch (typeof binding === "undefined" ? "undefined" : (0, _typeof3.default)(binding)) {
      case "string":
        return tedious.TYPES.NVarChar;
      case "boolean":
        return tedious.TYPES.Bit;
      case "number":
        {
          if (binding % 1 !== 0) {
            return tedious.TYPES.Decimal;
          }

          if (binding < SQL_INT4.MIN || binding > SQL_INT4.MAX) {
            if (binding < SQL_BIGINT_SAFE.MIN || binding > SQL_BIGINT_SAFE.MAX) {
              throw new Error("Bigint must be safe integer or must be passed as string, saw " + binding);
            }

            return tedious.TYPES.BigInt;
          }

          return tedious.TYPES.Int;
        }
      default:
        {
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
  processResponse: function processResponse(query, runner) {
    if (query == null) return;

    var response = query.response;
    var method = query.method;
    var _response = response,
        rowCount = _response.rowCount;


    if (query.output) {
      return query.output.call(runner, response);
    }

    response = response.map(function (row) {
      return row.reduce(function (columns, r) {
        var colName = r.metadata.colName;

        if (columns.hasOwnProperty(colName)) {
          if (!Array.isArray(columns[colName])) {
            columns[colName] = [columns[colName]];
          }

          columns[colName].push(r.value);
        } else {
          columns[colName] = r.value;
        }

        return columns;
      }, {});
    });

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
        if (method === "pluck") return (0, _lodash.map)(response, query.pluck);
        return method === "first" ? response[0] : response;
      case "insert":
      case "del":
      case "update":
      case "counter":
        if (query.returning) {
          if (query.returning === "@@rowcount") {
            return rowCount || 0;
          }

          if (isArray(query.returning) && query.returning.length > 1 || query.returning[0] === "*") {
            return response;
          }
          // return an array with values if only one returning value was specified
          return (0, _lodash.flatten)((0, _lodash.map)(response, _lodash.values));
        }
        return response;
      default:
        return response;
    }
  }
});

var MSSQL_Formatter = function (_Formatter) {
  (0, _inherits3.default)(MSSQL_Formatter, _Formatter);

  function MSSQL_Formatter() {
    (0, _classCallCheck3.default)(this, MSSQL_Formatter);
    return (0, _possibleConstructorReturn3.default)(this, _Formatter.apply(this, arguments));
  }

  // Accepts a string or array of columns to wrap as appropriate.
  MSSQL_Formatter.prototype.columnizeWithPrefix = function columnizeWithPrefix(prefix, target) {
    var columns = typeof target === "string" ? [target] : target;
    var str = "",
        i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ", ";
      str += prefix + this.wrap(columns[i]);
    }
    return str;
  };

  return MSSQL_Formatter;
}(_formatter2.default);

exports.default = Client_MSSQL;
module.exports = exports["default"];