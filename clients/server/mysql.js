// MySQL
// -------

// Other dependencies, including the `mysql` library,
// which needs to be added as a dependency to the project
// using this database.
var _     = require('lodash');
var mysql = require('mysql');

// All other local project modules needed in this scope.
var ServerBase        = require('./base').ServerBase;
var Helpers           = require('../../lib/helpers').Helpers;
var Promise           = require('../../lib/promise').Promise;

var grammar           = require('./mysql/grammar').grammar;
var schemaGrammar     = require('./mysql/schemagrammar').schemaGrammar;

// Constructor for the MySQLClient.
exports.Client = ServerBase.extend({

  dialect: 'mysql',

  // Attach the appropriate grammar definitions onto the current client.
  attachGrammars: function() {
    this.grammar = grammar;
    this.schemaGrammar = schemaGrammar;
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  runQuery: function(connection, sql, bindings, builder) {
    return Promise.bind(this).then(function() {
      if (!connection) throw new Error('No database connection exists for the query');
      if (builder.flags.options) sql = _.extend({sql: sql}, builder.flags.options);
      if (builder._source === 'SchemaBuilder') {
        return this.advancedQuery(connection, sql, builder);
      }
      return sql;
    }).then(function(sql) {
      return Promise.promisify(connection.query, connection)(sql, bindings);
    }).bind();
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  getRawConnection: function() {
    var connection = mysql.createConnection(this.connectionSettings);
    return Promise.promisify(connection.connect, connection)().yield(connection);
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function(connection) {
    connection.end();
  },

  // Used to check if there is a conditional query needed to complete the next one.
  advancedQuery: function(connection, sql, builder) {
    if (sql.indexOf('alter table') === 0 && sql.indexOf('__datatype__') === (sql.length - 12)) {
      var newSql = sql.replace('alter table', 'show fields from').split('change')[0] + ' where field = ?';
      return Promise.promisify(connection.query, connection)(newSql, [builder.commands[builder.currentIndex].from]).then(function(resp) {
        var column = resp[0];
        // Set to the datatype we're looking to change it to...
        return sql.replace('__datatype__', column[0].Type);
      });
    }
    return sql;
  }

});