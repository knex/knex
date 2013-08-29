var whenfn = require('when/function');
var nodefn = require('when/node/function');
var _      = require('underscore');

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
  var poolInstance = this.pool = require('generic-pool').Pool(_.extend({
    name: 'pool-' + name,
    min: 2,
    max: 10,
    log: false,
    idleTimeoutMillis: 30000,
    create: function(callback) {
      var pool = this;
      instance.getRawConnection(function(err, conn) {
        if (err) return callback(err);
        conn.__cid = _.uniqueId('__cid');
        if (pool.afterCreate) {
          pool.afterCreate(conn, function(err) {
            callback(err, conn);
          });
        } else {
          callback(null, conn);
        }
      });
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

  // Default to draining on exit.
  if (poolInstance.drainOnExit !== false && typeof process === 'object') {
    process.on('exit', function() {
      poolInstance.drain(function() {
          poolInstance.destroyAllNow();
      });
    });
  }
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
    return whenfn.call(this.pool.release, conn);
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

  finishTransaction: function(type, trans, dfd, msg) {
    var ctx = this;
    nodefn.call(trans.connection.query.bind(trans.connection), type + ';', []).then(function(resp) {
      if (type === 'commit') dfd.resolve(msg || resp);
      if (type === 'rollback') dfd.reject(msg || resp);
    }, function (err) {
      dfd.reject(err);
    }).ensure(function() {
      return ctx.releaseConnection(trans.connection).then(function() {
        trans.connection = null;
      });
    });
  }

};

exports.grammar = {};

exports.schemaGrammar = {

  // Get the primary key command if it exists on the blueprint.
  getCommandByName: function(blueprint, name) {
    var commands = this.getCommandsByName(blueprint, name);
    if (commands.length > 0) return commands[0];
  },

  // Get all of the commands with a given name.
  getCommandsByName: function(blueprint, name) {
    return _.filter(blueprint.commands, function(value) { return value.name == name; }) || [];
  },

  // Used to compile any database specific items.
  compileAdditional: function() {},

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

  // Create the column definition for a string type.
  typeString: function(column) {
    return "varchar(" + column.length + ")";
  },

  // Create the column definition for a text type.
  typeText: function() {
    return 'text';
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

  // Create the column definition for a json type.
  typeJson: function() {
    return 'text';
  },

  // Create the column definition for a uuid type.
  typeUuid: function() {
    return 'char(36)';
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
