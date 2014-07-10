!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Knex=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// Knex.js  0.6.22
// --------------

//     (c) 2014 Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org

// The "Knex" object we're exporting is just a passthrough to `Knex.initialize`.
function Knex() {
  return Knex.initialize.apply(null, arguments);
}

// Run a "raw" query, though we can't do anything with it other than put
// it in a query statement.
Knex.raw = function(sql, bindings) {
  return new Raw(sql, bindings);
};

// Require the main constructors necessary for a `Knex` instance,
// each of which are injected with the current instance, so they maintain
// the correct client reference & grammar.
var Raw = _dereq_('./lib/raw');

// Doing it this way makes it easier to build for browserify.
var mysql = function() { return _dereq_('./lib/dialects/mysql'); };
var mysql2 = function() { return _dereq_('./lib/dialects/mysql2'); };
var maria = function() { return _dereq_('./lib/dialects/maria'); };
var pg = function() { return _dereq_('./lib/dialects/postgres'); };
var sqlite3 = function() { return _dereq_('./lib/dialects/sqlite3'); };
var websql = function() { return _dereq_('./lib/dialects/websql'); };

// The client names we'll allow in the `{name: lib}` pairing.
var Clients = Knex.Clients = {
  'mysql'      : mysql,
  'mysql2'     : mysql2,
  'maria'      : maria,
  'mariadb'    : maria,
  'mariasql'   : maria,
  'pg'         : pg,
  'postgres'   : pg,
  'postgresql' : pg,
  'sqlite'     : sqlite3,
  'sqlite3'    : sqlite3,
  'websql'     : websql
};

// Require lodash.
var _ = _dereq_('lodash');
var Promise = _dereq_('./lib/promise');

// Each of the methods which may be statically chained from knex.
var QueryInterface   = _dereq_('./lib/query/methods');
var SchemaInterface  = _dereq_('./lib/schema/methods');
var MigrateInterface = _dereq_('./lib/migrate/methods');

// Create a new "knex" instance with the appropriate configured client.
Knex.initialize = function(config) {
  var Dialect, client;
  var EventEmitter = _dereq_('events').EventEmitter;

  // The object we're potentially using to kick off an
  // initial chain. It is assumed that `knex` isn't a
  // constructor, so we have no reference to 'this' just
  // in case it's called with `new`.
  function knex(tableName) {
    var qb = new client.QueryBuilder;
    if (config.__transactor__) qb.transacting(config.__transactor__);
    return tableName ? qb.table(tableName) : qb;
  }

  // Hook up the "knex" object as an EventEmitter.
  var ee = new EventEmitter();
  for (var key in ee) {
    knex[key] = ee[key];
  }

  // The `__knex__` is used if you need to duck-type check whether this
  // is a knex builder, without a full on `instanceof` check.
  knex.VERSION = knex.__knex__  = '0.6.21';
  knex.raw = function(sql, bindings) {
    var raw = new client.Raw(sql, bindings);
    if (config.__transactor__) raw.transacting(config.__transactor__);
    return raw;
  };

  // Runs a new transaction, taking a container and returning a promise
  // for when the transaction is resolved.
  knex.transaction = function(container) {
    return new client.Transaction(container);
  };

  // Convenience method for tearing down the pool.
  knex.destroy = function (callback) {
    var pool = this.client.pool;
    var promise = new Promise(function(resolver, rejecter) {
      if (!pool) resolver();
      pool.destroy(function(err) {
        if (err) return rejecter(err);
        resolver();
      });
    });
    // Allow either a callback or promise interface for destruction.
    if (_.isFunction(callback)) {
      promise.exec(callback);
    } else {
      return promise;
    }
  };

  if (config.__client__) {
    client = config.__client__;
  } else {
    
    // Build the "client"
    var clientName = config.client || config.dialect;
    if (!Clients[clientName]) {
      throw new Error(clientName + ' is not a valid Knex client, did you misspell it?');
    }
    knex.toString = function() {
      return '[object Knex:' + clientName + ']';
    };
    Dialect = Clients[clientName]();
    client  = new Dialect(config);

    // Passthrough all "start" and "query" events to the knex object.
    client.on('start', function(obj) {
      knex.emit('start', obj);
    });
    client.on('query', function(obj) {
      knex.emit('query', obj);
    });
  }

  // Allow chaining methods from the root object, before
  // any other information is specified.
  _.each(QueryInterface, function(method) {
    knex[method] = function() {
      var builder = knex();
      return builder[method].apply(builder, arguments);
    };
  });
  knex.client = client;

  // Namespaces for additional library components.
  var schema  = knex.schema  = {};
  var migrate = knex.migrate = {};

  // Attach each of the `Schema` "interface" methods directly onto to `knex.schema` namespace, e.g.:
  // `knex.schema.table('tableName', function() {...`
  // `knex.schema.createTable('tableName', function() {...`
  // `knex.schema.dropTableIfExists('tableName');`
  _.each(SchemaInterface, function(key) {
    schema[key] = function() {
      if (!client.SchemaBuilder) client.initSchema();
      var builder = new client.SchemaBuilder();
      if (config.__transactor__) builder.transacting(config.__transactor__);
      return builder[key].apply(builder, arguments);
    };
  });

  // Attach each of the `Migrator` "interface" methods directly onto to `knex.migrate` namespace, e.g.:
  // knex.migrate.latest().then(...
  // knex.migrate.currentVersion(...
  _.each(MigrateInterface, function(method) {
    migrate[method] = function() {
      if (!client.Migrator) client.initMigrator();
      var migrator = new client.Migrator(knex);
      return migrator[method].apply(migrator, arguments);
    };
  });

  // Add a few additional misc utils.
  knex.utils = _.extend({}, _dereq_('./lib/utils'));

  return knex;
};

module.exports = Knex;

},{"./lib/dialects/maria":3,"./lib/dialects/mysql":6,"./lib/dialects/mysql2":18,"./lib/dialects/postgres":21,"./lib/dialects/sqlite3":34,"./lib/dialects/websql":46,"./lib/migrate/methods":51,"./lib/promise":53,"./lib/query/methods":57,"./lib/raw":58,"./lib/schema/methods":65,"./lib/utils":69,"events":"T9Wsc/","lodash":"K2RcUv"}],2:[function(_dereq_,module,exports){
// "Base Client"
// ------
var Promise    = _dereq_('./promise');
var _          = _dereq_('lodash');
var inherits   = _dereq_('inherits');
var EventEmitter = _dereq_('events').EventEmitter;

// The base client provides the general structure
// for a dialect specific client object. The client
// object attaches fresh constructors for each component
// of the library.
function Client(config) {
  this.initFormatter();
  this.initRaw();
  this.initTransaction();
  this.initQuery();
  this.migrationConfig = _.clone(config && config.migrations);
}
inherits(Client, EventEmitter);

// Set the "isDebugging" flag on the client to "true" to log
// all queries run by the client.
Client.prototype.isDebugging = false;

// Acquire a connection from the pool.
Client.prototype.acquireConnection = function() {
  var pool = this.pool;
  return new Promise(function(resolver, rejecter) {
    if (!pool) return rejecter(new Error('There is no pool defined on the current client'));
    pool.acquire(function(err, connection) {
      if (err) return rejecter(err);
      resolver(connection);
    });
  });
};

// Releases a connection from the connection pool,
// returning a promise resolved when the connection is released.
Client.prototype.releaseConnection = function(connection) {
  var pool = this.pool;
  return new Promise(function(resolver, rejecter) {
    pool.release(connection, function(err) {
      if (err) return rejecter(err);
      resolver(connection);
    });
  });
};

// Return the database being used by this client.
Client.prototype.database = function() {
  return this.connectionSettings.database;
};

module.exports = Client;
},{"./promise":53,"events":"T9Wsc/","inherits":"oxw+vU","lodash":"K2RcUv"}],3:[function(_dereq_,module,exports){
// MariaSQL Client
// -------
var inherits = _dereq_('inherits');

var _            = _dereq_('lodash');
var Client_MySQL = _dereq_('../mysql');
var Promise      = _dereq_('../../promise');

var Mariasql;

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MariaSQL() {
  Client_MySQL.apply(this, arguments);
}
inherits(Client_MariaSQL, Client_MySQL);

// The "dialect", for reference elsewhere.
Client_MariaSQL.prototype.dialect = 'mariasql';

// Lazy-load the mariasql dependency, since we might just be
// using the client to generate SQL strings.
Client_MariaSQL.prototype.initDriver = function() {
  Mariasql = Mariasql || _dereq_('mariasql');
};

// Initialize the query "runner"
Client_MariaSQL.prototype.initRunner = function() {
  _dereq_('./runner')(this);
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_MariaSQL.prototype.acquireRawConnection = function() {
  var connection = new Mariasql();
  connection.connect(_.extend({metadata: true}, this.connectionSettings));
  return new Promise(function(resolver, rejecter) {
    connection.on('connect', function() {
      connection.removeAllListeners('end');
      connection.removeAllListeners('error');
      resolver(connection);
    })
    .on('error', rejecter);
  });
};

// Return the database for the MariaSQL client.
Client_MariaSQL.prototype.database = function() {
  return this.connectionSettings.db;
};

module.exports = Client_MariaSQL;
},{"../../promise":53,"../mysql":6,"./runner":4,"inherits":"oxw+vU","lodash":"K2RcUv"}],4:[function(_dereq_,module,exports){
// MariaSQL Runner
// ------
module.exports = function(client) {

var inherits  = _dereq_('inherits');
var SqlString = _dereq_('../mysql/string');

var Promise  = _dereq_('../../promise');
var Runner   = _dereq_('../../runner');
var helpers    = _dereq_('../../helpers');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_MariaSQL() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_MariaSQL, Runner);

// Grab a connection, run the query via the MariaSQL streaming interface,
// and pass that through to the stream we've sent back to the client.
Runner_MariaSQL.prototype._stream = Promise.method(function(sql, stream, options) {
  var runner = this;
  return new Promise(function(resolver, rejecter) {
    runner.connection.query(sql.sql, sql.bindings)
      .on('result', function(result) {
        result
          .on('row', rowHandler(function(row) { stream.write(row); }))
          .on('end', function(data) { resolver(data); });
      })
      .on('error', function(err) { rejecter(err); });
  });
});

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Runner_MariaSQL.prototype._query = Promise.method(function(obj) {
  var sql = obj.sql;
  if (this.isDebugging()) this.debug(obj);
  var connection = this.connection;
  var tz = this.client.connectionSettings.timezone || 'local';
  if (!sql) throw new Error('The query is empty');
  return new Promise(function(resolver, rejecter) {
    var rows = [];
    var query = connection.query(SqlString.format(sql, obj.bindings, false, tz), []);
    query.on('result', function(result) {
      result.on('row', rowHandler(function(row) { rows.push(row); }))
      .on('end', function(data) {
        obj.response = [rows, data];
        resolver(obj);
      });
    })
    .on('error', rejecter);

  });
});

// Process the response as returned from the query.
Runner_MariaSQL.prototype.processResponse = function(obj) {
  var response = obj.response;
  var method   = obj.method;
  var rows     = response[0];
  var data     = response[1];
  if (obj.output) return obj.output.call(this, rows, fields);
  switch (method) {
    case 'select':
    case 'pluck':
    case 'first':
      var resp = helpers.skim(rows);
      if (method === 'pluck') return _.pluck(resp, obj.pluck);
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
};

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

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_MariaSQL;

};
},{"../../helpers":49,"../../promise":53,"../../runner":59,"../mysql/string":16,"inherits":"oxw+vU"}],5:[function(_dereq_,module,exports){
// MySQL Formatter
// ------
module.exports = function(client) {

var Formatter = _dereq_('../../formatter');
var inherits  = _dereq_('inherits');

// The "formatter" is used to ensure all output is properly
// escaped & parameterized.
function Formatter_MySQL() {
  this.client = client;
  Formatter.apply(this, arguments);
}
inherits(Formatter_MySQL, Formatter);

Formatter_MySQL.prototype.operators = [
  '=', '<', '>', '<=', '>=', '<>', '!=',
  'like', 'not like', 'between', 'ilike',
  '&', '|', '^', '<<', '>>',
  'rlike', 'regexp', 'not regexp'
];

// Wraps a value (column, tableName) with the correct ticks.
Formatter_MySQL.prototype.wrapValue = function(value) {
  return (value !== '*' ? '`' + value + '`' : '*');
};

// Memoize the calls to "wrap" for a little extra perf.
var wrapperMemo = (function(){
  var memo = Object.create(null);
  return function(key) {
    if (memo[key] === void 0) {
      memo[key] = this._wrapString(key);
    }
    return memo[key];
  };
}());

Formatter_MySQL.prototype._wrap = wrapperMemo;

// Assign the formatter to the the client.
client.Formatter = Formatter_MySQL;

};
},{"../../formatter":48,"inherits":"oxw+vU"}],6:[function(_dereq_,module,exports){
// MySQL Client
// -------
var inherits = _dereq_('inherits');

var _       = _dereq_('lodash');
var Client  = _dereq_('../../client');
var Promise = _dereq_('../../promise');

var mysql;

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL(config) {
  Client.apply(this, arguments);
  if (config.debug) this.isDebugging = true;
  if (config.connection) {
    this.initDriver();
    this.initRunner();
    this.connectionSettings = _.clone(config.connection);
    this.initPool();
    this.pool = new this.Pool(config.pool);
  }
}
inherits(Client_MySQL, Client);

// The "dialect", for reference elsewhere.
Client_MySQL.prototype.dialect = 'mysql';

// Lazy-load the mysql dependency, since we might just be
// using the client to generate SQL strings.
Client_MySQL.prototype.initDriver = function() {
  mysql = mysql || _dereq_('mysql');
};

// Attach a `Formatter` constructor to the client object.
Client_MySQL.prototype.initFormatter = function() {
  _dereq_('./formatter')(this);
};

// Attaches the `Raw` constructor to the client object.
Client_MySQL.prototype.initRaw = function() {
  _dereq_('./raw')(this);
};

// Attaches the `Transaction` constructor to the client object.
Client_MySQL.prototype.initTransaction = function() {
  _dereq_('./transaction')(this);
};

// Attaches `QueryBuilder` and `QueryCompiler` constructors
// to the client object.
Client_MySQL.prototype.initQuery = function() {
  _dereq_('./query')(this);
};

// Initializes a new pool instance for the current client.
Client_MySQL.prototype.initPool = function() {
  _dereq_('./pool')(this);
};

// Initialize the query "runner"
Client_MySQL.prototype.initRunner = function() {
  _dereq_('./runner')(this);
};

// Lazy-load the schema dependencies; we may not need to use them.
Client_MySQL.prototype.initSchema = function() {
  _dereq_('./schema')(this);
};

// Lazy-load the migration dependency
Client_MySQL.prototype.initMigrator = function() {
  _dereq_('./migrator')(this);
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_MySQL.prototype.acquireRawConnection = function() {
  var connection = mysql.createConnection(this.connectionSettings);
  return new Promise(function(resolver, rejecter) {
    connection.connect(function(err) {
      if (err) return rejecter(err);
      resolver(connection);
    });
  });
};

// Used to explicitly close a connection, called internally by the pool
// when a connection times out or the pool is shutdown.
Client_MySQL.prototype.destroyRawConnection = function(connection) {
  connection.end();
};

// Return the database for the MySQL client.
Client_MySQL.prototype.database = function() {
  return this.connectionSettings.database;
};

module.exports = Client_MySQL;
},{"../../client":2,"../../promise":53,"./formatter":5,"./migrator":7,"./pool":8,"./query":9,"./raw":10,"./runner":11,"./schema":13,"./transaction":17,"inherits":"oxw+vU","lodash":"K2RcUv"}],7:[function(_dereq_,module,exports){
// MySQL Migrator
// ------
module.exports = function(client) {

var Migrator = _dereq_('../../migrate');
var inherits = _dereq_('inherits');

function Migrator_MySQL() {
  this.client = client;
  Migrator.apply(this, arguments);
}
inherits(Migrator_MySQL, Migrator);

client.Migrator = Migrator_MySQL;

};
},{"inherits":"oxw+vU"}],8:[function(_dereq_,module,exports){
// MySQL Pool
// ------
module.exports = function(client) {

var inherits = _dereq_('inherits');
var Pool = _dereq_('../../pool');

function Pool_MySQL() {
  this.client = client;
  Pool.apply(this, arguments);
}
inherits(Pool_MySQL, Pool);

client.Pool = Pool_MySQL;

};
},{"../../pool":52,"inherits":"oxw+vU"}],9:[function(_dereq_,module,exports){
// MySQL Query Builder & Compiler
// ------
module.exports = function(client) {

var _             = _dereq_('lodash');
var inherits      = _dereq_('inherits');
var QueryBuilder  = _dereq_('../../query/builder');
var QueryCompiler = _dereq_('../../query/compiler');

// Query Builder
// -------

// Extend the QueryBuilder base class to include the "Formatter"
// which has been defined on the client, as well as the
function QueryBuilder_MySQL() {
  this.client = client;
  QueryBuilder.apply(this, arguments);
}
inherits(QueryBuilder_MySQL, QueryBuilder);

// Query Compiler
// -------

// Set the "Formatter" to use for the queries,
// ensuring that all parameterized values (even across sub-queries)
// are properly built into the same query.
function QueryCompiler_MySQL() {
  this.formatter = new client.Formatter();
  QueryCompiler.apply(this, arguments);
}
inherits(QueryCompiler_MySQL, QueryCompiler);

QueryCompiler_MySQL.prototype._emptyInsertValue = '() values ()';

// Update method, including joins, wheres, order & limits.
QueryCompiler_MySQL.prototype.update = function() {
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
};

QueryCompiler_MySQL.prototype.forUpdate = function() {
  return 'for update';
};
QueryCompiler_MySQL.prototype.forShare = function() {
  return 'lock in share mode';
};

// Compiles a `columnInfo` query.
QueryCompiler_MySQL.prototype.columnInfo = function() {
  var column = this.single.columnInfo;
  return {
    sql: 'select * from information_schema.columns where table_name = ? and table_schema = ?',
    bindings: [this.single.table, client.database()],
    output: function(resp) {
      var out = _.reduce(resp, function(columns, val) {
        columns[val.COLUMN_NAME] = {
          defaultValue: val.COLUMN_DEFAULT,
          type: val.DATA_TYPE,
          maxLength: val.CHARACTER_MAXIMUM_LENGTH,
          nullable: (val.IS_NULLABLE === 'YES')
        };
        return columns;
      }, {});
      return column && out[column] || out;
    }
  };
};

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
client.QueryBuilder  = QueryBuilder_MySQL;
client.QueryCompiler = QueryCompiler_MySQL;

};
},{"../../query/builder":54,"../../query/compiler":55,"inherits":"oxw+vU","lodash":"K2RcUv"}],10:[function(_dereq_,module,exports){
// MySQL Raw
// -------
module.exports = function(client) {

var Raw = _dereq_('../../raw');
var inherits = _dereq_('inherits');

// Inherit from the `Raw` constructor's prototype,
// so we can add the correct `then` method.
function Raw_MySQL() {
  this.client = client;
  Raw.apply(this, arguments);
}
inherits(Raw_MySQL, Raw);

// Assign the newly extended `Raw` constructor to the client object.
client.Raw = Raw_MySQL;

};
},{"../../raw":58,"inherits":"oxw+vU"}],11:[function(_dereq_,module,exports){
// MySQL Runner
// ------
module.exports = function(client) {

var _        = _dereq_('lodash');
var inherits = _dereq_('inherits');

var Promise  = _dereq_('../../promise');
var Runner   = _dereq_('../../runner');
var helpers    = _dereq_('../../helpers');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_MySQL() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_MySQL, Runner);

// Grab a connection, run the query via the MySQL streaming interface,
// and pass that through to the stream we've sent back to the client.
Runner_MySQL.prototype._stream = Promise.method(function(sql, stream, options) {
  var runner = this;
  return new Promise(function(resolver, rejecter) {
    stream.on('error', rejecter);
    stream.on('end', resolver);
    runner.connection.query(sql.sql, sql.bindings).stream(options).pipe(stream);
  });
});

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Runner_MySQL.prototype._query = Promise.method(function(obj) {
  var sql = obj.sql;
  if (this.isDebugging()) this.debug(obj);
  if (obj.options) sql = _.extend({sql: sql}, obj.options);
  var connection = this.connection;
  if (!sql) throw new Error('The query is empty');
  return new Promise(function(resolver, rejecter) {
    connection.query(sql, obj.bindings, function(err, rows, fields) {
      if (err) return rejecter(err);
      obj.response = [rows, fields];
      resolver(obj);
    });
  });
});

// Process the response as returned from the query.
Runner_MySQL.prototype.processResponse = function(obj) {
  var response = obj.response;
  var method   = obj.method;
  var rows     = response[0];
  var fields   = response[1];
  if (obj.output) return obj.output.call(this, rows, fields);
  switch (method) {
    case 'select':
    case 'pluck':
    case 'first':
      var resp = helpers.skim(rows);
      if (method === 'pluck') return _.pluck(resp, obj.pluck);
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
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_MySQL;

};
},{"../../helpers":49,"../../promise":53,"../../runner":59,"inherits":"oxw+vU","lodash":"K2RcUv"}],12:[function(_dereq_,module,exports){
// MySQL Column Builder & Compiler
// -------
module.exports = function(client) {

var inherits = _dereq_('inherits');
var Schema   = _dereq_('../../../schema');
var helpers  = _dereq_('../../../helpers');

// Column Builder
// -------

function ColumnBuilder_MySQL() {
  Schema.ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_MySQL, Schema.ColumnBuilder);

// Column Compiler
// -------

function ColumnCompiler_MySQL() {
  this.Formatter = client.Formatter;
  this.modifiers = ['unsigned', 'nullable', 'defaultTo', 'after', 'comment'];
  Schema.ColumnCompiler.apply(this, arguments);
}
inherits(ColumnCompiler_MySQL, Schema.ColumnCompiler);

// Types
// ------

ColumnCompiler_MySQL.prototype.increments = 'int unsigned not null auto_increment primary key';
ColumnCompiler_MySQL.prototype.bigincrements = 'bigint unsigned not null auto_increment primary key';
ColumnCompiler_MySQL.prototype.bigint = 'bigint';
ColumnCompiler_MySQL.prototype.double = function(precision, scale) {
  if (!precision) return 'double';
  return 'double(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
};
ColumnCompiler_MySQL.prototype.integer = function(length) {
  length = length ? '(' + this._num(length, 11) + ')' : '';
  return 'int' + length;
};
ColumnCompiler_MySQL.prototype.mediumint = 'mediumint';
ColumnCompiler_MySQL.prototype.smallint = 'smallint';
ColumnCompiler_MySQL.prototype.tinyint = function(length) {
  length = length ? '(' + this._num(length, 1) + ')' : '';
  return 'tinyint' + length;
};
ColumnCompiler_MySQL.prototype.text = function(column) {
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
};
ColumnCompiler_MySQL.prototype.mediumtext = function() {
  return this.text('medium');
};
ColumnCompiler_MySQL.prototype.longtext = function() {
  return this.text('long');
};
ColumnCompiler_MySQL.prototype.enu = function(allowed) {
  return "enum('" + allowed.join("', '")  + "')";
};
ColumnCompiler_MySQL.prototype.datetime = 'datetime';
ColumnCompiler_MySQL.prototype.timestamp = 'timestamp';
ColumnCompiler_MySQL.prototype.bit = function(length) {
  return length ? 'bit(' + this._num(length) + ')' : 'bit';
};

// Modifiers
// ------

ColumnCompiler_MySQL.prototype.defaultTo = function(value) {
  var defaultVal = ColumnCompiler_MySQL.super_.prototype.defaultTo.apply(this, arguments);
  if (this.type != 'blob' && this.type.indexOf('text') === -1) {
    return defaultVal;
  }
  return '';
};
ColumnCompiler_MySQL.prototype.unsigned = function() {
  return 'unsigned';
};
ColumnCompiler_MySQL.prototype.after = function(column) {
  return 'after ' + this.formatter.wrap(column);
};
ColumnCompiler_MySQL.prototype.comment = function(comment) {
  if (comment && comment.length > 255) {
    helpers.warn('Your comment is longer than the max comment length for MySQL');
  }
  return comment && "comment '" + comment + "'";
};

client.ColumnBuilder = ColumnBuilder_MySQL;
client.ColumnCompiler = ColumnCompiler_MySQL;

};
},{"../../../helpers":49,"../../../schema":64,"inherits":"oxw+vU"}],13:[function(_dereq_,module,exports){
module.exports = function(client) {
  _dereq_('./schema')(client);
  _dereq_('./table')(client);
  _dereq_('./column')(client);
};
},{"./column":12,"./schema":14,"./table":15}],14:[function(_dereq_,module,exports){
// MySQL Schema Builder & Compiler
// -------
module.exports = function(client) {

var inherits = _dereq_('inherits');
var Schema   = _dereq_('../../../schema');

// Schema Builder
// -------

function SchemaBuilder_MySQL() {
  this.client = client;
  Schema.Builder.apply(this, arguments);
}
inherits(SchemaBuilder_MySQL, Schema.Builder);

// Schema Compiler
// -------

function SchemaCompiler_MySQL() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.Compiler.apply(this, arguments);
}
inherits(SchemaCompiler_MySQL, Schema.Compiler);

// Rename a table on the schema.
SchemaCompiler_MySQL.prototype.renameTable = function(tableName, to) {
  this.pushQuery('rename table ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
};

// Check whether a table exists on the query.
SchemaCompiler_MySQL.prototype.hasTable = function(tableName) {
  this.pushQuery({
    sql: 'select * from information_schema.tables where table_schema = ' +
      this.formatter.parameter(client.database()) +
      ' and table_name = ' +
      this.formatter.parameter(tableName),
    output: function(resp) {
      return resp.length > 0;
    }
  });
};

// Check whether a column exists on the schema.
SchemaCompiler_MySQL.prototype.hasColumn = function(tableName, column) {
  this.pushQuery({
    sql: 'show columns from ' + this.formatter.wrap(tableName) +
      ' like ' + this.formatter.parameter(column),
    output: function(resp) {
      return resp.length > 0;
    }
  });
};

client.SchemaBuilder = SchemaBuilder_MySQL;
client.SchemaCompiler = SchemaCompiler_MySQL;

};
},{"../../../schema":64,"inherits":"oxw+vU"}],15:[function(_dereq_,module,exports){
// MySQL Table Builder & Compiler
// -------
module.exports = function(client) {

var inherits = _dereq_('inherits');
var Schema   = _dereq_('../../../schema');

// Table Builder
// ------

function TableBuilder_MySQL() {
  this.client = client;
  Schema.TableBuilder.apply(this, arguments);
}
inherits(TableBuilder_MySQL, Schema.TableBuilder);

// Table Compiler
// ------

function TableCompiler_MySQL() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_MySQL, Schema.TableCompiler);

TableCompiler_MySQL.prototype.createQuery = function(columns) {
  var conn = {}, sql = 'create table ' + this.tableName() + ' (' + columns.sql.join(', ') + ')';

  // Check if the connection settings are set.
  if (client.connectionSettings) {
    conn = client.connectionSettings;
  }

  var charset   = this.single.charset || conn.charset || '';
  var collation = this.single.collate || conn.collate || '';
  var engine    = this.single.engine  || '';

  // var conn = builder.client.connectionSettings;
  if (charset) sql   += ' default character set ' + charset;
  if (collation) sql += ' collate ' + collation;
  if (engine) sql    += ' engine = ' + engine;

  var hasComment = this.single.comment != void 0;
  if (hasComment) {
    var comment = (this.single.comment || '');
    if (comment.length > 60) helpers.warn('The max length for a table comment is 60 characters');
    sql += " comment = '" + comment + "'";
  }

  this.pushQuery(sql);
};

TableCompiler_MySQL.prototype.addColumnsPrefix = 'add ';
TableCompiler_MySQL.prototype.dropColumnPrefix = 'drop ';

// Compiles the comment on the table.
TableCompiler_MySQL.prototype.comment = function(comment) {
  this.pushQuery('alter table ' + this.tableName() + " comment = '" + comment + "'");
};

TableCompiler_MySQL.prototype.changeType = function() {
  // alter table + table + ' modify ' + wrapped + '// type';
};

// Renames a column on the table.
TableCompiler_MySQL.prototype.renameColumn = function(from, to) {
  var table   = this.tableName();
  var wrapped = this.formatter.wrap(from) + ' ' + this.formatter.wrap(to);
  this.pushQuery({
    sql: 'show fields from ' + table + ' where field = ' +
      this.formatter.parameter(from),
    output: function(resp) {
      var column = resp[0];
      return this.query({
        sql: 'alter table ' + table + ' change ' + wrapped + ' ' + column.Type
      });
    }
  });
};

TableCompiler_MySQL.prototype.index = function(columns, indexName) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + " add index " + indexName + "(" + this.formatter.columnize(columns) + ")");
};

TableCompiler_MySQL.prototype.primary = function(columns, indexName) {
  indexName = indexName || this._indexCommand('primary', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + " add primary key " + indexName + "(" + this.formatter.columnize(columns) + ")");
};

TableCompiler_MySQL.prototype.unique = function(columns, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + " add unique " + indexName + "(" + this.formatter.columnize(columns) + ")");
};

// Compile a drop index command.
TableCompiler_MySQL.prototype.dropIndex = function(columns, indexName) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
};

// Compile a drop foreign key command.
TableCompiler_MySQL.prototype.dropForeign = function(columns, indexName) {
  indexName = indexName || this._indexCommand('foreign', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop foreign key ' + indexName);
};

// Compile a drop primary key command.
TableCompiler_MySQL.prototype.dropPrimary = function() {
  this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
};

// Compile a drop unique key command.
TableCompiler_MySQL.prototype.dropUnique = function(column, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, column);
  this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
};

client.TableBuilder = TableBuilder_MySQL;
client.TableCompiler = TableCompiler_MySQL;

};
},{"../../../schema":64,"inherits":"oxw+vU"}],16:[function(_dereq_,module,exports){
(function (Buffer){
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

  return sql.replace(/\?\??/g, function(match) {
    if (!values.length) {
      return match;
    }

    if (match == "??") {
      return SqlString.escapeId(values.shift());
    }
    return SqlString.escape(values.shift(), stringifyObjects, timeZone);
  });
};

SqlString.dateToString = function(date, timeZone) {
  var dt = new Date(date);

  if (timeZone != 'local') {
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
  if (tz == "Z") return 0;

  var m = tz.match(/([\+\-\s])(\d\d):?(\d\d)?/);
  if (m) {
    return (m[1] == '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
  }
  return false;
}
}).call(this,_dereq_("buffer").Buffer)
},{"buffer":"cTGqya"}],17:[function(_dereq_,module,exports){
// MySQL Transaction
// ------
module.exports = function(client) {

var inherits = _dereq_('inherits');
var Transaction = _dereq_('../../transaction');

function Transaction_MySQL() {
  this.client = client;
  Transaction.apply(this, arguments);
}
inherits(Transaction_MySQL, Transaction);

client.Transaction = Transaction_MySQL;

};
},{"../../transaction":68,"inherits":"oxw+vU"}],18:[function(_dereq_,module,exports){
// MySQL2 Client
// -------
var inherits = _dereq_('inherits');

var _            = _dereq_('lodash');
var Client_MySQL = _dereq_('../mysql');
var Promise      = _dereq_('../../promise');

var mysql2;

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL2() {
  Client_MySQL.apply(this, arguments);
}
inherits(Client_MySQL2, Client_MySQL);

// The "dialect", for reference elsewhere.
Client_MySQL2.prototype.dialect = 'mysql2';

// Lazy-load the mysql2 dependency, since we might just be
// using the client to generate SQL strings.
Client_MySQL2.prototype.initDriver = function() {
  mysql2 = mysql2 || _dereq_('mysql2');
};

// Initialize the query "runner"
Client_MySQL2.prototype.initRunner = function() {
  _dereq_('./runner')(this);
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_MySQL2.prototype.acquireRawConnection = function() {
  var connection = mysql2.createConnection(_.pick(this.connectionSettings, configOptions));
  return new Promise(function(resolver, rejecter) {
    connection.connect(function(err) {
      if (err) return rejecter(err);
      resolver(connection);
    });
  });
};

var configOptions = ['user', 'database', 'host', 'password', 'ssl', 'connection', 'stream'];

module.exports = Client_MySQL2;
},{"../../promise":53,"../mysql":6,"./runner":19,"inherits":"oxw+vU","lodash":"K2RcUv"}],19:[function(_dereq_,module,exports){
// MySQL Runner
// ------
module.exports = function(client) {

var _        = _dereq_('lodash');
var inherits = _dereq_('inherits');

var Promise  = _dereq_('../../promise');
var Runner   = _dereq_('../../runner');
var helpers  = _dereq_('../../helpers');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_MySQL2() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_MySQL2, Runner);

// Grab a connection, run the query via the MySQL streaming interface,
// and pass that through to the stream we've sent back to the client.
Runner_MySQL2.prototype._stream = Promise.method(function(sql, stream, options) {
  var runner = this;
  return new Promise(function(resolver, rejecter) {
    stream.on('error', rejecter);
    stream.on('end', resolver);
    return runner.query(sql).map(function(row) {
      stream.write(row);
    }).catch(function(err) {
      stream.emit('error', err);
    }).then(function() {
      stream.end();
    });
  });
});

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Runner_MySQL2.prototype._query = Promise.method(function(obj) {
  var sql = obj.sql;
  if (this.isDebugging()) this.debug(obj);
  if (obj.options) sql = _.extend({sql: sql}, obj.options);
  var connection = this.connection;
  if (!sql) throw new Error('The query is empty');
  return new Promise(function(resolver, rejecter) {
    connection.query(sql, obj.bindings, function(err, rows, fields) {
      if (err) return rejecter(err);
      obj.response = [rows, fields];
      resolver(obj);
    });
  });
});

// Process the response as returned from the query.
Runner_MySQL2.prototype.processResponse = function(obj) {
  var response = obj.response;
  var method   = obj.method;
  var rows     = response[0];
  var fields   = response[1];
  if (obj.output) return obj.output.call(this, rows, fields);
  switch (method) {
    case 'select':
    case 'pluck':
    case 'first':
      var resp = helpers.skim(rows);
      if (method === 'pluck') return _.pluck(resp, obj.pluck);
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
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_MySQL2;

};
},{"../../helpers":49,"../../promise":53,"../../runner":59,"inherits":"oxw+vU","lodash":"K2RcUv"}],20:[function(_dereq_,module,exports){
// PostgreSQL Formatter
// -------
module.exports = function(client) {

var Formatter = _dereq_('../../formatter');
var inherits  = _dereq_('inherits');

// The "formatter" is used to ensure all output is properly
// escaped & parameterized.
function Formatter_PG() {
  this.client = client;
  this.paramCount = 0;
  Formatter.apply(this, arguments);
}
inherits(Formatter_PG, Formatter);

Formatter_PG.prototype.operators = [
  '=', '<', '>', '<=', '>=', '<>', '!=',
  'like', 'not like', 'between', 'ilike',
  '&', '|', '#', '<<', '>>', '&&', '^', '@>', '<@', '||'
];

// Wraps a value (column, tableName) with the correct ticks.
Formatter_PG.prototype.wrapValue = function(value) {
  if (value === '*') return value;
  var matched = value.match(/(.*?)(\[[0-9]\])/);
  if (matched) return this.wrapValue(matched[1]) + matched[2];
  return '"' + value + '"';
};

// Memoize the calls to "wrap" for a little extra perf.
var wrapperMemo = (function(){
  var memo = Object.create(null);
  return function(key) {
    if (memo[key] === void 0) {
      memo[key] = this._wrapString(key);
    }
    return memo[key];
  };
}());

Formatter_PG.prototype._wrap = wrapperMemo;

// Assign the formatter to the the client.
client.Formatter = Formatter_PG;

};
},{"../../formatter":48,"inherits":"oxw+vU"}],21:[function(_dereq_,module,exports){
// PostgreSQL
// -------
var _        = _dereq_('lodash');
var inherits = _dereq_('inherits');

var Client  = _dereq_('../../client');
var Promise = _dereq_('../../promise');

var pg;

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_PG(config) {
  Client.apply(this, arguments);
  if (config.debug) this.isDebugging = true;
  if (config.connection) {
    this.initDriver();
    this.initRunner();
    this.connectionSettings = config.connection;
    this.initPool();
    this.pool = new this.Pool(config.pool);
  }
}
inherits(Client_PG, Client);

Client_PG.prototype.dialect = 'postgresql',

// Lazy load the pg dependency, since we might just be using
// the client to generate SQL strings.
Client_PG.prototype.initDriver = function() {
  pg = pg || (function() {
    try {
      return _dereq_('pg');
    } catch (e) {
      return _dereq_('pg.js');
    }
  })();
};

// Attach a `Formatter` constructor to the client object.
Client_PG.prototype.initFormatter = function() {
  _dereq_('./formatter')(this);
};

// Attaches the `Raw` constructor to the client object.
Client_PG.prototype.initRaw = function() {
  _dereq_('./raw')(this);
};

// Attaches the `Transaction` constructor to the client object.
Client_PG.prototype.initTransaction = function() {
  _dereq_('./transaction')(this);
};

// Attaches `QueryBuilder` and `QueryCompiler` constructors
// to the client object.
Client_PG.prototype.initQuery = function() {
  _dereq_('./query')(this);
};

// Initializes a new pool instance for the current client.
Client_PG.prototype.initPool = function() {
  _dereq_('./pool')(this);
};

// Initialize the query "runner"
Client_PG.prototype.initRunner = function() {
  _dereq_('./runner')(this);
};

// Lazy-load the schema dependencies; we may not need to use them.
Client_PG.prototype.initSchema = function() {
  _dereq_('./schema')(this);
};

// Lazy-load the migration dependency
Client_PG.prototype.initMigrator = function() {
  _dereq_('./migrator')(this);
};

var utils;

// Prep the bindings as needed by PostgreSQL.
Client_PG.prototype.prepBindings = function(bindings, tz) {
  utils = utils || _dereq_('./utils');
  return _.map(bindings, utils.prepareValue);
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_PG.prototype.acquireRawConnection = Promise.method(function(callback) {
  var connection = new pg.Client(this.connectionSettings);
  var client = this;
  return new Promise(function(resolver, rejecter) {
    connection.connect(function(err, connection) {
      if (err) return rejecter(err);
      if (!client.version) {
        return client.checkVersion(connection).then(function(version) {
          client.version = version;
          resolver(connection);
        });
      }
      resolver(connection);
    });
  });
}),

// Used to explicitly close a connection, called internally by the pool
// when a connection times out or the pool is shutdown.
Client_PG.prototype.destroyRawConnection = function(connection) {
  connection.end();
};

// In PostgreSQL, we need to do a version check to do some feature
// checking on the database.
Client_PG.prototype.checkVersion = function(connection) {
  return new Promise(function(resolver, rejecter) {
    connection.query('select version();', function(err, resp) {
      if (err) return rejecter(err);
      resolver(/^PostgreSQL (.*?) /.exec(resp.rows[0].version)[1]);
    });
  });
};

module.exports = Client_PG;
},{"../../client":2,"../../promise":53,"./formatter":20,"./migrator":22,"./pool":23,"./query":24,"./raw":25,"./runner":26,"./schema":28,"./transaction":31,"./utils":32,"inherits":"oxw+vU","lodash":"K2RcUv"}],22:[function(_dereq_,module,exports){
module.exports = function(client) {

var Migrator = _dereq_('../../migrate');
var inherits = _dereq_('inherits');

// Inherit from the `Migrator` constructor's prototype,
// so we can add the correct `then` method.
function Migrator_PG() {
  this.client = client;
  Migrator.apply(this, arguments);
}
inherits(Migrator_PG, Migrator);

// Assign the newly extended `Migrator` constructor to the client object.
client.Migrator = Migrator_PG;

};
},{"inherits":"oxw+vU"}],23:[function(_dereq_,module,exports){
module.exports = function(client) {

var Pool     = _dereq_('../../pool');
var inherits = _dereq_('inherits');

// Inherit from the `Pool` constructor's prototype.
function Pool_PG() {
  this.client = client;
  Pool.apply(this, arguments);
}
inherits(Pool_PG, Pool);

// Assign the newly extended `Pool` constructor to the client object.
client.Pool = Pool_PG;

};
},{"../../pool":52,"inherits":"oxw+vU"}],24:[function(_dereq_,module,exports){
// PostgreSQL Query Builder & Compiler
// ------
module.exports = function(client) {

var _        = _dereq_('lodash');
var inherits = _dereq_('inherits');

var QueryBuilder  = _dereq_('../../query/builder');
var QueryCompiler = _dereq_('../../query/compiler');

// Query Builder
// ------

function QueryBuilder_PG() {
  this.client = client;
  QueryBuilder.apply(this, arguments);
}
inherits(QueryBuilder_PG, QueryBuilder);

// Query Compiler
// ------

function QueryCompiler_PG() {
  this.formatter = new client.Formatter();
  QueryCompiler.apply(this, arguments);
}
inherits(QueryCompiler_PG, QueryCompiler);

// Compiles a truncate query.
QueryCompiler_PG.prototype.truncate = function() {
  return 'truncate ' + this.tableName + ' restart identity';
};

// Used when the insert call is empty.
QueryCompiler_PG.prototype._emptyInsertValue = 'default values';

// Compiles an `insert` query, allowing for multiple
// inserts using a single query statement.
QueryCompiler_PG.prototype.insert = function() {
  var sql = QueryCompiler.prototype.insert.call(this);
  var returning  = this.single.returning;
  return {
    sql: sql + this._returning(returning),
    returning: returning
  };
};

// Compiles an `update` query, allowing for a return value.
QueryCompiler_PG.prototype.update = function() {
  var updateData = this._prepUpdate(this.single.update);
  var wheres     = this.where();
  var returning  = this.single.returning;
  return {
    sql: 'update ' + this.tableName + ' set ' + updateData.join(', ') +
    (wheres ? ' ' + wheres : '') +
    this._returning(returning),
    returning: returning
  };
};

// Compiles an `update` query, allowing for a return value.
QueryCompiler_PG.prototype.del = function() {
  var sql = QueryCompiler.prototype.del.apply(this, arguments);
  var returning  = this.single.returning;
  return {
    sql: sql + this._returning(returning),
    returning: returning
  };
};

QueryCompiler_PG.prototype._returning = function(value) {
  return value ? ' returning ' + this.formatter.columnize(value) : '';
};

QueryCompiler_PG.prototype.forUpdate = function() {
  return 'for update';
};
QueryCompiler_PG.prototype.forShare = function() {
  return 'for share';
};

// Compiles a columnInfo query
QueryCompiler_PG.prototype.columnInfo = function() {
  var column = this.single.columnInfo;
  return {
    sql: 'select * from information_schema.columns where table_name = ? and table_catalog = ?',
    bindings: [this.single.table, client.database()],
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
};

client.QueryBuilder = QueryBuilder_PG;
client.QueryCompiler = QueryCompiler_PG;

};
},{"../../query/builder":54,"../../query/compiler":55,"inherits":"oxw+vU","lodash":"K2RcUv"}],25:[function(_dereq_,module,exports){
module.exports = function(client) {

var Raw = _dereq_('../../raw');
var inherits = _dereq_('inherits');

// Inherit from the `Raw` constructor's prototype,
// so we can add the correct `then` method.
function Raw_PG() {
  this.client = client;
  Raw.apply(this, arguments);
}
inherits(Raw_PG, Raw);

// Assign the newly extended `Raw` constructor to the client object.
client.Raw = Raw_PG;

};
},{"../../raw":58,"inherits":"oxw+vU"}],26:[function(_dereq_,module,exports){
module.exports = function(client) {

var _        = _dereq_('lodash');
var inherits = _dereq_('inherits');
var Promise  = _dereq_('../../promise');

var Runner = _dereq_('../../runner');
var utils  = _dereq_('../../utils');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_PG() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_PG, Runner);

var PGQueryStream;
Runner_PG.prototype._stream = Promise.method(function(obj, stream, options) {
  PGQueryStream = PGQueryStream || _dereq_('pg-query-stream');
  var runner = this;
  var sql = obj.sql = utils.pgBindings(obj.sql);
  if (this.isDebugging()) this.debug(obj);
  return new Promise(function(resolver, rejecter) {
    stream.on('error', rejecter);
    stream.on('end', resolver);
    runner.connection.query(new PGQueryStream(sql, obj.bindings, options)).pipe(stream);
  });
});

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Runner_PG.prototype._query = Promise.method(function(obj) {
  var connection = this.connection;
  var sql = obj.sql = utils.pgBindings(obj.sql);
  if (this.isDebugging()) this.debug(obj);
  if (obj.options) sql = _.extend({text: sql}, obj.options);
  return new Promise(function(resolver, rejecter) {
    connection.query(sql, obj.bindings, function(err, response) {
      if (err) return rejecter(err);
      obj.response = response;
      resolver(obj);
    });
  });
});

// Ensures the response is returned in the same format as other clients.
Runner_PG.prototype.processResponse = function(obj) {
  var resp = obj.response;
  if (obj.output) return obj.output.call(this, resp);
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
      if (returning === '*' || _.isArray(returning)) {
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
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_PG;

};
},{"../../promise":53,"../../runner":59,"../../utils":69,"inherits":"oxw+vU","lodash":"K2RcUv"}],27:[function(_dereq_,module,exports){
// PostgreSQL Column Builder & Compiler
// -------
module.exports = function(client) {

var inherits = _dereq_('inherits');
var Schema   = _dereq_('../../../schema');

// Column Builder
// ------

function ColumnBuilder_PG() {
  this.client = client;
  Schema.ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_PG, Schema.ColumnBuilder);

function ColumnCompiler_PG() {
  this.modifiers = ['nullable', 'defaultTo', 'comment'];
  this.Formatter = client.Formatter;
  Schema.ColumnCompiler.apply(this, arguments);
}
inherits(ColumnCompiler_PG, Schema.ColumnCompiler);

// Types
// ------
ColumnCompiler_PG.prototype.bigincrements = 'bigserial primary key';
ColumnCompiler_PG.prototype.bigint = 'bigint';
ColumnCompiler_PG.prototype.binary = 'bytea';
ColumnCompiler_PG.prototype.bit = function(column) {
  return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
};
ColumnCompiler_PG.prototype.bool = 'boolean';

// Create the column definition for an enum type.
// Using method "2" here: http://stackoverflow.com/a/10984951/525714
ColumnCompiler_PG.prototype.enu = function(allowed) {
  return 'text check (' + this.args[0] + " in ('" + allowed.join("', '")  + "'))";
};

ColumnCompiler_PG.prototype.double = 'double precision',
ColumnCompiler_PG.prototype.floating = 'real',
ColumnCompiler_PG.prototype.increments = 'serial primary key',
ColumnCompiler_PG.prototype.json = function() {
  if (!client.version || parseFloat(client.version) >= 9.2) return 'json';
  return 'text';
};
ColumnCompiler_PG.prototype.smallint =
ColumnCompiler_PG.prototype.tinyint = 'smallint';
ColumnCompiler_PG.prototype.datetime =
ColumnCompiler_PG.prototype.timestamp = function(without) {
  return without ? 'timestamp' : 'timestamptz';
};
ColumnCompiler_PG.prototype.uuid = 'uuid';

// Modifiers:
// ------
ColumnCompiler_PG.prototype.comment = function(comment) {
  this.pushAdditional(function() {
    this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' +
      this.formatter.wrap(this.args[0]) + " is " + (comment ? "'" + comment + "'" : 'NULL'));
  }, comment);
};

client.ColumnBuilder = ColumnBuilder_PG;
client.ColumnCompiler = ColumnCompiler_PG;

};
},{"../../../schema":64,"inherits":"oxw+vU"}],28:[function(_dereq_,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"./column":27,"./schema":29,"./table":30}],29:[function(_dereq_,module,exports){
// PostgreSQL Schema Builder & Compiler
// -------
module.exports = function(client) {

var inherits = _dereq_('inherits');
var Schema   = _dereq_('../../../schema');

// Schema Builder
// -------

function SchemaBuilder_PG() {
  this.client = client;
  Schema.Builder.apply(this, arguments);
}
inherits(SchemaBuilder_PG, Schema.Builder);

// Schema Compiler
// -------

function SchemaCompiler_PG() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.Compiler.apply(this, arguments);
}
inherits(SchemaCompiler_PG, Schema.Compiler);

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

client.SchemaBuilder = SchemaBuilder_PG;
client.SchemaCompiler = SchemaCompiler_PG;

};
},{"../../../schema":64,"inherits":"oxw+vU"}],30:[function(_dereq_,module,exports){
// PostgreSQL Table Builder & Compiler
// -------
module.exports = function(client) {

var _        = _dereq_('lodash');
var inherits = _dereq_('inherits');
var Schema   = _dereq_('../../../schema');

// Table
// ------

function TableBuilder_PG() {
  this.client = client;
  Schema.TableBuilder.apply(this, arguments);
}
inherits(TableBuilder_PG, Schema.TableBuilder);

function TableCompiler_PG() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_PG, Schema.TableCompiler);

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
TableCompiler_PG.prototype.createQuery = function(columns) {
  this.pushQuery({
    sql: 'create table ' + this.tableName() + ' (' + columns.sql.join(', ') + ')',
    bindings: columns.bindings
  });
  var hasComment = _.has(this.single, 'comment');
  if (hasComment) this.comment(this.single.comment);
};

// Compiles the comment on the table.
TableCompiler_PG.prototype.comment = function(comment) {
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
TableCompiler_PG.prototype.index = function(columns, indexName) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('create index ' + indexName + ' on ' + this.tableName() +
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

client.TableBuilder = TableBuilder_PG;
client.TableCompiler = TableCompiler_PG;

};
},{"../../../schema":64,"inherits":"oxw+vU","lodash":"K2RcUv"}],31:[function(_dereq_,module,exports){
module.exports = function(client) {

var inherits = _dereq_('inherits');
var Transaction = _dereq_('../../transaction');

function Transaction_PG() {
  this.client = client;
  Transaction.apply(this, arguments);
}
inherits(Transaction_PG, Transaction);

client.Transaction = Transaction_PG;

};
},{"../../transaction":68,"inherits":"oxw+vU"}],32:[function(_dereq_,module,exports){
(function (Buffer){

// convert a JS array to a postgres array literal
// uses comma separator so won't work for types like box that use
// a different array separator.
function arrayString(val) {
  var result = '{';
  for (var i = 0 ; i < val.length; i++) {
    if(i > 0) {
      result = result + ',';
    }
    if(val[i] === null || typeof val[i] === 'undefined') {
      result = result + 'NULL';
    }
    else if(Array.isArray(val[i])) {
      result = result + arrayString(val[i]);
    }
    else
    {
      result = result + JSON.stringify(prepareValue(val[i]));
    }
  }
  result = result + '}';
  return result;
}

//converts values from javascript types
//to their 'raw' counterparts for use as a postgres parameter
//note: you can override this function to provide your own conversion mechanism
//for complex types, etc...
var prepareValue = function(val, seen) {
  if (val instanceof Buffer) {
    return val;
  }
  if(val instanceof Date) {
    return dateToString(val);
  }
  if(Array.isArray(val)) {
    return arrayString(val);
  }
  if(val === null || typeof val === 'undefined') {
    return null;
  }
  if(typeof val === 'object') {
    return prepareObject(val, seen);
  }
  return val.toString();
};

function prepareObject(val, seen) {
  if(val.toPostgres && typeof val.toPostgres === 'function') {
    seen = seen || [];
    if (seen.indexOf(val) !== -1) {
      throw new Error('circular reference detected while preparing "' + val + '" for query');
    }
    seen.push(val);

    return prepareValue(val.toPostgres(prepareValue), seen);
  }
  return JSON.stringify(val);
}

function dateToString(date) {
  function pad(number, digits) {
    number = ""+number;
    while(number.length < digits)
      number = "0"+number;
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

  if(offset < 0) {
    ret += "-";
    offset *= -1;
  }
  else
    ret += "+";

  return ret + pad(Math.floor(offset/60), 2) + ":" + pad(offset%60, 2);
}

function normalizeQueryConfig (config, values, callback) {
  //can take in strings or config objects
  config = (typeof(config) == 'string') ? { text: config } : config;
  if(values) {
    if(typeof values === 'function') {
      config.callback = values;
    } else {
      config.values = values;
    }
  }
  if(callback) {
    config.callback = callback;
  }
  return config;
}

module.exports = {
  prepareValue: prepareValue,
  normalizeQueryConfig: normalizeQueryConfig
};

}).call(this,_dereq_("buffer").Buffer)
},{"buffer":"cTGqya"}],33:[function(_dereq_,module,exports){
// SQLite3 Formatter
// -------
module.exports = function(client) {

var Formatter = _dereq_('../../formatter');
var inherits  = _dereq_('inherits');

// The "formatter" is used to ensure all output is properly
// escaped & parameterized.
function Formatter_SQLite3() {
  this.client = client;
  Formatter.apply(this, arguments);
}
inherits(Formatter_SQLite3, Formatter);

Formatter_SQLite3.prototype.operators = [
  '=', '<', '>', '<=', '>=', '<>', '!=',
  'like', 'not like', 'between', 'ilike',
  '&', '|', '<<', '>>'
];

// Wraps a value (column, tableName) with the correct ticks.
Formatter_SQLite3.prototype.wrapValue = function(value) {
  return (value !== '*' ? '"' + value + '"' : '*');
};

// Memoize the calls to "wrap" for a little extra perf.
var wrapperMemo = (function(){
  var memo = Object.create(null);
  return function(key) {
    if (memo[key] === void 0) {
      memo[key] = this._wrapString(key);
    }
    return memo[key];
  };
}());

Formatter_SQLite3.prototype._wrap = wrapperMemo;

// Assign the formatter to the the client.
client.Formatter = Formatter_SQLite3;

};
},{"../../formatter":48,"inherits":"oxw+vU"}],34:[function(_dereq_,module,exports){
// SQLite3
// -------

var inherits = _dereq_('inherits');

var Client  = _dereq_('../../client');
var Promise = _dereq_('../../promise');

function Client_SQLite3(config) {
  Client.apply(this, arguments);
  if (config.debug) this.isDebugging = true;
  if (config.connection) {
    this.initDriver();
    this.initRunner();
    this.connectionSettings = config.connection;
    this.initPool();
    this.pool = new this.Pool(config.pool);
  }
  // Todo: Plugins here possibly??
}
inherits(Client_SQLite3, Client);

// Lazy load the sqlite3 module, since we might just be using
// the client to generate SQL strings.
var sqlite3;

Client_SQLite3.prototype.dialect = 'sqlite3',

Client_SQLite3.prototype.initTransaction = function() {
  _dereq_('./transaction')(this);
};

Client_SQLite3.prototype.initFormatter = function() {
  _dereq_('./formatter')(this);
};

// Lazy-load the sqlite3 dependency.
Client_SQLite3.prototype.initDriver = function() {
  sqlite3 = sqlite3 || _dereq_('sqlite3');
};

// Initialize the raw connection on the client.
Client_SQLite3.prototype.initRaw = function() {
  _dereq_('./raw')(this);
};

// Always initialize with the "Query" and "QueryCompiler"
// objects, each of which is unique to this client (and thus)
// can be altered without messing up anything for anyone else.
Client_SQLite3.prototype.initQuery = function() {
  _dereq_('./query')(this);
};

// Initializes a new pool instance for the current client.
Client_SQLite3.prototype.initPool = function() {
  _dereq_('./pool')(this);
};

// Initialize the query "runner"
Client_SQLite3.prototype.initRunner = function() {
  _dereq_('./runner')(this);
};

// Lazy-load the schema dependencies.
Client_SQLite3.prototype.initSchema = function() {
  _dereq_('./schema')(this);
};

// Lazy-load the migration dependency
Client_SQLite3.prototype.initMigrator = function() {
  _dereq_('./migrator')(this);
};

// Get a raw connection from the database, returning a promise with the connection object.
Client_SQLite3.prototype.acquireRawConnection = function() {
  var driver = this;
  return new Promise(function(resolve, reject) {
    var db = new sqlite3.Database(driver.connectionSettings.filename, function(err) {
      if (err) return reject(err);
      resolve(db);
    });
  });
};

// Used to explicitly close a connection, called internally by the pool
// when a connection times out or the pool is shutdown.
Client_SQLite3.prototype.destroyRawConnection = Promise.method(function(connection) {
  connection.close();
});

module.exports = Client_SQLite3;
},{"../../client":2,"../../promise":53,"./formatter":33,"./migrator":35,"./pool":36,"./query":37,"./raw":38,"./runner":39,"./schema":42,"./transaction":45,"inherits":"oxw+vU"}],35:[function(_dereq_,module,exports){
module.exports = function(client) {

var Migrator = _dereq_('../../migrate');
var inherits = _dereq_('inherits');

// Inherit from the `Migrator` constructor's prototype,
// so we can add the correct `then` method.
function Migrator_SQLite3() {
  this.client = client;
  Migrator.apply(this, arguments);
}
inherits(Migrator_SQLite3, Migrator);

// Assign the newly extended `Migrator` constructor to the client object.
client.Migrator = Migrator_SQLite3;

};
},{"inherits":"oxw+vU"}],36:[function(_dereq_,module,exports){
module.exports = function(client) {

var Pool     = _dereq_('../../pool');
var inherits = _dereq_('inherits');
var _        = _dereq_('lodash');

// Inherit from the `Pool` constructor's prototype.
function Pool_SQLite3() {
  this.client = client;
  Pool.apply(this, arguments);
}
inherits(Pool_SQLite3, Pool);

Pool_SQLite3.prototype.defaults = function() {
  return _.extend(Pool.prototype.defaults.call(this), {
    max: 1,
    min: 1,
    destroy: function(client) { client.close(); }
  });
};

// Assign the newly extended `Pool` constructor to the client object.
client.Pool = Pool_SQLite3;

};
},{"../../pool":52,"inherits":"oxw+vU","lodash":"K2RcUv"}],37:[function(_dereq_,module,exports){
// SQLite3 Query Builder & Compiler
// -------
module.exports = function(client) {

var _        = _dereq_('lodash');
var inherits = _dereq_('inherits');

var QueryBuilder  = _dereq_('../../query/builder');
var QueryCompiler = _dereq_('../../query/compiler');

// Query Builder
// -------
function QueryBuilder_SQLite3() {
  this.client = client;
  QueryBuilder.apply(this, arguments);
}
inherits(QueryBuilder_SQLite3, QueryBuilder);

// Query Compiler
// -------
function QueryCompiler_SQLite3() {
  this.formatter = new client.Formatter();
  QueryCompiler.apply(this, arguments);
}
inherits(QueryCompiler_SQLite3, QueryCompiler);

// The locks are not applicable in SQLite3
QueryCompiler_SQLite3.prototype.forShare =
QueryCompiler_SQLite3.prototype.forUpdate = function() {
  return '';
};

// SQLite requires us to build the multi-row insert as a listing of select with
// unions joining them together. So we'll build out this list of columns and
// then join them all together with select unions to complete the queries.
QueryCompiler_SQLite3.prototype.insert = function() {
  var insert = this.single.insert;
  var sql = 'insert into ' + this.tableName + ' ';
  if (_.isEmpty(this.single.insert)) return sql + 'default values';
  var insertData = this._prepInsert(insert);
  sql += '(' + this.formatter.columnize(insertData.columns) + ')';
  if (insertData.values.length === 1) {
    return sql + ' values (' + this.formatter.parameterize(insertData.values[0]) + ')';
  }
  var blocks = [];
  for (var i = 0, l = insertData.values.length; i < l; i++) {
    var block = blocks[i] = [];
    var current = insertData.values[i];
    for (var i2 = 0, l2 = insertData.columns.length; i2 < l2; i2++) {
      block.push(this.formatter.parameter(current[i2]) + ' as ' + this.formatter.wrap(insertData.columns[i2]));
    }
    blocks[i] = block.join(', ');
  }
  return sql + ' select ' + blocks.join(' union all select ');
};

// Adds a `order by` clause to the query, using "collate nocase" for the sort.
QueryCompiler_SQLite3.prototype.order = function() {
  var orders = this.grouped.order;
  if (!orders) return '';
  return 'order by ' + _.map(orders, function(order) {
    var cols = _.isArray(order.value) ? order.value : [order.value];
    return this.formatter.columnize(cols) + ' collate nocase ' + this.formatter.direction(order.direction);
  }, this).join(', ');
};

// Compiles an `update` query.
QueryCompiler_SQLite3.prototype.update = function() {
  var updateData = this._prepUpdate(this.single.update);
  var joins      = this.join();
  var wheres     = this.where();
  return 'update ' + this.tableName +
    (joins ? ' ' + joins : '') +
    ' set ' + updateData.join(', ') +
    (wheres ? ' ' + wheres : '');
};

// Compile a truncate table statement into SQL.
QueryCompiler_SQLite3.prototype.truncate = function() {
  var table = this.tableName;
  return {
    sql: 'delete from sqlite_sequence where name = ' + this.tableName,
    output: function() {
      return this.query({sql: 'delete from ' + table});
    }
  };
};

// Compiles a `columnInfo` query
QueryCompiler_SQLite3.prototype.columnInfo = function() {
  var column = this.single.columnInfo;
  return {
    sql: 'PRAGMA table_info(' + this.single.table +')',
    output: function(resp) {
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
};

client.QueryBuilder = QueryBuilder_SQLite3;
client.QueryCompiler = QueryCompiler_SQLite3;

};
},{"../../query/builder":54,"../../query/compiler":55,"inherits":"oxw+vU","lodash":"K2RcUv"}],38:[function(_dereq_,module,exports){
// Raw
// -------
module.exports = function(client) {

var Raw = _dereq_('../../raw');
var inherits = _dereq_('inherits');

// Inherit from the `Raw` constructor's prototype,
// so we can add the correct `then` method.
function Raw_SQLite3() {
  this.client = client;
  Raw.apply(this, arguments);
}
inherits(Raw_SQLite3, Raw);

// Assign the newly extended `Raw` constructor to the client object.
client.Raw = Raw_SQLite3;

};
},{"../../raw":58,"inherits":"oxw+vU"}],39:[function(_dereq_,module,exports){
// Runner
// -------
module.exports = function(client) {

var _        = _dereq_('lodash');
var Promise  = _dereq_('../../promise');
var Runner   = _dereq_('../../runner');
var helpers  = _dereq_('../../helpers');

var inherits = _dereq_('inherits');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_SQLite3() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_SQLite3, Runner);

Runner_SQLite3.prototype._beginTransaction = 'begin transaction;';

// Runs the query on the specified connection, providing the bindings and any other necessary prep work.
Runner_SQLite3.prototype._query = Promise.method(function(obj) {
  var method = obj.method;
  if (this.isDebugging()) this.debug(obj);
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
  var connection = this.connection;
  return new Promise(function(resolver, rejecter) {
    if (!connection || !connection[callMethod]) {
      return rejecter(new Error('Error calling ' + callMethod + ' on connection.'));
    }
    connection[callMethod](obj.sql, obj.bindings, function(err, response) {
      if (err) return rejecter(err);
      obj.response = response;

      // We need the context here, as it contains
      // the "this.lastID" or "this.changes"
      obj.context  = this;
      return resolver(obj);
    });
  });
});

// Sounds like .each doesn't work great for
Runner_SQLite3.prototype._stream = Promise.method(function(sql, stream, options) {
  var runner = this;
  return new Promise(function(resolver, rejecter) {
    stream.on('error', rejecter);
    stream.on('end', resolver);
    return runner.query(sql).map(function(row) {
      stream.write(row);
    }).catch(function(err) {
      stream.emit('error', err);
    }).then(function() {
      stream.end();
    });
  });
});

// Ensures the response is returned in the same format as other clients.
Runner_SQLite3.prototype.processResponse = function(obj) {
  var ctx      = obj.context;
  var response = obj.response;
  if (obj.output) return obj.output.call(this, response);
  switch (obj.method) {
    case 'select':
    case 'pluck':
    case 'first':
      response = helpers.skim(response);
      if (obj.method === 'pluck') response = _.pluck(response, obj.pluck);
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
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_SQLite3;

};

},{"../../helpers":49,"../../promise":53,"../../runner":59,"inherits":"oxw+vU","lodash":"K2RcUv"}],40:[function(_dereq_,module,exports){
// SQLite3: Column Builder & Compiler
// -------
module.exports = function(client) {

var inherits = _dereq_('inherits');
var Schema   = _dereq_('../../../schema');

// Column Builder
// -------

function ColumnBuilder_SQLite3() {
  this.client = client;
  Schema.ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_SQLite3, Schema.ColumnBuilder);

// Column Compiler
// -------

function ColumnCompiler_SQLite3() {
  this.modifiers = ['nullable', 'defaultTo'];
  this.Formatter = client.Formatter;
  Schema.ColumnCompiler.apply(this, arguments);
}
inherits(ColumnCompiler_SQLite3, Schema.ColumnCompiler);

// Types
// -------

ColumnCompiler_SQLite3.prototype.double =
ColumnCompiler_SQLite3.prototype.decimal =
ColumnCompiler_SQLite3.prototype.floating = 'float';
ColumnCompiler_SQLite3.prototype.timestamp = 'datetime';

client.ColumnBuilder = ColumnBuilder_SQLite3;
client.ColumnCompiler = ColumnCompiler_SQLite3;

};
},{"../../../schema":64,"inherits":"oxw+vU"}],41:[function(_dereq_,module,exports){
// SQLite3_DDL
//
// All of the SQLite3 specific DDL helpers for renaming/dropping
// columns and changing datatypes.
// -------
module.exports = function(client) {

var _       = _dereq_('lodash');
var Promise = _dereq_('../../../promise');

// So altering the schema in SQLite3 is a major pain.
// We have our own object to deal with the renaming and altering the types
// for sqlite3 things.
function SQLite3_DDL(runner, tableCompiler, pragma) {
  this.tableCompiler = tableCompiler;
  this.pragma = pragma;
  this.runner = runner;
  this.formatter = new client.Formatter;
  this.tableName = this.tableCompiler.tableNameRaw;
  this.alteredName = '_knex_temp_alter' + _.uniqueId();
}

SQLite3_DDL.prototype.getColumn = Promise.method(function(column) {
  var currentCol = _.findWhere(this.pragma, {name: column});
  if (!currentCol) throw new Error('The column ' + column + ' is not in the ' + this.tableName + ' table');
  return currentCol;
});

SQLite3_DDL.prototype.ensureTransaction = Promise.method(function() {
  if (!this.runner.transaction) {
    return this.runner.query({sql: 'begin transaction;'});
  }
});

SQLite3_DDL.prototype.commitTransaction = Promise.method(function() {
  return this.runner.commitTransaction();
});

SQLite3_DDL.prototype.rollbackTransaction = function(e) {
  return this.runner.rollbackTransaction().then(function() {
    throw e;
  });
};

SQLite3_DDL.prototype.getTableSql = function() {
  return this.runner.query({sql: 'SELECT name, sql FROM sqlite_master WHERE type="table" AND name="' + this.tableName + '"'});
};

SQLite3_DDL.prototype.renameTable = Promise.method(function() {
  return this.runner.query({sql: 'ALTER TABLE "' + this.tableName + '" RENAME TO "' + this.alteredName + '"'});
});

SQLite3_DDL.prototype.dropOriginal = function() {
  return this.runner.query({sql: 'DROP TABLE "' + this.tableName + '"'});
};

SQLite3_DDL.prototype.dropTempTable = function() {
  return this.runner.query({sql: 'DROP TABLE "' + this.alteredName + '"'});
};

SQLite3_DDL.prototype.copyData = function() {
  return this.runner.query({sql: 'SELECT * FROM "' + this.tableName + '"'})
    .bind(this)
    .then(this.insertChunked(20, this.alteredName));
};

SQLite3_DDL.prototype.reinsertData = function(iterator) {
  return function() {
    return this.runner.query({sql: 'SELECT * FROM "' + this.alteredName + '"'})
      .bind(this)
      .then(this.insertChunked(20, this.tableName, iterator));
  };
};

SQLite3_DDL.prototype.insertChunked = function(amount, target, iterator) {
  iterator = iterator || function(noop) { return noop; };
  return function(result) {
    var batch = [];
    var ddl = this;
    return Promise.reduce(result, function(memo, row) {
      memo++;
      if (memo % 20 === 0 || memo === result.length) {
        return new client.QueryBuilder()
          .connection(ddl.runner.connection)
          .table(target)
          .insert(_.map(batch, iterator))
          .then(function() { batch = []; })
          .thenReturn(memo);
      }
      batch.push(row);
      return memo;
    }, 0);
  };
};

SQLite3_DDL.prototype.createTempTable = function(createTable) {
  return function() {
    return this.runner.query({sql: createTable.sql.replace(this.tableName, this.alteredName)});
  };
};

// Boy, this is quite a method.
SQLite3_DDL.prototype.renameColumn = Promise.method(function(from, to) {
  var currentCol;
  return this.getColumn(from)
    .bind(this)
    .tap(function(col) { currentCol = col; })
    .then(this.ensureTransaction)
    .then(this.getTableSql)
    .then(function(sql) {
      var createTable = sql[0];
      var a = this.formatter.wrap(from) + ' ' + currentCol.type;
      var b = this.formatter.wrap(to)   + ' ' + currentCol.type;
      if (createTable.sql.indexOf(a) === -1) {
        throw new Error('Unable to find the column to change');
      }
      return Promise.bind(this)
      .then(this.createTempTable(createTable))
      .then(this.copyData)
      .then(this.dropOriginal)
      .then(function() {
        return this.runner.query({sql: createTable.sql.replace(a, b)});
      })
      .then(this.reinsertData(function(row) {
        row[to] = row[from];
        return _.omit(row, from);
      }))
      .then(this.dropTempTable);
    })
    .tap(this.commitTransaction)
    .catch(this.rollbackTransaction);
});

SQLite3_DDL.prototype.dropColumn = Promise.method(function(column) {
   var currentCol;
   return this.getColumn(column)
    .bind(this)
    .tap(function(col) { currentCol = col; })
    .then(this.ensureTransaction)
    .then(this.getTableSql)
    .then(function(sql) {
      var createTable = sql[0];
      var a = this.formatter.wrap(column) + ' ' + currentCol.type + ', ';
      if (createTable.sql.indexOf(a) === -1) {
        throw new Error('Unable to find the column to change');
      }
      return Promise.bind(this)
        .then(this.createTempTable(createTable))
        .then(this.copyData)
        .then(this.dropOriginal)
        .then(function() {
          return this.runner.query({sql: createTable.sql.replace(a, '')});
        })
        .then(this.reinsertData(function(row) {
          return _.omit(row, column);
        }))
        .then(this.dropTempTable);
    })
    .tap(this.commitTransaction)
    .catch(this.rollbackTransaction);
});

client.SQLite3_DDL = SQLite3_DDL;

};
},{"../../../promise":53,"lodash":"K2RcUv"}],42:[function(_dereq_,module,exports){
module.exports = function(client) {
  _dereq_('./ddl')(client);
  _dereq_('./schema')(client);
  _dereq_('./table')(client);
  _dereq_('./column')(client);
};
},{"./column":40,"./ddl":41,"./schema":43,"./table":44}],43:[function(_dereq_,module,exports){
// SQLite3: Column Builder & Compiler
// -------
module.exports = function(client) {

var _        = _dereq_('lodash');
var inherits = _dereq_('inherits');
var Schema   = _dereq_('../../../schema');

// Schema Builder
// -------

function SchemaBuilder_SQLite3() {
  this.client = client;
  Schema.Builder.apply(this, arguments);
}
inherits(SchemaBuilder_SQLite3, Schema.Builder);

// Schema Compiler
// -------

function SchemaCompiler_SQLite3() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.Compiler.apply(this, arguments);
}
inherits(SchemaCompiler_SQLite3, Schema.Compiler);

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
      return _.findWhere(resp, {name: column}) != null;
    }
  });
};

// Compile a rename table command.
SchemaCompiler_SQLite3.prototype.renameTable = function(from, to) {
  this.pushQuery('alter table ' + this.formatter.wrap(from) + ' rename to ' + this.formatter.wrap(to));
};

client.SchemaBuilder = SchemaBuilder_SQLite3;
client.SchemaCompiler = SchemaCompiler_SQLite3;

};
},{"../../../schema":64,"inherits":"oxw+vU","lodash":"K2RcUv"}],44:[function(_dereq_,module,exports){
// SQLite3: Column Builder & Compiler
// -------
module.exports = function(client) {

var _        = _dereq_('lodash');
var inherits = _dereq_('inherits');
var Schema   = _dereq_('../../../schema');

// Table Builder
// -------

function TableBuilder_SQLite3() {
  this.client = client;
  Schema.TableBuilder.apply(this, arguments);
}
inherits(TableBuilder_SQLite3, Schema.TableBuilder);

// Table Compiler
// -------

function TableCompiler_SQLite3() {
  this.client = client;
  this.Formatter = client.Formatter;
  this.SQLite3_DDL = client.SQLite3_DDL;
  this.primaryKey = void 0;
  Schema.TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_SQLite3, Schema.TableCompiler);

// Create a new table.
TableCompiler_SQLite3.prototype.createQuery = function(columns) {
  var sql = 'create table ' + this.tableName() + ' (' + columns.sql.join(', ');

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
  if (this.method !== 'create') {
    console.warn('SQLite3 Foreign & Primary keys may only be added on create');
  }
};

TableCompiler_SQLite3.prototype.primaryKeys = function() {
  var pks = _.where(this.grouped.alterTable || [], {method: 'primary'});
  if (pks.length > 0 && pks[0].args.length > 0) {
    return ', primary key (' + this.formatter.columnize(pks[0].args) + ')';
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
      return new compiler.SQLite3_DDL(this, compiler, pragma).renameColumn(from, to);
    }
  });
};

TableCompiler_SQLite3.prototype.dropColumn = function(column) {
  var compiler = this;
  this.pushQuery({
    sql: 'PRAGMA table_info(' + this.tableName() + ')',
    output: function(pragma) {
      return new compiler.SQLite3_DDL(this, compiler, pragma).dropColumn(column);
    }
  });
};

client.TableBuilder = TableBuilder_SQLite3;
client.TableCompiler = TableCompiler_SQLite3;

};
},{"../../../schema":64,"inherits":"oxw+vU","lodash":"K2RcUv"}],45:[function(_dereq_,module,exports){
// SQLite3 Transaction
// -------
module.exports = function(client) {

var inherits = _dereq_('inherits');
var Transaction = _dereq_('../../transaction');

function Transaction_SQLite3() {
  this.client = client;
  Transaction.apply(this, arguments);
}
inherits(Transaction_SQLite3, Transaction);

client.Transaction = Transaction_SQLite3;

};
},{"../../transaction":68,"inherits":"oxw+vU"}],46:[function(_dereq_,module,exports){
// WebSQL
// -------
var inherits = _dereq_('inherits');
var _        = _dereq_('lodash');

var Client_SQLite3 = _dereq_('../sqlite3/index');
var Promise = _dereq_('../../promise');

function Client_WebSQL(config) {
  config = config || {};
  Client_SQLite3.super_.apply(this, arguments);
  if (config.debug) this.isDebugging = true;
  this.name = config.name || 'knex_database';
  this.initDriver();
  this.initRunner();
}
inherits(Client_WebSQL, Client_SQLite3);

Client_WebSQL.prototype.dialect = 'websql',
Client_WebSQL.prototype.initDriver = function() {};
Client_WebSQL.prototype.initPool = function() {};
Client_WebSQL.prototype.initMigrator = function() {};

// Initialize the query "runner"
Client_WebSQL.prototype.initRunner = function() {
  _dereq_('./runner')(this);
};

// Get a raw connection from the database, returning a promise with the connection object.
Client_WebSQL.prototype.acquireConnection = function() {
  var client = this;
  return new Promise(function(resolve, reject) {
    try {
      var db = openDatabase(client.name, '1.0', client.name, 65536);
      db.transaction(function(t) {
        t.__cid = _.uniqueId('__cid');
        resolve(t);
      });
    } catch (e) {
      reject(e);
    }
  });
};

// Used to explicitly close a connection, called internally by the pool
// when a connection times out or the pool is shutdown.
Client_WebSQL.prototype.releaseConnection = Promise.method(function(connection) {});

module.exports = Client_WebSQL;
},{"../../promise":53,"../sqlite3/index":34,"./runner":47,"inherits":"oxw+vU","lodash":"K2RcUv"}],47:[function(_dereq_,module,exports){
// Runner
// -------
module.exports = function(client) {

var Promise  = _dereq_('../../promise');

// Require the SQLite3 Runner.
_dereq_('../sqlite3/runner')(client);
var Runner_SQLite3 = client.Runner;

var inherits = _dereq_('inherits');
var _        = _dereq_('lodash');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_WebSQL() {
  Runner_SQLite3.apply(this, arguments);
}
inherits(Runner_WebSQL, Runner_SQLite3);

// Runs the query on the specified connection, providing the bindings and any other necessary prep work.
Runner_WebSQL.prototype._query = Promise.method(function(obj) {
  if (this.isDebugging()) this.debug(obj);
  var connection = this.connection;
  return new Promise(function(resolver, rejecter) {
    if (!connection) {
      return rejecter(new Error('No connection provided.'));
    }
    connection.executeSql(obj.sql, obj.bindings, function(trx, response) {
      obj.response = response;
      return resolver(obj);
    }, function(trx, err) {
      console.error(err);
      rejecter(err);
    });
  });
});

// Ensures the response is returned in the same format as other clients.
Runner_WebSQL.prototype.processResponse = function(obj) {
  var resp = obj.response;
  if (obj.output) return obj.output.call(this, response);
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
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_WebSQL;

};
},{"../../promise":53,"../sqlite3/runner":39,"inherits":"oxw+vU","lodash":"K2RcUv"}],48:[function(_dereq_,module,exports){
// Mixed into the query compiler & schema pieces. Assumes a `grammar`
// property exists on the current object.
var _            = _dereq_('lodash');
var QueryBuilder = _dereq_('./query/builder');

var Raw  = _dereq_('./raw');
var push = Array.prototype.push;

// Valid values for the `order by` clause generation.
var orderBys  = ['asc', 'desc'];

// A "formatter" instance is used to both determine how wrap, bind, and
// parameterize values within a query, keeping track of all bindings
// added to the query. This allows us to easily keep track of raw statements
// arbitrarily added to queries.
function Formatter() {
  this.bindings = [];
}

// Turns a list of values into a list of ?'s, joining them with commas unless
// a "joining" value is specified (e.g. ' and ')
Formatter.prototype.parameterize = function(values) {
  if (_.isFunction(values)) return this.parameter(values);
  values = _.isArray(values) ? values : [values];
  return _.map(values, this.parameter, this).join(', ');
};

// Checks whether a value is a function... if it is, we compile it
// otherwise we check whether it's a raw
Formatter.prototype.parameter = function(value) {
  if (_.isFunction(value)) {
    return this.outputQuery(this.compileCallback(value), true);
  }
  return this.checkRaw(value, true) || '?';
};

Formatter.prototype.checkRaw = function(value, parameter) {
  if (value instanceof QueryBuilder) {
    var query = value.toSQL();
    if (query.bindings) push.apply(this.bindings, query.bindings);
    return this.outputQuery(query);
  }
  if (value instanceof Raw) {
    if (value.bindings) push.apply(this.bindings, value.bindings);
    return value.sql;
  }
  if (parameter) this.bindings.push(value);
};

Formatter.prototype.rawOrFn = function(value, method) {
  if (_.isFunction(value)) {
    return this.outputQuery(this.compileCallback(value, method));
  }
  return this.checkRaw(value) || '';
};

// Puts the appropriate wrapper around a value depending on the database
// engine, unless it's a knex.raw value, in which case it's left alone.
Formatter.prototype.wrap = function(value) {
  var raw;
  if (_.isFunction(value)) {
    return this.outputQuery(this.compileCallback(value), true);
  }
  if (raw = this.checkRaw(value)) return raw;
  if (_.isNumber(value)) return value;
  return this._wrap(value + '');
};

// Coerce to string to prevent strange errors when it's not a string.
Formatter.prototype._wrapString = function(value) {
  var segments, asIndex = value.toLowerCase().indexOf(' as ');
  if (asIndex !== -1) {
    var first  = value.slice(0, asIndex);
    var second = value.slice(asIndex + 4);
    return this.wrap(first) + ' as ' + this.wrap(second);
  }
  var wrapped = [];
  segments = value.split('.');
  for (var i = 0, l = segments.length; i < l; i = ++i) {
    value = segments[i];
    if (i === 0 && segments.length > 1) {
      wrapped.push(this.wrap(value));
    } else {
      wrapped.push(this.wrapValue(value));
    }
  }
  return wrapped.join('.');
};

// Accepts a string or array of columns to wrap as appropriate.
Formatter.prototype.columnize = function(target) {
  var columns = (_.isString(target) ? [target] : target);
  return _.map(columns, this.wrap, this).join(', ');
};

// The operator method takes a value and returns something or other.
Formatter.prototype.operator = function(value) {
  var raw;
  if (raw = this.checkRaw(value)) return raw;
  if (!_.contains(this.operators, (value || '').toLowerCase())) {
    throw new TypeError('The operator "' + value + '" is not permitted');
  }
  return value;
};

// Specify the direction of the ordering.
Formatter.prototype.direction = function(value) {
  var raw;
  if (raw = this.checkRaw(value)) return raw;
  return _.contains(orderBys, (value || '').toLowerCase()) ? value : 'asc';
};

// Compiles a callback using the query builder.
Formatter.prototype.compileCallback = function(callback, method) {
  var client = this.client;

  // Build the callback
  var builder  = new client.QueryBuilder();
  callback.call(builder, builder);

  // Compile the callback, using the current formatter (to track all bindings).
  var compiler = new client.QueryCompiler(builder);
  compiler.formatter = this;

  // Return the compiled & parameterized sql.
  return compiler.toSQL(method || 'select');
};

// Ensures the query is aliased if necessary.
Formatter.prototype.outputQuery = function(compiled, alwaysWrapped) {
  var sql = compiled.sql || '';
  if (sql) {
    if (compiled.method === 'select' && alwaysWrapped || compiled.as) {
      sql = '(' + sql + ')';
      if (compiled.as) sql += ' as ' + this.wrap(compiled.as);
    }
  }
  return sql;
};

module.exports = Formatter;
},{"./query/builder":54,"./raw":58,"lodash":"K2RcUv"}],49:[function(_dereq_,module,exports){
// helpers.js
// -------

// Just some common functions needed in multiple places within the library.
var _ = _dereq_('lodash');

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
    if (_.isArray(args[0])) {
      return args[0];
    }
    return args;
  },

  // Used to signify deprecated functionality.
  deprecate: function(msg) {
    this.warn(msg);
  },

  // Used to warn about incorrect use, without error'ing
  warn: function(msg) {
    if (typeof console !== "undefined" && console !== null &&
      typeof console.warn === "function") {
      console.warn("Knex: " + msg);
    }
  },

  // Sort the keys for the insert
  sortObject: function(obj) {
    return _.sortBy(_.pairs(obj), function(a) {
      return a[0];
    });
  }

};

module.exports = helpers;
},{"lodash":"K2RcUv"}],50:[function(_dereq_,module,exports){
module.exports = function(Target) {
var _ = _dereq_('lodash');
var SqlString = _dereq_('./dialects/mysql/string');

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
Target.prototype.then = function(onFulfilled, onRejected) {
  var Runner = this.client.Runner;
  return new Runner(this).run().then(onFulfilled, onRejected);
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
Target.prototype.debug = function(val) {
  this._debug = (val == null ? true : val);
  return this;
};

// Set the transaction object for this query.
Target.prototype.transacting = function(t) {
  this._transacting = t;
  return this;
};

// Initializes a stream.
Target.prototype.stream = function(options) {
  var Runner = this.client.Runner;
  return new Runner(this).stream(options);
};

// Initialize a stream & pipe automatically.
Target.prototype.pipe = function(writable) {
  var Runner = this.client.Runner;
  return new Runner(this).pipe(writable);
};

// Creates a method which "coerces" to a promise, by calling a
// "then" method on the current `Target`
_.each(['bind', 'catch', 'spread', 'otherwise', 'map', 'reduce', 'tap', 'thenReturn',
  'return', 'yield', 'ensure', 'nodeify', 'exec'], function(method) {
  Target.prototype[method] = function() {
    var then = this.then();
    return then[method].apply(then, arguments);
  };
});

};
},{"./dialects/mysql/string":16,"lodash":"K2RcUv"}],51:[function(_dereq_,module,exports){
module.exports = ['make', 'latest', 'rollback', 'currentVersion'];
},{}],52:[function(_dereq_,module,exports){
// Pool
// -------
var _           = _dereq_('lodash');
var GenericPool = _dereq_('generic-pool-redux').Pool;
var Promise     = _dereq_('./promise');

// The "Pool" object is a thin wrapper around the
// "generic-pool-redux" library, exposing a `destroy`
// method for explicitly draining the pool. The
// `init` method is called internally and initializes
// the pool if it doesn't already exist.
var Pool = function(config) {
  this.config = _.clone(config) || {};
  this.genericPool = this.initialize();
};

// Typically only called internally, this initializes
// a new `GenericPool` instance, based on the `config`
// options passed into the constructor.
Pool.prototype.initialize = function() {
  return new GenericPool(_.defaults(this.config, _.result(this, 'defaults')));
};

// Some basic defaults for the pool...
Pool.prototype.defaults = function() {
  var pool = this;
  return {
    min: 2,
    max: 10,
    create: function(callback) {
      pool.client.acquireRawConnection()
        .tap(function(connection) {
          connection.__cid = _.uniqueId('__cid');
          if (pool.config.afterCreate) {
            return Promise.promisify(pool.config.afterCreate)(connection);
          }
        }).exec(callback);
    },
    destroy: function(connection) {
      if (pool.config.beforeDestroy) {
        return pool.config.beforeDestroy(connection, function() {
          connection.end();
        });
      }
      connection.end();
    }
  };
};

// Acquires a connection from the pool.
Pool.prototype.acquire = function(callback, priority) {
  if (this.genericPool) {
    this.genericPool.acquire(callback, priority);
  } else {
    callback(new Error('The genericPool is not initialized.'));
  }
};

// Release a connection back to the connection pool.
Pool.prototype.release = function(connection, callback) {
  if (this.genericPool) {
    this.genericPool.release(connection, callback);
  } else {
    callback(new Error('The genericPool is not initialized.'));
  }
};

// Tear down the pool, only necessary if you need it.
Pool.prototype.destroy = function(callback) {
  var genericPool = this.genericPool;
  if (genericPool) {
    genericPool.drain(function() {
      genericPool.destroyAllNow(callback);
    });
    this.genericPool = void 0;
  } else {
    callback();
  }
  return this;
};

module.exports = Pool;
},{"./promise":53,"lodash":"K2RcUv"}],53:[function(_dereq_,module,exports){
var Promise = _dereq_('bluebird');

Promise.prototype.yield     = Promise.prototype.thenReturn;
Promise.prototype.ensure    = Promise.prototype.lastly;
Promise.prototype.otherwise = Promise.prototype.caught;
Promise.prototype.exec      = Promise.prototype.nodeify;

module.exports = Promise;

},{"bluebird":"EjIH/G"}],54:[function(_dereq_,module,exports){
// Builder
// -------
var _            = _dereq_('lodash');
var inherits     = _dereq_('inherits');
var EventEmitter = _dereq_('events').EventEmitter;

var Raw          = _dereq_('../raw');
var helpers      = _dereq_('../helpers');

var JoinClause  = _dereq_('./joinclause');

// Typically called from `knex.builder`,
// start a new query building chain.
function QueryBuilder() {
  this._single     = {};
  this._statements = [];
  this._errors     = [];

  // Internal flags used in the builder.
  this._joinFlag  = 'inner';
  this._boolFlag  = 'and';

  this.and = this;
}
inherits(QueryBuilder, EventEmitter);

QueryBuilder.prototype.toString = function() {
  return this.toQuery();
};

// Convert the current query "toSQL"
QueryBuilder.prototype.toSQL = function() {
  var QueryCompiler = this.client.QueryCompiler;
  return new QueryCompiler(this).toSQL(this._method || 'select');
};

// Create a shallow clone of the current query builder.
// TODO: Test this!!
QueryBuilder.prototype.clone = function() {
  var cloned            = new this.constructor();
    cloned._method      = this._method;
    cloned._single      = _.clone(this._single);
    cloned._options     = _.clone(this._options);
    cloned._statements  = this._statements.slice();
    cloned._errors      = this._errors.slice();
    cloned._debug       = this._debug;
    cloned._transacting = this._transacting;
    cloned._connection  = this._connection;
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
  if (column == null) return this;
  this._statements.push({
    grouping: 'columns',
    value: helpers.normalizeArr.apply(null, arguments)
  });
  return this;
};

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
QueryBuilder.prototype.join = function(table, first, operator, second) {
  var i, args = new Array(arguments.length);
  for (i = 0; i < args.length; i++) {
    args[i] = arguments[i];
  }
  if (args.length === 5) {
    helpers.deprecate('The five argument join syntax is now deprecated, ' +
      'please check the docs and update your code.');
    return this._joinType(args[4]).join(table, first, operator, second);
  }
  var join;
  if (_.isFunction(first)) {
    if (args.length > 2) {
      helpers.deprecate('The [table, fn, type] join syntax is deprecated, ' +
        'please check the docs and update your code.');
      return this._joinType(args[2]).join(table, first);
    }
    join = new JoinClause(table, this._joinType());
    first.call(join, join);
  } else {
    join = new JoinClause(table, this._joinType());
    join.on.apply(join, args.slice(1));
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

// The where function can be used in several ways:
// The most basic is `where(key, value)`, which expands to
// where key = value.
QueryBuilder.prototype.where =
QueryBuilder.prototype.andWhere = function(column, operator, value) {

  // Check if the column is a function, in which case it's
  // a where statement wrapped in parens.
  if (_.isFunction(column)) {
    return this.whereWrapped(column);
  }

  // Allow a raw statement to be passed along to the query.
  if (column instanceof Raw) return this.whereRaw(column);

  // Allows `where({id: 2})` syntax.
  if (_.isObject(column)) return this._objectWhere(column);

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
      return this.whereIn(arguments[0], arguments[2], (checkOperator === 'not in'));
    }
    if (checkOperator === 'between' || checkOperator === 'not between') {
      return this.whereBetween(arguments[0], arguments[2], (checkOperator === 'not between'));
    }
  }

  // If the value is still null, check whether they're meaning
  // where value is null
  if (value === null) {

    // Check for .where(key, 'is', null) or .where(key, 'is not', 'null');
    if (checkOperator === 'is' || checkOperator === 'is not') {
      return this.whereNull(column, bool, (checkOperator === 'is not'));
    }
  }

  // Push onto the where statement stack.
  this._statements.push({
    grouping: 'where',
    type: 'whereBasic',
    column: column,
    operator: operator,
    value: value,
    bool: this._bool()
  });
  return this;
};
// Adds an `or where` clause to the query.
QueryBuilder.prototype.orWhere = function() {
  return this._bool('or').where.apply(this, arguments);
};

// Processes an object literal provided in a "where" clause.
QueryBuilder.prototype._objectWhere = function(obj) {
  var boolVal = this._bool();
  for (var key in obj) {
    this[boolVal + 'Where'](key, obj[key]);
  }
  return this;
};

// Adds a raw `where` clause to the query.
QueryBuilder.prototype.whereRaw =
QueryBuilder.prototype.andWhereRaw = function(sql, bindings) {
  var raw = (sql instanceof Raw ? sql : new Raw(sql, bindings));
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
    bool: this._bool()
  });
  return this;
};

// Adds a `where exists` clause to the query.
QueryBuilder.prototype.whereExists = function(callback, not) {
  not = this._not() || not;
  this._statements.push({
    grouping: 'where',
    type: 'whereExists',
    value: callback,
    not: not || false,
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
  return this.whereExists(callback, true);
};

// Adds a `or where not exists` clause to the query.
QueryBuilder.prototype.orWhereNotExists = function(callback) {
  return this._bool('or').whereExists(callback, true);
};

// Adds a `where in` clause to the query.
QueryBuilder.prototype.whereIn = function(column, values, not) {
  not = this._not() || not;
  this._statements.push({
    grouping: 'where',
    type: 'whereIn',
    column: column,
    value: values,
    not: not || false,
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
  return this.whereIn(column, values, true);
};

// Adds a `or where not in` clause to the query.
QueryBuilder.prototype.orWhereNotIn = function(column, values) {
  return this._bool('or').whereIn(column, values, true);
};

// Adds a `where null` clause to the query.
QueryBuilder.prototype.whereNull = function(column, not) {
  not = this._not() || not;
  this._statements.push({
    grouping: 'where',
    type: 'whereNull',
    column: column,
    not: not || false,
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
  return this.whereNull(column, ' is not null');
};

// Adds a `or where not null` clause to the query.
QueryBuilder.prototype.orWhereNotNull = function(column) {
  return this._bool('or').whereNull(column, ' is not null');
};

// Adds a `where between` clause to the query.
QueryBuilder.prototype.whereBetween = function(column, values, not) {
  if (!_.isArray(values)) {
    return this._errors.push(new Error('The second argument to whereBetween must be an array.'));
  }
  if (values.length !== 2) {
    return this._errors.push(new Error('You must specify 2 values for the whereBetween clause'));
  }
  not = this._not() || not;
  this._statements.push({
    grouping: 'where',
    type: 'whereBetween',
    column: column,
    value: values,
    not: not || false,
    bool: this._bool()
  });
  return this;
};

// Adds a `where not between` clause to the query.
QueryBuilder.prototype.whereNotBetween = function(column, values) {
  return this.whereBetween(column, values, true);
};

// Adds a `or where between` clause to the query.
QueryBuilder.prototype.orWhereBetween = function(column, values) {
  return this._bool('or').whereBetween(column, values);
};

// Adds a `or where not between` clause to the query.
QueryBuilder.prototype.orWhereNotBetween = function(column, values) {
  return this._bool('or').whereNotBetwen(column, values);
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
  var raw = (sql instanceof Raw ? sql : new Raw(sql, bindings));
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
  var raw = (sql instanceof Raw ? sql : new Raw(sql, bindings));
  this._statements.push({
    grouping: 'order',
    type: 'orderByRaw',
    value: raw
  });
  return this;
};

// Add a union statement to the query.
QueryBuilder.prototype.union = function(callback, wrap) {
  if (arguments.length > 1) {
    var args = new Array(arguments.length);
    for (var i = 0, l = args.length; i < l; i++) {
      args[i] = arguments[i];
      this.union(args[i]);
    }
    return this;
  }
  this._statements.push({
    grouping: 'union',
    clause: 'union',
    value: callback,
    wrap: wrap || false
  });
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
  var raw = (sql instanceof Raw ? sql : new Raw(sql, bindings));
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
  this._single.insert = values;
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
QueryBuilder.prototype.del =
QueryBuilder.prototype.delete = function(ret) {
  this._method = 'del';
  if (!_.isEmpty(ret)) this.returning(ret);
  return this;
};

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
_dereq_('../interface')(QueryBuilder);

module.exports = QueryBuilder;
},{"../helpers":49,"../interface":50,"../raw":58,"./joinclause":56,"events":"T9Wsc/","inherits":"oxw+vU","lodash":"K2RcUv"}],55:[function(_dereq_,module,exports){
// Query Compiler
// -------

var _       = _dereq_('lodash');
var helpers = _dereq_('../helpers');
var Raw     = _dereq_('../raw');

// The "QueryCompiler" takes all of the query statements which have been
// gathered in the "QueryBuilder" and turns them into a properly formatted / bound
// query string.
function QueryCompiler(queryBuilder) {
  this.method      = queryBuilder._method || 'select';
  this.options     = queryBuilder._options;
  this.single      = queryBuilder._single;
  this.transacting = queryBuilder._transacting;
  this.grouped     = _.groupBy(queryBuilder._statements, 'grouping');
  this.tableName   = this.single.table ? this.formatter.wrap(this.single.table) : '';
}

// Collapse the builder into a single object
QueryCompiler.prototype.toSQL = function(method) {
  var val = this[method]();
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
  return _.extend(defaults, val);
};

var components = [
  'columns', 'join', 'where', 'union', 'group',
  'having', 'order', 'limit', 'offset', 'lock'
];

// Compiles the `select` statement, or nested sub-selects
// by calling each of the component compilers, trimming out
// the empties, and returning a generated query string.
QueryCompiler.prototype.select = function() {
  var statements = [];
  for (var i = 0, l = components.length; i < l; i++) {
    var component = components[i];
    statements.push(this[component](this));
  }
  return _.compact(statements).join(' ');
};
QueryCompiler.prototype.first = QueryCompiler.prototype.select;
QueryCompiler.prototype.pluck = function() {
  return {
    sql: this.select(),
    pluck: this.single.pluck
  };
};

// Compiles an "insert" query, allowing for multiple
// inserts using a single query statement.
QueryCompiler.prototype.insert = function() {
  var sql = 'insert into ' + this.tableName + ' ';
  if (_.isEmpty(this.single.insert)) {
    sql += this._emptyInsertValue;
  } else {
    var insertData = this._prepInsert(this.single.insert);
    if (_.isString(insertData)) {
      sql += insertData;
    } else  {
      sql += '(' + this.formatter.columnize(insertData.columns) + ') values (' +
        _.map(insertData.values, this.formatter.parameterize, this.formatter).join('), (') + ')';
    }
  }
  return sql;
};

// Compiles the "update" query.
QueryCompiler.prototype.update = function() {
  obj = helpers.sortObject(obj);
  var vals = [];
  for (var i = 0; i < obj.length; i++) {
    var value = obj[i];
    vals.push(this.formatter.wrap(value[0]) + ' = ' + this.formatter.parameter(value[1]));
  }
  if (!_.isEmpty(ret)) this.returning(ret);
  return {
    grouping: 'update',
    columns: vals.join(', ')
  };
};

// Compiles the columns in the query, specifying if an item was distinct.
QueryCompiler.prototype.columns = function() {
  var distinct = false;
  if (this.onlyUnions()) return '';
  var columns = this.grouped.columns || [];
  var sql = [];
  if (columns) {
    for (var i = 0, l = columns.length; i < l; i++) {
      var stmt = columns[i];
      if (stmt.distinct) distinct = true;
      if (stmt.type === 'aggregate') {
        sql.push(this.aggregate(stmt));
      } else if (stmt.value && stmt.value.length > 0) {
        sql.push(this.formatter.columnize(stmt.value));
      }
    }
  }
  if (sql.length === 0) sql.push('*');
  return 'select ' + (distinct ? 'distinct ' : '') +
      (sql.join(', ') || '*') + (this.tableName ? ' from ' + this.tableName : '');
};

QueryCompiler.prototype.aggregate = function(stmt) {
  var val = stmt.value;
  var splitOn = val.toLowerCase().indexOf(' as ');
  // Allows us to speciy an alias for the aggregate types.
  if (splitOn !== -1) {
    var col = val.slice(0, splitOn);
    var alias = val.slice(splitOn + 4);
    return stmt.method + '(' + this.formatter.wrap(col) + ') as ' + this.formatter.wrap(alias);
  }
  return stmt.method + '(' + this.formatter.wrap(val) + ')';
};

// Compiles all each of the `join` clauses on the query,
// including any nested join queries.
QueryCompiler.prototype.join = function() {
  var joins = this.grouped.join;
  if (!joins) return '';
  var sql = [];
  for (var i = 0, l = joins.length; i < l; i++) {
    var stmt = joins[i];
    var str  = stmt.joinType + ' join ' + this.formatter.wrap(stmt.table);
    for (var i2 = 0, l2 = stmt.clauses.length; i2 < l2; i2++) {
      var clause = stmt.clauses[i2];
      if (i2 > 0) {
        str += ' ' + clause[1] + ' ';
      } else {
        str += ' on ';
      }
      str += this.formatter.wrap(clause[2]) + ' ' + this.formatter.operator(clause[3]) +
        ' ' + this.formatter.wrap(clause[4]);
    }
    sql.push(str);
  }
  return sql.length > 0 ? sql.join(' ') : '';
};

// Compiles all `where` statements on the query.
QueryCompiler.prototype.where = function() {
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
};

QueryCompiler.prototype.group = function() {
  return this._groupsOrders('group');
};
QueryCompiler.prototype.order = function() {
  return this._groupsOrders('order');
};

// Compiles the `having` statements.
QueryCompiler.prototype.having = function() {
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
      sql.push(str + this.formatter.checkRaw(s.value));
    }
  }
  return sql.length > 1 ? sql.join(' ') : '';
};

// Compile the "union" queries attached to the main query.
QueryCompiler.prototype.union = function() {
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
};

// If we haven't specified any columns or a `tableName`, we're assuming this
// is only being used for unions.
QueryCompiler.prototype.onlyUnions = function() {
  return (!this.grouped.columns && this.grouped.union && !this.tableName);
};

QueryCompiler.prototype.limit = function() {
  if (this.single.limit == void 0) return '';
  return 'limit ' + this.formatter.parameter(this.single.limit);
};

QueryCompiler.prototype.offset = function() {
  if (this.single.offset == void 0) return '';
  return 'offset ' + this.formatter.parameter(this.single.offset);
};

// Compiles a `delete` query.
QueryCompiler.prototype.del = function() {
  var wheres = this.where();
  return 'delete from ' + this.tableName +
    (wheres ? ' ' + wheres : '');
};

// Compiles a `truncate` query.
QueryCompiler.prototype.truncate = function() {
  return 'truncate ' + this.tableName;
};

// Compiles the "locks".
QueryCompiler.prototype.lock = function() {
  if (this.single.lock) {
    if (!this.transacting) {
      helpers.warn('You are attempting to perform a "lock" command outside of a transaction.');
    } else {
      return this[this.single.lock]();
    }
  }
};

// Compile the "counter".
QueryCompiler.prototype.counter = function() {
  var counter = this.single.counter;
  var toUpdate = {};
  toUpdate[counter.column] = new Raw(this.formatter.wrap(counter.column) +
    ' ' + (counter.symbol || '+') +
    ' ' + counter.amount);
  this.single.update = toUpdate;
  return this.update();
};

// Compiles the `order by` statements.
QueryCompiler.prototype._groupsOrders = function(type) {
  var items = this.grouped[type];
  if (!items) return '';
  var sql = [];
  for (var i = 0, l = items.length; i < l; i++) {
    var str, item = items[i];
    if (item.value instanceof Raw) {
      str = this.formatter.checkRaw(item.value);
    } else {
      str = this.formatter.columnize(item.value);
      if (type === 'order') {
        str += ' ' + this.formatter.direction(item.direction);
      }
    }
    sql.push(str);
  }
  return sql.length > 0 ? type + ' by ' + sql.join(', ') : '';
};

// Where Clause
// ------

QueryCompiler.prototype.whereIn = function(statement) {
  if (_.isArray(statement.column)) return this.multiWhereIn(statement);
  return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'in ') +
    this.wrap(this.formatter.parameterize(statement.value));
};

QueryCompiler.prototype.multiWhereIn = function(statement) {
  return '(' + _.map(statement.column, this.formatter.wrap, this.formatter) + ') ' +
    this._not(statement, 'in ') + '((' +
    _.map(statement.value, this.formatter.parameterize, this.formatter).join('),(') + '))';
};

QueryCompiler.prototype.whereNull = function(statement) {
  return this.formatter.wrap(statement.column) + ' is ' + this._not(statement, 'null');
};

// Compiles a basic "where" clause.
QueryCompiler.prototype.whereBasic = function(statement) {
  return this.formatter.wrap(statement.column) + ' ' +
    this.formatter.operator(statement.operator) + ' ' +
    this.formatter.parameter(statement.value);
};

QueryCompiler.prototype.whereExists = function(statement) {
  return this._not(statement, 'exists') + ' (' + this.formatter.rawOrFn(statement.value) + ')';
};

QueryCompiler.prototype.whereWrapped = function(statement) {
  return '(' + this.formatter.rawOrFn(statement.value, 'where').slice(6) + ')';
};

QueryCompiler.prototype.whereBetween = function(statement) {
  return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'between') + ' ' +
    _.map(statement.value, this.formatter.parameter, this.formatter).join(' and ');
};

// Compiles a "whereRaw" query.
QueryCompiler.prototype.whereRaw = function(statement) {
  return this.formatter.checkRaw(statement.value);
};

QueryCompiler.prototype.wrap = function(str) {
  if (str.charAt(0) !== '(') return '(' + str + ')';
  return str;
};

// Determines whether to add a "not" prefix to the where clause.
QueryCompiler.prototype._not = function(statement, str) {
  if (statement.not) return 'not ' + str;
  return str;
};

// "Preps" the insert.
QueryCompiler.prototype._prepInsert = function(data) {
  var isRaw = this.formatter.rawOrFn(data);
  if (isRaw) return isRaw;
  var values = [];
  var columns, colList;
  if (!_.isArray(data)) data = data ? [data] : [];
  for (var i = 0, l = data.length; i<l; i++) {
    var sorted = helpers.sortObject(data[i]);
    columns = _.pluck(sorted, 0);
    colList = colList || columns;
    if (!_.isEqual(columns, colList)) {
      return this._prepInsert(this._normalizeInsert(data));
    }
    values.push(_.pluck(sorted, 1));
  }
  return {
    columns: columns,
    values: values
  };
};

// If we are running an insert with variable object keys, we need to normalize
// for the missing keys, presumably setting the values to undefined.
QueryCompiler.prototype._normalizeInsert = function(data) {
  if (!_.isArray(data)) return _.clone(data);
  var defaultObj = _.reduce(_.union.apply(_, _.map(data, function(val) {
    return _.keys(val);
  })), function(memo, key) {
    memo[key] = void 0;
    return memo;
  }, {});
  return _.map(data, function(row) { return _.defaults(row, defaultObj); });
};

// "Preps" the update.
QueryCompiler.prototype._prepUpdate = function(data) {
  var vals = [];
  var sorted = helpers.sortObject(data);
  for (var i = 0, l = sorted.length; i < l; i++) {
    vals.push(this.formatter.wrap(sorted[i][0]) + ' = ' + this.formatter.parameter(sorted[i][1]));
  }
  return vals;
};

module.exports = QueryCompiler;

},{"../helpers":49,"../raw":58,"lodash":"K2RcUv"}],56:[function(_dereq_,module,exports){
// JoinClause
// -------

// The "JoinClause" is an object holding any necessary info about a join,
// including the type, and any associated tables & columns being joined.
function JoinClause(table, type) {
  this.table    = table;
  this.joinType = type;
  this.clauses  = [];
  this.and = this;
}

JoinClause.prototype.grouping = 'join';

// Adds an "on" clause to the current join object.
JoinClause.prototype.on = function(first, operator, second) {
  if (arguments.length === 2) {
    data = ['on', this._bool(), first, '=', operator];
  } else {
    data = ['on', this._bool(), first, operator, second];
  }
  this.clauses.push(data);
  return this;
};

// Adds an "and on" clause to the current join object.
JoinClause.prototype.andOn = function() {
  return this.on.apply(this, arguments);
};

// Adds an "or on" clause to the current join object.
JoinClause.prototype.orOn = function(first, operator, second) {
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
},{}],57:[function(_dereq_,module,exports){
// All properties we can use to start a query chain
// from the `knex` object, e.g. `knex.select('*').from(...`
module.exports = [
  'select',
  'as',
  'columns',
  'column',
  'from',
  'into',
  'table',
  'distinct',
  'join',
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
  'whereRaw',
  'whereWrapped',
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
},{}],58:[function(_dereq_,module,exports){
// Raw
// -------
var _ = _dereq_('lodash');
var inherits = _dereq_('inherits');
var EventEmitter = _dereq_('events').EventEmitter;

function Raw(sql, bindings) {
  if (sql && sql.toSQL) {
    var output = sql.toSQL();
    sql = output.sql;
    bindings = output.bindings;
  }
  this.sql = sql;
  this.bindings = _.isArray(bindings) ? bindings :
    bindings ? [bindings] : [];
  this._debug = void 0;
  this._transacting = void 0;
}
inherits(Raw, EventEmitter);

// Wraps the current sql with `before` and `after`.
Raw.prototype.wrap = function(before, after) {
  this.sql = before + this.sql + after;
  return this;
};

// Calls `toString` on the Knex object.
Raw.prototype.toString = function() {
  return this.toQuery();
};

// Returns the raw sql for the query.
Raw.prototype.toSQL = function() {
  return {
    sql: this.sql,
    method: 'raw',
    bindings: this.bindings
  };
};

// Allow the `Raw` object to be utilized with full access to the relevant
// promise API.
_dereq_('./interface')(Raw);

module.exports = Raw;
},{"./interface":50,"events":"T9Wsc/","inherits":"oxw+vU","lodash":"K2RcUv"}],59:[function(_dereq_,module,exports){
var _            = _dereq_('lodash');
var Promise      = _dereq_('./promise');

// The "Runner" constructor takes a "builder" (query, schema, or raw)
// and runs through each of the query statements, calling any additional
// "output" method provided alongside the query and bindings.
function Runner(builder) {
  this.builder = builder;
  this.queries = [];

  // The "connection" object is set on the runner when
  // "run" is called.
  this.connection = void 0;
}

Runner.prototype._beginTransaction = 'begin;';
Runner.prototype._commitTransaction = 'commit;';
Runner.prototype._rollbackTransaction = 'rollback;';

// "Run" the target, calling "toSQL" on the builder, returning
// an object or array of queries to run, each of which are run on
// a single connection.
Runner.prototype.run = Promise.method(function() {
  if (this.builder._transacting) {
    return this.transactionQuery();
  }
  return Promise.bind(this)
    .then(this.ensureConnection)
    .then(function(connection) {
      this.connection = connection;

      // Emit a "start" event on both the builder and the client,
      // allowing us to listen in on any events. We fire on the "client"
      // before building the SQL, and on the builder after building the SQL
      // in case we want to determine at how long it actually
      // took to build the query.
      this.client.emit('start', this.builder);
      var sql = this.builder.toSQL();
      this.builder.emit('start', this.builder);

      if (_.isArray(sql)) {
        return this.queryArray(sql);
      }
      return this.query(sql);
    })

    // If there are any "error" listeners, we fire an error event
    // and then re-throw the error to be eventually handled by
    // the promise chain. Useful if you're wrapping in a custom `Promise`.
    .catch(function(err) {
      if (this.builder._events && this.builder._events.error) {
        this.builder.emit('error', err);
      }
      throw err;
    })

    // Fire a single "end" event on the builder when
    // all queries have successfully completed.
    .tap(function() {
      this.builder.emit('end');
    })
    .finally(this.cleanupConnection);
});

// Stream the result set, by passing through to the dialect's streaming
// capabilities. If the options are
var PassThrough;
Runner.prototype.stream = function(options, handler) {
  // If we specify stream(handler).then(...
  if (arguments.length === 1) {
    if (_.isFunction(options)) {
      handler = options;
      options = {};
    }
  }

  // Determines whether we emit an error or throw here.
  var hasHandler = _.isFunction(handler);

  // Lazy-load the "PassThrough" dependency.
  PassThrough = PassThrough || _dereq_('readable-stream').PassThrough;
  var stream  = new PassThrough({objectMode: true});
  var promise = Promise.bind(this)
    .then(this.ensureConnection)
    .then(function(connection) {
      this.connection = connection;
      var sql = this.builder.toSQL();
      var err = new Error('The stream may only be used with a single query statement.');
      if (_.isArray(sql)) {
        if (hasHandler) throw err;
        stream.emit('error', err);
      }
      return sql;
    }).then(function(sql) {
      return this._stream(sql, stream, options);
    }).finally(this.cleanupConnection);

  // If a function is passed to handle the stream, send the stream
  // there and return the promise, otherwise just return the stream
  // and the promise will take care of itsself.
  if (hasHandler) {
    handler(stream);
    return promise;
  }
  return stream;
};

// Allow you to pipe the stream to a writable stream.
Runner.prototype.pipe = function(writable) {
  return this.stream().pipe(writable);
};

// "Runs" a query, returning a promise. All queries specified by the builder are guaranteed
// to run in sequence, and on the same connection, especially helpful when schema building
// and dealing with foreign key constraints, etc.
Runner.prototype.query = Promise.method(function(obj) {
  obj.__cid = this.connection.__cid;
  this.builder.emit('query', obj);
  this.client.emit('query', obj);
  return this._query(obj).bind(this).then(this.processResponse);
});

// In the case of the "schema builder" we call `queryArray`, which runs each
// of the queries in sequence.
Runner.prototype.queryArray = Promise.method(function(queries) {
  return queries.length === 1 ? this.query(queries[0]) : Promise.bind(this)
    .thenReturn(queries)
    .reduce(function(memo, query) {
      return this.query(query).then(function(resp) {
        memo.push(resp);
        return memo;
      });
    }, []);
});

// Check whether there's a transaction flag, and that it has a connection.
Runner.prototype.ensureConnection = Promise.method(function() {
  if (this.builder._connection) {
    return this.builder._connection;
  }
  return this.client.acquireConnection();
});

// "Debug" the query being run.
Runner.prototype.debug = function(obj) {
  console.dir(_.extend({__cid: this.connection.__cid}, obj));
};

// Check whether we're "debugging", based on either calling `debug` on the query.
Runner.prototype.isDebugging = function() {
  return (this.client.isDebugging === true || this.builder._debug === true);
};

// Transaction Methods:
// -------

// Run the transaction on the correct "runner" instance.
Runner.prototype.transactionQuery = Promise.method(function() {
  var runner = this.builder._transacting._runner;
  if (!(runner instanceof Runner)) {
    throw new Error('Invalid transaction object provided.');
  }
  var sql = this.builder.toSQL();
  if (_.isArray(sql)) {
    return runner.queryArray(sql);
  }
  return runner.query(sql);
});

// Begins a transaction statement on the instance,
// resolving with the connection of the current transaction.
Runner.prototype.startTransaction = Promise.method(function() {
  return Promise.bind(this)
    .then(this.ensureConnection)
    .then(function(connection) {
      this.connection  = connection;
      this.transaction = true;
      return this.query({sql: this._beginTransaction});
    }).thenReturn(this);
});

// Finishes the transaction statement and handles disposing of the connection,
// resolving / rejecting the transaction's promise, and ensuring the transaction object's
// `_runner` property is `null`'ed out so it cannot continue to be used.
Runner.prototype.finishTransaction = Promise.method(function(action, containerObject, msg) {
  var query, dfd = containerObject.__dfd__;

  // Run the query to commit / rollback the transaction.
  switch (action) {
    case 0:
      query = this.commitTransaction();
      break;
    case 1:
      query = this.rollbackTransaction();
      break;
  }

  return query.then(function(resp) {
    msg = (msg === void 0) ? resp : msg;
    switch (action) {
      case 0:
        dfd.fulfill(msg);
        break;
      case 1:
        dfd.reject(msg);
        break;
    }

  // If there was a problem committing the transaction,
  // reject the transaction block (to reject the entire transaction block),
  // then re-throw the error for any promises chained off the commit.
  }).catch(function(e) {
    dfd.reject(e);
    throw e;
  }).bind(this).finally(function() {

    // Kill the "_runner" object on the containerObject,
    // so it's not possible to continue using the transaction object.
    containerObject._runner = void 0;

    return this.cleanupConnection();
  });
});

Runner.prototype.commitTransaction = function() {
  return this.query({sql: this._commitTransaction});
};
Runner.prototype.rollbackTransaction = function() {
  return this.query({sql: this._rollbackTransaction});
};

// Cleanup the connection as necessary, if the `_connection` was
// explicitly set on the query we don't need to do anything here,
// otherwise we
Runner.prototype.cleanupConnection = Promise.method(function() {
  if (!this.builder._connection) {
    return this.client.releaseConnection(this.connection);
  }
});

module.exports = Runner;
},{"./promise":53,"lodash":"K2RcUv"}],60:[function(_dereq_,module,exports){
var _            = _dereq_('lodash');
var inherits     = _dereq_('inherits');
var EventEmitter = _dereq_('events').EventEmitter;

// Constructor for the builder instance, typically called from
// `knex.builder`, accepting the current `knex` instance,
// and pulling out the `client` and `grammar` from the current
// knex instance.
function SchemaBuilder() {
  this._sequence = [];
  this._errors = [];
}
inherits(SchemaBuilder, EventEmitter);

// Each of the schema builder methods just add to the
// "_sequence" array for consistency.
_.each([
  'createTable', 'table', 'alterTable', 'hasTable', 'hasColumn',
  'dropTable', 'renameTable', 'dropTableIfExists', 'raw', 'debug'
], function(method) {
  SchemaBuilder.prototype[method] = function() {
    if (method === 'table') method = 'alterTable';
    this._sequence.push({
      method: method,
      args: _.toArray(arguments)
    });
    return this;
  };
});

SchemaBuilder.prototype.toString = function() {
  return this.toQuery();
};

SchemaBuilder.prototype.toSQL = function() {
  var SchemaCompiler = this.client.SchemaCompiler;
  return new SchemaCompiler(this).toSQL();
};

_dereq_('../interface')(SchemaBuilder);

module.exports = SchemaBuilder;
},{"../interface":50,"events":"T9Wsc/","inherits":"oxw+vU","lodash":"K2RcUv"}],61:[function(_dereq_,module,exports){
var _ = _dereq_('lodash');

// Alias a few methods for clarity when processing.
var columnAlias = {
  'float'  : 'floating',
  'enum'   : 'enu',
  'boolean': 'bool',
  'string' : 'varchar',
  'bigint' : 'bigInteger'
};

// The chainable interface off the original "column" method.
function ColumnBuilder(tableBuilder, type, args) {
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

// All of the modifier methods that can be used to modify the current query.
var modifiers = [
  'defaultsTo', 'defaultTo', 'unsigned',
  'nullable', 'notNull', 'notNullable',
  'after', 'comment'
];

// Aliases for convenience.
var aliasMethod = {
  defaultsTo: 'defaultTo',
  notNull: 'notNullable'
};

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

module.exports = ColumnBuilder;
},{"lodash":"K2RcUv"}],62:[function(_dereq_,module,exports){
// Column Compiler
// Used for designating column definitions
// during the table "create" / "alter" statements.
// -------
var _ = _dereq_('lodash');
var Raw = _dereq_('../raw');

function ColumnCompiler(tableCompiler, columnBuilder) {
  this.tableCompiler = tableCompiler;
  this.columnBuilder = columnBuilder;
  this.args = columnBuilder._args;
  this.type = columnBuilder._type.toLowerCase();
  this.grouped = _.groupBy(columnBuilder._statements, 'grouping');
  this.modified = columnBuilder._modifiers;
  this.isIncrements = (this.type.indexOf('increments') !== -1);
  this.initCompiler();
}

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
  return _.isFunction(type) ? type.apply(this, _.rest(this.args)) : type;
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

ColumnCompiler.prototype.increments = 'integer not null primary key autoincrement';
ColumnCompiler.prototype.bigincrements = 'integer not null primary key autoincrement';
ColumnCompiler.prototype.integer =
ColumnCompiler.prototype.smallint =
ColumnCompiler.prototype.mediumint = 'integer';
ColumnCompiler.prototype.biginteger = 'bigint';
ColumnCompiler.prototype.varchar = function(length) {
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
  if (val == null) return fallback;
  var number = parseInt(val, 10);
  return isNaN(number) ? fallback : number;
};

module.exports = ColumnCompiler;
},{"../raw":58,"lodash":"K2RcUv"}],63:[function(_dereq_,module,exports){
// The "SchemaCompiler" takes all of the query statements which have been
// gathered in the "SchemaBuilder" and turns them into an array of
// properly formatted / bound query strings.
function SchemaCompiler(builder) {
  this.builder = builder;
  this.initCompiler();
}

function buildTable(type) {
  return function(tableName, fn) {
    var TableBuilder = this.client.TableBuilder;
    var sql = new TableBuilder(type, tableName, fn).toSQL();
    for (var i = 0, l = sql.length; i < l; i++) {
      this.sequence.push(sql[i]);
    }
  };
}

SchemaCompiler.prototype.createTable = buildTable('create');
SchemaCompiler.prototype.alterTable  = buildTable('alter');
SchemaCompiler.prototype.dropTable = function(tableName) {
  this.pushQuery('drop table ' + this.formatter.wrap(tableName));
};
SchemaCompiler.prototype.dropTableIfExists = function(tableName) {
  this.pushQuery('drop table if exists ' + this.formatter.wrap(tableName));
};
SchemaCompiler.prototype.toSQL = function() {
  var sequence = this.builder._sequence;
  for (var i = 0, l = sequence.length; i < l; i++) {
    var query = sequence[i];
    this[query.method].apply(this, query.args);
  }
  return this.sequence;
};
SchemaCompiler.prototype.raw = function(sql, bindings) {
  this.sequence.push(new this.client.Raw(sql, bindings).toSQL());
};

module.exports = SchemaCompiler;
},{}],64:[function(_dereq_,module,exports){
var _ = _dereq_('lodash');

var Builder = _dereq_('./builder');
var Compiler = _dereq_('./compiler');
var TableBuilder = _dereq_('./tablebuilder');
var TableCompiler = _dereq_('./tablecompiler');
var ColumnBuilder = _dereq_('./columnbuilder');
var ColumnCompiler = _dereq_('./columncompiler');

// Initialize the compiler.
Compiler.prototype.initCompiler =
TableCompiler.prototype.initCompiler =
ColumnCompiler.prototype.initCompiler = function() {
  this.formatter = new this.Formatter();
  this.sequence  = [];
};

// Push a new query onto the compiled "sequence" stack,
// creating a new formatter, returning the compiler.
Compiler.prototype.pushQuery =
TableCompiler.prototype.pushQuery =
ColumnCompiler.prototype.pushQuery = function(query) {
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
  this.formatter = new this.Formatter();
};

// Used in cases where we need to push some additional column specific statements.
ColumnCompiler.prototype.pushAdditional = function(fn) {
  var child = new this.constructor(this.tableCompiler, this.columnBuilder);
  fn.call(child, _.rest(arguments));
  this.sequence.additional = (this.sequence.additional || []).concat(child.sequence);
};

module.exports = {
  Builder: Builder,
  Compiler: Compiler,
  TableBuilder: TableBuilder,
  TableCompiler: TableCompiler,
  ColumnBuilder: ColumnBuilder,
  ColumnCompiler: ColumnCompiler
};
},{"./builder":60,"./columnbuilder":61,"./columncompiler":62,"./compiler":63,"./tablebuilder":66,"./tablecompiler":67,"lodash":"K2RcUv"}],65:[function(_dereq_,module,exports){
module.exports = ['table', 'createTable', 'editTable', 'dropTable',
  'dropTableIfExists',  'renameTable', 'hasTable', 'hasColumn', 'raw', 'debug'];
},{}],66:[function(_dereq_,module,exports){
// TableBuilder

// Takes the function passed to the "createTable" or "table/editTable"
// functions and calls it with the "TableBuilder" as both the context and
// the first argument. Inside this function we can specify what happens to the
// method, pushing everything we want to do onto the "allStatements" array,
// which is then compiled into sql.
// ------
var _ = _dereq_('lodash');

function TableBuilder(method, tableName, fn) {
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
  var TableCompiler = this.client.TableCompiler;
  return new TableCompiler(this).toSQL();
};

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
      warn('Knex only supports ' + method + ' statement with mysql.');
    } if (this.__method === 'alter') {
      warn('Knex does not support altering the ' + method + ' outside of the create table, please use knex.raw statement.');
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
    var ColumnBuilder = this.client.ColumnBuilder;
    var builder       = new ColumnBuilder(this, type, args);

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
};

module.exports = TableBuilder;
},{"lodash":"K2RcUv"}],67:[function(_dereq_,module,exports){
// Table Compiler
// -------
var _ = _dereq_('lodash');

var helpers = _dereq_('../helpers');

function TableCompiler(tableBuilder) {
  this.method         = tableBuilder._method;
  this.tableNameRaw   = tableBuilder._tableName;
  this.single         = tableBuilder._single;
  this.grouped        = _.groupBy(tableBuilder._statements, 'grouping');
  this.initCompiler();
}

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
TableCompiler.prototype.create = function() {
  var columns = this.getColumns();
  var columnTypes = this.getColumnTypes(columns);
  this.createQuery(columnTypes);
  this.columnQueries(columns);
  delete this.single.comment;
  this.alterTable();
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
  var compiledColumns = [], columns = this.grouped.columns || [];
  var ColumnCompiler = this.client.ColumnCompiler;
  for (var i = 0, l = columns.length; i < l; i++) {
    compiledColumns.push(new ColumnCompiler(this, columns[i].builder).toSQL());
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
    if (_.isFunction(this[item])) this[item](this.single[item]);
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
  var columns = helpers.normalizeArr.apply(null, arguments);
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
},{"../helpers":49,"lodash":"K2RcUv"}],68:[function(_dereq_,module,exports){
// Transaction
// -------
var Promise = _dereq_('./promise');
var inherits = _dereq_('inherits');
var EventEmitter = _dereq_('events').EventEmitter;

// Creates a new wrapper object for constructing a transaction.
// Called by the `knex.transaction`, which sets the correct client
// and handles the `container` object, passing along the correct
// `connection` to keep all of the transactions on the correct connection.
function Transaction(container) {
  this.container = container;
}
inherits(Transaction, EventEmitter);

// Build the knex instance passed around inside the transaction container.
// It can be used both as a fully functional knex instance, or assimilated
// into existing knex chains via the ".transacting" method call.
Transaction.prototype.containerObject = function(runner) {
  var Knex = _dereq_('../knex');

  // Create an entirely new knex instance just for this transaction
  var transactor = Knex.initialize({
    __client__     : this.client,
    __transactor__ : {_runner: runner}
  });

  // Remove the ability to start a transaction or destroy
  // the entire pool within a transaction.
  transactor.destroy = transactor.transaction = void 0;

  // Commits the transaction:
  transactor.commit = function(message) {
    runner.finishTransaction(0, transactor, message);
  };

  // Rolls back the transaction.
  transactor.rollback = function(error) {
    runner.finishTransaction(1, transactor, error);
  };

  transactor._runner = runner;

  return transactor;
};

Transaction.prototype.initiateDeferred = function(transactor) {

  // Initiate a deferred object, bound to the container object,
  // so we know when the transaction completes or fails
  // and can continue from there.
  var dfd = transactor.__dfd__ = Promise.pending();

  // Call the container with the transaction
  // commit & rollback objects.
  var result = this.container(transactor);

  // If we've returned a "thenable" from the transaction container,
  // and it's got the transaction object we're running for this, assume
  // the rollback and commit are chained to this object's success / failure.
  if (result && result.then && typeof result.then === 'function') {
    result.then(function(val) { transactor.commit(val); }).catch(function(err) { transactor.rollback(err); });
  }

  // Return the promise for the entire transaction.
  return dfd.promise;
};

// Allow the `Transaction` object to be utilized with full access to the relevant
// promise API.
_dereq_('./interface')(Transaction);

// Passed a `container` function, this method runs the current
// transaction, returning a promise.
Transaction.prototype.then = function(onFulfilled, onRejected) {
  var Runner = this.client.Runner;

  // Create a new "runner" object, passing the "runner"
  // object along, so we can easily keep track of every
  // query run on the current connection.
  return new Runner(this)
    .startTransaction()
    .bind(this)
    .then(this.containerObject)
    .then(this.initiateDeferred)
    .then(onFulfilled, onRejected)
    .bind();
};

module.exports = Transaction;
},{"../knex":1,"./interface":50,"./promise":53,"events":"T9Wsc/","inherits":"oxw+vU"}],69:[function(_dereq_,module,exports){
module.exports = {

  pgBindings: function(sql) {
    var questionCount = 0;
    return sql.replace(/\?/g, function() {
      questionCount++;
      return '$' + questionCount;
    });
  }

};
},{}]},{},[1])
(1)
});