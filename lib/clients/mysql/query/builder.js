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
      var table = _.find(this.statements, function (statement) {
        return statement.type === 'table';
      });
      var tableName = table.value.substr(1, table.value.length-2);

      return this.table('information_schema.columns')
      .select('column_name', 'data_type', 'character_maximum_length')
      .where('table_name', '=', tableName)
      .where('table_schema', '=', client.database())
      .then(function (resp) {
        return _.reduce(resp, function (columns, val) {
          columns[val.column_name] = {
            type: val.data_type,
            charMaxLength: val.character_maximum_length
          };
          return columns;
        }, {});
      });
    }

  });
};
