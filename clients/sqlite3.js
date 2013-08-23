var When        = require('when');
var nodefn      = require('when/node/function');
var _           = require('underscore');
var util        = require('util');
var base        = require('./base');
var sqlite3     = require('sqlite3');

// Constructor for the Sqlite3Client
var Sqlite3Client = module.exports = function(name, options) {
  base.setup.call(this, Sqlite3Client, name, options);
  this.dialect = 'sqlite3';
};

_.extend(Sqlite3Client.prototype, base.protoProps, {

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
        var method = (builder.type === 'insert' ||
          builder.type === 'update' || builder.type === 'delete') ? 'run' : 'all';

        // If we have a debug flag set, console.log the query.
        if (debug) base.debug(builder, conn);

        // Call the querystring and then release the client
        conn[method](builder.sql, builder.bindings, function (err, resp) {

          if (err) return dfd.reject(err);

          if (builder._source === 'Raw') return dfd.resolve(resp);

          if (builder._source === 'SchemaBuilder') {
            if (builder.type === 'tableExists') {
              return dfd.resolve(resp.length > 0);
            } else {
              return dfd.resolve(null);
            }
          }

          if (builder.type === 'select') {
            resp = base.skim(resp);
          } else if (builder.type === 'insert') {
            resp = [this.lastID];
          } else if (builder.type === 'delete' || builder.type === 'update') {
            resp = this.changes;
          } else {
            resp = '';
          }

          dfd.resolve(resp);
        });

        // Empty the connection after we run the query, unless one was specifically
        // set (in the case of transactions, etc).
        return dfd.promise.ensure(function(resp) {
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

  getRawConnection: function(callback) {
    var client = new sqlite3.Database(this.connectionSettings.filename, function(err) {
      callback(err, client);
    });
  },

  // Begins a transaction statement on the instance,
  // resolving with the connection of the current transaction.
  startTransaction: function() {
    return this.getConnection().then(function(connection) {
      return nodefn.call(connection.run.bind(connection), 'begin;', []).then(function() {
        return connection;
      });
    });
  },

  finishTransaction: function(type, trans, dfd, msg) {
    var ctx = this;
    nodefn.call(trans.connection.run.bind(trans.connection), type + ';', []).then(function(resp) {
      if (type === 'commit') dfd.resolve(msg || resp);
      if (type === 'rollback') dfd.reject(msg || resp);
    }).ensure(function() {
      ctx.releaseConnection(trans.connection);
      trans.connection = null;
    });
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
    var columns = _.pluck(values[0], 0);

    // If there are any "where" clauses, we need to omit
    // any bindings that may have been associated with them.
    if (qb.wheres.length > 0) this._clearWhereBindings(qb);

    // If there is only one record being inserted, we will just use the usual query
    // grammar insert builder because no special syntax is needed for the single
    // row inserts in SQLite. However, if there are multiples, we'll continue.
    if (values.length === 1) {
      var sql = 'insert into ' + table + ' ';
      if (columns.length === 0) {
        sql += 'default values';
      } else {
        sql += "(" + this.columnize(columns) + ") values " + "(" + this.parameterize(_.pluck(values[0], 1)) + ")";
      }
      return sql;
    }

    var blocks = [];

    // SQLite requires us to build the multi-row insert as a listing of select with
    // unions joining them together. So we'll build out this list of columns and
    // then join them all together with select unions to complete the queries.
    for (var i = 0, l = columns.length; i < l; i++) {
      blocks.push('? as ' + this.wrap(columns[i]));
    }

    var joinedColumns = blocks.join(', ');
    blocks = [];
    for (i = 0, l = values.length; i < l; i++) {
      blocks.push(joinedColumns);
    }

    return "insert into " + table + " (" + this.columnize(columns) + ") select " + blocks.join(' union all select ');
  },

  // Compile a truncate table statement into SQL.
  compileTruncate: function (qb) {
    var sql = [];
    var table = this.wrapTable(qb.table);
    sql.push('delete from sqlite_sequence where name = ' + table);
    sql.push('delete from ' + table);
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
  compileCreateTable: function(blueprint) {
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
    var commands = this.getCommandsByName(blueprint, 'foreign');
    for (var i = 0, l = commands.length; i < l; i++) {
      var command = commands[i];
      var column = this.columnize(command.columns);
      var foreignTable = this.wrapTable(command.foreignTable);
      var foreignColumn = this.columnize([command.foreignColumn]);
      sql += ', foreign key(' + column + ') references ' + foreignTable + '(' + foreignColumn + ')';
    }
    return sql;
  },

  // Get the primary key syntax for a table creation statement.
  addPrimaryKeys: function(blueprint) {
    var primary = this.getCommandByName(blueprint, 'primary');
    if (primary) {
      // Ensure that autoincrement columns aren't handled here, this is handled
      // alongside the autoincrement clause.
      primary.columns = _.reduce(primary.columns, function(memo, column) {
        if (column.autoIncrement !== true) memo.push(column);
        return memo;
      }, []);
      if (primary.columns.length > 0) {
        var columns = this.columnize(primary.columns);
        return ', primary key (' + columns + ')';
      }
    }
  },

  // Compile alter table commands for adding columns
  compileAdd: function(blueprint) {
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
  compileForeign: function() {
    // Handled on table creation...
  },

  // Compile a drop column command.
  compileDropColumn: function() {
    throw new Error("Drop column not supported for SQLite.");
  },

  // Compile a drop unique key command.
  compileDropUnique: function(blueprint, command) {
    return 'drop index ' + command.index;
  },

  // Compile a rename table command.
  compileRenameTable: function(blueprint, command) {
    return 'alter table ' + this.wrapTable(blueprint) + ' rename to ' + this.wrapTable(command.to);
  },

  // Create the column definition for a integer type.
  typeInteger: function() {
    return 'integer';
  },

  // Create the column definition for a float type.
  typeFloat: function() {
    return 'float';
  },

  // Create the column definition for a decimal type.
  typeDecimal: function() {
    return 'float';
  },

  // Create the column definition for a boolean type.
  typeBoolean: function() {
    return 'tinyint';
  },

  // Create the column definition for a enum type.
  typeEnum: function() {
    return 'varchar';
  },

  // Create the column definition for a date-time type.
  typeDateTime: function() {
    return 'datetime';
  },

  // Create the column definition for a timestamp type.
  typeTimestamp: function() {
    return 'datetime';
  },

  // Get the SQL for a nullable column modifier.
  modifyNullable: function() {
    return ' null';
  },

  // Get the SQL for an auto-increment column modifier.
  modifyIncrement: function(blueprint, column) {
    if (column.type == 'integer' && column.autoIncrement) {
      return ' primary key autoincrement';
    }
  }
});