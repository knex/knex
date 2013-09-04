(function(define) {

"use strict";

define(function(require, exports) {

  var SchemaInterface = {

    // Modify a table on the schema.
    table: function(callback) {
      this.callback(callback);
      return this._setType('table');
    },

    // Create a new table on the schema.
    createTable: function(callback) {
      this._addCommand('createTable');
      this.callback(callback);
      return this._setType('createTable');
    },

    // Drop a table from the schema.
    dropTable: function() {
      this._addCommand('dropTable');
      return this._setType('dropTable');
    },

    // Drop a table from the schema if it exists.
    dropTableIfExists: function() {
      this._addCommand('dropTableIfExists');
      return this._setType('dropTableIfExists');
    },

    // Rename a table on the schema.
    renameTable: function(to) {
      this._addCommand('renameTable', {to: to});
      return this._setType('renameTable');
    },

    // Determine if the given table exists.
    hasTable: function() {
      this.bindings.push(this.table);
      this._addCommand('tableExists');
      return this._setType('tableExists');
    },

    // Determine if the column exists
    hasColumn: function(column) {
      this.bindings.push(this.table, column);
      this._addCommand('columnExists');
      return this._setType('columnExists');
    }

  };

  exports.SchemaInterface = SchemaInterface;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports); }
);