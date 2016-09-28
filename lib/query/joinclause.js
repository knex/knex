'use strict';

exports.__esModule = true;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

(0, _assign3.default)(JoinClause.prototype, {

  grouping: 'join',

  // Adds an "on" clause to the current join object.
  on: function on(first, operator, second) {
    if (typeof first === 'function') {
      this.clauses.push({
        type: 'onWrapped',
        value: first,
        bool: this._bool()
      });
      return this;
    }

    var data = void 0;
    var bool = this._bool();
    switch (arguments.length) {
      case 1:
        {
          if ((typeof first === 'undefined' ? 'undefined' : (0, _typeof3.default)(first)) === 'object' && typeof first.toSQL !== 'function') {
            var keys = (0, _keys2.default)(first);
            var i = -1;
            var method = bool === 'or' ? 'orOn' : 'on';
            while (++i < keys.length) {
              this[method](keys[i], first[keys[i]]);
            }
            return this;
          } else {
            data = { type: 'onRaw', value: first, bool: bool };
          }
          break;
        }
      case 2:
        data = { type: 'onBasic', column: first, operator: '=', value: operator, bool: bool };break;
      default:
        data = { type: 'onBasic', column: first, operator: operator, value: second, bool: bool };
    }
    this.clauses.push(data);
    return this;
  },


  // Adds a "using" clause to the current join.
  using: function using(column) {
    return this.clauses.push({ type: 'onUsing', column: column, bool: this._bool() });
  },


  /*// Adds an "and on" clause to the current join object.
  andOn() {
    return this.on.apply(this, arguments);
  },*/

  // Adds an "or on" clause to the current join object.
  orOn: function orOn(first, operator, second) {
    return this._bool('or').on.apply(this, arguments);
  },
  onBetween: function onBetween(column, values) {
    (0, _assert2.default)(Array.isArray(values), 'The second argument to onBetween must be an array.');
    (0, _assert2.default)(values.length === 2, 'You must specify 2 values for the onBetween clause');
    this.clauses.push({
      type: 'onBetween',
      column: column,
      value: values,
      bool: this._bool(),
      not: this._not()
    });
    return this;
  },
  onNotBetween: function onNotBetween(column, values) {
    return this._not(true).onBetween(column, values);
  },
  orOnBetween: function orOnBetween(column, values) {
    return this._bool('or').onBetween(column, values);
  },
  orOnNotBetween: function orOnNotBetween(column, values) {
    return this._bool('or')._not(true).onBetween(column, values);
  },
  onIn: function onIn(column, values) {
    if (Array.isArray(values) && values.length === 0) return this.where(this._not());
    this.clauses.push({
      type: 'onIn',
      column: column,
      value: values,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },
  onNotIn: function onNotIn(column, values) {
    return this._not(true).onIn(column, values);
  },
  orOnIn: function orOnIn(column, values) {
    return this._bool('or').onIn(column, values);
  },
  orOnNotIn: function orOnNotIn(column, values) {
    return this._bool('or')._not(true).onIn(column, values);
  },
  onNull: function onNull(column) {
    this.clauses.push({
      type: 'onNull',
      column: column,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },
  orOnNull: function orOnNull(callback) {
    return this._bool('or').onNull(callback);
  },
  onNotNull: function onNotNull(callback) {
    return this._not(true).onNull(callback);
  },
  orOnNotNull: function orOnNotNull(callback) {
    return this._not(true)._bool('or').onNull(callback);
  },
  onExists: function onExists(callback) {
    this.clauses.push({
      type: 'onExists',
      value: callback,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },
  orOnExists: function orOnExists(callback) {
    return this._bool('or').onExists(callback);
  },
  onNotExists: function onNotExists(callback) {
    return this._not(true).onExists(callback);
  },
  orOnNotExists: function orOnNotExists(callback) {
    return this._not(true)._bool('or').onExists(callback);
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
  },
  _not: function _not(val) {
    if (arguments.length === 1) {
      this._notFlag = val;
      return this;
    }
    var ret = this._notFlag;
    this._notFlag = false;
    return ret;
  }
});

Object.defineProperty(JoinClause.prototype, 'or', {
  get: function get() {
    return this._bool('or');
  }
});

JoinClause.prototype.andOn = JoinClause.prototype.on;
JoinClause.prototype.andOnIn = JoinClause.prototype.onIn;
JoinClause.prototype.andOnNotIn = JoinClause.prototype.onNotIn;
JoinClause.prototype.andOnNull = JoinClause.prototype.onNull;
JoinClause.prototype.andOnNotNull = JoinClause.prototype.onNotNull;
JoinClause.prototype.andOnExists = JoinClause.prototype.onExists;
JoinClause.prototype.andOnNotExists = JoinClause.prototype.onNotExists;
JoinClause.prototype.andOnBetween = JoinClause.prototype.onBetween;
JoinClause.prototype.andOnNotBetween = JoinClause.prototype.onNotBetween;

exports.default = JoinClause;
module.exports = exports['default'];