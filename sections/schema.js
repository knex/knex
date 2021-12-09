export default [
  {
    type: "heading",
    size: "lg",
    content: "Schema Builder",
    href: "Schema"
  },
  {
    type: "text",
    content: "The `knex.schema` is a **getter function**, which returns a stateful object containing the query. Therefore be sure to obtain a new instance of the `knex.schema` for every query. These methods return [promises](https://knexjs.org/#Interfaces-Promises)."
  },
  {
    type: "method",
    method: "withSchema",
    example: "knex.schema.withSchema([schemaName])",
    description: "Specifies the schema to be used when using the schema-building commands.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.withSchema('public').createTable('users', function (table) {
            table.increments();
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "createTable",
    example: "knex.schema.createTable(tableName, callback)",
    description: "Creates a new table on the database, with a callback function to modify the table's structure, using the schema-building commands.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.createTable('users', function (table) {
            table.increments();
            table.string('name');
            table.timestamps();
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "createTableLike",
    example: "knex.schema.createTableLike(tableName, tableNameToCopy, [callback])",
    description: "Creates a new table on the database based on another table. Copy only the structure : columns, keys and indexes (expected on SQL Server which only copy columns) and not the data. Callback function can be specified to add columns in the duplicated table.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.createTableLike('new_users', 'users')
        `
      },
      {
        type: "runnable",
        content: `
          // "new_users" table contains columns of users and two new columns 'age' and 'last_name'.
          knex.schema.createTableLike('new_users', 'users', (table) => {
            table.integer('age');
            table.string('last_name');
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "dropTable",
    example: "knex.schema.dropTable(tableName)",
    description: "Drops a table, specified by tableName.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.dropTable('users')
        `
      }
    ]
  },
  {
    type: "method",
    method: "dropTableIfExists",
    example: "knex.schema.dropTableIfExists(tableName)",
    description: "Drops a table conditionally if the table exists, specified by tableName.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.dropTableIfExists('users')
        `
      }
    ]
  },
  {
    type: "method",
    method: "renameTable",
    example: "knex.schema.renameTable(from, to)",
    description: "Renames a table from a current tableName to another.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.renameTable('users', 'old_users')
        `
      }
    ]
  },
  {
    type: "method",
    method: "hasTable",
    example: "knex.schema.hasTable(tableName)",
    description: "Checks for a table's existence by tableName, resolving with a boolean to signal if the table exists.",
    children: [
      {
        type: "code",
        language: "js",
        content: `
          knex.schema.hasTable('users').then(function(exists) {
            if (!exists) {
              return knex.schema.createTable('users', function(t) {
                t.increments('id').primary();
                t.string('first_name', 100);
                t.string('last_name', 100);
                t.text('bio');
              });
            }
          });
        `
      }
    ]
  },
  {
    type: "method",
    method: "hasColumn",
    example: "knex.schema.hasColumn(tableName, columnName)",
    description: "Checks if a column exists in the current table, resolves the promise with a boolean, true if the column exists, false otherwise.",
    children: [    ]
  },
  {
    type: "method",
    method: "table",
    example: "knex.schema.table(tableName, callback)",
    description: "Chooses a database table, and then modifies the table, using the Schema Building functions inside of the callback.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.table('users', function (table) {
            table.dropColumn('name');
            table.string('first_name');
            table.string('last_name');
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "createView",
    example: "knex.schema.createView(tableName, callback)",
    description: "Creates a new view on the database, with a callback function to modify the view's structure, using the schema-building commands.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.createView('users_view', function (view) {
            view.columns(['first_name']);
            view.as(knex('users').select('first_name').where('age','>', '18'));
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "createViewOrReplace",
    example: "knex.schema.createViewOrReplace(tableName, callback)",
    description: "Creates a new view or replace it on the database, with a callback function to modify the view's structure, using the schema-building commands.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.createViewOrReplace('users_view', function (view) {
            view.columns(['first_name']);
            view.as(knex('users').select('first_name').where('age','>', '18'));
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "createMaterializedView",
    example: "knex.schema.createMaterializedView(viewName, callback)",
    description: "Creates a new materialized view on the database, with a callback function to modify the view's structure, using the schema-building commands. Only on PostgreSQL, CockroachDb, Redshift and Oracle.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.createMaterializedView('users_view', function (view) {
            view.columns(['first_name']);
            view.as(knex('users').select('first_name').where('age','>', '18'));
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "refreshMaterializedView",
    example: "knex.schema.refreshMaterializedView(viewName)",
    description: "Refresh materialized view on the database. Only on PostgreSQL, CockroachDb, Redshift and Oracle.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.refreshMaterializedView('users_view')
        `
      }
    ]
  },
  {
    type: "method",
    method: "drowView",
    example: "knex.schema.dropView(viewName)",
    description: "Drop view on the database.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.dropView('users_view')
        `
      }
    ]
  },
  {
    type: "method",
    method: "dropViewIfExists",
    example: "knex.schema.dropViewIfExists(viewName)",
    description: "Drop view on the database if exists.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.dropViewIfExists('users_view')
        `
      }
    ]
  },
  {
    type: "method",
    method: "dropMaterializedView",
    example: "knex.schema.dropMaterializedView(viewName)",
    description: "Drop materialized view on the database. Only on PostgreSQL, CockroachDb, Redshift and Oracle.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.dropMaterializedView('users_view')
        `
      }
    ]
  },
  {
    type: "method",
    method: "dropMaterializedViewIfExists",
    example: "knex.schema.dropMaterializedViewIfExists(viewName)",
    description: "Drop materialized view on the database if exists. Only on PostgreSQL, CockroachDb, Redshift and Oracle.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.dropMaterializedViewIfExists('users_view')
        `
      }
    ]
  },
  {
    type: "method",
    method: "renameView",
    example: "knex.schema.renameView(viewName)",
    description: "Rename a existing view in the database. Not supported by Oracle and SQLite.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.renameView('users_view')
        `
      }
    ]
  },
  {
    type: "method",
    method: "alterView",
    example: "knex.schema.alterView(viewName)",
    description: "Alter view to rename columns or change default values. Only available on PostgreSQL, MSSQL and Redshift.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.alterView('view_test', function (view) {
            view.column('first_name').rename('name_user');
            view.column('bio').defaultTo('empty');
          }
        `
      }
    ]
  },
  {
    type: "method",
    method: "generateDdlCommands",
    example: "knex.schema.generateDdlCommands()",
    description: "Generates complete SQL commands for applying described schema changes, without executing anything. Useful when knex is being used purely as a query builder. Generally produces same result as .toSQL(), with a notable exception with SQLite, which relies on asynchronous calls to the database for building part of its schema modification statements",
    children: [
      {
        type: "runnable",
        content: `
            const ddlCommands = knex.schema.alterTable(
              'users',
              (table) => {
                table
                  .foreign('companyId')
                  .references('company.companyId')
                  .withKeyName('fk_fkey_company');
              }
            ).generateDdlCommands();
        `
      }
    ]
  },
  {
    type: "method",
    method: "raw",
    example: "knex.schema.raw(statement)",
    description: "Run an arbitrary sql query in the schema builder chain.",
    children: [
      {
        type: "runnable",
        content: `
          knex.schema.raw(\"SET sql_mode='TRADITIONAL'\")
            .table('users', function (table) {
              table.dropColumn('name');
              table.string('first_name');
              table.string('last_name');
            })
        `
      }
    ]
  },
  {
    type: "method",
    method: "queryContext",
    example: "knex.schema.queryContext(context)",
    href: "Schema-queryContext",
    description: [
      "Allows configuring a context to be passed to the [wrapIdentifier](#Installation-wrap-identifier) hook.",
      "The context can be any kind of value and will be passed to `wrapIdentifier` without modification."
    ].join(" "),
    children: [
      {
        type: "code",
        language: "js",
        content: `
          knex.schema.queryContext({ foo: 'bar' })
            .table('users', function (table) {
              table.string('first_name');
              table.string('last_name');
            })
        `
      },
      {
        type: "text",
        content: [
          "The context configured will be passed to `wrapIdentifier`",
          "for each identifier that needs to be formatted, including the table and column names.",
          "However, a different context can be set for the column names via [table.queryContext](#Schema-table-queryContext)."
        ].join(" ")
      },
      {
        type: "text",
        content: "Calling `queryContext` with no arguments will return any context configured for the schema builder instance."
      }
    ]
  },
  {
    type: "method",
    method: "dropSchema",
    example: "knex.schema.dropSchema(schemaName, [cascade])",
    description: "Drop a schema, specified by the schema's name, with optional cascade option (default to false). Only supported by PostgreSQL.",
    children: [
      {
        type: 'code',
        language: 'js',
        content: `
          //drop schema 'public'
          knex.schema.dropSchema('public')
          //drop schema 'public' cascade
          knex.schema.dropSchema('public', true)
        `
      }
    ]
  },
  {
    type: "method",
    method: "dropSchemaIfExists",
    example: "knex.schema.dropSchemaIfExists(schemaName, [cascade])",
    description: "Drop a schema conditionally if the schema exists, specified by the schema's name, with optional cascade option (default to false). Only supported by PostgreSQL.",
    children: [
      {
        type: 'code',
        language: 'js',
        content: `
          //drop schema if exists 'public'
          knex.schema.dropSchemaIfExists('public')
          //drop schema if exists 'public' cascade
          knex.schema.dropSchemaIfExists('public', true)
        `
      }
    ]
  },
  {
    type: "heading",
    size: "md",
    content: "Schema Building:",
    href: "Schema-Building"
  },
  {
    type: "method",
    method: "dropColumn",
    example: "table.dropColumn(name)",
    description: "Drops a column, specified by the column's name",
    children: [    ]
  },
  {
    type: "method",
    method: "dropColumns",
    example: "table.dropColumns(*columns)",
    description: "Drops multiple columns, taking a variable number of column names.",
    children: [    ]
  },
  {
    type: "method",
    method: "renameColumn",
    example: "table.renameColumn(from, to)",
    description: "Renames a column from one name to another.",
    children: [    ]
  },
  {
    type: "method",
    method: "increments",
    example: "table.increments(name, options={[primaryKey: boolean = true])",
    description: "Adds an auto incrementing column. In PostgreSQL this is a serial; in Amazon Redshift an integer identity(1,1). This will be used as the primary key for the table. Also available is a bigIncrements if you wish to add a bigint incrementing number (in PostgreSQL bigserial). Note that a primary key is created by default, but you can override this behaviour by passing the `primaryKey` option.",
    children: [
      {
        type: 'code',
        language: 'js',
        content: `
          // create table 'users' with a primary key using 'increments()'
          knex.schema.createTable('users', function (table) {
            table.increments('userId');
            table.string('name');
          });

          // reference the 'users' primary key in new table 'posts'
          knex.schema.createTable('posts', function (table) {
            table.integer('author').unsigned().notNullable();
            table.string('title', 30);
            table.string('content');

            table.foreign('author').references('userId').inTable('users');
          });
        `
      },
      {
        type: 'text',
        content: "A primaryKey option may be passed, to disable to automatic primary key creation:"
      }, {
        type: 'code',
        language: 'js',
        content: `
          // create table 'users' with a primary key using 'increments()'
          //  but also increments field 'other_id' that does not need primary key
          knex.schema.createTable('users', function (table) {
            table.increments('id');
            table.increments('other_id', { primaryKey: false });
          });

        `
      }
    ]
  },
  {
    type: "method",
    method: "integer",
    example: "table.integer(name)",
    description: "Adds an integer column.",
    children: [    ]
  },
  {
    type: "method",
    method: "bigInteger",
    example: "table.bigInteger(name)",
    description: "In MySQL or PostgreSQL, adds a bigint column, otherwise adds a normal integer. Note that bigint data is returned as a string in queries because JavaScript may be unable to parse them without loss of precision.",
    children: [    ]
  },
  {
    type: "method",
    method: "text",
    example: "table.text(name, [textType])",
    description: "Adds a text column, with optional textType for MySql text datatype preference. textType may be mediumtext or longtext, otherwise defaults to text.",
    children: [    ]
  },
  {
    type: "method",
    method: "string",
    example: "table.string(name, [length])",
    description: "Adds a string column, with optional length defaulting to 255.",
    children: [    ]
  },
  {
    type: "method",
    method: "float",
    example: "table.float(column, [precision], [scale])",
    description: "Adds a float column, with optional precision (defaults to 8) and scale (defaults to 2).",
    children: [    ]
  },
  {
    type: "method",
    method: "double",
    example: "table.double(column, [precision], [scale])",
    description: "Adds a double column, with optional precision (defaults to 8) and scale (defaults to 2). In SQLite/MSSQL this is a float with no precision/scale; In PostgreSQL this is a double precision; In Oracle this is a number with matching precision/scale.",
    children: [    ]
  },
  {
    type: "method",
    method: "decimal",
    example: "table.decimal(column, [precision], [scale])",
    description: "Adds a decimal column, with optional precision (defaults to 8) and scale (defaults to 2). Specifying NULL as precision creates a decimal column that can store numbers of any precision and scale. (Only supported for Oracle, SQLite, Postgres)",
    children: [    ]
  },
  {
    type: "method",
    method: "boolean",
    example: "table.boolean(name)",
    description: "Adds a boolean column.",
    children: [    ]
  },
  {
    type: "method",
    method: "date",
    example: "table.date(name)",
    description: "Adds a date column.",
    children: [    ]
  },
  {
    type: "method",
    method: "datetime",
    example: "table.datetime(name, options={[useTz: boolean], [precision: number]})",
    description: "Adds a datetime column. By default PostgreSQL creates column with timezone (timestamptz type). This behaviour can be overriden by passing the useTz option (which is by default true for PostgreSQL). MySQL and MSSQL do not have useTz option.",
    children: [{
      type: 'text',
      content: "A precision option may be passed:"
    }, {
      type: 'code',
      language: 'js',
      content: `table.datetime('some_time', { precision: 6 }).defaultTo(knex.fn.now(6))`
    }]
  },
  {
    type: "method",
    method: "time",
    example: "table.time(name, [precision])",
    description: "Adds a time column, with optional precision for MySQL. Not supported on Amazon Redshift.",
    children: [{
      type: 'text',
      content: "In MySQL a precision option may be passed:"
    }, {
      type: 'code',
      language: 'js',
      content: `table.time('some_time', { precision: 6 })`
    }]
  },
  {
    type: "method",
    method: "timestamp",
    example: "table.timestamp(name, options={[useTz: boolean], [precision: number]})",
    description: "Adds a timestamp column. By default PostgreSQL creates column with timezone (timestamptz type) and MSSQL does not (datetime2). This behaviour can be overriden by passing the useTz option (which is by default false for MSSQL and true for PostgreSQL). MySQL does not have useTz option.",
    children: [{
      type: 'code',
      language: 'js',
      content: `table.timestamp('created_at').defaultTo(knex.fn.now());`
    }, {
      type: 'text',
      content: "In PostgreSQL and MySQL a precision option may be passed:"
    }, {
      type: 'code',
      language: 'js',
      content: `table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));`
    }, {
      type: 'text',
      content: "In PostgreSQL and MSSQL a timezone option may be passed:"
    }, {
      type: 'code',
      language: 'js',
      content: `table.timestamp('created_at', { useTz: true });`
    }]
  },
  {
    type: "method",
    method: "timestamps",
    example: "table.timestamps([useTimestamps], [defaultToNow], [useCamelCase])",
    description: "Adds created_at and updated_at columns on the database, setting each to datetime types. When true is passed as the first argument a timestamp type is used instead. Both columns default to being not null and using the current timestamp when true is passed as the second argument. Note that on MySQL the .timestamps() only have seconds precision, to get better precision use the .datetime or .timestamp methods directly with precision. If useCamelCase is true, the name of columns are createdAt and updatedAt.",
    children: [    ]
  },
  {
    type: "method",
    method: "dropTimestamps",
    example: "table.dropTimestamps([useCamelCase])",
    description: "Drops the columns created_at and updated_at from the table, which can be created via timestamps. If useCamelCase is true, the name of columns are createdAt and updatedAt.",
    children: [    ]
  },
  {
    type: "method",
    method: "binary",
    example: "table.binary(name, [length])",
    description: "Adds a binary column, with optional length argument for MySQL.",
    children: [    ]
  },
  {
    type: "method",
    href: "Schema-enum",
    method: "enum / enu",
    example: "table.enu(col, values, [options])",
    description: "Adds a enum column, (aliased to enu, as enum is a reserved word in JavaScript). Implemented as unchecked varchar(255) on Amazon Redshift. Note that the second argument is an array of values. Example:",
    children: [{
      type: 'code',
      language: 'js',
      content: `table.enu('column', ['value1', 'value2'])`
    }, {
      type: 'text',
      content: "For Postgres, an additional options argument can be provided to specify whether or not to use Postgres's native TYPE:"
    }, {
      type: 'code',
      language: 'js',
      content: `table.enu('column', ['value1', 'value2'], { useNative: true, enumName: 'foo_type' })`
    }, {
      type: 'text',
      content: "It will use the values provided to generate the appropriate TYPE. Example:"
    }, {
      type: 'code',
      language: 'sql',
      content: `CREATE TYPE "foo_type" AS ENUM ('value1', 'value2');`
    }, {
      type: 'text',
      content: "To use an existing native type across columns, specify 'existingType' in the options (this assumes the type has already been created):",
    }, {
      type: 'info',
      content: "Note: Since the enum values aren't utilized for a native && existing type, the type being passed in for values is immaterial."
    }, {
      type: 'code',
      language: 'js',
      content: `table.enu('column', null, { useNative: true, existingType: true, enumName: 'foo_type' })`
    }, {
      type: 'text',
      content: "If you want to use existing enums from a schema, different from the schema of your current table, specify 'schemaName' in the options:"
    }, {
      type: 'code',
      language: 'js',
      content: `table.enu('column', null, { useNative: true, existingType: true, enumName: 'foo_type', schemaName: 'public' })`
    }, {
      type: 'text',
      language: 'js',
      content: `Knex does not provide any way to alter enumerations after creation. To change an enumeration later on you must use Knex.raw, and the appropriate command for your database.`
    }
    ]
  },
  {
    type: "method",
    method: "json",
    example: "table.json(name)",
    children: [{
      type: 'text',
      content: `Adds a json column, using the built-in json type in PostgreSQL, MySQL and SQLite, defaulting to a text column in older versions or in unsupported databases.`
    }, {
      type: 'text',
      content: `For PostgreSQL, due to incompatibility between native array and json types, when setting an array (or a value that could be an array) as the value of a json or jsonb column, you should use JSON.stringify() to convert your value to a string prior to passing it to the query builder, e.g.`
    }, {
      type: 'code',
      language: 'js',
      content: `
        knex.table('users')
          .where({id: 1})
          .update({json_data: JSON.stringify(mightBeAnArray)});
      `
    }
    ]
  },
  {
    type: "method",
    method: "jsonb",
    example: "table.jsonb(name)",
    description: "Adds a jsonb column. Works similar to table.json(), but uses native jsonb type if possible.",
    children: [    ]
  },
  {
    type: "method",
    method: "uuid",
    example: "table.uuid(name, options=({[useBinaryUuid:boolean]})",
    description: "Adds a uuid column - this uses the built-in uuid type in PostgreSQL, and falling back to a char(36) in other databases by default. If useBinaryUuid is true, binary(16) is used. See uuidToBin function to convert uuid in binary before inserting and binToUuid to convert binary uuid to uuid.",
    children: [    ]
  },
  {
    type: "method",
    method: "geometry",
    example: "table.geometry(name)",
    description: "Adds a geometry column. Supported by SQLite, MSSQL and PostgreSQL.",
    children: [
      {
        type: 'code',
        language: 'js',
        content: `
          knex.schema.createTable(tblName, (table) => {
            table.geometry('geometryColumn');
          });
          `
      }
    ]
  },
  {
    type: "method",
    method: "geography",
    example: "table.geography(name)",
    description: "Adds a geography column. Supported by SQLite, MSSQL and PostgreSQL (in PostGIS extension).",
    children: [
      {
        type: 'code',
        language: 'js',
        content: `
          knex.schema.createTable(tblName, (table) => {
            table.geography('geographyColumn');
          });
          `
      }
    ]
  },
  {
    type: "method",
    method: "point",
    example: "table.point(name)",
    description: "Add a point column. Not supported by CockroachDB and MSSQL.",
    children: [
      {
        type: 'code',
        language: 'js',
        content: `
          knex.schema.createTable(tblName, (table) => {
            table.point('pointColumn');
          });
          `
      }
    ]
  },
  {
    type: "method",
    method: "comment",
    example: "table.comment(value)",
    description: "Sets the comment for a table.",
    children: [    ]
  },
  {
    type: "method",
    method: "engine",
    example: "table.engine(val)",
    description: "Sets the engine for the database table, only available within a createTable call, and only applicable to MySQL.",
    children: [    ]
  },
  {
    type: "method",
    method: "charset",
    example: "table.charset(val)",
    description: "Sets the charset for the database table, only available within a createTable call, and only applicable to MySQL.",
    children: [    ]
  },
  {
    type: "method",
    method: "collate",
    example: "table.collate(val)",
    description: "Sets the collation for the database table, only available within a createTable call, and only applicable to MySQL.",
    children: [    ]
  },
  {
    type: "method",
    method: "inherits",
    example: "table.inherits(val)",
    description: "Sets the tables that this table inherits, only available within a createTable call, and only applicable to PostgreSQL.",
    children: [    ]
  },
  {
    type: "method",
    method: "specificType",
    example: "table.specificType(name, type)",
    description: "Sets a specific type for the column creation, if you'd like to add a column type that isn't supported here.",
    children: [    ]
  },
  {
    type: "method",
    method: "index",
    example: "table.index(columns, [indexName], options=({[indexType: string], [storageEngineIndexType: 'btree'|'hash'], [predicate: QueryBuilder]}))",
    description: "Adds an index to a table over the given columns. A default index name using the columns is used unless indexName is specified. In MySQL, the storage engine index type may be 'btree' or 'hash' index types, more info in Index Options section : https://dev.mysql.com/doc/refman/8.0/en/create-index.html. The indexType can be optionally specified for PostgreSQL and MySQL. Amazon Redshift does not allow creating an index. In PostgreSQL, SQLite and MSSQL a partial index can be specified by setting a 'where' predicate.",
    children: [
      {
        type: 'code',
        language: 'js',
        content: `
          knex.table('users', function (table) {
            table.index(['name', 'last_name'], 'idx_name_last_name', {
              indexType: 'FULLTEXT',
              storageEngineIndexType: 'hash',
              predicate: knex.whereNotNull('email'),
            });
          });
        `
      }
    ]
  },
  {
    type: "method",
    method: "dropIndex",
    example: "table.dropIndex(columns, [indexName])",
    description: "Drops an index from a table. A default index name using the columns is used unless indexName is specified (in which case columns is ignored). Amazon Redshift does not allow creating an index.",
    children: [    ]
  },
  {
    type: "method",
    method: "setNullable",
    example: "table.setNullable(column)",
    description: "Makes table column nullable.",
    children: [    ]
  },
  {
    type: "method",
    method: "dropNullable",
    example: "table.dropNullable(column)",
    description: "Makes table column not nullable. Note that this operation will fail if there are already null values in this column.",
    children: [    ]
  },
  {
    type: "method",
    method: "primary",
    href:"Schema-table-primary",
    example: "table.primary(columns, options=({[constraintName:string],[deferrable:'not deferrable'|'deferred'|'immediate']})",
    description: "Create a primary key constraint on table using input `columns`. If you need to create a composite primary key, pass an array of columns to `columns`. Constraint name defaults to `tablename_pkey` unless `constraintName` is specified. On Amazon Redshift, all columns included in a primary key must be not nullable. Deferrable primary constraint are supported on Postgres and Oracle and can be set by passing deferrable option to options object.",
    children: [
      {
        type: 'code',
        language: 'js',
        content: `
          knex.schema.alterTable('users', function(t) {
            t.unique('email')
          })
          knex.schema.alterTable('job', function(t) {
            t.primary('email',{constraintName:'users_primary_key',deferrable:'deferred'})
          })
        `
      },
      {
        type: "info",
        content: "Note: If you want to chain primary() while creating new column you can use <a href='#Schema-column-primary'>primary</a>"
      }
    ]
  },
  {
    type: "method",
    method: "unique",
    href:"Schema-table-unique",
    example: "table.unique(columns, options={[indexName: string], [deferrable:'not deferrable'|'immediate'|'deferred'], [storageEngineIndexType:'btree'|'hash']})",
    description: "Adds an unique index to a table over the given `columns`. In MySQL, the storage engine index type may be 'btree' or 'hash' index types, more info in Index Options section : https://dev.mysql.com/doc/refman/8.0/en/create-index.html. A default index name using the columns is used unless indexName is specified. If you need to create a composite index, pass an array of column to `columns`. Deferrable unique constraint are supported on Postgres and Oracle and can be set by passing deferrable option to options object.",
    children: [
      {
        type: 'code',
        language: 'js',
        content: `
          knex.schema.alterTable('users', function(t) {
            t.unique('email')
          })
          knex.schema.alterTable('job', function(t) {
            t.unique(['account_id', 'program_id'], {indexName: 'users_composite_index', deferrable:'deferred', storageEngineIndexType: 'hash'})
          })
        `
      },
      {
        type: "info",
        content: "Note: If you want to chain unique() while creating new column you can use <a href='#Schema-column-unique'>unique</a>"
      }
    ]
  },
  {
    type: "method",
    method: "foreign",
    example: "table.foreign(columns, [foreignKeyName])[.onDelete(statement).onUpdate(statement).withKeyName(foreignKeyName).deferrable(type)]",
    description: "Adds a foreign key constraint to a table for an existing column using `table.foreign(column).references(column)` or multiple columns using `table.foreign(columns).references(columns).inTable(table)`.",
    children: [
      {
        type: "text",
        content: [
          "A default key name using the columns is used unless `foreignKeyName` is specified.",
          "You can also chain `onDelete()` and/or `onUpdate()` to set the reference option `(RESTRICT, CASCADE, SET NULL, NO ACTION)` for the operation. You can also chain `withKeyName()` to override default key name that is generated from table and column names (result is identical to specifying second parameter to function `foreign()`).",
          "Deferrable foreign constraint is supported on Postgres and Oracle and can be set by chaining `.deferrable(type)`",
          "Note that using `foreign()` is the same as `column.references(column)` but it works for existing columns."
        ]
      },
      {
        type: 'code',
        language: 'js',
        content: `
          knex.schema.table('users', function (table) {
            table.integer('user_id').unsigned()
            table.foreign('user_id').references('Items.user_id_in_items').deferrable('deferred')
          })`
      }
    ]
  },
  {
    type: "method",
    method: "dropForeign",
    example: "table.dropForeign(columns, [foreignKeyName])",
    description: "Drops a foreign key constraint from a table. A default foreign key name using the columns is used unless foreignKeyName is specified (in which case columns is ignored).",
    children: [    ]
  },
  {
    type: "method",
    method: "dropUnique",
    example: "table.dropUnique(columns, [indexName])",
    description: "Drops a unique key constraint from a table. A default unique key name using the columns is used unless indexName is specified (in which case columns is ignored).",
    children: [    ]
  },
  {
    type: "method",
    method: "dropPrimary",
    example: "table.dropPrimary([constraintName])",
    description: "Drops the primary key constraint on a table. Defaults to tablename_pkey unless constraintName is specified.",
    children: [    ]
  },
  {
    type: "method",
    method: "queryContext",
    example: "table.queryContext(context)",
    href: "Schema-table-queryContext",
    description: [
      "Allows configuring a context to be passed to the [wrapIdentifier](#Installation-wrap-identifier) hook for formatting table builder identifiers.",
      "The context can be any kind of value and will be passed to `wrapIdentifier` without modification."
    ].join(" "),
    children: [
      {
        type: "code",
        language: "js",
        content: `
          knex.schema.table('users', function (table) {
            table.queryContext({ foo: 'bar' });
            table.string('first_name');
            table.string('last_name');
          })
        `
      },
      {
        type: "text",
        content: "This method also enables overwriting the context configured for a schema builder instance via [schema.queryContext](#Schema-queryContext):"
      },
      {
        type: "code",
        language: "js",
        content: `
          knex.schema.queryContext('schema context')
            .table('users', function (table) {
              table.queryContext('table context');
              table.string('first_name');
              table.string('last_name');
          })
        `
      },
      {
        type: "text",
        content: "Note that it's also possible to overwrite the table builder context for any column in the table definition:"
      },
      {
        type: "code",
        language: "js",
        content: `
          knex.schema.queryContext('schema context')
            .table('users', function (table) {
              table.queryContext('table context');
              table.string('first_name').queryContext('first_name context');
              table.string('last_name').queryContext('last_name context');
          })
        `
      },
      {
        type: "text",
        content: "Calling `queryContext` with no arguments will return any context configured for the table builder instance."
      }
    ]
  },
  {
    type: "heading",
    size: "md",
    content: "Chainable Methods:",
    href: "Chainable"
  },
  {
    type: "text",
    content: "The following three methods may be chained on the schema building methods, as modifiers to the column."
  },
  {
    type: "method",
    method: "alter",
    example: "column.alter()",
    description: 'Marks the column as an alter / modify, instead of the default add. Note: This only works in .alterTable() and is not supported by SQlite or Amazon Redshift. Alter is *not* done incrementally over older column type so if you like to add `notNullable` and keep the old default value, the alter statement must contain both `.notNullable().defaultTo(1).alter()`. If one just tries to add `.notNullable().alter()` the old default value will be dropped.',
    children: [    ]
  },
  {
    type: "code",
    content: `
      knex.schema.alterTable('user', function(t) {
        t.increments().primary(); // add
        // drops previous default value from column, change type to string and add not nullable constraint
        t.string('username', 35).notNullable().alter();
        // drops both not null constraint and the default value
        t.integer('age').alter();
      });
    `
  },
  {
    type: "method",
    method: "index",
    example: "column.index([indexName], options=({[indexType: string], [storageEngineIndexType: 'btree'|'hash'], [predicate: QueryBuilder]}))",
    description: "Specifies a field as an index. If an indexName is specified, it is used in place of the standard index naming convention of tableName_columnName. In MySQL, the storage engine index type may be 'btree' or 'hash' index types, more info in Index Options section : https://dev.mysql.com/doc/refman/8.0/en/create-index.html. The indexType can be optionally specified for PostgreSQL and MySQL. No-op if this is chained off of a field that cannot be indexed. In PostgreSQL, SQLite and MSSQL a partial index can be specified by setting a 'where' predicate.",
    children: [    ]
  },
  {
    type: "method",
    method: "primary",
    href:"Schema-column-primary",
    example: "column.primary(options=({[constraintName:string],[deferrable:'not deferrable'|'deferred'|'immediate']}));",
    description: "Sets a primary key constraint on `column`. Constraint name defaults to `tablename_pkey` unless `constraintName` is specified. On Amazon Redshift, all columns included in a primary key must be not nullable. Deferrable primary constraint are supported on Postgres and Oracle and can be set by passing deferrable option to options object.",
    children: [
      {
        type: 'code',
        language: 'js',
        content: `
        knex.schema.table('users', function (table) {
          table.integer('user_id').primary('email',{constraintName:'users_primary_key',deferrable:'deferred'})
        })
        `
      },
      {
        type: "info",
        content: "Note: If you want to create primary constraint on existing column use <a href='#Schema-table-primary'>primary</a>"
      }
    ]
  },
  {
    type: "method",
    method: "unique",
    href:"Schema-column-unique",
    example: "column.unique(options={[indexName:string],[deferrable:'not deferrable'|'immediate'|'deferred']})",
    description: "Sets the `column` as unique. On Amazon Redshift, this constraint is not enforced, but it is used by the query planner. Deferrable unqiue constraint are supported on Postgres and Oracle and can be set by passing deferrable option to options object.",
    children: [
      {
        type: 'code',
        language: 'js',
        content: `
        knex.schema.table('users', function (table) {
          table.integer('user_id').unique({indexName:'user_unqiue_id', deferrable:'immediate'})
        })
        `
      },
      {
        type: "info",
        content: "Note: If you want to create unique constraint on existing column use <a href='#Schema-table-unique'>unique</a>"
      }
    ]
  },
  {
    type: "method",
    method: "references",
    example: "column.references(column)",
    description: "Sets the \"column\" that the current column references as a foreign key. \"column\" can either be \".<column>\" syntax, or just the column name followed up with a call to inTable to specify the table.</column>\n\n<table></table>",
    children: [    ]
  },
  {
    type: "method",
    method: "inTable",
    example: "column.inTable(table)",
    description: "Sets the \"table\" where the foreign key column is located after calling column.references.",
    children: [    ]
  },
  {
    type: "method",
    method: "onDelete",
    example: "column.onDelete(command)",
    description: "Sets the SQL command to be run \"onDelete\".",
    children: [    ]
  },
  {
    type: "method",
    method: "onUpdate",
    example: "column.onUpdate(command)",
    description: "Sets the SQL command to be run \"onUpdate\".",
    children: [    ]
  },
  {
    type: "method",
    method: "defaultTo",
    example: "column.defaultTo(value, options={[constraintName: string = undefined]))",
    description: "Sets the default value for the column on an insert.",
    children: [{
      type: 'text',
      content: "In MSSQL a constraintName option may be passed to ensure a specific constraint name:"
    }, {
      type: 'code',
      language: 'js',
      content: `column.defaultTo('value', { constraintName: 'df_table_value' });`
    }]
  },
  {
    type: "method",
    method: "unsigned",
    example: "column.unsigned()",
    description: "Specifies an integer as unsigned. No-op if this is chained off of a non-integer field.",
    children: [    ]
  },
  {
    type: "method",
    method: "notNullable",
    example: "column.notNullable()",
    description: "Adds a not null on the current column being created.",
    children: [    ]
  },
  {
    type: "method",
    method: "nullable",
    example: "column.nullable()",
    description: "Default on column creation, this explicitly sets a field to be nullable.",
    children: [    ]
  },
  {
    type: "method",
    method: "first",
    example: "column.first()",
    description: "Sets the column to be inserted on the first position, only used in MySQL alter tables.",
    children: [    ]
  },
  {
    type: "method",
    method: "after",
    example: "column.after(field)",
    description: "Sets the column to be inserted after another, only used in MySQL alter tables.",
    children: [    ]
  },
  {
    type: "method",
    method: "comment",
    example: "column.comment(value)",
    description: "Sets the comment for a column.",
    href: "Column-comment",
    children: [    ]
  },
  {
    type: "code",
    content: `
      knex.schema.createTable('accounts', function(t) {
        t.increments().primary();
        t.string('email').unique().comment('This is the email field');
      });
    `
  },
  {
    type: "method",
    method: "collate",
    example: "column.collate(collation)",
    description: "Sets the collation for a column (only works in MySQL). Here is a list of all available collations: https://dev.mysql.com/doc/refman/5.5/en/charset-charsets.html",
    href: "Column-collate",
    children: [    ]
  },
  {
    type: "code",
    content: `
      knex.schema.createTable('users', function(t) {
        t.increments();
        t.string('email').unique().collate('utf8_unicode_ci');
      });
    `
  },
  {
    type: "heading",
    size: "md",
    content: "View:",
    href: "View"
  },
  {
    type: "method",
    method: "columns",
    example: "view.columns([columnNames])",
    description: "Specify the columns of the view.",
    children: [
      {
        type: "code",
        language: "js",
        content: `
          knex.schema.createView('users_view', function (view) {
            view.columns(['first_name', 'last_name']);
            view.as(knex('users').select('first_name').where('age','>', '18'));
          });
        `
      }
    ]
  },
  {
    type: "method",
    method: "as",
    example: "view.as(selectQuery)",
    description: "Specify the select query of the view.",
    children: [ ]
  },
  {
    type: "method",
    method: "checkOption",
    example: "view.checkOption()",
    description: "Add check option on the view definition. On OracleDb, MySQL, PostgreSQL and Redshift.",
    children: [ ]
  },
  {
    type: "method",
    method: "localCheckOption",
    example: "view.localCheckOption()",
    description: "Add local check option on the view definition. On MySQL, PostgreSQL and Redshift.",
    children: [ ]
  },
  {
    type: "method",
    method: "cascadedCheckOption",
    example: "view.cascadedCheckOption()",
    description: "Add cascaded check option on the view definition. On MySQL, PostgreSQL and Redshift.",
    children: [ ]
  }
]
