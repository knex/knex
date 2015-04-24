module.exports =
/******/ (function(modules) { // webpackBootstrap
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

	var Raw            = __webpack_require__(3)
	var warn           = __webpack_require__(4).warn
	var Client         = __webpack_require__(5)

	var makeClient     = __webpack_require__(6)
	var makeKnex       = __webpack_require__(7)
	var assign         = __webpack_require__(2)

	function Knex(config) {
	  if (typeof config === 'string') {
	    return new Knex(assign(parseUrl(config), arguments[2]))
	  }
	  var Dialect;
	  if (arguments.length === 0 || (!config.client && !config.dialect)) {
	    Dialect = makeClient(Client)
	  } else {
	    var clientName = config.client || config.dialect
	    Dialect = makeClient(__webpack_require__(8)("./" + (aliases[clientName] || clientName) + '/index.js'))
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

	module.exports = require("lodash/object/assign");

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Raw
	// -------
	var _            = __webpack_require__(9)
	var inherits     = __webpack_require__(12)
	var EventEmitter = __webpack_require__(13).EventEmitter
	var assign       = __webpack_require__(2);

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
	__webpack_require__(19)(Raw)

	module.exports = Raw


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	var _     = __webpack_require__(9)
	var chalk = __webpack_require__(10)

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
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11)))

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Promise        = __webpack_require__(20)
	var helpers        = __webpack_require__(4)

	var Raw            = __webpack_require__(3)
	var Runner         = __webpack_require__(21)
	var Formatter      = __webpack_require__(22)
	var Transaction    = __webpack_require__(23)

	var QueryBuilder   = __webpack_require__(24)
	var QueryCompiler  = __webpack_require__(25)

	var SchemaBuilder  = __webpack_require__(26)
	var SchemaCompiler = __webpack_require__(27)
	var TableBuilder   = __webpack_require__(28)
	var TableCompiler  = __webpack_require__(29)
	var ColumnBuilder  = __webpack_require__(30)
	var ColumnCompiler = __webpack_require__(31)

	var Pool2          = __webpack_require__(14)
	var inherits       = __webpack_require__(12)
	var EventEmitter   = __webpack_require__(13).EventEmitter

	var assign         = __webpack_require__(2)
	var uniqueId       = __webpack_require__(15)
	var cloneDeep      = __webpack_require__(16)
	var debug          = __webpack_require__(17)('knex:client')
	var debugQuery     = __webpack_require__(17)('knex:query')

	// The base client provides the general structure
	// for a dialect specific client object.
	function Client(config) {
	  config = config || {}
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

	  transaction: function(container, config, outerTx) {
	    return new this.Transaction(this, container, config, outerTx)
	  },

	  Raw: Raw,

	  raw: function() {
	    var raw = new this.Raw(this)
	    return raw.set.apply(raw, arguments)
	  },

	  query: function(connection, obj) {
	    if (typeof obj === 'string') obj = {sql: obj}
	    this.emit('query', assign({__knexUid: connection.__knexUid}, obj))
	    debugQuery(obj.sql)
	    return this._query.call(this, connection, obj).catch(function(err) {
	      err.message = obj.sql + ' - ' + err.message
	      throw err
	    })
	  },

	  stream: function(connection, obj, stream, options) {
	    if (typeof obj === 'string') obj = {sql: obj}
	    this.emit('query', assign({__knexUid: connection.__knexUid}, obj))
	    debugQuery(obj.sql)
	    return this._stream.call(this, connection, obj, stream, options)
	  },

	  wrapIdentifier: function(value) {
	    return (value !== '*' ? '"' + value.replace(/"/g, '""') + '"' : '*')
	  },

	  initializeDriver: function() {
	    try {
	      this.driver = __webpack_require__(18)(this.driverName)  
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
	      helpers.deprecate('config.pool.destroy', 'config.pool.dispose')
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
	    return new Promise(function(resolver) {
	      debug('releasing connection to pool: %s', connection.__knexUid)
	      pool.release(connection)
	      resolver()
	    })
	  },

	  // Destroy the current connection pool for the client.
	  destroy: function(callback) {
	    var client = this
	    var promise = new Promise(function(resolver) {
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
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var assign   = __webpack_require__(2);
	var inherits = __webpack_require__(12)

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

	  return Client
	}

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var EventEmitter   = __webpack_require__(13).EventEmitter
	var assign         = __webpack_require__(2);

	var Migrator       = __webpack_require__(51)
	var Seeder         = __webpack_require__(51)
	var FunctionHelper = __webpack_require__(32)
	var QueryInterface = __webpack_require__(33)
	var helpers        = __webpack_require__(4)

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
	    transaction: function(container, config) {
	      return client.transaction(container, config)
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
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./sqlite3/index.js": 34,
		"./websql/index.js": 35
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
	webpackContext.id = 8;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("lodash");

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("chalk");

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("/Users/tgriesser/Github/bookshelf/knex/node_modules/webpack/node_modules/node-libs-browser/node_modules/process/browser.js");

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("inherits");

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("events");

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("pool2");

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("lodash/utility/uniqueId");

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("lodash/lang/cloneDeep");

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("debug");

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./client": 5,
		"./client.js": 5,
		"./dialects/sqlite3/index": 34,
		"./dialects/sqlite3/index.js": 34,
		"./dialects/sqlite3/query/compiler": 43,
		"./dialects/sqlite3/query/compiler.js": 43,
		"./dialects/sqlite3/schema/columncompiler": 44,
		"./dialects/sqlite3/schema/columncompiler.js": 44,
		"./dialects/sqlite3/schema/compiler": 45,
		"./dialects/sqlite3/schema/compiler.js": 45,
		"./dialects/sqlite3/schema/ddl": 46,
		"./dialects/sqlite3/schema/ddl.js": 46,
		"./dialects/sqlite3/schema/tablecompiler": 47,
		"./dialects/sqlite3/schema/tablecompiler.js": 47,
		"./dialects/websql/index": 35,
		"./dialects/websql/index.js": 35,
		"./dialects/websql/transaction": 48,
		"./dialects/websql/transaction.js": 48,
		"./formatter": 22,
		"./formatter.js": 22,
		"./functionhelper": 32,
		"./functionhelper.js": 32,
		"./helpers": 4,
		"./helpers.js": 4,
		"./index": 1,
		"./index.js": 1,
		"./interface": 19,
		"./interface.js": 19,
		"./promise": 20,
		"./promise.js": 20,
		"./query/builder": 24,
		"./query/builder.js": 24,
		"./query/compiler": 25,
		"./query/compiler.js": 25,
		"./query/joinclause": 41,
		"./query/joinclause.js": 41,
		"./query/methods": 33,
		"./query/methods.js": 33,
		"./query/string": 40,
		"./query/string.js": 40,
		"./raw": 3,
		"./raw.js": 3,
		"./runner": 21,
		"./runner.js": 21,
		"./schema/builder": 26,
		"./schema/builder.js": 26,
		"./schema/columnbuilder": 30,
		"./schema/columnbuilder.js": 30,
		"./schema/columncompiler": 31,
		"./schema/columncompiler.js": 31,
		"./schema/compiler": 27,
		"./schema/compiler.js": 27,
		"./schema/helpers": 42,
		"./schema/helpers.js": 42,
		"./schema/tablebuilder": 28,
		"./schema/tablebuilder.js": 28,
		"./schema/tablecompiler": 29,
		"./schema/tablecompiler.js": 29,
		"./transaction": 23,
		"./transaction.js": 23,
		"./util/bluebird": 49,
		"./util/bluebird.js": 49,
		"./util/make-client": 6,
		"./util/make-client.js": 6,
		"./util/make-knex": 7,
		"./util/make-knex.js": 7
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
	webpackContext.id = 18;


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var assert  = __webpack_require__(36);
	var helpers = __webpack_require__(4)

	module.exports = function(Target) {
	  var _         = __webpack_require__(9);
	  var SqlString = __webpack_require__(40);

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
	  Target.prototype.pipe = function(writable, options) {
	    return this.client.runner(this).pipe(writable, options);
	  };

	  // Creates a method which "coerces" to a promise, by calling a
	  // "then" method on the current `Target`
	  _.each(['bind', 'catch', 'finally', 'asCallback', 
	    'spread', 'map', 'reduce', 'tap', 'thenReturn',
	    'return', 'yield', 'ensure', 'nodeify', 'exec'], function(method) {
	    Target.prototype[method] = function() {
	      var then = this.then();
	      then = then[method].apply(then, arguments);
	      return then;
	    };
	  });

	};

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Promise   = __webpack_require__(37)();
	var deprecate = __webpack_require__(4).deprecate

	// Incase we're using an older version of bluebird
	Promise.prototype.asCallback = Promise.prototype.nodeify

	Promise.prototype.exec = function(cb) {
	  deprecate('.exec', '.nodeify or .asCallback')
	  return this.nodeify(cb)
	};

	module.exports = Promise;


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _       = __webpack_require__(9)
	var Promise = __webpack_require__(20)
	var assign  = __webpack_require__(2);

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
	    PassThrough = PassThrough || __webpack_require__(38).PassThrough;
	    
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
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var QueryBuilder = __webpack_require__(24)
	var Raw          = __webpack_require__(3)
	var assign       = __webpack_require__(2)
	var transform    = __webpack_require__(39)

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
	  parameter: function(value) {
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
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Transaction
	// -------
	var Promise      = __webpack_require__(20)
	var EventEmitter = __webpack_require__(13).EventEmitter
	var inherits     = __webpack_require__(12)

	var makeKnex     = __webpack_require__(7)

	var assign       = __webpack_require__(2)
	var uniqueId     = __webpack_require__(15)
	var debug        = __webpack_require__(17)('knex:tx')

	// Acts as a facade for a Promise, keeping the internal state
	// and managing any child transactions.
	function Transaction(client, container, config, outerTx) {
	  
	  var txid = this.txid = uniqueId('trx')
	  
	  this.client    = client
	  this.outerTx   = outerTx
	  this.trxClient = undefined;

	  debug('%s: Starting %s transaction', txid, outerTx ? 'nested' : 'top level')

	  var t = this

	  this._promise = Promise.using(acquireConnection(client, config, txid), function(connection) {
	    
	    var trxClient = t.trxClient = makeTxClient(t, client, connection)
	    var init      = client.transacting ? t.savepoint(connection) : t.begin(connection)
	    
	    init.then(function() {
	      return makeTransactor(t, connection, trxClient)
	    })
	    .then(function(transactor) {

	      var result = container(transactor)

	      // If we've returned a "thenable" from the transaction container,
	      // and it's got the transaction object we're running for this, assume
	      // the rollback and commit are chained to this object's success / failure.
	      if (result && result.then && typeof result.then === 'function') {
	        result.then(function(val) { 
	          transactor.commit(val)
	        })
	        .catch(function(err) {
	          transactor.rollback(err)
	        })
	      }
	    
	    })

	    return new Promise(function(resolver, rejecter) {
	      t._resolver = resolver
	      t._rejecter = rejecter
	    })
	  })

	  this._completed  = false

	  // If there is more than one child transaction,
	  // we queue them, executing each when the previous completes.
	  this._childQueue = []

	  // The queue is a noop unless we have child promises.
	  this._queue = this._queue || Promise.resolve(true)

	  // If there's a wrapping transaction, we need to see if there are 
	  // any current children in the pending queue.
	  if (outerTx) {

	    // If there are other promises pending, we just wait until that one
	    // settles (commit or rollback) and then we can continue.
	    if (outerTx._childQueue.length > 0) {

	      this._queue = this._queue.then(function() {
	        return Promise.settle(outerTx._childQueue[outerTx._childQueue.length - 1])
	      })

	    }

	    // Push the current promise onto the queue of promises.
	    outerTx._childQueue.push(this._promise)
	  }

	}
	inherits(Transaction, EventEmitter)

	// Acquire a connection and create a disposer - either using the one passed 
	// via config or getting one off the client. The disposer will be called once 
	// the original promise is marked completed.
	function acquireConnection(client, config, txid) {
	  var configConnection = config && config.connection
	  return Promise.try(function() {
	    return configConnection || client.acquireConnection()  
	  })
	  .disposer(function(connection) {
	    if (!configConnection) {
	      debug('%s: releasing connection', txid)
	      client.releaseConnection(connection)
	    } else {
	      debug('%s: not releasing external connection', txid)
	    }
	  })
	}

	assign(Transaction.prototype, {

	  isCancelled: function() {
	    return this._cancelled || this.outerTx && this.outerTx.isCancelled() || false
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
	    return this.query(conn, 'release savepoint ' + this.txid + ';', 1, value)
	  },

	  rollback: function(conn, error) {
	    return this.query(conn, 'rollback;', 2, error)
	  },

	  rollbackTo: function(conn, error) {
	    return this.query(conn, 'rollback to savepoint ' + this.txid + ';', 2, error)
	  },

	  query: function(conn, sql, status, value) {

	    var t = this
	    return this.trxClient.query(conn, sql)
	      .catch(function(err) {
	        status = 2
	        value  = err
	        debug('%s error running transaction query', t.txid)
	      })
	      .tap(function() {
	        if (status === 1) t._resolver(value)
	        if (status === 2) t._rejecter(value)
	        if (status === 1 || status === 2) {
	          t._completed = true
	        }
	      })
	  },

	  _skipping: function(sql) {
	    return Promise.reject(new Error('Transaction ' + this.txid + ' has already been released skipping: ' + sql))
	  }

	})

	// The transactor is a full featured knex object, with a "commit", 
	// a "rollback" and a "savepoint" function. The "savepoint" is just
	// sugar for creating a new transaction. If the rollback is run
	// inside a savepoint, it rolls back to the last savepoint - otherwise
	// it rolls back the transaction.
	function makeTransactor(trx, connection, trxClient) {
	  
	  var transactor = makeKnex(trxClient)

	  transactor.transaction = function(container, options) {
	    return new trxClient.Transaction(trxClient, container, options, trx)
	  }  
	  transactor.savepoint = function(container, options) {
	    return transactor.transaction(container, options)
	  }

	  if (trx.client.transacting) {
	    transactor.commit = function(value) {
	      return trx.release(connection, value)
	    }
	    transactor.rollback = function(error) {
	      return trx.rollbackTo(connection, error);
	    }
	  } else {
	    transactor.commit = function(value) {
	      return trx.commit(connection, value)
	    }
	    transactor.rollback = function(error) {
	      return trx.rollback(connection, error)
	    }
	  }

	  return transactor
	}


	// We need to make a client object which always acquires the same 
	// connection and does not release back into the pool.
	function makeTxClient(trx, client, connection) {

	  var trxClient         = Object.create(client.constructor.prototype)
	  trxClient.config      = client.config
	  trxClient.transacting = true
	  
	  trxClient.on('query', function(arg) {
	    trx.emit('query', arg)
	  })

	  var _query = trxClient.query;
	  trxClient.query  = function(conn, obj) {
	    return Promise.try(function() {
	      if (conn !== connection) throw new Error('Invalid connection for transaction query.')
	      return _query.call(trxClient, conn, obj)
	    })
	  }
	  var _stream = trxClient.stream
	  trxClient.stream = function(conn, obj, stream, options) {
	    return Promise.try(function() {
	      if (conn !== connection) throw new Error('Invalid connection for transaction query.')
	      return _stream.call(trxClient, conn, obj, stream, options)
	    })
	  }
	  trxClient.acquireConnection = function() {
	    return trx._queue.then(function() {
	      return connection
	    })
	  }
	  trxClient.releaseConnection = function() { 
	    return Promise.resolve()
	  }

	  return trxClient
	}

	Transaction.prototype.transacting = undefined

	var promiseInterface = [
	  'then', 'bind', 'catch', 'finally', 'asCallback',
	  'spread', 'map', 'reduce', 'tap', 'thenReturn',
	  'return', 'yield', 'ensure', 'nodeify', 'exec'
	]

	// Creates a method which "coerces" to a promise, by calling a
	// "then" method on the current `Target`
	promiseInterface.forEach(function(method) {
	  Transaction.prototype[method] = function() {
	    return (this._promise = this._promise[method].apply(this._promise, arguments))
	  }
	})

	module.exports = Transaction;


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Builder
	// -------
	var _            = __webpack_require__(9)
	var assert       = __webpack_require__(36)
	var inherits     = __webpack_require__(12)
	var EventEmitter = __webpack_require__(13).EventEmitter

	var Raw          = __webpack_require__(3)
	var helpers      = __webpack_require__(4)
	var JoinClause   = __webpack_require__(41)

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
	QueryBuilder.prototype.truncate = function(tableName) {
	  this._method = 'truncate';
	  if (tableName) {
	    this._single.table = tableName
	  }
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
	__webpack_require__(19)(QueryBuilder);

	module.exports = QueryBuilder;


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Query Compiler
	// -------
	var _       = __webpack_require__(9);
	var helpers = __webpack_require__(4);
	var Raw     = __webpack_require__(3);
	var assign  = __webpack_require__(2)

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
	    return 'select ' + (distinct ? 'distinct ' : '') + 
	      sql.join(', ') + (this.tableName ? ' from ' + this.tableName : '');
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
	    var i = -1, sql = [];
	    while (++i < wheres.length) {
	      var stmt = wheres[i]
	      var val = this[stmt.type](stmt)
	      if (val) {
	        if (sql.length === 0) {
	          sql[0] = 'where'
	        } else {
	          sql.push(stmt.bool)
	        }
	        sql.push(val)
	      }
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
	          var val = this.whereWrapped(s)
	          if (val) sql.push(val)
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
	    var val = this.formatter.rawOrFn(statement.value, 'where')
	    return val && this._not(statement, '') + '(' + val.slice(6) + ')' || '';
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
	      if (data[i] == null) break;
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
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _            = __webpack_require__(9)
	var inherits     = __webpack_require__(12)
	var EventEmitter = __webpack_require__(13).EventEmitter

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

	__webpack_require__(19)(SchemaBuilder)

	SchemaBuilder.prototype.toString = function() {
	  return this.toQuery()
	}

	SchemaBuilder.prototype.toSQL = function() {
	  return this.client.schemaCompiler(this).toSQL()
	}

	module.exports = SchemaBuilder


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var helpers = __webpack_require__(42)
	var assign  = __webpack_require__(2);

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
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// TableBuilder

	// Takes the function passed to the "createTable" or "table/editTable"
	// functions and calls it with the "TableBuilder" as both the context and
	// the first argument. Inside this function we can specify what happens to the
	// method, pushing everything we want to do onto the "allStatements" array,
	// which is then compiled into sql.
	// ------
	var _ = __webpack_require__(9);
	var helpers = __webpack_require__(4);

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
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Table Compiler
	// -------
	var _ = __webpack_require__(9);
	var helpers = __webpack_require__(42);
	var normalizeArr = __webpack_require__(4).normalizeArr

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
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(9);

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
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Column Compiler
	// Used for designating column definitions
	// during the table "create" / "alter" statements.
	// -------
	var _       = __webpack_require__(9);
	var Raw     = __webpack_require__(3);
	var helpers = __webpack_require__(42)

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
/* 32 */
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
/* 33 */
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
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// SQLite3
	// -------
	var Promise        = __webpack_require__(20)

	var inherits       = __webpack_require__(12)
	var assign         = __webpack_require__(2)
	var pluck          = __webpack_require__(50);

	var Client         = __webpack_require__(5)
	var helpers        = __webpack_require__(4)

	var QueryCompiler  = __webpack_require__(43)
	var SchemaCompiler = __webpack_require__(45)
	var ColumnCompiler = __webpack_require__(44)
	var TableCompiler  = __webpack_require__(47)
	var SQLite3_DDL    = __webpack_require__(46)

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

	module.exports = Client_SQLite3


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// WebSQL
	// -------
	var inherits       = __webpack_require__(12)
	var _              = __webpack_require__(9)

	var Transaction    = __webpack_require__(48)
	var Client_SQLite3 = __webpack_require__(34)
	var Promise        = __webpack_require__(20)
	var assign         = __webpack_require__(2)

	function Client_WebSQL(config) {
	  Client_SQLite3.call(this, config);
	  this.name          = config.name || 'knex_database';
	  this.version       = config.version || '1.0';
	  this.displayName   = config.displayName || this.name;
	  this.estimatedSize = config.estimatedSize || 5 * 1024 * 1024;
	}
	inherits(Client_WebSQL, Client_SQLite3);

	assign(Client_WebSQL.prototype, {

	  Transaction: Transaction,

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

	  _stream: function(connection, sql, stream) {
	    var client = this;
	    return new Promise(function(resolver, rejecter) {
	      stream.on('error', rejecter)
	      stream.on('end', resolver)
	      return client._query(connection, sql).then(function(obj) {
	        return client.processResponse(obj)
	      }).map(function(row) {
	        stream.write(row)
	      }).catch(function(err) {
	        stream.emit('error', err)
	      }).then(function() {
	        stream.end()
	      })
	    })
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

	module.exports = Client_WebSQL;


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("assert");

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("bluebird/js/main/promise");

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("readable-stream");

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("lodash/object/transform");

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {'use strict'

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
	  if (val == null) {
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
	    if (stringifyObjects) {
	      val = val.toString();
	    } else {
	      return SqlString.objectToValues(val, timeZone);
	    }
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
	  values = values == null ? [] : [].concat(values);

	  var index = 0;
	  return sql.replace(/\?\??/g, function(match) {
	    if (index === values.length) {
	      return match;
	    }

	    var value = values[index++];

	    return match === '??' ? SqlString.escapeId(value) : 
	      SqlString.escape(value, stringifyObjects, timeZone);
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

	SqlString.bufferToString = function bufferToString(buffer) {
	  return "X'" + buffer.toString('hex') + "'";
	};

	SqlString.objectToValues = function(object, timeZone) {
	  var values = [];
	  for (var key in object) {
	    var value = object[key];
	    if(typeof value === 'function') {
	      continue;
	    }

	    values.push(this.escapeId(key) + ' = ' + SqlString.escape(value, true, timeZone));
	  }

	  return values.join(', ');
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
	    return (m[1] === '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
	  }
	  return false;
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(52).Buffer))

/***/ },
/* 41 */
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
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(9);

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
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// SQLite3 Query Builder & Compiler

	var _             = __webpack_require__(9)
	var inherits      = __webpack_require__(12)
	var QueryCompiler = __webpack_require__(25)
	var assign        = __webpack_require__(2);

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
	      sql: 'delete from ' + table,
	      output: function() {
	        return this.query({sql: 'delete from sqlite_sequence where name = ' + table}).catch(function() {})
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
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var inherits = __webpack_require__(12);
	var ColumnCompiler = __webpack_require__(31);

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
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// SQLite3: Column Builder & Compiler
	// -------
	var _        = __webpack_require__(9);
	var inherits = __webpack_require__(12);
	var SchemaCompiler   = __webpack_require__(27);

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
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// SQLite3_DDL
	//
	// All of the SQLite3 specific DDL helpers for renaming/dropping
	// columns and changing datatypes.
	// -------

	var _       = __webpack_require__(9);
	var Promise = __webpack_require__(20);
	var assign  = __webpack_require__(2);

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

	    return this.client.transaction(function(trx) {
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

	    return this.client.transaction(function(trx) {
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
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _        = __webpack_require__(9);
	var inherits = __webpack_require__(12);
	var TableCompiler   = __webpack_require__(29);

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
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var makeKnex = __webpack_require__(7)
	var Promise  = __webpack_require__(20)
	var helpers  = __webpack_require__(4)
	var inherits = __webpack_require__(12)
	var EventEmitter = __webpack_require__(13).EventEmitter

	function Transaction_WebSQL(client, container) {
	  helpers.warn('WebSQL transactions will run queries, but do not commit or rollback')
	  var trx = this
	  this._promise = Promise.try(function() {
	    container(makeKnex(makeClient(trx, client)))
	  })
	}
	inherits(Transaction_WebSQL, EventEmitter)

	function makeClient(trx, client) {
	  
	  var trxClient         = Object.create(client.constructor.prototype)
	  trxClient.config      = client.config
	  trxClient.transacting = true
	  
	  trxClient.on('query', function(arg) {
	    trx.emit('query', arg)
	  })
	  trxClient.commit = function() {}
	  trxClient.rollback = function() {}

	  return trxClient  
	}

	var promiseInterface = [
	  'then', 'bind', 'catch', 'finally', 'asCallback', 
	  'spread', 'map', 'reduce', 'tap', 'thenReturn',
	  'return', 'yield', 'ensure', 'nodeify', 'exec'
	]

	// Creates a method which "coerces" to a promise, by calling a
	// "then" method on the current `Target`
	promiseInterface.forEach(function(method) {
	  Transaction_WebSQL.prototype[method] = function() {
	    return (this._promise = this._promise[method].apply(this._promise, arguments))
	  }
	})

	module.exports = Transaction_WebSQL


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	// Use this shim module rather than "bluebird/js/main/promise" 
	// when bundling for client
	module.exports = function() {
	  return __webpack_require__(53)
	}

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("lodash/collection/pluck");

/***/ },
/* 51 */
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
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("/Users/tgriesser/Github/bookshelf/knex/node_modules/webpack/node_modules/node-libs-browser/node_modules/buffer/index.js");

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("bluebird");

/***/ }
/******/ ]);