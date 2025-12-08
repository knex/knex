# Schema Builder

The `knex.schema` is a **getter function**, which returns a stateful object containing the query. Therefore be sure to obtain a new instance of the `knex.schema` for every query. These methods return [promises](/guide/interfaces.html#promises).

## Essentials

### withSchema

**knex.schema.withSchema([schemaName])**

Specifies the schema to be used when using the schema-building commands.

```js
knex.schema.withSchema('public').createTable('users', function (table) {
  table.increments();
});
```

### createTable

**knex.schema.createTable(tableName, callback)**

Creates a new table on the database, with a callback function to modify the table's structure, using the schema-building commands.

```js
knex.schema.createTable('users', function (table) {
  table.increments();
  table.string('name');
  table.timestamps();
});
```

### createTableLike

**knex.schema.createTableLike(tableName, tableNameToCopy, [callback])**

Creates a new table on the database based on another table. Copy only the structure : columns, keys and indexes (expected on SQL Server which only copy columns) and not the data. Callback function can be specified to add columns in the duplicated table.

```js
knex.schema.createTableLike('new_users', 'users');

// "new_users" table contains columns
// of users and two new columns 'age' and 'last_name'.
knex.schema.createTableLike('new_users', 'users', (table) => {
  table.integer('age');
  table.string('last_name');
});
```

### dropTable

**knex.schema.dropTable(tableName)**

Drops a table, specified by tableName.

```js
knex.schema.dropTable('users');
```

### dropTableIfExists

**knex.schema.dropTableIfExists(tableName)**

Drops a table conditionally if the table exists, specified by tableName.

```js
knex.schema.dropTableIfExists('users');
```

### renameTable

**knex.schema.renameTable(from, to)**

Renames a table from a current tableName to another.

```js
knex.schema.renameTable('old_users', 'users');
```

### hasTable

**knex.schema.hasTable(tableName)**

Checks for a table's existence by tableName, resolving with a boolean to signal if the table exists.

```js
knex.schema.hasTable('users').then(function (exists) {
  if (!exists) {
    return knex.schema.createTable('users', function (t) {
      t.increments('id').primary();
      t.string('first_name', 100);
      t.string('last_name', 100);
      t.text('bio');
    });
  }
});
```

### hasColumn

**knex.schema.hasColumn(tableName, columnName)**

Checks if a column exists in the current table, resolves the promise with a boolean, true if the column exists, false otherwise.

### table

**knex.schema.table(tableName, callback)**

Chooses a database table, and then modifies the table, using the Schema Building functions inside of the callback.

```js
knex.schema.table('users', function (table) {
  table.dropColumn('name');
  table.string('first_name');
  table.string('last_name');
});
```

### alterTable

**knex.schema.alterTable(tableName, callback)**

Chooses a database table, and then modifies the table, using the Schema Building functions inside of the callback.

```js
knex.schema.alterTable('users', function (table) {
  table.dropColumn('name');
  table.string('first_name');
  table.string('last_name');
});
```

### createView

**knex.schema.createView(tableName, callback)**

Creates a new view on the database, with a callback function to modify the view's structure, using the schema-building commands.

```js
knex.schema.createView('users_view', function (view) {
  view.columns(['first_name']);
  view.as(knex('users').select('first_name').where('age', '>', '18'));
});
```

### createViewOrReplace

**knex.schema.createViewOrReplace(tableName, callback)**

Creates a new view or replace it on the database, with a callback function to modify the view's structure, using the schema-building commands. You need to specify at least the same columns in same order (you can add extra columns). In SQLite, this function generate drop/create view queries (view columns can be different).

```js
knex.schema.createViewOrReplace('users_view', function (view) {
  view.columns(['first_name']);
  view.as(knex('users').select('first_name').where('age', '>', '18'));
});
```

### createMaterializedView

**knex.schema.createMaterializedView(viewName, callback)**

Creates a new materialized view on the database, with a callback function to modify the view's structure, using the schema-building commands. Only on PostgreSQL, CockroachDb, Redshift and Oracle.

```js
knex.schema.createMaterializedView('users_view', function (view) {
  view.columns(['first_name']);
  view.as(knex('users').select('first_name').where('age', '>', '18'));
});
```

### refreshMaterializedView

**knex.schema.refreshMaterializedView(viewName)**

Refresh materialized view on the database. Only on PostgreSQL, CockroachDb, Redshift and Oracle.

```js
knex.schema.refreshMaterializedView('users_view');
```

### dropView

**knex.schema.dropView(viewName)**

Drop view on the database.

```js
knex.schema.dropView('users_view');
```

### dropViewIfExists

**knex.schema.dropViewIfExists(viewName)**

Drop view on the database if exists.

```js
knex.schema.dropViewIfExists('users_view');
```

### dropMaterializedView

**knex.schema.dropMaterializedView(viewName)**

Drop materialized view on the database. Only on PostgreSQL, CockroachDb, Redshift and Oracle.

```js
knex.schema.dropMaterializedView('users_view');
```

### dropMaterializedViewIfExists

**knex.schema.dropMaterializedViewIfExists(viewName)**

Drop materialized view on the database if exists. Only on PostgreSQL, CockroachDb, Redshift and Oracle.

```js
knex.schema.dropMaterializedViewIfExists('users_view');
```

### renameView

**knex.schema.renameView(viewName)**

Rename a existing view in the database. Not supported by Oracle and SQLite.

```js
knex.schema.renameView('users_view');
```

### alterView

**knex.schema.alterView(viewName)**

Alter view to rename columns or change default values. Only available on PostgreSQL, MSSQL and Redshift.

```js
knex.schema.alterView('view_test', function (view) {
  view.column('first_name').rename('name_user');
  view.column('bio').defaultTo('empty');
});
```

### generateDdlCommands

**knex.schema.generateDdlCommands()**

Generates complete SQL commands for applying described schema changes, without executing anything. Useful when knex is being used purely as a query builder. Generally produces same result as .toSQL(), with a notable exception with SQLite, which relies on asynchronous calls to the database for building part of its schema modification statements

```js
const ddlCommands = knex.schema
  .alterTable('users', (table) => {
    table
      .foreign('companyId')
      .references('company.companyId')
      .withKeyName('fk_fkey_company');
  })
  .generateDdlCommands();
```

### raw

**knex.schema.raw(statement)**

Run an arbitrary sql query in the schema builder chain.

```js
knex.schema.raw("SET sql_mode='TRADITIONAL'").table('users', function (table) {
  table.dropColumn('name');
  table.string('first_name');
  table.string('last_name');
});
```

### queryContext

**knex.schema.queryContext(context)**

Allows configuring a context to be passed to the [wrapIdentifier](/guide/#wrapidentifier) hook. The context can be any kind of value and will be passed to `wrapIdentifier` without modification.

```js
knex.schema.queryContext({ foo: 'bar' }).table('users', function (table) {
  table.string('first_name');
  table.string('last_name');
});
```

The context configured will be passed to `wrapIdentifier` for each identifier that needs to be formatted, including the table and column names. However, a different context can be set for the column names via [table.queryContext](/guide/query-builder#querycontext).

Calling `queryContext` with no arguments will return any context configured for the schema builder instance.

### dropSchema

**knex.schema.dropSchema(schemaName, [cascade])**

Drop a schema, specified by the schema's name, with optional cascade option (default to false). Only supported by PostgreSQL.

```js
//drop schema 'public'
knex.schema.dropSchema('public');
//drop schema 'public' cascade
knex.schema.dropSchema('public', true);
```

### dropSchemaIfExists

**knex.schema.dropSchemaIfExists(schemaName, [cascade])**

Drop a schema conditionally if the schema exists, specified by the schema's name, with optional cascade option (default to false). Only supported by PostgreSQL.

```js
//drop schema if exists 'public'
knex.schema.dropSchemaIfExists('public');
//drop schema if exists 'public' cascade
knex.schema.dropSchemaIfExists('public', true);
```

## Schema Building

### dropColumn

**table.dropColumn(name)**

Drops a column, specified by the column's name

### dropColumns

**table.dropColumns(columns)**

Drops multiple columns, taking a variable number of column names.

### renameColumn

**table.renameColumn(from, to)**

Renames a column from one name to another.

### increments

**table.increments(name, options={[primaryKey: boolean = true])**

Adds an auto incrementing column. In PostgreSQL this is a serial; in Amazon Redshift an integer identity(1,1). This will be used as the primary key for the table if the column isn't in another primary key. Also available is a bigIncrements if you wish to add a bigint incrementing number (in PostgreSQL bigserial). Note that a primary key is created by default if the column isn't in primary key (with primary function), but you can override this behaviour by passing the `primaryKey` option. If you use this function with primary function, the column is added to the composite primary key. With SQLite, autoincrement column need to be a primary key, so if primary function is used, primary keys are transformed in unique index. MySQL don't support autoincrement column without primary key, so multiple queries are generated to create int column, add increments column to composite primary key then modify the column to autoincrement column.

```js
// create table 'users'
// with a primary key using 'increments()'
knex.schema.createTable('users', function (table) {
  table.increments('userId');
  table.string('name');
});

// create table 'users'
// with a composite primary key ('userId', 'name').
// increments doesn't generate primary key.
knex.schema.createTable('users', function (table) {
  table.primary(['userId', 'name']);
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
```

A primaryKey option may be passed, to disable to automatic primary key creation:

```js
// create table 'users'
// with a primary key using 'increments()'
// but also increments field 'other_id'
// that does not need primary key
knex.schema.createTable('users', function (table) {
  table.increments('id');
  table.increments('other_id', { primaryKey: false });
});
```

### integer

**table.integer(name, length)**

Adds an integer column. On PostgreSQL you cannot adjust the length, you need to use other option such as bigInteger, etc

### bigInteger

**table.bigInteger(name)**

In MySQL or PostgreSQL, adds a bigint column, otherwise adds a normal integer. Note that bigint data is returned as a string in queries because JavaScript may be unable to parse them without loss of precision.

### tinyint

**table.tinyint(name, length)**

Adds a tinyint column

### smallint

**table.smallint(name)**

Adds a smallint column

### mediumint

**table.mediumint(name)**

Adds a mediumint column

### bigint

**table.bigint(name)**

Adds a bigint column

### text

**table.text(name, [textType])**

Adds a text column, with optional textType for MySql text datatype preference. textType may be mediumtext or longtext, otherwise defaults to text.

### string

**table.string(name, [length])**

Adds a string column, with optional length defaulting to 255.

### float

**table.float(column, [precision], [scale])**

Adds a float column, with optional precision (defaults to 8) and scale (defaults to 2).

### double

**table.double(column, [precision], [scale])**

Adds a double column, with optional precision (defaults to 8) and scale (defaults to 2). In SQLite/MSSQL this is a float with no precision/scale; In PostgreSQL this is a double precision; In Oracle this is a number with matching precision/scale.

### decimal

**table.decimal(column, [precision], [scale])**

Adds a decimal column, with optional precision (defaults to 8) and scale (defaults to 2). Specifying NULL as precision creates a decimal column that can store numbers of any precision and scale. (Only supported for Oracle, SQLite, Postgres)

### boolean

**table.boolean(name)**

Adds a boolean column.

### date

**table.date(name)**

Adds a date column.

### datetime

**table.datetime(name, options={[useTz: boolean], [precision: number]})**

Adds a datetime column. By default PostgreSQL creates column with timezone (timestamptz type). This behaviour can be overriden by passing the useTz option (which is by default true for PostgreSQL). MySQL and MSSQL do not have useTz option.

A precision option may be passed:

```js
table.datetime('some_time', { precision: 6 }).defaultTo(knex.fn.now(6));
```

### time

**table.time(name, [precision])**

Adds a time column, with optional precision for MySQL. Not supported on Amazon Redshift.

In MySQL a precision option may be passed:

```js
table.time('some_time', { precision: 6 });
```

### timestamp

**table.timestamp(name, options={[useTz: boolean], [precision: number]})**

Adds a timestamp column. By default PostgreSQL creates column with timezone (timestamptz type) and MSSQL does not (datetime2). This behaviour can be overriden by passing the useTz option (which is by default false for MSSQL and true for PostgreSQL). MySQL does not have useTz option.

```js
table.timestamp('created_at').defaultTo(knex.fn.now());
```

In PostgreSQL and MySQL a precision option may be passed:

```js
table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));
```

In PostgreSQL and MSSQL a timezone option may be passed:

```js
table.timestamp('created_at', { useTz: true });
```

### timestamps

**table.timestamps([useTimestamps], [defaultToNow], [useCamelCase])**

Adds created_at and updated_at columns on the database, setting each to datetime types. When true is passed as the first argument a timestamp type is used instead. Both columns default to being not null and using the current timestamp when true is passed as the second argument. Note that on MySQL the .timestamps() only have seconds precision, to get better precision use the .datetime or .timestamp methods directly with precision. If useCamelCase is true, the name of columns are createdAt and updatedAt.

::: info
PostgreSQL `updated_at` field will not automatically be updated. Please see this [issue](https://github.com/knex/knex/issues/1928 'issue') for details
:::

### dropTimestamps

**table.dropTimestamps([useCamelCase])**

Drops the columns created_at and updated_at from the table, which can be created via timestamps. If useCamelCase is true, the name of columns are createdAt and updatedAt.

### binary

**table.binary(name, [length])**

Adds a binary column, with optional length argument for MySQL.

### enum / enu

**table.enu(col, values, [options])**

Adds a enum column, (aliased to enu, as enum is a reserved word in JavaScript). Implemented as unchecked varchar(255) on Amazon Redshift. Note that the second argument is an array of values. Example:

```js
table.enu('column', ['value1', 'value2']);
```

For Postgres, an additional options argument can be provided to specify whether or not to use Postgres's native TYPE:

```js
table.enu('column', ['value1', 'value2'], {
  useNative: true,
  enumName: 'foo_type',
});
```

It will use the values provided to generate the appropriate TYPE. Example:

```sql
CREATE TYPE "foo_type" AS ENUM ('value1', 'value2');
```

To use an existing native type across columns, specify 'existingType' in the options (this assumes the type has already been created):

::: info
Since the enum values aren't utilized for a native && existing type, the type being passed in for values is immaterial.
:::

```js
table.enu('column', null, {
  useNative: true,
  existingType: true,
  enumName: 'foo_type',
});
```

If you want to use existing enums from a schema, different from the schema of your current table, specify 'schemaName' in the options:

```js
table.enu('column', null, {
  useNative: true,
  existingType: true,
  enumName: 'foo_type',
  schemaName: 'public',
});
```

Knex does not provide any way to alter enumerations after creation. To change an enumeration later on you must use Knex.raw, and the appropriate command for your database.

### json

**table.json(name)**

Adds a json column, using the built-in json type in PostgreSQL, MySQL and SQLite, defaulting to a text column in older versions or in unsupported databases.

For PostgreSQL, due to incompatibility between native array and json types, when setting an array (or a value that could be an array) as the value of a json or jsonb column, you should use JSON.stringify() to convert your value to a string prior to passing it to the query builder, e.g.

```js
knex
  .table('users')
  .where({ id: 1 })
  .update({ json_data: JSON.stringify(mightBeAnArray) });
```

### jsonb

**table.jsonb(name)**

Adds a jsonb column. Works similar to table.json(), but uses native jsonb type if possible.

### uuid

**table.uuid(name, options=({[useBinaryUuid:boolean],[primaryKey:boolean]})**

Adds a uuid column - this uses the built-in uuid type in PostgreSQL, and falling back to a char(36) in other databases by default.
If useBinaryUuid is true, binary(16) is used. See uuidToBin function to convert uuid in binary before inserting and binToUuid to convert binary uuid to uuid.
If primaryKey is true, then for PostgreSQL the field will be configured as `uuid primary key`, for CockroackDB an additional `default gen_random_uuid()` is set on the type.

You may set the default value to the uuid helper function. Not supported by Redshift.

```js
knex.schema.createTable(tblName, (table) => {
  table.uuid('uuidColumn').defaultTo(knex.fn.uuid());
});
```

### geometry

**table.geometry(name)**

Adds a geometry column. Supported by SQLite, MSSQL and PostgreSQL.

```js
knex.schema.createTable(tblName, (table) => {
  table.geometry('geometryColumn');
});
```

### geography

**table.geography(name)**

Adds a geography column. Supported by SQLite, MSSQL and PostgreSQL (in PostGIS extension).

```js
knex.schema.createTable(tblName, (table) => {
  table.geography('geographyColumn');
});
```

### point

**table.point(name)**

Add a point column. Not supported by CockroachDB and MSSQL.

```js
knex.schema.createTable(tblName, (table) => {
  table.point('pointColumn');
});
```

### comment

**table.comment(value)**

Sets the comment for a table.

### engine

**table.engine(val)**

Sets the engine for the database table, only available within a createTable call, and only applicable to MySQL.

### charset

**table.charset(val)**

Sets the charset for the database table, only available within a createTable call, and only applicable to MySQL.

### collate

**table.collate(val)**

Sets the collation for the database table, only available within a createTable call, and only applicable to MySQL.

### inherits

**table.inherits(val)**

Sets the tables that this table inherits, only available within a createTable call, and only applicable to PostgreSQL.

### specificType

**table.specificType(name, type)**

Sets a specific type for the column creation, if you'd like to add a column type that isn't supported here.

### index

**table.index(columns, [indexName], options=({[indexType: string], [storageEngineIndexType: 'btree'|'hash'], [predicate: QueryBuilder]}))**

Adds an index to a table over the given columns. A default index name using the columns is used unless indexName is specified. In MySQL, the storage engine index type may be 'btree' or 'hash' index types, more info in Index Options section : [https://dev.mysql.com/doc/refman/8.0/en/create-index.html](https://dev.mysql.com/doc/refman/8.0/en/create-index.html). The indexType can be optionally specified for PostgreSQL and MySQL. Amazon Redshift does not allow creating an index. In PostgreSQL, SQLite and MSSQL a partial index can be specified by setting a 'where' predicate.

```js
knex.table('users', function (table) {
  table.index(['name', 'last_name'], 'idx_name_last_name', {
    indexType: 'FULLTEXT',
    storageEngineIndexType: 'hash',
    predicate: knex.whereNotNull('email'),
  });
});
```

### dropIndex

**table.dropIndex(columns, [indexName])**

Drops an index from a table. A default index name using the columns is used unless indexName is specified (in which case columns is ignored). Amazon Redshift does not allow creating an index.

### setNullable

**table.setNullable(column)**

Makes table column nullable.

### dropNullable

**table.dropNullable(column)**

Makes table column not nullable. Note that this operation will fail if there are already null values in this column.

### primary

**table.primary(columns, options=({[constraintName:string],[deferrable:'not deferrable'|'deferred'|'immediate']})**

Create a primary key constraint on table using input `columns`. If you need to create a composite primary key, pass an array of columns to `columns`. Constraint name defaults to `tablename_pkey` unless `constraintName` is specified. On Amazon Redshift, all columns included in a primary key must be not nullable. Deferrable primary constraint are supported on Postgres and Oracle and can be set by passing deferrable option to options object.

```js
knex.schema.alterTable('users', function (t) {
  t.unique('email');
});
knex.schema.alterTable('job', function (t) {
  t.primary('email', {
    constraintName: 'users_primary_key',
    deferrable: 'deferred',
  });
});
```

::: info
If you want to chain primary() while creating new column you can use [primary](#primary-1)
:::

### unique

**table.unique(columns, options={[indexName: string], [deferrable:'not deferrable'|'immediate'|'deferred'], [storageEngineIndexType:'btree'|'hash'], [useConstraint:true|false], [predicate: QueryBuilder]})**

Adds an unique index to a table over the given `columns`. In MySQL, the storage engine index type may be 'btree' or 'hash' index types, more info in Index Options section : [https://dev.mysql.com/doc/refman/8.0/en/create-index.html](https://dev.mysql.com/doc/refman/8.0/en/create-index.html). A default index name using the columns is used unless indexName is specified. If you need to create a composite index, pass an array of column to `columns`. Deferrable unique constraint are supported on Postgres and Oracle and can be set by passing deferrable option to options object. In MSSQL and Postgres, you can set the `useConstraint` option to true to create a unique constraint instead of a unique index (defaults to false for MSSQL, true for Postgres without `predicate`, false for Postgres with `predicate`). In PostgreSQL, SQLite and MSSQL a partial unique index can be specified by setting a 'where' predicate.

```js
knex.schema.alterTable('users', function (t) {
  t.unique('email');
});
knex.schema.alterTable('job', function (t) {
  t.unique(['account_id', 'program_id'], {
    indexName: 'job_composite_index',
    deferrable: 'deferred',
    storageEngineIndexType: 'hash',
  });
});
knex.schema.alterTable('job', function (t) {
  t.unique(['account_id', 'program_id'], {
    indexName: 'job_composite_index',
    useConstraint: true,
  });
});
knex.schema.alterTable('job', function (t) {
  t.unique(['account_id', 'program_id'], {
    indexName: 'job_composite_index',
    predicate: knex.whereNotNull('account_id'),
  });
});
```

::: info
If you want to chain unique() while creating new column you can use [unique](#unique-1)
:::

### foreign

**table.foreign(columns, [foreignKeyName])[.onDelete(statement).onUpdate(statement).withKeyName(foreignKeyName).deferrable(type)]**

Adds a foreign key constraint to a table for an existing column using `table.foreign(column).references(column)` or multiple columns using `table.foreign(columns).references(columns).inTable(table)`.

A default key name using the columns is used unless `foreignKeyName` is specified.

You can also chain `onDelete()` and/or `onUpdate()` to set the reference option `(RESTRICT, CASCADE, SET NULL, NO ACTION)` for the operation. You can also chain `withKeyName()` to override default key name that is generated from table and column names (result is identical to specifying second parameter to function `foreign()`).

Deferrable foreign constraint is supported on Postgres and Oracle and can be set by chaining `.deferrable(type)`

Note that using `foreign()` is the same as `column.references(column)` but it works for existing columns.

```js
knex.schema.table('users', function (table) {
  table.integer('user_id').unsigned();
  table
    .foreign('user_id')
    .references('Items.user_id_in_items')
    .deferrable('deferred');
});
```

### dropForeign

**table.dropForeign(columns, [foreignKeyName])**

Drops a foreign key constraint from a table. A default foreign key name using the columns is used unless foreignKeyName is specified (in which case columns is ignored).

### dropUnique

**table.dropUnique(columns, [indexName])**

Drops a unique key constraint from a table. A default unique key name using the columns is used unless indexName is specified (in which case columns is ignored).

### dropPrimary

**table.dropPrimary([constraintName])**

Drops the primary key constraint on a table. Defaults to tablename_pkey unless constraintName is specified.

### queryContext

**table.queryContext(context)**

Allows configuring a context to be passed to the [wrapIdentifier](/guide/#wrapidentifier) hook for formatting table builder identifiers. The context can be any kind of value and will be passed to `wrapIdentifier` without modification.

```js
knex.schema.table('users', function (table) {
  table.queryContext({ foo: 'bar' });
  table.string('first_name');
  table.string('last_name');
});
```

This method also enables overwriting the context configured for a schema builder instance via [schema.queryContext](/guide/schema-builder#querycontext):

```js
knex.schema.queryContext('schema context').table('users', function (table) {
  table.queryContext('table context');
  table.string('first_name');
  table.string('last_name');
});
```

Note that it's also possible to overwrite the table builder context for any column in the table definition:

```js
knex.schema.queryContext('schema context').table('users', function (table) {
  table.queryContext('table context');
  table.string('first_name').queryContext('first_name context');
  table.string('last_name').queryContext('last_name context');
});
```

Calling `queryContext` with no arguments will return any context configured for the table builder instance.

## Chainable Methods

The following three methods may be chained on the schema building methods, as modifiers to the column.

### alter

**column.alter(options={[alterNullable: boolean = true, alterType: boolean = true])**

Marks the column as an alter / modify, instead of the default add.

::: warning
This only works in .alterTable() and is not supported by SQlite or Amazon Redshift. Alter is _not_ done incrementally over older column type so if you like to add `notNullable` and keep the old default value, the alter statement must contain both `.notNullable().defaultTo(1).alter()`. If one just tries to add `.notNullable().alter()` the old default value will be dropped. Nullable alterations are done only if alterNullable is true. Type alterations are done only if alterType is true.
:::

```js
knex.schema.alterTable('user', function (t) {
  t.increments().primary(); // add
  // drops previous default value from column,
  // change type to string and add not nullable constraint
  t.string('username', 35).notNullable().alter();
  // drops both not null constraint and the default value
  t.integer('age').alter();
  // if alterNullable is false, drops only the default value
  t.integer('age').alter({ alterNullable: false });
  // if alterType is false, type of column is not altered.
  t.integer('age').alter({ alterType: false });
});
```

### index

**column.index([indexName], options=({[indexType: string], [storageEngineIndexType: 'btree'|'hash'], [predicate: QueryBuilder]}))**

Specifies a field as an index. If an indexName is specified, it is used in place of the standard index naming convention of tableName_columnName. In MySQL, the storage engine index type may be 'btree' or 'hash' index types, more info in Index Options section : [https://dev.mysql.com/doc/refman/8.0/en/create-index.html](https://dev.mysql.com/doc/refman/8.0/en/create-index.html). The indexType can be optionally specified for PostgreSQL and MySQL. No-op if this is chained off of a field that cannot be indexed. In PostgreSQL, SQLite and MSSQL a partial index can be specified by setting a 'where' predicate.

### primary

**column.primary(options=({[constraintName:string],[deferrable:'not deferrable'|'deferred'|'immediate']}));**

Sets a primary key constraint on `column`. Constraint name defaults to `tablename_pkey` unless `constraintName` is specified. On Amazon Redshift, all columns included in a primary key must be not nullable. Deferrable primary constraint are supported on Postgres and Oracle and can be set by passing deferrable option to options object.

```js
knex.schema.table('users', function (table) {
  table.integer('user_id').primary('email', {
    constraintName: 'users_primary_key',
    deferrable: 'deferred',
  });
});
```

::: info
If you want to create primary constraint on existing column use [primary](#primary)
:::

### unique

**column.unique(options={[indexName:string],[deferrable:'not deferrable'|'immediate'|'deferred']})**

Sets the `column` as unique. On Amazon Redshift, this constraint is not enforced, but it is used by the query planner. Deferrable unique constraint are supported on Postgres and Oracle and can be set by passing deferrable option to options object.

```js
knex.schema.table('users', function (table) {
  table
    .integer('user_id')
    .unique({ indexName: 'user_unique_id', deferrable: 'immediate' });
});
```

::: info
If you want to create unique constraint on existing column use [unique](#unique)
:::

### references

**column.references(column)**

Sets the "column" that the current column references as a foreign key. "column" can either be "." syntax, or just the column name followed up with a call to inTable to specify the table.

### inTable

**column.inTable(table)**

Sets the "table" where the foreign key column is located after calling column.references.

### onDelete

**column.onDelete(command)**

Sets the SQL command to be run "onDelete".

### onUpdate

**column.onUpdate(command)**

Sets the SQL command to be run "onUpdate".

### defaultTo

**column.defaultTo(value, options={[constraintName: string = undefined]))**

Sets the default value for the column on an insert.

In MSSQL a constraintName option may be passed to ensure a specific constraint name:

```js
column.defaultTo('value', { constraintName: 'df_table_value' });
```

### unsigned

**column.unsigned()**

Specifies a number as unsigned. Only for numeric values.

### notNullable

**column.notNullable()**

Adds a not null on the current column being created.

### nullable

**column.nullable()**

Default on column creation, this explicitly sets a field to be nullable.

### first

**column.first()**

Sets the column to be inserted on the first position, only used in MySQL alter tables.

### after

**column.after(field)**

Sets the column to be inserted after another, only used in MySQL alter tables.

### comment

**column.comment(value)**

Sets the comment for a column.

```js
knex.schema.createTable('accounts', function (t) {
  t.increments().primary();
  t.string('email').unique().comment('This is the email field');
});
```

### collate

**column.collate(collation)**

Sets the collation for a column (only works in MySQL). Here is a list of all available collations: [https://dev.mysql.com/doc/refman/5.5/en/charset-charsets.html](https://dev.mysql.com/doc/refman/5.5/en/charset-charsets.html)

```js
knex.schema.createTable('users', function (t) {
  t.increments();
  t.string('email').unique().collate('utf8_unicode_ci');
});
```

## View

### columns

**view.columns([columnNames])**

Specify the columns of the view.

```js
knex.schema.createView('users_view', function (view) {
  view.columns(['first_name', 'last_name']);
  view.as(knex('users').select('first_name').where('age', '>', '18'));
});
```

### as

**view.as(selectQuery)**

Specify the select query of the view.

### checkOption

**view.checkOption()**

Add check option on the view definition. On OracleDb, MySQL, PostgreSQL and Redshift.

### localCheckOption

**view.localCheckOption()**

Add local check option on the view definition. On MySQL, PostgreSQL and Redshift.

### cascadedCheckOption

**view.cascadedCheckOption()**

Add cascaded check option on the view definition. On MySQL, PostgreSQL and Redshift.

## Checks

### check

**table.check(checkPredicate, [bindings], [constraintName]))**

Specify a check on table or column with raw predicate.

```js
knex.schema.createTable('product', function (table) {
  table.integer('price_min');
  table.integer('price');
  table.check('?? >= ??', ['price', 'price_min']);
});
```

### checkPositive

**column.checkPositive([constraintName])**

Specify a check on column that test if the value of column is positive.

```js
knex.schema.createTable('product', function (table) {
  table.integer('price').checkPositive();
});
```

### checkNegative

**column.checkNegative([constraintName])**

Specify a check on column that test if the value of column is negative.

```js
knex.schema.createTable('product', function (table) {
  table.integer('price_decrease').checkNegative();
});
```

### checkIn

**column.checkIn(values, [constraintName])**

Specify a check on column that test if the value of column is contained in a set of specified values.

```js
knex.schema.createTable('product', function (table) {
  table.string('type').checkIn(['table', 'chair', 'sofa']);
});
```

### checkNotIn

**column.checkNotIn(values, [constraintName])**

Specify a check on column that test if the value of column is not contains in a set of specified values.

```js
knex.schema.createTable('product', function (table) {
  table.string('type').checkNotIn(['boot', 'shoe']);
});
```

### checkBetween

**column.checkBetween(values, [constraintName])**

Specify a check on column that test if the value of column is within a range of values.

```js
knex.schema.createTable('product', function (table) {
  table.integer('price').checkBetween([0, 100]);
});
// You can add checks on multiple intervals
knex.schema.createTable('product', function (table) {
  table.integer('price').checkBetween([
    [0, 20],
    [30, 40],
  ]);
});
```

### checkLength

**column.checkLength(operator, length, [constraintName])**

Specify a check on column that test if the length of a string match the predicate.

```js
knex.schema.createTable('product', function (table) {
  // operator can be =, !=, <=, >=, <, >
  t.varchar('phone').checkLength('=', 8);
});
```

### checkRegex

**column.checkRegex(regex, [constraintName])**

Specify a check on column that test if the value match the specified regular expression. In MSSQL only simple pattern matching in supported but not regex syntax.

```js
knex.schema.createTable('product', function (table) {
  table.string('phone').checkRegex('[0-9]{8}');
  // In MSSQL, {8} syntax don't work,
  // you need to duplicate [0-9].
  table.string('phone').checkRegex('[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]');
});
```

### dropChecks

**table.dropChecks([checkConstraintNames])**

Drop checks constraint given an array of constraint names.

```js
knex.schema.createTable('product', function (table) {
  table.integer('price').checkPositive('price_check');
  table
    .integer('price_proportion')
    .checkBetween([0, 100], 'price_proportion_check');
  table.dropChecks(['price_check', 'price_proportion_check']);
});
```
