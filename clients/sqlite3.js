var Q           = require('q');
var _           = require('underscore');
var util        = require('util');
var base        = require('./base');
var sqlite3     = require('sqlite3');

// Constructor for the Sqlite3Client
var Sqlite3Client = module.exports = function(name, options) {
  base.setup.call(this, Sqlite3Client, name, options);
};

_.extend(Sqlite3Client.prototype, base.protoProps, {

  // Execute a query on the specified Builder or QueryBuilder
  // interface. If a `connection` is specified, use it, otherwise
  // acquire a connection, and then dispose of it when we're done.
  query: function(builder) {
    var emptyConnection = !builder._connection;
    var debug = this.debug || builder._debug;
    var instance = this;
    return Q((builder._connection || this.getConnection()))
      .then(function(conn) {
        var dfd = Q.defer();
        var method = (builder.type === 'insert' || builder.type === 'update') ? 'run' : 'all';

        // If we have a debug flag set, console.log the query.
        if (debug) base.debug(builder, conn);
        
        // Call the querystring and then release the client
        conn[method](builder.sql, builder.bindings, function (err, resp) {
        
          if (err) return dfd.reject(err);

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
          }
          if (builder.type === 'insert') {
            resp = [this.lastID];
          }
          if (builder.type === 'delete' || builder.type === 'update') {
            resp = this.changes;
          }

          dfd.resolve(resp);
        });

        // Empty the connection after we run the query, unless one was specifically
        // set (in the case of transactions, etc).
        return dfd.promise.then(function(resp) {
          if (emptyConnection) instance.pool.release(conn);
          return resp;
        });
      });
  },

  poolDefaults: {
    max: 1,
    min: 1,
    destroy: function(client) { client.close(); }
  },

  getRawConnection: function() {
    return new sqlite3.Database(this.connectionSettings.filename);
  }

});

// Extends the standard sql grammar.
Sqlite3Client.grammar = {

  // The keyword identifier wrapper format.
  wrapValue: function(value) {
    return (value !== '*' ? util.format('"%s"', value) : "*");
  },

  // Compile the "order by" portions of the query.
  compileOrders: function(qb, orders) {
    if (orders.length === 0) return;
    return "order by " + orders.map(function(order) {
      return this.wrap(order.column) + " collate nocase " + order.direction;
    }, this).join(', ');
  },

  // Compile an insert statement into SQL.
  compileInsert: function(qb) {
    var values = qb.values;
    var table = this.wrapTable(qb.table);
    var parameters = this.parameterize(values[0]);
    var paramBlocks = [];

    // If there is only one record being inserted, we will just use the usual query
    // grammar insert builder because no special syntax is needed for the single
    // row inserts in SQLite. However, if there are multiples, we'll continue.
    if (values.length === 1) {
      return require('../knex').Grammar.compileInsert.call(this, qb);
    }
    
    var keys = _.keys(values[0]).sort();
    var names = this.columnize(keys);
    var columns = [];

    // SQLite requires us to build the multi-row insert as a listing of select with
    // unions joining them together. So we'll build out this list of columns and
    // then join them all together with select unions to complete the queries.
    for (var i = 0, l = keys.length; i < l; i++) {
      var column = keys[i];
      columns.push('? as ' + this.wrap(column));
    }

    var joinedColumns = columns.join(', ');
    columns = [];
    for (i = 0, l = values.length; i < l; i++) {
      columns.push(joinedColumns);
    }

    return "insert into " + table + " (" + names + ") select " + columns.join(' union select ');
  },

  // Compile a truncate table statement into SQL.
  compileTruncate: function (qb) {
    var sql = {};
    sql['delete from sqlite_sequence where name = ?'] = [qb.from];
    sql['delete from ' + this.wrapTable(query.from)] = [];
    return sql;
  }
};

// Grammar for the schema builder.
Sqlite3Client.schemaGrammar = _.extend({}, base.schemaGrammar, Sqlite3Client.grammar, {
  
  // The possible column modifiers.
  modifiers: ['Nullable', 'Default', 'Increment'],
  
  // Compile the query to determine if a table exists.
  compileTableExists: function() {
    return "select * from sqlite_master where type = 'table' and name = ?";
  },

  // Compile a create table command.
  compileCreateTable: function(blueprint, command) {
    var columns = this.getColumns(blueprint).join(', ');
    var sql = 'create table ' + this.wrapTable(blueprint) + ' (' + columns;
    
    // SQLite forces primary keys to be added when the table is initially created
    // so we will need to check for a primary key commands and add the columns
    // to the table's declaration here so they can be created on the tables.
    sql += this.addForeignKeys(blueprint);
    sql += this.addPrimaryKeys(blueprint) || '';
    sql +=')';

    return sql;
  },

  // Get the foreign key syntax for a table creation statement.
  // Once we have all the foreign key commands for the table creation statement
  // we'll loop through each of them and add them to the create table SQL we
  // are building, since SQLite needs foreign keys on the tables creation.
  addForeignKeys: function(blueprint) {
    var sql = '';
    var foreigns = this.getCommandsByName(blueprint, 'foreign');
    for (var i = 0, l = foreigns.length; i < l; i++) {
      var foreign = foreigns[i];
      var on = this.wrapTable(foreign.on);
      var columns = this.columnize(foreign.columns);
      var onColumns = this.columnize(foreign.references);
      sql += ', foreign key(' + columns + ') references ' + on + '(' + onColumns + ')';
    }
    return sql;
  },
  
  // Get the primary key syntax for a table creation statement.
  addPrimaryKeys: function(blueprint) {
    var primary = this.getCommandByName(blueprint, 'primary');
    if (primary) {
      var columns = this.columnize(primary.columns);
      return ', primary key (' + columns + ')';
    }
  },

  // Compile alter table commands for adding columns
  compileAdd: function(blueprint, command) {
    var table = this.wrapTable(blueprint);
    var columns = this.prefixArray('add column', this.getColumns(blueprint));
    var statements = [];
    for (var i = 0, l = columns.length; i < l; i++) {
      statements.push('alter table ' + table + ' ' + columns[i]);
    }
    return statements;
  },

  // Compile a unique key command.
  compileUnique: function(blueprint, command) {
    var columns = this.columnize(command.columns);
    var table = this.wrapTable(blueprint);
    return 'create unique index ' + command.index + ' on ' + table + ' (' + columns + ')';
  },
  
  // Compile a plain index key command.
  compileIndex: function(blueprint, command) {
    var columns = this.columnize(command.columns);
    var table = this.wrapTable(blueprint);
    return 'create index ' + command.index + ' on ' + table + ' (' + columns + ')';
  },
  
  // Compile a foreign key command.
  compileForeign: function(blueprint, command) {
    // Handled on table creation...
  },
  
  // Compile a drop column command.
  compileDropColumn: function(blueprint, command) {
    throw new Error("Drop column not supported for SQLite.");
  },
  
  // Compile a drop unique key command.
  compileDropUnique: function(blueprint, command) {
    return 'drop index ' + command.index;
  },
  
  // Compile a drop index command.
  compileDropIndex: function(blueprint, command) {
    return 'drop index ' + command.index;
  },

  // Compile a rename table command.
  compileRenameTable: function(blueprint, command) {
    return 'alter table ' + this.wrapTable(blueprint) + ' rename to ' + this.wrapTable(command.to);
  },
  
  // Create the column definition for a string type.
  typeString: function(column) {
    return 'varchar';
  },
  
  // Create the column definition for a text type.
  typeText: function(column) {
    return 'text';
  },
  
  // Create the column definition for a integer type.
  typeInteger: function(column) {
    return 'integer';
  },
  
  // Create the column definition for a float type.
  typeFloat: function(column) {
    return 'float';
  },
  
  // Create the column definition for a decimal type.
  typeDecimal: function(column) {
    return 'float';
  },
  
  // Create the column definition for a boolean type.
  typeBoolean: function(column) {
    return 'tinyint';
  },

  // Create the column definition for a tinyint type.
  typeTinyInteger: function() {
    return 'tinyint';
  },
  
  // Create the column definition for a enum type.
  typeEnum: function(column) {
    return 'varchar';
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
    return 'datetime';
  },
  
  // Create the column definition for a binary type.
  typeBinary: function(column) {
    return 'blob';
  },
  
  // Get the SQL for a nullable column modifier.
  modifyNullable: function(blueprint, column) {
    return ' null';
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
      return ' primary key autoincrement';
    }
  }
});