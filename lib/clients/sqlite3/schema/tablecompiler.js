module.exports = function(client) {
  var _ = require('lodash');
  var SchemaTableCompiler = require('../../../schema/tablecompiler')(client);
  var Promise = require('../../../promise');

  return SchemaTableCompiler.extend({

    // The possible column modifiers.
    modifierTypes: ['nullable', 'defaultTo'],

    // All types for sqlite3 builder. Feel free to fiddle with them on
    // the client object if you wish, they're unique per-client.
    types: require('./tablecompiler/types')(client),

    // All modifiers for the sqlite3 builder.
    modifiers: require('./tablecompiler/modifiers')(client),

    // All key related statements for the sqlite3 builder.
    keys: require('./tablecompiler/keys')(client),

    // Create a new table.
    create: function() {
      var returnSql = this.returnSql = [];
      returnSql.push({sql: '', bindings: []});
      var sql = 'create table ' + this.tableName + ' (' + this.getColumns().join(', ');

      // SQLite forces primary keys to be added when the table is initially created
      // so we will need to check for a primary key commands and add the columns
      // to the table's declaration here so they can be created on the tables.
      sql += this.sqliteForeignKeys() || '';
      sql += this.sqlitePrimaryKeys() || '';
      returnSql[0].sql = sql + ')';

      this.alterColumns();
      this.addIndexes();
      return returnSql;
    },

    alter: function() {
      var returnSql = this.returnSql = [];
      var columns = this.getColumns();
      for (var i = 0, l = columns.length; i < l; i++) {
        var column = columns[i];
        this.returnSql.push({sql: 'alter table ' + this.tableName + ' add column ' + column});
      }
      this.alterColumns();
      this.addIndexes();
      return returnSql;
    },

    sqliteForeignKeys: function() {
      var sql = '';
      var foreignKeys = _.where(this.statements, {type: 'indexes', method: 'foreign'});
      for (var i = 0, l = foreignKeys.length; i < l; i++) {
        var foreign = foreignKeys[i].args[0];
        var column        = this.formatter.columnize(foreign.column);
        var references    = this.formatter.columnize(foreign.references);
        var foreignTable  = this.formatter.wrap(foreign.inTable);
        sql += ', foreign key(' + column + ') references ' + foreignTable + '(' + references + ')';
      }
      return sql;
    },

    sqlitePrimaryKeys: function() {
      var indexes = _.where(this.statements, {type: 'indexes', method: 'primary'});
      if (indexes.length > 0) {
        var primary = indexes[0];
        var columns = primary.args[0];
        if (columns) {
          return ', primary key (' + this.formatter.columnize(columns) + ')';
        }
      }
    },

    createTableBlock: function() {
      return this.getColumns().concat().join(',');
    },

    // Compile a rename column command... very complex in sqlite
    renameColumn: function(from, to) {
      var tableName    = this.tableName;
      var tableNameRaw = this.tableNameRaw;
      var wrappedFrom  = this.formatter.wrap(from);
      var wrappedTo    = this.formatter.wrap(to);
      return {
        sql: 'PRAGMA table_info(' + this.tableName + ')',
        output: function(pragma) {
          var currentCol = _.findWhere(pragma, {name: from});
          if (!currentCol) throw new Error('The column ' + from + ' is not in the ' + tableName + ' table');
          return this.query({sql: 'SELECT name, sql FROM sqlite_master WHERE type="table" AND name=' + tableName + ''})
            .bind(this)
            .tap(function() {
              if (this.connection.__knexTransaction !== 1) {
                return this.query({sql: 'begin transaction;'});
              }
            })
            .tap(function() {
              return this.query({sql: 'ALTER TABLE ' + tableName + ' RENAME TO _knex_temp_rename_column_' + tableNameRaw});
            })
            .then(function(sql) {
              var createTable   = sql[0];
              var currentColumn =  wrappedFrom + ' ' + currentCol.type;
              var newColumn     =  wrappedTo   + ' ' + currentCol.type;
              if (createTable.sql.indexOf(currentColumn) === -1) {
                throw new Error('Unable to find the column to change');
              }
              return Promise.all([
                this.query({sql: createTable.sql.replace(currentColumn, newColumn)}),
                this.query({sql: 'SELECT * FROM "_knex_temp_rename_column_' + tableNameRaw + '"'})
              ]);
            })
            .spread(function(createTable, selected) {
              var insertQuery = new this.client.Query().table(tableNameRaw).insert(_.map(selected, function(row) {
                row[to] = row[from];
                return _.omit(row, from);
              }));
              return Promise.all([
                this.query(insertQuery.toSql()),
                this.query({sql: 'DROP TABLE "_knex_temp_rename_column_' + tableNameRaw + '"'})
              ]);
            }).tap(function() {
              if (this.connection.__knexTransaction !== 1) {
                return this.query({sql: 'commit;'});
              }
            }).catch(function(e) {
              if (this.connection.__knexTransaction !== 1) {
                return this.query({sql: 'rollback;'});
              }
              throw e;
            });
        }
      };
    }

  });

};