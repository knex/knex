
// Shared Properties for all base Node.js Clients
var Q = require('q');
var _ = require('underscore');
var genericPool = require('generic-pool');

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
  this.pool = genericPool.Pool(_.extend({
    name: 'pool-' + name,
    create: function(callback) {
      callback(null, instance.getConnection());
    },
    log : false
  }, this.poolDefaults, options.pool));
};

exports.protoProps = {

  // Begins a transaction statement on the instance,
  // resolving with the connection of the current transaction.
  startTransaction: function() {
    var dfd = Q.defer();
    var connection = this.getConnection();
    connection.query('begin;', [], function(err) {
      if (err) dfd.reject(err);
      dfd.resolve(connection);
    });
    return dfd.promise;
  },

  finishTransaction: function(type, trans, promise) {
    trans.connection.query(type + ';', [], function(err, resp) {
      trans.connection.end();
      trans.connection = null;
      if (type === 'commit') promise.resolve(resp);
      if (type === 'rollback') promise.reject(resp);
    });
  }

};