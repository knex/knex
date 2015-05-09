
// MySQL Table Builder & Compiler
// -------
var inherits      = require('inherits');
var TableCompiler = require('../../../schema/tablecompiler');
var helpers       = require('../../../helpers');
var Promise       = require('../../../promise');
var assign        = require('lodash/object/assign');

// Table Compiler
// ------

function TableCompiler_MySQL() {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_MySQL, TableCompiler);

assign(TableCompiler_MySQL.prototype, {

  createQuery: function(columns, ifNot) {
    var createStatement = ifNot ? 'create table if not exists ' : 'create table ';
    var client = this.client, conn = {}, 
      sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')';

    // Check if the connection settings are set.
    if (client.connectionSettings) {
      conn = client.connectionSettings;
    }

    var charset   = this.single.charset || conn.charset || '';
    var collation = this.single.collate || conn.collate || '';
    var engine    = this.single.engine  || '';

    // var conn = builder.client.connectionSettings;
    if (charset)   sql += ' default character set ' + charset;
    if (collation) sql += ' collate ' + collation;
    if (engine)    sql += ' engine = ' + engine;

    if (this.single.comment) {
      var comment = (this.single.comment || '');
      if (comment.length > 60) helpers.warn('The max length for a table comment is 60 characters');
      sql += " comment = '" + comment + "'";
    }

    this.pushQuery(sql);
  },

  addColumnsPrefix: 'add ',
  
  dropColumnPrefix: 'drop ',

  // Compiles the comment on the table.
  comment: function(comment) {
    this.pushQuery('alter table ' + this.tableName() + " comment = '" + comment + "'");
  },

  changeType: function() {
    // alter table + table + ' modify ' + wrapped + '// type';
  },

  // Renames a column on the table.
  renameColumn: function(from, to) {
    var compiler = this;
    var table    = this.tableName();
    var wrapped  = this.formatter.wrap(from) + ' ' + this.formatter.wrap(to);
    
    this.pushQuery({
      sql: 'show fields from ' + table + ' where field = ' +
        this.formatter.parameter(from),
      output: function(resp) {
        var column = resp[0];
        var runner = this;
        return compiler.getFKRefs(runner).get(0)
          .then(function (refs) {
            return Promise.try(function () {
              if (!refs.length) { return; }
              return compiler.dropFKRefs(runner, refs);
            }).then(function () {
              return runner.query({
                sql: 'alter table ' + table + ' change ' + wrapped + ' ' + column.Type
              });
            }).then(function () {
              if (!refs.length) { return; }
              return compiler.createFKRefs(runner, refs.map(function (ref) {
                if (ref.REFERENCED_COLUMN_NAME === from) {
                  ref.REFERENCED_COLUMN_NAME = to;
                }
                if (ref.COLUMN_NAME === from) {
                  ref.COLUMN_NAME = to;
                }
                return ref;
              }));
            });
          });
      }
    });
  },

  getFKRefs: function (runner) {
    var formatter = this.client.formatter();
    var sql = 'SELECT KCU.CONSTRAINT_NAME, KCU.TABLE_NAME, KCU.COLUMN_NAME, '+
              '       KCU.REFERENCED_TABLE_NAME, KCU.REFERENCED_COLUMN_NAME, '+
              '       RC.UPDATE_RULE, RC.DELETE_RULE '+
              'FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KCU '+
              'JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS AS RC '+
              '       USING(CONSTRAINT_NAME)' +
              'WHERE KCU.REFERENCED_TABLE_NAME = ' + formatter.parameter(this.tableNameRaw) + ' '+
              '  AND KCU.CONSTRAINT_SCHEMA = ' + formatter.parameter(this.client.database());

    return runner.query({
      sql: sql,
      bindings: formatter.bindings
    });
  },

  dropFKRefs: function (runner, refs) {
    var formatter = this.client.formatter();
    
    return Promise.all(refs.map(function (ref) {
      var constraintName = formatter.wrap(ref.CONSTRAINT_NAME);
      return runner.query({
        sql: 'alter table ' + this.tableName() + ' drop foreign key ' + constraintName
      });
    }.bind(this)));
  },
  createFKRefs: function (runner, refs) {
    var formatter = this.client.formatter();
    
    return Promise.all(refs.map(function (ref) {
      var keyName    = formatter.wrap(ref.COLUMN_NAME);
      var column     = formatter.columnize(ref.COLUMN_NAME);
      var references = formatter.columnize(ref.REFERENCED_COLUMN_NAME);
      var inTable    = formatter.wrap(ref.REFERENCED_TABLE_NAME);
      var onUpdate   = ' ON UPDATE ' + ref.UPDATE_RULE;
      var onDelete   = ' ON DELETE ' + ref.DELETE_RULE;
      
      return runner.query({
        sql: 'alter table ' + this.tableName() + ' add constraint ' + keyName + ' ' + 
          'foreign key (' + column + ') references ' + inTable + ' (' + references + ')' + onUpdate + onDelete
      });
    }.bind(this)));
  },
  index: function(columns, indexName) {
    indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + " add index " + indexName + "(" + this.formatter.columnize(columns) + ")");
  },

  primary: function(columns, indexName) {
    indexName = indexName || this._indexCommand('primary', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + " add primary key " + indexName + "(" + this.formatter.columnize(columns) + ")");
  },

  unique: function(columns, indexName) {
    indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + " add unique " + indexName + "(" + this.formatter.columnize(columns) + ")");
  },

  // Compile a drop index command.
  dropIndex: function(columns, indexName) {
    indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
  },

  // Compile a drop foreign key command.
  dropForeign: function(columns, indexName) {
    indexName = indexName || this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' drop foreign key ' + indexName);
  },

  // Compile a drop primary key command.
  dropPrimary: function() {
    this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
  },

  // Compile a drop unique key command.
  dropUnique: function(column, indexName) {
    indexName = indexName || this._indexCommand('unique', this.tableNameRaw, column);
    this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
  }

})

module.exports = TableCompiler_MySQL;
