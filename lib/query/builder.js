
// Builder
// -------
'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _events = require('events');

var _raw = require('../raw');

var _raw2 = _interopRequireDefault(_raw);

var _helpers = require('../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _joinclause = require('./joinclause');

var _joinclause2 = _interopRequireDefault(_joinclause);

var _lodash = require('lodash');

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
_inherits2['default'](Builder, _events.EventEmitter);

_lodash.assign(Builder.prototype, {

  toString: function toString() {
    return this.toQuery();
  },

  // Convert the current query "toSQL"
  toSQL: function toSQL(method, tz) {
    return this.client.queryCompiler(this).toSQL(method || this._method, tz);
  },

  // Create a shallow clone of the current query builder.
  clone: function clone() {
    var cloned = new this.constructor(this.client);
    cloned._method = this._method;
    cloned._single = _lodash.clone(this._single);
    cloned._statements = _lodash.clone(this._statements);
    cloned._debug = this._debug;

    // `_option` is assigned by the `Interface` mixin.
    if (!_lodash.isUndefined(this._options)) {
      cloned._options = _lodash.clone(this._options);
    }

    return cloned;
  },

  timeout: function timeout(ms) {
    var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var cancel = _ref.cancel;

    if (_lodash.isNumber(ms) && ms > 0) {
      this._timeout = ms;
      if (cancel) {
        this.client.assertCanCancelQuery();
        this._cancelOnTimeout = true;
      }
    }
    return this;
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
    var join = undefined;
    var schema = this._single.schema;

    var joinType = this._joinType();
    if (typeof first === 'function') {
      join = new _joinclause2['default'](table, joinType, schema);
      first.call(join, join);
    } else if (joinType === 'raw') {
      join = new _joinclause2['default'](this.client.raw(table, first), 'raw');
    } else {
      join = new _joinclause2['default'](table, joinType, schema);
      if (arguments.length > 1) {
        join.on.apply(join, _lodash.toArray(arguments).slice(1));
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
    if (column instanceof _raw2['default'] && arguments.length === 1) return this.whereRaw(column);

    // Allows `where({id: 2})` syntax.
    if (_lodash.isObject(column) && !(column instanceof _raw2['default'])) return this._objectWhere(column);

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
    this._bool('or');
    var obj = arguments[0];
    if (_lodash.isObject(obj) && !_lodash.isFunction(obj) && !(obj instanceof _raw2['default'])) {
      return this.whereWrapped(function () {
        for (var key in obj) {
          this.andWhere(key, obj[key]);
        }
      });
    }
    return this.where.apply(this, arguments);
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
    var raw = sql instanceof _raw2['default'] ? sql : this.client.raw(sql, bindings);
    this._statements.push({
      grouping: 'where',
      type: 'whereRaw',
      value: raw,
      not: this._not(),
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
    if (Array.isArray(values) && _lodash.isEmpty(values)) return this.where(this._not());
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
    _assert2['default'](Array.isArray(values), 'The second argument to whereBetween must be an array.');
    _assert2['default'](values.length === 2, 'You must specify 2 values for the whereBetween clause');
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
    if (item instanceof _raw2['default']) {
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
    var raw = sql instanceof _raw2['default'] ? sql : this.client.raw(sql, bindings);
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
    var raw = sql instanceof _raw2['default'] ? sql : this.client.raw(sql, bindings);
    this._statements.push({
      grouping: 'order',
      type: 'orderByRaw',
      value: raw
    });
    return this;
  },

  // Add a union statement to the query.
  union: function union(callbacks, wrap) {
    if (arguments.length === 1 || arguments.length === 2 && _lodash.isBoolean(wrap)) {
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
      callbacks = _lodash.toArray(arguments).slice(0, arguments.length - 1);
      wrap = arguments[arguments.length - 1];
      if (!_lodash.isBoolean(wrap)) {
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
    if (column instanceof _raw2['default'] && arguments.length === 1) {
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
    var raw = sql instanceof _raw2['default'] ? sql : this.client.raw(sql, bindings);
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
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
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
    if (!_lodash.isEmpty(returning)) this.returning(returning);
    this._single.insert = values;
    return this;
  },

  // Sets the values for an `update`, allowing for both
  // `.update(key, value, [returning])` and `.update(obj, [returning])` syntaxes.
  update: function update(values, returning) {
    var ret = undefined;
    var obj = this._single.update || {};
    this._method = 'update';
    if (_lodash.isString(values)) {
      obj[values] = returning;
      if (arguments.length > 2) {
        ret = arguments[2];
      }
    } else {
      var keys = Object.keys(values);
      if (this._single.update) {
        helpers.warn('Update called multiple times with objects.');
      }
      var i = -1;
      while (++i < keys.length) {
        obj[keys[i]] = values[keys[i]];
      }
      ret = arguments[1];
    }
    if (!_lodash.isEmpty(ret)) this.returning(ret);
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
    if (!_lodash.isEmpty(ret)) this.returning(ret);
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
    var _this = this;

    _lodash.each(obj, function (val, key) {
      if (typeof _this[key] !== 'function') {
        helpers.warn('Knex Error: unknown key ' + key);
      }
      if (Array.isArray(val)) {
        _this[key].apply(_this, val);
      } else {
        _this[key](val);
      }
    });
    return this;
  },

  // Passes query to provided callback function, useful for e.g. composing
  // domain-specific helpers
  modify: function modify(callback) {
    callback.apply(this, [this].concat(_lodash.tail(arguments)));
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
Builder.prototype.andWhereBetween = Builder.prototype.whereBetween;
Builder.prototype.andWhereNotBetween = Builder.prototype.whereNotBetween;
Builder.prototype.andHaving = Builder.prototype.having;
Builder.prototype.from = Builder.prototype.table;
Builder.prototype.into = Builder.prototype.table;
Builder.prototype.del = Builder.prototype['delete'];

// Attach all of the top level promise methods that should be chainable.
require('../interface')(Builder);

exports['default'] = Builder;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9xdWVyeS9idWlsZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O3NCQUdtQixRQUFROzs7O3dCQUNOLFVBQVU7Ozs7c0JBQ0YsUUFBUTs7bUJBRXJCLFFBQVE7Ozs7dUJBQ0MsWUFBWTs7SUFBekIsT0FBTzs7MEJBQ0ksY0FBYzs7OztzQkFJOUIsUUFBUTs7OztBQUlmLFNBQVMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUN2QixNQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtBQUNwQixNQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztBQUNoQixNQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNsQixNQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztBQUN0QixNQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQTtBQUN2QixNQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7OztBQUduRCxNQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQztBQUN6QixNQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztBQUN2QixNQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztDQUN2QjtBQUNELHNCQUFTLE9BQU8sdUJBQWUsQ0FBQzs7QUFFaEMsZUFBTyxPQUFPLENBQUMsU0FBUyxFQUFFOztBQUV4QixVQUFRLEVBQUEsb0JBQUc7QUFDVCxXQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztHQUN2Qjs7O0FBR0QsT0FBSyxFQUFBLGVBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRTtBQUNoQixXQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztHQUMxRTs7O0FBR0QsT0FBSyxFQUFBLGlC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U0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0dBQ2xFO0FBQ0QsV0FBUyxFQUFBLHFCQUFHO0FBQ1YsV0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0dBQzVEO0FBQ0QsZUFBYSxFQUFBLHlCQUFHO0FBQ2QsV0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0dBQ2pFO0FBQ0QsV0FBUyxFQUFBLHFCQUFHO0FBQ1YsV0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0dBQzVEO0FBQ0QsU0FBTyxFQUFBLG1CQUFHO0FBQ1IsV0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0dBQzFEOzs7OztBQUtELE9BQUssRUFBQSxlQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFOzs7QUFHN0IsUUFBSSxNQUFNLEtBQUssS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7QUFDdkMsYUFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtLQUMxQzs7OztBQUlELFFBQUksT0FBTyxNQUFNLEtBQUssVUFBVSxFQUFFO0FBQ2hDLGFBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNsQzs7O0FBR0QsUUFBSSxNQUFNLDRCQUFlLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsT0FBTyxJQUFJ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QVMsQ0FBQyxPQUFPLENBQUE7QUFDcEQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUE7QUFDMUQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUE7QUFDcEQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUE7QUFDMUQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUE7QUFDbEUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQTtBQUN4RSxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQTtBQUN0RCxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQTtBQUNoRCxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQTtBQUNoRCxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsU0FBUyxVQUFPLENBQUE7OztBQUdoRCxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7O3FCQUVsQixPQUFPIiwiZmlsZSI6ImJ1aWxkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8vIEJ1aWxkZXJcbi8vIC0tLS0tLS1cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xuXG5pbXBvcnQgUmF3IGZyb20gJy4uL3Jhdyc7XG5pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4uL2hlbHBlcnMnO1xuaW1wb3J0IEpvaW5DbGF1c2UgZnJvbSAnLi9qb2luY2xhdXNlJztcbmltcG9ydCB7XG4gIGFzc2lnbiwgY2xvbmUsIGVhY2gsIGlzQm9vbGVhbiwgaXNFbXB0eSwgaXNGdW5jdGlvbiwgaXNOdW1iZXIsIGlzT2JqZWN0LFxuICBpc1N0cmluZywgaXNVbmRlZmluZWQsIHRhaWwsIHRvQXJyYXlcbn0gZnJvbSAnbG9kYXNoJztcblxuLy8gVHlwaWNhbGx5IGNhbGxlZCBmcm9tIGBrbmV4LmJ1aWxkZXJgLFxuLy8gc3RhcnQgYSBuZXcgcXVlcnkgYnVpbGRpbmcgY2hhaW4uXG5mdW5jdGlvbiBCdWlsZGVyKGNsaWVudCkge1xuICB0aGlzLmNsaWVudCA9IGNsaWVudFxuICB0aGlzLmFuZCA9IHRoaXM7XG4gIHRoaXMuX3NpbmdsZSA9IHt9O1xuICB0aGlzLl9zdGF0ZW1lbnRzID0gW107XG4gIHRoaXMuX21ldGhvZCA9ICdzZWxlY3QnXG4gIHRoaXMuX2RlYnVnID0gY2xpZW50LmNvbmZpZyAmJiBjbGllbnQuY29uZmlnLmRlYnVnO1xuXG4gIC8vIEludGVybmFsIGZsYWdzIHVzZWQgaW4gdGhlIGJ1aWxkZXIuXG4gIHRoaXMuX2pvaW5GbGFnID0gJ2lubmVyJztcbiAgdGhpcy5fYm9vbEZsYWcgPSAnYW5kJztcbiAgdGhpcy5fbm90RmxhZyA9IGZhbHNlO1xufVxuaW5oZXJpdHMoQnVpbGRlciwgRXZlbnRFbWl0dGVyKTtcblxuYXNzaWduKEJ1aWxkZXIucHJvdG90eXBlLCB7XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMudG9RdWVyeSgpO1xuICB9LFxuXG4gIC8vIENvbnZlcnQgdGhlIGN1cnJlbnQgcXVlcnkgXCJ0b1NRTFwiXG4gIHRvU1FMKG1ldGhvZCwgdHopIHtcbiAgICByZXR1cm4gdGhpcy5jbGllbnQucXVlcnlDb21waWxlcih0aGlzKS50b1NRTChtZXRob2QgfHwgdGhpcy5fbWV0aG9kLCB0eik7XG4gIH0sXG5cbiAgLy8gQ3JlYXRlIGEgc2hhbGxvdyBjbG9uZSBvZiB0aGUgY3VycmVudCBxdWVyeSBidWlsZGVyLlxuICBjbG9uZSgpIHtcbiAgICBjb25zdCBjbG9uZWQgPSBuZXcgdGhpcy5jb25zdHJ1Y3Rvcih0aGlzLmNsaWVudCk7XG4gICAgY2xvbmVkLl9tZXRob2QgPSB0aGlzLl9tZXRob2Q7XG4gICAgY2xvbmVkLl9zaW5nbGUgPSBjbG9uZSh0aGlzLl9zaW5nbGUpO1xuICAgIGNsb25lZC5fc3RhdGVtZW50cyA9IGNsb25lKHRoaXMuX3N0YXRlbWVudHMpO1xuICAgIGNsb25lZC5fZGVidWcgPSB0aGlzLl9kZWJ1ZztcblxuICAgIC8vIGBfb3B0aW9uYCBpcyBhc3NpZ25lZCBieSB0aGUgYEludGVyZmFjZWAgbWl4aW4uXG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9vcHRpb25zKSkge1xuICAgICAgY2xvbmVkLl9vcHRpb25zID0gY2xvbmUodGhpcy5fb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsb25lZDtcbiAgfSxcblxuICB0aW1lb3V0KG1zLCB7Y2FuY2VsfSA9IHt9KSB7XG4gICAgaWYoaXNOdW1iZXIobXMpICYmIG1zID4gMCkge1xuICAgICAgdGhpcy5fdGltZW91dCA9IG1zO1xuICAgICAgaWYgKGNhbmNlbCkge1xuICAgICAgICB0aGlzLmNsaWVudC5hc3NlcnRDYW5DYW5jZWxRdWVyeSgpO1xuICAgICAgICB0aGlzLl9jYW5jZWxPblRpbWVvdXQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBTZWxlY3RcbiAgLy8gLS0tLS0tXG5cbiAgLy8gQWRkcyBhIGNvbHVtbiBvciBjb2x1bW5zIHRvIHRoZSBsaXN0IG9mIFwiY29sdW1uc1wiXG4gIC8vIGJlaW5nIHNlbGVjdGVkIG9uIHRoZSBxdWVyeS5cbiAgY29sdW1ucyhjb2x1bW4pIHtcbiAgICBpZiAoIWNvbHVtbikgcmV0dXJuIHRoaXM7XG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnY29sdW1ucycsXG4gICAgICB2YWx1ZTogaGVscGVycy5ub3JtYWxpemVBcnIuYXBwbHkobnVsbCwgYXJndW1lbnRzKVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIEFsbG93IGZvciBhIHN1Yi1zZWxlY3QgdG8gYmUgZXhwbGljaXRseSBhbGlhc2VkIGFzIGEgY29sdW1uLFxuICAvLyB3aXRob3V0IG5lZWRpbmcgdG8gY29tcGlsZSB0aGUgcXVlcnkgaW4gYSB3aGVyZS5cbiAgYXMoY29sdW1uKSB7XG4gICAgdGhpcy5fc2luZ2xlLmFzID0gY29sdW1uO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIFByZXBlbmRzIHRoZSBgc2NoZW1hTmFtZWAgb24gYHRhYmxlTmFtZWAgZGVmaW5lZCBieSBgLnRhYmxlYCBhbmQgYC5qb2luYC5cbiAgd2l0aFNjaGVtYShzY2hlbWFOYW1lKSB7XG4gICAgdGhpcy5fc2luZ2xlLnNjaGVtYSA9IHNjaGVtYU5hbWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gU2V0cyB0aGUgYHRhYmxlTmFtZWAgb24gdGhlIHF1ZXJ5LlxuICAvLyBBbGlhcyB0byBcImZyb21cIiBmb3Igc2VsZWN0IGFuZCBcImludG9cIiBmb3IgaW5zZXJ0IHN0YXRlbWVudHNcbiAgLy8gZS5nLiBidWlsZGVyLmluc2VydCh7YTogdmFsdWV9KS5pbnRvKCd0YWJsZU5hbWUnKVxuICB0YWJsZSh0YWJsZU5hbWUpIHtcbiAgICB0aGlzLl9zaW5nbGUudGFibGUgPSB0YWJsZU5hbWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIGBkaXN0aW5jdGAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgZGlzdGluY3QoKSB7XG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnY29sdW1ucycsXG4gICAgICB2YWx1ZTogaGVscGVycy5ub3JtYWxpemVBcnIuYXBwbHkobnVsbCwgYXJndW1lbnRzKSxcbiAgICAgIGRpc3RpbmN0OiB0cnVlXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIGpvaW4gY2xhdXNlIHRvIHRoZSBxdWVyeSwgYWxsb3dpbmcgZm9yIGFkdmFuY2VkIGpvaW5zXG4gIC8vIHdpdGggYW4gYW5vbnltb3VzIGZ1bmN0aW9uIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuXG4gIC8vIGZ1bmN0aW9uKHRhYmxlLCBmaXJzdCwgb3BlcmF0b3IsIHNlY29uZClcbiAgam9pbih0YWJsZSwgZmlyc3QpIHtcbiAgICBsZXQgam9pbjtcbiAgICBjb25zdCB7IHNjaGVtYSB9ID0gdGhpcy5fc2luZ2xlO1xuICAgIGNvbnN0IGpvaW5UeXBlID0gdGhpcy5fam9pblR5cGUoKTtcbiAgICBpZiAodHlwZW9mIGZpcnN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBqb2luID0gbmV3IEpvaW5DbGF1c2UodGFibGUsIGpvaW5UeXBlLCBzY2hlbWEpO1xuICAgICAgZmlyc3QuY2FsbChqb2luLCBqb2luKTtcbiAgICB9IGVsc2UgaWYgKGpvaW5UeXBlID09PSAncmF3Jykge1xuICAgICAgam9pbiA9IG5ldyBKb2luQ2xhdXNlKHRoaXMuY2xpZW50LnJhdyh0YWJsZSwgZmlyc3QpLCAncmF3Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGpvaW4gPSBuZXcgSm9pbkNsYXVzZSh0YWJsZSwgam9pblR5cGUsIHNjaGVtYSk7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgam9pbi5vbi5hcHBseShqb2luLCB0b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goam9pbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gSk9JTiBibG9ja3M6XG4gIGlubmVySm9pbigpIHtcbiAgICByZXR1cm4gdGhpcy5fam9pblR5cGUoJ2lubmVyJykuam9pbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuICBsZWZ0Sm9pbigpIHtcbiAgICByZXR1cm4gdGhpcy5fam9pblR5cGUoJ2xlZnQnKS5qb2luLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0sXG4gIGxlZnRPdXRlckpvaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2pvaW5UeXBlKCdsZWZ0IG91dGVyJykuam9pbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuICByaWdodEpvaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2pvaW5UeXBlKCdyaWdodCcpLmpvaW4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcbiAgcmlnaHRPdXRlckpvaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2pvaW5UeXBlKCdyaWdodCBvdXRlcicpLmpvaW4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcbiAgb3V0ZXJKb2luKCkge1xuICAgIHJldHVybiB0aGlzLl9qb2luVHlwZSgnb3V0ZXInKS5qb2luLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0sXG4gIGZ1bGxPdXRlckpvaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2pvaW5UeXBlKCdmdWxsIG91dGVyJykuam9pbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuICBjcm9zc0pvaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2pvaW5UeXBlKCdjcm9zcycpLmpvaW4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcbiAgam9pblJhdygpIHtcbiAgICByZXR1cm4gdGhpcy5fam9pblR5cGUoJ3JhdycpLmpvaW4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcblxuICAvLyBUaGUgd2hlcmUgZnVuY3Rpb24gY2FuIGJlIHVzZWQgaW4gc2V2ZXJhbCB3YXlzOlxuICAvLyBUaGUgbW9zdCBiYXNpYyBpcyBgd2hlcmUoa2V5LCB2YWx1ZSlgLCB3aGljaCBleHBhbmRzIHRvXG4gIC8vIHdoZXJlIGtleSA9IHZhbHVlLlxuICB3aGVyZShjb2x1bW4sIG9wZXJhdG9yLCB2YWx1ZSkge1xuXG4gICAgLy8gU3VwcG9ydCBcIndoZXJlIHRydWUgfHwgd2hlcmUgZmFsc2VcIlxuICAgIGlmIChjb2x1bW4gPT09IGZhbHNlIHx8IGNvbHVtbiA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMud2hlcmUoMSwgJz0nLCBjb2x1bW4gPyAxIDogMClcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgY29sdW1uIGlzIGEgZnVuY3Rpb24sIGluIHdoaWNoIGNhc2UgaXQnc1xuICAgIC8vIGEgd2hlcmUgc3RhdGVtZW50IHdyYXBwZWQgaW4gcGFyZW5zLlxuICAgIGlmICh0eXBlb2YgY29sdW1uID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdGhpcy53aGVyZVdyYXBwZWQoY29sdW1uKTtcbiAgICB9XG5cbiAgICAvLyBBbGxvdyBhIHJhdyBzdGF0ZW1lbnQgdG8gYmUgcGFzc2VkIGFsb25nIHRvIHRoZSBxdWVyeS5cbiAgICBpZiAoY29sdW1uIGluc3RhbmNlb2YgUmF3ICYmIGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHJldHVybiB0aGlzLndoZXJlUmF3KGNvbHVtbik7XG5cbiAgICAvLyBBbGxvd3MgYHdoZXJlKHtpZDogMn0pYCBzeW50YXguXG4gICAgaWYgKGlzT2JqZWN0KGNvbHVtbikgJiYgIShjb2x1bW4gaW5zdGFuY2VvZiBSYXcpKSByZXR1cm4gdGhpcy5fb2JqZWN0V2hlcmUoY29sdW1uKTtcblxuICAgIC8vIEVuYWJsZSB0aGUgd2hlcmUoJ2tleScsIHZhbHVlKSBzeW50YXgsIG9ubHkgd2hlbiB0aGVyZVxuICAgIC8vIGFyZSBleHBsaWNpdGx5IHR3byBhcmd1bWVudHMgcGFzc2VkLCBzbyBpdCdzIG5vdCBwb3NzaWJsZSB0b1xuICAgIC8vIGRvIHdoZXJlKCdrZXknLCAnIT0nKSBhbmQgaGF2ZSB0aGF0IHR1cm4gaW50byB3aGVyZSBrZXkgIT0gbnVsbFxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICB2YWx1ZSA9IG9wZXJhdG9yO1xuICAgICAgb3BlcmF0b3IgPSAnPSc7XG5cbiAgICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBudWxsLCBhbmQgaXQncyBhIHR3byBhcmd1bWVudCBxdWVyeSxcbiAgICAgIC8vIHdlIGFzc3VtZSB3ZSdyZSBnb2luZyBmb3IgYSBgd2hlcmVOdWxsYC5cbiAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy53aGVyZU51bGwoY29sdW1uKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBsb3dlciBjYXNlIHRoZSBvcGVyYXRvciBmb3IgY29tcGFyaXNvbiBwdXJwb3Nlc1xuICAgIGNvbnN0IGNoZWNrT3BlcmF0b3IgPSAoYCR7b3BlcmF0b3J9YCkudG9Mb3dlckNhc2UoKS50cmltKCk7XG5cbiAgICAvLyBJZiB0aGVyZSBhcmUgMyBhcmd1bWVudHMsIGNoZWNrIHdoZXRoZXIgJ2luJyBpcyBvbmUgb2YgdGhlbS5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgICAgaWYgKGNoZWNrT3BlcmF0b3IgPT09ICdpbicgfHwgY2hlY2tPcGVyYXRvciA9PT0gJ25vdCBpbicpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25vdChjaGVja09wZXJhdG9yID09PSAnbm90IGluJykud2hlcmVJbihhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1syXSk7XG4gICAgICB9XG4gICAgICBpZiAoY2hlY2tPcGVyYXRvciA9PT0gJ2JldHdlZW4nIHx8IGNoZWNrT3BlcmF0b3IgPT09ICdub3QgYmV0d2VlbicpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25vdChjaGVja09wZXJhdG9yID09PSAnbm90IGJldHdlZW4nKS53aGVyZUJldHdlZW4oYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBzdGlsbCBudWxsLCBjaGVjayB3aGV0aGVyIHRoZXkncmUgbWVhbmluZ1xuICAgIC8vIHdoZXJlIHZhbHVlIGlzIG51bGxcbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcblxuICAgICAgLy8gQ2hlY2sgZm9yIC53aGVyZShrZXksICdpcycsIG51bGwpIG9yIC53aGVyZShrZXksICdpcyBub3QnLCAnbnVsbCcpO1xuICAgICAgaWYgKGNoZWNrT3BlcmF0b3IgPT09ICdpcycgfHwgY2hlY2tPcGVyYXRvciA9PT0gJ2lzIG5vdCcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25vdChjaGVja09wZXJhdG9yID09PSAnaXMgbm90Jykud2hlcmVOdWxsKGNvbHVtbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUHVzaCBvbnRvIHRoZSB3aGVyZSBzdGF0ZW1lbnQgc3RhY2suXG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnd2hlcmUnLFxuICAgICAgdHlwZTogJ3doZXJlQmFzaWMnLFxuICAgICAgY29sdW1uLFxuICAgICAgb3BlcmF0b3IsXG4gICAgICB2YWx1ZSxcbiAgICAgIG5vdDogdGhpcy5fbm90KCksXG4gICAgICBib29sOiB0aGlzLl9ib29sKClcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLy8gQWRkcyBhbiBgb3Igd2hlcmVgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIG9yV2hlcmU6IGZ1bmN0aW9uIG9yV2hlcmUoKSB7XG4gICAgdGhpcy5fYm9vbCgnb3InKTtcbiAgICBjb25zdCBvYmogPSBhcmd1bWVudHNbMF07XG4gICAgaWYoaXNPYmplY3Qob2JqKSAmJiAhaXNGdW5jdGlvbihvYmopICYmICEob2JqIGluc3RhbmNlb2YgUmF3KSkge1xuICAgICAgcmV0dXJuIHRoaXMud2hlcmVXcmFwcGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IoY29uc3Qga2V5IGluIG9iaikge1xuICAgICAgICAgIHRoaXMuYW5kV2hlcmUoa2V5LCBvYmpba2V5XSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy53aGVyZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuXG4gIC8vIEFkZHMgYW4gYG5vdCB3aGVyZWAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgd2hlcmVOb3QoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25vdCh0cnVlKS53aGVyZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuXG4gIC8vIEFkZHMgYW4gYG9yIG5vdCB3aGVyZWAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgb3JXaGVyZU5vdCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYm9vbCgnb3InKS53aGVyZU5vdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuXG4gIC8vIFByb2Nlc3NlcyBhbiBvYmplY3QgbGl0ZXJhbCBwcm92aWRlZCBpbiBhIFwid2hlcmVcIiBjbGF1c2UuXG4gIF9vYmplY3RXaGVyZShvYmopIHtcbiAgICBjb25zdCBib29sVmFsID0gdGhpcy5fYm9vbCgpO1xuICAgIGNvbnN0IG5vdFZhbCA9IHRoaXMuX25vdCgpID8gJ05vdCcgOiAnJztcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICAgIHRoaXNbYm9vbFZhbCArICdXaGVyZScgKyBub3RWYWxdKGtleSwgb2JqW2tleV0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBBZGRzIGEgcmF3IGB3aGVyZWAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgd2hlcmVSYXcoc3FsLCBiaW5kaW5ncykge1xuICAgIGNvbnN0IHJhdyA9IChzcWwgaW5zdGFuY2VvZiBSYXcgPyBzcWwgOiB0aGlzLmNsaWVudC5yYXcoc3FsLCBiaW5kaW5ncykpO1xuICAgIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgICBncm91cGluZzogJ3doZXJlJyxcbiAgICAgIHR5cGU6ICd3aGVyZVJhdycsXG4gICAgICB2YWx1ZTogcmF3LFxuICAgICAgbm90OiB0aGlzLl9ub3QoKSxcbiAgICAgIGJvb2w6IHRoaXMuX2Jvb2woKVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIG9yV2hlcmVSYXcoc3FsLCBiaW5kaW5ncykge1xuICAgIHJldHVybiB0aGlzLl9ib29sKCdvcicpLndoZXJlUmF3KHNxbCwgYmluZGluZ3MpO1xuICB9LFxuXG4gIC8vIEhlbHBlciBmb3IgY29tcGlsaW5nIGFueSBhZHZhbmNlZCBgd2hlcmVgIHF1ZXJpZXMuXG4gIHdoZXJlV3JhcHBlZChjYWxsYmFjaykge1xuICAgIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgICBncm91cGluZzogJ3doZXJlJyxcbiAgICAgIHR5cGU6ICd3aGVyZVdyYXBwZWQnLFxuICAgICAgdmFsdWU6IGNhbGxiYWNrLFxuICAgICAgbm90OiB0aGlzLl9ub3QoKSxcbiAgICAgIGJvb2w6IHRoaXMuX2Jvb2woKVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG5cbiAgLy8gSGVscGVyIGZvciBjb21waWxpbmcgYW55IGFkdmFuY2VkIGBoYXZpbmdgIHF1ZXJpZXMuXG4gIGhhdmluZ1dyYXBwZWQoY2FsbGJhY2spIHtcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICdoYXZpbmcnLFxuICAgICAgdHlwZTogJ3doZXJlV3JhcHBlZCcsXG4gICAgICB2YWx1ZTogY2FsbGJhY2ssXG4gICAgICBib29sOiB0aGlzLl9ib29sKClcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBBZGRzIGEgYHdoZXJlIGV4aXN0c2AgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgd2hlcmVFeGlzdHMoY2FsbGJhY2spIHtcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICd3aGVyZScsXG4gICAgICB0eXBlOiAnd2hlcmVFeGlzdHMnLFxuICAgICAgdmFsdWU6IGNhbGxiYWNrLFxuICAgICAgbm90OiB0aGlzLl9ub3QoKSxcbiAgICAgIGJvb2w6IHRoaXMuX2Jvb2woKSxcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBBZGRzIGFuIGBvciB3aGVyZSBleGlzdHNgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIG9yV2hlcmVFeGlzdHMoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5fYm9vbCgnb3InKS53aGVyZUV4aXN0cyhjYWxsYmFjayk7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIGB3aGVyZSBub3QgZXhpc3RzYCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICB3aGVyZU5vdEV4aXN0cyhjYWxsYmFjaykge1xuICAgIHJldHVybiB0aGlzLl9ub3QodHJ1ZSkud2hlcmVFeGlzdHMoY2FsbGJhY2spO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgb3Igd2hlcmUgbm90IGV4aXN0c2AgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgb3JXaGVyZU5vdEV4aXN0cyhjYWxsYmFjaykge1xuICAgIHJldHVybiB0aGlzLl9ib29sKCdvcicpLndoZXJlTm90RXhpc3RzKGNhbGxiYWNrKTtcbiAgfSxcblxuICAvLyBBZGRzIGEgYHdoZXJlIGluYCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICB3aGVyZUluKGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWVzKSAmJiBpc0VtcHR5KHZhbHVlcykpIHJldHVybiB0aGlzLndoZXJlKHRoaXMuX25vdCgpKTtcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICd3aGVyZScsXG4gICAgICB0eXBlOiAnd2hlcmVJbicsXG4gICAgICBjb2x1bW4sXG4gICAgICB2YWx1ZTogdmFsdWVzLFxuICAgICAgbm90OiB0aGlzLl9ub3QoKSxcbiAgICAgIGJvb2w6IHRoaXMuX2Jvb2woKVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgb3Igd2hlcmUgaW5gIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIG9yV2hlcmVJbihjb2x1bW4sIHZhbHVlcykge1xuICAgIHJldHVybiB0aGlzLl9ib29sKCdvcicpLndoZXJlSW4oY29sdW1uLCB2YWx1ZXMpO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgd2hlcmUgbm90IGluYCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICB3aGVyZU5vdEluKGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgcmV0dXJuIHRoaXMuX25vdCh0cnVlKS53aGVyZUluKGNvbHVtbiwgdmFsdWVzKTtcbiAgfSxcblxuICAvLyBBZGRzIGEgYG9yIHdoZXJlIG5vdCBpbmAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgb3JXaGVyZU5vdEluKGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Jvb2woJ29yJykuX25vdCh0cnVlKS53aGVyZUluKGNvbHVtbiwgdmFsdWVzKTtcbiAgfSxcblxuICAvLyBBZGRzIGEgYHdoZXJlIG51bGxgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIHdoZXJlTnVsbChjb2x1bW4pIHtcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICd3aGVyZScsXG4gICAgICB0eXBlOiAnd2hlcmVOdWxsJyxcbiAgICAgIGNvbHVtbixcbiAgICAgIG5vdDogdGhpcy5fbm90KCksXG4gICAgICBib29sOiB0aGlzLl9ib29sKClcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBBZGRzIGEgYG9yIHdoZXJlIG51bGxgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIG9yV2hlcmVOdWxsKGNvbHVtbikge1xuICAgIHJldHVybiB0aGlzLl9ib29sKCdvcicpLndoZXJlTnVsbChjb2x1bW4pO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgd2hlcmUgbm90IG51bGxgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIHdoZXJlTm90TnVsbChjb2x1bW4pIHtcbiAgICByZXR1cm4gdGhpcy5fbm90KHRydWUpLndoZXJlTnVsbChjb2x1bW4pO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgb3Igd2hlcmUgbm90IG51bGxgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIG9yV2hlcmVOb3ROdWxsKGNvbHVtbikge1xuICAgIHJldHVybiB0aGlzLl9ib29sKCdvcicpLndoZXJlTm90TnVsbChjb2x1bW4pO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgd2hlcmUgYmV0d2VlbmAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgd2hlcmVCZXR3ZWVuKGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodmFsdWVzKSwgJ1RoZSBzZWNvbmQgYXJndW1lbnQgdG8gd2hlcmVCZXR3ZWVuIG11c3QgYmUgYW4gYXJyYXkuJylcbiAgICBhc3NlcnQodmFsdWVzLmxlbmd0aCA9PT0gMiwgJ1lvdSBtdXN0IHNwZWNpZnkgMiB2YWx1ZXMgZm9yIHRoZSB3aGVyZUJldHdlZW4gY2xhdXNlJylcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICd3aGVyZScsXG4gICAgICB0eXBlOiAnd2hlcmVCZXR3ZWVuJyxcbiAgICAgIGNvbHVtbixcbiAgICAgIHZhbHVlOiB2YWx1ZXMsXG4gICAgICBub3Q6IHRoaXMuX25vdCgpLFxuICAgICAgYm9vbDogdGhpcy5fYm9vbCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIGB3aGVyZSBub3QgYmV0d2VlbmAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgd2hlcmVOb3RCZXR3ZWVuKGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgcmV0dXJuIHRoaXMuX25vdCh0cnVlKS53aGVyZUJldHdlZW4oY29sdW1uLCB2YWx1ZXMpO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgb3Igd2hlcmUgYmV0d2VlbmAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgb3JXaGVyZUJldHdlZW4oY29sdW1uLCB2YWx1ZXMpIHtcbiAgICByZXR1cm4gdGhpcy5fYm9vbCgnb3InKS53aGVyZUJldHdlZW4oY29sdW1uLCB2YWx1ZXMpO1xuICB9LFxuXG4gIC8vIEFkZHMgYSBgb3Igd2hlcmUgbm90IGJldHdlZW5gIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIG9yV2hlcmVOb3RCZXR3ZWVuKGNvbHVtbiwgdmFsdWVzKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Jvb2woJ29yJykud2hlcmVOb3RCZXR3ZWVuKGNvbHVtbiwgdmFsdWVzKTtcbiAgfSxcblxuICAvLyBBZGRzIGEgYGdyb3VwIGJ5YCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICBncm91cEJ5KGl0ZW0pIHtcbiAgICBpZiAoaXRlbSBpbnN0YW5jZW9mIFJhdykge1xuICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBCeVJhdy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICdncm91cCcsXG4gICAgICB0eXBlOiAnZ3JvdXBCeUJhc2ljJyxcbiAgICAgIHZhbHVlOiBoZWxwZXJzLm5vcm1hbGl6ZUFyci5hcHBseShudWxsLCBhcmd1bWVudHMpXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIHJhdyBgZ3JvdXAgYnlgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIGdyb3VwQnlSYXcoc3FsLCBiaW5kaW5ncykge1xuICAgIGNvbnN0IHJhdyA9IChzcWwgaW5zdGFuY2VvZiBSYXcgPyBzcWwgOiB0aGlzLmNsaWVudC5yYXcoc3FsLCBiaW5kaW5ncykpO1xuICAgIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgICBncm91cGluZzogJ2dyb3VwJyxcbiAgICAgIHR5cGU6ICdncm91cEJ5UmF3JyxcbiAgICAgIHZhbHVlOiByYXdcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBBZGRzIGEgYG9yZGVyIGJ5YCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICBvcmRlckJ5KGNvbHVtbiwgZGlyZWN0aW9uKSB7XG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnb3JkZXInLFxuICAgICAgdHlwZTogJ29yZGVyQnlCYXNpYycsXG4gICAgICB2YWx1ZTogY29sdW1uLFxuICAgICAgZGlyZWN0aW9uXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gQWRkIGEgcmF3IGBvcmRlciBieWAgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgb3JkZXJCeVJhdyhzcWwsIGJpbmRpbmdzKSB7XG4gICAgY29uc3QgcmF3ID0gKHNxbCBpbnN0YW5jZW9mIFJhdyA/IHNxbCA6IHRoaXMuY2xpZW50LnJhdyhzcWwsIGJpbmRpbmdzKSk7XG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnb3JkZXInLFxuICAgICAgdHlwZTogJ29yZGVyQnlSYXcnLFxuICAgICAgdmFsdWU6IHJhd1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIEFkZCBhIHVuaW9uIHN0YXRlbWVudCB0byB0aGUgcXVlcnkuXG4gIHVuaW9uKGNhbGxiYWNrcywgd3JhcCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxIHx8XG4gICAgICAgIChhcmd1bWVudHMubGVuZ3RoID09PSAyICYmIGlzQm9vbGVhbih3cmFwKSkpIHtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShjYWxsYmFja3MpKSB7XG4gICAgICAgIGNhbGxiYWNrcyA9IFtjYWxsYmFja3NdO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBjYWxsYmFja3MubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgICAgICAgZ3JvdXBpbmc6ICd1bmlvbicsXG4gICAgICAgICAgY2xhdXNlOiAndW5pb24nLFxuICAgICAgICAgIHZhbHVlOiBjYWxsYmFja3NbaV0sXG4gICAgICAgICAgd3JhcDogd3JhcCB8fCBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2tzID0gdG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDAsIGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICAgIHdyYXAgPSBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKCFpc0Jvb2xlYW4od3JhcCkpIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2god3JhcCk7XG4gICAgICAgIHdyYXAgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHRoaXMudW5pb24oY2FsbGJhY2tzLCB3cmFwKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIHVuaW9uIGFsbCBzdGF0ZW1lbnQgdG8gdGhlIHF1ZXJ5LlxuICB1bmlvbkFsbChjYWxsYmFjaywgd3JhcCkge1xuICAgIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgICBncm91cGluZzogJ3VuaW9uJyxcbiAgICAgIGNsYXVzZTogJ3VuaW9uIGFsbCcsXG4gICAgICB2YWx1ZTogY2FsbGJhY2ssXG4gICAgICB3cmFwOiB3cmFwIHx8IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gQWRkcyBhIGBoYXZpbmdgIGNsYXVzZSB0byB0aGUgcXVlcnkuXG4gIGhhdmluZyhjb2x1bW4sIG9wZXJhdG9yLCB2YWx1ZSkge1xuICAgIGlmIChjb2x1bW4gaW5zdGFuY2VvZiBSYXcgJiYgYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2hhdmluZ1Jhdyhjb2x1bW4pO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHRoZSBjb2x1bW4gaXMgYSBmdW5jdGlvbiwgaW4gd2hpY2ggY2FzZSBpdCdzXG4gICAgLy8gYSBoYXZpbmcgc3RhdGVtZW50IHdyYXBwZWQgaW4gcGFyZW5zLlxuICAgIGlmICh0eXBlb2YgY29sdW1uID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdGhpcy5oYXZpbmdXcmFwcGVkKGNvbHVtbik7XG4gICAgfVxuXG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnaGF2aW5nJyxcbiAgICAgIHR5cGU6ICdoYXZpbmdCYXNpYycsXG4gICAgICBjb2x1bW4sXG4gICAgICBvcGVyYXRvcixcbiAgICAgIHZhbHVlLFxuICAgICAgYm9vbDogdGhpcy5fYm9vbCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8vIEFkZHMgYW4gYG9yIGhhdmluZ2AgY2xhdXNlIHRvIHRoZSBxdWVyeS5cbiAgb3JIYXZpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Jvb2woJ29yJykuaGF2aW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0sXG4gIGhhdmluZ1JhdyhzcWwsIGJpbmRpbmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hhdmluZ1JhdyhzcWwsIGJpbmRpbmdzKTtcbiAgfSxcbiAgb3JIYXZpbmdSYXcoc3FsLCBiaW5kaW5ncykge1xuICAgIHJldHVybiB0aGlzLl9ib29sKCdvcicpLmhhdmluZ1JhdyhzcWwsIGJpbmRpbmdzKTtcbiAgfSxcbiAgLy8gQWRkcyBhIHJhdyBgaGF2aW5nYCBjbGF1c2UgdG8gdGhlIHF1ZXJ5LlxuICBfaGF2aW5nUmF3KHNxbCwgYmluZGluZ3MpIHtcbiAgICBjb25zdCByYXcgPSAoc3FsIGluc3RhbmNlb2YgUmF3ID8gc3FsIDogdGhpcy5jbGllbnQucmF3KHNxbCwgYmluZGluZ3MpKTtcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICdoYXZpbmcnLFxuICAgICAgdHlwZTogJ2hhdmluZ1JhdycsXG4gICAgICB2YWx1ZTogcmF3LFxuICAgICAgYm9vbDogdGhpcy5fYm9vbCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gT25seSBhbGxvdyBhIHNpbmdsZSBcIm9mZnNldFwiIHRvIGJlIHNldCBmb3IgdGhlIGN1cnJlbnQgcXVlcnkuXG4gIG9mZnNldCh2YWx1ZSkge1xuICAgIHRoaXMuX3NpbmdsZS5vZmZzZXQgPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBPbmx5IGFsbG93IGEgc2luZ2xlIFwibGltaXRcIiB0byBiZSBzZXQgZm9yIHRoZSBjdXJyZW50IHF1ZXJ5LlxuICBsaW1pdCh2YWx1ZSkge1xuICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KHZhbHVlLCAxMClcbiAgICBpZiAoaXNOYU4odmFsKSkge1xuICAgICAgaGVscGVycy53YXJuKCdBIHZhbGlkIGludGVnZXIgbXVzdCBiZSBwcm92aWRlZCB0byBsaW1pdCcpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NpbmdsZS5saW1pdCA9IHZhbDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gUmV0cmlldmUgdGhlIFwiY291bnRcIiByZXN1bHQgb2YgdGhlIHF1ZXJ5LlxuICBjb3VudChjb2x1bW4pIHtcbiAgICByZXR1cm4gdGhpcy5fYWdncmVnYXRlKCdjb3VudCcsIChjb2x1bW4gfHwgJyonKSk7XG4gIH0sXG5cbiAgLy8gUmV0cmlldmUgdGhlIG1pbmltdW0gdmFsdWUgb2YgYSBnaXZlbiBjb2x1bW4uXG4gIG1pbihjb2x1bW4pIHtcbiAgICByZXR1cm4gdGhpcy5fYWdncmVnYXRlKCdtaW4nLCBjb2x1bW4pO1xuICB9LFxuXG4gIC8vIFJldHJpZXZlIHRoZSBtYXhpbXVtIHZhbHVlIG9mIGEgZ2l2ZW4gY29sdW1uLlxuICBtYXgoY29sdW1uKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FnZ3JlZ2F0ZSgnbWF4JywgY29sdW1uKTtcbiAgfSxcblxuICAvLyBSZXRyaWV2ZSB0aGUgc3VtIG9mIHRoZSB2YWx1ZXMgb2YgYSBnaXZlbiBjb2x1bW4uXG4gIHN1bShjb2x1bW4pIHtcbiAgICByZXR1cm4gdGhpcy5fYWdncmVnYXRlKCdzdW0nLCBjb2x1bW4pO1xuICB9LFxuXG4gIC8vIFJldHJpZXZlIHRoZSBhdmVyYWdlIG9mIHRoZSB2YWx1ZXMgb2YgYSBnaXZlbiBjb2x1bW4uXG4gIGF2Zyhjb2x1bW4pIHtcbiAgICByZXR1cm4gdGhpcy5fYWdncmVnYXRlKCdhdmcnLCBjb2x1bW4pO1xuICB9LFxuXG4gIC8vIFJldHJpZXZlIHRoZSBcImNvdW50XCIgb2YgdGhlIGRpc3RpbmN0IHJlc3VsdHMgb2YgdGhlIHF1ZXJ5LlxuICBjb3VudERpc3RpbmN0KGNvbHVtbikge1xuICAgIHJldHVybiB0aGlzLl9hZ2dyZWdhdGUoJ2NvdW50JywgKGNvbHVtbiB8fCAnKicpLCB0cnVlKTtcbiAgfSxcblxuICAvLyBSZXRyaWV2ZSB0aGUgc3VtIG9mIHRoZSBkaXN0aW5jdCB2YWx1ZXMgb2YgYSBnaXZlbiBjb2x1bW4uXG4gIHN1bURpc3RpbmN0KGNvbHVtbikge1xuICAgIHJldHVybiB0aGlzLl9hZ2dyZWdhdGUoJ3N1bScsIGNvbHVtbiwgdHJ1ZSk7XG4gIH0sXG5cbiAgLy8gUmV0cmlldmUgdGhlIHZnIG9mIHRoZSBkaXN0aW5jdCByZXN1bHRzIG9mIHRoZSBxdWVyeS5cbiAgYXZnRGlzdGluY3QoY29sdW1uKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FnZ3JlZ2F0ZSgnYXZnJywgY29sdW1uLCB0cnVlKTtcbiAgfSxcblxuICAvLyBJbmNyZW1lbnRzIGEgY29sdW1uJ3MgdmFsdWUgYnkgdGhlIHNwZWNpZmllZCBhbW91bnQuXG4gIGluY3JlbWVudChjb2x1bW4sIGFtb3VudCkge1xuICAgIHJldHVybiB0aGlzLl9jb3VudGVyKGNvbHVtbiwgYW1vdW50KTtcbiAgfSxcblxuICAvLyBEZWNyZW1lbnRzIGEgY29sdW1uJ3MgdmFsdWUgYnkgdGhlIHNwZWNpZmllZCBhbW91bnQuXG4gIGRlY3JlbWVudChjb2x1bW4sIGFtb3VudCkge1xuICAgIHJldHVybiB0aGlzLl9jb3VudGVyKGNvbHVtbiwgYW1vdW50LCAnLScpO1xuICB9LFxuXG4gIC8vIFNldHMgdGhlIHZhbHVlcyBmb3IgYSBgc2VsZWN0YCBxdWVyeSwgaW5mb3JtaW5nIHRoYXQgb25seSB0aGUgZmlyc3RcbiAgLy8gcm93IHNob3VsZCBiZSByZXR1cm5lZCAobGltaXQgMSkuXG4gIGZpcnN0KCkge1xuICAgIGNvbnN0IGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2ldO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB0aGlzLl9tZXRob2QgPSAnZmlyc3QnO1xuICAgIHRoaXMubGltaXQoMSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gUGx1Y2sgYSBjb2x1bW4gZnJvbSBhIHF1ZXJ5LlxuICBwbHVjayhjb2x1bW4pIHtcbiAgICB0aGlzLl9tZXRob2QgPSAncGx1Y2snO1xuICAgIHRoaXMuX3NpbmdsZS5wbHVjayA9IGNvbHVtbjtcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICdjb2x1bW5zJyxcbiAgICAgIHR5cGU6ICdwbHVjaycsXG4gICAgICB2YWx1ZTogY29sdW1uXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gSW5zZXJ0ICYgVXBkYXRlXG4gIC8vIC0tLS0tLVxuXG4gIC8vIFNldHMgdGhlIHZhbHVlcyBmb3IgYW4gYGluc2VydGAgcXVlcnkuXG4gIGluc2VydCh2YWx1ZXMsIHJldHVybmluZykge1xuICAgIHRoaXMuX21ldGhvZCA9ICdpbnNlcnQnO1xuICAgIGlmICghaXNFbXB0eShyZXR1cm5pbmcpKSB0aGlzLnJldHVybmluZyhyZXR1cm5pbmcpO1xuICAgIHRoaXMuX3NpbmdsZS5pbnNlcnQgPSB2YWx1ZXNcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBTZXRzIHRoZSB2YWx1ZXMgZm9yIGFuIGB1cGRhdGVgLCBhbGxvd2luZyBmb3IgYm90aFxuICAvLyBgLnVwZGF0ZShrZXksIHZhbHVlLCBbcmV0dXJuaW5nXSlgIGFuZCBgLnVwZGF0ZShvYmosIFtyZXR1cm5pbmddKWAgc3ludGF4ZXMuXG4gIHVwZGF0ZSh2YWx1ZXMsIHJldHVybmluZykge1xuICAgIGxldCByZXQ7XG4gICAgY29uc3Qgb2JqID0gdGhpcy5fc2luZ2xlLnVwZGF0ZSB8fCB7fTtcbiAgICB0aGlzLl9tZXRob2QgPSAndXBkYXRlJztcbiAgICBpZiAoaXNTdHJpbmcodmFsdWVzKSkge1xuICAgICAgb2JqW3ZhbHVlc10gPSByZXR1cm5pbmc7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgcmV0ID0gYXJndW1lbnRzWzJdO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModmFsdWVzKTtcbiAgICAgIGlmICh0aGlzLl9zaW5nbGUudXBkYXRlKSB7XG4gICAgICAgIGhlbHBlcnMud2FybignVXBkYXRlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyB3aXRoIG9iamVjdHMuJylcbiAgICAgIH1cbiAgICAgIGxldCBpID0gLTE7XG4gICAgICB3aGlsZSAoKytpIDwga2V5cy5sZW5ndGgpIHtcbiAgICAgICAgb2JqW2tleXNbaV1dID0gdmFsdWVzW2tleXNbaV1dXG4gICAgICB9XG4gICAgICByZXQgPSBhcmd1bWVudHNbMV07XG4gICAgfVxuICAgIGlmICghaXNFbXB0eShyZXQpKSB0aGlzLnJldHVybmluZyhyZXQpO1xuICAgIHRoaXMuX3NpbmdsZS51cGRhdGUgPSBvYmo7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gU2V0cyB0aGUgcmV0dXJuaW5nIHZhbHVlIGZvciB0aGUgcXVlcnkuXG4gIHJldHVybmluZyhyZXR1cm5pbmcpIHtcbiAgICB0aGlzLl9zaW5nbGUucmV0dXJuaW5nID0gcmV0dXJuaW5nO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIERlbGV0ZVxuICAvLyAtLS0tLS1cblxuICAvLyBFeGVjdXRlcyBhIGRlbGV0ZSBzdGF0ZW1lbnQgb24gdGhlIHF1ZXJ5O1xuICBkZWxldGUocmV0KSB7XG4gICAgdGhpcy5fbWV0aG9kID0gJ2RlbCc7XG4gICAgaWYgKCFpc0VtcHR5KHJldCkpIHRoaXMucmV0dXJuaW5nKHJldCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cblxuICAvLyBUcnVuY2F0ZXMgYSB0YWJsZSwgZW5kcyB0aGUgcXVlcnkgY2hhaW4uXG4gIHRydW5jYXRlKHRhYmxlTmFtZSkge1xuICAgIHRoaXMuX21ldGhvZCA9ICd0cnVuY2F0ZSc7XG4gICAgaWYgKHRhYmxlTmFtZSkge1xuICAgICAgdGhpcy5fc2luZ2xlLnRhYmxlID0gdGFibGVOYW1lXG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIFJldHJpZXZlcyBjb2x1bW5zIGZvciB0aGUgdGFibGUgc3BlY2lmaWVkIGJ5IGBrbmV4KHRhYmxlTmFtZSlgXG4gIGNvbHVtbkluZm8oY29sdW1uKSB7XG4gICAgdGhpcy5fbWV0aG9kID0gJ2NvbHVtbkluZm8nO1xuICAgIHRoaXMuX3NpbmdsZS5jb2x1bW5JbmZvID0gY29sdW1uO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIFNldCBhIGxvY2sgZm9yIHVwZGF0ZSBjb25zdHJhaW50LlxuICBmb3JVcGRhdGUoKSB7XG4gICAgdGhpcy5fc2luZ2xlLmxvY2sgPSAnZm9yVXBkYXRlJztcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyBTZXQgYSBsb2NrIGZvciBzaGFyZSBjb25zdHJhaW50LlxuICBmb3JTaGFyZSgpIHtcbiAgICB0aGlzLl9zaW5nbGUubG9jayA9ICdmb3JTaGFyZSc7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLy8gVGFrZXMgYSBKUyBvYmplY3Qgb2YgbWV0aG9kcyB0byBjYWxsIGFuZCBjYWxscyB0aGVtXG4gIGZyb21KUyhvYmopIHtcbiAgICBlYWNoKG9iaiwgKHZhbCwga2V5KSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHRoaXNba2V5XSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBoZWxwZXJzLndhcm4oYEtuZXggRXJyb3I6IHVua25vd24ga2V5ICR7a2V5fWApXG4gICAgICB9XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgICAgIHRoaXNba2V5XS5hcHBseSh0aGlzLCB2YWwpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzW2tleV0odmFsKVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIHRoaXNcbiAgfSxcblxuICAvLyBQYXNzZXMgcXVlcnkgdG8gcHJvdmlkZWQgY2FsbGJhY2sgZnVuY3Rpb24sIHVzZWZ1bCBmb3IgZS5nLiBjb21wb3NpbmdcbiAgLy8gZG9tYWluLXNwZWNpZmljIGhlbHBlcnNcbiAgbW9kaWZ5KGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2suYXBwbHkodGhpcywgW3RoaXNdLmNvbmNhdCh0YWlsKGFyZ3VtZW50cykpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gSGVscGVyIGZvciB0aGUgaW5jcmVtZW50aW5nL2RlY3JlbWVudGluZyBxdWVyaWVzLlxuICBfY291bnRlcihjb2x1bW4sIGFtb3VudCwgc3ltYm9sKSB7XG4gICAgbGV0IGFtdCA9IHBhcnNlSW50KGFtb3VudCwgMTApO1xuICAgIGlmIChpc05hTihhbXQpKSBhbXQgPSAxO1xuICAgIHRoaXMuX21ldGhvZCA9ICdjb3VudGVyJztcbiAgICB0aGlzLl9zaW5nbGUuY291bnRlciA9IHtcbiAgICAgIGNvbHVtbixcbiAgICAgIGFtb3VudDogYW10LFxuICAgICAgc3ltYm9sOiAoc3ltYm9sIHx8ICcrJylcbiAgICB9O1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8vIEhlbHBlciB0byBnZXQgb3Igc2V0IHRoZSBcImJvb2xGbGFnXCIgdmFsdWUuXG4gIF9ib29sKHZhbCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICB0aGlzLl9ib29sRmxhZyA9IHZhbDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBjb25zdCByZXQgPSB0aGlzLl9ib29sRmxhZztcbiAgICB0aGlzLl9ib29sRmxhZyA9ICdhbmQnO1xuICAgIHJldHVybiByZXQ7XG4gIH0sXG5cbiAgLy8gSGVscGVyIHRvIGdldCBvciBzZXQgdGhlIFwibm90RmxhZ1wiIHZhbHVlLlxuICBfbm90KHZhbCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICB0aGlzLl9ub3RGbGFnID0gdmFsO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGNvbnN0IHJldCA9IHRoaXMuX25vdEZsYWc7XG4gICAgdGhpcy5fbm90RmxhZyA9IGZhbHNlO1xuICAgIHJldHVybiByZXQ7XG4gIH0sXG5cbiAgLy8gSGVscGVyIHRvIGdldCBvciBzZXQgdGhlIFwiam9pbkZsYWdcIiB2YWx1ZS5cbiAgX2pvaW5UeXBlICh2YWwpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdGhpcy5fam9pbkZsYWcgPSB2YWw7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgY29uc3QgcmV0ID0gdGhpcy5fam9pbkZsYWcgfHwgJ2lubmVyJztcbiAgICB0aGlzLl9qb2luRmxhZyA9ICdpbm5lcic7XG4gICAgcmV0dXJuIHJldDtcbiAgfSxcblxuICAvLyBIZWxwZXIgZm9yIGNvbXBpbGluZyBhbnkgYWdncmVnYXRlIHF1ZXJpZXMuXG4gIF9hZ2dyZWdhdGUobWV0aG9kLCBjb2x1bW4sIGFnZ3JlZ2F0ZURpc3RpbmN0KSB7XG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnY29sdW1ucycsXG4gICAgICB0eXBlOiAnYWdncmVnYXRlJyxcbiAgICAgIG1ldGhvZCxcbiAgICAgIHZhbHVlOiBjb2x1bW4sXG4gICAgICBhZ2dyZWdhdGVEaXN0aW5jdDogYWdncmVnYXRlRGlzdGluY3QgfHwgZmFsc2VcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVpbGRlci5wcm90b3R5cGUsICdvcicsIHtcbiAgZ2V0ICgpIHtcbiAgICByZXR1cm4gdGhpcy5fYm9vbCgnb3InKTtcbiAgfVxufSk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWlsZGVyLnByb3RvdHlwZSwgJ25vdCcsIHtcbiAgZ2V0ICgpIHtcbiAgICByZXR1cm4gdGhpcy5fbm90KHRydWUpO1xuICB9XG59KTtcblxuQnVpbGRlci5wcm90b3R5cGUuc2VsZWN0ID0gQnVpbGRlci5wcm90b3R5cGUuY29sdW1uc1xuQnVpbGRlci5wcm90b3R5cGUuY29sdW1uID0gQnVpbGRlci5wcm90b3R5cGUuY29sdW1uc1xuQnVpbGRlci5wcm90b3R5cGUuYW5kV2hlcmVOb3QgPSBCdWlsZGVyLnByb3RvdHlwZS53aGVyZU5vdFxuQnVpbGRlci5wcm90b3R5cGUuYW5kV2hlcmUgPSBCdWlsZGVyLnByb3RvdHlwZS53aGVyZVxuQnVpbGRlci5wcm90b3R5cGUuYW5kV2hlcmVSYXcgPSBCdWlsZGVyLnByb3RvdHlwZS53aGVyZVJhd1xuQnVpbGRlci5wcm90b3R5cGUuYW5kV2hlcmVCZXR3ZWVuID0gQnVpbGRlci5wcm90b3R5cGUud2hlcmVCZXR3ZWVuXG5CdWlsZGVyLnByb3RvdHlwZS5hbmRXaGVyZU5vdEJldHdlZW4gPSBCdWlsZGVyLnByb3RvdHlwZS53aGVyZU5vdEJldHdlZW5cbkJ1aWxkZXIucHJvdG90eXBlLmFuZEhhdmluZyA9IEJ1aWxkZXIucHJvdG90eXBlLmhhdmluZ1xuQnVpbGRlci5wcm90b3R5cGUuZnJvbSA9IEJ1aWxkZXIucHJvdG90eXBlLnRhYmxlXG5CdWlsZGVyLnByb3RvdHlwZS5pbnRvID0gQnVpbGRlci5wcm90b3R5cGUudGFibGVcbkJ1aWxkZXIucHJvdG90eXBlLmRlbCA9IEJ1aWxkZXIucHJvdG90eXBlLmRlbGV0ZVxuXG4vLyBBdHRhY2ggYWxsIG9mIHRoZSB0b3AgbGV2ZWwgcHJvbWlzZSBtZXRob2RzIHRoYXQgc2hvdWxkIGJlIGNoYWluYWJsZS5cbnJlcXVpcmUoJy4uL2ludGVyZmFjZScpKEJ1aWxkZXIpO1xuXG5leHBvcnQgZGVmYXVsdCBCdWlsZGVyO1xuIl19