// SQLite3 Grammar
// -------

// Extend the standard sql builder with any SQLite specific oddities.
module.exports = function(client) {

  var _            = require('lodash');
  var Helpers      = require('../../../helpers');
  var QueryBuilder = require('../../../query')(client);

  var bindings = Helpers.bindings;
  var single   = Helpers.single;

  return QueryBuilder.extend({

    // Sets the values for an `insert` query.
    insert: single(function(values) {
      this._method = 'insert';
      var columns, columnList;
      var rawData = this._prepInsert(values);
      var insertVals = _.map(rawData, function(obj, i) {
        if (i === 0) {
          var cols = _.pluck(obj, 0);
          columns = this._columnize(cols);
          columnList = _.map(cols, this._wrap, this);
        }
        return '(' + _.pluck(obj, 1).join(', ') + ')';
      }, this);
      return {
        type: 'insert',
        columns: columns ? '(' + columns + ')' : '',
        value: insertVals.join(', '),
        columnList: columnList,
        rawData: rawData
      };
    }),

    // For share and for update are not available in sqlite3.
    forUpdate: function() {
      return this;
    },
    forShare:  function() {
      return this;
    },

    // Adds a `order by` clause to the query.
    orderBy: bindings(function(column, direction) {
      var cols = _.isArray(column) ? column : [column];
      return {
        type: 'order',
        value: this._columnize(cols) + ' collate nocase ' + this._direction(direction)
      };
    }),

    // Retrieves columns for the table specified by `knex(tableName)`
    columnInfo: function() {
      var table = _.find(this.statements, function (statement) {
        return statement.type === 'table';
      });
      var tableName = table.value.substr(1, table.value.length-2);

      this._method = 'pragma';
      this.statements.push({
        type: 'pragma',
        sql: 'table_info(' + tableName +')',
      });

      return this.then(function(resp) {
        var maxLengthRegex = /.*\((\d+)\)/;
        return _.reduce(resp, function (columns, val) {
          var type = val.type;
          var maxLength = (maxLength = type.match(maxLengthRegex)) && maxLength[1];
          type = maxLength ? type.split('(')[0] : type;
          columns[val.name] = {
            type: type.toLowerCase(),
            charMaxLength: maxLength
          };
          return columns;
        }, {});
      });
    }

  });

};
