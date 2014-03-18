module.exports = function(client) {
  var _       = require('lodash');
  var Helpers = require('../helpers');
  var push    = Array.prototype.push;
  var concat  = Array.prototype.concat;

  var components = [
    'wrapped', 'columns', 'join', 'where', 'union', 'group',
    'having', 'order', 'limit', 'offset', 'lock'
  ];

  var WhereCompiler  = require('./compiler/where');
  var UnionCompiler  = require('./compiler/union');
  var InsertCompiler = require('./compiler/insert')(client);

  // The "QueryCompiler" takes all of the query statements which have been
  // gathered in the "QueryBuilder" and turns them into a properly formatted / bound
  // query string.
  var QueryCompiler = function(builder) {
    this.formatter = new client.Formatter;
    this.grouped   = _.groupBy(builder.statements, 'grouping');
    var table      = this.get('table').value;
    this.tableName = table ? this.formatter.wrap(table) : ''; // TODO: Trigger useful error here.
    this.sql       = [];
  };

  QueryCompiler.prototype = {

    constructor: QueryCompiler,

    get: function(elem) {
      var item = this.grouped[elem];
      return item ? item[0] : {};
    },

    compiled: function(target) {
      return {
        sql: this[target](),
        bindings: this.formatter.bindings
      };
    },

    // Compiles the `select` statement, or nested sub-selects
    // by calling each of the component compilers, trimming out
    // the empties, and returning a generated query string.
    select: function() {
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
    pluck: function() {
      return this.select();
    },

    // Compiles an `insert` query, allowing for multiple
    // inserts using a single query statement.
    insert: function() {
      return new InsertCompiler(this.get('insert'), this.formatter).toSql();
    },

    // Compiles the columns in the query, specifying if an item was distinct.
    columns: function() {
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

    aggregate: function(stmt) {
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
    join: function() {
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
    where: function() {
      var wheres = this.grouped.where;
      if (!wheres) return '';
      var sql = ['where'];
      for (var i = 0, l = wheres.length; i < l; i++) {
        var str = '', stmt = wheres[i];
        if (i !== 0) str = stmt.bool + ' ';
        sql.push(str + new WhereCompiler(stmt, this.formatter).toSql());
      }
      return sql.length > 1 ? sql.join(' ') : '';
    },

    group: function() {
      return this._groupsOrders('group');
    },

    order: function() {
      return this._groupsOrders('order');
    },

    // Compiles the `having` statements.
    having: function() {
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
    union: function() {
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
    onlyUnions: function() {
      return (!this.grouped.columns && this.grouped.union && !this.tableName);
    },

    limit: function() {
      var limit = this.get('limit');
      return 'limit ' + this.formatter.parameter(limit.value);
    },

    offset: function() {
      var offset = this.get('offset');
      return 'offset ' + this.formatter.parameter(offset.value);
    },

    // Compiles a `delete` query.
    delete: function() {
      var wheres = this.where();
      return 'delete from ' + this.tableName + ' ' + wheres.sql;
    },

    // Compiles a `truncate` query.
    truncate: function() {
      return 'truncate ' + this.tableName;
    },

    lock: function() {
      return _.pluck(this.grouped.lock, 'value').join(' ');
    },

    // Compiles the `order by` statements.
    _groupsOrders: function(type) {
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
    }

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

  QueryCompiler.extend = require('simple-extend');

  return QueryCompiler;
};