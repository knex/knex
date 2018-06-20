'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var Oracle_Compiler = require('../../oracle/query/compiler');
var ReturningHelper = require('../utils').ReturningHelper;
var BlobHelper = require('../utils').BlobHelper;

function Oracledb_Compiler(client, builder) {
  Oracle_Compiler.call(this, client, builder);
}
inherits(Oracledb_Compiler, Oracle_Compiler);

_.assign(Oracledb_Compiler.prototype, {
  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert: function insert() {
    var self = this;
    var outBindPrep = this._prepOutbindings(this.single.insert, this.single.returning);
    var outBinding = outBindPrep.outBinding;
    var returning = outBindPrep.returning;
    var insertValues = outBindPrep.values;

    if (Array.isArray(insertValues) && insertValues.length === 1 && _.isEmpty(insertValues[0])) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.wrap(this.single.returning) + ') values (default)', outBinding[0], this.tableName, returning);
    }

    if (_.isEmpty(this.single.insert) && typeof this.single.insert !== 'function') {
      return '';
    }

    var insertData = this._prepInsert(insertValues);

    var sql = {};

    if (_.isString(insertData)) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' ' + insertData, outBinding[0], this.tableName, returning);
    }

    if (insertData.values.length === 1) {
      return this._addReturningToSqlAndConvert('insert into ' + this.tableName + ' (' + this.formatter.columnize(insertData.columns) + ') values (' + this.formatter.parameterize(insertData.values[0]) + ')', outBinding[0], this.tableName, returning);
    }

    var insertDefaultsOnly = insertData.columns.length === 0;
    sql.returning = returning;
    sql.sql = 'begin ' + _.map(insertData.values, function (value, index) {
      var parameterizedValues = !insertDefaultsOnly ? self.formatter.parameterize(value, self.client.valueForUndefined) : '';
      var subSql = 'insert into ' + self.tableName;

      if (insertDefaultsOnly) {
        // No columns given so only the default value
        subSql += ' (' + self.formatter.wrap(self.single.returning) + ') values (default)';
      } else {
        subSql += ' (' + self.formatter.columnize(insertData.columns) + ') values (' + parameterizedValues + ')';
      }

      var returningClause = '';
      var intoClause = '';
      // ToDo review if this code is still needed or could be dropped
      // eslint-disable-next-line no-unused-vars
      var usingClause = '';
      var outClause = '';

      _.each(value, function (val) {
        if (!(val instanceof BlobHelper)) {
          usingClause += ' ?,';
        }
      });
      usingClause = usingClause.slice(0, -1);

      // Build returning and into clauses
      _.each(outBinding[index], function (ret) {
        var columnName = ret.columnName || ret;
        returningClause += self.formatter.wrap(columnName) + ',';
        intoClause += ' ?,';
        outClause += ' out ?,';

        // Add Helpers to bindings
        if (ret instanceof BlobHelper) {
          return self.formatter.bindings.push(ret);
        }
        self.formatter.bindings.push(new ReturningHelper(columnName));
      });

      // Strip last comma
      returningClause = returningClause.slice(0, -1);
      intoClause = intoClause.slice(0, -1);
      outClause = outClause.slice(0, -1);

      if (returningClause && intoClause) {
        subSql += ' returning ' + returningClause + ' into' + intoClause;
      }

      // Pre bind position because subSql is an execute immediate parameter
      // later position binding will only convert the ? params
      subSql = self.formatter.client.positionBindings(subSql);
      var parameterizedValuesWithoutDefaultAndBlob = parameterizedValues.replace('DEFAULT, ', '').replace(', DEFAULT', '').replace('EMPTY_BLOB(), ', '').replace(', EMPTY_BLOB()', '');
      return 'execute immediate \'' + subSql.replace(/'/g, "''") + (parameterizedValuesWithoutDefaultAndBlob || value ? '\' using ' : '') + parameterizedValuesWithoutDefaultAndBlob + (parameterizedValuesWithoutDefaultAndBlob && outClause ? ',' : '') + outClause + ';';
    }).join(' ') + 'end;';

    sql.outBinding = outBinding;
    if (returning[0] === '*') {
      returning = returning.slice(0, -1);

      // Generate select statement with special order by
      // to keep the order because 'in (..)' may change the order
      sql.returningSql = function () {
        return 'select * from ' + self.tableName + ' where ROWID in (' + this.outBinding.map(function (v, i) {
          return ':' + (i + 1);
        }).join(', ') + ')' + ' order by case ROWID ' + this.outBinding.map(function (v, i) {
          return 'when CHARTOROWID(:' + (i + 1) + ') then ' + i;
        }).join(' ') + ' end';
      };
    }

    return sql;
  },

  _addReturningToSqlAndConvert: function _addReturningToSqlAndConvert(sql, outBinding, tableName, returning) {
    var self = this;
    var res = {
      sql: sql
    };

    if (!outBinding) {
      return res;
    }
    var returningValues = Array.isArray(outBinding) ? outBinding : [outBinding];
    var returningClause = '';
    var intoClause = '';
    // Build returning and into clauses
    _.each(returningValues, function (ret) {
      var columnName = ret.columnName || ret;
      returningClause += self.formatter.wrap(columnName) + ',';
      intoClause += '?,';

      // Add Helpers to bindings
      if (ret instanceof BlobHelper) {
        return self.formatter.bindings.push(ret);
      }
      self.formatter.bindings.push(new ReturningHelper(columnName));
    });
    res.sql = sql;

    // Strip last comma
    returningClause = returningClause.slice(0, -1);
    intoClause = intoClause.slice(0, -1);
    if (returningClause && intoClause) {
      res.sql += ' returning ' + returningClause + ' into ' + intoClause;
    }
    res.outBinding = [outBinding];
    if (returning[0] === '*') {
      res.returningSql = function () {
        return 'select * from ' + self.tableName + ' where ROWID = :1';
      };
    }
    res.returning = returning;

    return res;
  },

  _prepOutbindings: function _prepOutbindings(paramValues, paramReturning) {
    var result = {};
    var params = paramValues || [];
    var returning = paramReturning || [];
    if (!Array.isArray(params) && _.isPlainObject(paramValues)) {
      params = [params];
    }
    // Always wrap returning argument in array
    if (returning && !Array.isArray(returning)) {
      returning = [returning];
    }

    var outBinding = [];
    // Handle Buffer value as Blob
    _.each(params, function (values, index) {
      if (returning[0] === '*') {
        outBinding[index] = ['ROWID'];
      } else {
        outBinding[index] = _.clone(returning);
      }
      _.each(values, function (value, key) {
        if (value instanceof Buffer) {
          values[key] = new BlobHelper(key, value);

          // Delete blob duplicate in returning
          var blobIndex = outBinding[index].indexOf(key);
          if (blobIndex >= 0) {
            outBinding[index].splice(blobIndex, 1);
            values[key].returning = true;
          }
          outBinding[index].push(values[key]);
        }
        if (_.isUndefined(value)) {
          delete params[index][key];
        }
      });
    });
    result.returning = returning;
    result.outBinding = outBinding;
    result.values = params;
    return result;
  },

  update: function update() {
    var self = this;
    var sql = {};
    var outBindPrep = this._prepOutbindings(this.single.update, this.single.returning);
    var outBinding = outBindPrep.outBinding;
    var returning = outBindPrep.returning;

    var updates = this._prepUpdate(this.single.update);
    var where = this.where();

    var returningClause = '';
    var intoClause = '';

    if (_.isEmpty(this.single.update) && typeof this.single.update !== 'function') {
      return '';
    }

    // Build returning and into clauses
    _.each(outBinding, function (out) {
      _.each(out, function (ret) {
        var columnName = ret.columnName || ret;
        returningClause += self.formatter.wrap(columnName) + ',';
        intoClause += ' ?,';

        // Add Helpers to bindings
        if (ret instanceof BlobHelper) {
          return self.formatter.bindings.push(ret);
        }
        self.formatter.bindings.push(new ReturningHelper(columnName));
      });
    });
    // Strip last comma
    returningClause = returningClause.slice(0, -1);
    intoClause = intoClause.slice(0, -1);

    sql.outBinding = outBinding;
    sql.returning = returning;
    sql.sql = 'update ' + this.tableName + ' set ' + updates.join(', ') + (where ? ' ' + where : '');
    if (outBinding.length && !_.isEmpty(outBinding[0])) {
      sql.sql += ' returning ' + returningClause + ' into' + intoClause;
    }
    if (returning[0] === '*') {

      sql.returningSql = function () {

        var sql = 'select * from ' + self.tableName;
        var modifiedRowsCount = this.rowsAffected.length || this.rowsAffected;
        var returningSqlIn = ' where ROWID in (';
        var returningSqlOrderBy = ') order by case ROWID ';

        // Needs special order by because in(...) change result order
        for (var i = 0; i < modifiedRowsCount; i++) {
          if (this.returning[0] === '*') {
            returningSqlIn += ':' + (i + 1) + ', ';
            returningSqlOrderBy += 'when CHARTOROWID(:' + (i + 1) + ') then ' + i + ' ';
          }
        }
        if (this.returning[0] === '*') {
          this.returning = this.returning.slice(0, -1);
          returningSqlIn = returningSqlIn.slice(0, -2);
          returningSqlOrderBy = returningSqlOrderBy.slice(0, -1);
        }
        return sql += returningSqlIn + returningSqlOrderBy + ' end';
      };
    }

    return sql;
  }

});

module.exports = Oracledb_Compiler;