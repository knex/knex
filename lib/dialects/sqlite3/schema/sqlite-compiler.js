// SQLite3: Column Builder & Compiler
// -------
const SchemaCompiler = require('../../../schema/compiler');

const some = require('lodash/some');

// Schema Compiler
// -------

class SchemaCompiler_SQLite3 extends SchemaCompiler {
  constructor(client, builder) {
    super(client, builder);
  }

  // Compile the query to determine if a table exists.
  hasTable(tableName) {
    const sql =
      `select * from sqlite_master ` +
      `where type = 'table' and name = ${this.client.parameter(
        tableName,
        this.builder,
        this.bindingsHolder
      )}`;
    this.pushQuery({ sql, output: (resp) => resp.length > 0 });
  }

  // Compile the query to determine if a column exists.
  hasColumn(tableName, column) {
    this.pushQuery({
      sql: `PRAGMA table_info(${this.formatter.wrap(tableName)})`,
      output(resp) {
        return some(resp, (col) => {
          return (
            this.client.wrapIdentifier(col.name.toLowerCase()) ===
            this.client.wrapIdentifier(column.toLowerCase())
          );
        });
      },
    });
  }

  // Compile a rename table command.
  renameTable(from, to) {
    this.pushQuery(
      `alter table ${this.formatter.wrap(from)} rename to ${this.formatter.wrap(
        to
      )}`
    );
  }

  async generateDdlCommands() {
    const sequence = this.builder._sequence;
    for (let i = 0, l = sequence.length; i < l; i++) {
      const query = sequence[i];
      this[query.method].apply(this, query.args);
    }

    const result = [];
    const commandSources = this.sequence;
    for (const commandSource of commandSources) {
      const command = commandSource.statementsProducer
        ? await commandSource.statementsProducer()
        : commandSource.sql;

      if (Array.isArray(command)) {
        result.push(...command);
      } else {
        result.push(command);
      }
    }

    return { pre: [], sql: result, post: [] };
  }
}

module.exports = SchemaCompiler_SQLite3;
