'use strict';

// JoinClause
// -------

// The "JoinClause" is an object holding any necessary info about a join,
// including the type, and any associated tables & columns being joined.
function JoinClause(table, type) {
  this.table    = table;
  this.joinType = type;
  this.clauses  = [];
  this.and      = this;
}

JoinClause.prototype.grouping = 'join';

// Adds an "on" clause to the current join object.
JoinClause.prototype.on = function(first, operator, second) {
  var data;
  switch (arguments.length) {
    case 1:  data = ['on', this._bool(), first]; break;
    case 2:  data = ['on', this._bool(), first, '=', operator]; break;
    default: data = ['on', this._bool(), first, operator, second];
  }
  this.clauses.push(data);
  return this;
};

// Adds a "using" clause to the current join.
JoinClause.prototype.using = function(table) {
  return this.clauses.push(['using', this._bool(), table]);
};

// Adds an "and on" clause to the current join object.
JoinClause.prototype.andOn = function() {
  return this.on.apply(this, arguments);
};

// Adds an "or on" clause to the current join object.
JoinClause.prototype.orOn = function(first, operator, second) {
  /*jshint unused: false*/
  return this._bool('or').on.apply(this, arguments);
};

// Explicitly set the type of join, useful within a function when creating a grouped join.
JoinClause.prototype.type = function(type) {
  this.joinType = type;
  return this;
};

JoinClause.prototype._bool = function(bool) {
  if (arguments.length === 1) {
    this._boolFlag = bool;
    return this;
  }
  var ret = this._boolFlag || 'and';
  this._boolFlag = 'and';
  return ret;
};

Object.defineProperty(JoinClause.prototype, 'or', {
  get: function () {
    return this._bool('or');
  }
});

module.exports = JoinClause;