// PostgreSQL Schema Compiler
// -------

const SchemaCompiler = require('../../../schema/compiler');

class SchemaCompiler_PG extends SchemaCompiler {
  constructor(client, builder) {
    super(client, builder);
  }

  // Check whether the current table
  hasTable(tableName) {
    let sql = 'select * from information_schema.tables where table_name = ?';
    const bindings = [tableName];

    if (this.schema) {
      sql += ' and table_schema = ?';
      bindings.push(this.schema);
    } else {
      sql += ' and table_schema = current_schema()';
    }

    this.pushQuery({
      sql,
      bindings,
      output(resp) {
        return resp.rows.length > 0;
      },
    });
  }

  // Compile the query to determine if a column exists in a table.
  hasColumn(tableName, columnName) {
    let sql =
      'select * from information_schema.columns where table_name = ? and column_name = ?';
    const bindings = [tableName, columnName];

    if (this.schema) {
      sql += ' and table_schema = ?';
      bindings.push(this.schema);
    } else {
      sql += ' and table_schema = current_schema()';
    }

    this.pushQuery({
      sql,
      bindings,
      output(resp) {
        return resp.rows.length > 0;
      },
    });
  }

  qualifiedTableName(tableName) {
    const name = this.schema ? `${this.schema}.${tableName}` : tableName;
    return this.formatter.wrap(name);
  }

  // Compile a rename table command.
  renameTable(from, to) {
    this.pushQuery(
      `alter table ${this.qualifiedTableName(
        from
      )} rename to ${this.formatter.wrap(to)}`
    );
  }

  createSchema(schemaName) {
    this.pushQuery(`create schema ${this.formatter.wrap(schemaName)}`);
  }

  createSchemaIfNotExists(schemaName) {
    this.pushQuery(
      `create schema if not exists ${this.formatter.wrap(schemaName)}`
    );
  }

  dropSchema(schemaName) {
    this.pushQuery(`drop schema ${this.formatter.wrap(schemaName)}`);
  }

  dropSchemaIfExists(schemaName) {
    this.pushQuery(`drop schema if exists ${this.formatter.wrap(schemaName)}`);
  }

  dropExtension(extensionName) {
    this.pushQuery(`drop extension ${this.formatter.wrap(extensionName)}`);
  }

  dropExtensionIfExists(extensionName) {
    this.pushQuery(
      `drop extension if exists ${this.formatter.wrap(extensionName)}`
    );
  }

  createExtension(extensionName) {
    this.pushQuery(`create extension ${this.formatter.wrap(extensionName)}`);
  }

  createExtensionIfNotExists(extensionName) {
    this.pushQuery(
      `create extension if not exists ${this.formatter.wrap(extensionName)}`
    );
  }
}

module.exports = SchemaCompiler_PG;
