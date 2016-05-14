
// Query Compiler
// -------
var helpers    = require('../helpers');
var Raw        = require('../raw');
var JoinClause = require('./joinclause');

import {assign, reduce, groupBy, isString, compact, isEmpty, isUndefined, bind, map, omitBy} from 'lodash'

// The "QueryCompiler" takes all of the query statements which
// have been gathered in the "QueryBuilder" and turns them into a
// properly formatted / bound query string.
function QueryCompiler(client, builder) {
  this.client    = client
  this.method    = builder._method || 'select';
  this.options   = builder._options;
  this.single    = builder._single;
  this.timeout   = builder._timeout || false;
  this.grouped   = groupBy(builder._statements, 'grouping');
  this.formatter = client.formatter()
}

var components = [
  'columns', 'join', 'where', 'union', 'group',
  'having', 'order', 'limit', 'offset', 'lock'
];

assign(QueryCompiler.prototype, {

  // Used when the insert call is empty.
  _emptyInsertValue: 'default values',

  // Collapse the builder into a single object
  toSQL(method, tz) {
    method = method || this.method
    var val = this[method]()
    var defaults = {
      method: method,
      options: reduce(this.options, assign, {}),
      timeout: this.timeout,
      bindings: this.formatter.bindings
    };
    if (isString(val)) {
      val = {sql: val};
    }
    if (method === 'select' && this.single.as) {
      defaults.as = this.single.as;
    }

    defaults.bindings = this.client.prepBindings(defaults.bindings || [], tz);

    return assign(defaults, val);
  },

  // Compiles the `select` statement, or nested sub-selects
  // by calling each of the component compilers, trimming out
  // the empties, and returning a generated query string.
  select() {
    var i = -1, statements = [];
    while (++i < components.length) {
      statements.push(this[components[i]](this));
    }
    return compact(statements).join(' ');
  },

  pluck() {
    return {
      sql: this.select(),
      pluck: this.single.pluck
    };
  },

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert() {
    var insertValues = this.single.insert || [];
    var sql = 'insert into ' + this.tableName + ' ';

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return ''
      }
    } else if (typeof insertValues === 'object' && isEmpty(insertValues)) {
      return sql + this._emptyInsertValue
    }

    var insertData = this._prepInsert(insertValues);
    if (typeof insertData === 'string') {
      sql += insertData;
    } else  {
      if (insertData.columns.length) {
        sql += '(' + this.formatter.columnize(insertData.columns)
        sql += ') values ('
        var i = -1
        while (++i < insertData.values.length) {
          if (i !== 0) sql += '), ('
          sql += this.formatter.parameterize(insertData.values[i], this.client.valueForUndefined)
        }
        sql += ')';
      } else if (insertValues.length === 1 && insertValues[0]) {
        sql += this._emptyInsertValue
      } else {
        sql = ''
      }
    }
    return sql;
  },

  // Compiles the "update" query.
  update() {
    // Make sure tableName is processed by the formatter first.
    var tableName  = this.tableName;
    var updateData = this._prepUpdate(this.single.update);
    var wheres     = this.where();
    return 'update ' + tableName +
      ' set ' + updateData.join(', ') +
      (wheres ? ' ' + wheres : '');
  },

  // Compiles the columns in the query, specifying if an item was distinct.
  columns() {
    var distinct = false;
    if (this.onlyUnions()) return ''
    var columns = this.grouped.columns || []
    var i = -1, sql = [];
    if (columns) {
      while (++i < columns.length) {
        var stmt = columns[i];
        if (stmt.distinct) distinct = true
        if (stmt.type === 'aggregate') {
          sql.push(this.aggregate(stmt))
        }
        else if (stmt.value && stmt.value.length > 0) {
          sql.push(this.formatter.columnize(stmt.value))
        }
      }
    }
    if (sql.length === 0) sql = ['*'];
    return 'select ' + (distinct ? 'distinct ' : '') +
      sql.join(', ') + (this.tableName ? ' from ' + this.tableName : '');
  },

  aggregate(stmt) {
    var val = stmt.value;
    var splitOn = val.toLowerCase().indexOf(' as ');
    var distinct = stmt.aggregateDistinct ? 'distinct ' : '';
    // Allows us to speciy an alias for the aggregate types.
    if (splitOn !== -1) {
      var col = val.slice(0, splitOn);
      var alias = val.slice(splitOn + 4);
      return stmt.method + '(' + distinct + this.formatter.wrap(col) + ') as ' + this.formatter.wrap(alias);
    }
    return stmt.method + '(' + distinct + this.formatter.wrap(val) + ')';
  },

  // Compiles all each of the `join` clauses on the query,
  // including any nested join queries.
  join() {
    var sql = '', i = -1, joins = this.grouped.join;
    if (!joins) return '';
    while (++i < joins.length) {
      var join = joins[i];
      var table = join.schema ? `${join.schema}.${join.table}` : join.table;
      if (i > 0) sql += ' '
      if (join.joinType === 'raw') {
        sql += this.formatter.unwrapRaw(join.table)
      } else {
        sql += join.joinType + ' join ' + this.formatter.wrap(table)
        var ii = -1
        while (++ii < join.clauses.length) {
          var clause = join.clauses[ii]
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
  where() {
    var wheres = this.grouped.where;
    if (!wheres) return;
    var i = -1, sql = [];
    while (++i < wheres.length) {
      var stmt = wheres[i]
      var val = this[stmt.type](stmt)
      if (val) {
        if (sql.length === 0) {
          sql[0] = 'where'
        } else {
          sql.push(stmt.bool)
        }
        sql.push(val)
      }
    }
    return sql.length > 1 ? sql.join(' ') : '';
  },

  group() {
    return this._groupsOrders('group');
  },

  order() {
    return this._groupsOrders('order');
  },

  // Compiles the `having` statements.
  having() {
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
        if(s.type === 'whereWrapped'){
          var val = this.whereWrapped(s)
          if (val) sql.push(val)
        } else {
          sql.push(str + this.formatter.unwrapRaw(s.value));
        }
      }
    }
    return sql.length > 1 ? sql.join(' ') : '';
  },

  // Compile the "union" queries attached to the main query.
  union() {
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
  onlyUnions() {
    return (!this.grouped.columns && this.grouped.union && !this.tableName);
  },

  limit() {
    var noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit) return '';
    return 'limit ' + this.formatter.parameter(this.single.limit);
  },

  offset() {
    if (!this.single.offset) return '';
    return 'offset ' + this.formatter.parameter(this.single.offset);
  },

  // Compiles a `delete` query.
  del() {
    // Make sure tableName is processed by the formatter first.
    var tableName  = this.tableName;
    var wheres = this.where();
    return 'delete from ' + tableName +
      (wheres ? ' ' + wheres : '');
  },

  // Compiles a `truncate` query.
  truncate() {
    return 'truncate ' + this.tableName;
  },

  // Compiles the "locks".
  lock() {
    if (this.single.lock) {
      if (!this.client.transacting) {
        helpers.warn('You are attempting to perform a "lock" command outside of a transaction.')
      } else {
        return this[this.single.lock]()
      }
    }
  },

  // Compile the "counter".
  counter() {
    var counter = this.single.counter;
    var toUpdate = {};
    toUpdate[counter.column] = this.client.raw(this.formatter.wrap(counter.column) +
      ' ' + (counter.symbol || '+') +
      ' ' + counter.amount);
    this.single.update = toUpdate;
    return this.update();
  },

  // On Clause
  // ------

  onWrapped(clause) {
    var self = this;

    var wrapJoin = new JoinClause();
    clause.value.call(wrapJoin, wrapJoin);

    var sql = '';
    wrapJoin.clauses.forEach(function(wrapClause, ii) {
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

  onBasic(clause) {
    return this.formatter.wrap(clause.column) + ' ' + this.formatter.operator(clause.operator) + ' ' + this.formatter.wrap(clause.value);
  },

  onRaw(clause) {
    return this.formatter.unwrapRaw(clause.value);
  },

  onUsing(clause) {
    return this.formatter.wrap(clause.column);
  },

  // Where Clause
  // ------

  whereIn(statement) {
    if (Array.isArray(statement.column)) return this.multiWhereIn(statement);
    return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'in ') +
      this.wrap(this.formatter.parameterize(statement.value));
  },

  multiWhereIn(statement) {
    var i = -1, sql = '(' + this.formatter.columnize(statement.column) + ') '
    sql += this._not(statement, 'in ') + '(('
    while (++i < statement.value.length) {
      if (i !== 0) sql += '),('
      sql += this.formatter.parameterize(statement.value[i])
    }
    return sql + '))'
  },

  whereNull(statement) {
    return this.formatter.wrap(statement.column) + ' is ' + this._not(statement, 'null');
  },

  // Compiles a basic "where" clause.
  whereBasic(statement) {
    return this._not(statement, '') +
      this.formatter.wrap(statement.column) + ' ' +
      this.formatter.operator(statement.operator) + ' ' +
      this.formatter.parameter(statement.value);
  },

  whereExists(statement) {
    return this._not(statement, 'exists') + ' (' + this.formatter.rawOrFn(statement.value) + ')';
  },

  whereWrapped(statement) {
    var val = this.formatter.rawOrFn(statement.value, 'where')
    return val && this._not(statement, '') + '(' + val.slice(6) + ')' || '';
  },

  whereBetween(statement) {
    return this.formatter.wrap(statement.column) + ' ' + this._not(statement, 'between') + ' ' +
      map(statement.value, bind(this.formatter.parameter, this.formatter)).join(' and ');
  },

  // Compiles a "whereRaw" query.
  whereRaw(statement) {
    return this.formatter.unwrapRaw(statement.value);
  },

  wrap(str) {
    if (str.charAt(0) !== '(') return '(' + str + ')';
    return str;
  },

  // Determines whether to add a "not" prefix to the where clause.
  _not(statement, str) {
    if (statement.not) return 'not ' + str;
    return str;
  },

  _prepInsert(data) {
    var isRaw = this.formatter.rawOrFn(data);
    if (isRaw) return isRaw;
    var columns = [];
    var values  = [];
    if (!Array.isArray(data)) data = data ? [data] : [];
    var i = -1
    while (++i < data.length) {
      if (data[i] == null) break;
      if (i === 0) columns = Object.keys(data[i]).sort()
      var row  = new Array(columns.length)
      var keys = Object.keys(data[i])
      var j = -1
      while (++j < keys.length) {
        var key = keys[j];
        var idx = columns.indexOf(key);
        if (idx === -1) {
          columns = columns.concat(key).sort()
          idx     = columns.indexOf(key)
          var k = -1
          while (++k < values.length) {
            values[k].splice(idx, 0, undefined)
          }
          row.splice(idx, 0, undefined)
        }
        row[idx] = data[i][key]
      }
      values.push(row)
    }
    return {
      columns: columns,
      values:  values
    };
  },

  // "Preps" the update.
  _prepUpdate(data) {
    data = omitBy(data, isUndefined)
    var vals   = []
    var sorted = Object.keys(data).sort()
    var i      = -1
    while (++i < sorted.length) {
      vals.push(this.formatter.wrap(sorted[i]) + ' = ' + this.formatter.parameter(data[sorted[i]]));
    }
    return vals;
  },

  // Compiles the `order by` statements.
  _groupsOrders(type) {
    var items = this.grouped[type];
    if (!items) return '';
    var formatter = this.formatter;
    var sql = items.map(function (item) {
      return (item.value instanceof Raw ? formatter.unwrapRaw(item.value) : formatter.columnize(item.value)) +
        ((type === 'order' && item.type !== 'orderByRaw') ? ' ' + formatter.direction(item.direction) : '');
    });
    return sql.length ? type + ' by ' + sql.join(', ') : '';
  }

})

QueryCompiler.prototype.first = QueryCompiler.prototype.select;

// Get the table name, wrapping it if necessary.
// Implemented as a property to prevent ordering issues as described in #704.
Object.defineProperty(QueryCompiler.prototype, 'tableName', {
  get() {
    if(!this._tableName) {
      // Only call this.formatter.wrap() the first time this property is accessed.
      var tableName = this.single.table;
      var schemaName = this.single.schema;

      if (tableName && schemaName) tableName = `${schemaName}.${tableName}`;

      this._tableName = tableName ? this.formatter.wrap(tableName) : '';
    }
    return this._tableName;
  }
});


module.exports = QueryCompiler;
