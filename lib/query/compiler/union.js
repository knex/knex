// A helper class for compiling union statements for the client.
var UnionCompiler = function(statement, formatter) {
  this.statement = statement;
  this.formatter = formatter;
};

UnionCompiler.prototype = {

  constructor: UnionCompiler,

  toString: function() {
    return '[Object Knex:QueryCompiler:Union]';
  },

};

module.exports = UnionCompiler;