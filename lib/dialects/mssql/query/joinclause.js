
// MSSQL Join Clause
// ------
'use strict';

var inherits = require('inherits');
var JoinClause = require('../../../query/joinclause');
var assign = require('lodash/object/assign');

function JoinClause_MSSQL(table, type, schema) {
  JoinClause.call(this, table, type, schema);
}
inherits(JoinClause_MSSQL, JoinClause);

assign(JoinClause_MSSQL.prototype, {

  // Adds a "using" clause to the current join.
  using: function using(column) {
    return this.clauses.push([this._bool(), 'on', column, '=', column]);
  }

});

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
module.exports = JoinClause_MSSQL;