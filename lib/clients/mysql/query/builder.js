// MySQL Grammar
// -------
module.exports = function(client) {

  var _            = require('lodash');
  var Helpers      = require('../../../helpers');
  var QueryBuilder = require('../../../query')(client);

  return QueryBuilder.extend({

    // Adds a `for update` clause to the query, relevant with transactions.
    forUpdate: function() {
      if (this.flags.transacting) {
        this.statements.push({
          type: 'lock',
          value: 'for update'
        });
      }
      return this;
    },

    // Adds a `for share` clause to the query, relevant with transactions.
    forShare: function() {
      if (this.flags.transacting) {
        this.statements.push({
          type: 'lock',
          value: 'lock in share mode'
        });
      }
      return this;
    },

    // Retrieves columns for the table specified by `knex(tableName)`
    columnInfo: function() {
      this._method = 'columnInfo';
      // left this in just so it shows up on the object,
      // doesn't really do anything
      this.statements.push({
        type: 'columnInfo',
      });
      return this;
    }

  });
};
