module.exports = function(client) {
  var _ = require('lodash');

  return {

    index: function(columns, indexName) {
      indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
      return {
        sql: 'alter table ' + this.tableName + " add index " + indexName + "(" + this.formatter.columnize(columns) + ")"
      };
    },

    primary: function(columns, indexName) {
      indexName = indexName || this._indexCommand('primary', this.tableNameRaw, columns);
      return {
        sql: 'alter table ' + this.tableName + " add primary key " + indexName + "(" + this.formatter.columnize(columns) + ")"
      };
    },

    unique: function(columns, indexName) {
      indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
      return {
        sql: 'alter table ' + this.tableName + " add unique " + indexName + "(" + this.formatter.columnize(columns) + ")"
      };
    },

    // Compile a drop index command.
    dropIndex: function(key) {
      return {
        sql: 'alter table ' + this.tableName + ' drop index ' + key
      };
    },

    // Compile a drop foreign key command.
    dropForeign: function(key) {
      return {
        sql: 'alter table ' + this.tableName + ' drop foreign key ' + key
      };
    },

    // Compile a drop primary key command.
    dropPrimary: function() {
      return {
        sql: 'alter table ' + this.tableName + ' drop primary key'
      };
    },

    // Compile a drop unique key command.
    dropUnique: function(key) {
      return {
        sql: 'alter table ' + this.tableName + ' drop index ' + key
      };
    },

    // Compile a foreign key command.
    foreign: function(foreignData) {
      var sql = '';
      if (foreignData.inTable && foreignData.references) {
        var keyName    = this._indexCommand('foreign', this.tableNameRaw, foreignData.column);
        var column     = this.formatter.columnize(foreignData.column);
        var references = this.formatter.columnize(foreignData.references);
        var inTable    = this.formatter.wrap(foreignData.inTable);

        sql = 'alter table ' + this.tableName + ' add constraint ' + keyName + ' ';
        sql += 'foreign key (' + column + ') references ' + inTable + ' (' + references + ')';

        // Once we have the basic foreign key creation statement constructed we can
        // build out the syntax for what should happen on an update or delete of
        // the affected columns, which will get something like 'cascade', etc.
        if (foreignData.onDelete) sql += ' on delete ' + foreignData.onDelete;
        if (foreignData.onUpdate) sql += ' on update ' + foreignData.onUpdate;
      }
      return {
        sql: sql
      };
    }
  };

};