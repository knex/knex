module.exports = function() {
  var _ = require('lodash');

  var PGKeys = {

    primary: function(columns) {
      return {
        sql: 'alter table ' + this.tableName + " add primary key (" + this._columnize(columns) + ")"
      };
    },

    unique: function(columns, indexName) {
      indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
      return {
        sql: 'alter table ' + this.tableName + ' add constraint ' + indexName + ' unique (' + this._columnize(columns) + ')'
      };
    },

    index: function(columns, indexName) {
      indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
      return {
        sql: 'create index ' + indexName + ' on ' + this.tableName + ' (' + this._columnize(columns) + ')'
      };
    },

    dropColumn: function(builder, command) {
      var table   = this.tableName;
      var columns = _.map(command.columns, function(col) {
        return 'drop column' + this._wrap(col);
      }, this);
      return {
        sql: 'alter table ' + this.tableName + ' ' + columns.join(', ')
      };
    },

    dropIndex: function(index) {
      return {
        sql: 'drop index ' + index
      };
    },

    dropUnique: function(index) {
      return {
        sql: 'alter table ' + this.tableName + ' drop constraint ' + index
      };
    },

    dropForeign: function(index) {
      return {
        sql: 'alter table ' + this.tableName + ' drop constraint ' + index
      };
    },

    dropPrimary: function(builder) {
      return {
        sql: 'alter table ' + this.tableName + " drop constraint " + this.tableNameRaw + "_pkey"
      };
    },

    // Compile a foreign key command.
    foreign: function(foreignData) {
      var sql = '';
      if (foreignData.inTable && foreignData.references) {
        var keyName    = this._indexCommand('foreign', this.tableNameRaw, foreignData.column);
        var column     = this._columnize(foreignData.column);
        var references = this._columnize(foreignData.references);
        var inTable    = this._wrap(foreignData.inTable);

        sql = 'alter table ' + this.tableName + ' add constraint ' + keyName + ' ';
        sql += 'foreign key (' + column + ') references ' + inTable + ' (' + references + ')';
      }
      return {
        sql: sql
      };
    }

  };

  return PGKeys;

};