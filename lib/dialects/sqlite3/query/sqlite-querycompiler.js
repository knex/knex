// SQLite3 Query Builder & Compiler

const constant = require('lodash/constant');
const each = require('lodash/each');
const identity = require('lodash/identity');
const isEmpty = require('lodash/isEmpty');
const reduce = require('lodash/reduce');

const QueryCompiler = require('../../../query/querycompiler');
const noop = require('../../../util/noop');
const { isString } = require('../../../util/is');
const {
  wrapString,
  columnize: columnize_,
} = require('../../../formatter/wrappingFormatter');

const emptyStr = constant('');

class QueryCompiler_SQLite3 extends QueryCompiler {
  constructor(client, builder, formatter) {
    super(client, builder, formatter);

    // The locks are not applicable in SQLite3
    this.forShare = emptyStr;
    this.forKeyShare = emptyStr;
    this.forUpdate = emptyStr;
    this.forNoKeyUpdate = emptyStr;
  }

  // SQLite requires us to build the multi-row insert as a listing of select with
  // unions joining them together. So we'll build out this list of columns and
  // then join them all together with select unions to complete the queries.
  insert() {
    const insertValues = this.single.insert || [];
    let sql = this.with() + `insert into ${this.tableName} `;

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return '';
      } else if (
        insertValues.length === 1 &&
        insertValues[0] &&
        isEmpty(insertValues[0])
      ) {
        return {
          sql: sql + this._emptyInsertValue,
        };
      }
    } else if (typeof insertValues === 'object' && isEmpty(insertValues)) {
      return {
        sql: sql + this._emptyInsertValue,
      };
    }

    const insertData = this._prepInsert(insertValues);

    if (isString(insertData)) {
      return {
        sql: sql + insertData,
      };
    }

    if (insertData.columns.length === 0) {
      return {
        sql: '',
      };
    }

    sql += `(${this.formatter.columnize(insertData.columns)})`;

    // backwards compatible error
    if (this.client.valueForUndefined !== null) {
      insertData.values.forEach((bindings) => {
        each(bindings, (binding) => {
          if (binding === undefined)
            throw new TypeError(
              '`sqlite` does not support inserting default values. Specify ' +
                'values explicitly or use the `useNullAsDefault` config flag. ' +
                '(see docs http://knexjs.org/#Builder-insert).'
            );
        });
      });
    }

    if (insertData.values.length === 1) {
      const parameters = this.client.parameterize(
        insertData.values[0],
        this.client.valueForUndefined,
        this.builder,
        this.bindingsHolder
      );
      sql += ` values (${parameters})`;

      const { onConflict, ignore, merge } = this.single;
      if (onConflict && ignore) sql += this._ignore(onConflict);
      else if (onConflict && merge) {
        sql += this._merge(merge.updates, onConflict, insertValues);
        const wheres = this.where();
        if (wheres) sql += ` ${wheres}`;
      }

      const { returning } = this.single;
      if (returning) {
        sql += this._returning(returning);
      }

      return {
        sql,
        returning,
      };
    }

    const blocks = [];
    let i = -1;
    while (++i < insertData.values.length) {
      let i2 = -1;
      const block = (blocks[i] = []);
      let current = insertData.values[i];
      current = current === undefined ? this.client.valueForUndefined : current;
      while (++i2 < insertData.columns.length) {
        block.push(
          this.client.alias(
            this.client.parameter(
              current[i2],
              this.builder,
              this.bindingsHolder
            ),
            this.formatter.wrap(insertData.columns[i2])
          )
        );
      }
      blocks[i] = block.join(', ');
    }
    sql += ' select ' + blocks.join(' union all select ');

    const { onConflict, ignore, merge } = this.single;
    if (onConflict && ignore) sql += ' where true' + this._ignore(onConflict);
    else if (onConflict && merge) {
      sql +=
        ' where true' + this._merge(merge.updates, onConflict, insertValues);
    }

    const { returning } = this.single;
    if (returning) sql += this._returning(returning);

    return {
      sql,
      returning,
    };
  }

  _ignore(columns) {
    if (columns === true) {
      return ' on conflict do nothing';
    }
    return ` on conflict ${this._onConflictClause(columns)} do nothing`;
  }

  _merge(updates, columns, insert) {
    let sql = ` on conflict ${this._onConflictClause(columns)} do update set `;
    if (updates && Array.isArray(updates)) {
      sql += updates
        .map((column) =>
          wrapString(
            column.split('.').pop(),
            this.formatter.builder,
            this.client,
            this.formatter
          )
        )
        .map((column) => `${column} = excluded.${column}`)
        .join(', ');

      return sql;
    } else if (updates && typeof updates === 'object') {
      const updateData = this._prepUpdate(updates);
      if (typeof updateData === 'string') {
        sql += updateData;
      } else {
        sql += updateData.join(',');
      }

      return sql;
    } else {
      const insertData = this._prepInsert(insert);
      if (typeof insertData === 'string') {
        throw new Error(
          'If using merge with a raw insert query, then updates must be provided'
        );
      }

      sql += insertData.columns
        .map((column) =>
          wrapString(column.split('.').pop(), this.builder, this.client)
        )
        .map((column) => `${column} = excluded.${column}`)
        .join(', ');

      return sql;
    }
  }

  _returning(value) {
    return value ? ` returning ${this.formatter.columnize(value)}` : '';
  }

  // Compile a truncate table statement into SQL.
  truncate() {
    const { table } = this.single;
    return {
      sql: `delete from ${this.tableName}`,
      output() {
        return this.query({
          sql: `delete from sqlite_sequence where name = '${table}'`,
        }).catch(noop);
      },
    };
  }

  // Compiles a `columnInfo` query
  columnInfo() {
    const column = this.single.columnInfo;

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    const table = this.client.customWrapIdentifier(this.single.table, identity);

    return {
      sql: `PRAGMA table_info(\`${table}\`)`,
      output(resp) {
        const maxLengthRegex = /.*\((\d+)\)/;
        const out = reduce(
          resp,
          function (columns, val) {
            let { type } = val;
            let maxLength = type.match(maxLengthRegex);
            if (maxLength) {
              maxLength = maxLength[1];
            }
            type = maxLength ? type.split('(')[0] : type;
            columns[val.name] = {
              type: type.toLowerCase(),
              maxLength,
              nullable: !val.notnull,
              defaultValue: val.dflt_value,
            };
            return columns;
          },
          {}
        );
        return (column && out[column]) || out;
      },
    };
  }

  limit() {
    const noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit && !this.single.offset) return '';

    // Workaround for offset only,
    // see http://stackoverflow.com/questions/10491492/sqllite-with-skip-offset-only-not-limit
    this.single.limit = noLimit ? -1 : this.single.limit;
    return `limit ${this._getValueOrParameterFromAttribute('limit')}`;
  }

  // Json functions
  jsonExtract(params) {
    return this._jsonExtract('json_extract', params);
  }

  jsonSet(params) {
    return this._jsonSet('json_set', params);
  }

  jsonInsert(params) {
    return this._jsonSet('json_insert', params);
  }

  jsonRemove(params) {
    const jsonCol = `json_remove(${columnize_(
      params.column,
      this.builder,
      this.client,
      this.bindingsHolder
    )},${this.client.parameter(
      params.path,
      this.builder,
      this.bindingsHolder
    )})`;
    return params.alias
      ? this.client.alias(jsonCol, this.formatter.wrap(params.alias))
      : jsonCol;
  }

  whereJsonPath(statement) {
    return this._whereJsonPath('json_extract', statement);
  }

  whereJsonSupersetOf(statement) {
    throw new Error(
      'Json superset where clause not actually supported by SQLite'
    );
  }

  whereJsonSubsetOf(statement) {
    throw new Error(
      'Json subset where clause not actually supported by SQLite'
    );
  }

  onJsonPathEquals(clause) {
    return this._onJsonPathEquals('json_extract', clause);
  }
}

module.exports = QueryCompiler_SQLite3;
