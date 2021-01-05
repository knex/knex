// SQLite3_DDL
//
// All of the SQLite3 specific DDL helpers for renaming/dropping
// columns and changing datatypes.
// -------

const find = require('lodash/find');
const fromPairs = require('lodash/fromPairs');
const isEmpty = require('lodash/isEmpty');
const negate = require('lodash/negate');
const omit = require('lodash/omit');
const { nanonum } = require('../../../util/nanoid');
const { COMMA_NO_PAREN_REGEX } = require('../../../constants');
const {
  createTempTable,
  copyAllData,
  copyData,
  dropTempTable,
  dropOriginal,
  reinsertData,
  renameTable,
  getTableSql,
} = require('./internal/sqlite-ddl-operations');

// So altering the schema in SQLite3 is a major pain.
// We have our own object to deal with the renaming and altering the types
// for sqlite3 things.
class SQLite3_DDL {
  constructor(client, tableCompiler, pragma, connection) {
    this.client = client;
    this.tableCompiler = tableCompiler;
    this.pragma = pragma;
    this.tableNameRaw = this.tableCompiler.tableNameRaw;
    this.alteredName = `_knex_temp_alter${nanonum(3)}`;
    this.connection = connection;
    this.formatter =
      client && client.config && client.config.wrapIdentifier
        ? client.config.wrapIdentifier
        : (value) => value;
  }

  tableName() {
    return this.formatter(this.tableNameRaw, (value) => value);
  }

  async getColumn(column) {
    const currentCol = find(this.pragma, (col) => {
      return (
        this.client.wrapIdentifier(col.name).toLowerCase() ===
        this.client.wrapIdentifier(column).toLowerCase()
      );
    });
    if (!currentCol)
      throw new Error(
        `The column ${column} is not in the ${this.tableName()} table`
      );
    return currentCol;
  }

  getTableSql() {
    this.trx.disableProcessing();
    return this.trx.raw(getTableSql(this.tableName())).then((result) => {
      this.trx.enableProcessing();
      return result;
    });
  }

  async renameTable() {
    return this.trx.raw(renameTable(this.tableName(), this.alteredName));
  }

  dropOriginal() {
    return this.trx.raw(dropOriginal(this.tableName()));
  }

  dropTempTable() {
    return this.trx.raw(dropTempTable(this.alteredName));
  }

  async copyData() {
    const commands = await copyData(
      this.trx,
      this.tableName(),
      this.alteredName
    );
    for (const command of commands) {
      await this.trx.raw(command);
    }
  }

  async reinsertData(iterator) {
    const commands = await reinsertData(
      this.trx,
      iterator,
      this.tableName(),
      this.alteredName
    );
    for (const command of commands) {
      await this.trx.raw(command);
    }
  }

  createTempTable(createTable) {
    return this.trx.raw(
      createTempTable(createTable, this.tableName(), this.alteredName)
    );
  }

  _doReplace(sql, from, to) {
    const oneLineSql = sql.replace(/\s+/g, ' ');
    const matched = oneLineSql.match(/^CREATE TABLE\s+(\S+)\s*\((.*)\)/);

    const tableName = matched[1];
    const defs = matched[2];

    if (!defs) {
      throw new Error('No column definitions in this statement!');
    }

    let parens = 0,
      args = [],
      ptr = 0;
    let i = 0;
    const x = defs.length;
    for (i = 0; i < x; i++) {
      switch (defs[i]) {
        case '(':
          parens++;
          break;
        case ')':
          parens--;
          break;
        case ',':
          if (parens === 0) {
            args.push(defs.slice(ptr, i));
            ptr = i + 1;
          }
          break;
        case ' ':
          if (ptr === i) {
            ptr = i + 1;
          }
          break;
      }
    }
    args.push(defs.slice(ptr, i));

    const fromIdentifier = from.replace(/[`"'[\]]/g, '');

    args = args.map((item) => {
      let split = item.trim().split(' ');

      // SQLite supports all quoting mechanisms prevalent in all major dialects of SQL
      // and preserves the original quoting in sqlite_master.
      //
      // Also, identifiers are never case sensitive, not even when quoted.
      //
      // Ref: https://www.sqlite.org/lang_keywords.html
      const fromMatchCandidates = [
        new RegExp(`\`${fromIdentifier}\``, 'i'),
        new RegExp(`"${fromIdentifier}"`, 'i'),
        new RegExp(`'${fromIdentifier}'`, 'i'),
        new RegExp(`\\[${fromIdentifier}\\]`, 'i'),
      ];
      if (fromIdentifier.match(/^\S+$/)) {
        fromMatchCandidates.push(new RegExp(`\\b${fromIdentifier}\\b`, 'i'));
      }

      const doesMatchFromIdentifier = (target) =>
        fromMatchCandidates.some((c) => target.match(c));

      const replaceFromIdentifier = (target) =>
        fromMatchCandidates.reduce(
          (result, candidate) => result.replace(candidate, to),
          target
        );

      if (doesMatchFromIdentifier(split[0])) {
        // column definition
        if (to) {
          split[0] = to;
          return split.join(' ');
        }
        return ''; // for deletions
      }

      // skip constraint name
      const idx = /constraint/i.test(split[0]) ? 2 : 0;

      // primary key and unique constraints have one or more
      // columns from this table listed between (); replace
      // one if it matches
      if (/primary|unique/i.test(split[idx])) {
        const ret = item.replace(/\(.*\)/, replaceFromIdentifier);
        // If any member columns are dropped then uniqueness/pk constraint
        // can not be retained
        if (ret !== item && isEmpty(to)) return '';
        return ret;
      }

      // foreign keys have one or more columns from this table
      // listed between (); replace one if it matches
      // foreign keys also have a 'references' clause
      // which may reference THIS table; if it does, replace
      // column references in that too!
      if (/foreign/.test(split[idx])) {
        split = item.split(/ references /i);
        // the quoted column names save us from having to do anything
        // other than a straight replace here
        const replacedKeySpec = replaceFromIdentifier(split[0]);

        if (split[0] !== replacedKeySpec) {
          // If we are removing one or more columns of a foreign
          // key, then we should not retain the key at all
          if (isEmpty(to)) return '';
          else split[0] = replacedKeySpec;
        }

        if (split[1].slice(0, tableName.length) === tableName) {
          // self-referential foreign key
          const replacedKeyTargetSpec = split[1].replace(
            /\(.*\)/,
            replaceFromIdentifier
          );
          if (split[1] !== replacedKeyTargetSpec) {
            // If we are removing one or more columns of a foreign
            // key, then we should not retain the key at all
            if (isEmpty(to)) return '';
            else split[1] = replacedKeyTargetSpec;
          }
        }
        return split.join(' references ');
      }

      return item;
    });

    args = args.filter(negate(isEmpty));

    if (args.length === 0) {
      throw new Error('Unable to drop last column from table');
    }

    return oneLineSql
      .replace(/\(.*\)/, () => `(${args.join(', ')})`)
      .replace(/,\s*([,)])/, '$1');
  }

  async dropColumn(columns) {
    return this.client.transaction(
      (trx) => {
        this.trx = trx;
        return Promise.all(columns.map((column) => this.getColumn(column)))
          .then(() => this.getTableSql())
          .then((sql) => {
            const createTable = sql[0];
            let newSql = createTable.sql;
            columns.forEach((column) => {
              const a = this.client.wrapIdentifier(column);
              newSql = this._doReplace(newSql, a, '');
            });
            if (sql === newSql) {
              throw new Error('Unable to find the column to change');
            }
            const mappedColumns = Object.keys(
              this.client.postProcessResponse(
                fromPairs(columns.map((column) => [column, column]))
              )
            );
            return this.reinsertMapped(createTable, newSql, (row) =>
              omit(row, ...mappedColumns)
            );
          });
      },
      { connection: this.connection }
    );
  }

  async dropForeign(columns, indexName) {
    return this.client.transaction(
      async (trx) => {
        this.trx = trx;

        const sql = await this.getTableSql();

        const createTable = sql[0];

        const oneLineSql = createTable.sql.replace(/\s+/g, ' ');
        const matched = oneLineSql.match(/^CREATE TABLE\s+(\S+)\s*\((.*)\)/);

        const defs = matched[2];

        if (!defs) {
          throw new Error('No column definitions in this statement!');
        }

        const updatedDefs = defs
          .split(COMMA_NO_PAREN_REGEX)
          .map((line) => line.trim())
          .filter((defLine) => {
            if (
              defLine.startsWith('constraint') === false &&
              defLine.includes('foreign key') === false
            )
              return true;

            if (indexName) {
              if (defLine.includes(indexName)) return false;
              return true;
            } else {
              const matched = defLine.match(/\(`([^)]+)`\)/);
              const columnNames = matched[1].split(', ');

              const unknownColumnIncludedCheck = (col) =>
                !columns.includes(col);
              return columnNames.every(unknownColumnIncludedCheck) === false;
            }
          })
          .join(', ');

        const newSql = oneLineSql.replace(defs, updatedDefs);

        return this.reinsertMapped(createTable, newSql, (row) => {
          return row;
        });
      },
      { connection: this.connection }
    );
  }

  async dropPrimary(constraintName) {
    return this.client.transaction(
      async (trx) => {
        this.trx = trx;

        const sql = await this.getTableSql();

        const createTable = sql[0];

        const oneLineSql = createTable.sql.replace(/\s+/g, ' ');
        const matched = oneLineSql.match(/^CREATE TABLE\s+(\S+)\s*\((.*)\)/);

        const defs = matched[2];

        if (!defs) {
          throw new Error('No column definitions in this statement!');
        }

        const updatedDefs = defs
          .split(COMMA_NO_PAREN_REGEX)
          .map((line) => line.trim())
          .filter((defLine) => {
            if (
              defLine.startsWith('constraint') === false &&
              defLine.includes('primary key') === false
            )
              return true;

            if (constraintName) {
              if (defLine.includes(constraintName)) return false;
              return true;
            } else {
              return true;
            }
          })
          .join(', ');

        const newSql = oneLineSql.replace(defs, updatedDefs);

        return this.reinsertMapped(createTable, newSql, (row) => {
          return row;
        });
      },
      { connection: this.connection }
    );
  }

  async primary(columns, constraintName) {
    return this.client.transaction(
      async (trx) => {
        this.trx = trx;

        const tableInfo = (await this.getTableSql())[0];
        const currentSQL = tableInfo.sql;

        const oneLineSQL = currentSQL.replace(/\s+/g, ' ');
        const matched = oneLineSQL.match(/^CREATE TABLE\s+(\S+)\s*\((.*)\)/);

        const columnDefinitions = matched[2];

        if (!columnDefinitions) {
          throw new Error('No column definitions in this statement!');
        }

        const primaryKeyDef = `primary key(${columns.join(',')})`;
        const constraintDef = constraintName
          ? `constraint ${constraintName} ${primaryKeyDef}`
          : primaryKeyDef;

        const newColumnDefinitions = [
          ...columnDefinitions
            .split(COMMA_NO_PAREN_REGEX)
            .map((line) => line.trim())
            .filter((line) => line.startsWith('primary') === false)
            .map((line) => line.replace(/primary key/i, '')),
          constraintDef,
        ].join(', ');

        const newSQL = oneLineSQL.replace(
          columnDefinitions,
          newColumnDefinitions
        );

        return this.reinsertMapped(tableInfo, newSQL, (row) => {
          return row;
        });
      },
      { connection: this.connection }
    );
  }

  async foreign(foreignInfo) {
    return this.client.transaction(
      async (trx) => {
        this.trx = trx;

        const tableInfo = (await this.getTableSql())[0];
        const currentSQL = tableInfo.sql;

        const oneLineSQL = currentSQL.replace(/\s+/g, ' ');
        const matched = oneLineSQL.match(/^CREATE TABLE\s+(\S+)\s*\((.*)\)/);

        const columnDefinitions = matched[2];

        if (!columnDefinitions) {
          throw new Error('No column definitions in this statement!');
        }

        const newColumnDefinitions = columnDefinitions
          .split(COMMA_NO_PAREN_REGEX)
          .map((line) => line.trim());

        let newForeignSQL = '';

        if (foreignInfo.keyName) {
          newForeignSQL += `CONSTRAINT ${foreignInfo.keyName}`;
        }

        newForeignSQL += ` FOREIGN KEY (${foreignInfo.column.join(', ')}) `;
        newForeignSQL += ` REFERENCES ${foreignInfo.inTable} (${foreignInfo.references})`;

        if (foreignInfo.onUpdate) {
          newForeignSQL += ` ON UPDATE ${foreignInfo.onUpdate}`;
        }

        if (foreignInfo.onDelete) {
          newForeignSQL += ` ON DELETE ${foreignInfo.onUpdate}`;
        }

        newColumnDefinitions.push(newForeignSQL);

        const newSQL = oneLineSQL.replace(
          columnDefinitions,
          newColumnDefinitions.join(', ')
        );

        return await this.generateReinsertCommands(tableInfo, newSQL, (row) => {
          return row;
        });
      },
      { connection: this.connection }
    );
  }

  /**
   * @fixme
   *
   * There's a bunch of overlap between renameColumn/dropColumn/dropForeign/primary/foreign.
   * It'll be helpful to refactor this file heavily to combine/optimize some of these calls
   */

  reinsertMapped(createTable, newSql, mapRow) {
    return Promise.resolve()
      .then(() => this.createTempTable(createTable))
      .then(() => this.copyData())
      .then(() => this.dropOriginal())
      .then(() => this.trx.raw(newSql))
      .then(() => this.reinsertData(mapRow))
      .then(() => this.dropTempTable());
  }

  async generateReinsertCommands(createTable, newSql, mapRow) {
    const result = [];
    result.push(
      createTempTable(createTable, this.tableName(), this.alteredName)
    );

    result.push(copyAllData(this.tableName(), this.alteredName));
    result.push(dropOriginal(this.tableName()));

    result.push(newSql);

    result.push(copyAllData(this.alteredName, this.tableName()));
    result.push(dropTempTable(this.alteredName));
    return result;
  }
}

module.exports = SQLite3_DDL;
