// PostgreSQL Grammar
// -------
var _           = require('lodash');
var Helpers     = require('../../../lib/helpers').Helpers;
var baseGrammar = require('../../base/grammar').baseGrammar;

// Extends the standard sql grammar.
exports.grammar = _.defaults({

  // The keyword identifier wrapper format.
  wrapValue: function(value) {
    return (value !== '*' ? Helpers.format('"%s"', value) : "*");
  },

  // Compiles a truncate query.
  compileTruncate: function(qb) {
    return 'truncate ' + this.wrapTable(qb.table) + ' restart identity';
  },

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  compileInsert: function(qb) {
    var values      = qb.values;
    var columns     = _.pluck(values[0], 0);
    var paramBlocks = [];

    // If there are any "where" clauses, we need to omit
    // any bindings that may have been associated with them.
    if (qb.wheres.length > 0) this.clearWhereBindings(qb);

    var sql = 'insert into ' + this.wrapTable(qb.table) + ' ';

    if (columns.length === 0) {
      sql += 'default values';
    } else {
      for (var i = 0, l = values.length; i < l; ++i) {
        paramBlocks.push("(" + this.parameterize(_.pluck(values[i], 1)) + ")");
      }
      sql += "(" + this.columnize(columns) + ") values " + paramBlocks.join(', ');
    }
    sql += this.compileReturning(qb);
    return sql;
  },

  // Compiles an `update` query, allowing for a return value.
  compileUpdate: function(qb) {
    var sql = baseGrammar.compileUpdate.apply(this, arguments);
    sql += this.compileReturning(qb);
    return sql;
  },

  // Adds the returning value to the statement.
  compileReturning: function(qb) {
    var sql = '';
    if (qb.flags.returning) {
      if (_.isArray(qb.flags.returning)) {
        sql += ' returning ' + this.wrapArray(qb.flags.returning);
      } else {
        sql += ' returning ' + this.wrapValue(qb.flags.returning);
      }
    }
    return sql;
  },

  // Ensures the response is returned in the same format as other clients.
  handleResponse: function(builder, response) {
    var returning = builder.flags.returning;
    if (response.command === 'SELECT') return response.rows;
    if (response.command === 'INSERT' || (response.command === 'UPDATE' && returning)) {
      return _.map(response.rows, function(row) {
        if (returning === '*' || _.isArray(returning)) return row;
        return row[returning];
      });
    }
    if (response.command === 'UPDATE' || response.command === 'DELETE') {
      return response.rowCount;
    }
    return '';
  }

}, baseGrammar);
