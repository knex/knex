//     Knex.js  0.2.6
//
//     (c) 2013 Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org
(function(define) {

"use strict";

define(function(require, exports, module) {

  // Required dependencies.
  var _       = require('underscore');
  var when    = require('when');
  var Common  = require('./lib/common').Common;
  var Helpers = require('./lib/helpers').Helpers;

  // `Knex` is the root namespace and a chainable function: `Knex('tableName')`
  var Knex = function(table) {
    if (!Knex.Instances['main']) {
      throw new Error('The Knex instance has not been initialized yet.');
    }
    return Knex.Instances['main'](table);
  };

  // Keep in sync with package.json
  Knex.VERSION = '0.2.6';

  // Knex.Builder
  // -------
  var Builder = Knex.Builder = function(table) {

    // We use this logic to create sub-builders
    // for the advanced query statements.
    if (table) {
      if (_.isString(table) || table instanceof Raw) {
        this.table = table;
      } else {
        this.client = table.client;
        this.grammar = table.grammar;
      }
    }

    this.reset();
  };

  // All operators used in the `where` clause generation.
  var operators = ['=', '<', '>', '<=', '>=', '<>', '!=', 'like', 'not like', 'between', 'ilike'];

  _.extend(Builder.prototype, Common, {

    _source: 'Builder',

    // Sets the `tableName` on the query.
    from: function(tableName) {
      if (!tableName) return this.table;
      this.table = tableName;
      return this;
    },

    // Adds a column to the list of "columns" being selected
    // on the query.
    column: function(value) {
      this.columns.push(value);
      return this;
    },

    // Adds a `distinct` clause to the query.
    distinct: function(column) {
      this.column(column);
      this.isDistinct = true;
      return this;
    },

    // Compiles the current query builder.
    toSql: function() {
      this.type || (this.type = 'select');
      return this.grammar['compile' + Helpers.capitalize(this.type)](this);
    },

    // Clones the current query builder, including any
    // pieces that have been set thus far.
    clone: function() {
      var item = new Builder(this.table);
      item.client = this.client;
      item.grammar = this.grammar;
      var items = [
        'isDistinct', 'joins', 'wheres', 'orders',
        'columns', 'bindings', 'grammar', 'transaction', 'unions'
      ];
      for (var i = 0, l = items.length; i < l; i++) {
        var k = items[i];
        item[k] = this[k];
      }
      return item;
    },

    // Resets all attributes on the query builder.
    reset: function() {
      this.joins    = [];
      this.values   = [];
      this.unions   = [];
      this.wheres   = [];
      this.orders   = [];
      this.columns  = [];
      this.bindings = [];
      this.isDistinct  = false;
      this.isReturning = false;
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
    where: function(column, operator, value, bool) {
      bool || (bool = 'and');
      if (_.isFunction(column)) {
        return this._whereNested(column, bool);
      }
      if (column instanceof Raw) {
        return this.whereRaw(column.sql, column.bindings, bool);
      }
      if (_.isObject(column)) {
        for (var key in column) {
          value = column[key];
          this[bool + 'Where'](key, '=', value);
        }
        return this;
      }
      if (!_.contains(operators, operator)) {
        value = operator;
        operator = '=';
      }
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
    andWhere: function() {
      return this.where.apply(this, arguments);
    },

    // Adds an `or where` clause to the query.
    orWhere: function(column, operator, value) {
      return this.where(column, operator, value, 'or');
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
      var query = new Builder(this);
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

    // ----------------------------------------------------------------------

    // Adds a `group by` clause to the query.
    groupBy: function() {
      this.groups = (this.groups || []).concat(_.toArray(arguments));
      return this;
    },

    // Adds a `order by` clause to the query.
    orderBy: function(column, direction) {
      this.orders.push({column: column, direction: (direction || 'asc')});
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
        return this.havingRaw(column.value, bool);
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
    havingRaw: function(sql, bool) {
      this.havings.push({type: 'Raw', sql: sql, bool: bool || 'and'});
      return this;
    },

    // Adds a raw `or having` clause to the query.
    orHavingRaw: function(sql) {
      return this.havingRaw(sql, 'or');
    },

    // ----------------------------------------------------------------------

    offset: function(value) {
      if (value == null) return this.isOffset;
      this.isOffset = value;
      return this;
    },

    limit: function(value) {
      if (value == null) return this.isLimit;
      this.isLimit = value;
      return this;
    },

    // ----------------------------------------------------------------------

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
      this.values = this._prepValues(_.clone(values));
      return this._setType('insert');
    },

    // Sets the returning value for the query.
    returning: function(returning) {
      this.isReturning = returning;
      return this;
    },

    // Sets the values for an `update` query.
    update: function(values) {
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

    // Truncate
    truncate: function() {
      return this._setType('truncate');
    },

    // Set by `transacting` - contains the object with the connection
    // needed to execute a transaction
    transaction: false,

    // Sets the current Builder connection to that of the
    // the currently running transaction
    transacting: function(t) {
      if (t) {
        if (this.transaction) throw new Error('A transaction has already been set for the current query chain');
        this.transaction = t;
      }
      return this;
    },

    // ----------------------------------------------------------------------

    _prepValues: function(values) {
      if (!_.isArray(values)) values = values ? [values] : [];
      for (var i = 0, l = values.length; i<l; i++) {
        var obj = values[i] = Helpers.sortObject(values[i]);
        for (var i2 = 0, l2 = obj.length; i2 < l2; i2++) {
          this.bindings.push(obj[i2][1]);
        }
      }
      return values;
    },

    // Helper for compiling any advanced `where in` queries.
    _whereInSub: function(column, callback, bool, condition) {
      condition += 'Sub';
      var query = new Builder(this);
      callback.call(query, query);
      this.wheres.push({type: condition, column: column, query: query, bool: bool});
      push.apply(this.bindings, query.bindings);
      return this;
    },

    // Helper for compiling any advanced `where` queries.
    _whereNested: function(callback, bool) {
      var query = new Builder(this);
      query.table = this.table;
      callback.call(query, query);
      this.wheres.push({type: 'Nested', query: query, bool: bool});
      push.apply(this.bindings, query.bindings);
      return this;
    },

    // Helper for compiling any of the `where` advanced queries.
    _whereSub: function(column, operator, callback, bool) {
      var query = new Builder(this);
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
      if (!_.isArray(columns)) columns = [columns];
      this.aggregate = {type: type, columns: columns};
      return this._setType('select');
    },

    // Helper for the incrementing/decrementing queries.
    _counter: function(column, amount, symbol) {
      var sql = {};
      sql[column] = new Raw('' + this.grammar.wrap(column) + ' ' + (symbol || '+') + ' ' + amount);
      return this.update(sql);
    },

    // Helper for compiling any `union` queries.
    _union: function(callback, bool) {
      var query = new Builder(this);
      callback.call(query, query);
      this.unions.push({query: query, all: bool});
      push.apply(this.bindings, query.bindings);
    }

  });

  // Knex.JoinClause
  // ---------

  var JoinClause = Knex.JoinClause = function(type, table) {
    this.clauses = [];
    this.type = type;
    this.table = table;
  };

  JoinClause.prototype = {

    on: function(first, operator, second) {
      this.clauses.push({first: first, operator: operator, second: second, bool: 'and'});
      return this;
    },

    andOn: function() {
      return this.on.apply(this, arguments);
    },

    orOn: function(first, operator, second) {
      this.clauses.push({first: first, operator: operator, second: second, bool: 'or'});
      return this;
    }
  };

  // Knex.Transaction
  // ---------

  Knex.Transaction = function(container) {
    if (!Knex.Instances['main']) {
      throw new Error('The Knex instance has not been initialized yet.');
    }
    return transaction.call(Knex.Instances['main'], container);
  };

  var transaction = function(container) {

    var client = this.client;

    return client.startTransaction().then(function(connection) {

      // Initiate a deferred object, so we know when the
      // transaction completes or fails, we know what to do.
      var dfd = when.defer();

      // The object passed around inside the transaction container.
      var containerObj = {
        commit: function(val) {
          client.finishTransaction('commit', this, dfd, val);
        },
        rollback: function(err) {
          client.finishTransaction('rollback', this, dfd, err);
        },
        // "rollback to"?
        connection: connection
      };

      // Ensure the transacting object methods are bound with the correct context.
      _.bindAll(containerObj, 'commit', 'rollback');

      // Call the container with the transaction
      // commit & rollback objects.
      container(containerObj);

      return dfd.promise;
    });
  };

  // Knex.Schema
  // ---------

  var initSchema = function(Target, client) {

    // Top level object for Schema related functions
    var Schema = Target.Schema = {};

    // Attach main static methods, which passthrough to the
    // SchemaBuilder instance methods
    _.each(['hasTable', 'createTable', 'table', 'dropTable', 'renameTable', 'dropTableIfExists'], function(method) {

      Schema[method] = function() {
        var args = _.toArray(arguments);
        var builder = new Knex.SchemaBuilder(args[0]);
            builder.client = client;
            builder.grammar = client.schemaGrammar;
        return SchemaInterface[method].apply(builder, args.slice(1));
      };
    });

  };

  // All of the Schame methods that should be called with a
  // `SchemaBuilder` context, to disallow calling more than one method at once.
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
    }
  };

  // Knex.SchemaBuilder
  // --------
  Knex.SchemaBuilder = require('./lib/schemabuilder').SchemaBuilder;

  // Knex.Raw
  // -------

  // Helpful for injecting a snippet of raw SQL into a
  // `Knex` block... in most cases, we'll check if the value
  // is an instanceof Raw, and if it is, use the supplied value.
  Knex.Raw = function(sql, bindings) {
    if (!Knex.Instances['main']) {
      throw new Error('The Knex instance has not been initialized yet.');
    }
    return Knex.Instances['main'].Raw(sql, bindings);
  };

  var Raw = require('./lib/raw').Raw;

  _.extend(Raw.prototype, Common)

  // Knex.Initialize
  // -------

  // Takes a hash of options to initialize the database
  // connection. The `client` is required to choose which client
  // path above is loaded, or to specify a custom path to a client.
  // Other options, such as `connection` or `pool` are passed
  // into `client.initialize`.
  Knex.Initialize = function(name, options) {
    var Target, ClientCtor, client;

    // A name for the connection isn't required in
    // cases where there is only a single connection.
    if (_.isObject(name)) {
      options = name;
      name    = 'main';
    }

    // Don't try to initialize the same `name` twice... If necessary,
    // delete the instance from `Knex.Instances`.
    if (Knex.Instances[name]) {
      throw new Error('An instance named ' + name + ' already exists.');
    }

    client = options.client;

    if (!client) throw new Error('The client is required to use Knex.');

    // Checks if this is a default client. If it's not,
    // that means it's a custom lib, set the object to the client.
    if (_.isString(client)) {
      client = client.toLowerCase();
      try {
        ClientCtor = require(Clients[client]);
      } catch (e) {
        throw new Error(client + ' is not a valid Knex client, did you misspell it?');
      }
    } else {
      ClientCtor = client;
    }

    // Creates a new instance of the db client, passing the name and options.
    client = new ClientCtor(name, _.omit(options, 'client'));

    // If this is named "default" then we're setting this on the Knex
    Target = function(table) {
      var builder = new Knex.Builder(table);
          builder.client = client;
          builder.grammar = client.grammar;
      return builder;
    };

    // Inherit static properties, without any that don't apply except
    // on the "root" `Knex`.
    _.extend(Target, _.omit(Knex, 'Initialize', 'Instances', 'VERSION'));

    // Initialize the schema builder methods.
    if (name === 'main') {
      initSchema(Knex, client);
      Knex.client = client;
    }

    initSchema(Target, client);

    // Specifically set the client on the current target.
    Target.client = client;
    Target.instanceName = name;

    // Setup the transacting function properly for this connection.
    Target.Transaction = function(handler) {
      return transaction.call(this, handler);
    };

    // Executes a Raw query.
    Target.Raw = function(sql, bindings) {
      var raw = new Raw(sql, bindings);
          raw.client = client;
      return raw;
    };

    // Add this instance to the global `Knex` instances, and return.
    Knex.Instances[name] = Target;

    return Target;
  };

  var array = [];
  var push  = array.push;

  // Default client paths, located in the `./clients` directory.
  var Clients = {
    'mysql'    : './clients/mysql.js',
    'pg'       : './clients/postgres.js',
    'postgres' : './clients/postgres.js',
    'sqlite'   : './clients/sqlite3.js',
    'sqlite3'  : './clients/sqlite3.js'
  };

  // Named instances of Knex, presumably with different database
  // connections, the main instance being named "main"...
  Knex.Instances = {};

  // Export the Knex module
  module.exports = Knex;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports, module); }
);