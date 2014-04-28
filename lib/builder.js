// Builder
// -------
var _          = require('lodash');

var Raw        = require('./raw').Raw;
var Common     = require('./common').Common;
var Helpers    = require('./helpers').Helpers;
var JoinClause = require('./builder/joinclause').JoinClause;

var concat = function(dst, src) {
  for (var i = 0, len = src.length; i < len; i++) {
    dst.push(src[i]);
  }
};

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
var operators = ['=', '<', '>', '<=', '>=', '<>', '!=', 'like', 'not like',
  'between', 'ilike', '&', '&&', '|', '^', '#', '<<', '>>', '@>', '<@', '||'];

var nullOperators = ['is', 'is not'];

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
      concat(this.columns, _.isArray(columns) ? columns : arguments);
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

    operator = operator.toLowerCase();

    if (!_.contains(operators, operator)) {

      if (_.contains(nullOperators, operator)) {

        if (value === null || _.isString(value) && value.toLowerCase() === 'null') {

          return operator === 'is' ? this.whereNull(column, bool) : this.whereNull(column, bool, 'NotNull');

        }

        throw new Error('Invalid where in clause');
      }

      throw new Error('Invalid operator: ' + operator);
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
    concat(this.bindings, bindings);
    return this;
  },

  // Adds a raw `or where` clause to the query.
  orWhereRaw: function(sql, bindings) {
    return this.whereRaw(sql, bindings, 'or');
  },

  // Adds a raw `and where` clause to the query
  andWhereRaw: function(sql, bindings) {
    return this.whereRaw(sql, bindings, 'and');
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
    concat(this.bindings, query.bindings);
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
    if (_.isArray(column)) values = _.flatten(values, true);
    concat(this.bindings, values);
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
    concat(this.bindings, values);
    return this;
  },

  // Adds a `or where between` clause to the query.
  orWhereBetween: function(column, values) {
    this.wheres.push({column: column, type: 'Between', bool: 'or'});
    concat(this.bindings, values);
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
    concat(this.bindings, bindings);
    return this;
  },

  // Adds a raw `or having` clause to the query.
  orHavingRaw: function(sql, bindings) {
    return this.havingRaw(sql, bindings, 'or');
  },

  offset: function(value) {
    if (arguments.length === 0) return this.flags.offset;
    this.flags.offset = value;
    return this;
  },

  limit: function(value) {
    if (arguments.length === 0) return this.flags.limit;
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

  // Retrieve the avg of the values of a given column.
  avg: function(column) {
    return this._aggregate('avg', column);
  },

  // Increments a column's value by the specified amount.
  increment: function(column, amount) {
    return this._counter(column, amount, false);
  },

  // Decrements a column's value by the specified amount.
  decrement: function(column, amount) {
    return this._counter(column, amount, true);
  },

  // Sets the values for a `select` query.
  select: function(columns) {
    if (columns) {
      concat(this.columns, _.isArray(columns) ? columns : arguments);
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
  "delete": function(returning) {
    return this.del(returning);
  },

  // Executes a delete statement on the query;
  del: function(returning) {
    if (returning) this.returning(returning);
    return this._setType('delete');
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
    concat(this.bindings, query.bindings);
    return this;
  },

  // Helper for compiling any advanced `where` queries.
  _whereNested: function(callback, bool) {
    var query = new Builder(this.knex);
    callback.call(query, query);
    this.wheres.push({type: 'Nested', query: query, bool: bool});
    concat(this.bindings, query.bindings);
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
    concat(this.bindings, query.bindings);
    return this;
  },

  // Helper for compiling any aggregate queries.
  _aggregate: function(type, columns) {
    this.aggregates.push({type: type, columns: columns});
    this.type && this.type === 'select' || this._setType('select');
    return this;
  },

  // Helper for the incrementing/decrementing queries.
  _counter: function(column, amount, negative) {
    var symbol = '+';
    var defaultAmount = '1';

    if (_.isNumber(amount)) {
      if (!isFinite(amount)) {
        amount = defaultAmount;
      }
      else if (amount < 0) {
        negative = !negative;
        amount = -amount;
      }
    }
    else if (_.isString(amount)) {
      amount = amount.trim();

      if (!amount) {
        amount = defaultAmount;
      }
      else {
        if (amount.charAt(0) === '-') {
          negative = !negative;
          amount = amount.substr(1);
        }

        if (!amount || !/^\d*\.?\d*$/.test(amount)) {
          throw new Error('Invalid amount string: ' + amount + '.');
        }
      }
    }
    else if (amount == null) {
      // Null or undefined.
      amount = defaultAmount;
    }
    else {
      throw new Error('Invalid amount type: ' + (typeof amount) + '.');
    }

    if (negative) {
      symbol = '-';
    }

    var toUpdate = {};
    toUpdate[column] = this.knex.raw(this.grammar.wrap(column) + ' ' + symbol + ' ' + amount);
    return this.update(toUpdate);
  },

  // Helper for compiling any `union` queries.
  _union: function(callback, bool) {
    var query = new Builder(this.knex);
    callback.call(query, query);
    this.unions.push({query: query, all: bool});
    concat(this.bindings, query.bindings);
  },

  // Helper to pull a single column from each result and return array
  pluck: function (column) {
    if (!column) {
      throw new Error('You must specify a column to pluck.');
    }
    return this.column(column).then(function (results) {
      return _.pluck(results, column);
    });
  }
});

exports.Builder = Builder;
