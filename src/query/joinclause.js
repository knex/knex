
var assign = require('lodash/object/assign');

// JoinClause
// -------

// The "JoinClause" is an object holding any necessary info about a join,
// including the type, and any associated tables & columns being joined.
function JoinClause(table, type) {
  this.table    = table;
  this.joinType = type;
  this.and      = this;
  this.clauses  = [];
}

assign(JoinClause.prototype, {

  grouping: 'join',

  // Adds an "on" clause to the current join object.
  on: function(first, operator, second) {
    var data, bool = this._bool()
    switch (arguments.length) {
      case 1:  {
        if (typeof first === 'object' && typeof first.toSQL !== 'function') {
          var i = -1, keys = Object.keys(first)
          var method = bool === 'or' ? 'orOn' : 'on'
          while (++i < keys.length) {
            this[method](keys[i], first[keys[i]])
          }
          return this;
        } else {
          data = [bool, 'on', first]
        }
        break;
      }
      case 2:  data = [bool, 'on', first, '=', operator]; break;
      default: data = [bool, 'on', first, operator, second];
    }
    this.clauses.push(data);
    return this;
  },

  // Adds a "using" clause to the current join.
  using: function(table) {
    return this.clauses.push([this._bool(), 'using', table]);
  },

  // Adds an "and on" clause to the current join object.
  andOn: function() {
    return this.on.apply(this, arguments);
  },

  // Adds an "or on" clause to the current join object.
  orOn: function(first, operator, second) {
    /*jshint unused: false*/
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

})

Object.defineProperty(JoinClause.prototype, 'or', {
  get: function () {
    return this._bool('or');
  }
});

module.exports = JoinClause;