// JoinClause
// ---------

// The "JoinClause" is an object holding any necessary info about a join,
// including the type, and any associated tables & columns being joined.
var Helpers = require('../helpers');

var JoinClause = module.exports = function(type) {
  this.joinType = type;
  this.clauses  = [];
};

JoinClause.prototype = {

  // Adds an "on" clause to the current join object.
  on: function(first, operator, second) {
    if (arguments.length === 2) {
      data = [this.__bool(), first, '=', operator];
    } else {
      data = [this.__bool(), first, operator, second];
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
    return this.__bool('or').on.apply(this, arguments);
  },

  // Explicitly set the type of join, useful within a function when creating a grouped join.
  type: function(type) {
    this.joinType = type;
    return this;
  },

  __bool: function(bool) {
    if (arguments.length === 1) {
      this.__boolFlag = bool;
      return this;
    }
    var ret = this.__boolFlag || 'and';
    this.__boolFlag = 'and';
    return ret;
  }

};