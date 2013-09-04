(function(define) {

"use strict";

define(function(require, exports) {

  var _       = require('underscore');

  var Raw     = require('../../lib/raw').Raw;
  var Helpers = require('../../lib/helpers').Helpers;

  // Grammar
  // -------

  // The list of different components
  var components = [
    'aggregate', 'columns', 'from',
    'joins', 'wheres', 'groups', 'havings',
    'orders', 'limit', 'offset', 'unions'
  ];

  exports.Grammar = {

    // Compiles the `select` statement, or nested sub-selects
    // by calling each of the component compilers, trimming out
    // the empties, and returning a generated query string.
    compileSelect: function(qb) {
      var sql = {};
      if (_.isEmpty(qb.columns)) qb.columns = ['*'];
      for (var i = 0, l = components.length; i < l; i++) {
        var component = components[i];
        var result = _.result(qb, component);
        if (result != null) {
          sql[component] = this['compile' + Helpers.capitalize(component)](qb, result);
        }
      }
      return _.compact(sql).join(' ');
    },

    // Compiles an aggregate query.
    compileAggregate: function(qb) {
      var column = this.columnize(qb.aggregate.columns);
      if (qb.isDistinct && column !== '*') {
        column = 'distinct ' + column;
      }
      return 'select ' + qb.aggregate.type + '(' + column + ') as aggregate';
    },

    // Compiles the columns in the query, specifying if an item was distinct.
    compileColumns: function(qb, columns) {
      if (qb.aggregate != null) return;
      return (qb.isDistinct ? 'select distinct ' : 'select ') + this.columnize(columns);
    },

    // Compiles the `from` tableName portion of the query.
    compileFrom: function(qb, table) {
      return 'from ' + this.wrapTable(table);
    },

    // Compiles all each of the `join` clauses on the query,
    // including any nested join queries.
    compileJoins: function(qb, joins) {
      var sql = [];
      for (var i = 0, l = joins.length; i < l; i++) {
        var join = joins[i];
        var clauses = [];
        for (var i2 = 0, l2 = join.clauses.length; i2 < l2; i2++) {
          var clause = join.clauses[i2];
          clauses.push(
            [clause['bool'], this.wrap(clause['first']), clause.operator, this.wrap(clause['second'])].join(' ')
          );
        }
        clauses[0] = clauses[0].replace(/and |or /, '');
        sql.push(join.type + ' join ' + this.wrapTable(join.table) + ' on ' + clauses.join(' '));
      }
      return sql.join(' ');
    },

    // Compiles all `where` statements on the query.
    compileWheres: function(qb) {
      var sql = [];
      var wheres = qb.wheres;
      if (wheres.length === 0) return '';
      for (var i = 0, l = wheres.length; i < l; i++) {
        var where = wheres[i];
        sql.push(where.bool + ' ' + this['where' + where.type](qb, where));
      }
      return (sql.length > 0 ? 'where ' + sql.join(' ').replace(/and |or /, '') : '');
    },

    // Compile the "union" queries attached to the main query.
    compileUnions: function(qb) {
      var sql = '';
      for (var i = 0, l = qb.unions.length; i < l; i++) {
        var union = qb.unions[i];
        sql += (union.all ? 'union all ' : 'union ') + this.compileSelect(union.query);
      }
      return sql;
    },

    // Compiles a nested where clause.
    whereNested: function(qb, where) {
      return '(' + this.compileWheres(where.query).slice(6) + ')';
    },

    // Compiles a nested where clause.
    whereSub: function(qb, where) {
      return this.wrap(where.column) + ' ' + where.operator + ' (' + (this.compileSelect(where.query)) + ')';
    },

    // Compiles a basic where clause.
    whereBasic: function(qb, where) {
      return this.wrap(where.column) + ' ' + where.operator + ' ' + this.parameter(where.value);
    },

    // Compiles a basic exists clause.
    whereExists: function(qb, where) {
      return 'exists (' + this.compileSelect(where.query) + ')';
    },

    // Compiles a basic not exists clause.
    whereNotExists: function(qb, where) {
      return 'not exists (' + this.compileSelect(where.query) + ')';
    },

    // Compiles a where in clause.
    whereIn: function(qb, where) {
      return this.wrap(where.column) + ' in (' + this.parameterize(where.value) + ')';
    },

    // Compiles a where not in clause.
    whereNotIn: function(qb, where) {
      return this.wrap(where.column) + ' not in (' + this.parameterize(where.value) + ')';
    },

    // Compiles a sub-where in clause.
    whereInSub: function(qb, where) {
      return this.wrap(where.column) + ' in (' + this.compileSelect(where.query) + ')';
    },

    // Compiles a sub-where not in clause.
    whereNotInSub: function(qb, where) {
      return this.wrap(where.column) + ' not in (' + this.compileSelect(where.query) + ')';
    },

    // Where between.
    whereBetween: function(qb, where) {
      return this.wrap(where.column) + ' between ? and ?';
    },

    whereNull: function(qb, where) {
      return this.wrap(where.column) + ' is null';
    },

    whereNotNull: function(qb, where) {
      return this.wrap(where.column) + ' is not null';
    },

    whereRaw: function(qb, where) {
      return where.sql;
    },

    // Compiles the `group by` columns.
    compileGroups: function(qb, groups) {
      return 'group by ' + this.columnize(groups);
    },

    // Compiles the `having` statements.
    compileHavings: function(qb, havings) {
      return 'having ' + havings.map(function(having) {
        if (having.type === 'Raw') {
          return having.bool + ' ' + having.sql;
        }
        return having.bool + ' ' + this.wrap(having.column) + ' ' + having.operator + ' ' + this.parameter(having['value']);
      }, this).replace(/and |or /, '');
    },

    // Compiles the `order by` statements.
    compileOrders: function(qb, orders) {
      if (orders.length > 0) {
        return 'order by ' + orders.map(function(order) {
          return '' + this.wrap(order.column) + ' ' + order.direction;
        }, this).join(', ');
      }
    },

    // Compiles the `limit` statements.
    compileLimit: function(qb, limit) {
      return 'limit ' + limit;
    },

    // Compiles an `offset` statement on the query.
    compileOffset: function(qb, offset) {
      return 'offset ' + offset;
    },

    // Compiles an `insert` query, allowing for multiple
    // inserts using a single query statement.
    compileInsert: function(qb) {
      var values      = qb.values;
      var table       = this.wrapTable(qb.table);
      var columns     = _.pluck(values[0], 0);
      var paramBlocks = [];

      // If there are any "where" clauses, we need to omit
      // any bindings that may have been associated with them.
      if (qb.wheres.length > 0) this._clearWhereBindings(qb);

      for (var i = 0, l = values.length; i < l; ++i) {
        paramBlocks.push("(" + this.parameterize(_.pluck(values[i], 1)) + ")");
      }

      return "insert into " + table + " (" + this.columnize(columns) + ") values " + paramBlocks.join(', ');
    },

    // Depending on the type of `where` clause, this will appropriately
    // remove any binding caused by "where" constraints, allowing the same
    // query to be used for `insert` and `update` without issue.
    _clearWhereBindings: function(qb) {
      var wheres = qb.wheres;
      var bindingCount = 0;
      for (var i = 0, l = wheres.length; i<l; i++) {
        var where = wheres[i];
        if (_.isArray(where.value)) {
          bindingCount += where.value.length;
        } else if (where.query) {
          bindingCount += where.query.bindings.length;
        } else {
          bindingCount += 1;
        }
      }
      qb.bindings = qb.bindings.slice(bindingCount);
    },

    // Compiles an `update` query.
    compileUpdate: function(qb) {
      var values = qb.values;
      var table = this.wrapTable(qb.table), columns = [];
      for (var i=0, l = values.length; i < l; i++) {
        var value = values[i];
        columns.push(this.wrap(value[0]) + ' = ' + this.parameter(value[1]));
      }
      return 'update ' + table + ' set ' + columns.join(', ') + ' ' + this.compileWheres(qb);
    },

    // Compiles a `delete` query.
    compileDelete: function(qb) {
      var table = this.wrapTable(qb.table);
      var where = !_.isEmpty(qb.wheres) ? this.compileWheres(qb) : '';
      return 'delete from ' + table + ' ' + where;
    },

    // Compiles a `truncate` query.
    compileTruncate: function(qb) {
      return 'truncate ' + this.wrapTable(qb.table);
    },

    wrap: function(value) {
      var segments;
      if (value instanceof Raw) return value.sql;
      if (_.isNumber(value)) return value;
      if (value.toLowerCase().indexOf(' as ') !== -1) {
        segments = value.split(' ');
        return this.wrap(segments[0]) + ' as ' + this.wrap(segments[2]);
      }
      var wrapped = [];
      segments = value.split('.');
      for (var i = 0, l = segments.length; i < l; i = ++i) {
        value = segments[i];
        if (i === 0 && segments.length > 1) {
          wrapped.push(this.wrapTable(value));
        } else {
          wrapped.push(this.wrapValue(value));
        }
      }
      return wrapped.join('.');
    },

    wrapArray: function(values) {
      return _.map(values, this.wrap, this);
    },

    wrapTable: function(table) {
      if (table instanceof Raw) return table.sql;
      return this.wrap(table);
    },

    columnize: function(columns) {
      if (!_.isArray(columns)) columns = [columns];
      return _.map(columns, this.wrap, this).join(', ');
    },

    parameterize: function(values) {
      if (!_.isArray(values)) values = [values];
      return _.map(values, this.parameter, this).join(', ');
    },

    parameter: function(value) {
      return (value instanceof Raw ? value.sql : '?');
    }
  };

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports, module); }
);