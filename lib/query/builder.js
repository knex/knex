
// Builder
// -------
'use strict';

var _ = require('lodash');
var assert = require('assert');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

var Raw = require('../raw');
var helpers = require('../helpers');
var JoinClause = require('./joinclause');
var _clone = require('lodash/lang/clone');
var isUndefined = require('lodash/lang/isUndefined');
var assign = require('lodash/object/assign');

// Typically called from `knex.builder`,
// start a new query building chain.
function Builder(client) {
  this.client = client;
  this.and = this;
  this._single = {};
  this._statements = [];
  this._method = 'select';
  this._debug = client.config && client.config.debug;

  // Internal flags used in the builder.
  this._joinFlag = 'inner';
  this._boolFlag = 'and';
  this._notFlag = false;
}
inherits(Builder, EventEmitter);

assign(Builder.prototype, {

  toString: function toString() {
    return this.toQuery();
  },

  // Convert the current query "toSQL"
  toSQL: function toSQL(method) {
    return this.client.queryCompiler(this).toSQL(method || this._method);
  },

  // Create a shallow clone of the current query builder.
  clone: function clone() {
    var cloned = new this.constructor(this.client);
    cloned._method = this._method;
    cloned._single = _clone(this._single);
    cloned._statements = _clone(this._statements);
    cloned._debug = this._debug;

    // `_option` is assigned by the `Interface` mixin.
    if (!isUndefined(this._options)) {
      cloned._options = _clone(this._options);
    }

    return cloned;
  },

  // Select
  // ------

  // Adds a column or columns to the list of "columns"
  // being selected on the query.
  columns: function columns(column) {
    if (!column) return this;
    this._statements.push({
      grouping: 'columns',
      value: helpers.normalizeArr.apply(null, arguments)
    });
    return this;
  },

  // Allow for a sub-select to be explicitly aliased as a column,
  // without needing to compile the query in a where.
  as: function as(column) {
    this._single.as = column;
    return this;
  },

  // Prepends the `schemaName` on `tableName` defined by `.table` and `.join`.
  withSchema: function withSchema(schemaName) {
    this._single.schema = schemaName;
    return this;
  },

  // Sets the `tableName` on the query.
  // Alias to "from" for select and "into" for insert statements
  // e.g. builder.insert({a: value}).into('tableName')
  table: function table(tableName) {
    this._single.table = tableName;
    return this;
  },

  // Adds a `distinct` clause to the query.
  distinct: function distinct() {
    this._statements.push({
      grouping: 'columns',
      value: helpers.normalizeArr.apply(null, arguments),
      distinct: true
    });
    return this;
  },

  // Adds a join clause to the query, allowing for advanced joins
  // with an anonymous function as the second argument.
  // function(table, first, operator, second)
  join: function join(table, first) {
    var join;
    var schema = this._single.schema;
    var joinType = this._joinType();
    if (typeof first === 'function') {
      join = new JoinClause(table, joinType, schema);
      first.call(join, join);
    } else if (joinType === 'raw') {
      join = new JoinClause(this.client.raw(table, first), 'raw');
    } else {
      join = new JoinClause(table, joinType, schema);
      if (arguments.length > 1) {
        join.on.apply(join, _.toArray(arguments).slice(1));
      }
    }
    this._statements.push(join);
    return this;
  },

  // JOIN blocks:
  innerJoin: function innerJoin() {
    return this._joinType('inner').join.apply(this, arguments);
  },
  leftJoin: function leftJoin() {
    return this._joinType('left').join.apply(this, arguments);
  },
  leftOuterJoin: function leftOuterJoin() {
    return this._joinType('left outer').join.apply(this, arguments);
  },
  rightJoin: function rightJoin() {
    return this._joinType('right').join.apply(this, arguments);
  },
  rightOuterJoin: function rightOuterJoin() {
    return this._joinType('right outer').join.apply(this, arguments);
  },
  outerJoin: function outerJoin() {
    return this._joinType('outer').join.apply(this, arguments);
  },
  fullOuterJoin: function fullOuterJoin() {
    return this._joinType('full outer').join.apply(this, arguments);
  },
  crossJoin: function crossJoin() {
    return this._joinType('cross').join.apply(this, arguments);
  },
  joinRaw: function joinRaw() {
    return this._joinType('raw').join.apply(this, arguments);
  },

  // The where function can be used in several ways:
  // The most basic is `where(key, value)`, which expands to
  // where key = value.
  where: function where(column, operator, value) {

    // Support "where true || where false"
    if (column === false || column === true) {
      return this.where(1, '=', column ? 1 : 0);
    }

    // Check if the column is a function, in which case it's
    // a where statement wrapped in parens.
    if (typeof column === 'function') {
      return this.whereWrapped(column);
    }

    // Allow a raw statement to be passed along to the query.
    if (column instanceof Raw && arguments.length === 1) return this.whereRaw(column);

    // Allows `where({id: 2})` syntax.
    if (_.isObject(column) && !(column instanceof Raw)) return this._objectWhere(column);

    // Enable the where('key', value) syntax, only when there
    // are explicitly two arguments passed, so it's not possible to
    // do where('key', '!=') and have that turn into where key != null
    if (arguments.length === 2) {
      value = operator;
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
        return this._not(checkOperator === 'not in').whereIn(arguments[0], arguments[2]);
      }
      if (checkOperator === 'between' || checkOperator === 'not between') {
        return this._not(checkOperator === 'not between').whereBetween(arguments[0], arguments[2]);
      }
    }

    // If the value is still null, check whether they're meaning
    // where value is null
    if (value === null) {

      // Check for .where(key, 'is', null) or .where(key, 'is not', 'null');
      if (checkOperator === 'is' || checkOperator === 'is not') {
        return this._not(checkOperator === 'is not').whereNull(column);
      }
    }

    // Push onto the where statement stack.
    this._statements.push({
      grouping: 'where',
      type: 'whereBasic',
      column: column,
      operator: operator,
      value: value,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },
  // Adds an `or where` clause to the query.
  orWhere: function orWhere() {
    return this._bool('or').where.apply(this, arguments);
  },

  // Adds an `not where` clause to the query.
  whereNot: function whereNot() {
    return this._not(true).where.apply(this, arguments);
  },

  // Adds an `or not where` clause to the query.
  orWhereNot: function orWhereNot() {
    return this._bool('or').whereNot.apply(this, arguments);
  },

  // Processes an object literal provided in a "where" clause.
  _objectWhere: function _objectWhere(obj) {
    var boolVal = this._bool();
    var notVal = this._not() ? 'Not' : '';
    for (var key in obj) {
      this[boolVal + 'Where' + notVal](key, obj[key]);
    }
    return this;
  },

  // Adds a raw `where` clause to the query.
  whereRaw: function whereRaw(sql, bindings) {
    var raw = sql instanceof Raw ? sql : this.client.raw(sql, bindings);
    this._statements.push({
      grouping: 'where',
      type: 'whereRaw',
      value: raw,
      bool: this._bool()
    });
    return this;
  },

  orWhereRaw: function orWhereRaw(sql, bindings) {
    return this._bool('or').whereRaw(sql, bindings);
  },

  // Helper for compiling any advanced `where` queries.
  whereWrapped: function whereWrapped(callback) {
    this._statements.push({
      grouping: 'where',
      type: 'whereWrapped',
      value: callback,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },

  // Helper for compiling any advanced `having` queries.
  havingWrapped: function havingWrapped(callback) {
    this._statements.push({
      grouping: 'having',
      type: 'whereWrapped',
      value: callback,
      bool: this._bool()
    });
    return this;
  },

  // Adds a `where exists` clause to the query.
  whereExists: function whereExists(callback) {
    this._statements.push({
      grouping: 'where',
      type: 'whereExists',
      value: callback,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },

  // Adds an `or where exists` clause to the query.
  orWhereExists: function orWhereExists(callback) {
    return this._bool('or').whereExists(callback);
  },

  // Adds a `where not exists` clause to the query.
  whereNotExists: function whereNotExists(callback) {
    return this._not(true).whereExists(callback);
  },

  // Adds a `or where not exists` clause to the query.
  orWhereNotExists: function orWhereNotExists(callback) {
    return this._bool('or').whereNotExists(callback);
  },

  // Adds a `where in` clause to the query.
  whereIn: function whereIn(column, values) {
    if (Array.isArray(values) && _.isEmpty(values)) return this.where(this._not());
    this._statements.push({
      grouping: 'where',
      type: 'whereIn',
      column: column,
      value: values,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },

  // Adds a `or where in` clause to the query.
  orWhereIn: function orWhereIn(column, values) {
    return this._bool('or').whereIn(column, values);
  },

  // Adds a `where not in` clause to the query.
  whereNotIn: function whereNotIn(column, values) {
    return this._not(true).whereIn(column, values);
  },

  // Adds a `or where not in` clause to the query.
  orWhereNotIn: function orWhereNotIn(column, values) {
    return this._bool('or')._not(true).whereIn(column, values);
  },

  // Adds a `where null` clause to the query.
  whereNull: function whereNull(column) {
    this._statements.push({
      grouping: 'where',
      type: 'whereNull',
      column: column,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },

  // Adds a `or where null` clause to the query.
  orWhereNull: function orWhereNull(column) {
    return this._bool('or').whereNull(column);
  },

  // Adds a `where not null` clause to the query.
  whereNotNull: function whereNotNull(column) {
    return this._not(true).whereNull(column);
  },

  // Adds a `or where not null` clause to the query.
  orWhereNotNull: function orWhereNotNull(column) {
    return this._bool('or').whereNotNull(column);
  },

  // Adds a `where between` clause to the query.
  whereBetween: function whereBetween(column, values) {
    assert(Array.isArray(values), 'The second argument to whereBetween must be an array.');
    assert(values.length === 2, 'You must specify 2 values for the whereBetween clause');
    this._statements.push({
      grouping: 'where',
      type: 'whereBetween',
      column: column,
      value: values,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },

  // Adds a `where not between` clause to the query.
  whereNotBetween: function whereNotBetween(column, values) {
    return this._not(true).whereBetween(column, values);
  },

  // Adds a `or where between` clause to the query.
  orWhereBetween: function orWhereBetween(column, values) {
    return this._bool('or').whereBetween(column, values);
  },

  // Adds a `or where not between` clause to the query.
  orWhereNotBetween: function orWhereNotBetween(column, values) {
    return this._bool('or').whereNotBetween(column, values);
  },

  // Adds a `group by` clause to the query.
  groupBy: function groupBy(item) {
    if (item instanceof Raw) {
      return this.groupByRaw.apply(this, arguments);
    }
    this._statements.push({
      grouping: 'group',
      type: 'groupByBasic',
      value: helpers.normalizeArr.apply(null, arguments)
    });
    return this;
  },

  // Adds a raw `group by` clause to the query.
  groupByRaw: function groupByRaw(sql, bindings) {
    var raw = sql instanceof Raw ? sql : this.client.raw(sql, bindings);
    this._statements.push({
      grouping: 'group',
      type: 'groupByRaw',
      value: raw
    });
    return this;
  },

  // Adds a `order by` clause to the query.
  orderBy: function orderBy(column, direction) {
    this._statements.push({
      grouping: 'order',
      type: 'orderByBasic',
      value: column,
      direction: direction
    });
    return this;
  },

  // Add a raw `order by` clause to the query.
  orderByRaw: function orderByRaw(sql, bindings) {
    var raw = sql instanceof Raw ? sql : this.client.raw(sql, bindings);
    this._statements.push({
      grouping: 'order',
      type: 'orderByRaw',
      value: raw
    });
    return this;
  },

  // Add a union statement to the query.
  union: function union(callbacks, wrap) {
    if (arguments.length === 1 || arguments.length === 2 && _.isBoolean(wrap)) {
      if (!Array.isArray(callbacks)) {
        callbacks = [callbacks];
      }
      for (var i = 0, l = callbacks.length; i < l; i++) {
        this._statements.push({
          grouping: 'union',
          clause: 'union',
          value: callbacks[i],
          wrap: wrap || false
        });
      }
    } else {
      callbacks = _.toArray(arguments).slice(0, arguments.length - 1);
      wrap = arguments[arguments.length - 1];
      if (!_.isBoolean(wrap)) {
        callbacks.push(wrap);
        wrap = false;
      }
      this.union(callbacks, wrap);
    }
    return this;
  },

  // Adds a union all statement to the query.
  unionAll: function unionAll(callback, wrap) {
    this._statements.push({
      grouping: 'union',
      clause: 'union all',
      value: callback,
      wrap: wrap || false
    });
    return this;
  },

  // Adds a `having` clause to the query.
  having: function having(column, operator, value) {
    if (column instanceof Raw && arguments.length === 1) {
      return this._havingRaw(column);
    }

    // Check if the column is a function, in which case it's
    // a having statement wrapped in parens.
    if (typeof column === 'function') {
      return this.havingWrapped(column);
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
  },
  // Adds an `or having` clause to the query.
  orHaving: function orHaving() {
    return this._bool('or').having.apply(this, arguments);
  },
  havingRaw: function havingRaw(sql, bindings) {
    return this._havingRaw(sql, bindings);
  },
  orHavingRaw: function orHavingRaw(sql, bindings) {
    return this._bool('or').havingRaw(sql, bindings);
  },
  // Adds a raw `having` clause to the query.
  _havingRaw: function _havingRaw(sql, bindings) {
    var raw = sql instanceof Raw ? sql : this.client.raw(sql, bindings);
    this._statements.push({
      grouping: 'having',
      type: 'havingRaw',
      value: raw,
      bool: this._bool()
    });
    return this;
  },

  // Only allow a single "offset" to be set for the current query.
  offset: function offset(value) {
    this._single.offset = value;
    return this;
  },

  // Only allow a single "limit" to be set for the current query.
  limit: function limit(value) {
    var val = parseInt(value, 10);
    if (isNaN(val)) {
      helpers.warn('A valid integer must be provided to limit');
    } else {
      this._single.limit = val;
    }
    return this;
  },

  // Retrieve the "count" result of the query.
  count: function count(column) {
    return this._aggregate('count', column || '*');
  },

  // Retrieve the minimum value of a given column.
  min: function min(column) {
    return this._aggregate('min', column);
  },

  // Retrieve the maximum value of a given column.
  max: function max(column) {
    return this._aggregate('max', column);
  },

  // Retrieve the sum of the values of a given column.
  sum: function sum(column) {
    return this._aggregate('sum', column);
  },

  // Retrieve the average of the values of a given column.
  avg: function avg(column) {
    return this._aggregate('avg', column);
  },

  // Retrieve the "count" of the distinct results of the query.
  countDistinct: function countDistinct(column) {
    return this._aggregate('count', column || '*', true);
  },

  // Retrieve the sum of the distinct values of a given column.
  sumDistinct: function sumDistinct(column) {
    return this._aggregate('sum', column, true);
  },

  // Retrieve the vg of the distinct results of the query.
  avgDistinct: function avgDistinct(column) {
    return this._aggregate('avg', column, true);
  },

  // Increments a column's value by the specified amount.
  increment: function increment(column, amount) {
    return this._counter(column, amount);
  },

  // Decrements a column's value by the specified amount.
  decrement: function decrement(column, amount) {
    return this._counter(column, amount, '-');
  },

  // Sets the values for a `select` query, informing that only the first
  // row should be returned (limit 1).
  first: function first() {
    var i,
        args = new Array(arguments.length);
    for (i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    this.select.apply(this, args);
    this._method = 'first';
    this.limit(1);
    return this;
  },

  // Pluck a column from a query.
  pluck: function pluck(column) {
    this._method = 'pluck';
    this._single.pluck = column;
    this._statements.push({
      grouping: 'columns',
      type: 'pluck',
      value: column
    });
    return this;
  },

  // Insert & Update
  // ------

  // Sets the values for an `insert` query.
  insert: function insert(values, returning) {
    this._method = 'insert';
    if (!_.isEmpty(returning)) this.returning(returning);
    this._single.insert = values;
    return this;
  },

  // Sets the values for an `update`, allowing for both
  // `.update(key, value, [returning])` and `.update(obj, [returning])` syntaxes.
  update: function update(values, returning) {
    var ret,
        obj = this._single.update || {};
    this._method = 'update';
    if (_.isString(values)) {
      obj[values] = returning;
      if (arguments.length > 2) {
        ret = arguments[2];
      }
    } else {
      var i = -1,
          keys = Object.keys(values);
      if (this._single.update) {
        helpers.warn('Update called multiple times with objects.');
      }
      while (++i < keys.length) {
        obj[keys[i]] = values[keys[i]];
      }
      ret = arguments[1];
    }
    if (!_.isEmpty(ret)) this.returning(ret);
    this._single.update = obj;
    return this;
  },

  // Sets the returning value for the query.
  returning: function returning(_returning) {
    this._single.returning = _returning;
    return this;
  },

  // Delete
  // ------

  // Executes a delete statement on the query;
  'delete': function _delete(ret) {
    this._method = 'del';
    if (!_.isEmpty(ret)) this.returning(ret);
    return this;
  },

  // Truncates a table, ends the query chain.
  truncate: function truncate(tableName) {
    this._method = 'truncate';
    if (tableName) {
      this._single.table = tableName;
    }
    return this;
  },

  // Retrieves columns for the table specified by `knex(tableName)`
  columnInfo: function columnInfo(column) {
    this._method = 'columnInfo';
    this._single.columnInfo = column;
    return this;
  },

  // Set a lock for update constraint.
  forUpdate: function forUpdate() {
    this._single.lock = 'forUpdate';
    return this;
  },

  // Set a lock for share constraint.
  forShare: function forShare() {
    this._single.lock = 'forShare';
    return this;
  },

  // Takes a JS object of methods to call and calls them
  fromJS: function fromJS(obj) {
    _.each(obj, function (val, key) {
      if (typeof this[key] !== 'function') {
        helpers.warn('Knex Error: unknown key ' + key);
      }
      if (Array.isArray(val)) {
        this[key].apply(this, val);
      } else {
        this[key](val);
      }
    }, this);
    return this;
  },

  // Passes query to provided callback function, useful for e.g. composing
  // domain-specific helpers
  modify: function modify(callback) {
    callback.apply(this, [this].concat(_.rest(arguments)));
    return this;
  },

  // ----------------------------------------------------------------------

  // Helper for the incrementing/decrementing queries.
  _counter: function _counter(column, amount, symbol) {
    var amt = parseInt(amount, 10);
    if (isNaN(amt)) amt = 1;
    this._method = 'counter';
    this._single.counter = {
      column: column,
      amount: amt,
      symbol: symbol || '+'
    };
    return this;
  },

  // Helper to get or set the "boolFlag" value.
  _bool: function _bool(val) {
    if (arguments.length === 1) {
      this._boolFlag = val;
      return this;
    }
    var ret = this._boolFlag;
    this._boolFlag = 'and';
    return ret;
  },

  // Helper to get or set the "notFlag" value.
  _not: function _not(val) {
    if (arguments.length === 1) {
      this._notFlag = val;
      return this;
    }
    var ret = this._notFlag;
    this._notFlag = false;
    return ret;
  },

  // Helper to get or set the "joinFlag" value.
  _joinType: function _joinType(val) {
    if (arguments.length === 1) {
      this._joinFlag = val;
      return this;
    }
    var ret = this._joinFlag || 'inner';
    this._joinFlag = 'inner';
    return ret;
  },

  // Helper for compiling any aggregate queries.
  _aggregate: function _aggregate(method, column, aggregateDistinct) {
    this._statements.push({
      grouping: 'columns',
      type: 'aggregate',
      method: method,
      value: column,
      aggregateDistinct: aggregateDistinct || false
    });
    return this;
  }

});

Object.defineProperty(Builder.prototype, 'or', {
  get: function get() {
    return this._bool('or');
  }
});

Object.defineProperty(Builder.prototype, 'not', {
  get: function get() {
    return this._not(true);
  }
});

Builder.prototype.select = Builder.prototype.columns;
Builder.prototype.column = Builder.prototype.columns;
Builder.prototype.andWhereNot = Builder.prototype.whereNot;
Builder.prototype.andWhere = Builder.prototype.where;
Builder.prototype.andWhereRaw = Builder.prototype.whereRaw;
Builder.prototype.andHaving = Builder.prototype.having;
Builder.prototype.from = Builder.prototype.table;
Builder.prototype.into = Builder.prototype.table;
Builder.prototype.del = Builder.prototype['delete'];

// Attach all of the top level promise methods that should be chainable.
require('../interface')(Builder);

module.exports = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9xdWVyeS9idWlsZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBR0EsSUFBSSxDQUFDLEdBQWMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQ3BDLElBQUksTUFBTSxHQUFTLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUNwQyxJQUFJLFFBQVEsR0FBTyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUE7QUFDdEMsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQTs7QUFFakQsSUFBSSxHQUFHLEdBQVksT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQ3BDLElBQUksT0FBTyxHQUFRLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQTtBQUN4QyxJQUFJLFVBQVUsR0FBSyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUE7QUFDMUMsSUFBSSxNQUFLLEdBQVUsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDaEQsSUFBSSxXQUFXLEdBQUksT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7QUFDdEQsSUFBSSxNQUFNLEdBQVMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7Ozs7QUFJbkQsU0FBUyxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQ3ZCLE1BQUksQ0FBQyxNQUFNLEdBQVEsTUFBTSxDQUFBO0FBQ3pCLE1BQUksQ0FBQyxHQUFHLEdBQVcsSUFBSSxDQUFDO0FBQ3hCLE1BQUksQ0FBQyxPQUFPLEdBQU8sRUFBRSxDQUFDO0FBQ3RCLE1BQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ3RCLE1BQUksQ0FBQyxPQUFPLEdBQU0sUUFBUSxDQUFBO0FBQzFCLE1BQUksQ0FBQyxNQUFNLEdBQU8sTUFBTSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQzs7O0FBR3ZELE1BQUksQ0FBQyxTQUFTLEdBQUksT0FBTyxDQUFDO0FBQzFCLE1BQUksQ0FB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T0FBTyxDQUFBO0FBQ3pELE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFRLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFBO0FBQ3pELE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFBO0FBQzFELE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFNLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFBO0FBQ3ZELE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFBO0FBQzFELE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFLLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFBO0FBQ3hELE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFVLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFBO0FBQ3ZELE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFVLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFBO0FBQ3ZELE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFXLE9BQU8sQ0FBQyxTQUFTLFVBQU8sQ0FBQTs7O0FBR3hELE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFakMsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMiLCJmaWxlIjoiYnVpbGRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8gQnVpbGRlclxuLy8gLS0tLS0tLVxudmFyIF8gICAgICAgICAgICA9IHJlcXVpcmUoJ2xvZGFzaCcpXG52YXIgYXNzZXJ0ICAgICAgID0gcmVxdWlyZSgnYXNzZXJ0JylcbnZhciBpbmhlcml0cyAgICAgPSByZXF1aXJlKCdpbmhlcml0cycpXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyXG5cbnZhciBSYXcgICAgICAgICAgPSByZXF1aXJlKCcuLi9yYXcnKVxudmFyIGhlbHBlcnMgICAgICA9IHJlcXVpcmUoJy4uL2hlbHBlcnMnKVxudmFyIEpvaW5DbGF1c2UgICA9IHJlcXVpcmUoJy4vam9pbmNsYXVzZScpXG52YXIgY2xvbmUgICAgICAgID0gcmVxdWlyZSgnbG9kYXNoL2xhbmcvY2xvbmUnKTtcbnZhciBpc1VuZGVmaW5lZCAgPSByZXF1aXJlKCdsb2Rhc2gvbGFuZy9pc1VuZGVmaW5lZCcpO1xudmFyIGFzc2lnbiAgICAgICA9IHJlcXVpcmUoJ2xvZGFzaC9vYmplY3QvYXNzaWduJyk7XG5cbi8vIFR5cGljYWxseSBjYWxsZWQgZnJvbSBga25leC5idWlsZGVyYCxcbi8vIHN0YXJ0IGEgbmV3IHF1ZXJ5IGJ1aWxkaW5nIGNoYWluLlxuZnVuY3Rpb24gQnVpbGRlcihjbGllbnQpIHtcbiAgdGhpcy5jbGllbnQgICAgICA9IGNsaWVudFxuICB0aGlzLmFuZCAgICAgICAgID0gdGhpcztcbiAgdGhpcy5fc2luZ2xlICAgICA9IHt9O1xuICB0aGlzLl9zdGF0ZW1lbnRzID0gW107XG4gIHRoaXMuX21ldGhvZCAgICA9ICdzZWxlY3QnXG4gIHRoaXMuX2RlYnVnICAgICA9IGNsaWVudC5jb25maWcgJiYgY2xpZW50LmNvbmZpZy5kZWJ1ZztcblxuICAvLyBJbnRlcm5hbCBmbGFncyB1c2VkIGluIHRoZSBidWlsZGVyLlxuICB0aGlzLl9qb2luRmxhZyAgPSAnaW5uZXInO1xuICB0aGlzLl9ib29sRmxhZyAgPSAnYW5kJztcbiAgdGhpcy5fbm90RmxhZyAgID0gZmFsc2U7XG59XG5pbmhlcml0cyhCdWlsZGVyLCBFdmVudEVtaXR0ZXIpO1xuXG5hc3NpZ24oQnVpbGRlci5wcm90b3R5cGUsIHtcblxuICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMudG9RdWVyeSgpO1xuICB9LFxuXG4gIC8vIENvbnZlcnQgdGhlIGN1cnJlbnQgcXVlcnkgXCJ0b1NRTFwiXG4gIHRvU1FMOiBmdW5jdGlvbihtZXRob2QpIHtcbiAgICByZXR1cm4gdGhpcy5jbGllbnQucXVlcnlDb21waWxlcih0aGlzKS50b1NRTChtZXRob2QgfHwgdGhpcy5fbWV0aG9kKTtcbiAgfSxcblxuICAvLyBDcmVhdGUgYSBzaGFsbG93IGNsb25lIG9mIHRoZSBjdXJyZW50IHF1ZXJ5IGJ1aWxkZXIuXG4gIGNsb25lKCkge1xuICAgIGNvbnN0IGNsb25lZCAgICAgICAgPSBuZXcgdGhpcy5jb25zdHJ1Y3Rvcih0aGlzLmNsaWVudCk7XG4gICAgY2xvbmVkLl9tZXRob2QgICAgICA9IHRoaXMuX21ldGhvZDtcbiAgICBjbG9uZWQuX3NpbmdsZSAgICAgID0gY2xvbmUodGhpcy5fc2luZ2xlKTtcbiAgICBjbG9uZWQuX3N0YXRlbWVudHMgID0gY2xvbmUodGhpcy5fc3RhdGVtZW50cyk7XG4gICAgY2xvbmVkLl9kZWJ1ZyAgICAgICA9IHRoaXMuX2RlYnVnO1xuXG4gICAgLy8gYF9vcHRpb25gIGlzIGFzc2lnbmVkIGJ5IHRoZSBgSW50ZXJmYWNlYCBtaXhpbi5cbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX29wdGlvbnMpKSB7XG4gICAgICBjbG9uZWQuX29wdGlvbnMgPSBjbG9uZSh0aGlzLl9vcHRpb25zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmVkO1xuICB9LFxuXG4gIC8vIFNlbGVjdFxuICAvLyAtLS0tLS1cblxuICAvLyBBZGRzIGEgY29sdW1uIG9yIGNvbHVtbnMgdG8gdGhlIGxpc3Qgb2YgXCJjb2x1bW5zXCJcbiAgLy8gYmVpbmcgc2VsZWN0ZWQgb24gdGhlIHF1ZXJ5LlxuICBjb2x1bW5zOiBmdW5jdGlvbihjb2x1bW4pIHtcbiAgICBpZiAoIWNvbHVtbikgcmV0dXJuIHRoaXM7XG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnY29sdW1ucycsXG4gICAgICB2YWx1ZTogaGVscGVycy5ub3JtYWxpemVBcnIuYXBwbHkobnVsbCwgYXJndW1lbnRzKVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIEFsbG93IGZvciBhIHN1Yi1zZWxlY3QgdG8gYmUgZXhwbGljaXRseSBhbGlhc2VkIGFzIGEgY29sdW1uLFxuICAvLyB3aXRob3V0IG5lZWRpbmcgdG8gY29tcGlsZSB0aGUgcXVlcnkgaW4gYSB3aGVyZS5cbiAgYXM6IGZ1bmN0aW9uKGNvbHVtbikge1xuICAgIHRoaXMuX3NpbmdsZS5hcyA9IGNvbHVtbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBQcmVwZW5kcyB0aGUgYHNjaGVtYU5hbWVgIG9uIGB0YWJsZU5hbWVgIGRlZmluZWQgYnkgYC50YWJsZWAgYW5kIGAuam9pbmAuXG4gIHdpdGhTY2hlbWE6IGZ1bmN0aW9uKHNjaGVtYU5hbWUpIHtcbiAgICB0aGlzLl9zaW5nbGUuc2NoZW1hID0gc2NoZW1hTmFtZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBTZXRzIHRoZSBgdGFibGVOYW1lYCBvbiB0aGUgcXVlcnkuXG4gIC8vIEFsaWFzIHRvIFwiZnJvbVwiIGZvciBzZWxlY3QgYW5kIFwiaW50b1wiIGZvciBpbnNlcnQgc3RhdGVtZW50c1xuICAvLyBlLmcuIGJ1aWxkZXIuaW5zZXJ0KHthOiB2YWx1ZX0pLmludG8oJ3RhYmxlTmFtZScpXG4gIHRhYmxlOiBmdW5jdGlvbih0YWJsZU5hbWUpIHtcbiAgICB0aGlzLl9zaW5nbGUudGFibGUgPSB0YWJsZU5hbWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIGBkaXN0aW5jdGAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgZGlzdGluY3Q6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgICBncm91cGluZzogJ2NvbHVtbnMnLFxuICAgICAgdmFsdWU6IGhlbHBlcnMubm9ybWFsaXplQXJyLmFwcGx5KG51bGwsIGFyZ3VtZW50cyksXG4gICAgICBkaXN0aW5jdDogdHJ1ZVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBqb2luIGNsYXVzZSB0byB0aGUgcXVlcnksIGFsbG93aW5nIGZvciBhZHZhbmNlZCBqb2luc1xuICAvLyB3aXRoIGFuIGFub255bW91cyBmdW5jdGlvbiBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuICAvLyBmdW5jdGlvbih0YWJsZSwgZmlyc3QsIG9wZXJhdG9yLCBzZWNvbmQpXG4gIGpvaW46IGZ1bmN0aW9uKHRhYmxlLCBmaXJzdCkge1xuICAgIHZhciBqb2luO1xuICAgIHZhciBzY2hlbWEgPSB0aGlzLl9zaW5nbGUuc2NoZW1hO1xuICAgIHZhciBqb2luVHlwZSA9IHRoaXMuX2pvaW5UeXBlKCk7XG4gICAgaWYgKHR5cGVvZiBmaXJzdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgam9pbiA9IG5ldyBKb2luQ2xhdXNlKHRhYmxlLCBqb2luVHlwZSwgc2NoZW1hKTtcbiAgICAgIGZpcnN0LmNhbGwoam9pbiwgam9pbik7XG4gICAgfSBlbHNlIGlmIChqb2luVHlwZSA9PT0gJ3JhdycpIHtcbiAgICAgIGpvaW4gPSBuZXcgSm9pbkNsYXVzZSh0aGlzLmNsaWVudC5yYXcodGFibGUsIGZpcnN0KSwgJ3JhdycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBqb2luID0gbmV3IEpvaW5DbGF1c2UodGFibGUsIGpvaW5UeXBlLCBzY2hlbWEpO1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGpvaW4ub24uYXBwbHkoam9pbiwgXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goam9pbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gSk9JTiBibG9ja3M6XG4gIGlubmVySm9pbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2pvaW5UeXBlKCdpbm5lcicpLmpvaW4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcbiAgbGVmdEpvaW46IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9qb2luVHlwZSgnbGVmdCcpLmpvaW4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcbiAgbGVmdE91dGVySm9pbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2pvaW5UeXBlKCdsZWZ0IG91dGVyJykuam9pbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuICByaWdodEpvaW46IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9qb2luVHlwZSgncmlnaHQnKS5qb2luLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0sXG4gIHJpZ2h0T3V0ZXJKb2luOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fam9pblR5cGUoJ3JpZ2h0IG91dGVyJykuam9pbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuICBvdXRlckpvaW46IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9qb2luVHlwZSgnb3V0ZXInKS5qb2luLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0sXG4gIGZ1bGxPdXRlckpvaW46IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9qb2luVHlwZSgnZnVsbCBvdXRlcicpLmpvaW4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcbiAgY3Jvc3NKb2luOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fam9pblR5cGUoJ2Nyb3NzJykuam9pbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuICBqb2luUmF3OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fam9pblR5cGUoJ3JhdycpLmpvaW4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcblxuICAvLyBUaGUgd2hlcmUgZnVuY3Rpb24gY2FuIGJlIHVzZWQgaW4gc2V2ZXJhbCB3YXlzOlxuICAvLyBUaGUgbW9zdCBiYXNpYyBpcyBgd2hlcmUoa2V5LCB2YWx1ZSlgLCB3aGljaCBleHBhbmRzIHRvXG4gIC8vIHdoZXJlIGtleSA9IHZhbHVlLlxuICB3aGVyZTogZnVuY3Rpb24oY29sdW1uLCBvcGVyYXRvciwgdmFsdWUpIHtcblxuICAgIC8vIFN1cHBvcnQgXCJ3aGVyZSB0cnVlIHx8IHdoZXJlIGZhbHNlXCJcbiAgICBpZiAoY29sdW1uID09PSBmYWxzZSB8fCBjb2x1bW4gPT09IHRydWUpIHtcbiAgICAgIHJldHVybiB0aGlzLndoZXJlKDEsICc9JywgY29sdW1uID8gMSA6IDApXG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGNvbHVtbiBpcyBhIGZ1bmN0aW9uLCBpbiB3aGljaCBjYXNlIGl0J3NcbiAgICAvLyBhIHdoZXJlIHN0YXRlbWVudCB3cmFwcGVkIGluIHBhcmVucy5cbiAgICBpZiAodHlwZW9mIGNvbHVtbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHRoaXMud2hlcmVXcmFwcGVkKGNvbHVtbik7XG4gICAgfVxuXG4gICAgLy8gQWxsb3cgYSByYXcgc3RhdGVtZW50IHRvIGJlIHBhc3NlZCBhbG9uZyB0byB0aGUgcXVlcnkuXG4gICAgaWYgKGNvbHVtbiBpbnN0YW5jZW9mIFJhdyAmJiBhcmd1bWVudHMubGVuZ3RoID09PSAxKSByZXR1cm4gdGhpcy53aGVyZVJhdyhjb2x1bW4pO1xuXG4gICAgLy8gQWxsb3dzIGB3aGVyZSh7aWQ6IDJ9KWAgc3ludGF4LlxuICAgIGlmIChfLmlzT2JqZWN0KGNvbHVtbikgJiYgIShjb2x1bW4gaW5zdGFuY2VvZiBSYXcpKSByZXR1cm4gdGhpcy5fb2JqZWN0V2hlcmUoY29sdW1uKTtcblxuICAgIC8vIEVuYWJsZSB0aGUgd2hlcmUoJ2tleScsIHZhbHVlKSBzeW50YXgsIG9ubHkgd2hlbiB0aGVyZVxuICAgIC8vIGFyZSBleHBsaWNpdGx5IHR3byBhcmd1bWVudHMgcGFzc2VkLCBzbyBpdCdzIG5vdCBwb3NzaWJsZSB0b1xuICAgIC8vIGRvIHdoZXJlKCdrZXknLCAnIT0nKSBhbmQgaGF2ZSB0aGF0IHR1cm4gaW50byB3aGVyZSBrZXkgIT0gbnVsbFxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICB2YWx1ZSAgICA9IG9wZXJhdG9yO1xuICAgICAgb3BlcmF0b3IgPSAnPSc7XG5cbiAgICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBudWxsLCBhbmQgaXQncyBhIHR3byBhcmd1bWVudCBxdWVyeSxcbiAgICAgIC8vIHdlIGFzc3VtZSB3ZSdyZSBnb2luZyBmb3IgYSBgd2hlcmVOdWxsYC5cbiAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy53aGVyZU51bGwoY29sdW1uKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBsb3dlciBjYXNlIHRoZSBvcGVyYXRvciBmb3IgY29tcGFyaXNvbiBwdXJwb3Nlc1xuICAgIHZhciBjaGVja09wZXJhdG9yID0gKCcnICsgb3BlcmF0b3IpLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG4gICAgLy8gSWYgdGhlcmUgYXJlIDMgYXJndW1lbnRzLCBjaGVjayB3aGV0aGVyICdpbicgaXMgb25lIG9mIHRoZW0uXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcbiAgICAgIGlmIChjaGVja09wZXJhdG9yID09PSAnaW4nIHx8IGNoZWNrT3BlcmF0b3IgPT09ICdub3QgaW4nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ub3QoY2hlY2tPcGVyYXRvciA9PT0gJ25vdCBpbicpLndoZXJlSW4oYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgfVxuICAgICAgaWYgKGNoZWNrT3BlcmF0b3IgPT09ICdiZXR3ZWVuJyB8fCBjaGVja09wZXJhdG9yID09PSAnbm90IGJldHdlZW4nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ub3QoY2hlY2tPcGVyYXRvciA9PT0gJ25vdCBiZXR3ZWVuJykud2hlcmVCZXR3ZWVuKGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgdmFsdWUgaXMgc3RpbGwgbnVsbCwgY2hlY2sgd2hldGhlciB0aGV5J3JlIG1lYW5pbmdcbiAgICAvLyB3aGVyZSB2YWx1ZSBpcyBudWxsXG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG5cbiAgICAgIC8vIENoZWNrIGZvciAud2hlcmUoa2V5LCAnaXMnLCBudWxsKSBvciAud2hlcmUoa2V5LCAnaXMgbm90JywgJ251bGwnKTtcbiAgICAgIGlmIChjaGVja09wZXJhdG9yID09PSAnaXMnIHx8IGNoZWNrT3BlcmF0b3IgPT09ICdpcyBub3QnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ub3QoY2hlY2tPcGVyYXRvciA9PT0gJ2lzIG5vdCcpLndoZXJlTnVsbChjb2x1bW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFB1c2ggb250byB0aGUgd2hlcmUgc3RhdGVtZW50IHN0YWNrLlxuICAgIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgICBncm91cGluZzogJ3doZXJlJyxcbiAgICAgIHR5cGU6ICd3aGVyZUJhc2ljJyxcbiAgICAgIGNvbHVtbjogY29sdW1uLFxuICAgICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgbm90OiB0aGlzLl9ub3QoKSxcbiAgICAgIGJvb2w6IHRoaXMuX2Jvb2woKVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvLyBBZGRzIGFuIGBvciB3aGVyZWAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgb3JXaGVyZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Jvb2woJ29yJykud2hlcmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcblxuICAvLyBBZGRzIGFuIGBub3Qgd2hlcmVgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIHdoZXJlTm90OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fbm90KHRydWUpLndoZXJlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0sXG5cbiAgLy8gQWRkcyBhbiBgb3Igbm90IHdoZXJlYCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICBvcldoZXJlTm90OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fYm9vbCgnb3InKS53aGVyZU5vdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuXG4gIC8vIFByb2Nlc3NlcyBhbiBvYmplY3QgbGl0ZXJhbCBwcm92aWRlZCBpbiBhIFwid2hlcmVcIiBjbGF1c2UuXG4gIF9vYmplY3RXaGVyZTogZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGJvb2xWYWwgPSB0aGlzLl9ib29sKCk7XG4gICAgdmFyIG5vdFZhbCA9IHRoaXMuX25vdCgpID8gJ05vdCcgOiAnJztcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICB0aGlzW2Jvb2xWYWwgKyAnV2hlcmUnICsgbm90VmFsXShrZXksIG9ialtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIHJhdyBgd2hlcmVgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIHdoZXJlUmF3OiBmdW5jdGlvbihzcWwsIGJpbmRpbmdzKSB7XG4gICAgdmFyIHJhdyA9IChzcWwgaW5zdGFuY2VvZiBSYXcgPyBzcWwgOiB0aGlzLmNsaWVudC5yYXcoc3FsLCBiaW5kaW5ncykpO1xuICAgIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgICBncm91cGluZzogJ3doZXJlJyxcbiAgICAgIHR5cGU6ICd3aGVyZVJhdycsXG4gICAgICB2YWx1ZTogcmF3LFxuICAgICAgYm9vbDogdGhpcy5fYm9vbCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgb3JXaGVyZVJhdzogZnVuY3Rpb24oc3FsLCBiaW5kaW5ncykge1xuICAgIHJldHVybiB0aGlzLl9ib29sKCdvcicpLndoZXJlUmF3KHNxbCwgYmluZGluZ3MpO1xuICB9LFxuXG4gIC8vIEhlbHBlciBmb3IgY29tcGlsaW5nIGFueSBhZHZhbmNlZCBgd2hlcmVgIHF1ZXJpZXMuXG4gIHdoZXJlV3JhcHBlZDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICd3aGVyZScsXG4gICAgICB0eXBlOiAnd2hlcmVXcmFwcGVkJyxcbiAgICAgIHZhbHVlOiBjYWxsYmFjayxcbiAgICAgIG5vdDogdGhpcy5fbm90KCksXG4gICAgICBib29sOiB0aGlzLl9ib29sKClcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuXG4gIC8vIEhlbHBlciBmb3IgY29tcGlsaW5nIGFueSBhZHZhbmNlZCBgaGF2aW5nYCBxdWVyaWVzLlxuICBoYXZpbmdXcmFwcGVkOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgICBncm91cGluZzogJ2hhdmluZycsXG4gICAgICB0eXBlOiAnd2hlcmVXcmFwcGVkJyxcbiAgICAgIHZhbHVlOiBjYWxsYmFjayxcbiAgICAgIGJvb2w6IHRoaXMuX2Jvb2woKVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgd2hlcmUgZXhpc3RzYCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICB3aGVyZUV4aXN0czogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICd3aGVyZScsXG4gICAgICB0eXBlOiAnd2hlcmVFeGlzdHMnLFxuICAgICAgdmFsdWU6IGNhbGxiYWNrLFxuICAgICAgbm90OiB0aGlzLl9ub3QoKSxcbiAgICAgIGJvb2w6IHRoaXMuX2Jvb2woKSxcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBBZGRzIGFuIGBvciB3aGVyZSBleGlzdHNgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIG9yV2hlcmVFeGlzdHM6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Jvb2woJ29yJykud2hlcmVFeGlzdHMoY2FsbGJhY2spO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgd2hlcmUgbm90IGV4aXN0c2AgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgd2hlcmVOb3RFeGlzdHM6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIHRoaXMuX25vdCh0cnVlKS53aGVyZUV4aXN0cyhjYWxsYmFjayk7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIGBvciB3aGVyZSBub3QgZXhpc3RzYCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICBvcldoZXJlTm90RXhpc3RzOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHJldHVybiB0aGlzLl9ib29sKCdvcicpLndoZXJlTm90RXhpc3RzKGNhbGxiYWNrKTtcbiAgfSxcblxuICAvLyBBZGRzIGEgYHdoZXJlIGluYCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICB3aGVyZUluOiBmdW5jdGlvbihjb2x1bW4sIHZhbHVlcykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlcykgJiYgXy5pc0VtcHR5KHZhbHVlcykpIHJldHVybiB0aGlzLndoZXJlKHRoaXMuX25vdCgpKTtcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICd3aGVyZScsXG4gICAgICB0eXBlOiAnd2hlcmVJbicsXG4gICAgICBjb2x1bW46IGNvbHVtbixcbiAgICAgIHZhbHVlOiB2YWx1ZXMsXG4gICAgICBub3Q6IHRoaXMuX25vdCgpLFxuICAgICAgYm9vbDogdGhpcy5fYm9vbCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIGBvciB3aGVyZSBpbmAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgb3JXaGVyZUluOiBmdW5jdGlvbihjb2x1bW4sIHZhbHVlcykge1xuICAgIHJldHVybiB0aGlzLl9ib29sKCdvcicpLndoZXJlSW4oY29sdW1uLCB2YWx1ZXMpO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgd2hlcmUgbm90IGluYCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICB3aGVyZU5vdEluOiBmdW5jdGlvbihjb2x1bW4sIHZhbHVlcykge1xuICAgIHJldHVybiB0aGlzLl9ub3QodHJ1ZSkud2hlcmVJbihjb2x1bW4sIHZhbHVlcyk7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIGBvciB3aGVyZSBub3QgaW5gIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIG9yV2hlcmVOb3RJbjogZnVuY3Rpb24oY29sdW1uLCB2YWx1ZXMpIHtcbiAgICByZXR1cm4gdGhpcy5fYm9vbCgnb3InKS5fbm90KHRydWUpLndoZXJlSW4oY29sdW1uLCB2YWx1ZXMpO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgd2hlcmUgbnVsbGAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgd2hlcmVOdWxsOiBmdW5jdGlvbihjb2x1bW4pIHtcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICd3aGVyZScsXG4gICAgICB0eXBlOiAnd2hlcmVOdWxsJyxcbiAgICAgIGNvbHVtbjogY29sdW1uLFxuICAgICAgbm90OiB0aGlzLl9ub3QoKSxcbiAgICAgIGJvb2w6IHRoaXMuX2Jvb2woKVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgb3Igd2hlcmUgbnVsbGAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgb3JXaGVyZU51bGw6IGZ1bmN0aW9uKGNvbHVtbikge1xuICAgIHJldHVybiB0aGlzLl9ib29sKCdvcicpLndoZXJlTnVsbChjb2x1bW4pO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgd2hlcmUgbm90IG51bGxgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIHdoZXJlTm90TnVsbDogZnVuY3Rpb24oY29sdW1uKSB7XG4gICAgcmV0dXJuIHRoaXMuX25vdCh0cnVlKS53aGVyZU51bGwoY29sdW1uKTtcbiAgfSxcblxuICAvLyBBZGRzIGEgYG9yIHdoZXJlIG5vdCBudWxsYCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICBvcldoZXJlTm90TnVsbDogZnVuY3Rpb24oY29sdW1uKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Jvb2woJ29yJykud2hlcmVOb3ROdWxsKGNvbHVtbik7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIGB3aGVyZSBiZXR3ZWVuYCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICB3aGVyZUJldHdlZW46IGZ1bmN0aW9uKGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodmFsdWVzKSwgJ1RoZSBzZWNvbmQgYXJndW1lbnQgdG8gd2hlcmVCZXR3ZWVuIG11c3QgYmUgYW4gYXJyYXkuJylcbiAgICBhc3NlcnQodmFsdWVzLmxlbmd0aCA9PT0gMiwgJ1lvdSBtdXN0IHNwZWNpZnkgMiB2YWx1ZXMgZm9yIHRoZSB3aGVyZUJldHdlZW4gY2xhdXNlJylcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICd3aGVyZScsXG4gICAgICB0eXBlOiAnd2hlcmVCZXR3ZWVuJyxcbiAgICAgIGNvbHVtbjogY29sdW1uLFxuICAgICAgdmFsdWU6IHZhbHVlcyxcbiAgICAgIG5vdDogdGhpcy5fbm90KCksXG4gICAgICBib29sOiB0aGlzLl9ib29sKClcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBBZGRzIGEgYHdoZXJlIG5vdCBiZXR3ZWVuYCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICB3aGVyZU5vdEJldHdlZW46IGZ1bmN0aW9uKGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgcmV0dXJuIHRoaXMuX25vdCh0cnVlKS53aGVyZUJldHdlZW4oY29sdW1uLCB2YWx1ZXMpO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgb3Igd2hlcmUgYmV0d2VlbmAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgb3JXaGVyZUJldHdlZW46IGZ1bmN0aW9uKGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Jvb2woJ29yJykud2hlcmVCZXR3ZWVuKGNvbHVtbiwgdmFsdWVzKTtcbiAgfSxcblxuICAvLyBBZGRzIGEgYG9yIHdoZXJlIG5vdCBiZXR3ZWVuYCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICBvcldoZXJlTm90QmV0d2VlbjogZnVuY3Rpb24oY29sdW1uLCB2YWx1ZXMpIHtcbiAgICByZXR1cm4gdGhpcy5fYm9vbCgnb3InKS53aGVyZU5vdEJldHdlZW4oY29sdW1uLCB2YWx1ZXMpO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgZ3JvdXAgYnlgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIGdyb3VwQnk6IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICBpZiAoaXRlbSBpbnN0YW5jZW9mIFJhdykge1xuICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBCeVJhdy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICdncm91cCcsXG4gICAgICB0eXBlOiAnZ3JvdXBCeUJhc2ljJyxcbiAgICAgIHZhbHVlOiBoZWxwZXJzLm5vcm1hbGl6ZUFyci5hcHBseShudWxsLCBhcmd1bWVudHMpXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIHJhdyBgZ3JvdXAgYnlgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIGdyb3VwQnlSYXc6IGZ1bmN0aW9uKHNxbCwgYmluZGluZ3MpIHtcbiAgICB2YXIgcmF3ID0gKHNxbCBpbnN0YW5jZW9mIFJhdyA/IHNxbCA6IHRoaXMuY2xpZW50LnJhdyhzcWwsIGJpbmRpbmdzKSk7XG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnZ3JvdXAnLFxuICAgICAgdHlwZTogJ2dyb3VwQnlSYXcnLFxuICAgICAgdmFsdWU6IHJhd1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgb3JkZXIgYnlgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIG9yZGVyQnk6IGZ1bmN0aW9uKGNvbHVtbiwgZGlyZWN0aW9uKSB7XG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnb3JkZXInLFxuICAgICAgdHlwZTogJ29yZGVyQnlCYXNpYycsXG4gICAgICB2YWx1ZTogY29sdW1uLFxuICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb25cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBBZGQgYSByYXcgYG9yZGVyIGJ5YCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICBvcmRlckJ5UmF3OiBmdW5jdGlvbihzcWwsIGJpbmRpbmdzKSB7XG4gICAgdmFyIHJhdyA9IChzcWwgaW5zdGFuY2VvZiBSYXcgPyBzcWwgOiB0aGlzLmNsaWVudC5yYXcoc3FsLCBiaW5kaW5ncykpO1xuICAgIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgICBncm91cGluZzogJ29yZGVyJyxcbiAgICAgIHR5cGU6ICdvcmRlckJ5UmF3JyxcbiAgICAgIHZhbHVlOiByYXdcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBBZGQgYSB1bmlvbiBzdGF0ZW1lbnQgdG8gdGhlIHF1ZXJ5LlxuICB1bmlvbjogZnVuY3Rpb24oY2FsbGJhY2tzLCB3cmFwKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgfHxcbiAgICAgICAgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIgJiYgXy5pc0Jvb2xlYW4od3JhcCkpKSB7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY2FsbGJhY2tzKSkge1xuICAgICAgICBjYWxsYmFja3MgPSBbY2FsbGJhY2tzXTtcbiAgICAgIH1cbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FsbGJhY2tzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgICAgIGdyb3VwaW5nOiAndW5pb24nLFxuICAgICAgICAgIGNsYXVzZTogJ3VuaW9uJyxcbiAgICAgICAgICB2YWx1ZTogY2FsbGJhY2tzW2ldLFxuICAgICAgICAgIHdyYXA6IHdyYXAgfHwgZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrcyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDAsIGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICAgIHdyYXAgPSBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKCFfLmlzQm9vbGVhbih3cmFwKSkge1xuICAgICAgICBjYWxsYmFja3MucHVzaCh3cmFwKTtcbiAgICAgICAgd3JhcCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgdGhpcy51bmlvbihjYWxsYmFja3MsIHdyYXApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBBZGRzIGEgdW5pb24gYWxsIHN0YXRlbWVudCB0byB0aGUgcXVlcnkuXG4gIHVuaW9uQWxsOiBmdW5jdGlvbihjYWxsYmFjaywgd3JhcCkge1xuICAgIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgICBncm91cGluZzogJ3VuaW9uJyxcbiAgICAgIGNsYXVzZTogJ3VuaW9uIGFsbCcsXG4gICAgICB2YWx1ZTogY2FsbGJhY2ssXG4gICAgICB3cmFwOiB3cmFwIHx8IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIGBoYXZpbmdgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIGhhdmluZzogZnVuY3Rpb24oY29sdW1uLCBvcGVyYXRvciwgdmFsdWUpIHtcbiAgICBpZiAoY29sdW1uIGluc3RhbmNlb2YgUmF3ICYmIGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiB0aGlzLl9oYXZpbmdSYXcoY29sdW1uKTtcbiAgICB9XG4gICAgXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGNvbHVtbiBpcyBhIGZ1bmN0aW9uLCBpbiB3aGljaCBjYXNlIGl0J3NcbiAgICAvLyBhIGhhdmluZyBzdGF0ZW1lbnQgd3JhcHBlZCBpbiBwYXJlbnMuXG4gICAgaWYgKHR5cGVvZiBjb2x1bW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhdmluZ1dyYXBwZWQoY29sdW1uKTtcbiAgICB9XG4gICAgXG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnaGF2aW5nJyxcbiAgICAgIHR5cGU6ICdoYXZpbmdCYXNpYycsXG4gICAgICBjb2x1bW46IGNvbHVtbixcbiAgICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIGJvb2w6IHRoaXMuX2Jvb2woKVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvLyBBZGRzIGFuIGBvciBoYXZpbmdgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIG9ySGF2aW5nOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fYm9vbCgnb3InKS5oYXZpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcbiAgaGF2aW5nUmF3OiBmdW5jdGlvbihzcWwsIGJpbmRpbmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hhdmluZ1JhdyhzcWwsIGJpbmRpbmdzKTtcbiAgfSxcbiAgb3JIYXZpbmdSYXc6IGZ1bmN0aW9uKHNxbCwgYmluZGluZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5fYm9vbCgnb3InKS5oYXZpbmdSYXcoc3FsLCBiaW5kaW5ncyk7XG4gIH0sXG4gIC8vIEFkZHMgYSByYXcgYGhhdmluZ2AgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgX2hhdmluZ1JhdzogZnVuY3Rpb24oc3FsLCBiaW5kaW5ncykge1xuICAgIHZhciByYXcgPSAoc3FsIGluc3RhbmNlb2YgUmF3ID8gc3FsIDogdGhpcy5jbGllbnQucmF3KHNxbCwgYmluZGluZ3MpKTtcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICdoYXZpbmcnLFxuICAgICAgdHlwZTogJ2hhdmluZ1JhdycsXG4gICAgICB2YWx1ZTogcmF3LFxuICAgICAgYm9vbDogdGhpcy5fYm9vbCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gT25seSBhbGxvdyBhIHNpbmdsZSBcIm9mZnNldFwiIHRvIGJlIHNldCBmb3IgdGhlIGN1cnJlbnQgcXVlcnkuXG4gIG9mZnNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICB0aGlzLl9zaW5nbGUub2Zmc2V0ID0gdmFsdWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gT25seSBhbGxvdyBhIHNpbmdsZSBcImxpbWl0XCIgdG8gYmUgc2V0IGZvciB0aGUgY3VycmVudCBxdWVyeS5cbiAgbGltaXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIHZhbCA9IHBhcnNlSW50KHZhbHVlLCAxMClcbiAgICBpZiAoaXNOYU4odmFsKSkge1xuICAgICAgaGVscGVycy53YXJuKCdBIHZhbGlkIGludGVnZXIgbXVzdCBiZSBwcm92aWRlZCB0byBsaW1pdCcpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NpbmdsZS5saW1pdCA9IHZhbDsgIFxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBSZXRyaWV2ZSB0aGUgXCJjb3VudFwiIHJlc3VsdCBvZiB0aGUgcXVlcnkuXG4gIGNvdW50OiBmdW5jdGlvbihjb2x1bW4pIHtcbiAgICByZXR1cm4gdGhpcy5fYWdncmVnYXRlKCdjb3VudCcsIChjb2x1bW4gfHwgJyonKSk7XG4gIH0sXG5cbiAgLy8gUmV0cmlldmUgdGhlIG1pbmltdW0gdmFsdWUgb2YgYSBnaXZlbiBjb2x1bW4uXG4gIG1pbjogZnVuY3Rpb24oY29sdW1uKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FnZ3JlZ2F0ZSgnbWluJywgY29sdW1uKTtcbiAgfSxcblxuICAvLyBSZXRyaWV2ZSB0aGUgbWF4aW11bSB2YWx1ZSBvZiBhIGdpdmVuIGNvbHVtbi5cbiAgbWF4OiBmdW5jdGlvbihjb2x1bW4pIHtcbiAgICByZXR1cm4gdGhpcy5fYWdncmVnYXRlKCdtYXgnLCBjb2x1bW4pO1xuICB9LFxuXG4gIC8vIFJldHJpZXZlIHRoZSBzdW0gb2YgdGhlIHZhbHVlcyBvZiBhIGdpdmVuIGNvbHVtbi5cbiAgc3VtOiBmdW5jdGlvbihjb2x1bW4pIHtcbiAgICByZXR1cm4gdGhpcy5fYWdncmVnYXRlKCdzdW0nLCBjb2x1bW4pO1xuICB9LFxuXG4gIC8vIFJldHJpZXZlIHRoZSBhdmVyYWdlIG9mIHRoZSB2YWx1ZXMgb2YgYSBnaXZlbiBjb2x1bW4uXG4gIGF2ZzogZnVuY3Rpb24oY29sdW1uKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FnZ3JlZ2F0ZSgnYXZnJywgY29sdW1uKTtcbiAgfSxcblxuICAvLyBSZXRyaWV2ZSB0aGUgXCJjb3VudFwiIG9mIHRoZSBkaXN0aW5jdCByZXN1bHRzIG9mIHRoZSBxdWVyeS5cbiAgY291bnREaXN0aW5jdDogZnVuY3Rpb24oY29sdW1uKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FnZ3JlZ2F0ZSgnY291bnQnLCAoY29sdW1uIHx8ICcqJyksIHRydWUpO1xuICB9LFxuXG4gIC8vIFJldHJpZXZlIHRoZSBzdW0gb2YgdGhlIGRpc3RpbmN0IHZhbHVlcyBvZiBhIGdpdmVuIGNvbHVtbi5cbiAgc3VtRGlzdGluY3Q6IGZ1bmN0aW9uKGNvbHVtbikge1xuICAgIHJldHVybiB0aGlzLl9hZ2dyZWdhdGUoJ3N1bScsIGNvbHVtbiwgdHJ1ZSk7XG4gIH0sXG5cbiAgLy8gUmV0cmlldmUgdGhlIHZnIG9mIHRoZSBkaXN0aW5jdCByZXN1bHRzIG9mIHRoZSBxdWVyeS5cbiAgYXZnRGlzdGluY3Q6IGZ1bmN0aW9uKGNvbHVtbikge1xuICAgIHJldHVybiB0aGlzLl9hZ2dyZWdhdGUoJ2F2ZycsIGNvbHVtbiwgdHJ1ZSk7XG4gIH0sXG5cbiAgLy8gSW5jcmVtZW50cyBhIGNvbHVtbidzIHZhbHVlIGJ5IHRoZSBzcGVjaWZpZWQgYW1vdW50LlxuICBpbmNyZW1lbnQ6IGZ1bmN0aW9uKGNvbHVtbiwgYW1vdW50KSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvdW50ZXIoY29sdW1uLCBhbW91bnQpO1xuICB9LFxuXG4gIC8vIERlY3JlbWVudHMgYSBjb2x1bW4ncyB2YWx1ZSBieSB0aGUgc3BlY2lmaWVkIGFtb3VudC5cbiAgZGVjcmVtZW50OiBmdW5jdGlvbihjb2x1bW4sIGFtb3VudCkge1xuICAgIHJldHVybiB0aGlzLl9jb3VudGVyKGNvbHVtbiwgYW1vdW50LCAnLScpO1xuICB9LFxuXG4gIC8vIFNldHMgdGhlIHZhbHVlcyBmb3IgYSBgc2VsZWN0YCBxdWVyeSwgaW5mb3JtaW5nIHRoYXQgb25seSB0aGUgZmlyc3RcbiAgLy8gcm93IHNob3VsZCBiZSByZXR1cm5lZCAobGltaXQgMSkuXG4gIGZpcnN0OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgaSwgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3QuYXBwbHkodGhpcywgYXJncyk7XG4gICAgdGhpcy5fbWV0aG9kID0gJ2ZpcnN0JztcbiAgICB0aGlzLmxpbWl0KDEpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIFBsdWNrIGEgY29sdW1uIGZyb20gYSBxdWVyeS5cbiAgcGx1Y2s6IGZ1bmN0aW9uKGNvbHVtbikge1xuICAgIHRoaXMuX21ldGhvZCA9ICdwbHVjayc7XG4gICAgdGhpcy5fc2luZ2xlLnBsdWNrID0gY29sdW1uO1xuICAgIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgICBncm91cGluZzogJ2NvbHVtbnMnLFxuICAgICAgdHlwZTogJ3BsdWNrJyxcbiAgICAgIHZhbHVlOiBjb2x1bW5cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBJbnNlcnQgJiBVcGRhdGVcbiAgLy8gLS0tLS0tXG5cbiAgLy8gU2V0cyB0aGUgdmFsdWVzIGZvciBhbiBgaW5zZXJ0YCBxdWVyeS5cbiAgaW5zZXJ0OiBmdW5jdGlvbih2YWx1ZXMsIHJldHVybmluZykge1xuICAgIHRoaXMuX21ldGhvZCA9ICdpbnNlcnQnO1xuICAgIGlmICghXy5pc0VtcHR5KHJldHVybmluZykpIHRoaXMucmV0dXJuaW5nKHJldHVybmluZyk7XG4gICAgdGhpcy5fc2luZ2xlLmluc2VydCA9IHZhbHVlc1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIFNldHMgdGhlIHZhbHVlcyBmb3IgYW4gYHVwZGF0ZWAsIGFsbG93aW5nIGZvciBib3RoXG4gIC8vIGAudXBkYXRlKGtleSwgdmFsdWUsIFtyZXR1cm5pbmddKWAgYW5kIGAudXBkYXRlKG9iaiwgW3JldHVybmluZ10pYCBzeW50YXhlcy5cbiAgdXBkYXRlOiBmdW5jdGlvbih2YWx1ZXMsIHJldHVybmluZykge1xuICAgIHZhciByZXQsIG9iaiA9IHRoaXMuX3NpbmdsZS51cGRhdGUgfHwge307XG4gICAgdGhpcy5fbWV0aG9kID0gJ3VwZGF0ZSc7XG4gICAgaWYgKF8uaXNTdHJpbmcodmFsdWVzKSkge1xuICAgICAgb2JqW3ZhbHVlc10gPSByZXR1cm5pbmc7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgcmV0ID0gYXJndW1lbnRzWzJdO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgaSA9IC0xLCBrZXlzID0gT2JqZWN0LmtleXModmFsdWVzKVxuICAgICAgaWYgKHRoaXMuX3NpbmdsZS51cGRhdGUpIHtcbiAgICAgICAgaGVscGVycy53YXJuKCdVcGRhdGUgY2FsbGVkIG11bHRpcGxlIHRpbWVzIHdpdGggb2JqZWN0cy4nKVxuICAgICAgfVxuICAgICAgd2hpbGUgKCsraSA8IGtleXMubGVuZ3RoKSB7XG4gICAgICAgIG9ialtrZXlzW2ldXSA9IHZhbHVlc1trZXlzW2ldXVxuICAgICAgfVxuICAgICAgcmV0ID0gYXJndW1lbnRzWzFdO1xuICAgIH1cbiAgICBpZiAoIV8uaXNFbXB0eShyZXQpKSB0aGlzLnJldHVybmluZyhyZXQpO1xuICAgIHRoaXMuX3NpbmdsZS51cGRhdGUgPSBvYmo7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gU2V0cyB0aGUgcmV0dXJuaW5nIHZhbHVlIGZvciB0aGUgcXVlcnkuXG4gIHJldHVybmluZzogZnVuY3Rpb24ocmV0dXJuaW5nKSB7XG4gICAgdGhpcy5fc2luZ2xlLnJldHVybmluZyA9IHJldHVybmluZztcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBEZWxldGVcbiAgLy8gLS0tLS0tXG5cbiAgLy8gRXhlY3V0ZXMgYSBkZWxldGUgc3RhdGVtZW50IG9uIHRoZSBxdWVyeTtcbiAgZGVsZXRlOiBmdW5jdGlvbihyZXQpIHtcbiAgICB0aGlzLl9tZXRob2QgPSAnZGVsJztcbiAgICBpZiAoIV8uaXNFbXB0eShyZXQpKSB0aGlzLnJldHVybmluZyhyZXQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG5cbiAgLy8gVHJ1bmNhdGVzIGEgdGFibGUsIGVuZHMgdGhlIHF1ZXJ5IGNoYWluLlxuICB0cnVuY2F0ZTogZnVuY3Rpb24odGFibGVOYW1lKSB7XG4gICAgdGhpcy5fbWV0aG9kID0gJ3RydW5jYXRlJztcbiAgICBpZiAodGFibGVOYW1lKSB7XG4gICAgICB0aGlzLl9zaW5nbGUudGFibGUgPSB0YWJsZU5hbWVcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gUmV0cmlldmVzIGNvbHVtbnMgZm9yIHRoZSB0YWJsZSBzcGVjaWZpZWQgYnkgYGtuZXgodGFibGVOYW1lKWBcbiAgY29sdW1uSW5mbzogZnVuY3Rpb24oY29sdW1uKSB7XG4gICAgdGhpcy5fbWV0aG9kID0gJ2NvbHVtbkluZm8nO1xuICAgIHRoaXMuX3NpbmdsZS5jb2x1bW5JbmZvID0gY29sdW1uO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIFNldCBhIGxvY2sgZm9yIHVwZGF0ZSBjb25zdHJhaW50LlxuICBmb3JVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX3NpbmdsZS5sb2NrID0gJ2ZvclVwZGF0ZSc7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gU2V0IGEgbG9jayBmb3Igc2hhcmUgY29uc3RyYWludC5cbiAgZm9yU2hhcmU6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX3NpbmdsZS5sb2NrID0gJ2ZvclNoYXJlJztcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBUYWtlcyBhIEpTIG9iamVjdCBvZiBtZXRob2RzIHRvIGNhbGwgYW5kIGNhbGxzIHRoZW1cbiAgZnJvbUpTOiBmdW5jdGlvbihvYmopIHtcbiAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWwsIGtleSkge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzW2tleV0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaGVscGVycy53YXJuKCdLbmV4IEVycm9yOiB1bmtub3duIGtleSAnICsga2V5KVxuICAgICAgfVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsKSkge1xuICAgICAgICB0aGlzW2tleV0uYXBwbHkodGhpcywgdmFsKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc1trZXldKHZhbClcbiAgICAgIH1cbiAgICB9LCB0aGlzKVxuICAgIHJldHVybiB0aGlzXG4gIH0sXG5cbiAgLy8gUGFzc2VzIHF1ZXJ5IHRvIHByb3ZpZGVkIGNhbGxiYWNrIGZ1bmN0aW9uLCB1c2VmdWwgZm9yIGUuZy4gY29tcG9zaW5nXG4gIC8vIGRvbWFpbi1zcGVjaWZpYyBoZWxwZXJzXG4gIG1vZGlmeTogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBbdGhpc10uY29uY2F0KF8ucmVzdChhcmd1bWVudHMpKSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEhlbHBlciBmb3IgdGhlIGluY3JlbWVudGluZy9kZWNyZW1lbnRpbmcgcXVlcmllcy5cbiAgX2NvdW50ZXI6IGZ1bmN0aW9uKGNvbHVtbiwgYW1vdW50LCBzeW1ib2wpIHtcbiAgICB2YXIgYW10ID0gcGFyc2VJbnQoYW1vdW50LCAxMCk7XG4gICAgaWYgKGlzTmFOKGFtdCkpIGFtdCA9IDE7XG4gICAgdGhpcy5fbWV0aG9kID0gJ2NvdW50ZXInO1xuICAgIHRoaXMuX3NpbmdsZS5jb3VudGVyID0ge1xuICAgICAgY29sdW1uOiBjb2x1bW4sXG4gICAgICBhbW91bnQ6IGFtdCxcbiAgICAgIHN5bWJvbDogKHN5bWJvbCB8fCAnKycpXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBIZWxwZXIgdG8gZ2V0IG9yIHNldCB0aGUgXCJib29sRmxhZ1wiIHZhbHVlLlxuICBfYm9vbDogZnVuY3Rpb24odmFsKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHRoaXMuX2Jvb2xGbGFnID0gdmFsO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHZhciByZXQgPSB0aGlzLl9ib29sRmxhZztcbiAgICB0aGlzLl9ib29sRmxhZyA9ICdhbmQnO1xuICAgIHJldHVybiByZXQ7XG4gIH0sXG5cbiAgLy8gSGVscGVyIHRvIGdldCBvciBzZXQgdGhlIFwibm90RmxhZ1wiIHZhbHVlLlxuICBfbm90OiBmdW5jdGlvbih2YWwpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdGhpcy5fbm90RmxhZyA9IHZhbDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB2YXIgcmV0ID0gdGhpcy5fbm90RmxhZztcbiAgICB0aGlzLl9ub3RGbGFnID0gZmFsc2U7XG4gICAgcmV0dXJuIHJldDtcbiAgfSxcblxuICAvLyBIZWxwZXIgdG8gZ2V0IG9yIHNldCB0aGUgXCJqb2luRmxhZ1wiIHZhbHVlLlxuICBfam9pblR5cGU6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdGhpcy5fam9pbkZsYWcgPSB2YWw7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdmFyIHJldCA9IHRoaXMuX2pvaW5GbGFnIHx8ICdpbm5lcic7XG4gICAgdGhpcy5fam9pbkZsYWcgPSAnaW5uZXInO1xuICAgIHJldHVybiByZXQ7XG4gIH0sXG5cbiAgLy8gSGVscGVyIGZvciBjb21waWxpbmcgYW55IGFnZ3JlZ2F0ZSBxdWVyaWVzLlxuICBfYWdncmVnYXRlOiBmdW5jdGlvbihtZXRob2QsIGNvbHVtbiwgYWdncmVnYXRlRGlzdGluY3QpIHtcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICdjb2x1bW5zJyxcbiAgICAgIHR5cGU6ICdhZ2dyZWdhdGUnLFxuICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICB2YWx1ZTogY29sdW1uLFxuICAgICAgYWdncmVnYXRlRGlzdGluY3Q6IGFnZ3JlZ2F0ZURpc3RpbmN0IHx8IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufSlcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1aWxkZXIucHJvdG90eXBlLCAnb3InLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9ib29sKCdvcicpO1xuICB9XG59KTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1aWxkZXIucHJvdG90eXBlLCAnbm90Jywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fbm90KHRydWUpO1xuICB9XG59KTtcblxuQnVpbGRlci5wcm90b3R5cGUuc2VsZWN0ICAgICAgPSBCdWlsZGVyLnByb3RvdHlwZS5jb2x1bW5zXG5CdWlsZGVyLnByb3RvdHlwZS5jb2x1bW4gICAgICA9IEJ1aWxkZXIucHJvdG90eXBlLmNvbHVtbnNcbkJ1aWxkZXIucHJvdG90eXBlLmFuZFdoZXJlTm90ID0gQnVpbGRlci5wcm90b3R5cGUud2hlcmVOb3RcbkJ1aWxkZXIucHJvdG90eXBlLmFuZFdoZXJlICAgID0gQnVpbGRlci5wcm90b3R5cGUud2hlcmVcbkJ1aWxkZXIucHJvdG90eXBlLmFuZFdoZXJlUmF3ID0gQnVpbGRlci5wcm90b3R5cGUud2hlcmVSYXdcbkJ1aWxkZXIucHJvdG90eXBlLmFuZEhhdmluZyAgID0gQnVpbGRlci5wcm90b3R5cGUuaGF2aW5nXG5CdWlsZGVyLnByb3RvdHlwZS5mcm9tICAgICAgICA9IEJ1aWxkZXIucHJvdG90eXBlLnRhYmxlXG5CdWlsZGVyLnByb3RvdHlwZS5pbnRvICAgICAgICA9IEJ1aWxkZXIucHJvdG90eXBlLnRhYmxlXG5CdWlsZGVyLnByb3RvdHlwZS5kZWwgICAgICAgICA9IEJ1aWxkZXIucHJvdG90eXBlLmRlbGV0ZVxuXG4vLyBBdHRhY2ggYWxsIG9mIHRoZSB0b3AgbGV2ZWwgcHJvbWlzZSBtZXRob2RzIHRoYXQgc2hvdWxkIGJlIGNoYWluYWJsZS5cbnJlcXVpcmUoJy4uL2ludGVyZmFjZScpKEJ1aWxkZXIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1aWxkZXI7XG4iXX0=