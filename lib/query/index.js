// Builder
// -------
module.exports = function(client) {
  var _           = require('lodash');

  var Raw         = require('../raw');
  var SqlString   = require('../sqlstring');
  var JoinClause  = require('./joinclause');

  var helpers  = require('../helpers');
  var bindings = helpers.bindings;
  var single   = helpers.single;

  // Constructor for the builder instance, typically called from
  // `knex.builder`, accepting the current `knex` instance,
  // and pulling out the `client` and `grammar` from the current
  // knex instance.
  var QueryBuilder = function() {
    this.statements = [];
    this.errors     = [];
    this.flags      = {};

    // The "method" defaults to select unless otherwise specified.
    this._method    = 'select';

    // Internal flags used in the builder.
    this._joinFlag  = 'inner';
    this._boolFlag  = 'and';
  };

  QueryBuilder.prototype = {

    constructor: QueryBuilder,

    toString: function() {
      helpers.deprecate('The toString method is deprecated, please use `toQuery` instead.');
      return this.toQuery();

      // Next minor release:
      // return '[object Knex:QueryBuilder]';
    },

    toJSON: function() {
      return this.statements;
    },

    // Convert the current object `toString`. Assumes there's a `toSql`
    // method returning an array of objects, each of which contains an
    // "sql" and "bindings" property. These are passed into the `SqlString.format`
    toQuery: function() {
      var data = this.toSql();
      if (this.errors.length > 0) throw this.errors[0];
      if (!_.isArray(data)) data = [data];
      return _.map(data, function(statement) {
        return SqlString.format(statement.sql, statement.bindings);
      }).join(';\n');
    },

    toSql: function(target) {
      return new client.QueryCompiler(this).compiled(target || this._method);
    },

    // Useful for debugging, allows tapping into the sql chain at a specific
    // point in the query building process.
    tapSql: function(handler) {
      var sql = this.toSql();
      handler(sql.sql, sql.bindings);
      return this;
    },

    // Create a shallow clone of the current query builder.
    clone: function() {
      var cloned = new client.QueryBuilder();
      cloned.statements = this.statements.slice();
      cloned.errors = this.errors.slice();
      cloned.flags = JSON.parse(JSON.stringify(this.flags));
      return cloned;
    },

    // Sets the `tableName` on the query.
    from: function() {
      return this.table.apply(this, arguments);
    },

    // Alias to "from", for "insert" statements
    // e.g. builder.insert({a: value}).into('tableName')
    into: function() {
      return this.table.apply(this, arguments);
    },

    table: single(function(tableName) {
      return {
        grouping: 'table',
        value: tableName
      };
    }),

    // Adds a column or columns to the list of "columns"
    // being selected on the query.
    column: function() {
      this.statements.push({
        grouping: 'columns',
        value: helpers.normalizeArr.apply(null, arguments)
      });
      return this;
    },
    columns: function() {
      return this.column.apply(this, arguments);
    },

    // Adds a `distinct` clause to the query.
    distinct: function() {
      this.statements.push({
        grouping: 'columns',
        value: helpers.normalizeArr.apply(null, arguments),
        distinct: true
      });
      return this;
    },

    // Adds a join clause to the query, allowing for advanced joins
    // with an anonymous function as the second argument.
    join: function(table, first, operator, second) {
      var i, l, args = new Array(arguments.length);
      for (i = 0; i < args.length; i++) {
        args[i] = arguments[i];
      }
      if (args.length === 5) {
        helpers.deprecate('The five argument join syntax is now deprecated, ' +
          'please check the docs and update your code.');
        return this._joinType(args[4]).join(table, first, operator, second);
      }
      var join;
      if (_.isFunction(first)) {
        if (args.length > 2) {
          helpers.deprecate('The [table, fn, type] join syntax is deprecated, ' +
            'please check the docs and update your code.');
          return this._joinType(args[2]).join(table, first);
        }
        join = new JoinClause(table, this._joinType());
        first.call(join, join);
      } else {
        join = new JoinClause(table, this._joinType());
        join.on.apply(join, args.slice(1));
      }
      this.statements.push(join);
      return this;
    },

    // JOIN blocks:
    innerJoin: function() {
      return this._joinType('inner').join.apply(this, arguments);
    },
    leftJoin: function() {
      return this._joinType('left').join.apply(this, arguments);
    },
    leftOuterJoin: function() {
      return this._joinType('left outer').join.apply(this, arguments);
    },
    rightJoin: function() {
      return this._joinType('right').join.apply(this, arguments);
    },
    rightOuterJoin: function() {
      return this._joinType('right outer').join.apply(this, arguments);
    },
    outerJoin: function() {
      return this._joinType('outer').join.apply(this, arguments);
    },
    fullOuterJoin: function() {
      return this._joinType('full outer').join.apply(this, arguments);
    },
    crossJoin: function() {
      return this._joinType('cross').join.apply(this, arguments);
    },

    // The where function can be used in several ways:
    // The most basic is `where(key, value)`, which expands to
    // where key = value.
    where: function(column, operator, value) {

      // Check if the column is a function, in which case it's
      // a where statement wrapped in parens.
      if (_.isFunction(column)) {
        return this.whereWrapped(column);
      }

      // Allow a raw statement to be passed along to the query.
      if (column instanceof Raw) return this.whereRaw(column);

      // Allows `where({id: 2})` syntax.
      if (_.isObject(column)) {
        var boolVal = this._bool();
        for (var key in column) {
          this[boolVal + 'Where'](key, '=', column[key]);
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
      if (value === null && operator === '=') {
        return this.whereNull(column);
      }

      this.statements.push({
        grouping: 'where',
        type: 'whereBasic',
        column: column,
        operator: operator,
        value: value,
        bool: this._bool()
      });
      return this;
    },

    // Alias to `where`, for internal builder consistency.
    andWhere: function() {
      return this.where.apply(this, arguments);
    },

    // Adds an `or where` clause to the query.
    orWhere: function() {
      return this._bool('or').where.apply(this, arguments);
    },

    // Adds a raw `where` clause to the query.
    whereRaw: function(sql, bindings) {
      var raw = (sql instanceof Raw ? sql : new Raw(sql, bindings));
      this.statements.push({
        grouping: 'where',
        type: 'whereRaw',
        value: raw,
        bool: this._bool()
      });
      return this;
    },

    // Helper for compiling any advanced `where` queries.
    whereWrapped: function(callback) {
      this.statements.push({
        grouping: 'where',
        type: 'whereWrapped',
        value: callback,
        bool: this._bool()
      });
      return this;
    },

    // Adds a raw `or where` clause to the query.
    orWhereRaw: function(sql, bindings) {
      return this._bool('or').whereRaw(sql, bindings);
    },

    // Adds a `where exists` clause to the query.
    whereExists: function(callback, not) {
      this.statements.push({
        grouping: 'where',
        type: 'whereExists',
        value: callback,
        not: not || false,
        bool: this._bool(),
      });
      return this;
    },

    // Adds an `or where exists` clause to the query.
    orWhereExists: function(callback) {
      return this._bool('or').whereExists(callback);
    },

    // Adds a `where not exists` clause to the query.
    whereNotExists: function(callback) {
      return this.whereExists(callback, true);
    },

    // Adds a `or where not exists` clause to the query.
    orWhereNotExists: function(callback) {
      return this._bool('or').whereExists(callback, true);
    },

    // Adds a `where in` clause to the query.
    whereIn: function(column, values, not) {
      this.statements.push({
        grouping: 'where',
        type: 'whereIn',
        column: column,
        value: values,
        not: not || false,
        bool: this._bool()
      });
      return this;
    },

    // Adds a `or where in` clause to the query.
    orWhereIn: function(column, values) {
      return this._bool('or').whereIn(column, values);
    },

    // Adds a `where not in` clause to the query.
    whereNotIn: function(column, values) {
      return this.whereIn(column, values, true);
    },

    // Adds a `or where not in` clause to the query.
    orWhereNotIn: function(column, values) {
      return this._bool('or').whereIn(column, values, true);
    },

    // Adds a `where null` clause to the query.
    whereNull: function(column, not) {
      this.statements.push({
        grouping: 'where',
        type: 'whereNull',
        column: column,
        not: not || false,
        bool: this._bool()
      });
      return this;
    },

    // Adds a `or where null` clause to the query.
    orWhereNull: function(column) {
      return this._bool('or').whereNull(column);
    },

    // Adds a `where not null` clause to the query.
    whereNotNull: function(column) {
      return this.whereNull(column, ' is not null');
    },

    // Adds a `or where not null` clause to the query.
    orWhereNotNull: function(column) {
      return this._bool('or').whereNull(column, ' is not null');
    },

    // Adds a `where between` clause to the query.
    whereBetween: function(column, values, not) {
      if (!_.isArray(values)) {
        return this._error('The second argument to whereBetween must be an array.');
      }
      if (values.length !== 2) {
        return this._error('You must specify 2 values for the whereBetween clause');
      }
      this.statements.push({
        grouping: 'where',
        type: 'whereBetween',
        column: column,
        value: values,
        not: not || false,
        bool: this._bool()
      });
      return this;
    },

    // Adds a `where not between` clause to the query.
    whereNotBetween: function(column, values) {
      return this.whereBetween(column, values, true);
    },

    // Adds a `or where between` clause to the query.
    orWhereBetween: function(column, values) {
      return this._bool('or').whereBetween(column, values);
    },

    // Adds a `or where not between` clause to the query.
    orWhereNotBetween: function(column, values) {
      return this._bool('or').whereNotBetwen(column, values);
    },

    // Adds a `group by` clause to the query.
    groupBy: function() {
      this.statements.push({
        grouping: 'group',
        value: helpers.normalizeArr.apply(null, arguments)
      });
      return this;
    },

    // Adds a `order by` clause to the query.
    orderBy: function(column, direction) {
      this.statements.push({
        grouping: 'order',
        value: column,
        direction: direction
      });
      return this;
    },

    // Add a union statement to the query.
    union: function(callback, wrap) {
      if (arguments.length > 1) {
        var args = new Array(arguments.length);
        for (var i = 0, l = args.length; i < l; i++) {
          args[i] = arguments[i];
          this.union(args[i]);
        }
        return this;
      }
      this.statements.push({
        grouping: 'union',
        clause: 'union',
        value: callback,
        wrap: wrap || false
      });
      return this;
    },

    // Adds a union all statement to the query.
    unionAll: function(callback, wrap) {
      this.statements.push({
        grouping: 'union',
        clause: 'union all',
        value: callback,
        wrap: wrap || false
      });
      return this;
    },

    // Adds a `having` clause to the query.
    having: function(column, operator, value) {
      if (column instanceof Raw && arguments.length === 1) {
        return this.havingRaw(column);
      }
      this.statements.push({
        grouping: 'having',
        type: 'havingBasic',
        column: column,
        operator: operator,
        value: value,
        bool: this._bool()
      });
      return this;
    },

    // Adds a raw `having` clause to the query.
    havingRaw: function(sql, bindings) {
      var raw = (sql instanceof Raw ? sql : new Raw(sql, bindings));
      this.statements.push({
        grouping: 'having',
        type: 'havingRaw',
        value: raw,
        bool: this._bool()
      });
      return this;
    },

    // Adds an `or having` clause to the query.
    orHaving: function(column, operator, value) {
      return this._bool('or').having(column, operator, value);
    },

    // Adds a raw `or having` clause to the query.
    orHavingRaw: function(sql, bindings) {
      return this._bool('or').havingRaw(sql, bindings);
    },

    offset: single(function(value) {
      return {
        grouping: 'offset',
        value: value
      };
    }),

    limit: single(function(value) {
      return {
        grouping: 'limit',
        value: value
      };
    }),

    // Retrieve the "count" result of the query.
    count: function(column) {
      return this._aggregate('count', (column || '*'));
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

    // Retrieve the average of the values of a given column.
    avg: function(column) {
      return this._aggregate('avg', column);
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
    select: function() {
      this._method = 'select';
      return this.column.apply(this, helpers.args.apply(null, arguments));
    },

    // Pluck a column from a query.
    pluck: function(column) {
      this._method = 'pluck';
      this.statements.push({
        grouping: 'column',
        type: 'pluck',
        value: column
      });
      return this;
    },

    // Sets the values for an `insert` query.
    insert: single(function(values, returning) {
      this._method = 'insert';
      if (!_.isEmpty(returning)) this.returning(returning);
      return {
        grouping: 'insert',
        value: values
      };
    }),

    // Sets the values for an `update` query.
    update: single(function(values, returning) {
      var ret, obj = {};
      this._method = 'update';
      var args = helpers.args.apply(null, arguments);
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
      return {
        grouping: 'update',
        columns: helpers.sortObject(obj)
      };
    }),

    // Alias to del.
    "delete": function() {
      return this.del.apply(this, arguments);
    },

    // Executes a delete statement on the query;
    del: function() {
      this._method = 'delete';
      return this;
    },

    // Truncates a table, ends the query chain.
    truncate: function() {
      this._method = 'truncate';
      return this;
    },

    // TODO: see if there's a more consistent way to do these

    // Sets the returning value for the query.
    returning: single(function(returning) {
      return {
        grouping: 'returning',
        value: returning
      };
    }),

    transacting: function(t) {
      this.flags.transacting = t;
      return this;
    },
    options: function(opts) {
      this.flags.options = this.flags.options || [];
      this.flags.options.push(opts);
      return this;
    },
    debug: function(val) {
      this.flags.debug = (val == null ? true : val);
      return this;
    },

    // ----------------------------------------------------------------------

    // Runs a "query chain" as created from the fluent-chain module.
    _runChain: function(chain) {
      var stack = chain.__stack;

      // Go over each of the items in the query stack,
      // and call the necessary method to process.
      for (var i = 0, l = stack.length; i < l; i++) {
        var len = this.statements.length;
        var obj = stack[i];
        this[obj.method].apply(this, obj.args);
      }
      return this;
    },

    // Helper for the incrementing/decrementing queries.
    _counter: function(column, amount, symbol) {
      var amt = parseInt(amount, 10);
      if (isNaN(amt)) amt = 1;
      var toUpdate = {};
      toUpdate[column] = new Raw(f.wrap(column) + ' ' + (symbol || '+') + ' ' + amt);
      return this.update(toUpdate);
    },

    // Helper to get or set the "boolFlag" value.
    _bool: function(val) {
      if (arguments.length === 1) {
        this._boolFlag = val;
        return this;
      }
      var ret = this._boolFlag;
      this._boolFlag = 'and';
      return ret;
    },

    // Helper to get or set the "joinFlag" value.
    _joinType: function (val) {
      if (arguments.length === 1) {
        this._joinFlag = val;
        return this;
      }
      var ret = this._joinFlag || 'inner';
      this._joinFlag = 'inner';
      return ret;
    },

    // Helper for compiling any aggregate queries.
    _aggregate: function(method, column) {
      this.statements.push({
        grouping: 'columns',
        type: 'aggregate',
        method: method,
        value: column
      });
      return this;
    },

    // Helper for notifying on errors in the query chain.
    _error: function(err) {
      this.errors.push(new Error(err));
      return this;
    }

  };

  // Attach the "then" method.
  QueryBuilder.prototype.then = function(onFulfilled, onRejected) {
    return client.runThen(this).then(onFulfilled, onRejected);
  };

  // Attach all of the top level promise methods that should be chainable.
  require('../coerceable')(QueryBuilder);

  QueryBuilder.extend = require('simple-extend');

  return QueryBuilder;
};