var _       = require('lodash');

// The "QueryCompiler" takes all of the query statements which have been
// gathered in the "QueryBuilder" and turns them into a properly formatted / bound
// query string.
var QueryCompiler = function(queryBuilder) {
  this.sql       = [];
  this.single    = queryBuilder.single;
  this.grouped   = _.groupBy(queryBuilder.statements, 'grouping');
  this.tableName = this.single.table ? this.formatter.wrap(this.single.table) : '';
};

QueryCompiler.prototype.get = function(elem) {
  var item = this.grouped[elem];
  return item ? item[0] : {};
},

QueryCompiler.prototype.compiled = function(target) {
  return {
    sql: this[target || 'select'](),
    bindings: this.formatter.bindings
  };
},

// Compiles the `select` statement, or nested sub-selects
// by calling each of the component compilers, trimming out
// the empties, and returning a generated query string.
QueryCompiler.prototype.select = function() {
  var statements = [];
  for (var i = 0, l = components.length; i < l; i++) {
    var component = components[i];
    if (this.grouped[component] || component === 'columns') {
      statements.push(this[component](this));
    }
  }
  return _.compact(statements).join(' ');
},

// Alias to `select` with some post-processing on the output.
QueryCompiler.prototype.pluck = function() {
  return this.select();
},

// Compiles an `insert` query, allowing for multiple
// inserts using a single query statement.
QueryCompiler.prototype.insert = function() {
  return new InsertCompiler(this.single.insert, this.formatter).toSql();
},

// Compiles the columns in the query, specifying if an item was distinct.
QueryCompiler.prototype.columns = function() {
  var distinct = false;
  if (this.onlyUnions()) return '';
  var columns = this.grouped.columns || [];
  var sql = [];
  if (columns) {
    for (var i = 0, l = columns.length; i < l; i++) {
      var stmt = columns[i];
      var str = '';
      if (stmt.distinct) distinct = true;
      if (stmt.type === 'aggregate') {
        sql.push(this.aggregate(stmt));
      } else if (stmt.value && stmt.value.length > 0) {
        sql.push(this.formatter.columnize(stmt.value));
      }
    }
  }

  if (sql.length === 0) {
    sql.push('*');
  }
  return 'select ' + (distinct ? 'distinct ' : '') +
      (sql.join(', ') || '*') + (this.tableName ? ' from ' + this.tableName : '');
},

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
},

// Compiles all each of the `join` clauses on the query,
// including any nested join queries.
QueryCompiler.prototype.join = function() {
  var joins = this.grouped.join;
  if (!joins) return '';
  var sql = [];
  for (var i = 0, l = joins.length; i < l; i++) {
    var stmt = joins[i];
    var str = stmt.joinType + ' join ' + this.formatter.wrap(stmt.table);
    for (var i2 = 0, l2 = stmt.clauses.length; i2 < l2; i2++) {
      var clause = stmt.clauses[i2];
      if (i2 > 0) {
        str += ' ' + clause[0] + ' ';
      } else {
        str += ' on ';
      }
      str += this.formatter.wrap(clause[1]) + ' ' + this.formatter.operator(clause[2]) +
        ' ' + this.formatter.wrap(clause[3]);
    }
    sql.push(str);
  }
  return sql.length > 0 ? sql.join(' ') : '';
},

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
},

QueryCompiler.prototype.group = function() {
  return this._groupsOrders('group');
},

QueryCompiler.prototype.order = function() {
  return this._groupsOrders('order');
},

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
},

// Compile the "union" queries attached to the main query.
QueryCompiler.prototype.union = function() {
  var onlyUnions = this.onlyUnions();
  var sql = '', unions = this.grouped.union;
  for (var i = 0, l = unions.length; i < l; i++) {
    var union = unions[i];
    if (i > 0) sql += ' ';
    if (i > 0 || !onlyUnions) sql += union.clause + ' ';
    sql += this.formatter.rawOrFn(union.value, union.wrap);
  }
  return sql;
},

// If we haven't specified any columns or a `tableName`, we're assuming this
// is only being used for unions.
QueryCompiler.prototype.onlyUnions = function() {
  return (!this.grouped.columns && this.grouped.union && !this.tableName);
},

QueryCompiler.prototype.limit = function() {
  return 'limit ' + this.formatter.parameter(this.single.limit);
},

QueryCompiler.prototype.offset = function() {
  return 'offset ' + this.formatter.parameter(this.single.offset);
},

// Compiles a `delete` query.
QueryCompiler.prototype.delete = function() {
  var wheres = this.where();
  return 'delete from ' + this.tableName + ' ' + wheres.sql;
},

// Compiles a `truncate` query.
QueryCompiler.prototype.truncate = function() {
  return 'truncate ' + this.tableName;
},

QueryCompiler.prototype.lock = function() {
  return _.pluck(this.grouped.lock, 'value').join(' ');
},

// Compiles the `order by` statements.
QueryCompiler.prototype._groupsOrders = function(type) {
  var items = this.grouped[type];
  var sql = [];
  for (var i = 0, l = items.length; i < l; i++) {
    var item = items[i];
    var str = this.formatter.columnize(item.value);
    if (type === 'order') {
      str += ' ' + this.formatter.direction(item.direction);
    }
    sql.push(str);
  }
  return sql.length > 0 ? type + ' by ' + sql.join(', ') : '';
};

// Where Clause
// ------

WhereCompiler.prototype.whereIn = function(statement) {
  return this.formatter.wrap(statement.column) + ' ' + this._not(s, 'in ') +
    this.wrap(this.formatter.parameterize(statement.value));
};

WhereCompiler.prototype.whereNull = function(statement) {
  return this.formatter.wrap(statement.column) + ' is ' + this._not(s, 'null');
};

// Compiles a basic "where" clause.
WhereCompiler.prototype.whereBasic = function(statement) {
  return this.formatter.wrap(statement.column) + ' ' +
    this.formatter.operator(statement.operator) + ' ' +
    this.formatter.parameter(statement.value);
};

WhereCompiler.prototype.whereExists = function(statement) {
  return this._not(s, 'exists') + ' (' + this.formatter.compileCallback(statement.value) + ')';
};

WhereCompiler.prototype.whereWrapped = function(statement) {
  return '(' + this.formatter.compileCallback(statement.value, 'where').slice(6) + ')';
};

WhereCompiler.prototype.whereBetween = function(statement) {
  return this.formatter.wrap(statement.column) + ' ' + this._not(s, 'between') + ' ' +
    this.formatter.parameterize(statement.value, ' and ');
};

// Compiles a "whereRaw" query.
WhereCompiler.prototype.whereRaw = function(statement) {
  return this.formatter.checkRaw(statement.value);
};

WhereCompiler.prototype.wrap = function(str) {
  if (str.charAt(0) !== '(') return '(' + str + ')';
  return str;
};

// Determines whether to add a "not" prefix to the where clause.
WhereCompiler.prototype._not = function(statement, str) {
  if (statement.not) {
    return 'not ' + str;
  }
  return str;
};

var InsertCompiler = function(builder, formatter) {
  this.builder = builder;
  this.formatter = formatter;
};

InsertCompiler.prototype = {

  toSql: function() {
    var insertData = this.get('insert');
    return 'insert into ' + this.tableName + ' ' +
      insertData.columns + ' values ' + insertData.value;
  },

  prepInsert: function(values) {
    if (!_.isArray(values)) values = values ? [values] : [];
    for (var i = 0, l = values.length; i<l; i++) {
      var obj = values[i] = helpers.sortObject(values[i]);
      for (var i2 = 0, l2 = obj.length; i2 < l2; i2++) {
        this.bindings.push(obj[i2][1]);
      }
    }
    return values;
  },

  insertMissing: function() {

  },

  // prep
  //   var insertVals = _.map(this._prepInsert(values), function(obj, i) {
  //     if (i === 0) columns = this._columnize(_.pluck(obj, 0));
  //     return '(' + _.pluck(obj, 1).join(', ') + ')';
  //   }, this);
  //     columns: '(' + columns + ')',
  //     value: insertVals.join(', ')

  // // Preps the values for `insert` or `update`.
  // prepInsert: function(values) {
  //   var vals = _.clone(values);
  //   if (!_.isArray(vals)) vals = (values ? [vals] : []);
  // }

};

function update() {
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
}

// Sorts an object based on names, so as to insert correctly.
function sortObject(obj) {
  return _.sortBy(_.pairs(obj), function(a) {
    return a[0];
  });
}

// If we are running an insert with variable object keys, we need to normalize
// for the missing keys, presumably setting the values to undefined.
function normalizeObject() {
  // var defaults = _.reduce(_.union.apply(_, _.map(vals, function(val) {
  //   return _.keys(val);
  // })), function(memo, key) {
  //   memo[key] = void 0;
  //   return memo;
  // }, {});

  // for (var i = 0, l = vals.length; i<l; i++) {
  //   var obj = vals[i] = helpers.sortObject(_.defaults(vals[i], defaults));
  //   for (var i2 = 0, l2 = obj.length; i2 < l2; i2++) {
  //     obj[i2][1] = f.parameter(obj[i2][1]);
  //   }
  // }
  // return vals;
}

return QueryCompiler;