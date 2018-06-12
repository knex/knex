'use strict';

exports.__esModule = true;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _lodash = require('lodash');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _client = require('../../client');

var _client2 = _interopRequireDefault(_client);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _compiler = require('./query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _columncompiler = require('./schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _tablecompiler = require('./schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _compiler3 = require('./schema/compiler');

var _compiler4 = _interopRequireDefault(_compiler3);

var _string = require('../../query/string');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Client_PG(config) {
  _client2.default.apply(this, arguments);
  if (config.returning) {
    this.defaultReturning = config.returning;
  }

  if (config.searchPath) {
    this.searchPath = config.searchPath;
  }

  if (config.version) {
    this.version = config.version;
  }
}
// PostgreSQL
// -------

(0, _inherits2.default)(Client_PG, _client2.default);

(0, _lodash.assign)(Client_PG.prototype, {
  queryCompiler: function queryCompiler() {
    return new (Function.prototype.bind.apply(_compiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  columnCompiler: function columnCompiler() {
    return new (Function.prototype.bind.apply(_columncompiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  schemaCompiler: function schemaCompiler() {
    return new (Function.prototype.bind.apply(_compiler4.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  tableCompiler: function tableCompiler() {
    return new (Function.prototype.bind.apply(_tablecompiler2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },


  dialect: 'postgresql',

  driverName: 'pg',

  _driver: function _driver() {
    return require('pg');
  },


  _escapeBinding: (0, _string.makeEscape)({
    escapeArray: function escapeArray(val, esc) {
      return esc(arrayString(val, esc));
    },
    escapeString: function escapeString(str) {
      var hasBackslash = false;
      var escaped = '\'';
      for (var i = 0; i < str.length; i++) {
        var c = str[i];
        if (c === '\'') {
          escaped += c + c;
        } else if (c === '\\') {
          escaped += c + c;
          hasBackslash = true;
        } else {
          escaped += c;
        }
      }
      escaped += '\'';
      if (hasBackslash === true) {
        escaped = 'E' + escaped;
      }
      return escaped;
    },
    escapeObject: function escapeObject(val, prepareValue, timezone) {
      var seen = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

      if (val && typeof val.toPostgres === 'function') {
        seen = seen || [];
        if (seen.indexOf(val) !== -1) {
          throw new Error('circular reference detected while preparing "' + val + '" for query');
        }
        seen.push(val);
        return prepareValue(val.toPostgres(prepareValue), seen);
      }
      return (0, _stringify2.default)(val);
    }
  }),

  wrapIdentifierImpl: function wrapIdentifierImpl(value) {
    if (value === '*') return value;

    var arrayAccessor = '';
    var arrayAccessorMatch = value.match(/(.*?)(\[[0-9]+\])/);

    if (arrayAccessorMatch) {
      value = arrayAccessorMatch[1];
      arrayAccessor = arrayAccessorMatch[2];
    }

    return '"' + value.replace(/"/g, '""') + '"' + arrayAccessor;
  },


  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    return new _bluebird2.default(function (resolver, rejecter) {
      var connection = new client.driver.Client(client.connectionSettings);
      connection.connect(function (err, connection) {
        if (err) {
          return rejecter(err);
        }
        connection.on('error', function (err) {
          connection.__knex__disposed = err;
        });
        connection.on('end', function (err) {
          connection.__knex__disposed = err || 'Connection ended unexpectedly';
        });
        if (!client.version) {
          return client.checkVersion(connection).then(function (version) {
            client.version = version;
            resolver(connection);
          });
        }
        resolver(connection);
      });
    }).tap(function setSearchPath(connection) {
      return client.setSchemaSearchPath(connection);
    });
  },


  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection) {
    return _bluebird2.default.fromCallback(connection.end.bind(connection));
  },


  // In PostgreSQL, we need to do a version check to do some feature
  // checking on the database.
  checkVersion: function checkVersion(connection) {
    return new _bluebird2.default(function (resolver, rejecter) {
      connection.query('select version();', function (err, resp) {
        if (err) return rejecter(err);
        resolver(/^PostgreSQL (.*?)( |$)/.exec(resp.rows[0].version)[1]);
      });
    });
  },


  // Position the bindings for the query. The escape sequence for question mark
  // is \? (e.g. knex.raw("\\?") since javascript requires '\' to be escaped too...)
  positionBindings: function positionBindings(sql) {
    var questionCount = 0;
    return sql.replace(/(\\*)(\?)/g, function (match, escapes) {
      if (escapes.length % 2) {
        return '?';
      } else {
        questionCount++;
        return '$' + questionCount;
      }
    });
  },
  setSchemaSearchPath: function setSchemaSearchPath(connection, searchPath) {
    var path = searchPath || this.searchPath;

    if (!path) return _bluebird2.default.resolve(true);

    if (!(0, _lodash.isArray)(path) && !(0, _lodash.isString)(path)) {
      throw new TypeError('knex: Expected searchPath to be Array/String, got: ' + (typeof path === 'undefined' ? 'undefined' : (0, _typeof3.default)(path)));
    }

    if ((0, _lodash.isString)(path)) {
      if ((0, _lodash.includes)(path, ',')) {
        var parts = path.split(',');
        var arraySyntax = '[' + (0, _lodash.map)(parts, function (searchPath) {
          return '\'' + searchPath + '\'';
        }).join(', ') + ']';
        this.logger.warn('Detected comma in searchPath "' + path + '".' + ('If you are trying to specify multiple schemas, use Array syntax: ' + arraySyntax));
      }
      path = [path];
    }

    path = (0, _lodash.map)(path, function (schemaName) {
      return '"' + schemaName + '"';
    }).join(',');

    return new _bluebird2.default(function (resolver, rejecter) {
      connection.query('set search_path to ' + path, function (err) {
        if (err) return rejecter(err);
        resolver(true);
      });
    });
  },
  _stream: function _stream(connection, obj, stream, options) {
    var PGQueryStream = process.browser ? undefined : require('pg-query-stream');
    var sql = obj.sql;
    return new _bluebird2.default(function (resolver, rejecter) {
      var queryStream = connection.query(new PGQueryStream(sql, obj.bindings, options));
      queryStream.on('error', function (error) {
        stream.emit('error', error);
      });
      // 'error' is not propagated by .pipe, but it breaks the pipe
      stream.on('error', function (error) {
        // Ensure the queryStream is closed so the connection can be released.
        queryStream.close();
        rejecter(error);
      });
      // 'end' IS propagated by .pipe, by default
      stream.on('end', resolver);
      queryStream.pipe(stream);
    });
  },


  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    var sql = obj.sql;
    if (obj.options) sql = (0, _lodash.extend)({ text: sql }, obj.options);
    return new _bluebird2.default(function (resolver, rejecter) {
      connection.query(sql, obj.bindings, function (err, response) {
        if (err) return rejecter(err);
        obj.response = response;
        resolver(obj);
      });
    });
  },


  // Ensures the response is returned in the same format as other clients.
  processResponse: function processResponse(obj, runner) {
    var resp = obj.response;
    if (obj.output) return obj.output.call(runner, resp);
    if (obj.method === 'raw') return resp;
    var returning = obj.returning;

    if (resp.command === 'SELECT') {
      if (obj.method === 'first') return resp.rows[0];
      if (obj.method === 'pluck') return (0, _lodash.map)(resp.rows, obj.pluck);
      return resp.rows;
    }
    if (returning) {
      var returns = [];
      for (var i = 0, l = resp.rows.length; i < l; i++) {
        var row = resp.rows[i];
        if (returning === '*' || Array.isArray(returning)) {
          returns[i] = row;
        } else {
          // Pluck the only column in the row.
          returns[i] = row[(0, _keys2.default)(row)[0]];
        }
      }
      return returns;
    }
    if (resp.command === 'UPDATE' || resp.command === 'DELETE') {
      return resp.rowCount;
    }
    return resp;
  }
});

function arrayString(arr, esc) {
  var result = '{';
  for (var i = 0; i < arr.length; i++) {
    if (i > 0) result += ',';
    var val = arr[i];
    if (val === null || typeof val === 'undefined') {
      result += 'NULL';
    } else if (Array.isArray(val)) {
      result += arrayString(val, esc);
    } else if (typeof val === 'number') {
      result += val;
    } else {
      result += (0, _stringify2.default)(typeof val === 'string' ? val : esc(val));
    }
  }
  return result + '}';
}

exports.default = Client_PG;
module.exports = exports['default'];