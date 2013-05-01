
var mysql = require('mysql');

var Q           = require('q');
var _           = require('underscore');
var util        = require('util');
var genericPool = require('generic-pool');

var MysqlClient = module.exports = function(name, options) {
  if (!options.connection) {
    throw new Error('The database connection properties must be specified.');
  }
  this.name  = name;
  this.debug = options.debug;
  this.connectionSettings = options.connection;

  // Extend the genericPool with the options
  // passed into the init under the "pool" option
  var instance = this;
  this.pool = genericPool.Pool(_.extend({
    name : 'pool' + name,
    create : function(callback) {
      callback(null, instance.getConnection());
    },
    destroy  : function(client) {
      client.end();
    },
    max : 10,
    min : 2,
    idleTimeoutMillis: 30000,
    log : false
  }, options.pool));

  this.grammar = MysqlClient.grammar;
  this.schemaGrammar = MysqlClient.schemaGrammar;
};

_.extend(MysqlClient.prototype, {

  // Execute a query on the database.
  // If the fourth parameter is set, this will be used as the connection
  // to the database.
  query: function (data, connection) {

    var dfd = Q.defer();

    if (this.debug) console.log([data, (connection ? connection.__cid : '')]);

    // If there is a specific connection specified, use that.
    if (connection) {

      connection.query(data.sql, (data.bindings || []), function(err, res) {
        if (err) return dfd.reject(err);
        dfd.resolve(res);
      });

    } else {

      // Acquire connection - callback function is called
      // once a resource becomes available.
      var instance = this;
      this.pool.acquire(function(err, client) {

        if (err) return dfd.reject(err);

        // Make the query and then release the client.
        client.query(data.sql, (data.bindings || []), function (err, res) {
          instance.pool.release(client);
          if (err) return dfd.reject(err);
          dfd.resolve(res);
        });

      });

    }

    return dfd.promise;
  },

  // Returns a mysql connection, with a __cid property uniquely
  // identifying the connection.
  getConnection: function () {
    var connection = mysql.createConnection(this.connectionSettings);
        connection.connect();
        connection.__cid = _.uniqueId('__cid');
    return connection;
  },

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

});

// Extends the standard sql grammar.
MysqlClient.grammar = {

  // The keyword identifier wrapper format.
  wrapValue: function(value) {
    return (value !== '*' ? util.format('`%s`', value) : "*");
  }

};

// Grammar for the schema builder.
MysqlClient.schemaGrammar = _.extend({}, MysqlClient.grammar, {

  // The possible column modifiers.
  modifiers: ['Unsigned', 'Nullable', 'Default', 'Increment', 'After'],
  
  // Compile the query to determine if a table exists.
  compileTableExists: function() {
    return 'select * from information_schema.tables where table_schema = ? and table_name = ?';
  },

  // Compile a create table command.
  compileCreateTable: function(blueprint, command) {
    var columns = this.getColumns(blueprint).join(', ');
    return 'create table ' + this.wrapTable(blueprint) + ' (' + columns + ')';
  },

  // Compile an add command.
  compileAdd: function(blueprint, command) {
    var columns = this.prefixArray('add', this.getColumns(blueprint));
    return 'alter table ' + this.wrapTable(blueprint) + ' ' + columns.join(', ');
  },

  // Compile a primary key command.
  compilePrimary: function(blueprint, command) {
    command.name(null);
    return this.compileKey(blueprint, command, 'primary key');
  },
  
  // Compile a unique key command.
  compileUnique: function(blueprint, command) {
    return this.compileKey(blueprint, command, 'unique');
  },

  // Compile a plain index key command.
  compileIndex: function(blueprint, command) {
    return this.compileKey(blueprint, command, 'index');
  },

  // Compile an index creation command.
  compileKey: function(blueprint, command, type) {
    var columns = this.columnize(command.columns);
    var table = this.wrapTable(blueprint);
    return 'alter table ' + table + " add " + type + " " + command.index + "(" + columns + ")";
  },

  // Compile a drop table command.
  compileDropTable: function(blueprint, command) {
    return 'drop table ' + this.wrapTable(blueprint);
  },

  // Compile a drop table (if exists) command.
  compileDropTableIfExists: function(blueprint, command) {
    return 'drop table if exists ' + this.wrapTable(blueprint);
  },
  
  // Compile a drop column command.
  compileDropColumn: function(blueprint, command) {
    var columns = this.prefixArray('drop', this.wrapArray(command.columns));
    return 'alter table ' + this.wrapTable(blueprint) + ' ' + columns.join(', ');
  },
  
  // Compile a drop primary key command.
  compileDropPrimary: function(blueprint, command) {
    return 'alter table ' + this.wrapTable(blueprint) + ' drop primary key';
  },

  // Compile a drop unique key command.
  compileDropUnique: function(blueprint, command) {
    return this.compileDropIndex(blueprint, command);
  },

  // Compile a drop index command.
  compileDropIndex: function(blueprint, command) {
    return 'alter table ' + this.wrapTable(blueprint) + ' drop index ' + command.index;
  },
  
  // Compile a drop foreign key command.
  compileDropForeign: function(blueprint, command) {
    return 'alter table ' + this.wrapTable(blueprint) + " drop foreign key " + command.index;
  },

  // Compile a rename table command.
  compileRename: function(blueprint, command) {
    return 'rename table ' + this.wrapTable(blueprint) + ' to ' + this.wrapTable(command.to);
  },
  
  // Create the column definition for a string type.
  typeString: function(column) {
    return "varchar(" + column.length + ")";
  },

  // Create the column definition for a text type.
  typeText: function(column) {
    switch (column.length) {
      case 'medium':
      case 'mediumtext':
        return 'mediumtext';
      case 'long':
      case 'longtext':
        return 'longtext';
      default:
        return 'text';
    }
  },

  // Create the column definition for a integer type.
  typeInteger: function(column) {
    return 'int(' + column.length + ')';
  },

  // Create the column definition for a tiny integer type.
  typeTinyInteger: function() {
    return 'tinyint';
  },

  // Create the column definition for a float type.
  typeFloat: function(column) {
    return 'float(' + column.total + ',' + column.places + ')';
  },
  
  // Create the column definition for a decimal type.
  typeDecimal: function(column) {
    return 'decimal(' + column.precision + ', ' + column.scale + ')';
  },

  // Create the column definition for a boolean type.
  typeBoolean: function(column) {
    return 'tinyint(1)';
  },

  // Create the column definition for a enum type.
  typeEnum: function(column) {
    return "enum('" + column.allowed.join("', '")  + "')";
  },

  // Create the column definition for a date type.
  typeDate: function(column) {
    return 'date';
  },

  // Create the column definition for a date-time type.
  typeDateTime: function(column) {
    return 'datetime';
  },

  // Create the column definition for a time type.
  typeTime: function(column) {
    return 'time';
  },

  // Create the column definition for a timestamp type.
  typeTimestamp: function(column) {
    return 'timestamp default 0';
  },

  // Create the column definition for a bit type.
  typeBit: function(column) {
    return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
  },

  // Create the column definition for a binary type.
  typeBinary: function(column) {
    return 'blob';
  },

  // Get the SQL for an unsigned column modifier.
  modifyUnsigned: function(blueprint, column) {
    if (column.type == 'integer' && column.isUnsigned) {
      return ' unsigned';
    }
  },

  // Get the SQL for a nullable column modifier.
  modifyNullable: function(blueprint, column) {
    return column.isNullable ? ' null' : ' not null';
  },

  // Get the SQL for a default column modifier.
  modifyDefault: function(blueprint, column) {
    if (column.defaultValue) {
      return " default '" + this.getDefaultValue(column.defaultValue) + "'";
    }
  },

  // Get the SQL for an auto-increment column modifier.
  modifyIncrement: function(blueprint, column) {
    if (column.type == 'integer' && column.autoIncrement) {
      return ' auto_increment primary key';
    }
  }
});
