// PostgreSQL Grammar
// -------

// Extends the standard sql grammar.
module.exports = function(client) {

  var _            = require('lodash');
  var Helpers      = require('../../../helpers');
  var QueryBuilder = require('../../../query')(client);

  return QueryBuilder.extend({

    // Adds a `for update` clause to the query, relevant with transactions.
    forUpdate: function() {
      this.statements.push({
        type: 'lock',
        value: 'for update'
      });
      return this;
    },

    // Adds a `for share` clause to the query, relevant with transactions.
    forShare: function() {
      this.statements.push({
        type: 'lock',
        value: 'for share'
      });
      return this;
    }

  });

};