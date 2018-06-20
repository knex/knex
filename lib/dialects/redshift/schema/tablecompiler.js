'use strict';

exports.__esModule = true;

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _lodash = require('lodash');

var _tablecompiler = require('../../postgres/schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function TableCompiler_Redshift() {
  _tablecompiler2.default.apply(this, arguments);
} /* eslint max-len: 0 */

// Redshift Table Builder & Compiler
// -------

(0, _inherits2.default)(TableCompiler_Redshift, _tablecompiler2.default);

TableCompiler_Redshift.prototype.index = function (columns, indexName, indexType) {
  this.client.logger.warn('Redshift does not support the creation of indexes.');
};

TableCompiler_Redshift.prototype.dropIndex = function (columns, indexName) {
  this.client.logger.warn('Redshift does not support the deletion of indexes.');
};

// TODO: have to disable setting not null on columns that already exist...

// Adds the "create" query to the query sequence.
TableCompiler_Redshift.prototype.createQuery = function (columns, ifNot) {
  var createStatement = ifNot ? 'create table if not exists ' : 'create table ';
  var sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')';
  if (this.single.inherits) sql += ' like (' + this.formatter.wrap(this.single.inherits) + ')';
  this.pushQuery({
    sql: sql,
    bindings: columns.bindings
  });
  var hasComment = (0, _lodash.has)(this.single, 'comment');
  if (hasComment) this.comment(this.single.comment);
};

TableCompiler_Redshift.prototype.primary = function (columns, constraintName) {
  var _this = this;

  var self = this;
  constraintName = constraintName ? self.formatter.wrap(constraintName) : self.formatter.wrap(this.tableNameRaw + '_pkey');
  if (columns.constructor !== Array) {
    columns = [columns];
  }
  var thiscolumns = self.grouped.columns;

  if (thiscolumns) {
    var _loop = function _loop(i) {
      var exists = thiscolumns.find(function (tcb) {
        return tcb.grouping === "columns" && tcb.builder && tcb.builder._method === "add" && tcb.builder._args && tcb.builder._args.indexOf(columns[i]) > -1;
      });
      if (exists) {
        exists = exists.builder;
      }
      var nullable = !(exists && exists._modifiers && exists._modifiers["nullable"] && exists._modifiers["nullable"][0] === false);
      if (nullable) {
        if (exists) {
          return {
            v: _this.client.logger.warn("Redshift does not allow primary keys to contain nullable columns.")
          };
        } else {
          return {
            v: _this.client.logger.warn("Redshift does not allow primary keys to contain nonexistent columns.")
          };
        }
      }
    };

    for (var i = 0; i < columns.length; i++) {
      var _ret = _loop(i);

      if ((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
    }
  }
  return self.pushQuery('alter table ' + self.tableName() + ' add constraint ' + constraintName + ' primary key (' + self.formatter.columnize(columns) + ')');
};

// Compiles column add. Redshift can only add one column per ALTER TABLE, so core addColumns doesn't work.  #2545
TableCompiler_Redshift.prototype.addColumns = function (columns, prefix, colCompilers) {
  if (prefix === this.alterColumnsPrefix) {
    _tablecompiler2.default.prototype.addColumns.call(this, columns, prefix, colCompilers);
  } else {
    prefix = prefix || this.addColumnsPrefix;
    colCompilers = colCompilers || this.getColumns();
    for (var _iterator = colCompilers, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : (0, _getIterator3.default)(_iterator);;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var col = _ref;

      var quotedTableName = this.tableName();
      var colCompiled = col.compileColumn();

      this.pushQuery({
        sql: 'alter table ' + quotedTableName + ' ' + prefix + colCompiled,
        bindings: []
      });
    }
  }
};

exports.default = TableCompiler_Redshift;
module.exports = exports['default'];