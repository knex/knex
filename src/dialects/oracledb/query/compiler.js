var _               = require('lodash');
var inherits        = require('inherits');
var assign          = require('lodash/object/assign');
var Oracle_Compiler = require('../../oracle/query/compiler');
var ReturningHelper = require('../utils').ReturningHelper;
var BlobHelper      = require('../utils').BlobHelper;

function Oracledb_Compiler(client, builder) {
  Oracle_Compiler.call(this, client, builder);
}
inherits(Oracledb_Compiler, Oracle_Compiler);

assign(Oracledb_Compiler.prototype, {

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert: function() {
    var insertValues = this.single.insert || [];
    var returning    = this.single.returning;
    if (!Array.isArray(insertValues) && _.isPlainObject(this.single.insert)) {
      insertValues = [this.single.insert];
    }

    // always wrap returning argument in array
    if (returning && !Array.isArray(returning)) {
      returning = [returning];
    }

    // Handle Buffer value as Blob
    _.each(insertValues, function(insert) {
      _.each(insert, function(value, key) {
        if (value instanceof Buffer) {
          insert[key] = new BlobHelper(key, value);
          returning.push(insert[key]);
        }
      });
    });

    if (Array.isArray(insertValues) && insertValues.length === 1 && _.isEmpty(insertValues[0])) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.wrap(this.single.returning) + ') values (default)', returning, this.tableName);
    }

    if (_.isEmpty(this.single.insert) && typeof this.single.insert !== 'function') {
      return '';
    }

    var insertData = this._prepInsert(insertValues);

    var sql = {};

    if (_.isString(insertData)) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' ' + insertData, returning);
    }

    if (insertData.values.length === 1) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.columnize(insertData.columns) + ') values (' + this.formatter.parameterize(insertData.values[0]) + ')', returning, this.tableName);
    }

    var insertDefaultsOnly = (insertData.columns.length === 0);

    sql.sql = 'begin ' +
      _.map(insertData.values, function (value) {
          var returningHelper;
          var parameterizedValues = !insertDefaultsOnly ? this.formatter.parameterize(value) : '';
          var returningValues = Array.isArray(returning) ? returning : [returning];
          var subSql = 'insert into ' + this.tableName + ' ';

          if (returning) {
            returningHelper = new ReturningHelper(returningValues.join(':'));
            sql.outParams = (sql.outParams || []).concat(returningHelper);
          }

          if (insertDefaultsOnly) {
            // no columns given so only the default value
            subSql += '(' + this.formatter.wrap(this.single.returning) + ') values (default)';
          } else {
            subSql += '(' + this.formatter.columnize(insertData.columns) + ') values (' + parameterizedValues + ')';
          }
          subSql += (returning ? ' returning ROWID into ' + this.formatter.parameter(returningHelper) : '');

          // pre bind position because subSql is an execute immediate parameter
          // later position binding will only convert the ? params
          subSql = this.formatter.client.positionBindings(subSql);
          return 'execute immediate \'' + subSql.replace(/'/g, "''") +
            ((parameterizedValues || returning) ? '\' using ' : '') +
            parameterizedValues +
            ((parameterizedValues && returning) ? ', ' : '') +
            (returning ? 'out ?' : '') + ';';
      }, this).join(' ') +
      'end;';

    if (returning) {
      sql.returning = returning;
      // generate select statement with special order by to keep the order because 'in (..)' may change the order
      sql.returningSql = 'select ' + this.formatter.columnize(returning) +
        ' from ' + this.tableName +
        ' where ROWID in (' + sql.outParams.map(function (v, i) {return ':' + (i + 1);}).join(', ') + ')' +
        ' order by case ROWID ' + sql.outParams.map(function (v, i) {return 'when CHARTOROWID(:' + (i + 1) + ') then ' + i;}).join(' ') + ' end';
    }

    return sql;
  },
  
  _addReturningToSqlAndConvert: function(sql, returning) {
    var self = this;
    var res = {
      sql: sql
    };

    if (!returning) {
      return res;
    }
    var returningValues = Array.isArray(returning) ? returning : [returning];
    var returningClause = '';
    var intoClause = '';
    // Build returning and into clauses
    _.each(returningValues, function(ret){
      var columnName = ret.columnName || ret;
      returningClause += '"' + columnName + '",';
      intoClause += '?,';
      
      // add Helpers to bindings
      if (ret instanceof BlobHelper) {
        return self.formatter.bindings.push(ret);
      }
      self.formatter.bindings.push(new ReturningHelper(columnName));
    });

    // strip last comma
    returningClause = returningClause.slice(0,-1);
    intoClause = intoClause.slice(0,-1);

    res.sql = sql + ' returning ' + returningClause + ' into ' + intoClause;
    res.returning = ['*'];
    return res;
  }  
});

module.exports = Oracledb_Compiler;