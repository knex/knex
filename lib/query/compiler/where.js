// A helper class for compiling where statements for the client.
var WhereCompiler = function(statement, formatter) {
  this.statement = statement;
  this.formatter = formatter;
};

WhereCompiler.prototype = {

  constructor: WhereCompiler,

  toString: function() {
    return '[Object Knex:WhereCompiler]';
  },

  toSql: function() {
    return this[this.statement.type]();
  },

  whereIn: function() {
    var s = this.statement;
    return this.formatter.wrap(s.column) + ' ' + this._not('in ') +
      this.wrap(this.formatter.parameterize(s.value));
  },

  whereNull: function() {
    return this.formatter.wrap(this.statement.column) + ' is ' + this._not('null');
  },

  // Compiles a basic "where" clause.
  whereBasic: function() {
    var s = this.statement;
    return this.formatter.wrap(s.column) + ' ' + this.formatter.operator(s.operator) + ' ' +
      this.formatter.parameter(s.value);
  },

  whereExists: function() {
    return this._not('exists') + ' (' + this.formatter.compileCallback(this.statement.value) + ')';
  },

  whereWrapped: function() {
    return '(' + this.formatter.compileCallback(this.statement.value, 'where').slice(6) + ')';
  },

  whereBetween: function() {
    var s = this.statement;
    return this.formatter.wrap(s.column) + ' ' + this._not('between') + ' ' +
      this.formatter.parameterize(s.value, ' and ');
  },

  // Compiles a "whereRaw" query.
  whereRaw: function() {
    return this.formatter.checkRaw(this.statement.value);
  },

  wrap: function(str) {
    if (str.charAt(0) !== '(') return '(' + str + ')';
    return str;
  },

  // Determines whether to add a "not" prefix to the where clause.
  _not: function(str) {
    if (this.statement.not) {
      return 'not ' + str;
    }
    return str;
  }

};

module.exports = WhereCompiler;