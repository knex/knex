// WhereCompiler

// A helper class for compiling where statements for the client.
function WhereCompiler(formatter) {
  this.f = formatter;
}

WhereCompiler.prototype.toString = function() {
  return '[Object Knex:WhereCompiler]';
};

WhereCompiler.prototype.toSQL = function(statement) {
  return this[statement.type](statement);
};

WhereCompiler.prototype.whereIn = function(statement) {
  return this.f.wrap(statement.column) + ' ' + this._not(s, 'in ') +
    this.wrap(this.f.parameterize(statement.value));
};

WhereCompiler.prototype.whereNull = function(statement) {
  return this.f.wrap(statement.column) + ' is ' + this._not(s, 'null');
};

// Compiles a basic "where" clause.
WhereCompiler.prototype.whereBasic = function(statement) {
  return this.f.wrap(statement.column) + ' ' +
    this.f.operator(statement.operator) + ' ' +
    this.f.parameter(statement.value);
};

WhereCompiler.prototype.whereExists = function(statement) {
  return this._not(s, 'exists') + ' (' + this.f.compileCallback(statement.value) + ')';
};

WhereCompiler.prototype.whereWrapped = function(statement) {
  return '(' + this.f.compileCallback(statement.value, 'where').slice(6) + ')';
};

WhereCompiler.prototype.whereBetween = function(statement) {
  return this.f.wrap(statement.column) + ' ' + this._not(s, 'between') + ' ' +
    this.f.parameterize(statement.value, ' and ');
};

// Compiles a "whereRaw" query.
WhereCompiler.prototype.whereRaw = function(statement) {
  return this.f.checkRaw(statement.value);
};

WhereCompiler.prototype.wrap = function(str) {
  if (str.charAt(0) !== '(') return '(' + str + ')';
  return str;
};

// Determines whether to add a "not" prefix to the where clause.
WhereCompiler.prototype._not = function(statement, str) {
  if (statement.not) {
    return 'not ' + str;
  }
  return str;
};

module.exports = WhereCompiler;