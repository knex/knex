// MySQL Grammar
// -------
module.exports = function(client) {

  var _            = require('lodash');
  var Helpers      = require('../../../helpers');
  var QueryBuilder = require('../../../query/builder')(client);

  return QueryBuilder.extend({

    // Adds a `for update` clause to the query, relevant with transactions.
    forUpdate: function() {
      if (this.flags.transacting) {
        this.statements.push({
          type: 'lock',
          value: 'for update'
        });
      }
    },

    // Adds a `for share` clause to the query, relevant with transactions.
    forShare: function() {
      if (this.flags.transacting) {
        this.statements.push({
          type: 'lock',
          value: 'lock in share mode'
        });
      }
    }

  });
};