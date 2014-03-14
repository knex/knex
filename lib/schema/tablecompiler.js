// Table Compiler
// -------
module.exports = function(client) {
  var _ = require('lodash');

  var Raw         = require('../raw');
  var Helpers     = require('../helpers');
  var modifierFns = require('./tablecompiler/modifiers');

  function SchemaTableCompiler(tableInterface) {
    _.each(['method', 'tableName', 'columns', 'statements', 'attributes'], function(method) {
      this[method] = tableInterface['__' + method];
    }, this);
    this.formatter    = new client.Formatter();
    this.tableNameRaw = this.tableName;
    this.tableName = this.formatter.wrap(this.tableName);
  }

  // The "alter" and "create" methods are the two main methods called
  SchemaTableCompiler.prototype = {

    constructor: SchemaTableCompiler,

    toSql: function TableCompiler$toSql() {
      return this[this.method]();
    },

    create: function TableCompiler$create() {
      var returnSql = this.returnSql = [];
      returnSql.push({sql: ''});
      returnSql[0].sql = 'create table ' + this.tableName + ' (' + this.getColumns().join(', ') + ')';
      this.alterColumns();
      this.addIndexes();
      return returnSql;
    },

    alter: function() {
      var returnSql = this.returnSql = [];
      this.addColumns();
      this.alterColumns();
      this.addIndexes();
      return returnSql;
    },

    addColumnsPrefix: 'add column ',

    addColumns: function() {
      var columns = this.getColumns();
      if (columns.length > 0) {
        this.returnSql.push({sql: '', bindings: []});
        columns = _.map(columns, function(column) {
          return this.addColumnsPrefix + column;
        }, this);
        this.returnSql[0].sql = 'alter table ' + this.tableName + ' ' + columns.join(', ');
      }
    },

    alterColumns: function() {
      var alterColumns = _.where(this.statements, {type: 'alterColumns'});
      for (var i = 0, l = alterColumns.length; i < l; i++) {
        var statement = alterColumns[i];
        this.returnSql.push(this[statement.method].apply(this, statement.args));
      }
    },

    // Add indexes on the statements.
    addIndexes: function TableCompiler$addIndexes() {
      var indexStatements = _.where(this.statements, {type: 'indexes'});
      for (var i = 0, l = indexStatements.length; i < l; i++) {
        var statement = indexStatements[i];
        var obj = this.keys[statement.method].apply(this, statement.args);
        if (obj) this.returnSql.push(obj);
      }
    },

    // ----------------------------------------

    // Compile the columns as needed for the current create or alter table
    getColumns: function TableCompiler$getColumns() {
      var compiledColumns = [], columns = this.columns;
      for (var i = 0, l = columns.length; i < l; i++) {
        this.currentColumn = columns[i];
        compiledColumns.push(this.compileColumn(columns[i]));
      }
      this.currentColumn = void 0;
      return compiledColumns;
    },

    compileColumn: function TableCompiler$compileColumn(column) {
      return this.formatter.wrap(this.getColumnName(column)) + ' ' + this.getColumnType(column) + this.getModifiers(column);
    },

    getColumnType: function TableCompiler$getColumnType(column) {
      var type = this.types[column.method];
      return _.isFunction(type) ? type.apply(this, _.rest(column.args)) : type;
    },

    getModifiers: function(column) {
      var modifiers = [];
      if (column.method !== 'timestamps' && column.method.indexOf('increments') === -1) {
        var modifierTypes = this.modifierTypes;
        var statements = column.chainable.__modifiers;
        for (var i = 0, l = modifierTypes.length; i < l; i++) {
          var modifier = modifierTypes[i];
          var statement = statements[modifier];
          if (statement) {
            var val = this.modifiers[modifier].apply(this, statement);
            if (val) modifiers.push(val);
          }
        }
      }
      return modifiers.length > 0 ? ' ' + modifiers.join(' ') : '';
    },

    // Assumes that the autoincrementing key is named `id` if not otherwise specified.
    getColumnName: function(column) {
      var value = _.first(column.args);
      if (value) return value;
      if (column.method === 'timestamps') return '';
      if (column.method.indexOf('increments') !== -1) {
        return 'id';
      } else {
        throw new Error('You did not specify a column name for the ' + column.originalMethod + 'column on ' + this.tableName);
      }
    },

    dropUnique: function(value) {
      return {
        sql: 'drop index ' + value
      };
    },

    dropColumnPrefix: 'drop column ',

    dropColumn: function() {
      var columns = Helpers.normalizeArr.apply(null, arguments);
      var drops = _.map(_.isArray(columns) ? columns : [columns], function(column) {
        return this.dropColumnPrefix + this.formatter.wrap(column);
      }, this);
      return {
        sql: 'alter table ' + this.tableName + ' ' + drops.join(', ')
      };
    },

    // If no name was specified for this index, we will create one using a basic
    // convention of the table name, followed by the columns, followed by an
    // index type, such as primary or index, which makes the index unique.
    _indexCommand: function(type, tableName, columns) {
      if (!_.isArray(columns)) columns = columns ? [columns] : [];
      var table = tableName.replace(/\.|-/g, '_');
      return (table + '_' + columns.join('_') + '_' + type).toLowerCase();
    }

  };

  SchemaTableCompiler.extend = require('simple-extend');

  return SchemaTableCompiler;

};