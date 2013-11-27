// JoinClause
// ---------

// The "JoinClause" is an object holding any necessary info about a join,
// including the type, and any associated tables & columns being joined.
var JoinClause = function(type, table) {
  this.joinType = type;
  this.table    = table;
  this.clauses  = [];
};

JoinClause.prototype = {

  // Adds an "on" clause to the current join object.
  on: function(first, operator, second) {
    this.clauses.push({first: first, operator: operator, second: second, bool: 'and'});
    return this;
  },

  // Adds an "and on" clause to the current join object.
  andOn: function() {
    return this.on.apply(this, arguments);
  },

  // Adds an "or on" clause to the current join object.
  orOn: function(first, operator, second) {
    this.clauses.push({first: first, operator: operator, second: second, bool: 'or'});
    return this;
  },

  // Explicitly set the type of join, useful within a function when creating a grouped join.
  type: function(type) {
    this.joinType = type;
    return this;
  }

};

exports.JoinClause = JoinClause;
