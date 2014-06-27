// Query Compiler
// -------

var _       = require('lodash');
var helpers = require('../helpers');
var Raw     = require('../raw');

// The "QueryCompiler" takes all of the query statements which have been
// gathered in the "QueryBuilder" and turns them into a properly formatted / bound
// query string.
function QueryCompiler(queryBuilder) {
  this.method      = queryBuilder._method || 'select';
  this.options     = queryBuilder._options;
  this.single      = queryBuilder._single;
  this.transacting = queryBuilder._transacting;
  this.grouped     = _.groupBy(queryBuilder._statements, 'grouping');
  this.tableName   = this.single.table ? this.formatter.wrap(this.single.table) : '';
}

// Collapse the builder into a single object
QueryCompiler.prototype.toSQL = function(method) {
  var val = this[method]();
  var defaults = {
    method: method,
    options: this.options && this.options.length > 0 ?
      _.extend.apply(_, this.options) : void 0,
    bindings: this.formatter.bindings
  };
  if (_.isString(val)) {
    val = {sql: val};
  }
  if (method === 'select' && this.single.as) {
    defaults.as = this.single.as;
  }
  return _.extend(defaults, val);
};

var components = [
  'columns', 'join', 'where', 'union', 'group',
  'having', 'order', 'limit', 'offset', 'lock'
];

// Compiles the `select` statement, or nested sub-selects
// by calling each of the component compilers, trimming out
// the empties, and returning a generated query string.
QueryCompiler.prototype.select = function() {
  var statements = [];
  for (var i = 0, l = components.length; i < l; i++) {
    var component = components[i];
    statements.push(this[component](this));
  }
  return _.compact(statements).join(' ');
};
QueryCompiler.prototype.first = QueryCompiler.prototype.select;
QueryCompiler.prototype.pluck = function() {
  return {
    sql: this.select(),
    pluck: this.single.pluck
  };
};

// Compiles an "insert" query, allowing for multiple
// inserts using a single query statement.
QueryCompiler.prototype.insert = function() {
  var sql = 'insert into ' + this.tableName + ' ';
  if (_.isEmpty(this.single.insert)) {
    sql += this._emptyInsertValue;
  } else {
    var insertData = this._prepInsert(this.single.insert);
    if (_.isString(insertData)) {
      sql += insertData;
    } else  {
      sql += '(' + this.formatter.columnize(insertData.columns) + ') values (' +
        _.map(insertData.values, this.formatter.parameterize, this.formatter).join('), (') + ')';
    }
  }
  return sql;
};

// Compiles the "update" query.
QueryCompiler.prototype.update = function() {
  obj = helpers.sortObject(obj);
  var vals = [];
  for (var i = 0; i < obj.length; i++) {
    var value = obj[i];
    vals.push(this.formatter.wrap(value[0]) + ' = ' + this.formatter.parameter(value[1]));
  }
  if (!_.isEmpty(ret)) this.returning(ret);
  return {
    grouping: 'update',
    columns: vals.join(', ')
  };
};

// Compiles the columns in the query, specifying if an item was distinct.
QueryCompiler.prototype.columns = function() {
  var distinct = false;
  if (this.onlyUnions()) return '';
  var columns = this.grouped.columns || [];
  var sql = [];
  if (columns) {
    for (var i = 0, l = columns.length; i < l; i++) {
      var stmt = columns[i];
      if (stmt.distinct) distinct = true;
      if (stmt.type === 'aggregate') {
        sql.push(this.aggregate(stmt));
      } else if (stmt.value && stmt.value.length > 0) {
        sql.push(this.formatter.columnize(stmt.value));
      }
    }
  }
  if (sql.length === 0) sql.push('*');
  return 'select ' + (distinct ? 'distinct ' : '') +
      (sql.join(', ') || '*') + (this.tableName ? ' from ' + this.tableName : '');
};

QueryCompiler.prototype.aggregate = function(stmt) {
  var val = stmt.value;
  var splitOn = val.toLowerCase().indexOf(' as ');
  // Allows us to speciy an alias for the aggregate types.
  if (splitOn !== -1) {
    var col = val.slice(0, splitOn);
    var alias = val.slice(splitOn + 4);
    return stmt.method + '(' + this.formatter.wrap(col) + ') as ' + this.formatter.wrap(alias);
  }
  return stmt.method + '(' + this.formatter.wrap(val) + ')';
};

// Compiles all each of the `join` clauses on the query,
// including any nested join queries.
QueryCompiler.prototype.join = function() {
  var joins = this.grouped.join;
  if (!joins) return '';
  var sql = [];
  for (var i = 0, l = joins.length; i < l; i++) {
    var stmt = joins[i];
    var str  = stmt.joinType + ' join ' + this.formatter.wrap(stmt.table);
    for (var i2 = 0, l2 = stmt.clauses.length; i2 < l2; i2++) {
      var clause = stmt.clauses[i2];
      if (i2 > 0) {
        str += ' ' + clause[1] + ' ';
      } else {
        str += ' on ';
      }
      str += this.formatter.wrap(clause[2]) + ' ' + this.formatter.operator(clause[3]) +
        ' ' + this.formatter.wrap(clause[4]);
    }
    sql.push(str);
  }
  return sql.length > 0 ? sql.join(' ') : '';
};

// Compiles all `where` statements on the query.
QueryCompiler.prototype.where = function() {
  var wheres = this.grouped.where;
  if (!wheres) return;
  var sql = [];
  sql[0] = 'where';
  for (var i = 0, l = wheres.length; i < l; i++) {
    var stmt = wheres[i];
    if (i !== 0) sql.push(stmt.bool);
    sql.push(this[stmt.type](stmt));
  }
  return sql.length > 1 ? sql.join(' ') : '';
};

QueryCompiler.prototype.group = function() {
  return this._groupsOrders('group');
};
QueryCompiler.prototype.order = function() {
  return this._groupsOrders('order');
};

// Compiles the `having` statements.
QueryCompiler.prototype.having = function() {
  var havings = this.grouped.having;
  if (!havings) return '';
  var sql = ['having'];
  for (var i = 0, l = havings.length; i < l; i++) {
    var str = '', s = havings[i];
    if (i !== 0) str = s.bool + ' ';
    if (s.type === 'havingBasic') {
      sql.push(str + this.formatter.columnize(s.column) + ' ' +
        this.formatter.operator(s.operator) + ' ' + this.formatter.parameter(s.value));
    } else {
      sql.push(str + this.formatter.checkRaw(s.value));
    }
  }
  return sql.length > 1 ? sql.join(' ') : '';
};

// Compile the "union" queries attached to the main query.
QueryCompiler.prototype.union = function() {
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
};

// If we haven't specified any columns or a `tableName`, we're assuming this
// is only being used for unions.
QueryCompiler.prototype.onlyUnions = function() {
  return (!this.grouped.columns && this.grouped.union && !this.tableName);
};

QueryCompiler.prototype.limit = function() {
  if (this.single.limit == void 0) return '';
  return 'limit ' + this.formatter.parameter(this.single.limit);
};

QueryCompiler.prototype.offset = function() {
  if (this.single.offset == void 0) return '';
  return 'offset ' + this.formatter.parameter(this.single.offset);
};

// Compiles a `delete` query.
QueryCompiler.prototype.del = function() {
  var wheres = this.where();
  return 'delete from ' + this.tableName +
    (wheres ? ' ' + wheres : '');
};

// Compiles a `truncate` query.
QueryCompiler.prototype.truncate = function() {
  return 'truncate ' + this.tableName;
};

// Compiles the "locks".
QueryCompiler.prototype.lock = function() {
  if (this.single.lock) {
    if (!this.transacting) {
      helpers.warn('You are attempting to perform a "lock" command outside of a transaction.');
    } else {
      return this[this.single.lock]();
    }
  }
};

// Compile the "counter".
QueryCompiler.prototype.counter = function() {
  var counter = this.single.counter;
  var toUpdate = {};
  toUpdate[counter.column] = new Raw(this.formatter.wrap(counter.column) +
    ' ' + (counter.symbol || '+') +
    ' ' + counter.amount);
  this.single.update = toUpdate;
  return this.update();
};

// Compiles the `order by` statements.
QueryCompiler.prototype._groupsOrders = function(type) {
  var items = this.grouped[type];
  if (!items) return '';
  var sql = [];
  for (var i = 0, l = items.length; i < l; i++) {
    var str, item = items[i];
    if (item.value instanceof Raw) {
      str = this.formatter.checkRaw(item.value);
    } else {
      str = this.formatter.columnize(item.value);
      if (type === 'order') {
        str += ' ' + this.formatter.direction(item.direction);
      }
    }
    sql.push(str);
  }
  return sql.length > 0 ? type + ' by ' + sql.join(', ') : '';
};

// Where Clause
// ------

QueryCompiler.prototype.whereIn = function(statement) {
  if (_.isArray(statement.column)) return this.multiWhereIn(statement);
  return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'in ') +
    this.wrap(this.formatter.parameterize(statement.value));
};

QueryCompiler.prototype.multiWhereIn = function(statement) {
  return '(' + _.map(statement.column, this.formatter.wrap, this.formatter) + ') ' +
    this._not(statement, 'in ') + '((' +
    _.map(statement.value, this.formatter.parameterize, this.formatter).join('),(') + '))';
};

QueryCompiler.prototype.whereNull = function(statement) {
  return this.formatter.wrap(statement.column) + ' is ' + this._not(statement, 'null');
};

// Compiles a basic "where" clause.
QueryCompiler.prototype.whereBasic = function(statement) {
  return this.formatter.wrap(statement.column) + ' ' +
    this.formatter.operator(statement.operator) + ' ' +
    this.formatter.parameter(statement.value);
};

QueryCompiler.prototype.whereExists = function(statement) {
  return this._not(statement, 'exists') + ' (' + this.formatter.rawOrFn(statement.value) + ')';
};

QueryCompiler.prototype.whereWrapped = function(statement) {
  return '(' + this.formatter.rawOrFn(statement.value, 'where').slice(6) + ')';
};

QueryCompiler.prototype.whereBetween = function(statement) {
  return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'between') + ' ' +
    _.map(statement.value, this.formatter.parameter, this.formatter).join(' and ');
};

// Compiles a "whereRaw" query.
QueryCompiler.prototype.whereRaw = function(statement) {
  return this.formatter.checkRaw(statement.value);
};

QueryCompiler.prototype.wrap = function(str) {
  if (str.charAt(0) !== '(') return '(' + str + ')';
  return str;
};

// Determines whether to add a "not" prefix to the where clause.
QueryCompiler.prototype._not = function(statement, str) {
  if (statement.not) return 'not ' + str;
  return str;
};

// "Preps" the insert.
QueryCompiler.prototype._prepInsert = function(data) {
  var isRaw = this.formatter.rawOrFn(data);
  if (isRaw) return isRaw;
  var values = [];
  var columns, colList;
  if (!_.isArray(data)) data = data ? [data] : [];
  for (var i = 0, l = data.length; i<l; i++) {
    var sorted = helpers.sortObject(data[i]);
    columns = _.pluck(sorted, 0);
    colList = colList || columns;
    if (!_.isEqual(columns, colList)) {
      return this._prepInsert(this._normalizeInsert(data));
    }
    values.push(_.pluck(sorted, 1));
  }
  return {
    columns: columns,
    values: values
  };
};

// If we are running an insert with variable object keys, we need to normalize
// for the missing keys, presumably setting the values to undefined.
QueryCompiler.prototype._normalizeInsert = function(data) {
  if (!_.isArray(data)) return _.clone(data);
  var defaultObj = _.reduce(_.union.apply(_, _.map(data, function(val) {
    return _.keys(val);
  })), function(memo, key) {
    memo[key] = void 0;
    return memo;
  }, {});
  return _.map(data, function(row) { return _.defaults(row, defaultObj); });
};

// "Preps" the update.
QueryCompiler.prototype._prepUpdate = function(data) {
  var vals = [];
  var sorted = helpers.sortObject(data);
  for (var i = 0, l = sorted.length; i < l; i++) {
    vals.push(this.formatter.wrap(sorted[i][0]) + ' = ' + this.formatter.parameter(sorted[i][1]));
  }
  return vals;
};

module.exports = QueryCompiler;
