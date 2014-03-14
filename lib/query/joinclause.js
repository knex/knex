// JoinClause
// ---------

// The "JoinClause" is an object holding any necessary info about a join,
// including the type, and any associated tables & columns being joined.
var Helpers = require('../helpers');

var JoinClause = function(table, type) {
  this.table = table;
  this.joinType = type;
  this.clauses  = [];
  this.grouping = 'join';
};

JoinClause.prototype = {

  constructor: JoinClause,

  // Adds an "on" clause to the current join object.
  on: function(first, operator, second) {
    if (arguments.length === 2) {
      data = [this._bool(), first, '=', operator];
    } else {
      data = [this._bool(), first, operator, second];
    }
    this.clauses.push(data);
    return this;
  },

  // Adds an "and on" clause to the current join object.
  andOn: function() {
    return this.on.apply(this, arguments);
  },

  // Adds an "or on" clause to the current join object.
  orOn: function(first, operator, second) {
    return this._bool('or').on.apply(this, arguments);
  },

  // Explicitly set the type of join, useful within a function when creating a grouped join.
  type: function(type) {
    this.joinType = type;
    return this;
  },

  _bool: function(bool) {
    if (arguments.length === 1) {
      this._boolFlag = bool;
      return this;
    }
    var ret = this._boolFlag || 'and';
    this._boolFlag = 'and';
    return ret;
  }

};

module.exports = JoinClause;