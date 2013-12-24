!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(["bluebird", "lodash"], e):"undefined"!=typeof window?window.knex=e():"undefined"!=typeof global?global.knex=e():"undefined"!=typeof self&&(self.knex=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// ClientBase
// ----------
var Helpers = require('../lib/helpers').Helpers;

// The `ClientBase` is assumed as the object that all database `clients`
// inherit from, and is used in an `instanceof` check when initializing the
// library. If you wish to write or customize an adapter, just inherit from
// this base, with `ClientBase.extend`, and you're good to go.
var ClientBase = function() {};

// The methods assumed when building a client.
ClientBase.prototype = {

  // Gets the raw connection for the current client.
  getRawConnection: function() {},

  // Execute a query on the specified `Builder` or `SchemaBuilder`
  // interface. If a `connection` is specified, use it, otherwise
  // acquire a connection, and then dispose of it when we're done.
  query: function() {},

  // Retrieves a connection from the connection pool,
  // returning a promise.
  getConnection: function() {},

  // Releases a connection from the connection pool,
  // returning a promise.
  releaseConnection: function(conn) {},

  // Begins a transaction statement on the instance,
  // resolving with the connection of the current transaction.
  startTransaction: function() {},

  // Finishes a transaction, taking the `type`
  finishTransaction: function(type, transaction, msg) {},

  // The pool defaults.
  poolDefaults: function() {}

};

// Grab the standard `Object.extend` as popularized by Backbone.js.
ClientBase.extend = Helpers.extend;

exports.ClientBase = ClientBase;

},{"../lib/helpers":15}],2:[function(require,module,exports){
// Grammar
// -------

// The "Grammar" is a collection of functions
// which help to reliably compile the various pieces
// of SQL into a valid, escaped query. These functions
// are combined with dialect specific "Grammar" functions
// to keep the interface database agnostic.
var _       = require('lodash');

var Raw     = require('../../lib/raw').Raw;
var Helpers = require('../../lib/helpers').Helpers;

var push    = [].push;

// The list of different components
var components = [
  'columns', 'aggregates', 'from',
  'joins', 'wheres', 'groups', 'havings',
  'orders', 'limit', 'offset', 'unions'
];

exports.baseGrammar = {

  // Compiles the current query builder.
  toSql: function(builder) {
    builder.type = builder.type || 'select';
    return builder.grammar['compile' + Helpers.capitalize(builder.type)](builder);
  },

  // Gets the cleaned bindings.
  getBindings: function(builder) {
    var bindings = builder.bindings;
    var cleaned = [];
    for (var i = 0, l = bindings.length; i < l; i++) {
      // if (bindings[i] == void 0) continue;
      if (!bindings[i] || bindings[i]._source !== 'Raw') {
        cleaned.push(bindings[i]);
      } else {
        push.apply(cleaned, bindings[i].bindings);
      }
    }
    return cleaned;
  },

  // Compiles the `select` statement, or nested sub-selects
  // by calling each of the component compilers, trimming out
  // the empties, and returning a generated query string.
  compileSelect: function(qb) {
    var sql = [];
    if (_.isEmpty(qb.columns) && _.isEmpty(qb.aggregates)) qb.columns = ['*'];
    for (var i = 0, l = components.length; i < l; i++) {
      var component = components[i];
      var result = _.result(qb, component);
      if (result != null) {
        sql.push(this['compile' + Helpers.capitalize(component)](qb, result));
      }
    }
    // If there is a transaction, and we have either `forUpdate` or `forShare` specified,
    // call the appropriate additions to the select statement.
    if (qb.transaction && qb.flags.selectMode) {
      sql.push(this['compile' + qb.flags.selectMode](qb));
    }
    return _.compact(sql).join(' ');
  },

  // Compiles the columns with aggregate functions.
  compileAggregates: function(qb) {
    var sql = [], segments, column;
    for (var i = 0, l = qb.aggregates.length; i < l; i++) {
      var aggregate = qb.aggregates[i];
      if (aggregate.columns.toLowerCase().indexOf(' as ') !== -1) {
        segments = aggregate.columns.split(' ');
        column = segments[0];
      } else {
        column = aggregate.columns;
      }
      sql.push(aggregate.type + '(' + this.wrap(column) + ')' + (segments ? ' as ' + this.wrap(segments[2]) : ''));
    }
    return sql.join(', ');
   },

  // Compiles the columns in the query, specifying if an item was distinct.
  compileColumns: function(qb, columns) {
    return (qb.flags.distinct ? 'select distinct' : 'select') + ((_.isArray(columns) && _.isEmpty(columns)) ? '' : ' '+this.columnize(columns));
  },

  // Compiles the `from` tableName portion of the query.
  compileFrom: function(qb, table) {
    return 'from ' + this.wrapTable(table);
  },

  // Compiles all each of the `join` clauses on the query,
  // including any nested join queries.
  compileJoins: function(qb, joins) {
    var sql = [];
    for (var i = 0, l = joins.length; i < l; i++) {
      var join = joins[i];
      var clauses = [];
      for (var i2 = 0, l2 = join.clauses.length; i2 < l2; i2++) {
        var clause = join.clauses[i2];
        clauses.push(
          [clause['bool'], this.wrap(clause['first']), clause.operator, this.wrap(clause['second'])].join(' ')
        );
      }
      clauses[0] = clauses[0].replace(/and |or /, '');
      sql.push(join.joinType + ' join ' + this.wrapTable(join.table) + ' on ' + clauses.join(' '));
    }
    return sql.join(' ');
  },

  // Compiles all `where` statements on the query.
  compileWheres: function(qb) {
    var sql = [];
    var wheres = qb.wheres;
    if (wheres.length === 0) return '';
    for (var i = 0, l = wheres.length; i < l; i++) {
      var where = wheres[i];
      sql.push(where.bool + ' ' + this['where' + where.type](qb, where));
    }
    return (sql.length > 0 ? 'where ' + sql.join(' ').replace(/and |or /, '') : '');
  },

  // Compile the "union" queries attached to the main query.
  compileUnions: function(qb) {
    var sql = '';
    for (var i = 0, l = qb.unions.length; i < l; i++) {
      var union = qb.unions[i];
      sql += (union.all ? 'union all ' : 'union ') + this.compileSelect(union.query);
    }
    return sql;
  },

  // Compiles a nested where clause.
  whereNested: function(qb, where) {
    return '(' + this.compileWheres(where.query).slice(6) + ')';
  },

  // Compiles a nested where clause.
  whereSub: function(qb, where) {
    return this.wrap(where.column) + ' ' + where.operator + ' (' + (this.compileSelect(where.query)) + ')';
  },

  // Compiles a basic where clause.
  whereBasic: function(qb, where) {
    return this.wrap(where.column) + ' ' + where.operator + ' ' + this.parameter(where.value);
  },

  // Compiles a basic exists clause.
  whereExists: function(qb, where) {
    return 'exists (' + this.compileSelect(where.query) + ')';
  },

  // Compiles a basic not exists clause.
  whereNotExists: function(qb, where) {
    return 'not exists (' + this.compileSelect(where.query) + ')';
  },

  // Compiles a where in clause.
  whereIn: function(qb, where) {
    return this.wrap(where.column) + ' in (' + this.parameterize(where.value) + ')';
  },

  // Compiles a where not in clause.
  whereNotIn: function(qb, where) {
    return this.wrap(where.column) + ' not in (' + this.parameterize(where.value) + ')';
  },

  // Compiles a sub-where in clause.
  whereInSub: function(qb, where) {
    return this.wrap(where.column) + ' in (' + this.compileSelect(where.query) + ')';
  },

  // Compiles a sub-where not in clause.
  whereNotInSub: function(qb, where) {
    return this.wrap(where.column) + ' not in (' + this.compileSelect(where.query) + ')';
  },

  // Where between.
  whereBetween: function(qb, where) {
    return this.wrap(where.column) + ' between ? and ?';
  },

  whereNull: function(qb, where) {
    return this.wrap(where.column) + ' is null';
  },

  whereNotNull: function(qb, where) {
    return this.wrap(where.column) + ' is not null';
  },

  whereRaw: function(qb, where) {
    return where.sql;
  },

  // Compiles the `group by` columns.
  compileGroups: function(qb, groups) {
    return 'group by ' + this.columnize(groups);
  },

  // Compiles the `having` statements.
  compileHavings: function(qb, havings) {
    if (!havings.length) return;
    var h = 'having ' + havings.map(function(having) {
      if (having.type === 'Raw') {
        return having.bool + ' ' + having.sql;
      }
      return having.bool + ' ' + this.wrap(having.column) + ' ' + having.operator + ' ' + this.parameter(having['value']);
    }, this);
    return h.replace(/and |or /, '');
  },

  // Compiles the `order by` statements.
  compileOrders: function(qb, orders) {
    if (orders.length > 0) {
      return 'order by ' + orders.map(function(order) {
        return '' + this.wrap(order.column) + ' ' + order.direction;
      }, this).join(', ');
    }
  },

  // Compiles the `limit` statements.
  compileLimit: function(qb, limit) {
    return 'limit ' + limit;
  },

  // Compiles an `offset` statement on the query.
  compileOffset: function(qb, offset) {
    return 'offset ' + offset;
  },

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  compileInsert: function(qb) {
    var values      = qb.values;
    var table       = this.wrapTable(qb.table);
    var columns     = _.pluck(values[0], 0);
    var paramBlocks = [];

    // If there are any "where" clauses, we need to omit
    // any bindings that may have been associated with them.
    if (qb.wheres.length > 0) this.clearWhereBindings(qb);

    for (var i = 0, l = values.length; i < l; ++i) {
      paramBlocks.push("(" + this.parameterize(_.pluck(values[i], 1)) + ")");
    }

    return "insert into " + table + " (" + this.columnize(columns) + ") values " + paramBlocks.join(', ');
  },

  // Depending on the type of `where` clause, this will appropriately
  // remove any binding caused by "where" constraints, allowing the same
  // query to be used for `insert` and `update` without issue.
  clearWhereBindings: function(qb) {
    var wheres = qb.wheres;
    var bindingCount = 0;
    for (var i = 0, l = wheres.length; i<l; i++) {
      var where = wheres[i];
      if (_.isArray(where.value)) {
        bindingCount += where.value.length;
      } else if (where.query) {
        bindingCount += where.query.bindings.length;
      } else {
        bindingCount += 1;
      }
    }
    qb.bindings = qb.bindings.slice(bindingCount);
  },

  // Compiles an `update` query.
  compileUpdate: function(qb) {
    var values = qb.values;
    var table = this.wrapTable(qb.table), columns = [];
    for (var i=0, l = values.length; i < l; i++) {
      var value = values[i];
      columns.push(this.wrap(value[0]) + ' = ' + this.parameter(value[1]));
    }
    return 'update ' + table + ' set ' + columns.join(', ') + ' ' + this.compileWheres(qb);
  },

  // Compiles a `delete` query.
  compileDelete: function(qb) {
    var table = this.wrapTable(qb.table);
    var where = !_.isEmpty(qb.wheres) ? this.compileWheres(qb) : '';
    return 'delete from ' + table + ' ' + where;
  },

  // Compiles a `truncate` query.
  compileTruncate: function(qb) {
    return 'truncate ' + this.wrapTable(qb.table);
  },

  // Adds a `for update` clause to the query, relevant with transactions.
  compileForUpdate: function() {
    return 'for update';
  },

  // Adds a `for share` clause to the query, relevant with transactions.
  compileForShare: function() {
    return 'for share';
  },

  // Puts the appropriate wrapper around a value depending on the database
  // engine, unless it's a knex.raw value, in which case it's left alone.
  wrap: function(value) {
    var segments;
    if (value instanceof Raw) return value.sql;
    if (_.isNumber(value)) return value;
    if (value.toLowerCase().indexOf(' as ') !== -1) {
      segments = value.split(' ');
      return this.wrap(segments[0]) + ' as ' + this.wrap(segments[2]);
    }
    var wrapped = [];
    segments = value.split('.');
    for (var i = 0, l = segments.length; i < l; i = ++i) {
      value = segments[i];
      if (i === 0 && segments.length > 1) {
        wrapped.push(this.wrapTable(value));
      } else {
        wrapped.push(this.wrapValue(value));
      }
    }
    return wrapped.join('.');
  },

  wrapArray: function(values) {
    return _.map(values, this.wrap, this);
  },

  wrapTable: function(table) {
    if (table instanceof Raw) return table.sql;
    return this.wrap(table);
  },

  columnize: function(columns) {
    if (!_.isArray(columns)) columns = [columns];
    return _.map(columns, this.wrap, this).join(', ');
  },

  parameterize: function(values) {
    if (!_.isArray(values)) values = [values];
    return _.map(values, this.parameter, this).join(', ');
  },

  parameter: function(value) {
    return (value instanceof Raw ? value.sql : '?');
  }
};

},{"../../lib/helpers":15,"../../lib/raw":19,"lodash":false}],3:[function(require,module,exports){
// SchemaGrammar
// -------

// The "SchemaGrammar" is a layer which helps in compiling
// valid data definition language (DDL) statements in
// to create, alter, or destroy the various tables, columns,
// and metadata in our database schema. These functions
// are combined with dialect specific "SchemaGrammar"
// functions to keep the interface database agnostic.
var _             = require('lodash');

var baseGrammar   = require('./grammar').baseGrammar;
var SchemaBuilder = require('../../lib/schemabuilder').SchemaBuilder;

var Helpers       = require('../../lib/helpers').Helpers;
var Raw           = require('../../lib/raw').Raw;

exports.baseSchemaGrammar = {

  // The toSql on the "schema" is different than that on the "builder",
  // it produces an array of sql statements to be used in the creation
  // or modification of the query, which are each run in sequence
  // on the same connection.
  toSql: function(builder) {

    // Clone the builder, before we go about working with the columns & commands.
    // TODO: Clean this up.
    builder = builder.clone();

    // Add the commands that are implied by the blueprint.
    if (builder.columns.length > 0 && !builder.creating()) {
      builder.commands.unshift({name: 'add'});
    }

    // Add an "additional" command, for any extra dialect-specific logic.
    builder.commands.push({name: 'additional'});

    // Add indicies
    for (var i = 0, l = builder.columns.length; i < l; i++) {
      var column = builder.columns[i];
      var indices = ['primary', 'unique', 'index', 'foreign'];

      continueIndex:
      for (var i2 = 0, l2 = indices.length; i2 < l2; i2++) {
        var index = indices[i2];
        var indexVar = 'is' + Helpers.capitalize(index);

        // If the index has been specified on the given column, but is simply
        // equal to "true" (boolean), no name has been specified for this
        // index, so we will simply call the index methods without one.
        if (column[indexVar] === true) {
          builder[index](column, null);
          continue continueIndex;

        // If the index has been specified on the column and it is something
        // other than boolean true, we will assume a name was provided on
        // the index specification, and pass in the name to the method.
        } else if (_.has(column, indexVar)) {
          builder[index](column.name, column[indexVar], column);
          continue continueIndex;
        }
      }
    }

    var statements = [];

    // Each type of command has a corresponding compiler function on the schema
    // grammar which is used to build the necessary SQL statements to build
    // the blueprint element, so we'll just call that compilers function.
    for (i = 0, l = builder.commands.length; i < l; i++) {
      var command = builder.commands[i];
      var method = 'compile' + Helpers.capitalize(command.name);
      if (_.has(this, method)) {
        var sql = this[method](builder, command);
        if (sql) statements = statements.concat(sql);
      }
    }

    return statements;
  },

  // Compile a foreign key command.
  compileForeign: function(blueprint, command) {
    var sql;
    if (command.foreignTable && command.foreignColumn) {
      var table = this.wrapTable(blueprint);
      var column = this.columnize(command.columns);
      var foreignTable = this.wrapTable(command.foreignTable);
      var foreignColumn = this.columnize(command.foreignColumn);

      sql = "alter table " + table + " add constraint " + command.index + " ";
      sql += "foreign key (" + column + ") references " + foreignTable + " (" + foreignColumn + ")";

      // Once we have the basic foreign key creation statement constructed we can
      // build out the syntax for what should happen on an update or delete of
      // the affected columns, which will get something like "cascade", etc.
      if (command.commandOnDelete) sql += " on delete " + command.commandOnDelete;
      if (command.commandOnUpdate) sql += " on update " + command.commandOnUpdate;
    }
    return sql;
  },

  // Each of the column types have their own compiler functions which are
  // responsible for turning the column definition into its SQL format
  // for the platform. Then column modifiers are compiled and added.
  getColumns: function(blueprint) {
    var columns = [];
    for (var i = 0, l = blueprint.columns.length; i < l; i++) {
      var column = blueprint.columns[i];
      var sql = this.wrap(column) + ' ' + this.getType(column, blueprint);
      columns.push(this.addModifiers(sql, blueprint, column));
    }
    return columns;
  },

  // Add the column modifiers to the definition.
  addModifiers: function(sql, blueprint, column) {
    for (var i = 0, l = this.modifiers.length; i < l; i++) {
      var modifier = this.modifiers[i];
      var method = "modify" + modifier;
      if (_.has(this, method)) {
        sql += this[method](blueprint, column) || '';
      }
    }
    return sql;
  },

  // Get the SQL for the column data type.
  getType: function(column, blueprint) {
    return this['type' + Helpers.capitalize(column.type)](column, blueprint);
  },

  // Add a prefix to an array of values, utilized in the client libs.
  prefixArray: function(prefix, values) {
    return _.map(values, function(value) { return prefix + ' ' + value; });
  },

  // Wrap a table in keyword identifiers.
  wrapTable: function(table) {
    if (table instanceof SchemaBuilder) table = table.table;
    return baseGrammar.wrapTable.call(this, table);
  },

  // Wrap a value in keyword identifiers.
  wrap: function(value) {
    if (value && value.name) value = value.name;
    return baseGrammar.wrap.call(this, value);
  },

  // Format a value so that it can be used in "default" clauses.
  getDefaultValue: function(value) {
    if (value instanceof Raw) return value.sql;
    if (value === true || value === false) {
      return parseInt(value, 10);
    }
    return '' + value;
  },

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

  // Default for a biginteger type in database in other databases.
  typeBigInteger: function(column) {
    return this.typeInteger(column);
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

  // Create a specific type
  typeSpecificType: function(column) {
    return column.specific;
  },

  // Get the SQL for a nullable column modifier.
  modifyNullable: function(blueprint, column) {
    if (column.isNullable === false) {
      return ' not null';
    }
  },

  // Get the SQL for a default column modifier.
  modifyDefault: function(blueprint, column) {
    if (column.defaultValue != void 0) {
      return " default '" + this.getDefaultValue(column.defaultValue) + "'";
    }
  }

};

},{"../../lib/helpers":15,"../../lib/raw":19,"../../lib/schemabuilder":20,"./grammar":2,"lodash":false}],4:[function(require,module,exports){
// SQLite3 Grammar
// -------

// The SQLite3 base is a bit different than the other clients,
// in that it may be run on both the client and server. So add another
// layer to the prototype chain.
var _           = require('lodash');
var Helpers     = require('../../../lib/helpers').Helpers;
var baseGrammar = require('../grammar').baseGrammar;

// Extends the standard sql grammar, with any SQLite specific
// dialect oddities.
exports.grammar = _.defaults({

  // The keyword identifier wrapper format.
  wrapValue: function(value) {
    return (value !== '*' ? Helpers.format('"%s"', value) : "*");
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
    var values  = qb.values;
    var table   = this.wrapTable(qb.table);
    var columns = _.pluck(values[0], 0);

    // If there are any "where" clauses, we need to omit
    // any bindings that may have been associated with them.
    if (qb.wheres.length > 0) this.clearWhereBindings(qb);

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
  },

  // For share and for update are not available in sqlite3.
  compileForUpdate: function() {},
  compileForShare:  function() {}

}, baseGrammar);

},{"../../../lib/helpers":15,"../grammar":2,"lodash":false}],5:[function(require,module,exports){
// SQLite3 SchemaGrammar
// -------

var _                 = require('lodash');
var grammar           = require('./grammar').grammar;
var baseSchemaGrammar = require('../schemagrammar').baseSchemaGrammar;

// Grammar for the schema builder.
exports.schemaGrammar = _.defaults({

  // The possible column modifiers.
  modifiers: ['Nullable', 'Default', 'Increment'],

  // Returns the cleaned bindings for the current query.
  getBindings: function(builder) {
    if (builder.type === 'columnExists') return [];
    return grammar.getBindings(builder);
  },

  // Compile the query to determine if a table exists.
  compileTableExists: function() {
    return "select * from sqlite_master where type = 'table' and name = ?";
  },

  // Compile the query to determine if a column exists.
  compileColumnExists: function(builder) {
    return "PRAGMA table_info(" + this.wrapTable(builder) + ")";
  },

  // Compile a create table command.
  compileCreateTable: function(builder) {
    var columns = this.getColumns(builder).join(', ');
    var sql = 'create table ' + this.wrapTable(builder) + ' (' + columns;

    // SQLite forces primary keys to be added when the table is initially created
    // so we will need to check for a primary key commands and add the columns
    // to the table's declaration here so they can be created on the tables.
    sql += this.addForeignKeys(builder);
    sql += this.addPrimaryKeys(builder) || '';
    sql +=')';

    return sql;
  },

  // Get the foreign key syntax for a table creation statement.
  // Once we have all the foreign key commands for the table creation statement
  // we'll loop through each of them and add them to the create table SQL we
  // are building, since SQLite needs foreign keys on the tables creation.
  addForeignKeys: function(builder) {
    var sql = '';
    var commands = this.getCommandsByName(builder, 'foreign');
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
  addPrimaryKeys: function(builder) {
    var primary = this.getCommandByName(builder, 'primary');
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
  compileAdd: function(builder) {
    var table = this.wrapTable(builder);
    var columns = this.prefixArray('add column', this.getColumns(builder));
    var statements = [];
    for (var i = 0, l = columns.length; i < l; i++) {
      statements.push('alter table ' + table + ' ' + columns[i]);
    }
    return statements;
  },

  // Compile a unique key command.
  compileUnique: function(builder, command) {
    var columns = this.columnize(command.columns);
    var table = this.wrapTable(builder);
    return 'create unique index ' + command.index + ' on ' + table + ' (' + columns + ')';
  },

  // Compile a plain index key command.
  compileIndex: function(builder, command) {
    var columns = this.columnize(command.columns);
    var table = this.wrapTable(builder);
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
  compileDropUnique: function(builder, command) {
    return 'drop index ' + command.index;
  },

  // Compile a rename table command.
  compileRenameTable: function(builder, command) {
    return 'alter table ' + this.wrapTable(builder) + ' rename to ' + this.wrapTable(command.to);
  },

  // Compile a rename column command.
  compileRenameColumn: function(builder, command) {
    return '__rename_column__';
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

  // Get the SQL for an auto-increment column modifier.
  modifyIncrement: function(builder, column) {
    if (column.autoIncrement && (column.type == 'integer' || column.type == 'bigInteger')) {
      return ' primary key autoincrement not null';
    }
  }
}, baseSchemaGrammar, grammar);

},{"../schemagrammar":3,"./grammar":4,"lodash":false}],6:[function(require,module,exports){
// WebBase
// -------
var _          = require('lodash');

var ClientBase = require('../base').ClientBase;
var Promise    = require('../../lib/promise').Promise;

var grammar       = require('./sqlite3/grammar').grammar;
var schemaGrammar = require('./sqlite3/schemagrammar').schemaGrammar;

var ServerBase = module.exports = ClientBase.extend({

  // Pass a config object into the constructor,
  // which then initializes the pool and
  constructor: function(config) {
    if (config.debug) this.isDebugging = true;
    this.name = config.name || 'knex_database';
    this.attachGrammars();
    this.connectionSettings = config.connection;
  },

  // Attach the appropriate grammar definitions onto the current client.
  attachGrammars: function() {
    this.grammar = grammar;
    this.schemaGrammar = schemaGrammar;
  },

  // Execute a query on the specified Builder or QueryBuilder
  // interface. If a `connection` is specified, use it, otherwise
  // acquire a connection, and then dispose of it when we're done.
  query: Promise.method(function(builder) {
    var conn, client = this;
    var sql        = builder.toSql(builder);
    var bindings   = builder.getBindings();

    var chain = this.getConnection(builder)
      .bind(builder)
      .then(function(connection) {
        if (client.isDebugging || this.flags.debug) {
          client.debug(sql, bindings, connection, this);
        }
        conn = connection;
        if (_.isArray(sql)) {
          var current = Promise.fulfilled();
          return Promise.map(sql, function(query, i) {
            current = current.then(function () {
              builder.currentIndex = i;
              return client.runQuery(connection, query, bindings, builder);
            });
            return current;
          });
        }
        return client.runQuery(connection, sql, bindings, builder);
      });

    // Since we usually only need the `sql` and `bindings` to help us debug the query, output them
    // into a new error... this way, it `console.log`'s nicely for debugging, but you can also
    // parse them out with a `JSON.parse(error.message)`. Also, use the original `clientError` from the
    // database client is retained as a property on the `newError`, for any additional info.
    return chain.then(builder.handleResponse).caught(function(error) {
      var newError = new Error(error.message + ', sql: ' + sql + ', bindings: ' + bindings);
          newError.sql = sql;
          newError.bindings = bindings;
          newError.clientError = error;
      throw newError;
    });
  }),

  // Debug a query.
  debug: function(sql, bindings, connection, builder) {
    if (typeof console !== "undefined") {
      console.log('Debug: ' + JSON.stringify({sql: sql, bindings: bindings, cid: connection.__cid}));
    }
  },

  // Retrieves a connection from the connection pool,
  // returning a promise.
  getConnection: Promise.method(function(builder) {
    if (builder && builder.usingConnection) return builder.usingConnection;
    var db = openDatabase(this.name, '1.0', this.name, 65536);
    var dfd = Promise.defer();
    db.transaction(function(t) {
      t.__cid = _.uniqueId('__cid');
      if (builder) builder.usingConnection = builder;
      dfd.resolve(t);
    });
    return dfd.promise;
  }),

  // Begins a transaction statement on the instance,
  // resolving with the connection of the current transaction.
  startTransaction: Promise.method(function() {
    return this.getConnection();
  }),

  // Finishes the transaction statement on the instance.
  finishTransaction: Promise.method(function(type, transaction, msg) {
    if (msg instanceof Error) {
      throw msg;
    } else {
      throw new Error(msg);
    }
  })

});
},{"../../lib/promise":18,"../base":1,"./sqlite3/grammar":7,"./sqlite3/schemagrammar":8,"lodash":false}],7:[function(require,module,exports){
// SQLite3 Grammar
// -------
var _           = require('lodash');
var Helpers     = require('../../../lib/helpers').Helpers;
var baseGrammar = require('../../base/sqlite3/grammar').grammar;

// Extends the base SQLite3 grammar, adding only the functions
// specific to the server.
exports.grammar = _.defaults({

  // Ensures the response is returned in the same format as other clients.
  handleResponse: function(builder, resp) {
    if (builder.type === 'select') {
      var obj = [];
      for (var i = 0, l = resp.rows.length; i < l; i++) {
        obj[i] = resp.rows.item(i);
      }
      return obj;
    } else if (builder.type === 'insert') {
      resp = [resp.insertId];
    } else if (builder.type === 'delete' || builder.type === 'update') {
      resp = resp.rowsAffected;
    }
    return resp;
  }

}, baseGrammar);
},{"../../../lib/helpers":15,"../../base/sqlite3/grammar":4,"lodash":false}],8:[function(require,module,exports){
// SQLite3 SchemaGrammar
// -------
var _                 = require('lodash');
var baseSchemaGrammar = require('../../base/sqlite3/schemagrammar').schemaGrammar;

exports.schemaGrammar = _.defaults({

  // Ensures the response is returned in the same format as other clients.
  handleResponse: function(builder, resp) {
    // This is an array, so we'll assume that the relevant info is on the first statement...
    if (builder.type === 'tableExists') {
      return resp[0].rows.length > 0;
    } else if (builder.type === 'columnExists') {
      return _.findWhere(resp, {name: builder.bindings[1]}) != null;
    }
    return resp;
  }

}, baseSchemaGrammar);

},{"../../base/sqlite3/schemagrammar":5,"lodash":false}],9:[function(require,module,exports){
// SQLite3 - WebSQL
// ----------
var _       = require('lodash');

// All other local project modules needed in this scope.
var ClientBase      = require('./base');
var Builder         = require('../../lib/builder').Builder;
var Transaction     = require('../../lib/transaction').Transaction;
var SchemaInterface = require('../../lib/schemainterface').SchemaInterface;
var Promise         = require('../../lib/promise').Promise;

// Constructor for the SQLite3Client.
module.exports = ClientBase.extend({

  dialect: 'sqlite3',

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  runQuery: Promise.method(function(connection, sql, bindings, builder) {
    if (!connection) throw new Error('No database connection exists for the query');
    if (sql === '__rename_column__') {
      return this.ddl(connection, sql, bindings, builder);
    }
    // Call the querystring and then release the client
    var dfd = Promise.pending();
    connection.executeSql(sql, bindings, function(trx, resp) {
      dfd.fulfill(resp, trx);
    }, function(trx, err) {
      dfd.reject(err, trx);
      return true;
    });
    return dfd.promise;
  }),

  ddl: function(connection, sql, bindings, builder) {
    return this.alterSchema.call(client, builder, connection);
  },

  // This needs to be refactored... badly.
  alterSchema: function(builder, trx) {
    var currentCol, command;
    var query = function() {
      return new Promise(function(resolve, reject) {
        trx.executeSql(connection, function(trx, data) {
          resolve(data, trx);
        }, function(trx, err) {
          reject(err, trx);
        });
      });
    };

    return Promise.all([
      query('PRAGMA table_info(' + builder.table + ')', []),
      query('SELECT name, sql FROM sqlite_master WHERE type="table" AND name="' + builder.table + '"', [])
    ])
    .tap(function(resp) {
      var pragma = resp[0];
      var sql    = resp[1][0];
      command = builder.commands[builder.currentIndex];
      if (!(currentCol = _.findWhere(pragma, {name: command.from}))) {
        throw new Error('The column ' + command.from + ' is not in the current table');
      }
      return query('ALTER TABLE ' + sql.name + ' RENAME TO __migrate__' + sql.name);
    }).spread(function(pragma, sql) {
      sql = sql[0];
      var currentColumn = '"' + command.from + '" ' + currentCol.type;
      var newColumn     = '"' + command.to   + '" ' + currentCol.type;
      if (sql.sql.indexOf(currentColumn) === -1) {
        return trx.reject('Unable to find the column to change');
      }
      return Promise.all([
        query(sql.sql.replace(currentColumn, newColumn)),
        query('SELECT * FROM "__migrate__' + sql.name + '"'),
      ]);
    }).spread(function(createTable, selected) {
      var qb = new Builder(builder.knex).transacting(trx);
          qb.table = builder.table;
      return Promise.all([
        qb.insert(_.map(selected, function(row) {
          row[command.to] = row[command.from];
          return _.omit(row, command.from);
        })),
        query('DROP TABLE "__migrate__' + builder.table + '"')
      ]);
    });
  }

});
},{"../../lib/builder":12,"../../lib/promise":18,"../../lib/schemainterface":21,"../../lib/transaction":23,"./base":6,"lodash":false}],10:[function(require,module,exports){
// Knex.js  0.5.2
// --------------

//     (c) 2013 Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org

// Base library dependencies of the app.
var _ = require('lodash');

// Require the main constructors necessary for a `Knex` instance,
// each of which are injected with the current instance, so they maintain
// the correct client reference & grammar.
var Raw         = require('./lib/raw').Raw;
var Transaction = require('./lib/transaction').Transaction;
var Builder     = require('./lib/builder').Builder;
var Promise     = require('./lib/promise').Promise;

var ClientBase       = require('./clients/base').ClientBase;
var SchemaBuilder    = require('./lib/schemabuilder').SchemaBuilder;
var SchemaInterface  = require('./lib/schemainterface').SchemaInterface;

// The `Knex` module, taking either a fully initialized
// database client, or a configuration to initialize one. This is something
// you'll typically only want to call once per application cycle.
var Knex = function(config) {

  var Dialect, client;

  // If the client isn't actually a client, we need to configure it into one.
  // On the client, this isn't acceptable, since we need to return immediately
  // rather than wait on an async load of a client library.
  if (config instanceof ClientBase) {
    client = config;
  } else {
    if (typeof define === 'function' && define.amd) {
      throw new Error('A valid `Knex` client must be passed into the Knex constructor.');
    } else  {
      var clientName = config.client;
      if (!Clients[clientName]) {
        throw new Error(clientName + ' is not a valid Knex client, did you misspell it?');
      }
      Dialect = require(Clients[clientName]);
      client = new Dialect.Client(_.omit(config, 'client'));
    }
  }

  // Enables the `knex('tableName')` shorthand syntax.
  var knex = function(tableName) {
    return knex.builder(tableName);
  };

  knex.grammar       = client.grammar;
  knex.schemaGrammar = client.schemaGrammar;

  // Main namespaces for key library components.
  knex.schema  = {};
  knex.migrate = {};

  // Enable the `Builder('tableName')` syntax, as is used in the main `knex('tableName')`.
  knex.builder = function(tableName) {
    var builder = new Builder(knex);
    return tableName ? builder.from(tableName) : builder;
  };

  // Attach each of the `Schema` "interface" methods directly onto to `knex.schema` namespace, e.g.:
  // `knex.schema.table('tableName', function() {...`
  // `knex.schema.createTable('tableName', function() {...`
  // `knex.schema.dropTableIfExists('tableName');`
  _.each(SchemaInterface, function(val, key) {
    knex.schema[key] = function() {
      var schemaBuilder = new SchemaBuilder(knex);
      var table = schemaBuilder.table = _.first(arguments);
      if (!table) {
        return Promise.reject(new Error('The table must be defined for the ' + key + ' method.'));
      }
      return SchemaInterface[key].apply(schemaBuilder, _.rest(arguments));
    };
  });

  // Method to run a new `Raw` query on the current client.
  knex.raw = function(sql, bindings) {
    return new Raw(knex).query(sql, bindings);
  };

  // Keep a reference to the current client.
  knex.client = client;

  // Keep in sync with package.json
  knex.VERSION = '0.5.2';

  // Runs a new transaction, taking a container and returning a promise
  // for when the transaction is resolved.
  knex.transaction = function(container) {
    return new Transaction(knex).run(container);
  };

  // Attach each of the `Migrate` "interface" methods directly onto to `knex.migrate` namespace, e.g.:
  // knex.migrate.latest().then(...
  // knex.migrate.currentVersion(...
  _.each(['make', 'latest', 'rollback', 'currentVersion'], function(method) {
    knex.migrate[method] = function() {
      var Migrate   = require('./lib/migrate');
      var migration = new Migrate(knex);
      return migration[method].apply(migration, arguments);
    };
  });

  // Return the new `Knex` instance.
  return knex;
};

// The client names we'll allow in the `{name: lib}` pairing.
var Clients = Knex.Clients = {
  'mysql'      : './clients/server/mysql.js',
  'pg'         : './clients/server/postgres.js',
  'postgres'   : './clients/server/postgres.js',
  'postgresql' : './clients/server/postgres.js',
  'sqlite'     : './clients/server/sqlite3.js',
  'sqlite3'    : './clients/server/sqlite3.js'
};

// Used primarily to type-check a potential `Knex` client in `Bookshelf.js`,
// by examining whether the object's `client` is an `instanceof Knex.ClientBase`.
Knex.ClientBase = ClientBase;

// finally, export the `Knex` object for node and the browser.
module.exports = Knex;

Knex.initialize = function(config) {
  return Knex(config);
};
},{"./clients/base":1,"./lib/builder":12,"./lib/migrate":"IXAOIc","./lib/promise":18,"./lib/raw":19,"./lib/schemabuilder":20,"./lib/schemainterface":21,"./lib/transaction":23,"lodash":false}],11:[function(require,module,exports){
module.exports = {
  knex: require('../knex'),
  client: require('../clients/browser/websql')
};
},{"../clients/browser/websql":9,"../knex":10}],12:[function(require,module,exports){
// Builder
// -------
var _          = require('lodash');

var Raw        = require('./raw').Raw;
var Common     = require('./common').Common;
var Helpers    = require('./helpers').Helpers;
var JoinClause = require('./builder/joinclause').JoinClause;

var array      = [];
var push       = array.push;

// Constructor for the builder instance, typically called from
// `knex.builder`, accepting the current `knex` instance,
// and pulling out the `client` and `grammar` from the current
// knex instance.
var Builder = function(knex) {
  this.knex    = knex;
  this.client  = knex.client;
  this.grammar = knex.grammar;
  this.reset();
  _.bindAll(this, 'handleResponse');
};

// All operators used in the `where` clause generation.
var operators = ['=', '<', '>', '<=', '>=', '<>', '!=', 'like', 'not like', 'between', 'ilike'];

// Valid values for the `order by` clause generation.
var orderBys  = ['asc', 'desc'];

_.extend(Builder.prototype, Common, {

  _source: 'Builder',

  // Sets the `tableName` on the query.
  from: function(tableName) {
    if (!tableName) return this.table;
    this.table = tableName;
    return this;
  },

  // Alias to from, for "insert" statements
  // e.g. builder.insert({a: value}).into('tableName')
  into: function(tableName) {
    this.table = tableName;
    return this;
  },

  // Adds a column or columns to the list of "columns"
  // being selected on the query.
  column: function(columns) {
    if (columns) {
      push.apply(this.columns, _.isArray(columns) ? columns : _.toArray(arguments));
    }
    return this;
  },

  // Adds a `distinct` clause to the query.
  distinct: function(column) {
    this.column(column);
    this.flags.distinct = true;
    return this;
  },

  // Clones the current query builder, including any
  // pieces that have been set thus far.
  clone: function() {
    var item = new Builder(this.knex);
        item.table = this.table;
    var items = [
      'aggregates', 'type', 'joins', 'wheres', 'orders',
      'columns', 'values', 'bindings', 'grammar', 'groups',
      'transaction', 'unions', 'flags', 'havings'
    ];
    for (var i = 0, l = items.length; i < l; i++) {
      var k = items[i];
      item[k] = this[k];
    }
    return item;
  },

  // Resets all attributes on the query builder.
  reset: function() {
    this.aggregates = [];
    this.bindings   = [];
    this.columns    = [];
    this.flags      = {};
    this.havings    = [];
    this.joins      = [];
    this.orders     = [];
    this.unions     = [];
    this.values     = [];
    this.wheres     = [];
  },

  // Adds a join clause to the query, allowing for advanced joins
  // with an anonymous function as the second argument.
  join: function(table, first, operator, second, type) {
    var join;
    if (_.isFunction(first)) {
      type = operator;
      join = new JoinClause(type || 'inner', table);
      first.call(join, join);
    } else {
      join = new JoinClause(type || 'inner', table);
      join.on(first, operator, second);
    }
    this.joins.push(join);
    return this;
  },

  // The where function can be used in several ways:
  // The most basic is `where(key, value)`, which expands to
  // where key = value.
  where: function(column, operator, value) {
    var bool = this._boolFlag || 'and';
    this._boolFlag = 'and';

    // Check if the column is a function, in which case it's
    // a grouped where statement (wrapped in parens).
    if (_.isFunction(column)) {
      return this._whereNested(column, bool);
    }

    // Allow a raw statement to be passed along to the query.
    if (column instanceof Raw) {
      return this.whereRaw(column.sql, column.bindings, bool);
    }

    // Allows `where({id: 2})` syntax.
    if (_.isObject(column)) {
      for (var key in column) {
        value = column[key];
        this[bool + 'Where'](key, '=', value);
      }
      return this;
    }

    // Enable the where('key', value) syntax, only when there
    // are explicitly two arguments passed, so it's not possible to
    // do where('key', '!=') and have that turn into where key != null
    if (arguments.length === 2) {
      value    = operator;
      operator = '=';
    }

    // If the value is null, and the operator is equals, assume that we're
    // going for a `whereNull` statement here.
    if (value == null && operator === '=') {
      return this.whereNull(column, bool);
    }

    // If the value is a function, assume it's for building a sub-select.
    if (_.isFunction(value)) {
      return this._whereSub(column, operator, value, bool);
    }

    this.wheres.push({
      type: 'Basic',
      column: column,
      operator: operator,
      value: value,
      bool: bool
    });
    this.bindings.push(value);

    return this;
  },

  // Alias to `where`, for internal builder consistency.
  andWhere: function(column, operator, value) {
    return this.where.apply(this, arguments);
  },

  // Adds an `or where` clause to the query.
  orWhere: function(column, operator, value) {
    this._boolFlag = 'or';
    return this.where.apply(this, arguments);
  },

  // Adds a raw `where` clause to the query.
  whereRaw: function(sql, bindings, bool) {
    bindings = _.isArray(bindings) ? bindings : (bindings ? [bindings] : []);
    this.wheres.push({type: 'Raw', sql: sql, bool: bool || 'and'});
    push.apply(this.bindings, bindings);
    return this;
  },

  // Adds a raw `or where` clause to the query.
  orWhereRaw: function(sql, bindings) {
    return this.whereRaw(sql, bindings, 'or');
  },

  // Adds a `where exists` clause to the query.
  whereExists: function(callback, bool, type) {
    var query = new Builder(this.knex);
    callback.call(query, query);
    this.wheres.push({
      type: (type || 'Exists'),
      query: query,
      bool: (bool || 'and')
    });
    push.apply(this.bindings, query.bindings);
    return this;
  },

  // Adds an `or where exists` clause to the query.
  orWhereExists: function(callback) {
    return this.whereExists(callback, 'or');
  },

  // Adds a `where not exists` clause to the query.
  whereNotExists: function(callback) {
    return this.whereExists(callback, 'and', 'NotExists');
  },

  // Adds a `or where not exists` clause to the query.
  orWhereNotExists: function(callback) {
    return this.whereExists(callback, 'or', 'NotExists');
  },

  // Adds a `where in` clause to the query.
  whereIn: function(column, values, bool, condition) {
    bool || (bool = 'and');
    if (_.isFunction(values)) {
      return this._whereInSub(column, values, bool, (condition || 'In'));
    }
    this.wheres.push({
      type: (condition || 'In'),
      column: column,
      value: values,
      bool: bool
    });
    push.apply(this.bindings, values);
    return this;
  },

  // Adds a `or where in` clause to the query.
  orWhereIn: function(column, values) {
    return this.whereIn(column, values, 'or');
  },

  // Adds a `where not in` clause to the query.
  whereNotIn: function(column, values) {
    return this.whereIn(column, values, 'and', 'NotIn');
  },

  // Adds a `or where not in` clause to the query.
  orWhereNotIn: function(column, values) {
    return this.whereIn(column, values, 'or', 'NotIn');
  },

  // Adds a `where null` clause to the query.
  whereNull: function(column, bool, type) {
    this.wheres.push({type: (type || 'Null'), column: column, bool: (bool || 'and')});
    return this;
  },

  // Adds a `or where null` clause to the query.
  orWhereNull: function(column) {
    return this.whereNull(column, 'or', 'Null');
  },

  // Adds a `where not null` clause to the query.
  whereNotNull: function(column) {
    return this.whereNull(column, 'and', 'NotNull');
  },

  // Adds a `or where not null` clause to the query.
  orWhereNotNull: function(column) {
    return this.whereNull(column, 'or', 'NotNull');
  },

  // Adds a `where between` clause to the query.
  whereBetween: function(column, values) {
    this.wheres.push({column: column, type: 'Between', bool: 'and'});
    push.apply(this.bindings, values);
    return this;
  },

  // Adds a `or where between` clause to the query.
  orWhereBetween: function(column, values) {
    this.wheres.push({column: column, type: 'Between', bool: 'or'});
    push.apply(this.bindings, values);
    return this;
  },

  // Adds a `group by` clause to the query.
  groupBy: function() {
    this.groups = (this.groups || []).concat(_.toArray(arguments));
    return this;
  },

  // Adds a `order by` clause to the query.
  orderBy: function(column, direction) {
    if (!(direction instanceof Raw)) {
      if (!_.contains(orderBys, (direction || '').toLowerCase())) direction = 'asc';
    }
    this.orders.push({column: column, direction: direction});
    return this;
  },

  // Add a union statement to the query.
  union: function(callback) {
    this._union(callback, false);
    return this;
  },

  // Adds a union all statement to the query.
  unionAll: function(callback) {
    this._union(callback, true);
    return this;
  },

  // Adds a `having` clause to the query.
  having: function(column, operator, value, bool) {
    if (column instanceof Raw) {
      return this.havingRaw(column.sql, column.bindings, bool);
    }
    this.havings.push({column: column, operator: (operator || ''), value: (value || ''), bool: bool || 'and'});
    this.bindings.push(value);
    return this;
  },

  // Adds an `or having` clause to the query.
  orHaving: function(column, operator, value) {
    return this.having(column, operator, value, 'or');
  },

  // Adds a raw `having` clause to the query.
  havingRaw: function(sql, bindings, bool) {
    bindings = _.isArray(bindings) ? bindings : (bindings ? [bindings] : []);
    this.havings.push({type: 'Raw', sql: sql, bool: bool || 'and'});
    push.apply(this.bindings, bindings);
    return this;
  },

  // Adds a raw `or having` clause to the query.
  orHavingRaw: function(sql, bindings) {
    return this.havingRaw(sql, bindings, 'or');
  },

  offset: function(value) {
    if (value == null) return this.flags.offset;
    this.flags.offset = value;
    return this;
  },

  limit: function(value) {
    if (value == null) return this.flags.limit;
    this.flags.limit = value;
    return this;
  },

  // Retrieve the "count" result of the query.
  count: function(column) {
    return this._aggregate('count', column);
  },

  // Retrieve the minimum value of a given column.
  min: function(column) {
    return this._aggregate('min', column);
  },

  // Retrieve the maximum value of a given column.
  max: function(column) {
    return this._aggregate('max', column);
  },

  // Retrieve the sum of the values of a given column.
  sum: function(column) {
    return this._aggregate('sum', column);
  },

  // Increments a column's value by the specified amount.
  increment: function(column, amount) {
    return this._counter(column, amount);
  },

  // Decrements a column's value by the specified amount.
  decrement: function(column, amount) {
    return this._counter(column, amount, '-');
  },

  // Sets the values for a `select` query.
  select: function(columns) {
    if (columns) {
      push.apply(this.columns, _.isArray(columns) ? columns : _.toArray(arguments));
    }
    return this._setType('select');
  },

  // Sets the values for an `insert` query.
  insert: function(values, returning) {
    if (returning) this.returning(returning);
    this.values = this.prepValues(_.clone(values));
    return this._setType('insert');
  },

  // Sets the returning value for the query.
  returning: function(returning) {
    this.flags.returning = returning;
    return this;
  },

  // Sets the values for an `update` query.
  update: function(values, returning) {
    if (returning) this.returning(returning);
    var obj = Helpers.sortObject(values);
    var bindings = [];
    for (var i = 0, l = obj.length; i < l; i++) {
      bindings[i] = obj[i][1];
    }
    this.bindings = bindings.concat(this.bindings || []);
    this.values   = obj;
    return this._setType('update');
  },

  // Alias to del.
  "delete": function() {
    return this._setType('delete');
  },

  // Executes a delete statement on the query;
  del: function() {
    return this._setType('delete');
  },

  option: function(opts) {
    this.opts = _.extend(this.opts, opts);
    return this;
  },

  // Truncate
  truncate: function() {
    return this._setType('truncate');
  },

  // Set by `transacting` - contains the object with the connection
  // needed to execute a transaction
  transaction: false,

  // Preps the values for `insert` or `update`.
  prepValues: function(values) {
    if (!_.isArray(values)) values = values ? [values] : [];
    for (var i = 0, l = values.length; i<l; i++) {
      var obj = values[i] = Helpers.sortObject(values[i]);
      for (var i2 = 0, l2 = obj.length; i2 < l2; i2++) {
        this.bindings.push(obj[i2][1]);
      }
    }
    return values;
  },

  // ----------------------------------------------------------------------

  // Helper for compiling any advanced `where in` queries.
  _whereInSub: function(column, callback, bool, condition) {
    condition += 'Sub';
    var query = new Builder(this.knex);
    callback.call(query, query);
    this.wheres.push({type: condition, column: column, query: query, bool: bool});
    push.apply(this.bindings, query.bindings);
    return this;
  },

  // Helper for compiling any advanced `where` queries.
  _whereNested: function(callback, bool) {
    var query = new Builder(this.knex);
    callback.call(query, query);
    this.wheres.push({type: 'Nested', query: query, bool: bool});
    push.apply(this.bindings, query.bindings);
    return this;
  },

  // Helper for compiling any of the `where` advanced queries.
  _whereSub: function(column, operator, callback, bool) {
    var query = new Builder(this.knex);
    callback.call(query, query);
    this.wheres.push({
      type: 'Sub',
      column: column,
      operator: operator,
      query: query,
      bool: bool
    });
    push.apply(this.bindings, query.bindings);
    return this;
  },

  // Helper for compiling any aggregate queries.
  _aggregate: function(type, columns) {
    this.aggregates.push({type: type, columns: columns});
    this.type && this.type === 'select' || this._setType('select');
    return this;
  },

  // Helper for the incrementing/decrementing queries.
  _counter: function(column, amount, symbol) {
    amount = parseInt(amount, 10);
    if (isNaN(amount)) amount = 1;
    var toUpdate = {};
    toUpdate[column] = this.knex.raw(this.grammar.wrap(column) + ' ' + (symbol || '+') + ' ' + amount);
    return this.update(toUpdate);
  },

  // Helper for compiling any `union` queries.
  _union: function(callback, bool) {
    var query = new Builder(this.knex);
    callback.call(query, query);
    this.unions.push({query: query, all: bool});
    push.apply(this.bindings, query.bindings);
  }

});

exports.Builder = Builder;

},{"./builder/joinclause":13,"./common":14,"./helpers":15,"./raw":19,"lodash":false}],13:[function(require,module,exports){
// JoinClause
// ---------

// The "JoinClause" is an object holding any necessary info about a join,
// including the type, and any associated tables & columns being joined.
var JoinClause = function(type, table) {
  this.joinType = type;
  this.table    = table;
  this.clauses  = [];
};

JoinClause.prototype = {

  // Adds an "on" clause to the current join object.
  on: function(first, operator, second) {
    this.clauses.push({first: first, operator: operator, second: second, bool: 'and'});
    return this;
  },

  // Adds an "and on" clause to the current join object.
  andOn: function() {
    return this.on.apply(this, arguments);
  },

  // Adds an "or on" clause to the current join object.
  orOn: function(first, operator, second) {
    this.clauses.push({first: first, operator: operator, second: second, bool: 'or'});
    return this;
  },

  // Explicitly set the type of join, useful within a function when creating a grouped join.
  type: function(type) {
    this.joinType = type;
    return this;
  }

};

exports.JoinClause = JoinClause;

},{}],14:[function(require,module,exports){
// Common
// -------

// Some functions which are common to both the
// `Builder` and `SchemaBuilder` classes.
var _         = require('lodash');
var Helpers   = require('./helpers').Helpers;
var SqlString = require('./sqlstring').SqlString;

var Promise   = require('./promise').Promise;

var push      = [].push;

// Methods common to both the `Grammar` and `SchemaGrammar` interfaces,
// used to generate the sql in one form or another.
exports.Common = {

  // Creates a new instance of the current `Builder` or `SchemaBuilder`,
  // with the correct current `knex` instance.
  instance: function() {
    var builder = new this.constructor(this.knex);
        builder.table = this.table;
    return builder;
  },

  // Sets the flag, so that when this object is passed into the
  // client adapter, we know to `log` the query.
  debug: function() {
    this.flags.debug = true;
    return this;
  },

  // Sets `options` which are passed along to the database client.
  options: function(opts) {
    this.flags.options = _.extend({}, this.flags.options, opts);
    return this;
  },

  // For those who dislike promise interfaces.
  // Multiple calls to `exec` will resolve with the same value
  // if called more than once. Any unhandled errors will be thrown
  // after the last block.
  exec: function(callback) {
    return this.then().nodeify(callback);
  },

  // The promise interface for the query builder.
  then: function(onFulfilled, onRejected) {
    if (!this._promise) {
      this._promise = Promise.bind(this);
      this._promise = this._promise.then(function() {
        return this.client.query(this);
      }).bind();
    }
    return this._promise.then(onFulfilled, onRejected);
  },

  catch: function() {
    return this.caught.apply(this, arguments);
  },

  caught: function() {
    var promise = this.then();
    return promise.caught.apply(promise, arguments);
  },

  lastly: function() {
    var promise = this.then();
    return promise.lastly.apply(promise, arguments);
  },

  finally: function() {
    return this.lastly.apply(this, arguments);
  },

  tap: function(handler) {
    return this.then().tap(handler);
  },

  // Returns an array of query strings filled out with the
  // correct values based on bindings, etc. Useful for debugging.
  toString: function() {
    // TODO: get rid of the need to clone the object here...
    var builder = this, data = this.clone().toSql();
    if (!_.isArray(data)) data = [data];
    return _.map(data, function(str) {
      return SqlString.format(str, builder.getBindings());
    }).join('; ');
  },

  // Converts the current statement to a sql string
  toSql: function() {
    return this.grammar.toSql(this);
  },

  // Explicitly sets the connection.
  connection: function(connection) {
    this.usingConnection = connection;
    return this;
  },

  // The connection the current query is being run on, optionally
  // specified by the `connection` method.
  usingConnection: false,

  // Default handler for a response is to pass it along.
  handleResponse: function(resp) {
    if (this && this.grammar && this.grammar.handleResponse) {
      return this.grammar.handleResponse(this, resp);
    }
    return resp;
  },

  // Sets the "type" of the current query, so we can potentially place
  // `select`, `update`, `del`, etc. anywhere in the query statement
  // and have it come out fine.
  _setType: function(type) {
    if (this.type) {
      throw new Error('The query type has already been set to ' + this.type);
    }
    this.type = type;
    return this;
  },

  // Returns all bindings excluding the `Knex.Raw` types.
  getBindings: function() {
    return this.grammar.getBindings(this);
  },

  // Sets the current Builder connection to that of the
  // the currently running transaction
  transacting: function(t) {
    if (t) {
      if (this.transaction) throw new Error('A transaction has already been set for the current query chain');
      var flags = this.flags;
      this.transaction = t;
      this.usingConnection = t.connection;

      // Add "forUpdate" and "forShare" here, since these are only relevant
      // within the context of a transaction.
      this.forUpdate = function() {
        flags.selectMode = 'ForUpdate';
      };
      this.forShare = function() {
        flags.selectMode = 'ForShare';
      };
    }
    return this;
  }

};

},{"./helpers":15,"./promise":18,"./sqlstring":22,"lodash":false}],15:[function(require,module,exports){
// Helpers
// -------

// Just some common functions needed in multiple places within the library.
var _ = require('lodash');

var Helpers = exports.Helpers = {

  // Simple deep clone for arrays & objects.
  deepClone: function(obj) {
    if (_.isObject(obj)) return JSON.parse(JSON.stringify(obj));
    return obj;
  },

  // Pick off the attributes from only the current layer of the object.
  skim: function(data) {
    return _.map(data, function(obj) {
      return _.pick(obj, _.keys(obj));
    });
  },

  // The function name says it all.
  capitalize: function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  },

  // Sorts an object based on the names.
  sortObject: function(obj) {
    return _.sortBy(_.pairs(obj), function(a) {
      return a[0];
    });
  },

  // The standard Backbone.js `extend` method, for some nice
  // "sugar" on proper prototypal inheritance.
  extend: function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  },

  // The `format` function is borrowed from the Node.js `utils` module,
  // since we want to be able to have this functionality on the
  // frontend as well.
  format: function(f) {
    var i;
    if (!_.isString(f)) {
      var objects = [];
      for (i = 0; i < arguments.length; i++) {
        objects.push(inspect(arguments[i]));
      }
      return objects.join(' ');
    }
    i = 1;
    var args = arguments;
    var len = args.length;
    var str = String(f).replace(formatRegExp, function(x) {
      if (x === '%%') return '%';
      if (i >= len) return x;
      switch (x) {
        case '%s': return String(args[i++]);
        case '%d': return Number(args[i++]);
        case '%j':
          try {
            return JSON.stringify(args[i++]);
          } catch (_) {
            return '[Circular]';
          }
          break;
        default:
          return x;
      }
    });
    for (var x = args[i]; i < len; x = args[++i]) {
      if (_.isNull(x) || !_.isObject(x)) {
        str += ' ' + x;
      } else {
        str += ' ' + inspect(x);
      }
    }
    return str;
  }

};

// Regex used in the `Helpers.format` function.
var formatRegExp = /%[sdj%]/g;

},{"lodash":false}],"./lib/migrate":[function(require,module,exports){
module.exports=require('IXAOIc');
},{}],"IXAOIc":[function(require,module,exports){
var StubMigrate = module.exports = function() {

};

StubMigrate.prototype = {
  make: Promise.method(function() {
    throw new Error("Migrations are not supported");
  }),
  latest: Promise.method(function() {
    throw new Error("Migrations are not supported");
  }),
  rollback: Promise.method(function() {
    throw new Error("Migrations are not supported");
  }),
  currentVersion: Promise.method(function() {
    throw new Error("Migrations are not supported");
  }),
};
},{}],18:[function(require,module,exports){

var Promise = require('bluebird');

Promise.prototype.yield = function(value) {
  return this.then(function() {
    return value;
  });
};

Promise.prototype.tap = function(handler) {
  return this.then(handler).yield(this);
};

Promise.prototype.ensure = Promise.prototype.lastly;
Promise.prototype.otherwise = Promise.prototype.caught;

Promise.resolve = Promise.fulfilled;
Promise.reject  = Promise.rejected;

exports.Promise = Promise;

},{"bluebird":false}],19:[function(require,module,exports){
// Raw
// -------
var _ = require('lodash');

var Common  = require('./common').Common;

var Raw = function(instance) {
  this.knex   = instance;
  this.client = instance.client;
  this.flags  = {};
};

_.extend(Raw.prototype, Common, {

  _source: 'Raw',

  // Set the sql and the bindings associated with the query, returning
  // the current raw object.
  query: function(sql, bindings) {
    this.bindings = _.isArray(bindings) ? bindings :
      bindings ? [bindings] : [];
    this.sql = sql;
    return this;
  },

  // Returns the raw sql for the query.
  toSql: function() {
    return this.sql;
  },

  // Returns the cleaned bindings for the current raw query.
  getBindings: function() {
    return this.client.grammar.getBindings(this);
  }

});

exports.Raw = Raw;

},{"./common":14,"lodash":false}],20:[function(require,module,exports){
// Schema Builder
// -------
var _       = require('lodash');

var Common  = require('./common').Common;
var Helpers = require('./helpers').Helpers;

var SchemaBuilder = function(knex) {
  this.knex     = knex;
  this.client   = knex.client;
  this.grammar  = knex.schemaGrammar;
  this.columns  = [];
  this.commands = [];
  this.bindings = [];
  this.flags    = {};
  _.bindAll(this, 'handleResponse');
};

var toClone = ['columns', 'commands', 'bindings', 'flags'];

_.extend(SchemaBuilder.prototype, Common, {

  _source: 'SchemaBuilder',

  clone: function() {
    return _.reduce(toClone, function(memo, key) {
      memo[key] = Helpers.deepClone(this[key]);
      return memo;
    }, this.instance(), this);
  },

  // A callback from the table building `Knex.schemaBuilder` calls.
  callback: function(callback) {
    if (callback) callback.call(this, this);
    return this;
  },

  // Determine if the blueprint has a create command.
  creating: function() {
    for (var i = 0, l = this.commands.length; i < l; i++) {
      if (this.commands[i].name == 'createTable') return true;
    }
    return false;
  },

  // Sets the engine to use when creating the table in MySql
  engine: function(name) {
    if (!this.creating()) throw new Error('The `engine` modifier may only be used while creating a table.');
    this.flags.engine = name;
    return this;
  },

  // Sets the character set for the table in MySql
  charset: function(charset) {
    if (!this.creating()) throw new Error('The `engine` modifier may only be used while creating a table.');
    this.flags.charset = charset;
    return this;
  },

  // Sets the collation for the table in MySql
  collate: function(collation) {
    if (!this.creating()) throw new Error('The `engine` modifier may only be used while creating a table.');
    this.flags.collation = collation;
    return this;
  },

  // Adds a comment to the current table being created.
  comment: function(comment) {
    return this._addCommand('comment', {comment: comment});
  },

  // Indicate that the given columns should be dropped.
  dropColumn: function(columns) {
    if (!_.isArray(columns)) columns = columns ? [columns] : [];
    return this._addCommand('dropColumn', {columns: columns});
  },

  // Indicate that the given columns should be dropped.
  dropColumns: function() {
    return this.dropColumn(arguments);
  },

  // Indicate that the given primary key should be dropped.
  dropPrimary: function(index) {
    return this._dropIndexCommand('dropPrimary', index);
  },

  // Indicate that the given unique key should be dropped.
  dropUnique: function(index) {
    return this._dropIndexCommand('dropUnique', index);
  },

  // Indicate that the given index should be dropped.
  dropIndex: function(index) {
    return this._dropIndexCommand('dropIndex', index);
  },

  // Indicate that the given foreign key should be dropped.
  dropForeign: function(index) {
    return this._dropIndexCommand('dropForeign', index);
  },

  // Specify the primary key(s) for the table.
  primary: function(columns, name) {
    return this._indexCommand('primary', columns, name);
  },

  // Specify a unique index for the table.
  unique: function(columns, name) {
    return this._indexCommand('unique', columns, name);
  },

  // Specify an index for the table.
  index: function(columns, name) {
    return this._indexCommand('index', columns, name);
  },

  // Rename a column from one value to another value.
  renameColumn: function(from, to) {
    return this._addCommand('renameColumn', {from: from, to: to});
  },

  // Specify a foreign key for the table, also getting any
  // relevant info from the chain during column.
  foreign: function(column, name) {
    var chained, chainable  = this._indexCommand('foreign', column, name);
    if (_.isObject(column)) {
      chained = _.pick(column, 'foreignColumn', 'foreignTable', 'commandOnDelete', 'commandOnUpdate');
    }
    return _.extend(chainable, ForeignChainable, chained);
  },

  // Create a new auto-incrementing column on the table.
  increments: function(column) {
    return this._addColumn('integer', (column || 'id'), {isUnsigned: true, autoIncrement: true, length: 11});
  },

  // Create a new auto-incrementing big-int on the table
  bigIncrements: function(column) {
    return this._addColumn('bigInteger', (column || 'id'), {isUnsigned: true, autoIncrement: true});
  },

  // Create a new string column on the table.
  string: function(column, length) {
    return this._addColumn('string', column, {length: (length || 255)});
  },

  // Alias varchar to string
  varchar: function(column, length) {
    return this.string(column, length);
  },

  // Create a new text column on the table.
  text: function(column, length) {
    return this._addColumn('text', column, {length: (length || false)});
  },

  // Create a new integer column on the table.
  integer: function(column, length) {
    return this._addColumn('integer', column, {length: (length || 11)});
  },

  // Create a new biginteger column on the table
  bigInteger: function(column) {
    return this._addColumn('bigInteger', column);
  },

  // Create a new tinyinteger column on the table.
  tinyInteger: function(column) {
    return this._addColumn('tinyInteger', column);
  },

  // Alias for tinyinteger column.
  tinyint: function(column) {
    return this.tinyInteger(column);
  },

  // Create a new float column on the table.
  float: function(column, precision, scale) {
    return this._addColumn('float', column, {
      precision: (precision == null ? 8 : precision),
      scale: (scale == null ? 2 : scale)
    });
  },

  // Create a new decimal column on the table.
  decimal: function(column, precision, scale) {
    return this._addColumn('decimal', column, {
      precision: (precision == null ? 8 : precision),
      scale: (scale == null ? 2 : scale)
    });
  },

  // Alias to "bool"
  boolean: function(column) {
    return this.bool(column);
  },

  // Create a new boolean column on the table
  bool: function(column) {
    return this._addColumn('boolean', column);
  },

  // Create a new date column on the table.
  date: function(column) {
    return this._addColumn('date', column);
  },

  // Create a new date-time column on the table.
  dateTime: function(column) {
    return this._addColumn('dateTime', column);
  },

  // Create a new time column on the table.
  time: function(column) {
    return this._addColumn('time', column);
  },

  // Create a new timestamp column on the table.
  timestamp: function(column) {
    return this._addColumn('timestamp', column);
  },

  // Add creation and update dateTime's to the table.
  timestamps: function() {
    this.dateTime('created_at');
    this.dateTime('updated_at');
  },

  // Alias to enum.
  "enum": function(column, allowed) {
    return this.enu(column, allowed);
  },

  // Create a new enum column on the table.
  enu: function(column, allowed) {
    if (!_.isArray(allowed)) allowed = [allowed];
    return this._addColumn('enum', column, {allowed: allowed});
  },

  // Create a new bit column on the table.
  bit: function(column, length) {
    return this._addColumn('bit', column, {length: (length || false)});
  },

  // Create a new binary column on the table.
  binary: function(column) {
    return this._addColumn('binary', column);
  },

  // Create a new json column on the table.
  json: function(column) {
    return this._addColumn('json', column);
  },

  // Create a new uuid column on the table.
  uuid: function(column) {
    return this._addColumn('uuid', column);
  },

  specificType: function(column, type) {
    return this._addColumn('specificType', column, {specific: type});
  },

  // ----------------------------------------------------------------------

  // Create a new drop index command on the blueprint.
  // If the index is an array of columns, the developer means
  // to drop an index merely by specifying the columns involved.
  _dropIndexCommand: function(type, index) {
    var columns = [];
    if (_.isArray(index)) {
      columns = index;
      index = null;
    }
    return this._indexCommand(type, columns, index);
  },

  // Add a new index command to the blueprint.
  // If no name was specified for this index, we will create one using a basic
  // convention of the table name, followed by the columns, followed by an
  // index type, such as primary or index, which makes the index unique.
  _indexCommand: function(type, columns, index) {
    index || (index = null);
    if (!_.isArray(columns)) columns = columns ? [columns] : [];
    if (index === null) {
      var table = this.table.replace(/\.|-/g, '_');
      index = (table + '_' + _.map(columns, function(col) { return col.name || col; }).join('_') + '_' + type).toLowerCase();
    }
    return this._addCommand(type, {index: index, columns: columns});
  },

  // Add a new column to the blueprint.
  _addColumn: function(type, name, parameters) {
    if (!name) throw new Error('A `name` must be defined to add a column');
    var column = _.extend({type: type, name: name}, ChainableColumn, parameters);
    this.columns.push(column);
    return column;
  },

  // Add a new command to the blueprint.
  _addCommand: function(name, parameters) {
    var command = _.extend({name: name}, parameters);
    this.commands.push(command);
    return command;
  }
});

var ForeignChainable = {

  // Sets the "column" that the current column references
  // as the a foreign key
  references: function(column) {
    this.isForeign = true;
    this.foreignColumn = column || null;
    return this;
  },

  // Sets the "table" where the foreign key column is located.
  inTable: function(table) {
    this.foreignTable = table || null;
    return this;
  },

  // SQL command to run "onDelete"
  onDelete: function(command) {
    this.commandOnDelete = command || null;
    return this;
  },

  // SQL command to run "onUpdate"
  onUpdate: function(command) {
    this.commandOnUpdate = command || null;
    return this;
  }

};

var ChainableColumn = _.extend({

  // Sets the default value for a column.
  // For `boolean` columns, we'll permit 'false'
  // to be used as default values.
  defaultTo: function(value) {
    if (this.type === 'boolean') {
      if (value === 'false') value = 0;
      value = (value ? 1 : 0);
    }
    this.defaultValue = value;
    return this;
  },

  // Sets an integer as unsigned, is a no-op
  // if the column type is not an integer.
  unsigned: function() {
    this.isUnsigned = true;
    return this;
  },

  // Allows the column to contain null values.
  nullable: function() {
    this.isNullable = true;
    return this;
  },

  // Disallow the column from containing null values.
  notNull: function() {
    this.isNullable = false;
    return this;
  },

  // Disallow the column from containing null values.
  notNullable: function() {
    this.isNullable = false;
    return this;
  },

  // Adds an index on the specified column.
  index: function(name) {
    this.isIndex = name || true;
    return this;
  },

  // Sets this column as the primary key.
  primary: function(name) {
    if (!this.autoIncrement) {
      this.isPrimary = name || true;
    }
    return this;
  },

  // Sets this column as unique.
  unique: function(name) {
    this.isUnique = name || true;
    return this;
  },

  // Sets the column to be inserted after another,
  // used in MySql alter tables.
  after: function(name) {
    this.isAfter = name;
    return this;
  },

  // Adds a comment to this column.
  comment: function(comment) {
    this.isCommented = comment || null;
    return this;
  }

}, ForeignChainable);

exports.SchemaBuilder = SchemaBuilder;

},{"./common":14,"./helpers":15,"lodash":false}],21:[function(require,module,exports){
// Schema Interface
// -------

// The SchemaInterface are the publically accessible methods
// when creating or modifying an existing schema, Each of
// these methods are mixed into the `knex.schema` object,
// and pass-through to creating a `SchemaBuilder` instance,
// which is used as the context of the `this` value below.
var SchemaInterface = {

  // Modify a table on the schema.
  table: function(callback) {
    this.callback(callback);
    return this._setType('table');
  },

  // Create a new table on the schema.
  createTable: function(callback) {
    this._addCommand('createTable');
    this.callback(callback);
    return this._setType('createTable');
  },

  // Drop a table from the schema.
  dropTable: function() {
    this._addCommand('dropTable');
    return this._setType('dropTable');
  },

  // Drop a table from the schema if it exists.
  dropTableIfExists: function() {
    this._addCommand('dropTableIfExists');
    return this._setType('dropTableIfExists');
  },

  // Rename a table on the schema.
  renameTable: function(to) {
    this._addCommand('renameTable', {to: to});
    return this._setType('renameTable');
  },

  // Determine if the given table exists.
  hasTable: function() {
    this.bindings.push(this.table);
    this._addCommand('tableExists');
    return this._setType('tableExists');
  },

  // Determine if the column exists
  hasColumn: function(column) {
    this.bindings.push(this.table, column);
    this._addCommand('columnExists');
    return this._setType('columnExists');
  }

};

exports.SchemaInterface = SchemaInterface;

},{}],22:[function(require,module,exports){
// SQL String
// -------

// A few functions taken from the node-mysql lib, so it can be easily used with any
// library on the `toString` method, and on the browser.
var SqlString = {};
var _         = require('lodash');

// Send in a "sql" string, values, and an optional timeZone
// and have it returned as a properly formatted SQL query.
SqlString.format = function(sql, values, timeZone) {
  values = [].concat(values);
  return sql.replace(/\?/g, function(match) {
    if (!values.length) return match;
    return SqlString.escape(values.shift(), timeZone);
  });
};

SqlString.escape = function(val, timeZone) {
  if (val === undefined || val === null) {
    return 'NULL';
  }

  switch (typeof val) {
    case 'boolean': return (val) ? 'true' : 'false';
    case 'number': return val+'';
  }

  if (val instanceof Date) {
    val = SqlString.dateToString(val, timeZone || "Z");
  }

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(val)) {
    return SqlString.bufferToString(val);
  }

  if (_.isArray(val)) {
    return SqlString.arrayToList(val, timeZone);
  }

  if (typeof val === 'object') val = val.toString();

  val = val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
    switch(s) {
      case "\0": return "\\0";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\b": return "\\b";
      case "\t": return "\\t";
      case "\x1a": return "\\Z";
      default: return "\\"+s;
    }
  });
  return "'"+val+"'";
};

SqlString.arrayToList = function(array, timeZone) {
  return array.map(function(v) {
    if (Array.isArray(v)) return '(' + SqlString.arrayToList(v) + ')';
    return SqlString.escape(v, true, timeZone);
  }).join(', ');
};

SqlString.dateToString = function(date, timeZone) {
  var dt = new Date(date);

  if (timeZone != 'local') {
    var tz = convertTimezone(timeZone);
    dt.setTime(dt.getTime() + (dt.getTimezoneOffset() * 60000));
    if (tz !== false) {
      dt.setTime(dt.getTime() + (tz * 60000));
    }
  }

  var year   = dt.getFullYear();
  var month  = zeroPad(dt.getMonth() + 1);
  var day    = zeroPad(dt.getDate());
  var hour   = zeroPad(dt.getHours());
  var minute = zeroPad(dt.getMinutes());
  var second = zeroPad(dt.getSeconds());

  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
};

SqlString.bufferToString = function(buffer) {
  var hex = '';
  try {
    hex = buffer.toString('hex');
  } catch (err) {
    // node v0.4.x does not support hex / throws unknown encoding error
    for (var i = 0; i < buffer.length; i++) {
      var byte = buffer[i];
      hex += zeroPad(byte.toString(16));
    }
  }

  return "X'" + hex+ "'";
};

function zeroPad(number) {
  return (number < 10) ? '0' + number : number;
}

function convertTimezone(tz) {
  if (tz == "Z") return 0;

  var m = tz.match(/([\+\-\s])(\d\d):?(\d\d)?/);
  if (m) {
    return (m[1] == '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
  }
  return false;
}

exports.SqlString = SqlString;

},{"lodash":false}],23:[function(require,module,exports){
// Transaction
// -------
var Promise = require('./promise').Promise;
var _       = require('lodash');

// Creates a new wrapper object for constructing a transaction.
// Called by the `knex.transaction`, which sets the correct client
// and handles the `container` object, passing along the correct
// `connection` to keep all of the transactions on the correct connection.
var Transaction = function(instance) {
  this.client = instance.client;
};

Transaction.prototype = {

  // Passed a `container` function, this method runs the current
  // transaction, returning a promise.
  run: function(container, connection) {
    return this.client.startTransaction(connection)
      .bind(this)
      .then(this.getContainerObject)
      .then(this.initiateDeferred(container))
      .bind();
  },

  getContainerObject: function(connection) {

    // The client we need to call `finishTransaction` on.
    var client = this.client;

    // The object passed around inside the transaction container.
    var containerObj = {

      commit: function(message) {
        client.finishTransaction('commit', this, message);
      },

      rollback: function(error) {
        client.finishTransaction('rollback', this, error);
      },

      // "rollback to"?
      connection: connection
    };

    // Ensure the transacting object methods are bound with the correct context.
    _.bindAll(containerObj, 'commit', 'rollback');

    return containerObj;
  },

  initiateDeferred: function(container) {

    return function(containerObj) {

      // Initiate a deferred object, so we know when the
      // transaction completes or fails, we know what to do.
      var dfd = containerObj.dfd = Promise.pending();

      // Call the container with the transaction
      // commit & rollback objects.
      container(containerObj);

      // Return the promise for the entire transaction.
      return dfd.promise;

    };

  }

};

exports.Transaction = Transaction;

},{"./promise":18,"lodash":false}]},{},[11])
(11)
});