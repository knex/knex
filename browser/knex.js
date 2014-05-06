require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"qi+vRg":[function(require,module,exports){
// Knex.js  0.6.0-alpha
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
var Raw = require('./lib/raw');

// Doing it this way makes it easier to build for browserify.
var mysql = function() { return require('./lib/dialects/mysql'); };
var pg = function() { return require('./lib/dialects/postgres'); };
var sqlite3 = function() { return require('./lib/dialects/sqlite3'); };
var websql = function() { return require('./lib/dialects/websql'); };

// The client names we'll allow in the `{name: lib}` pairing.
var Clients = Knex.Clients = {
  'mysql'      : mysql,
  'pg'         : pg,
  'postgres'   : pg,
  'postgresql' : pg,
  'sqlite'     : sqlite3,
  'sqlite3'    : sqlite3,
  'websql'     : websql
};

// Require lodash.
var _ = require('lodash');

// Each of the methods which may be statically chained from knex.
var QueryInterface = require('./lib/query/methods');

// Create a new "knex" instance with the appropriate configured client.
Knex.initialize = function(config) {
  var Dialect, client;
  var EventEmitter = require('events').EventEmitter;

  // The object we're potentially using to kick off an
  // initial chain. It is assumed that `knex` isn't a
  // constructor, so we have no reference to 'this' just
  // in case it's called with `new`.
  function knex(tableName) {
    var qb = new client.QueryBuilder;

    // Passthrough all "query" events to the knex object.
    qb.on('query', function(data) {
      knex.emit('query', data);
    });
    return tableName ? qb.table(tableName) : qb;
  }

  // Hook up the "knex" object as an EventEmitter.
  var ee = new EventEmitter();
  for (var key in ee) {
    knex[key] = ee[key];
  }

  // The `__knex__` is used if you need to duck-type check whether this
  // is a knex builder, without a full on `instanceof` check.
  knex.VERSION = knex.__knex__  = '0.6.0';
  knex.raw = function(sql, bindings) {
    var raw = new client.Raw(sql, bindings);
    raw.on('query', function(data) {
      knex.emit('query', data);
    });
    return raw;
  };

  // Runs a new transaction, taking a container and returning a promise
  // for when the transaction is resolved.
  knex.transaction = function(container) {
    var trx = new client.Transaction(container);
    trx.on('query', function(data) {
      knex.emit('query', data);
    });
    return trx;
  };

  // Build the "client"
  var clientName = config.client;
  if (!Clients[clientName]) {
    throw new Error(clientName + ' is not a valid Knex client, did you misspell it?');
  }
  Dialect = Clients[clientName]();
  client  = new Dialect(config);

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
  _.each(['table', 'createTable', 'editTable', 'dropTable',
    'dropTableIfExists',  'renameTable', 'hasTable', 'hasColumn'], function(key) {
    schema[key] = function() {
      if (!client.SchemaBuilder) client.initSchema();
      var builder = new client.SchemaBuilder();

      // Passthrough all "query" events to the knex object.
      builder.on('query', function(data) {
	knex.emit('query', data);
      });
      return builder[key].apply(builder, arguments);
    };
  });

  // Attach each of the `Migrator` "interface" methods directly onto to `knex.migrate` namespace, e.g.:
  // knex.migrate.latest().then(...
  // knex.migrate.currentVersion(...
  _.each(['make', 'latest', 'rollback', 'currentVersion'], function(method) {
    migrate[method] = function(config) {
      if (!client.Migrator) client.initMigrator();
      config.knex = knex;
      var migrator = new client.Migrator(config);
      return migrator[method].apply(migrator, arguments);
    };
  });

  // Add a few additional misc utils.
  knex.utils = _.extend({}, require('./lib/utils'));

  return knex;
};

module.exports = Knex;
},{"./lib/dialects/mysql":5,"./lib/dialects/postgres":17,"./lib/dialects/sqlite3":29,"./lib/dialects/websql":41,"./lib/query/methods":51,"./lib/raw":52,"./lib/utils":63,"events":64,"lodash":"K2RcUv"}],"knex":[function(require,module,exports){
module.exports=require('qi+vRg');
},{}],3:[function(require,module,exports){
// "Base Client"
// ------
var Promise    = require('./promise');

// The base client provides the general structure
// for a dialect specific client object. The client
// object attaches fresh constructors for each component
// of the library.
function Client() {
  this.initFormatter();
  this.initRaw();
  this.initTransaction();
  this.initQuery();
}

// Set the "isDebugging" flag on the client to "true" to log
// all queries run by the client.
Client.prototype.isDebugging = false;

// Internal flag to let us know this is a knex client,
// and what the version number is.
Client.prototype.__knex_client__ = '0.6.0';

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
},{"./promise":47}],4:[function(require,module,exports){
// MySQL Formatter
// ------
module.exports = function(client) {

var Formatter = require('../../formatter');
var inherits  = require('inherits');

// The "formatter" is used to ensure all output is properly
// escaped & parameterized.
function Formatter_MySQL() {
  this.client = client;
  Formatter.apply(this, arguments);
}
inherits(Formatter_MySQL, Formatter);

// Wraps a value (column, tableName) with the correct ticks.
Formatter_MySQL.prototype.wrapValue = function(value) {
  return (value !== '*' ? '`' + value + '`' : '*');
};

// Memoize the calls to "wrap" for a little extra perf.
var wrapperMemo = (function(){
  var memo = Object.create(null);
  return function(key) {
    if (memo.key === void 0) {
      memo[key] = this._wrapString(key);
    }
    return memo[key];
  };
}());

Formatter_MySQL.prototype._wrap = wrapperMemo;

// Assign the formatter to the the client.
client.Formatter = Formatter_MySQL;

};
},{"../../formatter":43,"inherits":68}],5:[function(require,module,exports){
// MySQL Client
// -------
var inherits = require('inherits');

var Client  = require('../../client');
var Promise = require('../../promise');

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
    this.connectionSettings = config.connection;
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
  mysql = mysql || require('mysql');
};

// Attach a `Formatter` constructor to the client object.
Client_MySQL.prototype.initFormatter = function() {
  require('./formatter')(this);
};

// Attaches the `Raw` constructor to the client object.
Client_MySQL.prototype.initRaw = function() {
  require('./raw')(this);
};

// Attaches the `Transaction` constructor to the client object.
Client_MySQL.prototype.initTransaction = function() {
  require('./transaction')(this);
};

// Attaches `QueryBuilder` and `QueryCompiler` constructors
// to the client object.
Client_MySQL.prototype.initQuery = function() {
  require('./query')(this);
};

// Initializes a new pool instance for the current client.
Client_MySQL.prototype.initPool = function() {
  require('./pool')(this);
};

// Initialize the query "runner"
Client_MySQL.prototype.initRunner = function() {
  require('./runner')(this);
};

// Lazy-load the schema dependencies; we may not need to use them.
Client_MySQL.prototype.initSchema = function() {
  require('./schema')(this);
};

// Lazy-load the migration dependency
Client_MySQL.prototype.initMigrator = function() {
  require('./migrator')(this);
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
},{"../../client":3,"../../promise":47,"./formatter":4,"./migrator":6,"./pool":7,"./query":8,"./raw":9,"./runner":10,"./schema":12,"./transaction":15,"inherits":68}],6:[function(require,module,exports){
// MySQL Migrator
// ------
module.exports = function(client) {

var Migrator = require('../../migrate');
var inherits = require('inherits');

function Migrator_MySQL() {
  Migrator.apply(this, arguments);
}
inherits(Migrator_MySQL, Migrator);

client.Migrator = Migrator_MySQL;

};
},{"inherits":68}],7:[function(require,module,exports){
// MySQL Pool
// ------
module.exports = function(client) {

var inherits = require('inherits');
var Pool = require('../../pool');

function Pool_MySQL() {
  this.client = client;
  Pool.apply(this, arguments);
}
inherits(Pool_MySQL, Pool);

client.Pool = Pool_MySQL;

};
},{"../../pool":46,"inherits":68}],8:[function(require,module,exports){
// MySQL Query Builder & Compiler
// ------
module.exports = function(client) {

var _             = require('lodash');
var inherits      = require('inherits');
var QueryBuilder  = require('../../query/builder');
var QueryCompiler = require('../../query/compiler');

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
  return {
    sql: 'select * from information_schema.columns where table_name = ? and table_schema = ?',
    bindings: [this.single.table, client.database()],
    output: function(resp) {
      return _.reduce(resp, function(columns, val) {
	columns[val.COLUMN_NAME] = {
	  defaultValue: val.COLUMN_DEFAULT,
	  type: val.DATA_TYPE,
	  maxLength: val.CHARACTER_MAXIMUM_LENGTH,
	  nullable: (val.IS_NULLABLE === 'YES')
	};
	return columns;
      }, {});
    }
  };
};

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
client.QueryBuilder  = QueryBuilder_MySQL;
client.QueryCompiler = QueryCompiler_MySQL;

};
},{"../../query/builder":48,"../../query/compiler":49,"inherits":68,"lodash":"K2RcUv"}],9:[function(require,module,exports){
// MySQL Raw
// -------
module.exports = function(client) {

var Raw = require('../../raw');
var inherits = require('inherits');

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
},{"../../raw":52,"inherits":68}],10:[function(require,module,exports){
// MySQL Runner
// ------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');

var Promise  = require('../../promise');
var Runner   = require('../../runner');
var helpers    = require('../../helpers');

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
  var resp;
  if (obj.output) {
    return obj.output.call(this, rows, fields);
  } else if (method === 'select') {
    resp = helpers.skim(rows);
  } else if (method === 'insert') {
    resp = [rows.insertId];
  } else if (method === 'del' || method === 'update') {
    resp = rows.affectedRows;
  } else {
    resp = response;
  }
  return resp;
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_MySQL;

};
},{"../../helpers":44,"../../promise":47,"../../runner":53,"inherits":68,"lodash":"K2RcUv"}],11:[function(require,module,exports){
// MySQL Column Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');
var helpers  = require('../../../helpers');

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
ColumnCompiler_MySQL.prototype.float = function(precision, scale) {
  return 'float(' + precision + ',' + scale + ')';
};
ColumnCompiler_MySQL.prototype.typeDecimal = function(precision, scale) {
  return 'decimal(' + precision + ', ' + scale + ')';
};
ColumnCompiler_MySQL.prototype.enu = function(allowed) {
  return "enum('" + allowed.join("', '")  + "')";
};
ColumnCompiler_MySQL.prototype.datetime = 'datetime';
ColumnCompiler_MySQL.prototype.timestamp = 'timestamp';
ColumnCompiler_MySQL.prototype.bit = function(length) {
  return length ? 'bit(' + length + ')' : 'bit';
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
  if (comment) {
    if (comment.length > 255) {
      helpers.warn('Your comment is longer than the max comment length for MySQL');
    }
    return "comment '" + comment + "'";
  }
};

client.ColumnBuilder = ColumnBuilder_MySQL;
client.ColumnCompiler = ColumnCompiler_MySQL;

};
},{"../../../helpers":44,"../../../schema":58,"inherits":68}],12:[function(require,module,exports){
module.exports = function(client) {
  require('./schema')(client);
  require('./table')(client);
  require('./column')(client);
};
},{"./column":11,"./schema":13,"./table":14}],13:[function(require,module,exports){
// MySQL Schema Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');

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
},{"../../../schema":58,"inherits":68}],14:[function(require,module,exports){
// MySQL Table Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');

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
TableCompiler_MySQL.prototype.dropIndex = function(key) {
  this.pushQuery('alter table ' + this.tableName() + ' drop index ' + key);
};

// Compile a drop foreign key command.
TableCompiler_MySQL.prototype.dropForeign = function(key) {
  this.pushQuery('alter table ' + this.tableName() + ' drop foreign key ' + key);
};

// Compile a drop primary key command.
TableCompiler_MySQL.prototype.dropPrimary = function() {
  this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
};

// Compile a drop unique key command.
TableCompiler_MySQL.prototype.dropUnique = function(key) {
  this.pushQuery('alter table ' + this.tableName() + ' drop index ' + key);
};

// Compile a foreign key command.
TableCompiler_MySQL.prototype.foreign = function(foreignData) {
  var sql = Schema.TableCompiler.prototype.foreign.apply(this, arguments);
  if (sql) {
    // Once we have the basic foreign key creation statement constructed we can
    // build out the syntax for what should happen on an update or delete of
    // the affected columns, which will get something like 'cascade', etc.
    if (foreignData.onDelete) sql += ' on delete ' + foreignData.onDelete;
    if (foreignData.onUpdate) sql += ' on update ' + foreignData.onUpdate;
    this.pushQuery(sql);
  }
};

client.TableBuilder = TableBuilder_MySQL;
client.TableCompiler = TableCompiler_MySQL;

};
},{"../../../schema":58,"inherits":68}],15:[function(require,module,exports){
// MySQL Transaction
// ------
module.exports = function(client) {

var inherits = require('inherits');
var Transaction = require('../../transaction');

function Transaction_MySQL() {
  this.client = client;
  Transaction.apply(this, arguments);
}
inherits(Transaction_MySQL, Transaction);

client.Transaction = Transaction_MySQL;

};
},{"../../transaction":62,"inherits":68}],16:[function(require,module,exports){
// PostgreSQL Formatter
// -------
module.exports = function(client) {

var Formatter = require('../../formatter');
var inherits  = require('inherits');

// The "formatter" is used to ensure all output is properly
// escaped & parameterized.
function Formatter_PG() {
  this.client = client;
  this.paramCount = 0;
  Formatter.apply(this, arguments);
}
inherits(Formatter_PG, Formatter);

// Wraps a value (column, tableName) with the correct ticks.
Formatter_PG.prototype.wrapValue = function(value) {
  return (value !== '*' ? '"' + value + '"' : '*');
};

// Memoize the calls to "wrap" for a little extra perf.
var wrapperMemo = (function(){
  var memo = Object.create(null);
  return function(key) {
    if (memo.key === void 0) {
      memo[key] = this._wrapString(key);
    }
    return memo[key];
  };
}());

Formatter_PG.prototype._wrap = wrapperMemo;

// Assign the formatter to the the client.
client.Formatter = Formatter_PG;

};
},{"../../formatter":43,"inherits":68}],17:[function(require,module,exports){
// PostgreSQL
// -------
var inherits = require('inherits');

var Client  = require('../../client');
var Promise = require('../../promise');

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
      return require('pg');
    } catch (e) {
      return require('pg.js');
    }
  })();
};

// Attach a `Formatter` constructor to the client object.
Client_PG.prototype.initFormatter = function() {
  require('./formatter')(this);
};

// Attaches the `Raw` constructor to the client object.
Client_PG.prototype.initRaw = function() {
  require('./raw')(this);
};

// Attaches the `Transaction` constructor to the client object.
Client_PG.prototype.initTransaction = function() {
  require('./transaction')(this);
};

// Attaches `QueryBuilder` and `QueryCompiler` constructors
// to the client object.
Client_PG.prototype.initQuery = function() {
  require('./query')(this);
};

// Initializes a new pool instance for the current client.
Client_PG.prototype.initPool = function() {
  require('./pool')(this);
};

// Initialize the query "runner"
Client_PG.prototype.initRunner = function() {
  require('./runner')(this);
};

// Lazy-load the schema dependencies; we may not need to use them.
Client_PG.prototype.initSchema = function() {
  require('./schema')(this);
};

// Lazy-load the migration dependency
Client_PG.prototype.initMigrator = function() {
  require('./migrator')(this);
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
},{"../../client":3,"../../promise":47,"./formatter":16,"./migrator":18,"./pool":19,"./query":20,"./raw":21,"./runner":22,"./schema":24,"./transaction":27,"inherits":68}],18:[function(require,module,exports){
module.exports = function(client) {

var Migrator = require('../../migrate');
var inherits = require('inherits');

// Inherit from the `Migrator` constructor's prototype,
// so we can add the correct `then` method.
function Migrator_PG() {
  Migrator.apply(this, arguments);
}
inherits(Migrator_PG, Migrator);

// Assign the newly extended `Migrator` constructor to the client object.
client.Migrator = Migrator_PG;

};
},{"inherits":68}],19:[function(require,module,exports){
module.exports = function(client) {

var Pool     = require('../../pool');
var inherits = require('inherits');

// Inherit from the `Pool` constructor's prototype.
function Pool_PG() {
  this.client = client;
  Pool.apply(this, arguments);
}
inherits(Pool_PG, Pool);

// Assign the newly extended `Pool` constructor to the client object.
client.Pool = Pool_PG;

};
},{"../../pool":46,"inherits":68}],20:[function(require,module,exports){
// PostgreSQL Query Builder & Compiler
// ------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');

var QueryBuilder  = require('../../query/builder');
var QueryCompiler = require('../../query/compiler');

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
  return {
    sql: 'select * from information_schema.columns where table_name = ? and table_catalog = ?',
    bindings: [this.single.table, client.database()],
    output: function(resp) {
      return _.reduce(resp.rows, function(columns, val) {
	columns[val.column_name] = {
	  type: val.data_type,
	  maxLength: val.character_maximum_length,
	  nullable: (val.is_nullable === 'YES'),
	  defaultValue: val.column_default
	};
	return columns;
      }, {});
    }
  };
};

client.QueryBuilder = QueryBuilder_PG;
client.QueryCompiler = QueryCompiler_PG;

};
},{"../../query/builder":48,"../../query/compiler":49,"inherits":68,"lodash":"K2RcUv"}],21:[function(require,module,exports){
module.exports = function(client) {

var Raw = require('../../raw');
var inherits = require('inherits');

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
},{"../../raw":52,"inherits":68}],22:[function(require,module,exports){
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');
var Promise  = require('../../promise');

var Runner = require('../../runner');
var utils  = require('../../utils');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_PG() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_PG, Runner);

var PGQueryStream;
Runner_PG.prototype._stream = Promise.method(function(sql, stream, options) {
  PGQueryStream = PGQueryStream || require('pg-query-stream');
    var runner = this;
    return new Promise(function(resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      runner.connection.query(new PGQueryStream(sql.sql, sql.bindings, options)).pipe(stream);
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
  if (obj.output) return obj.output.call(this, obj.response);
  var resp = obj.response;
  var returning = obj.returning;
  if (resp.command === 'SELECT') return resp.rows;
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
},{"../../promise":47,"../../runner":53,"../../utils":63,"inherits":68,"lodash":"K2RcUv","pg-query-stream":69}],23:[function(require,module,exports){
// PostgreSQL Column Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');

// Column Builder
// ------

function ColumnBuilder_PG() {
  this.client = client;
  Schema.ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_PG, Schema.ColumnBuilder);

function ColumnCompiler_PG() {
  this.modifiers = ['nullable', 'defaultTo'];
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
ColumnCompiler_PG.prototype.bool = 'boolean',
ColumnCompiler_PG.prototype.datetime = 'timestamp',

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
ColumnCompiler_PG.prototype.timestamp = 'timestamp';
ColumnCompiler_PG.prototype.uuid = 'uuid';

// Modifiers:
// ------
ColumnCompiler_PG.prototype.comment = function(comment) {
  this.pushQuery('comment on column ' + this.tableName + '.' +
    this.formatter.wrap(this.args[0]) + " is " + (comment ? "'" + comment + "'" : 'NULL'));
};

client.ColumnBuilder = ColumnBuilder_PG;
client.ColumnCompiler = ColumnCompiler_PG;

};
},{"../../../schema":58,"inherits":68}],24:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"./column":23,"./schema":25,"./table":26}],25:[function(require,module,exports){
// PostgreSQL Schema Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');

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
},{"../../../schema":58,"inherits":68}],26:[function(require,module,exports){
// PostgreSQL Table Builder & Compiler
// -------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');
var Schema   = require('../../../schema');

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
  var hasComment = _.has(this._single, 'comment');
  if (hasComment) {
    this.pushQuery('comment on table ' + this.tableName() + ' is ' + "'" + this.attributes.comment + "'");
  }
};

// Compile a foreign key command.
TableCompiler_PG.prototype.foreign = function(foreignData) {
  var sql = Schema.TableCompiler.prototype.foreign.apply(this, arguments);
  if (sql) this.pushQuery(sql);
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
TableCompiler_PG.prototype.dropIndex = function(index) {
  this.pushQuery('drop index ' + index);
};
TableCompiler_PG.prototype.dropUnique = function(index) {
  this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + index);
};
TableCompiler_PG.prototype.dropForeign = function(index) {
  this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + index);
};

client.TableBuilder = TableBuilder_PG;
client.TableCompiler = TableCompiler_PG;

};
},{"../../../schema":58,"inherits":68,"lodash":"K2RcUv"}],27:[function(require,module,exports){
module.exports = function(client) {

var inherits = require('inherits');
var Transaction = require('../../transaction');

function Transaction_PG() {
  this.client = client;
  Transaction.apply(this, arguments);
}
inherits(Transaction_PG, Transaction);

client.Transaction = Transaction_PG;

};
},{"../../transaction":62,"inherits":68}],28:[function(require,module,exports){
// SQLite3 Formatter
// -------
module.exports = function(client) {

var Formatter = require('../../formatter');
var inherits  = require('inherits');

// The "formatter" is used to ensure all output is properly
// escaped & parameterized.
function Formatter_SQLite3() {
  this.client = client;
  Formatter.apply(this, arguments);
}
inherits(Formatter_SQLite3, Formatter);

// Wraps a value (column, tableName) with the correct ticks.
Formatter_SQLite3.prototype.wrapValue = function(value) {
  return (value !== '*' ? '"' + value + '"' : '*');
};

// Memoize the calls to "wrap" for a little extra perf.
var wrapperMemo = (function(){
  var memo = Object.create(null);
  return function(key) {
    if (memo.key === void 0) {
      memo[key] = this._wrapString(key);
    }
    return memo[key];
  };
}());

Formatter_SQLite3.prototype._wrap = wrapperMemo;

// Assign the formatter to the the client.
client.Formatter = Formatter_SQLite3;

};
},{"../../formatter":43,"inherits":68}],29:[function(require,module,exports){
// SQLite3
// -------

var inherits = require('inherits');

var Client  = require('../../client');
var Promise = require('../../promise');

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
  require('./transaction')(this);
};

Client_SQLite3.prototype.initFormatter = function() {
  require('./formatter')(this);
};

// Lazy-load the sqlite3 dependency.
Client_SQLite3.prototype.initDriver = function() {
  sqlite3 = sqlite3 || require('sqlite3');
};

// Initialize the raw connection on the client.
Client_SQLite3.prototype.initRaw = function() {
  require('./raw')(this);
};

// Always initialize with the "Query" and "QueryCompiler"
// objects, each of which is unique to this client (and thus)
// can be altered without messing up anything for anyone else.
Client_SQLite3.prototype.initQuery = function() {
  require('./query')(this);
};

// Initializes a new pool instance for the current client.
Client_SQLite3.prototype.initPool = function() {
  require('./pool')(this);
};

// Initialize the query "runner"
Client_SQLite3.prototype.initRunner = function() {
  require('./runner')(this);
};

// Lazy-load the schema dependencies.
Client_SQLite3.prototype.initSchema = function() {
  require('./schema')(this);
};

// Lazy-load the migration dependency
Client_SQLite3.prototype.initMigrator = function() {
  require('./migrator')(this);
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
},{"../../client":3,"../../promise":47,"./formatter":28,"./migrator":30,"./pool":31,"./query":32,"./raw":33,"./runner":34,"./schema":37,"./transaction":40,"inherits":68}],30:[function(require,module,exports){
module.exports = function(client) {

var Migrator = require('../../migrate');
var inherits = require('inherits');

// Inherit from the `Migrator` constructor's prototype,
// so we can add the correct `then` method.
function Migrator_SQLite3() {
  Migrator.apply(this, arguments);
}
inherits(Migrator_SQLite3, Migrator);

// Assign the newly extended `Migrator` constructor to the client object.
client.Migrator = Migrator_SQLite3;

};
},{"inherits":68}],31:[function(require,module,exports){
module.exports = function(client) {

var Pool     = require('../../pool');
var inherits = require('inherits');
var _        = require('lodash');

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
},{"../../pool":46,"inherits":68,"lodash":"K2RcUv"}],32:[function(require,module,exports){
// SQLite3 Query Builder & Compiler
// -------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');

var QueryBuilder  = require('../../query/builder');
var QueryCompiler = require('../../query/compiler');

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
  return _.map(orders, function(order) {
    var cols = _.isArray(order.value) ? order.value : [order.value];
    return 'order by ' + this.formatter.columnize(cols) + ' collate nocase ' + this.formatter.direction(order.direction);
  }, this);
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
  return {
    sql: 'PRAGMA table_info(' + this.single.table +')',
    output: function(resp) {
      var maxLengthRegex = /.*\((\d+)\)/;
      return _.reduce(resp, function (columns, val) {
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
    }
  };
};

client.QueryBuilder = QueryBuilder_SQLite3;
client.QueryCompiler = QueryCompiler_SQLite3;

};
},{"../../query/builder":48,"../../query/compiler":49,"inherits":68,"lodash":"K2RcUv"}],33:[function(require,module,exports){
// Raw
// -------
module.exports = function(client) {

var Raw = require('../../raw');
var inherits = require('inherits');

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
},{"../../raw":52,"inherits":68}],34:[function(require,module,exports){
// Runner
// -------
module.exports = function(client) {

var Promise  = require('../../promise');
var Runner   = require('../../runner');
var helpers  = require('../../helpers');

var inherits = require('inherits');

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
  var callMethod = (method === 'insert' || method === 'update' || method === 'del') ? 'run' : 'all';
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

// Grab a connection, run the query via the MySQL streaming interface,
// and pass that through to the stream we've sent back to the client.
Runner_SQLite3.prototype._stream = Promise.method(function(sql, stream, options) {
  var runner = this;
  return new Promise(function(resolver, rejecter) {
    stream.on('error', rejecter);
    stream.on('end', resolver);
    runner.connection.each(sql.sql, sql.bindings, function(err, row) {
      if (err) return rejecter(err);
      stream.write(row);
    }, function() {
      stream.end();
    });
  });
});

// Ensures the response is returned in the same format as other clients.
Runner_SQLite3.prototype.processResponse = function(obj) {
  var ctx      = obj.context;
  var response = obj.response;
  if (obj.output) return obj.output.call(this, response);
  if (obj.method === 'select') {
    response = helpers.skim(response);
  } else if (obj.method === 'insert') {
    response = [ctx.lastID];
  } else if (obj.method === 'del' || obj.method === 'update') {
    response = ctx.changes;
  }
  return response;
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_SQLite3;

};
},{"../../helpers":44,"../../promise":47,"../../runner":53,"inherits":68}],35:[function(require,module,exports){
// SQLite3: Column Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');

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

// Compile a drop column command.
ColumnCompiler_SQLite3.prototype.dropColumn = function() {
  throw new Error("Drop column not supported for SQLite.");
};

client.ColumnBuilder = ColumnBuilder_SQLite3;
client.ColumnCompiler = ColumnCompiler_SQLite3;

};
},{"../../../schema":58,"inherits":68}],36:[function(require,module,exports){
// SQLite3_DDL
//
// All of the SQLite3 specific DDL helpers for renaming/dropping
// columns and changing datatypes.
// -------
module.exports = function(client) {

var _       = require('lodash');
var Promise = require('../../../promise');

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
      }).then(this.reinsertData(function(row) {
	row[to] = row[from];
	return _.omit(row, from);
      })).then(this.dropTempTable);
    })
    .tap(this.commitTransaction)
    .catch(this.rollbackTransaction);
});

SQLite3_DDL.prototype.dropColumn = Promise.method(function(column) {
  return this.getColumn(column)
    .then(function() {

    });
});

client.SQLite3_DDL = SQLite3_DDL;

};
},{"../../../promise":47,"lodash":"K2RcUv"}],37:[function(require,module,exports){
module.exports = function(client) {
  require('./ddl')(client);
  require('./schema')(client);
  require('./table')(client);
  require('./column')(client);
};
},{"./column":35,"./ddl":36,"./schema":38,"./table":39}],38:[function(require,module,exports){
// SQLite3: Column Builder & Compiler
// -------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');
var Schema   = require('../../../schema');

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
},{"../../../schema":58,"inherits":68,"lodash":"K2RcUv"}],39:[function(require,module,exports){
// SQLite3: Column Builder & Compiler
// -------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');
var Schema   = require('../../../schema');

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
TableCompiler_SQLite3.prototype.dropUnique = function(value) {
  this.pushQuery('drop index ' + value);
};

TableCompiler_SQLite3.prototype.dropIndex = function(index) {
  this.pushQuery('drop index ' + index);
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
    throw new Error('Foreign & Primary keys may only be added on create');
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
},{"../../../schema":58,"inherits":68,"lodash":"K2RcUv"}],40:[function(require,module,exports){
// SQLite3 Transaction
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Transaction = require('../../transaction');

function Transaction_SQLite3() {
  this.client = client;
  Transaction.apply(this, arguments);
}
inherits(Transaction_SQLite3, Transaction);

client.Transaction = Transaction_SQLite3;

};
},{"../../transaction":62,"inherits":68}],41:[function(require,module,exports){
// WebSQL
// -------

var inherits = require('inherits');

var Client_SQLite3 = require('../sqlite3/index');
var Promise = require('../../promise');

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
  require('./runner')(this);
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
},{"../../promise":47,"../sqlite3/index":29,"./runner":42,"inherits":68}],42:[function(require,module,exports){
// Runner
// -------
module.exports = function(client) {

var Promise  = require('../../promise');

// Require the SQLite3 Runner.
require('../sqlite3/runner')(client);
var Runner_SQLite3 = client.Runner;

var inherits = require('inherits');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_WebSQL() {
  this.client = client;
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
  if (obj.method === 'select') {
    var results = [];
    for (var i = 0, l = resp.rows.length; i < l; i++) {
      results[i] = _.clone(resp.rows.item(i));
    }
    return results;
  } else if (obj.method === 'insert') {
    resp = [resp.insertId];
  } else if (obj.method === 'delete' || obj.method === 'update') {
    resp = resp.rowsAffected;
  }
  return resp;
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_WebSQL;

};
},{"../../promise":47,"../sqlite3/runner":34,"inherits":68}],43:[function(require,module,exports){
// Mixed into the query compiler & schema pieces. Assumes a `grammar`
// property exists on the current object.
var _            = require('lodash');
var QueryBuilder = require('./query/builder');

var Raw  = require('./raw');
var push = Array.prototype.push;

// All operators used in the `where` clause generation.
var operators = ['=', '<', '>', '<=', '>=', '<>', '!=', 'like', 'not like', 'between', 'ilike'];

// Valid values for the `order by` clause generation.
var orderBys  = ['asc', 'desc'];

// A "formatter" instance is used to both determine how wrap, bind, and
// parameterize values within a query, keeping track of all bindings
// added to the query. This allows us to easily keep track of raw statements
// arbitrarily added to queries.
function Formatter() {
  this.bindings = [];
  this.errors   = [];
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
    return '(' + this.compileCallback(value) + ')';
  }
  return this.checkRaw(value, true) || '?';
};

Formatter.prototype.checkRaw = function(value, parameter) {
  if (value instanceof QueryBuilder) {
    var query = value.toSQL();
    if (query.bindings) push.apply(this.bindings, query.bindings);
    return query.sql;
  }
  if (value instanceof Raw) {
    if (value.bindings) push.apply(this.bindings, value.bindings);
    return value.sql;
  }
  if (parameter) this.bindings.push(value);
};

Formatter.prototype.rawOrFn = function(value, wrap) {
  var sql = '';
  if (_.isFunction(value)) {
    sql = this.compileCallback(value);
  } else {
    sql = this.checkRaw(value);
  }
  return sql ? (wrap ? '(' + sql + ')' : sql) : '';
};

// Puts the appropriate wrapper around a value depending on the database
// engine, unless it's a knex.raw value, in which case it's left alone.
Formatter.prototype.wrap = function(val) {
  var raw;
  if (raw = this.checkRaw(val)) return raw;
  if (_.isNumber(val)) return val;
  return this._wrap(val + '');
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
  if (!_.contains(operators, value)) {
    this.errors.push(new Error('The operator "' + value + '" is not permitted'));
  }
  return value;
};

// Specify the direction of the ordering.
Formatter.prototype.direction = function(value) {
  var raw;
  if (raw = this.checkRaw(value)) return raw;
  return _.contains(orderBys, (value || '').toLowerCase()) ? value : 'asc';
};

// Compiles a callback using the MySQL query builder.
Formatter.prototype.compileCallback = function(callback, method) {
  var client = this.client;

  // Build the callback
  var builder  = new client.QueryBuilder();
  callback.call(builder, builder);

  // Compile the callback, using the current formatter (to track all bindings).
  var compiler = new client.QueryCompiler(builder);
  compiler.formatter = this;

  // Return the compiled & parameterized sql.
  return compiler.toSQL(method || 'select').sql;
};

module.exports = Formatter;
},{"./query/builder":48,"./raw":52,"lodash":"K2RcUv"}],44:[function(require,module,exports){
// helpers.js
// -------

// Just some common functions needed in multiple places within the library.
var _ = require('lodash');

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
},{"lodash":"K2RcUv"}],45:[function(require,module,exports){
module.exports = function(Target) {

var SqlString = require('./sqlstring');
var _ = require('lodash');

Target.prototype.toQuery = function() {
  var data = this.toSQL(this._method);
  if (this._errors.length > 0) throw this._errors[0];
  if (!_.isArray(data)) data = [data];
  return _.map(data, function(statement) {
    return SqlString.format(statement.sql, statement.bindings);
  }).join(';\n');
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
  this._options.push(opts);
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

// Creates a method which "coerces" to a promise, by calling a
// "then" method on the current `Target`
_.each(['bind', 'catch', 'spread', 'otherwise', 'tap', 'thenReturn',
  'return', 'yield', 'ensure', 'nodeify', 'exec'], function(method) {
  Target.prototype[method] = function() {
    var then = this.then();
    return then[method].apply(then, arguments);
  };
});

};
},{"./sqlstring":61,"lodash":"K2RcUv"}],46:[function(require,module,exports){
// Pool
// -------
var _           = require('lodash');
var GenericPool = require('generic-pool-redux').Pool;
var Promise     = require('./promise');

// The "Pool" object is a thin wrapper around the
// "generic-pool-redux" library, exposing a `destroy`
// method for explicitly draining the pool. The
// `init` method is called internally and initializes
// the pool if it doesn't already exist.
var Pool = function(config) {
  this.config = _.clone(config) || {};
  this.initialize();
};

// Typically only called internally, this initializes
// a new `GenericPool` instance, based on the `config`
// options passed into the constructor.
Pool.prototype.initialize = function() {
  this.genericPool = this.genericPool ||
    new GenericPool(_.defaults(this.config, _.result(this, 'defaults')));
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
  return this.genericPool.acquire(callback, priority);
};

// Release a connection back to the connection pool.
Pool.prototype.release = function(connection, callback) {
  return this.genericPool.release(connection, callback);
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
},{"./promise":47,"lodash":"K2RcUv"}],47:[function(require,module,exports){
var Promise = require('bluebird');

Promise.prototype.yield     = Promise.prototype.thenReturn;
Promise.prototype.ensure    = Promise.prototype.lastly;
Promise.prototype.otherwise = Promise.prototype.caught;
Promise.prototype.exec      = Promise.prototype.nodeify;

module.exports = Promise;

},{"bluebird":"EjIH/G"}],48:[function(require,module,exports){
// Builder
// -------
var _            = require('lodash');
var inherits     = require('inherits');
var EventEmitter = require('events').EventEmitter;

var Raw          = require('../raw');
var helpers      = require('../helpers');

var JoinClause  = require('./joinclause');

// Typically called from `knex.builder`,
// start a new query building chain.
function QueryBuilder() {
  this._single     = {};
  this._statements = [];
  this._errors     = [];

  // Internal flags used in the builder.
  this._joinFlag  = 'inner';
  this._boolFlag  = 'and';
}
inherits(QueryBuilder, EventEmitter);

// All operators used in the `where` clause generation.
var operators = ['=', '<', '>', '<=', '>=', '<>', '!=', 'like', 'not like',
  'between', 'ilike', '&', '&&', '|', '^', '#', '<<', '>>', '@>', '<@', '||'];

var nullOperators = ['is', 'is not'];

// Valid values for the `order by` clause generation.
var orderBys = ['asc', 'desc'];

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
QueryBuilder.prototype.column = function() {
  this._statements.push({
    grouping: 'columns',
    value: helpers.normalizeArr.apply(null, arguments)
  });
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
  if (column instanceof Raw) return this._whereRaw(column);

  // Allows `where({id: 2})` syntax.
  if (_.isObject(column)) return this._objectWhere(column);

  // Enable the where('key', value) syntax, only when there
  // are explicitly two arguments passed, so it's not possible to
  // do where('key', '!=') and have that turn into where key != null
  if (arguments.length === 2) {
    value    = operator;
    operator = '=';
  }

  // lower case the operator for comparison purposes
  operator = operator.toLowerCase();

  // Ensure that the operator / query combo is legal.
  if (!_.contains(operators, operator)) {
    if (_.contains(nullOperators, operator)) {
      if (value === null || _.isString(value) && value.toLowerCase() === 'null') {
	return operator === 'is' ? this.whereNull(column, bool) : this.whereNull(column, bool, 'NotNull');
      }
      this._errors.push(new Error('Invalid where in clause'));
    }
    this._errors.push(new Error('Invalid operator: ' + operator));
  }

  // If the value is null, and the operator is equals, assume that we're
  // going for a `whereNull` statement here.
  if (value === null && operator === '=') {
    return this.whereNull(column);
  }

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

// Processes an object literal provided in a "where" clause.
QueryBuilder.prototype._objectWhere = function(obj) {
  var boolVal = this._bool();
  for (var key in obj) {
    this[boolVal + 'Where'](key, '=', obj[key]);
  }
  return this;
};

// Adds an `or where` clause to the query.
QueryBuilder.prototype.orWhere = function() {
  return this._bool('or').where.apply(this, arguments);
};

// [Deprecated]
QueryBuilder.prototype.orWhereRaw = function(sql, bindings) {
  return this._bool('or').whereRaw(sql, bindings);
};
QueryBuilder.prototype.whereRaw = function(sql, bindings) {
  helpers.deprecate('Knex: .whereRaw is deprecated, please use .where(knex.raw(QUERY, [bindings]))');
  return this._whereRaw(sql, bindings);
};

// Adds a raw `where` clause to the query.
QueryBuilder.prototype._whereRaw = function(sql, bindings) {
  var raw = (sql instanceof Raw ? sql : new Raw(sql, bindings));
  this._statements.push({
    grouping: 'where',
    type: 'whereRaw',
    value: raw,
    bool: this._bool()
  });
  return this;
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
QueryBuilder.prototype.groupBy = function() {
  this._statements.push({
    grouping: 'group',
    value: helpers.normalizeArr.apply(null, arguments)
  });
  return this;
};

// Adds a `order by` clause to the query.
QueryBuilder.prototype.orderBy = function(column, direction) {
  if (!(direction instanceof Raw)) {
    if (!_.contains(orderBys, (direction || '').toLowerCase())) direction = 'asc';
  }
  this._statements.push({
    grouping: 'order',
    value: column,
    direction: direction
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
QueryBuilder.prototype.having = function(column, operator, value) {
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

// [Deprecated]
QueryBuilder.prototype.havingRaw = function(sql, bindings) {
  helpers.deprecate('Knex: .havingRaw is deprecated, please use .having(knex.raw(QUERY, [bindings]))');
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
  this._statements.push({
    grouping: 'column',
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
QueryBuilder.prototype.columnInfo = function() {
  this._method = 'columnInfo';
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

// Attach all of the top level promise methods that should be chainable.
require('../interface')(QueryBuilder);

module.exports = QueryBuilder;
},{"../helpers":44,"../interface":45,"../raw":52,"./joinclause":50,"events":64,"inherits":68,"lodash":"K2RcUv"}],49:[function(require,module,exports){
// Query Compiler
// -------

var _       = require('lodash');
var helpers = require('../helpers');
var Raw     = require('../raw');

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
QueryCompiler.prototype.pluck = QueryCompiler.prototype.select;

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
    sql += this.formatter.rawOrFn(union.value, union.wrap);
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
    var item = items[i];
    var str = this.formatter.columnize(item.value);
    if (type === 'order') {
      str += ' ' + this.formatter.direction(item.direction);
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
  return this._not(statement, 'exists') + ' (' + this.formatter.compileCallback(statement.value) + ')';
};

QueryCompiler.prototype.whereWrapped = function(statement) {
  return '(' + this.formatter.compileCallback(statement.value, 'where').slice(6) + ')';
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
  var columns;
  if (!_.isArray(data)) data = data ? [data] : [];
  for (var i = 0, l = data.length; i<l; i++) {
    var sorted = helpers.sortObject(data[i]);
    if (i === 0) columns = _.pluck(sorted, 0);
    values.push(_.pluck(sorted, 1));
  }
  return {
    columns: columns,
    values: values
  };
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

},{"../helpers":44,"../raw":52,"lodash":"K2RcUv"}],50:[function(require,module,exports){
// JoinClause
// -------

// The "JoinClause" is an object holding any necessary info about a join,
// including the type, and any associated tables & columns being joined.
function JoinClause(table, type) {
  this.table    = table;
  this.joinType = type;
  this.clauses  = [];
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

module.exports = JoinClause;
},{}],51:[function(require,module,exports){
// All properties we can use to start a query chain
// from the `knex` object, e.g. `knex.select('*').from(...`
module.exports = [
  'select',
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
  'orderBy',
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
},{}],52:[function(require,module,exports){
// Raw
// -------
var SqlString = require('./sqlstring');
var _ = require('lodash');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

function Raw(sql, bindings) {
  if (sql.toSQL) {
    return this._processQuery(sql);
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
// return '[object Knex$raw]';
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

// Convert the query toSQL.
Raw.prototype._processQuery = function(sql) {
  var processed = sql.toSQL();
  return new this.constructor(processed.sql, processed.bindings);
};

// Allow the `Raw` object to be utilized with full access to the relevant
// promise API.
require('./interface')(Raw);

// Turn the raw query into a string.
Raw.prototype.toQuery = function() {
  return SqlString.format(this.sql, this.bindings);
};

module.exports = Raw;
},{"./interface":45,"./sqlstring":61,"events":64,"inherits":68,"lodash":"K2RcUv"}],53:[function(require,module,exports){
var _       = require('lodash');
var Promise = require('./promise');

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
      var sql = this.builder.toSQL();
      if (_.isArray(sql)) {
	return this.queryArray(sql);
      }
      return this.query(sql);
    })
    .finally(this.cleanupConnection);
});

// Stream the result set, by passing through to the dialect's streaming
// capabilities. If the options are
var PassThrough;
Runner.prototype.stream = Promise.method(function(options, handler) {
  // If we specify stream(handler).then(...
  if (arguments.length === 1) {
    if (_.isFunction(options)) {
      handler = options;
      options = {};
    }
  }
  return Promise.bind(this)
    .then(this.ensureConnection)
    .then(function(connection) {
      this.connection = connection;
      var sql = this.builder.toSQL();
      var err = new Error('The stream may only be used with a single query statement.');
      if (_.isArray(sql)) {
	stream.emit('error', err);
	throw err;
      }
      return sql;
    }).then(function(sql) {

      // Lazy-load the "PassThrough" dependency.
      PassThrough = PassThrough || require('stream').PassThrough;
      var stream  = new PassThrough({objectMode: true});

      // If a function is passed to handle the stream, send the stream
      // there and return the promise, otherwise just return the stream
      // and the promise will take care of itsself.
      if (_.isFunction(handler)) {
	handler(stream);
	return this._stream(sql, stream, options);
      }
      this._stream(sql, stream, options);
      return stream;
    }).finally(this.cleanupConnection);
});

// "Runs" a query, returning a promise. All queries specified by the builder are guaranteed
// to run in sequence, and on the same connection, especially helpful when schema building
// and dealing with foreign key constraints, etc.
Runner.prototype.query = Promise.method(function(obj) {
  this.builder.emit('query', obj);
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
Runner.prototype.startTransaction = function() {
  return Promise.bind(this)
    .then(this.ensureConnection)
    .then(function(connection) {
      this.connection  = connection;
      this.transaction = true;
      return this.query({sql: this._beginTransaction});
    }).thenReturn(this);
};

// Finishes the transaction statement and handles disposing of the connection,
// resolving / rejecting the transaction's promise, and ensuring the transaction object's
// `_runner` property is `null`'ed out so it cannot continue to be used.
Runner.prototype.finishTransaction = Promise.method(function(action, containerObject, msg) {
  var query, dfd = containerObject._dfd;

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
    switch (action) {
      case 0:
	dfd.fulfill(msg || resp);
	break;
      case 1:
	dfd.reject(msg || resp);
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
},{"./promise":47,"lodash":"K2RcUv"}],54:[function(require,module,exports){
var _            = require('lodash');
var inherits     = require('inherits');
var EventEmitter = require('events').EventEmitter;

var SqlString    = require('../sqlstring');

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
  'dropTable', 'renameTable', 'dropTableIfExists', 'raw'
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

// return '[object Knex:SchemaBuilder]';
SchemaBuilder.prototype.toString = function() {
  return this.toQuery();
};

// Turn the current schema builder into a string...
SchemaBuilder.prototype.toQuery = function() {
  return _.reduce(this.toSQL(), function(memo, statement) {
    memo.push(SqlString.format(statement.sql, statement.bindings));
    return memo;
  }, []).join(';\n') + ';';
};

SchemaBuilder.prototype.toSQL = function() {
  var SchemaCompiler = this.client.SchemaCompiler;
  return new SchemaCompiler(this).toSQL();
};

require('../interface')(SchemaBuilder);

module.exports = SchemaBuilder;
},{"../interface":45,"../sqlstring":61,"events":64,"inherits":68,"lodash":"K2RcUv"}],55:[function(require,module,exports){
var _ = require('lodash');

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
},{"lodash":"K2RcUv"}],56:[function(require,module,exports){
// Column Compiler
// Used for designating column definitions
// during the table "create" / "alter" statements.
// -------
var _ = require('lodash');
var Raw = require('../raw');

function ColumnCompiler(tableCompiler, columnBuilder) {
  this.tableCompiler = tableCompiler;
  this.args = columnBuilder._args;
  this.type = columnBuilder._type;
  this.grouped = _.groupBy(columnBuilder._statements, 'grouping');
  this.modified = columnBuilder._modifiers;
  this.isIncrements = (this.type.toLowerCase().indexOf('increments') !== -1);
  this.initCompiler();
}

// To convert to sql, we first go through and build the
// column as it would be in the insert statement
ColumnCompiler.prototype.toSQL = function() {
  this.pushQuery(this.compileColumn());
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
  var type = this[this.type.toLowerCase()];
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
ColumnCompiler.prototype.specificType = function(type) {
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
  } else if (this.method === 'bool') {
    if (value === 'false') value = 0;
    value = (value ? 1 : 0);
  } else if (value === true || value === false) {
    value = parseInt(value, 10);
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
},{"../raw":52,"lodash":"K2RcUv"}],57:[function(require,module,exports){
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

module.exports = SchemaCompiler;
},{}],58:[function(require,module,exports){
var _ = require('lodash');

var Builder = require('./builder');
var Compiler = require('./compiler');
var TableBuilder = require('./tablebuilder');
var TableCompiler = require('./tablecompiler');
var ColumnBuilder = require('./columnbuilder');
var ColumnCompiler = require('./columncompiler');

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

module.exports = {
  Builder: Builder,
  Compiler: Compiler,
  TableBuilder: TableBuilder,
  TableCompiler: TableCompiler,
  ColumnBuilder: ColumnBuilder,
  ColumnCompiler: ColumnCompiler
};
},{"./builder":54,"./columnbuilder":55,"./columncompiler":56,"./compiler":57,"./tablebuilder":59,"./tablecompiler":60,"lodash":"K2RcUv"}],59:[function(require,module,exports){
// TableBuilder

// Takes the function passed to the "createTable" or "table/editTable"
// functions and calls it with the "TableBuilder" as both the context and
// the first argument. Inside this function we can specify what happens to the
// method, pushing everything we want to do onto the "allStatements" array,
// which is then compiled into sql.
// ------
var _ = require('lodash');

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
},{"lodash":"K2RcUv"}],60:[function(require,module,exports){
// Table Compiler
// -------
var _ = require('lodash');

var helpers = require('../helpers');

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
    return 'alter table ' + this.tableName() + ' add constraint ' + keyName + ' ' +
      'foreign key (' + column + ') references ' + inTable + ' (' + references + ')';
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
  var queries = _.reduce(columns, function(memo, column) {
    memo.concat(_.rest(column));
    return memo;
  }, []);
  for (var i = 0, l = queries.length; i < l; i++) {
    this.pushQuery(queries[i]);
  }
  return queries;
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
},{"../helpers":44,"lodash":"K2RcUv"}],61:[function(require,module,exports){
// SQL String
// -------

// A few functions taken from the node-mysql lib, so it can be easily used with any
// library on the `toString` method, and on the browser.
var SqlString = module.exports;
var _         = require('lodash');

// Send in a "sql" string, values, and an optional timeZone
// and have it returned as a properly formatted SQL query.
SqlString.format = function(sql, values, timeZone) {
  values = [].concat(values);
  return sql.replace(/\?/g, function(match) {
    if (!values.length) return match;
    return SqlString.escape(values.shift(), timeZone);
  });
};

SqlString.escape = function(val, timeZone) {
  if (val === undefined || val === null) {
    return 'NULL';
  }

  switch (typeof val) {
    case 'boolean': return (val) ? 'true' : 'false';
    case 'number': return val+'';
  }

  if (val instanceof Date) {
    val = SqlString.dateToString(val, timeZone || "Z");
  }

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(val)) {
    return SqlString.bufferToString(val);
  }

  if (_.isArray(val)) {
    return SqlString.arrayToList(val, timeZone);
  }

  if (typeof val === 'object') val = val.toString();

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
    if (Array.isArray(v)) return '(' + SqlString.arrayToList(v) + ')';
    return SqlString.escape(v, timeZone);
  }).join(', ');
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
  var month  = zeroPad(dt.getMonth() + 1);
  var day    = zeroPad(dt.getDate());
  var hour   = zeroPad(dt.getHours());
  var minute = zeroPad(dt.getMinutes());
  var second = zeroPad(dt.getSeconds());

  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
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

function zeroPad(number) {
  return (number < 10) ? '0' + number : number;
}

function convertTimezone(tz) {
  if (tz == "Z") return 0;

  var m = tz.match(/([\+\-\s])(\d\d):?(\d\d)?/);
  if (m) {
    return (m[1] == '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
  }
  return false;
}
},{"lodash":"K2RcUv"}],62:[function(require,module,exports){
// Transaction
// -------
var Promise = require('./promise');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

// Creates a new wrapper object for constructing a transaction.
// Called by the `knex.transaction`, which sets the correct client
// and handles the `container` object, passing along the correct
// `connection` to keep all of the transactions on the correct connection.
function Transaction(container) {
  this.container = container;
}
inherits(Transaction, EventEmitter);

// Build the object passed around inside the transaction container.
Transaction.prototype.containerObject = function(runner) {
  var containerObj = {
    commit: function(message) {
      return containerObj._runner.finishTransaction(0, this, message);
    },
    rollback: function(error) {
      return containerObj._runner.finishTransaction(1, this, error);
    },
    _runner: runner
  };
  return containerObj;
};

Transaction.prototype.initiateDeferred = function(containerObj) {

  // Initiate a deferred object, bound to the container object,
  // so we know when the transaction completes or fails
  // and can continue from there.
  var dfd = containerObj._dfd = Promise.pending();

  // Call the container with the transaction
  // commit & rollback objects.
  this.container(containerObj);

  // Return the promise for the entire transaction.
  return dfd.promise;
};

// Allow the `Transaction` object to be utilized with full access to the relevant
// promise API.
require('./interface')(Transaction);

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
    .then(onFulfilled, onRejected);
};

module.exports = Transaction;
},{"./interface":45,"./promise":47,"events":64,"inherits":68}],63:[function(require,module,exports){
var _ = require('lodash');

module.exports = {

  // If we are running an insert with variable object keys, we need to normalize
  // for the missing keys, presumably setting the values to undefined.
  prepInsert: function(data) {
    if (!_.isArray(data)) return _.clone(data);
    var defaultObj = _.reduce(_.union.apply(_, _.map(data, function(val) {
      return _.keys(val);
    })), function(memo, key) {
      memo[key] = void 0;
      return memo;
    }, {});
    return _.map(data, function(row) { return _.defaults(row, defaultObj); });
  },

  pgBindings: function(sql) {
    var questionCount = 0;
    return sql.replace(/\?/g, function() {
      questionCount++;
      return '$' + questionCount;
    });
  }

};
},{"lodash":"K2RcUv"}],64:[function(require,module,exports){
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
      } else {
	throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
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
      console.trace();
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

},{}],65:[function(require,module,exports){
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

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
	if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
	if (start < 0) start = str.length + start;
	return str.substr(start, len);
    }
;

},{}],66:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],67:[function(require,module,exports){
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

exports.isBuffer = require('./support/isBuffer');

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
exports.inherits = require('inherits');

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

},{"./support/isBuffer":66,"inherits":68}],68:[function(require,module,exports){
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

},{}],69:[function(require,module,exports){
var util = require('util')
var Cursor = require('pg-cursor')
var Readable = require('stream').Readable

var QueryStream = module.exports = function(text, values, options) {
  options = options || { }
  Cursor.call(this, text, values)
  Readable.call(this, {
    objectMode: true,
    highWaterMark: options.highWaterMark || 1000
  })
  this.batchSize = options.batchSize || 100
  this._ready = false
  this.once('end', function() {
    setImmediate(function() { this.emit('close') }.bind(this));
  })
  //kick reader
  this.read()
}

util.inherits(QueryStream, Readable)
for(var key in Cursor.prototype) {
  if(key != 'read') {
    QueryStream.prototype[key] = Cursor.prototype[key]
  }
}

QueryStream.prototype._fetch = Cursor.prototype.read

QueryStream.prototype._read = function(n) {
  if(this._reading) return false;
  this._reading = true
  var self = this
  this._fetch(this.batchSize, function(err, rows) {
    if(err) {
      return self.emit('error', err)
    }
    if(!rows.length) {
      setImmediate(function() {
	self.push(null)
      })
    }
    self._reading = false
    for(var i = 0; i < rows.length; i++) {
      self.push(rows[i])
    }
  })
}

},{"pg-cursor":70,"util":67}],70:[function(require,module,exports){
var Result = require('./pg').Result
var prepare = require('./pg').prepareValue

var Cursor = function(text, values) {
  this.text = text
  this.values = values ? values.map(prepare) : null
  this.connection = null
  this._queue = []
  this.state = 'initialized'
  this._result = new Result()
  this._cb = null
  this._rows = null
}

Cursor.prototype.submit = function(connection) {
  this.connection = connection

  var con = connection
  var self = this

  con.parse({
    text: this.text
  }, true)

  con.bind({
    values: this.values
  }, true)

  con.describe({
    type: 'P',
    name: '' //use unamed portal
  }, true)

  con.flush()
}

Cursor.prototype.handleRowDescription = function(msg) {
  this._result.addFields(msg.fields)
  this.state = 'idle'
  if(this._queue.length) {
    this._getRows.apply(this, this._queue.shift())
  }
}

Cursor.prototype.handleDataRow = function(msg) {
  var row = this._result.parseRow(msg.fields)
  this._rows.push(row)
}

Cursor.prototype._sendRows = function() {
  this.state = 'idle'
  setImmediate(function() {
    var cb = this._cb
    //remove callback before calling it
    //because likely a new one will be added
    //within the call to this callback
    this._cb = null
    if(cb) {
      cb(null, this._rows)
    }
    this._rows = []
  }.bind(this))
}

Cursor.prototype.handleCommandComplete = function() {
  this.connection.sync()
}

Cursor.prototype.handlePortalSuspended = function() {
  this._sendRows()
}

Cursor.prototype.handleReadyForQuery = function() {
  this._sendRows()
  this.state = 'done'
}

Cursor.prototype.handleError = function(msg) {
  this.state = 'error'
  this._error = msg
  //satisfy any waiting callback
  if(this._cb) {
    this._cb(msg)
  }
  //dispatch error to all waiting callbacks
  for(var i = 0; i < this._queue.length; i++) {
    this._queue.pop()[1](msg)
  }
  //call sync to keep this connection from hanging
  this.connection.sync()
}

Cursor.prototype._getRows = function(rows, cb) {
  this.state = 'busy'
  this._cb = cb
  this._rows = []
  var msg = {
    portal: '',
    rows: rows
  }
  this.connection.execute(msg, true)
  this.connection.flush()
}

Cursor.prototype.end = function(cb) {
  if(this.statue != 'initialized') {
    this.connection.sync()
  }
  this.connection.end()
  this.connection.stream.once('end', cb)
}

Cursor.prototype.read = function(rows, cb) {
  var self = this
  if(this.state == 'idle') {
    return this._getRows(rows, cb)
  }
  if(this.state == 'busy' || this.state == 'initialized') {
    return this._queue.push([rows, cb])
  }
  if(this.state == 'error') {
    return cb(this._error)
  }
  if(this.state == 'done') {
    return cb(null, [])
  }
  else {
    throw new Error("Unknown state: " + this.state)
  }
}

module.exports = Cursor

},{"./pg":71}],71:[function(require,module,exports){
var path = require('path')
var pgPath;
//support both pg & pg.js
//this will eventually go away when i break native bindings
//out into their own module
try {
  pgPath = path.dirname(require.resolve('pg'))
} catch(e) {
  pgPath = path.dirname(require.resolve('pg.js')) + '/lib'
}

module.exports.Result = require(path.join(pgPath, 'result.js'))
module.exports.prepareValue = require(path.join(pgPath, 'utils.js')).prepareValue

},{"path":65}]},{},[])