// PostgreSQL Query Builder & Compiler
// ------
const identity = require('lodash/identity');
const reduce = require('lodash/reduce');

const QueryCompiler = require('../../../query/querycompiler');
const {
  wrapString,
  columnize: columnize_,
  operator: operator_,
  wrap: wrap_,
} = require('../../../formatter/wrappingFormatter');

class QueryCompiler_PG extends QueryCompiler {
  constructor(client, builder, formatter) {
    super(client, builder, formatter);
    this._defaultInsertValue = 'default';
  }

  // Compiles a truncate query.
  truncate() {
    return `truncate ${this.tableName} restart identity`;
  }

  // is used if the an array with multiple empty values supplied

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  insert() {
    let sql = super.insert();
    if (sql === '') return sql;

    const { returning, onConflict, ignore, merge, insert } = this.single;
    if (onConflict && ignore) sql += this._ignore(onConflict);
    if (onConflict && merge) {
      sql += this._merge(merge.updates, onConflict, insert);
      const wheres = this.where();
      if (wheres) sql += ` ${wheres}`;
    }
    if (returning) sql += this._returning(returning);

    return {
      sql,
      returning,
    };
  }

  // Compiles an `update` query, allowing for a return value.
  update() {
    const withSQL = this.with();
    const updateData = this._prepUpdate(this.single.update);
    const wheres = this.where();
    const { returning, updateFrom } = this.single;
    return {
      sql:
        withSQL +
        `update ${this.single.only ? 'only ' : ''}${this.tableName} ` +
        `set ${updateData.join(', ')}` +
        this._updateFrom(updateFrom) +
        (wheres ? ` ${wheres}` : '') +
        this._returning(returning),
      returning,
    };
  }

  using() {
    const usingTables = this.single.using;
    if (!usingTables) return;
    let sql = 'using ';
    if (Array.isArray(usingTables)) {
      sql += usingTables
        .map((table) => {
          return this.formatter.wrap(table);
        })
        .join(',');
    } else {
      sql += this.formatter.wrap(usingTables);
    }
    return sql;
  }

  // Compiles an `delete` query, allowing for a return value.
  del() {
    // Check for multi-table delete
    const deleteTables = this.single.deleteTables;
    if (deleteTables && deleteTables.length > 0) {
      // Use strategy pattern for multi-table delete
      const strategy = this._getMultiTableDeleteStrategy();
      if (strategy) {
        return strategy.call(this, deleteTables);
      }
    }

    // Original single-table delete logic
    return this._compileSingleTableDelete();
  }

  // Override to enable multi-table delete support
  _hasMultiTableDeleteCapability() {
    return true; // PostgreSQL supports multi-table DELETE via USING clause
  }

  // Get the multi-table delete strategy for PostgreSQL
  _getMultiTableDeleteStrategy() {
    return this._compileMultiTableDelete_PostgreSQL;
  }

  // PostgreSQL-specific multi-table DELETE implementation strategy
  _compileMultiTableDelete_PostgreSQL(deleteTables) {
    const { tableName } = this;
    const withSQL = this.with();
    const wheres = this.where();
    const joins = this.grouped.join;
    const { returning } = this.single;

    // PostgreSQL doesn't support DELETE table1, table2 syntax
    // Instead, we need to generate multiple DELETE statements
    // For now, we'll generate a single DELETE with USING clause that can affect multiple tables
    // through proper JOIN conditions
    
    // If user specifies multiple tables, we'll delete from the first table
    // and use the others in the USING clause
    const primaryTable = deleteTables[0];
    const usingTables = deleteTables.slice(1);
    
    // Build USING clause from additional tables and joins
    let using = this.using() || '';
    const tableJoins = [];
    
    // Add the specified delete tables to USING clause
    for (const table of usingTables) {
      tableJoins.push(this.formatter.wrap(table));
    }
    
    // Add join tables to USING clause
    let joinWheres = '';
    if (Array.isArray(joins)) {
      for (const join of joins) {
        const joinTable = this._joinTable(join);
        if (!tableJoins.includes(this.formatter.wrap(joinTable)) && joinTable !== primaryTable) {
          tableJoins.push(
            wrap_(
              joinTable,
              undefined,
              this.builder,
              this.client,
              this.bindingsHolder
            )
          );
        }

        const joinConditions = [];
        for (const clause of join.clauses) {
          joinConditions.push(
            this.whereBasic({
              column: clause.column,
              operator: '=',
              value: clause.value,
              asColumn: true,
            })
          );
        }
        if (joinConditions.length > 0) {
          joinWheres += (joinWheres ? ' and ' : '') + joinConditions.join(' and ');
        }
      }
    }
    
    if (tableJoins.length > 0) {
      using += (using ? ',' : 'using ') + tableJoins.join(',');
    }
    
    // Combine join conditions with where conditions
    let finalWheres = '';
    if (joinWheres && wheres) {
      finalWheres = `where ${joinWheres} and ${wheres.replace(/^where\s+/, '')}`;
    } else if (joinWheres) {
      finalWheres = `where ${joinWheres}`;
    } else if (wheres) {
      finalWheres = wheres;
    }

    const sql =
      withSQL +
      `delete from ${this.single.only ? 'only ' : ''}${this.formatter.wrap(primaryTable)}` +
      (using ? ` ${using}` : '') +
      (finalWheres ? ` ${finalWheres}` : '');

    return {
      sql: sql + this._returning(returning),
      returning,
    };
  }

  // Legacy methods for backward compatibility
  _supportsMultiTableDelete() {
    return true;
  }
  
  // Compile multi-table delete for PostgreSQL (legacy - delegates to strategy)
  _compileMultiTableDelete(deleteTables) {
    return this._compileMultiTableDelete_PostgreSQL(deleteTables);
  }

  // Compile single table delete (original logic)
  _compileSingleTableDelete() {
    // Make sure tableName is processed by the formatter first.
    const { tableName } = this;
    const withSQL = this.with();
    let wheres = this.where() || '';
    let using = this.using() || '';
    const joins = this.grouped.join;

    const tableJoins = [];
    if (Array.isArray(joins)) {
      for (const join of joins) {
        tableJoins.push(
          wrap_(
            this._joinTable(join),
            undefined,
            this.builder,
            this.client,
            this.bindingsHolder
          )
        );

        const joinWheres = [];
        for (const clause of join.clauses) {
          joinWheres.push(
            this.whereBasic({
              column: clause.column,
              operator: '=',
              value: clause.value,
              asColumn: true,
            })
          );
        }
        if (joinWheres.length > 0) {
          wheres += (wheres ? ' and ' : 'where ') + joinWheres.join(' and ');
        }
      }
      if (tableJoins.length > 0) {
        using += (using ? ',' : 'using ') + tableJoins.join(',');
      }
    }

    // With 'using' syntax, no tablename between DELETE and FROM.
    const sql =
      withSQL +
      `delete from ${this.single.only ? 'only ' : ''}${tableName}` +
      (using ? ` ${using}` : '') +
      (wheres ? ` ${wheres}` : '');
    const { returning } = this.single;
    return {
      sql: sql + this._returning(returning),
      returning,
    };
  }

  aggregate(stmt) {
    return this._aggregate(stmt, { distinctParentheses: true });
  }

  _returning(value) {
    return value ? ` returning ${this.formatter.columnize(value)}` : '';
  }

  _updateFrom(name) {
    return name ? ` from ${this.formatter.wrap(name)}` : '';
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

  // Join array of table names and apply default schema.
  _tableNames(tables) {
    const schemaName = this.single.schema;
    const sql = [];

    for (let i = 0; i < tables.length; i++) {
      let tableName = tables[i];

      if (tableName) {
        if (schemaName) {
          tableName = `${schemaName}.${tableName}`;
        }
        sql.push(this.formatter.wrap(tableName));
      }
    }

    return sql.join(', ');
  }

  _lockingClause(lockMode) {
    const tables = this.single.lockTables || [];

    return lockMode + (tables.length ? ' of ' + this._tableNames(tables) : '');
  }

  _groupOrder(item, type) {
    return super._groupOrderNulls(item, type);
  }

  forUpdate() {
    return this._lockingClause('for update');
  }

  forShare() {
    return this._lockingClause('for share');
  }

  forNoKeyUpdate() {
    return this._lockingClause('for no key update');
  }

  forKeyShare() {
    return this._lockingClause('for key share');
  }

  skipLocked() {
    return 'skip locked';
  }

  noWait() {
    return 'nowait';
  }

  // Compiles a columnInfo query
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

    const sql =
      'select * from information_schema.columns where table_name = ? and table_catalog = current_database()';
    const bindings = [table];

    return this._buildColumnInfoQuery(schema, sql, bindings, column);
  }

  _buildColumnInfoQuery(schema, sql, bindings, column) {
    if (schema) {
      sql += ' and table_schema = ?';
      bindings.push(schema);
    } else {
      sql += ' and table_schema = current_schema()';
    }

    return {
      sql,
      bindings,
      output(resp) {
        const out = reduce(
          resp.rows,
          function (columns, val) {
            columns[val.column_name] = {
              type: val.data_type,
              maxLength: val.character_maximum_length,
              nullable: val.is_nullable === 'YES',
              defaultValue: val.column_default,
            };
            return columns;
          },
          {}
        );
        return (column && out[column]) || out;
      },
    };
  }

  distinctOn(value) {
    return 'distinct on (' + this.formatter.columnize(value) + ') ';
  }

  // Json functions
  jsonExtract(params) {
    return this._jsonExtract('jsonb_path_query', params);
  }

  jsonSet(params) {
    return this._jsonSet(
      'jsonb_set',
      Object.assign({}, params, {
        path: this.client.toPathForJson(params.path),
      })
    );
  }

  jsonInsert(params) {
    return this._jsonSet(
      'jsonb_insert',
      Object.assign({}, params, {
        path: this.client.toPathForJson(params.path),
      })
    );
  }

  jsonRemove(params) {
    const jsonCol = `${columnize_(
      params.column,
      this.builder,
      this.client,
      this.bindingsHolder
    )} #- ${this.client.parameter(
      this.client.toPathForJson(params.path),
      this.builder,
      this.bindingsHolder
    )}`;
    return params.alias
      ? this.client.alias(jsonCol, this.formatter.wrap(params.alias))
      : jsonCol;
  }

  whereJsonPath(statement) {
    let castValue = '';
    if (!isNaN(statement.value) && parseInt(statement.value)) {
      castValue = '::int';
    } else if (!isNaN(statement.value) && parseFloat(statement.value)) {
      castValue = '::float';
    } else {
      castValue = " #>> '{}'";
    }
    return `jsonb_path_query_first(${this._columnClause(
      statement
    )}, ${this.client.parameter(
      statement.jsonPath,
      this.builder,
      this.bindingsHolder
    )})${castValue} ${operator_(
      statement.operator,
      this.builder,
      this.client,
      this.bindingsHolder
    )} ${this._jsonValueClause(statement)}`;
  }

  whereJsonSupersetOf(statement) {
    return this._not(
      statement,
      `${wrap_(
        statement.column,
        undefined,
        this.builder,
        this.client,
        this.bindingsHolder
      )} @> ${this._jsonValueClause(statement)}`
    );
  }

  whereJsonSubsetOf(statement) {
    return this._not(
      statement,
      `${columnize_(
        statement.column,
        this.builder,
        this.client,
        this.bindingsHolder
      )} <@ ${this._jsonValueClause(statement)}`
    );
  }

  onJsonPathEquals(clause) {
    return this._onJsonPathEquals('jsonb_path_query_first', clause);
  }
}

module.exports = QueryCompiler_PG;
