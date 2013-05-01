//     Knex.js  0.1.0
//
//     (c) 2013 Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org
(function() {

  "use strict";
  
  // Required dependencies.
  var _ = require('underscore');
  var Q = require('q');

  var push = Array.prototype.push;

  // `Knex` is the root namespace and a chainable function: `Knex('tableName')`
  var Knex = function(table) {
    return new Knex.Builder(table, Knex.client);
  };

  // Keep in sync with package.json
  Knex.VERSION = '0.0.0';

  // Grammar
  // -------

  // Creates a new Grammar, with the mixins for the
  // specified query dialect, which are defined in each
  // client's `exports.grammar`.
  var Grammar = function(mixins) {
    _.extend(this, mixins);
  };

  // The list of different components
  var components = [
    'aggregate', 'columns', 'from',
    'joins', 'wheres', 'groups', 'havings',
    'orders', 'limit', 'offset'
  ];

  Grammar.prototype = {

    dateFormat: 'Y-m-d H:i:s',

    // Compiles the `select` statement, or nested sub-selects
    // by calling each of the component compilers, trimming out
    // the empties, and returning a generated query string.
    compileSelect: function(qb) {
      var sql = {};
      if (_.isEmpty(qb.columns)) qb.columns = ['*'];
      for (var i = 0, l = components.length; i < l; i++) {
        var component = components[i];
        if (_.result(qb, component) != null) {
          sql[component] = this['compile' + capitalize(component)](qb, _.result(qb, component));
        }
      }
      return _.compact(sql).join(' ');
    },

    // Compiles an aggregate query.
    compileAggregate: function(qb, aggregate) {
      var column = this.columnize(aggregate.columns);
      if (qb.isDistinct && column !== '*') {
        column = 'distinct ' + column;
      }
      return 'select ' + aggregate.type + '(' + column + ') as aggregate';
    },

    // Compiles the columns in the query, specifying if an item was distinct.
    compileColumns: function(qb, columns) {
      if (qb.aggregate != null) return;
      return (qb.isDistinct ? 'select distinct ' : 'select ') + this.columnize(columns);
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
        sql.push(join.type + ' join ' + this.wrapTable(join.table) + ' on ' + clauses.join(' '));
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
      return 'having ' + havings.map(function(having) {
        return '' + this.wrap(having.column) + ' ' + having.operator + ' ' + this.parameter(having['value']);
      }, this).join(' and').replace(/and /, '');
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
    compileInsert: function(qb, values) {
      var table = this.wrapTable(qb.table);
      var columns = this.columnize(_.keys(values[0]).sort());
      var parameters = this.parameterize(_.values(values[0]));
      var paramBlocks = [];

      // If there are any "where" clauses, we need to omit 
      // any bindings that may have been associated with them.
      if (qb.wheres.length > 0) this._clearWhereBindings(qb);

      for (var i = 0, l = values.length; i < l; ++i) {
        paramBlocks.push("(" + parameters + ")");
      }

      return "insert into " + table + " (" + columns + ") values " + paramBlocks.join(', ');
    },

    // Depending on the type of `where` clause, this will appropriately
    // remove any binding caused by "where" constraints, allowing the same
    // query to be used for `insert` and `update` without issue.
    _clearWhereBindings: function(qb) {
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
    compileUpdate: function(qb, values) {
      var table = this.wrapTable(qb.table), columns = [];
      for (var key in values) {
        var value = values[key];
        columns.push(this.wrap(key) + ' = ' + this.parameter(value));
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
      return 'truncate ' + this.wrapTable(qb.from);
    },

    wrap: function(value) {
      var segments;
      if (value instanceof Knex.Raw) return value.value;
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
      if (table instanceof Knex.Raw) return table.value;
      return this.wrapValue(table);
    },

    columnize: function(columns) {
      return _.map(columns, this.wrap, this).join(', ');
    },

    parameterize: function(values) {
      return _.map(values, this.parameter, this).join(', ');
    },

    parameter: function(value) {
      return (value instanceof Knex.Raw ? value.value : '?');
    }
  };

  // Knex.Builder
  // -------
  var Builder = Knex.Builder = function(table, client) {
    client || (client = {});
    this.table = table;
    this.reset();
    this.client = client;
    this.grammar = new Grammar(client.grammar);
  };

  // All operators used in the `where` clause generation.
  var operators = ['=', '<', '>', '<=', '>=', 'like', 'not like', 'between', 'ilike'];

  Builder.prototype = {

    // Sets the `tableName` on the query.
    from: function(tableName) {
      if (!tableName) return this.table;
      this.table = tableName;
      return this;
    },

    // Specifies to returns the statement as SQL rather than as a promise.
    asSql: function() {
      this.asSql = true;
      return this;
    },

    // Adds a `distinct` clause to the query.
    distinct: function() {
      this.isDistinct = true;
      return this;
    },

    // Clones the current query builder, including any
    // pieces that have been set thus far
    clone: function() {
      var item = new Builder(this.table);
      var items = [
        'isDistinct', 'joins',
        'wheres', 'orders', 'columns', 'bindings',
        'grammar', 'connection', 'transaction'
      ];
      for (var i = 0, l = items.length; i < l; i++) {
        var k = items[i];
        item[k] = this[k];
      }
      return item;
    },

    // Resets all attributes on the query builder.
    reset: function() {
      this.joins = [];
      this.wheres = [];
      this.orders = [];
      this.columns = [];
      this.bindings = [];
      this.isDistinct = false;
    },

    toJSON: function() {
      return {
        joins: this.joins,
        wheres: this.wheres,
        order: this.orders,
        columns: this.columns,
        bindings: this.bindings,
        isDistinct: this.isDistinct
      };
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
      var key;
      bool || (bool = 'and');
      if (_.isFunction(column)) {
        return this._whereNested(column, bool);
      }
      if (_.isObject(column)) {
        for (key in column) {
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

    whereRaw: function(sql, bindings, bool) {
      bindings || (bindings = []);
      bool || (bool = 'and');
      this.wheres.push({type:'raw', sql:sql, bool:bool});
      push.apply(this.bindings, bindings);
      return this;
    },

    orWhereRaw: function(sql, bindings) {
      return this.whereRaw(sql, bindings, 'or');
    },

    // Adds an `or where` clause to the query.
    orWhere: function(column, operator, value) {
      return this.where(column, operator, value, 'or');
    },

    // Adds a `where exists` clause to the query.
    whereExists: function(callback, bool, type) {
      var query = new Builder();
      query.isSubQuery = true;
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
        return this._whereInSub(column, values, bool, 'not');
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
      this.groups = this.groups.concat(_.toArray(arguments));
      return this;
    },

    // Adds a `order by` clause to the query.
    orderBy: function(column, direction) {
      this.orders.push({column: column, direction: (direction || 'asc')});
      return this;
    },

    // Adds a `having` clause to the query.
    having: function(column, operator, value) {
      this.havings.push({column: column, operator: (operator || ''), value: (value || '')});
      this.bindings.push(value);
      return this;
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

    // Determine if any rows exist for the current query.
    exists: function() {
      return this.count().then(function(count) {
        return (count > 0);
      });
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

    // Performs a `select` query, returning a promise.
    select: function(columns) {
      this.columns = this.columns.concat(columns ? (_.isArray(columns) ? columns : _.toArray(arguments)) : '*');
      if (!this.isSubQuery) {
        return Knex.runQuery(this, {sql: this.grammar.compileSelect(this), bindings: this._cleanBindings()});  
      }
      return this;
    },

    // Performs an `insert` query, returning a promise.
    insert: function(values, returning) {
      if (!_.isArray(values)) values = values ? [values] : [];
      for (var i = 0, l = values.length; i<l; i++) {
        var obj = sortObject(values[i]);
        for (var i2 = 0, l2 = obj.length; i2 < l2; i2++) {
          this.bindings.push(obj[i2][1]);
        }
      }
      var str = this.grammar.compileInsert(this, values);
      return Knex.runQuery(this, {sql: str, bindings: this._cleanBindings(), type: 'insert'});
    },

    // Performs an `update` query, returning a promise.
    update: function(values) {
      this.bindings = _.values(values).concat(this.bindings);
      return Knex.runQuery(this, {sql: this.grammar.compileUpdate(this, values), bindings: this._cleanBindings(), type: 'update'});
    },

    // Alias to del
    "delete": function() {
      return this.del();
    },

    // Executes a delete statement on the query;    
    del: function() {
      return Knex.runQuery(this, {sql: this.grammar.compileDelete(this), bindings: this._cleanBindings()});
    },

    // Truncate
    truncate: function() {
      return Knex.runQuery(this, {sql: this.grammar.compileTruncate(this)});
    },

    // Set by `transacting` - contains the object with the connection
    // needed to execute a transaction
    transaction: false,

    // Sets the current Builder connection to that of the
    // the currently running transaction
    transacting: function(t) {
      this.transaction = t;
      return this;
    },

    // ----------------------------------------------------------------------

    _whereInSub: function(column, callback, bool, condition) {
      var type = condition ? 'NotInSub' : 'InSub';
      var query = new Builder();
      query.isSubQuery = true;
      callback.call(query, query);
      this.wheres.push({type: type, column: column, query: query, bool: bool});
      push.apply(this.bindings, query.bindings);
      return this;
    },

    _whereNested: function(callback, bool) {
      var query = new Builder();
      query.isSubQuery = true;
      query.table = this.table;
      callback.call(query, query);
      this.wheres.push({type: 'Nested', query: query, bool: bool});
      push.apply(this.bindings, query.bindings);
      return this;
    },

    _whereSub: function(column, operator, callback, bool) {
      var query = new Builder();
      query.isSubQuery = true;
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

    _aggregate: function(type, columns) {
      this.aggregate = {type: type, columns: columns};
      return this.get(columns);
    },

    _counter: function(column, amount, symbol) {
      var sql = {};
      sql[column] = new Knex.Raw('' + this.grammar.wrap(column) + ' ' + (symbol || '+') + ' ' + amount);
      return this.update(sql, callback);
    },

    // Returns all bindings excluding the `Knex.Raw` types.
    _cleanBindings: function() {
      return _.map(this.bindings, function(binding) {
        return (binding instanceof Knex.Raw ? void 0 : binding);
      });
    }

  };

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

    orOn: function(first, operator, second) {
      this.clauses.push({first: first, operator: operator, second: second, bool: 'or'});
      return this;
    }

  };

  // Knex.Transaction
  // ---------

  Knex.Transaction = function(container) {
    var client = this.client;
    return client.initTransaction().then(function(connection) {

      // Initiate a deferred object, so we know when the
      // transaction completes or fails, we know what to do.
      var dfd = Q.defer();
    
      // Call the container with the transaction
      // commit & rollback objects
      container({
        commit: function() {
          client.finishTransaction('commit', this, dfd);
        },
        rollback: function() {
          client.finishTransaction('rollback', this, dfd);
        },
        // "rollback to"?
        connection: connection
      });

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
    _.each(['hasTable', 'createTable', 'table', 'dropTable', 'dropTableIfExists', 'transacting'], function(method) {

      Schema[method] = function() {
        var builder = new Knex.SchemaBuilder(client);
        return builder[method].apply(builder, arguments);
      };
    });

  };
  
  // Knex.SchemaBuilder
  // --------

  var SchemaBuilder = Knex.SchemaBuilder = function(client) {
    this.client = client;
    this.grammar = new SchemaGrammar(client.schemaGrammar);
  };

  SchemaBuilder.prototype = {

    // Create a new table on the schema.
    createTable: function(table, callback) {
      return new Blueprint(table, this.client).createTable().callback(callback).build(this.grammar);
    },

    // Modify a table on the schema.
    table: function(table, callback) {
      return new Blueprint(table, this.client).callback(callback).build(this.grammar);
    },

    // Drop a table from the schema.
    dropTable: function(table) {
      return new Blueprint(table, this.client).dropTable().build(this.grammar);
    },

    // Drop a table from the schema if it exists.
    dropTableIfExists: function(table) {
      return new Blueprint(table, this.client).dropTableIfExists().build(this.grammar);
    },

    // Rename a table on the schema.
    renameTable: function(from, to) {
      return new Blueprint(from, this.client).renameTable(to).build(this.grammar);
    },

    // Determine if the given table exists.
    // TODO: Bindings here need to be fixed for mysql, including `table`.
    hasTable: function(table) {
      var sql = this.grammar.compileTableExists();
      return Knex.runQuery(this, {sql: sql, bindings: [table]}).then(function(resp) {
        return (resp.length > 0 ? resp : Q.reject('Table' + table + ' does not exist'));
      });
    }

  };

  // SchemaGrammar
  // --------

  var SchemaGrammar = function(mixins) {
    _.extend(this, mixins);
  };

  _.extend(SchemaGrammar.prototype, Grammar.prototype, {
    
    // Compile a foreign key command.
    compileForeign: function(blueprint, command) {
      var table = this.wrapTable(blueprint);
      var on    = this.wrapTable(command.on);

      // We need to prepare several of the elements of the foreign key definition
      // before we can create the SQL, such as wrapping the tables and convert
      // an array of columns to comma-delimited strings for the SQL queries.
      var columns = this.columnize(command.columns);
      var onColumns = this.columnize(command.references);

      var sql = "alter table " + table + " add constraint " + command.index + " ";
          sql += "foreign key (" + columns + ") references " + on + " (" + onColumns + ")";

      // Once we have the basic foreign key creation statement constructed we can
      // build out the syntax for what should happen on an update or delete of
      // the affected columns, which will get something like "cascade", etc.
      if (command.onDelete) sql += " on delete " + command.onDelete;
      if (command.onUpdate) sql += " on update " + command.onUpdate;

      return sql;
    },

    // Each of the column types have their own compiler functions which are
    // responsible for turning the column definition into its SQL format
    // for the platform. Then column modifiers are compiled and added.
    getColumns: function(blueprint) {
      var columns = [];
      for (var i = 0, l = blueprint.columns.length; i < l; i++) {
        var column = blueprint.columns[i];
        var sql = this.wrap(column) + ' ' + this.getType(column);
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

    // Get the primary key command if it exists on the blueprint.
    getCommandByName: function(blueprint, name) {
      var commands = this.getCommandsByName(blueprint, name);
      if (commands.length > 0) return commands[0];
    },
    
    // Get all of the commands with a given name.
    getCommandsByName: function(blueprint, name) {
      return _.where(blueprint.commands, function(value) { return value.name == name; });
    },

    // Get the SQL for the column data type.
    getType: function(column) {
      return this["type" + capitalize(column.type)](column);
    },

    // Add a prefix to an array of values, utilized in the client libs.
    prefixArray: function(prefix, values) {
      return _.map(values, function(value) { return prefix + ' ' + value; });
    },

    // Wrap a table in keyword identifiers.
    wrapTable: function(table) {
      if (table instanceof Blueprint) table = table.table;
      return Grammar.prototype.wrapTable.call(this, table);
    },

    // Wrap a value in keyword identifiers.
    wrap: function(value) {
      if (value instanceof Chainable) value = value.name;
      return Grammar.prototype.wrap.call(this, value);
    },

    // Format a value so that it can be used in "default" clauses.
    getDefaultValue: function(value) {
      if (value === true || value === false) {
        return parseInt(value, 10);
      }
      return '' + value;
    }
  });

  // Knex.Blueprint
  // ------
  var Blueprint = Knex.Blueprint = function(table, client) {
    this.table = table;
    this.columns = [];
    this.commands = [];
    this.client = client;
  };

  Blueprint.prototype = {

    // A callback from the table building `Knex.schemaBuilder` calls.
    callback: function(callback) {
      callback.call(this, this);
      return this;
    },

    // Builds the schemaBuilder statements to be executed.
    build: function(grammar) {
      var statements = this.toSql(grammar);
      var promises = [];
      var connection = this.connection = this.client.getConnection();
      for (var i = 0, l = statements.length; i < l; i++) {
        var statement = statements[i];
        promises.push(Knex.runQuery(this, {sql: statement}));
      }
      // Ensures all queries for the same table
      // are run on the same connection.
      return Q.all(promises).fin(function() {
        connection.end();
      });
    },

    // Get the raw sql statements for the blueprint.
    toSql: function(grammar) {

      // Add the commands that are implied by the blueprint.
      if (this.columns.length > 0 && !this.creating()) {
        this.commands.unshift(new Chainable({name: 'add'}));
      }

      // Add indicies
      for (var i = 0, l = this.columns.length; i < l; i++) {
        var column = this.columns[i];
        var indices = ['primary', 'unique', 'index'];
        
        continueIndex:
        for (var i2 = 0, l2 = indices.length; i2 < l2; i2++) {
          var index = indices[i2];
          var indexVar = 'is' + capitalize(index);

          // If the index has been specified on the given column, but is simply
          // equal to "true" (boolean), no name has been specified for this
          // index, so we will simply call the index methods without one.
          if (column[indexVar] === true) {
            this[index](column);
            continue continueIndex;
          
          // If the index has been specified on the column and it is something
          // other than boolean true, we will assume a name was provided on
          // the index specification, and pass in the name to the method.
          } else if (_.has(column, indexVar)) {
            this[index](column.name, column[indexVar]);
            continue continueIndex;
          }
        }
      }

      var statements = [];

      // Each type of command has a corresponding compiler function on the schema
      // grammar which is used to build the necessary SQL statements to build
      // the blueprint element, so we'll just call that compilers function.
      for (i = 0, l = this.commands.length; i < l; i++) {
        var command = this.commands[i];
        var method = 'compile' + capitalize(command.name);
        if (_.has(grammar, method)) {
          var sql = grammar[method](this, command);
          statements.push(sql);
        }
      }

      return statements;
    },

    // Determine if the blueprint has a create command.
    creating: function() {
      var command;
      for (var i = 0, l = this.commands.length; i < l; i++) {
        command = this.commands[i];
        if (command.name == 'createTable') return true;
      }
      return false;
    },

    // Indicate that the table needs to be created.
    createTable: function() {
      this._addCommand('createTable');
      return this;
    },

    // Indicate that the table should be dropped.
    dropTable: function() {
      this._addCommand('dropTable');
      return this;
    },

    // Indicate that the table should be dropped if it exists.
    dropTableIfExists: function() {
      this._addCommand('dropTableIfExists');
      return this;
    },

    // Indicate that the given columns should be dropped.
    dropColumn: function(columns) {
      if (!_.isArray(columns)) columns = columns ? [columns] : [];
      return this._addCommand('dropColumn', {columns: columns});
    },

    // Rename the table to a given name.
    renameTable: function(to) {
      return this._addCommand('renameTable', {to: to});
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

    // Specify a foreign key for the table.
    foreign: function(columns, name) {
      return this._indexCommand('foreign', columns, name);
    },

    // Create a new auto-incrementing column on the table.
    increments: function(column) {
      return this._addColumn('integer', (column || 'id'), {autoIncrement: true, length: 11});
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

    // Add creation and update timestamps to the table.
    timestamps: function() {
      this.timestamp('created_at');
      this.timestamp('updated_at');
    },

    // Alias to enum.
    "enum": function(column, allowed) {
      return this.enu(column, allowed);
    },

    // Create a new enum column on the table.
    enu: function(column, allowed) {
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
        index = (table + '_' + _.map(columns, function(col) { return col.name; }).join('_') + '_' + type).toLowerCase();
      }
      return this._addCommand(type, {index: index, columns: columns});
    },

    // Add a new column to the blueprint.
    _addColumn: function(type, name, parameters) {
      if (!name) throw new Error('A `name` must be defined to add a column');
      var attrs = _.extend({type: type, name: name}, parameters);
      var column = new Chainable(attrs);
      this.columns.push(column);
      return column;
    },

    // Add a new command to the blueprint.
    _addCommand: function(name, parameters) {
      var command = new Chainable(_.extend({name: name}, parameters));
      this.commands.push(command);
      return command;
    }
  };

  // Chainable object used in creating SchemaBuilder commands.
  var Chainable = function(obj) {
    _.extend(this, obj);
  };

  Chainable.prototype = {

    // Sets the default value for a column.
    defaultTo: function(value) {
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

    index: function(name) {
      this.isIndex = name || true;
      return this;
    },

    primary: function(name) {
      this.isPrimary = name || true;
      return this;
    },

    unique: function(name) {
      this.isUnique = name || true;
      return this;
    }

  };

  var capitalize = function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  var sortObject = function(obj) {
    return _.sortBy(_.pairs(obj), function(a) { 
      return a[0]; 
    });
  };

  // Knex.Raw
  // -------
  Knex.Raw = function(value) {
    this.value = value;
  };

  // Knex.runQuery
  // -------

  // Query runner, the context of this function is set to the caller,
  // (either Builder or SchemaBuilder). Checks and fails on an already
  // resolved transaction, otherwise calls the query on the specified client 
  // and returns a deferred promise.
  Knex.runQuery = function(builder, data) {
    if (builder.transaction) {
      if (!builder.transaction.connection) return Q.reject(new Error('The transaction has already completed.'));
      builder.connection = builder.transaction.connection;
    }
    // Query on the query builder, which should resolve with a promise, 
    // spreadable to include more information including the query.
    return builder.client.query(data, builder.connection);
  };

  // Knex.Initialize
  // -------
  
  // Takes a hash of options to initialize the database
  // connection. The `client` is required to choose which client
  // path above is loaded, or to specify a custom path to a client.
  // Other options, such as `connection` or `pool` are passed 
  // into `client.initialize`.
  Knex.Initialize = function(name, options) {
    var Target, ClientCtor, client;

    if (_.isObject(name)) {
      options = name;
      name    = 'default';
    }
    
    // Don't try to initialize the same `name` twice... If necessary,
    // delete the instance from `Knex.Instances`.
    if (Knex.Instances[name]) {
      throw new Error('An instance named ' + name + ' already exists');
    }

    client = options.client;
    
    if (!client) throw new Error('The client is required to use Knex.');

    // Checks if this is a default client. If it's not,
    // require it as the path to the client if it's a string,
    // and otherwise, set the object to the client.
    if (Clients[client]) {
      ClientCtor = require(Clients[client]);
    } else if (_.isString(client)) {
      ClientCtor = require(client);
    } else {
      ClientCtor = client;
    }

    // Creates a new instance of the db client, passing the name and options.
    client = new ClientCtor(name, _.omit(options, 'client'));

    // If this is named "default" then we're setting this on the Knex
    if (name === 'default') {
      Target = Knex.Instances['default'] = Knex;
    } else {
      Target = Knex.Instances[name] = function(table) {
        return new Knex.Builder(table, client);
      };

      // Inherit static properties.
      _.extend(Target, Knex);
    }

    // Initialize the schema builder methods.
    initSchema(Target, client);

    // Specifically set the client on the current target.
    Target.client = client;
  };

  // Default client paths, located in the `./clients` directory.
  var Clients = {
    'mysql'    : './clients/mysql.js',
    'postgres' : './clients/postgres.js',
    'sqlite3'  : './clients/sqlite3.js'
  };

  // Named instances of Knex, presumably with different database
  // connections, the main instance being named "default"...
  Knex.Instances = {};

  Knex.getInstance = function(name, options) {
    if (!Knex.Instances[name]) {
      throw new Error('There is no ' + name + ' instance of Knex.');
    }
    return Knex.Instances[name];
  };

  // Export the Knex module
  module.exports = Knex;

}).call(this);