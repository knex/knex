
// Query Compiler
// -------
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _helpers = require('../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _raw = require('../raw');

var _raw2 = _interopRequireDefault(_raw);

var _joinclause = require('./joinclause');

var _joinclause2 = _interopRequireDefault(_joinclause);

var _lodash = require('lodash');

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

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
  this.grouped = _lodash.groupBy(builder._statements, 'grouping');
  this.formatter = client.formatter();
}

var components = ['columns', 'join', 'where', 'union', 'group', 'having', 'order', 'limit', 'offset', 'lock'];

_lodash.assign(QueryCompiler.prototype, {

  // Used when the insert call is empty.
  _emptyInsertValue: 'default values',

  // Collapse the builder into a single object
  toSQL: function toSQL(method, tz) {
    this._undefinedInWhereClause = false;

    method = method || this.method;
    var val = this[method]();
    var defaults = {
      method: method,
      options: _lodash.reduce(this.options, _lodash.assign, {}),
      timeout: this.timeout,
      cancelOnTimeout: this.cancelOnTimeout,
      bindings: this.formatter.bindings,
      __knexQueryUid: _nodeUuid2['default'].v4()
    };
    if (_lodash.isString(val)) {
      val = { sql: val };
    }

    defaults.bindings = defaults.bindings || [];

    if (method === 'select') {
      if (this.single.as) {
        defaults.as = this.single.as;
      }
    }

    if (this._undefinedInWhereClause) {
      throw new Error('Undefined binding(s) detected when compiling ' + (method.toUpperCase() + ' query: ' + val.sql));
    }

    defaults.bindings = this.client.prepBindings(defaults.bindings, tz);

    return _lodash.assign(defaults, val);
  },

  // Compiles the `select` statement, or nested sub-selects by calling each of
  // the component compilers, trimming out the empties, and returning a
  // generated query string.
  select: function select() {
    var _this = this;

    var statements = components.map(function (component) {
      return _this[component](_this);
    });
    return _lodash.compact(statements).join(' ');
  },

  pluck: function pluck() {
    return {
      sql: this.select(),
      pluck: this.single.pluck
    };
  },

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert: function insert() {
    var insertValues = this.single.insert || [];
    var sql = 'insert into ' + this.tableName + ' ';

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return '';
      }
    } else if (typeof insertValues === 'object' && _lodash.isEmpty(insertValues)) {
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
    return 'update ' + tableName + ' set ' + updateData.join(', ') + (wheres ? ' ' + wheres : '');
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
        } else if (stmt.value && stmt.value.length > 0) {
          sql.push(this.formatter.columnize(stmt.value));
        }
      }
    }
    if (sql.length === 0) sql = ['*'];
    return 'select ' + (distinct ? 'distinct ' : '') + sql.join(', ') + (this.tableName ? ' from ' + this.tableName : '');
  },

  aggregate: function aggregate(stmt) {
    var val = stmt.value;
    var splitOn = val.toLowerCase().indexOf(' as ');
    var distinct = stmt.aggregateDistinct ? 'distinct ' : '';
    // Allows us to speciy an alias for the aggregate types.
    if (splitOn !== -1) {
      var col = val.slice(0, splitOn);
      var alias = val.slice(splitOn + 4);
      return stmt.method + '(' + (distinct + this.formatter.wrap(col)) + ') ' + ('as ' + this.formatter.wrap(alias));
    }
    return stmt.method + '(' + (distinct + this.formatter.wrap(val)) + ')';
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
      var str = '';
      var s = havings[i];
      if (i !== 0) str = s.bool + ' ';
      if (s.type === 'havingBasic') {
        sql.push(str + this.formatter.columnize(s.column) + ' ' + this.formatter.operator(s.operator) + ' ' + this.formatter.parameter(s.value));
      } else {
        if (s.type === 'whereWrapped') {
          var val = this.whereWrapped(s);
          if (val) sql.push(val);
        } else {
          sql.push(str + this.formatter.unwrapRaw(s.value));
        }
      }
    }
    return sql.length > 1 ? sql.join(' ') : '';
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
    return 'delete from ' + tableName + (wheres ? ' ' + wheres : '');
  },

  // Compiles a `truncate` query.
  truncate: function truncate() {
    return 'truncate ' + this.tableName;
  },

  // Compiles the "locks".
  lock: function lock() {
    if (this.single.lock) {
      if (!this.client.transacting) {
        helpers.warn('You are attempting to perform a "lock" command outside of a transaction.');
      } else {
        return this[this.single.lock]();
      }
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

    var wrapJoin = new _joinclause2['default']();
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
    if (Array.isArray(statement.column)) return this.multiWhereIn(statement);
    return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'in ') + this.wrap(this.formatter.parameterize(statement.value));
  },

  multiWhereIn: function multiWhereIn(statement) {
    var i = -1,
        sql = '(' + this.formatter.columnize(statement.column) + ') ';
    sql += this._not(statement, 'in ') + '((';
    while (++i < statement.value.length) {
      if (i !== 0) sql += '),(';
      sql += this.formatter.parameterize(statement.value[i]);
    }
    return sql + '))';
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
    return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'between') + ' ' + _lodash.map(statement.value, _lodash.bind(this.formatter.parameter, this.formatter)).join(' and ');
  },

  // Compiles a "whereRaw" query.
  whereRaw: function whereRaw(statement) {
    return this._not(statement, '') + this.formatter.unwrapRaw(statement.value);
  },

  wrap: function wrap(str) {
    if (str.charAt(0) !== '(') return '(' + str + ')';
    return str;
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
      if (i === 0) columns = Object.keys(data[i]).sort();
      var row = new Array(columns.length);
      var keys = Object.keys(data[i]);
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
    data = _lodash.omitBy(data, _lodash.isUndefined);
    var vals = [];
    var sorted = Object.keys(data).sort();
    var i = -1;
    while (++i < sorted.length) {
      vals.push(this.formatter.wrap(sorted[i]) + ' = ' + this.formatter.parameter(data[sorted[i]]));
    }
    return vals;
  },

  // Compiles the `order by` statements.
  _groupsOrders: function _groupsOrders(type) {
    var items = this.grouped[type];
    if (!items) return '';
    var formatter = this.formatter;

    var sql = items.map(function (item) {
      var column = item.value instanceof _raw2['default'] ? formatter.unwrapRaw(item.value) : formatter.columnize(item.value);
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

exports['default'] = QueryCompiler;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9xdWVyeS9jb21waWxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozt1QkFHeUIsWUFBWTs7SUFBekIsT0FBTzs7bUJBQ0gsUUFBUTs7OzswQkFDRCxjQUFjOzs7O3NCQUs5QixRQUFROzt3QkFFRSxXQUFXOzs7Ozs7O0FBSzVCLFNBQVMsYUFBYSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUU7QUFDdEMsTUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7QUFDcEIsTUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLFFBQVEsQ0FBQztBQUMxQyxNQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7QUFDaEMsTUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0FBQzlCLE1BQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUM7QUFDekMsTUFBSSxDQUFDLGVBQWUsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLElBQUksS0FBSyxDQUFDO0FBQ3pELE1BQUksQ0FBQyxPQUFPLEdBQUcsZ0JBQVEsT0FBTyxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUN4RCxNQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQTtDQUNwQzs7QUFFRCxJQUFNLFVBQVUsR0FBRyxDQUNqQixTQUFTLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUM1QyxRQUFRLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUM3QyxDQUFDOztBQUVGLGVBQU8sYUFBYSxDQUFDLFNBQVMsRUFBRTs7O0FBRzlCLG1CQUFpQixFQUFFLGdCQUFnQjs7O0FBR25DLE9BQUssRUFBQSxlQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUU7QUFDaEIsUUFBSSxDQUFDLHVCQUF1QixHQUFHLEtBQUssQ0FBQzs7QUFFckMsVUFBTSxHQUFHLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFBO0FBQzlCLFFBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFBO0FBQ3hCLFFBQU0sUUFBUSxHQUFHO0FBQ2YsWUFBTSxFQUFOLE1BQU07QUFDTixhQUFPLEVBQUUsZUFBTyxJQUFJLENBQUMsT0FBTyxrQkFBVSxFQUFFLENBQUM7QUFDekMsYUFBTyxFQUFFLElBQUksQ0FBQyxPQUFPO0FBQ3JCLHFCQUFlLEVBQUUsSUFBSSxDQUFDLGVBQWU7QUFDckMsY0FBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUTtBQUNqQyxvQkFBYyxFQUFFLHNCQUFLLEVBQUUsRUFBRTtLQUMxQixDQUFDO0FBQ0YsUUFBSSxpQkFBUyxHQUFHLENBQUMsRUFBRTtBQUNqQixTQUFHLEdBQUcsRUFBQyxHQUFHLEVBQUUsR0FBRyxFQUFDLENBQUM7S0FDbEI7O0FBRUQsWUFBUSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQzs7QUFFNUMsUUFBSSxNQUFNLEtBQUssUUFBUSxFQUFFO0FBQ3ZCLFVBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUU7QUFDakIsZ0JBQVEsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7T0FDOUI7S0FDRjs7QUFFRCxRQUFHLElBQUksQ0FBQyx1QkFBdUIsRUFBRTtBQUMvQixZQUFNLElBQUksS0FBSyxDQUNiLG1EQUNHLE1BQU0sQ0FBQyxXQUFXLEVBQUUsZ0JBQVcsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUM1QyxDQUFDO0tBQ0g7O0FBRUQsWUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDOztBQUVwRSxXQUFPLGVBQU8sUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0dBQzlCOzs7OztBQUtELFFBQU0sRUFBQSxrQkFBRzs7O0FBQ1AsUUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFBLFNBQVM7YUFDekMsTUFBSyxTQUFTLENBQUMsT0FBTTtLQUFBLENBQ3RCLENBQUM7QUFDRixXQUFPLGdCQUFRLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztHQUN0Qzs7QUFFRCxPQUFLLEVBQUEsaUJBQUc7QUFDTixXQUFPO0FBQ0wsU0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDbEIsV0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSztLQUN6QixDQUFDO0dBQ0g7Ozs7QUFJRCxRQUFNLEVBQUEsa0JBQUc7QUFDUCxRQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7QUFDOUMsUUFBSSxHQUFHLG9CQUFrQixJQUFJLENBQUMsU0FBUyxNQUFHLENBQUM7O0FBRTNDLFFBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRTtBQUMvQixVQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQzdCLGVBQU8sRUFBRSxDQUFBO09BQ1Y7S0FDRixNQUFNLElBQUksT0FBTyxZQUFZLEtBQUssUUFBUSxJQUFJLGdCQUFRLFlBQVksQ0FBQyxFQUFFO0FBQ3BFLGFBQU8sR0FBRyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQTtLQUNwQzs7QUFFRCxRQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ2xELFFBQUksT0FBTyxVQUFVLEtBQUssUUFBUSxFQUFFO0FBQ2xDLFNBQUcsSUFBSSxVQUFVLENBQUM7S0FDbkIsTUFBTztBQUNOLFVBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDN0IsV0FBRyxVQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQUFBRSxDQUFBO0FBQ3pELFdBQUcsSUFBSSxZQUFZLENBQUE7QUFDbkIsWUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDVixlQUFPLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3JDLGNBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLElBQUksTUFBTSxDQUFBO0FBQzFCLGFBQUcsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtTQUN4RjtBQUNELFdBQUcsSUFBSSxHQUFHLENBQUM7T0FDWixNQUFNLElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ3ZELFdBQUcsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUE7T0FDOUIsTUFBTTtBQUNMLFdBQUcsR0FBRyxFQUFFLENBQUE7T0FDVDtLQUNGO0FBQ0QsV0FBTyxHQUFHLENBQUM7R0FDWjs7O0FBR0QsUUFBTSxFQUFBLGtCQUFHOztRQUVDLFNBQVMsR0FBSyxJQUFJLENBQWxCLFNBQVM7O0FBQ2pCLFFBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN4RCxRQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDNUIsV0FBTyxZQUFVLFNBQVMsR0FDeEIsT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQzlCLE1BQU0sU0FBTyxNQUFNLEdBQUssRUFBRSxDQUFBLEFBQUMsQ0FBQztHQUNoQzs7O0FBR0QsU0FBTyxFQUFBLG1CQUFHO0FBQ1IsUUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLFFBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFBO0FBQ2hDLFFBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQTtBQUMxQyxRQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFBRSxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ3JCLFFBQUksT0FBTyxFQUFFO0FBQ1gsYUFBTyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQzNCLFlBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4QixZQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsUUFBUSxHQUFHLElBQUksQ0FBQTtBQUNsQyxZQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssV0FBVyxFQUFFO0FBQzdCLGFBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO1NBQy9CLE1BQ0ksSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUM1QyxhQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO1NBQy9DO09BQ0Y7S0FDRjtBQUNELFFBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbEMsV0FBTyxhQUFVLFFBQVEsR0FBRyxXQUFXLEdBQUcsRUFBRSxDQUFBLEdBQzFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsY0FBWSxJQUFJLENBQUMsU0FBUyxHQUFLLEVBQUUsQ0FBQSxBQUFDLENBQUM7R0FDdEU7O0FBRUQsV0FBUyxFQUFBLG1CQUFDLElBQUksRUFBRTtBQUNkLFFBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDdkIsUUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNsRCxRQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsV0FBVyxHQUFHLEVBQUUsQ0FBQzs7QUFFM0QsUUFBSSxPQUFPLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDbEIsVUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDbEMsVUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDckMsYUFDRSxBQUFHLElBQUksQ0FBQyxNQUFNLFVBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBLG1CQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBRSxDQUNsQztLQUNIO0FBQ0QsV0FBVSxJQUFJLENBQUMsTUFBTSxVQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQSxPQUFJO0dBQ2pFOzs7O0FBSUQsTUFBSSxFQUFBLGdCQUFHO0FBQ0wsUUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ2IsUUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDWCxRQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNoQyxRQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDO0FBQ3RCLFdBQU8sRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTtBQUN6QixVQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEIsVUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBTSxJQUFJLENBQUMsTUFBTSxTQUFJLElBQUksQ0FBQyxLQUFLLEdBQUssSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN4RSxVQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQTtBQUNyQixVQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssS0FBSyxFQUFFO0FBQzNCLFdBQUcsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7T0FDNUMsTUFBTTtBQUNMLFdBQUcsSUFBSSxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUM1RCxZQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUNYLGVBQU8sRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDakMsY0FBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUMvQixjQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDVixlQUFHLFVBQVEsTUFBTSxDQUFDLElBQUksTUFBRyxDQUFDO1dBQzNCLE1BQU07QUFDTCxlQUFHLFdBQVEsTUFBTSxDQUFDLElBQUksS0FBSyxTQUFTLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQSxNQUFHLENBQUM7V0FDMUQ7QUFDRCxjQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDakQsY0FBSSxHQUFHLEVBQUU7QUFDUCxlQUFHLElBQUksR0FBRyxDQUFDO1dBQ1o7U0FDRjtPQUNGO0tBQ0Y7QUFDRCxXQUFPLEdBQUcsQ0FBQztHQUNaOzs7QUFHRCxPQUFLLEVBQUEsaUJBQUc7QUFDTixRQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztBQUNsQyxRQUFJLENBQUMsTUFBTSxFQUFFLE9BQU87QUFDcEIsUUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ2YsUUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDWCxXQUFPLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDMUIsVUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3RCLFVBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ3hFLFlBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUM7T0FDckM7QUFDRCxVQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ2pDLFVBQUksR0FBRyxFQUFFO0FBQ1AsWUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUNwQixhQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFBO1NBQ2pCLE1BQU07QUFDTCxhQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtTQUNwQjtBQUNELFdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7T0FDZDtLQUNGO0FBQ0QsV0FBTyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztHQUM1Qzs7QUFFRCxPQUFLLEVBQUEsaUJBQUc7QUFDTixXQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7R0FDcEM7O0FBRUQsT0FBSyxFQUFBLGlCQUFHO0FBQ04sV0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0dBQ3BDOzs7QUFHRCxRQUFNLEVBQUEsa0JBQUc7QUFDUCxRQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUNwQyxRQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO0FBQ3hCLFFBQU0sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdkIsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM5QyxVQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDYixVQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsVUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUNoQyxVQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssYUFBYSxFQUFFO0FBQzVCLFdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQ3JELElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7T0FDbEYsTUFBTTtBQUNMLFlBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxjQUFjLEVBQUM7QUFDM0IsY0FBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNoQyxjQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ3ZCLE1BQU07QUFDTCxhQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUNuRDtPQUNGO0tBQ0Y7QUFDRCxXQUFPLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0dBQzVDOzs7QUFHRCxPQUFLLEVBQUEsaUJBQUc7QUFDTixRQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDckMsUUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7QUFDbEMsUUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQztBQUN2QixRQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDYixTQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzdDLFVBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4QixVQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQztBQUN0QixVQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO0FBQ3BELFVBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN0RCxVQUFJLFNBQVMsRUFBRTtBQUNiLFlBQUksS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksR0FBRyxDQUFDO0FBQzNCLFdBQUcsSUFBSSxTQUFTLENBQUM7QUFDakIsWUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxHQUFHLENBQUM7T0FDNUI7S0FDRjtBQUNELFdBQU8sR0FBRyxDQUFDO0dBQ1o7Ozs7QUFJRCxZQUFVLEVBQUEsc0JBQUc7QUFDWCxXQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFFO0dBQ3pFOztBQUVELE9BQUssRUFBQSxpQkFBRztBQUNOLFFBQU0sT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDO0FBQzlELFFBQUksT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO0FBQ3ZCLHNCQUFnQixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFHO0dBQy9EOztBQUVELFFBQU0sRUFBQSxrQkFBRztBQUNQLFFBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQztBQUNuQyx1QkFBaUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBRztHQUNqRTs7O0FBR0QsS0FBRyxFQUFBLGVBQUc7O1FBRUksU0FBUyxHQUFLLElBQUksQ0FBbEIsU0FBUzs7QUFDakIsUUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzVCLFdBQU8saUJBQWUsU0FBUyxJQUM1QixNQUFNLFNBQU8sTUFBTSxHQUFLLEVBQUUsQ0FBQSxBQUFDLENBQUM7R0FDaEM7OztBQUdELFVBQVEsRUFBQSxvQkFBRztBQUNULHlCQUFtQixJQUFJLENBQUMsU0FBUyxDQUFHO0dBQ3JDOzs7QUFHRCxNQUFJLEVBQUEsZ0JBQUc7QUFDTCxRQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO0FBQ3BCLFVBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtBQUM1QixlQUFPLENBQUMsSUFBSSxDQUFDLDBFQUEwRSxDQUFDLENBQUE7T0FDekYsTUFBTTtBQUNMLGVBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQTtPQUNoQztLQUNGO0dBQ0Y7OztBQUdELFNBQU8sRUFBQSxtQkFBRztRQUNBLE9BQU8sR0FBSyxJQUFJLENBQUMsTUFBTSxDQUF2QixPQUFPOztBQUNmLFFBQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNwQixZQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FDNUUsR0FBRyxJQUFJLE9BQU8sQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFBLEFBQUMsR0FDN0IsR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN4QixRQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUM7QUFDOUIsV0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7R0FDdEI7Ozs7O0FBS0QsV0FBUyxFQUFBLG1CQUFDLE1BQU0sRUFBRTtBQUNoQixRQUFNLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWxCLFFBQU0sUUFBUSxHQUFHLDZCQUFnQixDQUFDO0FBQ2xDLFVBQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQzs7QUFFdEMsUUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ2IsWUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBUyxVQUFVLEVBQUUsRUFBRSxFQUFFO0FBQ2hELFVBQUksRUFBRSxHQUFHLENBQUMsRUFBRTtBQUNWLFdBQUcsVUFBUSxVQUFVLENBQUMsSUFBSSxNQUFHLENBQUM7T0FDL0I7QUFDRCxVQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlDLFVBQUksR0FBRyxFQUFFO0FBQ1AsV0FBRyxJQUFJLEdBQUcsQ0FBQztPQUNaO0tBQ0YsQ0FBQyxDQUFDOztBQUVILFFBQUksR0FBRyxDQUFDLE1BQU0sRUFBRTtBQUNkLG1CQUFXLEdBQUcsT0FBSTtLQUNuQjtBQUNELFdBQU8sRUFBRSxDQUFDO0dBQ1g7O0FBRUQsU0FBTyxFQUFBLGlCQUFDLE1BQU0sRUFBRTtBQUNkLFdBQ0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FDeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsR0FDOUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUNqQztHQUNIOztBQUVELE9BQUssRUFBQSxlQUFDLE1BQU0sRUFBRTtBQUNaLFdBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0dBQy9DOztBQUVELFNBQU8sRUFBQSxpQkFBQyxNQUFNLEVBQUU7QUFDZCxXQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztHQUMzQzs7Ozs7QUFLRCxTQUFPLEVBQUEsaUJBQUMsU0FBUyxFQUFFO0FBQ2pCLFFBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3pFLFdBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsR0FDOUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztHQUMzRDs7QUFFRCxjQUFZLEVBQUEsc0JBQUMsU0FBUyxFQUFFO0FBQ3RCLFFBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUFFLEdBQUcsU0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQUksQ0FBQTtBQUNwRSxPQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFBO0FBQ3pDLFdBQU8sRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUU7QUFDbkMsVUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUE7QUFDekIsU0FBRyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUN2RDtBQUNELFdBQU8sR0FBRyxHQUFHLElBQUksQ0FBQTtHQUNsQjs7QUFFRCxXQUFTLEVBQUEsbUJBQUMsU0FBUyxFQUFFO0FBQ25CLFdBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztHQUN0Rjs7O0FBR0QsWUFBVSxFQUFBLG9CQUFDLFNBQVMsRUFBRTtBQUNwQixXQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxHQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUMzQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxHQUNqRCxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDN0M7O0FBRUQsYUFBVyxFQUFBLHFCQUFDLFNBQVMsRUFBRTtBQUNyQixXQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDO0dBQzlGOztBQUVELGNBQVksRUFBQSxzQkFBQyxTQUFTLEVBQUU7QUFDdEIsUUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQTtBQUM1RCxXQUFPLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksRUFBRSxDQUFDO0dBQ3pFOztBQUVELGNBQVksRUFBQSxzQkFBQyxTQUFTLEVBQUU7QUFDdEIsV0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxHQUFHLEdBQUcsR0FDeEYsWUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFLGFBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0dBQ3RGOzs7QUFHRCxVQUFRLEVBQUEsa0JBQUMsU0FBUyxFQUFFO0FBQ2xCLFdBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0dBQzdFOztBQUVELE1BQUksRUFBQSxjQUFDLEdBQUcsRUFBRTtBQUNSLFFBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsYUFBVyxHQUFHLE9BQUk7QUFDN0MsV0FBTyxHQUFHLENBQUM7R0FDWjs7O0FBR0QsTUFBSSxFQUFBLGNBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtBQUNuQixRQUFJLFNBQVMsQ0FBQyxHQUFHLEVBQUUsZ0JBQWMsR0FBRyxDQUFHO0FBQ3ZDLFdBQU8sR0FBRyxDQUFDO0dBQ1o7O0FBRUQsYUFBVyxFQUFBLHFCQUFDLElBQUksRUFBRTtBQUNoQixRQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMzQyxRQUFJLEtBQUssRUFBRSxPQUFPLEtBQUssQ0FBQztBQUN4QixRQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDakIsUUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFFBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDcEQsUUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDVixXQUFPLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDeEIsVUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFFLE1BQU07QUFDM0IsVUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ2xELFVBQU0sR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUNyQyxVQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ2pDLFVBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQ1YsYUFBTyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ3hCLFlBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQixZQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLFlBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQ2QsaUJBQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ3BDLGFBQUcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQzFCLGNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQ1YsaUJBQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUMxQixrQkFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFBO1dBQ3BDO0FBQ0QsYUFBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFBO1NBQzlCO0FBQ0QsV0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtPQUN4QjtBQUNELFlBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDakI7QUFDRCxXQUFPO0FBQ0wsYUFBTyxFQUFQLE9BQU87QUFDUCxZQUFNLEVBQU4sTUFBTTtLQUNQLENBQUM7R0FDSDs7O0FBR0QsYUFBVyxFQUFBLHFCQUFDLElBQUksRUFBRTtBQUNoQixRQUFJLEdBQUcsZUFBTyxJQUFJLHNCQUFjLENBQUE7QUFDaEMsUUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFBO0FBQ2YsUUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUN2QyxRQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUNWLFdBQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUMxQixVQUFJLENBQUMsSUFBSSxDQUNQLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUM5QixLQUFLLEdBQ0wsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQzFDLENBQUM7S0FDSDtBQUNELFdBQU8sSUFBSSxDQUFDO0dBQ2I7OztBQUdELGVBQWEsRUFBQSx1QkFBQyxJQUFJLEVBQUU7QUFDbEIsUUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqQyxRQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ2QsU0FBUyxHQUFLLElBQUksQ0FBbEIsU0FBUzs7QUFDakIsUUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFBLElBQUksRUFBSTtBQUM1QixVQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyw0QkFBZSxHQUNwQyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FDL0IsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEMsVUFBTSxTQUFTLEdBQUcsSUFBSSxLQUFLLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFlBQVksU0FDeEQsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQ3ZDLEVBQUUsQ0FBQztBQUNQLGFBQU8sTUFBTSxHQUFHLFNBQVMsQ0FBQztLQUMzQixDQUFDLENBQUM7QUFDSCxXQUFPLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztHQUN6RDs7Q0FFRixDQUFDLENBQUE7O0FBRUYsYUFBYSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7Ozs7QUFJL0QsTUFBTSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRTtBQUMxRCxLQUFHLEVBQUEsZUFBRztBQUNKLFFBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFOztBQUVuQixVQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNsQyxVQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQzs7QUFFdEMsVUFBSSxTQUFTLElBQUksVUFBVSxFQUFFLFNBQVMsR0FBTSxVQUFVLFNBQUksU0FBUyxBQUFFLENBQUM7O0FBRXRFLFVBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztLQUNuRTtBQUNELFdBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztHQUN4QjtDQUNGLENBQUMsQ0FBQzs7cUJBR1ksYUFBYSIsImZpbGUiOiJjb21waWxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8gUXVlcnkgQ29tcGlsZXJcbi8vIC0tLS0tLS1cbmltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi4vaGVscGVycyc7XG5pbXBvcnQgUmF3IGZyb20gJy4uL3Jhdyc7XG5pbXBvcnQgSm9pbkNsYXVzZSBmcm9tICcuL2pvaW5jbGF1c2UnO1xuXG5pbXBvcnQge1xuICBhc3NpZ24sIGJpbmQsIGNvbXBhY3QsIGdyb3VwQnksIGlzRW1wdHksIGlzU3RyaW5nLCBpc1VuZGVmaW5lZCwgbWFwLCBvbWl0QnksXG4gIHJlZHVjZVxufSBmcm9tICdsb2Rhc2gnO1xuXG5pbXBvcnQgdXVpZCBmcm9tICdub2RlLXV1aWQnO1xuXG4vLyBUaGUgXCJRdWVyeUNvbXBpbGVyXCIgdGFrZXMgYWxsIG9mIHRoZSBxdWVyeSBzdGF0ZW1lbnRzIHdoaWNoXG4vLyBoYXZlIGJlZW4gZ2F0aGVyZWQgaW4gdGhlIFwiUXVlcnlCdWlsZGVyXCIgYW5kIHR1cm5zIHRoZW0gaW50byBhXG4vLyBwcm9wZXJseSBmb3JtYXR0ZWQgLyBib3VuZCBxdWVyeSBzdHJpbmcuXG5mdW5jdGlvbiBRdWVyeUNvbXBpbGVyKGNsaWVudCwgYnVpbGRlcikge1xuICB0aGlzLmNsaWVudCA9IGNsaWVudFxuICB0aGlzLm1ldGhvZCA9IGJ1aWxkZXIuX21ldGhvZCB8fCAnc2VsZWN0JztcbiAgdGhpcy5vcHRpb25zID0gYnVpbGRlci5fb3B0aW9ucztcbiAgdGhpcy5zaW5nbGUgPSBidWlsZGVyLl9zaW5nbGU7XG4gIHRoaXMudGltZW91dCA9IGJ1aWxkZXIuX3RpbWVvdXQgfHwgZmFsc2U7XG4gIHRoaXMuY2FuY2VsT25UaW1lb3V0ID0gYnVpbGRlci5fY2FuY2VsT25UaW1lb3V0IHx8IGZhbHNlO1xuICB0aGlzLmdyb3VwZWQgPSBncm91cEJ5KGJ1aWxkZXIuX3N0YXRlbWVudHMsICdncm91cGluZycpO1xuICB0aGlzLmZvcm1hdHRlciA9IGNsaWVudC5mb3JtYXR0ZXIoKVxufVxuXG5jb25zdCBjb21wb25lbnRzID0gW1xuICAnY29sdW1ucycsICdqb2luJywgJ3doZXJlJywgJ3VuaW9uJywgJ2dyb3VwJyxcbiAgJ2hhdmluZycsICdvcmRlcicsICdsaW1pdCcsICdvZmZzZXQnLCAnbG9jaydcbl07XG5cbmFzc2lnbihRdWVyeUNvbXBpbGVyLnByb3RvdHlwZSwge1xuXG4gIC8vIFVzZWQgd2hlbiB0aGUgaW5zZXJ0IGNhbGwgaXMgZW1wdHkuXG4gIF9lbXB0eUluc2VydFZhbHVlOiAnZGVmYXVsdCB2YWx1ZXMnLFxuXG4gIC8vIENvbGxhcHNlIHRoZSBidWlsZGVyIGludG8gYSBzaW5nbGUgb2JqZWN0XG4gIHRvU1FMKG1ldGhvZCwgdHopIHtcbiAgICB0aGlzLl91bmRlZmluZWRJbldoZXJlQ2xhdXNlID0gZmFsc2U7XG5cbiAgICBtZXRob2QgPSBtZXRob2QgfHwgdGhpcy5tZXRob2RcbiAgICBsZXQgdmFsID0gdGhpc1ttZXRob2RdKClcbiAgICBjb25zdCBkZWZhdWx0cyA9IHtcbiAgICAgIG1ldGhvZCxcbiAgICAgIG9wdGlvbnM6IHJlZHVjZSh0aGlzLm9wdGlvbnMsIGFzc2lnbiwge30pLFxuICAgICAgdGltZW91dDogdGhpcy50aW1lb3V0LFxuICAgICAgY2FuY2VsT25UaW1lb3V0OiB0aGlzLmNhbmNlbE9uVGltZW91dCxcbiAgICAgIGJpbmRpbmdzOiB0aGlzLmZvcm1hdHRlci5iaW5kaW5ncyxcbiAgICAgIF9fa25leFF1ZXJ5VWlkOiB1dWlkLnY0KClcbiAgICB9O1xuICAgIGlmIChpc1N0cmluZyh2YWwpKSB7XG4gICAgICB2YWwgPSB7c3FsOiB2YWx9O1xuICAgIH1cblxuICAgIGRlZmF1bHRzLmJpbmRpbmdzID0gZGVmYXVsdHMuYmluZGluZ3MgfHwgW107XG5cbiAgICBpZiAobWV0aG9kID09PSAnc2VsZWN0Jykge1xuICAgICAgaWYodGhpcy5zaW5nbGUuYXMpIHtcbiAgICAgICAgZGVmYXVsdHMuYXMgPSB0aGlzLnNpbmdsZS5hcztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZih0aGlzLl91bmRlZmluZWRJbldoZXJlQ2xhdXNlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBVbmRlZmluZWQgYmluZGluZyhzKSBkZXRlY3RlZCB3aGVuIGNvbXBpbGluZyBgICtcbiAgICAgICAgYCR7bWV0aG9kLnRvVXBwZXJDYXNlKCl9IHF1ZXJ5OiAke3ZhbC5zcWx9YFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBkZWZhdWx0cy5iaW5kaW5ncyA9IHRoaXMuY2xpZW50LnByZXBCaW5kaW5ncyhkZWZhdWx0cy5iaW5kaW5ncywgdHopO1xuXG4gICAgcmV0dXJuIGFzc2lnbihkZWZhdWx0cywgdmFsKTtcbiAgfSxcblxuICAvLyBDb21waWxlcyB0aGUgYHNlbGVjdGAgc3RhdGVtZW50LCBvciBuZXN0ZWQgc3ViLXNlbGVjdHMgYnkgY2FsbGluZyBlYWNoIG9mXG4gIC8vIHRoZSBjb21wb25lbnQgY29tcGlsZXJzLCB0cmltbWluZyBvdXQgdGhlIGVtcHRpZXMsIGFuZCByZXR1cm5pbmcgYVxuICAvLyBnZW5lcmF0ZWQgcXVlcnkgc3RyaW5nLlxuICBzZWxlY3QoKSB7XG4gICAgY29uc3Qgc3RhdGVtZW50cyA9IGNvbXBvbmVudHMubWFwKGNvbXBvbmVudCA9PlxuICAgICAgdGhpc1tjb21wb25lbnRdKHRoaXMpXG4gICAgKTtcbiAgICByZXR1cm4gY29tcGFjdChzdGF0ZW1lbnRzKS5qb2luKCcgJyk7XG4gIH0sXG5cbiAgcGx1Y2soKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNxbDogdGhpcy5zZWxlY3QoKSxcbiAgICAgIHBsdWNrOiB0aGlzLnNpbmdsZS5wbHVja1xuICAgIH07XG4gIH0sXG5cbiAgLy8gQ29tcGlsZXMgYW4gXCJpbnNlcnRcIiBxdWVyeSwgYWxsb3dpbmcgZm9yIG11bHRpcGxlXG4gIC8vIGluc2VydHMgdXNpbmcgYSBzaW5nbGUgcXVlcnkgc3RhdGVtZW50LlxuICBpbnNlcnQoKSB7XG4gICAgY29uc3QgaW5zZXJ0VmFsdWVzID0gdGhpcy5zaW5nbGUuaW5zZXJ0IHx8IFtdO1xuICAgIGxldCBzcWwgPSBgaW5zZXJ0IGludG8gJHt0aGlzLnRhYmxlTmFtZX0gYDtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KGluc2VydFZhbHVlcykpIHtcbiAgICAgIGlmIChpbnNlcnRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiAnJ1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGluc2VydFZhbHVlcyA9PT0gJ29iamVjdCcgJiYgaXNFbXB0eShpbnNlcnRWYWx1ZXMpKSB7XG4gICAgICByZXR1cm4gc3FsICsgdGhpcy5fZW1wdHlJbnNlcnRWYWx1ZVxuICAgIH1cblxuICAgIGNvbnN0IGluc2VydERhdGEgPSB0aGlzLl9wcmVwSW5zZXJ0KGluc2VydFZhbHVlcyk7XG4gICAgaWYgKHR5cGVvZiBpbnNlcnREYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgc3FsICs9IGluc2VydERhdGE7XG4gICAgfSBlbHNlICB7XG4gICAgICBpZiAoaW5zZXJ0RGF0YS5jb2x1bW5zLmxlbmd0aCkge1xuICAgICAgICBzcWwgKz0gYCgke3RoaXMuZm9ybWF0dGVyLmNvbHVtbml6ZShpbnNlcnREYXRhLmNvbHVtbnMpfWBcbiAgICAgICAgc3FsICs9ICcpIHZhbHVlcyAoJ1xuICAgICAgICBsZXQgaSA9IC0xXG4gICAgICAgIHdoaWxlICgrK2kgPCBpbnNlcnREYXRhLnZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgICBpZiAoaSAhPT0gMCkgc3FsICs9ICcpLCAoJ1xuICAgICAgICAgIHNxbCArPSB0aGlzLmZvcm1hdHRlci5wYXJhbWV0ZXJpemUoaW5zZXJ0RGF0YS52YWx1ZXNbaV0sIHRoaXMuY2xpZW50LnZhbHVlRm9yVW5kZWZpbmVkKVxuICAgICAgICB9XG4gICAgICAgIHNxbCArPSAnKSc7XG4gICAgICB9IGVsc2UgaWYgKGluc2VydFZhbHVlcy5sZW5ndGggPT09IDEgJiYgaW5zZXJ0VmFsdWVzWzBdKSB7XG4gICAgICAgIHNxbCArPSB0aGlzLl9lbXB0eUluc2VydFZhbHVlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzcWwgPSAnJ1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3FsO1xuICB9LFxuXG4gIC8vIENvbXBpbGVzIHRoZSBcInVwZGF0ZVwiIHF1ZXJ5LlxuICB1cGRhdGUoKSB7XG4gICAgLy8gTWFrZSBzdXJlIHRhYmxlTmFtZSBpcyBwcm9jZXNzZWQgYnkgdGhlIGZvcm1hdHRlciBmaXJzdC5cbiAgICBjb25zdCB7IHRhYmxlTmFtZSB9ID0gdGhpcztcbiAgICBjb25zdCB1cGRhdGVEYXRhID0gdGhpcy5fcHJlcFVwZGF0ZSh0aGlzLnNpbmdsZS51cGRhdGUpO1xuICAgIGNvbnN0IHdoZXJlcyA9IHRoaXMud2hlcmUoKTtcbiAgICByZXR1cm4gYHVwZGF0ZSAke3RhYmxlTmFtZX1gICtcbiAgICAgICcgc2V0ICcgKyB1cGRhdGVEYXRhLmpvaW4oJywgJykgK1xuICAgICAgKHdoZXJlcyA/IGAgJHt3aGVyZXN9YCA6ICcnKTtcbiAgfSxcblxuICAvLyBDb21waWxlcyB0aGUgY29sdW1ucyBpbiB0aGUgcXVlcnksIHNwZWNpZnlpbmcgaWYgYW4gaXRlbSB3YXMgZGlzdGluY3QuXG4gIGNvbHVtbnMoKSB7XG4gICAgbGV0IGRpc3RpbmN0ID0gZmFsc2U7XG4gICAgaWYgKHRoaXMub25seVVuaW9ucygpKSByZXR1cm4gJydcbiAgICBjb25zdCBjb2x1bW5zID0gdGhpcy5ncm91cGVkLmNvbHVtbnMgfHwgW11cbiAgICBsZXQgaSA9IC0xLCBzcWwgPSBbXTtcbiAgICBpZiAoY29sdW1ucykge1xuICAgICAgd2hpbGUgKCsraSA8IGNvbHVtbnMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHN0bXQgPSBjb2x1bW5zW2ldO1xuICAgICAgICBpZiAoc3RtdC5kaXN0aW5jdCkgZGlzdGluY3QgPSB0cnVlXG4gICAgICAgIGlmIChzdG10LnR5cGUgPT09ICdhZ2dyZWdhdGUnKSB7XG4gICAgICAgICAgc3FsLnB1c2godGhpcy5hZ2dyZWdhdGUoc3RtdCkpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc3RtdC52YWx1ZSAmJiBzdG10LnZhbHVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBzcWwucHVzaCh0aGlzLmZvcm1hdHRlci5jb2x1bW5pemUoc3RtdC52YWx1ZSkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNxbC5sZW5ndGggPT09IDApIHNxbCA9IFsnKiddO1xuICAgIHJldHVybiBgc2VsZWN0ICR7ZGlzdGluY3QgPyAnZGlzdGluY3QgJyA6ICcnfWAgK1xuICAgICAgc3FsLmpvaW4oJywgJykgKyAodGhpcy50YWJsZU5hbWUgPyBgIGZyb20gJHt0aGlzLnRhYmxlTmFtZX1gIDogJycpO1xuICB9LFxuXG4gIGFnZ3JlZ2F0ZShzdG10KSB7XG4gICAgY29uc3QgdmFsID0gc3RtdC52YWx1ZTtcbiAgICBjb25zdCBzcGxpdE9uID0gdmFsLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignIGFzICcpO1xuICAgIGNvbnN0IGRpc3RpbmN0ID0gc3RtdC5hZ2dyZWdhdGVEaXN0aW5jdCA/ICdkaXN0aW5jdCAnIDogJyc7XG4gICAgLy8gQWxsb3dzIHVzIHRvIHNwZWNpeSBhbiBhbGlhcyBmb3IgdGhlIGFnZ3JlZ2F0ZSB0eXBlcy5cbiAgICBpZiAoc3BsaXRPbiAhPT0gLTEpIHtcbiAgICAgIGNvbnN0IGNvbCA9IHZhbC5zbGljZSgwLCBzcGxpdE9uKTtcbiAgICAgIGNvbnN0IGFsaWFzID0gdmFsLnNsaWNlKHNwbGl0T24gKyA0KTtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIGAke3N0bXQubWV0aG9kfSgke2Rpc3RpbmN0ICsgdGhpcy5mb3JtYXR0ZXIud3JhcChjb2wpfSkgYCArXG4gICAgICAgIGBhcyAke3RoaXMuZm9ybWF0dGVyLndyYXAoYWxpYXMpfWBcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBgJHtzdG10Lm1ldGhvZH0oJHtkaXN0aW5jdCArIHRoaXMuZm9ybWF0dGVyLndyYXAodmFsKX0pYDtcbiAgfSxcblxuICAvLyBDb21waWxlcyBhbGwgZWFjaCBvZiB0aGUgYGpvaW5gIGNsYXVzZXMgb24gdGhlIHF1ZXJ5LFxuICAvLyBpbmNsdWRpbmcgYW55IG5lc3RlZCBqb2luIHF1ZXJpZXMuXG4gIGpvaW4oKSB7XG4gICAgbGV0IHNxbCA9ICcnO1xuICAgIGxldCBpID0gLTE7XG4gICAgY29uc3Qgam9pbnMgPSB0aGlzLmdyb3VwZWQuam9pbjtcbiAgICBpZiAoIWpvaW5zKSByZXR1cm4gJyc7XG4gICAgd2hpbGUgKCsraSA8IGpvaW5zLmxlbmd0aCkge1xuICAgICAgY29uc3Qgam9pbiA9IGpvaW5zW2ldO1xuICAgICAgY29uc3QgdGFibGUgPSBqb2luLnNjaGVtYSA/IGAke2pvaW4uc2NoZW1hfS4ke2pvaW4udGFibGV9YCA6IGpvaW4udGFibGU7XG4gICAgICBpZiAoaSA+IDApIHNxbCArPSAnICdcbiAgICAgIGlmIChqb2luLmpvaW5UeXBlID09PSAncmF3Jykge1xuICAgICAgICBzcWwgKz0gdGhpcy5mb3JtYXR0ZXIudW53cmFwUmF3KGpvaW4udGFibGUpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzcWwgKz0gam9pbi5qb2luVHlwZSArICcgam9pbiAnICsgdGhpcy5mb3JtYXR0ZXIud3JhcCh0YWJsZSlcbiAgICAgICAgbGV0IGlpID0gLTFcbiAgICAgICAgd2hpbGUgKCsraWkgPCBqb2luLmNsYXVzZXMubGVuZ3RoKSB7XG4gICAgICAgICAgY29uc3QgY2xhdXNlID0gam9pbi5jbGF1c2VzW2lpXVxuICAgICAgICAgIGlmIChpaSA+IDApIHtcbiAgICAgICAgICAgIHNxbCArPSBgICR7Y2xhdXNlLmJvb2x9IGA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNxbCArPSBgICR7Y2xhdXNlLnR5cGUgPT09ICdvblVzaW5nJyA/ICd1c2luZycgOiAnb24nfSBgO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCB2YWwgPSB0aGlzW2NsYXVzZS50eXBlXS5jYWxsKHRoaXMsIGNsYXVzZSk7XG4gICAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgc3FsICs9IHZhbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNxbDtcbiAgfSxcblxuICAvLyBDb21waWxlcyBhbGwgYHdoZXJlYCBzdGF0ZW1lbnRzIG9uIHRoZSBxdWVyeS5cbiAgd2hlcmUoKSB7XG4gICAgY29uc3Qgd2hlcmVzID0gdGhpcy5ncm91cGVkLndoZXJlO1xuICAgIGlmICghd2hlcmVzKSByZXR1cm47XG4gICAgY29uc3Qgc3FsID0gW107XG4gICAgbGV0IGkgPSAtMTtcbiAgICB3aGlsZSAoKytpIDwgd2hlcmVzLmxlbmd0aCkge1xuICAgICAgY29uc3Qgc3RtdCA9IHdoZXJlc1tpXVxuICAgICAgaWYoc3RtdC5oYXNPd25Qcm9wZXJ0eSgndmFsdWUnKSAmJiBoZWxwZXJzLmNvbnRhaW5zVW5kZWZpbmVkKHN0bXQudmFsdWUpKSB7XG4gICAgICAgIHRoaXMuX3VuZGVmaW5lZEluV2hlcmVDbGF1c2UgPSB0cnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgdmFsID0gdGhpc1tzdG10LnR5cGVdKHN0bXQpXG4gICAgICBpZiAodmFsKSB7XG4gICAgICAgIGlmIChzcWwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgc3FsWzBdID0gJ3doZXJlJ1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNxbC5wdXNoKHN0bXQuYm9vbClcbiAgICAgICAgfVxuICAgICAgICBzcWwucHVzaCh2YWwpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzcWwubGVuZ3RoID4gMSA/IHNxbC5qb2luKCcgJykgOiAnJztcbiAgfSxcblxuICBncm91cCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZ3JvdXBzT3JkZXJzKCdncm91cCcpO1xuICB9LFxuXG4gIG9yZGVyKCkge1xuICAgIHJldHVybiB0aGlzLl9ncm91cHNPcmRlcnMoJ29yZGVyJyk7XG4gIH0sXG5cbiAgLy8gQ29tcGlsZXMgdGhlIGBoYXZpbmdgIHN0YXRlbWVudHMuXG4gIGhhdmluZygpIHtcbiAgICBjb25zdCBoYXZpbmdzID0gdGhpcy5ncm91cGVkLmhhdmluZztcbiAgICBpZiAoIWhhdmluZ3MpIHJldHVybiAnJztcbiAgICBjb25zdCBzcWwgPSBbJ2hhdmluZyddO1xuICAgIGZvciAobGV0IGkgPSAwLCBsID0gaGF2aW5ncy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxldCBzdHIgPSAnJztcbiAgICAgIGNvbnN0IHMgPSBoYXZpbmdzW2ldO1xuICAgICAgaWYgKGkgIT09IDApIHN0ciA9IHMuYm9vbCArICcgJztcbiAgICAgIGlmIChzLnR5cGUgPT09ICdoYXZpbmdCYXNpYycpIHtcbiAgICAgICAgc3FsLnB1c2goc3RyICsgdGhpcy5mb3JtYXR0ZXIuY29sdW1uaXplKHMuY29sdW1uKSArICcgJyArXG4gICAgICAgICAgdGhpcy5mb3JtYXR0ZXIub3BlcmF0b3Iocy5vcGVyYXRvcikgKyAnICcgKyB0aGlzLmZvcm1hdHRlci5wYXJhbWV0ZXIocy52YWx1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYocy50eXBlID09PSAnd2hlcmVXcmFwcGVkJyl7XG4gICAgICAgICAgY29uc3QgdmFsID0gdGhpcy53aGVyZVdyYXBwZWQocylcbiAgICAgICAgICBpZiAodmFsKSBzcWwucHVzaCh2YWwpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3FsLnB1c2goc3RyICsgdGhpcy5mb3JtYXR0ZXIudW53cmFwUmF3KHMudmFsdWUpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3FsLmxlbmd0aCA+IDEgPyBzcWwuam9pbignICcpIDogJyc7XG4gIH0sXG5cbiAgLy8gQ29tcGlsZSB0aGUgXCJ1bmlvblwiIHF1ZXJpZXMgYXR0YWNoZWQgdG8gdGhlIG1haW4gcXVlcnkuXG4gIHVuaW9uKCkge1xuICAgIGNvbnN0IG9ubHlVbmlvbnMgPSB0aGlzLm9ubHlVbmlvbnMoKTtcbiAgICBjb25zdCB1bmlvbnMgPSB0aGlzLmdyb3VwZWQudW5pb247XG4gICAgaWYgKCF1bmlvbnMpIHJldHVybiAnJztcbiAgICBsZXQgc3FsID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSB1bmlvbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBjb25zdCB1bmlvbiA9IHVuaW9uc1tpXTtcbiAgICAgIGlmIChpID4gMCkgc3FsICs9ICcgJztcbiAgICAgIGlmIChpID4gMCB8fCAhb25seVVuaW9ucykgc3FsICs9IHVuaW9uLmNsYXVzZSArICcgJztcbiAgICAgIGNvbnN0IHN0YXRlbWVudCA9IHRoaXMuZm9ybWF0dGVyLnJhd09yRm4odW5pb24udmFsdWUpO1xuICAgICAgaWYgKHN0YXRlbWVudCkge1xuICAgICAgICBpZiAodW5pb24ud3JhcCkgc3FsICs9ICcoJztcbiAgICAgICAgc3FsICs9IHN0YXRlbWVudDtcbiAgICAgICAgaWYgKHVuaW9uLndyYXApIHNxbCArPSAnKSc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzcWw7XG4gIH0sXG5cbiAgLy8gSWYgd2UgaGF2ZW4ndCBzcGVjaWZpZWQgYW55IGNvbHVtbnMgb3IgYSBgdGFibGVOYW1lYCwgd2UncmUgYXNzdW1pbmcgdGhpc1xuICAvLyBpcyBvbmx5IGJlaW5nIHVzZWQgZm9yIHVuaW9ucy5cbiAgb25seVVuaW9ucygpIHtcbiAgICByZXR1cm4gKCF0aGlzLmdyb3VwZWQuY29sdW1ucyAmJiB0aGlzLmdyb3VwZWQudW5pb24gJiYgIXRoaXMudGFibGVOYW1lKTtcbiAgfSxcblxuICBsaW1pdCgpIHtcbiAgICBjb25zdCBub0xpbWl0ID0gIXRoaXMuc2luZ2xlLmxpbWl0ICYmIHRoaXMuc2luZ2xlLmxpbWl0ICE9PSAwO1xuICAgIGlmIChub0xpbWl0KSByZXR1cm4gJyc7XG4gICAgcmV0dXJuIGBsaW1pdCAke3RoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcih0aGlzLnNpbmdsZS5saW1pdCl9YDtcbiAgfSxcblxuICBvZmZzZXQoKSB7XG4gICAgaWYgKCF0aGlzLnNpbmdsZS5vZmZzZXQpIHJldHVybiAnJztcbiAgICByZXR1cm4gYG9mZnNldCAke3RoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcih0aGlzLnNpbmdsZS5vZmZzZXQpfWA7XG4gIH0sXG5cbiAgLy8gQ29tcGlsZXMgYSBgZGVsZXRlYCBxdWVyeS5cbiAgZGVsKCkge1xuICAgIC8vIE1ha2Ugc3VyZSB0YWJsZU5hbWUgaXMgcHJvY2Vzc2VkIGJ5IHRoZSBmb3JtYXR0ZXIgZmlyc3QuXG4gICAgY29uc3QgeyB0YWJsZU5hbWUgfSA9IHRoaXM7XG4gICAgY29uc3Qgd2hlcmVzID0gdGhpcy53aGVyZSgpO1xuICAgIHJldHVybiBgZGVsZXRlIGZyb20gJHt0YWJsZU5hbWV9YCArXG4gICAgICAod2hlcmVzID8gYCAke3doZXJlc31gIDogJycpO1xuICB9LFxuXG4gIC8vIENvbXBpbGVzIGEgYHRydW5jYXRlYCBxdWVyeS5cbiAgdHJ1bmNhdGUoKSB7XG4gICAgcmV0dXJuIGB0cnVuY2F0ZSAke3RoaXMudGFibGVOYW1lfWA7XG4gIH0sXG5cbiAgLy8gQ29tcGlsZXMgdGhlIFwibG9ja3NcIi5cbiAgbG9jaygpIHtcbiAgICBpZiAodGhpcy5zaW5nbGUubG9jaykge1xuICAgICAgaWYgKCF0aGlzLmNsaWVudC50cmFuc2FjdGluZykge1xuICAgICAgICBoZWxwZXJzLndhcm4oJ1lvdSBhcmUgYXR0ZW1wdGluZyB0byBwZXJmb3JtIGEgXCJsb2NrXCIgY29tbWFuZCBvdXRzaWRlIG9mIGEgdHJhbnNhY3Rpb24uJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzW3RoaXMuc2luZ2xlLmxvY2tdKClcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gQ29tcGlsZSB0aGUgXCJjb3VudGVyXCIuXG4gIGNvdW50ZXIoKSB7XG4gICAgY29uc3QgeyBjb3VudGVyIH0gPSB0aGlzLnNpbmdsZTtcbiAgICBjb25zdCB0b1VwZGF0ZSA9IHt9O1xuICAgIHRvVXBkYXRlW2NvdW50ZXIuY29sdW1uXSA9IHRoaXMuY2xpZW50LnJhdyh0aGlzLmZvcm1hdHRlci53cmFwKGNvdW50ZXIuY29sdW1uKSArXG4gICAgICAnICcgKyAoY291bnRlci5zeW1ib2wgfHwgJysnKSArXG4gICAgICAnICcgKyBjb3VudGVyLmFtb3VudCk7XG4gICAgdGhpcy5zaW5nbGUudXBkYXRlID0gdG9VcGRhdGU7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlKCk7XG4gIH0sXG5cbiAgLy8gT24gQ2xhdXNlXG4gIC8vIC0tLS0tLVxuXG4gIG9uV3JhcHBlZChjbGF1c2UpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIGNvbnN0IHdyYXBKb2luID0gbmV3IEpvaW5DbGF1c2UoKTtcbiAgICBjbGF1c2UudmFsdWUuY2FsbCh3cmFwSm9pbiwgd3JhcEpvaW4pO1xuXG4gICAgbGV0IHNxbCA9ICcnO1xuICAgIHdyYXBKb2luLmNsYXVzZXMuZm9yRWFjaChmdW5jdGlvbih3cmFwQ2xhdXNlLCBpaSkge1xuICAgICAgaWYgKGlpID4gMCkge1xuICAgICAgICBzcWwgKz0gYCAke3dyYXBDbGF1c2UuYm9vbH0gYDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZhbCA9IHNlbGZbd3JhcENsYXVzZS50eXBlXSh3cmFwQ2xhdXNlKTtcbiAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgc3FsICs9IHZhbDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChzcWwubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gYCgke3NxbH0pYDtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xuICB9LFxuXG4gIG9uQmFzaWMoY2xhdXNlKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuZm9ybWF0dGVyLndyYXAoY2xhdXNlLmNvbHVtbikgKyAnICcgK1xuICAgICAgdGhpcy5mb3JtYXR0ZXIub3BlcmF0b3IoY2xhdXNlLm9wZXJhdG9yKSArICcgJyArXG4gICAgICB0aGlzLmZvcm1hdHRlci53cmFwKGNsYXVzZS52YWx1ZSlcbiAgICApO1xuICB9LFxuXG4gIG9uUmF3KGNsYXVzZSkge1xuICAgIHJldHVybiB0aGlzLmZvcm1hdHRlci51bndyYXBSYXcoY2xhdXNlLnZhbHVlKTtcbiAgfSxcblxuICBvblVzaW5nKGNsYXVzZSkge1xuICAgIHJldHVybiB0aGlzLmZvcm1hdHRlci53cmFwKGNsYXVzZS5jb2x1bW4pO1xuICB9LFxuXG4gIC8vIFdoZXJlIENsYXVzZVxuICAvLyAtLS0tLS1cblxuICB3aGVyZUluKHN0YXRlbWVudCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHN0YXRlbWVudC5jb2x1bW4pKSByZXR1cm4gdGhpcy5tdWx0aVdoZXJlSW4oc3RhdGVtZW50KTtcbiAgICByZXR1cm4gdGhpcy5mb3JtYXR0ZXIud3JhcChzdGF0ZW1lbnQuY29sdW1uKSArICcgJyArIHRoaXMuX25vdChzdGF0ZW1lbnQsICdpbiAnKSArXG4gICAgICB0aGlzLndyYXAodGhpcy5mb3JtYXR0ZXIucGFyYW1ldGVyaXplKHN0YXRlbWVudC52YWx1ZSkpO1xuICB9LFxuXG4gIG11bHRpV2hlcmVJbihzdGF0ZW1lbnQpIHtcbiAgICBsZXQgaSA9IC0xLCBzcWwgPSBgKCR7dGhpcy5mb3JtYXR0ZXIuY29sdW1uaXplKHN0YXRlbWVudC5jb2x1bW4pfSkgYFxuICAgIHNxbCArPSB0aGlzLl9ub3Qoc3RhdGVtZW50LCAnaW4gJykgKyAnKCgnXG4gICAgd2hpbGUgKCsraSA8IHN0YXRlbWVudC52YWx1ZS5sZW5ndGgpIHtcbiAgICAgIGlmIChpICE9PSAwKSBzcWwgKz0gJyksKCdcbiAgICAgIHNxbCArPSB0aGlzLmZvcm1hdHRlci5wYXJhbWV0ZXJpemUoc3RhdGVtZW50LnZhbHVlW2ldKVxuICAgIH1cbiAgICByZXR1cm4gc3FsICsgJykpJ1xuICB9LFxuXG4gIHdoZXJlTnVsbChzdGF0ZW1lbnQpIHtcbiAgICByZXR1cm4gdGhpcy5mb3JtYXR0ZXIud3JhcChzdGF0ZW1lbnQuY29sdW1uKSArICcgaXMgJyArIHRoaXMuX25vdChzdGF0ZW1lbnQsICdudWxsJyk7XG4gIH0sXG5cbiAgLy8gQ29tcGlsZXMgYSBiYXNpYyBcIndoZXJlXCIgY2xhdXNlLlxuICB3aGVyZUJhc2ljKHN0YXRlbWVudCkge1xuICAgIHJldHVybiB0aGlzLl9ub3Qoc3RhdGVtZW50LCAnJykgK1xuICAgICAgdGhpcy5mb3JtYXR0ZXIud3JhcChzdGF0ZW1lbnQuY29sdW1uKSArICcgJyArXG4gICAgICB0aGlzLmZvcm1hdHRlci5vcGVyYXRvcihzdGF0ZW1lbnQub3BlcmF0b3IpICsgJyAnICtcbiAgICAgIHRoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcihzdGF0ZW1lbnQudmFsdWUpO1xuICB9LFxuXG4gIHdoZXJlRXhpc3RzKHN0YXRlbWVudCkge1xuICAgIHJldHVybiB0aGlzLl9ub3Qoc3RhdGVtZW50LCAnZXhpc3RzJykgKyAnICgnICsgdGhpcy5mb3JtYXR0ZXIucmF3T3JGbihzdGF0ZW1lbnQudmFsdWUpICsgJyknO1xuICB9LFxuXG4gIHdoZXJlV3JhcHBlZChzdGF0ZW1lbnQpIHtcbiAgICBjb25zdCB2YWwgPSB0aGlzLmZvcm1hdHRlci5yYXdPckZuKHN0YXRlbWVudC52YWx1ZSwgJ3doZXJlJylcbiAgICByZXR1cm4gdmFsICYmIHRoaXMuX25vdChzdGF0ZW1lbnQsICcnKSArICcoJyArIHZhbC5zbGljZSg2KSArICcpJyB8fCAnJztcbiAgfSxcblxuICB3aGVyZUJldHdlZW4oc3RhdGVtZW50KSB7XG4gICAgcmV0dXJuIHRoaXMuZm9ybWF0dGVyLndyYXAoc3RhdGVtZW50LmNvbHVtbikgKyAnICcgKyB0aGlzLl9ub3Qoc3RhdGVtZW50LCAnYmV0d2VlbicpICsgJyAnICtcbiAgICAgIG1hcChzdGF0ZW1lbnQudmFsdWUsIGJpbmQodGhpcy5mb3JtYXR0ZXIucGFyYW1ldGVyLCB0aGlzLmZvcm1hdHRlcikpLmpvaW4oJyBhbmQgJyk7XG4gIH0sXG5cbiAgLy8gQ29tcGlsZXMgYSBcIndoZXJlUmF3XCIgcXVlcnkuXG4gIHdoZXJlUmF3KHN0YXRlbWVudCkge1xuICAgIHJldHVybiB0aGlzLl9ub3Qoc3RhdGVtZW50LCAnJykgKyB0aGlzLmZvcm1hdHRlci51bndyYXBSYXcoc3RhdGVtZW50LnZhbHVlKTtcbiAgfSxcblxuICB3cmFwKHN0cikge1xuICAgIGlmIChzdHIuY2hhckF0KDApICE9PSAnKCcpIHJldHVybiBgKCR7c3RyfSlgO1xuICAgIHJldHVybiBzdHI7XG4gIH0sXG5cbiAgLy8gRGV0ZXJtaW5lcyB3aGV0aGVyIHRvIGFkZCBhIFwibm90XCIgcHJlZml4IHRvIHRoZSB3aGVyZSBjbGF1c2UuXG4gIF9ub3Qoc3RhdGVtZW50LCBzdHIpIHtcbiAgICBpZiAoc3RhdGVtZW50Lm5vdCkgcmV0dXJuIGBub3QgJHtzdHJ9YDtcbiAgICByZXR1cm4gc3RyO1xuICB9LFxuXG4gIF9wcmVwSW5zZXJ0KGRhdGEpIHtcbiAgICBjb25zdCBpc1JhdyA9IHRoaXMuZm9ybWF0dGVyLnJhd09yRm4oZGF0YSk7XG4gICAgaWYgKGlzUmF3KSByZXR1cm4gaXNSYXc7XG4gICAgbGV0IGNvbHVtbnMgPSBbXTtcbiAgICBjb25zdCB2YWx1ZXMgPSBbXTtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoZGF0YSkpIGRhdGEgPSBkYXRhID8gW2RhdGFdIDogW107XG4gICAgbGV0IGkgPSAtMVxuICAgIHdoaWxlICgrK2kgPCBkYXRhLmxlbmd0aCkge1xuICAgICAgaWYgKGRhdGFbaV0gPT0gbnVsbCkgYnJlYWs7XG4gICAgICBpZiAoaSA9PT0gMCkgY29sdW1ucyA9IE9iamVjdC5rZXlzKGRhdGFbaV0pLnNvcnQoKVxuICAgICAgY29uc3Qgcm93ID0gbmV3IEFycmF5KGNvbHVtbnMubGVuZ3RoKVxuICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGRhdGFbaV0pXG4gICAgICBsZXQgaiA9IC0xXG4gICAgICB3aGlsZSAoKytqIDwga2V5cy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3Qga2V5ID0ga2V5c1tqXTtcbiAgICAgICAgbGV0IGlkeCA9IGNvbHVtbnMuaW5kZXhPZihrZXkpO1xuICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgICAgIGNvbHVtbnMgPSBjb2x1bW5zLmNvbmNhdChrZXkpLnNvcnQoKVxuICAgICAgICAgIGlkeCA9IGNvbHVtbnMuaW5kZXhPZihrZXkpXG4gICAgICAgICAgbGV0IGsgPSAtMVxuICAgICAgICAgIHdoaWxlICgrK2sgPCB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YWx1ZXNba10uc3BsaWNlKGlkeCwgMCwgdW5kZWZpbmVkKVxuICAgICAgICAgIH1cbiAgICAgICAgICByb3cuc3BsaWNlKGlkeCwgMCwgdW5kZWZpbmVkKVxuICAgICAgICB9XG4gICAgICAgIHJvd1tpZHhdID0gZGF0YVtpXVtrZXldXG4gICAgICB9XG4gICAgICB2YWx1ZXMucHVzaChyb3cpXG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBjb2x1bW5zLFxuICAgICAgdmFsdWVzXG4gICAgfTtcbiAgfSxcblxuICAvLyBcIlByZXBzXCIgdGhlIHVwZGF0ZS5cbiAgX3ByZXBVcGRhdGUoZGF0YSkge1xuICAgIGRhdGEgPSBvbWl0QnkoZGF0YSwgaXNVbmRlZmluZWQpXG4gICAgY29uc3QgdmFscyA9IFtdXG4gICAgY29uc3Qgc29ydGVkID0gT2JqZWN0LmtleXMoZGF0YSkuc29ydCgpXG4gICAgbGV0IGkgPSAtMVxuICAgIHdoaWxlICgrK2kgPCBzb3J0ZWQubGVuZ3RoKSB7XG4gICAgICB2YWxzLnB1c2goXG4gICAgICAgIHRoaXMuZm9ybWF0dGVyLndyYXAoc29ydGVkW2ldKSArXG4gICAgICAgICcgPSAnICtcbiAgICAgICAgdGhpcy5mb3JtYXR0ZXIucGFyYW1ldGVyKGRhdGFbc29ydGVkW2ldXSlcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB2YWxzO1xuICB9LFxuXG4gIC8vIENvbXBpbGVzIHRoZSBgb3JkZXIgYnlgIHN0YXRlbWVudHMuXG4gIF9ncm91cHNPcmRlcnModHlwZSkge1xuICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5ncm91cGVkW3R5cGVdO1xuICAgIGlmICghaXRlbXMpIHJldHVybiAnJztcbiAgICBjb25zdCB7IGZvcm1hdHRlciB9ID0gdGhpcztcbiAgICBjb25zdCBzcWwgPSBpdGVtcy5tYXAoaXRlbSA9PiB7XG4gICAgICBjb25zdCBjb2x1bW4gPSBpdGVtLnZhbHVlIGluc3RhbmNlb2YgUmF3XG4gICAgICAgID8gZm9ybWF0dGVyLnVud3JhcFJhdyhpdGVtLnZhbHVlKVxuICAgICAgICA6IGZvcm1hdHRlci5jb2x1bW5pemUoaXRlbS52YWx1ZSk7XG4gICAgICBjb25zdCBkaXJlY3Rpb24gPSB0eXBlID09PSAnb3JkZXInICYmIGl0ZW0udHlwZSAhPT0gJ29yZGVyQnlSYXcnXG4gICAgICAgID8gYCAke2Zvcm1hdHRlci5kaXJlY3Rpb24oaXRlbS5kaXJlY3Rpb24pfWBcbiAgICAgICAgOiAnJztcbiAgICAgIHJldHVybiBjb2x1bW4gKyBkaXJlY3Rpb247XG4gICAgfSk7XG4gICAgcmV0dXJuIHNxbC5sZW5ndGggPyB0eXBlICsgJyBieSAnICsgc3FsLmpvaW4oJywgJykgOiAnJztcbiAgfVxuXG59KVxuXG5RdWVyeUNvbXBpbGVyLnByb3RvdHlwZS5maXJzdCA9IFF1ZXJ5Q29tcGlsZXIucHJvdG90eXBlLnNlbGVjdDtcblxuLy8gR2V0IHRoZSB0YWJsZSBuYW1lLCB3cmFwcGluZyBpdCBpZiBuZWNlc3NhcnkuXG4vLyBJbXBsZW1lbnRlZCBhcyBhIHByb3BlcnR5IHRvIHByZXZlbnQgb3JkZXJpbmcgaXNzdWVzIGFzIGRlc2NyaWJlZCBpbiAjNzA0LlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFF1ZXJ5Q29tcGlsZXIucHJvdG90eXBlLCAndGFibGVOYW1lJywge1xuICBnZXQoKSB7XG4gICAgaWYoIXRoaXMuX3RhYmxlTmFtZSkge1xuICAgICAgLy8gT25seSBjYWxsIHRoaXMuZm9ybWF0dGVyLndyYXAoKSB0aGUgZmlyc3QgdGltZSB0aGlzIHByb3BlcnR5IGlzIGFjY2Vzc2VkLlxuICAgICAgbGV0IHRhYmxlTmFtZSA9IHRoaXMuc2luZ2xlLnRhYmxlO1xuICAgICAgY29uc3Qgc2NoZW1hTmFtZSA9IHRoaXMuc2luZ2xlLnNjaGVtYTtcblxuICAgICAgaWYgKHRhYmxlTmFtZSAmJiBzY2hlbWFOYW1lKSB0YWJsZU5hbWUgPSBgJHtzY2hlbWFOYW1lfS4ke3RhYmxlTmFtZX1gO1xuXG4gICAgICB0aGlzLl90YWJsZU5hbWUgPSB0YWJsZU5hbWUgPyB0aGlzLmZvcm1hdHRlci53cmFwKHRhYmxlTmFtZSkgOiAnJztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3RhYmxlTmFtZTtcbiAgfVxufSk7XG5cblxuZXhwb3J0IGRlZmF1bHQgUXVlcnlDb21waWxlcjtcbiJdfQ==