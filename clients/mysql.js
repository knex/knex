var When        = require('when');
var _           = require('underscore');
var util        = require('util');
var base        = require('./base');
var mysql       = require('mysql');

// Constructor for the MysqlClient
var MysqlClient = module.exports = function(name, options) {
  base.setup.call(this, MysqlClient, name, options);
};

_.extend(MysqlClient.prototype, base.protoProps, {

  // Execute a query on the specified Builder or QueryBuilder
  // interface. If a `connection` is specified, use it, otherwise
  // acquire a connection, and then dispose of it when we're done.
  query: function(builder) {
    var emptyConnection = !builder._connection;
    var debug = this.debug || builder._debug;
    var instance = this;
    return When((builder._connection || this.getConnection()))
      .then(function(conn) {
        var dfd = When.defer();

        // If we have a debug flag set, console.log the query.
        if (debug) base.debug(builder, conn);

        // Call the querystring and then release the client
        conn.query(builder.sql, builder.bindings, function (err, resp) {
          if (err) { return dfd.reject(err); }

          if (builder._source === 'Raw') return dfd.resolve(resp);

          if (builder._source === 'SchemaBuilder') {
            if (builder.type === 'tableExists') {
              if (resp.length > 0) return dfd.resolve(_.pick(resp, _.keys(resp)));
              return dfd.reject(new Error('Table does not exist:' + builder.sql));
            } else {
              return dfd.resolve(null);
            }
          }

          if (builder.type === 'select') {
            resp = base.skim(resp);
          } else if (builder.type === 'insert') {
            resp = [resp.insertId];
          } else if (builder.type === 'delete' || builder.type === 'update') {
            resp = resp.affectedRows;
          } else {
            resp = '';
          }

          dfd.resolve(resp);
        });

        // Empty the connection after we run the query, unless one was specifically
        // set (in the case of transactions, etc).
        return dfd.promise.ensure(function() {
          if (emptyConnection) instance.pool.release(conn);
        });
      });
  },

  getRawConnection: function(callback) {
    var conn = mysql.createConnection(this.connectionSettings);
    conn.connect(function(err) {
      callback(err, conn);
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
MysqlClient.schemaGrammar = _.extend({}, base.schemaGrammar, MysqlClient.grammar, {

  // The possible column modifiers.
  modifiers: ['Unsigned', 'Nullable', 'Default', 'Increment', 'After', 'Comment'],

  // Compile a create table command.
  compileCreateTable: function(blueprint, command) {
    var sql = base.schemaGrammar.compileCreateTable.call(this, blueprint, command);
    var conn = blueprint.client.connectionSettings;

    if (conn.charset) sql += ' default character set ' + conn.charset;
    if (conn.collation) sql += ' collate ' + conn.collation;

    if (blueprint.isEngine) {
      sql += ' engine = ' + blueprint.isEngine;
    }

    if (blueprint.tableComment) {
      var maxTableCommentLength = 60;
      sql += " comment = '" + blueprint.tableComment + "'"
    }

    return sql;
  },

  // Compile the query to determine if a table exists.
  compileTableExists: function(blueprint) {
    blueprint.bindings.unshift(blueprint.client.connectionSettings.database);
    return 'select * from information_schema.tables where table_schema = ? and table_name = ?';
  },

  // Compile an add command.
  compileAdd: function(blueprint) {
    var columns = this.prefixArray('add', this.getColumns(blueprint));
    return 'alter table ' + this.wrapTable(blueprint) + ' ' + columns.join(', ');
  },

  // Compile a primary key command.
  compilePrimary: function(blueprint, command) {
    command.name = null;
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

  // Compile a drop column command.
  compileDropColumn: function(blueprint, command) {
    var columns = this.prefixArray('drop', this.wrapArray(command.columns));
    return 'alter table ' + this.wrapTable(blueprint) + ' ' + columns.join(', ');
  },

  // Compile a drop primary key command.
  compileDropPrimary: function(blueprint) {
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
  compileRenameTable: function(blueprint, command) {
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

  // Create the column definition for a float type.
  typeFloat: function(column) {
    return 'float(' + column.total + ',' + column.places + ')';
  },

  // Create the column definition for a decimal type.
  typeDecimal: function(column) {
    return 'decimal(' + column.precision + ', ' + column.scale + ')';
  },

  // Create the column definition for a boolean type.
  typeBoolean: function() {
    return 'tinyint(1)';
  },

  // Create the column definition for a enum type.
  typeEnum: function(column) {
    return "enum('" + column.allowed.join("', '")  + "')";
  },

  // Create the column definition for a date-time type.
  typeDateTime: function() {
    return 'datetime';
  },

  // Create the column definition for a timestamp type.
  typeTimestamp: function() {
    return 'timestamp default 0';
  },

  // Create the column definition for a bit type.
  typeBit: function(column) {
    return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
  },

  // Get the SQL for an unsigned column modifier.
  modifyUnsigned: function(blueprint, column) {
    if (column.isUnsigned) return ' unsigned';
  },

  // Get the SQL for a default column modifier.
  modifyDefault: function(blueprint, column) {
    // TODO - no default on blob/text
    if (column.defaultValue != void 0 && column.type != 'blob' && column.type.indexOf('text') === -1) {
      return " default '" + this.getDefaultValue(column.defaultValue) + "'";
    }
  },

  // Get the SQL for an auto-increment column modifier.
  modifyIncrement: function(blueprint, column) {
    if (column.type == 'integer' && column.autoIncrement) {
      return ' auto_increment primary key';
    }
  },

  // Get the SQL for an "after" column modifier.
  modifyAfter: function(blueprint, column) {
    if (column.isAfter) {
      return ' after ' + this.wrap(column.isAfter);
    }
  },

  // Get the SQL for a comment column modifier. (MySQL)
  modifyComment: function(blueprint, column) {
    var maxColumnCommentLength = 255;
    if (_.isString(column.comment)) {
      return " comment '" + column.comment + "'";
    }
  }

});
