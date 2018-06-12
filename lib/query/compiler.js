'use strict';

exports.__esModule = true;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _defineProperties = require('babel-runtime/core-js/object/define-properties');

var _defineProperties2 = _interopRequireDefault(_defineProperties);

var _helpers = require('../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _raw = require('../raw');

var _raw2 = _interopRequireDefault(_raw);

var _joinclause = require('./joinclause');

var _joinclause2 = _interopRequireDefault(_joinclause);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _lodash = require('lodash');

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Query Compiler
// -------
var debugBindings = (0, _debug2.default)('knex:bindings');

// The "QueryCompiler" takes all of the query statements which
// have been gathered in the "QueryBuilder" and turns them into a
// properly formatted / bound query string.
function QueryCompiler(client, builder) {
  this.client = client;
  this.method = builder._method || 'select';
  this.options = builder._options;
  this.single = builder._single;
  this.timeout = builder._timeout || false;
  this.cancelOnTimeout = builder._cancelOnTimeout || false;
  this.grouped = (0, _lodash.groupBy)(builder._statements, 'grouping');
  this.formatter = client.formatter(builder);
}

var components = ['columns', 'join', 'where', 'union', 'group', 'having', 'order', 'limit', 'offset', 'lock'];

(0, _lodash.assign)(QueryCompiler.prototype, {

  // Used when the insert call is empty.
  _emptyInsertValue: 'default values',

  // Collapse the builder into a single object
  toSQL: function toSQL(method, tz) {
    var _this = this;

    this._undefinedInWhereClause = false;

    method = method || this.method;
    var val = this[method]() || '';

    var query = {
      method: method,
      options: (0, _lodash.reduce)(this.options, _lodash.assign, {}),
      timeout: this.timeout,
      cancelOnTimeout: this.cancelOnTimeout,
      bindings: this.formatter.bindings || [],
      __knexQueryUid: _uuid2.default.v4()
    };

    (0, _defineProperties2.default)(query, {
      toNative: {
        value: function value() {
          return {
            sql: _this.client.positionBindings(query.sql),
            bindings: _this.client.prepBindings(query.bindings)
          };
        },
        enumerable: false
      }
    });

    if ((0, _lodash.isString)(val)) {
      query.sql = val;
    } else {
      (0, _lodash.assign)(query, val);
    }

    if (method === 'select' || method === 'first') {
      if (this.single.as) {
        query.as = this.single.as;
      }
    }

    if (this._undefinedInWhereClause) {
      debugBindings(query.bindings);
      throw new Error('Undefined binding(s) detected when compiling ' + (method.toUpperCase() + ' query: ' + query.sql));
    }

    return query;
  },


  // Compiles the `select` statement, or nested sub-selects by calling each of
  // the component compilers, trimming out the empties, and returning a
  // generated query string.
  select: function select() {
    var _this2 = this;

    var sql = this.with();

    var statements = components.map(function (component) {
      return _this2[component](_this2);
    });
    sql += (0, _lodash.compact)(statements).join(' ');
    return sql;
  },
  pluck: function pluck() {
    var toPluck = this.single.pluck;
    if (toPluck.indexOf('.') !== -1) {
      toPluck = toPluck.split('.').slice(-1)[0];
    }
    return {
      sql: this.select(),
      pluck: toPluck
    };
  },


  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert: function insert() {
    var insertValues = this.single.insert || [];
    var sql = this.with() + ('insert into ' + this.tableName + ' ');
    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return '';
      }
    } else if ((typeof insertValues === 'undefined' ? 'undefined' : (0, _typeof3.default)(insertValues)) === 'object' && (0, _lodash.isEmpty)(insertValues)) {
      return sql + this._emptyInsertValue;
    }

    var insertData = this._prepInsert(insertValues);
    if (typeof insertData === 'string') {
      sql += insertData;
    } else {
      if (insertData.columns.length) {
        sql += '(' + this.formatter.columnize(insertData.columns);
        sql += ') values (';
        var i = -1;
        while (++i < insertData.values.length) {
          if (i !== 0) sql += '), (';
          sql += this.formatter.parameterize(insertData.values[i], this.client.valueForUndefined);
        }
        sql += ')';
      } else if (insertValues.length === 1 && insertValues[0]) {
        sql += this._emptyInsertValue;
      } else {
        sql = '';
      }
    }
    return sql;
  },


  // Compiles the "update" query.
  update: function update() {
    // Make sure tableName is processed by the formatter first.
    var tableName = this.tableName;

    var updateData = this._prepUpdate(this.single.update);
    var wheres = this.where();
    return this.with() + ('update ' + (this.single.only ? 'only ' : '') + tableName) + ' set ' + updateData.join(', ') + (wheres ? ' ' + wheres : '');
  },


  // Compiles the columns in the query, specifying if an item was distinct.
  columns: function columns() {
    var distinct = false;
    if (this.onlyUnions()) return '';
    var columns = this.grouped.columns || [];
    var i = -1,
        sql = [];
    if (columns) {
      while (++i < columns.length) {
        var stmt = columns[i];
        if (stmt.distinct) distinct = true;
        if (stmt.type === 'aggregate') {
          sql.push(this.aggregate(stmt));
        } else if (stmt.type === 'aggregateRaw') {
          sql.push(this.aggregateRaw(stmt));
        } else if (stmt.value && stmt.value.length > 0) {
          sql.push(this.formatter.columnize(stmt.value));
        }
      }
    }
    if (sql.length === 0) sql = ['*'];
    return 'select ' + (distinct ? 'distinct ' : '') + sql.join(', ') + (this.tableName ? ' from ' + (this.single.only ? 'only ' : '') + this.tableName : '');
  },
  _aggregate: function _aggregate(stmt) {
    var _this3 = this;

    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$aliasSeparator = _ref.aliasSeparator,
        aliasSeparator = _ref$aliasSeparator === undefined ? ' as ' : _ref$aliasSeparator,
        distinctParentheses = _ref.distinctParentheses;

    var value = stmt.value;
    var method = stmt.method;
    var distinct = stmt.aggregateDistinct ? 'distinct ' : '';
    var wrap = function wrap(identifier) {
      return _this3.formatter.wrap(identifier);
    };
    var addAlias = function addAlias(value, alias) {
      if (alias) {
        return value + aliasSeparator + wrap(alias);
      }
      return value;
    };
    var aggregateArray = function aggregateArray(value, alias) {
      var columns = value.map(wrap).join(', ');
      if (distinct) {
        var openParen = distinctParentheses ? '(' : ' ';
        var closeParen = distinctParentheses ? ')' : '';
        columns = distinct.trim() + openParen + columns + closeParen;
      }
      var aggregated = method + '(' + columns + ')';
      return addAlias(aggregated, alias);
    };
    var aggregateString = function aggregateString(value, alias) {
      var aggregated = method + '(' + (distinct + wrap(value)) + ')';
      return addAlias(aggregated, alias);
    };

    if (Array.isArray(value)) {
      return aggregateArray(value);
    }

    if ((typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) === 'object') {
      var keys = (0, _keys2.default)(value);
      var alias = keys[0];
      var column = value[alias];
      if (Array.isArray(column)) {
        return aggregateArray(column, alias);
      }
      return aggregateString(column, alias);
    }

    // Allows us to speciy an alias for the aggregate types.
    var splitOn = value.toLowerCase().indexOf(' as ');
    if (splitOn !== -1) {
      var _column = value.slice(0, splitOn);
      var _alias = value.slice(splitOn + 4);
      return aggregateString(_column, _alias);
    }

    return aggregateString(value);
  },
  aggregate: function aggregate(stmt) {
    return this._aggregate(stmt);
  },
  aggregateRaw: function aggregateRaw(stmt) {
    var distinct = stmt.aggregateDistinct ? 'distinct ' : '';
    return stmt.method + '(' + (distinct + this.formatter.unwrapRaw(stmt.value)) + ')';
  },


  // Compiles all each of the `join` clauses on the query,
  // including any nested join queries.
  join: function join() {
    var sql = '';
    var i = -1;
    var joins = this.grouped.join;
    if (!joins) return '';
    while (++i < joins.length) {
      var join = joins[i];
      var table = join.schema ? join.schema + '.' + join.table : join.table;
      if (i > 0) sql += ' ';
      if (join.joinType === 'raw') {
        sql += this.formatter.unwrapRaw(join.table);
      } else {
        sql += join.joinType + ' join ' + this.formatter.wrap(table);
        var ii = -1;
        while (++ii < join.clauses.length) {
          var clause = join.clauses[ii];
          if (ii > 0) {
            sql += ' ' + clause.bool + ' ';
          } else {
            sql += ' ' + (clause.type === 'onUsing' ? 'using' : 'on') + ' ';
          }
          var val = this[clause.type].call(this, clause);
          if (val) {
            sql += val;
          }
        }
      }
    }
    return sql;
  },
  onBetween: function onBetween(statement) {
    return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'between') + ' ' + (0, _lodash.map)(statement.value, (0, _lodash.bind)(this.formatter.parameter, this.formatter)).join(' and ');
  },
  onNull: function onNull(statement) {
    return this.formatter.wrap(statement.column) + ' is ' + this._not(statement, 'null');
  },
  onExists: function onExists(statement) {
    return this._not(statement, 'exists') + ' (' + this.formatter.rawOrFn(statement.value) + ')';
  },
  onIn: function onIn(statement) {
    if (Array.isArray(statement.column)) return this.multiOnIn(statement);
    return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'in ') + this.wrap(this.formatter.parameterize(statement.value));
  },
  multiOnIn: function multiOnIn(statement) {
    var i = -1,
        sql = '(' + this.formatter.columnize(statement.column) + ') ';
    sql += this._not(statement, 'in ') + '((';
    while (++i < statement.value.length) {
      if (i !== 0) sql += '),(';
      sql += this.formatter.parameterize(statement.value[i]);
    }
    return sql + '))';
  },


  // Compiles all `where` statements on the query.
  where: function where() {
    var wheres = this.grouped.where;
    if (!wheres) return;
    var sql = [];
    var i = -1;
    while (++i < wheres.length) {
      var stmt = wheres[i];
      if (stmt.hasOwnProperty('value') && helpers.containsUndefined(stmt.value)) {
        this._undefinedInWhereClause = true;
      }
      var val = this[stmt.type](stmt);
      if (val) {
        if (sql.length === 0) {
          sql[0] = 'where';
        } else {
          sql.push(stmt.bool);
        }
        sql.push(val);
      }
    }
    return sql.length > 1 ? sql.join(' ') : '';
  },
  group: function group() {
    return this._groupsOrders('group');
  },
  order: function order() {
    return this._groupsOrders('order');
  },


  // Compiles the `having` statements.
  having: function having() {
    var havings = this.grouped.having;
    if (!havings) return '';
    var sql = ['having'];
    for (var i = 0, l = havings.length; i < l; i++) {
      var s = havings[i];
      var val = this[s.type](s);
      if (val) {
        if (sql.length === 0) {
          sql[0] = 'where';
        }
        if (sql.length > 1 || sql.length === 1 && sql[0] !== 'having') {
          sql.push(s.bool);
        }
        sql.push(val);
      }
    }
    return sql.length > 1 ? sql.join(' ') : '';
  },
  havingRaw: function havingRaw(statement) {
    return this._not(statement, '') + this.formatter.unwrapRaw(statement.value);
  },
  havingWrapped: function havingWrapped(statement) {
    var val = this.formatter.rawOrFn(statement.value, 'where');
    return val && this._not(statement, '') + '(' + val.slice(6) + ')' || '';
  },
  havingBasic: function havingBasic(statement) {
    return this._not(statement, '') + this.formatter.wrap(statement.column) + ' ' + this.formatter.operator(statement.operator) + ' ' + this.formatter.parameter(statement.value);
  },
  havingNull: function havingNull(statement) {
    return this.formatter.wrap(statement.column) + ' is ' + this._not(statement, 'null');
  },
  havingExists: function havingExists(statement) {
    return this._not(statement, 'exists') + ' (' + this.formatter.rawOrFn(statement.value) + ')';
  },
  havingBetween: function havingBetween(statement) {
    return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'between') + ' ' + (0, _lodash.map)(statement.value, (0, _lodash.bind)(this.formatter.parameter, this.formatter)).join(' and ');
  },
  havingIn: function havingIn(statement) {
    if (Array.isArray(statement.column)) return this.multiHavingIn(statement);
    return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'in ') + this.wrap(this.formatter.parameterize(statement.value));
  },
  multiHavingIn: function multiHavingIn(statement) {
    var i = -1,
        sql = '(' + this.formatter.columnize(statement.column) + ') ';
    sql += this._not(statement, 'in ') + '((';
    while (++i < statement.value.length) {
      if (i !== 0) sql += '),(';
      sql += this.formatter.parameterize(statement.value[i]);
    }
    return sql + '))';
  },


  // Compile the "union" queries attached to the main query.
  union: function union() {
    var onlyUnions = this.onlyUnions();
    var unions = this.grouped.union;
    if (!unions) return '';
    var sql = '';
    for (var i = 0, l = unions.length; i < l; i++) {
      var union = unions[i];
      if (i > 0) sql += ' ';
      if (i > 0 || !onlyUnions) sql += union.clause + ' ';
      var statement = this.formatter.rawOrFn(union.value);
      if (statement) {
        if (union.wrap) sql += '(';
        sql += statement;
        if (union.wrap) sql += ')';
      }
    }
    return sql;
  },


  // If we haven't specified any columns or a `tableName`, we're assuming this
  // is only being used for unions.
  onlyUnions: function onlyUnions() {
    return !this.grouped.columns && this.grouped.union && !this.tableName;
  },
  limit: function limit() {
    var noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit) return '';
    return 'limit ' + this.formatter.parameter(this.single.limit);
  },
  offset: function offset() {
    if (!this.single.offset) return '';
    return 'offset ' + this.formatter.parameter(this.single.offset);
  },


  // Compiles a `delete` query.
  del: function del() {
    // Make sure tableName is processed by the formatter first.
    var tableName = this.tableName;

    var wheres = this.where();
    return this.with() + ('delete from ' + (this.single.only ? 'only ' : '') + tableName) + (wheres ? ' ' + wheres : '');
  },


  // Compiles a `truncate` query.
  truncate: function truncate() {
    return 'truncate ' + this.tableName;
  },


  // Compiles the "locks".
  lock: function lock() {
    if (this.single.lock) {
      return this[this.single.lock]();
    }
  },


  // Compile the "counter".
  counter: function counter() {
    var counter = this.single.counter;

    var toUpdate = {};
    toUpdate[counter.column] = this.client.raw(this.formatter.wrap(counter.column) + ' ' + (counter.symbol || '+') + ' ' + counter.amount);
    this.single.update = toUpdate;
    return this.update();
  },


  // On Clause
  // ------

  onWrapped: function onWrapped(clause) {
    var self = this;

    var wrapJoin = new _joinclause2.default();
    clause.value.call(wrapJoin, wrapJoin);

    var sql = '';
    wrapJoin.clauses.forEach(function (wrapClause, ii) {
      if (ii > 0) {
        sql += ' ' + wrapClause.bool + ' ';
      }
      var val = self[wrapClause.type](wrapClause);
      if (val) {
        sql += val;
      }
    });

    if (sql.length) {
      return '(' + sql + ')';
    }
    return '';
  },
  onBasic: function onBasic(clause) {
    return this.formatter.wrap(clause.column) + ' ' + this.formatter.operator(clause.operator) + ' ' + this.formatter.wrap(clause.value);
  },
  onRaw: function onRaw(clause) {
    return this.formatter.unwrapRaw(clause.value);
  },
  onUsing: function onUsing(clause) {
    return this.formatter.wrap(clause.column);
  },


  // Where Clause
  // ------

  whereIn: function whereIn(statement) {
    var columns = null;
    if (Array.isArray(statement.column)) {
      columns = '(' + this.formatter.columnize(statement.column) + ')';
    } else {
      columns = this.formatter.wrap(statement.column);
    }

    var values = this.formatter.values(statement.value);
    return columns + ' ' + this._not(statement, 'in ') + values;
  },
  whereNull: function whereNull(statement) {
    return this.formatter.wrap(statement.column) + ' is ' + this._not(statement, 'null');
  },


  // Compiles a basic "where" clause.
  whereBasic: function whereBasic(statement) {
    return this._not(statement, '') + this.formatter.wrap(statement.column) + ' ' + this.formatter.operator(statement.operator) + ' ' + this.formatter.parameter(statement.value);
  },
  whereExists: function whereExists(statement) {
    return this._not(statement, 'exists') + ' (' + this.formatter.rawOrFn(statement.value) + ')';
  },
  whereWrapped: function whereWrapped(statement) {
    var val = this.formatter.rawOrFn(statement.value, 'where');
    return val && this._not(statement, '') + '(' + val.slice(6) + ')' || '';
  },
  whereBetween: function whereBetween(statement) {
    return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'between') + ' ' + (0, _lodash.map)(statement.value, (0, _lodash.bind)(this.formatter.parameter, this.formatter)).join(' and ');
  },


  // Compiles a "whereRaw" query.
  whereRaw: function whereRaw(statement) {
    return this._not(statement, '') + this.formatter.unwrapRaw(statement.value);
  },
  wrap: function wrap(str) {
    if (str.charAt(0) !== '(') return '(' + str + ')';
    return str;
  },


  // Compiles all `with` statements on the query.
  with: function _with() {
    if (!this.grouped.with || !this.grouped.with.length) {
      return '';
    }
    var withs = this.grouped.with;
    if (!withs) return;
    var sql = [];
    var i = -1;
    while (++i < withs.length) {
      var stmt = withs[i];
      var val = this[stmt.type](stmt);
      sql.push(val);
    }
    return 'with ' + sql.join(', ') + ' ';
  },
  withWrapped: function withWrapped(statement) {
    var val = this.formatter.rawOrFn(statement.value);
    return val && this.formatter.columnize(statement.alias) + ' as (' + val + ')' || '';
  },


  // Determines whether to add a "not" prefix to the where clause.
  _not: function _not(statement, str) {
    if (statement.not) return 'not ' + str;
    return str;
  },
  _prepInsert: function _prepInsert(data) {
    var isRaw = this.formatter.rawOrFn(data);
    if (isRaw) return isRaw;
    var columns = [];
    var values = [];
    if (!Array.isArray(data)) data = data ? [data] : [];
    var i = -1;
    while (++i < data.length) {
      if (data[i] == null) break;
      if (i === 0) columns = (0, _keys2.default)(data[i]).sort();
      var row = new Array(columns.length);
      var keys = (0, _keys2.default)(data[i]);
      var j = -1;
      while (++j < keys.length) {
        var key = keys[j];
        var idx = columns.indexOf(key);
        if (idx === -1) {
          columns = columns.concat(key).sort();
          idx = columns.indexOf(key);
          var k = -1;
          while (++k < values.length) {
            values[k].splice(idx, 0, undefined);
          }
          row.splice(idx, 0, undefined);
        }
        row[idx] = data[i][key];
      }
      values.push(row);
    }
    return {
      columns: columns,
      values: values
    };
  },


  // "Preps" the update.
  _prepUpdate: function _prepUpdate(data) {
    data = (0, _lodash.omitBy)(data, _lodash.isUndefined);
    var vals = [];
    var columns = (0, _keys2.default)(data);
    var i = -1;
    while (++i < columns.length) {
      vals.push(this.formatter.wrap(columns[i]) + ' = ' + this.formatter.parameter(data[columns[i]]));
    }

    if ((0, _lodash.isEmpty)(vals)) {
      throw new Error(['Empty .update() call detected!', 'Update data does not contain any values to update.', 'This will result in a faulty query.'].join(' '));
    }

    return vals;
  },


  // Compiles the `order by` statements.
  _groupsOrders: function _groupsOrders(type) {
    var items = this.grouped[type];
    if (!items) return '';
    var formatter = this.formatter;

    var sql = items.map(function (item) {
      var column = item.value instanceof _raw2.default ? formatter.unwrapRaw(item.value) : formatter.columnize(item.value);
      var direction = type === 'order' && item.type !== 'orderByRaw' ? ' ' + formatter.direction(item.direction) : '';
      return column + direction;
    });
    return sql.length ? type + ' by ' + sql.join(', ') : '';
  }
});

QueryCompiler.prototype.first = QueryCompiler.prototype.select;

// Get the table name, wrapping it if necessary.
// Implemented as a property to prevent ordering issues as described in #704.
Object.defineProperty(QueryCompiler.prototype, 'tableName', {
  get: function get() {
    if (!this._tableName) {
      // Only call this.formatter.wrap() the first time this property is accessed.
      var tableName = this.single.table;
      var schemaName = this.single.schema;

      if (tableName && schemaName) tableName = schemaName + '.' + tableName;

      this._tableName = tableName ? this.formatter.wrap(tableName) : '';
    }
    return this._tableName;
  }
});

exports.default = QueryCompiler;
module.exports = exports['default'];