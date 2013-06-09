var nodefn = require('when/node/function');
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
      if (this.beforeCreate) {
        this.beforeCreate(conn, function() {
          callback(null, conn);
        });
      } else {
        callback(null, conn);
      }
    },
    destroy: function(conn) {
      if (this.beforeDestroy) {
        this.beforeDestroy(conn, function() {
          conn.end();
        });
      } else {
        conn.end();
      }
    }
  }, this.poolDefaults, options.pool));
};

exports.skim = function(data) {
  return _.map(data, function(obj) {
    return _.pick(obj, _.keys(obj));
  });
};

exports.debug = function(builder, conn) {
  console.log({sql: builder.sql, bindings: builder.bindings, __cid: conn.__cid});
};

exports.protoProps = {

  // Retrieves a connection from the connection pool,
  // returning a promise.
  getConnection: function() {
    return nodefn.call(this.pool.acquire);
  },

  // Releases a connection from the connection pool,
  // returning a promise.
  releaseConnection: function(conn) {
    return nodefn.call(this.pool.release, conn);
  },

  // Begins a transaction statement on the instance,
  // resolving with the connection of the current transaction.
  startTransaction: function() {
    return this.getConnection().then(function(connection) {
      return nodefn.call(connection.query.bind(connection), 'begin;', []).then(function() {
        return connection;
      });
    });
  },

  finishTransaction: function(type, trans, dfd) {
    var ctx = this;
    nodefn.call(trans.connection.query.bind(trans.connection), type + ';', []).then(function(resp) {
      if (type === 'commit') dfd.resolve(resp);
      if (type === 'rollback') dfd.reject(resp);
    }).ensure(function() {
      ctx.releaseConnection(trans.connection);
      trans.connection = null;
    });
  }

};

exports.grammar = {};

exports.schemaGrammar = {

  // Compile a create table command.
  compileCreateTable: function(blueprint) {
    var columns = this.getColumns(blueprint).join(', ');
    return 'create table ' + this.wrapTable(blueprint) + ' (' + columns + ')';
  },

  // Compile a drop table command.
  compileDropTable: function(blueprint) {
    return 'drop table ' + this.wrapTable(blueprint);
  },

  // Compile a drop table (if exists) command.
  compileDropTableIfExists: function(blueprint) {
    return 'drop table if exists ' + this.wrapTable(blueprint);
  },

  // Compile a drop index command.
  compileDropIndex: function(blueprint, command) {
    return 'drop index ' + command.index;
  },

  // Create the column definition for a tiny integer type.
  typeTinyInteger: function() {
    return 'tinyint';
  },

  // Create the column definition for a time type.
  typeTime: function() {
    return 'time';
  },

  // Create the column definition for a date type.
  typeDate: function() {
    return 'date';
  },

  // Create the column definition for a binary type.
  typeBinary: function() {
    return 'blob';
  },

  // Get the SQL for a nullable column modifier.
  modifyNullable: function(blueprint, column) {
    return column.isNullable ? ' null' : ' not null';
  },

  // Get the SQL for a default column modifier.
  modifyDefault: function(blueprint, column) {
    if (column.defaultValue != void 0) {
      return " default '" + this.getDefaultValue(column.defaultValue) + "'";
    }
  }

};
