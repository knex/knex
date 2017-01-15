// DB2 Schema Compiler
// -------


import inherits from 'inherits';
import SchemaCompiler from '../../../schema/compiler';

function SchemaCompiler_DB2() {
  SchemaCompiler.apply(this, arguments);
}
inherits(SchemaCompiler_DB2, SchemaCompiler);

// Check whether the current table
SchemaCompiler_DB2.prototype.hasTable = function(tableName) {
  let sql = 'select * from syscat.tables where tabname = ?';
  const bindings = [tableName];

  if (this.schema) {
    sql += ' and tabschema = ?';
    bindings.push(this.schema);
  } else {
    sql += ' and tabschema = current_schema';
  }

  this.pushQuery({
    sql,
    bindings,
    output(resp) {
      return resp.rows.length > 0;
    }
  });
};

// Compile the query to determine if a column exists in a table.
SchemaCompiler_DB2.prototype.hasColumn = function(tableName, columnName) {
  let sql = 'select * from syscat.columns where tabname = ? and colname = ?';
  const bindings = [tableName, columnName];

  if (this.schema) {
    sql += ' and tabschema = ?';
    bindings.push(this.schema);
  } else {
    sql += ' and tabschema = current_schema';
  }

  this.pushQuery({
    sql,
    bindings,
    output(resp) {
      return resp.rows.length > 0;
    }
  });
};

SchemaCompiler_DB2.prototype.qualifiedTableName = function(tableName) {
  const name = this.schema ? `${this.schema}.${tableName}` : tableName;
  return this.formatter.wrap(name);
};

// Compile a rename table command.
SchemaCompiler_DB2.prototype.renameTable = function(from, to) {
  this.pushQuery(
    `rename table ${this.qualifiedTableName(from)} to ${this.formatter.wrap(to)}`
  );
};

SchemaCompiler_DB2.prototype.createSchema = function(schemaName) {
  this.pushQuery(`create schema ${this.formatter.wrap(schemaName)}`);
};

SchemaCompiler_DB2.prototype.createSchemaIfNotExists = function(schemaName) {
  this.pushQuery(`create schema if not exists ${this.formatter.wrap(schemaName)}`);
};

SchemaCompiler_DB2.prototype.dropSchema = function(schemaName) {
  this.pushQuery(`drop schema ${this.formatter.wrap(schemaName)}`);
};

SchemaCompiler_DB2.prototype.dropSchemaIfExists = function(schemaName) {
  this.pushQuery(`drop schema if exists ${this.formatter.wrap(schemaName)}`);
};

SchemaCompiler_DB2.prototype.dropTableIfExists = function(tableName) {
  const query = `begin`
      + ` declare continue handler for sqlstate '42704' begin end;`
      + ` execute immediate 'DROP TABLE ${this.formatter.wrap(prefixedTableName(this.schema, tableName))}';`
    + ` end;`;
  this.pushQuery(query);
}

function prefixedTableName(prefix, table) {
  return prefix ? `${prefix}.${table}` : table;
}

export default SchemaCompiler_DB2;
