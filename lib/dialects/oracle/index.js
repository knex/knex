'use strict';

// Oracle Client
// -------
var inherits = require('inherits');
var _        = require('lodash');
var Client   = require('../../client');
var Promise  = require('../../promise');

var oracle;

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_Oracle(config) {
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
inherits(Client_Oracle, Client);

// The "dialect", for reference elsewhere.
Client_Oracle.prototype.dialect = 'oracle';

// Lazy-load the oracle dependency, since we might just be
// using the client to generate SQL strings.
Client_Oracle.prototype.initDriver = function() {
  oracle = oracle || require('oracle');
};

// Attach a `Formatter` constructor to the client object.
Client_Oracle.prototype.initFormatter = function() {
  require('./formatter')(this);
};

// Attaches the `Raw` constructor to the client object.
Client_Oracle.prototype.initRaw = function() {
  require('./raw')(this);
};

// Attaches the `FunctionHelper` constructor to the client object.
Client_Oracle.prototype.initFunctionHelper = function() {
  require('./functionhelper')(this);
};

// Attaches the `Transaction` constructor to the client object.
Client_Oracle.prototype.initTransaction = function() {
  require('./transaction')(this);
};

// Attaches `QueryBuilder` and `QueryCompiler` constructors
// to the client object.
Client_Oracle.prototype.initQuery = function() {
  require('./query')(this);
};

// Initializes a new pool instance for the current client.
Client_Oracle.prototype.initPool = function() {
  require('./pool')(this);
};

// Initialize the query "runner"
Client_Oracle.prototype.initRunner = function() {
  require('./runner')(this);
};

// Lazy-load the schema dependencies; we may not need to use them.
Client_Oracle.prototype.initSchema = function() {
  require('./schema')(this);
};

// Lazy-load the migration dependency
Client_Oracle.prototype.initMigrator = function() {
  require('./migrator')(this);
};

// Lazy-load the seeding dependency
Client_Oracle.prototype.initSeeder = function() {
  require('./seeder')(this);
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_Oracle.prototype.acquireRawConnection = function() {
  var self = this;
  return new Promise(function(resolver, rejecter) {
    oracle.connect(self.connectionSettings, function(err, connection) {
      if (err) return rejecter(err);
      resolver(connection);
    });
  });
};

// Used to explicitly close a connection, called internally by the pool
// when a connection times out or the pool is shutdown.
Client_Oracle.prototype.destroyRawConnection = function(connection) {
  connection.close();
};

// Return the database for the Oracle client.
Client_Oracle.prototype.database = function() {
  return this.connectionSettings.database;
};

// Position the bindings for the query.
Client_Oracle.prototype.positionBindings = function(sql) {
  var questionCount = 0;
  return sql.replace(/\?/g, function() {
    questionCount += 1;
    return ':' + questionCount;
  });
};


var ReturningHelper = require('./utils').ReturningHelper;

Client_Oracle.prototype.preprocessBindings = function (bindings) {

  if (!bindings) {
    return bindings;
  }

  return bindings.map(function (binding) {
    if (binding instanceof ReturningHelper && oracle) {
      // returning helper uses always ROWID as string
      return new oracle.OutParam(oracle.OCCISTRING);
    }

    if (typeof binding === 'boolean') {
      return binding ? 1 : 0;
    }
    return binding;
  });
};

module.exports = Client_Oracle;
