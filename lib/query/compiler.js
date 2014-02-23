var _       = require('lodash');
var Helpers = require('../helpers');
var push    = Array.prototype.push;

module.exports = function() {

  var components = [
    'wrapped', 'columns', 'join', 'where', 'union', 'group',
    'having', 'order', 'limit', 'offset', 'lock'
  ];

  // The "QueryCompiler" takes all of the query statements which have been
  // assembed in the
  var QueryCompiler = function(builder) {
    this.tableName  = builder._table();
    this.singles    = builder.singles;
    this.grouped    = _.groupBy(builder.statements, 'type');
    this.bindings   = [];
    this.statements = [];
  };

  _.extend(QueryCompiler.prototype, {

    compiled: function(target) {
      var sql = this[target]();
      if (_.isString(sql)) {
        return {
          sql: sql,
          bindings: this.bindings
        };
      } else {
        return sql;
      }
    },

    get: function(elem) {
      var item = this.grouped[elem];
      return item ? item[0] : {value: '', columns: ''};
    },

    // Compiles the `select` statement, or nested sub-selects
    // by calling each of the component compilers, trimming out
    // the empties, and returning a generated query string.
    select: function() {
      var statements = [];
      for (var i = 0, l = components.length; i < l; i++) {
        var component = components[i];
        if (this.grouped[component] || component === 'columns') {
          var statement = this[component](this);
          this.statements.push(statement);
        }
      }
      return _.compact(this.statements).join(' ');
    },

    // Alias to `select` with some post-processing on the output.
    pluck: function() {
      return this.select();
    },

    // Compiles an `insert` query, allowing for multiple
    // inserts using a single query statement.
    insert: function() {
      var insertData = this.get('insert');
      push.apply(this.bindings, insertData.bindings);
      return 'insert into ' + this.tableName + ' ' + insertData.columns + ' values ' + insertData.value;
    },

    // Compiles the columns in the query, specifying if an item was distinct.
    columns: function() {
      var distinct = false;
      if (this.onlyUnions()) return;
      var sql = _.compact(_.map(this.grouped.columns, function(block) {
        if (block.distinct) distinct = true;
        push.apply(this.bindings, block.bindings);
        return block.value;
      }, this));
      return 'select ' + (distinct ? 'distinct ' : '') +
        (sql.join(', ') || '*') + (this.tableName ? ' from ' + this.tableName : '');
    },

    // Compiles all each of the `join` clauses on the query,
    // including any nested join queries.
    join: function() {
      return _.map(this.grouped.join, function(item, i) {
        var sql = '';
        if (i > 0) sql += item.bool || '';
        return sql + item.value;
      }).join(' ');
    },

    // Compiles all `where` statements on the query.
    where: function() {
      return this._havingWhere('where');
    },

    group: function() {
      return this._groupsOrders('group');
    },

    order: function() {
      return this._groupsOrders('order');
    },

    // Compiles the `having` statements.
    having: function() {
      return this._havingWhere('having');
    },

    // Compile the "union" queries attached to the main query.
    union: function() {
      var onlyUnions = this.onlyUnions();
      var sql = '', unions = this.grouped.union;
      for (var i = 0, l = unions.length; i < l; i++) {
        var union = unions[i];
        if (i > 0) sql += ' ';
        if (i > 0 || !onlyUnions) sql += union.clause + ' ';
        sql += union.value;
      }
      push.apply(this.bindings, _.flatten(_.pluck(this.grouped.union, 'bindings')));
      return sql;
    },

    // If we haven't specified any columns or a `tableName`, we're assuming this
    // is only being used for unions.
    onlyUnions: function() {
      return (!this.grouped.columns && this.grouped.union && !this.tableName);
    },

    limit: function() {
      var limit = this.get('limit');
      push.apply(this.bindings, limit.bindings);
      return limit.value;
    },

    offset: function() {
      var offset = this.get('offset');
      push.apply(this.bindings, offset.bindings);
      return offset.value;
    },

    // Compiles a `delete` query.
    delete: function() {
      var wheres = this.where();
      push.apply(this.bindings, wheres.bindings);
      return 'delete from ' + this.tableName + ' ' + wheres;
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
      var items = _.pluck(this.grouped[type], 'value');
      if (items.length > 0) {
        return type + ' by ' + items.join(', ');
      }
    },

    // The same logic is used for compiling "where" statements as it is
    // for "having" statements.
    _havingWhere: function(type) {
      var bindings = [];
      return _.map(this.grouped[type], function(item, i) {
        push.apply(this.bindings, _.flatten(item.bindings));
        return (i === 0 ? type + ' ' : '') + item.bool + ' ' + item.value;
      }, this).join(' ').replace(/and |or /, '');
    }

  });

  QueryCompiler.extend = require('simple-extend');

  return QueryCompiler;
};