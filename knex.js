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
  var _    = require('underscore');
  var when = require('when');

  // `Knex` is the root namespace and a chainable function: `Knex('tableName')`
  var Knex = function(table) {
    if (!Knex.Instances['main']) {
      throw new Error('The Knex instance has not been initialized yet.');
    }
    return Knex.Instances['main'](table);
  };

  // Keep in sync with package.json
  Knex.VERSION = '0.2.6';

  // Methods common to both the `Grammar` and `SchemaGrammar` interfaces,
  // used to generate the sql in one form or another.
  var Common = {

    _debug: false,

    _promise: null,

    debug: function() {
      this._debug = true;
      return this;
    },

    // For those who dislike promise interfaces.
    // Multiple calls to `exec` will resolve with the same value
    // if called more than once. Any unhandled errors will be thrown
    // after the last block.
    exec: function(callback) {
      this._promise || (this._promise = this.runQuery());
      return this._promise.then(function(resp) {
        if (callback) callback(null, resp);
      }, function(err) {
        if (callback) callback(err, null);
      }).then(null, function(err) {
        setTimeout(function() { throw err; }, 0);
      });
    },

    // The promise interface for the query builder.
    then: function(onFulfilled, onRejected) {
      this._promise || (this._promise = this.runQuery());
      return this._promise.then(onFulfilled, onRejected);
    },

    // Returns an array of query strings filled out with the
    // correct values based on bindings, etc. Useful for debugging.
    toString: function() {
      this.type || (this.type = 'select');
      var data = this.toSql();
      var builder = this;
      if (!_.isArray(data)) data = [data];
      return _.map(data, function(str) {
        var questionCount = 0;
        return str.replace(/\?/g, function() {
          return builder.bindings[questionCount++];
        });
      }).join('; ');
    },

    // Explicitly sets the connection.
    connection: function(connection) {
      this._connection = connection;
      return this;
    },

    // The connection the current query is being run on, optionally
    // specified by the `connection` method.
    _connection: false,

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
    _cleanBindings: function() {
      var bindings = this.bindings;
      var cleaned = [];
      for (var i = 0, l = bindings.length; i < l; i++) {
        if (!(bindings[i] instanceof Raw)) {
          cleaned.push(bindings[i]);
        } else {
          push.apply(cleaned, bindings[i].bindings);
        }
      }
      return cleaned;
    },

    // Runs the query on the current builder instance and returns a promise.
    runQuery: function() {
      if (this.transaction) {
        if (!this.transaction.connection) return when.reject(new Error('The transaction has already completed.'));
        this._connection = this.transaction.connection;
      }

      // Prep the SQL associated with the this.
      this.sql = this.toSql();
      this.bindings = this._cleanBindings();
      if (!_.isArray(this.sql)) this.sql = [this.sql];

      var chain;
      for (var i = 0, l = this.sql.length; i < l; i++) {
        if (chain) {
          chain.then(multiQuery(this, i, chain));
        } else {
          chain = multiQuery(this, i);
        }
      }
      return chain;
    }

  };

  // Grammar
  // -------

  // The list of different components
  var components = [
    'aggregate', 'columns', 'from',
    'joins', 'wheres', 'groups', 'havings',
    'orders', 'limit', 'offset', 'unions'
  ];

  Knex.Grammar = {

    // Compiles the `select` statement, or nested sub-selects
    // by calling each of the component compilers, trimming out
    // the empties, and returning a generated query string.
    compileSelect: function(qb) {
      var sql = {};
      if (_.isEmpty(qb.columns)) qb.columns = ['*'];
      for (var i = 0, l = components.length; i < l; i++) {
        var component = components[i];
        var result = _.result(qb, component);
        if (result != null) {
          sql[component] = this['compile' + capitalize(component)](qb, result);
        }
      }
      return _.compact(sql).join(' ');
    },

    // Compiles an aggregate query.
    compileAggregate: function(qb) {
      var column = this.columnize(qb.aggregate.columns);
      if (qb.isDistinct && column !== '*') {
        column = 'distinct ' + column;
      }
      return 'select ' + qb.aggregate.type + '(' + column + ') as aggregate';
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
      return 'having ' + havings.map(function(having) {
        if (having.type === 'Raw') {
          return having.bool + ' ' + having.sql;
        }
        return having.bool + ' ' + this.wrap(having.column) + ' ' + having.operator + ' ' + this.parameter(having['value']);
      }, this).replace(/and |or /, '');
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
      if (qb.wheres.length > 0) this._clearWhereBindings(qb);

      for (var i = 0, l = values.length; i < l; ++i) {
        paramBlocks.push("(" + this.parameterize(_.pluck(values[i], 1)) + ")");
      }

      return "insert into " + table + " (" + this.columnize(columns) + ") values " + paramBlocks.join(', ');
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
      return this.grammar['compile' + capitalize(this.type)](this);
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
      var obj = sortObject(values);
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
        var obj = values[i] = sortObject(values[i]);
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

  var SchemaBuilder = Knex.SchemaBuilder = function(table) {
    this.table = table;
    this.columns = [];
    this.commands = [];
    this.bindings = [];
  };

  _.extend(SchemaBuilder.prototype, Common, {

    _source: 'SchemaBuilder',

    // A callback from the table building `Knex.schemaBuilder` calls.
    callback: function(callback) {
      if (callback) callback.call(this, this);
      return this;
    },

    // Get the raw sql statements for the blueprint.
    toSql: function() {

      // Add the commands that are implied by the blueprint.
      if (this.columns.length > 0 && !this.creating()) {
        this.commands.unshift({name: 'add'});
      }

      // Add an "additional" command, for any extra dialect-specific logic.
      this.commands.push({name: 'additional'});

      // Add indicies
      for (var i = 0, l = this.columns.length; i < l; i++) {
        var column = this.columns[i];
        var indices = ['primary', 'unique', 'index', 'foreign'];

        continueIndex:
        for (var i2 = 0, l2 = indices.length; i2 < l2; i2++) {
          var index = indices[i2];
          var indexVar = 'is' + capitalize(index);

          // If the index has been specified on the given column, but is simply
          // equal to "true" (boolean), no name has been specified for this
          // index, so we will simply call the index methods without one.
          if (column[indexVar] === true) {
            this[index](column, null);
            continue continueIndex;

          // If the index has been specified on the column and it is something
          // other than boolean true, we will assume a name was provided on
          // the index specification, and pass in the name to the method.
          } else if (_.has(column, indexVar)) {
            this[index](column.name, column[indexVar], column);
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
        if (_.has(this.grammar, method)) {
          var sql = this.grammar[method](this, command);
          if (sql) statements = statements.concat(sql);
        }
      }

      return statements;
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
      this.isEngine = name;
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

    // Adds an index on the specified column.
    index: function(name) {
      this.isIndex = name || true;
      return this;
    },

    // Sets this column as the primary key.
    primary: function(name) {
      this.isPrimary = name || true;
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


  Knex.SchemaGrammar = {

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
      return this['type' + capitalize(column.type)](column, blueprint);
    },

    // Add a prefix to an array of values, utilized in the client libs.
    prefixArray: function(prefix, values) {
      return _.map(values, function(value) { return prefix + ' ' + value; });
    },

    // Wrap a table in keyword identifiers.
    wrapTable: function(table) {
      if (table instanceof SchemaBuilder) table = table.table;
      return Knex.Grammar.wrapTable.call(this, table);
    },

    // Wrap a value in keyword identifiers.
    wrap: function(value) {
      if (value && value.name) value = value.name;
      return Knex.Grammar.wrap.call(this, value);
    },

    // Format a value so that it can be used in "default" clauses.
    getDefaultValue: function(value) {
      if (value instanceof Raw) return value.sql;
      if (value === true || value === false) {
        return parseInt(value, 10);
      }
      return '' + value;
    }
  };

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

  var Raw = function(sql, bindings) {
    this.bindings = (!_.isArray(bindings) ? (bindings ? [bindings] : []) : bindings);
    this.sql = sql;
  };

  _.extend(Raw.prototype, Common, {

    _source: 'Raw',

    // Returns the raw sql for the query.
    toSql: function() {
      return this.sql;
    }

  });

  // Simple capitalization of a word.
  var capitalize = function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  // Sorts an object based on the names.
  var sortObject = function(obj) {
    return _.sortBy(_.pairs(obj), function(a) {
      return a[0];
    });
  };

  // Sets up a multi-query to be executed with serial promises.
  var multiQuery = function(builder, i, chain) {
    if (chain) {
      return function() {
        return multiQuery(builder, i);
      };
    }
    return builder.client.query(_.extend({}, builder, {sql: builder.sql[i]}));
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

    // Setup the grammars specific to the client.
    client.grammar = _.extend({}, Knex.Grammar, client.grammar);
    client.schemaGrammar = _.extend({}, client.grammar, Knex.SchemaGrammar, client.schemaGrammar);

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