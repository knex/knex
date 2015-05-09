'use strict';

var assign = require('lodash/object/assign');

// JoinClause
// -------

// The "JoinClause" is an object holding any necessary info about a join,
// including the type, and any associated tables & columns being joined.
function JoinClause(table, type) {
  this.table = table;
  this.joinType = type;
  this.and = this;
  this.clauses = [];
}

assign(JoinClause.prototype, {

  grouping: 'join',

  // Adds an "on" clause to the current join object.
  on: function on(first, operator, second) {
    var data,
        bool = this._bool();
    switch (arguments.length) {
      case 1:
        {
          if (typeof first === 'object' && typeof first.toSQL !== 'function') {
            var i = -1,
                keys = Object.keys(first);
            var method = bool === 'or' ? 'orOn' : 'on';
            while (++i < keys.length) {
              this[method](keys[i], first[keys[i]]);
            }
            return this;
          } else {
            data = [bool, 'on', first];
          }
          break;
        }
      case 2:
        data = [bool, 'on', first, '=', operator];break;
      default:
        data = [bool, 'on', first, operator, second];
    }
    this.clauses.push(data);
    return this;
  },

  // Adds a "using" clause to the current join.
  using: function using(table) {
    return this.clauses.push([this._bool(), 'using', table]);
  },

  // Adds an "and on" clause to the current join object.
  andOn: function andOn() {
    return this.on.apply(this, arguments);
  },

  // Adds an "or on" clause to the current join object.
  orOn: function orOn(first, operator, second) {
    /*jshint unused: false*/
    return this._bool('or').on.apply(this, arguments);
  },

  // Explicitly set the type of join, useful within a function when creating a grouped join.
  type: function type(_type) {
    this.joinType = _type;
    return this;
  },

  _bool: function _bool(bool) {
    if (arguments.length === 1) {
      this._boolFlag = bool;
      return this;
    }
    var ret = this._boolFlag || 'and';
    this._boolFlag = 'and';
    return ret;
  }

});

Object.defineProperty(JoinClause.prototype, 'or', {
  get: function get() {
    return this._bool('or');
  }
});

module.exports = JoinClause;