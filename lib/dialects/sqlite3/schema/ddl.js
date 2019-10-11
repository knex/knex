// SQLite3_DDL
//
// All of the SQLite3 specific DDL helpers for renaming/dropping
// columns and changing datatypes.
// -------

const Bluebird = require('bluebird');
const {
  assign,
  uniqueId,
  find,
  identity,
  map,
  omit,
  invert,
  fromPairs,
  some,
  negate,
  isEmpty
} = require('lodash');

// So altering the schema in SQLite3 is a major pain.
// We have our own object to deal with the renaming and altering the types
// for sqlite3 things.
function SQLite3_DDL(client, tableCompiler, pragma, connection) {
  this.client = client;
  this.tableCompiler = tableCompiler;
  this.pragma = pragma;
  this.tableNameRaw = this.tableCompiler.tableNameRaw;
  this.alteredName = uniqueId('_knex_temp_alter');
  this.connection = connection;
  this.formatter =
    client && client.config && client.config.wrapIdentifier
      ? client.config.wrapIdentifier
      : (value) => value;
}

assign(SQLite3_DDL.prototype, {
  tableName() {
    return this.formatter(this.tableNameRaw, (value) => value);
  },

  getColumn: async function(column) {
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
  },

  getTableSql() {
    this.trx.disableProcessing();
    return this.trx
      .raw(
        `SELECT name, sql FROM sqlite_master WHERE type="table" AND name="${this.tableName()}"`
      )
      .then((result) => {
        this.trx.enableProcessing();
        return result;
      });
  },

  renameTable: async function() {
    return this.trx.raw(
      `ALTER TABLE "${this.tableName()}" RENAME TO "${this.alteredName}"`
    );
  },

  dropOriginal() {
    return this.trx.raw(`DROP TABLE "${this.tableName()}"`);
  },

  dropTempTable() {
    return this.trx.raw(`DROP TABLE "${this.alteredName}"`);
  },

  copyData() {
    return this.trx
      .raw(`SELECT * FROM "${this.tableName()}"`)
      .bind(this)
      .then(this.insertChunked(20, this.alteredName));
  },

  reinsertData(iterator) {
    return function() {
      return this.trx
        .raw(`SELECT * FROM "${this.alteredName}"`)
        .bind(this)
        .then(this.insertChunked(20, this.tableName(), iterator));
    };
  },

  insertChunked(amount, target, iterator) {
    iterator = iterator || identity;
    return function(result) {
      let batch = [];
      const ddl = this;
      return Bluebird.reduce(
        result,
        function(memo, row) {
          memo++;
          batch.push(row);
          if (memo % 20 === 0 || memo === result.length) {
            return ddl.trx
              .queryBuilder()
              .table(target)
              .insert(map(batch, iterator))
              .then(function() {
                batch = [];
              })
              .then(() => memo);
          }
          return memo;
        },
        0
      );
    };
  },

  createTempTable(createTable) {
    return function() {
      return this.trx.raw(
        createTable.sql.replace(this.tableName(), this.alteredName)
      );
    };
  },

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

    args = args.map(function(item) {
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
        new RegExp(`\\[${fromIdentifier}\\]`, 'i')
      ];
      if (fromIdentifier.match(/^\S+$/)) {
        fromMatchCandidates.push(new RegExp(`\\b${fromIdentifier}\\b`, 'i'));
      }

      const doesMatchFromIdentifier = (target) =>
        some(fromMatchCandidates, (c) => target.match(c));

      const replaceFromIdentifier = (target) =>
        fromMatchCandidates.reduce((result, candidate) => result.replace(candidate, to), target);

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
        const ret =  item.replace(/\(.*\)/, replaceFromIdentifier);
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
          const replacedKeyTargetSpec = split[1].replace(/\(.*\)/, replaceFromIdentifier);
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
  },

  // Boy, this is quite a method.
  renameColumn: async function(from, to) {
    return this.client.transaction(
      async (trx) => {
        this.trx = trx;
        const column = await this.getColumn(from);
        const sql = await this.getTableSql(column);
        const a = this.client.wrapIdentifier(from);
        const b = this.client.wrapIdentifier(to);
        const createTable = sql[0];
        const newSql = this._doReplace(createTable.sql, a, b);
        if (sql === newSql) {
          throw new Error('Unable to find the column to change');
        }

        const { from: mappedFrom, to: mappedTo } = invert(
          this.client.postProcessResponse(
            invert({
              from,
              to,
            })
          )
        );

        return Bluebird.bind(this)
          .then(this.createTempTable(createTable))
          .then(this.copyData)
          .then(this.dropOriginal)
          .then(function() {
            return this.trx.raw(newSql);
          })
          .then(
            this.reinsertData(function(row) {
              row[mappedTo] = row[mappedFrom];
              return omit(row, mappedFrom);
            })
          )
          .then(this.dropTempTable);
      },
      { connection: this.connection }
    );
  },

  dropColumn: async function(columns) {
    return this.client.transaction(
      (trx) => {
        this.trx = trx;
        return Bluebird.all(columns.map((column) => this.getColumn(column)))
          .bind(this)
          .then(this.getTableSql)
          .then(function(sql) {
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
            return Bluebird.bind(this)
              .then(this.createTempTable(createTable))
              .then(this.copyData)
              .then(this.dropOriginal)
              .then(function() {
                return this.trx.raw(newSql);
              })
              .then(this.reinsertData((row) => omit(row, ...mappedColumns)))
              .then(this.dropTempTable);
          });
      },
      { connection: this.connection }
    );
  },
});

module.exports = SQLite3_DDL;
