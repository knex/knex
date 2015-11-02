(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("lodash"), require("bluebird"));
	else if(typeof define === 'function' && define.amd)
		define(["lodash", "bluebird"], factory);
	else if(typeof exports === 'object')
		exports["Knex"] = factory(require("lodash"), require("bluebird"));
	else
		root["Knex"] = factory(root["_"], root["Promise"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_11__, __WEBPACK_EXTERNAL_MODULE_45__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	var Raw = __webpack_require__(1);
	var warn = __webpack_require__(2).warn;
	var Client = __webpack_require__(3);

	var makeClient = __webpack_require__(4);
	var makeKnex = __webpack_require__(5);
	var parseConnection = __webpack_require__(6);
	var assign = __webpack_require__(28);

	function Knex(config) {
	  if (typeof config === 'string') {
	    return new Knex(assign(parseConnection(config), arguments[2]));
	  }
	  var Dialect;
	  if (arguments.length === 0 || !config.client && !config.dialect) {
	    Dialect = makeClient(Client);
	  } else {
	    var clientName = config.client || config.dialect;
	    Dialect = makeClient(__webpack_require__(7)("./" + (aliases[clientName] || clientName) + '/index.js'));
	  }
	  if (typeof config.connection === 'string') {
	    config = assign({}, config, { connection: parseConnection(config.connection).connection });
	  }
	  return makeKnex(new Dialect(config));
	}

	// Expose Client on the main Knex namespace.
	Knex.Client = Client;

	// Run a "raw" query, though we can't do anything with it other than put
	// it in a query statement.
	Knex.raw = function (sql, bindings) {
	  return new Raw({}).set(sql, bindings);
	};

	// Create a new "knex" instance with the appropriate configured client.
	Knex.initialize = function (config) {
	  warn('knex.initialize is deprecated, pass your config object directly to the knex module');
	  return new Knex(config);
	};

	// Bluebird
	Knex.Promise = __webpack_require__(8);

	// The client names we'll allow in the `{name: lib}` pairing.
	var aliases = {
	  'mariadb': 'maria',
	  'mariasql': 'maria',
	  'pg': 'postgres',
	  'postgresql': 'postgres',
	  'sqlite': 'sqlite3'
	};

	// Doing this ensures Browserify works. Still need to figure out
	// the best way to do some of this.
	if (process.browser) {
	  __webpack_require__(9);
	}

	module.exports = Knex;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	
	// Raw
	// -------
	'use strict';

	var inherits = __webpack_require__(46);
	var EventEmitter = __webpack_require__(41).EventEmitter;
	var assign = __webpack_require__(28);
	var reduce = __webpack_require__(29);

	function Raw(client) {
	  this.client = client;

	  this.sql = '';
	  this.bindings = [];
	  this._cached = undefined;

	  // Todo: Deprecate
	  this._wrappedBefore = undefined;
	  this._wrappedAfter = undefined;
	  this._debug = client && client.options && client.options.debug;
	}
	inherits(Raw, EventEmitter);

	assign(Raw.prototype, {

	  set: function set(sql, bindings) {
	    this._cached = undefined;
	    this.sql = sql;
	    this.bindings = bindings;
	    return this;
	  },

	  // Wraps the current sql with `before` and `after`.
	  wrap: function wrap(before, after) {
	    this._cached = undefined;
	    this._wrappedBefore = before;
	    this._wrappedAfter = after;
	    return this;
	  },

	  // Calls `toString` on the Knex object.
	  toString: function toString() {
	    return this.toQuery();
	  },

	  // Returns the raw sql for the query.
	  toSQL: function toSQL() {
	    if (this._cached) return this._cached;
	    if (Array.isArray(this.bindings)) {
	      this._cached = replaceRawArrBindings(this);
	    } else if (this.bindings && typeof this.bindings === 'object') {
	      this._cached = replaceKeyBindings(this);
	    } else {
	      this._cached = {
	        method: 'raw',
	        sql: this.sql,
	        bindings: this.bindings
	      };
	    }
	    if (this._wrappedBefore) {
	      this._cached.sql = this._wrappedBefore + this._cached.sql;
	    }
	    if (this._wrappedAfter) {
	      this._cached.sql = this._cached.sql + this._wrappedAfter;
	    }
	    this._cached.options = reduce(this._options, assign, {});
	    return this._cached;
	  }

	});

	function replaceRawArrBindings(raw) {
	  var expectedBindings = raw.bindings.length;
	  var values = raw.bindings;
	  var client = raw.client;
	  var index = 0;
	  var bindings = [];

	  var sql = raw.sql.replace(/\?\??/g, function (match) {
	    var value = values[index++];

	    if (value && typeof value.toSQL === 'function') {
	      var bindingSQL = value.toSQL();
	      if (bindingSQL.bindings !== undefined) {
	        bindings = bindings.concat(bindingSQL.bindings);
	      }
	      return bindingSQL.sql;
	    }

	    if (match === '??') {
	      return client.wrapIdentifier(value);
	    }
	    bindings.push(value);
	    return '?';
	  });

	  if (expectedBindings !== index) {
	    throw new Error('Expected ' + expectedBindings + ' bindings, saw ' + index);
	  }

	  return {
	    method: 'raw',
	    sql: sql,
	    bindings: bindings
	  };
	}

	function replaceKeyBindings(raw) {
	  var values = raw.bindings;
	  var client = raw.client;
	  var sql = raw.sql,
	      bindings = [];

	  var regex = new RegExp('\\s(\\:\\w+\\:?)', 'g');
	  sql = raw.sql.replace(regex, function (full, key) {
	    var isIdentifier = key[key.length - 1] === ':';
	    var value = isIdentifier ? values[key.slice(1, -1)] : values[key.slice(1)];
	    if (value === undefined) return '';
	    if (value && typeof value.toSQL === 'function') {
	      var bindingSQL = value.toSQL();
	      if (bindingSQL.bindings !== undefined) {
	        bindings = bindings.concat(bindingSQL.bindings);
	      }
	      return full.replace(key, bindingSQL.sql);
	    }
	    if (isIdentifier) {
	      return full.replace(key, client.wrapIdentifier(value));
	    }
	    bindings.push(value);
	    return full.replace(key, '?');
	  });

	  return {
	    method: 'raw',
	    sql: sql,
	    bindings: bindings
	  };
	}

	// Allow the `Raw` object to be utilized with full access to the relevant
	// promise API.
	__webpack_require__(12)(Raw);

	module.exports = Raw;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	var _ = __webpack_require__(11);
	var chalk = __webpack_require__(42);

	var helpers = {

	  // Pick off the attributes from only the current layer of the object.
	  skim: function skim(data) {
	    return _.map(data, function (obj) {
	      return _.pick(obj, _.keys(obj));
	    });
	  },

	  // Check if the first argument is an array, otherwise
	  // uses all arguments as an array.
	  normalizeArr: function normalizeArr() {
	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }
	    if (Array.isArray(args[0])) {
	      return args[0];
	    }
	    return args;
	  },

	  error: function error(msg) {
	    console.log(chalk.red('Knex:Error ' + msg));
	  },

	  // Used to signify deprecated functionality.
	  deprecate: function deprecate(method, alternate) {
	    helpers.warn(method + ' is deprecated, please use ' + alternate);
	  },

	  // Used to warn about incorrect use, without error'ing
	  warn: function warn(msg) {
	    console.log(chalk.yellow("Knex:warning - " + msg));
	  },

	  exit: function exit(msg) {
	    console.log(chalk.red(msg));
	    process.exit();
	  }

	};

	module.exports = helpers;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Promise = __webpack_require__(8);
	var helpers = __webpack_require__(2);

	var Raw = __webpack_require__(1);
	var Runner = __webpack_require__(13);
	var Formatter = __webpack_require__(14);
	var Transaction = __webpack_require__(15);

	var QueryBuilder = __webpack_require__(16);
	var QueryCompiler = __webpack_require__(17);

	var SchemaBuilder = __webpack_require__(18);
	var SchemaCompiler = __webpack_require__(19);
	var TableBuilder = __webpack_require__(20);
	var TableCompiler = __webpack_require__(21);
	var ColumnBuilder = __webpack_require__(22);
	var ColumnCompiler = __webpack_require__(23);

	var Pool2 = __webpack_require__(24);
	var inherits = __webpack_require__(46);
	var EventEmitter = __webpack_require__(41).EventEmitter;
	var SqlString = __webpack_require__(25);

	var assign = __webpack_require__(28);
	var uniqueId = __webpack_require__(30);
	var cloneDeep = __webpack_require__(31);
	var debug = __webpack_require__(47)('knex:client');
	var debugQuery = __webpack_require__(47)('knex:query');

	// The base client provides the general structure
	// for a dialect specific client object.
	function Client() {
	  var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	  this.config = config;
	  this.connectionSettings = cloneDeep(config.connection || {});
	  if (this.driverName && config.connection) {
	    this.initializeDriver();
	    if (!config.pool || config.pool && config.pool.max !== 0) {
	      this.initializePool(config);
	    }
	  }
	}
	inherits(Client, EventEmitter);

	assign(Client.prototype, {

	  Formatter: Formatter,

	  formatter: function formatter() {
	    return new this.Formatter(this);
	  },

	  QueryBuilder: QueryBuilder,

	  queryBuilder: function queryBuilder() {
	    return new this.QueryBuilder(this);
	  },

	  QueryCompiler: QueryCompiler,

	  queryCompiler: function queryCompiler(builder) {
	    return new this.QueryCompiler(this, builder);
	  },

	  SchemaBuilder: SchemaBuilder,

	  schemaBuilder: function schemaBuilder() {
	    return new this.SchemaBuilder(this);
	  },

	  SchemaCompiler: SchemaCompiler,

	  schemaCompiler: function schemaCompiler(builder) {
	    return new this.SchemaCompiler(this, builder);
	  },

	  TableBuilder: TableBuilder,

	  tableBuilder: function tableBuilder(type, tableName, fn) {
	    return new this.TableBuilder(this, type, tableName, fn);
	  },

	  TableCompiler: TableCompiler,

	  tableCompiler: function tableCompiler(tableBuilder) {
	    return new this.TableCompiler(this, tableBuilder);
	  },

	  ColumnBuilder: ColumnBuilder,

	  columnBuilder: function columnBuilder(tableBuilder, type, args) {
	    return new this.ColumnBuilder(this, tableBuilder, type, args);
	  },

	  ColumnCompiler: ColumnCompiler,

	  columnCompiler: function columnCompiler(tableBuilder, columnBuilder) {
	    return new this.ColumnCompiler(this, tableBuilder, columnBuilder);
	  },

	  Runner: Runner,

	  runner: function runner(connection) {
	    return new this.Runner(this, connection);
	  },

	  Transaction: Transaction,

	  transaction: function transaction(container, config, outerTx) {
	    return new this.Transaction(this, container, config, outerTx);
	  },

	  Raw: Raw,

	  raw: function raw() {
	    var raw = new this.Raw(this);
	    return raw.set.apply(raw, arguments);
	  },

	  query: function query(connection, obj) {
	    if (typeof obj === 'string') obj = { sql: obj };
	    this.emit('query', assign({ __knexUid: connection.__knexUid }, obj));
	    debugQuery(obj.sql);
	    return this._query.call(this, connection, obj)['catch'](function (err) {
	      err.message = SqlString.format(obj.sql, obj.bindings) + ' - ' + err.message;
	      throw err;
	    });
	  },

	  stream: function stream(connection, obj, _stream, options) {
	    if (typeof obj === 'string') obj = { sql: obj };
	    this.emit('query', assign({ __knexUid: connection.__knexUid }, obj));
	    debugQuery(obj.sql);
	    return this._stream.call(this, connection, obj, _stream, options);
	  },

	  wrapIdentifier: function wrapIdentifier(value) {
	    return value !== '*' ? '"' + value.replace(/"/g, '""') + '"' : '*';
	  },

	  initializeDriver: function initializeDriver() {
	    try {
	      this.driver = this._driver();
	    } catch (e) {
	      helpers.exit('Knex: run\n$ npm install ' + this.driverName + ' --save' + '\n' + e.stack);
	    }
	  },

	  Pool: Pool2,

	  initializePool: function initializePool(config) {
	    if (this.pool) this.destroy();
	    this.pool = new this.Pool(assign(this.poolDefaults(config.pool || {}), config.pool));
	    this.pool.on('error', function (err) {
	      helpers.error('Pool2 - ' + err);
	    });
	    this.pool.on('warn', function (msg) {
	      helpers.warn('Pool2 - ' + msg);
	    });
	  },

	  poolDefaults: function poolDefaults(poolConfig) {
	    var dispose,
	        client = this;
	    if (poolConfig.destroy) {
	      helpers.deprecate('config.pool.destroy', 'config.pool.dispose');
	      dispose = poolConfig.destroy;
	    }
	    return {
	      min: 2,
	      max: 10,
	      acquire: function acquire(callback) {
	        client.acquireRawConnection().tap(function (connection) {
	          connection.__knexUid = uniqueId('__knexUid');
	          if (poolConfig.afterCreate) {
	            return Promise.promisify(poolConfig.afterCreate)(connection);
	          }
	        }).nodeify(callback);
	      },
	      dispose: function dispose(connection, callback) {
	        if (poolConfig.beforeDestroy) {
	          poolConfig.beforeDestroy(connection, function () {
	            if (connection !== undefined) {
	              client.destroyRawConnection(connection, callback);
	            }
	          });
	        } else if (connection !== void 0) {
	          client.destroyRawConnection(connection, callback);
	        }
	      }
	    };
	  },

	  // Acquire a connection from the pool.
	  acquireConnection: function acquireConnection() {
	    var client = this;
	    return new Promise(function (resolver, rejecter) {
	      if (!client.pool) {
	        return rejecter(new Error('There is no pool defined on the current client'));
	      }
	      client.pool.acquire(function (err, connection) {
	        if (err) return rejecter(err);
	        debug('acquiring connection from pool: %s', connection.__knexUid);
	        resolver(connection);
	      });
	    });
	  },

	  // Releases a connection back to the connection pool,
	  // returning a promise resolved when the connection is released.
	  releaseConnection: function releaseConnection(connection) {
	    var pool = this.pool;
	    return new Promise(function (resolver) {
	      debug('releasing connection to pool: %s', connection.__knexUid);
	      pool.release(connection);
	      resolver();
	    });
	  },

	  // Destroy the current connection pool for the client.
	  destroy: function destroy(callback) {
	    var client = this;
	    var promise = new Promise(function (resolver) {
	      if (!client.pool) return resolver();
	      client.pool.end(function () {
	        client.pool = undefined;
	        resolver();
	      });
	    });
	    // Allow either a callback or promise interface for destruction.
	    if (typeof callback === 'function') {
	      promise.nodeify(callback);
	    } else {
	      return promise;
	    }
	  },

	  // Return the database being used by this client.
	  database: function database() {
	    return this.connectionSettings.database;
	  },

	  toString: function toString() {
	    return '[object KnexClient]';
	  }

	});

	module.exports = Client;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var assign = __webpack_require__(28);
	var inherits = __webpack_require__(46);

	// Ensure the client has fresh objects so we can tack onto
	// the prototypes without mutating them globally.
	module.exports = function makeClient(ParentClient) {

	  if (typeof ParentClient.prototype === 'undefined') {
	    throw new Error('A valid parent client must be passed to makeClient');
	  }

	  function Client(config) {
	    ParentClient.call(this, config);
	  }
	  inherits(Client, ParentClient);

	  function Formatter(client) {
	    Formatter.super_.call(this, client);
	  }
	  inherits(Formatter, ParentClient.prototype.Formatter);

	  function QueryBuilder(client) {
	    QueryBuilder.super_.call(this, client);
	  }
	  inherits(QueryBuilder, ParentClient.prototype.QueryBuilder);

	  function SchemaBuilder(client) {
	    SchemaBuilder.super_.call(this, client);
	  }
	  inherits(SchemaBuilder, ParentClient.prototype.SchemaBuilder);

	  function SchemaCompiler(client, builder) {
	    SchemaCompiler.super_.call(this, client, builder);
	  }
	  inherits(SchemaCompiler, ParentClient.prototype.SchemaCompiler);

	  function TableBuilder(client, method, tableName, fn) {
	    TableBuilder.super_.call(this, client, method, tableName, fn);
	  }
	  inherits(TableBuilder, ParentClient.prototype.TableBuilder);

	  function TableCompiler(client, tableBuilder) {
	    TableCompiler.super_.call(this, client, tableBuilder);
	  }
	  inherits(TableCompiler, ParentClient.prototype.TableCompiler);

	  function ColumnBuilder(client, tableBuilder, type, args) {
	    ColumnBuilder.super_.call(this, client, tableBuilder, type, args);
	  }
	  inherits(ColumnBuilder, ParentClient.prototype.ColumnBuilder);

	  function ColumnCompiler(client, tableCompiler, columnBuilder) {
	    ColumnCompiler.super_.call(this, client, tableCompiler, columnBuilder);
	  }
	  inherits(ColumnCompiler, ParentClient.prototype.ColumnCompiler);

	  assign(Client.prototype, {
	    Formatter: Formatter,
	    QueryBuilder: QueryBuilder,
	    SchemaBuilder: SchemaBuilder,
	    SchemaCompiler: SchemaCompiler,
	    TableBuilder: TableBuilder,
	    TableCompiler: TableCompiler,
	    ColumnBuilder: ColumnBuilder,
	    ColumnCompiler: ColumnCompiler
	  });

	  return Client;
	};

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var EventEmitter = __webpack_require__(41).EventEmitter;
	var assign = __webpack_require__(28);

	var Migrator = __webpack_require__(24);
	var Seeder = __webpack_require__(24);
	var FunctionHelper = __webpack_require__(26);
	var QueryInterface = __webpack_require__(27);
	var helpers = __webpack_require__(2);

	module.exports = function makeKnex(client) {

	  // The object we're potentially using to kick off an initial chain.
	  function knex(tableName) {
	    var qb = knex.queryBuilder();
	    if (!tableName) {
	      helpers.warn('calling knex without a tableName is deprecated. Use knex.queryBuilder() instead.');
	    }
	    return tableName ? qb.table(tableName) : qb;
	  }

	  assign(knex, {

	    Promise: __webpack_require__(8),

	    // A new query builder instance
	    queryBuilder: function queryBuilder() {
	      return client.queryBuilder();
	    },

	    raw: function raw() {
	      return client.raw.apply(client, arguments);
	    },

	    // Runs a new transaction, taking a container and returning a promise
	    // for when the transaction is resolved.
	    transaction: function transaction(container, config) {
	      return client.transaction(container, config);
	    },

	    // Typically never needed, initializes the pool for a knex client.
	    initialize: function initialize(config) {
	      return client.initialize(config);
	    },

	    // Convenience method for tearing down the pool.
	    destroy: function destroy(callback) {
	      return client.destroy(callback);
	    }

	  });

	  // The `__knex__` is used if you need to duck-type check whether this
	  // is a knex builder, without a full on `instanceof` check.
	  knex.VERSION = knex.__knex__ = '0.9.0';

	  // Hook up the "knex" object as an EventEmitter.
	  var ee = new EventEmitter();
	  for (var key in ee) {
	    knex[key] = ee[key];
	  }

	  // Allow chaining methods from the root object, before
	  // any other information is specified.
	  QueryInterface.forEach(function (method) {
	    knex[method] = function () {
	      var builder = knex.queryBuilder();
	      return builder[method].apply(builder, arguments);
	    };
	  });

	  knex.client = client;

	  Object.defineProperties(knex, {

	    schema: {
	      get: function get() {
	        return client.schemaBuilder();
	      }
	    },

	    migrate: {
	      get: function get() {
	        return new Migrator(knex);
	      }
	    },

	    seed: {
	      get: function get() {
	        return new Seeder(knex);
	      }
	    },

	    fn: {
	      get: function get() {
	        return new FunctionHelper(client);
	      }
	    }

	  });

	  // Passthrough all "start" and "query" events to the knex object.
	  client.on('start', function (obj) {
	    knex.emit('start', obj);
	  });

	  client.on('query', function (obj) {
	    knex.emit('query', obj);
	  });

	  client.makeKnex = function (client) {
	    return makeKnex(client);
	  };

	  return knex;
	};

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports['default'] = parseConnectionString;

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _url = __webpack_require__(43);

	var _url2 = _interopRequireDefault(_url);

	var _pgConnectionString = __webpack_require__(44);

	function parseConnectionString(str) {
	  var parsed = _url2['default'].parse(str);
	  var protocol = parsed.protocol;
	  if (protocol && protocol.indexOf('maria') === 0) {
	    protocol = 'maria';
	  }
	  if (protocol === null) {
	    return {
	      client: 'sqlite3',
	      connection: {
	        filename: str
	      }
	    };
	  }
	  if (protocol.slice(-1) === ':') {
	    protocol = protocol.slice(0, -1);
	  }
	  return {
	    client: protocol,
	    connection: protocol === 'postgres' ? (0, _pgConnectionString.parse)(str) : connectionObject(parsed)
	  };
	}

	function connectionObject(parsed) {
	  var connection = {};
	  var db = parsed.pathname;
	  if (db[0] === '/') {
	    db = db.slice(1);
	  }
	  if (parsed.protocol.indexOf('maria') === 0) {
	    connection.db = db;
	  } else {
	    connection.database = db;
	  }
	  if (parsed.hostname) {
	    connection.host = parsed.hostname;
	  }
	  if (parsed.port) {
	    connection.port = parsed.port;
	  }
	  if (parsed.auth) {
	    var idx = parsed.auth.indexOf(':');
	    if (idx !== -1) {
	      connection.user = parsed.auth.slice(0, idx);
	      if (idx < parsed.auth.length - 1) {
	        connection.password = parsed.auth.slice(idx + 1);
	      }
	    }
	  }
	  return connection;
	}
	module.exports = exports['default'];

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./maria/index.js": 33,
		"./mysql/index.js": 34,
		"./mysql2/index.js": 35,
		"./oracle/index.js": 36,
		"./postgres/index.js": 37,
		"./sqlite3/index.js": 38,
		"./strong-oracle/index.js": 39,
		"./websql/index.js": 9
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 7;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Promise = __webpack_require__(32)();
	var deprecate = __webpack_require__(2).deprecate;

	// Incase we're using an older version of bluebird
	Promise.prototype.asCallback = Promise.prototype.nodeify;

	Promise.prototype.exec = function (cb) {
	  deprecate('.exec', '.nodeify or .asCallback');
	  return this.nodeify(cb);
	};

	module.exports = Promise;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	
	// WebSQL
	// -------
	'use strict';

	var inherits = __webpack_require__(46);
	var _ = __webpack_require__(11);

	var Transaction = __webpack_require__(40);
	var Client_SQLite3 = __webpack_require__(38);
	var Promise = __webpack_require__(8);
	var assign = __webpack_require__(28);

	function Client_WebSQL(config) {
	  Client_SQLite3.call(this, config);
	  this.name = config.name || 'knex_database';
	  this.version = config.version || '1.0';
	  this.displayName = config.displayName || this.name;
	  this.estimatedSize = config.estimatedSize || 5 * 1024 * 1024;
	}
	inherits(Client_WebSQL, Client_SQLite3);

	assign(Client_WebSQL.prototype, {

	  Transaction: Transaction,

	  dialect: 'websql',

	  // Get a raw connection from the database, returning a promise with the connection object.
	  acquireConnection: function acquireConnection() {
	    var client = this;
	    return new Promise(function (resolve, reject) {
	      try {
	        /*jslint browser: true*/
	        var db = openDatabase(client.name, client.version, client.displayName, client.estimatedSize);
	        db.transaction(function (t) {
	          t.__knexUid = _.uniqueId('__knexUid');
	          resolve(t);
	        });
	      } catch (e) {
	        reject(e);
	      }
	    });
	  },

	  // Used to explicitly close a connection, called internally by the pool
	  // when a connection times out or the pool is shutdown.
	  releaseConnection: function releaseConnection() {
	    return Promise.resolve();
	  },

	  // Runs the query on the specified connection,
	  // providing the bindings and any other necessary prep work.
	  _query: function _query(connection, obj) {
	    return new Promise(function (resolver, rejecter) {
	      if (!connection) return rejecter(new Error('No connection provided.'));
	      connection.executeSql(obj.sql, obj.bindings, function (trx, response) {
	        obj.response = response;
	        return resolver(obj);
	      }, function (trx, err) {
	        rejecter(err);
	      });
	    });
	  },

	  _stream: function _stream(connection, sql, stream) {
	    var client = this;
	    return new Promise(function (resolver, rejecter) {
	      stream.on('error', rejecter);
	      stream.on('end', resolver);
	      return client._query(connection, sql).then(function (obj) {
	        return client.processResponse(obj);
	      }).map(function (row) {
	        stream.write(row);
	      })['catch'](function (err) {
	        stream.emit('error', err);
	      }).then(function () {
	        stream.end();
	      });
	    });
	  },

	  processResponse: function processResponse(obj, runner) {
	    var resp = obj.response;
	    if (obj.output) return obj.output.call(runner, resp);
	    switch (obj.method) {
	      case 'pluck':
	      case 'first':
	      case 'select':
	        var results = [];
	        for (var i = 0, l = resp.rows.length; i < l; i++) {
	          results[i] = _.clone(resp.rows.item(i));
	        }
	        if (obj.method === 'pluck') results = _.pluck(results, obj.pluck);
	        return obj.method === 'first' ? results[0] : results;
	      case 'insert':
	        return [resp.insertId];
	      case 'delete':
	      case 'update':
	      case 'counter':
	        return resp.rowsAffected;
	      default:
	        return resp;
	    }
	  }

	});

	module.exports = Client_WebSQL;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    draining = true;
	    var currentQueue;
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        var i = -1;
	        while (++i < len) {
	            currentQueue[i]();
	        }
	        len = queue.length;
	    }
	    draining = false;
	}
	process.nextTick = function (fun) {
	    queue.push(fun);
	    if (!draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	// TODO(shtylman)
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_11__;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var helpers = __webpack_require__(2);

	module.exports = function (Target) {
	  var _ = __webpack_require__(11);
	  var SqlString = __webpack_require__(25);

	  Target.prototype.toQuery = function (tz) {
	    var data = this.toSQL(this._method);
	    if (!_.isArray(data)) data = [data];
	    return _.map(data, function (statement) {
	      return this._formatQuery(statement.sql, statement.bindings, tz);
	    }, this).join(';\n');
	  };

	  // Format the query as sql, prepping bindings as necessary.
	  Target.prototype._formatQuery = function (sql, bindings, tz) {
	    if (this.client && this.client.prepBindings) {
	      bindings = this.client.prepBindings(bindings, tz);
	    }
	    return SqlString.format(sql, bindings, tz);
	  };

	  // Create a new instance of the `Runner`, passing in the current object.
	  Target.prototype.then = function () /* onFulfilled, onRejected */{
	    var result = this.client.runner(this).run();
	    return result.then.apply(result, arguments);
	  };

	  // Add additional "options" to the builder. Typically used for client specific
	  // items, like the `mysql` and `sqlite3` drivers.
	  Target.prototype.options = function (opts) {
	    this._options = this._options || [];
	    this._options.push(_.clone(opts) || {});
	    this._cached = undefined;
	    return this;
	  };

	  // Sets an explicit "connnection" we wish to use for this query.
	  Target.prototype.connection = function (connection) {
	    this._connection = connection;
	    return this;
	  };

	  // Set a debug flag for the current schema query stack.
	  Target.prototype.debug = function (enabled) {
	    this._debug = arguments.length ? enabled : true;
	    return this;
	  };

	  // Set the transaction object for this query.
	  Target.prototype.transacting = function (t) {
	    if (t && t.client) {
	      if (!t.client.transacting) {
	        helpers.warn('Invalid transaction value: ' + t.client);
	      } else {
	        this.client = t.client;
	      }
	    }
	    return this;
	  };

	  // Initializes a stream.
	  Target.prototype.stream = function (options) {
	    return this.client.runner(this).stream(options);
	  };

	  // Initialize a stream & pipe automatically.
	  Target.prototype.pipe = function (writable, options) {
	    return this.client.runner(this).pipe(writable, options);
	  };

	  // Creates a method which "coerces" to a promise, by calling a
	  // "then" method on the current `Target`
	  _.each(['bind', 'catch', 'finally', 'asCallback', 'spread', 'map', 'reduce', 'tap', 'thenReturn', 'return', 'yield', 'ensure', 'nodeify', 'exec'], function (method) {
	    Target.prototype[method] = function () {
	      var then = this.then();
	      then = then[method].apply(then, arguments);
	      return then;
	    };
	  });
	};

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(11);
	var Promise = __webpack_require__(8);
	var assign = __webpack_require__(28);

	var PassThrough;

	// The "Runner" constructor takes a "builder" (query, schema, or raw)
	// and runs through each of the query statements, calling any additional
	// "output" method provided alongside the query and bindings.
	function Runner(client, builder) {
	  this.client = client;
	  this.builder = builder;
	  this.queries = [];

	  // The "connection" object is set on the runner when
	  // "run" is called.
	  this.connection = void 0;
	}

	assign(Runner.prototype, {

	  // "Run" the target, calling "toSQL" on the builder, returning
	  // an object or array of queries to run, each of which are run on
	  // a single connection.
	  run: function run() {
	    var runner = this;

	    return Promise.using(this.ensureConnection(), function (connection) {
	      runner.connection = connection;

	      runner.client.emit('start', runner.builder);
	      runner.builder.emit('start', runner.builder);
	      var sql = runner.builder.toSQL();

	      if (runner.builder._debug) {
	        console.log(sql);
	      }

	      if (_.isArray(sql)) {
	        return runner.queryArray(sql);
	      }
	      return runner.query(sql);
	    })

	    // If there are any "error" listeners, we fire an error event
	    // and then re-throw the error to be eventually handled by
	    // the promise chain. Useful if you're wrapping in a custom `Promise`.
	    ['catch'](function (err) {
	      if (runner.builder._events && runner.builder._events.error) {
	        runner.builder.emit('error', err);
	      }
	      throw err;
	    })

	    // Fire a single "end" event on the builder when
	    // all queries have successfully completed.
	    .tap(function () {
	      runner.builder.emit('end');
	    });
	  },

	  // Stream the result set, by passing through to the dialect's streaming
	  // capabilities. If the options are
	  stream: function stream(options, handler) {

	    // If we specify stream(handler).then(...
	    if (arguments.length === 1) {
	      if (typeof options === 'function') {
	        handler = options;
	        options = {};
	      }
	    }

	    // Determines whether we emit an error or throw here.
	    var hasHandler = typeof handler === 'function';

	    // Lazy-load the "PassThrough" dependency.
	    PassThrough = PassThrough || __webpack_require__(98).PassThrough;

	    var runner = this;
	    var stream = new PassThrough({ objectMode: true });
	    var promise = Promise.using(this.ensureConnection(), function (connection) {
	      runner.connection = connection;
	      var sql = runner.builder.toSQL();
	      var err = new Error('The stream may only be used with a single query statement.');
	      if (_.isArray(sql)) {
	        if (hasHandler) throw err;
	        stream.emit('error', err);
	      }
	      return runner.client.stream(runner.connection, sql, stream, options);
	    });

	    // If a function is passed to handle the stream, send the stream
	    // there and return the promise, otherwise just return the stream
	    // and the promise will take care of itsself.
	    if (hasHandler) {
	      handler(stream);
	      return promise;
	    }
	    return stream;
	  },

	  // Allow you to pipe the stream to a writable stream.
	  pipe: function pipe(writable, options) {
	    return this.stream(options).pipe(writable);
	  },

	  // "Runs" a query, returning a promise. All queries specified by the builder are guaranteed
	  // to run in sequence, and on the same connection, especially helpful when schema building
	  // and dealing with foreign key constraints, etc.
	  query: Promise.method(function (obj) {
	    this.builder.emit('query', assign({ __knexUid: this.connection.__knexUid }, obj));
	    var runner = this;
	    return this.client.query(this.connection, obj).then(function (resp) {
	      return runner.client.processResponse(resp, runner);
	    });
	  }),

	  // In the case of the "schema builder" we call `queryArray`, which runs each
	  // of the queries in sequence.
	  queryArray: function queryArray(queries) {
	    return queries.length === 1 ? this.query(queries[0]) : Promise.bind(this)['return'](queries).reduce(function (memo, query) {
	      return this.query(query).then(function (resp) {
	        memo.push(resp);
	        return memo;
	      });
	    }, []);
	  },

	  // Check whether there's a transaction flag, and that it has a connection.
	  ensureConnection: function ensureConnection() {
	    var runner = this;
	    return Promise['try'](function () {
	      return runner.connection || runner.client.acquireConnection();
	    }).disposer(function () {
	      runner.client.releaseConnection(runner.connection);
	    });
	  }

	});

	module.exports = Runner;

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var QueryBuilder = __webpack_require__(16);
	var Raw = __webpack_require__(1);
	var assign = __webpack_require__(28);
	var transform = __webpack_require__(56);

	function Formatter(client) {
	  this.client = client;
	  this.bindings = [];
	}

	assign(Formatter.prototype, {

	  // Accepts a string or array of columns to wrap as appropriate.
	  columnize: function columnize(target) {
	    var columns = typeof target === 'string' ? [target] : target;
	    var str = '',
	        i = -1;
	    while (++i < columns.length) {
	      if (i > 0) str += ', ';
	      str += this.wrap(columns[i]);
	    }
	    return str;
	  },

	  // Turns a list of values into a list of ?'s, joining them with commas unless
	  // a "joining" value is specified (e.g. ' and ')
	  parameterize: function parameterize(values, notSetValue) {
	    if (typeof values === 'function') return this.parameter(values);
	    values = Array.isArray(values) ? values : [values];
	    var str = '',
	        i = -1;
	    while (++i < values.length) {
	      if (i > 0) str += ', ';
	      str += this.parameter(values[i] === undefined ? notSetValue : values[i]);
	    }
	    return str;
	  },

	  // Checks whether a value is a function... if it is, we compile it
	  // otherwise we check whether it's a raw
	  parameter: function parameter(value) {
	    if (typeof value === 'function') {
	      return this.outputQuery(this.compileCallback(value), true);
	    }
	    return this.unwrapRaw(value, true) || '?';
	  },

	  unwrapRaw: function unwrapRaw(value, isParameter) {
	    var query;
	    if (value instanceof QueryBuilder) {
	      query = this.client.queryCompiler(value).toSQL();
	      if (query.bindings) {
	        this.bindings = this.bindings.concat(query.bindings);
	      }
	      return this.outputQuery(query, isParameter);
	    }
	    if (value instanceof Raw) {
	      query = value.toSQL();
	      if (query.bindings) {
	        this.bindings = this.bindings.concat(query.bindings);
	      }
	      return query.sql;
	    }
	    if (isParameter) {
	      this.bindings.push(value);
	    }
	  },

	  rawOrFn: function rawOrFn(value, method) {
	    if (typeof value === 'function') {
	      return this.outputQuery(this.compileCallback(value, method));
	    }
	    return this.unwrapRaw(value) || '';
	  },

	  // Puts the appropriate wrapper around a value depending on the database
	  // engine, unless it's a knex.raw value, in which case it's left alone.
	  wrap: function wrap(value) {
	    var raw;
	    if (typeof value === 'function') {
	      return this.outputQuery(this.compileCallback(value), true);
	    }
	    raw = this.unwrapRaw(value);
	    if (raw) return raw;
	    if (typeof value === 'number') return value;
	    return this._wrapString(value + '');
	  },

	  alias: function alias(first, second) {
	    return first + ' as ' + second;
	  },

	  // The operator method takes a value and returns something or other.
	  operator: function operator(value) {
	    var raw = this.unwrapRaw(value);
	    if (raw) return raw;
	    if (operators[(value || '').toLowerCase()] !== true) {
	      throw new TypeError('The operator "' + value + '" is not permitted');
	    }
	    return value;
	  },

	  // Specify the direction of the ordering.
	  direction: function direction(value) {
	    var raw = this.unwrapRaw(value);
	    if (raw) return raw;
	    return orderBys.indexOf((value || '').toLowerCase()) !== -1 ? value : 'asc';
	  },

	  // Compiles a callback using the query builder.
	  compileCallback: function compileCallback(callback, method) {
	    var client = this.client;

	    // Build the callback
	    var builder = client.queryBuilder();
	    callback.call(builder, builder);

	    // Compile the callback, using the current formatter (to track all bindings).
	    var compiler = client.queryCompiler(builder);
	    compiler.formatter = this;

	    // Return the compiled & parameterized sql.
	    return compiler.toSQL(method || 'select');
	  },

	  // Ensures the query is aliased if necessary.
	  outputQuery: function outputQuery(compiled, isParameter) {
	    var sql = compiled.sql || '';
	    if (sql) {
	      if (compiled.method === 'select' && (isParameter || compiled.as)) {
	        sql = '(' + sql + ')';
	        if (compiled.as) return this.alias(sql, this.wrap(compiled.as));
	      }
	    }
	    return sql;
	  },

	  // Coerce to string to prevent strange errors when it's not a string.
	  _wrapString: function _wrapString(value) {
	    var segments,
	        asIndex = value.toLowerCase().indexOf(' as ');
	    if (asIndex !== -1) {
	      var first = value.slice(0, asIndex);
	      var second = value.slice(asIndex + 4);
	      return this.alias(this.wrap(first), this.wrap(second));
	    }
	    var i = -1,
	        wrapped = [];
	    segments = value.split('.');
	    while (++i < segments.length) {
	      value = segments[i];
	      if (i === 0 && segments.length > 1) {
	        wrapped.push(this.wrap((value || '').trim()));
	      } else {
	        wrapped.push(this.client.wrapIdentifier((value || '').trim()));
	      }
	    }
	    return wrapped.join('.');
	  }

	});

	// Valid values for the `order by` clause generation.
	var orderBys = ['asc', 'desc'];

	// Turn this into a lookup map
	var operators = transform(['=', '<', '>', '<=', '>=', '<>', '!=', 'like', 'not like', 'between', 'ilike', '&', '|', '^', '<<', '>>', 'rlike', 'regexp', 'not regexp', '~', '~*', '!~', '!~*', '#', '&&', '@>', '<@', '||'], function (obj, key) {
	  obj[key] = true;
	}, Object.create(null));

	module.exports = Formatter;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	
	// Transaction
	// -------
	'use strict';

	var Promise = __webpack_require__(8);
	var EventEmitter = __webpack_require__(41).EventEmitter;
	var inherits = __webpack_require__(46);

	var makeKnex = __webpack_require__(5);
	var assign = __webpack_require__(28);
	var uniqueId = __webpack_require__(30);
	var debug = __webpack_require__(47)('knex:tx');

	// Acts as a facade for a Promise, keeping the internal state
	// and managing any child transactions.
	function Transaction(client, container, config, outerTx) {
	  var _this = this;

	  var txid = this.txid = uniqueId('trx');

	  this.client = client;
	  this.outerTx = outerTx;
	  this.trxClient = undefined;
	  this._debug = client.config && client.config.debug;

	  debug('%s: Starting %s transaction', txid, outerTx ? 'nested' : 'top level');

	  this._promise = Promise.using(this.acquireConnection(client, config, txid), function (connection) {

	    var trxClient = _this.trxClient = makeTxClient(_this, client, connection);
	    var init = client.transacting ? _this.savepoint(connection) : _this.begin(connection);

	    init.then(function () {
	      return makeTransactor(_this, connection, trxClient);
	    }).then(function (transactor) {

	      var result = container(transactor);

	      // If we've returned a "thenable" from the transaction container,
	      // and it's got the transaction object we're running for this, assume
	      // the rollback and commit are chained to this object's success / failure.
	      if (result && result.then && typeof result.then === 'function') {
	        result.then(function (val) {
	          transactor.commit(val);
	        })['catch'](function (err) {
	          transactor.rollback(err);
	        });
	      }
	    })['catch'](function (e) {
	      return _this._rejecter(e);
	    });

	    return new Promise(function (resolver, rejecter) {
	      _this._resolver = resolver;
	      _this._rejecter = rejecter;
	    });
	  });

	  this._completed = false;

	  // If there is more than one child transaction,
	  // we queue them, executing each when the previous completes.
	  this._childQueue = [];

	  // The queue is a noop unless we have child promises.
	  this._queue = this._queue || Promise.resolve(true);

	  // If there's a wrapping transaction, we need to see if there are
	  // any current children in the pending queue.
	  if (outerTx) {

	    // If there are other promises pending, we just wait until that one
	    // settles (commit or rollback) and then we can continue.
	    if (outerTx._childQueue.length > 0) {

	      this._queue = this._queue.then(function () {
	        return Promise.settle(outerTx._childQueue[outerTx._childQueue.length - 1]);
	      });
	    }

	    // Push the current promise onto the queue of promises.
	    outerTx._childQueue.push(this._promise);
	  }
	}
	inherits(Transaction, EventEmitter);

	assign(Transaction.prototype, {

	  isCompleted: function isCompleted() {
	    return this._completed || this.outerTx && this.outerTx.isCompleted() || false;
	  },

	  begin: function begin(conn) {
	    return this.query(conn, 'BEGIN;');
	  },

	  savepoint: function savepoint(conn) {
	    return this.query(conn, 'SAVEPOINT ' + this.txid + ';');
	  },

	  commit: function commit(conn, value) {
	    return this.query(conn, 'COMMIT;', 1, value);
	  },

	  release: function release(conn, value) {
	    return this.query(conn, 'RELEASE SAVEPOINT ' + this.txid + ';', 1, value);
	  },

	  rollback: function rollback(conn, error) {
	    return this.query(conn, 'ROLLBACK;', 2, error);
	  },

	  rollbackTo: function rollbackTo(conn, error) {
	    return this.query(conn, 'ROLLBACK TO SAVEPOINT ' + this.txid, 2, error);
	  },

	  query: function query(conn, sql, status, value) {
	    var _this2 = this;

	    var q = this.trxClient.query(conn, sql)['catch'](function (err) {
	      status = 2;
	      value = err;
	      _this2._completed = true;
	      debug('%s error running transaction query', _this2.txid);
	    }).tap(function () {
	      if (status === 1) _this2._resolver(value);
	      if (status === 2) _this2._rejecter(value);
	    });
	    if (status === 1 || status === 2) {
	      this._completed = true;
	    }
	    return q;
	  },

	  debug: function debug(enabled) {
	    this._debug = arguments.length ? enabled : true;
	    return this;
	  },

	  _skipping: function _skipping(sql) {
	    return Promise.reject(new Error('Transaction ' + this.txid + ' has already been released skipping: ' + sql));
	  },

	  // Acquire a connection and create a disposer - either using the one passed
	  // via config or getting one off the client. The disposer will be called once
	  // the original promise is marked completed.
	  acquireConnection: function acquireConnection(client, config, txid) {
	    var configConnection = config && config.connection;
	    return Promise['try'](function () {
	      return configConnection || client.acquireConnection();
	    }).disposer(function (connection) {
	      if (!configConnection) {
	        debug('%s: releasing connection', txid);
	        client.releaseConnection(connection);
	      } else {
	        debug('%s: not releasing external connection', txid);
	      }
	    });
	  }

	});

	// The transactor is a full featured knex object, with a "commit",
	// a "rollback" and a "savepoint" function. The "savepoint" is just
	// sugar for creating a new transaction. If the rollback is run
	// inside a savepoint, it rolls back to the last savepoint - otherwise
	// it rolls back the transaction.
	function makeTransactor(trx, connection, trxClient) {

	  var transactor = makeKnex(trxClient);

	  transactor.transaction = function (container, options) {
	    return new trxClient.Transaction(trxClient, container, options, trx);
	  };
	  transactor.savepoint = function (container, options) {
	    return transactor.transaction(container, options);
	  };

	  if (trx.client.transacting) {
	    transactor.commit = function (value) {
	      return trx.release(connection, value);
	    };
	    transactor.rollback = function (error) {
	      return trx.rollbackTo(connection, error);
	    };
	  } else {
	    transactor.commit = function (value) {
	      return trx.commit(connection, value);
	    };
	    transactor.rollback = function (error) {
	      return trx.rollback(connection, error);
	    };
	  }

	  return transactor;
	}

	// We need to make a client object which always acquires the same
	// connection and does not release back into the pool.
	function makeTxClient(trx, client, connection) {

	  var trxClient = Object.create(client.constructor.prototype);
	  trxClient.config = client.config;
	  trxClient.driver = client.driver;
	  trxClient.connectionSettings = client.connectionSettings;
	  trxClient.transacting = true;

	  trxClient.on('query', function (arg) {
	    trx.emit('query', arg);
	  });

	  var _query = trxClient.query;
	  trxClient.query = function (conn, obj) {
	    var completed = trx.isCompleted();
	    return Promise['try'](function () {
	      if (conn !== connection) throw new Error('Invalid connection for transaction query.');
	      if (completed) completedError(trx, obj);
	      return _query.call(trxClient, conn, obj);
	    });
	  };
	  var _stream = trxClient.stream;
	  trxClient.stream = function (conn, obj, stream, options) {
	    var completed = trx.isCompleted();
	    return Promise['try'](function () {
	      if (conn !== connection) throw new Error('Invalid connection for transaction query.');
	      if (completed) completedError(trx, obj);
	      return _stream.call(trxClient, conn, obj, stream, options);
	    });
	  };
	  trxClient.acquireConnection = function () {
	    return trx._queue.then(function () {
	      return connection;
	    });
	  };
	  trxClient.releaseConnection = function () {
	    return Promise.resolve();
	  };

	  return trxClient;
	}

	function completedError(trx, obj) {
	  var sql = typeof obj === 'string' ? obj : obj && obj.sql;
	  debug('%s: Transaction completed: %s', trx.id, sql);
	  throw new Error('Transaction query already complete, run with DEBUG=knex:tx for more info');
	}

	var promiseInterface = ['then', 'bind', 'catch', 'finally', 'asCallback', 'spread', 'map', 'reduce', 'tap', 'thenReturn', 'return', 'yield', 'ensure', 'nodeify', 'exec'];

	// Creates a method which "coerces" to a promise, by calling a
	// "then" method on the current `Target`
	promiseInterface.forEach(function (method) {
	  Transaction.prototype[method] = function () {
	    return this._promise = this._promise[method].apply(this._promise, arguments);
	  };
	});

	module.exports = Transaction;

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	
	// Builder
	// -------
	'use strict';

	var _ = __webpack_require__(11);
	var assert = __webpack_require__(96);
	var inherits = __webpack_require__(46);
	var EventEmitter = __webpack_require__(41).EventEmitter;

	var Raw = __webpack_require__(1);
	var helpers = __webpack_require__(2);
	var JoinClause = __webpack_require__(57);
	var assign = __webpack_require__(28);

	// Typically called from `knex.builder`,
	// start a new query building chain.
	function Builder(client) {
	  this.client = client;
	  this.and = this;
	  this._single = {};
	  this._statements = [];

	  // Internal flags used in the builder.
	  this._method = 'select';
	  this._joinFlag = 'inner';
	  this._boolFlag = 'and';
	  this._notFlag = false;
	  this._debug = client.config && client.config.debug;
	}
	inherits(Builder, EventEmitter);

	assign(Builder.prototype, {

	  toString: function toString() {
	    return this.toQuery();
	  },

	  // Convert the current query "toSQL"
	  toSQL: function toSQL(method) {
	    return this.client.queryCompiler(this).toSQL(method || this._method);
	  },

	  // Create a shallow clone of the current query builder.
	  // TODO: Test this!!
	  clone: function clone() {
	    var cloned = new this.constructor(this.client);
	    cloned._method = this._method;
	    cloned._single = _.clone(this._single);
	    cloned._options = _.clone(this._options);
	    cloned._statements = this._statements.slice();
	    return cloned;
	  },

	  // Select
	  // ------

	  // Adds a column or columns to the list of "columns"
	  // being selected on the query.
	  columns: function columns(column) {
	    if (!column) return this;
	    this._statements.push({
	      grouping: 'columns',
	      value: helpers.normalizeArr.apply(null, arguments)
	    });
	    return this;
	  },

	  // Allow for a sub-select to be explicitly aliased as a column,
	  // without needing to compile the query in a where.
	  as: function as(column) {
	    this._single.as = column;
	    return this;
	  },

	  // Prepends the `schemaName` on `tableName` defined by `.table` and `.join`.
	  withSchema: function withSchema(schemaName) {
	    this._single.schema = schemaName;
	    return this;
	  },

	  // Sets the `tableName` on the query.
	  // Alias to "from" for select and "into" for insert statements
	  // e.g. builder.insert({a: value}).into('tableName')
	  table: function table(tableName) {
	    this._single.table = tableName;
	    return this;
	  },

	  // Adds a `distinct` clause to the query.
	  distinct: function distinct() {
	    this._statements.push({
	      grouping: 'columns',
	      value: helpers.normalizeArr.apply(null, arguments),
	      distinct: true
	    });
	    return this;
	  },

	  // Adds a join clause to the query, allowing for advanced joins
	  // with an anonymous function as the second argument.
	  // function(table, first, operator, second)
	  join: function join(table, first) {
	    var join;
	    var schema = this._single.schema;
	    var joinType = this._joinType();
	    if (typeof first === 'function') {
	      join = new JoinClause(table, joinType, schema);
	      first.call(join, join);
	    } else if (joinType === 'raw') {
	      join = new JoinClause(this.client.raw(table, first), 'raw');
	    } else {
	      join = new JoinClause(table, joinType, schema);
	      if (arguments.length > 1) {
	        join.on.apply(join, _.toArray(arguments).slice(1));
	      }
	    }
	    this._statements.push(join);
	    return this;
	  },

	  // JOIN blocks:
	  innerJoin: function innerJoin() {
	    return this._joinType('inner').join.apply(this, arguments);
	  },
	  leftJoin: function leftJoin() {
	    return this._joinType('left').join.apply(this, arguments);
	  },
	  leftOuterJoin: function leftOuterJoin() {
	    return this._joinType('left outer').join.apply(this, arguments);
	  },
	  rightJoin: function rightJoin() {
	    return this._joinType('right').join.apply(this, arguments);
	  },
	  rightOuterJoin: function rightOuterJoin() {
	    return this._joinType('right outer').join.apply(this, arguments);
	  },
	  outerJoin: function outerJoin() {
	    return this._joinType('outer').join.apply(this, arguments);
	  },
	  fullOuterJoin: function fullOuterJoin() {
	    return this._joinType('full outer').join.apply(this, arguments);
	  },
	  crossJoin: function crossJoin() {
	    return this._joinType('cross').join.apply(this, arguments);
	  },
	  joinRaw: function joinRaw() {
	    return this._joinType('raw').join.apply(this, arguments);
	  },

	  // The where function can be used in several ways:
	  // The most basic is `where(key, value)`, which expands to
	  // where key = value.
	  where: function where(column, operator, value) {

	    // Support "where true || where false"
	    if (column === false || column === true) {
	      return this.where(1, '=', column ? 1 : 0);
	    }

	    // Check if the column is a function, in which case it's
	    // a where statement wrapped in parens.
	    if (typeof column === 'function') {
	      return this.whereWrapped(column);
	    }

	    // Allow a raw statement to be passed along to the query.
	    if (column instanceof Raw && arguments.length === 1) return this.whereRaw(column);

	    // Allows `where({id: 2})` syntax.
	    if (_.isObject(column) && !(column instanceof Raw)) return this._objectWhere(column);

	    // Enable the where('key', value) syntax, only when there
	    // are explicitly two arguments passed, so it's not possible to
	    // do where('key', '!=') and have that turn into where key != null
	    if (arguments.length === 2) {
	      value = operator;
	      operator = '=';

	      // If the value is null, and it's a two argument query,
	      // we assume we're going for a `whereNull`.
	      if (value === null) {
	        return this.whereNull(column);
	      }
	    }

	    // lower case the operator for comparison purposes
	    var checkOperator = ('' + operator).toLowerCase().trim();

	    // If there are 3 arguments, check whether 'in' is one of them.
	    if (arguments.length === 3) {
	      if (checkOperator === 'in' || checkOperator === 'not in') {
	        return this._not(checkOperator === 'not in').whereIn(arguments[0], arguments[2]);
	      }
	      if (checkOperator === 'between' || checkOperator === 'not between') {
	        return this._not(checkOperator === 'not between').whereBetween(arguments[0], arguments[2]);
	      }
	    }

	    // If the value is still null, check whether they're meaning
	    // where value is null
	    if (value === null) {

	      // Check for .where(key, 'is', null) or .where(key, 'is not', 'null');
	      if (checkOperator === 'is' || checkOperator === 'is not') {
	        return this._not(checkOperator === 'is not').whereNull(column);
	      }
	    }

	    // Push onto the where statement stack.
	    this._statements.push({
	      grouping: 'where',
	      type: 'whereBasic',
	      column: column,
	      operator: operator,
	      value: value,
	      not: this._not(),
	      bool: this._bool()
	    });
	    return this;
	  },
	  // Adds an `or where` clause to the query.
	  orWhere: function orWhere() {
	    return this._bool('or').where.apply(this, arguments);
	  },

	  // Adds an `not where` clause to the query.
	  whereNot: function whereNot() {
	    return this._not(true).where.apply(this, arguments);
	  },

	  // Adds an `or not where` clause to the query.
	  orWhereNot: function orWhereNot() {
	    return this._bool('or').whereNot.apply(this, arguments);
	  },

	  // Processes an object literal provided in a "where" clause.
	  _objectWhere: function _objectWhere(obj) {
	    var boolVal = this._bool();
	    var notVal = this._not() ? 'Not' : '';
	    for (var key in obj) {
	      this[boolVal + 'Where' + notVal](key, obj[key]);
	    }
	    return this;
	  },

	  // Adds a raw `where` clause to the query.
	  whereRaw: function whereRaw(sql, bindings) {
	    var raw = sql instanceof Raw ? sql : this.client.raw(sql, bindings);
	    this._statements.push({
	      grouping: 'where',
	      type: 'whereRaw',
	      value: raw,
	      bool: this._bool()
	    });
	    return this;
	  },

	  orWhereRaw: function orWhereRaw(sql, bindings) {
	    return this._bool('or').whereRaw(sql, bindings);
	  },

	  // Helper for compiling any advanced `where` queries.
	  whereWrapped: function whereWrapped(callback) {
	    this._statements.push({
	      grouping: 'where',
	      type: 'whereWrapped',
	      value: callback,
	      not: this._not(),
	      bool: this._bool()
	    });
	    return this;
	  },

	  // Helper for compiling any advanced `having` queries.
	  havingWrapped: function havingWrapped(callback) {
	    this._statements.push({
	      grouping: 'having',
	      type: 'whereWrapped',
	      value: callback,
	      bool: this._bool()
	    });
	    return this;
	  },

	  // Adds a `where exists` clause to the query.
	  whereExists: function whereExists(callback) {
	    this._statements.push({
	      grouping: 'where',
	      type: 'whereExists',
	      value: callback,
	      not: this._not(),
	      bool: this._bool()
	    });
	    return this;
	  },

	  // Adds an `or where exists` clause to the query.
	  orWhereExists: function orWhereExists(callback) {
	    return this._bool('or').whereExists(callback);
	  },

	  // Adds a `where not exists` clause to the query.
	  whereNotExists: function whereNotExists(callback) {
	    return this._not(true).whereExists(callback);
	  },

	  // Adds a `or where not exists` clause to the query.
	  orWhereNotExists: function orWhereNotExists(callback) {
	    return this._bool('or').whereNotExists(callback);
	  },

	  // Adds a `where in` clause to the query.
	  whereIn: function whereIn(column, values) {
	    if (Array.isArray(values) && _.isEmpty(values)) return this.where(this._not());
	    this._statements.push({
	      grouping: 'where',
	      type: 'whereIn',
	      column: column,
	      value: values,
	      not: this._not(),
	      bool: this._bool()
	    });
	    return this;
	  },

	  // Adds a `or where in` clause to the query.
	  orWhereIn: function orWhereIn(column, values) {
	    return this._bool('or').whereIn(column, values);
	  },

	  // Adds a `where not in` clause to the query.
	  whereNotIn: function whereNotIn(column, values) {
	    return this._not(true).whereIn(column, values);
	  },

	  // Adds a `or where not in` clause to the query.
	  orWhereNotIn: function orWhereNotIn(column, values) {
	    return this._bool('or')._not(true).whereIn(column, values);
	  },

	  // Adds a `where null` clause to the query.
	  whereNull: function whereNull(column) {
	    this._statements.push({
	      grouping: 'where',
	      type: 'whereNull',
	      column: column,
	      not: this._not(),
	      bool: this._bool()
	    });
	    return this;
	  },

	  // Adds a `or where null` clause to the query.
	  orWhereNull: function orWhereNull(column) {
	    return this._bool('or').whereNull(column);
	  },

	  // Adds a `where not null` clause to the query.
	  whereNotNull: function whereNotNull(column) {
	    return this._not(true).whereNull(column);
	  },

	  // Adds a `or where not null` clause to the query.
	  orWhereNotNull: function orWhereNotNull(column) {
	    return this._bool('or').whereNotNull(column);
	  },

	  // Adds a `where between` clause to the query.
	  whereBetween: function whereBetween(column, values) {
	    assert(Array.isArray(values), 'The second argument to whereBetween must be an array.');
	    assert(values.length === 2, 'You must specify 2 values for the whereBetween clause');
	    this._statements.push({
	      grouping: 'where',
	      type: 'whereBetween',
	      column: column,
	      value: values,
	      not: this._not(),
	      bool: this._bool()
	    });
	    return this;
	  },

	  // Adds a `where not between` clause to the query.
	  whereNotBetween: function whereNotBetween(column, values) {
	    return this._not(true).whereBetween(column, values);
	  },

	  // Adds a `or where between` clause to the query.
	  orWhereBetween: function orWhereBetween(column, values) {
	    return this._bool('or').whereBetween(column, values);
	  },

	  // Adds a `or where not between` clause to the query.
	  orWhereNotBetween: function orWhereNotBetween(column, values) {
	    return this._bool('or').whereNotBetween(column, values);
	  },

	  // Adds a `group by` clause to the query.
	  groupBy: function groupBy(item) {
	    if (item instanceof Raw) {
	      return this.groupByRaw.apply(this, arguments);
	    }
	    this._statements.push({
	      grouping: 'group',
	      type: 'groupByBasic',
	      value: helpers.normalizeArr.apply(null, arguments)
	    });
	    return this;
	  },

	  // Adds a raw `group by` clause to the query.
	  groupByRaw: function groupByRaw(sql, bindings) {
	    var raw = sql instanceof Raw ? sql : this.client.raw(sql, bindings);
	    this._statements.push({
	      grouping: 'group',
	      type: 'groupByRaw',
	      value: raw
	    });
	    return this;
	  },

	  // Adds a `order by` clause to the query.
	  orderBy: function orderBy(column, direction) {
	    this._statements.push({
	      grouping: 'order',
	      type: 'orderByBasic',
	      value: column,
	      direction: direction
	    });
	    return this;
	  },

	  // Add a raw `order by` clause to the query.
	  orderByRaw: function orderByRaw(sql, bindings) {
	    var raw = sql instanceof Raw ? sql : this.client.raw(sql, bindings);
	    this._statements.push({
	      grouping: 'order',
	      type: 'orderByRaw',
	      value: raw
	    });
	    return this;
	  },

	  // Add a union statement to the query.
	  union: function union(callbacks, wrap) {
	    if (arguments.length === 1 || arguments.length === 2 && _.isBoolean(wrap)) {
	      if (!Array.isArray(callbacks)) {
	        callbacks = [callbacks];
	      }
	      for (var i = 0, l = callbacks.length; i < l; i++) {
	        this._statements.push({
	          grouping: 'union',
	          clause: 'union',
	          value: callbacks[i],
	          wrap: wrap || false
	        });
	      }
	    } else {
	      callbacks = _.toArray(arguments).slice(0, arguments.length - 1);
	      wrap = arguments[arguments.length - 1];
	      if (!_.isBoolean(wrap)) {
	        callbacks.push(wrap);
	        wrap = false;
	      }
	      this.union(callbacks, wrap);
	    }
	    return this;
	  },

	  // Adds a union all statement to the query.
	  unionAll: function unionAll(callback, wrap) {
	    this._statements.push({
	      grouping: 'union',
	      clause: 'union all',
	      value: callback,
	      wrap: wrap || false
	    });
	    return this;
	  },

	  // Adds a `having` clause to the query.
	  having: function having(column, operator, value) {
	    if (column instanceof Raw && arguments.length === 1) {
	      return this._havingRaw(column);
	    }

	    // Check if the column is a function, in which case it's
	    // a having statement wrapped in parens.
	    if (typeof column === 'function') {
	      return this.havingWrapped(column);
	    }

	    this._statements.push({
	      grouping: 'having',
	      type: 'havingBasic',
	      column: column,
	      operator: operator,
	      value: value,
	      bool: this._bool()
	    });
	    return this;
	  },
	  // Adds an `or having` clause to the query.
	  orHaving: function orHaving() {
	    return this._bool('or').having.apply(this, arguments);
	  },
	  havingRaw: function havingRaw(sql, bindings) {
	    return this._havingRaw(sql, bindings);
	  },
	  orHavingRaw: function orHavingRaw(sql, bindings) {
	    return this._bool('or').havingRaw(sql, bindings);
	  },
	  // Adds a raw `having` clause to the query.
	  _havingRaw: function _havingRaw(sql, bindings) {
	    var raw = sql instanceof Raw ? sql : this.client.raw(sql, bindings);
	    this._statements.push({
	      grouping: 'having',
	      type: 'havingRaw',
	      value: raw,
	      bool: this._bool()
	    });
	    return this;
	  },

	  // Only allow a single "offset" to be set for the current query.
	  offset: function offset(value) {
	    this._single.offset = value;
	    return this;
	  },

	  // Only allow a single "limit" to be set for the current query.
	  limit: function limit(value) {
	    var val = parseInt(value, 10);
	    if (isNaN(val)) {
	      helpers.warn('A valid integer must be provided to limit');
	    } else {
	      this._single.limit = val;
	    }
	    return this;
	  },

	  // Retrieve the "count" result of the query.
	  count: function count(column) {
	    return this._aggregate('count', column || '*');
	  },

	  // Retrieve the minimum value of a given column.
	  min: function min(column) {
	    return this._aggregate('min', column);
	  },

	  // Retrieve the maximum value of a given column.
	  max: function max(column) {
	    return this._aggregate('max', column);
	  },

	  // Retrieve the sum of the values of a given column.
	  sum: function sum(column) {
	    return this._aggregate('sum', column);
	  },

	  // Retrieve the average of the values of a given column.
	  avg: function avg(column) {
	    return this._aggregate('avg', column);
	  },

	  // Increments a column's value by the specified amount.
	  increment: function increment(column, amount) {
	    return this._counter(column, amount);
	  },

	  // Decrements a column's value by the specified amount.
	  decrement: function decrement(column, amount) {
	    return this._counter(column, amount, '-');
	  },

	  // Sets the values for a `select` query, informing that only the first
	  // row should be returned (limit 1).
	  first: function first() {
	    var i,
	        args = new Array(arguments.length);
	    for (i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }
	    this.select.apply(this, args);
	    this._method = 'first';
	    this.limit(1);
	    return this;
	  },

	  // Pluck a column from a query.
	  pluck: function pluck(column) {
	    this._method = 'pluck';
	    this._single.pluck = column;
	    this._statements.push({
	      grouping: 'columns',
	      type: 'pluck',
	      value: column
	    });
	    return this;
	  },

	  // Insert & Update
	  // ------

	  // Sets the values for an `insert` query.
	  insert: function insert(values, returning) {
	    this._method = 'insert';
	    if (!_.isEmpty(returning)) this.returning(returning);
	    this._single.insert = values;
	    return this;
	  },

	  // Sets the values for an `update`, allowing for both
	  // `.update(key, value, [returning])` and `.update(obj, [returning])` syntaxes.
	  update: function update(values, returning) {
	    var ret,
	        obj = this._single.update || {};
	    this._method = 'update';
	    if (_.isString(values)) {
	      obj[values] = returning;
	      if (arguments.length > 2) {
	        ret = arguments[2];
	      }
	    } else {
	      var i = -1,
	          keys = Object.keys(values);
	      if (this._single.update) {
	        helpers.warn('Update called multiple times with objects.');
	      }
	      while (++i < keys.length) {
	        obj[keys[i]] = values[keys[i]];
	      }
	      ret = arguments[1];
	    }
	    if (!_.isEmpty(ret)) this.returning(ret);
	    this._single.update = obj;
	    return this;
	  },

	  // Sets the returning value for the query.
	  returning: function returning(_returning) {
	    this._single.returning = _returning;
	    return this;
	  },

	  // Delete
	  // ------

	  // Executes a delete statement on the query;
	  'delete': function _delete(ret) {
	    this._method = 'del';
	    if (!_.isEmpty(ret)) this.returning(ret);
	    return this;
	  },

	  // Truncates a table, ends the query chain.
	  truncate: function truncate(tableName) {
	    this._method = 'truncate';
	    if (tableName) {
	      this._single.table = tableName;
	    }
	    return this;
	  },

	  // Retrieves columns for the table specified by `knex(tableName)`
	  columnInfo: function columnInfo(column) {
	    this._method = 'columnInfo';
	    this._single.columnInfo = column;
	    return this;
	  },

	  // Set a lock for update constraint.
	  forUpdate: function forUpdate() {
	    this._single.lock = 'forUpdate';
	    return this;
	  },

	  // Set a lock for share constraint.
	  forShare: function forShare() {
	    this._single.lock = 'forShare';
	    return this;
	  },

	  // Takes a JS object of methods to call and calls them
	  fromJS: function fromJS(obj) {
	    _.each(obj, function (val, key) {
	      if (typeof this[key] !== 'function') {
	        helpers.warn('Knex Error: unknown key ' + key);
	      }
	      if (Array.isArray(val)) {
	        this[key].apply(this, val);
	      } else {
	        this[key](val);
	      }
	    }, this);
	    return this;
	  },

	  // Passes query to provided callback function, useful for e.g. composing
	  // domain-specific helpers
	  modify: function modify(callback) {
	    callback.apply(this, [this].concat(_.rest(arguments)));
	    return this;
	  },

	  // ----------------------------------------------------------------------

	  // Helper for the incrementing/decrementing queries.
	  _counter: function _counter(column, amount, symbol) {
	    var amt = parseInt(amount, 10);
	    if (isNaN(amt)) amt = 1;
	    this._method = 'counter';
	    this._single.counter = {
	      column: column,
	      amount: amt,
	      symbol: symbol || '+'
	    };
	    return this;
	  },

	  // Helper to get or set the "boolFlag" value.
	  _bool: function _bool(val) {
	    if (arguments.length === 1) {
	      this._boolFlag = val;
	      return this;
	    }
	    var ret = this._boolFlag;
	    this._boolFlag = 'and';
	    return ret;
	  },

	  // Helper to get or set the "notFlag" value.
	  _not: function _not(val) {
	    if (arguments.length === 1) {
	      this._notFlag = val;
	      return this;
	    }
	    var ret = this._notFlag;
	    this._notFlag = false;
	    return ret;
	  },

	  // Helper to get or set the "joinFlag" value.
	  _joinType: function _joinType(val) {
	    if (arguments.length === 1) {
	      this._joinFlag = val;
	      return this;
	    }
	    var ret = this._joinFlag || 'inner';
	    this._joinFlag = 'inner';
	    return ret;
	  },

	  // Helper for compiling any aggregate queries.
	  _aggregate: function _aggregate(method, column) {
	    this._statements.push({
	      grouping: 'columns',
	      type: 'aggregate',
	      method: method,
	      value: column
	    });
	    return this;
	  }

	});

	Object.defineProperty(Builder.prototype, 'or', {
	  get: function get() {
	    return this._bool('or');
	  }
	});

	Object.defineProperty(Builder.prototype, 'not', {
	  get: function get() {
	    return this._not(true);
	  }
	});

	Builder.prototype.select = Builder.prototype.columns;
	Builder.prototype.column = Builder.prototype.columns;
	Builder.prototype.andWhereNot = Builder.prototype.whereNot;
	Builder.prototype.andWhere = Builder.prototype.where;
	Builder.prototype.andWhereRaw = Builder.prototype.whereRaw;
	Builder.prototype.andHaving = Builder.prototype.having;
	Builder.prototype.from = Builder.prototype.table;
	Builder.prototype.into = Builder.prototype.table;
	Builder.prototype.del = Builder.prototype['delete'];

	// Attach all of the top level promise methods that should be chainable.
	__webpack_require__(12)(Builder);

	module.exports = Builder;

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	
	// Query Compiler
	// -------
	'use strict';

	var _ = __webpack_require__(11);
	var helpers = __webpack_require__(2);
	var Raw = __webpack_require__(1);
	var assign = __webpack_require__(28);
	var reduce = __webpack_require__(29);

	// The "QueryCompiler" takes all of the query statements which
	// have been gathered in the "QueryBuilder" and turns them into a
	// properly formatted / bound query string.
	function QueryCompiler(client, builder) {
	  this.client = client;
	  this.method = builder._method || 'select';
	  this.options = builder._options;
	  this.single = builder._single;
	  this.grouped = _.groupBy(builder._statements, 'grouping');
	  this.formatter = client.formatter();
	}

	var components = ['columns', 'join', 'where', 'union', 'group', 'having', 'order', 'limit', 'offset', 'lock'];

	assign(QueryCompiler.prototype, {

	  // Used when the insert call is empty.
	  _emptyInsertValue: 'default values',

	  // Collapse the builder into a single object
	  toSQL: function toSQL(method) {
	    method = method || this.method;
	    var val = this[method]();
	    var defaults = {
	      method: method,
	      options: reduce(this.options, assign, {}),
	      bindings: this.formatter.bindings
	    };
	    if (_.isString(val)) {
	      val = { sql: val };
	    }
	    if (method === 'select' && this.single.as) {
	      defaults.as = this.single.as;
	    }
	    return assign(defaults, val);
	  },

	  // Compiles the `select` statement, or nested sub-selects
	  // by calling each of the component compilers, trimming out
	  // the empties, and returning a generated query string.
	  select: function select() {
	    var i = -1,
	        statements = [];
	    while (++i < components.length) {
	      statements.push(this[components[i]](this));
	    }
	    return _.compact(statements).join(' ');
	  },

	  pluck: function pluck() {
	    return {
	      sql: this.select(),
	      pluck: this.single.pluck
	    };
	  },

	  // Compiles an "insert" query, allowing for multiple
	  // inserts using a single query statement.
	  insert: function insert() {
	    var insertValues = this.single.insert || [];
	    var sql = 'insert into ' + this.tableName + ' ';

	    if (Array.isArray(insertValues)) {
	      if (insertValues.length === 0) {
	        return '';
	      }
	    } else if (typeof insertValues === 'object' && _.isEmpty(insertValues)) {
	      return sql + this._emptyInsertValue;
	    }

	    var insertData = this._prepInsert(insertValues);
	    if (typeof insertData === 'string') {
	      sql += insertData;
	    } else {
	      if (insertData.columns.length) {
	        sql += '(' + this.formatter.columnize(insertData.columns);
	        sql += ') values (';
	        var i = -1;
	        while (++i < insertData.values.length) {
	          if (i !== 0) sql += '), (';
	          sql += this.formatter.parameterize(insertData.values[i]);
	        }
	        sql += ')';
	      } else if (insertValues.length === 1 && insertValues[0]) {
	        sql += this._emptyInsertValue;
	      } else {
	        sql = '';
	      }
	    }
	    return sql;
	  },

	  // Compiles the "update" query.
	  update: function update() {
	    // Make sure tableName is processed by the formatter first.
	    var tableName = this.tableName;
	    var updateData = this._prepUpdate(this.single.update);
	    var wheres = this.where();
	    return 'update ' + tableName + ' set ' + updateData.join(', ') + (wheres ? ' ' + wheres : '');
	  },

	  // Compiles the columns in the query, specifying if an item was distinct.
	  columns: function columns() {
	    var distinct = false;
	    if (this.onlyUnions()) return '';
	    var columns = this.grouped.columns || [];
	    var i = -1,
	        sql = [];
	    if (columns) {
	      while (++i < columns.length) {
	        var stmt = columns[i];
	        if (stmt.distinct) distinct = true;
	        if (stmt.type === 'aggregate') {
	          sql.push(this.aggregate(stmt));
	        } else if (stmt.value && stmt.value.length > 0) {
	          sql.push(this.formatter.columnize(stmt.value));
	        }
	      }
	    }
	    if (sql.length === 0) sql = ['*'];
	    return 'select ' + (distinct ? 'distinct ' : '') + sql.join(', ') + (this.tableName ? ' from ' + this.tableName : '');
	  },

	  aggregate: function aggregate(stmt) {
	    var val = stmt.value;
	    var splitOn = val.toLowerCase().indexOf(' as ');
	    // Allows us to speciy an alias for the aggregate types.
	    if (splitOn !== -1) {
	      var col = val.slice(0, splitOn);
	      var alias = val.slice(splitOn + 4);
	      return stmt.method + '(' + this.formatter.wrap(col) + ') as ' + this.formatter.wrap(alias);
	    }
	    return stmt.method + '(' + this.formatter.wrap(val) + ')';
	  },

	  // Compiles all each of the `join` clauses on the query,
	  // including any nested join queries.
	  join: function join() {
	    var sql = '',
	        i = -1,
	        joins = this.grouped.join;
	    if (!joins) return '';
	    while (++i < joins.length) {
	      var join = joins[i];
	      var table = join.schema ? join.schema + '.' + join.table : join.table;
	      if (i > 0) sql += ' ';
	      if (join.joinType === 'raw') {
	        sql += this.formatter.unwrapRaw(join.table);
	      } else {
	        sql += join.joinType + ' join ' + this.formatter.wrap(table);
	        var ii = -1;
	        while (++ii < join.clauses.length) {
	          var clause = join.clauses[ii];
	          sql += ' ' + (ii > 0 ? clause[0] : clause[1]) + ' ';
	          sql += this.formatter.wrap(clause[2]);
	          if (!_.isUndefined(clause[3])) sql += ' ' + this.formatter.operator(clause[3]);
	          if (!_.isUndefined(clause[4])) sql += ' ' + this.formatter.wrap(clause[4]);
	        }
	      }
	    }
	    return sql;
	  },

	  // Compiles all `where` statements on the query.
	  where: function where() {
	    var wheres = this.grouped.where;
	    if (!wheres) return;
	    var i = -1,
	        sql = [];
	    while (++i < wheres.length) {
	      var stmt = wheres[i];
	      var val = this[stmt.type](stmt);
	      if (val) {
	        if (sql.length === 0) {
	          sql[0] = 'where';
	        } else {
	          sql.push(stmt.bool);
	        }
	        sql.push(val);
	      }
	    }
	    return sql.length > 1 ? sql.join(' ') : '';
	  },

	  group: function group() {
	    return this._groupsOrders('group');
	  },

	  order: function order() {
	    return this._groupsOrders('order');
	  },

	  // Compiles the `having` statements.
	  having: function having() {
	    var havings = this.grouped.having;
	    if (!havings) return '';
	    var sql = ['having'];
	    for (var i = 0, l = havings.length; i < l; i++) {
	      var str = '',
	          s = havings[i];
	      if (i !== 0) str = s.bool + ' ';
	      if (s.type === 'havingBasic') {
	        sql.push(str + this.formatter.columnize(s.column) + ' ' + this.formatter.operator(s.operator) + ' ' + this.formatter.parameter(s.value));
	      } else {
	        if (s.type === 'whereWrapped') {
	          var val = this.whereWrapped(s);
	          if (val) sql.push(val);
	        } else {
	          sql.push(str + this.formatter.unwrapRaw(s.value));
	        }
	      }
	    }
	    return sql.length > 1 ? sql.join(' ') : '';
	  },

	  // Compile the "union" queries attached to the main query.
	  union: function union() {
	    var onlyUnions = this.onlyUnions();
	    var unions = this.grouped.union;
	    if (!unions) return '';
	    var sql = '';
	    for (var i = 0, l = unions.length; i < l; i++) {
	      var union = unions[i];
	      if (i > 0) sql += ' ';
	      if (i > 0 || !onlyUnions) sql += union.clause + ' ';
	      var statement = this.formatter.rawOrFn(union.value);
	      if (statement) {
	        if (union.wrap) sql += '(';
	        sql += statement;
	        if (union.wrap) sql += ')';
	      }
	    }
	    return sql;
	  },

	  // If we haven't specified any columns or a `tableName`, we're assuming this
	  // is only being used for unions.
	  onlyUnions: function onlyUnions() {
	    return !this.grouped.columns && this.grouped.union && !this.tableName;
	  },

	  limit: function limit() {
	    var noLimit = !this.single.limit && this.single.limit !== 0;
	    if (noLimit) return '';
	    return 'limit ' + this.formatter.parameter(this.single.limit);
	  },

	  offset: function offset() {
	    if (!this.single.offset) return '';
	    return 'offset ' + this.formatter.parameter(this.single.offset);
	  },

	  // Compiles a `delete` query.
	  del: function del() {
	    // Make sure tableName is processed by the formatter first.
	    var tableName = this.tableName;
	    var wheres = this.where();
	    return 'delete from ' + tableName + (wheres ? ' ' + wheres : '');
	  },

	  // Compiles a `truncate` query.
	  truncate: function truncate() {
	    return 'truncate ' + this.tableName;
	  },

	  // Compiles the "locks".
	  lock: function lock() {
	    if (this.single.lock) {
	      if (!this.client.transacting) {
	        helpers.warn('You are attempting to perform a "lock" command outside of a transaction.');
	      } else {
	        return this[this.single.lock]();
	      }
	    }
	  },

	  // Compile the "counter".
	  counter: function counter() {
	    var counter = this.single.counter;
	    var toUpdate = {};
	    toUpdate[counter.column] = this.client.raw(this.formatter.wrap(counter.column) + ' ' + (counter.symbol || '+') + ' ' + counter.amount);
	    this.single.update = toUpdate;
	    return this.update();
	  },

	  // Where Clause
	  // ------

	  whereIn: function whereIn(statement) {
	    if (Array.isArray(statement.column)) return this.multiWhereIn(statement);
	    return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'in ') + this.wrap(this.formatter.parameterize(statement.value));
	  },

	  multiWhereIn: function multiWhereIn(statement) {
	    var i = -1,
	        sql = '(' + this.formatter.columnize(statement.column) + ') ';
	    sql += this._not(statement, 'in ') + '((';
	    while (++i < statement.value.length) {
	      if (i !== 0) sql += '),(';
	      sql += this.formatter.parameterize(statement.value[i]);
	    }
	    return sql + '))';
	  },

	  whereNull: function whereNull(statement) {
	    return this.formatter.wrap(statement.column) + ' is ' + this._not(statement, 'null');
	  },

	  // Compiles a basic "where" clause.
	  whereBasic: function whereBasic(statement) {
	    return this._not(statement, '') + this.formatter.wrap(statement.column) + ' ' + this.formatter.operator(statement.operator) + ' ' + this.formatter.parameter(statement.value);
	  },

	  whereExists: function whereExists(statement) {
	    return this._not(statement, 'exists') + ' (' + this.formatter.rawOrFn(statement.value) + ')';
	  },

	  whereWrapped: function whereWrapped(statement) {
	    var val = this.formatter.rawOrFn(statement.value, 'where');
	    return val && this._not(statement, '') + '(' + val.slice(6) + ')' || '';
	  },

	  whereBetween: function whereBetween(statement) {
	    return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'between') + ' ' + _.map(statement.value, this.formatter.parameter, this.formatter).join(' and ');
	  },

	  // Compiles a "whereRaw" query.
	  whereRaw: function whereRaw(statement) {
	    return this.formatter.unwrapRaw(statement.value);
	  },

	  wrap: function wrap(str) {
	    if (str.charAt(0) !== '(') return '(' + str + ')';
	    return str;
	  },

	  // Determines whether to add a "not" prefix to the where clause.
	  _not: function _not(statement, str) {
	    if (statement.not) return 'not ' + str;
	    return str;
	  },

	  _prepInsert: function _prepInsert(data) {
	    var isRaw = this.formatter.rawOrFn(data);
	    if (isRaw) return isRaw;
	    var columns = [];
	    var values = [];
	    if (!Array.isArray(data)) data = data ? [data] : [];
	    var i = -1;
	    while (++i < data.length) {
	      if (data[i] == null) break;
	      if (i === 0) columns = Object.keys(data[i]).sort();
	      var row = new Array(columns.length);
	      var keys = Object.keys(data[i]);
	      var j = -1;
	      while (++j < keys.length) {
	        var key = keys[j];
	        var idx = columns.indexOf(key);
	        if (idx === -1) {
	          columns = columns.concat(key).sort();
	          idx = columns.indexOf(key);
	          var k = -1;
	          while (++k < values.length) {
	            values[k].splice(idx, 0, undefined);
	          }
	          row.splice(idx, 0, undefined);
	        }
	        row[idx] = data[i][key];
	      }
	      values.push(row);
	    }
	    return {
	      columns: columns,
	      values: values
	    };
	  },

	  // "Preps" the update.
	  _prepUpdate: function _prepUpdate(data) {
	    var vals = [];
	    var sorted = Object.keys(data).sort();
	    var i = -1;
	    while (++i < sorted.length) {
	      vals.push(this.formatter.wrap(sorted[i]) + ' = ' + this.formatter.parameter(data[sorted[i]]));
	    }
	    return vals;
	  },

	  // Compiles the `order by` statements.
	  _groupsOrders: function _groupsOrders(type) {
	    var items = this.grouped[type];
	    if (!items) return '';
	    var formatter = this.formatter;
	    var sql = items.map(function (item) {
	      return (item.value instanceof Raw ? formatter.unwrapRaw(item.value) : formatter.columnize(item.value)) + (type === 'order' && item.type !== 'orderByRaw' ? ' ' + formatter.direction(item.direction) : '');
	    });
	    return sql.length ? type + ' by ' + sql.join(', ') : '';
	  }

	});

	QueryCompiler.prototype.first = QueryCompiler.prototype.select;

	// Get the table name, wrapping it if necessary.
	// Implemented as a property to prevent ordering issues as described in #704.
	Object.defineProperty(QueryCompiler.prototype, 'tableName', {
	  get: function get() {
	    if (!this._tableName) {
	      // Only call this.formatter.wrap() the first time this property is accessed.
	      var tableName = this.single.table;
	      var schemaName = this.single.schema;

	      if (tableName && schemaName) tableName = schemaName + '.' + tableName;

	      this._tableName = tableName ? this.formatter.wrap(tableName) : '';
	    }
	    return this._tableName;
	  }
	});

	module.exports = QueryCompiler;

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(11);
	var inherits = __webpack_require__(46);
	var EventEmitter = __webpack_require__(41).EventEmitter;

	// Constructor for the builder instance, typically called from
	// `knex.builder`, accepting the current `knex` instance,
	// and pulling out the `client` and `grammar` from the current
	// knex instance.
	function SchemaBuilder(client) {
	  this.client = client;
	  this._sequence = [];
	  this._debug = client.config && client.config.debug;
	}
	inherits(SchemaBuilder, EventEmitter);

	// Each of the schema builder methods just add to the
	// "_sequence" array for consistency.
	_.each(['createTable', 'createTableIfNotExists', 'createSchema', 'createSchemaIfNotExists', 'dropSchema', 'dropSchemaIfExists', 'createExtension', 'createExtensionIfNotExists', 'dropExtension', 'dropExtensionIfExists', 'table', 'alterTable', 'hasTable', 'hasColumn', 'dropTable', 'renameTable', 'dropTableIfExists', 'raw'], function (method) {
	  SchemaBuilder.prototype[method] = function () {
	    if (method === 'table') method = 'alterTable';
	    this._sequence.push({
	      method: method,
	      args: _.toArray(arguments)
	    });
	    return this;
	  };
	});

	__webpack_require__(12)(SchemaBuilder);

	SchemaBuilder.prototype.withSchema = function (schemaName) {
	  this._schema = schemaName;
	  return this;
	};

	SchemaBuilder.prototype.toString = function () {
	  return this.toQuery();
	};

	SchemaBuilder.prototype.toSQL = function () {
	  return this.client.schemaCompiler(this).toSQL();
	};

	module.exports = SchemaBuilder;

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var helpers = __webpack_require__(58);
	var assign = __webpack_require__(28);

	// The "SchemaCompiler" takes all of the query statements which have been
	// gathered in the "SchemaBuilder" and turns them into an array of
	// properly formatted / bound query strings.
	function SchemaCompiler(client, builder) {
	  this.builder = builder;
	  this.client = client;
	  this.schema = builder._schema;
	  this.formatter = client.formatter();
	  this.sequence = [];
	}

	assign(SchemaCompiler.prototype, {

	  pushQuery: helpers.pushQuery,

	  pushAdditional: helpers.pushAdditional,

	  createTable: buildTable('create'),

	  createTableIfNotExists: buildTable('createIfNot'),

	  alterTable: buildTable('alter'),

	  dropTable: function dropTable(tableName) {
	    this.pushQuery('drop table ' + this.formatter.wrap(prefixedTableName(this.schema, tableName)));
	  },

	  dropTableIfExists: function dropTableIfExists(tableName) {
	    this.pushQuery('drop table if exists ' + this.formatter.wrap(prefixedTableName(this.schema, tableName)));
	  },

	  raw: function raw(sql, bindings) {
	    this.sequence.push(this.client.raw(sql, bindings).toSQL());
	  },

	  toSQL: function toSQL() {
	    var sequence = this.builder._sequence;
	    for (var i = 0, l = sequence.length; i < l; i++) {
	      var query = sequence[i];
	      this[query.method].apply(this, query.args);
	    }
	    return this.sequence;
	  }

	});

	function buildTable(type) {
	  return function (tableName, fn) {
	    var builder = this.client.tableBuilder(type, tableName, fn);
	    var sql;

	    builder.setSchema(this.schema);
	    sql = builder.toSQL();

	    for (var i = 0, l = sql.length; i < l; i++) {
	      this.sequence.push(sql[i]);
	    }
	  };
	}

	function prefixedTableName(prefix, table) {
	  return prefix ? prefix + '.' + table : table;
	}

	module.exports = SchemaCompiler;

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	
	// TableBuilder

	// Takes the function passed to the "createTable" or "table/editTable"
	// functions and calls it with the "TableBuilder" as both the context and
	// the first argument. Inside this function we can specify what happens to the
	// method, pushing everything we want to do onto the "allStatements" array,
	// which is then compiled into sql.
	// ------
	'use strict';

	var _ = __webpack_require__(11);
	var helpers = __webpack_require__(2);

	function TableBuilder(client, method, tableName, fn) {
	  this.client = client;
	  this._fn = fn;
	  this._method = method;
	  this._schemaName = undefined;
	  this._tableName = tableName;
	  this._statements = [];
	  this._single = {};
	}

	TableBuilder.prototype.setSchema = function (schemaName) {
	  this._schemaName = schemaName;
	};

	// Convert the current tableBuilder object "toSQL"
	// giving us additional methods if we're altering
	// rather than creating the table.
	TableBuilder.prototype.toSQL = function () {
	  if (this._method === 'alter') {
	    _.extend(this, AlterMethods);
	  }
	  this._fn.call(this, this);
	  return this.client.tableCompiler(this).toSQL();
	};

	_.each([

	// Each of the index methods can be called individually, with the
	// column name to be used, e.g. table.unique('column').
	'index', 'primary', 'unique',

	// Key specific
	'dropPrimary', 'dropUnique', 'dropIndex', 'dropForeign'], function (method) {
	  TableBuilder.prototype[method] = function () {
	    this._statements.push({
	      grouping: 'alterTable',
	      method: method,
	      args: _.toArray(arguments)
	    });
	    return this;
	  };
	});

	// Warn if we're not in MySQL, since that's the only time these
	// three are supported.
	var specialMethods = ['engine', 'charset', 'collate'];
	_.each(specialMethods, function (method) {
	  TableBuilder.prototype[method] = function (value) {
	    if (false) {
	      helpers.warn('Knex only supports ' + method + ' statement with mysql.');
	    }if (this._method === 'alter') {
	      helpers.warn('Knex does not support altering the ' + method + ' outside of the create table, please use knex.raw statement.');
	    }
	    this._single[method] = value;
	  };
	});

	// Each of the column types that we can add, we create a new ColumnBuilder
	// instance and push it onto the statements array.
	var columnTypes = [

	// Numeric
	'tinyint', 'smallint', 'mediumint', 'int', 'bigint', 'decimal', 'float', 'double', 'real', 'bit', 'boolean', 'serial',

	// Date / Time
	'date', 'datetime', 'timestamp', 'time', 'year',

	// String
	'char', 'varchar', 'tinytext', 'tinyText', 'text', 'mediumtext', 'mediumText', 'longtext', 'longText', 'binary', 'varbinary', 'tinyblob', 'tinyBlob', 'mediumblob', 'mediumBlob', 'blob', 'longblob', 'longBlob', 'enum', 'set',

	// Increments, Aliases, and Additional
	'bool', 'dateTime', 'increments', 'bigincrements', 'bigIncrements', 'integer', 'biginteger', 'bigInteger', 'string', 'timestamps', 'json', 'uuid', 'enu', 'specificType'];

	// For each of the column methods, create a new "ColumnBuilder" interface,
	// push it onto the "allStatements" stack, and then return the interface,
	// with which we can add indexes, etc.
	_.each(columnTypes, function (type) {
	  TableBuilder.prototype[type] = function () {
	    var args = _.toArray(arguments);

	    // The "timestamps" call is really a compound call to set the
	    // `created_at` and `updated_at` columns.
	    if (type === 'timestamps') {
	      if (args[0] === true) {
	        this.timestamp('created_at');
	        this.timestamp('updated_at');
	      } else {
	        this.datetime('created_at');
	        this.datetime('updated_at');
	      }
	      return;
	    }
	    var builder = this.client.columnBuilder(this, type, args);

	    this._statements.push({
	      grouping: 'columns',
	      builder: builder
	    });
	    return builder;
	  };
	});

	// Set the comment value for a table, they're only allowed to be called
	// once per table.
	TableBuilder.prototype.comment = function (value) {
	  this._single.comment = value;
	};

	// Set a foreign key on the table, calling
	// `table.foreign('column_name').references('column').on('table').onDelete()...
	// Also called from the ColumnBuilder context when chaining.
	TableBuilder.prototype.foreign = function (column) {
	  var foreignData = { column: column };
	  this._statements.push({
	    grouping: 'alterTable',
	    method: 'foreign',
	    args: [foreignData]
	  });
	  var returnObj = {
	    references: function references(tableColumn) {
	      var pieces;
	      if (_.isString(tableColumn)) {
	        pieces = tableColumn.split('.');
	      }
	      if (!pieces || pieces.length === 1) {
	        foreignData.references = pieces ? pieces[0] : tableColumn;
	        return {
	          on: function on(tableName) {
	            foreignData.inTable = tableName;
	            return returnObj;
	          },
	          inTable: function inTable() {
	            return this.on.apply(this, arguments);
	          }
	        };
	      }
	      foreignData.inTable = pieces[0];
	      foreignData.references = pieces[1];
	      return returnObj;
	    },
	    onUpdate: function onUpdate(statement) {
	      foreignData.onUpdate = statement;
	      return returnObj;
	    },
	    onDelete: function onDelete(statement) {
	      foreignData.onDelete = statement;
	      return returnObj;
	    },
	    _columnBuilder: function _columnBuilder(builder) {
	      _.extend(builder, returnObj);
	      returnObj = builder;
	      return builder;
	    }
	  };
	  return returnObj;
	};

	var AlterMethods = {

	  // Renames the current column `from` the current
	  // TODO: this.column(from).rename(to)
	  renameColumn: function renameColumn(from, to) {
	    this._statements.push({
	      grouping: 'alterTable',
	      method: 'renameColumn',
	      args: [from, to]
	    });
	    return this;
	  },

	  dropTimestamps: function dropTimestamps() {
	    return this.dropColumns(['created_at', 'updated_at']);
	  }

	  // TODO: changeType
	};

	// Drop a column from the current table.
	// TODO: Enable this.column(columnName).drop();
	AlterMethods.dropColumn = AlterMethods.dropColumns = function () {
	  this._statements.push({
	    grouping: 'alterTable',
	    method: 'dropColumn',
	    args: _.toArray(arguments)
	  });
	  return this;
	};

	module.exports = TableBuilder;

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	
	// Table Compiler
	// -------
	'use strict';

	var _ = __webpack_require__(11);
	var helpers = __webpack_require__(58);
	var normalizeArr = __webpack_require__(2).normalizeArr;

	function TableCompiler(client, tableBuilder) {
	  this.client = client;
	  this.method = tableBuilder._method;
	  this.schemaNameRaw = tableBuilder._schemaName;
	  this.tableNameRaw = tableBuilder._tableName;
	  this.single = tableBuilder._single;
	  this.grouped = _.groupBy(tableBuilder._statements, 'grouping');
	  this.formatter = client.formatter();
	  this.sequence = [];
	}

	TableCompiler.prototype.pushQuery = helpers.pushQuery;

	TableCompiler.prototype.pushAdditional = helpers.pushAdditional;

	// Convert the tableCompiler toSQL
	TableCompiler.prototype.toSQL = function () {
	  this[this.method]();
	  return this.sequence;
	};

	// Column Compilation
	// -------

	// If this is a table "creation", we need to first run through all
	// of the columns to build them into a single string,
	// and then run through anything else and push it to the query sequence.
	TableCompiler.prototype.create = function (ifNot) {
	  var columns = this.getColumns();
	  var columnTypes = this.getColumnTypes(columns);
	  this.createQuery(columnTypes, ifNot);
	  this.columnQueries(columns);
	  delete this.single.comment;
	  this.alterTable();
	};

	// Only create the table if it doesn't exist.
	TableCompiler.prototype.createIfNot = function () {
	  this.create(true);
	};

	// If we're altering the table, we need to one-by-one
	// go through and handle each of the queries associated
	// with altering the table's schema.
	TableCompiler.prototype.alter = function () {
	  var columns = this.getColumns();
	  var columnTypes = this.getColumnTypes(columns);
	  this.addColumns(columnTypes);
	  this.columnQueries(columns);
	  this.alterTable();
	};

	TableCompiler.prototype.foreign = function (foreignData) {
	  if (foreignData.inTable && foreignData.references) {
	    var keyName = this._indexCommand('foreign', this.tableNameRaw, foreignData.column);
	    var column = this.formatter.columnize(foreignData.column);
	    var references = this.formatter.columnize(foreignData.references);
	    var inTable = this.formatter.wrap(foreignData.inTable);
	    var onUpdate = foreignData.onUpdate ? ' on update ' + foreignData.onUpdate : '';
	    var onDelete = foreignData.onDelete ? ' on delete ' + foreignData.onDelete : '';
	    this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + keyName + ' ' + 'foreign key (' + column + ') references ' + inTable + ' (' + references + ')' + onUpdate + onDelete);
	  }
	};

	// Get all of the column sql & bindings individually for building the table queries.
	TableCompiler.prototype.getColumnTypes = function (columns) {
	  return _.reduce(_.map(columns, _.first), function (memo, column) {
	    memo.sql.push(column.sql);
	    memo.bindings.concat(column.bindings);
	    return memo;
	  }, { sql: [], bindings: [] });
	};

	// Adds all of the additional queries from the "column"
	TableCompiler.prototype.columnQueries = function (columns) {
	  var queries = _.reduce(_.map(columns, _.rest), function (memo, column) {
	    if (!_.isEmpty(column)) return memo.concat(column);
	    return memo;
	  }, []);
	  for (var i = 0, l = queries.length; i < l; i++) {
	    this.pushQuery(queries[i]);
	  }
	};

	// Add a new column.
	TableCompiler.prototype.addColumnsPrefix = 'add column ';

	// All of the columns to "add" for the query
	TableCompiler.prototype.addColumns = function (columns) {
	  if (columns.sql.length > 0) {
	    var columnSql = _.map(columns.sql, function (column) {
	      return this.addColumnsPrefix + column;
	    }, this);
	    this.pushQuery({
	      sql: 'alter table ' + this.tableName() + ' ' + columnSql.join(', '),
	      bindings: columns.bindings
	    });
	  }
	};

	// Compile the columns as needed for the current create or alter table
	TableCompiler.prototype.getColumns = function () {
	  var i = -1,
	      compiledColumns = [],
	      columns = this.grouped.columns || [];
	  while (++i < columns.length) {
	    compiledColumns.push(this.client.columnCompiler(this, columns[i].builder).toSQL());
	  }
	  return compiledColumns;
	};

	TableCompiler.prototype.tableName = function () {
	  var name = this.schemaNameRaw ? this.schemaNameRaw + '.' + this.tableNameRaw : this.tableNameRaw;

	  return this.formatter.wrap(name);
	};

	// Generate all of the alter column statements necessary for the query.
	TableCompiler.prototype.alterTable = function () {
	  var alterTable = this.grouped.alterTable || [];
	  for (var i = 0, l = alterTable.length; i < l; i++) {
	    var statement = alterTable[i];
	    if (this[statement.method]) {
	      this[statement.method].apply(this, statement.args);
	    } else {
	      console.error('Debug: ' + statement.method + ' does not exist');
	    }
	  }
	  for (var item in this.single) {
	    if (typeof this[item] === 'function') this[item](this.single[item]);
	  }
	};

	// Drop the index on the current table.
	TableCompiler.prototype.dropIndex = function (value) {
	  this.pushQuery('drop index' + value);
	};

	// Drop the unique
	TableCompiler.prototype.dropUnique = TableCompiler.prototype.dropForeign = function () {
	  throw new Error('Method implemented in the dialect driver');
	};

	TableCompiler.prototype.dropColumnPrefix = 'drop column ';
	TableCompiler.prototype.dropColumn = function () {
	  var columns = normalizeArr.apply(null, arguments);
	  var drops = _.map(_.isArray(columns) ? columns : [columns], function (column) {
	    return this.dropColumnPrefix + this.formatter.wrap(column);
	  }, this);
	  this.pushQuery('alter table ' + this.tableName() + ' ' + drops.join(', '));
	};

	// If no name was specified for this index, we will create one using a basic
	// convention of the table name, followed by the columns, followed by an
	// index type, such as primary or index, which makes the index unique.
	TableCompiler.prototype._indexCommand = function (type, tableName, columns) {
	  if (!_.isArray(columns)) columns = columns ? [columns] : [];
	  var table = tableName.replace(/\.|-/g, '_');
	  return (table + '_' + columns.join('_') + '_' + type).toLowerCase();
	};

	module.exports = TableCompiler;

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(11);

	// The chainable interface off the original "column" method.
	function ColumnBuilder(client, tableBuilder, type, args) {
	  this.client = client;
	  this._single = {};
	  this._modifiers = {};
	  this._statements = [];
	  this._type = columnAlias[type] || type;
	  this._args = args;
	  this._tableBuilder = tableBuilder;

	  // If we're altering the table, extend the object
	  // with the available "alter" methods.
	  if (tableBuilder._method === 'alter') {
	    _.extend(this, AlterMethods);
	  }
	}

	// All of the modifier methods that can be used to modify the current query.
	var modifiers = ['default', 'defaultsTo', 'defaultTo', 'unsigned', 'nullable', 'notNull', 'notNullable', 'first', 'after', 'comment'];

	// If we call any of the modifiers (index or otherwise) on the chainable, we pretend
	// as though we're calling `table.method(column)` directly.
	_.each(modifiers, function (method) {
	  ColumnBuilder.prototype[method] = function () {
	    if (aliasMethod[method]) {
	      method = aliasMethod[method];
	    }
	    if (method === 'notNullable') return this.nullable(false);
	    this._modifiers[method] = _.toArray(arguments);
	    return this;
	  };
	});

	_.each(['index', 'primary', 'unique'], function (method) {
	  ColumnBuilder.prototype[method] = function () {
	    if (this._type.toLowerCase().indexOf('increments') === -1) {
	      this._tableBuilder[method].apply(this._tableBuilder, [this._args[0]].concat(_.toArray(arguments)));
	    }
	    return this;
	  };
	});

	// Specify that the current column "references" a column,
	// which may be tableName.column or just "column"
	ColumnBuilder.prototype.references = function (value) {
	  return this._tableBuilder.foreign.call(this._tableBuilder, this._args[0], this)._columnBuilder(this).references(value);
	};

	var AlterMethods = {};

	// Specify that the column is to be dropped. This takes precedence
	// over all other rules for the column.
	AlterMethods.drop = function () {
	  this._single.drop = true;
	  return this;
	};

	// Specify the "type" that we're looking to set the
	// Knex takes no responsibility for any data-loss that may
	// occur when changing data types.
	AlterMethods.alterType = function (type) {
	  this._statements.push({
	    grouping: 'alterType',
	    value: type
	  });
	  return this;
	};

	// Aliases for convenience.
	var aliasMethod = {
	  'default': 'defaultTo',
	  defaultsTo: 'defaultTo',
	  notNull: 'notNullable'
	};

	// Alias a few methods for clarity when processing.
	var columnAlias = {
	  'float': 'floating',
	  'enum': 'enu',
	  'boolean': 'bool',
	  'string': 'varchar',
	  'bigint': 'bigInteger'
	};

	module.exports = ColumnBuilder;

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	
	// Column Compiler
	// Used for designating column definitions
	// during the table "create" / "alter" statements.
	// -------
	'use strict';

	var _ = __webpack_require__(11);
	var Raw = __webpack_require__(1);
	var helpers = __webpack_require__(58);

	function ColumnCompiler(client, tableCompiler, columnBuilder) {
	  this.client = client;
	  this.tableCompiler = tableCompiler;
	  this.columnBuilder = columnBuilder;
	  this.args = columnBuilder._args;
	  this.type = columnBuilder._type.toLowerCase();
	  this.grouped = _.groupBy(columnBuilder._statements, 'grouping');
	  this.modified = columnBuilder._modifiers;
	  this.isIncrements = this.type.indexOf('increments') !== -1;
	  this.formatter = client.formatter();
	  this.sequence = [];
	}

	ColumnCompiler.prototype.pushQuery = helpers.pushQuery;

	ColumnCompiler.prototype.pushAdditional = helpers.pushAdditional;

	// To convert to sql, we first go through and build the
	// column as it would be in the insert statement
	ColumnCompiler.prototype.toSQL = function () {
	  this.pushQuery(this.compileColumn());
	  if (this.sequence.additional) {
	    this.sequence = this.sequence.concat(this.sequence.additional);
	  }
	  return this.sequence;
	};

	// Compiles a column.
	ColumnCompiler.prototype.compileColumn = function () {
	  return this.formatter.wrap(this.getColumnName()) + ' ' + this.getColumnType() + this.getModifiers();
	};

	// Assumes the autoincrementing key is named `id` if not otherwise specified.
	ColumnCompiler.prototype.getColumnName = function () {
	  var value = _.first(this.args);
	  if (value) return value;
	  if (this.isIncrements) {
	    return 'id';
	  } else {
	    throw new Error('You did not specify a column name for the ' + this.type + 'column.');
	  }
	};

	ColumnCompiler.prototype.getColumnType = function () {
	  var type = this[this.type];
	  return typeof type === 'function' ? type.apply(this, _.rest(this.args)) : type;
	};

	ColumnCompiler.prototype.getModifiers = function () {
	  var modifiers = [];
	  if (this.type.indexOf('increments') === -1) {
	    for (var i = 0, l = this.modifiers.length; i < l; i++) {
	      var modifier = this.modifiers[i];
	      if (_.has(this.modified, modifier)) {
	        var val = this[modifier].apply(this, this.modified[modifier]);
	        if (val) modifiers.push(val);
	      }
	    }
	  }
	  return modifiers.length > 0 ? ' ' + modifiers.join(' ') : '';
	};

	// Types
	// ------

	ColumnCompiler.prototype.increments = 'integer not null primary key autoincrement';
	ColumnCompiler.prototype.bigincrements = 'integer not null primary key autoincrement';
	ColumnCompiler.prototype.integer = ColumnCompiler.prototype.smallint = ColumnCompiler.prototype.mediumint = 'integer';
	ColumnCompiler.prototype.biginteger = 'bigint';
	ColumnCompiler.prototype.varchar = function (length) {
	  return 'varchar(' + this._num(length, 255) + ')';
	};
	ColumnCompiler.prototype.text = 'text';
	ColumnCompiler.prototype.tinyint = 'tinyint';
	ColumnCompiler.prototype.floating = function (precision, scale) {
	  return 'float(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
	};
	ColumnCompiler.prototype.decimal = function (precision, scale) {
	  return 'decimal(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
	};
	ColumnCompiler.prototype.binary = 'blob';
	ColumnCompiler.prototype.bool = 'boolean';
	ColumnCompiler.prototype.date = 'date';
	ColumnCompiler.prototype.datetime = 'datetime';
	ColumnCompiler.prototype.time = 'time';
	ColumnCompiler.prototype.timestamp = 'timestamp';
	ColumnCompiler.prototype.enu = 'varchar';

	ColumnCompiler.prototype.bit = ColumnCompiler.prototype.json = 'text';

	ColumnCompiler.prototype.uuid = 'char(36)';
	ColumnCompiler.prototype.specifictype = function (type) {
	  return type;
	};

	// Modifiers
	// -------

	ColumnCompiler.prototype.nullable = function (nullable) {
	  return nullable === false ? 'not null' : 'null';
	};
	ColumnCompiler.prototype.notNullable = function () {
	  return this.nullable(false);
	};
	ColumnCompiler.prototype.defaultTo = function (value) {
	  if (value === void 0) {
	    return '';
	  } else if (value === null) {
	    value = "null";
	  } else if (value instanceof Raw) {
	    value = value.toQuery();
	  } else if (this.type === 'bool') {
	    if (value === 'false') value = 0;
	    value = "'" + (value ? 1 : 0) + "'";
	  } else if (this.type === 'json' && _.isObject(value)) {
	    return JSON.stringify(value);
	  } else {
	    value = "'" + value + "'";
	  }
	  return 'default ' + value;
	};
	ColumnCompiler.prototype._num = function (val, fallback) {
	  if (val === undefined || val === null) return fallback;
	  var number = parseInt(val, 10);
	  return isNaN(number) ? fallback : number;
	};

	module.exports = ColumnCompiler;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	module.exports = function () {};

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';

	var SqlString = exports;
	var helpers = __webpack_require__(2);

	SqlString.escape = function (val, timeZone) {
	  if (val == null) {
	    return 'NULL';
	  }

	  switch (typeof val) {
	    case 'boolean':
	      return val ? 'true' : 'false';
	    case 'number':
	      return val + '';
	  }

	  if (val instanceof Date) {
	    val = SqlString.dateToString(val, timeZone || 'local');
	  }

	  if (Buffer.isBuffer(val)) {
	    return SqlString.bufferToString(val);
	  }

	  if (Array.isArray(val)) {
	    return SqlString.arrayToList(val, timeZone);
	  }

	  if (typeof val === 'object') {
	    try {
	      val = JSON.stringify(val);
	    } catch (e) {
	      helpers.warn(e);
	      val = val + '';
	    }
	  }

	  val = val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function (s) {
	    switch (s) {
	      case "\0":
	        return "\\0";
	      case "\n":
	        return "\\n";
	      case "\r":
	        return "\\r";
	      case "\b":
	        return "\\b";
	      case "\t":
	        return "\\t";
	      case "\x1a":
	        return "\\Z";
	      default:
	        return "\\" + s;
	    }
	  });
	  return "'" + val + "'";
	};

	SqlString.arrayToList = function (array, timeZone) {
	  return array.map(function (v) {
	    if (Array.isArray(v)) return '(' + SqlString.arrayToList(v, timeZone) + ')';
	    return SqlString.escape(v, timeZone);
	  }).join(', ');
	};

	SqlString.format = function (sql, values, timeZone) {
	  values = values == null ? [] : [].concat(values);
	  var index = 0;
	  return sql.replace(/\?/g, function (match) {
	    if (index === values.length) {
	      return match;
	    }
	    var value = values[index++];
	    return SqlString.escape(value, timeZone);
	  });
	};

	SqlString.dateToString = function (date, timeZone) {
	  var dt = new Date(date);

	  if (timeZone !== 'local') {
	    var tz = convertTimezone(timeZone);

	    dt.setTime(dt.getTime() + dt.getTimezoneOffset() * 60000);
	    if (tz !== false) {
	      dt.setTime(dt.getTime() + tz * 60000);
	    }
	  }

	  var year = dt.getFullYear();
	  var month = zeroPad(dt.getMonth() + 1, 2);
	  var day = zeroPad(dt.getDate(), 2);
	  var hour = zeroPad(dt.getHours(), 2);
	  var minute = zeroPad(dt.getMinutes(), 2);
	  var second = zeroPad(dt.getSeconds(), 2);
	  var millisecond = zeroPad(dt.getMilliseconds(), 3);

	  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond;
	};

	SqlString.bufferToString = function bufferToString(buffer) {
	  return "X'" + buffer.toString('hex') + "'";
	};

	function zeroPad(number, length) {
	  number = number.toString();
	  while (number.length < length) {
	    number = '0' + number;
	  }

	  return number;
	}

	function convertTimezone(tz) {
	  if (tz === "Z") return 0;

	  var m = tz.match(/([\+\-\s])(\d\d):?(\d\d)?/);
	  if (m) {
	    return (m[1] === '-' ? -1 : 1) * (parseInt(m[2], 10) + (m[3] ? parseInt(m[3], 10) : 0) / 60) * 60;
	  }
	  return false;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(97).Buffer))

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	
	// FunctionHelper
	// -------
	'use strict';

	function FunctionHelper(client) {
	  this.client = client;
	}

	FunctionHelper.prototype.now = function () {
	  return this.client.raw('CURRENT_TIMESTAMP');
	};

	module.exports = FunctionHelper;

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	
	// All properties we can use to start a query chain
	// from the `knex` object, e.g. `knex.select('*').from(...`
	'use strict';

	module.exports = ['select', 'as', 'columns', 'column', 'from', 'fromJS', 'into', 'withSchema', 'table', 'distinct', 'join', 'joinRaw', 'innerJoin', 'leftJoin', 'leftOuterJoin', 'rightJoin', 'rightOuterJoin', 'outerJoin', 'fullOuterJoin', 'crossJoin', 'where', 'andWhere', 'orWhere', 'whereNot', 'orWhereNot', 'whereRaw', 'whereWrapped', 'havingWrapped', 'orWhereRaw', 'whereExists', 'orWhereExists', 'whereNotExists', 'orWhereNotExists', 'whereIn', 'orWhereIn', 'whereNotIn', 'orWhereNotIn', 'whereNull', 'orWhereNull', 'whereNotNull', 'orWhereNotNull', 'whereBetween', 'whereNotBetween', 'orWhereBetween', 'orWhereNotBetween', 'groupBy', 'groupByRaw', 'orderBy', 'orderByRaw', 'union', 'unionAll', 'having', 'havingRaw', 'orHaving', 'orHavingRaw', 'offset', 'limit', 'count', 'min', 'max', 'sum', 'avg', 'increment', 'decrement', 'first', 'debug', 'pluck', 'insert', 'update', 'returning', 'del', 'delete', 'truncate', 'transacting', 'connection'];

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var assignWith = __webpack_require__(59),
	    baseAssign = __webpack_require__(60),
	    createAssigner = __webpack_require__(61);

	/**
	 * Assigns own enumerable properties of source object(s) to the destination
	 * object. Subsequent sources overwrite property assignments of previous sources.
	 * If `customizer` is provided it's invoked to produce the assigned values.
	 * The `customizer` is bound to `thisArg` and invoked with five arguments:
	 * (objectValue, sourceValue, key, object, source).
	 *
	 * **Note:** This method mutates `object` and is based on
	 * [`Object.assign`](http://ecma-international.org/ecma-262/6.0/#sec-object.assign).
	 *
	 * @static
	 * @memberOf _
	 * @alias extend
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} [sources] The source objects.
	 * @param {Function} [customizer] The function to customize assigned values.
	 * @param {*} [thisArg] The `this` binding of `customizer`.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
	 * // => { 'user': 'fred', 'age': 40 }
	 *
	 * // using a customizer callback
	 * var defaults = _.partialRight(_.assign, function(value, other) {
	 *   return _.isUndefined(value) ? other : value;
	 * });
	 *
	 * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
	 * // => { 'user': 'barney', 'age': 36 }
	 */
	var assign = createAssigner(function(object, source, customizer) {
	  return customizer
	    ? assignWith(object, source, customizer)
	    : baseAssign(object, source);
	});

	module.exports = assign;


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	var arrayReduce = __webpack_require__(62),
	    baseEach = __webpack_require__(63),
	    createReduce = __webpack_require__(64);

	/**
	 * Reduces `collection` to a value which is the accumulated result of running
	 * each element in `collection` through `iteratee`, where each successive
	 * invocation is supplied the return value of the previous. If `accumulator`
	 * is not provided the first element of `collection` is used as the initial
	 * value. The `iteratee` is bound to `thisArg` and invoked with four arguments:
	 * (accumulator, value, index|key, collection).
	 *
	 * Many lodash methods are guarded to work as iteratees for methods like
	 * `_.reduce`, `_.reduceRight`, and `_.transform`.
	 *
	 * The guarded methods are:
	 * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `sortByAll`,
	 * and `sortByOrder`
	 *
	 * @static
	 * @memberOf _
	 * @alias foldl, inject
	 * @category Collection
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @param {*} [accumulator] The initial value.
	 * @param {*} [thisArg] The `this` binding of `iteratee`.
	 * @returns {*} Returns the accumulated value.
	 * @example
	 *
	 * _.reduce([1, 2], function(total, n) {
	 *   return total + n;
	 * });
	 * // => 3
	 *
	 * _.reduce({ 'a': 1, 'b': 2 }, function(result, n, key) {
	 *   result[key] = n * 3;
	 *   return result;
	 * }, {});
	 * // => { 'a': 3, 'b': 6 } (iteration order is not guaranteed)
	 */
	var reduce = createReduce(arrayReduce, baseEach);

	module.exports = reduce;


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var baseToString = __webpack_require__(65);

	/** Used to generate unique IDs. */
	var idCounter = 0;

	/**
	 * Generates a unique ID. If `prefix` is provided the ID is appended to it.
	 *
	 * @static
	 * @memberOf _
	 * @category Utility
	 * @param {string} [prefix] The value to prefix the ID with.
	 * @returns {string} Returns the unique ID.
	 * @example
	 *
	 * _.uniqueId('contact_');
	 * // => 'contact_104'
	 *
	 * _.uniqueId();
	 * // => '105'
	 */
	function uniqueId(prefix) {
	  var id = ++idCounter;
	  return baseToString(prefix) + id;
	}

	module.exports = uniqueId;


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var baseClone = __webpack_require__(66),
	    bindCallback = __webpack_require__(67);

	/**
	 * Creates a deep clone of `value`. If `customizer` is provided it's invoked
	 * to produce the cloned values. If `customizer` returns `undefined` cloning
	 * is handled by the method instead. The `customizer` is bound to `thisArg`
	 * and invoked with up to three argument; (value [, index|key, object]).
	 *
	 * **Note:** This method is loosely based on the
	 * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
	 * The enumerable properties of `arguments` objects and objects created by
	 * constructors other than `Object` are cloned to plain `Object` objects. An
	 * empty object is returned for uncloneable values such as functions, DOM nodes,
	 * Maps, Sets, and WeakMaps.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to deep clone.
	 * @param {Function} [customizer] The function to customize cloning values.
	 * @param {*} [thisArg] The `this` binding of `customizer`.
	 * @returns {*} Returns the deep cloned value.
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'barney' },
	 *   { 'user': 'fred' }
	 * ];
	 *
	 * var deep = _.cloneDeep(users);
	 * deep[0] === users[0];
	 * // => false
	 *
	 * // using a customizer callback
	 * var el = _.cloneDeep(document.body, function(value) {
	 *   if (_.isElement(value)) {
	 *     return value.cloneNode(true);
	 *   }
	 * });
	 *
	 * el === document.body
	 * // => false
	 * el.nodeName
	 * // => BODY
	 * el.childNodes.length;
	 * // => 20
	 */
	function cloneDeep(value, customizer, thisArg) {
	  return typeof customizer == 'function'
	    ? baseClone(value, true, bindCallback(customizer, thisArg, 3))
	    : baseClone(value, true);
	}

	module.exports = cloneDeep;


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Use this shim module rather than "bluebird/js/main/promise"
	// when bundling for client
	module.exports = function () {
	  return __webpack_require__(45);
	};

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	
	// MariaSQL Client
	// -------
	'use strict';

	var inherits = __webpack_require__(46);
	var assign = __webpack_require__(28);
	var Client_MySQL = __webpack_require__(34);
	var Promise = __webpack_require__(8);
	var SqlString = __webpack_require__(25);
	var helpers = __webpack_require__(2);
	var pluck = __webpack_require__(68);
	var Transaction = __webpack_require__(69);

	function Client_MariaSQL(config) {
	  Client_MySQL.call(this, config);
	}
	inherits(Client_MariaSQL, Client_MySQL);

	assign(Client_MariaSQL.prototype, {

	  dialect: 'mariadb',

	  driverName: 'mariasql',

	  Transaction: Transaction,

	  _driver: function _driver() {
	    return __webpack_require__(48);
	  },

	  // Get a raw connection, called by the `pool` whenever a new
	  // connection needs to be added to the pool.
	  acquireRawConnection: function acquireRawConnection() {
	    var connection = new this.driver();
	    connection.connect(assign({ metadata: true }, this.connectionSettings));
	    return new Promise(function (resolver, rejecter) {
	      connection.on('ready', function () {
	        connection.removeAllListeners('end');
	        connection.removeAllListeners('error');
	        resolver(connection);
	      }).on('error', rejecter);
	    });
	  },

	  // Used to explicitly close a connection, called internally by the pool
	  // when a connection times out or the pool is shutdown.
	  destroyRawConnection: function destroyRawConnection(connection, cb) {
	    connection.end();
	    cb();
	  },

	  // Return the database for the MariaSQL client.
	  database: function database() {
	    return this.connectionSettings.db;
	  },

	  // Grab a connection, run the query via the MariaSQL streaming interface,
	  // and pass that through to the stream we've sent back to the client.
	  _stream: function _stream(connection, sql, stream) {
	    return new Promise(function (resolver, rejecter) {
	      connection.query(sql.sql, sql.bindings).on('result', function (res) {
	        res.on('error', rejecter).on('end', function () {
	          resolver(res.info);
	        }).on('data', function (data) {
	          stream.write(handleRow(data, res.info.metadata));
	        });
	      }).on('error', rejecter);
	    });
	  },

	  // Runs the query on the specified connection, providing the bindings
	  // and any other necessary prep work.
	  _query: function _query(connection, obj) {
	    var tz = this.connectionSettings.timezone || 'local';
	    return new Promise(function (resolver, rejecter) {
	      if (!obj.sql) return resolver();
	      var sql = SqlString.format(obj.sql, obj.bindings, tz);
	      connection.query(sql, function (err, rows) {
	        if (err) {
	          return rejecter(err);
	        }
	        handleRows(rows, rows.info.metadata);
	        obj.response = [rows, rows.info];
	        resolver(obj);
	      });
	    });
	  },

	  // Process the response as returned from the query.
	  processResponse: function processResponse(obj, runner) {
	    var response = obj.response;
	    var method = obj.method;
	    var rows = response[0];
	    var data = response[1];
	    if (obj.output) return obj.output.call(runner, rows /*, fields*/);
	    switch (method) {
	      case 'select':
	      case 'pluck':
	      case 'first':
	        var resp = helpers.skim(rows);
	        if (method === 'pluck') return pluck(resp, obj.pluck);
	        return method === 'first' ? resp[0] : resp;
	      case 'insert':
	        return [data.insertId];
	      case 'del':
	      case 'update':
	      case 'counter':
	        return parseInt(data.affectedRows, 10);
	      default:
	        return response;
	    }
	  }

	});

	function parseType(value, type) {
	  switch (type) {
	    case 'DATETIME':
	    case 'TIMESTAMP':
	      return new Date(value);
	    case 'INTEGER':
	      return parseInt(value, 10);
	    default:
	      return value;
	  }
	}

	function handleRow(row, metadata) {
	  var keys = Object.keys(metadata);
	  for (var i = 0; i < keys.length; i++) {
	    var key = keys[i];
	    var type = metadata[key].type;
	    row[key] = parseType(row[key], type);
	  }
	  return row;
	}

	function handleRows(rows, metadata) {
	  for (var i = 0; i < rows.length; i++) {
	    var row = rows[i];
	    handleRow(row, metadata);
	  }
	  return rows;
	}

	module.exports = Client_MariaSQL;

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	
	// MySQL Client
	// -------
	'use strict';

	var inherits = __webpack_require__(46);
	var assign = __webpack_require__(28);

	var Client = __webpack_require__(3);
	var Promise = __webpack_require__(8);
	var helpers = __webpack_require__(2);

	var Transaction = __webpack_require__(70);
	var QueryCompiler = __webpack_require__(71);
	var SchemaCompiler = __webpack_require__(72);
	var TableCompiler = __webpack_require__(73);
	var ColumnCompiler = __webpack_require__(74);
	var pluck = __webpack_require__(68);

	// Always initialize with the "QueryBuilder" and "QueryCompiler"
	// objects, which extend the base 'lib/query/builder' and
	// 'lib/query/compiler', respectively.
	function Client_MySQL(config) {
	  Client.call(this, config);
	}
	inherits(Client_MySQL, Client);

	assign(Client_MySQL.prototype, {

	  dialect: 'mysql',

	  driverName: 'mysql',

	  _driver: function _driver() {
	    return __webpack_require__(49);
	  },

	  QueryCompiler: QueryCompiler,

	  SchemaCompiler: SchemaCompiler,

	  TableCompiler: TableCompiler,

	  ColumnCompiler: ColumnCompiler,

	  Transaction: Transaction,

	  wrapIdentifier: function wrapIdentifier(value) {
	    return value !== '*' ? '`' + value.replace(/`/g, '``') + '`' : '*';
	  },

	  // Get a raw connection, called by the `pool` whenever a new
	  // connection needs to be added to the pool.
	  acquireRawConnection: function acquireRawConnection() {
	    var client = this;
	    var connection = this.driver.createConnection(this.connectionSettings);
	    return new Promise(function (resolver, rejecter) {
	      connection.connect(function (err) {
	        if (err) return rejecter(err);
	        connection.on('error', connectionErrorHandler.bind(null, client, connection));
	        connection.on('end', connectionErrorHandler.bind(null, client, connection));
	        resolver(connection);
	      });
	    });
	  },

	  // Used to explicitly close a connection, called internally by the pool
	  // when a connection times out or the pool is shutdown.
	  destroyRawConnection: function destroyRawConnection(connection, cb) {
	    connection.end(cb);
	  },

	  // Grab a connection, run the query via the MySQL streaming interface,
	  // and pass that through to the stream we've sent back to the client.
	  _stream: function _stream(connection, obj, stream, options) {
	    options = options || {};
	    return new Promise(function (resolver, rejecter) {
	      stream.on('error', rejecter);
	      stream.on('end', resolver);
	      connection.query(obj.sql, obj.bindings).stream(options).pipe(stream);
	    });
	  },

	  // Runs the query on the specified connection, providing the bindings
	  // and any other necessary prep work.
	  _query: function _query(connection, obj) {
	    if (!obj || typeof obj === 'string') obj = { sql: obj };
	    return new Promise(function (resolver, rejecter) {
	      var sql = obj.sql;
	      if (!sql) return resolver();
	      if (obj.options) sql = assign({ sql: sql }, obj.options);
	      connection.query(sql, obj.bindings, function (err, rows, fields) {
	        if (err) return rejecter(err);
	        obj.response = [rows, fields];
	        resolver(obj);
	      });
	    });
	  },

	  // Process the response as returned from the query.
	  processResponse: function processResponse(obj, runner) {
	    if (obj == null) return;
	    var response = obj.response;
	    var method = obj.method;
	    var rows = response[0];
	    var fields = response[1];
	    if (obj.output) return obj.output.call(runner, rows, fields);
	    switch (method) {
	      case 'select':
	      case 'pluck':
	      case 'first':
	        var resp = helpers.skim(rows);
	        if (method === 'pluck') return pluck(resp, obj.pluck);
	        return method === 'first' ? resp[0] : resp;
	      case 'insert':
	        return [rows.insertId];
	      case 'del':
	      case 'update':
	      case 'counter':
	        return rows.affectedRows;
	      default:
	        return response;
	    }
	  }

	});

	// MySQL Specific error handler
	function connectionErrorHandler(client, connection, err) {
	  if (connection && err && err.fatal) {
	    if (connection.__knex__disposed) return;
	    connection.__knex__disposed = true;
	    client.pool.destroy(connection);
	  }
	}

	module.exports = Client_MySQL;

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	
	// MySQL2 Client
	// -------
	'use strict';

	var inherits = __webpack_require__(46);
	var Client_MySQL = __webpack_require__(34);
	var Promise = __webpack_require__(8);
	var helpers = __webpack_require__(2);
	var pick = __webpack_require__(75);
	var pluck = __webpack_require__(68);
	var assign = __webpack_require__(28);
	var Transaction = __webpack_require__(76);

	var configOptions = ['user', 'database', 'host', 'password', 'port', 'ssl', 'connection', 'compress', 'stream'];

	// Always initialize with the "QueryBuilder" and "QueryCompiler"
	// objects, which extend the base 'lib/query/builder' and
	// 'lib/query/compiler', respectively.
	function Client_MySQL2(config) {
	  Client_MySQL.call(this, config);
	}
	inherits(Client_MySQL2, Client_MySQL);

	assign(Client_MySQL2.prototype, {

	  // The "dialect", for reference elsewhere.
	  driverName: 'mysql2',

	  Transaction: Transaction,

	  _driver: function _driver() {
	    return __webpack_require__(50);
	  },

	  // Get a raw connection, called by the `pool` whenever a new
	  // connection needs to be added to the pool.
	  acquireRawConnection: function acquireRawConnection() {
	    var connection = this.driver.createConnection(pick(this.connectionSettings, configOptions));
	    return new Promise(function (resolver, rejecter) {
	      connection.connect(function (err) {
	        if (err) return rejecter(err);
	        resolver(connection);
	      });
	    });
	  },

	  processResponse: function processResponse(obj, runner) {
	    var response = obj.response;
	    var method = obj.method;
	    var rows = response[0];
	    var fields = response[1];
	    if (obj.output) return obj.output.call(runner, rows, fields);
	    switch (method) {
	      case 'select':
	      case 'pluck':
	      case 'first':
	        var resp = helpers.skim(rows);
	        if (method === 'pluck') return pluck(resp, obj.pluck);
	        return method === 'first' ? resp[0] : resp;
	      case 'insert':
	        return [rows.insertId];
	      case 'del':
	      case 'update':
	      case 'counter':
	        return rows.affectedRows;
	      default:
	        return response;
	    }
	  }

	});

	module.exports = Client_MySQL2;

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {
	// Oracle Client
	// -------
	'use strict';

	var _ = __webpack_require__(11);
	var inherits = __webpack_require__(46);
	var assign = __webpack_require__(28);

	var Formatter = __webpack_require__(77);
	var Client = __webpack_require__(3);
	var Promise = __webpack_require__(8);
	var helpers = __webpack_require__(2);
	var SqlString = __webpack_require__(25);

	var Transaction = __webpack_require__(78);
	var QueryCompiler = __webpack_require__(79);
	var SchemaCompiler = __webpack_require__(80);
	var ColumnBuilder = __webpack_require__(81);
	var ColumnCompiler = __webpack_require__(82);
	var TableCompiler = __webpack_require__(83);
	var OracleQueryStream = __webpack_require__(84);
	var ReturningHelper = __webpack_require__(85).ReturningHelper;

	// Always initialize with the "QueryBuilder" and "QueryCompiler"
	// objects, which extend the base 'lib/query/builder' and
	// 'lib/query/compiler', respectively.
	function Client_Oracle(config) {
	  Client.call(this, config);
	}
	inherits(Client_Oracle, Client);

	assign(Client_Oracle.prototype, {

	  dialect: 'oracle',

	  driverName: 'oracle',

	  _driver: function _driver() {
	    return __webpack_require__(51);
	  },

	  Transaction: Transaction,

	  Formatter: Formatter,

	  QueryCompiler: QueryCompiler,

	  SchemaCompiler: SchemaCompiler,

	  ColumnBuilder: ColumnBuilder,

	  ColumnCompiler: ColumnCompiler,

	  TableCompiler: TableCompiler,

	  prepBindings: function prepBindings(bindings) {
	    return _.map(bindings, function (value) {
	      // returning helper uses always ROWID as string
	      if (value instanceof ReturningHelper && this.driver) {
	        return new this.driver.OutParam(this.driver.OCCISTRING);
	      } else if (typeof value === 'boolean') {
	        return value ? 1 : 0;
	      } else if (Buffer.isBuffer(value)) {
	        return SqlString.bufferToString(value);
	      }
	      return value;
	    }, this);
	  },

	  // Get a raw connection, called by the `pool` whenever a new
	  // connection needs to be added to the pool.
	  acquireRawConnection: function acquireRawConnection() {
	    var client = this;
	    return new Promise(function (resolver, rejecter) {
	      client.driver.connect(client.connectionSettings, function (err, connection) {
	        if (err) return rejecter(err);
	        Promise.promisifyAll(connection);
	        if (client.connectionSettings.prefetchRowCount) {
	          connection.setPrefetchRowCount(client.connectionSettings.prefetchRowCount);
	        }
	        resolver(connection);
	      });
	    });
	  },

	  // Used to explicitly close a connection, called internally by the pool
	  // when a connection times out or the pool is shutdown.
	  destroyRawConnection: function destroyRawConnection(connection, cb) {
	    connection.close();
	    cb();
	  },

	  // Return the database for the Oracle client.
	  database: function database() {
	    return this.connectionSettings.database;
	  },

	  // Position the bindings for the query.
	  positionBindings: function positionBindings(sql) {
	    var questionCount = 0;
	    return sql.replace(/\?/g, function () {
	      questionCount += 1;
	      return ':' + questionCount;
	    });
	  },

	  _stream: function _stream(connection, obj, stream, options) {
	    obj.sql = this.positionBindings(obj.sql);
	    return new Promise(function (resolver, rejecter) {
	      stream.on('error', rejecter);
	      stream.on('end', resolver);
	      var queryStream = new OracleQueryStream(connection, obj.sql, obj.bindings, options);
	      queryStream.pipe(stream);
	    });
	  },

	  // Runs the query on the specified connection, providing the bindings
	  // and any other necessary prep work.
	  _query: function _query(connection, obj) {

	    // convert ? params into positional bindings (:1)
	    obj.sql = this.positionBindings(obj.sql);

	    obj.bindings = this.prepBindings(obj.bindings) || [];

	    if (!obj.sql) throw new Error('The query is empty');

	    return connection.executeAsync(obj.sql, obj.bindings).then(function (response) {
	      if (!obj.returning) return response;
	      var rowIds = obj.outParams.map(function (v, i) {
	        return response['returnParam' + (i ? i : '')];
	      });
	      return connection.executeAsync(obj.returningSql, rowIds);
	    }).then(function (response) {
	      obj.response = response;
	      return obj;
	    });
	  },

	  // Process the response as returned from the query.
	  processResponse: function processResponse(obj, runner) {
	    var response = obj.response;
	    var method = obj.method;
	    if (obj.output) return obj.output.call(runner, response);
	    switch (method) {
	      case 'select':
	      case 'pluck':
	      case 'first':
	        response = helpers.skim(response);
	        if (obj.method === 'pluck') response = _.pluck(response, obj.pluck);
	        return obj.method === 'first' ? response[0] : response;
	      case 'insert':
	      case 'del':
	      case 'update':
	      case 'counter':
	        if (obj.returning) {
	          if (obj.returning.length > 1 || obj.returning[0] === '*') {
	            return response;
	          }
	          // return an array with values if only one returning value was specified
	          return _.flatten(_.map(response, _.values));
	        }
	        return response.updateCount;
	      default:
	        return response;
	    }
	  }

	});

	module.exports = Client_Oracle;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(97).Buffer))

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {
	// PostgreSQL
	// -------
	'use strict';

	var _ = __webpack_require__(11);
	var inherits = __webpack_require__(46);
	var Client = __webpack_require__(3);
	var Promise = __webpack_require__(8);
	var utils = __webpack_require__(86);
	var assign = __webpack_require__(28);

	var QueryCompiler = __webpack_require__(87);
	var ColumnCompiler = __webpack_require__(88);
	var TableCompiler = __webpack_require__(89);
	var SchemaCompiler = __webpack_require__(90);
	var PGQueryStream;

	function Client_PG(config) {
	  Client.apply(this, arguments);
	  if (config.returning) {
	    this.defaultReturning = config.returning;
	  }

	  if (config.searchPath) {
	    this.searchPath = config.searchPath;
	  }
	}
	inherits(Client_PG, Client);

	assign(Client_PG.prototype, {

	  QueryCompiler: QueryCompiler,

	  ColumnCompiler: ColumnCompiler,

	  SchemaCompiler: SchemaCompiler,

	  TableCompiler: TableCompiler,

	  dialect: 'postgresql',

	  driverName: 'pg',

	  _driver: function _driver() {
	    return __webpack_require__(52);
	  },

	  wrapIdentifier: function wrapIdentifier(value) {
	    if (value === '*') return value;
	    var matched = value.match(/(.*?)(\[[0-9]\])/);
	    if (matched) return this.wrapIdentifier(matched[1]) + matched[2];
	    return '"' + value.replace(/"/g, '""') + '"';
	  },

	  // Prep the bindings as needed by PostgreSQL.
	  prepBindings: function prepBindings(bindings, tz) {
	    return _.map(bindings, function (binding) {
	      return utils.prepareValue(binding, tz);
	    });
	  },

	  // Get a raw connection, called by the `pool` whenever a new
	  // connection needs to be added to the pool.
	  acquireRawConnection: function acquireRawConnection() {
	    var client = this;
	    return new Promise(function (resolver, rejecter) {
	      var connection = new client.driver.Client(client.connectionSettings);
	      connection.connect(function (err, connection) {
	        if (err) return rejecter(err);
	        connection.on('error', client.__endConnection.bind(client, connection));
	        connection.on('end', client.__endConnection.bind(client, connection));
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
	  destroyRawConnection: function destroyRawConnection(connection, cb) {
	    connection.end();
	    cb();
	  },

	  // In PostgreSQL, we need to do a version check to do some feature
	  // checking on the database.
	  checkVersion: function checkVersion(connection) {
	    return new Promise(function (resolver, rejecter) {
	      connection.query('select version();', function (err, resp) {
	        if (err) return rejecter(err);
	        resolver(/^PostgreSQL (.*?) /.exec(resp.rows[0].version)[1]);
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

	    if (!path) return Promise.resolve(true);

	    return new Promise(function (resolver, rejecter) {
	      connection.query('set search_path to ' + path, function (err) {
	        if (err) return rejecter(err);
	        resolver(true);
	      });
	    });
	  },

	  _stream: function _stream(connection, obj, stream, options) {
	    PGQueryStream = process.browser ? undefined : __webpack_require__(53);
	    var sql = obj.sql = this.positionBindings(obj.sql);
	    return new Promise(function (resolver, rejecter) {
	      var queryStream = connection.query(new PGQueryStream(sql, obj.bindings, options));
	      queryStream.on('error', rejecter);
	      // 'error' is not propagated by .pipe, but it breaks the pipe
	      stream.on('error', rejecter);
	      // 'end' IS propagated by .pipe, by default
	      stream.on('end', resolver);
	      queryStream.pipe(stream);
	    });
	  },

	  // Runs the query on the specified connection, providing the bindings
	  // and any other necessary prep work.
	  _query: function _query(connection, obj) {
	    var sql = obj.sql = this.positionBindings(obj.sql);
	    if (obj.options) sql = _.extend({ text: sql }, obj.options);
	    return new Promise(function (resolver, rejecter) {
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
	      if (obj.method === 'pluck') return _.pluck(resp.rows, obj.pluck);
	      return resp.rows;
	    }
	    if (returning) {
	      var returns = [];
	      for (var i = 0, l = resp.rows.length; i < l; i++) {
	        var row = resp.rows[i];
	        if (returning === '*' || Array.isArray(returning)) {
	          returns[i] = row;
	        } else {
	          returns[i] = row[returning];
	        }
	      }
	      return returns;
	    }
	    if (resp.command === 'UPDATE' || resp.command === 'DELETE') {
	      return resp.rowCount;
	    }
	    return resp;
	  },

	  __endConnection: function __endConnection(connection) {
	    if (!connection || connection.__knex__disposed) return;
	    if (this.pool) {
	      connection.__knex__disposed = true;
	      this.pool.destroy(connection);
	    }
	  }

	});

	module.exports = Client_PG;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	
	// SQLite3
	// -------
	'use strict';

	var Promise = __webpack_require__(8);

	var inherits = __webpack_require__(46);
	var assign = __webpack_require__(28);
	var pluck = __webpack_require__(68);

	var Client = __webpack_require__(3);
	var helpers = __webpack_require__(2);

	var QueryCompiler = __webpack_require__(91);
	var SchemaCompiler = __webpack_require__(92);
	var ColumnCompiler = __webpack_require__(93);
	var TableCompiler = __webpack_require__(94);
	var SQLite3_DDL = __webpack_require__(95);

	function Client_SQLite3(config) {
	  Client.call(this, config);
	}
	inherits(Client_SQLite3, Client);

	assign(Client_SQLite3.prototype, {

	  dialect: 'sqlite3',

	  driverName: 'sqlite3',

	  _driver: function _driver() {
	    return __webpack_require__(54);
	  },

	  SchemaCompiler: SchemaCompiler,

	  QueryCompiler: QueryCompiler,

	  ColumnCompiler: ColumnCompiler,

	  TableCompiler: TableCompiler,

	  ddl: function ddl(compiler, pragma, connection) {
	    return new SQLite3_DDL(this, compiler, pragma, connection);
	  },

	  // Get a raw connection from the database, returning a promise with the connection object.
	  acquireRawConnection: function acquireRawConnection() {
	    var client = this;
	    return new Promise(function (resolve, reject) {
	      var db = new client.driver.Database(client.connectionSettings.filename, function (err) {
	        if (err) return reject(err);
	        resolve(db);
	      });
	    });
	  },

	  // Used to explicitly close a connection, called internally by the pool
	  // when a connection times out or the pool is shutdown.
	  destroyRawConnection: function destroyRawConnection(connection, cb) {
	    connection.close();
	    cb();
	  },

	  // Runs the query on the specified connection, providing the bindings and any other necessary prep work.
	  _query: function _query(connection, obj) {
	    var method = obj.method;
	    var callMethod;
	    switch (method) {
	      case 'insert':
	      case 'update':
	      case 'counter':
	      case 'del':
	        callMethod = 'run';
	        break;
	      default:
	        callMethod = 'all';
	    }
	    return new Promise(function (resolver, rejecter) {
	      if (!connection || !connection[callMethod]) {
	        return rejecter(new Error('Error calling ' + callMethod + ' on connection.'));
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
	  },

	  _stream: function _stream(connection, sql, stream) {
	    var client = this;
	    return new Promise(function (resolver, rejecter) {
	      stream.on('error', rejecter);
	      stream.on('end', resolver);
	      return client._query(connection, sql).then(function (obj) {
	        return obj.response;
	      }).map(function (row) {
	        stream.write(row);
	      })['catch'](function (err) {
	        stream.emit('error', err);
	      }).then(function () {
	        stream.end();
	      });
	    });
	  },

	  // Ensures the response is returned in the same format as other clients.
	  processResponse: function processResponse(obj, runner) {
	    var ctx = obj.context;
	    var response = obj.response;
	    if (obj.output) return obj.output.call(runner, response);
	    switch (obj.method) {
	      case 'select':
	      case 'pluck':
	      case 'first':
	        response = helpers.skim(response);
	        if (obj.method === 'pluck') response = pluck(response, obj.pluck);
	        return obj.method === 'first' ? response[0] : response;
	      case 'insert':
	        return [ctx.lastID];
	      case 'del':
	      case 'update':
	      case 'counter':
	        return ctx.changes;
	      default:
	        return response;
	    }
	  },

	  poolDefaults: function poolDefaults(config) {
	    return assign(Client.prototype.poolDefaults.call(this, config), {
	      min: 1,
	      max: 1
	    });
	  }

	});

	module.exports = Client_SQLite3;

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	
	// Oracle Client
	// -------
	'use strict';

	var inherits = __webpack_require__(46);
	var Client_Oracle = __webpack_require__(36);

	function Client_StrongOracle() {
	  Client_Oracle.apply(this, arguments);
	}
	inherits(Client_StrongOracle, Client_Oracle);

	Client_StrongOracle.prototype._driver = function () {
	  return __webpack_require__(55)();
	};

	Client_StrongOracle.prototype.driverName = 'strong-oracle';

	module.exports = Client_StrongOracle;

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var makeKnex = __webpack_require__(5);
	var Promise = __webpack_require__(8);
	var helpers = __webpack_require__(2);
	var inherits = __webpack_require__(46);
	var EventEmitter = __webpack_require__(41).EventEmitter;

	function Transaction_WebSQL(client, container) {
	  helpers.warn('WebSQL transactions will run queries, but do not commit or rollback');
	  var trx = this;
	  this._promise = Promise['try'](function () {
	    container(makeKnex(makeClient(trx, client)));
	  });
	}
	inherits(Transaction_WebSQL, EventEmitter);

	function makeClient(trx, client) {

	  var trxClient = Object.create(client.constructor.prototype);
	  trxClient.config = client.config;
	  trxClient.connectionSettings = client.connectionSettings;
	  trxClient.transacting = true;

	  trxClient.on('query', function (arg) {
	    trx.emit('query', arg);
	  });
	  trxClient.commit = function () {};
	  trxClient.rollback = function () {};

	  return trxClient;
	}

	var promiseInterface = ['then', 'bind', 'catch', 'finally', 'asCallback', 'spread', 'map', 'reduce', 'tap', 'thenReturn', 'return', 'yield', 'ensure', 'nodeify', 'exec'];

	// Creates a method which "coerces" to a promise, by calling a
	// "then" method on the current `Target`
	promiseInterface.forEach(function (method) {
	  Transaction_WebSQL.prototype[method] = function () {
	    return this._promise = this._promise[method].apply(this._promise, arguments);
	  };
	});

	module.exports = Transaction_WebSQL;

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;

	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;

	  if (!this._events)
	    this._events = {};

	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      }
	      throw TypeError('Uncaught, unspecified "error" event.');
	    }
	  }

	  handler = this._events[type];

	  if (isUndefined(handler))
	    return false;

	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }

	  return true;
	};

	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events)
	    this._events = {};

	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);

	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];

	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }

	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }

	  return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  var fired = false;

	  function g() {
	    this.removeListener(type, g);

	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }

	  g.listener = listener;
	  this.on(type, g);

	  return this;
	};

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events || !this._events[type])
	    return this;

	  list = this._events[type];
	  length = list.length;
	  position = -1;

	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);

	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }

	    if (position < 0)
	      return this;

	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }

	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }

	  return this;
	};

	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;

	  if (!this._events)
	    return this;

	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }

	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }

	  listeners = this._events[type];

	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];

	  return this;
	};

	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};

	EventEmitter.prototype.listenerCount = function(type) {
	  if (this._events) {
	    var evlistener = this._events[type];

	    if (isFunction(evlistener))
	      return 1;
	    else if (evlistener)
	      return evlistener.length;
	  }
	  return 0;
	};

	EventEmitter.listenerCount = function(emitter, type) {
	  return emitter.listenerCount(type);
	};

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	var escapeStringRegexp = __webpack_require__(121);
	var ansiStyles = __webpack_require__(122);
	var stripAnsi = __webpack_require__(123);
	var hasAnsi = __webpack_require__(124);
	var supportsColor = __webpack_require__(125);
	var defineProps = Object.defineProperties;
	var isSimpleWindowsTerm = process.platform === 'win32' && !/^xterm/i.test(process.env.TERM);

	function Chalk(options) {
		// detect mode if not set manually
		this.enabled = !options || options.enabled === undefined ? supportsColor : options.enabled;
	}

	// use bright blue on Windows as the normal blue color is illegible
	if (isSimpleWindowsTerm) {
		ansiStyles.blue.open = '\u001b[94m';
	}

	var styles = (function () {
		var ret = {};

		Object.keys(ansiStyles).forEach(function (key) {
			ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

			ret[key] = {
				get: function () {
					return build.call(this, this._styles.concat(key));
				}
			};
		});

		return ret;
	})();

	var proto = defineProps(function chalk() {}, styles);

	function build(_styles) {
		var builder = function () {
			return applyStyle.apply(builder, arguments);
		};

		builder._styles = _styles;
		builder.enabled = this.enabled;
		// __proto__ is used because we must return a function, but there is
		// no way to create a function with a different prototype.
		/* eslint-disable no-proto */
		builder.__proto__ = proto;

		return builder;
	}

	function applyStyle() {
		// support varags, but simply cast to string in case there's only one arg
		var args = arguments;
		var argsLen = args.length;
		var str = argsLen !== 0 && String(arguments[0]);

		if (argsLen > 1) {
			// don't slice `arguments`, it prevents v8 optimizations
			for (var a = 1; a < argsLen; a++) {
				str += ' ' + args[a];
			}
		}

		if (!this.enabled || !str) {
			return str;
		}

		var nestedStyles = this._styles;
		var i = nestedStyles.length;

		// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
		// see https://github.com/chalk/chalk/issues/58
		// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
		var originalDim = ansiStyles.dim.open;
		if (isSimpleWindowsTerm && (nestedStyles.indexOf('gray') !== -1 || nestedStyles.indexOf('grey') !== -1)) {
			ansiStyles.dim.open = '';
		}

		while (i--) {
			var code = ansiStyles[nestedStyles[i]];

			// Replace any instances already present with a re-opening code
			// otherwise only the part of the string until said closing code
			// will be colored, and the rest will simply be 'plain'.
			str = code.open + str.replace(code.closeRe, code.open) + code.close;
		}

		// Reset the original 'dim' if we changed it to work around the Windows dimmed gray issue.
		ansiStyles.dim.open = originalDim;

		return str;
	}

	function init() {
		var ret = {};

		Object.keys(styles).forEach(function (name) {
			ret[name] = {
				get: function () {
					return build.call(this, [name]);
				}
			};
		});

		return ret;
	}

	defineProps(Chalk.prototype, init());

	module.exports = new Chalk();
	module.exports.styles = ansiStyles;
	module.exports.hasColor = hasAnsi;
	module.exports.stripColor = stripAnsi;
	module.exports.supportsColor = supportsColor;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var punycode = __webpack_require__(108);

	exports.parse = urlParse;
	exports.resolve = urlResolve;
	exports.resolveObject = urlResolveObject;
	exports.format = urlFormat;

	exports.Url = Url;

	function Url() {
	  this.protocol = null;
	  this.slashes = null;
	  this.auth = null;
	  this.host = null;
	  this.port = null;
	  this.hostname = null;
	  this.hash = null;
	  this.search = null;
	  this.query = null;
	  this.pathname = null;
	  this.path = null;
	  this.href = null;
	}

	// Reference: RFC 3986, RFC 1808, RFC 2396

	// define these here so at least they only have to be
	// compiled once on the first module load.
	var protocolPattern = /^([a-z0-9.+-]+:)/i,
	    portPattern = /:[0-9]*$/,

	    // RFC 2396: characters reserved for delimiting URLs.
	    // We actually just auto-escape these.
	    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

	    // RFC 2396: characters not allowed for various reasons.
	    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

	    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
	    autoEscape = ['\''].concat(unwise),
	    // Characters that are never ever allowed in a hostname.
	    // Note that any invalid chars are also handled, but these
	    // are the ones that are *expected* to be seen, so we fast-path
	    // them.
	    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
	    hostEndingChars = ['/', '?', '#'],
	    hostnameMaxLen = 255,
	    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
	    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
	    // protocols that can allow "unsafe" and "unwise" chars.
	    unsafeProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    // protocols that never have a hostname.
	    hostlessProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    // protocols that always contain a // bit.
	    slashedProtocol = {
	      'http': true,
	      'https': true,
	      'ftp': true,
	      'gopher': true,
	      'file': true,
	      'http:': true,
	      'https:': true,
	      'ftp:': true,
	      'gopher:': true,
	      'file:': true
	    },
	    querystring = __webpack_require__(109);

	function urlParse(url, parseQueryString, slashesDenoteHost) {
	  if (url && isObject(url) && url instanceof Url) return url;

	  var u = new Url;
	  u.parse(url, parseQueryString, slashesDenoteHost);
	  return u;
	}

	Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
	  if (!isString(url)) {
	    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
	  }

	  var rest = url;

	  // trim before proceeding.
	  // This is to support parse stuff like "  http://foo.com  \n"
	  rest = rest.trim();

	  var proto = protocolPattern.exec(rest);
	  if (proto) {
	    proto = proto[0];
	    var lowerProto = proto.toLowerCase();
	    this.protocol = lowerProto;
	    rest = rest.substr(proto.length);
	  }

	  // figure out if it's got a host
	  // user@server is *always* interpreted as a hostname, and url
	  // resolution will treat //foo/bar as host=foo,path=bar because that's
	  // how the browser resolves relative URLs.
	  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
	    var slashes = rest.substr(0, 2) === '//';
	    if (slashes && !(proto && hostlessProtocol[proto])) {
	      rest = rest.substr(2);
	      this.slashes = true;
	    }
	  }

	  if (!hostlessProtocol[proto] &&
	      (slashes || (proto && !slashedProtocol[proto]))) {

	    // there's a hostname.
	    // the first instance of /, ?, ;, or # ends the host.
	    //
	    // If there is an @ in the hostname, then non-host chars *are* allowed
	    // to the left of the last @ sign, unless some host-ending character
	    // comes *before* the @-sign.
	    // URLs are obnoxious.
	    //
	    // ex:
	    // http://a@b@c/ => user:a@b host:c
	    // http://a@b?@c => user:a host:c path:/?@c

	    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
	    // Review our test case against browsers more comprehensively.

	    // find the first instance of any hostEndingChars
	    var hostEnd = -1;
	    for (var i = 0; i < hostEndingChars.length; i++) {
	      var hec = rest.indexOf(hostEndingChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }

	    // at this point, either we have an explicit point where the
	    // auth portion cannot go past, or the last @ char is the decider.
	    var auth, atSign;
	    if (hostEnd === -1) {
	      // atSign can be anywhere.
	      atSign = rest.lastIndexOf('@');
	    } else {
	      // atSign must be in auth portion.
	      // http://a@b/c@d => host:b auth:a path:/c@d
	      atSign = rest.lastIndexOf('@', hostEnd);
	    }

	    // Now we have a portion which is definitely the auth.
	    // Pull that off.
	    if (atSign !== -1) {
	      auth = rest.slice(0, atSign);
	      rest = rest.slice(atSign + 1);
	      this.auth = decodeURIComponent(auth);
	    }

	    // the host is the remaining to the left of the first non-host char
	    hostEnd = -1;
	    for (var i = 0; i < nonHostChars.length; i++) {
	      var hec = rest.indexOf(nonHostChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }
	    // if we still have not hit it, then the entire thing is a host.
	    if (hostEnd === -1)
	      hostEnd = rest.length;

	    this.host = rest.slice(0, hostEnd);
	    rest = rest.slice(hostEnd);

	    // pull out port.
	    this.parseHost();

	    // we've indicated that there is a hostname,
	    // so even if it's empty, it has to be present.
	    this.hostname = this.hostname || '';

	    // if hostname begins with [ and ends with ]
	    // assume that it's an IPv6 address.
	    var ipv6Hostname = this.hostname[0] === '[' &&
	        this.hostname[this.hostname.length - 1] === ']';

	    // validate a little.
	    if (!ipv6Hostname) {
	      var hostparts = this.hostname.split(/\./);
	      for (var i = 0, l = hostparts.length; i < l; i++) {
	        var part = hostparts[i];
	        if (!part) continue;
	        if (!part.match(hostnamePartPattern)) {
	          var newpart = '';
	          for (var j = 0, k = part.length; j < k; j++) {
	            if (part.charCodeAt(j) > 127) {
	              // we replace non-ASCII char with a temporary placeholder
	              // we need this to make sure size of hostname is not
	              // broken by replacing non-ASCII by nothing
	              newpart += 'x';
	            } else {
	              newpart += part[j];
	            }
	          }
	          // we test again with ASCII char only
	          if (!newpart.match(hostnamePartPattern)) {
	            var validParts = hostparts.slice(0, i);
	            var notHost = hostparts.slice(i + 1);
	            var bit = part.match(hostnamePartStart);
	            if (bit) {
	              validParts.push(bit[1]);
	              notHost.unshift(bit[2]);
	            }
	            if (notHost.length) {
	              rest = '/' + notHost.join('.') + rest;
	            }
	            this.hostname = validParts.join('.');
	            break;
	          }
	        }
	      }
	    }

	    if (this.hostname.length > hostnameMaxLen) {
	      this.hostname = '';
	    } else {
	      // hostnames are always lower case.
	      this.hostname = this.hostname.toLowerCase();
	    }

	    if (!ipv6Hostname) {
	      // IDNA Support: Returns a puny coded representation of "domain".
	      // It only converts the part of the domain name that
	      // has non ASCII characters. I.e. it dosent matter if
	      // you call it with a domain that already is in ASCII.
	      var domainArray = this.hostname.split('.');
	      var newOut = [];
	      for (var i = 0; i < domainArray.length; ++i) {
	        var s = domainArray[i];
	        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
	            'xn--' + punycode.encode(s) : s);
	      }
	      this.hostname = newOut.join('.');
	    }

	    var p = this.port ? ':' + this.port : '';
	    var h = this.hostname || '';
	    this.host = h + p;
	    this.href += this.host;

	    // strip [ and ] from the hostname
	    // the host field still retains them, though
	    if (ipv6Hostname) {
	      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
	      if (rest[0] !== '/') {
	        rest = '/' + rest;
	      }
	    }
	  }

	  // now rest is set to the post-host stuff.
	  // chop off any delim chars.
	  if (!unsafeProtocol[lowerProto]) {

	    // First, make 100% sure that any "autoEscape" chars get
	    // escaped, even if encodeURIComponent doesn't think they
	    // need to be.
	    for (var i = 0, l = autoEscape.length; i < l; i++) {
	      var ae = autoEscape[i];
	      var esc = encodeURIComponent(ae);
	      if (esc === ae) {
	        esc = escape(ae);
	      }
	      rest = rest.split(ae).join(esc);
	    }
	  }


	  // chop off from the tail first.
	  var hash = rest.indexOf('#');
	  if (hash !== -1) {
	    // got a fragment string.
	    this.hash = rest.substr(hash);
	    rest = rest.slice(0, hash);
	  }
	  var qm = rest.indexOf('?');
	  if (qm !== -1) {
	    this.search = rest.substr(qm);
	    this.query = rest.substr(qm + 1);
	    if (parseQueryString) {
	      this.query = querystring.parse(this.query);
	    }
	    rest = rest.slice(0, qm);
	  } else if (parseQueryString) {
	    // no query string, but parseQueryString still requested
	    this.search = '';
	    this.query = {};
	  }
	  if (rest) this.pathname = rest;
	  if (slashedProtocol[lowerProto] &&
	      this.hostname && !this.pathname) {
	    this.pathname = '/';
	  }

	  //to support http.request
	  if (this.pathname || this.search) {
	    var p = this.pathname || '';
	    var s = this.search || '';
	    this.path = p + s;
	  }

	  // finally, reconstruct the href based on what has been validated.
	  this.href = this.format();
	  return this;
	};

	// format a parsed object into a url string
	function urlFormat(obj) {
	  // ensure it's an object, and not a string url.
	  // If it's an obj, this is a no-op.
	  // this way, you can call url_format() on strings
	  // to clean up potentially wonky urls.
	  if (isString(obj)) obj = urlParse(obj);
	  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
	  return obj.format();
	}

	Url.prototype.format = function() {
	  var auth = this.auth || '';
	  if (auth) {
	    auth = encodeURIComponent(auth);
	    auth = auth.replace(/%3A/i, ':');
	    auth += '@';
	  }

	  var protocol = this.protocol || '',
	      pathname = this.pathname || '',
	      hash = this.hash || '',
	      host = false,
	      query = '';

	  if (this.host) {
	    host = auth + this.host;
	  } else if (this.hostname) {
	    host = auth + (this.hostname.indexOf(':') === -1 ?
	        this.hostname :
	        '[' + this.hostname + ']');
	    if (this.port) {
	      host += ':' + this.port;
	    }
	  }

	  if (this.query &&
	      isObject(this.query) &&
	      Object.keys(this.query).length) {
	    query = querystring.stringify(this.query);
	  }

	  var search = this.search || (query && ('?' + query)) || '';

	  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

	  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
	  // unless they had them to begin with.
	  if (this.slashes ||
	      (!protocol || slashedProtocol[protocol]) && host !== false) {
	    host = '//' + (host || '');
	    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
	  } else if (!host) {
	    host = '';
	  }

	  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
	  if (search && search.charAt(0) !== '?') search = '?' + search;

	  pathname = pathname.replace(/[?#]/g, function(match) {
	    return encodeURIComponent(match);
	  });
	  search = search.replace('#', '%23');

	  return protocol + host + pathname + search + hash;
	};

	function urlResolve(source, relative) {
	  return urlParse(source, false, true).resolve(relative);
	}

	Url.prototype.resolve = function(relative) {
	  return this.resolveObject(urlParse(relative, false, true)).format();
	};

	function urlResolveObject(source, relative) {
	  if (!source) return relative;
	  return urlParse(source, false, true).resolveObject(relative);
	}

	Url.prototype.resolveObject = function(relative) {
	  if (isString(relative)) {
	    var rel = new Url();
	    rel.parse(relative, false, true);
	    relative = rel;
	  }

	  var result = new Url();
	  Object.keys(this).forEach(function(k) {
	    result[k] = this[k];
	  }, this);

	  // hash is always overridden, no matter what.
	  // even href="" will remove it.
	  result.hash = relative.hash;

	  // if the relative url is empty, then there's nothing left to do here.
	  if (relative.href === '') {
	    result.href = result.format();
	    return result;
	  }

	  // hrefs like //foo/bar always cut to the protocol.
	  if (relative.slashes && !relative.protocol) {
	    // take everything except the protocol from relative
	    Object.keys(relative).forEach(function(k) {
	      if (k !== 'protocol')
	        result[k] = relative[k];
	    });

	    //urlParse appends trailing / to urls like http://www.example.com
	    if (slashedProtocol[result.protocol] &&
	        result.hostname && !result.pathname) {
	      result.path = result.pathname = '/';
	    }

	    result.href = result.format();
	    return result;
	  }

	  if (relative.protocol && relative.protocol !== result.protocol) {
	    // if it's a known url protocol, then changing
	    // the protocol does weird things
	    // first, if it's not file:, then we MUST have a host,
	    // and if there was a path
	    // to begin with, then we MUST have a path.
	    // if it is file:, then the host is dropped,
	    // because that's known to be hostless.
	    // anything else is assumed to be absolute.
	    if (!slashedProtocol[relative.protocol]) {
	      Object.keys(relative).forEach(function(k) {
	        result[k] = relative[k];
	      });
	      result.href = result.format();
	      return result;
	    }

	    result.protocol = relative.protocol;
	    if (!relative.host && !hostlessProtocol[relative.protocol]) {
	      var relPath = (relative.pathname || '').split('/');
	      while (relPath.length && !(relative.host = relPath.shift()));
	      if (!relative.host) relative.host = '';
	      if (!relative.hostname) relative.hostname = '';
	      if (relPath[0] !== '') relPath.unshift('');
	      if (relPath.length < 2) relPath.unshift('');
	      result.pathname = relPath.join('/');
	    } else {
	      result.pathname = relative.pathname;
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    result.host = relative.host || '';
	    result.auth = relative.auth;
	    result.hostname = relative.hostname || relative.host;
	    result.port = relative.port;
	    // to support http.request
	    if (result.pathname || result.search) {
	      var p = result.pathname || '';
	      var s = result.search || '';
	      result.path = p + s;
	    }
	    result.slashes = result.slashes || relative.slashes;
	    result.href = result.format();
	    return result;
	  }

	  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
	      isRelAbs = (
	          relative.host ||
	          relative.pathname && relative.pathname.charAt(0) === '/'
	      ),
	      mustEndAbs = (isRelAbs || isSourceAbs ||
	                    (result.host && relative.pathname)),
	      removeAllDots = mustEndAbs,
	      srcPath = result.pathname && result.pathname.split('/') || [],
	      relPath = relative.pathname && relative.pathname.split('/') || [],
	      psychotic = result.protocol && !slashedProtocol[result.protocol];

	  // if the url is a non-slashed url, then relative
	  // links like ../.. should be able
	  // to crawl up to the hostname, as well.  This is strange.
	  // result.protocol has already been set by now.
	  // Later on, put the first path part into the host field.
	  if (psychotic) {
	    result.hostname = '';
	    result.port = null;
	    if (result.host) {
	      if (srcPath[0] === '') srcPath[0] = result.host;
	      else srcPath.unshift(result.host);
	    }
	    result.host = '';
	    if (relative.protocol) {
	      relative.hostname = null;
	      relative.port = null;
	      if (relative.host) {
	        if (relPath[0] === '') relPath[0] = relative.host;
	        else relPath.unshift(relative.host);
	      }
	      relative.host = null;
	    }
	    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
	  }

	  if (isRelAbs) {
	    // it's absolute.
	    result.host = (relative.host || relative.host === '') ?
	                  relative.host : result.host;
	    result.hostname = (relative.hostname || relative.hostname === '') ?
	                      relative.hostname : result.hostname;
	    result.search = relative.search;
	    result.query = relative.query;
	    srcPath = relPath;
	    // fall through to the dot-handling below.
	  } else if (relPath.length) {
	    // it's relative
	    // throw away the existing file, and take the new path instead.
	    if (!srcPath) srcPath = [];
	    srcPath.pop();
	    srcPath = srcPath.concat(relPath);
	    result.search = relative.search;
	    result.query = relative.query;
	  } else if (!isNullOrUndefined(relative.search)) {
	    // just pull out the search.
	    // like href='?foo'.
	    // Put this after the other two cases because it simplifies the booleans
	    if (psychotic) {
	      result.hostname = result.host = srcPath.shift();
	      //occationaly the auth can get stuck only in host
	      //this especialy happens in cases like
	      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	      var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                       result.host.split('@') : false;
	      if (authInHost) {
	        result.auth = authInHost.shift();
	        result.host = result.hostname = authInHost.shift();
	      }
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    //to support http.request
	    if (!isNull(result.pathname) || !isNull(result.search)) {
	      result.path = (result.pathname ? result.pathname : '') +
	                    (result.search ? result.search : '');
	    }
	    result.href = result.format();
	    return result;
	  }

	  if (!srcPath.length) {
	    // no path at all.  easy.
	    // we've already handled the other stuff above.
	    result.pathname = null;
	    //to support http.request
	    if (result.search) {
	      result.path = '/' + result.search;
	    } else {
	      result.path = null;
	    }
	    result.href = result.format();
	    return result;
	  }

	  // if a url ENDs in . or .., then it must get a trailing slash.
	  // however, if it ends in anything else non-slashy,
	  // then it must NOT get a trailing slash.
	  var last = srcPath.slice(-1)[0];
	  var hasTrailingSlash = (
	      (result.host || relative.host) && (last === '.' || last === '..') ||
	      last === '');

	  // strip single dots, resolve double dots to parent dir
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = srcPath.length; i >= 0; i--) {
	    last = srcPath[i];
	    if (last == '.') {
	      srcPath.splice(i, 1);
	    } else if (last === '..') {
	      srcPath.splice(i, 1);
	      up++;
	    } else if (up) {
	      srcPath.splice(i, 1);
	      up--;
	    }
	  }

	  // if the path is allowed to go above the root, restore leading ..s
	  if (!mustEndAbs && !removeAllDots) {
	    for (; up--; up) {
	      srcPath.unshift('..');
	    }
	  }

	  if (mustEndAbs && srcPath[0] !== '' &&
	      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
	    srcPath.unshift('');
	  }

	  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
	    srcPath.push('');
	  }

	  var isAbsolute = srcPath[0] === '' ||
	      (srcPath[0] && srcPath[0].charAt(0) === '/');

	  // put the host back
	  if (psychotic) {
	    result.hostname = result.host = isAbsolute ? '' :
	                                    srcPath.length ? srcPath.shift() : '';
	    //occationaly the auth can get stuck only in host
	    //this especialy happens in cases like
	    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	    var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                     result.host.split('@') : false;
	    if (authInHost) {
	      result.auth = authInHost.shift();
	      result.host = result.hostname = authInHost.shift();
	    }
	  }

	  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

	  if (mustEndAbs && !isAbsolute) {
	    srcPath.unshift('');
	  }

	  if (!srcPath.length) {
	    result.pathname = null;
	    result.path = null;
	  } else {
	    result.pathname = srcPath.join('/');
	  }

	  //to support request.http
	  if (!isNull(result.pathname) || !isNull(result.search)) {
	    result.path = (result.pathname ? result.pathname : '') +
	                  (result.search ? result.search : '');
	  }
	  result.auth = relative.auth || result.auth;
	  result.slashes = result.slashes || relative.slashes;
	  result.href = result.format();
	  return result;
	};

	Url.prototype.parseHost = function() {
	  var host = this.host;
	  var port = portPattern.exec(host);
	  if (port) {
	    port = port[0];
	    if (port !== ':') {
	      this.port = port.substr(1);
	    }
	    host = host.substr(0, host.length - port.length);
	  }
	  if (host) this.hostname = host;
	};

	function isString(arg) {
	  return typeof arg === "string";
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isNull(arg) {
	  return arg === null;
	}
	function isNullOrUndefined(arg) {
	  return  arg == null;
	}


/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var url = __webpack_require__(43);

	//Parse method copied from https://github.com/brianc/node-postgres
	//Copyright (c) 2010-2014 Brian Carlson (brian.m.carlson@gmail.com)
	//MIT License

	//parses a connection string
	function parse(str) {
	  var config;
	  //unix socket
	  if(str.charAt(0) === '/') {
	    config = str.split(' ');
	    return { host: config[0], database: config[1] };
	  }
	  // url parse expects spaces encoded as %20
	  if(/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) {
	    str = encodeURI(str).replace(/\%25(\d\d)/g, "%$1");
	  }
	  var result = url.parse(str, true);
	  config = {};

	  if (result.query.application_name) {
	    config.application_name = result.query.application_name;
	  }
	  if (result.query.fallback_application_name) {
	    config.fallback_application_name = result.query.fallback_application_name;
	  }

	  config.port = result.port;
	  if(result.protocol == 'socket:') {
	    config.host = decodeURI(result.pathname);
	    config.database = result.query.db;
	    config.client_encoding = result.query.encoding;
	    return config;
	  }
	  config.host = result.hostname;

	  // result.pathname is not always guaranteed to have a '/' prefix (e.g. relative urls)
	  // only strip the slash if it is present.
	  var pathname = result.pathname;
	  if (pathname && pathname.charAt(0) === '/') {
	    pathname = result.pathname.slice(1) || null;
	  }
	  config.database = pathname && decodeURI(pathname);

	  var auth = (result.auth || ':').split(':');
	  config.user = auth[0];
	  config.password = auth.splice(1).join(':');

	  var ssl = result.query.ssl;
	  if (ssl === 'true' || ssl === '1') {
	    config.ssl = true;
	  }

	  return config;
	}

	module.exports = {
	  parse: parse
	};


/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_45__;

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * This is the web browser implementation of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = __webpack_require__(99);
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = 'undefined' != typeof chrome
	               && 'undefined' != typeof chrome.storage
	                  ? chrome.storage.local
	                  : localstorage();

	/**
	 * Colors.
	 */

	exports.colors = [
	  'lightseagreen',
	  'forestgreen',
	  'goldenrod',
	  'dodgerblue',
	  'darkorchid',
	  'crimson'
	];

	/**
	 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
	 * and the Firebug extension (any Firefox version) are known
	 * to support "%c" CSS customizations.
	 *
	 * TODO: add a `localStorage` variable to explicitly enable/disable colors
	 */

	function useColors() {
	  // is webkit? http://stackoverflow.com/a/16459606/376773
	  return ('WebkitAppearance' in document.documentElement.style) ||
	    // is firebug? http://stackoverflow.com/a/398120/376773
	    (window.console && (console.firebug || (console.exception && console.table))) ||
	    // is firefox >= v31?
	    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
	    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
	}

	/**
	 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	 */

	exports.formatters.j = function(v) {
	  return JSON.stringify(v);
	};


	/**
	 * Colorize log arguments if enabled.
	 *
	 * @api public
	 */

	function formatArgs() {
	  var args = arguments;
	  var useColors = this.useColors;

	  args[0] = (useColors ? '%c' : '')
	    + this.namespace
	    + (useColors ? ' %c' : ' ')
	    + args[0]
	    + (useColors ? '%c ' : ' ')
	    + '+' + exports.humanize(this.diff);

	  if (!useColors) return args;

	  var c = 'color: ' + this.color;
	  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

	  // the final "%c" is somewhat tricky, because there could be other
	  // arguments passed either before or after the %c, so we need to
	  // figure out the correct index to insert the CSS into
	  var index = 0;
	  var lastC = 0;
	  args[0].replace(/%[a-z%]/g, function(match) {
	    if ('%%' === match) return;
	    index++;
	    if ('%c' === match) {
	      // we only are interested in the *last* %c
	      // (the user may have provided their own)
	      lastC = index;
	    }
	  });

	  args.splice(lastC, 0, c);
	  return args;
	}

	/**
	 * Invokes `console.log()` when available.
	 * No-op when `console.log` is not a "function".
	 *
	 * @api public
	 */

	function log() {
	  // this hackery is required for IE8/9, where
	  // the `console.log` function doesn't have 'apply'
	  return 'object' === typeof console
	    && console.log
	    && Function.prototype.apply.call(console.log, console, arguments);
	}

	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */

	function save(namespaces) {
	  try {
	    if (null == namespaces) {
	      exports.storage.removeItem('debug');
	    } else {
	      exports.storage.debug = namespaces;
	    }
	  } catch(e) {}
	}

	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */

	function load() {
	  var r;
	  try {
	    r = exports.storage.debug;
	  } catch(e) {}
	  return r;
	}

	/**
	 * Enable namespaces listed in `localStorage.debug` initially.
	 */

	exports.enable(load());

	/**
	 * Localstorage attempts to return the localstorage.
	 *
	 * This is necessary because safari throws
	 * when a user disables cookies/localstorage
	 * and you attempt to access it.
	 *
	 * @return {LocalStorage}
	 * @api private
	 */

	function localstorage(){
	  try {
	    return window.localStorage;
	  } catch (e) {}
	}


/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	/* (ignored) */

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	/* (ignored) */

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	/* (ignored) */

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	/* (ignored) */

/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	/* (ignored) */

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	/* (ignored) */

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	/* (ignored) */

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	/* (ignored) */

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	var arrayEach = __webpack_require__(100),
	    baseCallback = __webpack_require__(101),
	    baseCreate = __webpack_require__(102),
	    baseForOwn = __webpack_require__(103),
	    isArray = __webpack_require__(104),
	    isFunction = __webpack_require__(105),
	    isObject = __webpack_require__(106),
	    isTypedArray = __webpack_require__(107);

	/**
	 * An alternative to `_.reduce`; this method transforms `object` to a new
	 * `accumulator` object which is the result of running each of its own enumerable
	 * properties through `iteratee`, with each invocation potentially mutating
	 * the `accumulator` object. The `iteratee` is bound to `thisArg` and invoked
	 * with four arguments: (accumulator, value, key, object). Iteratee functions
	 * may exit iteration early by explicitly returning `false`.
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Array|Object} object The object to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @param {*} [accumulator] The custom accumulator value.
	 * @param {*} [thisArg] The `this` binding of `iteratee`.
	 * @returns {*} Returns the accumulated value.
	 * @example
	 *
	 * _.transform([2, 3, 4], function(result, n) {
	 *   result.push(n *= n);
	 *   return n % 2 == 0;
	 * });
	 * // => [4, 9]
	 *
	 * _.transform({ 'a': 1, 'b': 2 }, function(result, n, key) {
	 *   result[key] = n * 3;
	 * });
	 * // => { 'a': 3, 'b': 6 }
	 */
	function transform(object, iteratee, accumulator, thisArg) {
	  var isArr = isArray(object) || isTypedArray(object);
	  iteratee = baseCallback(iteratee, thisArg, 4);

	  if (accumulator == null) {
	    if (isArr || isObject(object)) {
	      var Ctor = object.constructor;
	      if (isArr) {
	        accumulator = isArray(object) ? new Ctor : [];
	      } else {
	        accumulator = baseCreate(isFunction(Ctor) ? Ctor.prototype : undefined);
	      }
	    } else {
	      accumulator = {};
	    }
	  }
	  (isArr ? arrayEach : baseForOwn)(object, function(value, index, object) {
	    return iteratee(accumulator, value, index, object);
	  });
	  return accumulator;
	}

	module.exports = transform;


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var assign = __webpack_require__(28);

	// JoinClause
	// -------

	// The "JoinClause" is an object holding any necessary info about a join,
	// including the type, and any associated tables & columns being joined.
	function JoinClause(table, type, schema) {
	  this.schema = schema;
	  this.table = table;
	  this.joinType = type;
	  this.and = this;
	  this.clauses = [];
	}

	assign(JoinClause.prototype, {

	  grouping: 'join',

	  // Adds an "on" clause to the current join object.
	  on: function on(first, operator, second) {
	    var data,
	        bool = this._bool();
	    switch (arguments.length) {
	      case 1:
	        {
	          if (typeof first === 'object' && typeof first.toSQL !== 'function') {
	            var i = -1,
	                keys = Object.keys(first);
	            var method = bool === 'or' ? 'orOn' : 'on';
	            while (++i < keys.length) {
	              this[method](keys[i], first[keys[i]]);
	            }
	            return this;
	          } else {
	            data = [bool, 'on', first];
	          }
	          break;
	        }
	      case 2:
	        data = [bool, 'on', first, '=', operator];break;
	      default:
	        data = [bool, 'on', first, operator, second];
	    }
	    this.clauses.push(data);
	    return this;
	  },

	  // Adds a "using" clause to the current join.
	  using: function using(column) {
	    return this.clauses.push([this._bool(), 'using', column]);
	  },

	  // Adds an "and on" clause to the current join object.
	  andOn: function andOn() {
	    return this.on.apply(this, arguments);
	  },

	  // Adds an "or on" clause to the current join object.
	  orOn: function orOn(first, operator, second) {
	    /*jshint unused: false*/
	    return this._bool('or').on.apply(this, arguments);
	  },

	  // Explicitly set the type of join, useful within a function when creating a grouped join.
	  type: function type(_type) {
	    this.joinType = _type;
	    return this;
	  },

	  _bool: function _bool(bool) {
	    if (arguments.length === 1) {
	      this._boolFlag = bool;
	      return this;
	    }
	    var ret = this._boolFlag || 'and';
	    this._boolFlag = 'and';
	    return ret;
	  }

	});

	Object.defineProperty(JoinClause.prototype, 'or', {
	  get: function get() {
	    return this._bool('or');
	  }
	});

	module.exports = JoinClause;

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(11);

	// Push a new query onto the compiled "sequence" stack,
	// creating a new formatter, returning the compiler.
	exports.pushQuery = function (query) {
	  if (!query) return;
	  if (_.isString(query)) {
	    query = { sql: query };
	  } else {
	    query = query;
	  }
	  if (!query.bindings) {
	    query.bindings = this.formatter.bindings;
	  }
	  this.sequence.push(query);
	  this.formatter = this.client.formatter();
	};

	// Used in cases where we need to push some additional column specific statements.
	exports.pushAdditional = function (fn) {
	  var child = new this.constructor(this.client, this.tableCompiler, this.columnBuilder);
	  fn.call(child, _.rest(arguments));
	  this.sequence.additional = (this.sequence.additional || []).concat(child.sequence);
	};

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	var keys = __webpack_require__(110);

	/**
	 * A specialized version of `_.assign` for customizing assigned values without
	 * support for argument juggling, multiple sources, and `this` binding `customizer`
	 * functions.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @param {Function} customizer The function to customize assigned values.
	 * @returns {Object} Returns `object`.
	 */
	function assignWith(object, source, customizer) {
	  var index = -1,
	      props = keys(source),
	      length = props.length;

	  while (++index < length) {
	    var key = props[index],
	        value = object[key],
	        result = customizer(value, source[key], key, object, source);

	    if ((result === result ? (result !== value) : (value === value)) ||
	        (value === undefined && !(key in object))) {
	      object[key] = result;
	    }
	  }
	  return object;
	}

	module.exports = assignWith;


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var baseCopy = __webpack_require__(111),
	    keys = __webpack_require__(110);

	/**
	 * The base implementation of `_.assign` without support for argument juggling,
	 * multiple sources, and `customizer` functions.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @returns {Object} Returns `object`.
	 */
	function baseAssign(object, source) {
	  return source == null
	    ? object
	    : baseCopy(source, keys(source), object);
	}

	module.exports = baseAssign;


/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	var bindCallback = __webpack_require__(67),
	    isIterateeCall = __webpack_require__(112),
	    restParam = __webpack_require__(113);

	/**
	 * Creates a `_.assign`, `_.defaults`, or `_.merge` function.
	 *
	 * @private
	 * @param {Function} assigner The function to assign values.
	 * @returns {Function} Returns the new assigner function.
	 */
	function createAssigner(assigner) {
	  return restParam(function(object, sources) {
	    var index = -1,
	        length = object == null ? 0 : sources.length,
	        customizer = length > 2 ? sources[length - 2] : undefined,
	        guard = length > 2 ? sources[2] : undefined,
	        thisArg = length > 1 ? sources[length - 1] : undefined;

	    if (typeof customizer == 'function') {
	      customizer = bindCallback(customizer, thisArg, 5);
	      length -= 2;
	    } else {
	      customizer = typeof thisArg == 'function' ? thisArg : undefined;
	      length -= (customizer ? 1 : 0);
	    }
	    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
	      customizer = length < 3 ? undefined : customizer;
	      length = 1;
	    }
	    while (++index < length) {
	      var source = sources[index];
	      if (source) {
	        assigner(object, source, customizer);
	      }
	    }
	    return object;
	  });
	}

	module.exports = createAssigner;


/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A specialized version of `_.reduce` for arrays without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {*} [accumulator] The initial value.
	 * @param {boolean} [initFromArray] Specify using the first element of `array`
	 *  as the initial value.
	 * @returns {*} Returns the accumulated value.
	 */
	function arrayReduce(array, iteratee, accumulator, initFromArray) {
	  var index = -1,
	      length = array.length;

	  if (initFromArray && length) {
	    accumulator = array[++index];
	  }
	  while (++index < length) {
	    accumulator = iteratee(accumulator, array[index], index, array);
	  }
	  return accumulator;
	}

	module.exports = arrayReduce;


/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	var baseForOwn = __webpack_require__(103),
	    createBaseEach = __webpack_require__(114);

	/**
	 * The base implementation of `_.forEach` without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array|Object|string} Returns `collection`.
	 */
	var baseEach = createBaseEach(baseForOwn);

	module.exports = baseEach;


/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var baseCallback = __webpack_require__(101),
	    baseReduce = __webpack_require__(115),
	    isArray = __webpack_require__(104);

	/**
	 * Creates a function for `_.reduce` or `_.reduceRight`.
	 *
	 * @private
	 * @param {Function} arrayFunc The function to iterate over an array.
	 * @param {Function} eachFunc The function to iterate over a collection.
	 * @returns {Function} Returns the new each function.
	 */
	function createReduce(arrayFunc, eachFunc) {
	  return function(collection, iteratee, accumulator, thisArg) {
	    var initFromArray = arguments.length < 3;
	    return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
	      ? arrayFunc(collection, iteratee, accumulator, initFromArray)
	      : baseReduce(collection, baseCallback(iteratee, thisArg, 4), accumulator, initFromArray, eachFunc);
	  };
	}

	module.exports = createReduce;


/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Converts `value` to a string if it's not one. An empty string is returned
	 * for `null` or `undefined` values.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */
	function baseToString(value) {
	  return value == null ? '' : (value + '');
	}

	module.exports = baseToString;


/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	var arrayCopy = __webpack_require__(116),
	    arrayEach = __webpack_require__(100),
	    baseAssign = __webpack_require__(60),
	    baseForOwn = __webpack_require__(103),
	    initCloneArray = __webpack_require__(117),
	    initCloneByTag = __webpack_require__(118),
	    initCloneObject = __webpack_require__(119),
	    isArray = __webpack_require__(104),
	    isObject = __webpack_require__(106);

	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    funcTag = '[object Function]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    objectTag = '[object Object]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    weakMapTag = '[object WeakMap]';

	var arrayBufferTag = '[object ArrayBuffer]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';

	/** Used to identify `toStringTag` values supported by `_.clone`. */
	var cloneableTags = {};
	cloneableTags[argsTag] = cloneableTags[arrayTag] =
	cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
	cloneableTags[dateTag] = cloneableTags[float32Tag] =
	cloneableTags[float64Tag] = cloneableTags[int8Tag] =
	cloneableTags[int16Tag] = cloneableTags[int32Tag] =
	cloneableTags[numberTag] = cloneableTags[objectTag] =
	cloneableTags[regexpTag] = cloneableTags[stringTag] =
	cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
	cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
	cloneableTags[errorTag] = cloneableTags[funcTag] =
	cloneableTags[mapTag] = cloneableTags[setTag] =
	cloneableTags[weakMapTag] = false;

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;

	/**
	 * The base implementation of `_.clone` without support for argument juggling
	 * and `this` binding `customizer` functions.
	 *
	 * @private
	 * @param {*} value The value to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @param {Function} [customizer] The function to customize cloning values.
	 * @param {string} [key] The key of `value`.
	 * @param {Object} [object] The object `value` belongs to.
	 * @param {Array} [stackA=[]] Tracks traversed source objects.
	 * @param {Array} [stackB=[]] Associates clones with source counterparts.
	 * @returns {*} Returns the cloned value.
	 */
	function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
	  var result;
	  if (customizer) {
	    result = object ? customizer(value, key, object) : customizer(value);
	  }
	  if (result !== undefined) {
	    return result;
	  }
	  if (!isObject(value)) {
	    return value;
	  }
	  var isArr = isArray(value);
	  if (isArr) {
	    result = initCloneArray(value);
	    if (!isDeep) {
	      return arrayCopy(value, result);
	    }
	  } else {
	    var tag = objToString.call(value),
	        isFunc = tag == funcTag;

	    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
	      result = initCloneObject(isFunc ? {} : value);
	      if (!isDeep) {
	        return baseAssign(result, value);
	      }
	    } else {
	      return cloneableTags[tag]
	        ? initCloneByTag(value, tag, isDeep)
	        : (object ? value : {});
	    }
	  }
	  // Check for circular references and return its corresponding clone.
	  stackA || (stackA = []);
	  stackB || (stackB = []);

	  var length = stackA.length;
	  while (length--) {
	    if (stackA[length] == value) {
	      return stackB[length];
	    }
	  }
	  // Add the source value to the stack of traversed objects and associate it with its clone.
	  stackA.push(value);
	  stackB.push(result);

	  // Recursively populate clone (susceptible to call stack limits).
	  (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
	    result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
	  });
	  return result;
	}

	module.exports = baseClone;


/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	var identity = __webpack_require__(120);

	/**
	 * A specialized version of `baseCallback` which only supports `this` binding
	 * and specifying the number of arguments to provide to `func`.
	 *
	 * @private
	 * @param {Function} func The function to bind.
	 * @param {*} thisArg The `this` binding of `func`.
	 * @param {number} [argCount] The number of arguments to provide to `func`.
	 * @returns {Function} Returns the callback.
	 */
	function bindCallback(func, thisArg, argCount) {
	  if (typeof func != 'function') {
	    return identity;
	  }
	  if (thisArg === undefined) {
	    return func;
	  }
	  switch (argCount) {
	    case 1: return function(value) {
	      return func.call(thisArg, value);
	    };
	    case 3: return function(value, index, collection) {
	      return func.call(thisArg, value, index, collection);
	    };
	    case 4: return function(accumulator, value, index, collection) {
	      return func.call(thisArg, accumulator, value, index, collection);
	    };
	    case 5: return function(value, other, key, object, source) {
	      return func.call(thisArg, value, other, key, object, source);
	    };
	  }
	  return function() {
	    return func.apply(thisArg, arguments);
	  };
	}

	module.exports = bindCallback;


/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	var map = __webpack_require__(126),
	    property = __webpack_require__(127);

	/**
	 * Gets the property value of `path` from all elements in `collection`.
	 *
	 * @static
	 * @memberOf _
	 * @category Collection
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Array|string} path The path of the property to pluck.
	 * @returns {Array} Returns the property values.
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'barney', 'age': 36 },
	 *   { 'user': 'fred',   'age': 40 }
	 * ];
	 *
	 * _.pluck(users, 'user');
	 * // => ['barney', 'fred']
	 *
	 * var userIndex = _.indexBy(users, 'user');
	 * _.pluck(userIndex, 'age');
	 * // => [36, 40] (iteration order is not guaranteed)
	 */
	function pluck(collection, path) {
	  return map(collection, property(path));
	}

	module.exports = pluck;


/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Transaction = __webpack_require__(15);
	var assign = __webpack_require__(28);
	var inherits = __webpack_require__(46);
	var debug = __webpack_require__(47)('knex:tx');
	var helpers = __webpack_require__(2);

	function Transaction_Maria() {
	  Transaction.apply(this, arguments);
	}
	inherits(Transaction_Maria, Transaction);

	assign(Transaction_Maria.prototype, {

	  query: function query(conn, sql, status, value) {
	    var t = this;
	    var q = this.trxClient.query(conn, sql)['catch'](function (err) {
	      return err.code === 1305;
	    }, function () {
	      helpers.warn('Transaction was implicitly committed, do not mix transactions and DDL with MariaDB (#805)');
	    })['catch'](function (err) {
	      status = 2;
	      value = err;
	      t._completed = true;
	      debug('%s error running transaction query', t.txid);
	    }).tap(function () {
	      if (status === 1) t._resolver(value);
	      if (status === 2) t._rejecter(value);
	    });
	    if (status === 1 || status === 2) {
	      t._completed = true;
	    }
	    return q;
	  }

	});

	module.exports = Transaction_Maria;

/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Transaction = __webpack_require__(15);
	var assign = __webpack_require__(28);
	var inherits = __webpack_require__(46);
	var debug = __webpack_require__(47)('knex:tx');
	var helpers = __webpack_require__(2);

	function Transaction_MySQL() {
	  Transaction.apply(this, arguments);
	}
	inherits(Transaction_MySQL, Transaction);

	assign(Transaction_MySQL.prototype, {

	  query: function query(conn, sql, status, value) {
	    var t = this;
	    var q = this.trxClient.query(conn, sql)['catch'](function (err) {
	      return err.errno === 1305;
	    }, function () {
	      helpers.warn('Transaction was implicitly committed, do not mix transactions and DDL with MySQL (#805)');
	    })['catch'](function (err) {
	      status = 2;
	      value = err;
	      t._completed = true;
	      debug('%s error running transaction query', t.txid);
	    }).tap(function () {
	      if (status === 1) t._resolver(value);
	      if (status === 2) t._rejecter(value);
	    });
	    if (status === 1 || status === 2) {
	      t._completed = true;
	    }
	    return q;
	  }

	});

	module.exports = Transaction_MySQL;

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	
	// MySQL Query Compiler
	// ------
	'use strict';

	var inherits = __webpack_require__(46);
	var QueryCompiler = __webpack_require__(17);
	var assign = __webpack_require__(28);

	function QueryCompiler_MySQL(client, builder) {
	  QueryCompiler.call(this, client, builder);
	}
	inherits(QueryCompiler_MySQL, QueryCompiler);

	assign(QueryCompiler_MySQL.prototype, {

	  _emptyInsertValue: '() values ()',

	  // Update method, including joins, wheres, order & limits.
	  update: function update() {
	    var join = this.join();
	    var updates = this._prepUpdate(this.single.update);
	    var where = this.where();
	    var order = this.order();
	    var limit = this.limit();
	    return 'update ' + this.tableName + (join ? ' ' + join : '') + ' set ' + updates.join(', ') + (where ? ' ' + where : '') + (order ? ' ' + order : '') + (limit ? ' ' + limit : '');
	  },

	  forUpdate: function forUpdate() {
	    return 'for update';
	  },

	  forShare: function forShare() {
	    return 'lock in share mode';
	  },

	  // Compiles a `columnInfo` query.
	  columnInfo: function columnInfo() {
	    var column = this.single.columnInfo;
	    return {
	      sql: 'select * from information_schema.columns where table_name = ? and table_schema = ?',
	      bindings: [this.single.table, this.client.database()],
	      output: function output(resp) {
	        var out = resp.reduce(function (columns, val) {
	          columns[val.COLUMN_NAME] = {
	            defaultValue: val.COLUMN_DEFAULT,
	            type: val.DATA_TYPE,
	            maxLength: val.CHARACTER_MAXIMUM_LENGTH,
	            nullable: val.IS_NULLABLE === 'YES'
	          };
	          return columns;
	        }, {});
	        return column && out[column] || out;
	      }
	    };
	  },

	  limit: function limit() {
	    var noLimit = !this.single.limit && this.single.limit !== 0;
	    if (noLimit && !this.single.offset) return '';

	    // Workaround for offset only, see http://stackoverflow.com/questions/255517/mysql-offset-infinite-rows
	    return 'limit ' + (this.single.offset && noLimit ? '18446744073709551615' : this.formatter.parameter(this.single.limit));
	  }

	});

	// Set the QueryBuilder & QueryCompiler on the client object,
	// incase anyone wants to modify things to suit their own purposes.
	module.exports = QueryCompiler_MySQL;

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	
	// MySQL Schema Compiler
	// -------
	'use strict';

	var inherits = __webpack_require__(46);
	var SchemaCompiler = __webpack_require__(19);
	var assign = __webpack_require__(28);

	function SchemaCompiler_MySQL(client, builder) {
	  SchemaCompiler.call(this, client, builder);
	}
	inherits(SchemaCompiler_MySQL, SchemaCompiler);

	assign(SchemaCompiler_MySQL.prototype, {

	  // Rename a table on the schema.
	  renameTable: function renameTable(tableName, to) {
	    this.pushQuery('rename table ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
	  },

	  // Check whether a table exists on the query.
	  hasTable: function hasTable(tableName) {
	    this.pushQuery({
	      sql: 'show tables like ' + this.formatter.parameter(tableName),
	      output: function output(resp) {
	        return resp.length > 0;
	      }
	    });
	  },

	  // Check whether a column exists on the schema.
	  hasColumn: function hasColumn(tableName, column) {
	    this.pushQuery({
	      sql: 'show columns from ' + this.formatter.wrap(tableName) + ' like ' + this.formatter.parameter(column),
	      output: function output(resp) {
	        return resp.length > 0;
	      }
	    });
	  }

	});

	module.exports = SchemaCompiler_MySQL;

/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	
	// MySQL Table Builder & Compiler
	// -------
	'use strict';

	var inherits = __webpack_require__(46);
	var TableCompiler = __webpack_require__(21);
	var helpers = __webpack_require__(2);
	var Promise = __webpack_require__(8);
	var assign = __webpack_require__(28);

	// Table Compiler
	// ------

	function TableCompiler_MySQL() {
	  TableCompiler.apply(this, arguments);
	}
	inherits(TableCompiler_MySQL, TableCompiler);

	assign(TableCompiler_MySQL.prototype, {

	  createQuery: function createQuery(columns, ifNot) {
	    var createStatement = ifNot ? 'create table if not exists ' : 'create table ';
	    var client = this.client,
	        conn = {},
	        sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')';

	    // Check if the connection settings are set.
	    if (client.connectionSettings) {
	      conn = client.connectionSettings;
	    }

	    var charset = this.single.charset || conn.charset || '';
	    var collation = this.single.collate || conn.collate || '';
	    var engine = this.single.engine || '';

	    // var conn = builder.client.connectionSettings;
	    if (charset) sql += ' default character set ' + charset;
	    if (collation) sql += ' collate ' + collation;
	    if (engine) sql += ' engine = ' + engine;

	    if (this.single.comment) {
	      var comment = this.single.comment || '';
	      if (comment.length > 60) helpers.warn('The max length for a table comment is 60 characters');
	      sql += " comment = '" + comment + "'";
	    }

	    this.pushQuery(sql);
	  },

	  addColumnsPrefix: 'add ',

	  dropColumnPrefix: 'drop ',

	  // Compiles the comment on the table.
	  comment: function comment(_comment) {
	    this.pushQuery('alter table ' + this.tableName() + " comment = '" + _comment + "'");
	  },

	  changeType: function changeType() {
	    // alter table + table + ' modify ' + wrapped + '// type';
	  },

	  // Renames a column on the table.
	  renameColumn: function renameColumn(from, to) {
	    var compiler = this;
	    var table = this.tableName();
	    var wrapped = this.formatter.wrap(from) + ' ' + this.formatter.wrap(to);

	    this.pushQuery({
	      sql: 'show fields from ' + table + ' where field = ' + this.formatter.parameter(from),
	      output: function output(resp) {
	        var column = resp[0];
	        var runner = this;
	        return compiler.getFKRefs(runner).get(0).then(function (refs) {
	          return Promise['try'](function () {
	            if (!refs.length) {
	              return;
	            }
	            return compiler.dropFKRefs(runner, refs);
	          }).then(function () {
	            return runner.query({
	              sql: 'alter table ' + table + ' change ' + wrapped + ' ' + column.Type
	            });
	          }).then(function () {
	            if (!refs.length) {
	              return;
	            }
	            return compiler.createFKRefs(runner, refs.map(function (ref) {
	              if (ref.REFERENCED_COLUMN_NAME === from) {
	                ref.REFERENCED_COLUMN_NAME = to;
	              }
	              if (ref.COLUMN_NAME === from) {
	                ref.COLUMN_NAME = to;
	              }
	              return ref;
	            }));
	          });
	        });
	      }
	    });
	  },

	  getFKRefs: function getFKRefs(runner) {
	    var formatter = this.client.formatter();
	    var sql = 'SELECT KCU.CONSTRAINT_NAME, KCU.TABLE_NAME, KCU.COLUMN_NAME, ' + '       KCU.REFERENCED_TABLE_NAME, KCU.REFERENCED_COLUMN_NAME, ' + '       RC.UPDATE_RULE, RC.DELETE_RULE ' + 'FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KCU ' + 'JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS AS RC ' + '       USING(CONSTRAINT_NAME)' + 'WHERE KCU.REFERENCED_TABLE_NAME = ' + formatter.parameter(this.tableNameRaw) + ' ' + '  AND KCU.CONSTRAINT_SCHEMA = ' + formatter.parameter(this.client.database()) + ' ' + '  AND RC.CONSTRAINT_SCHEMA = ' + formatter.parameter(this.client.database());

	    return runner.query({
	      sql: sql,
	      bindings: formatter.bindings
	    });
	  },

	  dropFKRefs: function dropFKRefs(runner, refs) {
	    var formatter = this.client.formatter();

	    return Promise.all(refs.map(function (ref) {
	      var constraintName = formatter.wrap(ref.CONSTRAINT_NAME);
	      var tableName = formatter.wrap(ref.TABLE_NAME);
	      return runner.query({
	        sql: 'alter table ' + tableName + ' drop foreign key ' + constraintName
	      });
	    }));
	  },
	  createFKRefs: function createFKRefs(runner, refs) {
	    var formatter = this.client.formatter();

	    return Promise.all(refs.map(function (ref) {
	      var tableName = formatter.wrap(ref.TABLE_NAME);
	      var keyName = formatter.wrap(ref.CONSTRAINT_NAME);
	      var column = formatter.columnize(ref.COLUMN_NAME);
	      var references = formatter.columnize(ref.REFERENCED_COLUMN_NAME);
	      var inTable = formatter.wrap(ref.REFERENCED_TABLE_NAME);
	      var onUpdate = ' ON UPDATE ' + ref.UPDATE_RULE;
	      var onDelete = ' ON DELETE ' + ref.DELETE_RULE;

	      return runner.query({
	        sql: 'alter table ' + tableName + ' add constraint ' + keyName + ' ' + 'foreign key (' + column + ') references ' + inTable + ' (' + references + ')' + onUpdate + onDelete
	      });
	    }));
	  },
	  index: function index(columns, indexName) {
	    indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + " add index " + indexName + "(" + this.formatter.columnize(columns) + ")");
	  },

	  primary: function primary(columns, indexName) {
	    indexName = indexName || this._indexCommand('primary', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + " add primary key " + indexName + "(" + this.formatter.columnize(columns) + ")");
	  },

	  unique: function unique(columns, indexName) {
	    indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + " add unique " + indexName + "(" + this.formatter.columnize(columns) + ")");
	  },

	  // Compile a drop index command.
	  dropIndex: function dropIndex(columns, indexName) {
	    indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
	  },

	  // Compile a drop foreign key command.
	  dropForeign: function dropForeign(columns, indexName) {
	    indexName = indexName || this._indexCommand('foreign', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + ' drop foreign key ' + indexName);
	  },

	  // Compile a drop primary key command.
	  dropPrimary: function dropPrimary() {
	    this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
	  },

	  // Compile a drop unique key command.
	  dropUnique: function dropUnique(column, indexName) {
	    indexName = indexName || this._indexCommand('unique', this.tableNameRaw, column);
	    this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
	  }

	});

	module.exports = TableCompiler_MySQL;

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	
	// MySQL Column Compiler
	// -------
	'use strict';

	var inherits = __webpack_require__(46);
	var ColumnCompiler = __webpack_require__(23);
	var helpers = __webpack_require__(2);
	var assign = __webpack_require__(28);

	function ColumnCompiler_MySQL() {
	  ColumnCompiler.apply(this, arguments);
	  this.modifiers = ['unsigned', 'nullable', 'defaultTo', 'first', 'after', 'comment'];
	}
	inherits(ColumnCompiler_MySQL, ColumnCompiler);

	// Types
	// ------

	assign(ColumnCompiler_MySQL.prototype, {

	  increments: 'int unsigned not null auto_increment primary key',

	  bigincrements: 'bigint unsigned not null auto_increment primary key',

	  bigint: 'bigint',

	  double: function double(precision, scale) {
	    if (!precision) return 'double';
	    return 'double(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
	  },

	  integer: function integer(length) {
	    length = length ? '(' + this._num(length, 11) + ')' : '';
	    return 'int' + length;
	  },

	  mediumint: 'mediumint',

	  smallint: 'smallint',

	  tinyint: function tinyint(length) {
	    length = length ? '(' + this._num(length, 1) + ')' : '';
	    return 'tinyint' + length;
	  },

	  text: function text(column) {
	    switch (column) {
	      case 'medium':
	      case 'mediumtext':
	        return 'mediumtext';
	      case 'long':
	      case 'longtext':
	        return 'longtext';
	      default:
	        return 'text';
	    }
	  },

	  mediumtext: function mediumtext() {
	    return this.text('medium');
	  },

	  longtext: function longtext() {
	    return this.text('long');
	  },

	  enu: function enu(allowed) {
	    return "enum('" + allowed.join("', '") + "')";
	  },

	  datetime: 'datetime',

	  timestamp: 'timestamp',

	  bit: function bit(length) {
	    return length ? 'bit(' + this._num(length) + ')' : 'bit';
	  },

	  binary: function binary(length) {
	    return length ? 'varbinary(' + this._num(length) + ')' : 'blob';
	  },

	  // Modifiers
	  // ------

	  defaultTo: function defaultTo(value) {
	    /*jshint unused: false*/
	    var defaultVal = ColumnCompiler_MySQL.super_.prototype.defaultTo.apply(this, arguments);
	    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
	      return defaultVal;
	    }
	    return '';
	  },

	  unsigned: function unsigned() {
	    return 'unsigned';
	  },

	  first: function first() {
	    return 'first';
	  },

	  after: function after(column) {
	    return 'after ' + this.formatter.wrap(column);
	  },

	  comment: function comment(_comment) {
	    if (_comment && _comment.length > 255) {
	      helpers.warn('Your comment is longer than the max comment length for MySQL');
	    }
	    return _comment && "comment '" + _comment + "'";
	  }

	});

	module.exports = ColumnCompiler_MySQL;

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	var baseFlatten = __webpack_require__(128),
	    bindCallback = __webpack_require__(67),
	    pickByArray = __webpack_require__(129),
	    pickByCallback = __webpack_require__(130),
	    restParam = __webpack_require__(113);

	/**
	 * Creates an object composed of the picked `object` properties. Property
	 * names may be specified as individual arguments or as arrays of property
	 * names. If `predicate` is provided it's invoked for each property of `object`
	 * picking the properties `predicate` returns truthy for. The predicate is
	 * bound to `thisArg` and invoked with three arguments: (value, key, object).
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The source object.
	 * @param {Function|...(string|string[])} [predicate] The function invoked per
	 *  iteration or property names to pick, specified as individual property
	 *  names or arrays of property names.
	 * @param {*} [thisArg] The `this` binding of `predicate`.
	 * @returns {Object} Returns the new object.
	 * @example
	 *
	 * var object = { 'user': 'fred', 'age': 40 };
	 *
	 * _.pick(object, 'user');
	 * // => { 'user': 'fred' }
	 *
	 * _.pick(object, _.isString);
	 * // => { 'user': 'fred' }
	 */
	var pick = restParam(function(object, props) {
	  if (object == null) {
	    return {};
	  }
	  return typeof props[0] == 'function'
	    ? pickByCallback(object, bindCallback(props[0], props[1], 3))
	    : pickByArray(object, baseFlatten(props));
	});

	module.exports = pick;


/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Transaction = __webpack_require__(15);
	var assign = __webpack_require__(28);
	var inherits = __webpack_require__(46);
	var debug = __webpack_require__(47)('knex:tx');
	var helpers = __webpack_require__(2);

	function Transaction_MySQL2() {
	  Transaction.apply(this, arguments);
	}
	inherits(Transaction_MySQL2, Transaction);

	assign(Transaction_MySQL2.prototype, {

	  query: function query(conn, sql, status, value) {
	    var t = this;
	    var q = this.trxClient.query(conn, sql)['catch'](function (err) {
	      return err.code === 'ER_SP_DOES_NOT_EXIST';
	    }, function () {
	      helpers.warn('Transaction was implicitly committed, do not mix transactions and DDL with MySQL (#805)');
	    })['catch'](function (err) {
	      status = 2;
	      value = err;
	      t._completed = true;
	      debug('%s error running transaction query', t.txid);
	    }).tap(function () {
	      if (status === 1) t._resolver(value);
	      if (status === 2) t._rejecter(value);
	    });
	    if (status === 1 || status === 2) {
	      t._completed = true;
	    }
	    return q;
	  }

	});

	module.exports = Transaction_MySQL2;

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var inherits = __webpack_require__(46);
	var assign = __webpack_require__(28);
	var Formatter = __webpack_require__(14);
	var ReturningHelper = __webpack_require__(85).ReturningHelper;

	function Oracle_Formatter(client) {
	  Formatter.call(this, client);
	}
	inherits(Oracle_Formatter, Formatter);

	assign(Oracle_Formatter.prototype, {

	  alias: function alias(first, second) {
	    return first + ' ' + second;
	  },

	  parameter: function parameter(value, notSetValue) {
	    // Returning helper uses always ROWID as string
	    if (value instanceof ReturningHelper && this.client.driver) {
	      value = new this.client.driver.OutParam(this.client.driver.OCCISTRING);
	    } else if (typeof value === 'boolean') {
	      value = value ? 1 : 0;
	    }
	    return Formatter.prototype.parameter.call(this, value, notSetValue);
	  }

	});

	module.exports = Oracle_Formatter;

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var inherits = __webpack_require__(46);
	var Promise = __webpack_require__(8);
	var Transaction = __webpack_require__(15);
	var assign = __webpack_require__(28);
	var debugTx = __webpack_require__(47)('knex:tx');

	function Oracle_Transaction(client, container, config, outerTx) {
	  Transaction.call(this, client, container, config, outerTx);
	}
	inherits(Oracle_Transaction, Transaction);

	assign(Oracle_Transaction.prototype, {

	  // disable autocommit to allow correct behavior (default is true)
	  begin: function begin() {
	    return Promise.resolve();
	  },

	  commit: function commit(conn, value) {
	    this._completed = true;
	    return conn.commitAsync()['return'](value).then(this._resolver, this._rejecter);
	  },

	  release: function release(conn, value) {
	    return this._resolver(value);
	  },

	  rollback: function rollback(conn, err) {
	    this._completed = true;
	    debugTx('%s: rolling back', this.txid);
	    return conn.rollbackAsync()['throw'](err)['catch'](this._rejecter);
	  },

	  acquireConnection: function acquireConnection(config) {
	    var t = this;
	    return Promise['try'](function () {
	      return config.connection || t.client.acquireConnection();
	    }).tap(function (connection) {
	      if (!t.outerTx) {
	        connection.setAutoCommit(false);
	      }
	    }).disposer(function (connection) {
	      debugTx('%s: releasing connection', t.txid);
	      connection.setAutoCommit(true);
	      if (!config.connection) {
	        t.client.releaseConnection(connection);
	      } else {
	        debugTx('%s: not releasing external connection', t.txid);
	      }
	    });
	  }

	});

	module.exports = Oracle_Transaction;

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	
	// Oracle Query Builder & Compiler
	// ------
	'use strict';

	var _ = __webpack_require__(11);
	var inherits = __webpack_require__(46);
	var QueryCompiler = __webpack_require__(17);
	var helpers = __webpack_require__(2);
	var assign = __webpack_require__(28);
	var ReturningHelper = __webpack_require__(85).ReturningHelper;

	// Query Compiler
	// -------

	// Set the "Formatter" to use for the queries,
	// ensuring that all parameterized values (even across sub-queries)
	// are properly built into the same query.
	function QueryCompiler_Oracle(client, builder) {
	  QueryCompiler.call(this, client, builder);
	}
	inherits(QueryCompiler_Oracle, QueryCompiler);

	assign(QueryCompiler_Oracle.prototype, {

	  // Compiles an "insert" query, allowing for multiple
	  // inserts using a single query statement.
	  insert: function insert() {
	    var insertValues = this.single.insert || [];
	    var returning = this.single.returning;

	    if (!Array.isArray(insertValues) && _.isPlainObject(this.single.insert)) {
	      insertValues = [this.single.insert];
	    }

	    // always wrap returning argument in array
	    if (returning && !Array.isArray(returning)) {
	      returning = [returning];
	    }

	    if (Array.isArray(insertValues) && insertValues.length === 1 && _.isEmpty(insertValues[0])) {
	      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.wrap(this.single.returning) + ') values (default)', returning, this.tableName);
	    }

	    if (_.isEmpty(this.single.insert) && typeof this.single.insert !== 'function') {
	      return '';
	    }

	    var insertData = this._prepInsert(insertValues);

	    var sql = {};

	    if (_.isString(insertData)) {
	      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' ' + insertData, returning);
	    }

	    if (insertData.values.length === 1) {
	      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.columnize(insertData.columns) + ') values (' + this.formatter.parameterize(insertData.values[0]) + ')', returning, this.tableName);
	    }

	    var insertDefaultsOnly = insertData.columns.length === 0;

	    sql.sql = 'begin ' + _.map(insertData.values, function (value) {
	      var returningHelper;
	      var parameterizedValues = !insertDefaultsOnly ? this.formatter.parameterize(value) : '';
	      var returningValues = Array.isArray(returning) ? returning : [returning];
	      var subSql = 'insert into ' + this.tableName + ' ';

	      if (returning) {
	        returningHelper = new ReturningHelper(returningValues.join(':'));
	        sql.outParams = (sql.outParams || []).concat(returningHelper);
	      }

	      if (insertDefaultsOnly) {
	        // no columns given so only the default value
	        subSql += '(' + this.formatter.wrap(this.single.returning) + ') values (default)';
	      } else {
	        subSql += '(' + this.formatter.columnize(insertData.columns) + ') values (' + parameterizedValues + ')';
	      }
	      subSql += returning ? ' returning ROWID into ' + this.formatter.parameter(returningHelper) : '';

	      // pre bind position because subSql is an execute immediate parameter
	      // later position binding will only convert the ? params
	      subSql = this.formatter.client.positionBindings(subSql);
	      return 'execute immediate \'' + subSql.replace(/'/g, "''") + (parameterizedValues || returning ? '\' using ' : '') + parameterizedValues + (parameterizedValues && returning ? ', ' : '') + (returning ? 'out ?' : '') + ';';
	    }, this).join(' ') + 'end;';

	    if (returning) {
	      sql.returning = returning;
	      // generate select statement with special order by to keep the order because 'in (..)' may change the order
	      sql.returningSql = 'select ' + this.formatter.columnize(returning) + ' from ' + this.tableName + ' where ROWID in (' + sql.outParams.map(function (v, i) {
	        return ':' + (i + 1);
	      }).join(', ') + ')' + ' order by case ROWID ' + sql.outParams.map(function (v, i) {
	        return 'when CHARTOROWID(:' + (i + 1) + ') then ' + i;
	      }).join(' ') + ' end';
	    }

	    return sql;
	  },

	  // Update method, including joins, wheres, order & limits.
	  update: function update() {
	    var updates = this._prepUpdate(this.single.update);
	    var where = this.where();
	    return 'update ' + this.tableName + ' set ' + updates.join(', ') + (where ? ' ' + where : '');
	  },

	  // Compiles a `truncate` query.
	  truncate: function truncate() {
	    return 'truncate table ' + this.tableName;
	  },

	  forUpdate: function forUpdate() {
	    return 'for update';
	  },

	  forShare: function forShare() {
	    // lock for share is not directly supported by oracle
	    // use LOCK TABLE .. IN SHARE MODE; instead
	    helpers.warn('lock for share is not supported by oracle dialect');
	    return '';
	  },

	  // Compiles a `columnInfo` query.
	  columnInfo: function columnInfo() {
	    var column = this.single.columnInfo;
	    return {
	      sql: 'select COLUMN_NAME, DATA_TYPE, CHAR_COL_DECL_LENGTH, NULLABLE from USER_TAB_COLS where TABLE_NAME = :1',
	      bindings: [this.single.table],
	      output: function output(resp) {
	        var out = _.reduce(resp, function (columns, val) {
	          columns[val.COLUMN_NAME] = {
	            type: val.DATA_TYPE,
	            maxLength: val.CHAR_COL_DECL_LENGTH,
	            nullable: val.NULLABLE === 'Y'
	          };
	          return columns;
	        }, {});
	        return column && out[column] || out;
	      }
	    };
	  },

	  select: function select() {
	    var statements = _.map(components, function (component) {
	      return this[component]();
	    }, this);
	    var query = _.compact(statements).join(' ');
	    return this._surroundQueryWithLimitAndOffset(query);
	  },

	  aggregate: function aggregate(stmt) {
	    var val = stmt.value;
	    var splitOn = val.toLowerCase().indexOf(' as ');
	    // Allows us to speciy an alias for the aggregate types.
	    if (splitOn !== -1) {
	      var col = val.slice(0, splitOn);
	      var alias = val.slice(splitOn + 4);
	      return stmt.method + '(' + this.formatter.wrap(col) + ') ' + this.formatter.wrap(alias);
	    }
	    return stmt.method + '(' + this.formatter.wrap(val) + ')';
	  },

	  // for single commands only
	  _addReturningToSqlAndConvert: function _addReturningToSqlAndConvert(sql, returning, tableName) {
	    var res = {
	      sql: sql
	    };

	    if (!returning) {
	      return res;
	    }

	    var returningValues = Array.isArray(returning) ? returning : [returning];
	    var returningHelper = new ReturningHelper(returningValues.join(':'));
	    res.sql = sql + ' returning ROWID into ' + this.formatter.parameter(returningHelper);
	    res.returningSql = 'select ' + this.formatter.columnize(returning) + ' from ' + tableName + ' where ROWID = :1';
	    res.outParams = [returningHelper];
	    res.returning = returning;
	    return res;
	  },

	  _surroundQueryWithLimitAndOffset: function _surroundQueryWithLimitAndOffset(query) {
	    var limit = this.single.limit;
	    var offset = this.single.offset;
	    var hasLimit = limit || limit === 0 || limit === '0';
	    limit = +limit;

	    if (!hasLimit && !offset) return query;
	    query = query || "";

	    if (hasLimit && !offset) {
	      return "select * from (" + query + ") where rownum <= " + this.formatter.parameter(limit);
	    }

	    var endRow = +offset + (hasLimit ? limit : 10000000000000);

	    return "select * from " + "(select row_.*, ROWNUM rownum_ from (" + query + ") row_ " + "where rownum <= " + this.formatter.parameter(endRow) + ") " + "where rownum_ > " + this.formatter.parameter(offset);
	  }

	});

	// Compiles the `select` statement, or nested sub-selects
	// by calling each of the component compilers, trimming out
	// the empties, and returning a generated query string.
	QueryCompiler_Oracle.prototype.first = QueryCompiler_Oracle.prototype.select;

	var components = ['columns', 'join', 'where', 'union', 'group', 'having', 'order', 'lock'];

	module.exports = QueryCompiler_Oracle;

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	
	// Oracle Schema Compiler
	// -------
	'use strict';

	var inherits = __webpack_require__(46);
	var SchemaCompiler = __webpack_require__(19);
	var utils = __webpack_require__(85);

	function SchemaCompiler_Oracle() {
	  SchemaCompiler.apply(this, arguments);
	}
	inherits(SchemaCompiler_Oracle, SchemaCompiler);

	// Rename a table on the schema.
	SchemaCompiler_Oracle.prototype.renameTable = function (tableName, to) {
	  this.pushQuery('rename ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
	};

	// Check whether a table exists on the query.
	SchemaCompiler_Oracle.prototype.hasTable = function (tableName) {
	  this.pushQuery({
	    sql: 'select TABLE_NAME from USER_TABLES where TABLE_NAME = ' + this.formatter.parameter(tableName),
	    output: function output(resp) {
	      return resp.length > 0;
	    }
	  });
	};

	// Check whether a column exists on the schema.
	SchemaCompiler_Oracle.prototype.hasColumn = function (tableName, column) {
	  this.pushQuery({
	    sql: 'select COLUMN_NAME from USER_TAB_COLUMNS where TABLE_NAME = ' + this.formatter.parameter(tableName) + ' and COLUMN_NAME = ' + this.formatter.parameter(column),
	    output: function output(resp) {
	      return resp.length > 0;
	    }
	  });
	};

	SchemaCompiler_Oracle.prototype.dropSequenceIfExists = function (sequenceName) {
	  this.pushQuery(utils.wrapSqlWithCatch("drop sequence " + this.formatter.wrap(sequenceName), -2289));
	};

	SchemaCompiler_Oracle.prototype._dropRelatedSequenceIfExists = function (tableName) {
	  // removing the sequence that was possibly generated by increments() column
	  var sequenceName = utils.generateCombinedName('seq', tableName);
	  this.dropSequenceIfExists(sequenceName);
	};

	SchemaCompiler_Oracle.prototype.dropTable = function (tableName) {
	  this.pushQuery('drop table ' + this.formatter.wrap(tableName));

	  // removing the sequence that was possibly generated by increments() column
	  this._dropRelatedSequenceIfExists(tableName);
	};

	SchemaCompiler_Oracle.prototype.dropTableIfExists = function (tableName) {
	  this.pushQuery(utils.wrapSqlWithCatch("drop table " + this.formatter.wrap(tableName), -942));

	  // removing the sequence that was possibly generated by increments() column
	  this._dropRelatedSequenceIfExists(tableName);
	};

	module.exports = SchemaCompiler_Oracle;

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var inherits = __webpack_require__(46);
	var ColumnBuilder = __webpack_require__(22);
	var _ = __webpack_require__(11);

	function ColumnBuilder_Oracle() {
	  ColumnBuilder.apply(this, arguments);
	}
	inherits(ColumnBuilder_Oracle, ColumnBuilder);

	// checkIn added to the builder to allow the column compiler to change the
	// order via the modifiers ("check" must be after "default")
	ColumnBuilder_Oracle.prototype.checkIn = function () {
	  this._modifiers.checkIn = _.toArray(arguments);
	  return this;
	};

	module.exports = ColumnBuilder_Oracle;

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(11);
	var inherits = __webpack_require__(46);
	var assign = __webpack_require__(28);
	var utils = __webpack_require__(85);
	var Raw = __webpack_require__(1);
	var ColumnCompiler = __webpack_require__(23);

	// Column Compiler
	// -------

	function ColumnCompiler_Oracle() {
	  this.modifiers = ['defaultTo', 'checkIn', 'nullable', 'comment'];
	  ColumnCompiler.apply(this, arguments);
	}
	inherits(ColumnCompiler_Oracle, ColumnCompiler);

	assign(ColumnCompiler_Oracle.prototype, {

	  // helper function for pushAdditional in increments() and bigincrements()
	  _createAutoIncrementTriggerAndSequence: function _createAutoIncrementTriggerAndSequence() {
	    // TODO Add warning that sequence etc is created
	    this.pushAdditional(function () {
	      var sequenceName = this.tableCompiler._indexCommand('seq', this.tableCompiler.tableNameRaw);
	      var triggerName = this.tableCompiler._indexCommand('trg', this.tableCompiler.tableNameRaw, this.getColumnName());
	      var tableName = this.tableCompiler.tableName();
	      var columnName = this.formatter.wrap(this.getColumnName());
	      var createTriggerSQL = 'create or replace trigger ' + triggerName + ' before insert on ' + tableName + ' for each row' + ' when (new.' + columnName + ' is null) ' + ' begin' + ' select ' + sequenceName + '.nextval into :new.' + columnName + ' from dual;' + ' end;';
	      this.pushQuery(utils.wrapSqlWithCatch('create sequence ' + sequenceName, -955));
	      this.pushQuery(createTriggerSQL);
	    });
	  },

	  increments: function increments() {
	    this._createAutoIncrementTriggerAndSequence();
	    return 'integer not null primary key';
	  },

	  bigincrements: function bigincrements() {
	    this._createAutoIncrementTriggerAndSequence();
	    return 'number(20, 0) not null primary key';
	  },

	  floating: function floating(precision) {
	    var parsedPrecision = this._num(precision, 0);
	    return 'float' + (parsedPrecision ? '(' + parsedPrecision + ')' : '');
	  },

	  double: function double(precision, scale) {
	    // if (!precision) return 'number'; // TODO: Check If default is ok
	    return 'number(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
	  },

	  integer: function integer(length) {
	    return length ? 'number(' + this._num(length, 11) + ')' : 'integer';
	  },

	  tinyint: 'smallint',

	  smallint: 'smallint',

	  mediumint: 'integer',

	  biginteger: 'number(20, 0)',

	  text: 'clob',

	  enu: function enu(allowed) {
	    allowed = _.uniq(allowed);
	    var maxLength = (allowed || []).reduce(function (maxLength, name) {
	      return Math.max(maxLength, String(name).length);
	    }, 1);

	    // implicitly add the enum values as checked values
	    this.columnBuilder._modifiers.checkIn = [allowed];

	    return "varchar2(" + maxLength + ")";
	  },

	  time: 'timestamp with time zone',

	  datetime: function datetime(without) {
	    return without ? 'timestamp' : 'timestamp with time zone';
	  },

	  timestamp: function timestamp(without) {
	    return without ? 'timestamp' : 'timestamp with time zone';
	  },

	  bit: 'clob',

	  json: 'clob',

	  bool: function bool() {
	    // implicitly add the check for 0 and 1
	    this.columnBuilder._modifiers.checkIn = [[0, 1]];
	    return 'number(1, 0)';
	  },

	  varchar: function varchar(length) {
	    return 'varchar2(' + this._num(length, 255) + ')';
	  },

	  // Modifiers
	  // ------

	  comment: function comment(_comment) {
	    this.pushAdditional(function () {
	      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' + this.formatter.wrap(this.args[0]) + " is '" + (_comment || '') + "'");
	    }, _comment);
	  },

	  checkIn: function checkIn(value) {
	    // TODO: Maybe accept arguments also as array
	    // TODO: value(s) should be escaped properly
	    if (value === undefined) {
	      return '';
	    } else if (value instanceof Raw) {
	      value = value.toQuery();
	    } else if (Array.isArray(value)) {
	      value = _.map(value, function (v) {
	        return "'" + v + "'";
	      }).join(', ');
	    } else {
	      value = "'" + value + "'";
	    }
	    return 'check (' + this.formatter.wrap(this.args[0]) + ' in (' + value + '))';
	  }

	});

	module.exports = ColumnCompiler_Oracle;

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var inherits = __webpack_require__(46);
	var utils = __webpack_require__(85);
	var TableCompiler = __webpack_require__(21);
	var helpers = __webpack_require__(2);
	var assign = __webpack_require__(28);

	// Table Compiler
	// ------

	function TableCompiler_Oracle() {
	  TableCompiler.apply(this, arguments);
	}
	inherits(TableCompiler_Oracle, TableCompiler);

	assign(TableCompiler_Oracle.prototype, {

	  // Compile a rename column command.
	  renameColumn: function renameColumn(from, to) {
	    return this.pushQuery({
	      sql: 'alter table ' + this.tableName() + ' rename column ' + this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
	    });
	  },

	  compileAdd: function compileAdd(builder) {
	    var table = this.formatter.wrap(builder);
	    var columns = this.prefixArray('add column', this.getColumns(builder));
	    return this.pushQuery({
	      sql: 'alter table ' + table + ' ' + columns.join(', ')
	    });
	  },

	  // Adds the "create" query to the query sequence.
	  createQuery: function createQuery(columns, ifNot) {
	    var sql = 'create table ' + this.tableName() + ' (' + columns.sql.join(', ') + ')';
	    this.pushQuery({
	      // catch "name is already used by an existing object" for workaround for "if not exists"
	      sql: ifNot ? utils.wrapSqlWithCatch(sql, -955) : sql,
	      bindings: columns.bindings
	    });
	    if (this.single.comment) this.comment(this.single.comment);
	  },

	  // Compiles the comment on the table.
	  comment: function comment(_comment) {
	    this.pushQuery('comment on table ' + this.tableName() + ' is ' + "'" + (_comment || '') + "'");
	  },

	  addColumnsPrefix: 'add ',

	  dropColumn: function dropColumn() {
	    var columns = helpers.normalizeArr.apply(null, arguments);
	    this.pushQuery('alter table ' + this.tableName() + ' drop (' + this.formatter.columnize(columns) + ')');
	  },

	  changeType: function changeType() {
	    // alter table + table + ' modify ' + wrapped + '// type';
	  },

	  _indexCommand: function _indexCommand(type, tableName, columns) {
	    return this.formatter.wrap(utils.generateCombinedName(type, tableName, columns));
	  },

	  primary: function primary(columns) {
	    this.pushQuery('alter table ' + this.tableName() + " add primary key (" + this.formatter.columnize(columns) + ")");
	  },

	  dropPrimary: function dropPrimary() {
	    this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
	  },

	  index: function index(columns, indexName) {
	    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
	    this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
	  },

	  dropIndex: function dropIndex(columns, indexName) {
	    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
	    this.pushQuery('drop index ' + indexName);
	  },

	  unique: function unique(columns, indexName) {
	    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + indexName + ' unique (' + this.formatter.columnize(columns) + ')');
	  },

	  dropUnique: function dropUnique(columns, indexName) {
	    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
	  },

	  dropForeign: function dropForeign(columns, indexName) {
	    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('foreign', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
	  }

	});

	module.exports = TableCompiler_Oracle;

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {
	/*jslint node:true, nomen: true*/
	'use strict';

	var inherits = __webpack_require__(46);
	var merge = __webpack_require__(131);
	var Readable = __webpack_require__(132).Readable;

	function OracleQueryStream(connection, sql, bindings, options) {
	  Readable.call(this, merge({}, {
	    objectMode: true,
	    highWaterMark: 1000
	  }, options));
	  this.oracleReader = connection.reader(sql, bindings || []);
	}
	inherits(OracleQueryStream, Readable);

	OracleQueryStream.prototype._read = function () {
	  var _this = this;

	  var pushNull = function pushNull() {
	    process.nextTick(function () {
	      _this.push(null);
	    });
	  };
	  try {
	    this.oracleReader.nextRows(function (err, rows) {
	      if (err) return _this.emit('error', err);
	      if (rows.length === 0) {
	        pushNull();
	      } else {
	        for (var i = 0; i < rows.length; i++) {
	          if (rows[i]) {
	            _this.push(rows[i]);
	          } else {
	            pushNull();
	          }
	        }
	      }
	    });
	  } catch (e) {
	    // Catch Error: invalid state: reader is busy with another nextRows call
	    // and return false to rate limit stream.
	    if (e.message === 'invalid state: reader is busy with another nextRows call') {
	      return false;
	    } else {
	      this.emit('error', e);
	    }
	  }
	};

	module.exports = OracleQueryStream;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var helpers = __webpack_require__(2);

	function generateCombinedName(postfix, name, subNames) {
	  var crypto = __webpack_require__(133);
	  var limit = 30;
	  if (!Array.isArray(subNames)) subNames = subNames ? [subNames] : [];
	  var table = name.replace(/\.|-/g, '_');
	  var subNamesPart = subNames.join('_');
	  var result = (table + '_' + (subNamesPart.length ? subNamesPart + '_' : '') + postfix).toLowerCase();
	  if (result.length > limit) {
	    helpers.warn('Automatically generated name "' + result + '" exceeds ' + limit + ' character limit for Oracle. Using base64 encoded sha1 of that name instead.');
	    // generates the sha1 of the name and encode it with base64
	    result = crypto.createHash('sha1').update(result).digest('base64').replace('=', '');
	  }
	  return result;
	}

	function wrapSqlWithCatch(sql, errorNumberToCatch) {
	  return "begin execute immediate '" + sql.replace(/'/g, "''") + "'; exception when others then if sqlcode != " + errorNumberToCatch + " then raise; end if; end;";
	}

	function ReturningHelper(columnName) {
	  this.columnName = columnName;
	}

	ReturningHelper.prototype.toString = function () {
	  return '[object ReturningHelper:' + this.columnName + ']';
	};

	module.exports = {
	  generateCombinedName: generateCombinedName,
	  wrapSqlWithCatch: wrapSqlWithCatch,
	  ReturningHelper: ReturningHelper
	};

/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';

	function dateToString(date) {
	  function pad(number, digits) {
	    number = number.toString();
	    while (number.length < digits) {
	      number = "0" + number;
	    }
	    return number;
	  }

	  var offset = -date.getTimezoneOffset();
	  var ret = pad(date.getFullYear(), 4) + '-' + pad(date.getMonth() + 1, 2) + '-' + pad(date.getDate(), 2) + 'T' + pad(date.getHours(), 2) + ':' + pad(date.getMinutes(), 2) + ':' + pad(date.getSeconds(), 2) + '.' + pad(date.getMilliseconds(), 3);

	  if (offset < 0) {
	    ret += "-";
	    offset *= -1;
	  } else {
	    ret += "+";
	  }

	  return ret + pad(Math.floor(offset / 60), 2) + ":" + pad(offset % 60, 2);
	}

	var prepareObject;
	var arrayString;

	// converts values from javascript types
	// to their 'raw' counterparts for use as a postgres parameter
	// note: you can override this function to provide your own conversion mechanism
	// for complex types, etc...
	var prepareValue = function prepareValue(val, seen) {
	  if (val instanceof Buffer) {
	    return val;
	  }
	  if (val instanceof Date) {
	    return dateToString(val);
	  }
	  if (Array.isArray(val)) {
	    return arrayString(val);
	  }
	  if (val === null || val === undefined) {
	    return null;
	  }
	  if (typeof val === 'object') {
	    return prepareObject(val, seen);
	  }
	  return val.toString();
	};

	prepareObject = function prepareObject(val, seen) {
	  if (val && typeof val.toPostgres === 'function') {
	    seen = seen || [];
	    if (seen.indexOf(val) !== -1) {
	      throw new Error('circular reference detected while preparing "' + val + '" for query');
	    }
	    seen.push(val);

	    return prepareValue(val.toPostgres(prepareValue), seen);
	  }
	  return JSON.stringify(val);
	};

	// convert a JS array to a postgres array literal
	// uses comma separator so won't work for types like box that use
	// a different array separator.
	arrayString = function arrayString(val) {
	  return '{' + val.map(function (elem) {
	    if (elem === null || elem === undefined) {
	      return 'NULL';
	    }
	    if (Array.isArray(elem)) {
	      return arrayString(elem);
	    }
	    return JSON.stringify(prepareValue(elem));
	  }).join(',') + '}';
	};

	function normalizeQueryConfig(config, values, callback) {
	  //can take in strings or config objects
	  config = typeof config === 'string' ? { text: config } : config;
	  if (values) {
	    if (typeof values === 'function') {
	      config.callback = values;
	    } else {
	      config.values = values;
	    }
	  }
	  if (callback) {
	    config.callback = callback;
	  }
	  return config;
	}

	module.exports = {
	  prepareValue: prepareValue,
	  normalizeQueryConfig: normalizeQueryConfig
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(97).Buffer))

/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	
	// PostgreSQL Query Builder & Compiler
	// ------
	'use strict';

	var _ = __webpack_require__(11);
	var inherits = __webpack_require__(46);

	var QueryCompiler = __webpack_require__(17);
	var assign = __webpack_require__(28);

	function QueryCompiler_PG(client, builder) {
	  QueryCompiler.call(this, client, builder);
	}
	inherits(QueryCompiler_PG, QueryCompiler);

	assign(QueryCompiler_PG.prototype, {

	  // Compiles a truncate query.
	  truncate: function truncate() {
	    return 'truncate ' + this.tableName + ' restart identity';
	  },

	  // is used if the an array with multiple empty values supplied
	  _defaultInsertValue: 'default',

	  // Compiles an `insert` query, allowing for multiple
	  // inserts using a single query statement.
	  insert: function insert() {
	    var sql = QueryCompiler.prototype.insert.call(this);
	    if (sql === '') return sql;
	    var returning = this.single.returning;
	    return {
	      sql: sql + this._returning(returning),
	      returning: returning
	    };
	  },

	  // Compiles an `update` query, allowing for a return value.
	  update: function update() {
	    var updateData = this._prepUpdate(this.single.update);
	    var wheres = this.where();
	    var returning = this.single.returning;
	    return {
	      sql: 'update ' + this.tableName + ' set ' + updateData.join(', ') + (wheres ? ' ' + wheres : '') + this._returning(returning),
	      returning: returning
	    };
	  },

	  // Compiles an `update` query, allowing for a return value.
	  del: function del() {
	    var sql = QueryCompiler.prototype.del.apply(this, arguments);
	    var returning = this.single.returning;
	    return {
	      sql: sql + this._returning(returning),
	      returning: returning
	    };
	  },

	  _returning: function _returning(value) {
	    return value ? ' returning ' + this.formatter.columnize(value) : '';
	  },

	  forUpdate: function forUpdate() {
	    return 'for update';
	  },

	  forShare: function forShare() {
	    return 'for share';
	  },

	  // Compiles a columnInfo query
	  columnInfo: function columnInfo() {
	    var column = this.single.columnInfo;

	    var sql = 'select * from information_schema.columns where table_name = ? and table_catalog = ?';
	    var bindings = [this.single.table, this.client.database()];

	    if (this.single.schema) {
	      sql += ' and table_schema = ?';
	      bindings.push(this.single.schema);
	    } else {
	      sql += ' and table_schema = current_schema';
	    }

	    return {
	      sql: sql,
	      bindings: bindings,
	      output: function output(resp) {
	        var out = _.reduce(resp.rows, function (columns, val) {
	          columns[val.column_name] = {
	            type: val.data_type,
	            maxLength: val.character_maximum_length,
	            nullable: val.is_nullable === 'YES',
	            defaultValue: val.column_default
	          };
	          return columns;
	        }, {});
	        return column && out[column] || out;
	      }
	    };
	  }

	});

	module.exports = QueryCompiler_PG;

/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	
	// PostgreSQL Column Compiler
	// -------

	'use strict';

	var inherits = __webpack_require__(46);
	var ColumnCompiler = __webpack_require__(23);
	var assign = __webpack_require__(28);

	function ColumnCompiler_PG() {
	  ColumnCompiler.apply(this, arguments);
	  this.modifiers = ['nullable', 'defaultTo', 'comment'];
	}
	inherits(ColumnCompiler_PG, ColumnCompiler);

	assign(ColumnCompiler_PG.prototype, {

	  // Types
	  // ------
	  bigincrements: 'bigserial primary key',
	  bigint: 'bigint',
	  binary: 'bytea',

	  bit: function bit(column) {
	    return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
	  },

	  bool: 'boolean',

	  // Create the column definition for an enum type.
	  // Using method "2" here: http://stackoverflow.com/a/10984951/525714
	  enu: function enu(allowed) {
	    return 'text check (' + this.formatter.wrap(this.args[0]) + " in ('" + allowed.join("', '") + "'))";
	  },

	  double: 'double precision',
	  floating: 'real',
	  increments: 'serial primary key',
	  json: function json(jsonb) {
	    if (!this.client.version || parseFloat(this.client.version) >= 9.2) return jsonb ? 'jsonb' : 'json';
	    return 'text';
	  },
	  smallint: 'smallint',
	  tinyint: 'smallint',
	  datetime: function datetime(without) {
	    return without ? 'timestamp' : 'timestamptz';
	  },
	  timestamp: function timestamp(without) {
	    return without ? 'timestamp' : 'timestamptz';
	  },
	  uuid: 'uuid',

	  // Modifiers:
	  // ------
	  comment: function comment(_comment) {
	    this.pushAdditional(function () {
	      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' + this.formatter.wrap(this.args[0]) + " is " + (_comment ? "'" + _comment + "'" : 'NULL'));
	    }, _comment);
	  }

	});

	module.exports = ColumnCompiler_PG;

/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	// PostgreSQL Table Builder & Compiler
	// -------

	'use strict';

	var _ = __webpack_require__(11);
	var inherits = __webpack_require__(46);
	var TableCompiler = __webpack_require__(21);

	function TableCompiler_PG() {
	  TableCompiler.apply(this, arguments);
	}
	inherits(TableCompiler_PG, TableCompiler);

	// Compile a rename column command.
	TableCompiler_PG.prototype.renameColumn = function (from, to) {
	  return this.pushQuery({
	    sql: 'alter table ' + this.tableName() + ' rename ' + this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
	  });
	};

	TableCompiler_PG.prototype.compileAdd = function (builder) {
	  var table = this.formatter.wrap(builder);
	  var columns = this.prefixArray('add column', this.getColumns(builder));
	  return this.pushQuery({
	    sql: 'alter table ' + table + ' ' + columns.join(', ')
	  });
	};

	// Adds the "create" query to the query sequence.
	TableCompiler_PG.prototype.createQuery = function (columns, ifNot) {
	  var createStatement = ifNot ? 'create table if not exists ' : 'create table ';
	  this.pushQuery({
	    sql: createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')',
	    bindings: columns.bindings
	  });
	  var hasComment = _.has(this.single, 'comment');
	  if (hasComment) this.comment(this.single.comment);
	};

	// Compiles the comment on the table.
	TableCompiler_PG.prototype.comment = function (comment) {
	  /*jshint unused: false*/
	  this.pushQuery('comment on table ' + this.tableName() + ' is ' + "'" + (this.single.comment || '') + "'");
	};

	// Indexes:
	// -------

	TableCompiler_PG.prototype.primary = function (columns) {
	  this.pushQuery('alter table ' + this.tableName() + " add primary key (" + this.formatter.columnize(columns) + ")");
	};
	TableCompiler_PG.prototype.unique = function (columns, indexName) {
	  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
	  this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + indexName + ' unique (' + this.formatter.columnize(columns) + ')');
	};
	TableCompiler_PG.prototype.index = function (columns, indexName, indexType) {
	  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
	  this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + (indexType && ' using ' + indexType || '') + ' (' + this.formatter.columnize(columns) + ')');
	};
	TableCompiler_PG.prototype.dropPrimary = function () {
	  this.pushQuery('alter table ' + this.tableName() + " drop constraint " + this.tableNameRaw + "_pkey");
	};
	TableCompiler_PG.prototype.dropIndex = function (columns, indexName) {
	  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
	  this.pushQuery('drop index ' + indexName);
	};
	TableCompiler_PG.prototype.dropUnique = function (columns, indexName) {
	  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
	  this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
	};
	TableCompiler_PG.prototype.dropForeign = function (columns, indexName) {
	  indexName = indexName || this._indexCommand('foreign', this.tableNameRaw, columns);
	  this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
	};

	module.exports = TableCompiler_PG;

/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	// PostgreSQL Schema Compiler
	// -------

	'use strict';

	var inherits = __webpack_require__(46);
	var SchemaCompiler = __webpack_require__(19);

	function SchemaCompiler_PG() {
	  SchemaCompiler.apply(this, arguments);
	}
	inherits(SchemaCompiler_PG, SchemaCompiler);

	// Check whether the current table
	SchemaCompiler_PG.prototype.hasTable = function (tableName) {
	  var sql = 'select * from information_schema.tables where table_name = ?';
	  var bindings = [tableName];

	  if (this.schema) {
	    sql += ' and table_schema = ?';
	    bindings.push(this.schema);
	  } else {
	    sql += ' and table_schema = current_schema';
	  }

	  this.pushQuery({
	    sql: sql,
	    bindings: bindings,
	    output: function output(resp) {
	      return resp.rows.length > 0;
	    }
	  });
	};

	// Compile the query to determine if a column exists in a table.
	SchemaCompiler_PG.prototype.hasColumn = function (tableName, columnName) {
	  var sql = 'select * from information_schema.columns where table_name = ? and column_name = ?';
	  var bindings = [tableName, columnName];

	  if (this.schema) {
	    sql += ' and table_schema = ?';
	    bindings.push(this.schema);
	  } else {
	    sql += ' and table_schema = current_schema';
	  }

	  this.pushQuery({
	    sql: sql,
	    bindings: bindings,
	    output: function output(resp) {
	      return resp.rows.length > 0;
	    }
	  });
	};

	SchemaCompiler_PG.prototype.qualifiedTableName = function (tableName) {
	  var name = this.schema ? this.schema + '.' + tableName : tableName;
	  return this.formatter.wrap(name);
	};

	// Compile a rename table command.
	SchemaCompiler_PG.prototype.renameTable = function (from, to) {
	  this.pushQuery('alter table ' + this.qualifiedTableName(from) + ' rename to ' + this.qualifiedTableName(to));
	};

	SchemaCompiler_PG.prototype.createSchema = function (schemaName) {
	  this.pushQuery('create schema ' + this.formatter.wrap(schemaName));
	};

	SchemaCompiler_PG.prototype.createSchemaIfNotExists = function (schemaName) {
	  this.pushQuery('create schema if not exists ' + this.formatter.wrap(schemaName));
	};

	SchemaCompiler_PG.prototype.dropSchema = function (schemaName) {
	  this.pushQuery('drop schema ' + this.formatter.wrap(schemaName));
	};

	SchemaCompiler_PG.prototype.dropSchemaIfExists = function (schemaName) {
	  this.pushQuery('drop schema if exists ' + this.formatter.wrap(schemaName));
	};

	SchemaCompiler_PG.prototype.dropExtension = function (extensionName) {
	  this.pushQuery('drop extension ' + this.formatter.wrap(extensionName));
	};

	SchemaCompiler_PG.prototype.dropExtensionIfExists = function (extensionName) {
	  this.pushQuery('drop extension if exists ' + this.formatter.wrap(extensionName));
	};

	SchemaCompiler_PG.prototype.createExtension = function (extensionName) {
	  this.pushQuery('create extension ' + this.formatter.wrap(extensionName));
	};

	SchemaCompiler_PG.prototype.createExtensionIfNotExists = function (extensionName) {
	  this.pushQuery('create extension if not exists ' + this.formatter.wrap(extensionName));
	};

	module.exports = SchemaCompiler_PG;

/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	
	// SQLite3 Query Builder & Compiler

	'use strict';

	var _ = __webpack_require__(11);
	var inherits = __webpack_require__(46);
	var QueryCompiler = __webpack_require__(17);
	var assign = __webpack_require__(28);

	function QueryCompiler_SQLite3(client, builder) {
	  QueryCompiler.call(this, client, builder);
	}
	inherits(QueryCompiler_SQLite3, QueryCompiler);

	assign(QueryCompiler_SQLite3.prototype, {

	  // The locks are not applicable in SQLite3
	  forShare: emptyStr,

	  forUpdate: emptyStr,

	  // SQLite requires us to build the multi-row insert as a listing of select with
	  // unions joining them together. So we'll build out this list of columns and
	  // then join them all together with select unions to complete the queries.
	  insert: function insert() {
	    var insertValues = this.single.insert || [];
	    var sql = 'insert into ' + this.tableName + ' ';

	    if (Array.isArray(insertValues)) {
	      if (insertValues.length === 0) {
	        return '';
	      } else if (insertValues.length === 1 && insertValues[0] && _.isEmpty(insertValues[0])) {
	        return sql + this._emptyInsertValue;
	      }
	    } else if (typeof insertValues === 'object' && _.isEmpty(insertValues)) {
	      return sql + this._emptyInsertValue;
	    }

	    var insertData = this._prepInsert(insertValues);

	    if (_.isString(insertData)) {
	      return sql + insertData;
	    }

	    if (insertData.columns.length === 0) {
	      return '';
	    }

	    sql += '(' + this.formatter.columnize(insertData.columns) + ')';

	    if (insertData.values.length === 1) {
	      return sql + ' values (' + this.formatter.parameterize(insertData.values[0]) + ')';
	    }

	    var blocks = [];
	    var i = -1;
	    while (++i < insertData.values.length) {
	      var i2 = -1,
	          block = blocks[i] = [];
	      var current = insertData.values[i];
	      while (++i2 < insertData.columns.length) {
	        block.push(this.formatter.alias(this.formatter.parameter(current[i2]), this.formatter.wrap(insertData.columns[i2])));
	      }
	      blocks[i] = block.join(', ');
	    }
	    return sql + ' select ' + blocks.join(' union all select ');
	  },

	  // Compile a truncate table statement into SQL.
	  truncate: function truncate() {
	    var table = this.tableName;
	    return {
	      sql: 'delete from ' + table,
	      output: function output() {
	        return this.query({ sql: 'delete from sqlite_sequence where name = ' + table })['catch'](function () {});
	      }
	    };
	  },

	  // Compiles a `columnInfo` query
	  columnInfo: function columnInfo() {
	    var column = this.single.columnInfo;
	    return {
	      sql: 'PRAGMA table_info(' + this.single.table + ')',
	      output: function output(resp) {
	        var maxLengthRegex = /.*\((\d+)\)/;
	        var out = _.reduce(resp, function (columns, val) {
	          var type = val.type;
	          var maxLength = (maxLength = type.match(maxLengthRegex)) && maxLength[1];
	          type = maxLength ? type.split('(')[0] : type;
	          columns[val.name] = {
	            type: type.toLowerCase(),
	            maxLength: maxLength,
	            nullable: !val.notnull,
	            defaultValue: val.dflt_value
	          };
	          return columns;
	        }, {});
	        return column && out[column] || out;
	      }
	    };
	  },

	  limit: function limit() {
	    var noLimit = !this.single.limit && this.single.limit !== 0;
	    if (noLimit && !this.single.offset) return '';

	    // Workaround for offset only,
	    // see http://stackoverflow.com/questions/10491492/sqllite-with-skip-offset-only-not-limit
	    return 'limit ' + this.formatter.parameter(noLimit ? -1 : this.single.limit);
	  }

	});

	function emptyStr() {
	  return '';
	}

	module.exports = QueryCompiler_SQLite3;

/***/ },
/* 92 */
/***/ function(module, exports, __webpack_require__) {

	
	// SQLite3: Column Builder & Compiler
	// -------
	'use strict';

	var _ = __webpack_require__(11);
	var inherits = __webpack_require__(46);
	var SchemaCompiler = __webpack_require__(19);

	// Schema Compiler
	// -------

	function SchemaCompiler_SQLite3() {
	  SchemaCompiler.apply(this, arguments);
	}
	inherits(SchemaCompiler_SQLite3, SchemaCompiler);

	// Compile the query to determine if a table exists.
	SchemaCompiler_SQLite3.prototype.hasTable = function (tableName) {
	  this.pushQuery({
	    sql: "select * from sqlite_master where type = 'table' and name = " + this.formatter.parameter(tableName),
	    output: function output(resp) {
	      return resp.length > 0;
	    }
	  });
	};

	// Compile the query to determine if a column exists.
	SchemaCompiler_SQLite3.prototype.hasColumn = function (tableName, column) {
	  this.pushQuery({
	    sql: 'PRAGMA table_info(' + this.formatter.wrap(tableName) + ')',
	    output: function output(resp) {
	      return _.some(resp, { name: column });
	    }
	  });
	};

	// Compile a rename table command.
	SchemaCompiler_SQLite3.prototype.renameTable = function (from, to) {
	  this.pushQuery('alter table ' + this.formatter.wrap(from) + ' rename to ' + this.formatter.wrap(to));
	};

	module.exports = SchemaCompiler_SQLite3;

/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var inherits = __webpack_require__(46);
	var ColumnCompiler = __webpack_require__(23);

	// Column Compiler
	// -------

	function ColumnCompiler_SQLite3() {
	  this.modifiers = ['nullable', 'defaultTo'];
	  ColumnCompiler.apply(this, arguments);
	}
	inherits(ColumnCompiler_SQLite3, ColumnCompiler);

	// Types
	// -------

	ColumnCompiler_SQLite3.prototype.double = ColumnCompiler_SQLite3.prototype.decimal = ColumnCompiler_SQLite3.prototype.floating = 'float';
	ColumnCompiler_SQLite3.prototype.timestamp = 'datetime';

	module.exports = ColumnCompiler_SQLite3;

/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(11);
	var inherits = __webpack_require__(46);
	var TableCompiler = __webpack_require__(21);

	// Table Compiler
	// -------

	function TableCompiler_SQLite3() {
	  TableCompiler.apply(this, arguments);
	  this.primaryKey = void 0;
	}
	inherits(TableCompiler_SQLite3, TableCompiler);

	// Create a new table.
	TableCompiler_SQLite3.prototype.createQuery = function (columns, ifNot) {
	  var createStatement = ifNot ? 'create table if not exists ' : 'create table ';
	  var sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ');

	  // SQLite forces primary keys to be added when the table is initially created
	  // so we will need to check for a primary key commands and add the columns
	  // to the table's declaration here so they can be created on the tables.
	  sql += this.foreignKeys() || '';
	  sql += this.primaryKeys() || '';
	  sql += ')';

	  this.pushQuery(sql);
	};

	TableCompiler_SQLite3.prototype.addColumns = function (columns) {
	  for (var i = 0, l = columns.sql.length; i < l; i++) {
	    this.pushQuery({
	      sql: 'alter table ' + this.tableName() + ' add column ' + columns.sql[i],
	      bindings: columns.bindings[i]
	    });
	  }
	};

	// Compile a drop unique key command.
	TableCompiler_SQLite3.prototype.dropUnique = function (columns, indexName) {
	  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
	  this.pushQuery('drop index ' + indexName);
	};

	TableCompiler_SQLite3.prototype.dropIndex = function (columns, indexName) {
	  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
	  this.pushQuery('drop index ' + indexName);
	};

	// Compile a unique key command.
	TableCompiler_SQLite3.prototype.unique = function (columns, indexName) {
	  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
	  columns = this.formatter.columnize(columns);
	  this.pushQuery('create unique index ' + indexName + ' on ' + this.tableName() + ' (' + columns + ')');
	};

	// Compile a plain index key command.
	TableCompiler_SQLite3.prototype.index = function (columns, indexName) {
	  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
	  columns = this.formatter.columnize(columns);
	  this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + ' (' + columns + ')');
	};

	TableCompiler_SQLite3.prototype.primary = TableCompiler_SQLite3.prototype.foreign = function () {
	  if (this.method !== 'create' && this.method !== 'createIfNot') {
	    console.warn('SQLite3 Foreign & Primary keys may only be added on create');
	  }
	};

	TableCompiler_SQLite3.prototype.primaryKeys = function () {
	  var pks = _.where(this.grouped.alterTable || [], { method: 'primary' });
	  if (pks.length > 0 && pks[0].args.length > 0) {
	    var args = Array.isArray(pks[0].args[0]) ? pks[0].args[0] : pks[0].args;
	    return ', primary key (' + this.formatter.columnize(args) + ')';
	  }
	};

	TableCompiler_SQLite3.prototype.foreignKeys = function () {
	  var sql = '';
	  var foreignKeys = _.where(this.grouped.alterTable || [], { method: 'foreign' });
	  for (var i = 0, l = foreignKeys.length; i < l; i++) {
	    var foreign = foreignKeys[i].args[0];
	    var column = this.formatter.columnize(foreign.column);
	    var references = this.formatter.columnize(foreign.references);
	    var foreignTable = this.formatter.wrap(foreign.inTable);
	    sql += ', foreign key(' + column + ') references ' + foreignTable + '(' + references + ')';
	    if (foreign.onDelete) sql += ' on delete ' + foreign.onDelete;
	    if (foreign.onUpdate) sql += ' on update ' + foreign.onUpdate;
	  }
	  return sql;
	};

	TableCompiler_SQLite3.prototype.createTableBlock = function () {
	  return this.getColumns().concat().join(',');
	};

	// Compile a rename column command... very complex in sqlite
	TableCompiler_SQLite3.prototype.renameColumn = function (from, to) {
	  var compiler = this;
	  this.pushQuery({
	    sql: 'PRAGMA table_info(' + this.tableName() + ')',
	    output: function output(pragma) {
	      return compiler.client.ddl(compiler, pragma, this.connection).renameColumn(from, to);
	    }
	  });
	};

	TableCompiler_SQLite3.prototype.dropColumn = function (column) {
	  var compiler = this;
	  this.pushQuery({
	    sql: 'PRAGMA table_info(' + this.tableName() + ')',
	    output: function output(pragma) {
	      return compiler.client.ddl(compiler, pragma, this.connection).dropColumn(column);
	    }
	  });
	};

	module.exports = TableCompiler_SQLite3;

/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	
	// SQLite3_DDL
	//
	// All of the SQLite3 specific DDL helpers for renaming/dropping
	// columns and changing datatypes.
	// -------

	'use strict';

	var _ = __webpack_require__(11);
	var Promise = __webpack_require__(8);
	var assign = __webpack_require__(28);

	// So altering the schema in SQLite3 is a major pain.
	// We have our own object to deal with the renaming and altering the types
	// for sqlite3 things.
	function SQLite3_DDL(client, tableCompiler, pragma, connection) {
	  this.client = client;
	  this.tableCompiler = tableCompiler;
	  this.pragma = pragma;
	  this.tableName = this.tableCompiler.tableNameRaw;
	  this.alteredName = _.uniqueId('_knex_temp_alter');
	  this.connection = connection;
	}

	assign(SQLite3_DDL.prototype, {

	  getColumn: Promise.method(function (column) {
	    var currentCol = _.findWhere(this.pragma, { name: column });
	    if (!currentCol) throw new Error('The column ' + column + ' is not in the ' + this.tableName + ' table');
	    return currentCol;
	  }),

	  getTableSql: function getTableSql() {
	    return this.trx.raw('SELECT name, sql FROM sqlite_master WHERE type="table" AND name="' + this.tableName + '"');
	  },

	  renameTable: Promise.method(function () {
	    return this.trx.raw('ALTER TABLE "' + this.tableName + '" RENAME TO "' + this.alteredName + '"');
	  }),

	  dropOriginal: function dropOriginal() {
	    return this.trx.raw('DROP TABLE "' + this.tableName + '"');
	  },

	  dropTempTable: function dropTempTable() {
	    return this.trx.raw('DROP TABLE "' + this.alteredName + '"');
	  },

	  copyData: function copyData() {
	    return this.trx.raw('SELECT * FROM "' + this.tableName + '"').bind(this).then(this.insertChunked(20, this.alteredName));
	  },

	  reinsertData: function reinsertData(iterator) {
	    return function () {
	      return this.trx.raw('SELECT * FROM "' + this.alteredName + '"').bind(this).then(this.insertChunked(20, this.tableName, iterator));
	    };
	  },

	  insertChunked: function insertChunked(amount, target, iterator) {
	    iterator = iterator || function (noop) {
	      return noop;
	    };
	    return function (result) {
	      var batch = [];
	      var ddl = this;
	      return Promise.reduce(result, function (memo, row) {
	        memo++;
	        batch.push(row);
	        if (memo % 20 === 0 || memo === result.length) {
	          return ddl.trx.queryBuilder().table(target).insert(_.map(batch, iterator)).then(function () {
	            batch = [];
	          }).thenReturn(memo);
	        }
	        return memo;
	      }, 0);
	    };
	  },

	  createTempTable: function createTempTable(createTable) {
	    return function () {
	      return this.trx.raw(createTable.sql.replace(this.tableName, this.alteredName));
	    };
	  },

	  _doReplace: function _doReplace(sql, from, to) {
	    var matched = sql.match(/^CREATE TABLE (\S+) \((.*)\)/);

	    var tableName = matched[1],
	        defs = matched[2];

	    if (!defs) {
	      throw new Error('No column definitions in this statement!');
	    }

	    var parens = 0,
	        args = [],
	        ptr = 0;
	    for (var i = 0, x = defs.length; i < x; i++) {
	      switch (defs[i]) {
	        case '(':
	          parens++;
	          break;
	        case ')':
	          parens--;
	          break;
	        case ',':
	          if (parens === 0) {
	            args.push(defs.slice(ptr, i));
	            ptr = i + 1;
	          }
	          break;
	        case ' ':
	          if (ptr === i) {
	            ptr = i + 1;
	          }
	          break;
	      }
	    }
	    args.push(defs.slice(ptr, i));

	    args = args.map(function (item) {
	      var split = item.split(' ');

	      if (split[0] === from) {
	        // column definition
	        if (to) {
	          split[0] = to;
	          return split.join(' ');
	        }
	        return ''; // for deletions
	      }

	      // skip constraint name
	      var idx = /constraint/i.test(split[0]) ? 2 : 0;

	      // primary key and unique constraints have one or more
	      // columns from this table listed between (); replace
	      // one if it matches
	      if (/primary|unique/i.test(split[idx])) {
	        return item.replace(/\(.*\)/, function (columns) {
	          return columns.replace(from, to);
	        });
	      }

	      // foreign keys have one or more columns from this table
	      // listed between (); replace one if it matches
	      // foreign keys also have a 'references' clause
	      // which may reference THIS table; if it does, replace
	      // column references in that too!
	      if (/foreign/.test(split[idx])) {
	        split = item.split(/ references /i);
	        // the quoted column names save us from having to do anything
	        // other than a straight replace here
	        split[0] = split[0].replace(from, to);

	        if (split[1].slice(0, tableName.length) === tableName) {
	          split[1] = split[1].replace(/\(.*\)/, function (columns) {
	            return columns.replace(from, to);
	          });
	        }
	        return split.join(' references ');
	      }

	      return item;
	    });
	    return sql.replace(/\(.*\)/, function () {
	      return '(' + args.join(', ') + ')';
	    }).replace(/,\s*([,)])/, '$1');
	  },

	  // Boy, this is quite a method.
	  renameColumn: Promise.method(function (from, to) {
	    var currentCol;

	    return this.client.transaction((function (trx) {
	      this.trx = trx;
	      return this.getColumn(from).bind(this).tap(function (col) {
	        currentCol = col;
	      }).then(this.getTableSql).then(function (sql) {
	        var a = this.client.wrapIdentifier(from);
	        var b = this.client.wrapIdentifier(to);
	        var createTable = sql[0];
	        var newSql = this._doReplace(createTable.sql, a, b);
	        if (sql === newSql) {
	          throw new Error('Unable to find the column to change');
	        }
	        return Promise.bind(this).then(this.createTempTable(createTable)).then(this.copyData).then(this.dropOriginal).then(function () {
	          return this.trx.raw(newSql);
	        }).then(this.reinsertData(function (row) {
	          row[to] = row[from];
	          return _.omit(row, from);
	        })).then(this.dropTempTable);
	      });
	    }).bind(this), { connection: this.connection });
	  }),

	  dropColumn: Promise.method(function (column) {
	    var currentCol;

	    return this.client.transaction((function (trx) {
	      this.trx = trx;
	      return this.getColumn(column).tap(function (col) {
	        currentCol = col;
	      }).bind(this).then(this.getTableSql).then(function (sql) {
	        var createTable = sql[0];
	        var a = this.client.wrapIdentifier(column);
	        var newSql = this._doReplace(createTable.sql, a, '');
	        if (sql === newSql) {
	          throw new Error('Unable to find the column to change');
	        }
	        return Promise.bind(this).then(this.createTempTable(createTable)).then(this.copyData).then(this.dropOriginal).then(function () {
	          return this.trx.raw(newSql);
	        }).then(this.reinsertData(function (row) {
	          return _.omit(row, column);
	        })).then(this.dropTempTable);
	      });
	    }).bind(this), { connection: this.connection });
	  })

	});

	module.exports = SQLite3_DDL;

/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
	//
	// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
	//
	// Originally from narwhal.js (http://narwhaljs.org)
	// Copyright (c) 2009 Thomas Robinson <280north.com>
	//
	// Permission is hereby granted, free of charge, to any person obtaining a copy
	// of this software and associated documentation files (the 'Software'), to
	// deal in the Software without restriction, including without limitation the
	// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
	// sell copies of the Software, and to permit persons to whom the Software is
	// furnished to do so, subject to the following conditions:
	//
	// The above copyright notice and this permission notice shall be included in
	// all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
	// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	// when used in node, this will actually load the util module we depend on
	// versus loading the builtin util module as happens otherwise
	// this is a bug in node module loading as far as I am concerned
	var util = __webpack_require__(145);

	var pSlice = Array.prototype.slice;
	var hasOwn = Object.prototype.hasOwnProperty;

	// 1. The assert module provides functions that throw
	// AssertionError's when particular conditions are not met. The
	// assert module must conform to the following interface.

	var assert = module.exports = ok;

	// 2. The AssertionError is defined in assert.
	// new assert.AssertionError({ message: message,
	//                             actual: actual,
	//                             expected: expected })

	assert.AssertionError = function AssertionError(options) {
	  this.name = 'AssertionError';
	  this.actual = options.actual;
	  this.expected = options.expected;
	  this.operator = options.operator;
	  if (options.message) {
	    this.message = options.message;
	    this.generatedMessage = false;
	  } else {
	    this.message = getMessage(this);
	    this.generatedMessage = true;
	  }
	  var stackStartFunction = options.stackStartFunction || fail;

	  if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, stackStartFunction);
	  }
	  else {
	    // non v8 browsers so we can have a stacktrace
	    var err = new Error();
	    if (err.stack) {
	      var out = err.stack;

	      // try to strip useless frames
	      var fn_name = stackStartFunction.name;
	      var idx = out.indexOf('\n' + fn_name);
	      if (idx >= 0) {
	        // once we have located the function frame
	        // we need to strip out everything before it (and its line)
	        var next_line = out.indexOf('\n', idx + 1);
	        out = out.substring(next_line + 1);
	      }

	      this.stack = out;
	    }
	  }
	};

	// assert.AssertionError instanceof Error
	util.inherits(assert.AssertionError, Error);

	function replacer(key, value) {
	  if (util.isUndefined(value)) {
	    return '' + value;
	  }
	  if (util.isNumber(value) && !isFinite(value)) {
	    return value.toString();
	  }
	  if (util.isFunction(value) || util.isRegExp(value)) {
	    return value.toString();
	  }
	  return value;
	}

	function truncate(s, n) {
	  if (util.isString(s)) {
	    return s.length < n ? s : s.slice(0, n);
	  } else {
	    return s;
	  }
	}

	function getMessage(self) {
	  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
	         self.operator + ' ' +
	         truncate(JSON.stringify(self.expected, replacer), 128);
	}

	// At present only the three keys mentioned above are used and
	// understood by the spec. Implementations or sub modules can pass
	// other keys to the AssertionError's constructor - they will be
	// ignored.

	// 3. All of the following functions must throw an AssertionError
	// when a corresponding condition is not met, with a message that
	// may be undefined if not provided.  All assertion methods provide
	// both the actual and expected values to the assertion error for
	// display purposes.

	function fail(actual, expected, message, operator, stackStartFunction) {
	  throw new assert.AssertionError({
	    message: message,
	    actual: actual,
	    expected: expected,
	    operator: operator,
	    stackStartFunction: stackStartFunction
	  });
	}

	// EXTENSION! allows for well behaved errors defined elsewhere.
	assert.fail = fail;

	// 4. Pure assertion tests whether a value is truthy, as determined
	// by !!guard.
	// assert.ok(guard, message_opt);
	// This statement is equivalent to assert.equal(true, !!guard,
	// message_opt);. To test strictly for the value true, use
	// assert.strictEqual(true, guard, message_opt);.

	function ok(value, message) {
	  if (!value) fail(value, true, message, '==', assert.ok);
	}
	assert.ok = ok;

	// 5. The equality assertion tests shallow, coercive equality with
	// ==.
	// assert.equal(actual, expected, message_opt);

	assert.equal = function equal(actual, expected, message) {
	  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
	};

	// 6. The non-equality assertion tests for whether two objects are not equal
	// with != assert.notEqual(actual, expected, message_opt);

	assert.notEqual = function notEqual(actual, expected, message) {
	  if (actual == expected) {
	    fail(actual, expected, message, '!=', assert.notEqual);
	  }
	};

	// 7. The equivalence assertion tests a deep equality relation.
	// assert.deepEqual(actual, expected, message_opt);

	assert.deepEqual = function deepEqual(actual, expected, message) {
	  if (!_deepEqual(actual, expected)) {
	    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
	  }
	};

	function _deepEqual(actual, expected) {
	  // 7.1. All identical values are equivalent, as determined by ===.
	  if (actual === expected) {
	    return true;

	  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
	    if (actual.length != expected.length) return false;

	    for (var i = 0; i < actual.length; i++) {
	      if (actual[i] !== expected[i]) return false;
	    }

	    return true;

	  // 7.2. If the expected value is a Date object, the actual value is
	  // equivalent if it is also a Date object that refers to the same time.
	  } else if (util.isDate(actual) && util.isDate(expected)) {
	    return actual.getTime() === expected.getTime();

	  // 7.3 If the expected value is a RegExp object, the actual value is
	  // equivalent if it is also a RegExp object with the same source and
	  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
	  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
	    return actual.source === expected.source &&
	           actual.global === expected.global &&
	           actual.multiline === expected.multiline &&
	           actual.lastIndex === expected.lastIndex &&
	           actual.ignoreCase === expected.ignoreCase;

	  // 7.4. Other pairs that do not both pass typeof value == 'object',
	  // equivalence is determined by ==.
	  } else if (!util.isObject(actual) && !util.isObject(expected)) {
	    return actual == expected;

	  // 7.5 For all other Object pairs, including Array objects, equivalence is
	  // determined by having the same number of owned properties (as verified
	  // with Object.prototype.hasOwnProperty.call), the same set of keys
	  // (although not necessarily the same order), equivalent values for every
	  // corresponding key, and an identical 'prototype' property. Note: this
	  // accounts for both named and indexed properties on Arrays.
	  } else {
	    return objEquiv(actual, expected);
	  }
	}

	function isArguments(object) {
	  return Object.prototype.toString.call(object) == '[object Arguments]';
	}

	function objEquiv(a, b) {
	  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
	    return false;
	  // an identical 'prototype' property.
	  if (a.prototype !== b.prototype) return false;
	  // if one is a primitive, the other must be same
	  if (util.isPrimitive(a) || util.isPrimitive(b)) {
	    return a === b;
	  }
	  var aIsArgs = isArguments(a),
	      bIsArgs = isArguments(b);
	  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
	    return false;
	  if (aIsArgs) {
	    a = pSlice.call(a);
	    b = pSlice.call(b);
	    return _deepEqual(a, b);
	  }
	  var ka = objectKeys(a),
	      kb = objectKeys(b),
	      key, i;
	  // having the same number of owned properties (keys incorporates
	  // hasOwnProperty)
	  if (ka.length != kb.length)
	    return false;
	  //the same set of keys (although not necessarily the same order),
	  ka.sort();
	  kb.sort();
	  //~~~cheap key test
	  for (i = ka.length - 1; i >= 0; i--) {
	    if (ka[i] != kb[i])
	      return false;
	  }
	  //equivalent values for every corresponding key, and
	  //~~~possibly expensive deep test
	  for (i = ka.length - 1; i >= 0; i--) {
	    key = ka[i];
	    if (!_deepEqual(a[key], b[key])) return false;
	  }
	  return true;
	}

	// 8. The non-equivalence assertion tests for any deep inequality.
	// assert.notDeepEqual(actual, expected, message_opt);

	assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
	  if (_deepEqual(actual, expected)) {
	    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
	  }
	};

	// 9. The strict equality assertion tests strict equality, as determined by ===.
	// assert.strictEqual(actual, expected, message_opt);

	assert.strictEqual = function strictEqual(actual, expected, message) {
	  if (actual !== expected) {
	    fail(actual, expected, message, '===', assert.strictEqual);
	  }
	};

	// 10. The strict non-equality assertion tests for strict inequality, as
	// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

	assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
	  if (actual === expected) {
	    fail(actual, expected, message, '!==', assert.notStrictEqual);
	  }
	};

	function expectedException(actual, expected) {
	  if (!actual || !expected) {
	    return false;
	  }

	  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
	    return expected.test(actual);
	  } else if (actual instanceof expected) {
	    return true;
	  } else if (expected.call({}, actual) === true) {
	    return true;
	  }

	  return false;
	}

	function _throws(shouldThrow, block, expected, message) {
	  var actual;

	  if (util.isString(expected)) {
	    message = expected;
	    expected = null;
	  }

	  try {
	    block();
	  } catch (e) {
	    actual = e;
	  }

	  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
	            (message ? ' ' + message : '.');

	  if (shouldThrow && !actual) {
	    fail(actual, expected, 'Missing expected exception' + message);
	  }

	  if (!shouldThrow && expectedException(actual, expected)) {
	    fail(actual, expected, 'Got unwanted exception' + message);
	  }

	  if ((shouldThrow && actual && expected &&
	      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
	    throw actual;
	  }
	}

	// 11. Expected to throw an error:
	// assert.throws(block, Error_opt, message_opt);

	assert.throws = function(block, /*optional*/error, /*optional*/message) {
	  _throws.apply(this, [true].concat(pSlice.call(arguments)));
	};

	// EXTENSION! This is annoying to write outside this module.
	assert.doesNotThrow = function(block, /*optional*/message) {
	  _throws.apply(this, [false].concat(pSlice.call(arguments)));
	};

	assert.ifError = function(err) { if (err) {throw err;}};

	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) {
	    if (hasOwn.call(obj, key)) keys.push(key);
	  }
	  return keys;
	};


/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */

	var base64 = __webpack_require__(165)
	var ieee754 = __webpack_require__(146)
	var isArray = __webpack_require__(147)

	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50
	Buffer.poolSize = 8192 // not used by this implementation

	var rootParent = {}

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
	 *     on objects.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
	  ? global.TYPED_ARRAY_SUPPORT
	  : typedArraySupport()

	function typedArraySupport () {
	  function Bar () {}
	  try {
	    var arr = new Uint8Array(1)
	    arr.foo = function () { return 42 }
	    arr.constructor = Bar
	    return arr.foo() === 42 && // typed array instances can be augmented
	        arr.constructor === Bar && // constructor can be set
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	/**
	 * Class: Buffer
	 * =============
	 *
	 * The Buffer constructor returns instances of `Uint8Array` that are augmented
	 * with function properties for all the node `Buffer` API functions. We use
	 * `Uint8Array` so that square bracket notation works as expected -- it returns
	 * a single octet.
	 *
	 * By augmenting the instances, we can avoid modifying the `Uint8Array`
	 * prototype.
	 */
	function Buffer (arg) {
	  if (!(this instanceof Buffer)) {
	    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
	    if (arguments.length > 1) return new Buffer(arg, arguments[1])
	    return new Buffer(arg)
	  }

	  this.length = 0
	  this.parent = undefined

	  // Common case.
	  if (typeof arg === 'number') {
	    return fromNumber(this, arg)
	  }

	  // Slightly less common case.
	  if (typeof arg === 'string') {
	    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
	  }

	  // Unusual.
	  return fromObject(this, arg)
	}

	function fromNumber (that, length) {
	  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < length; i++) {
	      that[i] = 0
	    }
	  }
	  return that
	}

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

	  // Assumption: byteLength() return value is always < kMaxLength.
	  var length = byteLength(string, encoding) | 0
	  that = allocate(that, length)

	  that.write(string, encoding)
	  return that
	}

	function fromObject (that, object) {
	  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

	  if (isArray(object)) return fromArray(that, object)

	  if (object == null) {
	    throw new TypeError('must start with number, buffer, array or string')
	  }

	  if (typeof ArrayBuffer !== 'undefined') {
	    if (object.buffer instanceof ArrayBuffer) {
	      return fromTypedArray(that, object)
	    }
	    if (object instanceof ArrayBuffer) {
	      return fromArrayBuffer(that, object)
	    }
	  }

	  if (object.length) return fromArrayLike(that, object)

	  return fromJsonObject(that, object)
	}

	function fromBuffer (that, buffer) {
	  var length = checked(buffer.length) | 0
	  that = allocate(that, length)
	  buffer.copy(that, 0, 0, length)
	  return that
	}

	function fromArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Duplicate of fromArray() to keep fromArray() monomorphic.
	function fromTypedArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  // Truncating the elements is probably not what people expect from typed
	  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
	  // of the old Buffer constructor.
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	function fromArrayBuffer (that, array) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    array.byteLength
	    that = Buffer._augment(new Uint8Array(array))
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromTypedArray(that, new Uint8Array(array))
	  }
	  return that
	}

	function fromArrayLike (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
	// Returns a zero-length buffer for inputs that don't conform to the spec.
	function fromJsonObject (that, object) {
	  var array
	  var length = 0

	  if (object.type === 'Buffer' && isArray(object.data)) {
	    array = object.data
	    length = checked(array.length) | 0
	  }
	  that = allocate(that, length)

	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype
	  Buffer.__proto__ = Uint8Array
	}

	function allocate (that, length) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = Buffer._augment(new Uint8Array(length))
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that.length = length
	    that._isBuffer = true
	  }

	  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
	  if (fromPool) that.parent = rootParent

	  return that
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (subject, encoding) {
	  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

	  var buf = new Buffer(subject, encoding)
	  delete buf.parent
	  return buf
	}

	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length
	  var y = b.length

	  var i = 0
	  var len = Math.min(x, y)
	  while (i < len) {
	    if (a[i] !== b[i]) break

	    ++i
	  }

	  if (i !== len) {
	    x = a[i]
	    y = b[i]
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'binary':
	    case 'base64':
	    case 'raw':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

	  if (list.length === 0) {
	    return new Buffer(0)
	  }

	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; i++) {
	      length += list[i].length
	    }
	  }

	  var buf = new Buffer(length)
	  var pos = 0
	  for (i = 0; i < list.length; i++) {
	    var item = list[i]
	    item.copy(buf, pos)
	    pos += item.length
	  }
	  return buf
	}

	function byteLength (string, encoding) {
	  if (typeof string !== 'string') string = '' + string

	  var len = string.length
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'binary':
	      // Deprecated
	      case 'raw':
	      case 'raws':
	        return len
	      case 'utf8':
	      case 'utf-8':
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength

	// pre-set for values that may exist in the future
	Buffer.prototype.length = undefined
	Buffer.prototype.parent = undefined

	function slowToString (encoding, start, end) {
	  var loweredCase = false

	  start = start | 0
	  end = end === undefined || end === Infinity ? this.length : end | 0

	  if (!encoding) encoding = 'utf8'
	  if (start < 0) start = 0
	  if (end > this.length) end = this.length
	  if (end <= start) return ''

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'binary':
	        return binarySlice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}

	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}

	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}

	Buffer.prototype.compare = function compare (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return 0
	  return Buffer.compare(this, b)
	}

	Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
	  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
	  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
	  byteOffset >>= 0

	  if (this.length === 0) return -1
	  if (byteOffset >= this.length) return -1

	  // Negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

	  if (typeof val === 'string') {
	    if (val.length === 0) return -1 // special case: looking for empty string always fails
	    return String.prototype.indexOf.call(this, val, byteOffset)
	  }
	  if (Buffer.isBuffer(val)) {
	    return arrayIndexOf(this, val, byteOffset)
	  }
	  if (typeof val === 'number') {
	    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
	      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
	    }
	    return arrayIndexOf(this, [ val ], byteOffset)
	  }

	  function arrayIndexOf (arr, val, byteOffset) {
	    var foundIndex = -1
	    for (var i = 0; byteOffset + i < arr.length; i++) {
	      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
	      } else {
	        foundIndex = -1
	      }
	    }
	    return -1
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	// `get` is deprecated
	Buffer.prototype.get = function get (offset) {
	  console.log('.get() is deprecated. Access using array indexes instead.')
	  return this.readUInt8(offset)
	}

	// `set` is deprecated
	Buffer.prototype.set = function set (v, offset) {
	  console.log('.set() is deprecated. Access using array indexes instead.')
	  return this.writeUInt8(v, offset)
	}

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; i++) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(parsed)) throw new Error('Invalid hex string')
	    buf[offset + i] = parsed
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function binaryWrite (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0
	    if (isFinite(length)) {
	      length = length | 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    var swap = encoding
	    encoding = offset
	    offset = length | 0
	    length = swap
	  }

	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8'

	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'binary':
	        return binaryWrite(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []

	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }

	    res.push(codePoint)
	    i += bytesPerSequence
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}

	function binarySlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length

	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len

	  var out = ''
	  for (var i = start; i < end; i++) {
	    out += toHex(buf[i])
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end

	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }

	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }

	  if (end < start) end = start

	  var newBuf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = Buffer._augment(this.subarray(start, end))
	  } else {
	    var sliceLen = end - start
	    newBuf = new Buffer(sliceLen, undefined)
	    for (var i = 0; i < sliceLen; i++) {
	      newBuf[i] = this[i + start]
	    }
	  }

	  if (newBuf.length) newBuf.parent = this.parent || this

	  return newBuf
	}

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }

	  return val
	}

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }

	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }

	  return val
	}

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = 0
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	  if (offset < 0) throw new RangeError('index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }

	  var len = end - start
	  var i

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; i--) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; i++) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    target._set(this.subarray(start, start + len), targetStart)
	  }

	  return len
	}

	// fill(value, start=0, end=buffer.length)
	Buffer.prototype.fill = function fill (value, start, end) {
	  if (!value) value = 0
	  if (!start) start = 0
	  if (!end) end = this.length

	  if (end < start) throw new RangeError('end < start')

	  // Fill 0 bytes; we're done
	  if (end === start) return
	  if (this.length === 0) return

	  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
	  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

	  var i
	  if (typeof value === 'number') {
	    for (i = start; i < end; i++) {
	      this[i] = value
	    }
	  } else {
	    var bytes = utf8ToBytes(value.toString())
	    var len = bytes.length
	    for (i = start; i < end; i++) {
	      this[i] = bytes[i % len]
	    }
	  }

	  return this
	}

	/**
	 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
	 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
	 */
	Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
	  if (typeof Uint8Array !== 'undefined') {
	    if (Buffer.TYPED_ARRAY_SUPPORT) {
	      return (new Buffer(this)).buffer
	    } else {
	      var buf = new Uint8Array(this.length)
	      for (var i = 0, len = buf.length; i < len; i += 1) {
	        buf[i] = this[i]
	      }
	      return buf.buffer
	    }
	  } else {
	    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
	  }
	}

	// HELPER FUNCTIONS
	// ================

	var BP = Buffer.prototype

	/**
	 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
	 */
	Buffer._augment = function _augment (arr) {
	  arr.constructor = Buffer
	  arr._isBuffer = true

	  // save reference to original Uint8Array set method before overwriting
	  arr._set = arr.set

	  // deprecated
	  arr.get = BP.get
	  arr.set = BP.set

	  arr.write = BP.write
	  arr.toString = BP.toString
	  arr.toLocaleString = BP.toString
	  arr.toJSON = BP.toJSON
	  arr.equals = BP.equals
	  arr.compare = BP.compare
	  arr.indexOf = BP.indexOf
	  arr.copy = BP.copy
	  arr.slice = BP.slice
	  arr.readUIntLE = BP.readUIntLE
	  arr.readUIntBE = BP.readUIntBE
	  arr.readUInt8 = BP.readUInt8
	  arr.readUInt16LE = BP.readUInt16LE
	  arr.readUInt16BE = BP.readUInt16BE
	  arr.readUInt32LE = BP.readUInt32LE
	  arr.readUInt32BE = BP.readUInt32BE
	  arr.readIntLE = BP.readIntLE
	  arr.readIntBE = BP.readIntBE
	  arr.readInt8 = BP.readInt8
	  arr.readInt16LE = BP.readInt16LE
	  arr.readInt16BE = BP.readInt16BE
	  arr.readInt32LE = BP.readInt32LE
	  arr.readInt32BE = BP.readInt32BE
	  arr.readFloatLE = BP.readFloatLE
	  arr.readFloatBE = BP.readFloatBE
	  arr.readDoubleLE = BP.readDoubleLE
	  arr.readDoubleBE = BP.readDoubleBE
	  arr.writeUInt8 = BP.writeUInt8
	  arr.writeUIntLE = BP.writeUIntLE
	  arr.writeUIntBE = BP.writeUIntBE
	  arr.writeUInt16LE = BP.writeUInt16LE
	  arr.writeUInt16BE = BP.writeUInt16BE
	  arr.writeUInt32LE = BP.writeUInt32LE
	  arr.writeUInt32BE = BP.writeUInt32BE
	  arr.writeIntLE = BP.writeIntLE
	  arr.writeIntBE = BP.writeIntBE
	  arr.writeInt8 = BP.writeInt8
	  arr.writeInt16LE = BP.writeInt16LE
	  arr.writeInt16BE = BP.writeInt16BE
	  arr.writeInt32LE = BP.writeInt32LE
	  arr.writeInt32BE = BP.writeInt32BE
	  arr.writeFloatLE = BP.writeFloatLE
	  arr.writeFloatBE = BP.writeFloatBE
	  arr.writeDoubleLE = BP.writeDoubleLE
	  arr.writeDoubleBE = BP.writeDoubleBE
	  arr.fill = BP.fill
	  arr.inspect = BP.inspect
	  arr.toArrayBuffer = BP.toArrayBuffer

	  return arr
	}

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []

	  for (var i = 0; i < length; i++) {
	    codePoint = string.charCodeAt(i)

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }

	      // valid surrogate pair
	      codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }

	    leadSurrogate = null

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; i++) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(97).Buffer, (function() { return this; }())))

/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(134);
	exports.Stream = __webpack_require__(132);
	exports.Readable = exports;
	exports.Writable = __webpack_require__(135);
	exports.Duplex = __webpack_require__(136);
	exports.Transform = __webpack_require__(137);
	exports.PassThrough = __webpack_require__(138);


/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = debug;
	exports.coerce = coerce;
	exports.disable = disable;
	exports.enable = enable;
	exports.enabled = enabled;
	exports.humanize = __webpack_require__(167);

	/**
	 * The currently active debug mode names, and names to skip.
	 */

	exports.names = [];
	exports.skips = [];

	/**
	 * Map of special "%n" handling functions, for the debug "format" argument.
	 *
	 * Valid key names are a single, lowercased letter, i.e. "n".
	 */

	exports.formatters = {};

	/**
	 * Previously assigned color.
	 */

	var prevColor = 0;

	/**
	 * Previous log timestamp.
	 */

	var prevTime;

	/**
	 * Select a color.
	 *
	 * @return {Number}
	 * @api private
	 */

	function selectColor() {
	  return exports.colors[prevColor++ % exports.colors.length];
	}

	/**
	 * Create a debugger with the given `namespace`.
	 *
	 * @param {String} namespace
	 * @return {Function}
	 * @api public
	 */

	function debug(namespace) {

	  // define the `disabled` version
	  function disabled() {
	  }
	  disabled.enabled = false;

	  // define the `enabled` version
	  function enabled() {

	    var self = enabled;

	    // set `diff` timestamp
	    var curr = +new Date();
	    var ms = curr - (prevTime || curr);
	    self.diff = ms;
	    self.prev = prevTime;
	    self.curr = curr;
	    prevTime = curr;

	    // add the `color` if not set
	    if (null == self.useColors) self.useColors = exports.useColors();
	    if (null == self.color && self.useColors) self.color = selectColor();

	    var args = Array.prototype.slice.call(arguments);

	    args[0] = exports.coerce(args[0]);

	    if ('string' !== typeof args[0]) {
	      // anything else let's inspect with %o
	      args = ['%o'].concat(args);
	    }

	    // apply any `formatters` transformations
	    var index = 0;
	    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
	      // if we encounter an escaped % then don't increase the array index
	      if (match === '%%') return match;
	      index++;
	      var formatter = exports.formatters[format];
	      if ('function' === typeof formatter) {
	        var val = args[index];
	        match = formatter.call(self, val);

	        // now we need to remove `args[index]` since it's inlined in the `format`
	        args.splice(index, 1);
	        index--;
	      }
	      return match;
	    });

	    if ('function' === typeof exports.formatArgs) {
	      args = exports.formatArgs.apply(self, args);
	    }
	    var logFn = enabled.log || exports.log || console.log.bind(console);
	    logFn.apply(self, args);
	  }
	  enabled.enabled = true;

	  var fn = exports.enabled(namespace) ? enabled : disabled;

	  fn.namespace = namespace;

	  return fn;
	}

	/**
	 * Enables a debug mode by namespaces. This can include modes
	 * separated by a colon and wildcards.
	 *
	 * @param {String} namespaces
	 * @api public
	 */

	function enable(namespaces) {
	  exports.save(namespaces);

	  var split = (namespaces || '').split(/[\s,]+/);
	  var len = split.length;

	  for (var i = 0; i < len; i++) {
	    if (!split[i]) continue; // ignore empty strings
	    namespaces = split[i].replace(/\*/g, '.*?');
	    if (namespaces[0] === '-') {
	      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
	    } else {
	      exports.names.push(new RegExp('^' + namespaces + '$'));
	    }
	  }
	}

	/**
	 * Disable debug output.
	 *
	 * @api public
	 */

	function disable() {
	  exports.enable('');
	}

	/**
	 * Returns true if the given mode name is enabled, false otherwise.
	 *
	 * @param {String} name
	 * @return {Boolean}
	 * @api public
	 */

	function enabled(name) {
	  var i, len;
	  for (i = 0, len = exports.skips.length; i < len; i++) {
	    if (exports.skips[i].test(name)) {
	      return false;
	    }
	  }
	  for (i = 0, len = exports.names.length; i < len; i++) {
	    if (exports.names[i].test(name)) {
	      return true;
	    }
	  }
	  return false;
	}

	/**
	 * Coerce `val`.
	 *
	 * @param {Mixed} val
	 * @return {Mixed}
	 * @api private
	 */

	function coerce(val) {
	  if (val instanceof Error) return val.stack || val.message;
	  return val;
	}


/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A specialized version of `_.forEach` for arrays without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns `array`.
	 */
	function arrayEach(array, iteratee) {
	  var index = -1,
	      length = array.length;

	  while (++index < length) {
	    if (iteratee(array[index], index, array) === false) {
	      break;
	    }
	  }
	  return array;
	}

	module.exports = arrayEach;


/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	var baseMatches = __webpack_require__(139),
	    baseMatchesProperty = __webpack_require__(140),
	    bindCallback = __webpack_require__(67),
	    identity = __webpack_require__(120),
	    property = __webpack_require__(127);

	/**
	 * The base implementation of `_.callback` which supports specifying the
	 * number of arguments to provide to `func`.
	 *
	 * @private
	 * @param {*} [func=_.identity] The value to convert to a callback.
	 * @param {*} [thisArg] The `this` binding of `func`.
	 * @param {number} [argCount] The number of arguments to provide to `func`.
	 * @returns {Function} Returns the callback.
	 */
	function baseCallback(func, thisArg, argCount) {
	  var type = typeof func;
	  if (type == 'function') {
	    return thisArg === undefined
	      ? func
	      : bindCallback(func, thisArg, argCount);
	  }
	  if (func == null) {
	    return identity;
	  }
	  if (type == 'object') {
	    return baseMatches(func);
	  }
	  return thisArg === undefined
	    ? property(func)
	    : baseMatchesProperty(func, thisArg);
	}

	module.exports = baseCallback;


/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(106);

	/**
	 * The base implementation of `_.create` without support for assigning
	 * properties to the created object.
	 *
	 * @private
	 * @param {Object} prototype The object to inherit from.
	 * @returns {Object} Returns the new object.
	 */
	var baseCreate = (function() {
	  function object() {}
	  return function(prototype) {
	    if (isObject(prototype)) {
	      object.prototype = prototype;
	      var result = new object;
	      object.prototype = undefined;
	    }
	    return result || {};
	  };
	}());

	module.exports = baseCreate;


/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

	var baseFor = __webpack_require__(141),
	    keys = __webpack_require__(110);

	/**
	 * The base implementation of `_.forOwn` without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Object} Returns `object`.
	 */
	function baseForOwn(object, iteratee) {
	  return baseFor(object, iteratee, keys);
	}

	module.exports = baseForOwn;


/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	var getNative = __webpack_require__(142),
	    isLength = __webpack_require__(143),
	    isObjectLike = __webpack_require__(144);

	/** `Object#toString` result references. */
	var arrayTag = '[object Array]';

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;

	/* Native method references for those with the same name as other `lodash` methods. */
	var nativeIsArray = getNative(Array, 'isArray');

	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(function() { return arguments; }());
	 * // => false
	 */
	var isArray = nativeIsArray || function(value) {
	  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
	};

	module.exports = isArray;


/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(106);

	/** `Object#toString` result references. */
	var funcTag = '[object Function]';

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;

	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in older versions of Chrome and Safari which return 'function' for regexes
	  // and Safari 8 which returns 'object' for typed array constructors.
	  return isObject(value) && objToString.call(value) == funcTag;
	}

	module.exports = isFunction;


/***/ },
/* 106 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
	 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(1);
	 * // => false
	 */
	function isObject(value) {
	  // Avoid a V8 JIT bug in Chrome 19-20.
	  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}

	module.exports = isObject;


/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	var isLength = __webpack_require__(143),
	    isObjectLike = __webpack_require__(144);

	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    funcTag = '[object Function]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    objectTag = '[object Object]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    weakMapTag = '[object WeakMap]';

	var arrayBufferTag = '[object ArrayBuffer]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';

	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags = {};
	typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
	typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
	typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
	typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
	typedArrayTags[uint32Tag] = true;
	typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
	typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
	typedArrayTags[dateTag] = typedArrayTags[errorTag] =
	typedArrayTags[funcTag] = typedArrayTags[mapTag] =
	typedArrayTags[numberTag] = typedArrayTags[objectTag] =
	typedArrayTags[regexpTag] = typedArrayTags[setTag] =
	typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;

	/**
	 * Checks if `value` is classified as a typed array.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isTypedArray(new Uint8Array);
	 * // => true
	 *
	 * _.isTypedArray([]);
	 * // => false
	 */
	function isTypedArray(value) {
	  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
	}

	module.exports = isTypedArray;


/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {/*! https://mths.be/punycode v1.3.2 by @mathias */
	;(function(root) {

		/** Detect free variables */
		var freeExports = typeof exports == 'object' && exports &&
			!exports.nodeType && exports;
		var freeModule = typeof module == 'object' && module &&
			!module.nodeType && module;
		var freeGlobal = typeof global == 'object' && global;
		if (
			freeGlobal.global === freeGlobal ||
			freeGlobal.window === freeGlobal ||
			freeGlobal.self === freeGlobal
		) {
			root = freeGlobal;
		}

		/**
		 * The `punycode` object.
		 * @name punycode
		 * @type Object
		 */
		var punycode,

		/** Highest positive signed 32-bit float value */
		maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

		/** Bootstring parameters */
		base = 36,
		tMin = 1,
		tMax = 26,
		skew = 38,
		damp = 700,
		initialBias = 72,
		initialN = 128, // 0x80
		delimiter = '-', // '\x2D'

		/** Regular expressions */
		regexPunycode = /^xn--/,
		regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
		regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

		/** Error messages */
		errors = {
			'overflow': 'Overflow: input needs wider integers to process',
			'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
			'invalid-input': 'Invalid input'
		},

		/** Convenience shortcuts */
		baseMinusTMin = base - tMin,
		floor = Math.floor,
		stringFromCharCode = String.fromCharCode,

		/** Temporary variable */
		key;

		/*--------------------------------------------------------------------------*/

		/**
		 * A generic error utility function.
		 * @private
		 * @param {String} type The error type.
		 * @returns {Error} Throws a `RangeError` with the applicable error message.
		 */
		function error(type) {
			throw RangeError(errors[type]);
		}

		/**
		 * A generic `Array#map` utility function.
		 * @private
		 * @param {Array} array The array to iterate over.
		 * @param {Function} callback The function that gets called for every array
		 * item.
		 * @returns {Array} A new array of values returned by the callback function.
		 */
		function map(array, fn) {
			var length = array.length;
			var result = [];
			while (length--) {
				result[length] = fn(array[length]);
			}
			return result;
		}

		/**
		 * A simple `Array#map`-like wrapper to work with domain name strings or email
		 * addresses.
		 * @private
		 * @param {String} domain The domain name or email address.
		 * @param {Function} callback The function that gets called for every
		 * character.
		 * @returns {Array} A new string of characters returned by the callback
		 * function.
		 */
		function mapDomain(string, fn) {
			var parts = string.split('@');
			var result = '';
			if (parts.length > 1) {
				// In email addresses, only the domain name should be punycoded. Leave
				// the local part (i.e. everything up to `@`) intact.
				result = parts[0] + '@';
				string = parts[1];
			}
			// Avoid `split(regex)` for IE8 compatibility. See #17.
			string = string.replace(regexSeparators, '\x2E');
			var labels = string.split('.');
			var encoded = map(labels, fn).join('.');
			return result + encoded;
		}

		/**
		 * Creates an array containing the numeric code points of each Unicode
		 * character in the string. While JavaScript uses UCS-2 internally,
		 * this function will convert a pair of surrogate halves (each of which
		 * UCS-2 exposes as separate characters) into a single code point,
		 * matching UTF-16.
		 * @see `punycode.ucs2.encode`
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode.ucs2
		 * @name decode
		 * @param {String} string The Unicode input string (UCS-2).
		 * @returns {Array} The new array of code points.
		 */
		function ucs2decode(string) {
			var output = [],
			    counter = 0,
			    length = string.length,
			    value,
			    extra;
			while (counter < length) {
				value = string.charCodeAt(counter++);
				if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
					// high surrogate, and there is a next character
					extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) { // low surrogate
						output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
					} else {
						// unmatched surrogate; only append this code unit, in case the next
						// code unit is the high surrogate of a surrogate pair
						output.push(value);
						counter--;
					}
				} else {
					output.push(value);
				}
			}
			return output;
		}

		/**
		 * Creates a string based on an array of numeric code points.
		 * @see `punycode.ucs2.decode`
		 * @memberOf punycode.ucs2
		 * @name encode
		 * @param {Array} codePoints The array of numeric code points.
		 * @returns {String} The new Unicode string (UCS-2).
		 */
		function ucs2encode(array) {
			return map(array, function(value) {
				var output = '';
				if (value > 0xFFFF) {
					value -= 0x10000;
					output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
					value = 0xDC00 | value & 0x3FF;
				}
				output += stringFromCharCode(value);
				return output;
			}).join('');
		}

		/**
		 * Converts a basic code point into a digit/integer.
		 * @see `digitToBasic()`
		 * @private
		 * @param {Number} codePoint The basic numeric code point value.
		 * @returns {Number} The numeric value of a basic code point (for use in
		 * representing integers) in the range `0` to `base - 1`, or `base` if
		 * the code point does not represent a value.
		 */
		function basicToDigit(codePoint) {
			if (codePoint - 48 < 10) {
				return codePoint - 22;
			}
			if (codePoint - 65 < 26) {
				return codePoint - 65;
			}
			if (codePoint - 97 < 26) {
				return codePoint - 97;
			}
			return base;
		}

		/**
		 * Converts a digit/integer into a basic code point.
		 * @see `basicToDigit()`
		 * @private
		 * @param {Number} digit The numeric value of a basic code point.
		 * @returns {Number} The basic code point whose value (when used for
		 * representing integers) is `digit`, which needs to be in the range
		 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
		 * used; else, the lowercase form is used. The behavior is undefined
		 * if `flag` is non-zero and `digit` has no uppercase form.
		 */
		function digitToBasic(digit, flag) {
			//  0..25 map to ASCII a..z or A..Z
			// 26..35 map to ASCII 0..9
			return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
		}

		/**
		 * Bias adaptation function as per section 3.4 of RFC 3492.
		 * http://tools.ietf.org/html/rfc3492#section-3.4
		 * @private
		 */
		function adapt(delta, numPoints, firstTime) {
			var k = 0;
			delta = firstTime ? floor(delta / damp) : delta >> 1;
			delta += floor(delta / numPoints);
			for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
				delta = floor(delta / baseMinusTMin);
			}
			return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
		}

		/**
		 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
		 * symbols.
		 * @memberOf punycode
		 * @param {String} input The Punycode string of ASCII-only symbols.
		 * @returns {String} The resulting string of Unicode symbols.
		 */
		function decode(input) {
			// Don't use UCS-2
			var output = [],
			    inputLength = input.length,
			    out,
			    i = 0,
			    n = initialN,
			    bias = initialBias,
			    basic,
			    j,
			    index,
			    oldi,
			    w,
			    k,
			    digit,
			    t,
			    /** Cached calculation results */
			    baseMinusT;

			// Handle the basic code points: let `basic` be the number of input code
			// points before the last delimiter, or `0` if there is none, then copy
			// the first basic code points to the output.

			basic = input.lastIndexOf(delimiter);
			if (basic < 0) {
				basic = 0;
			}

			for (j = 0; j < basic; ++j) {
				// if it's not a basic code point
				if (input.charCodeAt(j) >= 0x80) {
					error('not-basic');
				}
				output.push(input.charCodeAt(j));
			}

			// Main decoding loop: start just after the last delimiter if any basic code
			// points were copied; start at the beginning otherwise.

			for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

				// `index` is the index of the next character to be consumed.
				// Decode a generalized variable-length integer into `delta`,
				// which gets added to `i`. The overflow checking is easier
				// if we increase `i` as we go, then subtract off its starting
				// value at the end to obtain `delta`.
				for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

					if (index >= inputLength) {
						error('invalid-input');
					}

					digit = basicToDigit(input.charCodeAt(index++));

					if (digit >= base || digit > floor((maxInt - i) / w)) {
						error('overflow');
					}

					i += digit * w;
					t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

					if (digit < t) {
						break;
					}

					baseMinusT = base - t;
					if (w > floor(maxInt / baseMinusT)) {
						error('overflow');
					}

					w *= baseMinusT;

				}

				out = output.length + 1;
				bias = adapt(i - oldi, out, oldi == 0);

				// `i` was supposed to wrap around from `out` to `0`,
				// incrementing `n` each time, so we'll fix that now:
				if (floor(i / out) > maxInt - n) {
					error('overflow');
				}

				n += floor(i / out);
				i %= out;

				// Insert `n` at position `i` of the output
				output.splice(i++, 0, n);

			}

			return ucs2encode(output);
		}

		/**
		 * Converts a string of Unicode symbols (e.g. a domain name label) to a
		 * Punycode string of ASCII-only symbols.
		 * @memberOf punycode
		 * @param {String} input The string of Unicode symbols.
		 * @returns {String} The resulting Punycode string of ASCII-only symbols.
		 */
		function encode(input) {
			var n,
			    delta,
			    handledCPCount,
			    basicLength,
			    bias,
			    j,
			    m,
			    q,
			    k,
			    t,
			    currentValue,
			    output = [],
			    /** `inputLength` will hold the number of code points in `input`. */
			    inputLength,
			    /** Cached calculation results */
			    handledCPCountPlusOne,
			    baseMinusT,
			    qMinusT;

			// Convert the input in UCS-2 to Unicode
			input = ucs2decode(input);

			// Cache the length
			inputLength = input.length;

			// Initialize the state
			n = initialN;
			delta = 0;
			bias = initialBias;

			// Handle the basic code points
			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue < 0x80) {
					output.push(stringFromCharCode(currentValue));
				}
			}

			handledCPCount = basicLength = output.length;

			// `handledCPCount` is the number of code points that have been handled;
			// `basicLength` is the number of basic code points.

			// Finish the basic string - if it is not empty - with a delimiter
			if (basicLength) {
				output.push(delimiter);
			}

			// Main encoding loop:
			while (handledCPCount < inputLength) {

				// All non-basic code points < n have been handled already. Find the next
				// larger one:
				for (m = maxInt, j = 0; j < inputLength; ++j) {
					currentValue = input[j];
					if (currentValue >= n && currentValue < m) {
						m = currentValue;
					}
				}

				// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
				// but guard against overflow
				handledCPCountPlusOne = handledCPCount + 1;
				if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
					error('overflow');
				}

				delta += (m - n) * handledCPCountPlusOne;
				n = m;

				for (j = 0; j < inputLength; ++j) {
					currentValue = input[j];

					if (currentValue < n && ++delta > maxInt) {
						error('overflow');
					}

					if (currentValue == n) {
						// Represent delta as a generalized variable-length integer
						for (q = delta, k = base; /* no condition */; k += base) {
							t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
							if (q < t) {
								break;
							}
							qMinusT = q - t;
							baseMinusT = base - t;
							output.push(
								stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
							);
							q = floor(qMinusT / baseMinusT);
						}

						output.push(stringFromCharCode(digitToBasic(q, 0)));
						bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
						delta = 0;
						++handledCPCount;
					}
				}

				++delta;
				++n;

			}
			return output.join('');
		}

		/**
		 * Converts a Punycode string representing a domain name or an email address
		 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
		 * it doesn't matter if you call it on a string that has already been
		 * converted to Unicode.
		 * @memberOf punycode
		 * @param {String} input The Punycoded domain name or email address to
		 * convert to Unicode.
		 * @returns {String} The Unicode representation of the given Punycode
		 * string.
		 */
		function toUnicode(input) {
			return mapDomain(input, function(string) {
				return regexPunycode.test(string)
					? decode(string.slice(4).toLowerCase())
					: string;
			});
		}

		/**
		 * Converts a Unicode string representing a domain name or an email address to
		 * Punycode. Only the non-ASCII parts of the domain name will be converted,
		 * i.e. it doesn't matter if you call it with a domain that's already in
		 * ASCII.
		 * @memberOf punycode
		 * @param {String} input The domain name or email address to convert, as a
		 * Unicode string.
		 * @returns {String} The Punycode representation of the given domain name or
		 * email address.
		 */
		function toASCII(input) {
			return mapDomain(input, function(string) {
				return regexNonASCII.test(string)
					? 'xn--' + encode(string)
					: string;
			});
		}

		/*--------------------------------------------------------------------------*/

		/** Define the public API */
		punycode = {
			/**
			 * A string representing the current Punycode.js version number.
			 * @memberOf punycode
			 * @type String
			 */
			'version': '1.3.2',
			/**
			 * An object of methods to convert from JavaScript's internal character
			 * representation (UCS-2) to Unicode code points, and back.
			 * @see <https://mathiasbynens.be/notes/javascript-encoding>
			 * @memberOf punycode
			 * @type Object
			 */
			'ucs2': {
				'decode': ucs2decode,
				'encode': ucs2encode
			},
			'decode': decode,
			'encode': encode,
			'toASCII': toASCII,
			'toUnicode': toUnicode
		};

		/** Expose `punycode` */
		// Some AMD build optimizers, like r.js, check for specific condition patterns
		// like the following:
		if (
			true
		) {
			!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
				return punycode;
			}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else if (freeExports && freeModule) {
			if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
				freeModule.exports = punycode;
			} else { // in Narwhal or RingoJS v0.7.0-
				for (key in punycode) {
					punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
				}
			}
		} else { // in Rhino or a web browser
			root.punycode = punycode;
		}

	}(this));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(168)(module), (function() { return this; }())))

/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.decode = exports.parse = __webpack_require__(148);
	exports.encode = exports.stringify = __webpack_require__(149);


/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	var getNative = __webpack_require__(142),
	    isArrayLike = __webpack_require__(150),
	    isObject = __webpack_require__(106),
	    shimKeys = __webpack_require__(152);

	/* Native method references for those with the same name as other `lodash` methods. */
	var nativeKeys = getNative(Object, 'keys');

	/**
	 * Creates an array of the own enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects. See the
	 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
	 * for more details.
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keys(new Foo);
	 * // => ['a', 'b'] (iteration order is not guaranteed)
	 *
	 * _.keys('hi');
	 * // => ['0', '1']
	 */
	var keys = !nativeKeys ? shimKeys : function(object) {
	  var Ctor = object == null ? undefined : object.constructor;
	  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
	      (typeof object != 'function' && isArrayLike(object))) {
	    return shimKeys(object);
	  }
	  return isObject(object) ? nativeKeys(object) : [];
	};

	module.exports = keys;


/***/ },
/* 111 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copies properties of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy properties from.
	 * @param {Array} props The property names to copy.
	 * @param {Object} [object={}] The object to copy properties to.
	 * @returns {Object} Returns `object`.
	 */
	function baseCopy(source, props, object) {
	  object || (object = {});

	  var index = -1,
	      length = props.length;

	  while (++index < length) {
	    var key = props[index];
	    object[key] = source[key];
	  }
	  return object;
	}

	module.exports = baseCopy;


/***/ },
/* 112 */
/***/ function(module, exports, __webpack_require__) {

	var isArrayLike = __webpack_require__(150),
	    isIndex = __webpack_require__(151),
	    isObject = __webpack_require__(106);

	/**
	 * Checks if the provided arguments are from an iteratee call.
	 *
	 * @private
	 * @param {*} value The potential iteratee value argument.
	 * @param {*} index The potential iteratee index or key argument.
	 * @param {*} object The potential iteratee object argument.
	 * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
	 */
	function isIterateeCall(value, index, object) {
	  if (!isObject(object)) {
	    return false;
	  }
	  var type = typeof index;
	  if (type == 'number'
	      ? (isArrayLike(object) && isIndex(index, object.length))
	      : (type == 'string' && index in object)) {
	    var other = object[index];
	    return value === value ? (value === other) : (other !== other);
	  }
	  return false;
	}

	module.exports = isIterateeCall;


/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	/** Used as the `TypeError` message for "Functions" methods. */
	var FUNC_ERROR_TEXT = 'Expected a function';

	/* Native method references for those with the same name as other `lodash` methods. */
	var nativeMax = Math.max;

	/**
	 * Creates a function that invokes `func` with the `this` binding of the
	 * created function and arguments from `start` and beyond provided as an array.
	 *
	 * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/Web/JavaScript/Reference/Functions/rest_parameters).
	 *
	 * @static
	 * @memberOf _
	 * @category Function
	 * @param {Function} func The function to apply a rest parameter to.
	 * @param {number} [start=func.length-1] The start position of the rest parameter.
	 * @returns {Function} Returns the new function.
	 * @example
	 *
	 * var say = _.restParam(function(what, names) {
	 *   return what + ' ' + _.initial(names).join(', ') +
	 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
	 * });
	 *
	 * say('hello', 'fred', 'barney', 'pebbles');
	 * // => 'hello fred, barney, & pebbles'
	 */
	function restParam(func, start) {
	  if (typeof func != 'function') {
	    throw new TypeError(FUNC_ERROR_TEXT);
	  }
	  start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
	  return function() {
	    var args = arguments,
	        index = -1,
	        length = nativeMax(args.length - start, 0),
	        rest = Array(length);

	    while (++index < length) {
	      rest[index] = args[start + index];
	    }
	    switch (start) {
	      case 0: return func.call(this, rest);
	      case 1: return func.call(this, args[0], rest);
	      case 2: return func.call(this, args[0], args[1], rest);
	    }
	    var otherArgs = Array(start + 1);
	    index = -1;
	    while (++index < start) {
	      otherArgs[index] = args[index];
	    }
	    otherArgs[start] = rest;
	    return func.apply(this, otherArgs);
	  };
	}

	module.exports = restParam;


/***/ },
/* 114 */
/***/ function(module, exports, __webpack_require__) {

	var getLength = __webpack_require__(153),
	    isLength = __webpack_require__(143),
	    toObject = __webpack_require__(154);

	/**
	 * Creates a `baseEach` or `baseEachRight` function.
	 *
	 * @private
	 * @param {Function} eachFunc The function to iterate over a collection.
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {Function} Returns the new base function.
	 */
	function createBaseEach(eachFunc, fromRight) {
	  return function(collection, iteratee) {
	    var length = collection ? getLength(collection) : 0;
	    if (!isLength(length)) {
	      return eachFunc(collection, iteratee);
	    }
	    var index = fromRight ? length : -1,
	        iterable = toObject(collection);

	    while ((fromRight ? index-- : ++index < length)) {
	      if (iteratee(iterable[index], index, iterable) === false) {
	        break;
	      }
	    }
	    return collection;
	  };
	}

	module.exports = createBaseEach;


/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * The base implementation of `_.reduce` and `_.reduceRight` without support
	 * for callback shorthands and `this` binding, which iterates over `collection`
	 * using the provided `eachFunc`.
	 *
	 * @private
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {*} accumulator The initial value.
	 * @param {boolean} initFromCollection Specify using the first or last element
	 *  of `collection` as the initial value.
	 * @param {Function} eachFunc The function to iterate over `collection`.
	 * @returns {*} Returns the accumulated value.
	 */
	function baseReduce(collection, iteratee, accumulator, initFromCollection, eachFunc) {
	  eachFunc(collection, function(value, index, collection) {
	    accumulator = initFromCollection
	      ? (initFromCollection = false, value)
	      : iteratee(accumulator, value, index, collection);
	  });
	  return accumulator;
	}

	module.exports = baseReduce;


/***/ },
/* 116 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copies the values of `source` to `array`.
	 *
	 * @private
	 * @param {Array} source The array to copy values from.
	 * @param {Array} [array=[]] The array to copy values to.
	 * @returns {Array} Returns `array`.
	 */
	function arrayCopy(source, array) {
	  var index = -1,
	      length = source.length;

	  array || (array = Array(length));
	  while (++index < length) {
	    array[index] = source[index];
	  }
	  return array;
	}

	module.exports = arrayCopy;


/***/ },
/* 117 */
/***/ function(module, exports, __webpack_require__) {

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Initializes an array clone.
	 *
	 * @private
	 * @param {Array} array The array to clone.
	 * @returns {Array} Returns the initialized clone.
	 */
	function initCloneArray(array) {
	  var length = array.length,
	      result = new array.constructor(length);

	  // Add array properties assigned by `RegExp#exec`.
	  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
	    result.index = array.index;
	    result.input = array.input;
	  }
	  return result;
	}

	module.exports = initCloneArray;


/***/ },
/* 118 */
/***/ function(module, exports, __webpack_require__) {

	var bufferClone = __webpack_require__(155);

	/** `Object#toString` result references. */
	var boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    numberTag = '[object Number]',
	    regexpTag = '[object RegExp]',
	    stringTag = '[object String]';

	var arrayBufferTag = '[object ArrayBuffer]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';

	/** Used to match `RegExp` flags from their coerced string values. */
	var reFlags = /\w*$/;

	/**
	 * Initializes an object clone based on its `toStringTag`.
	 *
	 * **Note:** This function only supports cloning values with tags of
	 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @param {string} tag The `toStringTag` of the object to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneByTag(object, tag, isDeep) {
	  var Ctor = object.constructor;
	  switch (tag) {
	    case arrayBufferTag:
	      return bufferClone(object);

	    case boolTag:
	    case dateTag:
	      return new Ctor(+object);

	    case float32Tag: case float64Tag:
	    case int8Tag: case int16Tag: case int32Tag:
	    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
	      var buffer = object.buffer;
	      return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);

	    case numberTag:
	    case stringTag:
	      return new Ctor(object);

	    case regexpTag:
	      var result = new Ctor(object.source, reFlags.exec(object));
	      result.lastIndex = object.lastIndex;
	  }
	  return result;
	}

	module.exports = initCloneByTag;


/***/ },
/* 119 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Initializes an object clone.
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneObject(object) {
	  var Ctor = object.constructor;
	  if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
	    Ctor = Object;
	  }
	  return new Ctor;
	}

	module.exports = initCloneObject;


/***/ },
/* 120 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * This method returns the first argument provided to it.
	 *
	 * @static
	 * @memberOf _
	 * @category Utility
	 * @param {*} value Any value.
	 * @returns {*} Returns `value`.
	 * @example
	 *
	 * var object = { 'user': 'fred' };
	 *
	 * _.identity(object) === object;
	 * // => true
	 */
	function identity(value) {
	  return value;
	}

	module.exports = identity;


/***/ },
/* 121 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

	module.exports = function (str) {
		if (typeof str !== 'string') {
			throw new TypeError('Expected a string');
		}

		return str.replace(matchOperatorsRe,  '\\$&');
	};


/***/ },
/* 122 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';

	function assembleStyles () {
		var styles = {
			modifiers: {
				reset: [0, 0],
				bold: [1, 22], // 21 isn't widely supported and 22 does the same thing
				dim: [2, 22],
				italic: [3, 23],
				underline: [4, 24],
				inverse: [7, 27],
				hidden: [8, 28],
				strikethrough: [9, 29]
			},
			colors: {
				black: [30, 39],
				red: [31, 39],
				green: [32, 39],
				yellow: [33, 39],
				blue: [34, 39],
				magenta: [35, 39],
				cyan: [36, 39],
				white: [37, 39],
				gray: [90, 39]
			},
			bgColors: {
				bgBlack: [40, 49],
				bgRed: [41, 49],
				bgGreen: [42, 49],
				bgYellow: [43, 49],
				bgBlue: [44, 49],
				bgMagenta: [45, 49],
				bgCyan: [46, 49],
				bgWhite: [47, 49]
			}
		};

		// fix humans
		styles.colors.grey = styles.colors.gray;

		Object.keys(styles).forEach(function (groupName) {
			var group = styles[groupName];

			Object.keys(group).forEach(function (styleName) {
				var style = group[styleName];

				styles[styleName] = group[styleName] = {
					open: '\u001b[' + style[0] + 'm',
					close: '\u001b[' + style[1] + 'm'
				};
			});

			Object.defineProperty(styles, groupName, {
				value: group,
				enumerable: false
			});
		});

		return styles;
	}

	Object.defineProperty(module, 'exports', {
		enumerable: true,
		get: assembleStyles
	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(168)(module)))

/***/ },
/* 123 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ansiRegex = __webpack_require__(177)();

	module.exports = function (str) {
		return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
	};


/***/ },
/* 124 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ansiRegex = __webpack_require__(178);
	var re = new RegExp(ansiRegex().source); // remove the `g` flag
	module.exports = re.test.bind(re);


/***/ },
/* 125 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	var argv = process.argv;

	var terminator = argv.indexOf('--');
	var hasFlag = function (flag) {
		flag = '--' + flag;
		var pos = argv.indexOf(flag);
		return pos !== -1 && (terminator !== -1 ? pos < terminator : true);
	};

	module.exports = (function () {
		if ('FORCE_COLOR' in process.env) {
			return true;
		}

		if (hasFlag('no-color') ||
			hasFlag('no-colors') ||
			hasFlag('color=false')) {
			return false;
		}

		if (hasFlag('color') ||
			hasFlag('colors') ||
			hasFlag('color=true') ||
			hasFlag('color=always')) {
			return true;
		}

		if (process.stdout && !process.stdout.isTTY) {
			return false;
		}

		if (process.platform === 'win32') {
			return true;
		}

		if ('COLORTERM' in process.env) {
			return true;
		}

		if (process.env.TERM === 'dumb') {
			return false;
		}

		if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
			return true;
		}

		return false;
	})();

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ },
/* 126 */
/***/ function(module, exports, __webpack_require__) {

	var arrayMap = __webpack_require__(156),
	    baseCallback = __webpack_require__(101),
	    baseMap = __webpack_require__(157),
	    isArray = __webpack_require__(104);

	/**
	 * Creates an array of values by running each element in `collection` through
	 * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
	 * arguments: (value, index|key, collection).
	 *
	 * If a property name is provided for `iteratee` the created `_.property`
	 * style callback returns the property value of the given element.
	 *
	 * If a value is also provided for `thisArg` the created `_.matchesProperty`
	 * style callback returns `true` for elements that have a matching property
	 * value, else `false`.
	 *
	 * If an object is provided for `iteratee` the created `_.matches` style
	 * callback returns `true` for elements that have the properties of the given
	 * object, else `false`.
	 *
	 * Many lodash methods are guarded to work as iteratees for methods like
	 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
	 *
	 * The guarded methods are:
	 * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`,
	 * `drop`, `dropRight`, `every`, `fill`, `flatten`, `invert`, `max`, `min`,
	 * `parseInt`, `slice`, `sortBy`, `take`, `takeRight`, `template`, `trim`,
	 * `trimLeft`, `trimRight`, `trunc`, `random`, `range`, `sample`, `some`,
	 * `sum`, `uniq`, and `words`
	 *
	 * @static
	 * @memberOf _
	 * @alias collect
	 * @category Collection
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
	 *  per iteration.
	 * @param {*} [thisArg] The `this` binding of `iteratee`.
	 * @returns {Array} Returns the new mapped array.
	 * @example
	 *
	 * function timesThree(n) {
	 *   return n * 3;
	 * }
	 *
	 * _.map([1, 2], timesThree);
	 * // => [3, 6]
	 *
	 * _.map({ 'a': 1, 'b': 2 }, timesThree);
	 * // => [3, 6] (iteration order is not guaranteed)
	 *
	 * var users = [
	 *   { 'user': 'barney' },
	 *   { 'user': 'fred' }
	 * ];
	 *
	 * // using the `_.property` callback shorthand
	 * _.map(users, 'user');
	 * // => ['barney', 'fred']
	 */
	function map(collection, iteratee, thisArg) {
	  var func = isArray(collection) ? arrayMap : baseMap;
	  iteratee = baseCallback(iteratee, thisArg, 3);
	  return func(collection, iteratee);
	}

	module.exports = map;


/***/ },
/* 127 */
/***/ function(module, exports, __webpack_require__) {

	var baseProperty = __webpack_require__(158),
	    basePropertyDeep = __webpack_require__(159),
	    isKey = __webpack_require__(160);

	/**
	 * Creates a function that returns the property value at `path` on a
	 * given object.
	 *
	 * @static
	 * @memberOf _
	 * @category Utility
	 * @param {Array|string} path The path of the property to get.
	 * @returns {Function} Returns the new function.
	 * @example
	 *
	 * var objects = [
	 *   { 'a': { 'b': { 'c': 2 } } },
	 *   { 'a': { 'b': { 'c': 1 } } }
	 * ];
	 *
	 * _.map(objects, _.property('a.b.c'));
	 * // => [2, 1]
	 *
	 * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
	 * // => [1, 2]
	 */
	function property(path) {
	  return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
	}

	module.exports = property;


/***/ },
/* 128 */
/***/ function(module, exports, __webpack_require__) {

	var arrayPush = __webpack_require__(161),
	    isArguments = __webpack_require__(162),
	    isArray = __webpack_require__(104),
	    isArrayLike = __webpack_require__(150),
	    isObjectLike = __webpack_require__(144);

	/**
	 * The base implementation of `_.flatten` with added support for restricting
	 * flattening and specifying the start index.
	 *
	 * @private
	 * @param {Array} array The array to flatten.
	 * @param {boolean} [isDeep] Specify a deep flatten.
	 * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
	 * @param {Array} [result=[]] The initial result value.
	 * @returns {Array} Returns the new flattened array.
	 */
	function baseFlatten(array, isDeep, isStrict, result) {
	  result || (result = []);

	  var index = -1,
	      length = array.length;

	  while (++index < length) {
	    var value = array[index];
	    if (isObjectLike(value) && isArrayLike(value) &&
	        (isStrict || isArray(value) || isArguments(value))) {
	      if (isDeep) {
	        // Recursively flatten arrays (susceptible to call stack limits).
	        baseFlatten(value, isDeep, isStrict, result);
	      } else {
	        arrayPush(result, value);
	      }
	    } else if (!isStrict) {
	      result[result.length] = value;
	    }
	  }
	  return result;
	}

	module.exports = baseFlatten;


/***/ },
/* 129 */
/***/ function(module, exports, __webpack_require__) {

	var toObject = __webpack_require__(154);

	/**
	 * A specialized version of `_.pick` which picks `object` properties specified
	 * by `props`.
	 *
	 * @private
	 * @param {Object} object The source object.
	 * @param {string[]} props The property names to pick.
	 * @returns {Object} Returns the new object.
	 */
	function pickByArray(object, props) {
	  object = toObject(object);

	  var index = -1,
	      length = props.length,
	      result = {};

	  while (++index < length) {
	    var key = props[index];
	    if (key in object) {
	      result[key] = object[key];
	    }
	  }
	  return result;
	}

	module.exports = pickByArray;


/***/ },
/* 130 */
/***/ function(module, exports, __webpack_require__) {

	var baseForIn = __webpack_require__(163);

	/**
	 * A specialized version of `_.pick` which picks `object` properties `predicate`
	 * returns truthy for.
	 *
	 * @private
	 * @param {Object} object The source object.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {Object} Returns the new object.
	 */
	function pickByCallback(object, predicate) {
	  var result = {};
	  baseForIn(object, function(value, key, object) {
	    if (predicate(value, key, object)) {
	      result[key] = value;
	    }
	  });
	  return result;
	}

	module.exports = pickByCallback;


/***/ },
/* 131 */
/***/ function(module, exports, __webpack_require__) {

	var baseMerge = __webpack_require__(164),
	    createAssigner = __webpack_require__(61);

	/**
	 * Recursively merges own enumerable properties of the source object(s), that
	 * don't resolve to `undefined` into the destination object. Subsequent sources
	 * overwrite property assignments of previous sources. If `customizer` is
	 * provided it's invoked to produce the merged values of the destination and
	 * source properties. If `customizer` returns `undefined` merging is handled
	 * by the method instead. The `customizer` is bound to `thisArg` and invoked
	 * with five arguments: (objectValue, sourceValue, key, object, source).
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} [sources] The source objects.
	 * @param {Function} [customizer] The function to customize assigned values.
	 * @param {*} [thisArg] The `this` binding of `customizer`.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * var users = {
	 *   'data': [{ 'user': 'barney' }, { 'user': 'fred' }]
	 * };
	 *
	 * var ages = {
	 *   'data': [{ 'age': 36 }, { 'age': 40 }]
	 * };
	 *
	 * _.merge(users, ages);
	 * // => { 'data': [{ 'user': 'barney', 'age': 36 }, { 'user': 'fred', 'age': 40 }] }
	 *
	 * // using a customizer callback
	 * var object = {
	 *   'fruits': ['apple'],
	 *   'vegetables': ['beet']
	 * };
	 *
	 * var other = {
	 *   'fruits': ['banana'],
	 *   'vegetables': ['carrot']
	 * };
	 *
	 * _.merge(object, other, function(a, b) {
	 *   if (_.isArray(a)) {
	 *     return a.concat(b);
	 *   }
	 * });
	 * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }
	 */
	var merge = createAssigner(baseMerge);

	module.exports = merge;


/***/ },
/* 132 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	module.exports = Stream;

	var EE = __webpack_require__(41).EventEmitter;
	var inherits = __webpack_require__(46);

	inherits(Stream, EE);
	Stream.Readable = __webpack_require__(98);
	Stream.Writable = __webpack_require__(169);
	Stream.Duplex = __webpack_require__(170);
	Stream.Transform = __webpack_require__(171);
	Stream.PassThrough = __webpack_require__(172);

	// Backwards-compat with node 0.4.x
	Stream.Stream = Stream;



	// old-style streams.  Note that the pipe method (the only relevant
	// part of this class) is overridden in the Readable class.

	function Stream() {
	  EE.call(this);
	}

	Stream.prototype.pipe = function(dest, options) {
	  var source = this;

	  function ondata(chunk) {
	    if (dest.writable) {
	      if (false === dest.write(chunk) && source.pause) {
	        source.pause();
	      }
	    }
	  }

	  source.on('data', ondata);

	  function ondrain() {
	    if (source.readable && source.resume) {
	      source.resume();
	    }
	  }

	  dest.on('drain', ondrain);

	  // If the 'end' option is not supplied, dest.end() will be called when
	  // source gets the 'end' or 'close' events.  Only dest.end() once.
	  if (!dest._isStdio && (!options || options.end !== false)) {
	    source.on('end', onend);
	    source.on('close', onclose);
	  }

	  var didOnEnd = false;
	  function onend() {
	    if (didOnEnd) return;
	    didOnEnd = true;

	    dest.end();
	  }


	  function onclose() {
	    if (didOnEnd) return;
	    didOnEnd = true;

	    if (typeof dest.destroy === 'function') dest.destroy();
	  }

	  // don't leave dangling pipes when there are errors.
	  function onerror(er) {
	    cleanup();
	    if (EE.listenerCount(this, 'error') === 0) {
	      throw er; // Unhandled stream error in pipe.
	    }
	  }

	  source.on('error', onerror);
	  dest.on('error', onerror);

	  // remove all the event listeners that were added.
	  function cleanup() {
	    source.removeListener('data', ondata);
	    dest.removeListener('drain', ondrain);

	    source.removeListener('end', onend);
	    source.removeListener('close', onclose);

	    source.removeListener('error', onerror);
	    dest.removeListener('error', onerror);

	    source.removeListener('end', cleanup);
	    source.removeListener('close', cleanup);

	    dest.removeListener('close', cleanup);
	  }

	  source.on('end', cleanup);
	  source.on('close', cleanup);

	  dest.on('close', cleanup);

	  dest.emit('pipe', source);

	  // Allow for unix-like usage: A.pipe(B).pipe(C)
	  return dest;
	};


/***/ },
/* 133 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var rng = __webpack_require__(173)

	function error () {
	  var m = [].slice.call(arguments).join(' ')
	  throw new Error([
	    m,
	    'we accept pull requests',
	    'http://github.com/dominictarr/crypto-browserify'
	    ].join('\n'))
	}

	exports.createHash = __webpack_require__(174)

	exports.createHmac = __webpack_require__(175)

	exports.randomBytes = function(size, callback) {
	  if (callback && callback.call) {
	    try {
	      callback.call(this, undefined, new Buffer(rng(size)))
	    } catch (err) { callback(err) }
	  } else {
	    return new Buffer(rng(size))
	  }
	}

	function each(a, f) {
	  for(var i in a)
	    f(a[i], i)
	}

	exports.getHashes = function () {
	  return ['sha1', 'sha256', 'sha512', 'md5', 'rmd160']
	}

	var p = __webpack_require__(176)(exports)
	exports.pbkdf2 = p.pbkdf2
	exports.pbkdf2Sync = p.pbkdf2Sync


	// the least I can do is make error messages for the rest of the node.js/crypto api.
	each(['createCredentials'
	, 'createCipher'
	, 'createCipheriv'
	, 'createDecipher'
	, 'createDecipheriv'
	, 'createSign'
	, 'createVerify'
	, 'createDiffieHellman'
	], function (name) {
	  exports[name] = function () {
	    error('sorry,', name, 'is not implemented yet')
	  }
	})

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(97).Buffer))

/***/ },
/* 134 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	module.exports = Readable;

	/*<replacement>*/
	var isArray = __webpack_require__(191);
	/*</replacement>*/


	/*<replacement>*/
	var Buffer = __webpack_require__(97).Buffer;
	/*</replacement>*/

	Readable.ReadableState = ReadableState;

	var EE = __webpack_require__(41).EventEmitter;

	/*<replacement>*/
	if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
	  return emitter.listeners(type).length;
	};
	/*</replacement>*/

	var Stream = __webpack_require__(132);

	/*<replacement>*/
	var util = __webpack_require__(195);
	util.inherits = __webpack_require__(46);
	/*</replacement>*/

	var StringDecoder;


	/*<replacement>*/
	var debug = __webpack_require__(166);
	if (debug && debug.debuglog) {
	  debug = debug.debuglog('stream');
	} else {
	  debug = function () {};
	}
	/*</replacement>*/


	util.inherits(Readable, Stream);

	function ReadableState(options, stream) {
	  var Duplex = __webpack_require__(136);

	  options = options || {};

	  // the point at which it stops calling _read() to fill the buffer
	  // Note: 0 is a valid value, means "don't call _read preemptively ever"
	  var hwm = options.highWaterMark;
	  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

	  // cast to ints.
	  this.highWaterMark = ~~this.highWaterMark;

	  this.buffer = [];
	  this.length = 0;
	  this.pipes = null;
	  this.pipesCount = 0;
	  this.flowing = null;
	  this.ended = false;
	  this.endEmitted = false;
	  this.reading = false;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // whenever we return null, then we set a flag to say
	  // that we're awaiting a 'readable' event emission.
	  this.needReadable = false;
	  this.emittedReadable = false;
	  this.readableListening = false;


	  // object stream flag. Used to make read(n) ignore n and to
	  // make all the buffer merging and length checks go away
	  this.objectMode = !!options.objectMode;

	  if (stream instanceof Duplex)
	    this.objectMode = this.objectMode || !!options.readableObjectMode;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // when piping, we only care about 'readable' events that happen
	  // after read()ing all the bytes and not getting any pushback.
	  this.ranOut = false;

	  // the number of writers that are awaiting a drain event in .pipe()s
	  this.awaitDrain = 0;

	  // if true, a maybeReadMore has been scheduled
	  this.readingMore = false;

	  this.decoder = null;
	  this.encoding = null;
	  if (options.encoding) {
	    if (!StringDecoder)
	      StringDecoder = __webpack_require__(192).StringDecoder;
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}

	function Readable(options) {
	  var Duplex = __webpack_require__(136);

	  if (!(this instanceof Readable))
	    return new Readable(options);

	  this._readableState = new ReadableState(options, this);

	  // legacy
	  this.readable = true;

	  Stream.call(this);
	}

	// Manually shove something into the read() buffer.
	// This returns true if the highWaterMark has not been hit yet,
	// similar to how Writable.write() returns true if you should
	// write() some more.
	Readable.prototype.push = function(chunk, encoding) {
	  var state = this._readableState;

	  if (util.isString(chunk) && !state.objectMode) {
	    encoding = encoding || state.defaultEncoding;
	    if (encoding !== state.encoding) {
	      chunk = new Buffer(chunk, encoding);
	      encoding = '';
	    }
	  }

	  return readableAddChunk(this, state, chunk, encoding, false);
	};

	// Unshift should *always* be something directly out of read()
	Readable.prototype.unshift = function(chunk) {
	  var state = this._readableState;
	  return readableAddChunk(this, state, chunk, '', true);
	};

	function readableAddChunk(stream, state, chunk, encoding, addToFront) {
	  var er = chunkInvalid(state, chunk);
	  if (er) {
	    stream.emit('error', er);
	  } else if (util.isNullOrUndefined(chunk)) {
	    state.reading = false;
	    if (!state.ended)
	      onEofChunk(stream, state);
	  } else if (state.objectMode || chunk && chunk.length > 0) {
	    if (state.ended && !addToFront) {
	      var e = new Error('stream.push() after EOF');
	      stream.emit('error', e);
	    } else if (state.endEmitted && addToFront) {
	      var e = new Error('stream.unshift() after end event');
	      stream.emit('error', e);
	    } else {
	      if (state.decoder && !addToFront && !encoding)
	        chunk = state.decoder.write(chunk);

	      if (!addToFront)
	        state.reading = false;

	      // if we want the data now, just emit it.
	      if (state.flowing && state.length === 0 && !state.sync) {
	        stream.emit('data', chunk);
	        stream.read(0);
	      } else {
	        // update the buffer info.
	        state.length += state.objectMode ? 1 : chunk.length;
	        if (addToFront)
	          state.buffer.unshift(chunk);
	        else
	          state.buffer.push(chunk);

	        if (state.needReadable)
	          emitReadable(stream);
	      }

	      maybeReadMore(stream, state);
	    }
	  } else if (!addToFront) {
	    state.reading = false;
	  }

	  return needMoreData(state);
	}



	// if it's past the high water mark, we can push in some more.
	// Also, if we have no data yet, we can stand some
	// more bytes.  This is to work around cases where hwm=0,
	// such as the repl.  Also, if the push() triggered a
	// readable event, and the user called read(largeNumber) such that
	// needReadable was set, then we ought to push more, so that another
	// 'readable' event will be triggered.
	function needMoreData(state) {
	  return !state.ended &&
	         (state.needReadable ||
	          state.length < state.highWaterMark ||
	          state.length === 0);
	}

	// backwards compatibility.
	Readable.prototype.setEncoding = function(enc) {
	  if (!StringDecoder)
	    StringDecoder = __webpack_require__(192).StringDecoder;
	  this._readableState.decoder = new StringDecoder(enc);
	  this._readableState.encoding = enc;
	  return this;
	};

	// Don't raise the hwm > 128MB
	var MAX_HWM = 0x800000;
	function roundUpToNextPowerOf2(n) {
	  if (n >= MAX_HWM) {
	    n = MAX_HWM;
	  } else {
	    // Get the next highest power of 2
	    n--;
	    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
	    n++;
	  }
	  return n;
	}

	function howMuchToRead(n, state) {
	  if (state.length === 0 && state.ended)
	    return 0;

	  if (state.objectMode)
	    return n === 0 ? 0 : 1;

	  if (isNaN(n) || util.isNull(n)) {
	    // only flow one buffer at a time
	    if (state.flowing && state.buffer.length)
	      return state.buffer[0].length;
	    else
	      return state.length;
	  }

	  if (n <= 0)
	    return 0;

	  // If we're asking for more than the target buffer level,
	  // then raise the water mark.  Bump up to the next highest
	  // power of 2, to prevent increasing it excessively in tiny
	  // amounts.
	  if (n > state.highWaterMark)
	    state.highWaterMark = roundUpToNextPowerOf2(n);

	  // don't have that much.  return null, unless we've ended.
	  if (n > state.length) {
	    if (!state.ended) {
	      state.needReadable = true;
	      return 0;
	    } else
	      return state.length;
	  }

	  return n;
	}

	// you can override either this method, or the async _read(n) below.
	Readable.prototype.read = function(n) {
	  debug('read', n);
	  var state = this._readableState;
	  var nOrig = n;

	  if (!util.isNumber(n) || n > 0)
	    state.emittedReadable = false;

	  // if we're doing read(0) to trigger a readable event, but we
	  // already have a bunch of data in the buffer, then just trigger
	  // the 'readable' event and move on.
	  if (n === 0 &&
	      state.needReadable &&
	      (state.length >= state.highWaterMark || state.ended)) {
	    debug('read: emitReadable', state.length, state.ended);
	    if (state.length === 0 && state.ended)
	      endReadable(this);
	    else
	      emitReadable(this);
	    return null;
	  }

	  n = howMuchToRead(n, state);

	  // if we've ended, and we're now clear, then finish it up.
	  if (n === 0 && state.ended) {
	    if (state.length === 0)
	      endReadable(this);
	    return null;
	  }

	  // All the actual chunk generation logic needs to be
	  // *below* the call to _read.  The reason is that in certain
	  // synthetic stream cases, such as passthrough streams, _read
	  // may be a completely synchronous operation which may change
	  // the state of the read buffer, providing enough data when
	  // before there was *not* enough.
	  //
	  // So, the steps are:
	  // 1. Figure out what the state of things will be after we do
	  // a read from the buffer.
	  //
	  // 2. If that resulting state will trigger a _read, then call _read.
	  // Note that this may be asynchronous, or synchronous.  Yes, it is
	  // deeply ugly to write APIs this way, but that still doesn't mean
	  // that the Readable class should behave improperly, as streams are
	  // designed to be sync/async agnostic.
	  // Take note if the _read call is sync or async (ie, if the read call
	  // has returned yet), so that we know whether or not it's safe to emit
	  // 'readable' etc.
	  //
	  // 3. Actually pull the requested chunks out of the buffer and return.

	  // if we need a readable event, then we need to do some reading.
	  var doRead = state.needReadable;
	  debug('need readable', doRead);

	  // if we currently have less than the highWaterMark, then also read some
	  if (state.length === 0 || state.length - n < state.highWaterMark) {
	    doRead = true;
	    debug('length less than watermark', doRead);
	  }

	  // however, if we've ended, then there's no point, and if we're already
	  // reading, then it's unnecessary.
	  if (state.ended || state.reading) {
	    doRead = false;
	    debug('reading or ended', doRead);
	  }

	  if (doRead) {
	    debug('do read');
	    state.reading = true;
	    state.sync = true;
	    // if the length is currently zero, then we *need* a readable event.
	    if (state.length === 0)
	      state.needReadable = true;
	    // call internal read method
	    this._read(state.highWaterMark);
	    state.sync = false;
	  }

	  // If _read pushed data synchronously, then `reading` will be false,
	  // and we need to re-evaluate how much data we can return to the user.
	  if (doRead && !state.reading)
	    n = howMuchToRead(nOrig, state);

	  var ret;
	  if (n > 0)
	    ret = fromList(n, state);
	  else
	    ret = null;

	  if (util.isNull(ret)) {
	    state.needReadable = true;
	    n = 0;
	  }

	  state.length -= n;

	  // If we have nothing in the buffer, then we want to know
	  // as soon as we *do* get something into the buffer.
	  if (state.length === 0 && !state.ended)
	    state.needReadable = true;

	  // If we tried to read() past the EOF, then emit end on the next tick.
	  if (nOrig !== n && state.ended && state.length === 0)
	    endReadable(this);

	  if (!util.isNull(ret))
	    this.emit('data', ret);

	  return ret;
	};

	function chunkInvalid(state, chunk) {
	  var er = null;
	  if (!util.isBuffer(chunk) &&
	      !util.isString(chunk) &&
	      !util.isNullOrUndefined(chunk) &&
	      !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  return er;
	}


	function onEofChunk(stream, state) {
	  if (state.decoder && !state.ended) {
	    var chunk = state.decoder.end();
	    if (chunk && chunk.length) {
	      state.buffer.push(chunk);
	      state.length += state.objectMode ? 1 : chunk.length;
	    }
	  }
	  state.ended = true;

	  // emit 'readable' now to make sure it gets picked up.
	  emitReadable(stream);
	}

	// Don't emit readable right away in sync mode, because this can trigger
	// another read() call => stack overflow.  This way, it might trigger
	// a nextTick recursion warning, but that's not so bad.
	function emitReadable(stream) {
	  var state = stream._readableState;
	  state.needReadable = false;
	  if (!state.emittedReadable) {
	    debug('emitReadable', state.flowing);
	    state.emittedReadable = true;
	    if (state.sync)
	      process.nextTick(function() {
	        emitReadable_(stream);
	      });
	    else
	      emitReadable_(stream);
	  }
	}

	function emitReadable_(stream) {
	  debug('emit readable');
	  stream.emit('readable');
	  flow(stream);
	}


	// at this point, the user has presumably seen the 'readable' event,
	// and called read() to consume some data.  that may have triggered
	// in turn another _read(n) call, in which case reading = true if
	// it's in progress.
	// However, if we're not ended, or reading, and the length < hwm,
	// then go ahead and try to read some more preemptively.
	function maybeReadMore(stream, state) {
	  if (!state.readingMore) {
	    state.readingMore = true;
	    process.nextTick(function() {
	      maybeReadMore_(stream, state);
	    });
	  }
	}

	function maybeReadMore_(stream, state) {
	  var len = state.length;
	  while (!state.reading && !state.flowing && !state.ended &&
	         state.length < state.highWaterMark) {
	    debug('maybeReadMore read 0');
	    stream.read(0);
	    if (len === state.length)
	      // didn't get any data, stop spinning.
	      break;
	    else
	      len = state.length;
	  }
	  state.readingMore = false;
	}

	// abstract method.  to be overridden in specific implementation classes.
	// call cb(er, data) where data is <= n in length.
	// for virtual (non-string, non-buffer) streams, "length" is somewhat
	// arbitrary, and perhaps not very meaningful.
	Readable.prototype._read = function(n) {
	  this.emit('error', new Error('not implemented'));
	};

	Readable.prototype.pipe = function(dest, pipeOpts) {
	  var src = this;
	  var state = this._readableState;

	  switch (state.pipesCount) {
	    case 0:
	      state.pipes = dest;
	      break;
	    case 1:
	      state.pipes = [state.pipes, dest];
	      break;
	    default:
	      state.pipes.push(dest);
	      break;
	  }
	  state.pipesCount += 1;
	  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

	  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
	              dest !== process.stdout &&
	              dest !== process.stderr;

	  var endFn = doEnd ? onend : cleanup;
	  if (state.endEmitted)
	    process.nextTick(endFn);
	  else
	    src.once('end', endFn);

	  dest.on('unpipe', onunpipe);
	  function onunpipe(readable) {
	    debug('onunpipe');
	    if (readable === src) {
	      cleanup();
	    }
	  }

	  function onend() {
	    debug('onend');
	    dest.end();
	  }

	  // when the dest drains, it reduces the awaitDrain counter
	  // on the source.  This would be more elegant with a .once()
	  // handler in flow(), but adding and removing repeatedly is
	  // too slow.
	  var ondrain = pipeOnDrain(src);
	  dest.on('drain', ondrain);

	  function cleanup() {
	    debug('cleanup');
	    // cleanup event handlers once the pipe is broken
	    dest.removeListener('close', onclose);
	    dest.removeListener('finish', onfinish);
	    dest.removeListener('drain', ondrain);
	    dest.removeListener('error', onerror);
	    dest.removeListener('unpipe', onunpipe);
	    src.removeListener('end', onend);
	    src.removeListener('end', cleanup);
	    src.removeListener('data', ondata);

	    // if the reader is waiting for a drain event from this
	    // specific writer, then it would cause it to never start
	    // flowing again.
	    // So, if this is awaiting a drain, then we just call it now.
	    // If we don't know, then assume that we are waiting for one.
	    if (state.awaitDrain &&
	        (!dest._writableState || dest._writableState.needDrain))
	      ondrain();
	  }

	  src.on('data', ondata);
	  function ondata(chunk) {
	    debug('ondata');
	    var ret = dest.write(chunk);
	    if (false === ret) {
	      debug('false write response, pause',
	            src._readableState.awaitDrain);
	      src._readableState.awaitDrain++;
	      src.pause();
	    }
	  }

	  // if the dest has an error, then stop piping into it.
	  // however, don't suppress the throwing behavior for this.
	  function onerror(er) {
	    debug('onerror', er);
	    unpipe();
	    dest.removeListener('error', onerror);
	    if (EE.listenerCount(dest, 'error') === 0)
	      dest.emit('error', er);
	  }
	  // This is a brutally ugly hack to make sure that our error handler
	  // is attached before any userland ones.  NEVER DO THIS.
	  if (!dest._events || !dest._events.error)
	    dest.on('error', onerror);
	  else if (isArray(dest._events.error))
	    dest._events.error.unshift(onerror);
	  else
	    dest._events.error = [onerror, dest._events.error];



	  // Both close and finish should trigger unpipe, but only once.
	  function onclose() {
	    dest.removeListener('finish', onfinish);
	    unpipe();
	  }
	  dest.once('close', onclose);
	  function onfinish() {
	    debug('onfinish');
	    dest.removeListener('close', onclose);
	    unpipe();
	  }
	  dest.once('finish', onfinish);

	  function unpipe() {
	    debug('unpipe');
	    src.unpipe(dest);
	  }

	  // tell the dest that it's being piped to
	  dest.emit('pipe', src);

	  // start the flow if it hasn't been started already.
	  if (!state.flowing) {
	    debug('pipe resume');
	    src.resume();
	  }

	  return dest;
	};

	function pipeOnDrain(src) {
	  return function() {
	    var state = src._readableState;
	    debug('pipeOnDrain', state.awaitDrain);
	    if (state.awaitDrain)
	      state.awaitDrain--;
	    if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
	      state.flowing = true;
	      flow(src);
	    }
	  };
	}


	Readable.prototype.unpipe = function(dest) {
	  var state = this._readableState;

	  // if we're not piping anywhere, then do nothing.
	  if (state.pipesCount === 0)
	    return this;

	  // just one destination.  most common case.
	  if (state.pipesCount === 1) {
	    // passed in one, but it's not the right one.
	    if (dest && dest !== state.pipes)
	      return this;

	    if (!dest)
	      dest = state.pipes;

	    // got a match.
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;
	    if (dest)
	      dest.emit('unpipe', this);
	    return this;
	  }

	  // slow case. multiple pipe destinations.

	  if (!dest) {
	    // remove all.
	    var dests = state.pipes;
	    var len = state.pipesCount;
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;

	    for (var i = 0; i < len; i++)
	      dests[i].emit('unpipe', this);
	    return this;
	  }

	  // try to find the right one.
	  var i = indexOf(state.pipes, dest);
	  if (i === -1)
	    return this;

	  state.pipes.splice(i, 1);
	  state.pipesCount -= 1;
	  if (state.pipesCount === 1)
	    state.pipes = state.pipes[0];

	  dest.emit('unpipe', this);

	  return this;
	};

	// set up data events if they are asked for
	// Ensure readable listeners eventually get something
	Readable.prototype.on = function(ev, fn) {
	  var res = Stream.prototype.on.call(this, ev, fn);

	  // If listening to data, and it has not explicitly been paused,
	  // then call resume to start the flow of data on the next tick.
	  if (ev === 'data' && false !== this._readableState.flowing) {
	    this.resume();
	  }

	  if (ev === 'readable' && this.readable) {
	    var state = this._readableState;
	    if (!state.readableListening) {
	      state.readableListening = true;
	      state.emittedReadable = false;
	      state.needReadable = true;
	      if (!state.reading) {
	        var self = this;
	        process.nextTick(function() {
	          debug('readable nexttick read 0');
	          self.read(0);
	        });
	      } else if (state.length) {
	        emitReadable(this, state);
	      }
	    }
	  }

	  return res;
	};
	Readable.prototype.addListener = Readable.prototype.on;

	// pause() and resume() are remnants of the legacy readable stream API
	// If the user uses them, then switch into old mode.
	Readable.prototype.resume = function() {
	  var state = this._readableState;
	  if (!state.flowing) {
	    debug('resume');
	    state.flowing = true;
	    if (!state.reading) {
	      debug('resume read 0');
	      this.read(0);
	    }
	    resume(this, state);
	  }
	  return this;
	};

	function resume(stream, state) {
	  if (!state.resumeScheduled) {
	    state.resumeScheduled = true;
	    process.nextTick(function() {
	      resume_(stream, state);
	    });
	  }
	}

	function resume_(stream, state) {
	  state.resumeScheduled = false;
	  stream.emit('resume');
	  flow(stream);
	  if (state.flowing && !state.reading)
	    stream.read(0);
	}

	Readable.prototype.pause = function() {
	  debug('call pause flowing=%j', this._readableState.flowing);
	  if (false !== this._readableState.flowing) {
	    debug('pause');
	    this._readableState.flowing = false;
	    this.emit('pause');
	  }
	  return this;
	};

	function flow(stream) {
	  var state = stream._readableState;
	  debug('flow', state.flowing);
	  if (state.flowing) {
	    do {
	      var chunk = stream.read();
	    } while (null !== chunk && state.flowing);
	  }
	}

	// wrap an old-style stream as the async data source.
	// This is *not* part of the readable stream interface.
	// It is an ugly unfortunate mess of history.
	Readable.prototype.wrap = function(stream) {
	  var state = this._readableState;
	  var paused = false;

	  var self = this;
	  stream.on('end', function() {
	    debug('wrapped end');
	    if (state.decoder && !state.ended) {
	      var chunk = state.decoder.end();
	      if (chunk && chunk.length)
	        self.push(chunk);
	    }

	    self.push(null);
	  });

	  stream.on('data', function(chunk) {
	    debug('wrapped data');
	    if (state.decoder)
	      chunk = state.decoder.write(chunk);
	    if (!chunk || !state.objectMode && !chunk.length)
	      return;

	    var ret = self.push(chunk);
	    if (!ret) {
	      paused = true;
	      stream.pause();
	    }
	  });

	  // proxy all the other methods.
	  // important when wrapping filters and duplexes.
	  for (var i in stream) {
	    if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
	      this[i] = function(method) { return function() {
	        return stream[method].apply(stream, arguments);
	      }}(i);
	    }
	  }

	  // proxy certain important events.
	  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
	  forEach(events, function(ev) {
	    stream.on(ev, self.emit.bind(self, ev));
	  });

	  // when we try to consume some more bytes, simply unpause the
	  // underlying stream.
	  self._read = function(n) {
	    debug('wrapped _read', n);
	    if (paused) {
	      paused = false;
	      stream.resume();
	    }
	  };

	  return self;
	};



	// exposed for testing purposes only.
	Readable._fromList = fromList;

	// Pluck off n bytes from an array of buffers.
	// Length is the combined lengths of all the buffers in the list.
	function fromList(n, state) {
	  var list = state.buffer;
	  var length = state.length;
	  var stringMode = !!state.decoder;
	  var objectMode = !!state.objectMode;
	  var ret;

	  // nothing in the list, definitely empty.
	  if (list.length === 0)
	    return null;

	  if (length === 0)
	    ret = null;
	  else if (objectMode)
	    ret = list.shift();
	  else if (!n || n >= length) {
	    // read it all, truncate the array.
	    if (stringMode)
	      ret = list.join('');
	    else
	      ret = Buffer.concat(list, length);
	    list.length = 0;
	  } else {
	    // read just some of it.
	    if (n < list[0].length) {
	      // just take a part of the first list item.
	      // slice is the same for buffers and strings.
	      var buf = list[0];
	      ret = buf.slice(0, n);
	      list[0] = buf.slice(n);
	    } else if (n === list[0].length) {
	      // first list is a perfect match
	      ret = list.shift();
	    } else {
	      // complex case.
	      // we have enough to cover it, but it spans past the first buffer.
	      if (stringMode)
	        ret = '';
	      else
	        ret = new Buffer(n);

	      var c = 0;
	      for (var i = 0, l = list.length; i < l && c < n; i++) {
	        var buf = list[0];
	        var cpy = Math.min(n - c, buf.length);

	        if (stringMode)
	          ret += buf.slice(0, cpy);
	        else
	          buf.copy(ret, c, 0, cpy);

	        if (cpy < buf.length)
	          list[0] = buf.slice(cpy);
	        else
	          list.shift();

	        c += cpy;
	      }
	    }
	  }

	  return ret;
	}

	function endReadable(stream) {
	  var state = stream._readableState;

	  // If we get here before consuming all the bytes, then that is a
	  // bug in node.  Should never happen.
	  if (state.length > 0)
	    throw new Error('endReadable called on non-empty stream');

	  if (!state.endEmitted) {
	    state.ended = true;
	    process.nextTick(function() {
	      // Check that we didn't get one last unshift.
	      if (!state.endEmitted && state.length === 0) {
	        state.endEmitted = true;
	        stream.readable = false;
	        stream.emit('end');
	      }
	    });
	  }
	}

	function forEach (xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}

	function indexOf (xs, x) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    if (xs[i] === x) return i;
	  }
	  return -1;
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ },
/* 135 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// A bit simpler than readable streams.
	// Implement an async ._write(chunk, cb), and it'll handle all
	// the drain event emission and buffering.

	module.exports = Writable;

	/*<replacement>*/
	var Buffer = __webpack_require__(97).Buffer;
	/*</replacement>*/

	Writable.WritableState = WritableState;


	/*<replacement>*/
	var util = __webpack_require__(195);
	util.inherits = __webpack_require__(46);
	/*</replacement>*/

	var Stream = __webpack_require__(132);

	util.inherits(Writable, Stream);

	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	}

	function WritableState(options, stream) {
	  var Duplex = __webpack_require__(136);

	  options = options || {};

	  // the point at which write() starts returning false
	  // Note: 0 is a valid value, means that we always return false if
	  // the entire buffer is not flushed immediately on write()
	  var hwm = options.highWaterMark;
	  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

	  // object stream flag to indicate whether or not this stream
	  // contains buffers or objects.
	  this.objectMode = !!options.objectMode;

	  if (stream instanceof Duplex)
	    this.objectMode = this.objectMode || !!options.writableObjectMode;

	  // cast to ints.
	  this.highWaterMark = ~~this.highWaterMark;

	  this.needDrain = false;
	  // at the start of calling end()
	  this.ending = false;
	  // when end() has been called, and returned
	  this.ended = false;
	  // when 'finish' is emitted
	  this.finished = false;

	  // should we decode strings into buffers before passing to _write?
	  // this is here so that some node-core streams can optimize string
	  // handling at a lower level.
	  var noDecode = options.decodeStrings === false;
	  this.decodeStrings = !noDecode;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // not an actual buffer we keep track of, but a measurement
	  // of how much we're waiting to get pushed to some underlying
	  // socket or file.
	  this.length = 0;

	  // a flag to see when we're in the middle of a write.
	  this.writing = false;

	  // when true all writes will be buffered until .uncork() call
	  this.corked = 0;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // a flag to know if we're processing previously buffered items, which
	  // may call the _write() callback in the same tick, so that we don't
	  // end up in an overlapped onwrite situation.
	  this.bufferProcessing = false;

	  // the callback that's passed to _write(chunk,cb)
	  this.onwrite = function(er) {
	    onwrite(stream, er);
	  };

	  // the callback that the user supplies to write(chunk,encoding,cb)
	  this.writecb = null;

	  // the amount that is being written when _write is called.
	  this.writelen = 0;

	  this.buffer = [];

	  // number of pending user-supplied write callbacks
	  // this must be 0 before 'finish' can be emitted
	  this.pendingcb = 0;

	  // emit prefinish if the only thing we're waiting for is _write cbs
	  // This is relevant for synchronous Transform streams
	  this.prefinished = false;

	  // True if the error was already emitted and should not be thrown again
	  this.errorEmitted = false;
	}

	function Writable(options) {
	  var Duplex = __webpack_require__(136);

	  // Writable ctor is applied to Duplexes, though they're not
	  // instanceof Writable, they're instanceof Readable.
	  if (!(this instanceof Writable) && !(this instanceof Duplex))
	    return new Writable(options);

	  this._writableState = new WritableState(options, this);

	  // legacy.
	  this.writable = true;

	  Stream.call(this);
	}

	// Otherwise people can pipe Writable streams, which is just wrong.
	Writable.prototype.pipe = function() {
	  this.emit('error', new Error('Cannot pipe. Not readable.'));
	};


	function writeAfterEnd(stream, state, cb) {
	  var er = new Error('write after end');
	  // TODO: defer error events consistently everywhere, not just the cb
	  stream.emit('error', er);
	  process.nextTick(function() {
	    cb(er);
	  });
	}

	// If we get something that is not a buffer, string, null, or undefined,
	// and we're not in objectMode, then that's an error.
	// Otherwise stream chunks are all considered to be of length=1, and the
	// watermarks determine how many objects to keep in the buffer, rather than
	// how many bytes or characters.
	function validChunk(stream, state, chunk, cb) {
	  var valid = true;
	  if (!util.isBuffer(chunk) &&
	      !util.isString(chunk) &&
	      !util.isNullOrUndefined(chunk) &&
	      !state.objectMode) {
	    var er = new TypeError('Invalid non-string/buffer chunk');
	    stream.emit('error', er);
	    process.nextTick(function() {
	      cb(er);
	    });
	    valid = false;
	  }
	  return valid;
	}

	Writable.prototype.write = function(chunk, encoding, cb) {
	  var state = this._writableState;
	  var ret = false;

	  if (util.isFunction(encoding)) {
	    cb = encoding;
	    encoding = null;
	  }

	  if (util.isBuffer(chunk))
	    encoding = 'buffer';
	  else if (!encoding)
	    encoding = state.defaultEncoding;

	  if (!util.isFunction(cb))
	    cb = function() {};

	  if (state.ended)
	    writeAfterEnd(this, state, cb);
	  else if (validChunk(this, state, chunk, cb)) {
	    state.pendingcb++;
	    ret = writeOrBuffer(this, state, chunk, encoding, cb);
	  }

	  return ret;
	};

	Writable.prototype.cork = function() {
	  var state = this._writableState;

	  state.corked++;
	};

	Writable.prototype.uncork = function() {
	  var state = this._writableState;

	  if (state.corked) {
	    state.corked--;

	    if (!state.writing &&
	        !state.corked &&
	        !state.finished &&
	        !state.bufferProcessing &&
	        state.buffer.length)
	      clearBuffer(this, state);
	  }
	};

	function decodeChunk(state, chunk, encoding) {
	  if (!state.objectMode &&
	      state.decodeStrings !== false &&
	      util.isString(chunk)) {
	    chunk = new Buffer(chunk, encoding);
	  }
	  return chunk;
	}

	// if we're already writing something, then just put this
	// in the queue, and wait our turn.  Otherwise, call _write
	// If we return false, then we need a drain event, so set that flag.
	function writeOrBuffer(stream, state, chunk, encoding, cb) {
	  chunk = decodeChunk(state, chunk, encoding);
	  if (util.isBuffer(chunk))
	    encoding = 'buffer';
	  var len = state.objectMode ? 1 : chunk.length;

	  state.length += len;

	  var ret = state.length < state.highWaterMark;
	  // we must ensure that previous needDrain will not be reset to false.
	  if (!ret)
	    state.needDrain = true;

	  if (state.writing || state.corked)
	    state.buffer.push(new WriteReq(chunk, encoding, cb));
	  else
	    doWrite(stream, state, false, len, chunk, encoding, cb);

	  return ret;
	}

	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
	  state.writelen = len;
	  state.writecb = cb;
	  state.writing = true;
	  state.sync = true;
	  if (writev)
	    stream._writev(chunk, state.onwrite);
	  else
	    stream._write(chunk, encoding, state.onwrite);
	  state.sync = false;
	}

	function onwriteError(stream, state, sync, er, cb) {
	  if (sync)
	    process.nextTick(function() {
	      state.pendingcb--;
	      cb(er);
	    });
	  else {
	    state.pendingcb--;
	    cb(er);
	  }

	  stream._writableState.errorEmitted = true;
	  stream.emit('error', er);
	}

	function onwriteStateUpdate(state) {
	  state.writing = false;
	  state.writecb = null;
	  state.length -= state.writelen;
	  state.writelen = 0;
	}

	function onwrite(stream, er) {
	  var state = stream._writableState;
	  var sync = state.sync;
	  var cb = state.writecb;

	  onwriteStateUpdate(state);

	  if (er)
	    onwriteError(stream, state, sync, er, cb);
	  else {
	    // Check if we're actually ready to finish, but don't emit yet
	    var finished = needFinish(stream, state);

	    if (!finished &&
	        !state.corked &&
	        !state.bufferProcessing &&
	        state.buffer.length) {
	      clearBuffer(stream, state);
	    }

	    if (sync) {
	      process.nextTick(function() {
	        afterWrite(stream, state, finished, cb);
	      });
	    } else {
	      afterWrite(stream, state, finished, cb);
	    }
	  }
	}

	function afterWrite(stream, state, finished, cb) {
	  if (!finished)
	    onwriteDrain(stream, state);
	  state.pendingcb--;
	  cb();
	  finishMaybe(stream, state);
	}

	// Must force callback to be called on nextTick, so that we don't
	// emit 'drain' before the write() consumer gets the 'false' return
	// value, and has a chance to attach a 'drain' listener.
	function onwriteDrain(stream, state) {
	  if (state.length === 0 && state.needDrain) {
	    state.needDrain = false;
	    stream.emit('drain');
	  }
	}


	// if there's something in the buffer waiting, then process it
	function clearBuffer(stream, state) {
	  state.bufferProcessing = true;

	  if (stream._writev && state.buffer.length > 1) {
	    // Fast case, write everything using _writev()
	    var cbs = [];
	    for (var c = 0; c < state.buffer.length; c++)
	      cbs.push(state.buffer[c].callback);

	    // count the one we are adding, as well.
	    // TODO(isaacs) clean this up
	    state.pendingcb++;
	    doWrite(stream, state, true, state.length, state.buffer, '', function(err) {
	      for (var i = 0; i < cbs.length; i++) {
	        state.pendingcb--;
	        cbs[i](err);
	      }
	    });

	    // Clear buffer
	    state.buffer = [];
	  } else {
	    // Slow case, write chunks one-by-one
	    for (var c = 0; c < state.buffer.length; c++) {
	      var entry = state.buffer[c];
	      var chunk = entry.chunk;
	      var encoding = entry.encoding;
	      var cb = entry.callback;
	      var len = state.objectMode ? 1 : chunk.length;

	      doWrite(stream, state, false, len, chunk, encoding, cb);

	      // if we didn't call the onwrite immediately, then
	      // it means that we need to wait until it does.
	      // also, that means that the chunk and cb are currently
	      // being processed, so move the buffer counter past them.
	      if (state.writing) {
	        c++;
	        break;
	      }
	    }

	    if (c < state.buffer.length)
	      state.buffer = state.buffer.slice(c);
	    else
	      state.buffer.length = 0;
	  }

	  state.bufferProcessing = false;
	}

	Writable.prototype._write = function(chunk, encoding, cb) {
	  cb(new Error('not implemented'));

	};

	Writable.prototype._writev = null;

	Writable.prototype.end = function(chunk, encoding, cb) {
	  var state = this._writableState;

	  if (util.isFunction(chunk)) {
	    cb = chunk;
	    chunk = null;
	    encoding = null;
	  } else if (util.isFunction(encoding)) {
	    cb = encoding;
	    encoding = null;
	  }

	  if (!util.isNullOrUndefined(chunk))
	    this.write(chunk, encoding);

	  // .end() fully uncorks
	  if (state.corked) {
	    state.corked = 1;
	    this.uncork();
	  }

	  // ignore unnecessary end() calls.
	  if (!state.ending && !state.finished)
	    endWritable(this, state, cb);
	};


	function needFinish(stream, state) {
	  return (state.ending &&
	          state.length === 0 &&
	          !state.finished &&
	          !state.writing);
	}

	function prefinish(stream, state) {
	  if (!state.prefinished) {
	    state.prefinished = true;
	    stream.emit('prefinish');
	  }
	}

	function finishMaybe(stream, state) {
	  var need = needFinish(stream, state);
	  if (need) {
	    if (state.pendingcb === 0) {
	      prefinish(stream, state);
	      state.finished = true;
	      stream.emit('finish');
	    } else
	      prefinish(stream, state);
	  }
	  return need;
	}

	function endWritable(stream, state, cb) {
	  state.ending = true;
	  finishMaybe(stream, state);
	  if (cb) {
	    if (state.finished)
	      process.nextTick(cb);
	    else
	      stream.once('finish', cb);
	  }
	  state.ended = true;
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ },
/* 136 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// a duplex stream is just a stream that is both readable and writable.
	// Since JS doesn't have multiple prototypal inheritance, this class
	// prototypally inherits from Readable, and then parasitically from
	// Writable.

	module.exports = Duplex;

	/*<replacement>*/
	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) keys.push(key);
	  return keys;
	}
	/*</replacement>*/


	/*<replacement>*/
	var util = __webpack_require__(195);
	util.inherits = __webpack_require__(46);
	/*</replacement>*/

	var Readable = __webpack_require__(134);
	var Writable = __webpack_require__(135);

	util.inherits(Duplex, Readable);

	forEach(objectKeys(Writable.prototype), function(method) {
	  if (!Duplex.prototype[method])
	    Duplex.prototype[method] = Writable.prototype[method];
	});

	function Duplex(options) {
	  if (!(this instanceof Duplex))
	    return new Duplex(options);

	  Readable.call(this, options);
	  Writable.call(this, options);

	  if (options && options.readable === false)
	    this.readable = false;

	  if (options && options.writable === false)
	    this.writable = false;

	  this.allowHalfOpen = true;
	  if (options && options.allowHalfOpen === false)
	    this.allowHalfOpen = false;

	  this.once('end', onend);
	}

	// the no-half-open enforcer
	function onend() {
	  // if we allow half-open state, or if the writable side ended,
	  // then we're ok.
	  if (this.allowHalfOpen || this._writableState.ended)
	    return;

	  // no more data can be written.
	  // But allow more writes to happen in this tick.
	  process.nextTick(this.end.bind(this));
	}

	function forEach (xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ },
/* 137 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.


	// a transform stream is a readable/writable stream where you do
	// something with the data.  Sometimes it's called a "filter",
	// but that's not a great name for it, since that implies a thing where
	// some bits pass through, and others are simply ignored.  (That would
	// be a valid example of a transform, of course.)
	//
	// While the output is causally related to the input, it's not a
	// necessarily symmetric or synchronous transformation.  For example,
	// a zlib stream might take multiple plain-text writes(), and then
	// emit a single compressed chunk some time in the future.
	//
	// Here's how this works:
	//
	// The Transform stream has all the aspects of the readable and writable
	// stream classes.  When you write(chunk), that calls _write(chunk,cb)
	// internally, and returns false if there's a lot of pending writes
	// buffered up.  When you call read(), that calls _read(n) until
	// there's enough pending readable data buffered up.
	//
	// In a transform stream, the written data is placed in a buffer.  When
	// _read(n) is called, it transforms the queued up data, calling the
	// buffered _write cb's as it consumes chunks.  If consuming a single
	// written chunk would result in multiple output chunks, then the first
	// outputted bit calls the readcb, and subsequent chunks just go into
	// the read buffer, and will cause it to emit 'readable' if necessary.
	//
	// This way, back-pressure is actually determined by the reading side,
	// since _read has to be called to start processing a new chunk.  However,
	// a pathological inflate type of transform can cause excessive buffering
	// here.  For example, imagine a stream where every byte of input is
	// interpreted as an integer from 0-255, and then results in that many
	// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
	// 1kb of data being output.  In this case, you could write a very small
	// amount of input, and end up with a very large amount of output.  In
	// such a pathological inflating mechanism, there'd be no way to tell
	// the system to stop doing the transform.  A single 4MB write could
	// cause the system to run out of memory.
	//
	// However, even in such a pathological case, only a single written chunk
	// would be consumed, and then the rest would wait (un-transformed) until
	// the results of the previous transformed chunk were consumed.

	module.exports = Transform;

	var Duplex = __webpack_require__(136);

	/*<replacement>*/
	var util = __webpack_require__(195);
	util.inherits = __webpack_require__(46);
	/*</replacement>*/

	util.inherits(Transform, Duplex);


	function TransformState(options, stream) {
	  this.afterTransform = function(er, data) {
	    return afterTransform(stream, er, data);
	  };

	  this.needTransform = false;
	  this.transforming = false;
	  this.writecb = null;
	  this.writechunk = null;
	}

	function afterTransform(stream, er, data) {
	  var ts = stream._transformState;
	  ts.transforming = false;

	  var cb = ts.writecb;

	  if (!cb)
	    return stream.emit('error', new Error('no writecb in Transform class'));

	  ts.writechunk = null;
	  ts.writecb = null;

	  if (!util.isNullOrUndefined(data))
	    stream.push(data);

	  if (cb)
	    cb(er);

	  var rs = stream._readableState;
	  rs.reading = false;
	  if (rs.needReadable || rs.length < rs.highWaterMark) {
	    stream._read(rs.highWaterMark);
	  }
	}


	function Transform(options) {
	  if (!(this instanceof Transform))
	    return new Transform(options);

	  Duplex.call(this, options);

	  this._transformState = new TransformState(options, this);

	  // when the writable side finishes, then flush out anything remaining.
	  var stream = this;

	  // start out asking for a readable event once data is transformed.
	  this._readableState.needReadable = true;

	  // we have implemented the _read method, and done the other things
	  // that Readable wants before the first _read call, so unset the
	  // sync guard flag.
	  this._readableState.sync = false;

	  this.once('prefinish', function() {
	    if (util.isFunction(this._flush))
	      this._flush(function(er) {
	        done(stream, er);
	      });
	    else
	      done(stream);
	  });
	}

	Transform.prototype.push = function(chunk, encoding) {
	  this._transformState.needTransform = false;
	  return Duplex.prototype.push.call(this, chunk, encoding);
	};

	// This is the part where you do stuff!
	// override this function in implementation classes.
	// 'chunk' is an input chunk.
	//
	// Call `push(newChunk)` to pass along transformed output
	// to the readable side.  You may call 'push' zero or more times.
	//
	// Call `cb(err)` when you are done with this chunk.  If you pass
	// an error, then that'll put the hurt on the whole operation.  If you
	// never call cb(), then you'll never get another chunk.
	Transform.prototype._transform = function(chunk, encoding, cb) {
	  throw new Error('not implemented');
	};

	Transform.prototype._write = function(chunk, encoding, cb) {
	  var ts = this._transformState;
	  ts.writecb = cb;
	  ts.writechunk = chunk;
	  ts.writeencoding = encoding;
	  if (!ts.transforming) {
	    var rs = this._readableState;
	    if (ts.needTransform ||
	        rs.needReadable ||
	        rs.length < rs.highWaterMark)
	      this._read(rs.highWaterMark);
	  }
	};

	// Doesn't matter what the args are here.
	// _transform does all the work.
	// That we got here means that the readable side wants more data.
	Transform.prototype._read = function(n) {
	  var ts = this._transformState;

	  if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
	    ts.transforming = true;
	    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
	  } else {
	    // mark that we need a transform, so that any data that comes in
	    // will get processed, now that we've asked for it.
	    ts.needTransform = true;
	  }
	};


	function done(stream, er) {
	  if (er)
	    return stream.emit('error', er);

	  // if there's nothing in the write buffer, then that means
	  // that nothing more will ever be provided
	  var ws = stream._writableState;
	  var ts = stream._transformState;

	  if (ws.length)
	    throw new Error('calling transform done when ws.length != 0');

	  if (ts.transforming)
	    throw new Error('calling transform done when still transforming');

	  return stream.push(null);
	}


/***/ },
/* 138 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// a passthrough stream.
	// basically just the most minimal sort of Transform stream.
	// Every written chunk gets output as-is.

	module.exports = PassThrough;

	var Transform = __webpack_require__(137);

	/*<replacement>*/
	var util = __webpack_require__(195);
	util.inherits = __webpack_require__(46);
	/*</replacement>*/

	util.inherits(PassThrough, Transform);

	function PassThrough(options) {
	  if (!(this instanceof PassThrough))
	    return new PassThrough(options);

	  Transform.call(this, options);
	}

	PassThrough.prototype._transform = function(chunk, encoding, cb) {
	  cb(null, chunk);
	};


/***/ },
/* 139 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsMatch = __webpack_require__(179),
	    getMatchData = __webpack_require__(180),
	    toObject = __webpack_require__(154);

	/**
	 * The base implementation of `_.matches` which does not clone `source`.
	 *
	 * @private
	 * @param {Object} source The object of property values to match.
	 * @returns {Function} Returns the new function.
	 */
	function baseMatches(source) {
	  var matchData = getMatchData(source);
	  if (matchData.length == 1 && matchData[0][2]) {
	    var key = matchData[0][0],
	        value = matchData[0][1];

	    return function(object) {
	      if (object == null) {
	        return false;
	      }
	      return object[key] === value && (value !== undefined || (key in toObject(object)));
	    };
	  }
	  return function(object) {
	    return baseIsMatch(object, matchData);
	  };
	}

	module.exports = baseMatches;


/***/ },
/* 140 */
/***/ function(module, exports, __webpack_require__) {

	var baseGet = __webpack_require__(181),
	    baseIsEqual = __webpack_require__(182),
	    baseSlice = __webpack_require__(183),
	    isArray = __webpack_require__(104),
	    isKey = __webpack_require__(160),
	    isStrictComparable = __webpack_require__(184),
	    last = __webpack_require__(185),
	    toObject = __webpack_require__(154),
	    toPath = __webpack_require__(186);

	/**
	 * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
	 *
	 * @private
	 * @param {string} path The path of the property to get.
	 * @param {*} srcValue The value to compare.
	 * @returns {Function} Returns the new function.
	 */
	function baseMatchesProperty(path, srcValue) {
	  var isArr = isArray(path),
	      isCommon = isKey(path) && isStrictComparable(srcValue),
	      pathKey = (path + '');

	  path = toPath(path);
	  return function(object) {
	    if (object == null) {
	      return false;
	    }
	    var key = pathKey;
	    object = toObject(object);
	    if ((isArr || !isCommon) && !(key in object)) {
	      object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
	      if (object == null) {
	        return false;
	      }
	      key = last(path);
	      object = toObject(object);
	    }
	    return object[key] === srcValue
	      ? (srcValue !== undefined || (key in object))
	      : baseIsEqual(srcValue, object[key], undefined, true);
	  };
	}

	module.exports = baseMatchesProperty;


/***/ },
/* 141 */
/***/ function(module, exports, __webpack_require__) {

	var createBaseFor = __webpack_require__(188);

	/**
	 * The base implementation of `baseForIn` and `baseForOwn` which iterates
	 * over `object` properties returned by `keysFunc` invoking `iteratee` for
	 * each property. Iteratee functions may exit iteration early by explicitly
	 * returning `false`.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @returns {Object} Returns `object`.
	 */
	var baseFor = createBaseFor();

	module.exports = baseFor;


/***/ },
/* 142 */
/***/ function(module, exports, __webpack_require__) {

	var isNative = __webpack_require__(187);

	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	  var value = object == null ? undefined : object[key];
	  return isNative(value) ? value : undefined;
	}

	module.exports = getNative;


/***/ },
/* 143 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
	 * of an array-like value.
	 */
	var MAX_SAFE_INTEGER = 9007199254740991;

	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 */
	function isLength(value) {
	  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}

	module.exports = isLength;


/***/ },
/* 144 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Checks if `value` is object-like.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}

	module.exports = isObjectLike;


/***/ },
/* 145 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var formatRegExp = /%[sdj%]/g;
	exports.format = function(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }

	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};


	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function() {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }

	  if (process.noDeprecation === true) {
	    return fn;
	  }

	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	};


	var debugs = {};
	var debugEnviron;
	exports.debuglog = function(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function() {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	};


	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;


	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};

	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};


	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];

	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}


	function stylizeNoColor(str, styleType) {
	  return str;
	}


	function arrayToHash(array) {
	  var hash = {};

	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });

	  return hash;
	}


	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }

	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }

	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);

	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }

	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }

	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = '', array = false, braces = ['{', '}'];

	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }

	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }

	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }

	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }

	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }

	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }

	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }

	  ctx.seen.push(value);

	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();

	  return reduceToSingleString(output, base, braces);
	}


	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}


	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}


	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}


	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }

	  return name + ': ' + str;
	}


	function reduceToSingleString(output, base, braces) {
	  var numLinesEst = 0;
	  var length = output.reduce(function(prev, cur) {
	    numLinesEst++;
	    if (cur.indexOf('\n') >= 0) numLinesEst++;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);

	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }

	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}


	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = __webpack_require__(193);

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}


	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}


	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];

	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}


	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function() {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};


	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = __webpack_require__(46);

	exports._extend = function(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};

	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(10)))

/***/ },
/* 146 */
/***/ function(module, exports, __webpack_require__) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]

	  i += d

	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

	  value = Math.abs(value)

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }

	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 147 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * isArray
	 */

	var isArray = Array.isArray;

	/**
	 * toString
	 */

	var str = Object.prototype.toString;

	/**
	 * Whether or not the given `val`
	 * is an array.
	 *
	 * example:
	 *
	 *        isArray([]);
	 *        // > true
	 *        isArray(arguments);
	 *        // > false
	 *        isArray('');
	 *        // > false
	 *
	 * @param {mixed} val
	 * @return {bool}
	 */

	module.exports = isArray || function (val) {
	  return !! val && '[object Array]' == str.call(val);
	};


/***/ },
/* 148 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	// If obj.hasOwnProperty has been overridden, then calling
	// obj.hasOwnProperty(prop) will break.
	// See: https://github.com/joyent/node/issues/1707
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	module.exports = function(qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};

	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }

	  var regexp = /\+/g;
	  qs = qs.split(sep);

	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }

	  var len = qs.length;
	  // maxKeys <= 0 means that we should not limit keys count
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }

	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr, vstr, k, v;

	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }

	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);

	    if (!hasOwnProperty(obj, k)) {
	      obj[k] = v;
	    } else if (Array.isArray(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }

	  return obj;
	};


/***/ },
/* 149 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	var stringifyPrimitive = function(v) {
	  switch (typeof v) {
	    case 'string':
	      return v;

	    case 'boolean':
	      return v ? 'true' : 'false';

	    case 'number':
	      return isFinite(v) ? v : '';

	    default:
	      return '';
	  }
	};

	module.exports = function(obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }

	  if (typeof obj === 'object') {
	    return Object.keys(obj).map(function(k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (Array.isArray(obj[k])) {
	        return obj[k].map(function(v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);

	  }

	  if (!name) return '';
	  return encodeURIComponent(stringifyPrimitive(name)) + eq +
	         encodeURIComponent(stringifyPrimitive(obj));
	};


/***/ },
/* 150 */
/***/ function(module, exports, __webpack_require__) {

	var getLength = __webpack_require__(153),
	    isLength = __webpack_require__(143);

	/**
	 * Checks if `value` is array-like.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 */
	function isArrayLike(value) {
	  return value != null && isLength(getLength(value));
	}

	module.exports = isArrayLike;


/***/ },
/* 151 */
/***/ function(module, exports, __webpack_require__) {

	/** Used to detect unsigned integer values. */
	var reIsUint = /^\d+$/;

	/**
	 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
	 * of an array-like value.
	 */
	var MAX_SAFE_INTEGER = 9007199254740991;

	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
	  length = length == null ? MAX_SAFE_INTEGER : length;
	  return value > -1 && value % 1 == 0 && value < length;
	}

	module.exports = isIndex;


/***/ },
/* 152 */
/***/ function(module, exports, __webpack_require__) {

	var isArguments = __webpack_require__(162),
	    isArray = __webpack_require__(104),
	    isIndex = __webpack_require__(151),
	    isLength = __webpack_require__(143),
	    keysIn = __webpack_require__(189);

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * A fallback implementation of `Object.keys` which creates an array of the
	 * own enumerable property names of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function shimKeys(object) {
	  var props = keysIn(object),
	      propsLength = props.length,
	      length = propsLength && object.length;

	  var allowIndexes = !!length && isLength(length) &&
	    (isArray(object) || isArguments(object));

	  var index = -1,
	      result = [];

	  while (++index < propsLength) {
	    var key = props[index];
	    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
	      result.push(key);
	    }
	  }
	  return result;
	}

	module.exports = shimKeys;


/***/ },
/* 153 */
/***/ function(module, exports, __webpack_require__) {

	var baseProperty = __webpack_require__(158);

	/**
	 * Gets the "length" property value of `object`.
	 *
	 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
	 * that affects Safari on at least iOS 8.1-8.3 ARM64.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {*} Returns the "length" value.
	 */
	var getLength = baseProperty('length');

	module.exports = getLength;


/***/ },
/* 154 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(106);

	/**
	 * Converts `value` to an object if it's not one.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {Object} Returns the object.
	 */
	function toObject(value) {
	  return isObject(value) ? value : Object(value);
	}

	module.exports = toObject;


/***/ },
/* 155 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {/** Native method references. */
	var ArrayBuffer = global.ArrayBuffer,
	    Uint8Array = global.Uint8Array;

	/**
	 * Creates a clone of the given array buffer.
	 *
	 * @private
	 * @param {ArrayBuffer} buffer The array buffer to clone.
	 * @returns {ArrayBuffer} Returns the cloned array buffer.
	 */
	function bufferClone(buffer) {
	  var result = new ArrayBuffer(buffer.byteLength),
	      view = new Uint8Array(result);

	  view.set(new Uint8Array(buffer));
	  return result;
	}

	module.exports = bufferClone;

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 156 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A specialized version of `_.map` for arrays without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function arrayMap(array, iteratee) {
	  var index = -1,
	      length = array.length,
	      result = Array(length);

	  while (++index < length) {
	    result[index] = iteratee(array[index], index, array);
	  }
	  return result;
	}

	module.exports = arrayMap;


/***/ },
/* 157 */
/***/ function(module, exports, __webpack_require__) {

	var baseEach = __webpack_require__(63),
	    isArrayLike = __webpack_require__(150);

	/**
	 * The base implementation of `_.map` without support for callback shorthands
	 * and `this` binding.
	 *
	 * @private
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function baseMap(collection, iteratee) {
	  var index = -1,
	      result = isArrayLike(collection) ? Array(collection.length) : [];

	  baseEach(collection, function(value, key, collection) {
	    result[++index] = iteratee(value, key, collection);
	  });
	  return result;
	}

	module.exports = baseMap;


/***/ },
/* 158 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * The base implementation of `_.property` without support for deep paths.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @returns {Function} Returns the new function.
	 */
	function baseProperty(key) {
	  return function(object) {
	    return object == null ? undefined : object[key];
	  };
	}

	module.exports = baseProperty;


/***/ },
/* 159 */
/***/ function(module, exports, __webpack_require__) {

	var baseGet = __webpack_require__(181),
	    toPath = __webpack_require__(186);

	/**
	 * A specialized version of `baseProperty` which supports deep paths.
	 *
	 * @private
	 * @param {Array|string} path The path of the property to get.
	 * @returns {Function} Returns the new function.
	 */
	function basePropertyDeep(path) {
	  var pathKey = (path + '');
	  path = toPath(path);
	  return function(object) {
	    return baseGet(object, path, pathKey);
	  };
	}

	module.exports = basePropertyDeep;


/***/ },
/* 160 */
/***/ function(module, exports, __webpack_require__) {

	var isArray = __webpack_require__(104),
	    toObject = __webpack_require__(154);

	/** Used to match property names within property paths. */
	var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
	    reIsPlainProp = /^\w*$/;

	/**
	 * Checks if `value` is a property name and not a property path.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	 */
	function isKey(value, object) {
	  var type = typeof value;
	  if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
	    return true;
	  }
	  if (isArray(value)) {
	    return false;
	  }
	  var result = !reIsDeepProp.test(value);
	  return result || (object != null && value in toObject(object));
	}

	module.exports = isKey;


/***/ },
/* 161 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Appends the elements of `values` to `array`.
	 *
	 * @private
	 * @param {Array} array The array to modify.
	 * @param {Array} values The values to append.
	 * @returns {Array} Returns `array`.
	 */
	function arrayPush(array, values) {
	  var index = -1,
	      length = values.length,
	      offset = array.length;

	  while (++index < length) {
	    array[offset + index] = values[index];
	  }
	  return array;
	}

	module.exports = arrayPush;


/***/ },
/* 162 */
/***/ function(module, exports, __webpack_require__) {

	var isArrayLike = __webpack_require__(150),
	    isObjectLike = __webpack_require__(144);

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/** Native method references. */
	var propertyIsEnumerable = objectProto.propertyIsEnumerable;

	/**
	 * Checks if `value` is classified as an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	function isArguments(value) {
	  return isObjectLike(value) && isArrayLike(value) &&
	    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
	}

	module.exports = isArguments;


/***/ },
/* 163 */
/***/ function(module, exports, __webpack_require__) {

	var baseFor = __webpack_require__(141),
	    keysIn = __webpack_require__(189);

	/**
	 * The base implementation of `_.forIn` without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Object} Returns `object`.
	 */
	function baseForIn(object, iteratee) {
	  return baseFor(object, iteratee, keysIn);
	}

	module.exports = baseForIn;


/***/ },
/* 164 */
/***/ function(module, exports, __webpack_require__) {

	var arrayEach = __webpack_require__(100),
	    baseMergeDeep = __webpack_require__(190),
	    isArray = __webpack_require__(104),
	    isArrayLike = __webpack_require__(150),
	    isObject = __webpack_require__(106),
	    isObjectLike = __webpack_require__(144),
	    isTypedArray = __webpack_require__(107),
	    keys = __webpack_require__(110);

	/**
	 * The base implementation of `_.merge` without support for argument juggling,
	 * multiple sources, and `this` binding `customizer` functions.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @param {Function} [customizer] The function to customize merged values.
	 * @param {Array} [stackA=[]] Tracks traversed source objects.
	 * @param {Array} [stackB=[]] Associates values with source counterparts.
	 * @returns {Object} Returns `object`.
	 */
	function baseMerge(object, source, customizer, stackA, stackB) {
	  if (!isObject(object)) {
	    return object;
	  }
	  var isSrcArr = isArrayLike(source) && (isArray(source) || isTypedArray(source)),
	      props = isSrcArr ? undefined : keys(source);

	  arrayEach(props || source, function(srcValue, key) {
	    if (props) {
	      key = srcValue;
	      srcValue = source[key];
	    }
	    if (isObjectLike(srcValue)) {
	      stackA || (stackA = []);
	      stackB || (stackB = []);
	      baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
	    }
	    else {
	      var value = object[key],
	          result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
	          isCommon = result === undefined;

	      if (isCommon) {
	        result = srcValue;
	      }
	      if ((result !== undefined || (isSrcArr && !(key in object))) &&
	          (isCommon || (result === result ? (result !== value) : (value === value)))) {
	        object[key] = result;
	      }
	    }
	  });
	  return object;
	}

	module.exports = baseMerge;


/***/ },
/* 165 */
/***/ function(module, exports, __webpack_require__) {

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	;(function (exports) {
		'use strict';

	  var Arr = (typeof Uint8Array !== 'undefined')
	    ? Uint8Array
	    : Array

		var PLUS   = '+'.charCodeAt(0)
		var SLASH  = '/'.charCodeAt(0)
		var NUMBER = '0'.charCodeAt(0)
		var LOWER  = 'a'.charCodeAt(0)
		var UPPER  = 'A'.charCodeAt(0)
		var PLUS_URL_SAFE = '-'.charCodeAt(0)
		var SLASH_URL_SAFE = '_'.charCodeAt(0)

		function decode (elt) {
			var code = elt.charCodeAt(0)
			if (code === PLUS ||
			    code === PLUS_URL_SAFE)
				return 62 // '+'
			if (code === SLASH ||
			    code === SLASH_URL_SAFE)
				return 63 // '/'
			if (code < NUMBER)
				return -1 //no match
			if (code < NUMBER + 10)
				return code - NUMBER + 26 + 26
			if (code < UPPER + 26)
				return code - UPPER
			if (code < LOWER + 26)
				return code - LOWER + 26
		}

		function b64ToByteArray (b64) {
			var i, j, l, tmp, placeHolders, arr

			if (b64.length % 4 > 0) {
				throw new Error('Invalid string. Length must be a multiple of 4')
			}

			// the number of equal signs (place holders)
			// if there are two placeholders, than the two characters before it
			// represent one byte
			// if there is only one, then the three characters before it represent 2 bytes
			// this is just a cheap hack to not do indexOf twice
			var len = b64.length
			placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

			// base64 is 4/3 + up to two characters of the original data
			arr = new Arr(b64.length * 3 / 4 - placeHolders)

			// if there are placeholders, only get up to the last complete 4 chars
			l = placeHolders > 0 ? b64.length - 4 : b64.length

			var L = 0

			function push (v) {
				arr[L++] = v
			}

			for (i = 0, j = 0; i < l; i += 4, j += 3) {
				tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
				push((tmp & 0xFF0000) >> 16)
				push((tmp & 0xFF00) >> 8)
				push(tmp & 0xFF)
			}

			if (placeHolders === 2) {
				tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
				push(tmp & 0xFF)
			} else if (placeHolders === 1) {
				tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
				push((tmp >> 8) & 0xFF)
				push(tmp & 0xFF)
			}

			return arr
		}

		function uint8ToBase64 (uint8) {
			var i,
				extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
				output = "",
				temp, length

			function encode (num) {
				return lookup.charAt(num)
			}

			function tripletToBase64 (num) {
				return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
			}

			// go through the array every three bytes, we'll deal with trailing stuff later
			for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
				temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
				output += tripletToBase64(temp)
			}

			// pad the end with zeros, but make sure to not forget the extra bytes
			switch (extraBytes) {
				case 1:
					temp = uint8[uint8.length - 1]
					output += encode(temp >> 2)
					output += encode((temp << 4) & 0x3F)
					output += '=='
					break
				case 2:
					temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
					output += encode(temp >> 10)
					output += encode((temp >> 4) & 0x3F)
					output += encode((temp << 2) & 0x3F)
					output += '='
					break
			}

			return output
		}

		exports.toByteArray = b64ToByteArray
		exports.fromByteArray = uint8ToBase64
	}(false ? (this.base64js = {}) : exports))


/***/ },
/* 166 */
/***/ function(module, exports, __webpack_require__) {

	/* (ignored) */

/***/ },
/* 167 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Helpers.
	 */

	var s = 1000;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var y = d * 365.25;

	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} options
	 * @return {String|Number}
	 * @api public
	 */

	module.exports = function(val, options){
	  options = options || {};
	  if ('string' == typeof val) return parse(val);
	  return options.long
	    ? long(val)
	    : short(val);
	};

	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */

	function parse(str) {
	  str = '' + str;
	  if (str.length > 10000) return;
	  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
	  if (!match) return;
	  var n = parseFloat(match[1]);
	  var type = (match[2] || 'ms').toLowerCase();
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'yrs':
	    case 'yr':
	    case 'y':
	      return n * y;
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d;
	    case 'hours':
	    case 'hour':
	    case 'hrs':
	    case 'hr':
	    case 'h':
	      return n * h;
	    case 'minutes':
	    case 'minute':
	    case 'mins':
	    case 'min':
	    case 'm':
	      return n * m;
	    case 'seconds':
	    case 'second':
	    case 'secs':
	    case 'sec':
	    case 's':
	      return n * s;
	    case 'milliseconds':
	    case 'millisecond':
	    case 'msecs':
	    case 'msec':
	    case 'ms':
	      return n;
	  }
	}

	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function short(ms) {
	  if (ms >= d) return Math.round(ms / d) + 'd';
	  if (ms >= h) return Math.round(ms / h) + 'h';
	  if (ms >= m) return Math.round(ms / m) + 'm';
	  if (ms >= s) return Math.round(ms / s) + 's';
	  return ms + 'ms';
	}

	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function long(ms) {
	  return plural(ms, d, 'day')
	    || plural(ms, h, 'hour')
	    || plural(ms, m, 'minute')
	    || plural(ms, s, 'second')
	    || ms + ' ms';
	}

	/**
	 * Pluralization helper.
	 */

	function plural(ms, n, name) {
	  if (ms < n) return;
	  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
	  return Math.ceil(ms / n) + ' ' + name + 's';
	}


/***/ },
/* 168 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 169 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(135)


/***/ },
/* 170 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(136)


/***/ },
/* 171 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(137)


/***/ },
/* 172 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(138)


/***/ },
/* 173 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, Buffer) {(function() {
	  var g = ('undefined' === typeof window ? global : window) || {}
	  _crypto = (
	    g.crypto || g.msCrypto || __webpack_require__(194)
	  )
	  module.exports = function(size) {
	    // Modern Browsers
	    if(_crypto.getRandomValues) {
	      var bytes = new Buffer(size); //in browserify, this is an extended Uint8Array
	      /* This will not work in older browsers.
	       * See https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
	       */
	    
	      _crypto.getRandomValues(bytes);
	      return bytes;
	    }
	    else if (_crypto.randomBytes) {
	      return _crypto.randomBytes(size)
	    }
	    else
	      throw new Error(
	        'secure random number generation not supported by this browser\n'+
	        'use chrome, FireFox or Internet Explorer 11'
	      )
	  }
	}())

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(97).Buffer))

/***/ },
/* 174 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var createHash = __webpack_require__(201)

	var md5 = toConstructor(__webpack_require__(196))
	var rmd160 = toConstructor(__webpack_require__(203))

	function toConstructor (fn) {
	  return function () {
	    var buffers = []
	    var m= {
	      update: function (data, enc) {
	        if(!Buffer.isBuffer(data)) data = new Buffer(data, enc)
	        buffers.push(data)
	        return this
	      },
	      digest: function (enc) {
	        var buf = Buffer.concat(buffers)
	        var r = fn(buf)
	        buffers = null
	        return enc ? r.toString(enc) : r
	      }
	    }
	    return m
	  }
	}

	module.exports = function (alg) {
	  if('md5' === alg) return new md5()
	  if('rmd160' === alg) return new rmd160()
	  return createHash(alg)
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(97).Buffer))

/***/ },
/* 175 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var createHash = __webpack_require__(174)

	var zeroBuffer = new Buffer(128)
	zeroBuffer.fill(0)

	module.exports = Hmac

	function Hmac (alg, key) {
	  if(!(this instanceof Hmac)) return new Hmac(alg, key)
	  this._opad = opad
	  this._alg = alg

	  var blocksize = (alg === 'sha512') ? 128 : 64

	  key = this._key = !Buffer.isBuffer(key) ? new Buffer(key) : key

	  if(key.length > blocksize) {
	    key = createHash(alg).update(key).digest()
	  } else if(key.length < blocksize) {
	    key = Buffer.concat([key, zeroBuffer], blocksize)
	  }

	  var ipad = this._ipad = new Buffer(blocksize)
	  var opad = this._opad = new Buffer(blocksize)

	  for(var i = 0; i < blocksize; i++) {
	    ipad[i] = key[i] ^ 0x36
	    opad[i] = key[i] ^ 0x5C
	  }

	  this._hash = createHash(alg).update(ipad)
	}

	Hmac.prototype.update = function (data, enc) {
	  this._hash.update(data, enc)
	  return this
	}

	Hmac.prototype.digest = function (enc) {
	  var h = this._hash.digest()
	  return createHash(this._alg).update(this._opad).update(h).digest(enc)
	}


	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(97).Buffer))

/***/ },
/* 176 */
/***/ function(module, exports, __webpack_require__) {

	var pbkdf2Export = __webpack_require__(202)

	module.exports = function (crypto, exports) {
	  exports = exports || {}

	  var exported = pbkdf2Export(crypto)

	  exports.pbkdf2 = exported.pbkdf2
	  exports.pbkdf2Sync = exported.pbkdf2Sync

	  return exports
	}


/***/ },
/* 177 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	module.exports = function () {
		return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
	};


/***/ },
/* 178 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	module.exports = function () {
		return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
	};


/***/ },
/* 179 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsEqual = __webpack_require__(182),
	    toObject = __webpack_require__(154);

	/**
	 * The base implementation of `_.isMatch` without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Object} object The object to inspect.
	 * @param {Array} matchData The propery names, values, and compare flags to match.
	 * @param {Function} [customizer] The function to customize comparing objects.
	 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
	 */
	function baseIsMatch(object, matchData, customizer) {
	  var index = matchData.length,
	      length = index,
	      noCustomizer = !customizer;

	  if (object == null) {
	    return !length;
	  }
	  object = toObject(object);
	  while (index--) {
	    var data = matchData[index];
	    if ((noCustomizer && data[2])
	          ? data[1] !== object[data[0]]
	          : !(data[0] in object)
	        ) {
	      return false;
	    }
	  }
	  while (++index < length) {
	    data = matchData[index];
	    var key = data[0],
	        objValue = object[key],
	        srcValue = data[1];

	    if (noCustomizer && data[2]) {
	      if (objValue === undefined && !(key in object)) {
	        return false;
	      }
	    } else {
	      var result = customizer ? customizer(objValue, srcValue, key) : undefined;
	      if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
	        return false;
	      }
	    }
	  }
	  return true;
	}

	module.exports = baseIsMatch;


/***/ },
/* 180 */
/***/ function(module, exports, __webpack_require__) {

	var isStrictComparable = __webpack_require__(184),
	    pairs = __webpack_require__(197);

	/**
	 * Gets the propery names, values, and compare flags of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the match data of `object`.
	 */
	function getMatchData(object) {
	  var result = pairs(object),
	      length = result.length;

	  while (length--) {
	    result[length][2] = isStrictComparable(result[length][1]);
	  }
	  return result;
	}

	module.exports = getMatchData;


/***/ },
/* 181 */
/***/ function(module, exports, __webpack_require__) {

	var toObject = __webpack_require__(154);

	/**
	 * The base implementation of `get` without support for string paths
	 * and default values.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array} path The path of the property to get.
	 * @param {string} [pathKey] The key representation of path.
	 * @returns {*} Returns the resolved value.
	 */
	function baseGet(object, path, pathKey) {
	  if (object == null) {
	    return;
	  }
	  if (pathKey !== undefined && pathKey in toObject(object)) {
	    path = [pathKey];
	  }
	  var index = 0,
	      length = path.length;

	  while (object != null && index < length) {
	    object = object[path[index++]];
	  }
	  return (index && index == length) ? object : undefined;
	}

	module.exports = baseGet;


/***/ },
/* 182 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsEqualDeep = __webpack_require__(198),
	    isObject = __webpack_require__(106),
	    isObjectLike = __webpack_require__(144);

	/**
	 * The base implementation of `_.isEqual` without support for `this` binding
	 * `customizer` functions.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @param {Function} [customizer] The function to customize comparing values.
	 * @param {boolean} [isLoose] Specify performing partial comparisons.
	 * @param {Array} [stackA] Tracks traversed `value` objects.
	 * @param {Array} [stackB] Tracks traversed `other` objects.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 */
	function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
	  if (value === other) {
	    return true;
	  }
	  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
	    return value !== value && other !== other;
	  }
	  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
	}

	module.exports = baseIsEqual;


/***/ },
/* 183 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * The base implementation of `_.slice` without an iteratee call guard.
	 *
	 * @private
	 * @param {Array} array The array to slice.
	 * @param {number} [start=0] The start position.
	 * @param {number} [end=array.length] The end position.
	 * @returns {Array} Returns the slice of `array`.
	 */
	function baseSlice(array, start, end) {
	  var index = -1,
	      length = array.length;

	  start = start == null ? 0 : (+start || 0);
	  if (start < 0) {
	    start = -start > length ? 0 : (length + start);
	  }
	  end = (end === undefined || end > length) ? length : (+end || 0);
	  if (end < 0) {
	    end += length;
	  }
	  length = start > end ? 0 : ((end - start) >>> 0);
	  start >>>= 0;

	  var result = Array(length);
	  while (++index < length) {
	    result[index] = array[index + start];
	  }
	  return result;
	}

	module.exports = baseSlice;


/***/ },
/* 184 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(106);

	/**
	 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` if suitable for strict
	 *  equality comparisons, else `false`.
	 */
	function isStrictComparable(value) {
	  return value === value && !isObject(value);
	}

	module.exports = isStrictComparable;


/***/ },
/* 185 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Gets the last element of `array`.
	 *
	 * @static
	 * @memberOf _
	 * @category Array
	 * @param {Array} array The array to query.
	 * @returns {*} Returns the last element of `array`.
	 * @example
	 *
	 * _.last([1, 2, 3]);
	 * // => 3
	 */
	function last(array) {
	  var length = array ? array.length : 0;
	  return length ? array[length - 1] : undefined;
	}

	module.exports = last;


/***/ },
/* 186 */
/***/ function(module, exports, __webpack_require__) {

	var baseToString = __webpack_require__(65),
	    isArray = __webpack_require__(104);

	/** Used to match property names within property paths. */
	var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

	/** Used to match backslashes in property paths. */
	var reEscapeChar = /\\(\\)?/g;

	/**
	 * Converts `value` to property path array if it's not one.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {Array} Returns the property path array.
	 */
	function toPath(value) {
	  if (isArray(value)) {
	    return value;
	  }
	  var result = [];
	  baseToString(value).replace(rePropName, function(match, number, quote, string) {
	    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
	  });
	  return result;
	}

	module.exports = toPath;


/***/ },
/* 187 */
/***/ function(module, exports, __webpack_require__) {

	var isFunction = __webpack_require__(105),
	    isObjectLike = __webpack_require__(144);

	/** Used to detect host constructors (Safari > 5). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to resolve the decompiled source of functions. */
	var fnToString = Function.prototype.toString;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);

	/**
	 * Checks if `value` is a native function.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
	 * @example
	 *
	 * _.isNative(Array.prototype.push);
	 * // => true
	 *
	 * _.isNative(_);
	 * // => false
	 */
	function isNative(value) {
	  if (value == null) {
	    return false;
	  }
	  if (isFunction(value)) {
	    return reIsNative.test(fnToString.call(value));
	  }
	  return isObjectLike(value) && reIsHostCtor.test(value);
	}

	module.exports = isNative;


/***/ },
/* 188 */
/***/ function(module, exports, __webpack_require__) {

	var toObject = __webpack_require__(154);

	/**
	 * Creates a base function for `_.forIn` or `_.forInRight`.
	 *
	 * @private
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {Function} Returns the new base function.
	 */
	function createBaseFor(fromRight) {
	  return function(object, iteratee, keysFunc) {
	    var iterable = toObject(object),
	        props = keysFunc(object),
	        length = props.length,
	        index = fromRight ? length : -1;

	    while ((fromRight ? index-- : ++index < length)) {
	      var key = props[index];
	      if (iteratee(iterable[key], key, iterable) === false) {
	        break;
	      }
	    }
	    return object;
	  };
	}

	module.exports = createBaseFor;


/***/ },
/* 189 */
/***/ function(module, exports, __webpack_require__) {

	var isArguments = __webpack_require__(162),
	    isArray = __webpack_require__(104),
	    isIndex = __webpack_require__(151),
	    isLength = __webpack_require__(143),
	    isObject = __webpack_require__(106);

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Creates an array of the own and inherited enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects.
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keysIn(new Foo);
	 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
	 */
	function keysIn(object) {
	  if (object == null) {
	    return [];
	  }
	  if (!isObject(object)) {
	    object = Object(object);
	  }
	  var length = object.length;
	  length = (length && isLength(length) &&
	    (isArray(object) || isArguments(object)) && length) || 0;

	  var Ctor = object.constructor,
	      index = -1,
	      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
	      result = Array(length),
	      skipIndexes = length > 0;

	  while (++index < length) {
	    result[index] = (index + '');
	  }
	  for (var key in object) {
	    if (!(skipIndexes && isIndex(key, length)) &&
	        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
	      result.push(key);
	    }
	  }
	  return result;
	}

	module.exports = keysIn;


/***/ },
/* 190 */
/***/ function(module, exports, __webpack_require__) {

	var arrayCopy = __webpack_require__(116),
	    isArguments = __webpack_require__(162),
	    isArray = __webpack_require__(104),
	    isArrayLike = __webpack_require__(150),
	    isPlainObject = __webpack_require__(199),
	    isTypedArray = __webpack_require__(107),
	    toPlainObject = __webpack_require__(200);

	/**
	 * A specialized version of `baseMerge` for arrays and objects which performs
	 * deep merges and tracks traversed objects enabling objects with circular
	 * references to be merged.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @param {string} key The key of the value to merge.
	 * @param {Function} mergeFunc The function to merge values.
	 * @param {Function} [customizer] The function to customize merged values.
	 * @param {Array} [stackA=[]] Tracks traversed source objects.
	 * @param {Array} [stackB=[]] Associates values with source counterparts.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
	  var length = stackA.length,
	      srcValue = source[key];

	  while (length--) {
	    if (stackA[length] == srcValue) {
	      object[key] = stackB[length];
	      return;
	    }
	  }
	  var value = object[key],
	      result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
	      isCommon = result === undefined;

	  if (isCommon) {
	    result = srcValue;
	    if (isArrayLike(srcValue) && (isArray(srcValue) || isTypedArray(srcValue))) {
	      result = isArray(value)
	        ? value
	        : (isArrayLike(value) ? arrayCopy(value) : []);
	    }
	    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
	      result = isArguments(value)
	        ? toPlainObject(value)
	        : (isPlainObject(value) ? value : {});
	    }
	    else {
	      isCommon = false;
	    }
	  }
	  // Add the source value to the stack of traversed objects and associate
	  // it with its merged value.
	  stackA.push(srcValue);
	  stackB.push(result);

	  if (isCommon) {
	    // Recursively merge objects and arrays (susceptible to call stack limits).
	    object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
	  } else if (result === result ? (result !== value) : (value === value)) {
	    object[key] = result;
	  }
	}

	module.exports = baseMergeDeep;


/***/ },
/* 191 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};


/***/ },
/* 192 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var Buffer = __webpack_require__(97).Buffer;

	var isBufferEncoding = Buffer.isEncoding
	  || function(encoding) {
	       switch (encoding && encoding.toLowerCase()) {
	         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
	         default: return false;
	       }
	     }


	function assertEncoding(encoding) {
	  if (encoding && !isBufferEncoding(encoding)) {
	    throw new Error('Unknown encoding: ' + encoding);
	  }
	}

	// StringDecoder provides an interface for efficiently splitting a series of
	// buffers into a series of JS strings without breaking apart multi-byte
	// characters. CESU-8 is handled as part of the UTF-8 encoding.
	//
	// @TODO Handling all encodings inside a single object makes it very difficult
	// to reason about this code, so it should be split up in the future.
	// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
	// points as used by CESU-8.
	var StringDecoder = exports.StringDecoder = function(encoding) {
	  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
	  assertEncoding(encoding);
	  switch (this.encoding) {
	    case 'utf8':
	      // CESU-8 represents each of Surrogate Pair by 3-bytes
	      this.surrogateSize = 3;
	      break;
	    case 'ucs2':
	    case 'utf16le':
	      // UTF-16 represents each of Surrogate Pair by 2-bytes
	      this.surrogateSize = 2;
	      this.detectIncompleteChar = utf16DetectIncompleteChar;
	      break;
	    case 'base64':
	      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
	      this.surrogateSize = 3;
	      this.detectIncompleteChar = base64DetectIncompleteChar;
	      break;
	    default:
	      this.write = passThroughWrite;
	      return;
	  }

	  // Enough space to store all bytes of a single character. UTF-8 needs 4
	  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
	  this.charBuffer = new Buffer(6);
	  // Number of bytes received for the current incomplete multi-byte character.
	  this.charReceived = 0;
	  // Number of bytes expected for the current incomplete multi-byte character.
	  this.charLength = 0;
	};


	// write decodes the given buffer and returns it as JS string that is
	// guaranteed to not contain any partial multi-byte characters. Any partial
	// character found at the end of the buffer is buffered up, and will be
	// returned when calling write again with the remaining bytes.
	//
	// Note: Converting a Buffer containing an orphan surrogate to a String
	// currently works, but converting a String to a Buffer (via `new Buffer`, or
	// Buffer#write) will replace incomplete surrogates with the unicode
	// replacement character. See https://codereview.chromium.org/121173009/ .
	StringDecoder.prototype.write = function(buffer) {
	  var charStr = '';
	  // if our last write ended with an incomplete multibyte character
	  while (this.charLength) {
	    // determine how many remaining bytes this buffer has to offer for this char
	    var available = (buffer.length >= this.charLength - this.charReceived) ?
	        this.charLength - this.charReceived :
	        buffer.length;

	    // add the new bytes to the char buffer
	    buffer.copy(this.charBuffer, this.charReceived, 0, available);
	    this.charReceived += available;

	    if (this.charReceived < this.charLength) {
	      // still not enough chars in this buffer? wait for more ...
	      return '';
	    }

	    // remove bytes belonging to the current character from the buffer
	    buffer = buffer.slice(available, buffer.length);

	    // get the character that was split
	    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

	    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	    var charCode = charStr.charCodeAt(charStr.length - 1);
	    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	      this.charLength += this.surrogateSize;
	      charStr = '';
	      continue;
	    }
	    this.charReceived = this.charLength = 0;

	    // if there are no more bytes in this buffer, just emit our char
	    if (buffer.length === 0) {
	      return charStr;
	    }
	    break;
	  }

	  // determine and set charLength / charReceived
	  this.detectIncompleteChar(buffer);

	  var end = buffer.length;
	  if (this.charLength) {
	    // buffer the incomplete character bytes we got
	    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
	    end -= this.charReceived;
	  }

	  charStr += buffer.toString(this.encoding, 0, end);

	  var end = charStr.length - 1;
	  var charCode = charStr.charCodeAt(end);
	  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	    var size = this.surrogateSize;
	    this.charLength += size;
	    this.charReceived += size;
	    this.charBuffer.copy(this.charBuffer, size, 0, size);
	    buffer.copy(this.charBuffer, 0, 0, size);
	    return charStr.substring(0, end);
	  }

	  // or just emit the charStr
	  return charStr;
	};

	// detectIncompleteChar determines if there is an incomplete UTF-8 character at
	// the end of the given buffer. If so, it sets this.charLength to the byte
	// length that character, and sets this.charReceived to the number of bytes
	// that are available for this character.
	StringDecoder.prototype.detectIncompleteChar = function(buffer) {
	  // determine how many bytes we have to check at the end of this buffer
	  var i = (buffer.length >= 3) ? 3 : buffer.length;

	  // Figure out if one of the last i bytes of our buffer announces an
	  // incomplete char.
	  for (; i > 0; i--) {
	    var c = buffer[buffer.length - i];

	    // See http://en.wikipedia.org/wiki/UTF-8#Description

	    // 110XXXXX
	    if (i == 1 && c >> 5 == 0x06) {
	      this.charLength = 2;
	      break;
	    }

	    // 1110XXXX
	    if (i <= 2 && c >> 4 == 0x0E) {
	      this.charLength = 3;
	      break;
	    }

	    // 11110XXX
	    if (i <= 3 && c >> 3 == 0x1E) {
	      this.charLength = 4;
	      break;
	    }
	  }
	  this.charReceived = i;
	};

	StringDecoder.prototype.end = function(buffer) {
	  var res = '';
	  if (buffer && buffer.length)
	    res = this.write(buffer);

	  if (this.charReceived) {
	    var cr = this.charReceived;
	    var buf = this.charBuffer;
	    var enc = this.encoding;
	    res += buf.slice(0, cr).toString(enc);
	  }

	  return res;
	};

	function passThroughWrite(buffer) {
	  return buffer.toString(this.encoding);
	}

	function utf16DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 2;
	  this.charLength = this.charReceived ? 2 : 0;
	}

	function base64DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 3;
	  this.charLength = this.charReceived ? 3 : 0;
	}


/***/ },
/* 193 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ },
/* 194 */
/***/ function(module, exports, __webpack_require__) {

	/* (ignored) */

/***/ },
/* 195 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	function isBuffer(arg) {
	  return Buffer.isBuffer(arg);
	}
	exports.isBuffer = isBuffer;

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(97).Buffer))

/***/ },
/* 196 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
	 * Digest Algorithm, as defined in RFC 1321.
	 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 * Distributed under the BSD License
	 * See http://pajhome.org.uk/crypt/md5 for more info.
	 */

	var helpers = __webpack_require__(204);

	/*
	 * Calculate the MD5 of an array of little-endian words, and a bit length
	 */
	function core_md5(x, len)
	{
	  /* append padding */
	  x[len >> 5] |= 0x80 << ((len) % 32);
	  x[(((len + 64) >>> 9) << 4) + 14] = len;

	  var a =  1732584193;
	  var b = -271733879;
	  var c = -1732584194;
	  var d =  271733878;

	  for(var i = 0; i < x.length; i += 16)
	  {
	    var olda = a;
	    var oldb = b;
	    var oldc = c;
	    var oldd = d;

	    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
	    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
	    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
	    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
	    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
	    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
	    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
	    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
	    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
	    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
	    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
	    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
	    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
	    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
	    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
	    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

	    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
	    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
	    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
	    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
	    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
	    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
	    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
	    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
	    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
	    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
	    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
	    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
	    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
	    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
	    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
	    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

	    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
	    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
	    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
	    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
	    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
	    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
	    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
	    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
	    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
	    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
	    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
	    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
	    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
	    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
	    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
	    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

	    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
	    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
	    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
	    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
	    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
	    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
	    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
	    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
	    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
	    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
	    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
	    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
	    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
	    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
	    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
	    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

	    a = safe_add(a, olda);
	    b = safe_add(b, oldb);
	    c = safe_add(c, oldc);
	    d = safe_add(d, oldd);
	  }
	  return Array(a, b, c, d);

	}

	/*
	 * These functions implement the four basic operations the algorithm uses.
	 */
	function md5_cmn(q, a, b, x, s, t)
	{
	  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
	}
	function md5_ff(a, b, c, d, x, s, t)
	{
	  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
	}
	function md5_gg(a, b, c, d, x, s, t)
	{
	  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
	}
	function md5_hh(a, b, c, d, x, s, t)
	{
	  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
	}
	function md5_ii(a, b, c, d, x, s, t)
	{
	  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
	}

	/*
	 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
	 * to work around bugs in some JS interpreters.
	 */
	function safe_add(x, y)
	{
	  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	  return (msw << 16) | (lsw & 0xFFFF);
	}

	/*
	 * Bitwise rotate a 32-bit number to the left.
	 */
	function bit_rol(num, cnt)
	{
	  return (num << cnt) | (num >>> (32 - cnt));
	}

	module.exports = function md5(buf) {
	  return helpers.hash(buf, core_md5, 16);
	};


/***/ },
/* 197 */
/***/ function(module, exports, __webpack_require__) {

	var keys = __webpack_require__(110),
	    toObject = __webpack_require__(154);

	/**
	 * Creates a two dimensional array of the key-value pairs for `object`,
	 * e.g. `[[key1, value1], [key2, value2]]`.
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the new array of key-value pairs.
	 * @example
	 *
	 * _.pairs({ 'barney': 36, 'fred': 40 });
	 * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
	 */
	function pairs(object) {
	  object = toObject(object);

	  var index = -1,
	      props = keys(object),
	      length = props.length,
	      result = Array(length);

	  while (++index < length) {
	    var key = props[index];
	    result[index] = [key, object[key]];
	  }
	  return result;
	}

	module.exports = pairs;


/***/ },
/* 198 */
/***/ function(module, exports, __webpack_require__) {

	var equalArrays = __webpack_require__(205),
	    equalByTag = __webpack_require__(206),
	    equalObjects = __webpack_require__(207),
	    isArray = __webpack_require__(104),
	    isTypedArray = __webpack_require__(107);

	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    objectTag = '[object Object]';

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;

	/**
	 * A specialized version of `baseIsEqual` for arrays and objects which performs
	 * deep comparisons and tracks traversed objects enabling objects with circular
	 * references to be compared.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Function} [customizer] The function to customize comparing objects.
	 * @param {boolean} [isLoose] Specify performing partial comparisons.
	 * @param {Array} [stackA=[]] Tracks traversed `value` objects.
	 * @param {Array} [stackB=[]] Tracks traversed `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
	  var objIsArr = isArray(object),
	      othIsArr = isArray(other),
	      objTag = arrayTag,
	      othTag = arrayTag;

	  if (!objIsArr) {
	    objTag = objToString.call(object);
	    if (objTag == argsTag) {
	      objTag = objectTag;
	    } else if (objTag != objectTag) {
	      objIsArr = isTypedArray(object);
	    }
	  }
	  if (!othIsArr) {
	    othTag = objToString.call(other);
	    if (othTag == argsTag) {
	      othTag = objectTag;
	    } else if (othTag != objectTag) {
	      othIsArr = isTypedArray(other);
	    }
	  }
	  var objIsObj = objTag == objectTag,
	      othIsObj = othTag == objectTag,
	      isSameTag = objTag == othTag;

	  if (isSameTag && !(objIsArr || objIsObj)) {
	    return equalByTag(object, other, objTag);
	  }
	  if (!isLoose) {
	    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
	        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

	    if (objIsWrapped || othIsWrapped) {
	      return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
	    }
	  }
	  if (!isSameTag) {
	    return false;
	  }
	  // Assume cyclic values are equal.
	  // For more information on detecting circular references see https://es5.github.io/#JO.
	  stackA || (stackA = []);
	  stackB || (stackB = []);

	  var length = stackA.length;
	  while (length--) {
	    if (stackA[length] == object) {
	      return stackB[length] == other;
	    }
	  }
	  // Add `object` and `other` to the stack of traversed objects.
	  stackA.push(object);
	  stackB.push(other);

	  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

	  stackA.pop();
	  stackB.pop();

	  return result;
	}

	module.exports = baseIsEqualDeep;


/***/ },
/* 199 */
/***/ function(module, exports, __webpack_require__) {

	var baseForIn = __webpack_require__(163),
	    isArguments = __webpack_require__(162),
	    isObjectLike = __webpack_require__(144);

	/** `Object#toString` result references. */
	var objectTag = '[object Object]';

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;

	/**
	 * Checks if `value` is a plain object, that is, an object created by the
	 * `Object` constructor or one with a `[[Prototype]]` of `null`.
	 *
	 * **Note:** This method assumes objects created by the `Object` constructor
	 * have no inherited enumerable properties.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 * }
	 *
	 * _.isPlainObject(new Foo);
	 * // => false
	 *
	 * _.isPlainObject([1, 2, 3]);
	 * // => false
	 *
	 * _.isPlainObject({ 'x': 0, 'y': 0 });
	 * // => true
	 *
	 * _.isPlainObject(Object.create(null));
	 * // => true
	 */
	function isPlainObject(value) {
	  var Ctor;

	  // Exit early for non `Object` objects.
	  if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isArguments(value)) ||
	      (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
	    return false;
	  }
	  // IE < 9 iterates inherited properties before own properties. If the first
	  // iterated property is an object's own property then there are no inherited
	  // enumerable properties.
	  var result;
	  // In most environments an object's own properties are iterated before
	  // its inherited properties. If the last iterated property is an object's
	  // own property then there are no inherited enumerable properties.
	  baseForIn(value, function(subValue, key) {
	    result = key;
	  });
	  return result === undefined || hasOwnProperty.call(value, result);
	}

	module.exports = isPlainObject;


/***/ },
/* 200 */
/***/ function(module, exports, __webpack_require__) {

	var baseCopy = __webpack_require__(111),
	    keysIn = __webpack_require__(189);

	/**
	 * Converts `value` to a plain object flattening inherited enumerable
	 * properties of `value` to own properties of the plain object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {Object} Returns the converted plain object.
	 * @example
	 *
	 * function Foo() {
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.assign({ 'a': 1 }, new Foo);
	 * // => { 'a': 1, 'b': 2 }
	 *
	 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
	 * // => { 'a': 1, 'b': 2, 'c': 3 }
	 */
	function toPlainObject(value) {
	  return baseCopy(value, keysIn(value));
	}

	module.exports = toPlainObject;


/***/ },
/* 201 */
/***/ function(module, exports, __webpack_require__) {

	var exports = module.exports = function (alg) {
	  var Alg = exports[alg]
	  if(!Alg) throw new Error(alg + ' is not supported (we accept pull requests)')
	  return new Alg()
	}

	var Buffer = __webpack_require__(97).Buffer
	var Hash   = __webpack_require__(208)(Buffer)

	exports.sha1 = __webpack_require__(209)(Buffer, Hash)
	exports.sha256 = __webpack_require__(210)(Buffer, Hash)
	exports.sha512 = __webpack_require__(211)(Buffer, Hash)


/***/ },
/* 202 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {module.exports = function(crypto) {
	  function pbkdf2(password, salt, iterations, keylen, digest, callback) {
	    if ('function' === typeof digest) {
	      callback = digest
	      digest = undefined
	    }

	    if ('function' !== typeof callback)
	      throw new Error('No callback provided to pbkdf2')

	    setTimeout(function() {
	      var result

	      try {
	        result = pbkdf2Sync(password, salt, iterations, keylen, digest)
	      } catch (e) {
	        return callback(e)
	      }

	      callback(undefined, result)
	    })
	  }

	  function pbkdf2Sync(password, salt, iterations, keylen, digest) {
	    if ('number' !== typeof iterations)
	      throw new TypeError('Iterations not a number')

	    if (iterations < 0)
	      throw new TypeError('Bad iterations')

	    if ('number' !== typeof keylen)
	      throw new TypeError('Key length not a number')

	    if (keylen < 0)
	      throw new TypeError('Bad key length')

	    digest = digest || 'sha1'

	    if (!Buffer.isBuffer(password)) password = new Buffer(password)
	    if (!Buffer.isBuffer(salt)) salt = new Buffer(salt)

	    var hLen, l = 1, r, T
	    var DK = new Buffer(keylen)
	    var block1 = new Buffer(salt.length + 4)
	    salt.copy(block1, 0, 0, salt.length)

	    for (var i = 1; i <= l; i++) {
	      block1.writeUInt32BE(i, salt.length)

	      var U = crypto.createHmac(digest, password).update(block1).digest()

	      if (!hLen) {
	        hLen = U.length
	        T = new Buffer(hLen)
	        l = Math.ceil(keylen / hLen)
	        r = keylen - (l - 1) * hLen

	        if (keylen > (Math.pow(2, 32) - 1) * hLen)
	          throw new TypeError('keylen exceeds maximum length')
	      }

	      U.copy(T, 0, 0, hLen)

	      for (var j = 1; j < iterations; j++) {
	        U = crypto.createHmac(digest, password).update(U).digest()

	        for (var k = 0; k < hLen; k++) {
	          T[k] ^= U[k]
	        }
	      }

	      var destPos = (i - 1) * hLen
	      var len = (i == l ? r : hLen)
	      T.copy(DK, destPos, 0, len)
	    }

	    return DK
	  }

	  return {
	    pbkdf2: pbkdf2,
	    pbkdf2Sync: pbkdf2Sync
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(97).Buffer))

/***/ },
/* 203 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {
	module.exports = ripemd160



	/*
	CryptoJS v3.1.2
	code.google.com/p/crypto-js
	(c) 2009-2013 by Jeff Mott. All rights reserved.
	code.google.com/p/crypto-js/wiki/License
	*/
	/** @preserve
	(c) 2012 by Cédric Mesnil. All rights reserved.

	Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

	    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
	    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/

	// Constants table
	var zl = [
	    0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
	    7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
	    3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
	    1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
	    4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13];
	var zr = [
	    5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
	    6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
	    15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
	    8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
	    12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11];
	var sl = [
	     11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
	    7, 6,   8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
	    11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
	      11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
	    9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6 ];
	var sr = [
	    8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
	    9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
	    9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
	    15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
	    8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11 ];

	var hl =  [ 0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E];
	var hr =  [ 0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000];

	var bytesToWords = function (bytes) {
	  var words = [];
	  for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
	    words[b >>> 5] |= bytes[i] << (24 - b % 32);
	  }
	  return words;
	};

	var wordsToBytes = function (words) {
	  var bytes = [];
	  for (var b = 0; b < words.length * 32; b += 8) {
	    bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
	  }
	  return bytes;
	};

	var processBlock = function (H, M, offset) {

	  // Swap endian
	  for (var i = 0; i < 16; i++) {
	    var offset_i = offset + i;
	    var M_offset_i = M[offset_i];

	    // Swap
	    M[offset_i] = (
	        (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
	        (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
	    );
	  }

	  // Working variables
	  var al, bl, cl, dl, el;
	  var ar, br, cr, dr, er;

	  ar = al = H[0];
	  br = bl = H[1];
	  cr = cl = H[2];
	  dr = dl = H[3];
	  er = el = H[4];
	  // Computation
	  var t;
	  for (var i = 0; i < 80; i += 1) {
	    t = (al +  M[offset+zl[i]])|0;
	    if (i<16){
	        t +=  f1(bl,cl,dl) + hl[0];
	    } else if (i<32) {
	        t +=  f2(bl,cl,dl) + hl[1];
	    } else if (i<48) {
	        t +=  f3(bl,cl,dl) + hl[2];
	    } else if (i<64) {
	        t +=  f4(bl,cl,dl) + hl[3];
	    } else {// if (i<80) {
	        t +=  f5(bl,cl,dl) + hl[4];
	    }
	    t = t|0;
	    t =  rotl(t,sl[i]);
	    t = (t+el)|0;
	    al = el;
	    el = dl;
	    dl = rotl(cl, 10);
	    cl = bl;
	    bl = t;

	    t = (ar + M[offset+zr[i]])|0;
	    if (i<16){
	        t +=  f5(br,cr,dr) + hr[0];
	    } else if (i<32) {
	        t +=  f4(br,cr,dr) + hr[1];
	    } else if (i<48) {
	        t +=  f3(br,cr,dr) + hr[2];
	    } else if (i<64) {
	        t +=  f2(br,cr,dr) + hr[3];
	    } else {// if (i<80) {
	        t +=  f1(br,cr,dr) + hr[4];
	    }
	    t = t|0;
	    t =  rotl(t,sr[i]) ;
	    t = (t+er)|0;
	    ar = er;
	    er = dr;
	    dr = rotl(cr, 10);
	    cr = br;
	    br = t;
	  }
	  // Intermediate hash value
	  t    = (H[1] + cl + dr)|0;
	  H[1] = (H[2] + dl + er)|0;
	  H[2] = (H[3] + el + ar)|0;
	  H[3] = (H[4] + al + br)|0;
	  H[4] = (H[0] + bl + cr)|0;
	  H[0] =  t;
	};

	function f1(x, y, z) {
	  return ((x) ^ (y) ^ (z));
	}

	function f2(x, y, z) {
	  return (((x)&(y)) | ((~x)&(z)));
	}

	function f3(x, y, z) {
	  return (((x) | (~(y))) ^ (z));
	}

	function f4(x, y, z) {
	  return (((x) & (z)) | ((y)&(~(z))));
	}

	function f5(x, y, z) {
	  return ((x) ^ ((y) |(~(z))));
	}

	function rotl(x,n) {
	  return (x<<n) | (x>>>(32-n));
	}

	function ripemd160(message) {
	  var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];

	  if (typeof message == 'string')
	    message = new Buffer(message, 'utf8');

	  var m = bytesToWords(message);

	  var nBitsLeft = message.length * 8;
	  var nBitsTotal = message.length * 8;

	  // Add padding
	  m[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	  m[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
	      (((nBitsTotal << 8)  | (nBitsTotal >>> 24)) & 0x00ff00ff) |
	      (((nBitsTotal << 24) | (nBitsTotal >>> 8))  & 0xff00ff00)
	  );

	  for (var i=0 ; i<m.length; i += 16) {
	    processBlock(H, m, i);
	  }

	  // Swap endian
	  for (var i = 0; i < 5; i++) {
	      // Shortcut
	    var H_i = H[i];

	    // Swap
	    H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
	          (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
	  }

	  var digestbytes = wordsToBytes(H);
	  return new Buffer(digestbytes);
	}



	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(97).Buffer))

/***/ },
/* 204 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var intSize = 4;
	var zeroBuffer = new Buffer(intSize); zeroBuffer.fill(0);
	var chrsz = 8;

	function toArray(buf, bigEndian) {
	  if ((buf.length % intSize) !== 0) {
	    var len = buf.length + (intSize - (buf.length % intSize));
	    buf = Buffer.concat([buf, zeroBuffer], len);
	  }

	  var arr = [];
	  var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
	  for (var i = 0; i < buf.length; i += intSize) {
	    arr.push(fn.call(buf, i));
	  }
	  return arr;
	}

	function toBuffer(arr, size, bigEndian) {
	  var buf = new Buffer(size);
	  var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
	  for (var i = 0; i < arr.length; i++) {
	    fn.call(buf, arr[i], i * 4, true);
	  }
	  return buf;
	}

	function hash(buf, fn, hashSize, bigEndian) {
	  if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
	  var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
	  return toBuffer(arr, hashSize, bigEndian);
	}

	module.exports = { hash: hash };

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(97).Buffer))

/***/ },
/* 205 */
/***/ function(module, exports, __webpack_require__) {

	var arraySome = __webpack_require__(212);

	/**
	 * A specialized version of `baseIsEqualDeep` for arrays with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Array} array The array to compare.
	 * @param {Array} other The other array to compare.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Function} [customizer] The function to customize comparing arrays.
	 * @param {boolean} [isLoose] Specify performing partial comparisons.
	 * @param {Array} [stackA] Tracks traversed `value` objects.
	 * @param {Array} [stackB] Tracks traversed `other` objects.
	 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
	 */
	function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
	  var index = -1,
	      arrLength = array.length,
	      othLength = other.length;

	  if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
	    return false;
	  }
	  // Ignore non-index properties.
	  while (++index < arrLength) {
	    var arrValue = array[index],
	        othValue = other[index],
	        result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

	    if (result !== undefined) {
	      if (result) {
	        continue;
	      }
	      return false;
	    }
	    // Recursively compare arrays (susceptible to call stack limits).
	    if (isLoose) {
	      if (!arraySome(other, function(othValue) {
	            return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
	          })) {
	        return false;
	      }
	    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
	      return false;
	    }
	  }
	  return true;
	}

	module.exports = equalArrays;


/***/ },
/* 206 */
/***/ function(module, exports, __webpack_require__) {

	/** `Object#toString` result references. */
	var boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    numberTag = '[object Number]',
	    regexpTag = '[object RegExp]',
	    stringTag = '[object String]';

	/**
	 * A specialized version of `baseIsEqualDeep` for comparing objects of
	 * the same `toStringTag`.
	 *
	 * **Note:** This function only supports comparing values with tags of
	 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {string} tag The `toStringTag` of the objects to compare.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalByTag(object, other, tag) {
	  switch (tag) {
	    case boolTag:
	    case dateTag:
	      // Coerce dates and booleans to numbers, dates to milliseconds and booleans
	      // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
	      return +object == +other;

	    case errorTag:
	      return object.name == other.name && object.message == other.message;

	    case numberTag:
	      // Treat `NaN` vs. `NaN` as equal.
	      return (object != +object)
	        ? other != +other
	        : object == +other;

	    case regexpTag:
	    case stringTag:
	      // Coerce regexes to strings and treat strings primitives and string
	      // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
	      return object == (other + '');
	  }
	  return false;
	}

	module.exports = equalByTag;


/***/ },
/* 207 */
/***/ function(module, exports, __webpack_require__) {

	var keys = __webpack_require__(110);

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * A specialized version of `baseIsEqualDeep` for objects with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Function} [customizer] The function to customize comparing values.
	 * @param {boolean} [isLoose] Specify performing partial comparisons.
	 * @param {Array} [stackA] Tracks traversed `value` objects.
	 * @param {Array} [stackB] Tracks traversed `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
	  var objProps = keys(object),
	      objLength = objProps.length,
	      othProps = keys(other),
	      othLength = othProps.length;

	  if (objLength != othLength && !isLoose) {
	    return false;
	  }
	  var index = objLength;
	  while (index--) {
	    var key = objProps[index];
	    if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
	      return false;
	    }
	  }
	  var skipCtor = isLoose;
	  while (++index < objLength) {
	    key = objProps[index];
	    var objValue = object[key],
	        othValue = other[key],
	        result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

	    // Recursively compare objects (susceptible to call stack limits).
	    if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
	      return false;
	    }
	    skipCtor || (skipCtor = key == 'constructor');
	  }
	  if (!skipCtor) {
	    var objCtor = object.constructor,
	        othCtor = other.constructor;

	    // Non `Object` object instances with different constructors are not equal.
	    if (objCtor != othCtor &&
	        ('constructor' in object && 'constructor' in other) &&
	        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
	          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
	      return false;
	    }
	  }
	  return true;
	}

	module.exports = equalObjects;


/***/ },
/* 208 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function (Buffer) {

	  //prototype class for hash functions
	  function Hash (blockSize, finalSize) {
	    this._block = new Buffer(blockSize) //new Uint32Array(blockSize/4)
	    this._finalSize = finalSize
	    this._blockSize = blockSize
	    this._len = 0
	    this._s = 0
	  }

	  Hash.prototype.init = function () {
	    this._s = 0
	    this._len = 0
	  }

	  Hash.prototype.update = function (data, enc) {
	    if ("string" === typeof data) {
	      enc = enc || "utf8"
	      data = new Buffer(data, enc)
	    }

	    var l = this._len += data.length
	    var s = this._s = (this._s || 0)
	    var f = 0
	    var buffer = this._block

	    while (s < l) {
	      var t = Math.min(data.length, f + this._blockSize - (s % this._blockSize))
	      var ch = (t - f)

	      for (var i = 0; i < ch; i++) {
	        buffer[(s % this._blockSize) + i] = data[i + f]
	      }

	      s += ch
	      f += ch

	      if ((s % this._blockSize) === 0) {
	        this._update(buffer)
	      }
	    }
	    this._s = s

	    return this
	  }

	  Hash.prototype.digest = function (enc) {
	    // Suppose the length of the message M, in bits, is l
	    var l = this._len * 8

	    // Append the bit 1 to the end of the message
	    this._block[this._len % this._blockSize] = 0x80

	    // and then k zero bits, where k is the smallest non-negative solution to the equation (l + 1 + k) === finalSize mod blockSize
	    this._block.fill(0, this._len % this._blockSize + 1)

	    if (l % (this._blockSize * 8) >= this._finalSize * 8) {
	      this._update(this._block)
	      this._block.fill(0)
	    }

	    // to this append the block which is equal to the number l written in binary
	    // TODO: handle case where l is > Math.pow(2, 29)
	    this._block.writeInt32BE(l, this._blockSize - 4)

	    var hash = this._update(this._block) || this._hash()

	    return enc ? hash.toString(enc) : hash
	  }

	  Hash.prototype._update = function () {
	    throw new Error('_update must be implemented by subclass')
	  }

	  return Hash
	}


/***/ },
/* 209 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
	 * in FIPS PUB 180-1
	 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 * Distributed under the BSD License
	 * See http://pajhome.org.uk/crypt/md5 for details.
	 */

	var inherits = __webpack_require__(145).inherits

	module.exports = function (Buffer, Hash) {

	  var A = 0|0
	  var B = 4|0
	  var C = 8|0
	  var D = 12|0
	  var E = 16|0

	  var W = new (typeof Int32Array === 'undefined' ? Array : Int32Array)(80)

	  var POOL = []

	  function Sha1 () {
	    if(POOL.length)
	      return POOL.pop().init()

	    if(!(this instanceof Sha1)) return new Sha1()
	    this._w = W
	    Hash.call(this, 16*4, 14*4)

	    this._h = null
	    this.init()
	  }

	  inherits(Sha1, Hash)

	  Sha1.prototype.init = function () {
	    this._a = 0x67452301
	    this._b = 0xefcdab89
	    this._c = 0x98badcfe
	    this._d = 0x10325476
	    this._e = 0xc3d2e1f0

	    Hash.prototype.init.call(this)
	    return this
	  }

	  Sha1.prototype._POOL = POOL
	  Sha1.prototype._update = function (X) {

	    var a, b, c, d, e, _a, _b, _c, _d, _e

	    a = _a = this._a
	    b = _b = this._b
	    c = _c = this._c
	    d = _d = this._d
	    e = _e = this._e

	    var w = this._w

	    for(var j = 0; j < 80; j++) {
	      var W = w[j] = j < 16 ? X.readInt32BE(j*4)
	        : rol(w[j - 3] ^ w[j -  8] ^ w[j - 14] ^ w[j - 16], 1)

	      var t = add(
	        add(rol(a, 5), sha1_ft(j, b, c, d)),
	        add(add(e, W), sha1_kt(j))
	      )

	      e = d
	      d = c
	      c = rol(b, 30)
	      b = a
	      a = t
	    }

	    this._a = add(a, _a)
	    this._b = add(b, _b)
	    this._c = add(c, _c)
	    this._d = add(d, _d)
	    this._e = add(e, _e)
	  }

	  Sha1.prototype._hash = function () {
	    if(POOL.length < 100) POOL.push(this)
	    var H = new Buffer(20)
	    //console.log(this._a|0, this._b|0, this._c|0, this._d|0, this._e|0)
	    H.writeInt32BE(this._a|0, A)
	    H.writeInt32BE(this._b|0, B)
	    H.writeInt32BE(this._c|0, C)
	    H.writeInt32BE(this._d|0, D)
	    H.writeInt32BE(this._e|0, E)
	    return H
	  }

	  /*
	   * Perform the appropriate triplet combination function for the current
	   * iteration
	   */
	  function sha1_ft(t, b, c, d) {
	    if(t < 20) return (b & c) | ((~b) & d);
	    if(t < 40) return b ^ c ^ d;
	    if(t < 60) return (b & c) | (b & d) | (c & d);
	    return b ^ c ^ d;
	  }

	  /*
	   * Determine the appropriate additive constant for the current iteration
	   */
	  function sha1_kt(t) {
	    return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
	           (t < 60) ? -1894007588 : -899497514;
	  }

	  /*
	   * Add integers, wrapping at 2^32. This uses 16-bit operations internally
	   * to work around bugs in some JS interpreters.
	   * //dominictarr: this is 10 years old, so maybe this can be dropped?)
	   *
	   */
	  function add(x, y) {
	    return (x + y ) | 0
	  //lets see how this goes on testling.
	  //  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	  //  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	  //  return (msw << 16) | (lsw & 0xFFFF);
	  }

	  /*
	   * Bitwise rotate a 32-bit number to the left.
	   */
	  function rol(num, cnt) {
	    return (num << cnt) | (num >>> (32 - cnt));
	  }

	  return Sha1
	}


/***/ },
/* 210 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
	 * in FIPS 180-2
	 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 *
	 */

	var inherits = __webpack_require__(145).inherits

	module.exports = function (Buffer, Hash) {

	  var K = [
	      0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
	      0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
	      0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
	      0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
	      0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
	      0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
	      0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
	      0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
	      0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
	      0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
	      0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
	      0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
	      0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
	      0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
	      0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
	      0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
	    ]

	  var W = new Array(64)

	  function Sha256() {
	    this.init()

	    this._w = W //new Array(64)

	    Hash.call(this, 16*4, 14*4)
	  }

	  inherits(Sha256, Hash)

	  Sha256.prototype.init = function () {

	    this._a = 0x6a09e667|0
	    this._b = 0xbb67ae85|0
	    this._c = 0x3c6ef372|0
	    this._d = 0xa54ff53a|0
	    this._e = 0x510e527f|0
	    this._f = 0x9b05688c|0
	    this._g = 0x1f83d9ab|0
	    this._h = 0x5be0cd19|0

	    this._len = this._s = 0

	    return this
	  }

	  function S (X, n) {
	    return (X >>> n) | (X << (32 - n));
	  }

	  function R (X, n) {
	    return (X >>> n);
	  }

	  function Ch (x, y, z) {
	    return ((x & y) ^ ((~x) & z));
	  }

	  function Maj (x, y, z) {
	    return ((x & y) ^ (x & z) ^ (y & z));
	  }

	  function Sigma0256 (x) {
	    return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
	  }

	  function Sigma1256 (x) {
	    return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
	  }

	  function Gamma0256 (x) {
	    return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
	  }

	  function Gamma1256 (x) {
	    return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
	  }

	  Sha256.prototype._update = function(M) {

	    var W = this._w
	    var a, b, c, d, e, f, g, h
	    var T1, T2

	    a = this._a | 0
	    b = this._b | 0
	    c = this._c | 0
	    d = this._d | 0
	    e = this._e | 0
	    f = this._f | 0
	    g = this._g | 0
	    h = this._h | 0

	    for (var j = 0; j < 64; j++) {
	      var w = W[j] = j < 16
	        ? M.readInt32BE(j * 4)
	        : Gamma1256(W[j - 2]) + W[j - 7] + Gamma0256(W[j - 15]) + W[j - 16]

	      T1 = h + Sigma1256(e) + Ch(e, f, g) + K[j] + w

	      T2 = Sigma0256(a) + Maj(a, b, c);
	      h = g; g = f; f = e; e = d + T1; d = c; c = b; b = a; a = T1 + T2;
	    }

	    this._a = (a + this._a) | 0
	    this._b = (b + this._b) | 0
	    this._c = (c + this._c) | 0
	    this._d = (d + this._d) | 0
	    this._e = (e + this._e) | 0
	    this._f = (f + this._f) | 0
	    this._g = (g + this._g) | 0
	    this._h = (h + this._h) | 0

	  };

	  Sha256.prototype._hash = function () {
	    var H = new Buffer(32)

	    H.writeInt32BE(this._a,  0)
	    H.writeInt32BE(this._b,  4)
	    H.writeInt32BE(this._c,  8)
	    H.writeInt32BE(this._d, 12)
	    H.writeInt32BE(this._e, 16)
	    H.writeInt32BE(this._f, 20)
	    H.writeInt32BE(this._g, 24)
	    H.writeInt32BE(this._h, 28)

	    return H
	  }

	  return Sha256

	}


/***/ },
/* 211 */
/***/ function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(145).inherits

	module.exports = function (Buffer, Hash) {
	  var K = [
	    0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
	    0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
	    0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
	    0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
	    0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
	    0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
	    0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
	    0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
	    0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
	    0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
	    0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
	    0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
	    0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
	    0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
	    0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
	    0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
	    0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
	    0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
	    0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
	    0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
	    0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
	    0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
	    0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
	    0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
	    0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
	    0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
	    0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
	    0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
	    0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
	    0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
	    0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
	    0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
	    0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
	    0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
	    0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
	    0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
	    0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
	    0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
	    0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
	    0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
	  ]

	  var W = new Array(160)

	  function Sha512() {
	    this.init()
	    this._w = W

	    Hash.call(this, 128, 112)
	  }

	  inherits(Sha512, Hash)

	  Sha512.prototype.init = function () {

	    this._a = 0x6a09e667|0
	    this._b = 0xbb67ae85|0
	    this._c = 0x3c6ef372|0
	    this._d = 0xa54ff53a|0
	    this._e = 0x510e527f|0
	    this._f = 0x9b05688c|0
	    this._g = 0x1f83d9ab|0
	    this._h = 0x5be0cd19|0

	    this._al = 0xf3bcc908|0
	    this._bl = 0x84caa73b|0
	    this._cl = 0xfe94f82b|0
	    this._dl = 0x5f1d36f1|0
	    this._el = 0xade682d1|0
	    this._fl = 0x2b3e6c1f|0
	    this._gl = 0xfb41bd6b|0
	    this._hl = 0x137e2179|0

	    this._len = this._s = 0

	    return this
	  }

	  function S (X, Xl, n) {
	    return (X >>> n) | (Xl << (32 - n))
	  }

	  function Ch (x, y, z) {
	    return ((x & y) ^ ((~x) & z));
	  }

	  function Maj (x, y, z) {
	    return ((x & y) ^ (x & z) ^ (y & z));
	  }

	  Sha512.prototype._update = function(M) {

	    var W = this._w
	    var a, b, c, d, e, f, g, h
	    var al, bl, cl, dl, el, fl, gl, hl

	    a = this._a | 0
	    b = this._b | 0
	    c = this._c | 0
	    d = this._d | 0
	    e = this._e | 0
	    f = this._f | 0
	    g = this._g | 0
	    h = this._h | 0

	    al = this._al | 0
	    bl = this._bl | 0
	    cl = this._cl | 0
	    dl = this._dl | 0
	    el = this._el | 0
	    fl = this._fl | 0
	    gl = this._gl | 0
	    hl = this._hl | 0

	    for (var i = 0; i < 80; i++) {
	      var j = i * 2

	      var Wi, Wil

	      if (i < 16) {
	        Wi = W[j] = M.readInt32BE(j * 4)
	        Wil = W[j + 1] = M.readInt32BE(j * 4 + 4)

	      } else {
	        var x  = W[j - 15*2]
	        var xl = W[j - 15*2 + 1]
	        var gamma0  = S(x, xl, 1) ^ S(x, xl, 8) ^ (x >>> 7)
	        var gamma0l = S(xl, x, 1) ^ S(xl, x, 8) ^ S(xl, x, 7)

	        x  = W[j - 2*2]
	        xl = W[j - 2*2 + 1]
	        var gamma1  = S(x, xl, 19) ^ S(xl, x, 29) ^ (x >>> 6)
	        var gamma1l = S(xl, x, 19) ^ S(x, xl, 29) ^ S(xl, x, 6)

	        // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
	        var Wi7  = W[j - 7*2]
	        var Wi7l = W[j - 7*2 + 1]

	        var Wi16  = W[j - 16*2]
	        var Wi16l = W[j - 16*2 + 1]

	        Wil = gamma0l + Wi7l
	        Wi  = gamma0  + Wi7 + ((Wil >>> 0) < (gamma0l >>> 0) ? 1 : 0)
	        Wil = Wil + gamma1l
	        Wi  = Wi  + gamma1  + ((Wil >>> 0) < (gamma1l >>> 0) ? 1 : 0)
	        Wil = Wil + Wi16l
	        Wi  = Wi  + Wi16 + ((Wil >>> 0) < (Wi16l >>> 0) ? 1 : 0)

	        W[j] = Wi
	        W[j + 1] = Wil
	      }

	      var maj = Maj(a, b, c)
	      var majl = Maj(al, bl, cl)

	      var sigma0h = S(a, al, 28) ^ S(al, a, 2) ^ S(al, a, 7)
	      var sigma0l = S(al, a, 28) ^ S(a, al, 2) ^ S(a, al, 7)
	      var sigma1h = S(e, el, 14) ^ S(e, el, 18) ^ S(el, e, 9)
	      var sigma1l = S(el, e, 14) ^ S(el, e, 18) ^ S(e, el, 9)

	      // t1 = h + sigma1 + ch + K[i] + W[i]
	      var Ki = K[j]
	      var Kil = K[j + 1]

	      var ch = Ch(e, f, g)
	      var chl = Ch(el, fl, gl)

	      var t1l = hl + sigma1l
	      var t1 = h + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0)
	      t1l = t1l + chl
	      t1 = t1 + ch + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0)
	      t1l = t1l + Kil
	      t1 = t1 + Ki + ((t1l >>> 0) < (Kil >>> 0) ? 1 : 0)
	      t1l = t1l + Wil
	      t1 = t1 + Wi + ((t1l >>> 0) < (Wil >>> 0) ? 1 : 0)

	      // t2 = sigma0 + maj
	      var t2l = sigma0l + majl
	      var t2 = sigma0h + maj + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0)

	      h  = g
	      hl = gl
	      g  = f
	      gl = fl
	      f  = e
	      fl = el
	      el = (dl + t1l) | 0
	      e  = (d + t1 + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0
	      d  = c
	      dl = cl
	      c  = b
	      cl = bl
	      b  = a
	      bl = al
	      al = (t1l + t2l) | 0
	      a  = (t1 + t2 + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0
	    }

	    this._al = (this._al + al) | 0
	    this._bl = (this._bl + bl) | 0
	    this._cl = (this._cl + cl) | 0
	    this._dl = (this._dl + dl) | 0
	    this._el = (this._el + el) | 0
	    this._fl = (this._fl + fl) | 0
	    this._gl = (this._gl + gl) | 0
	    this._hl = (this._hl + hl) | 0

	    this._a = (this._a + a + ((this._al >>> 0) < (al >>> 0) ? 1 : 0)) | 0
	    this._b = (this._b + b + ((this._bl >>> 0) < (bl >>> 0) ? 1 : 0)) | 0
	    this._c = (this._c + c + ((this._cl >>> 0) < (cl >>> 0) ? 1 : 0)) | 0
	    this._d = (this._d + d + ((this._dl >>> 0) < (dl >>> 0) ? 1 : 0)) | 0
	    this._e = (this._e + e + ((this._el >>> 0) < (el >>> 0) ? 1 : 0)) | 0
	    this._f = (this._f + f + ((this._fl >>> 0) < (fl >>> 0) ? 1 : 0)) | 0
	    this._g = (this._g + g + ((this._gl >>> 0) < (gl >>> 0) ? 1 : 0)) | 0
	    this._h = (this._h + h + ((this._hl >>> 0) < (hl >>> 0) ? 1 : 0)) | 0
	  }

	  Sha512.prototype._hash = function () {
	    var H = new Buffer(64)

	    function writeInt64BE(h, l, offset) {
	      H.writeInt32BE(h, offset)
	      H.writeInt32BE(l, offset + 4)
	    }

	    writeInt64BE(this._a, this._al, 0)
	    writeInt64BE(this._b, this._bl, 8)
	    writeInt64BE(this._c, this._cl, 16)
	    writeInt64BE(this._d, this._dl, 24)
	    writeInt64BE(this._e, this._el, 32)
	    writeInt64BE(this._f, this._fl, 40)
	    writeInt64BE(this._g, this._gl, 48)
	    writeInt64BE(this._h, this._hl, 56)

	    return H
	  }

	  return Sha512

	}


/***/ },
/* 212 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A specialized version of `_.some` for arrays without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {boolean} Returns `true` if any element passes the predicate check,
	 *  else `false`.
	 */
	function arraySome(array, predicate) {
	  var index = -1,
	      length = array.length;

	  while (++index < length) {
	    if (predicate(array[index], index, array)) {
	      return true;
	    }
	  }
	  return false;
	}

	module.exports = arraySome;


/***/ }
/******/ ])
});
;