// PostgreSQL
// -------

// All of the "when.js" promise components needed in this module.
var when   = require('when');
var nodefn = require('when/node/function');

// Other dependencies, including the `pg` library,
// which needs to be added as a dependency to the project
// using this database.
var _    = require('underscore');
var pg   = require('pg');

// All other local project modules needed in this scope.
var ServerBase        = require('./base').ServerBase;
var Helpers           = require('../../lib/helpers').Helpers;

var grammar           = require('./postgres/grammar').grammar;
var schemaGrammar     = require('./postgres/schemagrammar').schemaGrammar;

// Constructor for the PostgreSQL Client
exports.Client = ServerBase.extend({

  dialect: 'postgresql',

  // Attach the appropriate grammar definitions onto the current client.
  attachGrammars: function() {
    this.grammar = grammar;
    this.schemaGrammar = schemaGrammar;
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  runQuery: function(connection, sql, bindings, builder) {
    if (!connection) throw new Error('No database connection exists for the query');
    var questionCount = 0;
    sql = sql.replace(/\?/g, function() {
      questionCount++;
      return '$' + questionCount;
    });
    if (builder && builder.flags.options) sql = _.extend({text: sql}, builder.flags.options);
    return nodefn.call(connection.query.bind(connection), sql, bindings);
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  getRawConnection: function(callback) {
    var instance = this;
    var connection = new pg.Client(this.connectionSettings);
    return nodefn.call(connection.connect.bind(connection)).tap(function() {
      if (!instance.version) return instance.checkVersion(connection);
    }).yield(connection);
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function(connection) {
    connection.end();
  },

  // In PostgreSQL, we need to do a version check to do some feature
  // checking on the database.
  checkVersion: function(connection) {
    var instance = this;
    this.runQuery(connection, 'select version();').then(function(resp) {
      instance.version = /^PostgreSQL (.*?) /.exec(resp.rows[0].version)[1];
    });
  }

});
