'use strict';

// Builder
// -------
var _            = require('lodash');
var inherits     = require('inherits');
var EventEmitter = require('events').EventEmitter;

var Raw          = require('../raw');
var helpers      = require('../helpers');

var JoinClause  = require('./joinclause');

// Typically called from `knex.builder`,
// start a new query building chain.
function QueryBuilder() {
  this._single     = {};
  this._statements = [];
  this._errors     = [];

  // Internal flags used in the builder.
  this._joinFlag  = 'inner';
  this._boolFlag  = 'and';

  this.and = this;
}
inherits(QueryBuilder, EventEmitter);

QueryBuilder.prototype.toString = function() {
  return this.toQuery();
};

// Convert the current query "toSQL"
QueryBuilder.prototype.toSQL = function() {
  var QueryCompiler = this.client.QueryCompiler;
  return new QueryCompiler(this).toSQL(this._method || 'select');
};

// Create a shallow clone of the current query builder.
// TODO: Test this!!
QueryBuilder.prototype.clone = function() {
  var cloned            = new this.constructor();
    cloned._method      = this._method;
    cloned._single      = _.clone(this._single);
    cloned._options     = _.clone(this._options);
    cloned._statements  = this._statements.slice();
    cloned._errors      = this._errors.slice();
    cloned._debug       = this._debug;
    cloned._quote       = this._quote;
    cloned._transacting = this._transacting;
    cloned._connection  = this._connection;
  return cloned;
};

// Select
// ------

// Sets the values for a `select` query,
// which is the same as specifying the columns.
QueryBuilder.prototype.select =

// Adds a column or columns to the list of "columns"
// being selected on the query.
QueryBuilder.prototype.columns =
QueryBuilder.prototype.column = function(column) {
  if (!column) return this;
  this._statements.push({
    grouping: 'columns',
    value: helpers.normalizeArr.apply(null, arguments)
  });
  return this;
};

// Allow for a sub-select to be explicitly aliased as a column,
// without needing to compile the query in a where.
QueryBuilder.prototype.as = function(column) {
  this._single.as = column;
  return this;
};

// Sets the `tableName` on the query.
// Alias to "from" for select and "into" for insert statements
// e.g. builder.insert({a: value}).into('tableName')
QueryBuilder.prototype.table = function(tableName) {
  this._single.table = tableName;
  return this;
};
QueryBuilder.prototype.from = QueryBuilder.prototype.table;
QueryBuilder.prototype.into = QueryBuilder.prototype.table;

// Adds a `distinct` clause to the query.
QueryBuilder.prototype.distinct = function() {
  this._statements.push({
    grouping: 'columns',
    value: helpers.normalizeArr.apply(null, arguments),
    distinct: true
  });
  return this;
};

// Adds a join clause to the query, allowing for advanced joins
// with an anonymous function as the second argument.
QueryBuilder.prototype.join = function(table, first, operator, second) {
  /*jshint unused: false*/
  var i, args = new Array(arguments.length);
  for (i = 0; i < args.length; i++) {
    args[i] = arguments[i];
  }
  var join;
  var joinType = this._joinType();
  if (_.isFunction(first)) {
    join = new JoinClause(table, joinType);
    first.call(join, join);
  } else if (joinType === 'raw') {
    join = new JoinClause(new Raw(table, first), 'raw');
  } else {
    join = new JoinClause(table, joinType);
    join.on.apply(join, args.slice(1));
  }
  this._statements.push(join);
  return this;
};

// JOIN blocks:
QueryBuilder.prototype.innerJoin = function() {
  return this._joinType('inner').join.apply(this, arguments);
};
QueryBuilder.prototype.leftJoin = function() {
  return this._joinType('left').join.apply(this, arguments);
};
QueryBuilder.prototype.leftOuterJoin = function() {
  return this._joinType('left outer').join.apply(this, arguments);
};
QueryBuilder.prototype.rightJoin = function() {
  return this._joinType('right').join.apply(this, arguments);
};
QueryBuilder.prototype.rightOuterJoin = function() {
  return this._joinType('right outer').join.apply(this, arguments);
};
QueryBuilder.prototype.outerJoin = function() {
  return this._joinType('outer').join.apply(this, arguments);
};
QueryBuilder.prototype.fullOuterJoin = function() {
  return this._joinType('full outer').join.apply(this, arguments);
};
QueryBuilder.prototype.crossJoin = function() {
  return this._joinType('cross').join.apply(this, arguments);
};
QueryBuilder.prototype.joinRaw = function() {
  return this._joinType('raw').join.apply(this, arguments);
};

// The where function can be used in several ways:
// The most basic is `where(key, value)`, which expands to
// where key = value.
QueryBuilder.prototype.where =
QueryBuilder.prototype.andWhere = function(column, operator, value) {

  // Check if the column is a function, in which case it's
  // a where statement wrapped in parens.
  if (_.isFunction(column)) {
    return this.whereWrapped(column);
  }

  // Allow a raw statement to be passed along to the query.
  if (column instanceof Raw) return this.whereRaw(column);

  // Allows `where({id: 2})` syntax.
  if (_.isObject(column)) return this._objectWhere(column);

  // Enable the where('key', value) syntax, only when there
  // are explicitly two arguments passed, so it's not possible to
  // do where('key', '!=') and have that turn into where key != null
  if (arguments.length === 2) {
    value    = operator;
    operator = '=';

    // If the value is null, and it's a two argument query,
    // we assume we're going for a `whereNull`.
    if (value === null) {
      return this.whereNull(column);
    }
  }

  // lower case the operator for comparison purposes
  var checkOperator = ('' + operator).toLowerCase().trim();

  // If there are 3 arguments, check whether 'in' is one of them.
  if (arguments.length === 3) {
    if (checkOperator === 'in' || checkOperator === 'not in') {
      return this.whereIn(arguments[0], arguments[2], (checkOperator === 'not in'));
    }
    if (checkOperator === 'between' || checkOperator === 'not between') {
      return this.whereBetween(arguments[0], arguments[2], (checkOperator === 'not between'));
    }
  }

  // If the value is still null, check whether they're meaning
  // where value is null
  if (value === null) {

    // Check for .where(key, 'is', null) or .where(key, 'is not', 'null');
    if (checkOperator === 'is' || checkOperator === 'is not') {
      return this.whereNull(column, (checkOperator === 'is not'));
    }
  }

  // Push onto the where statement stack.
  this._statements.push({
    grouping: 'where',
    type: 'whereBasic',
    column: column,
    operator: operator,
    value: value,
    bool: this._bool()
  });
  return this;
};
// Adds an `or where` clause to the query.
QueryBuilder.prototype.orWhere = function() {
  return this._bool('or').where.apply(this, arguments);
};

// Processes an object literal provided in a "where" clause.
QueryBuilder.prototype._objectWhere = function(obj) {
  var boolVal = this._bool();
  for (var key in obj) {
    this[boolVal + 'Where'](key, obj[key]);
  }
  return this;
};

// Adds a raw `where` clause to the query.
QueryBuilder.prototype.whereRaw =
QueryBuilder.prototype.andWhereRaw = function(sql, bindings) {
  var raw = (sql instanceof Raw ? sql : new Raw(sql, bindings));
  this._statements.push({
    grouping: 'where',
    type: 'whereRaw',
    value: raw,
    bool: this._bool()
  });
  return this;
};
QueryBuilder.prototype.orWhereRaw = function(sql, bindings) {
  return this._bool('or').whereRaw(sql, bindings);
};

// Helper for compiling any advanced `where` queries.
QueryBuilder.prototype.whereWrapped = function(callback) {
  this._statements.push({
    grouping: 'where',
    type: 'whereWrapped',
    value: callback,
    bool: this._bool()
  });
  return this;
};

// Adds a `where exists` clause to the query.
QueryBuilder.prototype.whereExists = function(callback, not) {
  not = this._not() || not;
  this._statements.push({
    grouping: 'where',
    type: 'whereExists',
    value: callback,
    not: not || false,
    bool: this._bool(),
  });
  return this;
};

// Adds an `or where exists` clause to the query.
QueryBuilder.prototype.orWhereExists = function(callback) {
  return this._bool('or').whereExists(callback);
};

// Adds a `where not exists` clause to the query.
QueryBuilder.prototype.whereNotExists = function(callback) {
  return this.whereExists(callback, true);
};

// Adds a `or where not exists` clause to the query.
QueryBuilder.prototype.orWhereNotExists = function(callback) {
  return this._bool('or').whereExists(callback, true);
};

// Adds a `where in` clause to the query.
QueryBuilder.prototype.whereIn = function(column, values, not) {
  not = this._not() || not;
  this._statements.push({
    grouping: 'where',
    type: 'whereIn',
    column: column,
    value: values,
    not: not || false,
    bool: this._bool()
  });
  return this;
};

// Adds a `or where in` clause to the query.
QueryBuilder.prototype.orWhereIn = function(column, values) {
  return this._bool('or').whereIn(column, values);
};

// Adds a `where not in` clause to the query.
QueryBuilder.prototype.whereNotIn = function(column, values) {
  return this.whereIn(column, values, true);
};

// Adds a `or where not in` clause to the query.
QueryBuilder.prototype.orWhereNotIn = function(column, values) {
  return this._bool('or').whereIn(column, values, true);
};

// Adds a `where null` clause to the query.
QueryBuilder.prototype.whereNull = function(column, not) {
  not = this._not() || not;
  this._statements.push({
    grouping: 'where',
    type: 'whereNull',
    column: column,
    not: not || false,
    bool: this._bool()
  });
  return this;
};

// Adds a `or where null` clause to the query.
QueryBuilder.prototype.orWhereNull = function(column) {
  return this._bool('or').whereNull(column);
};

// Adds a `where not null` clause to the query.
QueryBuilder.prototype.whereNotNull = function(column) {
  return this.whereNull(column, ' is not null');
};

// Adds a `or where not null` clause to the query.
QueryBuilder.prototype.orWhereNotNull = function(column) {
  return this._bool('or').whereNull(column, ' is not null');
};

// Adds a `where between` clause to the query.
QueryBuilder.prototype.whereBetween = function(column, values, not) {
  if (!_.isArray(values)) {
    return this._errors.push(new Error('The second argument to whereBetween must be an array.'));
  }
  if (values.length !== 2) {
    return this._errors.push(new Error('You must specify 2 values for the whereBetween clause'));
  }
  not = this._not() || not;
  this._statements.push({
    grouping: 'where',
    type: 'whereBetween',
    column: column,
    value: values,
    not: not || false,
    bool: this._bool()
  });
  return this;
};

// Adds a `where not between` clause to the query.
QueryBuilder.prototype.whereNotBetween = function(column, values) {
  return this.whereBetween(column, values, true);
};

// Adds a `or where between` clause to the query.
QueryBuilder.prototype.orWhereBetween = function(column, values) {
  return this._bool('or').whereBetween(column, values);
};

// Adds a `or where not between` clause to the query.
QueryBuilder.prototype.orWhereNotBetween = function(column, values) {
  return this._bool('or').whereNotBetwen(column, values);
};

// Adds a `group by` clause to the query.
QueryBuilder.prototype.groupBy = function(item) {
  if (item instanceof Raw) {
    return this.groupByRaw.apply(this, arguments);
  }
  this._statements.push({
    grouping: 'group',
    type: 'groupByBasic',
    value: helpers.normalizeArr.apply(null, arguments)
  });
  return this;
};

// Adds a raw `group by` clause to the query.
QueryBuilder.prototype.groupByRaw = function(sql, bindings) {
  var raw = (sql instanceof Raw ? sql : new Raw(sql, bindings));
  this._statements.push({
    grouping: 'group',
    type: 'groupByRaw',
    value: raw
  });
  return this;
};

// Adds a `order by` clause to the query.
QueryBuilder.prototype.orderBy = function(column, direction) {
  this._statements.push({
    grouping: 'order',
    type: 'orderByBasic',
    value: column,
    direction: direction
  });
  return this;
};

// Add a raw `order by` clause to the query.
QueryBuilder.prototype.orderByRaw = function(sql, bindings) {
  var raw = (sql instanceof Raw ? sql : new Raw(sql, bindings));
  this._statements.push({
    grouping: 'order',
    type: 'orderByRaw',
    value: raw
  });
  return this;
};

// Add a union statement to the query.
QueryBuilder.prototype.union = function(callback, wrap) {
  if (arguments.length > 1) {
    var args = new Array(arguments.length);
    for (var i = 0, l = args.length; i < l; i++) {
      args[i] = arguments[i];
      this.union(args[i]);
    }
    return this;
  }
  this._statements.push({
    grouping: 'union',
    clause: 'union',
    value: callback,
    wrap: wrap || false
  });
  return this;
};

// Adds a union all statement to the query.
QueryBuilder.prototype.unionAll = function(callback, wrap) {
  this._statements.push({
    grouping: 'union',
    clause: 'union all',
    value: callback,
    wrap: wrap || false
  });
  return this;
};

// Adds a `having` clause to the query.
QueryBuilder.prototype.having =
QueryBuilder.prototype.andHaving = function(column, operator, value) {
  if (column instanceof Raw && arguments.length === 1) {
    return this._havingRaw(column);
  }
  this._statements.push({
    grouping: 'having',
    type: 'havingBasic',
    column: column,
    operator: operator,
    value: value,
    bool: this._bool()
  });
  return this;
};
// Adds an `or having` clause to the query.
QueryBuilder.prototype.orHaving = function() {
  return this._bool('or').having.apply(this, arguments);
};
QueryBuilder.prototype.havingRaw = function(sql, bindings) {
  return this._havingRaw(sql, bindings);
};
QueryBuilder.prototype.orHavingRaw = function(sql, bindings) {
  return this._bool('or').havingRaw(sql, bindings);
};
// Adds a raw `having` clause to the query.
QueryBuilder.prototype._havingRaw = function(sql, bindings) {
  var raw = (sql instanceof Raw ? sql : new Raw(sql, bindings));
  this._statements.push({
    grouping: 'having',
    type: 'havingRaw',
    value: raw,
    bool: this._bool()
  });
  return this;
};

// Only allow a single "offset" to be set for the current query.
QueryBuilder.prototype.offset = function(value) {
  this._single.offset = value;
  return this;
};

// Only allow a single "limit" to be set for the current query.
QueryBuilder.prototype.limit = function(value) {
  this._single.limit = value;
  return this;
};

// Retrieve the "count" result of the query.
QueryBuilder.prototype.count = function(column) {
  return this._aggregate('count', (column || '*'));
};

// Retrieve the minimum value of a given column.
QueryBuilder.prototype.min = function(column) {
  return this._aggregate('min', column);
};

// Retrieve the maximum value of a given column.
QueryBuilder.prototype.max = function(column) {
  return this._aggregate('max', column);
};

// Retrieve the sum of the values of a given column.
QueryBuilder.prototype.sum = function(column) {
  return this._aggregate('sum', column);
};

// Retrieve the average of the values of a given column.
QueryBuilder.prototype.avg = function(column) {
  return this._aggregate('avg', column);
};

// Increments a column's value by the specified amount.
QueryBuilder.prototype.increment = function(column, amount) {
  return this._counter(column, amount);
};

// Decrements a column's value by the specified amount.
QueryBuilder.prototype.decrement = function(column, amount) {
  return this._counter(column, amount, '-');
};

// Sets the values for a `select` query, informing that only the first
// row should be returned (limit 1).
QueryBuilder.prototype.first = function() {
  var i, args = new Array(arguments.length);
  for (i = 0; i < args.length; i++) {
    args[i] = arguments[i];
  }
  this.select.apply(this, args);
  this._method = 'first';
  this.limit(1);
  return this;
};

// Pluck a column from a query.
QueryBuilder.prototype.pluck = function(column) {
  this._method = 'pluck';
  this._single.pluck = column;
  this._statements.push({
    grouping: 'columns',
    type: 'pluck',
    value: column
  });
  return this;
};

// Insert & Update
// ------

// Sets the values for an `insert` query.
QueryBuilder.prototype.insert = function(values, returning) {
  this._method = 'insert';
  if (!_.isEmpty(returning)) this.returning(returning);
  this._single.insert = values;
  return this;
};

// Sets the values for an `update`, allowing for both
// `.update(key, value, [returning])` and `.update(obj, [returning])` syntaxes.
QueryBuilder.prototype.update = function(values, returning) {
  var ret, obj = {};
  this._method = 'update';
  var i, args = new Array(arguments.length);
  for (i = 0; i < args.length; i++) {
    args[i] = arguments[i];
  }
  if (_.isString(values)) {
    obj[values] = returning;
    if (args.length > 2) {
      ret = args[2];
    }
  } else {
    obj = values;
    ret = args[1];
  }
  if (!_.isEmpty(ret)) this.returning(ret);
  this._single.update = obj;
  return this;
};

// Sets the returning value for the query.
QueryBuilder.prototype.returning = function(returning) {
  this._single.returning = returning;
  return this;
};

// Delete
// ------

// Executes a delete statement on the query;
QueryBuilder.prototype.del =
QueryBuilder.prototype.delete = function(ret) {
  this._method = 'del';
  if (!_.isEmpty(ret)) this.returning(ret);
  return this;
};

// Truncates a table, ends the query chain.
QueryBuilder.prototype.truncate = function() {
  this._method = 'truncate';
  return this;
};

// Retrieves columns for the table specified by `knex(tableName)`
QueryBuilder.prototype.columnInfo = function(column) {
  this._method = 'columnInfo';
  this._single.columnInfo = column;
  return this;
};

// Set a lock for update constraint.
QueryBuilder.prototype.forUpdate = function() {
  this._single.lock = 'forUpdate';
  return this;
};

// Set a lock for share constraint.
QueryBuilder.prototype.forShare = function() {
  this._single.lock = 'forShare';
  return this;
};

// ----------------------------------------------------------------------

// Helper for the incrementing/decrementing queries.
QueryBuilder.prototype._counter = function(column, amount, symbol) {
  var amt = parseInt(amount, 10);
  if (isNaN(amt)) amt = 1;
  this._method = 'counter';
  this._single.counter = {
    column: column,
    amount: amt,
    symbol: (symbol || '+')
  };
  return this;
};

// Helper to get or set the "boolFlag" value.
QueryBuilder.prototype._bool = function(val) {
  if (arguments.length === 1) {
    this._boolFlag = val;
    return this;
  }
  var ret = this._boolFlag;
  this._boolFlag = 'and';
  return ret;
};

// Helper to get or set the "notFlag" value.
QueryBuilder.prototype._not = function(val) {
  if (arguments.length === 1) {
    this._notFlag = val;
    return this;
  }
  var ret = this._notFlag;
  this._notFlag = false;
  return ret;
};

// Helper to get or set the "joinFlag" value.
QueryBuilder.prototype._joinType = function (val) {
  if (arguments.length === 1) {
    this._joinFlag = val;
    return this;
  }
  var ret = this._joinFlag || 'inner';
  this._joinFlag = 'inner';
  return ret;
};

// Helper for compiling any aggregate queries.
QueryBuilder.prototype._aggregate = function(method, column) {
  this._statements.push({
    grouping: 'columns',
    type: 'aggregate',
    method: method,
    value: column
  });
  return this;
};

Object.defineProperty(QueryBuilder.prototype, 'or', {
  get: function () {
    return this._bool('or');
  }
});


Object.defineProperty(QueryBuilder.prototype, 'not', {
  get: function () {
    return this._not(true);
  }
});

// Attach all of the top level promise methods that should be chainable.
require('../interface')(QueryBuilder);

module.exports = QueryBuilder;
