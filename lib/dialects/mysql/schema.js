module.exports = function(client) {

var _             = require('lodash');
var inherits      = require('inherits');

var Promise       = require('../../promise');

var SchemaBuilder  = require('../../schema/builder');
var SchemaCompiler = require('../../schema/compiler');

var TableBuilder   = require('../../schema/tablebuilder');
var TableCompiler  = require('../../schema/tablecompiler');

var ColumnBuilder  = require('../../schema/columnbuilder');
var ColumnCompiler = require('../../schema/columncompiler');

function SchemaBuilder_MySQL() {
  SchemaBuilder.apply(this, arguments);
}
inherits(SchemaBuilder_MySQL, SchemaBuilder);

SchemaBuilder_MySQL.prototype.toSql = function() {
  var sql = [];
  new SchemaCompiler_MySQL(this);
  for (var i = 0, l = this._sequence.length; i < l; i++) {

  }
  _.map(this._sequence, function() {

  });
};

// Set the "then" method to call `runThen` on the client, processing the query.
SchemaBuilder_MySQL.prototype.then = function(onFulfilled, onRejected) {
  return client.runThen(this).then(onFulfilled, onRejected);
};

function SchemaCompiler_MySQL() {
  this.Formatter = client.Formatter;
  SchemaCompiler.apply(this, arguments);
}
inherits(SchemaCompiler_MySQL, SchemaCompiler);

// Rename a table on the schema.
SchemaCompiler_MySQL.prototype.renameTable = function(tableName, to) {
  return {
    sql: 'rename table ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to)
  };
};

// Check whether a table exists on the query.
SchemaCompiler_MySQL.prototype.hasTable = function(tableName) {
  return {
    sql: 'select * from information_schema.tables where table_schema = ? and table_name = ?',
    bindings: [client.database(), tableName],
    output: function(resp) {
      return resp.length > 0;
    }
  };
};

// Check whether a column exists on the
SchemaCompiler_MySQL.prototype.hasColumn = function(tableName, column) {
  return {
    sql: 'show columns from ' + this.formatter.wrap(tableName) + ' like ?',
    output: function(resp) {
      return resp.length > 0;
    }
  };
};

// Create a new table.
SchemaCompiler_MySQL.prototype.createTable = function() {

};

SchemaCompiler_MySQL.prototype.alterTable = function() {

};

function TableCompiler_MySQL() {
  this.modifierTypes = ['unsigned', 'nullable', 'defaultTo', 'after', 'comment'];
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_MySQL, TableCompiler);

TableCompiler_MySQL.prototype.create = function() {
  var conn = {};
  var returnSql = TableCompiler_MySQL.super_.create();
  var sql = returnSql[0].sql;

  // Check if the connection settings are set.
  if (client.connectionSettings) {
    conn = client.connectionSettings;
  }
  var charset   = this.flags.charset || conn.charset;
  var collation = this.flags.collate || conn.collate;
  var engine    = this.flags.engine;

  // var conn = builder.client.connectionSettings;
  if (charset) sql   += ' default character set ' + charset;
  if (collation) sql += ' collate ' + collation;
  if (engine) sql    += ' engine = ' + engine;

  // // TODO: Handle max comment length ?
  var maxTableCommentLength = 60;
  var hasComment = _.has(this.attributes, 'comment');
  if (hasComment) sql += " comment = '" + (this.attributes.comment || '') + "'";

  this.push(sql);
};


addColumnsPrefix: 'add ',

dropColumnPrefix: 'drop ',

// Compiles the comment on the table.
SchemaCompiler_MySQL.prototype.comment = function(comment) {
  this.push('alter table ' + this.tableName() + " comment = '" + comment + "'");
},

changeType: function() {
  alter table + table + ' modify ' + wrapped + '// type';
}

// Renames a column on the table.
renameColumn: function(from, to) {
  var wrapped = this._wrap(from) + ' ' + this._wrap(to);
  var table = this.tableName();
  return {
    sql: 'show fields from ' + table + ' where field = ' +
      this.formatter.parameter(from),
    output: function(resp) {
      var column = resp[0];
      return this.query({
        sql: 'alter table ' + table + ' change ' + wrapped + ' ' + column.Type
      });
    }
  };
}

};



function TableBuilder_MySQL() {

}

// Warn if we're not in MySQL, since that's the only time these
// three are supported.
var specialMethods = ['engine', 'charset', 'collate'];
_.each(specialMethods, function(method) {



  TableBuilder.prototype[method] = function(value) {
    if (false) {
      warn('Knex only supports ' + method + ' statement with mysql.');
    } if (this.__method === 'alter') {
      warn('Knex does not support altering the ' + method + ' outside of the create table, please use knex.raw statement.');
    } else {
      this.__attributes[method] = value;
    }
  };
});


module.exports = function(client) {

  var _ = require('lodash');
  var SchemaTableCompiler = require('../../../schema/tablecompiler')(client);

  return SchemaTableCompiler.extend({

    // The possible column modifiers.
    modifierTypes: ['unsigned', 'nullable', 'defaultTo', 'after', 'comment'],

    // All types for sqlite3 builder. Feel free to fiddle with them on
    // the client object if you wish, they're unique per-client.
    types: require('./tablecompiler/types')(client),

    // All modifiers for the sqlite3 builder.
    modifiers: require('./tablecompiler/modifiers')(client),

    // All key related statements for the sqlite3 builder.
    keys: require('./tablecompiler/keys')(client),

    // Create a new table
    create: function() {
      var conn = {};
      var returnSql = SchemaTableCompiler.prototype.create.apply(this, arguments);
      var sql = returnSql[0].sql;

      // Check if the connection settings are set.
      if (client.connectionSettings) {
        conn = client.connectionSettings;
      }
      var charset   = this.attributes.charset || conn.charset;
      var collation = this.attributes.collate || conn.collate;
      var engine    = this.attributes.engine;


      // var conn = builder.client.connectionSettings;
      if (charset) sql   += ' default character set ' + charset;
      if (collation) sql += ' collate ' + collation;
      if (engine) sql    += ' engine = ' + engine;

      // // TODO: Handle max comment length ?
      var maxTableCommentLength = 60;
      var hasComment = _.has(this.attributes, 'comment');
      if (hasComment) sql += " comment = '" + (this.attributes.comment || '') + "'";

      returnSql[0].sql = sql;

      return returnSql;
    },

    addColumnsPrefix: 'add ',

    dropColumnPrefix: 'drop ',

    // Compiles the comment on the table.
    comment: function(comment) {
      return {
        sql: 'alter table ' + this.tableName + " comment = '" + comment + "'"
      };
    },

    // Renames a column on the table.
    renameColumn: function(from, to) {
      var wrapped = this._wrap(from) + ' ' + this._wrap(to);
      var table = this.tableName;
      return {
        sql: 'show fields from ' + this.tableName + ' where field = ?',
        bindings: [from],
        output: function(resp) {
          var column = resp[0];
          return this.query({
            sql: 'alter table ' + table + ' change ' + wrapped + ' ' + column.Type
          });
        }
      };
    }

  });

};

// MySQL Schema Types
// -------
module.exports = function() {

  var _ = require('lodash');

  return _.extend({}, require('../../../../schema/tablecompiler/types'), {
    increments: 'int unsigned not null auto_increment primary key',
    bigincrements: 'bigint unsigned not null auto_increment primary key',
    bigint: 'bigint',
    double: function(precision, scale) {
      if (!precision) return 'double';
      return 'double(' + num(precision, 8) + ', ' + num(scale, 2) + ')';
    },
    integer: function(length) {
      length = length ? '(' + num(length, 11) + ')' : '';
      return 'int' + length;
    },
    mediumint: 'mediumint',
    smallint: 'smallint',
    tinyint: function(length) {
      length = length ? '(' + num(length, 1) + ')' : '';
      return 'tinyint' + length;
    },
    text: function(column) {
      switch (column) {
        case 'medium':
        case 'mediumtext':
          return 'mediumtext';
        case 'long':
        case 'longtext':
          return 'longtext';
        default:
          return 'text';
      }
    },
    mediumtext: function() {
      return this.text('medium');
    },
    longtext: function() {
      return this.text('long');
    },
    float: function(precision, scale) {
      return 'float(' + precision + ',' + scale + ')';
    },
    typeDecimal: function(precision, scale) {
      return 'decimal(' + precision + ', ' + scale + ')';
    },
    enu: function(allowed) {
      return "enum('" + allowed.join("', '")  + "')";
    },
    datetime: 'datetime',
    timestamp: 'timestamp',
    bit: function(length) {
      return length ? 'bit(' + length + ')' : 'bit';
    }
  });

  function num(val, fallback) {
    if (val == null) return fallback;
    var number = parseInt(val, 10);
    return isNaN(number) ? fallback : number;
  }
};


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


module.exports = function(client) {
  var _ = require('lodash');
  var BaseModifiers = require('../../../../schema/tablecompiler/modifiers');

  return _.extend({}, BaseModifiers, {

    // Get the SQL for a default column modifier.
    defaultTo: function MySQLModifiers$defaultTo(value) {
      var defaultVal = BaseModifiers.defaultTo.apply(this, arguments);
      var column = this.currentColumn;
      if (column.method != 'blob' && column.method.indexOf('text') === -1) {
        return defaultVal;
      }
      return '';
    },

    // Get the SQL for an unsigned column modifier.
    unsigned: function() {
      return 'unsigned';
    },

    // Get the SQL for an "after" column modifier.
    after: function(column) {
      return 'after ' + this.formatter.wrap(column);
    },

    // Get the SQL for a comment column modifier.
    comment: function(comment) {
      var maxColumnCommentLength = 255;
      if (comment) return "comment '" + comment + "'";
    }

  });
};
