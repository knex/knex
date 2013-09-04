(function(define) {

"use strict";

// JoinClause
// ---------
define(function(require, exports) {

  var JoinClause = function(type, table) {
    this.clauses = [];
    this.type = type;
    this.table = table;
  };

  JoinClause.prototype = {

    on: function(first, operator, second) {
      this.clauses.push({first: first, operator: operator, second: second, bool: 'and'});
      return this;
    },

    andOn: function() {
      return this.on.apply(this, arguments);
    },

    orOn: function(first, operator, second) {
      this.clauses.push({first: first, operator: operator, second: second, bool: 'or'});
      return this;
    }
  };

  exports.JoinClause = JoinClause;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports); }
);