// MSSQL Query Compiler
// ------
const QueryCompiler = require('../../../query/querycompiler');

const compact = require('lodash/compact');
const identity = require('lodash/identity');
const isEmpty = require('lodash/isEmpty');
const Raw = require('../../../raw.js');
const {
  columnize: columnize_,
} = require('../../../formatter/wrappingFormatter');

const components = [
  'comments',
  'columns',
  'join',
  'lock',
  'where',
  'union',
  'group',
  'having',
  'order',
  'limit',
  'offset',
];

class QueryCompiler_MSSQL extends QueryCompiler {
  constructor(client, builder, formatter) {
    super(client, builder, formatter);

    const { onConflict } = this.single;
    if (onConflict) {
      throw new Error('.onConflict() is not supported for mssql.');
    }

    this._emptyInsertValue = 'default values';
  }

  with() {
    // WITH RECURSIVE is a syntax error:
    // SQL Server does not syntactically distinguish recursive and non-recursive CTEs.
    // So mark all statements as non-recursive, generate the SQL, then restore.
    // This approach ensures any changes in base class with() get propagated here.
    const undoList = [];
    if (this.grouped.with) {
      for (const stmt of this.grouped.with) {
        if (stmt.recursive) {
          undoList.push(stmt);
          stmt.recursive = false;
        }
      }
    }

    const result = super.with();

    // Restore the recursive markings, in case this same query gets cloned and passed to other drivers.
    for (const stmt of undoList) {
      stmt.recursive = true;
    }
    return result;
  }

  select() {
    const sql = this.with();
    const statements = components.map((component) => this[component](this));
    return sql + compact(statements).join(' ');
  }

  //#region Insert
  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert() {
    if (
      this.single.options &&
      this.single.options.includeTriggerModifications
    ) {
      return this.insertWithTriggers();
    } else {
      return this.standardInsert();
    }
  }

  insertWithTriggers() {
    const insertValues = this.single.insert || [];
    const { returning } = this.single;
    let sql =
      this.with() +
      `${this._buildTempTable(returning)}insert into ${this.tableName} `;
    const returningSql = returning
      ? this._returning('insert', returning, true) + ' '
      : '';

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return '';
      }
    } else if (typeof insertValues === 'object' && isEmpty(insertValues)) {
      return {
        sql:
          sql +
          returningSql +
          this._emptyInsertValue +
          this._buildReturningSelect(returning),
        returning,
      };
    }
    sql += this._buildInsertData(insertValues, returningSql);

    if (returning) {
      sql += this._buildReturningSelect(returning);
    }

    return {
      sql,
      returning,
    };
  }

  _buildInsertData(insertValues, returningSql) {
    let sql = '';
    const insertData = this._prepInsert(insertValues);
    if (typeof insertData === 'string') {
      sql += insertData;
    } else {
      if (insertData.columns.length) {
        sql += `(${this.formatter.columnize(insertData.columns)}`;
        sql +=
          `) ${returningSql}values (` +
          this._buildInsertValues(insertData) +
          ')';
      } else if (insertValues.length === 1 && insertValues[0]) {
        sql += returningSql + this._emptyInsertValue;
      } else {
        return '';
      }
    }
    return sql;
  }

  standardInsert() {
    const insertValues = this.single.insert || [];
    let sql = this.with() + `insert into ${this.tableName} `;
    const { returning } = this.single;
    const returningSql = returning
      ? this._returning('insert', returning) + ' '
      : '';

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return '';
      }
    } else if (typeof insertValues === 'object' && isEmpty(insertValues)) {
      return {
        sql: sql + returningSql + this._emptyInsertValue,
        returning,
      };
    }

    sql += this._buildInsertData(insertValues, returningSql);

    return {
      sql,
      returning,
    };
  }
  //#endregion

  //#region Update
  // Compiles an `update` query, allowing for a return value.
  update() {
    if (
      this.single.options &&
      this.single.options.includeTriggerModifications
    ) {
      return this.updateWithTriggers();
    } else {
      return this.standardUpdate();
    }
  }

  updateWithTriggers() {
    const top = this.top();
    const withSQL = this.with();
    const updates = this._prepUpdate(this.single.update);
    const join = this.join();
    const where = this.where();
    const order = this.order();
    const { returning } = this.single;
    const declaredTemp = this._buildTempTable(returning);
    return {
      sql:
        withSQL +
        declaredTemp +
        `update ${top ? top + ' ' : ''}${this.tableName}` +
        ' set ' +
        updates.join(', ') +
        (returning ? ` ${this._returning('update', returning, true)}` : '') +
        (join ? ` from ${this.tableName} ${join}` : '') +
        (where ? ` ${where}` : '') +
        (order ? ` ${order}` : '') +
        (!returning
          ? this._returning('rowcount', '@@rowcount')
          : this._buildReturningSelect(returning)),
      returning: returning || '@@rowcount',
    };
  }

  _formatGroupsItemValue(value, nulls) {
    const column = super._formatGroupsItemValue(value);
    // MSSQL dont support 'is null' syntax in order by,
    // so we override this function and add MSSQL specific syntax.
    if (nulls && !(value instanceof Raw)) {
      const collNulls = `IIF(${column} is null,`;
      if (nulls === 'first') {
        return `${collNulls}0,1)`;
      } else if (nulls === 'last') {
        return `${collNulls}1,0)`;
      }
    }
    return column;
  }

  standardUpdate() {
    const top = this.top();
    const withSQL = this.with();
    const updates = this._prepUpdate(this.single.update);
    const join = this.join();
    const where = this.where();
    const order = this.order();
    const { returning } = this.single;
    return {
      sql:
        withSQL +
        `update ${top ? top + ' ' : ''}${this.tableName}` +
        ' set ' +
        updates.join(', ') +
        (returning ? ` ${this._returning('update', returning)}` : '') +
        (join ? ` from ${this.tableName} ${join}` : '') +
        (where ? ` ${where}` : '') +
        (order ? ` ${order}` : '') +
        (!returning ? this._returning('rowcount', '@@rowcount') : ''),
      returning: returning || '@@rowcount',
    };
  }
  //#endregion

  //#region Delete
  // Compiles a `delete` query.
  del() {
    if (
      this.single.options &&
      this.single.options.includeTriggerModifications
    ) {
      return this.deleteWithTriggers();
    } else {
      return this.standardDelete();
    }
  }

  deleteWithTriggers() {
    // Make sure tableName is processed by the formatter first.
    const withSQL = this.with();
    const { tableName } = this;
    const wheres = this.where();
    const joins = this.join();
    const { returning } = this.single;
    const returningStr = returning
      ? ` ${this._returning('del', returning, true)}`
      : '';
    const deleteSelector = joins ? `${tableName}${returningStr} ` : '';
    return {
      sql:
        withSQL +
        `${this._buildTempTable(
          returning
        )}delete ${deleteSelector}from ${tableName}` +
        (!joins ? returningStr : '') +
        (joins ? ` ${joins}` : '') +
        (wheres ? ` ${wheres}` : '') +
        (!returning
          ? this._returning('rowcount', '@@rowcount')
          : this._buildReturningSelect(returning)),
      returning: returning || '@@rowcount',
    };
  }

  standardDelete() {
    // Make sure tableName is processed by the formatter first.
    const withSQL = this.with();
    const { tableName } = this;
    const wheres = this.where();
    const joins = this.join();
    const { returning } = this.single;
    const returningStr = returning
      ? ` ${this._returning('del', returning)}`
      : '';
    // returning needs to be before "from" when using join
    const deleteSelector = joins ? `${tableName}${returningStr} ` : '';
    return {
      sql:
        withSQL +
        `delete ${deleteSelector}from ${tableName}` +
        (!joins ? returningStr : '') +
        (joins ? ` ${joins}` : '') +
        (wheres ? ` ${wheres}` : '') +
        (!returning ? this._returning('rowcount', '@@rowcount') : ''),
      returning: returning || '@@rowcount',
    };
  }
  //#endregion

  // Compiles the columns in the query, specifying if an item was distinct.
  columns() {
    let distinctClause = '';
    if (this.onlyUnions()) return '';
    const top = this.top();
    const hints = this._hintComments();
    const columns = this.grouped.columns || [];
    let i = -1,
      sql = [];
    if (columns) {
      while (++i < columns.length) {
        const stmt = columns[i];
        if (stmt.distinct) distinctClause = 'distinct ';
        if (stmt.distinctOn) {
          distinctClause = this.distinctOn(stmt.value);
          continue;
        }
        if (stmt.type === 'aggregate') {
          sql.push(...this.aggregate(stmt));
        } else if (stmt.type === 'aggregateRaw') {
          sql.push(this.aggregateRaw(stmt));
        } else if (stmt.type === 'analytic') {
          sql.push(this.analytic(stmt));
        } else if (stmt.type === 'json') {
          sql.push(this.json(stmt));
        } else if (stmt.value && stmt.value.length > 0) {
          sql.push(this.formatter.columnize(stmt.value));
        }
      }
    }
    if (sql.length === 0) sql = ['*'];
    const select = this.onlyJson() ? '' : 'select ';
    return (
      `${select}${hints}${distinctClause}` +
      (top ? top + ' ' : '') +
      sql.join(', ') +
      (this.tableName ? ` from ${this.tableName}` : '')
    );
  }

  _returning(method, value, withTrigger) {
    switch (method) {
      case 'update':
      case 'insert':
        return value
          ? `output ${this.formatter.columnizeWithPrefix('inserted.', value)}${
              withTrigger ? ' into #out' : ''
            }`
          : '';
      case 'del':
        return value
          ? `output ${this.formatter.columnizeWithPrefix('deleted.', value)}${
              withTrigger ? ' into #out' : ''
            }`
          : '';
      case 'rowcount':
        return value ? ';select @@rowcount' : '';
    }
  }

  _buildTempTable(values) {
    // If value is nothing then return an empty string
    if (values && values.length > 0) {
      let selections = '';

      // Build values that will be returned from this procedure
      if (Array.isArray(values)) {
        selections = values
          .map((value) => `[t].${this.formatter.columnize(value)}`)
          .join(',');
      } else {
        selections = `[t].${this.formatter.columnize(values)}`;
      }

      // Force #out to be correctly populated with the correct column structure.
      let sql = `select top(0) ${selections} into #out `;
      sql += `from ${this.tableName} as t `;
      sql += `left join ${this.tableName} on 0=1;`;

      return sql;
    }

    return '';
  }

  _buildReturningSelect(values) {
    // If value is nothing then return an empty string
    if (values && values.length > 0) {
      let selections = '';

      // Build columns to return
      if (Array.isArray(values)) {
        selections = values
          .map((value) => `${this.formatter.columnize(value)}`)
          .join(',');
      } else {
        selections = this.formatter.columnize(values);
      }

      // Get the returned values
      let sql = `; select ${selections} from #out; `;
      // Drop the temp table to prevent memory leaks
      sql += `drop table #out;`;

      return sql;
    }

    return '';
  }

  // Compiles a `truncate` query.
  truncate() {
    return `truncate table ${this.tableName}`;
  }

  forUpdate() {
    // this doesn't work exacltly as it should, one should also mention index while locking
    // https://stackoverflow.com/a/9818448/360060
    return 'with (UPDLOCK)';
  }

  forShare() {
    // http://www.sqlteam.com/article/introduction-to-locking-in-sql-server
    return 'with (HOLDLOCK)';
  }

  // Compiles a `columnInfo` query.
  columnInfo() {
    const column = this.single.columnInfo;
    let schema = this.single.schema;

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    const table = this.client.customWrapIdentifier(this.single.table, identity);

    if (schema) {
      schema = this.client.customWrapIdentifier(schema, identity);
    }

    // GOTCHA: INFORMATION_SCHEMA.COLUMNS must be capitalized to work when the database has a case-sensitive collation. [#4573]
    let sql = `select [COLUMN_NAME], [COLUMN_DEFAULT], [DATA_TYPE], [CHARACTER_MAXIMUM_LENGTH], [IS_NULLABLE] from INFORMATION_SCHEMA.COLUMNS where table_name = ? and table_catalog = ?`;
    const bindings = [table, this.client.database()];

    if (schema) {
      sql += ' and table_schema = ?';
      bindings.push(schema);
    } else {
      sql += ` and table_schema = 'dbo'`;
    }

    return {
      sql,
      bindings: bindings,
      output(resp) {
        const out = resp.reduce((columns, val) => {
          columns[val[0].value] = {
            defaultValue: val[1].value,
            type: val[2].value,
            maxLength: val[3].value,
            nullable: val[4].value === 'YES',
          };
          return columns;
        }, {});
        return (column && out[column]) || out;
      },
    };
  }

  top() {
    const noLimit = !this.single.limit && this.single.limit !== 0;
    const noOffset = !this.single.offset;
    if (noLimit || !noOffset) return '';
    return `top (${this._getValueOrParameterFromAttribute('limit')})`;
  }

  limit() {
    return '';
  }

  offset() {
    const noLimit = !this.single.limit && this.single.limit !== 0;
    const noOffset = !this.single.offset;
    if (noOffset) return '';
    let offset = `offset ${
      noOffset ? '0' : this._getValueOrParameterFromAttribute('offset')
    } rows`;
    if (!noLimit) {
      offset += ` fetch next ${this._getValueOrParameterFromAttribute(
        'limit'
      )} rows only`;
    }
    return offset;
  }

  whereLike(statement) {
    return `${this._columnClause(
      statement
    )} collate SQL_Latin1_General_CP1_CS_AS ${this._not(
      statement,
      'like '
    )}${this._valueClause(statement)}`;
  }

  whereILike(statement) {
    return `${this._columnClause(
      statement
    )} collate SQL_Latin1_General_CP1_CI_AS ${this._not(
      statement,
      'like '
    )}${this._valueClause(statement)}`;
  }

  jsonExtract(params) {
    // JSON_VALUE return NULL if we query object or array
    // JSON_QUERY return NULL if we query literal/single value
    return this._jsonExtract(
      params.singleValue ? 'JSON_VALUE' : 'JSON_QUERY',
      params
    );
  }

  jsonSet(params) {
    return this._jsonSet('JSON_MODIFY', params);
  }

  jsonInsert(params) {
    return this._jsonSet('JSON_MODIFY', params);
  }

  jsonRemove(params) {
    const jsonCol = `JSON_MODIFY(${columnize_(
      params.column,
      this.builder,
      this.client,
      this.bindingsHolder
    )},${this.client.parameter(
      params.path,
      this.builder,
      this.bindingsHolder
    )}, NULL)`;
    return params.alias
      ? this.client.alias(jsonCol, this.formatter.wrap(params.alias))
      : jsonCol;
  }

  whereJsonPath(statement) {
    return this._whereJsonPath('JSON_VALUE', statement);
  }

  whereJsonSupersetOf(statement) {
    throw new Error(
      'Json superset where clause not actually supported by MSSQL'
    );
  }

  whereJsonSubsetOf(statement) {
    throw new Error('Json subset where clause not actually supported by MSSQL');
  }

  _getExtracts(statement, operator) {
    const column = columnize_(
      statement.column,
      this.builder,
      this.client,
      this.bindingsHolder
    );
    return (
      Array.isArray(statement.values) ? statement.values : [statement.values]
    )
      .map(function (value) {
        return (
          'JSON_VALUE(' +
          column +
          ',' +
          this.client.parameter(value, this.builder, this.bindingsHolder) +
          ')'
        );
      }, this)
      .join(operator);
  }

  onJsonPathEquals(clause) {
    return this._onJsonPathEquals('JSON_VALUE', clause);
  }
}

// Set the QueryBuilder & QueryCompiler on the client object,
// in case anyone wants to modify things to suit their own purposes.
module.exports = QueryCompiler_MSSQL;
