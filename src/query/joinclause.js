
import { assign } from 'lodash'

// JoinClause
// -------

// The "JoinClause" is an object holding any necessary info about a join,
// including the type, and any associated tables & columns being joined.
function JoinClause(table, type, schema) {
  this.schema = schema;
  this.table = table;
  this.joinType = type;
  this.and = this;
  this.clauses = [];
}

assign(JoinClause.prototype, {

  grouping: 'join',

  // Adds an "on" clause to the current join object.
  on(first, operator, second) {
    if (typeof first === 'function') {
      this.clauses.push({
        type: 'onWrapped',
        value: first,
        bool: this._bool()
      });
      return this;
    }

    let data;
    const bool = this._bool()
    switch (arguments.length) {
      case 1:  {
        if (typeof first === 'object' && typeof first.toSQL !== 'function') {
          const keys = Object.keys(first);
          let i = -1;
          const method = bool === 'or' ? 'orOn' : 'on'
          while (++i < keys.length) {
            this[method](keys[i], first[keys[i]])
          }
          return this;
        } else {
          data = {type: 'onRaw', value: first, bool};
        }
        break;
      }
      case 2:  data = {type: 'onBasic', column: first, operator: '=', value: operator, bool}; break;
      default: data = {type: 'onBasic', column: first, operator, value: second, bool};
    }
    this.clauses.push(data);
    return this;
  },

  // Adds a "using" clause to the current join.
  using(column) {
    return this.clauses.push({type: 'onUsing', column, bool: this._bool()});
  },

  // Adds an "and on" clause to the current join object.
  andOn() {
    return this.on.apply(this, arguments);
  },

  // Adds an "or on" clause to the current join object.
  orOn(first, operator, second) {
    return this._bool('or').on.apply(this, arguments);
  },

  // Explicitly set the type of join, useful within a function when creating a grouped join.
  type(type) {
    this.joinType = type;
    return this;
  },

  _bool(bool) {
    if (arguments.length === 1) {
      this._boolFlag = bool;
      return this;
    }
    const ret = this._boolFlag || 'and';
    this._boolFlag = 'and';
    return ret;
  }

})

Object.defineProperty(JoinClause.prototype, 'or', {
  get () {
    return this._bool('or');
  }
});

export default JoinClause;
