(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("lodash"), require("crypto"));
	else if(typeof define === 'function' && define.amd)
		define(["lodash", "crypto"], factory);
	else if(typeof exports === 'object')
		exports["Knex"] = factory(require("lodash"), require("crypto"));
	else
		root["Knex"] = factory(root["_"], root["crypto"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_8__, __WEBPACK_EXTERNAL_MODULE_81__) {
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

	module.exports = __webpack_require__(1)

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	// Knex.js  0.8.0
	// --------------
	//     (c) 2014 Tim Griesser
	//     Knex may be freely distributed under the MIT license.
	//     For details and documentation:
	//     http://knexjs.org

	'use strict';

	var Raw            = __webpack_require__(2)
	var warn           = __webpack_require__(3).warn
	var Client         = __webpack_require__(4)

	var makeClient     = __webpack_require__(5)
	var makeKnex       = __webpack_require__(6)
	var assign         = __webpack_require__(23)

	function Knex(config) {
	  if (typeof config === 'string') {
	    return new Knex(assign(parseUrl(config), arguments[2]))
	  }
	  var Dialect;
	  if (arguments.length === 0 || (!config.client && !config.dialect)) {
	    Dialect = makeClient(Client)
	  } else {
	    var clientName = config.client || config.dialect
	    Dialect = makeClient(__webpack_require__(7)("./" + (aliases[clientName] || clientName) + '/index.js'))
	  }
	  return makeKnex(new Dialect(config))
	}

	// Run a "raw" query, though we can't do anything with it other than put
	// it in a query statement.
	Knex.raw = function(sql, bindings) {
	  return new Raw({}).set(sql, bindings)
	}

	// Create a new "knex" instance with the appropriate configured client.
	Knex.initialize = function(config) {
	  warn('knex.initialize is deprecated, pass your config object directly to the knex module')
	  return new Knex(config)
	}

	function parseUrl() {

	}

	// The client names we'll allow in the `{name: lib}` pairing.
	var aliases = {
	  'mariadb'       : 'maria',
	  'mariasql'      : 'maria',
	  'pg'            : 'postgres',
	  'sqlite'        : 'sqlite3'
	};

	module.exports = Knex

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Raw
	// -------
	var _            = __webpack_require__(8)
	var inherits     = __webpack_require__(41)
	var EventEmitter = __webpack_require__(31).EventEmitter
	var assign       = __webpack_require__(23);

	function Raw(client) {
	  this.sql      = ''
	  this.bindings = []
	  this.client   = client
	}
	inherits(Raw, EventEmitter)

	assign(Raw.prototype, {

	  set: function(sql, bindings) {
	    if (sql && sql.toSQL) {
	      var output = sql.toSQL()
	      sql = output.sql
	      bindings = output.bindings
	    }
	    this.sql = sql + ''
	    this.bindings = ([]).concat(bindings === undefined ? [] : bindings)
	    this.interpolateBindings()
	    this._debug       = void 0
	    return this
	  },

	  // Wraps the current sql with `before` and `after`.
	  wrap: function(before, after) {
	    this.sql = before + this.sql + after
	    return this
	  },

	  // Calls `toString` on the Knex object.
	  toString: function() {
	    return this.toQuery()
	  },

	  // Ensure all Raw / builder bindings are mixed-in to the ? placeholders
	  // as appropriate.
	  interpolateBindings: function() {
	    var replacements = []
	    this.bindings = _.reduce(this.bindings, function(accum, param, index) {
	      var innerBindings = [param]
	      if (param && param.toSQL) {
	        var result    = this.splicer(param, index)
	        innerBindings = result.bindings
	        replacements.push(result.replacer)
	      }
	      return accum.concat(innerBindings)
	    }, [], this)

	    // we run this in reverse order, because ? concats earlier in the
	    // query string will disrupt indices for later ones
	    this.sql = _.reduce(replacements.reverse(), function(accum, fn) {
	      return fn(accum)
	    }, this.sql.split('?')).join('?')
	  },

	  // Returns a replacer function that splices into the i'th
	  // ? in the sql string the inner raw's sql,
	  // and the bindings associated with it
	  splicer: function(raw, i) {
	    var obj = raw.toSQL()

	    // the replacer function assumes that the sql has been
	    // already sql.split('?') and will be arr.join('?')
	    var replacer = function(arr) {
	      arr[i] = arr[i] + obj.sql + arr[i + 1]
	      arr.splice(i + 1, 1)
	      return arr
	    }

	    return {
	      replacer: replacer,
	      bindings: obj.bindings
	    }
	  },

	  // Returns the raw sql for the query.
	  toSQL: function() {
	    return {
	      sql: this.sql,
	      method: 'raw',
	      bindings: this.bindings
	    }
	  }

	})

	// Allow the `Raw` object to be utilized with full access to the relevant
	// promise API.
	__webpack_require__(22)(Raw)

	module.exports = Raw


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	var _     = __webpack_require__(8)
	var chalk = __webpack_require__(29)

	var helpers = {

	  // Pick off the attributes from only the current layer of the object.
	  skim: function(data) {
	    return _.map(data, function(obj) {
	      return _.pick(obj, _.keys(obj));
	    });
	  },

	  // Check if the first argument is an array, otherwise
	  // uses all arguments as an array.
	  normalizeArr: function() {
	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }
	    if (Array.isArray(args[0])) {
	      return args[0];
	    }
	    return args;
	  },

	  error: function(msg) {
	    console.log(chalk.red('Knex:Error ' + msg))
	  },

	  // Used to signify deprecated functionality.
	  deprecate: function(method, alternate) {
	    helpers.warn(method + ' is deprecated, please use ' + alternate);
	  },

	  // Used to warn about incorrect use, without error'ing
	  warn: function(msg) {
	    console.log(chalk.yellow("Knex:warning - " + msg))
	  },

	  exit: function(msg) {
	    console.log(chalk.red(msg))
	    process.exit()
	  }

	};

	module.exports = helpers;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Promise        = __webpack_require__(10)
	var helpers        = __webpack_require__(3)

	var Raw            = __webpack_require__(2)
	var Runner         = __webpack_require__(11)
	var Formatter      = __webpack_require__(12)
	var Transaction    = __webpack_require__(13)

	var QueryBuilder   = __webpack_require__(14)
	var QueryCompiler  = __webpack_require__(15)

	var SchemaBuilder  = __webpack_require__(16)
	var SchemaCompiler = __webpack_require__(17)
	var TableBuilder   = __webpack_require__(18)
	var TableCompiler  = __webpack_require__(19)
	var ColumnBuilder  = __webpack_require__(20)
	var ColumnCompiler = __webpack_require__(21)

	var Pool2          = __webpack_require__(32)
	var inherits       = __webpack_require__(41)
	var EventEmitter   = __webpack_require__(31).EventEmitter

	var assign         = __webpack_require__(23)
	var uniqueId       = __webpack_require__(24)
	var cloneDeep      = __webpack_require__(25)
	var debug          = __webpack_require__(42)('knex:client')

	// The base client provides the general structure
	// for a dialect specific client object.
	function Client(config) {
	  this.config = config
	  if (this.driverName && config.connection) {
	    this.initializeDriver()
	    this.initializePool(config)
	  }
	}
	inherits(Client, EventEmitter)

	assign(Client.prototype, {

	  Formatter: Formatter,

	  formatter: function() {
	    return new this.Formatter(this)
	  },

	  QueryBuilder: QueryBuilder,

	  queryBuilder: function() {
	    return new this.QueryBuilder(this)
	  },

	  QueryCompiler: QueryCompiler,

	  queryCompiler: function(builder) {
	    return new this.QueryCompiler(this, builder)
	  },

	  SchemaBuilder: SchemaBuilder,

	  schemaBuilder: function() {
	    return new this.SchemaBuilder(this)
	  },

	  SchemaCompiler: SchemaCompiler,

	  schemaCompiler: function(builder) {
	    return new this.SchemaCompiler(this, builder)
	  },

	  TableBuilder: TableBuilder,

	  tableBuilder: function(type, tableName, fn) {
	    return new this.TableBuilder(this, type, tableName, fn)
	  },

	  TableCompiler: TableCompiler,

	  tableCompiler: function(tableBuilder) {
	    return new this.TableCompiler(this, tableBuilder)
	  },

	  ColumnBuilder: ColumnBuilder,

	  columnBuilder: function(tableBuilder, type, args) {
	    return new this.ColumnBuilder(this, tableBuilder, type, args)
	  },

	  ColumnCompiler: ColumnCompiler,

	  columnCompiler: function(tableBuilder, columnBuilder) {
	    return new this.ColumnCompiler(this, tableBuilder, columnBuilder)
	  },

	  Runner: Runner,

	  runner: function(connection) {
	    return new this.Runner(this, connection)
	  },

	  Transaction: Transaction,

	  transaction: function() {
	    return new this.Transaction(this)
	  },

	  Raw: Raw,

	  raw: function(sql, bindings) {
	    var raw = new this.Raw(this)
	    return raw.set.apply(raw, arguments)
	  },

	  query: function(connection, obj) {
	    if (typeof obj === 'string') obj = {sql: obj}
	    this.emit('query', assign({__knexUid: connection.__knexUid}, obj))
	    return this._query.call(this, connection, obj)
	  },

	  stream: function(connection, obj, stream, options) {
	    if (typeof obj === 'string') obj = {sql: obj}
	    this.emit('query', assign({__knexUid: connection.__knexUid}, obj))
	    return this._stream.call(this, connection, obj, stream, options)
	  },

	  wrapIdentifier: function(value) {
	    return (value !== '*' ? '"' + value.replace(/"/g, '""') + '"' : '*')
	  },

	  initializeDriver: function() {
	    try {
	      this.driver = __webpack_require__(9)(this.driverName)  
	    } catch (e) {
	      helpers.exit('Knex: run\n$ npm install ' + this.driverName + ' --save')
	    }
	  },

	  Pool: Pool2,

	  initializePool: function(config) {
	    this.connectionSettings = cloneDeep(config.connection)
	    if (this.pool) this.destroy()
	    this.pool = new this.Pool(assign(this.poolDefaults(config.pool || {}), config.pool))
	    this.pool.on('error', function(err) {
	      helpers.error('Pool2 - ' + err)
	    })
	    this.pool.on('warn', function(msg) {
	      helpers.warn('Pool2 - ' + msg)
	    })
	  },

	  poolDefaults: function(poolConfig) {
	    var dispose, client = this
	    if (poolConfig.destroy) {
	      deprecate('config.pool.destroy', 'config.pool.dispose')
	      dispose = poolConfig.destroy
	    }
	    return {
	      min: 2,
	      max: 10,
	      acquire: function(callback) {
	        client.acquireRawConnection()
	          .tap(function(connection) {
	            connection.__knexUid = uniqueId('__knexUid')
	            if (poolConfig.afterCreate) {
	              return Promise.promisify(poolConfig.afterCreate)(connection)
	            }
	          })
	          .nodeify(callback)
	      },
	      dispose: function(connection, callback) {
	        if (poolConfig.beforeDestroy) {
	          poolConfig.beforeDestroy(connection, function() {
	            if (connection !== undefined) {
	              client.destroyRawConnection(connection, callback)
	            }
	          })
	        } else if (connection !== void 0) {
	          client.destroyRawConnection(connection, callback)
	        }
	      }
	    }
	  },

	  // Acquire a connection from the pool.
	  acquireConnection: function() {
	    var client = this
	    return new Promise(function(resolver, rejecter) {
	      if (!client.pool) {
	        return rejecter(new Error('There is no pool defined on the current client'))
	      }
	      client.pool.acquire(function(err, connection) {
	        if (err) return rejecter(err)
	        debug('acquiring connection from pool: %s', connection.__knexUid)
	        resolver(connection)
	      })
	    })
	  },

	  // Releases a connection back to the connection pool,
	  // returning a promise resolved when the connection is released.
	  releaseConnection: function(connection) {
	    var pool = this.pool
	    return new Promise(function(resolver, rejecter) {
	      debug('releasing connection to pool: %s', connection.__knexUid)
	      pool.release(connection)
	      resolver()
	    })
	  },

	  // Destroy the current connection pool for the client.
	  destroy: function(callback) {
	    var client = this
	    var promise = new Promise(function(resolver, rejecter) {
	      if (!client.pool) return resolver()
	      client.pool.end(function() {
	        client.pool = undefined
	        resolver()
	      })
	    })
	    // Allow either a callback or promise interface for destruction.
	    if (typeof callback === 'function') {
	      promise.nodeify(callback)
	    } else {
	      return promise
	    }
	  },

	  // Return the database being used by this client.
	  database: function() {
	    return this.databaseName || this.connectionSettings.database
	  },

	  toString: function() {
	    return '[object KnexClient]'
	  }

	})

	module.exports = Client


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var assign   = __webpack_require__(23);
	var inherits = __webpack_require__(41)

	// Ensure the client has fresh objects so we can tack onto 
	// the prototypes without mutating them globally.
	module.exports = function makeClient(ParentClient) {

	  if (typeof ParentClient.prototype === 'undefined') {
	    throw new Error('A valid parent client must be passed to makeClient')
	  }

	  function Client(config) {
	    ParentClient.call(this, config)
	  }
	  inherits(Client, ParentClient)
	  
	  function Formatter(client) {
	    Formatter.super_.call(this, client)
	  }
	  inherits(Formatter, ParentClient.prototype.Formatter)
	  
	  function QueryBuilder(client) {
	    QueryBuilder.super_.call(this, client)
	  }
	  inherits(QueryBuilder, ParentClient.prototype.QueryBuilder)

	  function SchemaBuilder(client) {
	    SchemaBuilder.super_.call(this, client)
	  }
	  inherits(SchemaBuilder, ParentClient.prototype.SchemaBuilder)

	  function SchemaCompiler(client, builder) {
	    SchemaCompiler.super_.call(this, client, builder)
	  }
	  inherits(SchemaCompiler, ParentClient.prototype.SchemaCompiler)

	  function TableBuilder(client, method, tableName, fn) {
	    TableBuilder.super_.call(this, client, method, tableName, fn)
	  }
	  inherits(TableBuilder, ParentClient.prototype.TableBuilder)

	  function TableCompiler(client, tableBuilder) {
	    TableCompiler.super_.call(this, client, tableBuilder)
	  }
	  inherits(TableCompiler, ParentClient.prototype.TableCompiler)

	  function ColumnBuilder(client, tableBuilder, type, args) {
	    ColumnBuilder.super_.call(this, client, tableBuilder, type, args)
	  }
	  inherits(ColumnBuilder, ParentClient.prototype.ColumnBuilder)

	  function ColumnCompiler(client, tableCompiler, columnBuilder) {
	    ColumnCompiler.super_.call(this, client, tableCompiler, columnBuilder)
	  }
	  inherits(ColumnCompiler, ParentClient.prototype.ColumnCompiler)

	  assign(Client.prototype, {
	    Formatter:      Formatter,
	    QueryBuilder:   QueryBuilder,
	    SchemaBuilder:  SchemaBuilder,
	    SchemaCompiler: SchemaCompiler,
	    TableBuilder:   TableBuilder,
	    TableCompiler:  TableCompiler,
	    ColumnBuilder:  ColumnBuilder,
	    ColumnCompiler: ColumnCompiler
	  })

	  Client.__proto__ = ParentClient

	  return Client
	}

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter   = __webpack_require__(31).EventEmitter
	var assign         = __webpack_require__(23);

	var Migrator       = __webpack_require__(26)
	var Seeder         = __webpack_require__(26)
	var FunctionHelper = __webpack_require__(27)
	var QueryInterface = __webpack_require__(28)
	var helpers        = __webpack_require__(3)

	module.exports = function makeKnex(client) {

	  // The object we're potentially using to kick off an initial chain.
	  function knex(tableName) {
	    var qb = knex.queryBuilder()
	    if (!tableName) {
	      helpers.warn('calling knex without a tableName is deprecated. Use knex.queryBuilder() instead.')
	    }
	    return tableName ? qb.table(tableName) : qb
	  }

	  assign(knex, {
	    
	    // A new query builder instance
	    queryBuilder: function() {
	      return client.queryBuilder()
	    },

	    raw: function() {
	      return client.raw.apply(client, arguments)
	    },

	    // Runs a new transaction, taking a container and returning a promise
	    // for when the transaction is resolved.
	    transaction: function(container) {
	      return client.transaction().run(container)
	    },

	    // Typically never needed, initializes the pool for a knex client.
	    initialize: function(config) {
	      return client.initialize(config)
	    },

	    // Convenience method for tearing down the pool.
	    destroy: function(callback) {
	      return client.destroy(callback)
	    }

	  })

	  // The `__knex__` is used if you need to duck-type check whether this
	  // is a knex builder, without a full on `instanceof` check.
	  knex.VERSION = knex.__knex__  = '0.8.0'

	  // Hook up the "knex" object as an EventEmitter.
	  var ee = new EventEmitter()
	  for (var key in ee) {
	    knex[key] = ee[key]
	  }

	  // Allow chaining methods from the root object, before
	  // any other information is specified.
	  QueryInterface.forEach(function(method) {
	    knex[method] = function() {
	      var builder = knex.queryBuilder()
	      return builder[method].apply(builder, arguments)
	    }
	  })
	  
	  knex.client = client

	  Object.defineProperties(knex, {

	    schema: {
	      get: function() {
	        return client.schemaBuilder()
	      }
	    },

	    migrate: {
	      get: function() {
	        return new Migrator(knex)
	      }
	    },

	    seed: {
	      get: function() {
	        return new Seeder(knex)
	      }
	    },

	    fn: {
	      get: function() {
	        return new FunctionHelper(client)
	      }
	    }

	  })

	  // Passthrough all "start" and "query" events to the knex object.
	  client.on('start', function(obj) {
	    knex.emit('start', obj)
	  })
	  
	  client.on('query', function(obj) {
	    knex.emit('query', obj)
	  })

	  client.makeKnex = function(client) {
	    return makeKnex(client)
	  }

	  return knex
	}

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
		"./websql/index.js": 40
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

	module.exports = __WEBPACK_EXTERNAL_MODULE_8__;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./client": 4,
		"./client.js": 4,
		"./dialects/maria/index": 33,
		"./dialects/maria/index.js": 33,
		"./dialects/mysql/index": 34,
		"./dialects/mysql/index.js": 34,
		"./dialects/mysql/query/compiler": 46,
		"./dialects/mysql/query/compiler.js": 46,
		"./dialects/mysql/schema/columncompiler": 47,
		"./dialects/mysql/schema/columncompiler.js": 47,
		"./dialects/mysql/schema/compiler": 48,
		"./dialects/mysql/schema/compiler.js": 48,
		"./dialects/mysql/schema/tablecompiler": 49,
		"./dialects/mysql/schema/tablecompiler.js": 49,
		"./dialects/mysql2/index": 35,
		"./dialects/mysql2/index.js": 35,
		"./dialects/oracle/formatter": 50,
		"./dialects/oracle/formatter.js": 50,
		"./dialects/oracle/index": 36,
		"./dialects/oracle/index.js": 36,
		"./dialects/oracle/query/compiler": 51,
		"./dialects/oracle/query/compiler.js": 51,
		"./dialects/oracle/schema/columnbuilder": 52,
		"./dialects/oracle/schema/columnbuilder.js": 52,
		"./dialects/oracle/schema/columncompiler": 53,
		"./dialects/oracle/schema/columncompiler.js": 53,
		"./dialects/oracle/schema/compiler": 54,
		"./dialects/oracle/schema/compiler.js": 54,
		"./dialects/oracle/schema/tablecompiler": 55,
		"./dialects/oracle/schema/tablecompiler.js": 55,
		"./dialects/oracle/stream": 56,
		"./dialects/oracle/stream.js": 56,
		"./dialects/oracle/transaction": 57,
		"./dialects/oracle/transaction.js": 57,
		"./dialects/oracle/utils": 58,
		"./dialects/oracle/utils.js": 58,
		"./dialects/postgres/index": 37,
		"./dialects/postgres/index.js": 37,
		"./dialects/postgres/query/compiler": 59,
		"./dialects/postgres/query/compiler.js": 59,
		"./dialects/postgres/schema/columncompiler": 60,
		"./dialects/postgres/schema/columncompiler.js": 60,
		"./dialects/postgres/schema/compiler": 61,
		"./dialects/postgres/schema/compiler.js": 61,
		"./dialects/postgres/schema/tablecompiler": 62,
		"./dialects/postgres/schema/tablecompiler.js": 62,
		"./dialects/postgres/utils": 63,
		"./dialects/postgres/utils.js": 63,
		"./dialects/sqlite3/index": 38,
		"./dialects/sqlite3/index.js": 38,
		"./dialects/sqlite3/query/compiler": 64,
		"./dialects/sqlite3/query/compiler.js": 64,
		"./dialects/sqlite3/schema/columncompiler": 65,
		"./dialects/sqlite3/schema/columncompiler.js": 65,
		"./dialects/sqlite3/schema/compiler": 66,
		"./dialects/sqlite3/schema/compiler.js": 66,
		"./dialects/sqlite3/schema/ddl": 67,
		"./dialects/sqlite3/schema/ddl.js": 67,
		"./dialects/sqlite3/schema/tablecompiler": 68,
		"./dialects/sqlite3/schema/tablecompiler.js": 68,
		"./dialects/strong-oracle/index": 39,
		"./dialects/strong-oracle/index.js": 39,
		"./dialects/websql/index": 40,
		"./dialects/websql/index.js": 40,
		"./dialects/websql/transaction": 69,
		"./dialects/websql/transaction.js": 69,
		"./formatter": 12,
		"./formatter.js": 12,
		"./functionhelper": 27,
		"./functionhelper.js": 27,
		"./helpers": 3,
		"./helpers.js": 3,
		"./index": 1,
		"./index.js": 1,
		"./interface": 22,
		"./interface.js": 22,
		"./promise": 10,
		"./promise.js": 10,
		"./query/builder": 14,
		"./query/builder.js": 14,
		"./query/compiler": 15,
		"./query/compiler.js": 15,
		"./query/joinclause": 44,
		"./query/joinclause.js": 44,
		"./query/methods": 28,
		"./query/methods.js": 28,
		"./query/string": 70,
		"./query/string.js": 70,
		"./raw": 2,
		"./raw.js": 2,
		"./runner": 11,
		"./runner.js": 11,
		"./schema/builder": 16,
		"./schema/builder.js": 16,
		"./schema/columnbuilder": 20,
		"./schema/columnbuilder.js": 20,
		"./schema/columncompiler": 21,
		"./schema/columncompiler.js": 21,
		"./schema/compiler": 17,
		"./schema/compiler.js": 17,
		"./schema/helpers": 45,
		"./schema/helpers.js": 45,
		"./schema/tablebuilder": 18,
		"./schema/tablebuilder.js": 18,
		"./schema/tablecompiler": 19,
		"./schema/tablecompiler.js": 19,
		"./transaction": 13,
		"./transaction.js": 13,
		"./util/make-client": 5,
		"./util/make-client.js": 5,
		"./util/make-knex": 6,
		"./util/make-knex.js": 6
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
	webpackContext.id = 9;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Promise   = __webpack_require__(84)();
	var deprecate = __webpack_require__(3).deprecate

	// Incase we're using an older version of bluebird
	Promise.prototype.asCallback = Promise.prototype.nodeify

	Promise.prototype.exec = function(cb) {
	  deprecate('knex.exec', 'knex.asCallback')
	  return this.nodeify(cb)
	};

	module.exports = Promise;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _       = __webpack_require__(8)
	var Promise = __webpack_require__(10)
	var helpers = __webpack_require__(3)
	var debug   = __webpack_require__(42)
	var assign  = __webpack_require__(23);

	var PassThrough;

	// The "Runner" constructor takes a "builder" (query, schema, or raw)
	// and runs through each of the query statements, calling any additional
	// "output" method provided alongside the query and bindings.
	function Runner(client, builder) {
	  this.client  = client
	  this.builder = builder
	  this.queries = []

	  // The "connection" object is set on the runner when
	  // "run" is called.
	  this.connection = void 0
	}

	assign(Runner.prototype, {

	  // "Run" the target, calling "toSQL" on the builder, returning
	  // an object or array of queries to run, each of which are run on
	  // a single connection.
	  run: function() {
	    var runner = this

	    return Promise.using(this.ensureConnection(), function(connection) {
	      runner.connection = connection;

	      // Emit a "start" event on both the builder and the client,
	      // allowing us to listen in on any events. We fire on the "client"
	      // before building the SQL, and on the builder after building the SQL
	      // in case we want to determine at how long it actually
	      // took to build the query.
	      runner.client.emit('start', runner.builder);
	      var sql = runner.builder.toSQL();
	      runner.builder.emit('start', runner.builder);

	      if (_.isArray(sql)) {
	        return runner.queryArray(sql);
	      }
	      return runner.query(sql);

	    })

	    // If there are any "error" listeners, we fire an error event
	    // and then re-throw the error to be eventually handled by
	    // the promise chain. Useful if you're wrapping in a custom `Promise`.
	    .catch(function(err) {
	      if (runner.builder._events && runner.builder._events.error) {
	        runner.builder.emit('error', err);
	      }
	      throw err;
	    })

	    // Fire a single "end" event on the builder when
	    // all queries have successfully completed.
	    .tap(function() {
	      runner.builder.emit('end');
	    })

	  },

	  // Stream the result set, by passing through to the dialect's streaming
	  // capabilities. If the options are
	  stream: function(options, handler) {
	    
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
	    PassThrough = PassThrough || __webpack_require__(82).PassThrough;
	    
	    var runner = this;
	    var stream  = new PassThrough({objectMode: true});
	    var promise = Promise.using(this.ensureConnection(), function(connection) {
	      runner.connection = connection;
	      var sql = runner.builder.toSQL()
	      var err = new Error('The stream may only be used with a single query statement.');
	      if (_.isArray(sql)) {
	        if (hasHandler) throw err;
	        stream.emit('error', err);
	      }
	      return sql;
	    })
	    .then(function(sql) {
	      return runner.client.stream(runner.connection, sql, stream, options);
	    })

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
	  pipe: function(writable) {
	    return this.stream().pipe(writable);
	  },

	  // "Runs" a query, returning a promise. All queries specified by the builder are guaranteed
	  // to run in sequence, and on the same connection, especially helpful when schema building
	  // and dealing with foreign key constraints, etc.
	  query: Promise.method(function(obj) {
	    this.builder.emit('query', assign({__knexUid: this.connection.__knexUid}, obj))
	    var runner = this
	    return this.client.query(this.connection, obj)
	      .then(function(resp) {
	        return runner.client.processResponse(resp, runner)
	      });
	  }),

	  // In the case of the "schema builder" we call `queryArray`, which runs each
	  // of the queries in sequence.
	  queryArray: function(queries) {
	    return queries.length === 1 ? this.query(queries[0]) : Promise.bind(this)
	      .return(queries)
	      .reduce(function(memo, query) {
	        return this.query(query).then(function(resp) {
	          memo.push(resp)
	          return memo;
	        });
	      }, [])
	  },

	  // Check whether there's a transaction flag, and that it has a connection.
	  ensureConnection: function() {
	    var runner = this
	    return Promise.try(function() {
	      return runner.connection || runner.client.acquireConnection()
	    }).disposer(function() {
	      runner.client.releaseConnection(runner.connection)
	    })
	  }

	})

	module.exports = Runner;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var QueryBuilder = __webpack_require__(14)
	var Raw          = __webpack_require__(2)
	var assign       = __webpack_require__(23)
	var transform    = __webpack_require__(43)

	function Formatter(client) {
	  this.client       = client
	  this.bindings     = []
	}

	assign(Formatter.prototype, {

	  // Accepts a string or array of columns to wrap as appropriate.
	  columnize: function(target) {
	    var columns = typeof target === 'string' ? [target] : target
	    var str = '', i = -1;
	    while (++i < columns.length) {
	      if (i > 0) str += ', '
	      str += this.wrap(columns[i])
	    }
	    return str
	  },

	  // Turns a list of values into a list of ?'s, joining them with commas unless
	  // a "joining" value is specified (e.g. ' and ')
	  parameterize: function(values, notSetValue) {
	    if (typeof values === 'function') return this.parameter(values);
	    values  = Array.isArray(values) ? values : [values];
	    var str = '', i = -1;
	    while (++i < values.length) {
	      if (i > 0) str += ', '
	      str += this.parameter(values[i] === undefined ? notSetValue : values[i])
	    }
	    return str;
	  },

	  // Checks whether a value is a function... if it is, we compile it
	  // otherwise we check whether it's a raw
	  parameter: function(value, notSetValue) {
	    if (typeof value === 'function') {
	      return this.outputQuery(this.compileCallback(value), true);
	    }
	    return this.unwrapRaw(value, true) || '?';
	  },

	  unwrapRaw: function(value, isParameter) {
	    if (value instanceof QueryBuilder) {
	      var query = this.client.queryCompiler(value).toSQL()
	      if (query.bindings) {
	        this.bindings = this.bindings.concat(query.bindings);
	      }
	      return this.outputQuery(query, isParameter);
	    }
	    if (value instanceof Raw) {
	      if (value.bindings) {
	        this.bindings = this.bindings.concat(value.bindings);
	      }
	      return value.sql;
	    }
	    if (isParameter) {
	      this.bindings.push(value);
	    }
	  },

	  rawOrFn: function(value, method) {
	    if (typeof value === 'function') {
	      return this.outputQuery(this.compileCallback(value, method));
	    }
	    return this.unwrapRaw(value) || '';
	  },

	  // Puts the appropriate wrapper around a value depending on the database
	  // engine, unless it's a knex.raw value, in which case it's left alone.
	  wrap: function(value) {
	    var raw;
	    if (typeof value === 'function') {
	      return this.outputQuery(this.compileCallback(value), true);
	    }
	    raw = this.unwrapRaw(value);
	    if (raw) return raw;
	    if (typeof value === 'number') return value;
	    return this._wrapString(value + '');
	  },

	  alias: function(first, second) {
	    return first + ' as ' + second;
	  },

	  // The operator method takes a value and returns something or other.
	  operator: function(value) {
	    var raw = this.unwrapRaw(value);
	    if (raw) return raw;
	    if (operators[(value || '').toLowerCase()] !== true) {
	      throw new TypeError('The operator "' + value + '" is not permitted');
	    }
	    return value;
	  },

	  // Specify the direction of the ordering.
	  direction: function(value) {
	    var raw = this.unwrapRaw(value);
	    if (raw) return raw;
	    return orderBys.indexOf((value || '').toLowerCase()) !== -1 ? value : 'asc';
	  },

	  // Compiles a callback using the query builder.
	  compileCallback: function(callback, method) {
	    var client = this.client;

	    // Build the callback
	    var builder  = client.queryBuilder();
	    callback.call(builder, builder);

	    // Compile the callback, using the current formatter (to track all bindings).
	    var compiler = client.queryCompiler(builder);
	    compiler.formatter = this;

	    // Return the compiled & parameterized sql.
	    return compiler.toSQL(method || 'select');
	  },

	  // Ensures the query is aliased if necessary.
	  outputQuery: function(compiled, isParameter) {
	    var sql = compiled.sql || '';
	    if (sql) {
	      if (compiled.method === 'select' && (isParameter || compiled.as)) {
	        sql = '(' + sql + ')';
	        if (compiled.as) return this.alias(sql, this.wrap(compiled.as))
	      }
	    }
	    return sql;
	  },

	  // Coerce to string to prevent strange errors when it's not a string.
	  _wrapString: function(value) {
	    var segments, asIndex = value.toLowerCase().indexOf(' as ');
	    if (asIndex !== -1) {
	      var first  = value.slice(0, asIndex)
	      var second = value.slice(asIndex + 4)
	      return this.alias(this.wrap(first), this.wrap(second))
	    }
	    var i = -1, wrapped = [];
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
	var orderBys  = ['asc', 'desc'];

	// Turn this into a lookup map
	var operators = transform([
	  '=', '<', '>', '<=', '>=', '<>', '!=', 'like', 
	  'not like', 'between', 'ilike', '&', '|', '^', '<<', '>>', 
	  'rlike', 'regexp', 'not regexp', '~', '~*', '!~', '!~*', 
	  '#', '&&', '@>', '<@', '||'
	], function(obj, key) {
	  obj[key] = true
	}, Object.create(null))

	module.exports = Formatter;


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Transaction
	// -------
	var Promise      = __webpack_require__(10)
	var EventEmitter = __webpack_require__(31).EventEmitter
	var inherits     = __webpack_require__(41)

	var makeKnex     = __webpack_require__(6)

	var assign       = __webpack_require__(23)
	var uniqueId     = __webpack_require__(24);

	var debug        = __webpack_require__(42)
	var debugTx      = debug('knex:tx')
	var debugQuery   = debug('knex:query')

	// Container for a Promise
	function Transaction(client, outerTx) {
	  
	  this.txid      = uniqueId('trx')
	  this.client    = client
	  this._outerTx  = outerTx  

	  debugTx('%s: Starting %s transaction', this.txid, outerTx ? 'nested' : 'top level')
	  
	  this._dfd = new Promise(function(resolver, rejecter) {
	    this._resolver = resolver
	    this._rejecter = rejecter
	  }.bind(this))

	  this._completed  = false

	  // If there is more than one child transaction,
	  // we queue them, executing each when the previous completes.
	  this._trxQueue   = []

	  if (outerTx) {
	    var len = outerTx._trxQueue.length
	    if (len > 0) {
	      debugTx('%s: Queueing transaction in %s index: %d', this.txid, outerTx.txid, len)
	      this._queue = outerTx._trxQueue[len - 1].finally(function() {
	        return true
	      })
	    }
	    outerTx._trxQueue.push(this._dfd)
	  }

	  this._queue = this._queue || Promise.resolve(true)
	}
	inherits(Transaction, EventEmitter)

	assign(Transaction.prototype, {

	  isCancelled: function() {
	    return this._cancelled || this._outerTx && this._outerTx.isCancelled() || false
	  },

	  run: function(container, config) {
	    config = config || {}
	    var t      = this
	    var client = this.client

	    Promise.using(this.acquireConnection(config), function(connection) {

	      var trxClient = t.makeClient(connection)
	      var init = client.transacting ? t.savepoint(connection) : t.begin(connection)
	      
	      return init.then(function() {
	        return t.makeTransactor(connection, trxClient)
	      })
	      .tap(function(transactor) {
	        if (client.transacting) {
	          return t.savepoint(transactor)
	        }
	        return transactor.client
	      })
	      .then(function(transactor) {
	        
	        var result = container(transactor)

	        // If we've returned a "thenable" from the transaction container,
	        // and it's got the transaction object we're running for this, assume
	        // the rollback and commit are chained to this object's success / failure.
	        if (result && result.then && typeof result.then === 'function') {
	          result.then(function(val) { 
	            debugTx('%s: promise-resolved', t.txid)
	            transactor.commit(val) 
	          }).catch(function(err) {
	            debugTx('%s: catch-rollback', t.txid)
	            transactor.rollback(err)
	          })
	        }
	      })

	    })

	    return this;
	  },

	  acquireConnection: function(config) {
	    var t = this
	    return Promise.try(function() {
	      return config.connection || t.client.acquireConnection()  
	    }).disposer(function(connection) {
	      if (!config.connection) {
	        t.client.releaseConnection(connection)
	      } else {
	        debugTx('%s: not releasing external connection', t.txid)
	      }
	    })
	  },

	  begin: function(conn) {
	    return this.query(conn, 'begin;')
	  },

	  savepoint: function(conn) {
	    return this.query(conn, 'savepoint ' + this.txid + ';')
	  },

	  commit: function(conn, value) {
	    return this.query(conn, 'commit;', 1, value)
	  },

	  release: function(conn, value) {
	    return this.query(conn, 'release ' + this.txid + ';', 1, value)
	  },

	  rollback: function(conn, error) {
	    return this.query(conn, 'rollback;', 2, error)
	  },

	  rollbackTo: function(conn, error) {
	    return this.query(conn, 'rollback to ' + this.txid + ';', 2, error)
	  },

	  query: function(conn, sql, status, value) {
	    
	    if (this.isCancelled()) {
	      return this._skipping(sql)
	    }
	    
	    if (status === 1 || status === 2) {
	      this._completed = true
	    }

	    if (typeof sql === 'string') sql = {sql: sql}

	    debugQuery('%s: query %s', this.txid, sql.sql.slice(0, 300))

	    this.emit('query', assign({__knexUid: conn.__knexUid}, sql))

	    var t = this
	    return this.client._query(conn, sql)
	      .tap(function() {
	        if (status === 1) t._resolver(value)
	        if (status === 2) t._rejecter(value)
	      })
	  },

	  stream: function(conn, sql, stream, options) {
	    
	    debugQuery('%s: streaming', this.txid)

	    if (this.isCancelled()) {
	      return this._skipping(sql)
	    }

	    if (typeof sql === 'string') sql = {sql: sql}
	    this.emit('query:stream', assign({__knexUid: conn.__knexUid}, sql))

	    return this.client.stream(conn, sql, stream, options)
	  },

	  _skipping: function() {
	    return Promise.reject(new Error('Transaction ' + this.txid + ' has already been released skipping: ' + sql))
	  },

	  // The transactor is a full featured knex object, with a "commit", 
	  // a "rollback" and a "savepoint" function. The "savepoint" is just
	  // sugar for creating a new transaction. If the rollback is run
	  // inside a savepoint, it rolls back to the last savepoint - otherwise
	  // it rolls back the transaction.
	  makeTransactor: function(connection, trxClient) {
	    var t = this
	    var transactor = makeKnex(trxClient)

	    transactor.transaction = function(container, options) {
	      return trxClient.transaction(t).run(container, options)
	    }  
	    transactor.savepoint = function(container, options) {
	      return transactor.transaction(container, options)
	    }

	    if (this.client.transacting) {
	      transactor.commit = function(value) {
	        debugTx('%s: releasing savepoint', t.txid)
	        return t.release(connection, value)
	      }
	      transactor.rollback = function(error) {
	        debugTx('%s: rolling back savepoint', t.txid)
	        return t.rollbackTo(connection, error);
	      }
	    } else {
	      transactor.commit = function(value) {
	        debugTx('%s: committing', t.txid)
	        return t.commit(connection, value)
	      }
	      transactor.rollback = function(error) {
	        debugTx('%s: rolling back', t.txid)
	        return t.rollback(connection, error)
	      }
	    }
	    return transactor
	  },

	  // We need to make a client object which always acquires the same 
	  // connection and does not release back into the pool.
	  makeClient: function(connection) {
	    var t = this
	    var trxClient         = Object.create(this.client.constructor.prototype)
	    trxClient.config      = this.client.config
	    trxClient.transacting = true;

	    trxClient.query  = function(conn, obj) {
	      return Promise.try(function() {
	        if (conn !== connection) throw new Error('Invalid connection for transaction query.')
	        return t.query(conn, obj)
	      })
	    }
	    trxClient.stream = function(conn, obj, stream, options) {
	      return Promise.try(function() {
	        if (conn !== connection) throw new Error('Invalid connection for transaction query.')
	        return t.stream(conn, obj, stream, options)
	      })
	    }
	    
	    trxClient.acquireConnection = function() {
	      return t._queue.then(function() {
	        return connection
	      })
	    }
	    trxClient.releaseConnection = function() { 
	      return Promise.resolve()
	    }

	    return trxClient
	  }

	})

	// Allow the `Transaction` object to be utilized with 
	// full access to the relevant promise API.
	__webpack_require__(22)(Transaction)

	Transaction.prototype.transacting = undefined

	// Passed a `container` function, this method runs the current
	// transaction, returning a promise.
	Transaction.prototype.then = function(/* onFulfilled, onRejected */) {
	  return this._dfd.then.apply(this._dfd, arguments)
	}

	// Passed a `container` function, this method runs the current
	// transaction, returning a promise.
	Transaction.prototype.catch = function(/* onFulfilled, onRejected */) {
	  return this._dfd.catch.apply(this._dfd, arguments)
	}

	module.exports = Transaction;


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Builder
	// -------
	var _            = __webpack_require__(8)
	var assert       = __webpack_require__(76)
	var inherits     = __webpack_require__(41)
	var EventEmitter = __webpack_require__(31).EventEmitter

	var Raw          = __webpack_require__(2)
	var helpers      = __webpack_require__(3)
	var JoinClause   = __webpack_require__(44)

	// Typically called from `knex.builder`,
	// start a new query building chain.
	function QueryBuilder(client) {
	  this.client      = client
	  this._single     = {};
	  this._statements = [];

	  // Internal flags used in the builder.
	  this._joinFlag  = 'inner';
	  this._boolFlag  = 'and';
	  this._notFlag   = false;

	  this.and        = this;
	}
	inherits(QueryBuilder, EventEmitter);

	QueryBuilder.prototype.toString = function() {
	  return this.toQuery();
	};

	// Convert the current query "toSQL"
	QueryBuilder.prototype.toSQL = function() {
	  return this.client.queryCompiler(this).toSQL(this._method || 'select');
	};

	// Create a shallow clone of the current query builder.
	// TODO: Test this!!
	QueryBuilder.prototype.clone = function() {
	  var cloned            = new this.constructor(this.client);
	    cloned._method      = this._method;
	    cloned._single      = _.clone(this._single);
	    cloned._options     = _.clone(this._options);
	    cloned._statements  = this._statements.slice();
	  return cloned;
	};

	// Select
	// ------

	// Sets the values for a `select` query,
	// which is the same as specifying the columns.
	QueryBuilder.prototype.select =

	// Adds a column or columns to the list of "columns"
	// being selected on the query.
	QueryBuilder.prototype.columns =
	QueryBuilder.prototype.column = function(column) {
	  if (!column) return this;
	  this._statements.push({
	    grouping: 'columns',
	    value: helpers.normalizeArr.apply(null, arguments)
	  });
	  return this;
	};

	// Takes a JS object of methods to call and calls them
	QueryBuilder.prototype.fromJS = function(obj) {
	  _.each(obj, function(val, key) {
	    if (typeof this[key] !== 'function') {
	      helpers.warn('Knex Error: unknown key ' + key)
	    }
	    if (Array.isArray(val)) {
	      this[key].apply(this, val)
	    } else {
	      this[key](val)
	    }
	  }, this)
	  return this
	}

	// Allow for a sub-select to be explicitly aliased as a column,
	// without needing to compile the query in a where.
	QueryBuilder.prototype.as = function(column) {
	  this._single.as = column;
	  return this;
	};

	// Sets the `tableName` on the query.
	// Alias to "from" for select and "into" for insert statements
	// e.g. builder.insert({a: value}).into('tableName')
	QueryBuilder.prototype.table = function(tableName) {
	  this._single.table = tableName;
	  return this;
	};
	QueryBuilder.prototype.from = QueryBuilder.prototype.table;
	QueryBuilder.prototype.into = QueryBuilder.prototype.table;

	// Adds a `distinct` clause to the query.
	QueryBuilder.prototype.distinct = function() {
	  this._statements.push({
	    grouping: 'columns',
	    value: helpers.normalizeArr.apply(null, arguments),
	    distinct: true
	  });
	  return this;
	};

	// Adds a join clause to the query, allowing for advanced joins
	// with an anonymous function as the second argument.
	// function(table, first, operator, second)
	QueryBuilder.prototype.join = function(table, first) {
	  var join;
	  var joinType = this._joinType();
	  if (typeof first === 'function') {
	    join = new JoinClause(table, joinType);
	    first.call(join, join);
	  } else if (joinType === 'raw') {
	    join = new JoinClause(this.client.raw(table, first), 'raw');
	  } else {
	    join = new JoinClause(table, joinType);
	    if (arguments.length > 1) {
	      join.on.apply(join, _.toArray(arguments).slice(1));
	    }
	  }
	  this._statements.push(join);
	  return this;
	};

	// JOIN blocks:
	QueryBuilder.prototype.innerJoin = function() {
	  return this._joinType('inner').join.apply(this, arguments);
	};
	QueryBuilder.prototype.leftJoin = function() {
	  return this._joinType('left').join.apply(this, arguments);
	};
	QueryBuilder.prototype.leftOuterJoin = function() {
	  return this._joinType('left outer').join.apply(this, arguments);
	};
	QueryBuilder.prototype.rightJoin = function() {
	  return this._joinType('right').join.apply(this, arguments);
	};
	QueryBuilder.prototype.rightOuterJoin = function() {
	  return this._joinType('right outer').join.apply(this, arguments);
	};
	QueryBuilder.prototype.outerJoin = function() {
	  return this._joinType('outer').join.apply(this, arguments);
	};
	QueryBuilder.prototype.fullOuterJoin = function() {
	  return this._joinType('full outer').join.apply(this, arguments);
	};
	QueryBuilder.prototype.crossJoin = function() {
	  return this._joinType('cross').join.apply(this, arguments);
	};
	QueryBuilder.prototype.joinRaw = function() {
	  return this._joinType('raw').join.apply(this, arguments);
	};

	// The where function can be used in several ways:
	// The most basic is `where(key, value)`, which expands to
	// where key = value.
	QueryBuilder.prototype.where =
	QueryBuilder.prototype.andWhere = function(column, operator, value) {

	  // Support "where true || where false"
	  if (column === false || column === true) {
	    return this.where(1, '=', column ? 1 : 0)
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
	    value    = operator;
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
	};
	// Adds an `or where` clause to the query.
	QueryBuilder.prototype.orWhere = function() {
	  return this._bool('or').where.apply(this, arguments);
	};

	// Adds an `not where` clause to the query.
	QueryBuilder.prototype.andWhereNot =
	QueryBuilder.prototype.whereNot = function() {
	  return this._not(true).where.apply(this, arguments);
	};

	// Adds an `or not where` clause to the query.
	QueryBuilder.prototype.orWhereNot = function() {
	  return this._bool('or').whereNot.apply(this, arguments);
	};


	// Processes an object literal provided in a "where" clause.
	QueryBuilder.prototype._objectWhere = function(obj) {
	  var boolVal = this._bool();
	  var notVal = this._not() ? 'Not' : '';
	  for (var key in obj) {
	    this[boolVal + 'Where' + notVal](key, obj[key]);
	  }
	  return this;
	};

	// Adds a raw `where` clause to the query.
	QueryBuilder.prototype.whereRaw =
	QueryBuilder.prototype.andWhereRaw = function(sql, bindings) {
	  var raw = (sql instanceof Raw ? sql : this.client.raw(sql, bindings));
	  this._statements.push({
	    grouping: 'where',
	    type: 'whereRaw',
	    value: raw,
	    bool: this._bool()
	  });
	  return this;
	};
	QueryBuilder.prototype.orWhereRaw = function(sql, bindings) {
	  return this._bool('or').whereRaw(sql, bindings);
	};

	// Helper for compiling any advanced `where` queries.
	QueryBuilder.prototype.whereWrapped = function(callback) {
	  this._statements.push({
	    grouping: 'where',
	    type: 'whereWrapped',
	    value: callback,
	    not: this._not(),
	    bool: this._bool()
	  });
	  return this;
	};


	// Helper for compiling any advanced `having` queries.
	QueryBuilder.prototype.havingWrapped = function(callback) {
	  this._statements.push({
	    grouping: 'having',
	    type: 'whereWrapped',
	    value: callback,
	    bool: this._bool()
	  });
	  return this;
	};

	// Adds a `where exists` clause to the query.
	QueryBuilder.prototype.whereExists = function(callback) {
	  this._statements.push({
	    grouping: 'where',
	    type: 'whereExists',
	    value: callback,
	    not: this._not(),
	    bool: this._bool(),
	  });
	  return this;
	};

	// Adds an `or where exists` clause to the query.
	QueryBuilder.prototype.orWhereExists = function(callback) {
	  return this._bool('or').whereExists(callback);
	};

	// Adds a `where not exists` clause to the query.
	QueryBuilder.prototype.whereNotExists = function(callback) {
	  return this._not(true).whereExists(callback);
	};

	// Adds a `or where not exists` clause to the query.
	QueryBuilder.prototype.orWhereNotExists = function(callback) {
	  return this._bool('or').whereNotExists(callback);
	};

	// Adds a `where in` clause to the query.
	QueryBuilder.prototype.whereIn = function(column, values) {
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
	};

	// Adds a `or where in` clause to the query.
	QueryBuilder.prototype.orWhereIn = function(column, values) {
	  return this._bool('or').whereIn(column, values);
	};

	// Adds a `where not in` clause to the query.
	QueryBuilder.prototype.whereNotIn = function(column, values) {
	  return this._not(true).whereIn(column, values);
	};

	// Adds a `or where not in` clause to the query.
	QueryBuilder.prototype.orWhereNotIn = function(column, values) {
	  return this._bool('or')._not(true).whereIn(column, values);
	};

	// Adds a `where null` clause to the query.
	QueryBuilder.prototype.whereNull = function(column) {
	  this._statements.push({
	    grouping: 'where',
	    type: 'whereNull',
	    column: column,
	    not: this._not(),
	    bool: this._bool()
	  });
	  return this;
	};

	// Adds a `or where null` clause to the query.
	QueryBuilder.prototype.orWhereNull = function(column) {
	  return this._bool('or').whereNull(column);
	};

	// Adds a `where not null` clause to the query.
	QueryBuilder.prototype.whereNotNull = function(column) {
	  return this._not(true).whereNull(column);
	};

	// Adds a `or where not null` clause to the query.
	QueryBuilder.prototype.orWhereNotNull = function(column) {
	  return this._bool('or').whereNotNull(column);
	};

	// Adds a `where between` clause to the query.
	QueryBuilder.prototype.whereBetween = function(column, values) {
	  assert(Array.isArray(values), 'The second argument to whereBetween must be an array.')
	  assert(values.length === 2, 'You must specify 2 values for the whereBetween clause')
	  this._statements.push({
	    grouping: 'where',
	    type: 'whereBetween',
	    column: column,
	    value: values,
	    not: this._not(),
	    bool: this._bool()
	  });
	  return this;
	};

	// Adds a `where not between` clause to the query.
	QueryBuilder.prototype.whereNotBetween = function(column, values) {
	  return this._not(true).whereBetween(column, values);
	};

	// Adds a `or where between` clause to the query.
	QueryBuilder.prototype.orWhereBetween = function(column, values) {
	  return this._bool('or').whereBetween(column, values);
	};

	// Adds a `or where not between` clause to the query.
	QueryBuilder.prototype.orWhereNotBetween = function(column, values) {
	  return this._bool('or').whereNotBetween(column, values);
	};

	// Adds a `group by` clause to the query.
	QueryBuilder.prototype.groupBy = function(item) {
	  if (item instanceof Raw) {
	    return this.groupByRaw.apply(this, arguments);
	  }
	  this._statements.push({
	    grouping: 'group',
	    type: 'groupByBasic',
	    value: helpers.normalizeArr.apply(null, arguments)
	  });
	  return this;
	};

	// Adds a raw `group by` clause to the query.
	QueryBuilder.prototype.groupByRaw = function(sql, bindings) {
	  var raw = (sql instanceof Raw ? sql : this.client.raw(sql, bindings));
	  this._statements.push({
	    grouping: 'group',
	    type: 'groupByRaw',
	    value: raw
	  });
	  return this;
	};

	// Adds a `order by` clause to the query.
	QueryBuilder.prototype.orderBy = function(column, direction) {
	  this._statements.push({
	    grouping: 'order',
	    type: 'orderByBasic',
	    value: column,
	    direction: direction
	  });
	  return this;
	};

	// Add a raw `order by` clause to the query.
	QueryBuilder.prototype.orderByRaw = function(sql, bindings) {
	  var raw = (sql instanceof Raw ? sql : this.client.raw(sql, bindings));
	  this._statements.push({
	    grouping: 'order',
	    type: 'orderByRaw',
	    value: raw
	  });
	  return this;
	};

	// Add a union statement to the query.
	QueryBuilder.prototype.union = function(callbacks, wrap) {
	  if (arguments.length === 1 ||
	      (arguments.length === 2 && _.isBoolean(wrap))) {
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
	};

	// Adds a union all statement to the query.
	QueryBuilder.prototype.unionAll = function(callback, wrap) {
	  this._statements.push({
	    grouping: 'union',
	    clause: 'union all',
	    value: callback,
	    wrap: wrap || false
	  });
	  return this;
	};

	// Adds a `having` clause to the query.
	QueryBuilder.prototype.having =
	QueryBuilder.prototype.andHaving = function(column, operator, value) {
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
	};
	// Adds an `or having` clause to the query.
	QueryBuilder.prototype.orHaving = function() {
	  return this._bool('or').having.apply(this, arguments);
	};
	QueryBuilder.prototype.havingRaw = function(sql, bindings) {
	  return this._havingRaw(sql, bindings);
	};
	QueryBuilder.prototype.orHavingRaw = function(sql, bindings) {
	  return this._bool('or').havingRaw(sql, bindings);
	};
	// Adds a raw `having` clause to the query.
	QueryBuilder.prototype._havingRaw = function(sql, bindings) {
	  var raw = (sql instanceof Raw ? sql : this.client.raw(sql, bindings));
	  this._statements.push({
	    grouping: 'having',
	    type: 'havingRaw',
	    value: raw,
	    bool: this._bool()
	  });
	  return this;
	};

	// Only allow a single "offset" to be set for the current query.
	QueryBuilder.prototype.offset = function(value) {
	  this._single.offset = value;
	  return this;
	};

	// Only allow a single "limit" to be set for the current query.
	QueryBuilder.prototype.limit = function(value) {
	  this._single.limit = value;
	  return this;
	};

	// Retrieve the "count" result of the query.
	QueryBuilder.prototype.count = function(column) {
	  return this._aggregate('count', (column || '*'));
	};

	// Retrieve the minimum value of a given column.
	QueryBuilder.prototype.min = function(column) {
	  return this._aggregate('min', column);
	};

	// Retrieve the maximum value of a given column.
	QueryBuilder.prototype.max = function(column) {
	  return this._aggregate('max', column);
	};

	// Retrieve the sum of the values of a given column.
	QueryBuilder.prototype.sum = function(column) {
	  return this._aggregate('sum', column);
	};

	// Retrieve the average of the values of a given column.
	QueryBuilder.prototype.avg = function(column) {
	  return this._aggregate('avg', column);
	};

	// Increments a column's value by the specified amount.
	QueryBuilder.prototype.increment = function(column, amount) {
	  return this._counter(column, amount);
	};

	// Decrements a column's value by the specified amount.
	QueryBuilder.prototype.decrement = function(column, amount) {
	  return this._counter(column, amount, '-');
	};

	// Sets the values for a `select` query, informing that only the first
	// row should be returned (limit 1).
	QueryBuilder.prototype.first = function() {
	  var i, args = new Array(arguments.length);
	  for (i = 0; i < args.length; i++) {
	    args[i] = arguments[i];
	  }
	  this.select.apply(this, args);
	  this._method = 'first';
	  this.limit(1);
	  return this;
	};

	// Pluck a column from a query.
	QueryBuilder.prototype.pluck = function(column) {
	  this._method = 'pluck';
	  this._single.pluck = column;
	  this._statements.push({
	    grouping: 'columns',
	    type: 'pluck',
	    value: column
	  });
	  return this;
	};

	// Insert & Update
	// ------

	// Sets the values for an `insert` query.
	QueryBuilder.prototype.insert = function(values, returning) {
	  this._method = 'insert';
	  if (!_.isEmpty(returning)) this.returning(returning);
	  this._single.insert = values
	  return this;
	};

	// Sets the values for an `update`, allowing for both
	// `.update(key, value, [returning])` and `.update(obj, [returning])` syntaxes.
	QueryBuilder.prototype.update = function(values, returning) {
	  var ret, obj = {};
	  this._method = 'update';
	  var i, args = new Array(arguments.length);
	  for (i = 0; i < args.length; i++) {
	    args[i] = arguments[i];
	  }
	  if (_.isString(values)) {
	    obj[values] = returning;
	    if (args.length > 2) {
	      ret = args[2];
	    }
	  } else {
	    obj = values;
	    ret = args[1];
	  }
	  if (!_.isEmpty(ret)) this.returning(ret);
	  this._single.update = obj;
	  return this;
	};

	// Sets the returning value for the query.
	QueryBuilder.prototype.returning = function(returning) {
	  this._single.returning = returning;
	  return this;
	};

	// Delete
	// ------

	// Executes a delete statement on the query;
	QueryBuilder.prototype.delete = function(ret) {
	  this._method = 'del';
	  if (!_.isEmpty(ret)) this.returning(ret);
	  return this;
	};
	QueryBuilder.prototype.del = QueryBuilder.prototype.delete

	// Truncates a table, ends the query chain.
	QueryBuilder.prototype.truncate = function() {
	  this._method = 'truncate';
	  return this;
	};

	// Retrieves columns for the table specified by `knex(tableName)`
	QueryBuilder.prototype.columnInfo = function(column) {
	  this._method = 'columnInfo';
	  this._single.columnInfo = column;
	  return this;
	};

	// Set a lock for update constraint.
	QueryBuilder.prototype.forUpdate = function() {
	  this._single.lock = 'forUpdate';
	  return this;
	};

	// Set a lock for share constraint.
	QueryBuilder.prototype.forShare = function() {
	  this._single.lock = 'forShare';
	  return this;
	};

	// ----------------------------------------------------------------------

	// Helper for the incrementing/decrementing queries.
	QueryBuilder.prototype._counter = function(column, amount, symbol) {
	  var amt = parseInt(amount, 10);
	  if (isNaN(amt)) amt = 1;
	  this._method = 'counter';
	  this._single.counter = {
	    column: column,
	    amount: amt,
	    symbol: (symbol || '+')
	  };
	  return this;
	};

	// Helper to get or set the "boolFlag" value.
	QueryBuilder.prototype._bool = function(val) {
	  if (arguments.length === 1) {
	    this._boolFlag = val;
	    return this;
	  }
	  var ret = this._boolFlag;
	  this._boolFlag = 'and';
	  return ret;
	};

	// Helper to get or set the "notFlag" value.
	QueryBuilder.prototype._not = function(val) {
	  if (arguments.length === 1) {
	    this._notFlag = val;
	    return this;
	  }
	  var ret = this._notFlag;
	  this._notFlag = false;
	  return ret;
	};

	// Helper to get or set the "joinFlag" value.
	QueryBuilder.prototype._joinType = function (val) {
	  if (arguments.length === 1) {
	    this._joinFlag = val;
	    return this;
	  }
	  var ret = this._joinFlag || 'inner';
	  this._joinFlag = 'inner';
	  return ret;
	};

	// Helper for compiling any aggregate queries.
	QueryBuilder.prototype._aggregate = function(method, column) {
	  this._statements.push({
	    grouping: 'columns',
	    type: 'aggregate',
	    method: method,
	    value: column
	  });
	  return this;
	};

	Object.defineProperty(QueryBuilder.prototype, 'or', {
	  get: function () {
	    return this._bool('or');
	  }
	});

	Object.defineProperty(QueryBuilder.prototype, 'not', {
	  get: function () {
	    return this._not(true);
	  }
	});

	// Attach all of the top level promise methods that should be chainable.
	__webpack_require__(22)(QueryBuilder);

	module.exports = QueryBuilder;


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Query Compiler
	// -------
	var _       = __webpack_require__(8);
	var helpers = __webpack_require__(3);
	var Raw     = __webpack_require__(2);
	var assign  = __webpack_require__(23)

	// The "QueryCompiler" takes all of the query statements which
	// have been gathered in the "QueryBuilder" and turns them into a
	// properly formatted / bound query string.
	function QueryCompiler(client, builder) {
	  this.client      = client
	  this.method      = builder._method || 'select';
	  this.options     = builder._options;
	  this.single      = builder._single;
	  this.grouped     = _.groupBy(builder._statements, 'grouping');
	  this.formatter   = client.formatter()
	}

	var components = [
	  'columns', 'join', 'where', 'union', 'group',
	  'having', 'order', 'limit', 'offset', 'lock'
	];

	assign(QueryCompiler.prototype, {

	  // Used when the insert call is empty.
	  _emptyInsertValue: 'default values',

	  // Collapse the builder into a single object
	  toSQL: function(method) {
	    method = method || this.method
	    var val = this[method]()
	    var defaults = {
	      method: method,
	      options: this.options && this.options.length > 0 ?
	        _.extend.apply(_, this.options) : void 0,
	      bindings: this.formatter.bindings
	    };
	    if (_.isString(val)) {
	      val = {sql: val};
	    }
	    if (method === 'select' && this.single.as) {
	      defaults.as = this.single.as;
	    }
	    return assign(defaults, val);
	  },

	  // Compiles the `select` statement, or nested sub-selects
	  // by calling each of the component compilers, trimming out
	  // the empties, and returning a generated query string.
	  select: function() {
	    var i = -1, statements = [];
	    while (++i < components.length) {
	      statements.push(this[components[i]](this));
	    }
	    return _.compact(statements).join(' ');
	  },
	  
	  pluck: function() {
	    return {
	      sql: this.select(),
	      pluck: this.single.pluck
	    };
	  },

	  // Compiles an "insert" query, allowing for multiple
	  // inserts using a single query statement.
	  insert: function() {
	    var insertValues = this.single.insert || [];
	    var sql = 'insert into ' + this.tableName + ' ';

	    if (Array.isArray(insertValues)) {
	      if (insertValues.length === 0) {
	        return ''
	      }
	    } else if (typeof insertValues === 'object' && _.isEmpty(insertValues)) {
	      return sql + this._emptyInsertValue
	    }

	    var insertData = this._prepInsert(insertValues);
	    if (typeof insertData === 'string') {
	      sql += insertData;
	    } else  {
	      if (insertData.columns.length) {
	        sql += '(' + this.formatter.columnize(insertData.columns) 
	        sql += ') values ('
	        var i = -1
	        while (++i < insertData.values.length) {
	          if (i !== 0) sql += '), ('
	          sql += this.formatter.parameterize(insertData.values[i])
	        }
	        sql += ')';
	      } else if (insertValues.length === 1 && insertValues[0]) {
	        sql += this._emptyInsertValue
	      } else {
	        sql = ''
	      }
	    }
	    return sql;
	  },

	  // Compiles the "update" query.
	  update: function() {
	    // Make sure tableName is processed by the formatter first.
	    var tableName  = this.tableName;
	    var updateData = this._prepUpdate(this.single.update);
	    var wheres     = this.where();
	    return 'update ' + tableName +
	      ' set ' + updateData.join(', ') +
	      (wheres ? ' ' + wheres : '');
	  },

	  // Compiles the columns in the query, specifying if an item was distinct.
	  columns: function() {
	    var distinct = false;
	    if (this.onlyUnions()) return ''
	    var columns = this.grouped.columns || []
	    var i = -1, sql = [];
	    if (columns) {
	      while (++i < columns.length) {
	        var stmt = columns[i];
	        if (stmt.distinct) distinct = true
	        if (stmt.type === 'aggregate') {
	          sql.push(this.aggregate(stmt))
	        } 
	        else if (stmt.value && stmt.value.length > 0) {
	          sql.push(this.formatter.columnize(stmt.value))
	        }
	      }
	    }
	    if (sql.length === 0) sql = ['*'];
	    return 'select ' + (distinct ? 'distinct ' : '') 
	      + sql.join(', ') + 
	      (this.tableName ? ' from ' + this.tableName : '');
	  },

	  aggregate: function(stmt) {
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
	  join: function() {
	    var joins = this.grouped.join;
	    if (!joins) return '';
	    var sql = _.reduce(joins, function(acc, join) {
	      if (join.joinType === 'raw') {
	        acc.push(this.formatter.unwrapRaw(join.table));
	      } else {
	        acc.push(join.joinType + ' join ' + this.formatter.wrap(join.table));
	        var i = -1;
	        while (++i < join.clauses.length) {
	          var clause = join.clauses[i]
	          acc.push(i > 0 ? clause[1] : clause[0]);
	          acc.push(this.formatter.wrap(clause[2]));
	          if (clause[3]) acc.push(this.formatter.operator(clause[3]));
	          if (clause[4]) acc.push(this.formatter.wrap(clause[4]));
	        }
	      }
	      return acc;
	    }, [], this);
	    return sql.length > 0 ? sql.join(' ') : '';
	  },

	  // Compiles all `where` statements on the query.
	  where: function() {
	    var wheres = this.grouped.where;
	    if (!wheres) return;
	    var sql = [];
	    sql[0] = 'where';
	    for (var i = 0, l = wheres.length; i < l; i++) {
	      var stmt = wheres[i];
	      if (i !== 0) sql.push(stmt.bool);
	      sql.push(this[stmt.type](stmt));
	    }
	    return sql.length > 1 ? sql.join(' ') : '';
	  },

	  group: function() {
	    return this._groupsOrders('group');
	  },

	  order: function() {
	    return this._groupsOrders('order');
	  },

	  // Compiles the `having` statements.
	  having: function() {
	    var havings = this.grouped.having;
	    if (!havings) return '';
	    var sql = ['having'];
	    for (var i = 0, l = havings.length; i < l; i++) {
	      var str = '', s = havings[i];
	      if (i !== 0) str = s.bool + ' ';
	      if (s.type === 'havingBasic') {
	        sql.push(str + this.formatter.columnize(s.column) + ' ' +
	          this.formatter.operator(s.operator) + ' ' + this.formatter.parameter(s.value));
	      } else {
	        if(s.type === 'whereWrapped'){
	          sql.push(this.whereWrapped(s));
	        } else {
	          sql.push(str + this.formatter.unwrapRaw(s.value));
	        }
	      }
	    }
	    return sql.length > 1 ? sql.join(' ') : '';
	  },

	  // Compile the "union" queries attached to the main query.
	  union: function() {
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
	  onlyUnions: function() {
	    return (!this.grouped.columns && this.grouped.union && !this.tableName);
	  },

	  limit: function() {
	    var noLimit = !this.single.limit && this.single.limit !== 0;
	    if (noLimit) return '';
	    return 'limit ' + this.formatter.parameter(this.single.limit);
	  },

	  offset: function() {
	    if (!this.single.offset) return '';
	    return 'offset ' + this.formatter.parameter(this.single.offset);
	  },

	  // Compiles a `delete` query.
	  del: function() {
	    // Make sure tableName is processed by the formatter first.
	    var tableName  = this.tableName;
	    var wheres = this.where();
	    return 'delete from ' + tableName +
	      (wheres ? ' ' + wheres : '');
	  },

	  // Compiles a `truncate` query.
	  truncate: function() {
	    return 'truncate ' + this.tableName;
	  },

	  // Compiles the "locks".
	  lock: function() {
	    if (this.single.lock) {
	      if (!this.client.transacting) {
	        helpers.warn('You are attempting to perform a "lock" command outside of a transaction.')
	      } else {
	        return this[this.single.lock]()
	      }
	    }
	  },

	  // Compile the "counter".
	  counter: function() {
	    var counter = this.single.counter;
	    var toUpdate = {};
	    toUpdate[counter.column] = this.client.raw(this.formatter.wrap(counter.column) +
	      ' ' + (counter.symbol || '+') +
	      ' ' + counter.amount);
	    this.single.update = toUpdate;
	    return this.update();
	  },

	  // Where Clause
	  // ------

	  whereIn: function(statement) {
	    if (Array.isArray(statement.column)) return this.multiWhereIn(statement);
	    return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'in ') +
	      this.wrap(this.formatter.parameterize(statement.value));
	  },

	  multiWhereIn: function(statement) {
	    var i = -1, sql = '(' + this.formatter.columnize(statement.column) + ') '
	    sql += this._not(statement, 'in ') + '(('
	    while (++i < statement.value.length) {
	      if (i !== 0) sql += '),('
	      sql += this.formatter.parameterize(statement.value[i])
	    }
	    return sql + '))'
	  },

	  whereNull: function(statement) {
	    return this.formatter.wrap(statement.column) + ' is ' + this._not(statement, 'null');
	  },

	  // Compiles a basic "where" clause.
	  whereBasic: function(statement) {
	    return this._not(statement, '') +
	      this.formatter.wrap(statement.column) + ' ' +
	      this.formatter.operator(statement.operator) + ' ' +
	      this.formatter.parameter(statement.value);
	  },

	  whereExists: function(statement) {
	    return this._not(statement, 'exists') + ' (' + this.formatter.rawOrFn(statement.value) + ')';
	  },

	  whereWrapped: function(statement) {
	    return this._not(statement, '') + '(' + this.formatter.rawOrFn(statement.value, 'where').slice(6) + ')';
	  },

	  whereBetween: function(statement) {
	    return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'between') + ' ' +
	      _.map(statement.value, this.formatter.parameter, this.formatter).join(' and ');
	  },

	  // Compiles a "whereRaw" query.
	  whereRaw: function(statement) {
	    return this.formatter.unwrapRaw(statement.value);
	  },

	  wrap: function(str) {
	    if (str.charAt(0) !== '(') return '(' + str + ')';
	    return str;
	  },

	  // Determines whether to add a "not" prefix to the where clause.
	  _not: function(statement, str) {
	    if (statement.not) return 'not ' + str;
	    return str;
	  },
	  
	  _prepInsert: function(data) {
	    var isRaw = this.formatter.rawOrFn(data);
	    if (isRaw) return isRaw;
	    var columns = [];
	    var values  = [];
	    if (!Array.isArray(data)) data = data ? [data] : [];
	    var i = -1
	    while (++i < data.length) {
	      if (data[i] == undefined) break;
	      if (i === 0) columns = Object.keys(data[i]).sort()
	      var row  = new Array(columns.length)
	      var keys = Object.keys(data[i])
	      var j = -1
	      while (++j < keys.length) {
	        var key = keys[j];
	        var idx = columns.indexOf(key);
	        if (idx === -1) {
	          columns = columns.concat(key).sort()
	          idx     = columns.indexOf(key)
	          var k = -1
	          while (++k < values.length) {
	            values[k].splice(idx, 0, undefined)
	          }
	        }
	        row[idx] = data[i][key]
	      }
	      values.push(row)
	    }
	    return {
	      columns: columns,
	      values:  values
	    };
	  },

	  // "Preps" the update.
	  _prepUpdate: function(data) {
	    var vals   = []
	    var sorted = Object.keys(data).sort()
	    var i      = -1
	    while (++i < sorted.length) {
	      vals.push(this.formatter.wrap(sorted[i]) + ' = ' + this.formatter.parameter(data[sorted[i]]));
	    }
	    return vals;
	  },

	  // Compiles the `order by` statements.
	  _groupsOrders: function(type) {
	    var items = this.grouped[type];
	    if (!items) return '';
	    var formatter = this.formatter;
	    var sql = items.map(function (item) {
	      return (item.value instanceof Raw ? formatter.unwrapRaw(item.value) : formatter.columnize(item.value)) +
	        ((type === 'order' && item.type !== 'orderByRaw') ? ' ' + formatter.direction(item.direction) : '');
	    });
	    return sql.length ? type + ' by ' + sql.join(', ') : '';
	  }

	})

	QueryCompiler.prototype.first = QueryCompiler.prototype.select;

	// Get the table name, wrapping it if necessary.
	// Implemented as a property to prevent ordering issues as described in #704.
	Object.defineProperty(QueryCompiler.prototype, 'tableName', {
	  get: function() {
	    if(!this._tableName) {
	      // Only call this.formatter.wrap() the first time this property is accessed.
	      this._tableName = this.single.table ? this.formatter.wrap(this.single.table) : '';
	    }
	    return this._tableName;
	  }
	});


	module.exports = QueryCompiler;


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _            = __webpack_require__(8);
	var inherits     = __webpack_require__(41);
	var EventEmitter = __webpack_require__(31).EventEmitter;
	var assign       = __webpack_require__(23)

	// Constructor for the builder instance, typically called from
	// `knex.builder`, accepting the current `knex` instance,
	// and pulling out the `client` and `grammar` from the current
	// knex instance.
	function SchemaBuilder(client) {
	  this.client    = client
	  this._sequence = []
	}
	inherits(SchemaBuilder, EventEmitter)

	// Each of the schema builder methods just add to the
	// "_sequence" array for consistency.
	_.each([
	  'createTable', 
	  'createTableIfNotExists', 
	  'createSchema',
	  'createSchemaIfNotExists', 
	  'dropSchema', 
	  'dropSchemaIfExists',
	  'createExtension', 
	  'createExtensionIfNotExists', 
	  'dropExtension',
	  'dropExtensionIfExists', 
	  'table', 
	  'alterTable', 
	  'hasTable',
	  'hasColumn', 
	  'dropTable', 
	  'renameTable', 
	  'dropTableIfExists', 
	  'raw',
	  'debug'
	], function(method) {
	  SchemaBuilder.prototype[method] = function() {
	    if (method === 'table') method = 'alterTable';
	    this._sequence.push({
	      method: method,
	      args: _.toArray(arguments)
	    });
	    return this;
	  }
	})

	__webpack_require__(22)(SchemaBuilder)

	SchemaBuilder.prototype.toString = function() {
	  return this.toQuery()
	}

	SchemaBuilder.prototype.toSQL = function() {
	  return this.client.schemaCompiler(this).toSQL()
	}

	module.exports = SchemaBuilder


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var helpers = __webpack_require__(45)
	var assign  = __webpack_require__(23);

	// The "SchemaCompiler" takes all of the query statements which have been
	// gathered in the "SchemaBuilder" and turns them into an array of
	// properly formatted / bound query strings.
	function SchemaCompiler(client, builder) {
	  this.builder   = builder
	  this.client    = client
	  this.formatter = client.formatter()
	  this.sequence  = []
	}

	assign(SchemaCompiler.prototype, {

	  pushQuery: helpers.pushQuery,

	  pushAdditional: helpers.pushAdditional,

	  createTable: buildTable('create'),

	  createTableIfNotExists: buildTable('createIfNot'),

	  alterTable: buildTable('alter'),

	  dropTable: function(tableName) {
	    this.pushQuery('drop table ' + this.formatter.wrap(tableName))
	  },

	  dropTableIfExists: function(tableName) {
	    this.pushQuery('drop table if exists ' + this.formatter.wrap(tableName));
	  },

	  raw: function(sql, bindings) {
	    this.sequence.push(this.client.raw(sql, bindings).toSQL());
	  },

	  toSQL: function() {
	    var sequence = this.builder._sequence;
	    for (var i = 0, l = sequence.length; i < l; i++) {
	      var query = sequence[i];
	      this[query.method].apply(this, query.args);
	    }
	    return this.sequence;
	  }  

	})

	function buildTable(type) {
	  return function(tableName, fn) {
	    var sql = this.client.tableBuilder(type, tableName, fn).toSQL();
	    for (var i = 0, l = sql.length; i < l; i++) {
	      this.sequence.push(sql[i]);
	    }
	  };
	}


	module.exports = SchemaCompiler;


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// TableBuilder

	// Takes the function passed to the "createTable" or "table/editTable"
	// functions and calls it with the "TableBuilder" as both the context and
	// the first argument. Inside this function we can specify what happens to the
	// method, pushing everything we want to do onto the "allStatements" array,
	// which is then compiled into sql.
	// ------
	var _ = __webpack_require__(8);
	var helpers = __webpack_require__(3);

	function TableBuilder(client, method, tableName, fn) {
	  this.client      = client
	  this._fn         = fn;
	  this._method     = method;
	  this._tableName  = tableName;
	  this._statements = [];
	  this._single     = {};
	}

	// Convert the current tableBuilder object "toSQL"
	// giving us additional methods if we're altering
	// rather than creating the table.
	TableBuilder.prototype.toSQL = function() {
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
	  'dropPrimary', 'dropUnique', 'dropIndex', 'dropForeign'

	], function(method) {
	  TableBuilder.prototype[method] = function() {
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
	_.each(specialMethods, function(method) {
	  TableBuilder.prototype[method] = function(value) {
	    if (false) {
	      helpers.warn('Knex only supports ' + method + ' statement with mysql.');
	    } if (this._method === 'alter') {
	      helpers.warn('Knex does not support altering the ' + method + ' outside of the create table, please use knex.raw statement.');
	    }
	    this._single[method] = value;
	  };
	});

	// Each of the column types that we can add, we create a new ColumnBuilder
	// instance and push it onto the statements array.
	var columnTypes = [

	  // Numeric
	  'tinyint',
	  'smallint',
	  'mediumint',
	  'int',
	  'bigint',
	  'decimal',
	  'float',
	  'double',
	  'real',
	  'bit',
	  'boolean',
	  'serial',

	  // Date / Time
	  'date',
	  'datetime',
	  'timestamp',
	  'time',
	  'year',

	  // String
	  'char',
	  'varchar',
	  'tinytext',
	  'tinyText',
	  'text',
	  'mediumtext',
	  'mediumText',
	  'longtext',
	  'longText',
	  'binary',
	  'varbinary',
	  'tinyblob',
	  'tinyBlob',
	  'mediumblob',
	  'mediumBlob',
	  'blob',
	  'longblob',
	  'longBlob',
	  'enum',
	  'set',

	  // Increments, Aliases, and Additional
	  'bool',
	  'dateTime',
	  'increments',
	  'bigincrements',
	  'bigIncrements',
	  'integer',
	  'biginteger',
	  'bigInteger',
	  'string',
	  'timestamps',
	  'json',
	  'uuid',
	  'enu',
	  'specificType'
	];

	// For each of the column methods, create a new "ColumnBuilder" interface,
	// push it onto the "allStatements" stack, and then return the interface,
	// with which we can add indexes, etc.
	_.each(columnTypes, function(type) {
	  TableBuilder.prototype[type] = function() {
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
	    var builder       = this.client.columnBuilder(this, type, args);

	    this._statements.push({
	      grouping: 'columns',
	      builder: builder
	    });
	    return builder;
	  };

	});

	// Set the comment value for a table, they're only allowed to be called
	// once per table.
	TableBuilder.prototype.comment = function(value) {
	  this._single.comment = value;
	};

	// Set a foreign key on the table, calling
	// `table.foreign('column_name').references('column').on('table').onDelete()...
	// Also called from the ColumnBuilder context when chaining.
	TableBuilder.prototype.foreign = function(column) {
	  var foreignData = {column: column};
	  this._statements.push({
	    grouping: 'alterTable',
	    method: 'foreign',
	    args: [foreignData]
	  });
	  var returnObj = {
	    references: function(tableColumn) {
	      var pieces;
	      if (_.isString(tableColumn)) {
	        pieces = tableColumn.split('.');
	      }
	      if (!pieces || pieces.length === 1) {
	        foreignData.references = pieces ? pieces[0] : tableColumn;
	        return {
	          on: function(tableName) {
	            foreignData.inTable = tableName;
	            return returnObj;
	          },
	          inTable: function() {
	            return this.on.apply(this, arguments);
	          }
	        };
	      }
	      foreignData.inTable = pieces[0];
	      foreignData.references = pieces[1];
	      return returnObj;
	    },
	    onUpdate: function(statement) {
	      foreignData.onUpdate = statement;
	      return returnObj;
	    },
	    onDelete: function(statement) {
	      foreignData.onDelete = statement;
	      return returnObj;
	    },
	    _columnBuilder: function(builder) {
	      _.extend(builder, returnObj);
	      returnObj = builder;
	      return builder;
	    }
	  };
	  return returnObj;
	}

	var AlterMethods = {

	  // Renames the current column `from` the current
	  // TODO: this.column(from).rename(to)
	  renameColumn: function(from, to) {
	    this._statements.push({
	      grouping: 'alterTable',
	      method: 'renameColumn',
	      args: [from, to]
	    });
	    return this;
	  },

	  dropTimestamps: function() {
	    return this.dropColumns(['created_at', 'updated_at']);
	  }

	  // TODO: changeType
	};

	// Drop a column from the current table.
	// TODO: Enable this.column(columnName).drop();
	AlterMethods.dropColumn =
	AlterMethods.dropColumns = function() {
	  this._statements.push({
	    grouping: 'alterTable',
	    method: 'dropColumn',
	    args: _.toArray(arguments)
	  });
	  return this;
	};


	module.exports = TableBuilder;


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Table Compiler
	// -------
	var _ = __webpack_require__(8);
	var helpers = __webpack_require__(45);
	var normalizeArr = __webpack_require__(3).normalizeArr

	function TableCompiler(client, tableBuilder) {
	  this.client         = client
	  this.method         = tableBuilder._method;
	  this.tableNameRaw   = tableBuilder._tableName;
	  this.single         = tableBuilder._single;
	  this.grouped        = _.groupBy(tableBuilder._statements, 'grouping');
	  this.formatter      = client.formatter();
	  this.sequence       = [];
	}

	TableCompiler.prototype.pushQuery = helpers.pushQuery

	TableCompiler.prototype.pushAdditional = helpers.pushAdditional

	// Convert the tableCompiler toSQL
	TableCompiler.prototype.toSQL = function() {
	  this[this.method]();
	  return this.sequence;
	};

	// Column Compilation
	// -------

	// If this is a table "creation", we need to first run through all
	// of the columns to build them into a single string,
	// and then run through anything else and push it to the query sequence.
	TableCompiler.prototype.create = function(ifNot) {
	  var columns = this.getColumns();
	  var columnTypes = this.getColumnTypes(columns);
	  this.createQuery(columnTypes, ifNot);
	  this.columnQueries(columns);
	  delete this.single.comment;
	  this.alterTable();
	};

	// Only create the table if it doesn't exist.
	TableCompiler.prototype.createIfNot = function() {
	  this.create(true);
	};

	// If we're altering the table, we need to one-by-one
	// go through and handle each of the queries associated
	// with altering the table's schema.
	TableCompiler.prototype.alter = function() {
	  var columns = this.getColumns();
	  var columnTypes = this.getColumnTypes(columns);
	  this.addColumns(columnTypes);
	  this.columnQueries(columns);
	  this.alterTable();
	};

	TableCompiler.prototype.foreign = function(foreignData) {
	  if (foreignData.inTable && foreignData.references) {
	    var keyName    = this._indexCommand('foreign', this.tableNameRaw, foreignData.column);
	    var column     = this.formatter.columnize(foreignData.column);
	    var references = this.formatter.columnize(foreignData.references);
	    var inTable    = this.formatter.wrap(foreignData.inTable);
	    var onUpdate   = foreignData.onUpdate ? ' on update ' + foreignData.onUpdate : '';
	    var onDelete   = foreignData.onDelete ? ' on delete ' + foreignData.onDelete : '';
	    this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + keyName + ' ' +
	      'foreign key (' + column + ') references ' + inTable + ' (' + references + ')' + onUpdate + onDelete);
	  }
	};

	// Get all of the column sql & bindings individually for building the table queries.
	TableCompiler.prototype.getColumnTypes = function(columns) {
	  return _.reduce(_.map(columns, _.first), function(memo, column) {
	    memo.sql.push(column.sql);
	    memo.bindings.concat(column.bindings);
	    return memo;
	  }, {sql: [], bindings: []});
	};

	// Adds all of the additional queries from the "column"
	TableCompiler.prototype.columnQueries = function(columns) {
	  var queries = _.reduce(_.map(columns, _.rest), function(memo, column) {
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
	TableCompiler.prototype.addColumns = function(columns) {
	  if (columns.sql.length > 0) {
	    var columnSql = _.map(columns.sql, function(column) {
	      return this.addColumnsPrefix + column;
	    }, this);
	    this.pushQuery({
	      sql: 'alter table ' + this.tableName() + ' ' + columnSql.join(', '),
	      bindings: columns.bindings
	    });
	  }
	};

	// Compile the columns as needed for the current create or alter table
	TableCompiler.prototype.getColumns = function() {
	  var i = -1, compiledColumns = [], columns = this.grouped.columns || [];
	  while(++i < columns.length) {
	    compiledColumns.push(this.client.columnCompiler(this, columns[i].builder).toSQL())
	  }
	  return compiledColumns;
	};

	TableCompiler.prototype.tableName = function() {
	  return this.formatter.wrap(this.tableNameRaw);
	};

	// Generate all of the alter column statements necessary for the query.
	TableCompiler.prototype.alterTable = function() {
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
	TableCompiler.prototype.dropIndex = function(value) {
	  this.pushQuery('drop index' + value);
	};

	// Drop the unique
	TableCompiler.prototype.dropUnique =
	TableCompiler.prototype.dropForeign = function() {
	  throw new Error('Method implemented in the dialect driver');
	};

	TableCompiler.prototype.dropColumnPrefix = 'drop column ';
	TableCompiler.prototype.dropColumn = function() {
	  var columns = normalizeArr.apply(null, arguments);
	  var drops = _.map(_.isArray(columns) ? columns : [columns], function(column) {
	    return this.dropColumnPrefix + this.formatter.wrap(column);
	  }, this);
	  this.pushQuery('alter table ' + this.tableName() + ' ' + drops.join(', '));
	};

	// If no name was specified for this index, we will create one using a basic
	// convention of the table name, followed by the columns, followed by an
	// index type, such as primary or index, which makes the index unique.
	TableCompiler.prototype._indexCommand = function(type, tableName, columns) {
	  if (!_.isArray(columns)) columns = columns ? [columns] : [];
	  var table = tableName.replace(/\.|-/g, '_');
	  return (table + '_' + columns.join('_') + '_' + type).toLowerCase();
	};

	module.exports = TableCompiler;

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(8);

	// The chainable interface off the original "column" method.
	function ColumnBuilder(client, tableBuilder, type, args) {
	  this.client        = client
	  this._single       = {};
	  this._modifiers    = {};
	  this._statements   = [];
	  this._type         = columnAlias[type] || type;
	  this._args         = args;
	  this._tableBuilder = tableBuilder;

	  // If we're altering the table, extend the object
	  // with the available "alter" methods.
	  if (tableBuilder._method === 'alter') {
	    _.extend(this, AlterMethods);
	  }
	}

	// All of the modifier methods that can be used to modify the current query.
	var modifiers = [
	  'default', 'defaultsTo', 'defaultTo', 'unsigned',
	  'nullable', 'notNull', 'notNullable',
	  'first', 'after', 'comment'
	];

	// If we call any of the modifiers (index or otherwise) on the chainable, we pretend
	// as though we're calling `table.method(column)` directly.
	_.each(modifiers, function(method) {
	  ColumnBuilder.prototype[method] = function() {
	    if (aliasMethod[method]) {
	      method = aliasMethod[method];
	    }
	    if (method === 'notNullable') return this.nullable(false);
	    this._modifiers[method] = _.toArray(arguments);
	    return this;
	  };
	});

	_.each(['index', 'primary', 'unique'], function(method) {
	  ColumnBuilder.prototype[method] = function() {
	    if (this._type.toLowerCase().indexOf('increments') === -1) {
	      this._tableBuilder[method].apply(this._tableBuilder,
	        [this._args[0]].concat(_.toArray(arguments)));
	    }
	    return this;
	  };
	});

	// Specify that the current column "references" a column,
	// which may be tableName.column or just "column"
	ColumnBuilder.prototype.references = function(value) {
	  return this._tableBuilder.foreign.call(this._tableBuilder, this._args[0], this)
	    ._columnBuilder(this)
	    .references(value);
	};

	var AlterMethods = {};

	// Specify that the column is to be dropped. This takes precedence
	// over all other rules for the column.
	AlterMethods.drop = function() {
	  this._single.drop = true;
	  return this;
	};

	// Specify the "type" that we're looking to set the
	// Knex takes no responsibility for any data-loss that may
	// occur when changing data types.
	AlterMethods.alterType = function(type) {
	  this._statements.push({
	    grouping: 'alterType',
	    value: type
	  });
	  return this;
	};

	// Aliases for convenience.
	var aliasMethod = {
	  default:    'defaultTo',
	  defaultsTo: 'defaultTo',
	  notNull:    'notNullable'
	};

	// Alias a few methods for clarity when processing.
	var columnAlias = {
	  'float'  : 'floating',
	  'enum'   : 'enu',
	  'boolean': 'bool',
	  'string' : 'varchar',
	  'bigint' : 'bigInteger'
	};

	module.exports = ColumnBuilder;


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Column Compiler
	// Used for designating column definitions
	// during the table "create" / "alter" statements.
	// -------
	var _       = __webpack_require__(8);
	var Raw     = __webpack_require__(2);
	var helpers = __webpack_require__(45)

	function ColumnCompiler(client, tableCompiler, columnBuilder) {
	  this.client        = client
	  this.tableCompiler = tableCompiler
	  this.columnBuilder = columnBuilder
	  this.args          = columnBuilder._args;
	  this.type          = columnBuilder._type.toLowerCase();
	  this.grouped       = _.groupBy(columnBuilder._statements, 'grouping');
	  this.modified      = columnBuilder._modifiers;
	  this.isIncrements  = (this.type.indexOf('increments') !== -1);
	  this.formatter     = client.formatter();
	  this.sequence      = [];
	}

	ColumnCompiler.prototype.pushQuery = helpers.pushQuery

	ColumnCompiler.prototype.pushAdditional = helpers.pushAdditional

	// To convert to sql, we first go through and build the
	// column as it would be in the insert statement
	ColumnCompiler.prototype.toSQL = function() {
	  this.pushQuery(this.compileColumn());
	  if (this.sequence.additional) {
	    this.sequence = this.sequence.concat(this.sequence.additional);
	  }
	  return this.sequence;
	};

	// Compiles a column.
	ColumnCompiler.prototype.compileColumn = function() {
	  return this.formatter.wrap(this.getColumnName()) + ' ' +
	    this.getColumnType() + this.getModifiers();
	};

	// Assumes the autoincrementing key is named `id` if not otherwise specified.
	ColumnCompiler.prototype.getColumnName = function() {
	  var value = _.first(this.args);
	  if (value) return value;
	  if (this.isIncrements) {
	    return 'id';
	  } else {
	    throw new Error('You did not specify a column name for the ' + this.type + 'column.');
	  }
	};

	ColumnCompiler.prototype.getColumnType = function() {
	  var type = this[this.type];
	  return typeof type === 'function' ? type.apply(this, _.rest(this.args)) : type;
	};

	ColumnCompiler.prototype.getModifiers = function() {
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

	ColumnCompiler.prototype.increments    = 'integer not null primary key autoincrement';
	ColumnCompiler.prototype.bigincrements = 'integer not null primary key autoincrement';
	ColumnCompiler.prototype.integer       = 
	ColumnCompiler.prototype.smallint      = 
	ColumnCompiler.prototype.mediumint     = 'integer';
	ColumnCompiler.prototype.biginteger    = 'bigint';
	ColumnCompiler.prototype.varchar       = function(length) {
	  return 'varchar(' + this._num(length, 255) + ')';
	};
	ColumnCompiler.prototype.text = 'text';
	ColumnCompiler.prototype.tinyint = 'tinyint';
	ColumnCompiler.prototype.floating = function(precision, scale) {
	  return 'float(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
	};
	ColumnCompiler.prototype.decimal = function(precision, scale) {
	  return 'decimal(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
	};
	ColumnCompiler.prototype.binary = 'blob';
	ColumnCompiler.prototype.bool = 'boolean';
	ColumnCompiler.prototype.date = 'date';
	ColumnCompiler.prototype.datetime = 'datetime';
	ColumnCompiler.prototype.time = 'time';
	ColumnCompiler.prototype.timestamp = 'timestamp';
	ColumnCompiler.prototype.enu = 'varchar';

	ColumnCompiler.prototype.bit =
	ColumnCompiler.prototype.json = 'text';

	ColumnCompiler.prototype.uuid = 'char(36)';
	ColumnCompiler.prototype.specifictype = function(type) {
	  return type;
	};

	// Modifiers
	// -------

	ColumnCompiler.prototype.nullable = function(nullable) {
	  return nullable === false ? 'not null' : 'null';
	};
	ColumnCompiler.prototype.notNullable = function() {
	  return this.nullable(false);
	};
	ColumnCompiler.prototype.defaultTo = function(value) {
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
	ColumnCompiler.prototype._num = function(val, fallback) {
	  if (val === undefined || val === null) return fallback;
	  var number = parseInt(val, 10);
	  return isNaN(number) ? fallback : number;
	};

	module.exports = ColumnCompiler;


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var assert  = __webpack_require__(76);
	var helpers = __webpack_require__(3)

	module.exports = function(Target) {
	  var _ = __webpack_require__(8);
	  var SqlString = __webpack_require__(70);

	  Target.prototype.toQuery = function(tz) {
	    var data = this.toSQL(this._method);
	    if (this._errors && this._errors.length > 0) throw this._errors[0];
	    if (!_.isArray(data)) data = [data];
	    return _.map(data, function(statement) {
	      return this._formatQuery(statement.sql, statement.bindings, tz);
	    }, this).join(';\n');
	  };

	  // Format the query as sql, prepping bindings as necessary.
	  Target.prototype._formatQuery = function(sql, bindings, tz) {
	    if (this.client && this.client.prepBindings) {
	      bindings = this.client.prepBindings(bindings, tz);
	    }
	    return SqlString.format(sql, bindings, true, tz);
	  };

	  // Create a new instance of the `Runner`, passing in the current object.
	  Target.prototype.then = function(/* onFulfilled, onRejected */) {
	    var result = this.client.runner(this).run()
	    return result.then.apply(result, arguments);
	  };

	  // Add additional "options" to the builder. Typically used for client specific
	  // items, like the `mysql` and `sqlite3` drivers.
	  Target.prototype.options = function(opts) {
	    this._options = this._options || [];
	    this._options.push(_.clone(opts) || {});
	    return this;
	  };

	  // Sets an explicit "connnection" we wish to use for this query.
	  Target.prototype.connection = function(connection) {
	    this._connection = connection;
	    return this;
	  };

	  // Set a debug flag for the current schema query stack.
	  Target.prototype.debug = function(enabled) {
	    assert(!arguments.length || typeof enabled === 'boolean', 'debug requires a boolean');
	    this._debug = arguments.length ? enabled : true;
	    return this;
	  };

	  // Set the transaction object for this query.
	  Target.prototype.transacting = function(t) {
	    if (t && t.client) {
	      if (!t.client.transacting) {
	        helpers.warn('Invalid transaction value: ' + t.client)
	      } else {
	        this.client = t.client
	      }
	    }
	    return this;
	  };

	  // Initializes a stream.
	  Target.prototype.stream = function(options) {
	    return this.client.runner(this).stream(options);
	  };

	  // Initialize a stream & pipe automatically.
	  Target.prototype.pipe = function(writable) {
	    return this.client.runner(this).pipe(writable);
	  };

	  // Creates a method which "coerces" to a promise, by calling a
	  // "then" method on the current `Target`
	  _.each(['bind', 'catch', 'finally', 'asCallback', 
	    'spread', 'map', 'reduce', 'tap', 'thenReturn',
	    'return', 'yield', 'ensure', 'nodeify', 'exec'], function(method) {
	    Target.prototype[method] = function() {
	      var then = this.then();
	      return then[method].apply(then, arguments);
	    };
	  });

	};

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var baseAssign = __webpack_require__(71),
	    createAssigner = __webpack_require__(72);

	/**
	 * Assigns own enumerable properties of source object(s) to the destination
	 * object. Subsequent sources overwrite property assignments of previous sources.
	 * If `customizer` is provided it is invoked to produce the assigned values.
	 * The `customizer` is bound to `thisArg` and invoked with five arguments;
	 * (objectValue, sourceValue, key, object, source).
	 *
	 * @static
	 * @memberOf _
	 * @alias extend
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} [sources] The source objects.
	 * @param {Function} [customizer] The function to customize assigning values.
	 * @param {*} [thisArg] The `this` binding of `customizer`.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
	 * // => { 'user': 'fred', 'age': 40 }
	 *
	 * // using a customizer callback
	 * var defaults = _.partialRight(_.assign, function(value, other) {
	 *   return typeof value == 'undefined' ? other : value;
	 * });
	 *
	 * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
	 * // => { 'user': 'barney', 'age': 36 }
	 */
	var assign = createAssigner(baseAssign);

	module.exports = assign;


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var baseToString = __webpack_require__(75);

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
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var baseClone = __webpack_require__(73),
	    bindCallback = __webpack_require__(74);

	/**
	 * Creates a deep clone of `value`. If `customizer` is provided it is invoked
	 * to produce the cloned values. If `customizer` returns `undefined` cloning
	 * is handled by the method instead. The `customizer` is bound to `thisArg`
	 * and invoked with two argument; (value [, index|key, object]).
	 *
	 * **Note:** This method is loosely based on the structured clone algorithm.
	 * The enumerable properties of `arguments` objects and objects created by
	 * constructors other than `Object` are cloned to plain `Object` objects. An
	 * empty object is returned for uncloneable values such as functions, DOM nodes,
	 * Maps, Sets, and WeakMaps. See the [HTML5 specification](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm)
	 * for more details.
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
	 *   return _.isElement(value) ? value.cloneNode(true) : undefined;
	 * });
	 *
	 * body === document.body
	 * // => false
	 * body.nodeName
	 * // => BODY
	 * body.childNodes.length;
	 * // => 20
	 */
	function cloneDeep(value, customizer, thisArg) {
	  customizer = typeof customizer == 'function' && bindCallback(customizer, thisArg, 1);
	  return baseClone(value, true, customizer);
	}

	module.exports = cloneDeep;


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A no-operation function.
	 *
	 * @static
	 * @memberOf _
	 * @category Utility
	 * @example
	 *
	 * var object = { 'user': 'fred' };
	 * _.noop(object) === undefined;
	 * // => true
	 */
	function noop() {
	  // No operation performed.
	}

	module.exports = noop;


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// FunctionHelper
	// -------
	function FunctionHelper(client) {
	  this.client = client
	}

	FunctionHelper.prototype.now = function() {
	  return this.client.raw('CURRENT_TIMESTAMP')
	}

	module.exports = FunctionHelper

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// All properties we can use to start a query chain
	// from the `knex` object, e.g. `knex.select('*').from(...`
	module.exports = [
	  'select',
	  'as',
	  'columns',
	  'column',
	  'from',
	  'fromJS',
	  'into',
	  'table',
	  'distinct',
	  'join',
	  'joinRaw',
	  'innerJoin',
	  'leftJoin',
	  'leftOuterJoin',
	  'rightJoin',
	  'rightOuterJoin',
	  'outerJoin',
	  'fullOuterJoin',
	  'crossJoin',
	  'where',
	  'andWhere',
	  'orWhere',
	  'whereNot',
	  'orWhereNot',
	  'whereRaw',
	  'whereWrapped',
	  'havingWrapped',
	  'orWhereRaw',
	  'whereExists',
	  'orWhereExists',
	  'whereNotExists',
	  'orWhereNotExists',
	  'whereIn',
	  'orWhereIn',
	  'whereNotIn',
	  'orWhereNotIn',
	  'whereNull',
	  'orWhereNull',
	  'whereNotNull',
	  'orWhereNotNull',
	  'whereBetween',
	  'whereNotBetween',
	  'orWhereBetween',
	  'orWhereNotBetween',
	  'groupBy',
	  'groupByRaw',
	  'orderBy',
	  'orderByRaw',
	  'union',
	  'unionAll',
	  'having',
	  'havingRaw',
	  'orHaving',
	  'orHavingRaw',
	  'offset',
	  'limit',
	  'count',
	  'min',
	  'max',
	  'sum',
	  'avg',
	  'increment',
	  'decrement',
	  'first',
	  'debug',
	  'pluck',
	  'insert',
	  'update',
	  'returning',
	  'del',
	  'delete',
	  'truncate',
	  'transacting',
	  'connection'
	];

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	var escapeStringRegexp = __webpack_require__(96);
	var ansiStyles = __webpack_require__(98);
	var stripAnsi = __webpack_require__(99);
	var hasAnsi = __webpack_require__(101);
	var supportsColor = __webpack_require__(100);
	var defineProps = Object.defineProperties;

	function Chalk(options) {
		// detect mode if not set manually
		this.enabled = !options || options.enabled === undefined ? supportsColor : options.enabled;
	}

	// use bright blue on Windows as the normal blue color is illegible
	if (process.platform === 'win32') {
		ansiStyles.blue.open = '\u001b[94m';
	}

	function build(_styles) {
		var builder = function builder() {
			return applyStyle.apply(builder, arguments);
		};
		builder._styles = _styles;
		builder.enabled = this.enabled;
		// __proto__ is used because we must return a function, but there is
		// no way to create a function with a different prototype.
		builder.__proto__ = proto;
		return builder;
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

		/*jshint validthis: true */
		var nestedStyles = this._styles;

		var i = nestedStyles.length;
		while (i--) {
			var code = ansiStyles[nestedStyles[i]];
			// Replace any instances already present with a re-opening code
			// otherwise only the part of the string until said closing code
			// will be colored, and the rest will simply be 'plain'.
			str = code.open + str.replace(code.closeRe, code.open) + code.close;
		}

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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 30 */
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
/* 31 */
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
	        len = arguments.length;
	        args = new Array(len - 1);
	        for (i = 1; i < len; i++)
	          args[i - 1] = arguments[i];
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    len = arguments.length;
	    args = new Array(len - 1);
	    for (i = 1; i < len; i++)
	      args[i - 1] = arguments[i];

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
	    var m;
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
	  } else {
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

	EventEmitter.listenerCount = function(emitter, type) {
	  var ret;
	  if (!emitter._events || !emitter._events[type])
	    ret = 0;
	  else if (isFunction(emitter._events[type]))
	    ret = 1;
	  else
	    ret = emitter._events[type].length;
	  return ret;
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
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Pool = __webpack_require__(77),
	    Cluster = __webpack_require__(78);

	Pool.Cluster = Cluster;
	module.exports = Pool;


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// MariaSQL Client
	// -------
	var inherits     = __webpack_require__(41)
	var assign       = __webpack_require__(23)
	var Client_MySQL = __webpack_require__(34)
	var Promise      = __webpack_require__(10)

	var Mariasql;

	function Client_MariaSQL(config) {
	  Client_MySQL.call(this, config)
	}
	inherits(Client_MariaSQL, Client_MySQL)

	assign(Client_MariaSQL.prototype, {

	  dialect: 'mariasql',

	  driverName: 'mariasql',

	  // Get a raw connection, called by the `pool` whenever a new
	  // connection needs to be added to the pool.
	  acquireRawConnection: function() {
	    var connection = new this.driver();
	    connection.connect(assign({metadata: true}, this.connectionSettings));
	    return new Promise(function(resolver, rejecter) {
	      connection
	        .on('connect', function() {
	          connection.removeAllListeners('end');
	          connection.removeAllListeners('error');
	          resolver(connection);
	        })
	        .on('error', rejecter);
	    })
	  },

	  // Return the database for the MariaSQL client.
	  database: function() {
	    return this.connectionSettings.db;
	  },

	  // Grab a connection, run the query via the MariaSQL streaming interface,
	  // and pass that through to the stream we've sent back to the client.
	  _stream: function(connection, sql, stream) {
	    return new Promise(function(resolver, rejecter) {
	      connection.query(sql.sql, sql.bindings)
	        .on('result', function(result) {
	          result
	            .on('row', rowHandler(function(row) { stream.write(row); }))
	            .on('end', function(data) { resolver(data); });
	        })
	        .on('error', function(err) { rejecter(err); });
	    });
	  },

	  // Runs the query on the specified connection, providing the bindings
	  // and any other necessary prep work.
	  _query: function(connection, obj) {
	    var tz  = this.connectionSettings.timezone || 'local';
	    return new Promise(function(resolver, rejecter) {
	      if (!obj.sql) return resolver()
	      var rows = [];
	      var query = connection.query(SqlString.format(sql, obj.bindings, false, tz), [])
	      query.on('result', function(result) {
	        result.on('row', rowHandler(function(row) { rows.push(row); }))
	        .on('end', function(data) {
	          obj.response = [rows, data];
	          resolver(obj);
	        });
	      })
	      .on('error', rejecter)
	    });
	  },

	  // Process the response as returned from the query.
	  processResponse: function(obj, runner) {
	    var response = obj.response;
	    var method   = obj.method;
	    var rows     = response[0];
	    var data     = response[1];
	    if (obj.output) return obj.output.call(runner, rows/*, fields*/);
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
	        return data.affectedRows;
	      default:
	        return response;
	    }
	  }  

	})

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

	function rowHandler(callback) {
	  var types;
	  return function(row, meta) {
	    if (!types) types = meta.types;
	    var keys = Object.keys(types);
	    for (var i = 0, l = keys.length; i < l; i++) {
	      var type = keys[i];
	      row[type] = parseType(row[type], types[type]);
	    }
	    callback(row);
	  };
	}

	Client_MariaSQL.__proto__ = Client_MySQL

	module.exports = Client_MariaSQL


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// MySQL Client
	// -------
	var inherits       = __webpack_require__(41)
	var assign         = __webpack_require__(23)

	var Client         = __webpack_require__(4)
	var Promise        = __webpack_require__(10)
	var helpers        = __webpack_require__(3)

	var QueryCompiler  = __webpack_require__(46)
	var SchemaCompiler = __webpack_require__(48)
	var TableCompiler  = __webpack_require__(49)
	var ColumnCompiler = __webpack_require__(47)
	var pluck          = __webpack_require__(80)

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

	  QueryCompiler: QueryCompiler,
	  
	  SchemaCompiler: SchemaCompiler,

	  TableCompiler: TableCompiler,

	  ColumnCompiler: ColumnCompiler,

	  wrapIdentifier: function(value) {
	    return (value !== '*' ? '`' + value.replace(/`/g, '``') + '`' : '*')
	  },

	  // Get a raw connection, called by the `pool` whenever a new
	  // connection needs to be added to the pool.
	  acquireRawConnection: function() {
	    var client     = this
	    var connection = this.driver.createConnection(this.connectionSettings)
	    this.databaseName = connection.config.database
	    return new Promise(function(resolver, rejecter) {
	      connection.connect(function(err) {
	        if (err) return rejecter(err)
	        connection.on('error', connectionErrorHandler.bind(null, client, connection))
	        connection.on('end', connectionErrorHandler.bind(null, client, connection))
	        resolver(connection)
	      });
	    });
	  },

	  // Used to explicitly close a connection, called internally by the pool
	  // when a connection times out or the pool is shutdown.
	  destroyRawConnection: function(connection, cb) {
	    connection.end(cb);
	  },

	  // Grab a connection, run the query via the MySQL streaming interface,
	  // and pass that through to the stream we've sent back to the client.
	  _stream: function(connection, obj, stream, options) {
	    options = options || {}
	    return new Promise(function(resolver, rejecter) {
	      stream.on('error', rejecter)
	      stream.on('end', resolver)
	      connection.query(obj.sql, obj.bindings).stream(options).pipe(stream)
	    })
	  },

	  // Runs the query on the specified connection, providing the bindings
	  // and any other necessary prep work.
	  _query: function(connection, obj) {
	    if (!obj || typeof obj === 'string') obj = {sql: obj}
	    return new Promise(function(resolver, rejecter) {
	      var sql = obj.sql
	      if (obj.options) sql = assign({sql: sql}, obj.options)
	      if (!sql) return resolver()
	      connection.query(sql, obj.bindings, function(err, rows, fields) {
	        if (err) return rejecter(err)
	        obj.response = [rows, fields]
	        resolver(obj)
	      })
	    })
	  },

	  // Process the response as returned from the query.
	  processResponse: function(obj, runner) {
	    if (obj == undefined) return;
	    var response = obj.response
	    var method   = obj.method
	    var rows     = response[0]
	    var fields   = response[1]
	    if (obj.output) return obj.output.call(runner, rows, fields)
	    switch (method) {
	      case 'select':
	      case 'pluck':
	      case 'first':
	        var resp = helpers.skim(rows)
	        if (method === 'pluck') return pluck(resp, obj.pluck)
	        return method === 'first' ? resp[0] : resp
	      case 'insert':
	        return [rows.insertId]
	      case 'del':
	      case 'update':
	      case 'counter':
	        return rows.affectedRows
	      default:
	        return response
	    }
	  }  

	})

	// MySQL Specific error handler
	function connectionErrorHandler(client, connection, err) {
	  if (connection && err && err.fatal) {
	    if (connection.__knex__disposed) return
	    connection.__knex__disposed = true
	    client.pool.destroy(connection)
	  }
	}

	Client_MySQL.__proto__ = Client

	module.exports = Client_MySQL


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// MySQL2 Client
	// -------
	var inherits     = __webpack_require__(41)
	var Client_MySQL = __webpack_require__(34)
	var Promise      = __webpack_require__(10)
	var helpers      = __webpack_require__(3)
	var pick         = __webpack_require__(79)
	var pluck        = __webpack_require__(80)
	var assign       = __webpack_require__(23);

	var configOptions = ['user', 'database', 'host', 'password', 'ssl', 'connection', 'stream']

	// Always initialize with the "QueryBuilder" and "QueryCompiler"
	// objects, which extend the base 'lib/query/builder' and
	// 'lib/query/compiler', respectively.
	function Client_MySQL2(config) {
	  Client_MySQL.call(this, config)
	}
	inherits(Client_MySQL2, Client_MySQL)

	assign(Client_MySQL2.prototype, {

	  // The "dialect", for reference elsewhere.
	  driverName: 'mysql2',

	  // Get a raw connection, called by the `pool` whenever a new
	  // connection needs to be added to the pool.
	  acquireRawConnection: function() {
	    var connection = this.driver.createConnection(pick(this.connectionSettings, configOptions))
	    this.databaseName = connection.config.database;
	    return new Promise(function(resolver, rejecter) {
	      connection.connect(function(err) {
	        if (err) return rejecter(err)
	        resolver(connection)
	      })
	    })
	  },

	  processResponse: function(obj, runner) {
	    var response = obj.response
	    var method   = obj.method
	    var rows     = response[0]
	    var fields   = response[1]
	    if (obj.output) return obj.output.call(runner, rows, fields)
	    switch (method) {
	      case 'select':
	      case 'pluck':
	      case 'first':
	        var resp = helpers.skim(rows)
	        if (method === 'pluck') return pluck(resp, obj.pluck)
	        return method === 'first' ? resp[0] : resp
	      case 'insert':
	        return [rows.insertId]
	      case 'del':
	      case 'update':
	      case 'counter':
	        return rows.affectedRows
	      default:
	        return response
	    }
	  }

	})

	Client_MySQL2.__proto__ = Client_MySQL

	module.exports = Client_MySQL2;


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Oracle Client
	// -------
	var _                 = __webpack_require__(8)
	var inherits          = __webpack_require__(41)
	var Client            = __webpack_require__(4)
	var Promise           = __webpack_require__(10)
	var ReturningHelper   = __webpack_require__(58).ReturningHelper
	var Formatter         = __webpack_require__(50)
	var assign            = __webpack_require__(23)

	var QueryCompiler     = __webpack_require__(51)
	var SchemaCompiler    = __webpack_require__(54)
	var ColumnBuilder     = __webpack_require__(52)
	var ColumnCompiler    = __webpack_require__(53)
	var TableCompiler     = __webpack_require__(55)
	var OracleQueryStream = __webpack_require__(56)

	// Always initialize with the "QueryBuilder" and "QueryCompiler"
	// objects, which extend the base 'lib/query/builder' and
	// 'lib/query/compiler', respectively.
	function Client_Oracle(config) {
	  Client.call(this, config)
	}
	inherits(Client_Oracle, Client)

	assign(Client_Oracle.prototype, {

	  dialect: 'oracle',

	  driverName: 'oracle',

	  Formatter: Formatter,

	  QueryCompiler: QueryCompiler,

	  SchemaCompiler: SchemaCompiler,

	  ColumnBuilder: ColumnBuilder,

	  ColumnCompiler: ColumnCompiler,

	  TableCompiler: TableCompiler,

	  // Get a raw connection, called by the `pool` whenever a new
	  // connection needs to be added to the pool.
	  acquireRawConnection: function() {
	    var client = this
	    return new Promise(function(resolver, rejecter) {
	      client.driver.connect(client.connectionSettings,
	        function(err, connection) {
	          if (err) return rejecter(err)
	          if (client.connectionSettings.prefetchRowCount) {
	            connection.setPrefetchRowCount(client.connectionSettings.prefetchRowCount)
	          }
	          resolver(connection)
	        })
	    })
	  },

	  // Used to explicitly close a connection, called internally by the pool
	  // when a connection times out or the pool is shutdown.
	  destroyRawConnection: function(connection, cb) {
	    connection.close()
	    cb()
	  },

	  // Return the database for the Oracle client.
	  database: function() {
	    return this.connectionSettings.database
	  },

	  // Position the bindings for the query.
	  positionBindings: function(sql) {
	    var questionCount = 0
	    return sql.replace(/\?/g, function() {
	      questionCount += 1
	      return ':' + questionCount
	    })
	  },

	  _stream: function(connection, obj, stream, options) {
	    obj.sql = this.positionBindings(obj.sql);
	    return new Promise(function (resolver, rejecter) {
	      stream.on('error', rejecter);
	      stream.on('end', resolver);
	      var queryStream = new OracleQueryStream(connection, obj.sql, obj.bindings, options);
	      queryStream.pipe(stream)
	    });
	  },

	  // Runs the query on the specified connection, providing the bindings
	  // and any other necessary prep work.
	  _query: function(connection, obj) {

	    // convert ? params into positional bindings (:1)
	    obj.sql = this.client.positionBindings(obj.sql);
	    
	    obj.bindings = obj.bindings || [];

	    if (!obj.sql) throw new Error('The query is empty');

	    return new Promise(function(resolver, rejecter) {
	      connection.execute(obj.sql, obj.bindings, function(err, response) {
	        if (err) return rejecter(err);

	        if (obj.returning) {
	          var rowIds = obj.outParams.map(function (v, i) {
	            return response['returnParam' + (i ? i : '')];
	          });

	          return connection.execute(obj.returningSql, rowIds, function (err, subres) {
	            if (err) return rejecter(err);
	            obj.response = subres;
	            resolver(obj);
	          });

	        } else {
	          obj.response = response;
	          resolver(obj);
	        }
	      });
	    });
	  },

	  // Process the response as returned from the query.
	  processResponse: function(obj, runner) {
	    var response = obj.response;
	    var method   = obj.method;
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

	})

	Client_Oracle.__proto__ = Client

	module.exports = Client_Oracle


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// PostgreSQL
	// -------
	var _              = __webpack_require__(8)
	var inherits       = __webpack_require__(41)
	var Client         = __webpack_require__(4)
	var Promise        = __webpack_require__(10)
	var utils          = __webpack_require__(63)
	var assign         = __webpack_require__(23)

	var QueryCompiler  = __webpack_require__(59)
	var ColumnCompiler = __webpack_require__(60)
	var TableCompiler  = __webpack_require__(62)
	var SchemaCompiler = __webpack_require__(61)
	var PGQueryStream;

	function Client_PG(config) {
	  Client.apply(this, arguments)
	  if (config.returning) {
	    this.defaultReturning = config.returning;
	  }
	}
	inherits(Client_PG, Client)

	assign(Client_PG.prototype, {

	  QueryCompiler: QueryCompiler,

	  ColumnCompiler: ColumnCompiler,

	  SchemaCompiler: SchemaCompiler,

	  TableCompiler: TableCompiler,

	  dialect: 'postgresql',

	  driverName: 'pg',

	  wrapIdentifier: function(value) {
	    if (value === '*') return value;
	    var matched = value.match(/(.*?)(\[[0-9]\])/);
	    if (matched) return this.wrapIdentifier(matched[1]) + matched[2];
	    return '"' + value.replace(/"/g, '""') + '"';
	  },

	  // Prep the bindings as needed by PostgreSQL.
	  prepBindings: function(bindings, tz) {
	    return _.map(bindings, utils.prepareValue);
	  },

	  // Get a raw connection, called by the `pool` whenever a new
	  // connection needs to be added to the pool.
	  acquireRawConnection: function() {
	    var client = this;
	    return new Promise(function(resolver, rejecter) {
	      var connection = new client.driver.Client(client.connectionSettings);
	      client.databaseName = connection.database;
	      connection.connect(function(err, connection) {
	        if (err) return rejecter(err);
	        connection.on('error', client.__endConnection.bind(client, connection));
	        connection.on('end', client.__endConnection.bind(client, connection));
	        if (!client.version) {
	          return client.checkVersion(connection).then(function(version) {
	            client.version = version;
	            resolver(connection);
	          });
	        }
	        resolver(connection);
	      });
	    });
	  },

	  // Used to explicitly close a connection, called internally by the pool
	  // when a connection times out or the pool is shutdown.
	  destroyRawConnection: function(connection, cb) {
	    connection.end()
	    cb()
	  },

	  // In PostgreSQL, we need to do a version check to do some feature
	  // checking on the database.
	  checkVersion: function(connection) {
	    return new Promise(function(resolver, rejecter) {
	      connection.query('select version();', function(err, resp) {
	        if (err) return rejecter(err);
	        resolver(/^PostgreSQL (.*?) /.exec(resp.rows[0].version)[1]);
	      });
	    });
	  },

	  // Position the bindings for the query.
	  positionBindings: function(sql) {
	    var questionCount = 0;
	    return sql.replace(/\?/g, function() {
	      questionCount++;
	      return '$' + questionCount;
	    });
	  },

	  _stream: function(connection, obj, stream, options) {
	    PGQueryStream = PGQueryStream || __webpack_require__(94);
	    var runner = this;
	    var sql = obj.sql = this.positionBindings(obj.sql)
	    return new Promise(function(resolver, rejecter) {
	      stream.on('error', rejecter);
	      stream.on('end', resolver);
	      connection.query(new PGQueryStream(sql, obj.bindings, options)).pipe(stream);
	    });
	  },

	  // Runs the query on the specified connection, providing the bindings
	  // and any other necessary prep work.
	  _query: function(connection, obj) {
	    var sql = obj.sql = this.positionBindings(obj.sql)
	    if (obj.options) sql = _.extend({text: sql}, obj.options);
	    return new Promise(function(resolver, rejecter) {
	      connection.query(sql, obj.bindings, function(err, response) {
	        if (err) return rejecter(err);
	        obj.response = response;
	        resolver(obj);
	      });
	    });
	  },

	  // Ensures the response is returned in the same format as other clients.
	  processResponse: function(obj, runner) {
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

	  __endConnection: function(connection) {
	    if (!connection || connection.__knex__disposed) return;
	    if (this.pool) {
	      connection.__knex__disposed = true;
	      this.pool.destroy(connection);
	    }
	  },


	})

	Client_PG.__proto__ = Client

	module.exports = Client_PG


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// SQLite3
	// -------
	var Promise        = __webpack_require__(10)

	var inherits       = __webpack_require__(41)
	var assign         = __webpack_require__(23)
	var pluck          = __webpack_require__(80);

	var Client         = __webpack_require__(4)
	var helpers        = __webpack_require__(3)

	var QueryCompiler  = __webpack_require__(64)
	var SchemaCompiler = __webpack_require__(66)
	var ColumnCompiler = __webpack_require__(65)
	var TableCompiler  = __webpack_require__(68)
	var SQLite3_DDL    = __webpack_require__(67)

	function Client_SQLite3(config) {
	  Client.call(this, config)
	}
	inherits(Client_SQLite3, Client)

	assign(Client_SQLite3.prototype, {

	  dialect: 'sqlite3',

	  driverName: 'sqlite3',

	  SchemaCompiler: SchemaCompiler,

	  QueryCompiler: QueryCompiler,

	  ColumnCompiler: ColumnCompiler,

	  TableCompiler: TableCompiler,

	  ddl: function(compiler, pragma, connection) {
	    return new SQLite3_DDL(this, compiler, pragma, connection)
	  },

	  // Get a raw connection from the database, returning a promise with the connection object.
	  acquireRawConnection: function() {
	    var client = this;
	    return new Promise(function(resolve, reject) {
	      var db = new client.driver.Database(client.connectionSettings.filename, function(err) {
	        if (err) return reject(err)
	        resolve(db)
	      })
	    })
	  },

	  // Used to explicitly close a connection, called internally by the pool
	  // when a connection times out or the pool is shutdown.
	  destroyRawConnection: function(connection, cb) {
	    connection.close()
	    cb()
	  },

	  // Runs the query on the specified connection, providing the bindings and any other necessary prep work.
	  _query: function(connection, obj) {
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
	    return new Promise(function(resolver, rejecter) {
	      if (!connection || !connection[callMethod]) {
	        return rejecter(new Error('Error calling ' + callMethod + ' on connection.'))
	      }
	      connection[callMethod](obj.sql, obj.bindings, function(err, response) {
	        if (err) return rejecter(err)
	        obj.response = response;

	        // We need the context here, as it contains
	        // the "this.lastID" or "this.changes"
	        obj.context  = this;
	        return resolver(obj)
	      })
	    })
	  },

	  // Sounds like .each doesn't work great for
	  _stream: function(connection, sql, stream) {
	    var client = this;
	    return new Promise(function(resolver, rejecter) {
	      stream.on('error', rejecter)
	      stream.on('end', resolver)
	      return client._query(connection, sql).then(function(obj) {
	        return obj.response
	      }).map(function(row) {
	        stream.write(row)
	      }).catch(function(err) {
	        stream.emit('error', err)
	      }).then(function() {
	        stream.end()
	      })
	    })
	  },

	  // Ensures the response is returned in the same format as other clients.
	  processResponse: function(obj, runner) {
	    var ctx      = obj.context;
	    var response = obj.response;
	    if (obj.output) return obj.output.call(runner, response)
	    switch (obj.method) {
	      case 'select':
	      case 'pluck':
	      case 'first':
	        response = helpers.skim(response)
	        if (obj.method === 'pluck') response = pluck(response, obj.pluck)
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

	  poolDefaults: function(config) {
	    return assign(Client.prototype.poolDefaults.call(this, config), {
	      min: 1,
	      max: 1
	    })
	  } 

	})

	Client_SQLite3.__proto__ = Client

	module.exports = Client_SQLite3


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Oracle Client
	// -------
	var inherits = __webpack_require__(41)
	var Client_Oracle = __webpack_require__(36)

	function Client_StrongOracle() {
	  Client_Oracle.apply(this, arguments);
	}
	inherits(Client_StrongOracle, Client_Oracle);

	Client_StrongOracle.prototype.driverName = 'strong-oracle'

	Client_StrongOracle.__proto__ = Client_Oracle

	module.exports = Client_StrongOracle;


/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// WebSQL
	// -------
	var inherits = __webpack_require__(41);
	var _        = __webpack_require__(8);

	var Client_SQLite3 = __webpack_require__(38);
	var Promise        = __webpack_require__(10);
	var assign         = __webpack_require__(23);

	function Client_WebSQL(config) {
	  Client_SQLite3.call(this, config);
	  this.name          = config.name || 'knex_database';
	  this.version       = config.version || '1.0';
	  this.displayName   = config.displayName || this.name;
	  this.estimatedSize = config.estimatedSize || 5 * 1024 * 1024;
	}
	inherits(Client_WebSQL, Client_SQLite3);

	assign(Client_WebSQL.prototype, {

	  dialect: 'websql',

	  // Get a raw connection from the database, returning a promise with the connection object.
	  acquireConnection: function() {
	    var client = this;
	    return new Promise(function(resolve, reject) {
	      try {
	        /*jslint browser: true*/
	        var db = openDatabase(client.name, client.version, client.displayName, client.estimatedSize);
	        db.transaction(function(t) {
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
	  releaseConnection: function() {
	    return Promise.resolve()
	  },

	  // Runs the query on the specified connection,
	  // providing the bindings and any other necessary prep work.
	  _query: function(connection, obj) {
	    return new Promise(function(resolver, rejecter) {
	      if (!connection) return rejecter(new Error('No connection provided.'));
	      connection.executeSql(obj.sql, obj.bindings, function(trx, response) {
	        obj.response = response;
	        return resolver(obj);
	      }, function(trx, err) {
	        rejecter(err);
	      });
	    });
	  },

	  processResponse: function(obj, runner) {
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

	})

	Client_WebSQL.__proto__ = Client_SQLite3

	module.exports = Client_WebSQL;


/***/ },
/* 41 */
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
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * This is the web browser implementation of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = __webpack_require__(83);
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;

	/**
	 * Use chrome.storage.local if we are in an app
	 */

	var storage;

	if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined')
	  storage = chrome.storage.local;
	else
	  storage = localstorage();

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
	      storage.removeItem('debug');
	    } else {
	      storage.debug = namespaces;
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
	    r = storage.debug;
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
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	var arrayEach = __webpack_require__(85),
	    baseCallback = __webpack_require__(86),
	    baseCreate = __webpack_require__(87),
	    baseForOwn = __webpack_require__(88),
	    isArray = __webpack_require__(89),
	    isFunction = __webpack_require__(90),
	    isObject = __webpack_require__(91),
	    isTypedArray = __webpack_require__(92);

	/**
	 * An alternative to `_.reduce`; this method transforms `object` to a new
	 * `accumulator` object which is the result of running each of its own enumerable
	 * properties through `iteratee`, with each invocation potentially mutating
	 * the `accumulator` object. The `iteratee` is bound to `thisArg` and invoked
	 * with four arguments; (accumulator, value, key, object). Iterator functions
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
	 * var squares = _.transform([1, 2, 3, 4, 5, 6], function(result, n) {
	 *   n *= n;
	 *   if (n % 2) {
	 *     return result.push(n) < 3;
	 *   }
	 * });
	 * // => [1, 9, 25]
	 *
	 * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, n, key) {
	 *   result[key] = n * 3;
	 * });
	 * // => { 'a': 3, 'b': 6, 'c': 9 }
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
	        accumulator = baseCreate(isFunction(Ctor) && Ctor.prototype);
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
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// JoinClause
	// -------

	// The "JoinClause" is an object holding any necessary info about a join,
	// including the type, and any associated tables & columns being joined.
	function JoinClause(table, type) {
	  this.table    = table;
	  this.joinType = type;
	  this.and      = this;
	  this.clauses  = [];
	}

	JoinClause.prototype.grouping = 'join';

	// Adds an "on" clause to the current join object.
	JoinClause.prototype.on = function(first, operator, second) {
	  var data;
	  switch (arguments.length) {
	    case 1:  data = ['on', this._bool(), first]; break;
	    case 2:  data = ['on', this._bool(), first, '=', operator]; break;
	    default: data = ['on', this._bool(), first, operator, second];
	  }
	  this.clauses.push(data);
	  return this;
	};

	// Adds a "using" clause to the current join.
	JoinClause.prototype.using = function(table) {
	  return this.clauses.push(['using', this._bool(), table]);
	};

	// Adds an "and on" clause to the current join object.
	JoinClause.prototype.andOn = function() {
	  return this.on.apply(this, arguments);
	};

	// Adds an "or on" clause to the current join object.
	JoinClause.prototype.orOn = function(first, operator, second) {
	  /*jshint unused: false*/
	  return this._bool('or').on.apply(this, arguments);
	};

	// Explicitly set the type of join, useful within a function when creating a grouped join.
	JoinClause.prototype.type = function(type) {
	  this.joinType = type;
	  return this;
	};

	JoinClause.prototype._bool = function(bool) {
	  if (arguments.length === 1) {
	    this._boolFlag = bool;
	    return this;
	  }
	  var ret = this._boolFlag || 'and';
	  this._boolFlag = 'and';
	  return ret;
	};

	Object.defineProperty(JoinClause.prototype, 'or', {
	  get: function () {
	    return this._bool('or');
	  }
	});

	module.exports = JoinClause;

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(8);

	// Push a new query onto the compiled "sequence" stack,
	// creating a new formatter, returning the compiler.
	exports.pushQuery = function(query) {
	  if (!query) return;
	  if (_.isString(query)) {
	    query = {sql: query};
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
	exports.pushAdditional = function(fn) {
	  var child = new this.constructor(this.client, this.tableCompiler, this.columnBuilder);
	  fn.call(child, _.rest(arguments));
	  this.sequence.additional = (this.sequence.additional || []).concat(child.sequence);
	};


/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// MySQL Query Compiler
	// ------
	var _             = __webpack_require__(8)
	var inherits      = __webpack_require__(41)
	var QueryCompiler = __webpack_require__(15)
	var assign        = __webpack_require__(23);

	function QueryCompiler_MySQL(client, builder) {
	  QueryCompiler.call(this, client, builder)
	}
	inherits(QueryCompiler_MySQL, QueryCompiler)

	assign(QueryCompiler_MySQL.prototype, {

	  _emptyInsertValue: '() values ()',

	  // Update method, including joins, wheres, order & limits.
	  update: function() {
	    var join    = this.join();
	    var updates = this._prepUpdate(this.single.update);
	    var where   = this.where();
	    var order   = this.order();
	    var limit   = this.limit();
	    return 'update ' + this.tableName +
	      (join ? ' ' + join : '') +
	      ' set ' + updates.join(', ') +
	      (where ? ' ' + where : '') +
	      (order ? ' ' + order : '') +
	      (limit ? ' ' + limit : '');
	  },

	  forUpdate: function() {
	    return 'for update';
	  },

	  forShare: function() {
	    return 'lock in share mode';
	  },

	  // Compiles a `columnInfo` query.
	  columnInfo: function() {
	    var column = this.single.columnInfo;
	    return {
	      sql: 'select * from information_schema.columns where table_name = ? and table_schema = ?',
	      bindings: [this.single.table, this.client.database()],
	      output: function(resp) {
	        var out = resp.reduce(function(columns, val) {
	          columns[val.COLUMN_NAME] = {
	            defaultValue: val.COLUMN_DEFAULT,
	            type: val.DATA_TYPE,
	            maxLength: val.CHARACTER_MAXIMUM_LENGTH,
	            nullable: (val.IS_NULLABLE === 'YES')
	          };
	          return columns
	        }, {})
	        return column && out[column] || out;
	      }
	    };
	  },

	  limit: function() {
	    var noLimit = !this.single.limit && this.single.limit !== 0;
	    if (noLimit && !this.single.offset) return '';

	    // Workaround for offset only, see http://stackoverflow.com/questions/255517/mysql-offset-infinite-rows
	    return 'limit ' + ((this.single.offset && noLimit) ? '18446744073709551615' : this.formatter.parameter(this.single.limit));
	  }

	})

	// Set the QueryBuilder & QueryCompiler on the client object,
	// incase anyone wants to modify things to suit their own purposes.
	module.exports = QueryCompiler_MySQL;


/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// MySQL Column Compiler
	// -------
	var inherits       = __webpack_require__(41)
	var ColumnCompiler = __webpack_require__(21)
	var helpers        = __webpack_require__(3)
	var assign         = __webpack_require__(23);

	function ColumnCompiler_MySQL() {
	  ColumnCompiler.apply(this, arguments);
	  this.modifiers = ['unsigned', 'nullable', 'defaultTo', 'first', 'after', 'comment']
	}
	inherits(ColumnCompiler_MySQL, ColumnCompiler);

	// Types
	// ------

	assign(ColumnCompiler_MySQL.prototype, {

	  increments: 'int unsigned not null auto_increment primary key',

	  bigincrements: 'bigint unsigned not null auto_increment primary key',

	  bigint: 'bigint',

	  double: function(precision, scale) {
	    if (!precision) return 'double'
	    return 'double(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')'
	  },

	  integer: function(length) {
	    length = length ? '(' + this._num(length, 11) + ')' : ''
	    return 'int' + length
	  },

	  mediumint: 'mediumint',

	  smallint: 'smallint',

	  tinyint: function(length) {
	    length = length ? '(' + this._num(length, 1) + ')' : ''
	    return 'tinyint' + length
	  },

	  text: function(column) {
	    switch (column) {
	      case 'medium':
	      case 'mediumtext':
	        return 'mediumtext';
	      case 'long':
	      case 'longtext':
	        return 'longtext'
	      default:
	        return 'text';
	    }
	  },

	  mediumtext: function() {
	    return this.text('medium')
	  },

	  longtext: function() {
	    return this.text('long')
	  },

	  enu: function(allowed) {
	    return "enum('" + allowed.join("', '")  + "')"
	  },

	  datetime: 'datetime',

	  timestamp: 'timestamp',

	  bit: function(length) {
	    return length ? 'bit(' + this._num(length) + ')' : 'bit'
	  },

	  binary: function(length) {
	    return length ? 'varbinary(' + this._num(length) + ')' : 'blob'
	  },

	  // Modifiers
	  // ------

	  defaultTo: function(value) {
	    /*jshint unused: false*/
	    var defaultVal = ColumnCompiler_MySQL.super_.prototype.defaultTo.apply(this, arguments);
	    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
	      return defaultVal
	    }
	    return ''
	  },
	  
	  unsigned: function() {
	    return 'unsigned'
	  },
	  
	  first: function() {
	    return 'first'
	  },
	  
	  after: function(column) {
	    return 'after ' + this.formatter.wrap(column)
	  },
	  
	  comment: function(comment) {
	    if (comment && comment.length > 255) {
	      helpers.warn('Your comment is longer than the max comment length for MySQL')
	    }
	    return comment && "comment '" + comment + "'"
	  }

	})

	module.exports = ColumnCompiler_MySQL;


/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// MySQL Schema Compiler
	// -------
	var inherits       = __webpack_require__(41);
	var SchemaCompiler = __webpack_require__(17);
	var assign         = __webpack_require__(23);

	function SchemaCompiler_MySQL(client, builder) {
	  SchemaCompiler.call(this, client, builder)
	}
	inherits(SchemaCompiler_MySQL, SchemaCompiler)

	assign(SchemaCompiler_MySQL.prototype, {

	  // Rename a table on the schema.
	  renameTable: function(tableName, to) {
	    this.pushQuery('rename table ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
	  },

	  // Check whether a table exists on the query.
	  hasTable: function(tableName) {
	    this.pushQuery({
	      sql: 'show tables like ' + this.formatter.parameter(tableName),
	      output: function(resp) {
	        return resp.length > 0;
	      }
	    });
	  },

	  // Check whether a column exists on the schema.
	  hasColumn: function(tableName, column) {
	    this.pushQuery({
	      sql: 'show columns from ' + this.formatter.wrap(tableName) +
	        ' like ' + this.formatter.parameter(column),
	      output: function(resp) {
	        return resp.length > 0;
	      }
	    });
	  }

	})

	module.exports = SchemaCompiler_MySQL;


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// MySQL Table Builder & Compiler
	// -------
	var inherits      = __webpack_require__(41);
	var TableCompiler = __webpack_require__(19);
	var helpers       = __webpack_require__(3);
	var Promise       = __webpack_require__(10);
	var assign        = __webpack_require__(23);

	// Table Compiler
	// ------

	function TableCompiler_MySQL() {
	  TableCompiler.apply(this, arguments);
	}
	inherits(TableCompiler_MySQL, TableCompiler);

	assign(TableCompiler_MySQL.prototype, {

	  createQuery: function(columns, ifNot) {
	    var createStatement = ifNot ? 'create table if not exists ' : 'create table ';
	    var client = this.client, conn = {}, 
	      sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')';

	    // Check if the connection settings are set.
	    if (client.connectionSettings) {
	      conn = client.connectionSettings;
	    }

	    var charset   = this.single.charset || conn.charset || '';
	    var collation = this.single.collate || conn.collate || '';
	    var engine    = this.single.engine  || '';

	    // var conn = builder.client.connectionSettings;
	    if (charset)   sql += ' default character set ' + charset;
	    if (collation) sql += ' collate ' + collation;
	    if (engine)    sql += ' engine = ' + engine;

	    if (this.single.comment) {
	      var comment = (this.single.comment || '');
	      if (comment.length > 60) helpers.warn('The max length for a table comment is 60 characters');
	      sql += " comment = '" + comment + "'";
	    }

	    this.pushQuery(sql);
	  },

	  addColumnsPrefix: 'add ',
	  
	  dropColumnPrefix: 'drop ',

	  // Compiles the comment on the table.
	  comment: function(comment) {
	    this.pushQuery('alter table ' + this.tableName() + " comment = '" + comment + "'");
	  },

	  changeType: function() {
	    // alter table + table + ' modify ' + wrapped + '// type';
	  },

	  // Renames a column on the table.
	  renameColumn: function(from, to) {
	    var compiler = this;
	    var table    = this.tableName();
	    var wrapped  = this.formatter.wrap(from) + ' ' + this.formatter.wrap(to);
	    
	    this.pushQuery({
	      sql: 'show fields from ' + table + ' where field = ' +
	        this.formatter.parameter(from),
	      output: function(resp) {
	        var column = resp[0];
	        var runner = this;
	        return compiler.getFKRefs(runner).get(0)
	          .then(function (refs) {
	            return Promise.try(function () {
	              if (!refs.length) { return; }
	              return compiler.dropFKRefs(runner, refs);
	            }).then(function () {
	              return runner.query({
	                sql: 'alter table ' + table + ' change ' + wrapped + ' ' + column.Type
	              });
	            }).then(function () {
	              if (!refs.length) { return; }
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

	  getFKRefs: function (runner) {
	    var formatter = this.client.formatter();
	    var sql = 'SELECT KCU.CONSTRAINT_NAME, KCU.TABLE_NAME, KCU.COLUMN_NAME, '+
	              '       KCU.REFERENCED_TABLE_NAME, KCU.REFERENCED_COLUMN_NAME, '+
	              '       RC.UPDATE_RULE, RC.DELETE_RULE '+
	              'FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KCU '+
	              'JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS AS RC '+
	              '       USING(CONSTRAINT_NAME)' +
	              'WHERE KCU.REFERENCED_TABLE_NAME = ' + formatter.parameter(this.tableNameRaw) + ' '+
	              '  AND KCU.CONSTRAINT_SCHEMA = ' + formatter.parameter(this.client.databaseName);

	    return runner.query({
	      sql: sql,
	      bindings: formatter.bindings
	    });
	  },

	  dropFKRefs: function (runner, refs) {
	    var formatter = this.client.formatter();
	    
	    return Promise.all(refs.map(function (ref) {
	      var constraintName = formatter.wrap(ref.CONSTRAINT_NAME);
	      return runner.query({
	        sql: 'alter table ' + this.tableName() + ' drop foreign key ' + constraintName
	      });
	    }.bind(this)));
	  },
	  createFKRefs: function (runner, refs) {
	    var formatter = this.client.formatter();
	    
	    return Promise.all(refs.map(function (ref) {
	      var keyName    = formatter.wrap(ref.COLUMN_NAME);
	      var column     = formatter.columnize(ref.COLUMN_NAME);
	      var references = formatter.columnize(ref.REFERENCED_COLUMN_NAME);
	      var inTable    = formatter.wrap(ref.REFERENCED_TABLE_NAME);
	      var onUpdate   = ' ON UPDATE ' + ref.UPDATE_RULE;
	      var onDelete   = ' ON DELETE ' + ref.DELETE_RULE;
	      
	      return runner.query({
	        sql: 'alter table ' + this.tableName() + ' add constraint ' + keyName + ' ' + 
	          'foreign key (' + column + ') references ' + inTable + ' (' + references + ')' + onUpdate + onDelete
	      });
	    }.bind(this)));
	  },
	  index: function(columns, indexName) {
	    indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + " add index " + indexName + "(" + this.formatter.columnize(columns) + ")");
	  },

	  primary: function(columns, indexName) {
	    indexName = indexName || this._indexCommand('primary', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + " add primary key " + indexName + "(" + this.formatter.columnize(columns) + ")");
	  },

	  unique: function(columns, indexName) {
	    indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + " add unique " + indexName + "(" + this.formatter.columnize(columns) + ")");
	  },

	  // Compile a drop index command.
	  dropIndex: function(columns, indexName) {
	    indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
	  },

	  // Compile a drop foreign key command.
	  dropForeign: function(columns, indexName) {
	    indexName = indexName || this._indexCommand('foreign', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + ' drop foreign key ' + indexName);
	  },

	  // Compile a drop primary key command.
	  dropPrimary: function() {
	    this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
	  },

	  // Compile a drop unique key command.
	  dropUnique: function(column, indexName) {
	    indexName = indexName || this._indexCommand('unique', this.tableNameRaw, column);
	    this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
	  }

	})

	module.exports = TableCompiler_MySQL;


/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	var inherits        = __webpack_require__(41)
	var assign          = __webpack_require__(23)
	var Formatter       = __webpack_require__(12)
	var ReturningHelper = __webpack_require__(58).ReturningHelper

	function Oracle_Formatter(client) {
	  Formatter.call(this, client)
	}
	inherits(Oracle_Formatter, Formatter)

	assign(Oracle_Formatter.prototype, {

	  alias: function(first, second) {
	    return first + ' ' + second;
	  },

	  parameter: function(value, notSetValue) {
	    // returning helper uses always ROWID as string
	    if (value instanceof ReturningHelper && this.client.driver) {
	      value = this.client.driver.OutParam(this.client.driver.OCCISTRING)
	    }
	    if (typeof value === 'boolean') {
	      value = value ? 1 : 0
	    }
	    return Formatter.prototype.parameter.call(this, value, notSetValue)
	  }

	})

	module.exports = Oracle_Formatter

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Oracle Query Builder & Compiler
	// ------
	var _               = __webpack_require__(8);
	var inherits        = __webpack_require__(41);
	var QueryCompiler   = __webpack_require__(15);
	var helpers         = __webpack_require__(3);
	var assign          = __webpack_require__(23);
	var ReturningHelper = __webpack_require__(58).ReturningHelper;

	// Query Compiler
	// -------

	// Set the "Formatter" to use for the queries,
	// ensuring that all parameterized values (even across sub-queries)
	// are properly built into the same query.
	function QueryCompiler_Oracle(client, builder) {
	  QueryCompiler.call(this, client, builder)
	}
	inherits(QueryCompiler_Oracle, QueryCompiler)

	assign(QueryCompiler_Oracle.prototype, {

	  // Compiles an "insert" query, allowing for multiple
	  // inserts using a single query statement.
	  insert: function() {
	    var insertValues = this.single.insert || []
	    var returning    = this.single.returning;

	    // always wrap returning argument in array
	    if (returning && !Array.isArray(returning)) {
	      returning = [returning];
	    }

	    if (Array.isArray(this.single.insert) && (this.single.insert.length === 1) && _.isEmpty(this.single.insert[0])) {
	      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.wrap(this.single.returning) + ') values (default)', returning, this.tableName);
	    }

	    if (_.isEmpty(this.single.insert) && typeof this.single.insert !== 'function') {
	      return '';
	    }

	    var insertData = this._prepInsert(this.single.insert);

	    var sql = {};

	    if (_.isString(insertData)) {
	      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' ' + insertData, returning);
	    }

	    if (insertData.values.length === 1) {
	      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.columnize(insertData.columns) + ') values (' + this.formatter.parameterize(insertData.values[0]) + ')', returning, this.tableName);
	    }

	    var insertDefaultsOnly = (insertData.columns.length === 0);

	    sql.sql = 'begin ' +
	      _.map(insertData.values, function (value) {
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
	          subSql += (returning ? ' returning ROWID into ' + this.formatter.parameter(returningHelper) : '');

	          // pre bind position because subSql is an execute immediate parameter
	          // later position binding will only convert the ? params
	          subSql = this.formatter.client.positionBindings(subSql);
	          return 'execute immediate \'' + subSql.replace(/'/g, "''") +
	            ((parameterizedValues || returning) ? '\' using ' : '') +
	            parameterizedValues +
	            ((parameterizedValues && returning) ? ', ' : '') +
	            (returning ? 'out ?' : '') + ';';
	      }, this).join(' ') +
	      'end;';

	    if (returning) {
	      sql.returning = returning;
	      // generate select statement with special order by to keep the order because 'in (..)' may change the order
	      sql.returningSql = 'select ' + this.formatter.columnize(returning) +
	        ' from ' + this.tableName +
	        ' where ROWID in (' + sql.outParams.map(function (v, i) {return ':' + (i + 1);}).join(', ') + ')' +
	        ' order by case ROWID ' + sql.outParams.map(function (v, i) {return 'when CHARTOROWID(:' + (i + 1) + ') then ' + i;}).join(' ') + ' end';
	    }

	    return sql;
	  },

	  // Update method, including joins, wheres, order & limits.
	  update: function() {
	    var updates = this._prepUpdate(this.single.update);
	    var where   = this.where();
	    return 'update ' + this.tableName +
	      ' set ' + updates.join(', ') +
	      (where ? ' ' + where : '');
	  },

	  // Compiles a `truncate` query.
	  truncate: function() {
	    return 'truncate table ' + this.tableName;
	  },

	  forUpdate: function() {
	    return 'for update';
	  },
	  
	  forShare: function() {
	    // lock for share is not directly supported by oracle
	    // use LOCK TABLE .. IN SHARE MODE; instead
	    helpers.warn('lock for share is not supported by oracle dialect');
	    return '';
	  },

	  // Compiles a `columnInfo` query.
	  columnInfo: function() {
	    var column = this.single.columnInfo;
	    return {
	      sql: 'select COLUMN_NAME, DATA_TYPE, CHAR_COL_DECL_LENGTH, NULLABLE from USER_TAB_COLS where TABLE_NAME = :1',
	      bindings: [this.single.table],
	      output: function(resp) {
	        var out = _.reduce(resp, function(columns, val) {
	          columns[val.COLUMN_NAME] = {
	            type: val.DATA_TYPE,
	            maxLength: val.CHAR_COL_DECL_LENGTH,
	            nullable: (val.NULLABLE === 'Y')
	          };
	          return columns;
	        }, {});
	        return column && out[column] || out;
	      }
	    };
	  },

	  select: function() {
	    var statements = _.map(components, function (component) {
	      return this[component]();
	    }, this);
	    var query = _.compact(statements).join(' ');
	    return this._surroundQueryWithLimitAndOffset(query);
	  },

	  aggregate: function(stmt) {
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
	  _addReturningToSqlAndConvert: function(sql, returning, tableName) {
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

	  _surroundQueryWithLimitAndOffset: function(query) {
	    var limit = this.single.limit
	    var offset = this.single.offset
	    var hasLimit = (limit || limit === 0 || limit === '0');
	    limit = +limit;
	    
	    if (!hasLimit && !offset) return query;
	    query = query || "";

	    if (hasLimit && !offset) {
	      return "select * from (" + query + ") where rownum <= " + this.formatter.parameter(limit);
	    }

	    var endRow = +(offset) + (hasLimit ? limit : 10000000000000);

	    return "select * from " +
	           "(select row_.*, ROWNUM rownum_ from (" + query + ") row_ " +
	           "where rownum <= " + this.formatter.parameter(endRow) + ") " +
	           "where rownum_ > " + this.formatter.parameter(offset);
	  }

	})

	// Compiles the `select` statement, or nested sub-selects
	// by calling each of the component compilers, trimming out
	// the empties, and returning a generated query string.
	QueryCompiler_Oracle.prototype.first = QueryCompiler_Oracle.prototype.select

	var components = [
	  'columns', 'join', 'where', 'union', 'group',
	  'having', 'order', 'lock'
	];

	module.exports = QueryCompiler_Oracle;


/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var inherits      = __webpack_require__(41);
	var ColumnBuilder = __webpack_require__(20);

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

	module.exports = ColumnBuilder_Oracle

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _              = __webpack_require__(8)
	var inherits       = __webpack_require__(41)
	var assign         = __webpack_require__(23)
	var utils          = __webpack_require__(58)
	var Raw            = __webpack_require__(2)
	var ColumnCompiler = __webpack_require__(21)

	// Column Compiler
	// -------

	function ColumnCompiler_Oracle() {
	  this.modifiers = ['defaultTo', 'checkIn', 'nullable', 'comment'];
	  ColumnCompiler.apply(this, arguments);
	}
	inherits(ColumnCompiler_Oracle, ColumnCompiler);

	assign(ColumnCompiler_Oracle.prototype, {

	  // helper function for pushAdditional in increments() and bigincrements()
	  _createAutoIncrementTriggerAndSequence: function () {
	    // TODO Add warning that sequence etc is created
	    this.pushAdditional(function () {
	      var sequenceName = this.tableCompiler._indexCommand('seq', this.tableCompiler.tableNameRaw);
	      var triggerName  = this.tableCompiler._indexCommand('trg', this.tableCompiler.tableNameRaw, this.getColumnName());
	      var tableName    = this.tableCompiler.tableName();
	      var columnName   = this.formatter.wrap(this.getColumnName());
	      var createTriggerSQL = 'create or replace trigger ' + triggerName + ' before insert on ' + tableName +
	        ' for each row' +
	        ' when (new.' + columnName + ' is null) ' +
	        ' begin' +
	        ' select ' + sequenceName + '.nextval into :new.' + columnName + ' from dual;' +
	        ' end;';
	      this.pushQuery(utils.wrapSqlWithCatch('create sequence ' + sequenceName, -955));
	      this.pushQuery(createTriggerSQL);
	    });
	  },

	  increments: function () {
	    this._createAutoIncrementTriggerAndSequence();
	    return 'integer not null primary key';
	  },

	  bigincrements: function () {
	    this._createAutoIncrementTriggerAndSequence();
	    return 'number(20, 0) not null primary key';
	  },

	  floating: function(precision) {
	    var parsedPrecision = this._num(precision, 0);
	    return 'float' + (parsedPrecision ? '(' + parsedPrecision + ')' : '');
	  },

	  double: function(precision, scale) {
	    // if (!precision) return 'number'; // TODO: Check If default is ok
	    return 'number(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
	  },

	  integer: function(length) {
	      return length ? 'number(' + this._num(length, 11) + ')' : 'integer';
	  },

	  tinyint: 'smallint',
	  
	  smallint: 'smallint',
	  
	  mediumint: 'integer',
	  
	  biginteger: 'number(20, 0)',
	  
	  text: 'clob',

	  enu: function (allowed) {
	    allowed = _.uniq(allowed);
	    var maxLength = (allowed || []).reduce(function (maxLength, name) {
	      return Math.max(maxLength, String(name).length);
	    }, 1);

	    // implicitly add the enum values as checked values
	    this.columnBuilder._modifiers.checkIn = [allowed];

	    return "varchar2(" + maxLength + ")";
	  },

	  time: 'timestamp',

	  datetime: 'timestamp',

	  timestamp: 'timestamp',

	  bit: 'clob',
	  
	  json: 'clob',

	  bool: function () {
	    // implicitly add the check for 0 and 1
	    this.columnBuilder._modifiers.checkIn = [[0, 1]];
	    return 'number(1, 0)';
	  },

	  varchar: function(length) {
	    return 'varchar2(' + this._num(length, 255) + ')';
	  },

	  // Modifiers
	  // ------

	  comment: function(comment) {
	    this.pushAdditional(function() {
	      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' +
	        this.formatter.wrap(this.args[0]) + " is '" + (comment || '')+ "'");
	    }, comment);
	  },

	  checkIn: function (value) {
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

	})

	module.exports = ColumnCompiler_Oracle;


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Oracle Schema Compiler
	// -------
	var inherits       = __webpack_require__(41);
	var SchemaCompiler = __webpack_require__(17);
	var utils          = __webpack_require__(58);

	function SchemaCompiler_Oracle() {
	  SchemaCompiler.apply(this, arguments);
	}
	inherits(SchemaCompiler_Oracle, SchemaCompiler);

	// Rename a table on the schema.
	SchemaCompiler_Oracle.prototype.renameTable = function(tableName, to) {
	  this.pushQuery('rename ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
	};

	// Check whether a table exists on the query.
	SchemaCompiler_Oracle.prototype.hasTable = function(tableName) {
	  this.pushQuery({
	    sql: 'select TABLE_NAME from USER_TABLES where TABLE_NAME = ' +
	      this.formatter.parameter(tableName),
	    output: function(resp) {
	      return resp.length > 0;
	    }
	  });
	};

	// Check whether a column exists on the schema.
	SchemaCompiler_Oracle.prototype.hasColumn = function(tableName, column) {
	  this.pushQuery({
	    sql: 'select COLUMN_NAME from USER_TAB_COLUMNS where TABLE_NAME = ' + this.formatter.parameter(tableName) +
	      ' and COLUMN_NAME = ' + this.formatter.parameter(column),
	    output: function(resp) {
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

	SchemaCompiler_Oracle.prototype.dropTableIfExists = function(tableName) {
	  this.pushQuery(utils.wrapSqlWithCatch("drop table " + this.formatter.wrap(tableName), -942));

	  // removing the sequence that was possibly generated by increments() column
	  this._dropRelatedSequenceIfExists(tableName);
	};

	module.exports = SchemaCompiler_Oracle;


/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var inherits      = __webpack_require__(41);
	var utils         = __webpack_require__(58);
	var TableCompiler = __webpack_require__(19);
	var helpers       = __webpack_require__(3);
	var assign        = __webpack_require__(23);

	// Table Compiler
	// ------

	function TableCompiler_Oracle() {
	  TableCompiler.apply(this, arguments);
	}
	inherits(TableCompiler_Oracle, TableCompiler);

	assign(TableCompiler_Oracle.prototype, {

	  // Compile a rename column command.
	  renameColumn: function(from, to) {
	    return this.pushQuery({
	      sql: 'alter table ' + this.tableName() + ' rename column '
	        + this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
	    });
	  },

	  compileAdd: function(builder) {
	    var table = this.formatter.wrap(builder);
	    var columns = this.prefixArray('add column', this.getColumns(builder));
	    return this.pushQuery({
	      sql: 'alter table ' + table + ' ' + columns.join(', ')
	    });
	  },

	  // Adds the "create" query to the query sequence.
	  createQuery: function(columns, ifNot) {
	    var sql = 'create table ' + this.tableName() + ' (' + columns.sql.join(', ') + ')';
	    this.pushQuery({
	      // catch "name is already used by an existing object" for workaround for "if not exists"
	      sql: ifNot ? utils.wrapSqlWithCatch(sql, -955) : sql,
	      bindings: columns.bindings
	    });
	    if (this.single.comment) this.comment(this.single.comment);
	  },

	  // Compiles the comment on the table.
	  comment: function(comment) {
	    this.pushQuery('comment on table ' + this.tableName() + ' is ' + "'" + (comment || '') + "'");
	  },

	  addColumnsPrefix: 'add ',

	  dropColumn: function() {
	    var columns = helpers.normalizeArr.apply(null, arguments);
	    this.pushQuery('alter table ' + this.tableName() + ' drop (' + this.formatter.columnize(columns) + ')');
	  },

	  changeType: function() {
	    // alter table + table + ' modify ' + wrapped + '// type';
	  },

	  _indexCommand: function(type, tableName, columns) {
	    return this.formatter.wrap(utils.generateCombinedName(type, tableName, columns));
	  },

	  primary: function(columns) {
	    this.pushQuery('alter table ' + this.tableName() + " add primary key (" + this.formatter.columnize(columns) + ")");
	  },

	  dropPrimary: function() {
	    this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
	  },

	  index: function(columns, indexName) {
	    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
	    this.pushQuery('create index ' + indexName + ' on ' + this.tableName() +
	      ' (' + this.formatter.columnize(columns) + ')');
	  },

	  dropIndex: function(columns, indexName) {
	    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
	    this.pushQuery('drop index ' + indexName);
	  },

	  unique: function(columns, indexName) {
	    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + indexName +
	      ' unique (' + this.formatter.columnize(columns) + ')');
	  },

	  dropUnique: function(columns, indexName) {
	    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
	  },

	  dropForeign: function(columns, indexName) {
	    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('foreign', this.tableNameRaw, columns);
	    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
	  }

	})

	module.exports = TableCompiler_Oracle;


/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	/*jslint node:true, nomen: true*/
	var inherits = __webpack_require__(41)
	var merge    = __webpack_require__(93)
	var Readable = __webpack_require__(108).Readable

	function OracleQueryStream(connection, sql, bindings, options) {
	  Readable.call(this, merge({}, {
	    objectMode: true,
	    highWaterMark: 1000
	  }, options))
	  this.oracleReader = connection.reader(sql, bindings || [])
	}
	inherits(OracleQueryStream, Readable)

	OracleQueryStream.prototype._read = function() {
	  var stream = this;
	  function pushNull() {
	    process.nextTick(function() {
	      stream.push(null)
	    })
	  }
	  try {
	    this.oracleReader.nextRows(function(err, rows) {
	      if (err) return stream.emit('error', err)
	      if (rows.length === 0) {
	        pushNull()
	      } else {
	        for (var i = 0; i < rows.length; i++) {
	          if (rows[i]) {
	            stream.push(rows[i])
	          } else {
	            pushNull()
	          }
	        }
	      }
	    })
	  } catch (e) {
	    // Catch Error: invalid state: reader is busy with another nextRows call
	    // and return false to rate limit stream.
	    if (e.message ===
	      'invalid state: reader is busy with another nextRows call') {
	      return false
	    } else {
	      this.emit('error', e)
	    }
	  }
	}

	module.exports = OracleQueryStream
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	
	function finishOracleTransaction(connection, finishFunc) {
	  return new Promise(function (resolver, rejecter) {
	    return finishFunc.bind(connection)(function (err, result) {
	      if (err) {
	        return rejecter(err);
	      }
	      // reset AutoCommit back to default to allow recycling in pool
	      connection.setAutoCommit(true);
	      resolver(result);
	    });
	  });
	}

	// disable autocommit to allow correct behavior (default is true)
	Runner_Oracle.prototype.beginTransaction = function() {
	  return this.connection.setAutoCommit(false);
	};
	Runner_Oracle.prototype.commitTransaction = function() {
	  return finishOracleTransaction(this.connection, this.connection.commit);
	};
	Runner_Oracle.prototype.rollbackTransaction = function() {
	  return finishOracleTransaction(this.connection, this.connection.rollback);
	};


/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _       = __webpack_require__(8);
	var helpers = __webpack_require__(3);

	function generateCombinedName(postfix, name, subNames) {
	  var crypto = __webpack_require__(81);
	  var limit  = 30;
	  if (!Array.isArray(subNames)) subNames = subNames ? [subNames] : [];
	  var table = name.replace(/\.|-/g, '_');
	  var subNamesPart = subNames.join('_');
	  var result = (table + '_' + (subNamesPart.length ? subNamesPart + '_': '') + postfix).toLowerCase();
	  if (result.length > limit) {
	    helpers.warn('Automatically generated name "' + result + '" exceeds ' + limit + ' character limit for Oracle. Using base64 encoded sha1 of that name instead.');
	    // generates the sha1 of the name and encode it with base64
	    result = crypto.createHash('sha1')
	      .update(result)
	      .digest('base64')
	      .replace('=', '');
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
	}

	module.exports = {
	  generateCombinedName: generateCombinedName,
	  wrapSqlWithCatch: wrapSqlWithCatch,
	  ReturningHelper: ReturningHelper
	};


/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// PostgreSQL Query Builder & Compiler
	// ------
	var _        = __webpack_require__(8);
	var inherits = __webpack_require__(41);

	var QueryCompiler = __webpack_require__(15);
	var assign        = __webpack_require__(23);

	function QueryCompiler_PG(client, builder) {
	  QueryCompiler.call(this, client, builder);
	}
	inherits(QueryCompiler_PG, QueryCompiler);

	assign(QueryCompiler_PG.prototype, {

	  // Compiles a truncate query.
	  truncate: function() {
	    return 'truncate ' + this.tableName + ' restart identity';
	  },

	  // is used if the an array with multiple empty values supplied
	  _defaultInsertValue: 'default',

	  // Compiles an `insert` query, allowing for multiple
	  // inserts using a single query statement.
	  insert: function() {
	    var sql = QueryCompiler.prototype.insert.call(this)
	    if (sql === '') return sql;
	    var returning = this.single.returning;
	    return {
	      sql: sql + this._returning(returning),
	      returning: returning
	    };
	  },

	  // Compiles an `update` query, allowing for a return value.
	  update: function() {
	    var updateData = this._prepUpdate(this.single.update);
	    var wheres     = this.where();
	    var returning  = this.single.returning;
	    return {
	      sql: 'update ' + this.tableName + ' set ' + updateData.join(', ') +
	      (wheres ? ' ' + wheres : '') +
	      this._returning(returning),
	      returning: returning
	    };
	  },

	  // Compiles an `update` query, allowing for a return value.
	  del: function() {
	    var sql = QueryCompiler.prototype.del.apply(this, arguments);
	    var returning  = this.single.returning;
	    return {
	      sql: sql + this._returning(returning),
	      returning: returning
	    };
	  },

	  _returning: function(value) {
	    return value ? ' returning ' + this.formatter.columnize(value) : '';
	  },

	  forUpdate: function() {
	    return 'for update';
	  },

	  forShare: function() {
	    return 'for share';
	  },

	  // Compiles a columnInfo query
	  columnInfo: function() {
	    var column = this.single.columnInfo;
	    return {
	      sql: 'select * from information_schema.columns where table_name = ? and table_catalog = ?',
	      bindings: [this.single.table, this.client.database()],
	      output: function(resp) {
	        var out = _.reduce(resp.rows, function(columns, val) {
	          columns[val.column_name] = {
	            type: val.data_type,
	            maxLength: val.character_maximum_length,
	            nullable: (val.is_nullable === 'YES'),
	            defaultValue: val.column_default
	          };
	          return columns;
	        }, {});
	        return column && out[column] || out;
	      }
	    };
	  }

	})

	module.exports = QueryCompiler_PG;


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// PostgreSQL Column Compiler
	// -------

	var inherits       = __webpack_require__(41);
	var ColumnCompiler = __webpack_require__(21);
	var assign         = __webpack_require__(23);

	function ColumnCompiler_PG() {
	  ColumnCompiler.apply(this, arguments);
	  this.modifiers = ['nullable', 'defaultTo', 'comment']
	}
	inherits(ColumnCompiler_PG, ColumnCompiler);

	assign(ColumnCompiler_PG.prototype, {

	  // Types
	  // ------
	  bigincrements: 'bigserial primary key',
	  bigint: 'bigint',
	  binary: 'bytea',
	  
	  bit: function(column) {
	    return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
	  },
	  
	  bool: 'boolean',

	  // Create the column definition for an enum type.
	  // Using method "2" here: http://stackoverflow.com/a/10984951/525714
	  enu: function(allowed) {
	    return 'text check (' + this.formatter.wrap(this.args[0]) + " in ('" + allowed.join("', '")  + "'))";
	  },

	  double: 'double precision',
	  floating: 'real',
	  increments: 'serial primary key',
	  json: function(jsonb) {
	    if (!this.client.version || parseFloat(this.client.version) >= 9.2) return jsonb ? 'jsonb' : 'json';
	    return 'text';
	  },
	  smallint: 'smallint',
	  tinyint:  'smallint',
	  datetime: function(without) {
	    return without ? 'timestamp' : 'timestamptz';
	  },
	  timestamp: function(without) {
	    return without ? 'timestamp' : 'timestamptz';
	  },
	  uuid: 'uuid',

	  // Modifiers:
	  // ------
	  comment: function(comment) {
	    this.pushAdditional(function() {
	      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' +
	        this.formatter.wrap(this.args[0]) + " is " + (comment ? "'" + comment + "'" : 'NULL'));
	    }, comment);
	  }

	})

	module.exports = ColumnCompiler_PG;


/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	// PostgreSQL Schema Compiler
	// -------

	'use strict';

	var inherits       = __webpack_require__(41);
	var SchemaCompiler = __webpack_require__(17);

	function SchemaCompiler_PG() {
	  SchemaCompiler.apply(this, arguments);
	}
	inherits(SchemaCompiler_PG, SchemaCompiler);

	// Check whether the current table
	SchemaCompiler_PG.prototype.hasTable = function(tableName) {
	  this.pushQuery({
	    sql: 'select * from information_schema.tables where table_name = ?',
	    bindings: [tableName],
	    output: function(resp) {
	      return resp.rows.length > 0;
	    }
	  });
	};

	// Compile the query to determine if a column exists in a table.
	SchemaCompiler_PG.prototype.hasColumn = function(tableName, columnName) {
	  this.pushQuery({
	    sql: 'select * from information_schema.columns where table_name = ? and column_name = ?',
	    bindings: [tableName, columnName],
	    output: function(resp) {
	      return resp.rows.length > 0;
	    }
	  });
	};

	// Compile a rename table command.
	SchemaCompiler_PG.prototype.renameTable = function(from, to) {
	  this.pushQuery('alter table ' + this.formatter.wrap(from) + ' rename to ' + this.formatter.wrap(to));
	};

	SchemaCompiler_PG.prototype.createSchema = function(schemaName) {
	  this.pushQuery('create schema ' + this.formatter.wrap(schemaName));
	};

	SchemaCompiler_PG.prototype.createSchemaIfNotExists = function(schemaName) {
	  this.pushQuery('create schema if not exists ' + this.formatter.wrap(schemaName));
	};

	SchemaCompiler_PG.prototype.dropSchema = function(schemaName) {
	  this.pushQuery('drop schema ' + this.formatter.wrap(schemaName));
	};

	SchemaCompiler_PG.prototype.dropSchemaIfExists = function(schemaName) {
	  this.pushQuery('drop schema if exists ' + this.formatter.wrap(schemaName));
	};

	SchemaCompiler_PG.prototype.dropExtension = function(extensionName) {
	  this.pushQuery('drop extension ' + this.formatter.wrap(extensionName));
	};

	SchemaCompiler_PG.prototype.dropExtensionIfExists = function(extensionName) {
	  this.pushQuery('drop extension if exists ' + this.formatter.wrap(extensionName));
	};

	SchemaCompiler_PG.prototype.createExtension = function(extensionName) {
	  this.pushQuery('create extension ' + this.formatter.wrap(extensionName));
	};

	SchemaCompiler_PG.prototype.createExtensionIfNotExists = function(extensionName) {
	  this.pushQuery('create extension if not exists ' + this.formatter.wrap(extensionName));
	};

	module.exports = SchemaCompiler_PG;


/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	// PostgreSQL Table Builder & Compiler
	// -------
	'use strict';

	var _             = __webpack_require__(8);
	var inherits      = __webpack_require__(41);
	var TableCompiler = __webpack_require__(19);

	function TableCompiler_PG() {
	  TableCompiler.apply(this, arguments);
	}
	inherits(TableCompiler_PG, TableCompiler);

	// Compile a rename column command.
	TableCompiler_PG.prototype.renameColumn = function(from, to) {
	  return this.pushQuery({
	    sql: 'alter table ' + this.tableName() + ' rename '+ this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
	  });
	};

	TableCompiler_PG.prototype.compileAdd = function(builder) {
	  var table = this.formatter.wrap(builder);
	  var columns = this.prefixArray('add column', this.getColumns(builder));
	  return this.pushQuery({
	    sql: 'alter table ' + table + ' ' + columns.join(', ')
	  });
	};

	// Adds the "create" query to the query sequence.
	TableCompiler_PG.prototype.createQuery = function(columns, ifNot) {
	  var createStatement = ifNot ? 'create table if not exists ' : 'create table ';
	  this.pushQuery({
	    sql: createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')',
	    bindings: columns.bindings
	  });
	  var hasComment = _.has(this.single, 'comment');
	  if (hasComment) this.comment(this.single.comment);
	};

	// Compiles the comment on the table.
	TableCompiler_PG.prototype.comment = function(comment) {
	  /*jshint unused: false*/
	  this.pushQuery('comment on table ' + this.tableName() + ' is ' + "'" + (this.single.comment || '') + "'");
	};

	// Indexes:
	// -------

	TableCompiler_PG.prototype.primary = function(columns) {
	  this.pushQuery('alter table ' + this.tableName() + " add primary key (" + this.formatter.columnize(columns) + ")");
	};
	TableCompiler_PG.prototype.unique = function(columns, indexName) {
	  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
	  this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + indexName +
	    ' unique (' + this.formatter.columnize(columns) + ')');
	};
	TableCompiler_PG.prototype.index = function(columns, indexName, indexType) {
	  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
	  this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + (indexType && (' using ' + indexType) || '') +
	    ' (' + this.formatter.columnize(columns) + ')');
	};
	TableCompiler_PG.prototype.dropPrimary = function() {
	  this.pushQuery('alter table ' + this.tableName() + " drop constraint " + this.tableNameRaw + "_pkey");
	};
	TableCompiler_PG.prototype.dropIndex = function(columns, indexName) {
	  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
	  this.pushQuery('drop index ' + indexName);
	};
	TableCompiler_PG.prototype.dropUnique = function(columns, indexName) {
	  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
	  this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
	};
	TableCompiler_PG.prototype.dropForeign = function(columns, indexName) {
	  indexName = indexName || this._indexCommand('foreign', this.tableNameRaw, columns);
	  this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
	};

	module.exports = TableCompiler_PG;


/***/ },
/* 63 */
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
	  var ret = pad(date.getFullYear(), 4) + '-' +
	    pad(date.getMonth() + 1, 2) + '-' +
	    pad(date.getDate(), 2) + 'T' +
	    pad(date.getHours(), 2) + ':' +
	    pad(date.getMinutes(), 2) + ':' +
	    pad(date.getSeconds(), 2) + '.' +
	    pad(date.getMilliseconds(), 3);

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
	var prepareValue = function (val, seen) {
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
	  config = (typeof config === 'string') ? { text: config } : config;
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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(109).Buffer))

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// SQLite3 Query Builder & Compiler

	var _             = __webpack_require__(8)
	var inherits      = __webpack_require__(41)
	var Raw           = __webpack_require__(2)
	var QueryCompiler = __webpack_require__(15)
	var assign        = __webpack_require__(23);

	function QueryCompiler_SQLite3(client, builder) {
	  QueryCompiler.call(this, client, builder)
	}
	inherits(QueryCompiler_SQLite3, QueryCompiler)

	assign(QueryCompiler_SQLite3.prototype, {

	  // The locks are not applicable in SQLite3
	  forShare:  emptyStr,
	  
	  forUpdate: emptyStr,

	  // SQLite requires us to build the multi-row insert as a listing of select with
	  // unions joining them together. So we'll build out this list of columns and
	  // then join them all together with select unions to complete the queries.
	  insert: function() {
	    var insertValues = this.single.insert || []
	    var sql = 'insert into ' + this.tableName + ' '

	    if (Array.isArray(insertValues)) {
	      if (insertValues.length === 0) {
	        return ''
	      }
	      else if (insertValues.length === 1 && insertValues[0] && _.isEmpty(insertValues[0])) {
	        return sql + this._emptyInsertValue
	      }
	    } else if (typeof insertValues === 'object' && _.isEmpty(insertValues)) {
	      return sql + this._emptyInsertValue
	    }

	    var insertData = this._prepInsert(insertValues)
	    
	    if (_.isString(insertData)) {
	      return sql + insertData
	    }
	    
	    if (insertData.columns.length === 0) {
	      return '';
	    }

	    sql += '(' + this.formatter.columnize(insertData.columns) + ')'
	    
	    if (insertData.values.length === 1) {
	      return sql + ' values (' + this.formatter.parameterize(insertData.values[0]) + ')'
	    }
	    
	    var blocks = []
	    var i      = -1
	    while (++i < insertData.values.length) {
	      var i2 = -1, block = blocks[i] = []
	      var current = insertData.values[i]
	      while (++i2 < insertData.columns.length) {
	        block.push(this.formatter.alias(
	          this.formatter.parameter(current[i2]),
	          this.formatter.wrap(insertData.columns[i2])
	        ))
	      }
	      blocks[i] = block.join(', ')
	    }
	    return sql + ' select ' + blocks.join(' union all select ')
	  },

	  // Compile a truncate table statement into SQL.
	  truncate: function() {
	    var table = this.tableName
	    return {
	      sql: 'delete from sqlite_sequence where name = ' + this.tableName,
	      output: function() {
	        return this.query({sql: 'delete from ' + table})
	      }
	    }
	  },

	  // Compiles a `columnInfo` query
	  columnInfo: function() {
	    var column = this.single.columnInfo
	    return {
	      sql: 'PRAGMA table_info(' + this.single.table +')',
	      output: function(resp) {
	        var maxLengthRegex = /.*\((\d+)\)/
	        var out = _.reduce(resp, function (columns, val) {
	          var type = val.type
	          var maxLength = (maxLength = type.match(maxLengthRegex)) && maxLength[1]
	          type = maxLength ? type.split('(')[0] : type
	          columns[val.name] = {
	            type: type.toLowerCase(),
	            maxLength: maxLength,
	            nullable: !val.notnull,
	            defaultValue: val.dflt_value
	          }
	          return columns
	        }, {})
	        return column && out[column] || out
	      }
	    }
	  },

	  limit: function() {
	    var noLimit = !this.single.limit && this.single.limit !== 0
	    if (noLimit && !this.single.offset) return ''
	  
	    // Workaround for offset only, 
	    // see http://stackoverflow.com/questions/10491492/sqllite-with-skip-offset-only-not-limit
	    return 'limit ' + this.formatter.parameter(noLimit ? -1 : this.single.limit)
	  }

	})

	function emptyStr() {
	  return ''
	}


	module.exports = QueryCompiler_SQLite3


/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	
	var inherits = __webpack_require__(41);
	var ColumnCompiler = __webpack_require__(21);

	// Column Compiler
	// -------

	function ColumnCompiler_SQLite3() {
	  this.modifiers = ['nullable', 'defaultTo'];
	  ColumnCompiler.apply(this, arguments);
	}
	inherits(ColumnCompiler_SQLite3, ColumnCompiler);

	// Types
	// -------

	ColumnCompiler_SQLite3.prototype.double =
	ColumnCompiler_SQLite3.prototype.decimal =
	ColumnCompiler_SQLite3.prototype.floating = 'float';
	ColumnCompiler_SQLite3.prototype.timestamp = 'datetime';

	module.exports = ColumnCompiler_SQLite3;

/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// SQLite3: Column Builder & Compiler
	// -------
	var _        = __webpack_require__(8);
	var inherits = __webpack_require__(41);
	var SchemaCompiler   = __webpack_require__(17);

	// Schema Compiler
	// -------

	function SchemaCompiler_SQLite3() {
	  SchemaCompiler.apply(this, arguments);
	}
	inherits(SchemaCompiler_SQLite3, SchemaCompiler);

	// Compile the query to determine if a table exists.
	SchemaCompiler_SQLite3.prototype.hasTable = function(tableName) {
	  this.pushQuery({
	    sql: "select * from sqlite_master where type = 'table' and name = " + this.formatter.parameter(tableName),
	    output: function(resp) {
	      return resp.length > 0;
	    }
	  });
	};

	// Compile the query to determine if a column exists.
	SchemaCompiler_SQLite3.prototype.hasColumn = function(tableName, column) {
	  this.pushQuery({
	    sql: 'PRAGMA table_info(' + this.formatter.wrap(tableName) + ')',
	    output: function(resp) {
	      return _.some(resp, {name: column});
	    }
	  });
	};

	// Compile a rename table command.
	SchemaCompiler_SQLite3.prototype.renameTable = function(from, to) {
	  this.pushQuery('alter table ' + this.formatter.wrap(from) + ' rename to ' + this.formatter.wrap(to));
	};

	module.exports = SchemaCompiler_SQLite3;


/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// SQLite3_DDL
	//
	// All of the SQLite3 specific DDL helpers for renaming/dropping
	// columns and changing datatypes.
	// -------

	var _       = __webpack_require__(8);
	var Promise = __webpack_require__(10);
	var assign  = __webpack_require__(23);

	// So altering the schema in SQLite3 is a major pain.
	// We have our own object to deal with the renaming and altering the types
	// for sqlite3 things.
	function SQLite3_DDL(client, tableCompiler, pragma, connection) {
	  this.client        = client
	  this.tableCompiler = tableCompiler;
	  this.pragma        = pragma;
	  this.tableName     = this.tableCompiler.tableNameRaw;
	  this.alteredName   = _.uniqueId('_knex_temp_alter');
	  this.connection    = connection
	}

	assign(SQLite3_DDL.prototype, {

	  getColumn: Promise.method(function(column) {
	    var currentCol = _.findWhere(this.pragma, {name: column});
	    if (!currentCol) throw new Error('The column ' + column + ' is not in the ' + this.tableName + ' table');
	    return currentCol;
	  }),

	  getTableSql: function() {
	    return this.trx.raw('SELECT name, sql FROM sqlite_master WHERE type="table" AND name="' + this.tableName + '"');
	  },

	  renameTable: Promise.method(function() {
	    return this.trx.raw('ALTER TABLE "' + this.tableName + '" RENAME TO "' + this.alteredName + '"');
	  }),

	  dropOriginal: function() {
	    return this.trx.raw('DROP TABLE "' + this.tableName + '"');
	  },

	  dropTempTable: function() {
	    return this.trx.raw('DROP TABLE "' + this.alteredName + '"');
	  },

	  copyData: function() {
	    return this.trx.raw('SELECT * FROM "' + this.tableName + '"')
	      .bind(this)
	      .then(this.insertChunked(20, this.alteredName));
	  },

	  reinsertData: function(iterator) {
	    return function() {
	      return this.trx.raw('SELECT * FROM "' + this.alteredName + '"')
	        .bind(this)
	        .then(this.insertChunked(20, this.tableName, iterator));
	    };
	  },

	  insertChunked: function(amount, target, iterator) {
	    iterator = iterator || function(noop) { return noop; };
	    return function(result) {
	      var batch = [];
	      var ddl = this;
	      return Promise.reduce(result, function(memo, row) {
	        memo++;
	        batch.push(row);
	        if (memo % 20 === 0 || memo === result.length) {
	          return ddl.trx.queryBuilder()
	            .table(target)
	            .insert(_.map(batch, iterator))
	            .then(function() { batch = []; })
	            .thenReturn(memo);
	        }
	        return memo;
	      }, 0);
	    };
	  },

	  createTempTable: function(createTable) {
	    return function() {
	      return this.trx.raw(createTable.sql.replace(this.tableName, this.alteredName));
	    };
	  },

	  _doReplace: function (sql, from, to) {
	    var matched = sql.match(/^CREATE TABLE (\S+) \((.*)\)/);
	    
	    var tableName = matched[1],
	        defs = matched[2];
	    
	    if (!defs) { throw new Error('No column definitions in this statement!'); }

	    var parens = 0, args = [ ], ptr = 0;
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
	      var idx = (/constraint/i.test(split[0]) ? 2 : 0);
	      
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
	  renameColumn: Promise.method(function(from, to) {
	    var currentCol;

	    return this.client.transaction().run(function(trx) {
	      this.trx = trx
	      return this.getColumn(from)
	        .bind(this)
	        .tap(function(col) { currentCol = col; })
	        .then(this.getTableSql)
	        .then(function(sql) {
	          var a = this.client.wrapIdentifier(from);
	          var b = this.client.wrapIdentifier(to);
	          var createTable = sql[0];
	          var newSql = this._doReplace(createTable.sql, a, b);
	          if (sql === newSql) {
	            throw new Error('Unable to find the column to change');
	          }
	          return Promise.bind(this)
	            .then(this.createTempTable(createTable))
	            .then(this.copyData)
	            .then(this.dropOriginal)
	            .then(function() {
	              return this.trx.raw(newSql);
	            })
	            .then(this.reinsertData(function(row) {
	              row[to] = row[from];
	              return _.omit(row, from);
	            }))
	            .then(this.dropTempTable)
	        })
	    }.bind(this), {connection: this.connection})
	  }),

	  dropColumn: Promise.method(function(column) {
	    var currentCol;

	    return this.client.transaction().run(function(trx) {
	      this.trx = trx
	      return this.getColumn(column).tap(function(col) { 
	        currentCol = col; 
	      })
	      .bind(this)
	      .then(this.getTableSql)
	      .then(function(sql) {
	        var createTable = sql[0];
	        var a = this.client.wrapIdentifier(column);
	        var newSql = this._doReplace(createTable.sql, a, '');
	        if (sql === newSql) {
	          throw new Error('Unable to find the column to change');
	        }
	        return Promise.bind(this)
	          .then(this.createTempTable(createTable))
	          .then(this.copyData)
	          .then(this.dropOriginal)
	          .then(function() {
	            return this.trx.raw(newSql);
	          })
	          .then(this.reinsertData(function(row) {
	            return _.omit(row, column);
	          }))
	          .then(this.dropTempTable);
	      })
	    }.bind(this), {connection: this.connection})
	  })

	})


	module.exports = SQLite3_DDL;


/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _        = __webpack_require__(8);
	var inherits = __webpack_require__(41);
	var TableCompiler   = __webpack_require__(19);

	// Table Compiler
	// -------

	function TableCompiler_SQLite3() {
	  TableCompiler.apply(this, arguments);
	  this.primaryKey = void 0;
	}
	inherits(TableCompiler_SQLite3, TableCompiler);

	// Create a new table.
	TableCompiler_SQLite3.prototype.createQuery = function(columns, ifNot) {
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

	TableCompiler_SQLite3.prototype.addColumns = function(columns) {
	  for (var i = 0, l = columns.sql.length; i < l; i++) {
	    this.pushQuery({
	      sql: 'alter table ' + this.tableName() + ' add column ' + columns.sql[i],
	      bindings: columns.bindings[i]
	    });
	  }
	};

	// Compile a drop unique key command.
	TableCompiler_SQLite3.prototype.dropUnique = function(columns, indexName) {
	  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
	  this.pushQuery('drop index ' + indexName);
	};

	TableCompiler_SQLite3.prototype.dropIndex = function(columns, indexName) {
	  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
	  this.pushQuery('drop index ' + indexName);
	};

	// Compile a unique key command.
	TableCompiler_SQLite3.prototype.unique = function(columns, indexName) {
	  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
	  columns = this.formatter.columnize(columns);
	  this.pushQuery('create unique index ' + indexName + ' on ' + this.tableName() + ' (' + columns + ')');
	};

	// Compile a plain index key command.
	TableCompiler_SQLite3.prototype.index = function(columns, indexName) {
	  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
	  columns = this.formatter.columnize(columns);
	  this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + ' (' + columns + ')');
	};

	TableCompiler_SQLite3.prototype.primary =
	TableCompiler_SQLite3.prototype.foreign = function() {
	  if (this.method !== 'create' && this.method !== 'createIfNot') {
	    console.warn('SQLite3 Foreign & Primary keys may only be added on create');
	  }
	};

	TableCompiler_SQLite3.prototype.primaryKeys = function() {
	  var pks = _.where(this.grouped.alterTable || [], {method: 'primary'});
	  if (pks.length > 0 && pks[0].args.length > 0) {
	    var args = Array.isArray(pks[0].args[0]) ? pks[0].args[0] : pks[0].args;
	    return ', primary key (' + this.formatter.columnize(args) + ')';
	  }
	};

	TableCompiler_SQLite3.prototype.foreignKeys = function() {
	  var sql = '';
	  var foreignKeys = _.where(this.grouped.alterTable || [], {method: 'foreign'});
	  for (var i = 0, l = foreignKeys.length; i < l; i++) {
	    var foreign       = foreignKeys[i].args[0];
	    var column        = this.formatter.columnize(foreign.column);
	    var references    = this.formatter.columnize(foreign.references);
	    var foreignTable  = this.formatter.wrap(foreign.inTable);
	    sql += ', foreign key(' + column + ') references ' + foreignTable + '(' + references + ')';
	    if (foreign.onDelete) sql += ' on delete ' + foreign.onDelete;
	    if (foreign.onUpdate) sql += ' on update ' + foreign.onUpdate;
	  }
	  return sql;
	};

	TableCompiler_SQLite3.prototype.createTableBlock = function() {
	  return this.getColumns().concat().join(',');
	};

	// Compile a rename column command... very complex in sqlite
	TableCompiler_SQLite3.prototype.renameColumn = function(from, to) {
	  var compiler = this;
	  this.pushQuery({
	    sql: 'PRAGMA table_info(' + this.tableName() + ')',
	    output: function(pragma) {
	      return compiler.client.ddl(compiler, pragma, this.connection).renameColumn(from, to);
	    }
	  });
	};

	TableCompiler_SQLite3.prototype.dropColumn = function(column) {
	  var compiler = this;
	  this.pushQuery({
	    sql: 'PRAGMA table_info(' + this.tableName() + ')',
	    output: function(pragma) {
	      return compiler.client.ddl(compiler, pragma, this.connection).dropColumn(column);
	    }
	  });
	};

	module.exports = TableCompiler_SQLite3;


/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	var makeKnex = __webpack_require__(6)

	function Transaction_WebSQL(client) {
	  this.client = client
	}

	Transaction_WebSQL.prototype.run = function(container) {
	  return Promise.try(function() {
	    return container(makeKnex(client))
	  })
	}


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';

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
	    return (m[1] === '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
	  }
	  return false;
	}

	var SqlString = exports;

	SqlString.escapeId = function (val, forbidQualified) {
	  if (Array.isArray(val)) {
	    return val.map(function(v) {
	      return SqlString.escapeId(v, forbidQualified);
	    }).join(', ');
	  }

	  if (forbidQualified) {
	    return '`' + val.replace(/`/g, '``') + '`';
	  }
	  return '`' + val.replace(/`/g, '``').replace(/\./g, '`.`') + '`';
	};

	SqlString.escape = function(val, stringifyObjects, timeZone) {
	  if (val === undefined || val === null) {
	    return 'NULL';
	  }

	  switch (typeof val) {
	    case 'boolean': return (val) ? 'true' : 'false';
	    case 'number': return val+'';
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
	    val = val.toString()
	  }

	  val = val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
	    switch(s) {
	      case "\0": return "\\0";
	      case "\n": return "\\n";
	      case "\r": return "\\r";
	      case "\b": return "\\b";
	      case "\t": return "\\t";
	      case "\x1a": return "\\Z";
	      default: return "\\"+s;
	    }
	  });
	  return "'"+val+"'";
	};

	SqlString.arrayToList = function(array, timeZone) {
	  return array.map(function(v) {
	    if (Array.isArray(v)) return '(' + SqlString.arrayToList(v, timeZone) + ')';
	    return SqlString.escape(v, true, timeZone);
	  }).join(', ');
	};

	SqlString.format = function(sql, values, stringifyObjects, timeZone) {
	  values = !values ? [] : [].concat(values);

	  return sql.replace(/\?\??/g, function(match) {
	    if (!values.length) {
	      return match;
	    }

	    if (match === "??") {
	      return SqlString.escapeId(values.shift());
	    }
	    return SqlString.escape(values.shift(), stringifyObjects, timeZone);
	  });
	};

	SqlString.dateToString = function(date, timeZone) {
	  var dt = new Date(date);

	  if (timeZone !== 'local') {
	    var tz = convertTimezone(timeZone);

	    dt.setTime(dt.getTime() + (dt.getTimezoneOffset() * 60000));
	    if (tz !== false) {
	      dt.setTime(dt.getTime() + (tz * 60000));
	    }
	  }

	  var year   = dt.getFullYear();
	  var month  = zeroPad(dt.getMonth() + 1, 2);
	  var day    = zeroPad(dt.getDate(), 2);
	  var hour   = zeroPad(dt.getHours(), 2);
	  var minute = zeroPad(dt.getMinutes(), 2);
	  var second = zeroPad(dt.getSeconds(), 2);
	  var millisecond = zeroPad(dt.getMilliseconds(), 3);

	  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond;
	};

	SqlString.bufferToString = function(buffer) {
	  var hex = '';
	  try {
	    hex = buffer.toString('hex');
	  } catch (err) {
	    // node v0.4.x does not support hex / throws unknown encoding error
	    for (var i = 0; i < buffer.length; i++) {
	      var byte = buffer[i];
	      hex += zeroPad(byte.toString(16));
	    }
	  }

	  return "X'" + hex+ "'";
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(109).Buffer))

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	var baseCopy = __webpack_require__(95),
	    keys = __webpack_require__(97);

	/**
	 * The base implementation of `_.assign` without support for argument juggling,
	 * multiple sources, and `this` binding `customizer` functions.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @param {Function} [customizer] The function to customize assigning values.
	 * @returns {Object} Returns the destination object.
	 */
	function baseAssign(object, source, customizer) {
	  var props = keys(source);
	  if (!customizer) {
	    return baseCopy(source, object, props);
	  }
	  var index = -1,
	      length = props.length;

	  while (++index < length) {
	    var key = props[index],
	        value = object[key],
	        result = customizer(value, source[key], key, object, source);

	    if ((result === result ? result !== value : value === value) ||
	        (typeof value == 'undefined' && !(key in object))) {
	      object[key] = result;
	    }
	  }
	  return object;
	}

	module.exports = baseAssign;


/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	var bindCallback = __webpack_require__(74),
	    isIterateeCall = __webpack_require__(102);

	/**
	 * Creates a function that assigns properties of source object(s) to a given
	 * destination object.
	 *
	 * @private
	 * @param {Function} assigner The function to assign values.
	 * @returns {Function} Returns the new assigner function.
	 */
	function createAssigner(assigner) {
	  return function() {
	    var length = arguments.length,
	        object = arguments[0];

	    if (length < 2 || object == null) {
	      return object;
	    }
	    if (length > 3 && isIterateeCall(arguments[1], arguments[2], arguments[3])) {
	      length = 2;
	    }
	    // Juggle arguments.
	    if (length > 3 && typeof arguments[length - 2] == 'function') {
	      var customizer = bindCallback(arguments[--length - 1], arguments[length--], 5);
	    } else if (length > 2 && typeof arguments[length - 1] == 'function') {
	      customizer = arguments[--length];
	    }
	    var index = 0;
	    while (++index < length) {
	      var source = arguments[index];
	      if (source) {
	        assigner(object, source, customizer);
	      }
	    }
	    return object;
	  };
	}

	module.exports = createAssigner;


/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	var arrayCopy = __webpack_require__(104),
	    arrayEach = __webpack_require__(85),
	    baseCopy = __webpack_require__(95),
	    baseForOwn = __webpack_require__(88),
	    initCloneArray = __webpack_require__(105),
	    initCloneByTag = __webpack_require__(106),
	    initCloneObject = __webpack_require__(107),
	    isArray = __webpack_require__(89),
	    isObject = __webpack_require__(91),
	    keys = __webpack_require__(97);

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
	 * Used to resolve the `toStringTag` of values.
	 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * for more details.
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
	  if (typeof result != 'undefined') {
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
	        return baseCopy(value, result, keys(value));
	      }
	    } else {
	      return cloneableTags[tag]
	        ? initCloneByTag(value, tag, isDeep)
	        : (object ? value : {});
	    }
	  }
	  // Check for circular references and return corresponding clone.
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
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	var identity = __webpack_require__(103);

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
	  if (typeof thisArg == 'undefined') {
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
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Converts `value` to a string if it is not one. An empty string is returned
	 * for `null` or `undefined` values.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */
	function baseToString(value) {
	  if (typeof value == 'string') {
	    return value;
	  }
	  return value == null ? '' : (value + '');
	}

	module.exports = baseToString;


/***/ },
/* 76 */
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
	var util = __webpack_require__(120);

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
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	var Deque = __webpack_require__(166),
	    HashMap = __webpack_require__(168);

	var inherits = __webpack_require__(120).inherits,
	    EventEmitter = __webpack_require__(31).EventEmitter,
	    debug = __webpack_require__(42)('pool2');

	var assert = __webpack_require__(76);

	function deprecate(old, current) {
	    if (process.env.NODE_ENV === 'testing') { return; }
	    console.log('Pool2: ' + old + ' is deprecated, please use ' + current);
	}

	function validNum(opts, val, standard, allowZero) { // jshint maxcomplexity: 8
	    if (!opts || !opts.hasOwnProperty(val)) {
	        return standard;
	    }
	    var num = parseInt(opts[val], 10);
	    if (isNaN(num) || num !== +opts[val] || !isFinite(num) || num < 0) {
	        throw new RangeError('Pool2: ' + val + ' must be a positive integer, ' + opts[val] + ' given.');
	    }
	    if (!allowZero && num === 0) {
	        throw new RangeError('Pool2: ' + val + ' cannot be 0.');
	    }
	    return num;
	}
	function HOP(a, b) { return a && hasOwnProperty.call(a, b); }

	function Pool(opts) { // jshint maxcomplexity: 12, maxstatements: 40
	    EventEmitter.call(this);
	    
	    opts = opts || { };

	    if (HOP(opts, 'release')) {
	        deprecate('opts.release', 'opts.dispose');
	        opts.dispose = opts.release;
	    }

	    if (HOP(opts, 'releaseTimeout')) {
	        deprecate('opts.releaseTimeout', 'opts.disposeTimeout');
	        opts.disposeTimeout = opts.releaseTimeout;
	    }

	    assert(HOP(opts, 'acquire'), 'new Pool(): opts.acquire is required');
	    assert(HOP(opts, 'dispose'), 'new Pool(): opts.dispose is required');
	    assert(typeof opts.acquire === 'function', 'new Pool(): opts.acquire must be a function');
	    assert(typeof opts.dispose === 'function', 'new Pool(): opts.dispose must be a function');
	    assert(!HOP(opts, 'destroy') || typeof opts.destroy === 'function', 'new Pool(): opts.destroy must be a function');
	    assert(!HOP(opts, 'ping') || typeof opts.ping === 'function', 'new Pool(): opts.ping must be a function');
	    
	    this._acquire = opts.acquire;
	    this._dispose = opts.dispose;
	    this._destroy = opts.destroy || function () { };
	    this._ping = opts.ping || function (res, cb) { cb(); };
	    
	    this.max = validNum(opts, 'max', Pool.defaults.max);
	    this.min = validNum(opts, 'min', Pool.defaults.min, true);

	    assert(this.max >= this.min, 'new Pool(): opts.min cannot be greater than opts.max');
	    
	    this.maxRequests = validNum(opts, 'maxRequests', Infinity);
	    this.acquireTimeout = validNum(opts, 'acquireTimeout', Pool.defaults.acquireTimeout, true);
	    this.disposeTimeout = validNum(opts, 'disposeTimeout', Pool.defaults.disposeTimeout, true);
	    this.pingTimeout = validNum(opts, 'pingTimeout', Pool.defaults.pingTimeout);
	    this.idleTimeout = validNum(opts, 'idleTimeout', Pool.defaults.idleTimeout);
	    this.syncInterval = validNum(opts, 'syncInterval', Pool.defaults.syncInterval, true);

	    assert(this.syncInterval > 0 || !HOP(opts, 'idleTimeout'), 'new Pool(): Cannot specify opts.idleTimeout when opts.syncInterval is 0');

	    this.capabilities = Array.isArray(opts.capabilities) ? opts.capabilities.slice() : [ ];
	    
	    if (this.syncInterval !== 0) {
	        this.syncTimer = setInterval(function () {
	            this._ensureMinimum();
	            this._reap();
	            this._maybeAllocateResource();
	        }.bind(this), this.syncInterval);        
	    }
	    
	    this.live = false;
	    this.ending = false;
	    this.destroyed = false;
	    
	    this.acquiring = 0;
	    
	    this.pool = new HashMap();
	    this.available = [ ];
	    this.requests = new Deque();
	    
	    process.nextTick(this._ensureMinimum.bind(this));
	}
	inherits(Pool, EventEmitter);

	Pool.defaults = {
	    min: 0,
	    max: 10,
	    acquireTimeout: 30 * 1000,
	    disposeTimeout: 30 * 1000,
	    pingTimeout: 10 * 1000,
	    idleTimeout: 60 * 1000,
	    syncInterval: 10 * 1000
	};

	// return stats on the pool
	Pool.prototype.stats = function () {
	    var allocated = this.pool.count();
	    return {
	        min: this.min,
	        max: this.max,
	        allocated: allocated,
	        available: this.max - (allocated - this.available.length),
	        queued: this.requests.length,
	        maxRequests: this.maxRequests
	    };
	};

	// request a resource from the pool
	Pool.prototype.acquire = function (cb) {
	    if (this.destroyed || this.ending) {
	        cb(new Error('Pool is ' + (this.ending ? 'ending' : 'destroyed')));
	        return;
	    }
	    
	    if (this.requests.length >= this.maxRequests) {
	        cb(new Error('Pool is full'));
	        return;
	    }
	    
	    this.requests.push({ ts: new Date(), cb: cb });
	    process.nextTick(this._maybeAllocateResource.bind(this));
	};

	// release the resource back into the pool
	Pool.prototype.release = function (res) { // jshint maxstatements: 17
	    var err;
	    
	    if (!this.pool.has(res)) {
	        err = new Error('Pool.release(): Resource not member of pool');
	        err.res = res;
	        this.emit('error', err);
	        return;
	    }
	    
	    if (this.available.indexOf(res) > -1) {
	        err = new Error('Pool.release(): Resource already released');
	        err.res = res;
	        this.emit('error', err);
	        return;
	    }
	    
	    
	    this.pool.set(res, new Date());
	    this.available.unshift(res);
	    
	    if (this.requests.length === 0) { this.emit('drain'); }
	    
	    this._maybeAllocateResource();
	};

	// destroy the resource -- should be called only on error conditions and the like
	Pool.prototype.destroy = function (res) {
	    debug('Ungracefully destroying resource');
	    // make sure resource is not in our available resources array
	    var idx = this.available.indexOf(res);
	    if (idx > -1) { this.available.splice(idx, 1); }

	    // remove from pool if present
	    if (this.pool.has(res)) {
	        this.pool.remove(res);
	    }
	    
	    // destroy is fire-and-forget
	    try { this._destroy(res); }
	    catch (e) { this.emit('warn', e); }
	    
	    this._ensureMinimum();
	};

	// attempt to tear down the resource nicely -- should be called when the resource is still valid
	// (that is, the dispose callback is expected to behave correctly)
	Pool.prototype.remove = function (res, cb) { // jshint maxcomplexity: 7
	    // called sometimes internally for the timeout logic, but don't want to emit an error in those cases
	    var timer, skipError = false;
	    if (typeof cb === 'boolean') {
	        skipError = cb;
	        cb = null;
	    }
	    
	    // ensure resource is not in our available resources array
	    var idx = this.available.indexOf(res);
	    if (idx > -1) { this.available.splice(idx, 1); }
	    
	    if (this.pool.has(res)) {
	        this.pool.remove(res);
	    } else if (!skipError) {
	        // object isn't in our pool -- emit an error
	        this.emit('error', new Error('Pool.remove() called on non-member'));
	    }

	    // if we don't get a response from the dispose callback
	    // within the timeout period, attempt to destroy the resource
	    if (this.disposeTimeout !== 0) {
	        timer = setTimeout(this.destroy.bind(this, res), this.disposeTimeout);    
	    }

	    try {
	        debug('Attempting to gracefully remove resource');
	        this._dispose(res, function (e) {
	            clearTimeout(timer);
	            if (e) { this.emit('warn', e); }
	            else { this._ensureMinimum(); }
	            
	            if (typeof cb === 'function') { cb(e); }
	        }.bind(this));
	    } catch (e) {
	        clearTimeout(timer);
	        this.emit('warn', e);
	        if (typeof cb === 'function') { cb(e); }
	    }
	};

	// attempt to gracefully close the pool
	Pool.prototype.end = function (cb) {
	    cb = cb || function () { };
	    
	    this.ending = true;
	    
	    var closeResources = function () {
	        debug('Closing resources');
	        clearInterval(this.syncTimer);
	        
	        var count = this.pool.count(),
	            errors = [ ];
	        
	        if (count === 0) {
	            cb();
	            return;
	        }
	        
	        this.pool.forEach(function (value, key) {
	            this.remove(key, function (err, res) {
	                if (err) { errors.push(err); }
	                
	                count--;
	                if (count === 0) {
	                    debug('Resources closed');
	                    if (errors.length) { cb(errors); }
	                    else { cb(); }
	                }
	            });
	        }.bind(this));
	    }.bind(this);
	    
	    // begin now, or wait until there are no pending requests
	    if (this.requests.length === 0 && this.acquiring === 0) {
	        closeResources();
	    } else {
	        debug('Waiting for active requests to conclude before closing resources');
	        this.once('drain', closeResources);
	    }
	};

	// close idle resources
	Pool.prototype._reap = function () {
	    var n = this.pool.count(),
	        i, c = 0, res, idleTimestamp,
	        idleThreshold = (new Date()) - this.idleTimeout;
	    
	    debug('reap (cur=%d, av=%d)', n, this.available.length);
	    
	    for (i = this.available.length; n > this.min && i >= 0; i--) {
	        res = this.available[i];
	        idleTimestamp = this.pool.get(res);
	        
	        if (idleTimestamp < idleThreshold) {
	            n--; c++;
	            this.remove(res);
	        }
	    }
	    
	    if (c) { debug('Shrinking pool: destroying %d idle connections', c); }
	};

	// attempt to acquire at least the minimum quantity of resources
	Pool.prototype._ensureMinimum = function () {
	    if (this.ending || this.destroyed) { return; }
	    
	    var n = this.min - (this.pool.count() + this.acquiring);
	    if (n <= 0) { return; }
	    
	    debug('Attempting to acquire minimum resources (cur=%d, min=%d)', this.pool.count(), this.min);
	    while (n--) { this._allocateResource(); }
	};

	// allocate a resource to a waiting request, if possible
	Pool.prototype._maybeAllocateResource = function () {
	    // do nothing if there are no requests to serve
	    if (this.requests.length === 0) { return; }
	    
	    // call callback if there is a request and a resource to give it
	    if (this.available.length) {
	        var res = this.available.shift();
	        
	        var abort = function () {
	            this.remove(res);
	            this._maybeAllocateResource();
	        }.bind(this);
	        
	        var timer = setTimeout(abort, this.pingTimeout);

	        try {
	            this._ping(res, function (err) {
	                clearTimeout(timer);
	                if (err) {
	                    err.message = 'Ping failed, releasing resource: ' + err.message;
	                    this.emit('warn', err);
	                    abort();
	                    return;
	                }
	                
	                var req = this.requests.shift();
	                debug('Allocating resource to request; waited %ds', ((new Date()) - req.ts) / 1000);
	                req.cb(null, res);
	            }.bind(this));
	        } catch (err) {
	            err.message = 'Synchronous throw attempting to ping resource: ' + err.message;
	            this.emit('error', err);
	            abort();
	        }
	        
	        return;
	    }
	    
	    // allocate a new resource if there is a request but no resource to give it
	    // and there's room in the pool
	    if (this.pool.count() + this.acquiring < this.max) {
	        debug('Growing pool: no resource to serve request');
	        this._allocateResource();
	    }
	};

	// create a new resource
	Pool.prototype._allocateResource = function () {
	    if (this.destroyed) {
	        debug('Not allocating resource: destroyed');
	        return;
	    }
	    
	    debug('Attempting to acquire resource (cur=%d, ac=%d)', this.pool.count(), this.acquiring);
	    
	    // acquiring is asynchronous, don't over-allocate due to in-progress resource allocation
	    this.acquiring++;
	    
	    var onError, timer;
	    
	    onError = function (err) {
	        clearTimeout(timer);
	        
	        debug('Couldn\'t allocate new resource:', err);
	        
	        // throw an error if we haven't successfully allocated a resource yet
	        if (this.live === false) {
	            this._destroyPool();
	            err.message = 'Error allocating resources: ' + err.message;
	            this.emit('error', err);
	        }
	    }.bind(this);
	    
	    if (this.acquireTimeout !== 0) {
	        timer = setTimeout(function () {
	            debug('Timed out acquiring resource');
	            timer = null;
	            this.acquiring--;
	            
	            onError(new Error('Timed out acquiring resource'));
	            
	            // timed out allocations are dropped; this could leave us below the
	            // minimum threshold; try to bring us up to the minimum, but don't spam
	            setTimeout(this._ensureMinimum.bind(this), 2 * 1000);
	        }.bind(this), this.acquireTimeout);        
	    }
	    
	    try {
	        this._acquire(function (err, res) { // jshint maxstatements: 20
	            if (timer) {
	                clearTimeout(timer);
	                timer = null;
	                this.acquiring--;
	            } else if (!err) {
	                this.remove(res, true);
	                return;
	            }
	            
	            if (err) {
	                onError(err);
	                return;
	            }
	            
	            this.live = true;
	            
	            debug('Successfully allocated new resource (cur=%d, ac=%d)', this.pool.count(), this.acquiring);
	            
	            this.pool.set(res, new Date());
	            this.available.unshift(res);
	            
	            // normally 'drain' is emitted when the pending requests queue is empty; pending requests
	            // are the primary source of acquiring new resources. the pool minimum can cause resources
	            // to be acquired with no pending requests, however. if pool.end() is called while resources
	            // are being acquired to fill the minimum, the 'drain' event will never get triggered because
	            // there were no requests pending. in this case, we want to trigger the cleanup routine that
	            // normally binds to 'drain'
	            if (this.ending && this.requests.length === 0 && this.acquiring === 0) {
	                this.emit('drain');
	                return;
	            }            
	            
	            // we've successfully acquired a resource, and we only get
	            // here if something wants it, so... do that
	            this._maybeAllocateResource();
	        }.bind(this));
	    } catch (e) {
	        onError(e);
	    }
	};

	// destroy the pool itself
	Pool.prototype._destroyPool = function () {
	    this.destroyed = true;
	    clearInterval(this.syncTimer);
	    this.pool.forEach(function (value, key) {
	        this.destroy(key);
	    }.bind(this));
	    this.pool.clear();
	};

	Pool._validNum = validNum;

	module.exports = Pool;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	var HashMap = __webpack_require__(168),
	    Pool = __webpack_require__(77);
	    
	var inherits = __webpack_require__(120).inherits,
	    EventEmitter = __webpack_require__(31).EventEmitter;

	function Cluster(pools) {
	    EventEmitter.call(this);
	    
	    if (!pools) { pools = [ ]; }
	    else if (!Array.isArray(pools)) { pools = [ pools ]; }
	    
	    this.pools = [ ];
	    this.caps = { };
	    this.removeListeners = new HashMap();
	    this.sources = new HashMap();

	    this.ended = false;
	    
	    pools.forEach(this.addPool, this);
	}
	inherits(Cluster, EventEmitter);

	Cluster.prototype.addPool = function (pool) {
	    if (this.ended) {
	        throw new Error('Cluster.addPool(): Cluster is ended');
	    }
	    if (!(pool instanceof Pool)) {
	        throw new Error('Cluster.addPool(): Not a valid pool');
	    }
	    if (this.pools.indexOf(pool) > -1) {
	        throw new Error('Cluster.addPool(): Pool already in cluster');
	    }
	    
	    this.pools.push(pool);
	    this._bindListeners(pool);
	    this._addCapabilities(pool);
	};
	Cluster.prototype.removePool = function (pool) {
	    if (!(pool instanceof Pool)) {
	        throw new Error('Cluster.removePool(): Not a valid pool');
	    }
	    var idx = this.pools.indexOf(pool);
	    if (idx === -1) {
	        throw new Error('Cluster.removePool(): Pool not in cluster');
	    }
	    
	    this.pools.splice(idx, 1);
	    this._unbindListeners(pool);
	    this._removeCapabilities(pool);
	};
	Cluster.prototype.acquire = function (cap, cb) { // jshint maxstatements: 20, maxcomplexity: 8
	    if (typeof cap === 'function') {
	        cb = cap;
	        cap = void 0;
	    }
	    if (typeof cb !== 'function') {
	        this.emit('error', new Error('Cluster.acquire(): Callback is required'));
	        return;
	    }
	    if (this.ended) {
	        cb(new Error('Cluster.acquire(): Cluster is ended'));
	        return;
	    }
	    
	    var sources = this.pools;
	    if (cap) {
	        if (!this.caps[cap] || !this.caps[cap].length) {
	            cb(new Error('Cluster.acquire(): No pools can fulfil capability: ' + cap));
	            return;
	        }
	        sources = this.caps[cap];
	    }
	    
	    var pool = sources.filter(function (pool) {
	        var stats = pool.stats();
	        return stats.queued < stats.maxRequests;
	    }).sort(function (a, b) {
	        var statsA = a.stats(),
	            statsB = b.stats();

	        return (statsB.available - statsB.queued) - (statsA.available - statsA.queued);
	    })[0];
	    
	    if (!pool) {
	        cb(new Error('Cluster.acquire(): No pools available'));
	        return;
	    }
	    
	    pool.acquire(function (err, res) {
	        if (err) { cb(err); return; }
	        this.sources.set(res, pool);
	        process.nextTick(cb.bind(null, null, res));
	    }.bind(this));
	};
	Cluster.prototype.release = function (res) {
	    if (!this.sources.has(res)) {
	        var err = new Error('Cluster.release(): Unknown resource');
	        err.res = res;
	        this.emit('error', err);
	        return;
	    }
	    var pool = this.sources.get(res);
	    this.sources.remove(res);
	    pool.release(res);
	};
	Cluster.prototype.end = function (cb) {
	    if (this.ended) {
	        if (typeof cb === 'function') {
	            cb(new Error('Cluster.end(): Cluster is already ended'));
	        }
	        return;
	    }

	    this.ended = true;
	    
	    var count = this.pools.length,
	        errs = [ ];
	    
	    this.pools.forEach(function (pool) {
	        pool.end(function (err, res) {
	            this.removePool(pool);
	            if (err) { errs.concat(err); }
	            count--;
	            if (count === 0 && typeof cb === 'function') {
	                cb(errs.length ? errs : null);
	            }
	        }.bind(this));
	    }, this);
	};

	Cluster.prototype._addCapabilities = function (pool) {
	    if (!pool.capabilities || !Array.isArray(pool.capabilities)) { return; }
	    pool.capabilities.forEach(function (cap) {
	        if (typeof cap !== 'string') { return; }
	        this.caps[cap] = this.caps[cap] || [ ];
	        this.caps[cap].push(pool);
	    }, this);
	};
	Cluster.prototype._removeCapabilities = function (pool) {
	    if (!pool.capabilities || !Array.isArray(pool.capabilities)) { return; }
	    pool.capabilities.forEach(function (cap) {
	        if (typeof cap !== 'string' || !Array.isArray(this.caps[cap])) { return; }
	        var idx = this.caps[cap].indexOf(pool);
	        if (idx > -1) { this.caps[cap].splice(idx, 1); }
	    }, this);
	};
	Cluster.prototype._bindListeners = function (pool) {
	    var onError, onWarn;

	    onError = function (err) {
	        err.source = pool;
	        this.emit('error', err);
	    }.bind(this);
	    
	    onWarn = function (err) {
	        err.source = pool;
	        this.emit('warn', err);
	    }.bind(this);
	    
	    pool.on('error', onError);
	    pool.on('warn', onWarn);
	    
	    this.removeListeners.set(pool, function () {
	        pool.removeListener('error', onError);
	        pool.removeListener('warn', onWarn);
	    });
	};
	Cluster.prototype._unbindListeners = function (pool) {
	    this.removeListeners.get(pool)();
	    this.removeListeners.remove(pool);
	};


	module.exports = Cluster;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	var baseFlatten = __webpack_require__(112),
	    bindCallback = __webpack_require__(74),
	    pickByArray = __webpack_require__(113),
	    pickByCallback = __webpack_require__(114);

	/**
	 * Creates an object composed of the picked `object` properties. Property
	 * names may be specified as individual arguments or as arrays of property
	 * names. If `predicate` is provided it is invoked for each property of `object`
	 * picking the properties `predicate` returns truthy for. The predicate is
	 * bound to `thisArg` and invoked with three arguments; (value, key, object).
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
	function pick(object, predicate, thisArg) {
	  if (object == null) {
	    return {};
	  }
	  return typeof predicate == 'function'
	    ? pickByCallback(object, bindCallback(predicate, thisArg, 3))
	    : pickByArray(object, baseFlatten(arguments, false, false, 1));
	}

	module.exports = pick;


/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	var baseProperty = __webpack_require__(110),
	    map = __webpack_require__(111);

	/**
	 * Gets the value of `key` from all elements in `collection`.
	 *
	 * @static
	 * @memberOf _
	 * @category Collection
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {string} key The key of the property to pluck.
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
	function pluck(collection, key) {
	  return map(collection, baseProperty(key));
	}

	module.exports = pluck;


/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_81__;

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(115);
	exports.Stream = __webpack_require__(108);
	exports.Readable = exports;
	exports.Writable = __webpack_require__(116);
	exports.Duplex = __webpack_require__(117);
	exports.Transform = __webpack_require__(118);
	exports.PassThrough = __webpack_require__(119);


/***/ },
/* 83 */
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
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function() {
	var makeSelfResolutionError = function () {
	    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/LhFpo0\u000a");
	};
	var reflect = function() {
	    return new Promise.PromiseInspection(this._target());
	};
	var apiRejection = function(msg) {
	    return Promise.reject(new TypeError(msg));
	};
	var util = __webpack_require__(121);
	var async = __webpack_require__(122);
	var errors = __webpack_require__(123);
	var TypeError = Promise.TypeError = errors.TypeError;
	Promise.RangeError = errors.RangeError;
	Promise.CancellationError = errors.CancellationError;
	Promise.TimeoutError = errors.TimeoutError;
	Promise.OperationalError = errors.OperationalError;
	Promise.RejectionError = errors.OperationalError;
	Promise.AggregateError = errors.AggregateError;
	var INTERNAL = function(){};
	var APPLY = {};
	var NEXT_FILTER = {e: null};
	var tryConvertToPromise = __webpack_require__(124)(Promise, INTERNAL);
	var PromiseArray =
	    __webpack_require__(125)(Promise, INTERNAL,
	                                    tryConvertToPromise, apiRejection);
	var CapturedTrace = __webpack_require__(126)();
	var isDebugging = __webpack_require__(127)(Promise, CapturedTrace);
	 /*jshint unused:false*/
	var createContext =
	    __webpack_require__(128)(Promise, CapturedTrace, isDebugging);
	var CatchFilter = __webpack_require__(129)(NEXT_FILTER);
	var PromiseResolver = __webpack_require__(130);
	var nodebackForPromise = PromiseResolver._nodebackForPromise;
	var errorObj = util.errorObj;
	var tryCatch = util.tryCatch;
	function Promise(resolver) {
	    if (typeof resolver !== "function") {
	        throw new TypeError("the promise constructor requires a resolver function\u000a\u000a    See http://goo.gl/EC22Yn\u000a");
	    }
	    if (this.constructor !== Promise) {
	        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/KsIlge\u000a");
	    }
	    this._bitField = 0;
	    this._fulfillmentHandler0 = undefined;
	    this._rejectionHandler0 = undefined;
	    this._progressHandler0 = undefined;
	    this._promise0 = undefined;
	    this._receiver0 = undefined;
	    this._settledValue = undefined;
	    if (resolver !== INTERNAL) this._resolveFromResolver(resolver);
	}

	Promise.prototype.toString = function () {
	    return "[object Promise]";
	};

	Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
	    var len = arguments.length;
	    if (len > 1) {
	        var catchInstances = new Array(len - 1),
	            j = 0, i;
	        for (i = 0; i < len - 1; ++i) {
	            var item = arguments[i];
	            if (typeof item === "function") {
	                catchInstances[j++] = item;
	            } else {
	                return Promise.reject(
	                    new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a"));
	            }
	        }
	        catchInstances.length = j;
	        fn = arguments[i];
	        var catchFilter = new CatchFilter(catchInstances, fn, this);
	        return this._then(undefined, catchFilter.doFilter, undefined,
	            catchFilter, undefined);
	    }
	    return this._then(undefined, fn, undefined, undefined, undefined);
	};

	Promise.prototype.reflect = function () {
	    return this._then(reflect, reflect, undefined, this, undefined);
	};

	Promise.prototype.then = function (didFulfill, didReject, didProgress) {
	    if (isDebugging() && arguments.length > 0 &&
	        typeof didFulfill !== "function" &&
	        typeof didReject !== "function") {
	        var msg = ".then() only accepts functions but was passed: " +
	                util.classString(didFulfill);
	        if (arguments.length > 1) {
	            msg += ", " + util.classString(didReject);
	        }
	        this._warn(msg);
	    }
	    return this._then(didFulfill, didReject, didProgress,
	        undefined, undefined);
	};

	Promise.prototype.done = function (didFulfill, didReject, didProgress) {
	    var promise = this._then(didFulfill, didReject, didProgress,
	        undefined, undefined);
	    promise._setIsFinal();
	};

	Promise.prototype.spread = function (didFulfill, didReject) {
	    return this.all()._then(didFulfill, didReject, undefined, APPLY, undefined);
	};

	Promise.prototype.isCancellable = function () {
	    return !this.isResolved() &&
	        this._cancellable();
	};

	Promise.prototype.toJSON = function () {
	    var ret = {
	        isFulfilled: false,
	        isRejected: false,
	        fulfillmentValue: undefined,
	        rejectionReason: undefined
	    };
	    if (this.isFulfilled()) {
	        ret.fulfillmentValue = this.value();
	        ret.isFulfilled = true;
	    } else if (this.isRejected()) {
	        ret.rejectionReason = this.reason();
	        ret.isRejected = true;
	    }
	    return ret;
	};

	Promise.prototype.all = function () {
	    return new PromiseArray(this).promise();
	};

	Promise.prototype.error = function (fn) {
	    return this.caught(util.originatesFromRejection, fn);
	};

	Promise.is = function (val) {
	    return val instanceof Promise;
	};

	Promise.fromNode = function(fn) {
	    var ret = new Promise(INTERNAL);
	    var result = tryCatch(fn)(nodebackForPromise(ret));
	    if (result === errorObj) {
	        ret._rejectCallback(result.e, true, true);
	    }
	    return ret;
	};

	Promise.all = function (promises) {
	    return new PromiseArray(promises).promise();
	};

	Promise.defer = Promise.pending = function () {
	    var promise = new Promise(INTERNAL);
	    return new PromiseResolver(promise);
	};

	Promise.cast = function (obj) {
	    var ret = tryConvertToPromise(obj);
	    if (!(ret instanceof Promise)) {
	        var val = ret;
	        ret = new Promise(INTERNAL);
	        ret._fulfillUnchecked(val);
	    }
	    return ret;
	};

	Promise.resolve = Promise.fulfilled = Promise.cast;

	Promise.reject = Promise.rejected = function (reason) {
	    var ret = new Promise(INTERNAL);
	    ret._captureStackTrace();
	    ret._rejectCallback(reason, true);
	    return ret;
	};

	Promise.setScheduler = function(fn) {
	    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
	    var prev = async._schedule;
	    async._schedule = fn;
	    return prev;
	};

	Promise.prototype._then = function (
	    didFulfill,
	    didReject,
	    didProgress,
	    receiver,
	    internalData
	) {
	    var haveInternalData = internalData !== undefined;
	    var ret = haveInternalData ? internalData : new Promise(INTERNAL);

	    if (!haveInternalData) {
	        ret._propagateFrom(this, 4 | 1);
	        ret._captureStackTrace();
	    }

	    var target = this._target();
	    if (target !== this) {
	        if (receiver === undefined) receiver = this._boundTo;
	        if (!haveInternalData) ret._setIsMigrated();
	    }

	    var callbackIndex =
	        target._addCallbacks(didFulfill, didReject, didProgress, ret, receiver);

	    if (target._isResolved() && !target._isSettlePromisesQueued()) {
	        async.invoke(
	            target._settlePromiseAtPostResolution, target, callbackIndex);
	    }

	    return ret;
	};

	Promise.prototype._settlePromiseAtPostResolution = function (index) {
	    if (this._isRejectionUnhandled()) this._unsetRejectionIsUnhandled();
	    this._settlePromiseAt(index);
	};

	Promise.prototype._length = function () {
	    return this._bitField & 131071;
	};

	Promise.prototype._isFollowingOrFulfilledOrRejected = function () {
	    return (this._bitField & 939524096) > 0;
	};

	Promise.prototype._isFollowing = function () {
	    return (this._bitField & 536870912) === 536870912;
	};

	Promise.prototype._setLength = function (len) {
	    this._bitField = (this._bitField & -131072) |
	        (len & 131071);
	};

	Promise.prototype._setFulfilled = function () {
	    this._bitField = this._bitField | 268435456;
	};

	Promise.prototype._setRejected = function () {
	    this._bitField = this._bitField | 134217728;
	};

	Promise.prototype._setFollowing = function () {
	    this._bitField = this._bitField | 536870912;
	};

	Promise.prototype._setIsFinal = function () {
	    this._bitField = this._bitField | 33554432;
	};

	Promise.prototype._isFinal = function () {
	    return (this._bitField & 33554432) > 0;
	};

	Promise.prototype._cancellable = function () {
	    return (this._bitField & 67108864) > 0;
	};

	Promise.prototype._setCancellable = function () {
	    this._bitField = this._bitField | 67108864;
	};

	Promise.prototype._unsetCancellable = function () {
	    this._bitField = this._bitField & (~67108864);
	};

	Promise.prototype._setIsMigrated = function () {
	    this._bitField = this._bitField | 4194304;
	};

	Promise.prototype._unsetIsMigrated = function () {
	    this._bitField = this._bitField & (~4194304);
	};

	Promise.prototype._isMigrated = function () {
	    return (this._bitField & 4194304) > 0;
	};

	Promise.prototype._receiverAt = function (index) {
	    var ret = index === 0
	        ? this._receiver0
	        : this[
	            index * 5 - 5 + 4];
	    if (ret === undefined && this._isBound()) {
	        return this._boundTo;
	    }
	    return ret;
	};

	Promise.prototype._promiseAt = function (index) {
	    return index === 0
	        ? this._promise0
	        : this[index * 5 - 5 + 3];
	};

	Promise.prototype._fulfillmentHandlerAt = function (index) {
	    return index === 0
	        ? this._fulfillmentHandler0
	        : this[index * 5 - 5 + 0];
	};

	Promise.prototype._rejectionHandlerAt = function (index) {
	    return index === 0
	        ? this._rejectionHandler0
	        : this[index * 5 - 5 + 1];
	};

	Promise.prototype._migrateCallbacks = function (follower, index) {
	    var fulfill = follower._fulfillmentHandlerAt(index);
	    var reject = follower._rejectionHandlerAt(index);
	    var progress = follower._progressHandlerAt(index);
	    var promise = follower._promiseAt(index);
	    var receiver = follower._receiverAt(index);
	    if (promise instanceof Promise) promise._setIsMigrated();
	    this._addCallbacks(fulfill, reject, progress, promise, receiver);
	};

	Promise.prototype._addCallbacks = function (
	    fulfill,
	    reject,
	    progress,
	    promise,
	    receiver
	) {
	    var index = this._length();

	    if (index >= 131071 - 5) {
	        index = 0;
	        this._setLength(0);
	    }

	    if (index === 0) {
	        this._promise0 = promise;
	        if (receiver !== undefined) this._receiver0 = receiver;
	        if (typeof fulfill === "function" && !this._isCarryingStackTrace())
	            this._fulfillmentHandler0 = fulfill;
	        if (typeof reject === "function") this._rejectionHandler0 = reject;
	        if (typeof progress === "function") this._progressHandler0 = progress;
	    } else {
	        var base = index * 5 - 5;
	        this[base + 3] = promise;
	        this[base + 4] = receiver;
	        if (typeof fulfill === "function")
	            this[base + 0] = fulfill;
	        if (typeof reject === "function")
	            this[base + 1] = reject;
	        if (typeof progress === "function")
	            this[base + 2] = progress;
	    }
	    this._setLength(index + 1);
	    return index;
	};

	Promise.prototype._setProxyHandlers = function (receiver, promiseSlotValue) {
	    var index = this._length();

	    if (index >= 131071 - 5) {
	        index = 0;
	        this._setLength(0);
	    }
	    if (index === 0) {
	        this._promise0 = promiseSlotValue;
	        this._receiver0 = receiver;
	    } else {
	        var base = index * 5 - 5;
	        this[base + 3] = promiseSlotValue;
	        this[base + 4] = receiver;
	    }
	    this._setLength(index + 1);
	};

	Promise.prototype._proxyPromiseArray = function (promiseArray, index) {
	    this._setProxyHandlers(promiseArray, index);
	};

	Promise.prototype._resolveCallback = function(value, shouldBind) {
	    if (this._isFollowingOrFulfilledOrRejected()) return;
	    if (value === this)
	        return this._rejectCallback(makeSelfResolutionError(), false, true);
	    var maybePromise = tryConvertToPromise(value, this);
	    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

	    var propagationFlags = 1 | (shouldBind ? 4 : 0);
	    this._propagateFrom(maybePromise, propagationFlags);
	    var promise = maybePromise._target();
	    if (promise._isPending()) {
	        var len = this._length();
	        for (var i = 0; i < len; ++i) {
	            promise._migrateCallbacks(this, i);
	        }
	        this._setFollowing();
	        this._setLength(0);
	        this._setFollowee(promise);
	    } else if (promise._isFulfilled()) {
	        this._fulfillUnchecked(promise._value());
	    } else {
	        this._rejectUnchecked(promise._reason(),
	            promise._getCarriedStackTrace());
	    }
	};

	Promise.prototype._rejectCallback =
	function(reason, synchronous, shouldNotMarkOriginatingFromRejection) {
	    if (!shouldNotMarkOriginatingFromRejection) {
	        util.markAsOriginatingFromRejection(reason);
	    }
	    var trace = util.ensureErrorObject(reason);
	    var hasStack = trace === reason;
	    this._attachExtraTrace(trace, synchronous ? hasStack : false);
	    this._reject(reason, hasStack ? undefined : trace);
	};

	Promise.prototype._resolveFromResolver = function (resolver) {
	    var promise = this;
	    this._captureStackTrace();
	    this._pushContext();
	    var synchronous = true;
	    var r = tryCatch(resolver)(function(value) {
	        if (promise === null) return;
	        promise._resolveCallback(value);
	        promise = null;
	    }, function (reason) {
	        if (promise === null) return;
	        promise._rejectCallback(reason, synchronous);
	        promise = null;
	    });
	    synchronous = false;
	    this._popContext();

	    if (r !== undefined && r === errorObj && promise !== null) {
	        promise._rejectCallback(r.e, true, true);
	        promise = null;
	    }
	};

	Promise.prototype._settlePromiseFromHandler = function (
	    handler, receiver, value, promise
	) {
	    if (promise._isRejected()) return;
	    promise._pushContext();
	    var x;
	    if (receiver === APPLY && !this._isRejected()) {
	        x = tryCatch(handler).apply(this._boundTo, value);
	    } else {
	        x = tryCatch(handler).call(receiver, value);
	    }
	    promise._popContext();

	    if (x === errorObj || x === promise || x === NEXT_FILTER) {
	        var err = x === promise ? makeSelfResolutionError() : x.e;
	        promise._rejectCallback(err, false, true);
	    } else {
	        promise._resolveCallback(x);
	    }
	};

	Promise.prototype._target = function() {
	    var ret = this;
	    while (ret._isFollowing()) ret = ret._followee();
	    return ret;
	};

	Promise.prototype._followee = function() {
	    return this._rejectionHandler0;
	};

	Promise.prototype._setFollowee = function(promise) {
	    this._rejectionHandler0 = promise;
	};

	Promise.prototype._cleanValues = function () {
	    if (this._cancellable()) {
	        this._cancellationParent = undefined;
	    }
	};

	Promise.prototype._propagateFrom = function (parent, flags) {
	    if ((flags & 1) > 0 && parent._cancellable()) {
	        this._setCancellable();
	        this._cancellationParent = parent;
	    }
	    if ((flags & 4) > 0 && parent._isBound()) {
	        this._setBoundTo(parent._boundTo);
	    }
	};

	Promise.prototype._fulfill = function (value) {
	    if (this._isFollowingOrFulfilledOrRejected()) return;
	    this._fulfillUnchecked(value);
	};

	Promise.prototype._reject = function (reason, carriedStackTrace) {
	    if (this._isFollowingOrFulfilledOrRejected()) return;
	    this._rejectUnchecked(reason, carriedStackTrace);
	};

	Promise.prototype._settlePromiseAt = function (index) {
	    var promise = this._promiseAt(index);
	    var isPromise = promise instanceof Promise;

	    if (isPromise && promise._isMigrated()) {
	        promise._unsetIsMigrated();
	        return async.invoke(this._settlePromiseAt, this, index);
	    }
	    var handler = this._isFulfilled()
	        ? this._fulfillmentHandlerAt(index)
	        : this._rejectionHandlerAt(index);

	    var carriedStackTrace =
	        this._isCarryingStackTrace() ? this._getCarriedStackTrace() : undefined;
	    var value = this._settledValue;
	    var receiver = this._receiverAt(index);


	    this._clearCallbackDataAtIndex(index);

	    if (typeof handler === "function") {
	        if (!isPromise) {
	            handler.call(receiver, value, promise);
	        } else {
	            this._settlePromiseFromHandler(handler, receiver, value, promise);
	        }
	    } else if (receiver instanceof PromiseArray) {
	        if (!receiver._isResolved()) {
	            if (this._isFulfilled()) {
	                receiver._promiseFulfilled(value, promise);
	            }
	            else {
	                receiver._promiseRejected(value, promise);
	            }
	        }
	    } else if (isPromise) {
	        if (this._isFulfilled()) {
	            promise._fulfill(value);
	        } else {
	            promise._reject(value, carriedStackTrace);
	        }
	    }

	    if (index >= 4 && (index & 31) === 4)
	        async.invokeLater(this._setLength, this, 0);
	};

	Promise.prototype._clearCallbackDataAtIndex = function(index) {
	    if (index === 0) {
	        if (!this._isCarryingStackTrace()) {
	            this._fulfillmentHandler0 = undefined;
	        }
	        this._rejectionHandler0 =
	        this._progressHandler0 =
	        this._receiver0 =
	        this._promise0 = undefined;
	    } else {
	        var base = index * 5 - 5;
	        this[base + 3] =
	        this[base + 4] =
	        this[base + 0] =
	        this[base + 1] =
	        this[base + 2] = undefined;
	    }
	};

	Promise.prototype._isSettlePromisesQueued = function () {
	    return (this._bitField &
	            -1073741824) === -1073741824;
	};

	Promise.prototype._setSettlePromisesQueued = function () {
	    this._bitField = this._bitField | -1073741824;
	};

	Promise.prototype._unsetSettlePromisesQueued = function () {
	    this._bitField = this._bitField & (~-1073741824);
	};

	Promise.prototype._queueSettlePromises = function() {
	    async.settlePromises(this);
	    this._setSettlePromisesQueued();
	};

	Promise.prototype._fulfillUnchecked = function (value) {
	    if (value === this) {
	        var err = makeSelfResolutionError();
	        this._attachExtraTrace(err);
	        return this._rejectUnchecked(err, undefined);
	    }
	    this._setFulfilled();
	    this._settledValue = value;
	    this._cleanValues();

	    if (this._length() > 0) {
	        this._queueSettlePromises();
	    }
	};

	Promise.prototype._rejectUncheckedCheckError = function (reason) {
	    var trace = util.ensureErrorObject(reason);
	    this._rejectUnchecked(reason, trace === reason ? undefined : trace);
	};

	Promise.prototype._rejectUnchecked = function (reason, trace) {
	    if (reason === this) {
	        var err = makeSelfResolutionError();
	        this._attachExtraTrace(err);
	        return this._rejectUnchecked(err);
	    }
	    this._setRejected();
	    this._settledValue = reason;
	    this._cleanValues();

	    if (this._isFinal()) {
	        async.throwLater(function(e) {
	            if ("stack" in e) {
	                async.invokeFirst(
	                    CapturedTrace.unhandledRejection, undefined, e);
	            }
	            throw e;
	        }, trace === undefined ? reason : trace);
	        return;
	    }

	    if (trace !== undefined && trace !== reason) {
	        this._setCarriedStackTrace(trace);
	    }

	    if (this._length() > 0) {
	        this._queueSettlePromises();
	    } else {
	        this._ensurePossibleRejectionHandled();
	    }
	};

	Promise.prototype._settlePromises = function () {
	    this._unsetSettlePromisesQueued();
	    var len = this._length();
	    for (var i = 0; i < len; i++) {
	        this._settlePromiseAt(i);
	    }
	};

	Promise._makeSelfResolutionError = makeSelfResolutionError;
	__webpack_require__(131)(Promise, PromiseArray);
	__webpack_require__(132)(Promise, INTERNAL, tryConvertToPromise, apiRejection);
	__webpack_require__(133)(Promise, INTERNAL, tryConvertToPromise);
	__webpack_require__(134)(Promise, NEXT_FILTER, tryConvertToPromise);
	__webpack_require__(135)(Promise);
	__webpack_require__(136)(Promise);
	__webpack_require__(137)(Promise, PromiseArray, tryConvertToPromise, INTERNAL);
	Promise.Promise = Promise;
	__webpack_require__(138)(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
	__webpack_require__(139)(Promise);
	__webpack_require__(140)(Promise, apiRejection, tryConvertToPromise, createContext);
	__webpack_require__(141)(Promise, apiRejection, INTERNAL, tryConvertToPromise);
	__webpack_require__(142)(Promise);
	__webpack_require__(143)(Promise);
	__webpack_require__(144)(Promise, PromiseArray, tryConvertToPromise, apiRejection);
	__webpack_require__(145)(Promise, INTERNAL, tryConvertToPromise, apiRejection);
	__webpack_require__(146)(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
	__webpack_require__(147)(Promise, PromiseArray);
	__webpack_require__(148)(Promise, PromiseArray, apiRejection);
	__webpack_require__(149)(Promise, INTERNAL);
	__webpack_require__(150)(Promise);
	__webpack_require__(151)(Promise, INTERNAL);
	__webpack_require__(152)(Promise, INTERNAL);
	__webpack_require__(153)(Promise, INTERNAL);
	                                                         
	    util.toFastProperties(Promise);                                          
	    util.toFastProperties(Promise.prototype);                                
	    function fillTypes(value) {                                              
	        var p = new Promise(INTERNAL);                                       
	        p._fulfillmentHandler0 = value;                                      
	        p._rejectionHandler0 = value;                                        
	        p._progressHandler0 = value;                                         
	        p._promise0 = value;                                                 
	        p._receiver0 = value;                                                
	        p._settledValue = value;                                             
	    }                                                                        
	    // Complete slack tracking, opt out of field-type tracking and           
	    // stabilize map                                                         
	    fillTypes({a: 1});                                                       
	    fillTypes({b: 2});                                                       
	    fillTypes({c: 3});                                                       
	    fillTypes(1);                                                            
	    fillTypes(function(){});                                                 
	    fillTypes(undefined);                                                    
	    fillTypes(false);                                                        
	    fillTypes(new Promise(INTERNAL));                                        
	    CapturedTrace.setBounds(async.firstLineError, util.lastLineError);       
	    return Promise;                                                          

	};


/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A specialized version of `_.forEach` for arrays without support for callback
	 * shorthands or `this` binding.
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
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	var baseMatches = __webpack_require__(154),
	    baseMatchesProperty = __webpack_require__(155),
	    baseProperty = __webpack_require__(110),
	    bindCallback = __webpack_require__(74),
	    identity = __webpack_require__(103),
	    isBindable = __webpack_require__(156);

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
	    return (typeof thisArg != 'undefined' && isBindable(func))
	      ? bindCallback(func, thisArg, argCount)
	      : func;
	  }
	  if (func == null) {
	    return identity;
	  }
	  if (type == 'object') {
	    return baseMatches(func);
	  }
	  return typeof thisArg == 'undefined'
	    ? baseProperty(func + '')
	    : baseMatchesProperty(func + '', thisArg);
	}

	module.exports = baseCallback;


/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var isObject = __webpack_require__(91);

	/**
	 * The base implementation of `_.create` without support for assigning
	 * properties to the created object.
	 *
	 * @private
	 * @param {Object} prototype The object to inherit from.
	 * @returns {Object} Returns the new object.
	 */
	var baseCreate = (function() {
	  function Object() {}
	  return function(prototype) {
	    if (isObject(prototype)) {
	      Object.prototype = prototype;
	      var result = new Object;
	      Object.prototype = null;
	    }
	    return result || global.Object();
	  };
	}());

	module.exports = baseCreate;

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	var baseFor = __webpack_require__(157),
	    keys = __webpack_require__(97);

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
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	var isLength = __webpack_require__(159),
	    isNative = __webpack_require__(158),
	    isObjectLike = __webpack_require__(160);

	/** `Object#toString` result references. */
	var arrayTag = '[object Array]';

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/**
	 * Used to resolve the `toStringTag` of values.
	 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * for more details.
	 */
	var objToString = objectProto.toString;

	/* Native method references for those with the same name as other `lodash` methods. */
	var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray;

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
	 * (function() { return _.isArray(arguments); })();
	 * // => false
	 */
	var isArray = nativeIsArray || function(value) {
	  return (isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag) || false;
	};

	module.exports = isArray;


/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var isNative = __webpack_require__(158);

	/** `Object#toString` result references. */
	var funcTag = '[object Function]';

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/**
	 * Used to resolve the `toStringTag` of values.
	 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * for more details.
	 */
	var objToString = objectProto.toString;

	/** Native method references. */
	var Uint8Array = isNative(Uint8Array = global.Uint8Array) && Uint8Array;

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
	  // Avoid a Chakra JIT bug in compatibility modes of IE 11.
	  // See https://github.com/jashkenas/underscore/issues/1621 for more details.
	  return typeof value == 'function' || false;
	}
	// Fallback for environments that return incorrect `typeof` operator results.
	if (isFunction(/x/) || (Uint8Array && !isFunction(Uint8Array))) {
	  isFunction = function(value) {
	    // The use of `Object#toString` avoids issues with the `typeof` operator
	    // in older versions of Chrome and Safari which return 'function' for regexes
	    // and Safari 8 equivalents which return 'object' for typed array constructors.
	    return objToString.call(value) == funcTag;
	  };
	}

	module.exports = isFunction;

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Checks if `value` is the language type of `Object`.
	 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * **Note:** See the [ES5 spec](https://es5.github.io/#x8) for more details.
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
	  return type == 'function' || (value && type == 'object') || false;
	}

	module.exports = isObject;


/***/ },
/* 92 */
/***/ function(module, exports, __webpack_require__) {

	var isLength = __webpack_require__(159),
	    isObjectLike = __webpack_require__(160);

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
	 * Used to resolve the `toStringTag` of values.
	 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * for more details.
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
	  return (isObjectLike(value) && isLength(value.length) && typedArrayTags[objToString.call(value)]) || false;
	}

	module.exports = isTypedArray;


/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	var baseMerge = __webpack_require__(161),
	    createAssigner = __webpack_require__(72);

	/**
	 * Recursively merges own enumerable properties of the source object(s), that
	 * don't resolve to `undefined` into the destination object. Subsequent sources
	 * overwrite property assignments of previous sources. If `customizer` is
	 * provided it is invoked to produce the merged values of the destination and
	 * source properties. If `customizer` returns `undefined` merging is handled
	 * by the method instead. The `customizer` is bound to `thisArg` and invoked
	 * with five arguments; (objectValue, sourceValue, key, object, source).
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} [sources] The source objects.
	 * @param {Function} [customizer] The function to customize merging properties.
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
	 *   return _.isArray(a) ? a.concat(b) : undefined;
	 * });
	 * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }
	 */
	var merge = createAssigner(baseMerge);

	module.exports = merge;


/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {var util = __webpack_require__(120)
	var Cursor = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"pg-cursor\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()))
	var Readable = __webpack_require__(82).Readable

	var QueryStream = module.exports = function(text, values, options) {
	  var self = this
	  this._reading = false
	  this._closing = false
	  options = options || { }
	  Cursor.call(this, text, values)
	  Readable.call(this, {
	    objectMode: true,
	    highWaterMark: options.highWaterMark || 1000
	  })
	  this.batchSize = options.batchSize || 100
	  this.once('end', function() {
	    process.nextTick(function() {
	      self.emit('close')
	    })
	  })
	}

	util.inherits(QueryStream, Readable)

	//copy cursor prototype to QueryStream
	//so we can handle all the events emitted by the connection
	for(var key in Cursor.prototype) {
	  if(key == 'read') {
	    QueryStream.prototype._fetch = Cursor.prototype.read
	  } else {
	    QueryStream.prototype[key] = Cursor.prototype[key]
	  }
	}

	QueryStream.prototype.close = function() {
	  this._closing = true
	  var self = this
	  Cursor.prototype.close.call(this, function(err) {
	    if(err) return self.emit('error', err)
	    process.nextTick(function() {
	      self.push(null)
	    })
	  })
	}

	QueryStream.prototype._read = function(n) {
	  if(this._reading || this._closing) return false
	  this._reading = true
	  var self = this
	  this._fetch(this.batchSize, function(err, rows) {
	    if(err) {
	      return self.emit('error', err)
	    }
	    if(!rows.length) {
	      process.nextTick(function() {
	        self.push(null)
	      })
	      return
	    }
	    self._reading = false
	    for(var i = 0; i < rows.length; i++) {
	      self.push(rows[i])
	    }
	  })
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copies the properties of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy properties from.
	 * @param {Object} [object={}] The object to copy properties to.
	 * @param {Array} props The property names to copy.
	 * @returns {Object} Returns `object`.
	 */
	function baseCopy(source, object, props) {
	  if (!props) {
	    props = object;
	    object = {};
	  }
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
/* 96 */
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
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	var isLength = __webpack_require__(159),
	    isNative = __webpack_require__(158),
	    isObject = __webpack_require__(91),
	    shimKeys = __webpack_require__(162);

	/* Native method references for those with the same name as other `lodash` methods. */
	var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;

	/**
	 * Creates an array of the own enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects. See the
	 * [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.keys)
	 * for more details.
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to inspect.
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
	  if (object) {
	    var Ctor = object.constructor,
	        length = object.length;
	  }
	  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
	     (typeof object != 'function' && (length && isLength(length)))) {
	    return shimKeys(object);
	  }
	  return isObject(object) ? nativeKeys(object) : [];
	};

	module.exports = keys;


/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var styles = module.exports = {
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


/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ansiRegex = __webpack_require__(178)();

	module.exports = function (str) {
		return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
	};


/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	var argv = process.argv;

	module.exports = (function () {
		if ('FORCE_COLOR' in process.env) {
			return true;
		}

		if (argv.indexOf('--no-color') !== -1 ||
			argv.indexOf('--no-colors') !== -1 ||
			argv.indexOf('--color=false') !== -1) {
			return false;
		}

		if (argv.indexOf('--color') !== -1 ||
			argv.indexOf('--colors') !== -1 ||
			argv.indexOf('--color=true') !== -1 ||
			argv.indexOf('--color=always') !== -1) {
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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ansiRegex = __webpack_require__(179);
	var re = new RegExp(ansiRegex().source); // remove the `g` flag
	module.exports = re.test.bind(re);


/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	var isIndex = __webpack_require__(163),
	    isLength = __webpack_require__(159),
	    isObject = __webpack_require__(91);

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
	  if (type == 'number') {
	    var length = object.length,
	        prereq = isLength(length) && isIndex(index, length);
	  } else {
	    prereq = type == 'string' && index in object;
	  }
	  return prereq && object[index] === value;
	}

	module.exports = isIterateeCall;


/***/ },
/* 103 */
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
	 * _.identity(object) === object;
	 * // => true
	 */
	function identity(value) {
	  return value;
	}

	module.exports = identity;


/***/ },
/* 104 */
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
/* 105 */
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
/* 106 */
/***/ function(module, exports, __webpack_require__) {

	var bufferClone = __webpack_require__(164);

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
/* 107 */
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
/* 108 */
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

	var EE = __webpack_require__(31).EventEmitter;
	var inherits = __webpack_require__(41);

	inherits(Stream, EE);
	Stream.Readable = __webpack_require__(82);
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
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */

	var base64 = __webpack_require__(197)
	var ieee754 = __webpack_require__(192)
	var isArray = __webpack_require__(193)

	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50
	Buffer.poolSize = 8192 // not used by this implementation

	var kMaxLength = 0x3fffffff
	var rootParent = {}

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Note:
	 *
	 * - Implementation must support adding new properties to `Uint8Array` instances.
	 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
	 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *    incorrect length in some situations.
	 *
	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
	 * get the Object implementation, which is slower but will work correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = (function () {
	  try {
	    var buf = new ArrayBuffer(0)
	    var arr = new Uint8Array(buf)
	    arr.foo = function () { return 42 }
	    return arr.foo() === 42 && // typed array instances can be augmented
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	})()

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

	  that.write(string, encoding) | 0
	  return that
	}

	function fromObject (that, object) {
	  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

	  if (isArray(object)) return fromArray(that, object)

	  if (object == null) {
	    throw new TypeError('must start with number, buffer, array or string')
	  }

	  if (typeof ArrayBuffer !== 'undefined' && object.buffer instanceof ArrayBuffer) {
	    return fromTypedArray(that, object)
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

	function allocate (that, length) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = Buffer._augment(new Uint8Array(length))
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
	  if (length >= kMaxLength) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength.toString(16) + ' bytes')
	  }
	  return length >>> 0
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
	  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
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
	  } else if (list.length === 1) {
	    return list[0]
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
	  if (typeof string !== 'string') string = String(string)

	  if (string.length === 0) return 0

	  switch (encoding || 'utf8') {
	    case 'ascii':
	    case 'binary':
	    case 'raw':
	      return string.length
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return string.length * 2
	    case 'hex':
	      return string.length >>> 1
	    case 'utf8':
	    case 'utf-8':
	      return utf8ToBytes(string).length
	    case 'base64':
	      return base64ToBytes(string).length
	    default:
	      return string.length
	  }
	}
	Buffer.byteLength = byteLength

	// pre-set for values that may exist in the future
	Buffer.prototype.length = undefined
	Buffer.prototype.parent = undefined

	// toString(encoding, start=0, end=buffer.length)
	Buffer.prototype.toString = function toString (encoding, start, end) {
	  var loweredCase = false

	  start = start >>> 0
	  end = end === undefined || end === Infinity ? this.length : end >>> 0

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

	// `get` will be removed in Node 0.13+
	Buffer.prototype.get = function get (offset) {
	  console.log('.get() is deprecated. Access using array indexes instead.')
	  return this.readUInt8(offset)
	}

	// `set` will be removed in Node 0.13+
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
	    offset = offset >>> 0
	    if (isFinite(length)) {
	      length = length >>> 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    var swap = encoding
	    encoding = offset
	    offset = length >>> 0
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
	  var res = ''
	  var tmp = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    if (buf[i] <= 0x7F) {
	      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
	      tmp = ''
	    } else {
	      tmp += '%' + buf[i].toString(16)
	    }
	  }

	  return res + decodeUtf8Char(tmp)
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
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
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
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
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
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
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
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
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
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) >>> 0 & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) >>> 0 & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = value
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
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = value
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
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = value
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = value
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) {
	    checkInt(
	      this, value, offset, byteLength,
	      Math.pow(2, 8 * byteLength - 1) - 1,
	      -Math.pow(2, 8 * byteLength - 1)
	    )
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
	  offset = offset >>> 0
	  if (!noAssert) {
	    checkInt(
	      this, value, offset, byteLength,
	      Math.pow(2, 8 * byteLength - 1) - 1,
	      -Math.pow(2, 8 * byteLength - 1)
	    )
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
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = value
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = value
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value
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
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = value
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
	Buffer.prototype.copy = function copy (target, target_start, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (target_start >= target.length) target_start = target.length
	  if (!target_start) target_start = 0
	  if (end > 0 && end < start) end = start

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (target_start < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - target_start < end - start) {
	    end = target.length - target_start + start
	  }

	  var len = end - start

	  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < len; i++) {
	      target[i + target_start] = this[i + start]
	    }
	  } else {
	    target._set(this.subarray(start, start + len), target_start)
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

	  // deprecated, will be removed in node 0.13+
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

	var INVALID_BASE64_RE = /[^+\/0-9A-z\-]/g

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
	  var i = 0

	  for (; i < length; i++) {
	    codePoint = string.charCodeAt(i)

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (leadSurrogate) {
	        // 2 leads in a row
	        if (codePoint < 0xDC00) {
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          leadSurrogate = codePoint
	          continue
	        } else {
	          // valid surrogate pair
	          codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
	          leadSurrogate = null
	        }
	      } else {
	        // no lead yet

	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else {
	          // valid lead
	          leadSurrogate = codePoint
	          continue
	        }
	      }
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	      leadSurrogate = null
	    }

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
	    } else if (codePoint < 0x200000) {
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

	function decodeUtf8Char (str) {
	  try {
	    return decodeURIComponent(str)
	  } catch (err) {
	    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(109).Buffer))

/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * The base implementation of `_.property` which does not coerce `key` to a string.
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
/* 111 */
/***/ function(module, exports, __webpack_require__) {

	var arrayMap = __webpack_require__(174),
	    baseCallback = __webpack_require__(86),
	    baseMap = __webpack_require__(175),
	    isArray = __webpack_require__(89);

	/**
	 * Creates an array of values by running each element in `collection` through
	 * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
	 * arguments; (value, index|key, collection).
	 *
	 * If a property name is provided for `predicate` the created "_.property"
	 * style callback returns the property value of the given element.
	 *
	 * If value is also provided for `thisArg` the created "_.matchesProperty"
	 * style callback returns `true` for elements that have a matching property
	 * value, else `false`.
	 *
	 * If an object is provided for `predicate` the created "_.matches" style
	 * callback returns `true` for elements that have the properties of the given
	 * object, else `false`.
	 *
	 * Many lodash methods are guarded to work as interatees for methods like
	 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
	 *
	 * The guarded methods are:
	 * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`, `drop`,
	 * `dropRight`, `fill`, `flatten`, `invert`, `max`, `min`, `parseInt`, `slice`,
	 * `sortBy`, `take`, `takeRight`, `template`, `trim`, `trimLeft`, `trimRight`,
	 * `trunc`, `random`, `range`, `sample`, `uniq`, and `words`
	 *
	 * @static
	 * @memberOf _
	 * @alias collect
	 * @category Collection
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
	 *  per iteration. If a property name or object is provided it is used to
	 *  create a "_.property" or "_.matches" style callback respectively.
	 * @param {*} [thisArg] The `this` binding of `iteratee`.
	 * @returns {Array} Returns the new mapped array.
	 * @example
	 *
	 * _.map([1, 2, 3], function(n) { return n * 3; });
	 * // => [3, 6, 9]
	 *
	 * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(n) { return n * 3; });
	 * // => [3, 6, 9] (iteration order is not guaranteed)
	 *
	 * var users = [
	 *   { 'user': 'barney' },
	 *   { 'user': 'fred' }
	 * ];
	 *
	 * // using the "_.property" callback shorthand
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
/* 112 */
/***/ function(module, exports, __webpack_require__) {

	var isArguments = __webpack_require__(173),
	    isArray = __webpack_require__(89),
	    isLength = __webpack_require__(159),
	    isObjectLike = __webpack_require__(160);

	/**
	 * The base implementation of `_.flatten` with added support for restricting
	 * flattening and specifying the start index.
	 *
	 * @private
	 * @param {Array} array The array to flatten.
	 * @param {boolean} [isDeep] Specify a deep flatten.
	 * @param {boolean} [isStrict] Restrict flattening to arrays and `arguments` objects.
	 * @param {number} [fromIndex=0] The index to start from.
	 * @returns {Array} Returns the new flattened array.
	 */
	function baseFlatten(array, isDeep, isStrict, fromIndex) {
	  var index = (fromIndex || 0) - 1,
	      length = array.length,
	      resIndex = -1,
	      result = [];

	  while (++index < length) {
	    var value = array[index];

	    if (isObjectLike(value) && isLength(value.length) && (isArray(value) || isArguments(value))) {
	      if (isDeep) {
	        // Recursively flatten arrays (susceptible to call stack limits).
	        value = baseFlatten(value, isDeep, isStrict);
	      }
	      var valIndex = -1,
	          valLength = value.length;

	      result.length += valLength;
	      while (++valIndex < valLength) {
	        result[++resIndex] = value[valIndex];
	      }
	    } else if (!isStrict) {
	      result[++resIndex] = value;
	    }
	  }
	  return result;
	}

	module.exports = baseFlatten;


/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	var toObject = __webpack_require__(176);

	/**
	 * A specialized version of `_.pick` that picks `object` properties specified
	 * by the `props` array.
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
/* 114 */
/***/ function(module, exports, __webpack_require__) {

	var baseForIn = __webpack_require__(177);

	/**
	 * A specialized version of `_.pick` that picks `object` properties `predicate`
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
/* 115 */
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
	var isArray = __webpack_require__(194);
	/*</replacement>*/


	/*<replacement>*/
	var Buffer = __webpack_require__(109).Buffer;
	/*</replacement>*/

	Readable.ReadableState = ReadableState;

	var EE = __webpack_require__(31).EventEmitter;

	/*<replacement>*/
	if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
	  return emitter.listeners(type).length;
	};
	/*</replacement>*/

	var Stream = __webpack_require__(108);

	/*<replacement>*/
	var util = __webpack_require__(199);
	util.inherits = __webpack_require__(41);
	/*</replacement>*/

	var StringDecoder;


	/*<replacement>*/
	var debug = __webpack_require__(165);
	if (debug && debug.debuglog) {
	  debug = debug.debuglog('stream');
	} else {
	  debug = function () {};
	}
	/*</replacement>*/


	util.inherits(Readable, Stream);

	function ReadableState(options, stream) {
	  var Duplex = __webpack_require__(117);

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
	      StringDecoder = __webpack_require__(196).StringDecoder;
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}

	function Readable(options) {
	  var Duplex = __webpack_require__(117);

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
	    StringDecoder = __webpack_require__(196).StringDecoder;
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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 116 */
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
	var Buffer = __webpack_require__(109).Buffer;
	/*</replacement>*/

	Writable.WritableState = WritableState;


	/*<replacement>*/
	var util = __webpack_require__(199);
	util.inherits = __webpack_require__(41);
	/*</replacement>*/

	var Stream = __webpack_require__(108);

	util.inherits(Writable, Stream);

	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	}

	function WritableState(options, stream) {
	  var Duplex = __webpack_require__(117);

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
	  var Duplex = __webpack_require__(117);

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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 117 */
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
	var util = __webpack_require__(199);
	util.inherits = __webpack_require__(41);
	/*</replacement>*/

	var Readable = __webpack_require__(115);
	var Writable = __webpack_require__(116);

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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 118 */
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

	var Duplex = __webpack_require__(117);

	/*<replacement>*/
	var util = __webpack_require__(199);
	util.inherits = __webpack_require__(41);
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
/* 119 */
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

	var Transform = __webpack_require__(118);

	/*<replacement>*/
	var util = __webpack_require__(199);
	util.inherits = __webpack_require__(41);
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
/* 120 */
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

	exports.isBuffer = __webpack_require__(195);

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
	exports.inherits = __webpack_require__(41);

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

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(30)))

/***/ },
/* 121 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {"use strict";
	var es5 = __webpack_require__(182);
	var canEvaluate = typeof navigator == "undefined";
	var haveGetters = (function(){
	    try {
	        var o = {};
	        es5.defineProperty(o, "f", {
	            get: function () {
	                return 3;
	            }
	        });
	        return o.f === 3;
	    }
	    catch (e) {
	        return false;
	    }

	})();

	var errorObj = {e: {}};
	var tryCatchTarget;
	function tryCatcher() {
	    try {
	        return tryCatchTarget.apply(this, arguments);
	    } catch (e) {
	        errorObj.e = e;
	        return errorObj;
	    }
	}
	function tryCatch(fn) {
	    tryCatchTarget = fn;
	    return tryCatcher;
	}

	var inherits = function(Child, Parent) {
	    var hasProp = {}.hasOwnProperty;

	    function T() {
	        this.constructor = Child;
	        this.constructor$ = Parent;
	        for (var propertyName in Parent.prototype) {
	            if (hasProp.call(Parent.prototype, propertyName) &&
	                propertyName.charAt(propertyName.length-1) !== "$"
	           ) {
	                this[propertyName + "$"] = Parent.prototype[propertyName];
	            }
	        }
	    }
	    T.prototype = Parent.prototype;
	    Child.prototype = new T();
	    return Child.prototype;
	};


	function isPrimitive(val) {
	    return val == null || val === true || val === false ||
	        typeof val === "string" || typeof val === "number";

	}

	function isObject(value) {
	    return !isPrimitive(value);
	}

	function maybeWrapAsError(maybeError) {
	    if (!isPrimitive(maybeError)) return maybeError;

	    return new Error(safeToString(maybeError));
	}

	function withAppended(target, appendee) {
	    var len = target.length;
	    var ret = new Array(len + 1);
	    var i;
	    for (i = 0; i < len; ++i) {
	        ret[i] = target[i];
	    }
	    ret[i] = appendee;
	    return ret;
	}

	function getDataPropertyOrDefault(obj, key, defaultValue) {
	    if (es5.isES5) {
	        var desc = Object.getOwnPropertyDescriptor(obj, key);
	        if (desc != null) {
	            return desc.get == null && desc.set == null
	                    ? desc.value
	                    : defaultValue;
	        }
	    } else {
	        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
	    }
	}

	function notEnumerableProp(obj, name, value) {
	    if (isPrimitive(obj)) return obj;
	    var descriptor = {
	        value: value,
	        configurable: true,
	        enumerable: false,
	        writable: true
	    };
	    es5.defineProperty(obj, name, descriptor);
	    return obj;
	}


	var wrapsPrimitiveReceiver = (function() {
	    return this !== "string";
	}).call("string");

	function thrower(r) {
	    throw r;
	}

	var inheritedDataKeys = (function() {
	    if (es5.isES5) {
	        var oProto = Object.prototype;
	        var getKeys = Object.getOwnPropertyNames;
	        return function(obj) {
	            var ret = [];
	            var visitedKeys = Object.create(null);
	            while (obj != null && obj !== oProto) {
	                var keys;
	                try {
	                    keys = getKeys(obj);
	                } catch (e) {
	                    return ret;
	                }
	                for (var i = 0; i < keys.length; ++i) {
	                    var key = keys[i];
	                    if (visitedKeys[key]) continue;
	                    visitedKeys[key] = true;
	                    var desc = Object.getOwnPropertyDescriptor(obj, key);
	                    if (desc != null && desc.get == null && desc.set == null) {
	                        ret.push(key);
	                    }
	                }
	                obj = es5.getPrototypeOf(obj);
	            }
	            return ret;
	        };
	    } else {
	        return function(obj) {
	            var ret = [];
	            /*jshint forin:false */
	            for (var key in obj) {
	                ret.push(key);
	            }
	            return ret;
	        };
	    }

	})();

	function isClass(fn) {
	    try {
	        if (typeof fn === "function") {
	            var keys = es5.names(fn.prototype);
	            if (es5.isES5) return keys.length > 1;
	            return keys.length > 0 &&
	                   !(keys.length === 1 && keys[0] === "constructor");
	        }
	        return false;
	    } catch (e) {
	        return false;
	    }
	}

	function toFastProperties(obj) {
	    /*jshint -W027,-W055,-W031*/
	    function f() {}
	    f.prototype = obj;
	    var l = 8;
	    while (l--) new f();
	    return obj;
	    eval(obj);
	}

	var rident = /^[a-z$_][a-z$_0-9]*$/i;
	function isIdentifier(str) {
	    return rident.test(str);
	}

	function filledRange(count, prefix, suffix) {
	    var ret = new Array(count);
	    for(var i = 0; i < count; ++i) {
	        ret[i] = prefix + i + suffix;
	    }
	    return ret;
	}

	function safeToString(obj) {
	    try {
	        return obj + "";
	    } catch (e) {
	        return "[no string representation]";
	    }
	}

	function markAsOriginatingFromRejection(e) {
	    try {
	        notEnumerableProp(e, "isOperational", true);
	    }
	    catch(ignore) {}
	}

	function originatesFromRejection(e) {
	    if (e == null) return false;
	    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
	        e["isOperational"] === true);
	}

	function canAttachTrace(obj) {
	    return obj instanceof Error && es5.propertyIsWritable(obj, "stack");
	}

	var ensureErrorObject = (function() {
	    if (!("stack" in new Error())) {
	        return function(value) {
	            if (canAttachTrace(value)) return value;
	            try {throw new Error(safeToString(value));}
	            catch(err) {return err;}
	        };
	    } else {
	        return function(value) {
	            if (canAttachTrace(value)) return value;
	            return new Error(safeToString(value));
	        };
	    }
	})();

	function classString(obj) {
	    return {}.toString.call(obj);
	}

	function copyDescriptors(from, to, filter) {
	    var keys = es5.names(from);
	    for (var i = 0; i < keys.length; ++i) {
	        var key = keys[i];
	        if (filter(key)) {
	            es5.defineProperty(to, key, es5.getDescriptor(from, key));
	        }
	    }
	}

	var ret = {
	    isClass: isClass,
	    isIdentifier: isIdentifier,
	    inheritedDataKeys: inheritedDataKeys,
	    getDataPropertyOrDefault: getDataPropertyOrDefault,
	    thrower: thrower,
	    isArray: es5.isArray,
	    haveGetters: haveGetters,
	    notEnumerableProp: notEnumerableProp,
	    isPrimitive: isPrimitive,
	    isObject: isObject,
	    canEvaluate: canEvaluate,
	    errorObj: errorObj,
	    tryCatch: tryCatch,
	    inherits: inherits,
	    withAppended: withAppended,
	    maybeWrapAsError: maybeWrapAsError,
	    wrapsPrimitiveReceiver: wrapsPrimitiveReceiver,
	    toFastProperties: toFastProperties,
	    filledRange: filledRange,
	    toString: safeToString,
	    canAttachTrace: canAttachTrace,
	    ensureErrorObject: ensureErrorObject,
	    originatesFromRejection: originatesFromRejection,
	    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
	    classString: classString,
	    copyDescriptors: copyDescriptors,
	    hasDevTools: typeof chrome !== "undefined" && chrome &&
	                 typeof chrome.loadTimes === "function",
	    isNode: typeof process !== "undefined" &&
	        classString(process).toLowerCase() === "[object process]"
	};
	try {throw new Error(); } catch (e) {ret.lastLineError = e;}
	module.exports = ret;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 122 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {"use strict";
	var firstLineError;
	try {throw new Error(); } catch (e) {firstLineError = e;}
	var schedule = __webpack_require__(180);
	var Queue = __webpack_require__(181);
	var util = __webpack_require__(121);

	function Async() {
	    this._isTickUsed = false;
	    this._lateQueue = new Queue(16);
	    this._normalQueue = new Queue(16);
	    this._trampolineEnabled = true;
	    var self = this;
	    this.drainQueues = function () {
	        self._drainQueues();
	    };
	    this._schedule =
	        schedule.isStatic ? schedule(this.drainQueues) : schedule;
	}

	Async.prototype.disableTrampolineIfNecessary = function() {
	    if (util.hasDevTools) {
	        this._trampolineEnabled = false;
	    }
	};

	Async.prototype.enableTrampoline = function() {
	    if (!this._trampolineEnabled) {
	        this._trampolineEnabled = true;
	        this._schedule = function(fn) {
	            setTimeout(fn, 0);
	        };
	    }
	};

	Async.prototype.haveItemsQueued = function () {
	    return this._normalQueue.length() > 0;
	};

	Async.prototype.throwLater = function(fn, arg) {
	    if (arguments.length === 1) {
	        arg = fn;
	        fn = function () { throw arg; };
	    }
	    var domain = this._getDomain();
	    if (domain !== undefined) fn = domain.bind(fn);
	    if (typeof setTimeout !== "undefined") {
	        setTimeout(function() {
	            fn(arg);
	        }, 0);
	    } else try {
	        this._schedule(function() {
	            fn(arg);
	        });
	    } catch (e) {
	        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
	    }
	};

	Async.prototype._getDomain = function() {};

	if (util.isNode) {
	    var EventsModule = __webpack_require__(31);

	    var domainGetter = function() {
	        var domain = process.domain;
	        if (domain === null) return undefined;
	        return domain;
	    };

	    if (EventsModule.usingDomains) {
	        Async.prototype._getDomain = domainGetter;
	    } else {
	        var descriptor =
	            Object.getOwnPropertyDescriptor(EventsModule, "usingDomains");

	        if (!descriptor.configurable) {
	            process.on("domainsActivated", function() {
	                Async.prototype._getDomain = domainGetter;
	            });
	        } else {
	            var usingDomains = false;
	            Object.defineProperty(EventsModule, "usingDomains", {
	                configurable: false,
	                enumerable: true,
	                get: function() {
	                    return usingDomains;
	                },
	                set: function(value) {
	                    if (usingDomains || !value) return;
	                    usingDomains = true;
	                    Async.prototype._getDomain = domainGetter;
	                    util.toFastProperties(process);
	                    process.emit("domainsActivated");
	                }
	            });
	        }


	    }
	}

	function AsyncInvokeLater(fn, receiver, arg) {
	    var domain = this._getDomain();
	    if (domain !== undefined) fn = domain.bind(fn);
	    this._lateQueue.push(fn, receiver, arg);
	    this._queueTick();
	}

	function AsyncInvoke(fn, receiver, arg) {
	    var domain = this._getDomain();
	    if (domain !== undefined) fn = domain.bind(fn);
	    this._normalQueue.push(fn, receiver, arg);
	    this._queueTick();
	}

	function AsyncSettlePromises(promise) {
	    var domain = this._getDomain();
	    if (domain !== undefined) {
	        var fn = domain.bind(promise._settlePromises);
	        this._normalQueue.push(fn, promise, undefined);
	    } else {
	        this._normalQueue._pushOne(promise);
	    }
	    this._queueTick();
	}

	if (!util.hasDevTools) {
	    Async.prototype.invokeLater = AsyncInvokeLater;
	    Async.prototype.invoke = AsyncInvoke;
	    Async.prototype.settlePromises = AsyncSettlePromises;
	} else {
	    Async.prototype.invokeLater = function (fn, receiver, arg) {
	        if (this._trampolineEnabled) {
	            AsyncInvokeLater.call(this, fn, receiver, arg);
	        } else {
	            setTimeout(function() {
	                fn.call(receiver, arg);
	            }, 100);
	        }
	    };

	    Async.prototype.invoke = function (fn, receiver, arg) {
	        if (this._trampolineEnabled) {
	            AsyncInvoke.call(this, fn, receiver, arg);
	        } else {
	            setTimeout(function() {
	                fn.call(receiver, arg);
	            }, 0);
	        }
	    };

	    Async.prototype.settlePromises = function(promise) {
	        if (this._trampolineEnabled) {
	            AsyncSettlePromises.call(this, promise);
	        } else {
	            setTimeout(function() {
	                promise._settlePromises();
	            }, 0);
	        }
	    };
	}

	Async.prototype.invokeFirst = function (fn, receiver, arg) {
	    var domain = this._getDomain();
	    if (domain !== undefined) fn = domain.bind(fn);
	    this._normalQueue.unshift(fn, receiver, arg);
	    this._queueTick();
	};

	Async.prototype._drainQueue = function(queue) {
	    while (queue.length() > 0) {
	        var fn = queue.shift();
	        if (typeof fn !== "function") {
	            fn._settlePromises();
	            continue;
	        }
	        var receiver = queue.shift();
	        var arg = queue.shift();
	        fn.call(receiver, arg);
	    }
	};

	Async.prototype._drainQueues = function () {
	    this._drainQueue(this._normalQueue);
	    this._reset();
	    this._drainQueue(this._lateQueue);
	};

	Async.prototype._queueTick = function () {
	    if (!this._isTickUsed) {
	        this._isTickUsed = true;
	        this._schedule(this.drainQueues);
	    }
	};

	Async.prototype._reset = function () {
	    this._isTickUsed = false;
	};

	module.exports = new Async();
	module.exports.firstLineError = firstLineError;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 123 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var es5 = __webpack_require__(182);
	var Objectfreeze = es5.freeze;
	var util = __webpack_require__(121);
	var inherits = util.inherits;
	var notEnumerableProp = util.notEnumerableProp;

	function subError(nameProperty, defaultMessage) {
	    function SubError(message) {
	        if (!(this instanceof SubError)) return new SubError(message);
	        notEnumerableProp(this, "message",
	            typeof message === "string" ? message : defaultMessage);
	        notEnumerableProp(this, "name", nameProperty);
	        if (Error.captureStackTrace) {
	            Error.captureStackTrace(this, this.constructor);
	        } else {
	            Error.call(this);
	        }
	    }
	    inherits(SubError, Error);
	    return SubError;
	}

	var _TypeError, _RangeError;
	var Warning = subError("Warning", "warning");
	var CancellationError = subError("CancellationError", "cancellation error");
	var TimeoutError = subError("TimeoutError", "timeout error");
	var AggregateError = subError("AggregateError", "aggregate error");
	try {
	    _TypeError = TypeError;
	    _RangeError = RangeError;
	} catch(e) {
	    _TypeError = subError("TypeError", "type error");
	    _RangeError = subError("RangeError", "range error");
	}

	var methods = ("join pop push shift unshift slice filter forEach some " +
	    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

	for (var i = 0; i < methods.length; ++i) {
	    if (typeof Array.prototype[methods[i]] === "function") {
	        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
	    }
	}

	es5.defineProperty(AggregateError.prototype, "length", {
	    value: 0,
	    configurable: false,
	    writable: true,
	    enumerable: true
	});
	AggregateError.prototype["isOperational"] = true;
	var level = 0;
	AggregateError.prototype.toString = function() {
	    var indent = Array(level * 4 + 1).join(" ");
	    var ret = "\n" + indent + "AggregateError of:" + "\n";
	    level++;
	    indent = Array(level * 4 + 1).join(" ");
	    for (var i = 0; i < this.length; ++i) {
	        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
	        var lines = str.split("\n");
	        for (var j = 0; j < lines.length; ++j) {
	            lines[j] = indent + lines[j];
	        }
	        str = lines.join("\n");
	        ret += str + "\n";
	    }
	    level--;
	    return ret;
	};

	function OperationalError(message) {
	    if (!(this instanceof OperationalError))
	        return new OperationalError(message);
	    notEnumerableProp(this, "name", "OperationalError");
	    notEnumerableProp(this, "message", message);
	    this.cause = message;
	    this["isOperational"] = true;

	    if (message instanceof Error) {
	        notEnumerableProp(this, "message", message.message);
	        notEnumerableProp(this, "stack", message.stack);
	    } else if (Error.captureStackTrace) {
	        Error.captureStackTrace(this, this.constructor);
	    }

	}
	inherits(OperationalError, Error);

	var errorTypes = Error["__BluebirdErrorTypes__"];
	if (!errorTypes) {
	    errorTypes = Objectfreeze({
	        CancellationError: CancellationError,
	        TimeoutError: TimeoutError,
	        OperationalError: OperationalError,
	        RejectionError: OperationalError,
	        AggregateError: AggregateError
	    });
	    notEnumerableProp(Error, "__BluebirdErrorTypes__", errorTypes);
	}

	module.exports = {
	    Error: Error,
	    TypeError: _TypeError,
	    RangeError: _RangeError,
	    CancellationError: errorTypes.CancellationError,
	    OperationalError: errorTypes.OperationalError,
	    TimeoutError: errorTypes.TimeoutError,
	    AggregateError: errorTypes.AggregateError,
	    Warning: Warning
	};


/***/ },
/* 124 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise, INTERNAL) {
	var util = __webpack_require__(121);
	var errorObj = util.errorObj;
	var isObject = util.isObject;

	function tryConvertToPromise(obj, context) {
	    if (isObject(obj)) {
	        if (obj instanceof Promise) {
	            return obj;
	        }
	        else if (isAnyBluebirdPromise(obj)) {
	            var ret = new Promise(INTERNAL);
	            obj._then(
	                ret._fulfillUnchecked,
	                ret._rejectUncheckedCheckError,
	                ret._progressUnchecked,
	                ret,
	                null
	            );
	            return ret;
	        }
	        var then = util.tryCatch(getThen)(obj);
	        if (then === errorObj) {
	            if (context) context._pushContext();
	            var ret = Promise.reject(then.e);
	            if (context) context._popContext();
	            return ret;
	        } else if (typeof then === "function") {
	            return doThenable(obj, then, context);
	        }
	    }
	    return obj;
	}

	function getThen(obj) {
	    return obj.then;
	}

	var hasProp = {}.hasOwnProperty;
	function isAnyBluebirdPromise(obj) {
	    return hasProp.call(obj, "_promise0");
	}

	function doThenable(x, then, context) {
	    var promise = new Promise(INTERNAL);
	    var ret = promise;
	    if (context) context._pushContext();
	    promise._captureStackTrace();
	    if (context) context._popContext();
	    var synchronous = true;
	    var result = util.tryCatch(then).call(x,
	                                        resolveFromThenable,
	                                        rejectFromThenable,
	                                        progressFromThenable);
	    synchronous = false;
	    if (promise && result === errorObj) {
	        promise._rejectCallback(result.e, true, true);
	        promise = null;
	    }

	    function resolveFromThenable(value) {
	        if (!promise) return;
	        if (x === value) {
	            promise._rejectCallback(
	                Promise._makeSelfResolutionError(), false, true);
	        } else {
	            promise._resolveCallback(value);
	        }
	        promise = null;
	    }

	    function rejectFromThenable(reason) {
	        if (!promise) return;
	        promise._rejectCallback(reason, synchronous, true);
	        promise = null;
	    }

	    function progressFromThenable(value) {
	        if (!promise) return;
	        if (typeof promise._progress === "function") {
	            promise._progress(value);
	        }
	    }
	    return ret;
	}

	return tryConvertToPromise;
	};


/***/ },
/* 125 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise, INTERNAL, tryConvertToPromise,
	    apiRejection) {
	var util = __webpack_require__(121);
	var isArray = util.isArray;

	function toResolutionValue(val) {
	    switch(val) {
	    case -2: return [];
	    case -3: return {};
	    }
	}

	function PromiseArray(values) {
	    var promise = this._promise = new Promise(INTERNAL);
	    var parent;
	    if (values instanceof Promise) {
	        parent = values;
	        promise._propagateFrom(parent, 1 | 4);
	    }
	    this._values = values;
	    this._length = 0;
	    this._totalResolved = 0;
	    this._init(undefined, -2);
	}
	PromiseArray.prototype.length = function () {
	    return this._length;
	};

	PromiseArray.prototype.promise = function () {
	    return this._promise;
	};

	PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
	    var values = tryConvertToPromise(this._values, this._promise);
	    if (values instanceof Promise) {
	        values = values._target();
	        this._values = values;
	        if (values._isFulfilled()) {
	            values = values._value();
	            if (!isArray(values)) {
	                var err = new Promise.TypeError("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
	                this.__hardReject__(err);
	                return;
	            }
	        } else if (values._isPending()) {
	            values._then(
	                init,
	                this._reject,
	                undefined,
	                this,
	                resolveValueIfEmpty
	           );
	            return;
	        } else {
	            this._reject(values._reason());
	            return;
	        }
	    } else if (!isArray(values)) {
	        this._promise._reject(apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a")._reason());
	        return;
	    }

	    if (values.length === 0) {
	        if (resolveValueIfEmpty === -5) {
	            this._resolveEmptyArray();
	        }
	        else {
	            this._resolve(toResolutionValue(resolveValueIfEmpty));
	        }
	        return;
	    }
	    var len = this.getActualLength(values.length);
	    this._length = len;
	    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
	    var promise = this._promise;
	    for (var i = 0; i < len; ++i) {
	        var isResolved = this._isResolved();
	        var maybePromise = tryConvertToPromise(values[i], promise);
	        if (maybePromise instanceof Promise) {
	            maybePromise = maybePromise._target();
	            if (isResolved) {
	                maybePromise._unsetRejectionIsUnhandled();
	            } else if (maybePromise._isPending()) {
	                maybePromise._proxyPromiseArray(this, i);
	            } else if (maybePromise._isFulfilled()) {
	                this._promiseFulfilled(maybePromise._value(), i);
	            } else {
	                this._promiseRejected(maybePromise._reason(), i);
	            }
	        } else if (!isResolved) {
	            this._promiseFulfilled(maybePromise, i);
	        }
	    }
	};

	PromiseArray.prototype._isResolved = function () {
	    return this._values === null;
	};

	PromiseArray.prototype._resolve = function (value) {
	    this._values = null;
	    this._promise._fulfill(value);
	};

	PromiseArray.prototype.__hardReject__ =
	PromiseArray.prototype._reject = function (reason) {
	    this._values = null;
	    this._promise._rejectCallback(reason, false, true);
	};

	PromiseArray.prototype._promiseProgressed = function (progressValue, index) {
	    this._promise._progress({
	        index: index,
	        value: progressValue
	    });
	};


	PromiseArray.prototype._promiseFulfilled = function (value, index) {
	    this._values[index] = value;
	    var totalResolved = ++this._totalResolved;
	    if (totalResolved >= this._length) {
	        this._resolve(this._values);
	    }
	};

	PromiseArray.prototype._promiseRejected = function (reason, index) {
	    this._totalResolved++;
	    this._reject(reason);
	};

	PromiseArray.prototype.shouldCopyValues = function () {
	    return true;
	};

	PromiseArray.prototype.getActualLength = function (len) {
	    return len;
	};

	return PromiseArray;
	};


/***/ },
/* 126 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {"use strict";
	module.exports = function() {
	var async = __webpack_require__(122);
	var util = __webpack_require__(121);
	var bluebirdFramePattern =
	    /[\\\/]bluebird[\\\/]js[\\\/](main|debug|zalgo|instrumented)/;
	var stackFramePattern = null;
	var formatStack = null;
	var indentStackFrames = false;
	var warn;

	function CapturedTrace(parent) {
	    this._parent = parent;
	    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
	    captureStackTrace(this, CapturedTrace);
	    if (length > 32) this.uncycle();
	}
	util.inherits(CapturedTrace, Error);

	CapturedTrace.prototype.uncycle = function() {
	    var length = this._length;
	    if (length < 2) return;
	    var nodes = [];
	    var stackToIndex = {};

	    for (var i = 0, node = this; node !== undefined; ++i) {
	        nodes.push(node);
	        node = node._parent;
	    }
	    length = this._length = i;
	    for (var i = length - 1; i >= 0; --i) {
	        var stack = nodes[i].stack;
	        if (stackToIndex[stack] === undefined) {
	            stackToIndex[stack] = i;
	        }
	    }
	    for (var i = 0; i < length; ++i) {
	        var currentStack = nodes[i].stack;
	        var index = stackToIndex[currentStack];
	        if (index !== undefined && index !== i) {
	            if (index > 0) {
	                nodes[index - 1]._parent = undefined;
	                nodes[index - 1]._length = 1;
	            }
	            nodes[i]._parent = undefined;
	            nodes[i]._length = 1;
	            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

	            if (index < length - 1) {
	                cycleEdgeNode._parent = nodes[index + 1];
	                cycleEdgeNode._parent.uncycle();
	                cycleEdgeNode._length =
	                    cycleEdgeNode._parent._length + 1;
	            } else {
	                cycleEdgeNode._parent = undefined;
	                cycleEdgeNode._length = 1;
	            }
	            var currentChildLength = cycleEdgeNode._length + 1;
	            for (var j = i - 2; j >= 0; --j) {
	                nodes[j]._length = currentChildLength;
	                currentChildLength++;
	            }
	            return;
	        }
	    }
	};

	CapturedTrace.prototype.parent = function() {
	    return this._parent;
	};

	CapturedTrace.prototype.hasParent = function() {
	    return this._parent !== undefined;
	};

	CapturedTrace.prototype.attachExtraTrace = function(error) {
	    if (error.__stackCleaned__) return;
	    this.uncycle();
	    var parsed = CapturedTrace.parseStackAndMessage(error);
	    var message = parsed.message;
	    var stacks = [parsed.stack];

	    var trace = this;
	    while (trace !== undefined) {
	        stacks.push(cleanStack(trace.stack.split("\n")));
	        trace = trace._parent;
	    }
	    removeCommonRoots(stacks);
	    removeDuplicateOrEmptyJumps(stacks);
	    util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
	    util.notEnumerableProp(error, "__stackCleaned__", true);
	};

	function reconstructStack(message, stacks) {
	    for (var i = 0; i < stacks.length - 1; ++i) {
	        stacks[i].push("From previous event:");
	        stacks[i] = stacks[i].join("\n");
	    }
	    if (i < stacks.length) {
	        stacks[i] = stacks[i].join("\n");
	    }
	    return message + "\n" + stacks.join("\n");
	}

	function removeDuplicateOrEmptyJumps(stacks) {
	    for (var i = 0; i < stacks.length; ++i) {
	        if (stacks[i].length === 0 ||
	            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
	            stacks.splice(i, 1);
	            i--;
	        }
	    }
	}

	function removeCommonRoots(stacks) {
	    var current = stacks[0];
	    for (var i = 1; i < stacks.length; ++i) {
	        var prev = stacks[i];
	        var currentLastIndex = current.length - 1;
	        var currentLastLine = current[currentLastIndex];
	        var commonRootMeetPoint = -1;

	        for (var j = prev.length - 1; j >= 0; --j) {
	            if (prev[j] === currentLastLine) {
	                commonRootMeetPoint = j;
	                break;
	            }
	        }

	        for (var j = commonRootMeetPoint; j >= 0; --j) {
	            var line = prev[j];
	            if (current[currentLastIndex] === line) {
	                current.pop();
	                currentLastIndex--;
	            } else {
	                break;
	            }
	        }
	        current = prev;
	    }
	}

	function cleanStack(stack) {
	    var ret = [];
	    for (var i = 0; i < stack.length; ++i) {
	        var line = stack[i];
	        var isTraceLine = stackFramePattern.test(line) ||
	            "    (No stack trace)" === line;
	        var isInternalFrame = isTraceLine && shouldIgnore(line);
	        if (isTraceLine && !isInternalFrame) {
	            if (indentStackFrames && line.charAt(0) !== " ") {
	                line = "    " + line;
	            }
	            ret.push(line);
	        }
	    }
	    return ret;
	}

	function stackFramesAsArray(error) {
	    var stack = error.stack.replace(/\s+$/g, "").split("\n");
	    for (var i = 0; i < stack.length; ++i) {
	        var line = stack[i];
	        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
	            break;
	        }
	    }
	    if (i > 0) {
	        stack = stack.slice(i);
	    }
	    return stack;
	}

	CapturedTrace.parseStackAndMessage = function(error) {
	    var stack = error.stack;
	    var message = error.toString();
	    stack = typeof stack === "string" && stack.length > 0
	                ? stackFramesAsArray(error) : ["    (No stack trace)"];
	    return {
	        message: message,
	        stack: cleanStack(stack)
	    };
	};

	CapturedTrace.formatAndLogError = function(error, title) {
	    if (typeof console !== "undefined") {
	        var message;
	        if (typeof error === "object" || typeof error === "function") {
	            var stack = error.stack;
	            message = title + formatStack(stack, error);
	        } else {
	            message = title + String(error);
	        }
	        if (typeof warn === "function") {
	            warn(message);
	        } else if (typeof console.log === "function" ||
	            typeof console.log === "object") {
	            console.log(message);
	        }
	    }
	};

	CapturedTrace.unhandledRejection = function (reason) {
	    CapturedTrace.formatAndLogError(reason, "^--- With additional stack trace: ");
	};

	CapturedTrace.isSupported = function () {
	    return typeof captureStackTrace === "function";
	};

	CapturedTrace.fireRejectionEvent =
	function(name, localHandler, reason, promise) {
	    var localEventFired = false;
	    try {
	        if (typeof localHandler === "function") {
	            localEventFired = true;
	            if (name === "rejectionHandled") {
	                localHandler(promise);
	            } else {
	                localHandler(reason, promise);
	            }
	        }
	    } catch (e) {
	        async.throwLater(e);
	    }

	    var globalEventFired = false;
	    try {
	        globalEventFired = fireGlobalEvent(name, reason, promise);
	    } catch (e) {
	        globalEventFired = true;
	        async.throwLater(e);
	    }

	    var domEventFired = false;
	    if (fireDomEvent) {
	        try {
	            domEventFired = fireDomEvent(name.toLowerCase(), {
	                reason: reason,
	                promise: promise
	            });
	        } catch (e) {
	            domEventFired = true;
	            async.throwLater(e);
	        }
	    }

	    if (!globalEventFired && !localEventFired && !domEventFired &&
	        name === "unhandledRejection") {
	        CapturedTrace.formatAndLogError(reason, "Unhandled rejection ");
	    }
	};

	function formatNonError(obj) {
	    var str;
	    if (typeof obj === "function") {
	        str = "[function " +
	            (obj.name || "anonymous") +
	            "]";
	    } else {
	        str = obj.toString();
	        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
	        if (ruselessToString.test(str)) {
	            try {
	                var newStr = JSON.stringify(obj);
	                str = newStr;
	            }
	            catch(e) {

	            }
	        }
	        if (str.length === 0) {
	            str = "(empty array)";
	        }
	    }
	    return ("(<" + snip(str) + ">, no stack trace)");
	}

	function snip(str) {
	    var maxChars = 41;
	    if (str.length < maxChars) {
	        return str;
	    }
	    return str.substr(0, maxChars - 3) + "...";
	}

	var shouldIgnore = function() { return false; };
	var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
	function parseLineInfo(line) {
	    var matches = line.match(parseLineInfoRegex);
	    if (matches) {
	        return {
	            fileName: matches[1],
	            line: parseInt(matches[2], 10)
	        };
	    }
	}
	CapturedTrace.setBounds = function(firstLineError, lastLineError) {
	    if (!CapturedTrace.isSupported()) return;
	    var firstStackLines = firstLineError.stack.split("\n");
	    var lastStackLines = lastLineError.stack.split("\n");
	    var firstIndex = -1;
	    var lastIndex = -1;
	    var firstFileName;
	    var lastFileName;
	    for (var i = 0; i < firstStackLines.length; ++i) {
	        var result = parseLineInfo(firstStackLines[i]);
	        if (result) {
	            firstFileName = result.fileName;
	            firstIndex = result.line;
	            break;
	        }
	    }
	    for (var i = 0; i < lastStackLines.length; ++i) {
	        var result = parseLineInfo(lastStackLines[i]);
	        if (result) {
	            lastFileName = result.fileName;
	            lastIndex = result.line;
	            break;
	        }
	    }
	    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
	        firstFileName !== lastFileName || firstIndex >= lastIndex) {
	        return;
	    }

	    shouldIgnore = function(line) {
	        if (bluebirdFramePattern.test(line)) return true;
	        var info = parseLineInfo(line);
	        if (info) {
	            if (info.fileName === firstFileName &&
	                (firstIndex <= info.line && info.line <= lastIndex)) {
	                return true;
	            }
	        }
	        return false;
	    };
	};

	var captureStackTrace = (function stackDetection() {
	    var v8stackFramePattern = /^\s*at\s*/;
	    var v8stackFormatter = function(stack, error) {
	        if (typeof stack === "string") return stack;

	        if (error.name !== undefined &&
	            error.message !== undefined) {
	            return error.toString();
	        }
	        return formatNonError(error);
	    };

	    if (typeof Error.stackTraceLimit === "number" &&
	        typeof Error.captureStackTrace === "function") {
	        Error.stackTraceLimit = Error.stackTraceLimit + 6;
	        stackFramePattern = v8stackFramePattern;
	        formatStack = v8stackFormatter;
	        var captureStackTrace = Error.captureStackTrace;

	        shouldIgnore = function(line) {
	            return bluebirdFramePattern.test(line);
	        };
	        return function(receiver, ignoreUntil) {
	            Error.stackTraceLimit = Error.stackTraceLimit + 6;
	            captureStackTrace(receiver, ignoreUntil);
	            Error.stackTraceLimit = Error.stackTraceLimit - 6;
	        };
	    }
	    var err = new Error();

	    if (typeof err.stack === "string" &&
	        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
	        stackFramePattern = /@/;
	        formatStack = v8stackFormatter;
	        indentStackFrames = true;
	        return function captureStackTrace(o) {
	            o.stack = new Error().stack;
	        };
	    }

	    var hasStackAfterThrow;
	    try { throw new Error(); }
	    catch(e) {
	        hasStackAfterThrow = ("stack" in e);
	    }
	    if (!("stack" in err) && hasStackAfterThrow) {
	        stackFramePattern = v8stackFramePattern;
	        formatStack = v8stackFormatter;
	        return function captureStackTrace(o) {
	            Error.stackTraceLimit = Error.stackTraceLimit + 6;
	            try { throw new Error(); }
	            catch(e) { o.stack = e.stack; }
	            Error.stackTraceLimit = Error.stackTraceLimit - 6;
	        };
	    }

	    formatStack = function(stack, error) {
	        if (typeof stack === "string") return stack;

	        if ((typeof error === "object" ||
	            typeof error === "function") &&
	            error.name !== undefined &&
	            error.message !== undefined) {
	            return error.toString();
	        }
	        return formatNonError(error);
	    };

	    return null;

	})([]);

	var fireDomEvent;
	var fireGlobalEvent = (function() {
	    if (util.isNode) {
	        return function(name, reason, promise) {
	            if (name === "rejectionHandled") {
	                return process.emit(name, promise);
	            } else {
	                return process.emit(name, reason, promise);
	            }
	        };
	    } else {
	        var customEventWorks = false;
	        var anyEventWorks = true;
	        try {
	            var ev = new self.CustomEvent("test");
	            customEventWorks = ev instanceof CustomEvent;
	        } catch (e) {}
	        if (!customEventWorks) {
	            try {
	                var event = document.createEvent("CustomEvent");
	                event.initCustomEvent("testingtheevent", false, true, {});
	                self.dispatchEvent(event);
	            } catch (e) {
	                anyEventWorks = false;
	            }
	        }
	        if (anyEventWorks) {
	            fireDomEvent = function(type, detail) {
	                var event;
	                if (customEventWorks) {
	                    event = new self.CustomEvent(type, {
	                        detail: detail,
	                        bubbles: false,
	                        cancelable: true
	                    });
	                } else if (self.dispatchEvent) {
	                    event = document.createEvent("CustomEvent");
	                    event.initCustomEvent(type, false, true, detail);
	                }

	                return event ? !self.dispatchEvent(event) : false;
	            };
	        }

	        var toWindowMethodNameMap = {};
	        toWindowMethodNameMap["unhandledRejection"] = ("on" +
	            "unhandledRejection").toLowerCase();
	        toWindowMethodNameMap["rejectionHandled"] = ("on" +
	            "rejectionHandled").toLowerCase();

	        return function(name, reason, promise) {
	            var methodName = toWindowMethodNameMap[name];
	            var method = self[methodName];
	            if (!method) return false;
	            if (name === "rejectionHandled") {
	                method.call(self, promise);
	            } else {
	                method.call(self, reason, promise);
	            }
	            return true;
	        };
	    }
	})();

	if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
	    warn = function (message) {
	        console.warn(message);
	    };
	    if (util.isNode && process.stderr.isTTY) {
	        warn = function(message) {
	            process.stderr.write("\u001b[31m" + message + "\u001b[39m\n");
	        };
	    } else if (!util.isNode && typeof (new Error().stack) === "string") {
	        warn = function(message) {
	            console.warn("%c" + message, "color: red");
	        };
	    }
	}

	return CapturedTrace;
	};

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 127 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {"use strict";
	module.exports = function(Promise, CapturedTrace) {
	var async = __webpack_require__(122);
	var Warning = __webpack_require__(123).Warning;
	var util = __webpack_require__(121);
	var canAttachTrace = util.canAttachTrace;
	var unhandledRejectionHandled;
	var possiblyUnhandledRejection;
	var debugging = false || (util.isNode &&
	                    (!!process.env["BLUEBIRD_DEBUG"] ||
	                     process.env["NODE_ENV"] === "development"));

	if (debugging) {
	    async.disableTrampolineIfNecessary();
	}

	Promise.prototype._ensurePossibleRejectionHandled = function () {
	    this._setRejectionIsUnhandled();
	    async.invokeLater(this._notifyUnhandledRejection, this, undefined);
	};

	Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
	    CapturedTrace.fireRejectionEvent("rejectionHandled",
	                                  unhandledRejectionHandled, undefined, this);
	};

	Promise.prototype._notifyUnhandledRejection = function () {
	    if (this._isRejectionUnhandled()) {
	        var reason = this._getCarriedStackTrace() || this._settledValue;
	        this._setUnhandledRejectionIsNotified();
	        CapturedTrace.fireRejectionEvent("unhandledRejection",
	                                      possiblyUnhandledRejection, reason, this);
	    }
	};

	Promise.prototype._setUnhandledRejectionIsNotified = function () {
	    this._bitField = this._bitField | 524288;
	};

	Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
	    this._bitField = this._bitField & (~524288);
	};

	Promise.prototype._isUnhandledRejectionNotified = function () {
	    return (this._bitField & 524288) > 0;
	};

	Promise.prototype._setRejectionIsUnhandled = function () {
	    this._bitField = this._bitField | 2097152;
	};

	Promise.prototype._unsetRejectionIsUnhandled = function () {
	    this._bitField = this._bitField & (~2097152);
	    if (this._isUnhandledRejectionNotified()) {
	        this._unsetUnhandledRejectionIsNotified();
	        this._notifyUnhandledRejectionIsHandled();
	    }
	};

	Promise.prototype._isRejectionUnhandled = function () {
	    return (this._bitField & 2097152) > 0;
	};

	Promise.prototype._setCarriedStackTrace = function (capturedTrace) {
	    this._bitField = this._bitField | 1048576;
	    this._fulfillmentHandler0 = capturedTrace;
	};

	Promise.prototype._isCarryingStackTrace = function () {
	    return (this._bitField & 1048576) > 0;
	};

	Promise.prototype._getCarriedStackTrace = function () {
	    return this._isCarryingStackTrace()
	        ? this._fulfillmentHandler0
	        : undefined;
	};

	Promise.prototype._captureStackTrace = function () {
	    if (debugging) {
	        this._trace = new CapturedTrace(this._peekContext());
	    }
	    return this;
	};

	Promise.prototype._attachExtraTrace = function (error, ignoreSelf) {
	    if (debugging && canAttachTrace(error)) {
	        var trace = this._trace;
	        if (trace !== undefined) {
	            if (ignoreSelf) trace = trace._parent;
	        }
	        if (trace !== undefined) {
	            trace.attachExtraTrace(error);
	        } else if (!error.__stackCleaned__) {
	            var parsed = CapturedTrace.parseStackAndMessage(error);
	            util.notEnumerableProp(error, "stack",
	                parsed.message + "\n" + parsed.stack.join("\n"));
	            util.notEnumerableProp(error, "__stackCleaned__", true);
	        }
	    }
	};

	Promise.prototype._warn = function(message) {
	    var warning = new Warning(message);
	    var ctx = this._peekContext();
	    if (ctx) {
	        ctx.attachExtraTrace(warning);
	    } else {
	        var parsed = CapturedTrace.parseStackAndMessage(warning);
	        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
	    }
	    CapturedTrace.formatAndLogError(warning, "");
	};

	Promise.onPossiblyUnhandledRejection = function (fn) {
	    possiblyUnhandledRejection = typeof fn === "function" ? fn : undefined;
	};

	Promise.onUnhandledRejectionHandled = function (fn) {
	    unhandledRejectionHandled = typeof fn === "function" ? fn : undefined;
	};

	Promise.longStackTraces = function () {
	    if (async.haveItemsQueued() &&
	        debugging === false
	   ) {
	        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/DT1qyG\u000a");
	    }
	    debugging = CapturedTrace.isSupported();
	    if (debugging) {
	        async.disableTrampolineIfNecessary();
	    }
	};

	Promise.hasLongStackTraces = function () {
	    return debugging && CapturedTrace.isSupported();
	};

	if (!CapturedTrace.isSupported()) {
	    Promise.longStackTraces = function(){};
	    debugging = false;
	}

	return function() {
	    return debugging;
	};
	};

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 128 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise, CapturedTrace, isDebugging) {
	var contextStack = [];
	function Context() {
	    this._trace = new CapturedTrace(peekContext());
	}
	Context.prototype._pushContext = function () {
	    if (!isDebugging()) return;
	    if (this._trace !== undefined) {
	        contextStack.push(this._trace);
	    }
	};

	Context.prototype._popContext = function () {
	    if (!isDebugging()) return;
	    if (this._trace !== undefined) {
	        contextStack.pop();
	    }
	};

	function createContext() {
	    if (isDebugging()) return new Context();
	}

	function peekContext() {
	    var lastIndex = contextStack.length - 1;
	    if (lastIndex >= 0) {
	        return contextStack[lastIndex];
	    }
	    return undefined;
	}

	Promise.prototype._peekContext = peekContext;
	Promise.prototype._pushContext = Context.prototype._pushContext;
	Promise.prototype._popContext = Context.prototype._popContext;

	return createContext;
	};


/***/ },
/* 129 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(NEXT_FILTER) {
	var util = __webpack_require__(121);
	var errors = __webpack_require__(123);
	var tryCatch = util.tryCatch;
	var errorObj = util.errorObj;
	var keys = __webpack_require__(182).keys;
	var TypeError = errors.TypeError;

	function CatchFilter(instances, callback, promise) {
	    this._instances = instances;
	    this._callback = callback;
	    this._promise = promise;
	}

	function safePredicate(predicate, e) {
	    var safeObject = {};
	    var retfilter = tryCatch(predicate).call(safeObject, e);

	    if (retfilter === errorObj) return retfilter;

	    var safeKeys = keys(safeObject);
	    if (safeKeys.length) {
	        errorObj.e = new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a");
	        return errorObj;
	    }
	    return retfilter;
	}

	CatchFilter.prototype.doFilter = function (e) {
	    var cb = this._callback;
	    var promise = this._promise;
	    var boundTo = promise._boundTo;
	    for (var i = 0, len = this._instances.length; i < len; ++i) {
	        var item = this._instances[i];
	        var itemIsErrorType = item === Error ||
	            (item != null && item.prototype instanceof Error);

	        if (itemIsErrorType && e instanceof item) {
	            var ret = tryCatch(cb).call(boundTo, e);
	            if (ret === errorObj) {
	                NEXT_FILTER.e = ret.e;
	                return NEXT_FILTER;
	            }
	            return ret;
	        } else if (typeof item === "function" && !itemIsErrorType) {
	            var shouldHandle = safePredicate(item, e);
	            if (shouldHandle === errorObj) {
	                e = errorObj.e;
	                break;
	            } else if (shouldHandle) {
	                var ret = tryCatch(cb).call(boundTo, e);
	                if (ret === errorObj) {
	                    NEXT_FILTER.e = ret.e;
	                    return NEXT_FILTER;
	                }
	                return ret;
	            }
	        }
	    }
	    NEXT_FILTER.e = e;
	    return NEXT_FILTER;
	};

	return CatchFilter;
	};


/***/ },
/* 130 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var util = __webpack_require__(121);
	var maybeWrapAsError = util.maybeWrapAsError;
	var errors = __webpack_require__(123);
	var TimeoutError = errors.TimeoutError;
	var OperationalError = errors.OperationalError;
	var haveGetters = util.haveGetters;
	var es5 = __webpack_require__(182);

	function isUntypedError(obj) {
	    return obj instanceof Error &&
	        es5.getPrototypeOf(obj) === Error.prototype;
	}

	var rErrorKey = /^(?:name|message|stack|cause)$/;
	function wrapAsOperationalError(obj) {
	    var ret;
	    if (isUntypedError(obj)) {
	        ret = new OperationalError(obj);
	        ret.name = obj.name;
	        ret.message = obj.message;
	        ret.stack = obj.stack;
	        var keys = es5.keys(obj);
	        for (var i = 0; i < keys.length; ++i) {
	            var key = keys[i];
	            if (!rErrorKey.test(key)) {
	                ret[key] = obj[key];
	            }
	        }
	        return ret;
	    }
	    util.markAsOriginatingFromRejection(obj);
	    return obj;
	}

	function nodebackForPromise(promise) {
	    return function(err, value) {
	        if (promise === null) return;

	        if (err) {
	            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
	            promise._attachExtraTrace(wrapped);
	            promise._reject(wrapped);
	        } else if (arguments.length > 2) {
	            var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
	            promise._fulfill(args);
	        } else {
	            promise._fulfill(value);
	        }

	        promise = null;
	    };
	}


	var PromiseResolver;
	if (!haveGetters) {
	    PromiseResolver = function (promise) {
	        this.promise = promise;
	        this.asCallback = nodebackForPromise(promise);
	        this.callback = this.asCallback;
	    };
	}
	else {
	    PromiseResolver = function (promise) {
	        this.promise = promise;
	    };
	}
	if (haveGetters) {
	    var prop = {
	        get: function() {
	            return nodebackForPromise(this.promise);
	        }
	    };
	    es5.defineProperty(PromiseResolver.prototype, "asCallback", prop);
	    es5.defineProperty(PromiseResolver.prototype, "callback", prop);
	}

	PromiseResolver._nodebackForPromise = nodebackForPromise;

	PromiseResolver.prototype.toString = function () {
	    return "[object PromiseResolver]";
	};

	PromiseResolver.prototype.resolve =
	PromiseResolver.prototype.fulfill = function (value) {
	    if (!(this instanceof PromiseResolver)) {
	        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
	    }
	    this.promise._resolveCallback(value);
	};

	PromiseResolver.prototype.reject = function (reason) {
	    if (!(this instanceof PromiseResolver)) {
	        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
	    }
	    this.promise._rejectCallback(reason);
	};

	PromiseResolver.prototype.progress = function (value) {
	    if (!(this instanceof PromiseResolver)) {
	        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
	    }
	    this.promise._progress(value);
	};

	PromiseResolver.prototype.cancel = function (err) {
	    this.promise.cancel(err);
	};

	PromiseResolver.prototype.timeout = function () {
	    this.reject(new TimeoutError("timeout"));
	};

	PromiseResolver.prototype.isResolved = function () {
	    return this.promise.isResolved();
	};

	PromiseResolver.prototype.toJSON = function () {
	    return this.promise.toJSON();
	};

	module.exports = PromiseResolver;


/***/ },
/* 131 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise, PromiseArray) {
	var util = __webpack_require__(121);
	var async = __webpack_require__(122);
	var tryCatch = util.tryCatch;
	var errorObj = util.errorObj;

	Promise.prototype.progressed = function (handler) {
	    return this._then(undefined, undefined, handler, undefined, undefined);
	};

	Promise.prototype._progress = function (progressValue) {
	    if (this._isFollowingOrFulfilledOrRejected()) return;
	    this._target()._progressUnchecked(progressValue);

	};

	Promise.prototype._progressHandlerAt = function (index) {
	    return index === 0
	        ? this._progressHandler0
	        : this[(index << 2) + index - 5 + 2];
	};

	Promise.prototype._doProgressWith = function (progression) {
	    var progressValue = progression.value;
	    var handler = progression.handler;
	    var promise = progression.promise;
	    var receiver = progression.receiver;

	    var ret = tryCatch(handler).call(receiver, progressValue);
	    if (ret === errorObj) {
	        if (ret.e != null &&
	            ret.e.name !== "StopProgressPropagation") {
	            var trace = util.canAttachTrace(ret.e)
	                ? ret.e : new Error(util.toString(ret.e));
	            promise._attachExtraTrace(trace);
	            promise._progress(ret.e);
	        }
	    } else if (ret instanceof Promise) {
	        ret._then(promise._progress, null, null, promise, undefined);
	    } else {
	        promise._progress(ret);
	    }
	};


	Promise.prototype._progressUnchecked = function (progressValue) {
	    var len = this._length();
	    var progress = this._progress;
	    for (var i = 0; i < len; i++) {
	        var handler = this._progressHandlerAt(i);
	        var promise = this._promiseAt(i);
	        if (!(promise instanceof Promise)) {
	            var receiver = this._receiverAt(i);
	            if (typeof handler === "function") {
	                handler.call(receiver, progressValue, promise);
	            } else if (receiver instanceof PromiseArray &&
	                       !receiver._isResolved()) {
	                receiver._promiseProgressed(progressValue, promise);
	            }
	            continue;
	        }

	        if (typeof handler === "function") {
	            async.invoke(this._doProgressWith, this, {
	                handler: handler,
	                promise: promise,
	                receiver: this._receiverAt(i),
	                value: progressValue
	            });
	        } else {
	            async.invoke(progress, promise, progressValue);
	        }
	    }
	};
	};


/***/ },
/* 132 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports =
	function(Promise, INTERNAL, tryConvertToPromise, apiRejection) {
	var util = __webpack_require__(121);
	var tryCatch = util.tryCatch;

	Promise.method = function (fn) {
	    if (typeof fn !== "function") {
	        throw new Promise.TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
	    }
	    return function () {
	        var ret = new Promise(INTERNAL);
	        ret._captureStackTrace();
	        ret._pushContext();
	        var value = tryCatch(fn).apply(this, arguments);
	        ret._popContext();
	        ret._resolveFromSyncValue(value);
	        return ret;
	    };
	};

	Promise.attempt = Promise["try"] = function (fn, args, ctx) {
	    if (typeof fn !== "function") {
	        return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
	    }
	    var ret = new Promise(INTERNAL);
	    ret._captureStackTrace();
	    ret._pushContext();
	    var value = util.isArray(args)
	        ? tryCatch(fn).apply(ctx, args)
	        : tryCatch(fn).call(ctx, args);
	    ret._popContext();
	    ret._resolveFromSyncValue(value);
	    return ret;
	};

	Promise.prototype._resolveFromSyncValue = function (value) {
	    if (value === util.errorObj) {
	        this._rejectCallback(value.e, false, true);
	    } else {
	        this._resolveCallback(value, true);
	    }
	};
	};


/***/ },
/* 133 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise, INTERNAL, tryConvertToPromise) {
	var rejectThis = function(_, e) {
	    this._reject(e);
	};

	var targetRejected = function(e, context) {
	    context.promiseRejectionQueued = true;
	    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
	};

	var bindingResolved = function(thisArg, context) {
	    this._setBoundTo(thisArg);
	    if (this._isPending()) {
	        this._resolveCallback(context.target);
	    }
	};

	var bindingRejected = function(e, context) {
	    if (!context.promiseRejectionQueued) this._reject(e);
	};

	Promise.prototype.bind = function (thisArg) {
	    var maybePromise = tryConvertToPromise(thisArg);
	    var ret = new Promise(INTERNAL);
	    ret._propagateFrom(this, 1);
	    var target = this._target();
	    if (maybePromise instanceof Promise) {
	        var context = {
	            promiseRejectionQueued: false,
	            promise: ret,
	            target: target,
	            bindingPromise: maybePromise
	        };
	        target._then(INTERNAL, targetRejected, ret._progress, ret, context);
	        maybePromise._then(
	            bindingResolved, bindingRejected, ret._progress, ret, context);
	    } else {
	        ret._setBoundTo(thisArg);
	        ret._resolveCallback(target);
	    }
	    return ret;
	};

	Promise.prototype._setBoundTo = function (obj) {
	    if (obj !== undefined) {
	        this._bitField = this._bitField | 131072;
	        this._boundTo = obj;
	    } else {
	        this._bitField = this._bitField & (~131072);
	    }
	};

	Promise.prototype._isBound = function () {
	    return (this._bitField & 131072) === 131072;
	};

	Promise.bind = function (thisArg, value) {
	    var maybePromise = tryConvertToPromise(thisArg);
	    var ret = new Promise(INTERNAL);

	    if (maybePromise instanceof Promise) {
	        maybePromise._then(function(thisArg) {
	            ret._setBoundTo(thisArg);
	            ret._resolveCallback(value);
	        }, ret._reject, ret._progress, ret, null);
	    } else {
	        ret._setBoundTo(thisArg);
	        ret._resolveCallback(value);
	    }
	    return ret;
	};
	};


/***/ },
/* 134 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise, NEXT_FILTER, tryConvertToPromise) {
	var util = __webpack_require__(121);
	var wrapsPrimitiveReceiver = util.wrapsPrimitiveReceiver;
	var isPrimitive = util.isPrimitive;
	var thrower = util.thrower;

	function returnThis() {
	    return this;
	}
	function throwThis() {
	    throw this;
	}
	function return$(r) {
	    return function() {
	        return r;
	    };
	}
	function throw$(r) {
	    return function() {
	        throw r;
	    };
	}
	function promisedFinally(ret, reasonOrValue, isFulfilled) {
	    var then;
	    if (wrapsPrimitiveReceiver && isPrimitive(reasonOrValue)) {
	        then = isFulfilled ? return$(reasonOrValue) : throw$(reasonOrValue);
	    } else {
	        then = isFulfilled ? returnThis : throwThis;
	    }
	    return ret._then(then, thrower, undefined, reasonOrValue, undefined);
	}

	function finallyHandler(reasonOrValue) {
	    var promise = this.promise;
	    var handler = this.handler;

	    var ret = promise._isBound()
	                    ? handler.call(promise._boundTo)
	                    : handler();

	    if (ret !== undefined) {
	        var maybePromise = tryConvertToPromise(ret, promise);
	        if (maybePromise instanceof Promise) {
	            maybePromise = maybePromise._target();
	            return promisedFinally(maybePromise, reasonOrValue,
	                                    promise.isFulfilled());
	        }
	    }

	    if (promise.isRejected()) {
	        NEXT_FILTER.e = reasonOrValue;
	        return NEXT_FILTER;
	    } else {
	        return reasonOrValue;
	    }
	}

	function tapHandler(value) {
	    var promise = this.promise;
	    var handler = this.handler;

	    var ret = promise._isBound()
	                    ? handler.call(promise._boundTo, value)
	                    : handler(value);

	    if (ret !== undefined) {
	        var maybePromise = tryConvertToPromise(ret, promise);
	        if (maybePromise instanceof Promise) {
	            maybePromise = maybePromise._target();
	            return promisedFinally(maybePromise, value, true);
	        }
	    }
	    return value;
	}

	Promise.prototype._passThroughHandler = function (handler, isFinally) {
	    if (typeof handler !== "function") return this.then();

	    var promiseAndHandler = {
	        promise: this,
	        handler: handler
	    };

	    return this._then(
	            isFinally ? finallyHandler : tapHandler,
	            isFinally ? finallyHandler : undefined, undefined,
	            promiseAndHandler, undefined);
	};

	Promise.prototype.lastly =
	Promise.prototype["finally"] = function (handler) {
	    return this._passThroughHandler(handler, true);
	};

	Promise.prototype.tap = function (handler) {
	    return this._passThroughHandler(handler, false);
	};
	};


/***/ },
/* 135 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var util = __webpack_require__(121);
	var isPrimitive = util.isPrimitive;
	var wrapsPrimitiveReceiver = util.wrapsPrimitiveReceiver;

	module.exports = function(Promise) {
	var returner = function () {
	    return this;
	};
	var thrower = function () {
	    throw this;
	};

	var wrapper = function (value, action) {
	    if (action === 1) {
	        return function () {
	            throw value;
	        };
	    } else if (action === 2) {
	        return function () {
	            return value;
	        };
	    }
	};


	Promise.prototype["return"] =
	Promise.prototype.thenReturn = function (value) {
	    if (wrapsPrimitiveReceiver && isPrimitive(value)) {
	        return this._then(
	            wrapper(value, 2),
	            undefined,
	            undefined,
	            undefined,
	            undefined
	       );
	    }
	    return this._then(returner, undefined, undefined, value, undefined);
	};

	Promise.prototype["throw"] =
	Promise.prototype.thenThrow = function (reason) {
	    if (wrapsPrimitiveReceiver && isPrimitive(reason)) {
	        return this._then(
	            wrapper(reason, 1),
	            undefined,
	            undefined,
	            undefined,
	            undefined
	       );
	    }
	    return this._then(thrower, undefined, undefined, reason, undefined);
	};
	};


/***/ },
/* 136 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise) {
	function PromiseInspection(promise) {
	    if (promise !== undefined) {
	        promise = promise._target();
	        this._bitField = promise._bitField;
	        this._settledValue = promise._settledValue;
	    }
	    else {
	        this._bitField = 0;
	        this._settledValue = undefined;
	    }
	}

	PromiseInspection.prototype.value = function () {
	    if (!this.isFulfilled()) {
	        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
	    }
	    return this._settledValue;
	};

	PromiseInspection.prototype.error =
	PromiseInspection.prototype.reason = function () {
	    if (!this.isRejected()) {
	        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
	    }
	    return this._settledValue;
	};

	PromiseInspection.prototype.isFulfilled =
	Promise.prototype._isFulfilled = function () {
	    return (this._bitField & 268435456) > 0;
	};

	PromiseInspection.prototype.isRejected =
	Promise.prototype._isRejected = function () {
	    return (this._bitField & 134217728) > 0;
	};

	PromiseInspection.prototype.isPending =
	Promise.prototype._isPending = function () {
	    return (this._bitField & 402653184) === 0;
	};

	PromiseInspection.prototype.isResolved =
	Promise.prototype._isResolved = function () {
	    return (this._bitField & 402653184) > 0;
	};

	Promise.prototype.isPending = function() {
	    return this._target()._isPending();
	};

	Promise.prototype.isRejected = function() {
	    return this._target()._isRejected();
	};

	Promise.prototype.isFulfilled = function() {
	    return this._target()._isFulfilled();
	};

	Promise.prototype.isResolved = function() {
	    return this._target()._isResolved();
	};

	Promise.prototype._value = function() {
	    return this._settledValue;
	};

	Promise.prototype._reason = function() {
	    this._unsetRejectionIsUnhandled();
	    return this._settledValue;
	};

	Promise.prototype.value = function() {
	    var target = this._target();
	    if (!target.isFulfilled()) {
	        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
	    }
	    return target._settledValue;
	};

	Promise.prototype.reason = function() {
	    var target = this._target();
	    if (!target.isRejected()) {
	        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
	    }
	    target._unsetRejectionIsUnhandled();
	    return target._settledValue;
	};


	Promise.PromiseInspection = PromiseInspection;
	};


/***/ },
/* 137 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports =
	function(Promise, PromiseArray, tryConvertToPromise, INTERNAL) {
	var util = __webpack_require__(121);
	var canEvaluate = util.canEvaluate;
	var tryCatch = util.tryCatch;
	var errorObj = util.errorObj;
	var reject;

	if (true) {
	if (canEvaluate) {
	    var thenCallback = function(i) {
	        return new Function("value", "holder", "                             \n\
	            'use strict';                                                    \n\
	            holder.pIndex = value;                                           \n\
	            holder.checkFulfillment(this);                                   \n\
	            ".replace(/Index/g, i));
	    };

	    var caller = function(count) {
	        var values = [];
	        for (var i = 1; i <= count; ++i) values.push("holder.p" + i);
	        return new Function("holder", "                                      \n\
	            'use strict';                                                    \n\
	            var callback = holder.fn;                                        \n\
	            return callback(values);                                         \n\
	            ".replace(/values/g, values.join(", ")));
	    };
	    var thenCallbacks = [];
	    var callers = [undefined];
	    for (var i = 1; i <= 5; ++i) {
	        thenCallbacks.push(thenCallback(i));
	        callers.push(caller(i));
	    }

	    var Holder = function(total, fn) {
	        this.p1 = this.p2 = this.p3 = this.p4 = this.p5 = null;
	        this.fn = fn;
	        this.total = total;
	        this.now = 0;
	    };

	    Holder.prototype.callers = callers;
	    Holder.prototype.checkFulfillment = function(promise) {
	        var now = this.now;
	        now++;
	        var total = this.total;
	        if (now >= total) {
	            var handler = this.callers[total];
	            promise._pushContext();
	            var ret = tryCatch(handler)(this);
	            promise._popContext();
	            if (ret === errorObj) {
	                promise._rejectCallback(ret.e, false, true);
	            } else {
	                promise._resolveCallback(ret);
	            }
	        } else {
	            this.now = now;
	        }
	    };

	    var reject = function (reason) {
	        this._reject(reason);
	    };
	}
	}

	Promise.join = function () {
	    var last = arguments.length - 1;
	    var fn;
	    if (last > 0 && typeof arguments[last] === "function") {
	        fn = arguments[last];
	        if (true) {
	            if (last < 6 && canEvaluate) {
	                var ret = new Promise(INTERNAL);
	                ret._captureStackTrace();
	                var holder = new Holder(last, fn);
	                var callbacks = thenCallbacks;
	                for (var i = 0; i < last; ++i) {
	                    var maybePromise = tryConvertToPromise(arguments[i], ret);
	                    if (maybePromise instanceof Promise) {
	                        maybePromise = maybePromise._target();
	                        if (maybePromise._isPending()) {
	                            maybePromise._then(callbacks[i], reject,
	                                               undefined, ret, holder);
	                        } else if (maybePromise._isFulfilled()) {
	                            callbacks[i].call(ret,
	                                              maybePromise._value(), holder);
	                        } else {
	                            ret._reject(maybePromise._reason());
	                        }
	                    } else {
	                        callbacks[i].call(ret, maybePromise, holder);
	                    }
	                }
	                return ret;
	            }
	        }
	    }
	    var $_len = arguments.length;var args = new Array($_len); for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];}
	    if (fn) args.pop();
	    var ret = new PromiseArray(args).promise();
	    return fn !== undefined ? ret.spread(fn) : ret;
	};

	};


/***/ },
/* 138 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise,
	                          PromiseArray,
	                          apiRejection,
	                          tryConvertToPromise,
	                          INTERNAL) {
	var async = __webpack_require__(122);
	var util = __webpack_require__(121);
	var tryCatch = util.tryCatch;
	var errorObj = util.errorObj;
	var PENDING = {};
	var EMPTY_ARRAY = [];

	function MappingPromiseArray(promises, fn, limit, _filter) {
	    this.constructor$(promises);
	    this._promise._captureStackTrace();
	    this._callback = fn;
	    this._preservedValues = _filter === INTERNAL
	        ? new Array(this.length())
	        : null;
	    this._limit = limit;
	    this._inFlight = 0;
	    this._queue = limit >= 1 ? [] : EMPTY_ARRAY;
	    async.invoke(init, this, undefined);
	}
	util.inherits(MappingPromiseArray, PromiseArray);
	function init() {this._init$(undefined, -2);}

	MappingPromiseArray.prototype._init = function () {};

	MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
	    var values = this._values;
	    var length = this.length();
	    var preservedValues = this._preservedValues;
	    var limit = this._limit;
	    if (values[index] === PENDING) {
	        values[index] = value;
	        if (limit >= 1) {
	            this._inFlight--;
	            this._drainQueue();
	            if (this._isResolved()) return;
	        }
	    } else {
	        if (limit >= 1 && this._inFlight >= limit) {
	            values[index] = value;
	            this._queue.push(index);
	            return;
	        }
	        if (preservedValues !== null) preservedValues[index] = value;

	        var callback = this._callback;
	        var receiver = this._promise._boundTo;
	        this._promise._pushContext();
	        var ret = tryCatch(callback).call(receiver, value, index, length);
	        this._promise._popContext();
	        if (ret === errorObj) return this._reject(ret.e);

	        var maybePromise = tryConvertToPromise(ret, this._promise);
	        if (maybePromise instanceof Promise) {
	            maybePromise = maybePromise._target();
	            if (maybePromise._isPending()) {
	                if (limit >= 1) this._inFlight++;
	                values[index] = PENDING;
	                return maybePromise._proxyPromiseArray(this, index);
	            } else if (maybePromise._isFulfilled()) {
	                ret = maybePromise._value();
	            } else {
	                return this._reject(maybePromise._reason());
	            }
	        }
	        values[index] = ret;
	    }
	    var totalResolved = ++this._totalResolved;
	    if (totalResolved >= length) {
	        if (preservedValues !== null) {
	            this._filter(values, preservedValues);
	        } else {
	            this._resolve(values);
	        }

	    }
	};

	MappingPromiseArray.prototype._drainQueue = function () {
	    var queue = this._queue;
	    var limit = this._limit;
	    var values = this._values;
	    while (queue.length > 0 && this._inFlight < limit) {
	        if (this._isResolved()) return;
	        var index = queue.pop();
	        this._promiseFulfilled(values[index], index);
	    }
	};

	MappingPromiseArray.prototype._filter = function (booleans, values) {
	    var len = values.length;
	    var ret = new Array(len);
	    var j = 0;
	    for (var i = 0; i < len; ++i) {
	        if (booleans[i]) ret[j++] = values[i];
	    }
	    ret.length = j;
	    this._resolve(ret);
	};

	MappingPromiseArray.prototype.preservedValues = function () {
	    return this._preservedValues;
	};

	function map(promises, fn, options, _filter) {
	    var limit = typeof options === "object" && options !== null
	        ? options.concurrency
	        : 0;
	    limit = typeof limit === "number" &&
	        isFinite(limit) && limit >= 1 ? limit : 0;
	    return new MappingPromiseArray(promises, fn, limit, _filter);
	}

	Promise.prototype.map = function (fn, options) {
	    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");

	    return map(this, fn, options, null).promise();
	};

	Promise.map = function (promises, fn, options, _filter) {
	    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
	    return map(promises, fn, options, _filter).promise();
	};


	};


/***/ },
/* 139 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise) {
	var errors = __webpack_require__(123);
	var async = __webpack_require__(122);
	var CancellationError = errors.CancellationError;

	Promise.prototype._cancel = function (reason) {
	    if (!this.isCancellable()) return this;
	    var parent;
	    var promiseToReject = this;
	    while ((parent = promiseToReject._cancellationParent) !== undefined &&
	        parent.isCancellable()) {
	        promiseToReject = parent;
	    }
	    this._unsetCancellable();
	    promiseToReject._target()._rejectCallback(reason, false, true);
	};

	Promise.prototype.cancel = function (reason) {
	    if (!this.isCancellable()) return this;
	    if (reason === undefined) reason = new CancellationError();
	    async.invokeLater(this._cancel, this, reason);
	    return this;
	};

	Promise.prototype.cancellable = function () {
	    if (this._cancellable()) return this;
	    async.enableTrampoline();
	    this._setCancellable();
	    this._cancellationParent = undefined;
	    return this;
	};

	Promise.prototype.uncancellable = function () {
	    var ret = this.then();
	    ret._unsetCancellable();
	    return ret;
	};

	Promise.prototype.fork = function (didFulfill, didReject, didProgress) {
	    var ret = this._then(didFulfill, didReject, didProgress,
	                         undefined, undefined);

	    ret._setCancellable();
	    ret._cancellationParent = undefined;
	    return ret;
	};
	};


/***/ },
/* 140 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function (Promise, apiRejection, tryConvertToPromise,
	    createContext) {
	    var TypeError = __webpack_require__(123).TypeError;
	    var inherits = __webpack_require__(121).inherits;
	    var PromiseInspection = Promise.PromiseInspection;

	    function inspectionMapper(inspections) {
	        var len = inspections.length;
	        for (var i = 0; i < len; ++i) {
	            var inspection = inspections[i];
	            if (inspection.isRejected()) {
	                return Promise.reject(inspection.error());
	            }
	            inspections[i] = inspection._settledValue;
	        }
	        return inspections;
	    }

	    function thrower(e) {
	        setTimeout(function(){throw e;}, 0);
	    }

	    function castPreservingDisposable(thenable) {
	        var maybePromise = tryConvertToPromise(thenable);
	        if (maybePromise !== thenable &&
	            typeof thenable._isDisposable === "function" &&
	            typeof thenable._getDisposer === "function" &&
	            thenable._isDisposable()) {
	            maybePromise._setDisposable(thenable._getDisposer());
	        }
	        return maybePromise;
	    }
	    function dispose(resources, inspection) {
	        var i = 0;
	        var len = resources.length;
	        var ret = Promise.defer();
	        function iterator() {
	            if (i >= len) return ret.resolve();
	            var maybePromise = castPreservingDisposable(resources[i++]);
	            if (maybePromise instanceof Promise &&
	                maybePromise._isDisposable()) {
	                try {
	                    maybePromise = tryConvertToPromise(
	                        maybePromise._getDisposer().tryDispose(inspection),
	                        resources.promise);
	                } catch (e) {
	                    return thrower(e);
	                }
	                if (maybePromise instanceof Promise) {
	                    return maybePromise._then(iterator, thrower,
	                                              null, null, null);
	                }
	            }
	            iterator();
	        }
	        iterator();
	        return ret.promise;
	    }

	    function disposerSuccess(value) {
	        var inspection = new PromiseInspection();
	        inspection._settledValue = value;
	        inspection._bitField = 268435456;
	        return dispose(this, inspection).thenReturn(value);
	    }

	    function disposerFail(reason) {
	        var inspection = new PromiseInspection();
	        inspection._settledValue = reason;
	        inspection._bitField = 134217728;
	        return dispose(this, inspection).thenThrow(reason);
	    }

	    function Disposer(data, promise, context) {
	        this._data = data;
	        this._promise = promise;
	        this._context = context;
	    }

	    Disposer.prototype.data = function () {
	        return this._data;
	    };

	    Disposer.prototype.promise = function () {
	        return this._promise;
	    };

	    Disposer.prototype.resource = function () {
	        if (this.promise().isFulfilled()) {
	            return this.promise().value();
	        }
	        return null;
	    };

	    Disposer.prototype.tryDispose = function(inspection) {
	        var resource = this.resource();
	        var context = this._context;
	        if (context !== undefined) context._pushContext();
	        var ret = resource !== null
	            ? this.doDispose(resource, inspection) : null;
	        if (context !== undefined) context._popContext();
	        this._promise._unsetDisposable();
	        this._data = null;
	        return ret;
	    };

	    Disposer.isDisposer = function (d) {
	        return (d != null &&
	                typeof d.resource === "function" &&
	                typeof d.tryDispose === "function");
	    };

	    function FunctionDisposer(fn, promise, context) {
	        this.constructor$(fn, promise, context);
	    }
	    inherits(FunctionDisposer, Disposer);

	    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
	        var fn = this.data();
	        return fn.call(resource, resource, inspection);
	    };

	    function maybeUnwrapDisposer(value) {
	        if (Disposer.isDisposer(value)) {
	            this.resources[this.index]._setDisposable(value);
	            return value.promise();
	        }
	        return value;
	    }

	    Promise.using = function () {
	        var len = arguments.length;
	        if (len < 2) return apiRejection(
	                        "you must pass at least 2 arguments to Promise.using");
	        var fn = arguments[len - 1];
	        if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
	        len--;
	        var resources = new Array(len);
	        for (var i = 0; i < len; ++i) {
	            var resource = arguments[i];
	            if (Disposer.isDisposer(resource)) {
	                var disposer = resource;
	                resource = resource.promise();
	                resource._setDisposable(disposer);
	            } else {
	                var maybePromise = tryConvertToPromise(resource);
	                if (maybePromise instanceof Promise) {
	                    resource =
	                        maybePromise._then(maybeUnwrapDisposer, null, null, {
	                            resources: resources,
	                            index: i
	                    }, undefined);
	                }
	            }
	            resources[i] = resource;
	        }

	        var promise = Promise.settle(resources)
	            .then(inspectionMapper)
	            .then(function(vals) {
	                promise._pushContext();
	                var ret;
	                try {
	                    ret = fn.apply(undefined, vals);
	                } finally {
	                    promise._popContext();
	                }
	                return ret;
	            })
	            ._then(
	                disposerSuccess, disposerFail, undefined, resources, undefined);
	        resources.promise = promise;
	        return promise;
	    };

	    Promise.prototype._setDisposable = function (disposer) {
	        this._bitField = this._bitField | 262144;
	        this._disposer = disposer;
	    };

	    Promise.prototype._isDisposable = function () {
	        return (this._bitField & 262144) > 0;
	    };

	    Promise.prototype._getDisposer = function () {
	        return this._disposer;
	    };

	    Promise.prototype._unsetDisposable = function () {
	        this._bitField = this._bitField & (~262144);
	        this._disposer = undefined;
	    };

	    Promise.prototype.disposer = function (fn) {
	        if (typeof fn === "function") {
	            return new FunctionDisposer(fn, this, createContext());
	        }
	        throw new TypeError();
	    };

	};


/***/ },
/* 141 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise,
	                          apiRejection,
	                          INTERNAL,
	                          tryConvertToPromise) {
	var errors = __webpack_require__(123);
	var TypeError = errors.TypeError;
	var util = __webpack_require__(121);
	var errorObj = util.errorObj;
	var tryCatch = util.tryCatch;
	var yieldHandlers = [];

	function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
	    for (var i = 0; i < yieldHandlers.length; ++i) {
	        traceParent._pushContext();
	        var result = tryCatch(yieldHandlers[i])(value);
	        traceParent._popContext();
	        if (result === errorObj) {
	            traceParent._pushContext();
	            var ret = Promise.reject(errorObj.e);
	            traceParent._popContext();
	            return ret;
	        }
	        var maybePromise = tryConvertToPromise(result, traceParent);
	        if (maybePromise instanceof Promise) return maybePromise;
	    }
	    return null;
	}

	function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
	    var promise = this._promise = new Promise(INTERNAL);
	    promise._captureStackTrace();
	    this._stack = stack;
	    this._generatorFunction = generatorFunction;
	    this._receiver = receiver;
	    this._generator = undefined;
	    this._yieldHandlers = typeof yieldHandler === "function"
	        ? [yieldHandler].concat(yieldHandlers)
	        : yieldHandlers;
	}

	PromiseSpawn.prototype.promise = function () {
	    return this._promise;
	};

	PromiseSpawn.prototype._run = function () {
	    this._generator = this._generatorFunction.call(this._receiver);
	    this._receiver =
	        this._generatorFunction = undefined;
	    this._next(undefined);
	};

	PromiseSpawn.prototype._continue = function (result) {
	    if (result === errorObj) {
	        return this._promise._rejectCallback(result.e, false, true);
	    }

	    var value = result.value;
	    if (result.done === true) {
	        this._promise._resolveCallback(value);
	    } else {
	        var maybePromise = tryConvertToPromise(value, this._promise);
	        if (!(maybePromise instanceof Promise)) {
	            maybePromise =
	                promiseFromYieldHandler(maybePromise,
	                                        this._yieldHandlers,
	                                        this._promise);
	            if (maybePromise === null) {
	                this._throw(
	                    new TypeError(
	                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/4Y4pDk\u000a\u000a".replace("%s", value) +
	                        "From coroutine:\u000a" +
	                        this._stack.split("\n").slice(1, -7).join("\n")
	                    )
	                );
	                return;
	            }
	        }
	        maybePromise._then(
	            this._next,
	            this._throw,
	            undefined,
	            this,
	            null
	       );
	    }
	};

	PromiseSpawn.prototype._throw = function (reason) {
	    this._promise._attachExtraTrace(reason);
	    this._promise._pushContext();
	    var result = tryCatch(this._generator["throw"])
	        .call(this._generator, reason);
	    this._promise._popContext();
	    this._continue(result);
	};

	PromiseSpawn.prototype._next = function (value) {
	    this._promise._pushContext();
	    var result = tryCatch(this._generator.next).call(this._generator, value);
	    this._promise._popContext();
	    this._continue(result);
	};

	Promise.coroutine = function (generatorFunction, options) {
	    if (typeof generatorFunction !== "function") {
	        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
	    }
	    var yieldHandler = Object(options).yieldHandler;
	    var PromiseSpawn$ = PromiseSpawn;
	    var stack = new Error().stack;
	    return function () {
	        var generator = generatorFunction.apply(this, arguments);
	        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
	                                      stack);
	        spawn._generator = generator;
	        spawn._next(undefined);
	        return spawn.promise();
	    };
	};

	Promise.coroutine.addYieldHandler = function(fn) {
	    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
	    yieldHandlers.push(fn);
	};

	Promise.spawn = function (generatorFunction) {
	    if (typeof generatorFunction !== "function") {
	        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
	    }
	    var spawn = new PromiseSpawn(generatorFunction, this);
	    var ret = spawn.promise();
	    spawn._run(Promise.spawn);
	    return ret;
	};
	};


/***/ },
/* 142 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise) {
	var util = __webpack_require__(121);
	var async = __webpack_require__(122);
	var tryCatch = util.tryCatch;
	var errorObj = util.errorObj;

	function spreadAdapter(val, nodeback) {
	    var promise = this;
	    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
	    var ret = tryCatch(nodeback).apply(promise._boundTo, [null].concat(val));
	    if (ret === errorObj) {
	        async.throwLater(ret.e);
	    }
	}

	function successAdapter(val, nodeback) {
	    var promise = this;
	    var receiver = promise._boundTo;
	    var ret = val === undefined
	        ? tryCatch(nodeback).call(receiver, null)
	        : tryCatch(nodeback).call(receiver, null, val);
	    if (ret === errorObj) {
	        async.throwLater(ret.e);
	    }
	}
	function errorAdapter(reason, nodeback) {
	    var promise = this;
	    if (!reason) {
	        var target = promise._target();
	        var newReason = target._getCarriedStackTrace();
	        newReason.cause = reason;
	        reason = newReason;
	    }
	    var ret = tryCatch(nodeback).call(promise._boundTo, reason);
	    if (ret === errorObj) {
	        async.throwLater(ret.e);
	    }
	}

	Promise.prototype.asCallback = 
	Promise.prototype.nodeify = function (nodeback, options) {
	    if (typeof nodeback == "function") {
	        var adapter = successAdapter;
	        if (options !== undefined && Object(options).spread) {
	            adapter = spreadAdapter;
	        }
	        this._then(
	            adapter,
	            errorAdapter,
	            undefined,
	            this,
	            nodeback
	        );
	    }
	    return this;
	};
	};


/***/ },
/* 143 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var cr = Object.create;
	if (cr) {
	    var callerCache = cr(null);
	    var getterCache = cr(null);
	    callerCache[" size"] = getterCache[" size"] = 0;
	}

	module.exports = function(Promise) {
	var util = __webpack_require__(121);
	var canEvaluate = util.canEvaluate;
	var isIdentifier = util.isIdentifier;

	var getMethodCaller;
	var getGetter;
	if (true) {
	var makeMethodCaller = function (methodName) {
	    return new Function("ensureMethod", "                                    \n\
	        return function(obj) {                                               \n\
	            'use strict'                                                     \n\
	            var len = this.length;                                           \n\
	            ensureMethod(obj, 'methodName');                                 \n\
	            switch(len) {                                                    \n\
	                case 1: return obj.methodName(this[0]);                      \n\
	                case 2: return obj.methodName(this[0], this[1]);             \n\
	                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
	                case 0: return obj.methodName();                             \n\
	                default:                                                     \n\
	                    return obj.methodName.apply(obj, this);                  \n\
	            }                                                                \n\
	        };                                                                   \n\
	        ".replace(/methodName/g, methodName))(ensureMethod);
	};

	var makeGetter = function (propertyName) {
	    return new Function("obj", "                                             \n\
	        'use strict';                                                        \n\
	        return obj.propertyName;                                             \n\
	        ".replace("propertyName", propertyName));
	};

	var getCompiled = function(name, compiler, cache) {
	    var ret = cache[name];
	    if (typeof ret !== "function") {
	        if (!isIdentifier(name)) {
	            return null;
	        }
	        ret = compiler(name);
	        cache[name] = ret;
	        cache[" size"]++;
	        if (cache[" size"] > 512) {
	            var keys = Object.keys(cache);
	            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
	            cache[" size"] = keys.length - 256;
	        }
	    }
	    return ret;
	};

	getMethodCaller = function(name) {
	    return getCompiled(name, makeMethodCaller, callerCache);
	};

	getGetter = function(name) {
	    return getCompiled(name, makeGetter, getterCache);
	};
	}

	function ensureMethod(obj, methodName) {
	    var fn;
	    if (obj != null) fn = obj[methodName];
	    if (typeof fn !== "function") {
	        var message = "Object " + util.classString(obj) + " has no method '" +
	            util.toString(methodName) + "'";
	        throw new Promise.TypeError(message);
	    }
	    return fn;
	}

	function caller(obj) {
	    var methodName = this.pop();
	    var fn = ensureMethod(obj, methodName);
	    return fn.apply(obj, this);
	}
	Promise.prototype.call = function (methodName) {
	    var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
	    if (true) {
	        if (canEvaluate) {
	            var maybeCaller = getMethodCaller(methodName);
	            if (maybeCaller !== null) {
	                return this._then(
	                    maybeCaller, undefined, undefined, args, undefined);
	            }
	        }
	    }
	    args.push(methodName);
	    return this._then(caller, undefined, undefined, args, undefined);
	};

	function namedGetter(obj) {
	    return obj[this];
	}
	function indexedGetter(obj) {
	    var index = +this;
	    if (index < 0) index = Math.max(0, index + obj.length);
	    return obj[index];
	}
	Promise.prototype.get = function (propertyName) {
	    var isIndex = (typeof propertyName === "number");
	    var getter;
	    if (!isIndex) {
	        if (canEvaluate) {
	            var maybeGetter = getGetter(propertyName);
	            getter = maybeGetter !== null ? maybeGetter : namedGetter;
	        } else {
	            getter = namedGetter;
	        }
	    } else {
	        getter = indexedGetter;
	    }
	    return this._then(getter, undefined, undefined, propertyName, undefined);
	};
	};


/***/ },
/* 144 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(
	    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
	var util = __webpack_require__(121);
	var isObject = util.isObject;
	var es5 = __webpack_require__(182);

	function PropertiesPromiseArray(obj) {
	    var keys = es5.keys(obj);
	    var len = keys.length;
	    var values = new Array(len * 2);
	    for (var i = 0; i < len; ++i) {
	        var key = keys[i];
	        values[i] = obj[key];
	        values[i + len] = key;
	    }
	    this.constructor$(values);
	}
	util.inherits(PropertiesPromiseArray, PromiseArray);

	PropertiesPromiseArray.prototype._init = function () {
	    this._init$(undefined, -3) ;
	};

	PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
	    this._values[index] = value;
	    var totalResolved = ++this._totalResolved;
	    if (totalResolved >= this._length) {
	        var val = {};
	        var keyOffset = this.length();
	        for (var i = 0, len = this.length(); i < len; ++i) {
	            val[this._values[i + keyOffset]] = this._values[i];
	        }
	        this._resolve(val);
	    }
	};

	PropertiesPromiseArray.prototype._promiseProgressed = function (value, index) {
	    this._promise._progress({
	        key: this._values[index + this.length()],
	        value: value
	    });
	};

	PropertiesPromiseArray.prototype.shouldCopyValues = function () {
	    return false;
	};

	PropertiesPromiseArray.prototype.getActualLength = function (len) {
	    return len >> 1;
	};

	function props(promises) {
	    var ret;
	    var castValue = tryConvertToPromise(promises);

	    if (!isObject(castValue)) {
	        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/OsFKC8\u000a");
	    } else if (castValue instanceof Promise) {
	        ret = castValue._then(
	            Promise.props, undefined, undefined, undefined, undefined);
	    } else {
	        ret = new PropertiesPromiseArray(castValue).promise();
	    }

	    if (castValue instanceof Promise) {
	        ret._propagateFrom(castValue, 4);
	    }
	    return ret;
	}

	Promise.prototype.props = function () {
	    return props(this);
	};

	Promise.props = function (promises) {
	    return props(promises);
	};
	};


/***/ },
/* 145 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(
	    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
	var isArray = __webpack_require__(121).isArray;

	var raceLater = function (promise) {
	    return promise.then(function(array) {
	        return race(array, promise);
	    });
	};

	function race(promises, parent) {
	    var maybePromise = tryConvertToPromise(promises);

	    if (maybePromise instanceof Promise) {
	        return raceLater(maybePromise);
	    } else if (!isArray(promises)) {
	        return apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
	    }

	    var ret = new Promise(INTERNAL);
	    if (parent !== undefined) {
	        ret._propagateFrom(parent, 4 | 1);
	    }
	    var fulfill = ret._fulfill;
	    var reject = ret._reject;
	    for (var i = 0, len = promises.length; i < len; ++i) {
	        var val = promises[i];

	        if (val === undefined && !(i in promises)) {
	            continue;
	        }

	        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
	    }
	    return ret;
	}

	Promise.race = function (promises) {
	    return race(promises, undefined);
	};

	Promise.prototype.race = function () {
	    return race(this, undefined);
	};

	};


/***/ },
/* 146 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise,
	                          PromiseArray,
	                          apiRejection,
	                          tryConvertToPromise,
	                          INTERNAL) {
	var async = __webpack_require__(122);
	var util = __webpack_require__(121);
	var tryCatch = util.tryCatch;
	var errorObj = util.errorObj;
	function ReductionPromiseArray(promises, fn, accum, _each) {
	    this.constructor$(promises);
	    this._promise._captureStackTrace();
	    this._preservedValues = _each === INTERNAL ? [] : null;
	    this._zerothIsAccum = (accum === undefined);
	    this._gotAccum = false;
	    this._reducingIndex = (this._zerothIsAccum ? 1 : 0);
	    this._valuesPhase = undefined;
	    var maybePromise = tryConvertToPromise(accum, this._promise);
	    var rejected = false;
	    var isPromise = maybePromise instanceof Promise;
	    if (isPromise) {
	        maybePromise = maybePromise._target();
	        if (maybePromise._isPending()) {
	            maybePromise._proxyPromiseArray(this, -1);
	        } else if (maybePromise._isFulfilled()) {
	            accum = maybePromise._value();
	            this._gotAccum = true;
	        } else {
	            this._reject(maybePromise._reason());
	            rejected = true;
	        }
	    }
	    if (!(isPromise || this._zerothIsAccum)) this._gotAccum = true;
	    this._callback = fn;
	    this._accum = accum;
	    if (!rejected) async.invoke(init, this, undefined);
	}
	function init() {
	    this._init$(undefined, -5);
	}
	util.inherits(ReductionPromiseArray, PromiseArray);

	ReductionPromiseArray.prototype._init = function () {};

	ReductionPromiseArray.prototype._resolveEmptyArray = function () {
	    if (this._gotAccum || this._zerothIsAccum) {
	        this._resolve(this._preservedValues !== null
	                        ? [] : this._accum);
	    }
	};

	ReductionPromiseArray.prototype._promiseFulfilled = function (value, index) {
	    var values = this._values;
	    values[index] = value;
	    var length = this.length();
	    var preservedValues = this._preservedValues;
	    var isEach = preservedValues !== null;
	    var gotAccum = this._gotAccum;
	    var valuesPhase = this._valuesPhase;
	    var valuesPhaseIndex;
	    if (!valuesPhase) {
	        valuesPhase = this._valuesPhase = new Array(length);
	        for (valuesPhaseIndex=0; valuesPhaseIndex<length; ++valuesPhaseIndex) {
	            valuesPhase[valuesPhaseIndex] = 0;
	        }
	    }
	    valuesPhaseIndex = valuesPhase[index];

	    if (index === 0 && this._zerothIsAccum) {
	        this._accum = value;
	        this._gotAccum = gotAccum = true;
	        valuesPhase[index] = ((valuesPhaseIndex === 0)
	            ? 1 : 2);
	    } else if (index === -1) {
	        this._accum = value;
	        this._gotAccum = gotAccum = true;
	    } else {
	        if (valuesPhaseIndex === 0) {
	            valuesPhase[index] = 1;
	        } else {
	            valuesPhase[index] = 2;
	            this._accum = value;
	        }
	    }
	    if (!gotAccum) return;

	    var callback = this._callback;
	    var receiver = this._promise._boundTo;
	    var ret;

	    for (var i = this._reducingIndex; i < length; ++i) {
	        valuesPhaseIndex = valuesPhase[i];
	        if (valuesPhaseIndex === 2) {
	            this._reducingIndex = i + 1;
	            continue;
	        }
	        if (valuesPhaseIndex !== 1) return;
	        value = values[i];
	        this._promise._pushContext();
	        if (isEach) {
	            preservedValues.push(value);
	            ret = tryCatch(callback).call(receiver, value, i, length);
	        }
	        else {
	            ret = tryCatch(callback)
	                .call(receiver, this._accum, value, i, length);
	        }
	        this._promise._popContext();

	        if (ret === errorObj) return this._reject(ret.e);

	        var maybePromise = tryConvertToPromise(ret, this._promise);
	        if (maybePromise instanceof Promise) {
	            maybePromise = maybePromise._target();
	            if (maybePromise._isPending()) {
	                valuesPhase[i] = 4;
	                return maybePromise._proxyPromiseArray(this, i);
	            } else if (maybePromise._isFulfilled()) {
	                ret = maybePromise._value();
	            } else {
	                return this._reject(maybePromise._reason());
	            }
	        }

	        this._reducingIndex = i + 1;
	        this._accum = ret;
	    }

	    this._resolve(isEach ? preservedValues : this._accum);
	};

	function reduce(promises, fn, initialValue, _each) {
	    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
	    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
	    return array.promise();
	}

	Promise.prototype.reduce = function (fn, initialValue) {
	    return reduce(this, fn, initialValue, null);
	};

	Promise.reduce = function (promises, fn, initialValue, _each) {
	    return reduce(promises, fn, initialValue, _each);
	};
	};


/***/ },
/* 147 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports =
	    function(Promise, PromiseArray) {
	var PromiseInspection = Promise.PromiseInspection;
	var util = __webpack_require__(121);

	function SettledPromiseArray(values) {
	    this.constructor$(values);
	}
	util.inherits(SettledPromiseArray, PromiseArray);

	SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
	    this._values[index] = inspection;
	    var totalResolved = ++this._totalResolved;
	    if (totalResolved >= this._length) {
	        this._resolve(this._values);
	    }
	};

	SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
	    var ret = new PromiseInspection();
	    ret._bitField = 268435456;
	    ret._settledValue = value;
	    this._promiseResolved(index, ret);
	};
	SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
	    var ret = new PromiseInspection();
	    ret._bitField = 134217728;
	    ret._settledValue = reason;
	    this._promiseResolved(index, ret);
	};

	Promise.settle = function (promises) {
	    return new SettledPromiseArray(promises).promise();
	};

	Promise.prototype.settle = function () {
	    return new SettledPromiseArray(this).promise();
	};
	};


/***/ },
/* 148 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports =
	function(Promise, PromiseArray, apiRejection) {
	var util = __webpack_require__(121);
	var RangeError = __webpack_require__(123).RangeError;
	var AggregateError = __webpack_require__(123).AggregateError;
	var isArray = util.isArray;


	function SomePromiseArray(values) {
	    this.constructor$(values);
	    this._howMany = 0;
	    this._unwrap = false;
	    this._initialized = false;
	}
	util.inherits(SomePromiseArray, PromiseArray);

	SomePromiseArray.prototype._init = function () {
	    if (!this._initialized) {
	        return;
	    }
	    if (this._howMany === 0) {
	        this._resolve([]);
	        return;
	    }
	    this._init$(undefined, -5);
	    var isArrayResolved = isArray(this._values);
	    if (!this._isResolved() &&
	        isArrayResolved &&
	        this._howMany > this._canPossiblyFulfill()) {
	        this._reject(this._getRangeError(this.length()));
	    }
	};

	SomePromiseArray.prototype.init = function () {
	    this._initialized = true;
	    this._init();
	};

	SomePromiseArray.prototype.setUnwrap = function () {
	    this._unwrap = true;
	};

	SomePromiseArray.prototype.howMany = function () {
	    return this._howMany;
	};

	SomePromiseArray.prototype.setHowMany = function (count) {
	    this._howMany = count;
	};

	SomePromiseArray.prototype._promiseFulfilled = function (value) {
	    this._addFulfilled(value);
	    if (this._fulfilled() === this.howMany()) {
	        this._values.length = this.howMany();
	        if (this.howMany() === 1 && this._unwrap) {
	            this._resolve(this._values[0]);
	        } else {
	            this._resolve(this._values);
	        }
	    }

	};
	SomePromiseArray.prototype._promiseRejected = function (reason) {
	    this._addRejected(reason);
	    if (this.howMany() > this._canPossiblyFulfill()) {
	        var e = new AggregateError();
	        for (var i = this.length(); i < this._values.length; ++i) {
	            e.push(this._values[i]);
	        }
	        this._reject(e);
	    }
	};

	SomePromiseArray.prototype._fulfilled = function () {
	    return this._totalResolved;
	};

	SomePromiseArray.prototype._rejected = function () {
	    return this._values.length - this.length();
	};

	SomePromiseArray.prototype._addRejected = function (reason) {
	    this._values.push(reason);
	};

	SomePromiseArray.prototype._addFulfilled = function (value) {
	    this._values[this._totalResolved++] = value;
	};

	SomePromiseArray.prototype._canPossiblyFulfill = function () {
	    return this.length() - this._rejected();
	};

	SomePromiseArray.prototype._getRangeError = function (count) {
	    var message = "Input array must contain at least " +
	            this._howMany + " items but contains only " + count + " items";
	    return new RangeError(message);
	};

	SomePromiseArray.prototype._resolveEmptyArray = function () {
	    this._reject(this._getRangeError(0));
	};

	function some(promises, howMany) {
	    if ((howMany | 0) !== howMany || howMany < 0) {
	        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/1wAmHx\u000a");
	    }
	    var ret = new SomePromiseArray(promises);
	    var promise = ret.promise();
	    ret.setHowMany(howMany);
	    ret.init();
	    return promise;
	}

	Promise.some = function (promises, howMany) {
	    return some(promises, howMany);
	};

	Promise.prototype.some = function (howMany) {
	    return some(this, howMany);
	};

	Promise._SomePromiseArray = SomePromiseArray;
	};


/***/ },
/* 149 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise, INTERNAL) {
	var THIS = {};
	var util = __webpack_require__(121);
	var nodebackForPromise = __webpack_require__(130)
	    ._nodebackForPromise;
	var withAppended = util.withAppended;
	var maybeWrapAsError = util.maybeWrapAsError;
	var canEvaluate = util.canEvaluate;
	var TypeError = __webpack_require__(123).TypeError;
	var defaultSuffix = "Async";
	var defaultPromisified = {__isPromisified__: true};
	var noCopyPropsPattern =
	    /^(?:length|name|arguments|caller|callee|prototype|__isPromisified__)$/;
	var defaultFilter = function(name, func) {
	    return util.isIdentifier(name) &&
	        name.charAt(0) !== "_" &&
	        !util.isClass(func);
	};

	function propsFilter(key) {
	    return !noCopyPropsPattern.test(key);
	}

	function isPromisified(fn) {
	    try {
	        return fn.__isPromisified__ === true;
	    }
	    catch (e) {
	        return false;
	    }
	}

	function hasPromisified(obj, key, suffix) {
	    var val = util.getDataPropertyOrDefault(obj, key + suffix,
	                                            defaultPromisified);
	    return val ? isPromisified(val) : false;
	}
	function checkValid(ret, suffix, suffixRegexp) {
	    for (var i = 0; i < ret.length; i += 2) {
	        var key = ret[i];
	        if (suffixRegexp.test(key)) {
	            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
	            for (var j = 0; j < ret.length; j += 2) {
	                if (ret[j] === keyWithoutAsyncSuffix) {
	                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/iWrZbw\u000a"
	                        .replace("%s", suffix));
	                }
	            }
	        }
	    }
	}

	function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
	    var keys = util.inheritedDataKeys(obj);
	    var ret = [];
	    for (var i = 0; i < keys.length; ++i) {
	        var key = keys[i];
	        var value = obj[key];
	        var passesDefaultFilter = filter === defaultFilter
	            ? true : defaultFilter(key, value, obj);
	        if (typeof value === "function" &&
	            !isPromisified(value) &&
	            !hasPromisified(obj, key, suffix) &&
	            filter(key, value, obj, passesDefaultFilter)) {
	            ret.push(key, value);
	        }
	    }
	    checkValid(ret, suffix, suffixRegexp);
	    return ret;
	}

	var escapeIdentRegex = function(str) {
	    return str.replace(/([$])/, "\\$");
	};

	var makeNodePromisifiedEval;
	if (true) {
	var switchCaseArgumentOrder = function(likelyArgumentCount) {
	    var ret = [likelyArgumentCount];
	    var min = Math.max(0, likelyArgumentCount - 1 - 3);
	    for(var i = likelyArgumentCount - 1; i >= min; --i) {
	        ret.push(i);
	    }
	    for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
	        ret.push(i);
	    }
	    return ret;
	};

	var argumentSequence = function(argumentCount) {
	    return util.filledRange(argumentCount, "_arg", "");
	};

	var parameterDeclaration = function(parameterCount) {
	    return util.filledRange(
	        Math.max(parameterCount, 3), "_arg", "");
	};

	var parameterCount = function(fn) {
	    if (typeof fn.length === "number") {
	        return Math.max(Math.min(fn.length, 1023 + 1), 0);
	    }
	    return 0;
	};

	makeNodePromisifiedEval =
	function(callback, receiver, originalName, fn) {
	    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
	    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
	    var shouldProxyThis = typeof callback === "string" || receiver === THIS;

	    function generateCallForArgumentCount(count) {
	        var args = argumentSequence(count).join(", ");
	        var comma = count > 0 ? ", " : "";
	        var ret;
	        if (shouldProxyThis) {
	            ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
	        } else {
	            ret = receiver === undefined
	                ? "ret = callback({{args}}, nodeback); break;\n"
	                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
	        }
	        return ret.replace("{{args}}", args).replace(", ", comma);
	    }

	    function generateArgumentSwitchCase() {
	        var ret = "";
	        for (var i = 0; i < argumentOrder.length; ++i) {
	            ret += "case " + argumentOrder[i] +":" +
	                generateCallForArgumentCount(argumentOrder[i]);
	        }

	        ret += "                                                             \n\
	        default:                                                             \n\
	            var args = new Array(len + 1);                                   \n\
	            var i = 0;                                                       \n\
	            for (var i = 0; i < len; ++i) {                                  \n\
	               args[i] = arguments[i];                                       \n\
	            }                                                                \n\
	            args[i] = nodeback;                                              \n\
	            [CodeForCall]                                                    \n\
	            break;                                                           \n\
	        ".replace("[CodeForCall]", (shouldProxyThis
	                                ? "ret = callback.apply(this, args);\n"
	                                : "ret = callback.apply(receiver, args);\n"));
	        return ret;
	    }

	    var getFunctionCode = typeof callback === "string"
	                                ? ("this != null ? this['"+callback+"'] : fn")
	                                : "fn";

	    return new Function("Promise",
	                        "fn",
	                        "receiver",
	                        "withAppended",
	                        "maybeWrapAsError",
	                        "nodebackForPromise",
	                        "tryCatch",
	                        "errorObj",
	                        "INTERNAL","'use strict';                            \n\
	        var ret = function (Parameters) {                                    \n\
	            'use strict';                                                    \n\
	            var len = arguments.length;                                      \n\
	            var promise = new Promise(INTERNAL);                             \n\
	            promise._captureStackTrace();                                    \n\
	            var nodeback = nodebackForPromise(promise);                      \n\
	            var ret;                                                         \n\
	            var callback = tryCatch([GetFunctionCode]);                      \n\
	            switch(len) {                                                    \n\
	                [CodeForSwitchCase]                                          \n\
	            }                                                                \n\
	            if (ret === errorObj) {                                          \n\
	                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
	            }                                                                \n\
	            return promise;                                                  \n\
	        };                                                                   \n\
	        ret.__isPromisified__ = true;                                        \n\
	        return ret;                                                          \n\
	        "
	        .replace("Parameters", parameterDeclaration(newParameterCount))
	        .replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
	        .replace("[GetFunctionCode]", getFunctionCode))(
	            Promise,
	            fn,
	            receiver,
	            withAppended,
	            maybeWrapAsError,
	            nodebackForPromise,
	            util.tryCatch,
	            util.errorObj,
	            INTERNAL
	        );
	};
	}

	function makeNodePromisifiedClosure(callback, receiver, _, fn) {
	    var defaultThis = (function() {return this;})();
	    var method = callback;
	    if (typeof method === "string") {
	        callback = fn;
	    }
	    function promisified() {
	        var _receiver = receiver;
	        if (receiver === THIS) _receiver = this;
	        var promise = new Promise(INTERNAL);
	        promise._captureStackTrace();
	        var cb = typeof method === "string" && this !== defaultThis
	            ? this[method] : callback;
	        var fn = nodebackForPromise(promise);
	        try {
	            cb.apply(_receiver, withAppended(arguments, fn));
	        } catch(e) {
	            promise._rejectCallback(maybeWrapAsError(e), true, true);
	        }
	        return promise;
	    }
	    promisified.__isPromisified__ = true;
	    return promisified;
	}

	var makeNodePromisified = canEvaluate
	    ? makeNodePromisifiedEval
	    : makeNodePromisifiedClosure;

	function promisifyAll(obj, suffix, filter, promisifier) {
	    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
	    var methods =
	        promisifiableMethods(obj, suffix, suffixRegexp, filter);

	    for (var i = 0, len = methods.length; i < len; i+= 2) {
	        var key = methods[i];
	        var fn = methods[i+1];
	        var promisifiedKey = key + suffix;
	        obj[promisifiedKey] = promisifier === makeNodePromisified
	                ? makeNodePromisified(key, THIS, key, fn, suffix)
	                : promisifier(fn, function() {
	                    return makeNodePromisified(key, THIS, key, fn, suffix);
	                });
	    }
	    util.toFastProperties(obj);
	    return obj;
	}

	function promisify(callback, receiver) {
	    return makeNodePromisified(callback, receiver, undefined, callback);
	}

	Promise.promisify = function (fn, receiver) {
	    if (typeof fn !== "function") {
	        throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
	    }
	    if (isPromisified(fn)) {
	        return fn;
	    }
	    var ret = promisify(fn, arguments.length < 2 ? THIS : receiver);
	    util.copyDescriptors(fn, ret, propsFilter);
	    return ret;
	};

	Promise.promisifyAll = function (target, options) {
	    if (typeof target !== "function" && typeof target !== "object") {
	        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/9ITlV0\u000a");
	    }
	    options = Object(options);
	    var suffix = options.suffix;
	    if (typeof suffix !== "string") suffix = defaultSuffix;
	    var filter = options.filter;
	    if (typeof filter !== "function") filter = defaultFilter;
	    var promisifier = options.promisifier;
	    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

	    if (!util.isIdentifier(suffix)) {
	        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/8FZo5V\u000a");
	    }

	    var keys = util.inheritedDataKeys(target);
	    for (var i = 0; i < keys.length; ++i) {
	        var value = target[keys[i]];
	        if (keys[i] !== "constructor" &&
	            util.isClass(value)) {
	            promisifyAll(value.prototype, suffix, filter, promisifier);
	            promisifyAll(value, suffix, filter, promisifier);
	        }
	    }

	    return promisifyAll(target, suffix, filter, promisifier);
	};
	};



/***/ },
/* 150 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise) {
	var SomePromiseArray = Promise._SomePromiseArray;
	function any(promises) {
	    var ret = new SomePromiseArray(promises);
	    var promise = ret.promise();
	    ret.setHowMany(1);
	    ret.setUnwrap();
	    ret.init();
	    return promise;
	}

	Promise.any = function (promises) {
	    return any(promises);
	};

	Promise.prototype.any = function () {
	    return any(this);
	};

	};


/***/ },
/* 151 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise, INTERNAL) {
	var PromiseReduce = Promise.reduce;

	Promise.prototype.each = function (fn) {
	    return PromiseReduce(this, fn, null, INTERNAL);
	};

	Promise.each = function (promises, fn) {
	    return PromiseReduce(promises, fn, null, INTERNAL);
	};
	};


/***/ },
/* 152 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise, INTERNAL) {
	var util = __webpack_require__(121);
	var TimeoutError = Promise.TimeoutError;

	var afterTimeout = function (promise, message) {
	    if (!promise.isPending()) return;
	    if (typeof message !== "string") {
	        message = "operation timed out";
	    }
	    var err = new TimeoutError(message);
	    util.markAsOriginatingFromRejection(err);
	    promise._attachExtraTrace(err);
	    promise._cancel(err);
	};

	var afterValue = function(value) { return delay(+this).thenReturn(value); };
	var delay = Promise.delay = function (value, ms) {
	    if (ms === undefined) {
	        ms = value;
	        value = undefined;
	        var ret = new Promise(INTERNAL);
	        setTimeout(function() { ret._fulfill(); }, ms);
	        return ret;
	    }
	    ms = +ms;
	    return Promise.resolve(value)._then(afterValue, null, null, ms, undefined);
	};

	Promise.prototype.delay = function (ms) {
	    return delay(this, ms);
	};

	function successClear(value) {
	    var handle = this;
	    if (handle instanceof Number) handle = +handle;
	    clearTimeout(handle);
	    return value;
	}

	function failureClear(reason) {
	    var handle = this;
	    if (handle instanceof Number) handle = +handle;
	    clearTimeout(handle);
	    throw reason;
	}

	Promise.prototype.timeout = function (ms, message) {
	    ms = +ms;
	    var ret = this.then().cancellable();
	    ret._cancellationParent = this;
	    var handle = setTimeout(function timeoutTimeout() {
	        afterTimeout(ret, message);
	    }, ms);
	    return ret._then(successClear, failureClear, undefined, handle, undefined);
	};

	};


/***/ },
/* 153 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	module.exports = function(Promise, INTERNAL) {
	var PromiseMap = Promise.map;

	Promise.prototype.filter = function (fn, options) {
	    return PromiseMap(this, fn, options, INTERNAL);
	};

	Promise.filter = function (promises, fn, options) {
	    return PromiseMap(promises, fn, options, INTERNAL);
	};
	};


/***/ },
/* 154 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsMatch = __webpack_require__(187),
	    isStrictComparable = __webpack_require__(184),
	    keys = __webpack_require__(97);

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * The base implementation of `_.matches` which does not clone `source`.
	 *
	 * @private
	 * @param {Object} source The object of property values to match.
	 * @returns {Function} Returns the new function.
	 */
	function baseMatches(source) {
	  var props = keys(source),
	      length = props.length;

	  if (length == 1) {
	    var key = props[0],
	        value = source[key];

	    if (isStrictComparable(value)) {
	      return function(object) {
	        return object != null && value === object[key] && hasOwnProperty.call(object, key);
	      };
	    }
	  }
	  var values = Array(length),
	      strictCompareFlags = Array(length);

	  while (length--) {
	    value = source[props[length]];
	    values[length] = value;
	    strictCompareFlags[length] = isStrictComparable(value);
	  }
	  return function(object) {
	    return baseIsMatch(object, props, values, strictCompareFlags);
	  };
	}

	module.exports = baseMatches;


/***/ },
/* 155 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsEqual = __webpack_require__(183),
	    isStrictComparable = __webpack_require__(184);

	/**
	 * The base implementation of `_.matchesProperty` which does not coerce `key`
	 * to a string.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @param {*} value The value to compare.
	 * @returns {Function} Returns the new function.
	 */
	function baseMatchesProperty(key, value) {
	  if (isStrictComparable(value)) {
	    return function(object) {
	      return object != null && object[key] === value;
	    };
	  }
	  return function(object) {
	    return object != null && baseIsEqual(value, object[key], null, true);
	  };
	}

	module.exports = baseMatchesProperty;


/***/ },
/* 156 */
/***/ function(module, exports, __webpack_require__) {

	var baseSetData = __webpack_require__(185),
	    isNative = __webpack_require__(158),
	    support = __webpack_require__(186);

	/** Used to detect named functions. */
	var reFuncName = /^\s*function[ \n\r\t]+\w/;

	/** Used to detect functions containing a `this` reference. */
	var reThis = /\bthis\b/;

	/** Used to resolve the decompiled source of functions. */
	var fnToString = Function.prototype.toString;

	/**
	 * Checks if `func` is eligible for `this` binding.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is eligible, else `false`.
	 */
	function isBindable(func) {
	  var result = !(support.funcNames ? func.name : support.funcDecomp);

	  if (!result) {
	    var source = fnToString.call(func);
	    if (!support.funcNames) {
	      result = !reFuncName.test(source);
	    }
	    if (!result) {
	      // Check if `func` references the `this` keyword and store the result.
	      result = reThis.test(source) || isNative(func);
	      baseSetData(func, result);
	    }
	  }
	  return result;
	}

	module.exports = isBindable;


/***/ },
/* 157 */
/***/ function(module, exports, __webpack_require__) {

	var toObject = __webpack_require__(176);

	/**
	 * The base implementation of `baseForIn` and `baseForOwn` which iterates
	 * over `object` properties returned by `keysFunc` invoking `iteratee` for
	 * each property. Iterator functions may exit iteration early by explicitly
	 * returning `false`.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @returns {Object} Returns `object`.
	 */
	function baseFor(object, iteratee, keysFunc) {
	  var index = -1,
	      iterable = toObject(object),
	      props = keysFunc(object),
	      length = props.length;

	  while (++index < length) {
	    var key = props[index];
	    if (iteratee(iterable[key], key, iterable) === false) {
	      break;
	    }
	  }
	  return object;
	}

	module.exports = baseFor;


/***/ },
/* 158 */
/***/ function(module, exports, __webpack_require__) {

	var escapeRegExp = __webpack_require__(188),
	    isObjectLike = __webpack_require__(160);

	/** `Object#toString` result references. */
	var funcTag = '[object Function]';

	/** Used to detect host constructors (Safari > 5). */
	var reHostCtor = /^\[object .+?Constructor\]$/;

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to resolve the decompiled source of functions. */
	var fnToString = Function.prototype.toString;

	/**
	 * Used to resolve the `toStringTag` of values.
	 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * for more details.
	 */
	var objToString = objectProto.toString;

	/** Used to detect if a method is native. */
	var reNative = RegExp('^' +
	  escapeRegExp(objToString)
	  .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
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
	  if (objToString.call(value) == funcTag) {
	    return reNative.test(fnToString.call(value));
	  }
	  return (isObjectLike(value) && reHostCtor.test(value)) || false;
	}

	module.exports = isNative;


/***/ },
/* 159 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Used as the maximum length of an array-like value.
	 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
	 * for more details.
	 */
	var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This function is based on ES `ToLength`. See the
	 * [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength)
	 * for more details.
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
/* 160 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Checks if `value` is object-like.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 */
	function isObjectLike(value) {
	  return (value && typeof value == 'object') || false;
	}

	module.exports = isObjectLike;


/***/ },
/* 161 */
/***/ function(module, exports, __webpack_require__) {

	var arrayEach = __webpack_require__(85),
	    baseForOwn = __webpack_require__(88),
	    baseMergeDeep = __webpack_require__(189),
	    isArray = __webpack_require__(89),
	    isLength = __webpack_require__(159),
	    isObjectLike = __webpack_require__(160),
	    isTypedArray = __webpack_require__(92);

	/**
	 * The base implementation of `_.merge` without support for argument juggling,
	 * multiple sources, and `this` binding `customizer` functions.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @param {Function} [customizer] The function to customize merging properties.
	 * @param {Array} [stackA=[]] Tracks traversed source objects.
	 * @param {Array} [stackB=[]] Associates values with source counterparts.
	 * @returns {Object} Returns the destination object.
	 */
	function baseMerge(object, source, customizer, stackA, stackB) {
	  var isSrcArr = isLength(source.length) && (isArray(source) || isTypedArray(source));

	  (isSrcArr ? arrayEach : baseForOwn)(source, function(srcValue, key, source) {
	    if (isObjectLike(srcValue)) {
	      stackA || (stackA = []);
	      stackB || (stackB = []);
	      return baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
	    }
	    var value = object[key],
	        result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
	        isCommon = typeof result == 'undefined';

	    if (isCommon) {
	      result = srcValue;
	    }
	    if ((isSrcArr || typeof result != 'undefined') &&
	        (isCommon || (result === result ? result !== value : value === value))) {
	      object[key] = result;
	    }
	  });
	  return object;
	}

	module.exports = baseMerge;


/***/ },
/* 162 */
/***/ function(module, exports, __webpack_require__) {

	var isArguments = __webpack_require__(173),
	    isArray = __webpack_require__(89),
	    isIndex = __webpack_require__(163),
	    isLength = __webpack_require__(159),
	    keysIn = __webpack_require__(190),
	    support = __webpack_require__(186);

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * A fallback implementation of `Object.keys` which creates an array of the
	 * own enumerable property names of `object`.
	 *
	 * @private
	 * @param {Object} object The object to inspect.
	 * @returns {Array} Returns the array of property names.
	 */
	function shimKeys(object) {
	  var props = keysIn(object),
	      propsLength = props.length,
	      length = propsLength && object.length;

	  var allowIndexes = length && isLength(length) &&
	    (isArray(object) || (support.nonEnumArgs && isArguments(object)));

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
/* 163 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Used as the maximum length of an array-like value.
	 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
	 * for more details.
	 */
	var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  value = +value;
	  length = length == null ? MAX_SAFE_INTEGER : length;
	  return value > -1 && value % 1 == 0 && value < length;
	}

	module.exports = isIndex;


/***/ },
/* 164 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var constant = __webpack_require__(191),
	    isNative = __webpack_require__(158);

	/** Native method references. */
	var ArrayBuffer = isNative(ArrayBuffer = global.ArrayBuffer) && ArrayBuffer,
	    bufferSlice = isNative(bufferSlice = ArrayBuffer && new ArrayBuffer(0).slice) && bufferSlice,
	    floor = Math.floor,
	    Uint8Array = isNative(Uint8Array = global.Uint8Array) && Uint8Array;

	/** Used to clone array buffers. */
	var Float64Array = (function() {
	  // Safari 5 errors when using an array buffer to initialize a typed array
	  // where the array buffer's `byteLength` is not a multiple of the typed
	  // array's `BYTES_PER_ELEMENT`.
	  try {
	    var func = isNative(func = global.Float64Array) && func,
	        result = new func(new ArrayBuffer(10), 0, 1) && func;
	  } catch(e) {}
	  return result;
	}());

	/** Used as the size, in bytes, of each `Float64Array` element. */
	var FLOAT64_BYTES_PER_ELEMENT = Float64Array ? Float64Array.BYTES_PER_ELEMENT : 0;

	/**
	 * Creates a clone of the given array buffer.
	 *
	 * @private
	 * @param {ArrayBuffer} buffer The array buffer to clone.
	 * @returns {ArrayBuffer} Returns the cloned array buffer.
	 */
	function bufferClone(buffer) {
	  return bufferSlice.call(buffer, 0);
	}
	if (!bufferSlice) {
	  // PhantomJS has `ArrayBuffer` and `Uint8Array` but not `Float64Array`.
	  bufferClone = !(ArrayBuffer && Uint8Array) ? constant(null) : function(buffer) {
	    var byteLength = buffer.byteLength,
	        floatLength = Float64Array ? floor(byteLength / FLOAT64_BYTES_PER_ELEMENT) : 0,
	        offset = floatLength * FLOAT64_BYTES_PER_ELEMENT,
	        result = new ArrayBuffer(byteLength);

	    if (floatLength) {
	      var view = new Float64Array(result, 0, floatLength);
	      view.set(new Float64Array(buffer, 0, floatLength));
	    }
	    if (byteLength != offset) {
	      view = new Uint8Array(result, offset);
	      view.set(new Uint8Array(buffer, offset));
	    }
	    return result;
	  };
	}

	module.exports = bufferClone;

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 165 */
/***/ function(module, exports, __webpack_require__) {

	/* (ignored) */

/***/ },
/* 166 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright (c) 2013 Petka Antonov
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:</p>
	 * 
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 * 
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */
	"use strict";
	function Deque(capacity) {
	    this._capacity = getCapacity(capacity);
	    this._length = 0;
	    this._front = 0;
	    if (isArray(capacity)) {
	        var len = capacity.length;
	        for (var i = 0; i < len; ++i) {
	            this[i] = capacity[i];
	        }
	        this._length = len;
	    }
	}

	Deque.prototype.toArray = function Deque$toArray() {
	    var len = this._length;
	    var ret = new Array(len);
	    var front = this._front;
	    var capacity = this._capacity;
	    for (var j = 0; j < len; ++j) {
	        ret[j] = this[(front + j) & (capacity - 1)];
	    }
	    return ret;
	};

	Deque.prototype.push = function Deque$push(item) {
	    var argsLength = arguments.length;
	    var length = this._length;
	    if (argsLength > 1) {
	        var capacity = this._capacity;
	        if (length + argsLength > capacity) {
	            for (var i = 0; i < argsLength; ++i) {
	                this._checkCapacity(length + 1);
	                var j = (this._front + length) & (this._capacity - 1);
	                this[j] = arguments[i];
	                length++;
	                this._length = length;
	            }
	            return length;
	        }
	        else {
	            var j = this._front;
	            for (var i = 0; i < argsLength; ++i) {
	                this[(j + length) & (capacity - 1)] = arguments[i];
	                j++;
	            }
	            this._length = length + argsLength;
	            return length + argsLength;
	        }

	    }

	    if (argsLength === 0) return length;

	    this._checkCapacity(length + 1);
	    var i = (this._front + length) & (this._capacity - 1);
	    this[i] = item;
	    this._length = length + 1;
	    return length + 1;
	};

	Deque.prototype.pop = function Deque$pop() {
	    var length = this._length;
	    if (length === 0) {
	        return void 0;
	    }
	    var i = (this._front + length - 1) & (this._capacity - 1);
	    var ret = this[i];
	    this[i] = void 0;
	    this._length = length - 1;
	    return ret;
	};

	Deque.prototype.shift = function Deque$shift() {
	    var length = this._length;
	    if (length === 0) {
	        return void 0;
	    }
	    var front = this._front;
	    var ret = this[front];
	    this[front] = void 0;
	    this._front = (front + 1) & (this._capacity - 1);
	    this._length = length - 1;
	    return ret;
	};

	Deque.prototype.unshift = function Deque$unshift(item) {
	    var length = this._length;
	    var argsLength = arguments.length;


	    if (argsLength > 1) {
	        var capacity = this._capacity;
	        if (length + argsLength > capacity) {
	            for (var i = argsLength - 1; i >= 0; i--) {
	                this._checkCapacity(length + 1);
	                var capacity = this._capacity;
	                var j = (((( this._front - 1 ) &
	                    ( capacity - 1) ) ^ capacity ) - capacity );
	                this[j] = arguments[i];
	                length++;
	                this._length = length;
	                this._front = j;
	            }
	            return length;
	        }
	        else {
	            var front = this._front;
	            for (var i = argsLength - 1; i >= 0; i--) {
	                var j = (((( front - 1 ) &
	                    ( capacity - 1) ) ^ capacity ) - capacity );
	                this[j] = arguments[i];
	                front = j;
	            }
	            this._front = front;
	            this._length = length + argsLength;
	            return length + argsLength;
	        }
	    }

	    if (argsLength === 0) return length;

	    this._checkCapacity(length + 1);
	    var capacity = this._capacity;
	    var i = (((( this._front - 1 ) &
	        ( capacity - 1) ) ^ capacity ) - capacity );
	    this[i] = item;
	    this._length = length + 1;
	    this._front = i;
	    return length + 1;
	};

	Deque.prototype.peekBack = function Deque$peekBack() {
	    var length = this._length;
	    if (length === 0) {
	        return void 0;
	    }
	    var index = (this._front + length - 1) & (this._capacity - 1);
	    return this[index];
	};

	Deque.prototype.peekFront = function Deque$peekFront() {
	    if (this._length === 0) {
	        return void 0;
	    }
	    return this[this._front];
	};

	Deque.prototype.get = function Deque$get(index) {
	    var i = index;
	    if ((i !== (i | 0))) {
	        return void 0;
	    }
	    var len = this._length;
	    if (i < 0) {
	        i = i + len;
	    }
	    if (i < 0 || i >= len) {
	        return void 0;
	    }
	    return this[(this._front + i) & (this._capacity - 1)];
	};

	Deque.prototype.isEmpty = function Deque$isEmpty() {
	    return this._length === 0;
	};

	Deque.prototype.clear = function Deque$clear() {
	    var len = this._length;
	    var front = this._front;
	    var capacity = this._capacity;
	    for (var j = 0; j < len; ++j) {
	        this[(front + j) & (capacity - 1)] = void 0;
	    }
	    this._length = 0;
	    this._front = 0;
	};

	Deque.prototype.toString = function Deque$toString() {
	    return this.toArray().toString();
	};

	Deque.prototype.valueOf = Deque.prototype.toString;
	Deque.prototype.removeFront = Deque.prototype.shift;
	Deque.prototype.removeBack = Deque.prototype.pop;
	Deque.prototype.insertFront = Deque.prototype.unshift;
	Deque.prototype.insertBack = Deque.prototype.push;
	Deque.prototype.enqueue = Deque.prototype.push;
	Deque.prototype.dequeue = Deque.prototype.shift;
	Deque.prototype.toJSON = Deque.prototype.toArray;

	Object.defineProperty(Deque.prototype, "length", {
	    get: function() {
	        return this._length;
	    },
	    set: function() {
	        throw new RangeError("");
	    }
	});

	Deque.prototype._checkCapacity = function Deque$_checkCapacity(size) {
	    if (this._capacity < size) {
	        this._resizeTo(getCapacity(this._capacity * 1.5 + 16));
	    }
	};

	Deque.prototype._resizeTo = function Deque$_resizeTo(capacity) {
	    var oldCapacity = this._capacity;
	    this._capacity = capacity;
	    var front = this._front;
	    var length = this._length;
	    if (front + length > oldCapacity) {
	        var moveItemsCount = (front + length) & (oldCapacity - 1);
	        arrayMove(this, 0, this, oldCapacity, moveItemsCount);
	    }
	};


	var isArray = Array.isArray;

	function arrayMove(src, srcIndex, dst, dstIndex, len) {
	    for (var j = 0; j < len; ++j) {
	        dst[j + dstIndex] = src[j + srcIndex];
	        src[j + srcIndex] = void 0;
	    }
	}

	function pow2AtLeast(n) {
	    n = n >>> 0;
	    n = n - 1;
	    n = n | (n >> 1);
	    n = n | (n >> 2);
	    n = n | (n >> 4);
	    n = n | (n >> 8);
	    n = n | (n >> 16);
	    return n + 1;
	}

	function getCapacity(capacity) {
	    if (typeof capacity !== "number") {
	        if (isArray(capacity)) {
	            capacity = capacity.length;
	        }
	        else {
	            return 16;
	        }
	    }
	    return pow2AtLeast(
	        Math.min(
	            Math.max(16, capacity), 1073741824)
	    );
	}

	module.exports = Deque;


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

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * HashMap - HashMap Class for JavaScript
	 * @author Ariel Flesler <aflesler@gmail.com>
	 * @version 2.0.3
	 * Homepage: https://github.com/flesler/hashmap
	 */

	(function(factory) {
		if (true) {
			// AMD. Register as an anonymous module.
			!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else if (typeof module === 'object') {
			// Node js environment
			var HashMap = module.exports = factory();
			// Keep it backwards compatible
			HashMap.HashMap = HashMap;
		} else {
			// Browser globals (this is window)
			this.HashMap = factory();
		}
	}(function() {

		function HashMap(other) {
			this.clear();
			switch (arguments.length) {
				case 0: break;
				case 1: this.copy(other); break;
				default: multi(this, arguments); break;
			}
		}

		var proto = HashMap.prototype = {
			constructor:HashMap,

			get:function(key) {
				var data = this._data[this.hash(key)];
				return data && data[1];
			},

			set:function(key, value) {
				// Store original key as well (for iteration)
				this._data[this.hash(key)] = [key, value];
			},

			multi:function() {
				multi(this, arguments);
			},

			copy:function(other) {
				for (var key in other._data) {
					this._data[key] = other._data[key];
				}
			},

			has:function(key) {
				return this.hash(key) in this._data;
			},

			search:function(value) {
				for (var key in this._data) {
					if (this._data[key][1] === value) {
						return this._data[key][0];
					}
				}

				return null;
			},

			remove:function(key) {
				delete this._data[this.hash(key)];
			},

			type:function(key) {
				var str = Object.prototype.toString.call(key);
				var type = str.slice(8, -1).toLowerCase();
				// Some browsers yield DOMWindow for null and undefined, works fine on Node
				if (type === 'domwindow' && !key) {
					return key + '';
				}
				return type;
			},

			keys:function() {
				var keys = [];
				this.forEach(function(value, key) { keys.push(key); });
				return keys;
			},

			values:function() {
				var values = [];
				this.forEach(function(value) { values.push(value); });
				return values;
			},

			count:function() {
				return this.keys().length;
			},

			clear:function() {
				// TODO: Would Object.create(null) make any difference
				this._data = {};
			},

			clone:function() {
				return new HashMap(this);
			},

			hash:function(key) {
				switch (this.type(key)) {
					case 'undefined':
					case 'null':
					case 'boolean':
					case 'number':
					case 'regexp':
						return key + '';

					case 'date':
						return '♣' + key.getTime();

					case 'string':
						return '♠' + key;

					case 'array':
						var hashes = [];
						for (var i = 0; i < key.length; i++) {
							hashes[i] = this.hash(key[i]);
						}
						return '♥' + hashes.join('⁞');

					default:
						// TODO: Don't use expandos when Object.defineProperty is not available?
						if (!key._hmuid_) {
							key._hmuid_ = ++HashMap.uid;
							hide(key, '_hmuid_');
						}

						return '♦' + key._hmuid_;
				}
			},

			forEach:function(func, ctx) {
				for (var key in this._data) {
					var data = this._data[key];
					func.call(ctx || this, data[1], data[0]);
				}
			}
		};

		HashMap.uid = 0;

		//- Automatically add chaining to some methods

		for (var method in proto) {
			// Skip constructor, valueOf, toString and any other built-in method
			if (method === 'constructor' || !proto.hasOwnProperty(method)) {
				continue;
			}
			var fn = proto[method];
			if (fn.toString().indexOf('return ') === -1) {
				proto[method] = chain(fn);
			}
		}

		//- Utils

		function multi(map, args) {
			for (var i = 0; i < args.length; i += 2) {
				map.set(args[i], args[i+1]);
			}
		}

		function chain(fn) {
			return function() {
				fn.apply(this, arguments);
				return this;
			};
		}

		function hide(obj, prop) {
			// Make non iterable if supported
			if (Object.defineProperty) {
				Object.defineProperty(obj, prop, {enumerable:false});
			}
		}

		return HashMap;
	}));


/***/ },
/* 169 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(116)


/***/ },
/* 170 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(117)


/***/ },
/* 171 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(118)


/***/ },
/* 172 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(119)


/***/ },
/* 173 */
/***/ function(module, exports, __webpack_require__) {

	var isLength = __webpack_require__(159),
	    isObjectLike = __webpack_require__(160);

	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]';

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/**
	 * Used to resolve the `toStringTag` of values.
	 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * for more details.
	 */
	var objToString = objectProto.toString;

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
	 * (function() { return _.isArguments(arguments); })();
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	function isArguments(value) {
	  var length = isObjectLike(value) ? value.length : undefined;
	  return (isLength(length) && objToString.call(value) == argsTag) || false;
	}

	module.exports = isArguments;


/***/ },
/* 174 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A specialized version of `_.map` for arrays without support for callback
	 * shorthands or `this` binding.
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
/* 175 */
/***/ function(module, exports, __webpack_require__) {

	var baseEach = __webpack_require__(198);

	/**
	 * The base implementation of `_.map` without support for callback shorthands
	 * or `this` binding.
	 *
	 * @private
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function baseMap(collection, iteratee) {
	  var result = [];
	  baseEach(collection, function(value, key, collection) {
	    result.push(iteratee(value, key, collection));
	  });
	  return result;
	}

	module.exports = baseMap;


/***/ },
/* 176 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(91);

	/**
	 * Converts `value` to an object if it is not one.
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
/* 177 */
/***/ function(module, exports, __webpack_require__) {

	var baseFor = __webpack_require__(157),
	    keysIn = __webpack_require__(190);

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
/* 178 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	module.exports = function () {
		return /(?:(?:\u001b\[)|\u009b)(?:(?:[0-9]{1,3})?(?:(?:;[0-9]{0,3})*)?[A-M|f-m])|\u001b[A-M]/g;
	};


/***/ },
/* 179 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	module.exports = function () {
		return /(?:(?:\u001b\[)|\u009b)(?:(?:[0-9]{1,3})?(?:(?:;[0-9]{0,3})*)?[A-M|f-m])|\u001b[A-M]/g;
	};


/***/ },
/* 180 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process, global, setImmediate) {"use strict";
	var schedule;
	var noAsyncScheduler = function() {
	    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
	};
	if (__webpack_require__(121).isNode) {
	    var version = process.versions.node.split(".").map(Number);
	    schedule = (version[0] === 0 && version[1] > 10) || (version[0] > 0)
	        ? global.setImmediate : process.nextTick;

	    if (!schedule) {
	        if (typeof setImmediate !== "undefined") {
	            schedule = setImmediate;
	        } else if (typeof setTimeout !== "undefined") {
	            schedule = setTimeout;
	        } else {
	            schedule = noAsyncScheduler;
	        }
	    }
	} else if (typeof MutationObserver !== "undefined") {
	    schedule = function(fn) {
	        var div = document.createElement("div");
	        var observer = new MutationObserver(fn);
	        observer.observe(div, {attributes: true});
	        return function() { div.classList.toggle("foo"); };
	    };
	    schedule.isStatic = true;
	} else if (typeof setImmediate !== "undefined") {
	    schedule = function (fn) {
	        setImmediate(fn);
	    };
	} else if (typeof setTimeout !== "undefined") {
	    schedule = function (fn) {
	        setTimeout(fn, 0);
	    };
	} else {
	    schedule = noAsyncScheduler;
	}
	module.exports = schedule;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30), (function() { return this; }()), __webpack_require__(204).setImmediate))

/***/ },
/* 181 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	function arrayMove(src, srcIndex, dst, dstIndex, len) {
	    for (var j = 0; j < len; ++j) {
	        dst[j + dstIndex] = src[j + srcIndex];
	        src[j + srcIndex] = void 0;
	    }
	}

	function Queue(capacity) {
	    this._capacity = capacity;
	    this._length = 0;
	    this._front = 0;
	}

	Queue.prototype._willBeOverCapacity = function (size) {
	    return this._capacity < size;
	};

	Queue.prototype._pushOne = function (arg) {
	    var length = this.length();
	    this._checkCapacity(length + 1);
	    var i = (this._front + length) & (this._capacity - 1);
	    this[i] = arg;
	    this._length = length + 1;
	};

	Queue.prototype._unshiftOne = function(value) {
	    var capacity = this._capacity;
	    this._checkCapacity(this.length() + 1);
	    var front = this._front;
	    var i = (((( front - 1 ) &
	                    ( capacity - 1) ) ^ capacity ) - capacity );
	    this[i] = value;
	    this._front = i;
	    this._length = this.length() + 1;
	};

	Queue.prototype.unshift = function(fn, receiver, arg) {
	    this._unshiftOne(arg);
	    this._unshiftOne(receiver);
	    this._unshiftOne(fn);
	};

	Queue.prototype.push = function (fn, receiver, arg) {
	    var length = this.length() + 3;
	    if (this._willBeOverCapacity(length)) {
	        this._pushOne(fn);
	        this._pushOne(receiver);
	        this._pushOne(arg);
	        return;
	    }
	    var j = this._front + length - 3;
	    this._checkCapacity(length);
	    var wrapMask = this._capacity - 1;
	    this[(j + 0) & wrapMask] = fn;
	    this[(j + 1) & wrapMask] = receiver;
	    this[(j + 2) & wrapMask] = arg;
	    this._length = length;
	};

	Queue.prototype.shift = function () {
	    var front = this._front,
	        ret = this[front];

	    this[front] = undefined;
	    this._front = (front + 1) & (this._capacity - 1);
	    this._length--;
	    return ret;
	};

	Queue.prototype.length = function () {
	    return this._length;
	};

	Queue.prototype._checkCapacity = function (size) {
	    if (this._capacity < size) {
	        this._resizeTo(this._capacity << 1);
	    }
	};

	Queue.prototype._resizeTo = function (capacity) {
	    var oldCapacity = this._capacity;
	    this._capacity = capacity;
	    var front = this._front;
	    var length = this._length;
	    var moveItemsCount = (front + length) & (oldCapacity - 1);
	    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
	};

	module.exports = Queue;


/***/ },
/* 182 */
/***/ function(module, exports, __webpack_require__) {

	var isES5 = (function(){
	    "use strict";
	    return this === undefined;
	})();

	if (isES5) {
	    module.exports = {
	        freeze: Object.freeze,
	        defineProperty: Object.defineProperty,
	        getDescriptor: Object.getOwnPropertyDescriptor,
	        keys: Object.keys,
	        names: Object.getOwnPropertyNames,
	        getPrototypeOf: Object.getPrototypeOf,
	        isArray: Array.isArray,
	        isES5: isES5,
	        propertyIsWritable: function(obj, prop) {
	            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
	            return !!(!descriptor || descriptor.writable || descriptor.set);
	        }
	    };
	} else {
	    var has = {}.hasOwnProperty;
	    var str = {}.toString;
	    var proto = {}.constructor.prototype;

	    var ObjectKeys = function (o) {
	        var ret = [];
	        for (var key in o) {
	            if (has.call(o, key)) {
	                ret.push(key);
	            }
	        }
	        return ret;
	    };

	    var ObjectGetDescriptor = function(o, key) {
	        return {value: o[key]};
	    };

	    var ObjectDefineProperty = function (o, key, desc) {
	        o[key] = desc.value;
	        return o;
	    };

	    var ObjectFreeze = function (obj) {
	        return obj;
	    };

	    var ObjectGetPrototypeOf = function (obj) {
	        try {
	            return Object(obj).constructor.prototype;
	        }
	        catch (e) {
	            return proto;
	        }
	    };

	    var ArrayIsArray = function (obj) {
	        try {
	            return str.call(obj) === "[object Array]";
	        }
	        catch(e) {
	            return false;
	        }
	    };

	    module.exports = {
	        isArray: ArrayIsArray,
	        keys: ObjectKeys,
	        names: ObjectKeys,
	        defineProperty: ObjectDefineProperty,
	        getDescriptor: ObjectGetDescriptor,
	        freeze: ObjectFreeze,
	        getPrototypeOf: ObjectGetPrototypeOf,
	        isES5: isES5,
	        propertyIsWritable: function() {
	            return true;
	        }
	    };
	}


/***/ },
/* 183 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsEqualDeep = __webpack_require__(200);

	/**
	 * The base implementation of `_.isEqual` without support for `this` binding
	 * `customizer` functions.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @param {Function} [customizer] The function to customize comparing values.
	 * @param {boolean} [isWhere] Specify performing partial comparisons.
	 * @param {Array} [stackA] Tracks traversed `value` objects.
	 * @param {Array} [stackB] Tracks traversed `other` objects.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 */
	function baseIsEqual(value, other, customizer, isWhere, stackA, stackB) {
	  // Exit early for identical values.
	  if (value === other) {
	    // Treat `+0` vs. `-0` as not equal.
	    return value !== 0 || (1 / value == 1 / other);
	  }
	  var valType = typeof value,
	      othType = typeof other;

	  // Exit early for unlike primitive values.
	  if ((valType != 'function' && valType != 'object' && othType != 'function' && othType != 'object') ||
	      value == null || other == null) {
	    // Return `false` unless both values are `NaN`.
	    return value !== value && other !== other;
	  }
	  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isWhere, stackA, stackB);
	}

	module.exports = baseIsEqual;


/***/ },
/* 184 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(91);

	/**
	 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` if suitable for strict
	 *  equality comparisons, else `false`.
	 */
	function isStrictComparable(value) {
	  return value === value && (value === 0 ? ((1 / value) > 0) : !isObject(value));
	}

	module.exports = isStrictComparable;


/***/ },
/* 185 */
/***/ function(module, exports, __webpack_require__) {

	var identity = __webpack_require__(103),
	    metaMap = __webpack_require__(201);

	/**
	 * The base implementation of `setData` without support for hot loop detection.
	 *
	 * @private
	 * @param {Function} func The function to associate metadata with.
	 * @param {*} data The metadata.
	 * @returns {Function} Returns `func`.
	 */
	var baseSetData = !metaMap ? identity : function(func, data) {
	  metaMap.set(func, data);
	  return func;
	};

	module.exports = baseSetData;


/***/ },
/* 186 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var isNative = __webpack_require__(158);

	/** Used to detect functions containing a `this` reference. */
	var reThis = /\bthis\b/;

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to detect DOM support. */
	var document = (document = global.window) && document.document;

	/** Native method references. */
	var propertyIsEnumerable = objectProto.propertyIsEnumerable;

	/**
	 * An object environment feature flags.
	 *
	 * @static
	 * @memberOf _
	 * @type Object
	 */
	var support = {};

	(function(x) {

	  /**
	   * Detect if functions can be decompiled by `Function#toString`
	   * (all but Firefox OS certified apps, older Opera mobile browsers, and
	   * the PlayStation 3; forced `false` for Windows 8 apps).
	   *
	   * @memberOf _.support
	   * @type boolean
	   */
	  support.funcDecomp = !isNative(global.WinRTError) && reThis.test(function() { return this; });

	  /**
	   * Detect if `Function#name` is supported (all but IE).
	   *
	   * @memberOf _.support
	   * @type boolean
	   */
	  support.funcNames = typeof Function.name == 'string';

	  /**
	   * Detect if the DOM is supported.
	   *
	   * @memberOf _.support
	   * @type boolean
	   */
	  try {
	    support.dom = document.createDocumentFragment().nodeType === 11;
	  } catch(e) {
	    support.dom = false;
	  }

	  /**
	   * Detect if `arguments` object indexes are non-enumerable.
	   *
	   * In Firefox < 4, IE < 9, PhantomJS, and Safari < 5.1 `arguments` object
	   * indexes are non-enumerable. Chrome < 25 and Node.js < 0.11.0 treat
	   * `arguments` object indexes as non-enumerable and fail `hasOwnProperty`
	   * checks for indexes that exceed their function's formal parameters with
	   * associated values of `0`.
	   *
	   * @memberOf _.support
	   * @type boolean
	   */
	  try {
	    support.nonEnumArgs = !propertyIsEnumerable.call(arguments, 1);
	  } catch(e) {
	    support.nonEnumArgs = true;
	  }
	}(0, 0));

	module.exports = support;

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 187 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsEqual = __webpack_require__(183);

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * The base implementation of `_.isMatch` without support for callback
	 * shorthands or `this` binding.
	 *
	 * @private
	 * @param {Object} object The object to inspect.
	 * @param {Array} props The source property names to match.
	 * @param {Array} values The source values to match.
	 * @param {Array} strictCompareFlags Strict comparison flags for source values.
	 * @param {Function} [customizer] The function to customize comparing objects.
	 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
	 */
	function baseIsMatch(object, props, values, strictCompareFlags, customizer) {
	  var length = props.length;
	  if (object == null) {
	    return !length;
	  }
	  var index = -1,
	      noCustomizer = !customizer;

	  while (++index < length) {
	    if ((noCustomizer && strictCompareFlags[index])
	          ? values[index] !== object[props[index]]
	          : !hasOwnProperty.call(object, props[index])
	        ) {
	      return false;
	    }
	  }
	  index = -1;
	  while (++index < length) {
	    var key = props[index];
	    if (noCustomizer && strictCompareFlags[index]) {
	      var result = hasOwnProperty.call(object, key);
	    } else {
	      var objValue = object[key],
	          srcValue = values[index];

	      result = customizer ? customizer(objValue, srcValue, key) : undefined;
	      if (typeof result == 'undefined') {
	        result = baseIsEqual(srcValue, objValue, customizer, true);
	      }
	    }
	    if (!result) {
	      return false;
	    }
	  }
	  return true;
	}

	module.exports = baseIsMatch;


/***/ },
/* 188 */
/***/ function(module, exports, __webpack_require__) {

	var baseToString = __webpack_require__(75);

	/**
	 * Used to match `RegExp` special characters.
	 * See this [article on `RegExp` characters](http://www.regular-expressions.info/characters.html#special)
	 * for more details.
	 */
	var reRegExpChars = /[.*+?^${}()|[\]\/\\]/g,
	    reHasRegExpChars = RegExp(reRegExpChars.source);

	/**
	 * Escapes the `RegExp` special characters "\", "^", "$", ".", "|", "?", "*",
	 * "+", "(", ")", "[", "]", "{" and "}" in `string`.
	 *
	 * @static
	 * @memberOf _
	 * @category String
	 * @param {string} [string=''] The string to escape.
	 * @returns {string} Returns the escaped string.
	 * @example
	 *
	 * _.escapeRegExp('[lodash](https://lodash.com/)');
	 * // => '\[lodash\]\(https://lodash\.com/\)'
	 */
	function escapeRegExp(string) {
	  string = baseToString(string);
	  return (string && reHasRegExpChars.test(string))
	    ? string.replace(reRegExpChars, '\\$&')
	    : string;
	}

	module.exports = escapeRegExp;


/***/ },
/* 189 */
/***/ function(module, exports, __webpack_require__) {

	var arrayCopy = __webpack_require__(104),
	    isArguments = __webpack_require__(173),
	    isArray = __webpack_require__(89),
	    isLength = __webpack_require__(159),
	    isPlainObject = __webpack_require__(202),
	    isTypedArray = __webpack_require__(92),
	    toPlainObject = __webpack_require__(203);

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
	 * @param {Function} [customizer] The function to customize merging properties.
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
	      isCommon = typeof result == 'undefined';

	  if (isCommon) {
	    result = srcValue;
	    if (isLength(srcValue.length) && (isArray(srcValue) || isTypedArray(srcValue))) {
	      result = isArray(value)
	        ? value
	        : (value ? arrayCopy(value) : []);
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
	  } else if (result === result ? result !== value : value === value) {
	    object[key] = result;
	  }
	}

	module.exports = baseMergeDeep;


/***/ },
/* 190 */
/***/ function(module, exports, __webpack_require__) {

	var isArguments = __webpack_require__(173),
	    isArray = __webpack_require__(89),
	    isIndex = __webpack_require__(163),
	    isLength = __webpack_require__(159),
	    isObject = __webpack_require__(91),
	    support = __webpack_require__(186);

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
	 * @param {Object} object The object to inspect.
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
	    (isArray(object) || (support.nonEnumArgs && isArguments(object))) && length) || 0;

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
/* 191 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Creates a function that returns `value`.
	 *
	 * @static
	 * @memberOf _
	 * @category Utility
	 * @param {*} value The value to return from the new function.
	 * @returns {Function} Returns the new function.
	 * @example
	 *
	 * var object = { 'user': 'fred' };
	 * var getter = _.constant(object);
	 * getter() === object;
	 * // => true
	 */
	function constant(value) {
	  return function() {
	    return value;
	  };
	}

	module.exports = constant;


/***/ },
/* 192 */
/***/ function(module, exports, __webpack_require__) {

	exports.read = function(buffer, offset, isLE, mLen, nBytes) {
	  var e, m,
	      eLen = nBytes * 8 - mLen - 1,
	      eMax = (1 << eLen) - 1,
	      eBias = eMax >> 1,
	      nBits = -7,
	      i = isLE ? (nBytes - 1) : 0,
	      d = isLE ? -1 : 1,
	      s = buffer[offset + i];

	  i += d;

	  e = s & ((1 << (-nBits)) - 1);
	  s >>= (-nBits);
	  nBits += eLen;
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

	  m = e & ((1 << (-nBits)) - 1);
	  e >>= (-nBits);
	  nBits += mLen;
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

	  if (e === 0) {
	    e = 1 - eBias;
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity);
	  } else {
	    m = m + Math.pow(2, mLen);
	    e = e - eBias;
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
	};

	exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c,
	      eLen = nBytes * 8 - mLen - 1,
	      eMax = (1 << eLen) - 1,
	      eBias = eMax >> 1,
	      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
	      i = isLE ? 0 : (nBytes - 1),
	      d = isLE ? 1 : -1,
	      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

	  value = Math.abs(value);

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0;
	    e = eMax;
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2);
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--;
	      c *= 2;
	    }
	    if (e + eBias >= 1) {
	      value += rt / c;
	    } else {
	      value += rt * Math.pow(2, 1 - eBias);
	    }
	    if (value * c >= 2) {
	      e++;
	      c /= 2;
	    }

	    if (e + eBias >= eMax) {
	      m = 0;
	      e = eMax;
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen);
	      e = e + eBias;
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
	      e = 0;
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

	  e = (e << mLen) | m;
	  eLen += mLen;
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

	  buffer[offset + i - d] |= s * 128;
	};


/***/ },
/* 193 */
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
/* 194 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};


/***/ },
/* 195 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ },
/* 196 */
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

	var Buffer = __webpack_require__(109).Buffer;

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
/* 197 */
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
/* 198 */
/***/ function(module, exports, __webpack_require__) {

	var baseForOwn = __webpack_require__(88),
	    isLength = __webpack_require__(159),
	    toObject = __webpack_require__(176);

	/**
	 * The base implementation of `_.forEach` without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array|Object|string} Returns `collection`.
	 */
	function baseEach(collection, iteratee) {
	  var length = collection ? collection.length : 0;
	  if (!isLength(length)) {
	    return baseForOwn(collection, iteratee);
	  }
	  var index = -1,
	      iterable = toObject(collection);

	  while (++index < length) {
	    if (iteratee(iterable[index], index, iterable) === false) {
	      break;
	    }
	  }
	  return collection;
	}

	module.exports = baseEach;


/***/ },
/* 199 */
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
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(109).Buffer))

/***/ },
/* 200 */
/***/ function(module, exports, __webpack_require__) {

	var equalArrays = __webpack_require__(205),
	    equalByTag = __webpack_require__(206),
	    equalObjects = __webpack_require__(207),
	    isArray = __webpack_require__(89),
	    isTypedArray = __webpack_require__(92);

	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    objectTag = '[object Object]';

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Used to resolve the `toStringTag` of values.
	 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * for more details.
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
	 * @param {boolean} [isWhere] Specify performing partial comparisons.
	 * @param {Array} [stackA=[]] Tracks traversed `value` objects.
	 * @param {Array} [stackB=[]] Tracks traversed `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function baseIsEqualDeep(object, other, equalFunc, customizer, isWhere, stackA, stackB) {
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
	  var valWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
	      othWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

	  if (valWrapped || othWrapped) {
	    return equalFunc(valWrapped ? object.value() : object, othWrapped ? other.value() : other, customizer, isWhere, stackA, stackB);
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

	  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isWhere, stackA, stackB);

	  stackA.pop();
	  stackB.pop();

	  return result;
	}

	module.exports = baseIsEqualDeep;


/***/ },
/* 201 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var isNative = __webpack_require__(158);

	/** Native method references. */
	var WeakMap = isNative(WeakMap = global.WeakMap) && WeakMap;

	/** Used to store function metadata. */
	var metaMap = WeakMap && new WeakMap;

	module.exports = metaMap;

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 202 */
/***/ function(module, exports, __webpack_require__) {

	var isNative = __webpack_require__(158),
	    shimIsPlainObject = __webpack_require__(208);

	/** `Object#toString` result references. */
	var objectTag = '[object Object]';

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/**
	 * Used to resolve the `toStringTag` of values.
	 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * for more details.
	 */
	var objToString = objectProto.toString;

	/** Native method references. */
	var getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf;

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
	var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
	  if (!(value && objToString.call(value) == objectTag)) {
	    return false;
	  }
	  var valueOf = value.valueOf,
	      objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

	  return objProto
	    ? (value == objProto || getPrototypeOf(value) == objProto)
	    : shimIsPlainObject(value);
	};

	module.exports = isPlainObject;


/***/ },
/* 203 */
/***/ function(module, exports, __webpack_require__) {

	var baseCopy = __webpack_require__(95),
	    keysIn = __webpack_require__(190);

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
/* 204 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(30).nextTick;
	var apply = Function.prototype.apply;
	var slice = Array.prototype.slice;
	var immediateIds = {};
	var nextImmediateId = 0;

	// DOM APIs, for completeness

	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) { timeout.close(); };

	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};

	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};

	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};

	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);

	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};

	// That's not how node.js implements it but the exposed api is the same.
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
	  var id = nextImmediateId++;
	  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

	  immediateIds[id] = true;

	  nextTick(function onNextTick() {
	    if (immediateIds[id]) {
	      // fn.call() is faster so we optimize for the common use-case
	      // @see http://jsperf.com/call-apply-segu
	      if (args) {
	        fn.apply(null, args);
	      } else {
	        fn.call(null);
	      }
	      // Prevent ids from leaking
	      exports.clearImmediate(id);
	    }
	  });

	  return id;
	};

	exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
	  delete immediateIds[id];
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(204).setImmediate, __webpack_require__(204).clearImmediate))

/***/ },
/* 205 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A specialized version of `baseIsEqualDeep` for arrays with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Array} array The array to compare.
	 * @param {Array} other The other array to compare.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Function} [customizer] The function to customize comparing arrays.
	 * @param {boolean} [isWhere] Specify performing partial comparisons.
	 * @param {Array} [stackA] Tracks traversed `value` objects.
	 * @param {Array} [stackB] Tracks traversed `other` objects.
	 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
	 */
	function equalArrays(array, other, equalFunc, customizer, isWhere, stackA, stackB) {
	  var index = -1,
	      arrLength = array.length,
	      othLength = other.length,
	      result = true;

	  if (arrLength != othLength && !(isWhere && othLength > arrLength)) {
	    return false;
	  }
	  // Deep compare the contents, ignoring non-numeric properties.
	  while (result && ++index < arrLength) {
	    var arrValue = array[index],
	        othValue = other[index];

	    result = undefined;
	    if (customizer) {
	      result = isWhere
	        ? customizer(othValue, arrValue, index)
	        : customizer(arrValue, othValue, index);
	    }
	    if (typeof result == 'undefined') {
	      // Recursively compare arrays (susceptible to call stack limits).
	      if (isWhere) {
	        var othIndex = othLength;
	        while (othIndex--) {
	          othValue = other[othIndex];
	          result = (arrValue && arrValue === othValue) || equalFunc(arrValue, othValue, customizer, isWhere, stackA, stackB);
	          if (result) {
	            break;
	          }
	        }
	      } else {
	        result = (arrValue && arrValue === othValue) || equalFunc(arrValue, othValue, customizer, isWhere, stackA, stackB);
	      }
	    }
	  }
	  return !!result;
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
	 * @param {Object} value The object to compare.
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
	        // But, treat `-0` vs. `+0` as not equal.
	        : (object == 0 ? ((1 / object) == (1 / other)) : object == +other);

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

	var keys = __webpack_require__(97);

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
	 * @param {boolean} [isWhere] Specify performing partial comparisons.
	 * @param {Array} [stackA] Tracks traversed `value` objects.
	 * @param {Array} [stackB] Tracks traversed `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalObjects(object, other, equalFunc, customizer, isWhere, stackA, stackB) {
	  var objProps = keys(object),
	      objLength = objProps.length,
	      othProps = keys(other),
	      othLength = othProps.length;

	  if (objLength != othLength && !isWhere) {
	    return false;
	  }
	  var hasCtor,
	      index = -1;

	  while (++index < objLength) {
	    var key = objProps[index],
	        result = hasOwnProperty.call(other, key);

	    if (result) {
	      var objValue = object[key],
	          othValue = other[key];

	      result = undefined;
	      if (customizer) {
	        result = isWhere
	          ? customizer(othValue, objValue, key)
	          : customizer(objValue, othValue, key);
	      }
	      if (typeof result == 'undefined') {
	        // Recursively compare objects (susceptible to call stack limits).
	        result = (objValue && objValue === othValue) || equalFunc(objValue, othValue, customizer, isWhere, stackA, stackB);
	      }
	    }
	    if (!result) {
	      return false;
	    }
	    hasCtor || (hasCtor = key == 'constructor');
	  }
	  if (!hasCtor) {
	    var objCtor = object.constructor,
	        othCtor = other.constructor;

	    // Non `Object` object instances with different constructors are not equal.
	    if (objCtor != othCtor && ('constructor' in object && 'constructor' in other) &&
	        !(typeof objCtor == 'function' && objCtor instanceof objCtor && typeof othCtor == 'function' && othCtor instanceof othCtor)) {
	      return false;
	    }
	  }
	  return true;
	}

	module.exports = equalObjects;


/***/ },
/* 208 */
/***/ function(module, exports, __webpack_require__) {

	var baseForIn = __webpack_require__(177),
	    isObjectLike = __webpack_require__(160);

	/** `Object#toString` result references. */
	var objectTag = '[object Object]';

	/** Used for native method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Used to resolve the `toStringTag` of values.
	 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * for more details.
	 */
	var objToString = objectProto.toString;

	/**
	 * A fallback implementation of `_.isPlainObject` which checks if `value`
	 * is an object created by the `Object` constructor or has a `[[Prototype]]`
	 * of `null`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
	 */
	function shimIsPlainObject(value) {
	  var Ctor;

	  // Exit early for non `Object` objects.
	  if (!(isObjectLike(value) && objToString.call(value) == objectTag) ||
	      (!hasOwnProperty.call(value, 'constructor') &&
	        (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
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
	  return typeof result == 'undefined' || hasOwnProperty.call(value, result);
	}

	module.exports = shimIsPlainObject;


/***/ }
/******/ ])
});
;