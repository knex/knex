var Q = require('q');
var _ = require('underscore');

// Setup is called with the context of the current client.
exports.setup = function(Client, name, options) {
  if (!options.connection) {
    throw new Error('The database connection properties must be specified.');
  }
  this.name = name;
  this.debug = options.debug;
  this.connectionSettings = options.connection;
  this.grammar = Client.grammar;
  this.schemaGrammar = Client.schemaGrammar;

  // Extend the genericPool with the options
  // passed into the init under the "pool" option.
  var instance = this;
  this.pool = require('generic-pool').Pool(_.extend({
    name: 'pool-' + name,
    min: 2,
    max: 10,
    log: false,
    idleTimeoutMillis: 30000,
    create: function(callback) {
      var conn = instance.getRawConnection();
      conn.__cid = _.uniqueId('__cid');
      callback(null, conn);
    },
    destroy: function(client) { client.end(); }
  }, this.poolDefaults, options.pool));
};

exports.protoProps = {

  // Execute a query on the database.
  // If a `connection` is specified, use it, otherwise
  // acquire a connection, and then dispose of it when we're done.
  query: function (data) {
    data = this.prepData(data);
    var emptyConnection = !data.connection;
    var debug = this.debug;
    return Q((connection || this.getConnection()))
      .then(function(conn) {
        if (debug) console.log(_.extend(data, {__cid: conn.__cid}));
        return Q.nfinvoke(connection.query, data.sql, (data.bindings || []));
      })
      .then(this.prepResp)
      .fin(function() {
        if (emptyConnection) instance.pool.release(client);
      });
  },

  prepData: function(data) {
    return data;
  },

  prepResp: function(resp) {
    return resp;
  },

  // Retrieves a connection from the connection pool,
  // returning a promise.
  getConnection: function() {
    return Q.ninvoke(this.pool, 'acquire');
  },

  // Releases a connection from the connection pool,
  // returning a promise.
  releaseConnection: function(conn) {
    return Q.ninvoke(this.pool, 'release', conn);
  },

  // Begins a transaction statement on the instance,
  // resolving with the connection of the current transaction.
  startTransaction: function() {
    return this.getConnection().then(function(connection) {
      return Q.ninvoke(connection, 'query', 'begin;', []).then(function() {
        return connection;
      });
    });
  },

  finishTransaction: function(type, trans, dfd) {
    Q.ninvoke(trans.connection, 'query', type + ';', []).then(function() {
      if (type === 'commit') dfd.resolve(resp);
      if (type === 'rollback') dfd.reject(resp);
    }).fin(function() {
      trans.connection.end();
      trans.connection = null;
    });
  }

};

exports.grammar = {

};

exports.schemaGrammar = {
  
  // Compile a drop table command.
  compileDropTable: function(blueprint, command) {
    return 'drop table ' + this.wrapTable(blueprint);
  },

  // Compile a drop table (if exists) command.
  compileDropTableIfExists: function(blueprint, command) {
    return 'drop table if exists ' + this.wrapTable(blueprint);
  }

};
