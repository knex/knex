
// Firebird Query Compiler
// ------
'use strict';
var _ = require('lodash');
var inherits = require('inherits');
var QueryCompiler = require('../../../query/compiler');
var assign = require('lodash/object/assign');

function QueryCompiler_Firebird(client, builder) {
    QueryCompiler.call(this, client, builder);
}
inherits(QueryCompiler_Firebird, QueryCompiler);

assign(QueryCompiler_Firebird.prototype, {

    _emptyInsertValue: '() values ()',

    columnizeWithPrefix: function columnizeWithPrefix(prefix, target) {
        var columns = typeof target === 'string' ? [target] : target;
        var str = '',
            i = -1;
        while (++i < columns.length) {
            if (i > 0) str += ', ';
            str += prefix + this.wrap(columns[i]);
        }
        return str;
    },
    insert: function insert() {
        var insertValues = this.single.insert || [];
        if (Array.isArray(insertValues)) {
            var sql = 'insert into ' + this.tableName + ' ';
            var returning = this.single.returning;
            var returningSql = returning ? this._returning('insert', returning) + ' ' : '';

            if (insertValues.length === 0) {
                return '';
            }

            var insertData = this._prepInsert(insertValues);
            sql += '(' + this.formatter.columnize(insertData.columns) + ') values (';
            if (typeof insertData === 'string') {
                sql += insertData;
            } else {
                if (insertData.columns.length) {
                    var i = -1;
                    while (++i < insertData.values.length) {
                        if (i !== 0) sql += ' insert into ' + this.tableName + '(' + this.formatter.columnize(insertData.columns) + ') values (';
                        sql += this.formatter.parameterize(insertData.values[i]) + ');';
                    }
                    sql += ' end';
                } else if (insertValues.length === 1 && insertValues[0]) {
                    sql += returningSql + this._emptyInsertValue;
                } else {
                    sql = '';
                }
            }
            sql = 'execute block as begin ' + sql;
        } else {

            var sql = 'insert into ' + this.tableName + ' ';

            if (Array.isArray(insertValues)) {
                if (insertValues.length === 0) {
                    return '';
                }
            } else if (typeof insertValues === 'object' && _.isEmpty(insertValues)) {
                return sql + this._emptyInsertValue;
            }

            var insertData = this._prepInsert(insertValues);
            if (typeof insertData === 'string') {
                sql += insertData;
            } else {
                if (insertData.columns.length) {
                    sql += '(' + this.formatter.columnize(insertData.columns);
                    sql += ') values (';
                    var i = -1;
                    while (++i < insertData.values.length) {
                        if (i !== 0) sql += '), (';
                        sql += this.formatter.parameterize(insertData.values[i]);
                    }
                    sql += ')';
                } else if (insertValues.length === 1 && insertValues[0]) {
                    sql += this._emptyInsertValue;
                } else {
                    sql = '';
                }
            }
        }

        return {
            sql: sql,
            returning: returning
        };
    },

    // Update method, including joins, wheres, order & limits.
    update: function update() {
        var join = this.join();
        var updates = this._prepUpdate(this.single.update);
        var where = this.where();
        var order = this.order();
        var limit = this.limit();
        return 'update ' + this.tableName + (join ? ' ' + join : '') + ' set ' + updates.join(', ') + (where ? ' ' + where : '') + (order ? ' ' + order : '') + (limit ? ' ' + limit : '');
    },

    // Compiles a `columnInfo` query.
    columnInfo: function columnInfo() {
        var column = this.single.columnInfo;
        return {
            sql: 'select * from information_schema.columns where table_name = ? and table_schema = ?',
            bindings: [this.single.table, this.client.database()],
            output: function output(resp) {
                var out = resp.reduce(function (columns, val) {
                    columns[val.COLUMN_NAME] = {
                        defaultValue: val.COLUMN_DEFAULT,
                        type: val.DATA_TYPE,
                        maxLength: val.CHARACTER_MAXIMUM_LENGTH,
                        nullable: val.IS_NULLABLE === 'YES'
                    };
                    return columns;
                }, {});
                return column && out[column] || out;
            }
        };
    },

    limit: function limit() {
        var noLimit = !this.single.limit && this.single.limit !== 0;
        if (noLimit && !this.single.offset) return '';

        return 'first  ' + (this.single.offset && noLimit ? '18446744073709551615' : this.formatter.parameter(this.single.limit));
    }

});

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
module.exports = QueryCompiler_Firebird;