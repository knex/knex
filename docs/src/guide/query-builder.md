# Knex Query Builder

The heart of the library, the knex query builder is the interface used for building and executing standard SQL queries, such as `select`, `insert`, `update`, `delete`.

## Identifier Syntax

In many places in APIs identifiers like table name or column name can be passed to methods.

Most commonly one needs just plain `tableName.columnName`, `tableName` or `columnName`, but in many cases one also needs to pass an alias how that identifier is referred later on in the query.

There are two ways to declare an alias for identifier. One can directly give `as aliasName` suffix for the identifier (e.g. `identifierName as aliasName`) or one can pass an object `{ aliasName: 'identifierName' }`.

If the object has multiple aliases `{ alias1: 'identifier1', alias2: 'identifier2' }`, then all the aliased identifiers are expanded to comma separated list.

::: info
Identifier syntax has no place for selecting schema, so if you are doing `schemaName.tableName`, query might be rendered wrong. Use `.withSchema('schemaName')` instead.

```js
knex({ a: 'table', b: 'table' })
  .select({
    aTitle: 'a.title',
    bTitle: 'b.title',
  })
  .whereRaw('?? = ??', ['a.column_1', 'b.column_2']);
```

:::

## Common

### knex

**knex(tableName, options={only: boolean})**  
**knex.[methodName]**

The query builder starts off either by specifying a tableName you wish to query against, or by calling any method directly on the knex object. This kicks off a jQuery-like chain, with which you can call additional query builder methods as needed to construct the query, eventually calling any of the interface methods, to either convert toString, or execute the query with a promise, callback, or stream. Optional second argument for passing options:\* **only**: if `true`, the ONLY keyword is used before the `tableName` to discard inheriting tables' data.

::: warning
Only supported in PostgreSQL for now.
:::

#### Usage with TypeScript

If using TypeScript, you can pass the type of database row as a type parameter to get better autocompletion support down the chain.

```ts
interface User {
  id: number;
  name: string;
  age: number;
}

knex('users').where('id').first(); // Resolves to any

knex<User>('users') // User is the type of row in database
  .where('id', 1) // Your IDE will be able to help with the completion of id
  .first(); // Resolves to User | undefined
```

It is also possible to take advantage of auto-completion support (in TypeScript-aware IDEs) with generic type params when writing code in plain JavaScript through JSDoc comments.

```js
/**
 * @typedef {Object} User
 * @property {number} id
 * @property {number} age
 * @property {string} name
 *
 * @returns {Knex.QueryBuilder<User, {}>}
 */
const Users = () => knex('Users');

// 'id' property can be autocompleted by editor
Users().where('id', 1);
```

##### Caveat with type inference and mutable fluent APIs

Most of the knex APIs mutate current object and return it. This pattern does not work well with type-inference.

```ts
knex<User>('users')
  .select('id')
  .then((users) => {
    // Type of users is inferred as Pick<User, "id">[]
    // Do something with users
  });

knex<User>('users')
  .select('id')
  .select('age')
  .then((users) => {
    // Type of users is inferred as Pick<User, "id" | "age">[]
    // Do something with users
  });

// The type of usersQueryBuilder is determined here
const usersQueryBuilder = knex<User>('users').select('id');

if (someCondition) {
  // This select will not change the type of usersQueryBuilder
  // We can not change the type of a pre-declared variable in TypeScript
  usersQueryBuilder.select('age');
}
usersQueryBuilder.then((users) => {
  // Type of users here will be Pick<User, "id">[]
  // which may not be what you expect.
});

// You can specify the type of result explicitly through a second type parameter:
const queryBuilder = knex<User, Pick<User, 'id' | 'age'>>('users');

// But there is no type constraint to ensure that these properties have actually been
// selected.

// So, this will compile:
queryBuilder.select('name').then((users) => {
  // Type of users is Pick<User, "id"> but it will only have name
});
```

If you don't want to manually specify the result type, it is recommended to always use the type of last value of the chain and assign result of any future chain continuation to a separate variable (which will have a different type).

#### timeout

**.timeout(ms, options={cancel: boolean})**

Sets a timeout for the query and will throw a TimeoutError if the timeout is exceeded. The error contains information about the query, bindings, and the timeout that was set. Useful for complex queries that you want to make sure are not taking too long to execute. Optional second argument for passing options:\* **cancel**: if `true`, cancel query if timeout is reached.

::: warning
Only supported in MySQL and PostgreSQL for now.
:::

```js
knex.select().from('books').timeout(1000);

knex.select().from('books').timeout(1000, {
  cancel: true, // MySQL and PostgreSQL only
});
```

### select

**.select([\*columns])**

Creates a select query, taking an optional array of columns for the query, eventually defaulting to \* if none are specified when the query is built. The response of a select call will resolve with an array of objects selected from the database.

```js
knex.select('title', 'author', 'year').from('books');

knex.select().table('books');
```

##### Usage with TypeScript

We are generally able to infer the result type based on the columns being selected as long as the select arguments match exactly the key names in record type. However, aliasing and scoping can get in the way of inference.

```ts
knex.select('id').from<User>('users'); // Resolves to Pick<User, "id">[]

knex.select('users.id').from<User>('users'); // Resolves to any[]
// ^ TypeScript doesn't provide us a way to look into a string and infer the type
//   from a substring, so we fall back to any

// We can side-step this using knex.ref:
knex.select(knex.ref('id').withSchema('users')).from<User>('users'); // Resolves to Pick<User, "id">[]

knex.select('id as identifier').from<User>('users'); // Resolves to any[], for same reason as above

// Refs are handy here too:
knex.select(knex.ref('id').as('identifier')).from<User>('users'); // Resolves to { identifier: number; }[]
```

### as

**.as(name)**

Allows for aliasing a subquery, taking the string you wish to name the current query. If the query is not a sub-query, it will be ignored.

```ts
knex
  .avg('sum_column1')
  .from(function () {
    this.sum('column1 as sum_column1').from('t1').groupBy('column1').as('t1');
  })
  .as('ignored_alias');
```

### column

**.column(columns)**

Specifically set the columns to be selected on a select query, taking an array, an object or a list of column names. Passing an object will automatically alias the columns with the given keys.

```js
knex.column('title', 'author', 'year').select().from('books');

knex.column(['title', 'author', 'year']).select().from('books');

knex.column('title', { by: 'author' }, 'year').select().from('books');
```

### from

**.from([tableName], options={only: boolean})**

Specifies the table used in the current query, replacing the current table name if one has already been specified. This is typically used in the sub-queries performed in the advanced where or union methods. Optional second argument for passing options:\* **only**: if `true`, the ONLY keyword is used before the `tableName` to discard inheriting tables' data.

::: warning
Only supported in PostgreSQL for now.
:::

```js
knex.select('*').from('users');
```

#### Usage with TypeScript

We can specify the type of database row through the TRecord type parameter

```ts
knex.select('id').from('users'); // Resolves to any[]

knex.select('id').from<User>('users'); // Results to Pick<User, "id">[]
```

### fromRaw

**.fromRaw(sql, [bindings])**

```js
knex.select('*').fromRaw('(select * from "users" where "age" > ?)', '18');
```

### with

**.with(alias, [columns], callback|builder|raw)**

Add a "with" clause to the query. "With" clauses are supported by PostgreSQL, Oracle, SQLite3 and MSSQL. An optional column list can be provided after the alias; if provided, it must include at least one column name.

```js
knex
  .with(
    'with_alias',
    knex.raw('select * from "books" where "author" = ?', 'Test')
  )
  .select('*')
  .from('with_alias');

knex
  .with(
    'with_alias',
    ['title'],
    knex.raw('select "title" from "books" where "author" = ?', 'Test')
  )
  .select('*')
  .from('with_alias');

knex
  .with('with_alias', (qb) => {
    qb.select('*').from('books').where('author', 'Test');
  })
  .select('*')
  .from('with_alias');
```

### withRecursive

**.withRecursive(alias, [columns], callback|builder|raw)**

Identical to the `with` method except "recursive" is appended to "with" (or not, as required by the target database) to make self-referential CTEs possible. Note that some databases, such as Oracle, require a column list be provided when using an rCTE.

```js
knex
  .withRecursive('ancestors', (qb) => {
    qb.select('*')
      .from('people')
      .where('people.id', 1)
      .union((qb) => {
        qb.select('*')
          .from('people')
          .join('ancestors', 'ancestors.parentId', 'people.id');
      });
  })
  .select('*')
  .from('ancestors');

knex
  .withRecursive('family', ['name', 'parentName'], (qb) => {
    qb.select('name', 'parentName')
      .from('folks')
      .where({ name: 'grandchild' })
      .unionAll((qb) =>
        qb
          .select('folks.name', 'folks.parentName')
          .from('folks')
          .join('family', knex.ref('family.parentName'), knex.ref('folks.name'))
      );
  })
  .select('name')
  .from('family');
```

### withMaterialized

**.withMaterialized(alias, [columns], callback|builder|raw)**

Add a "with" materialized clause to the query. "With" materialized clauses are supported by PostgreSQL and SQLite3. An optional column list can be provided after the alias; if provided, it must include at least one column name.

```js
knex
  .withMaterialized(
    'with_alias',
    knex.raw('select * from "books" where "author" = ?', 'Test')
  )
  .select('*')
  .from('with_alias');

knex
  .withMaterialized(
    'with_alias',
    ['title'],
    knex.raw('select "title" from "books" where "author" = ?', 'Test')
  )
  .select('*')
  .from('with_alias');

knex
  .withMaterialized('with_alias', (qb) => {
    qb.select('*').from('books').where('author', 'Test');
  })
  .select('*')
  .from('with_alias');
```

### withNotMaterialized

**.withNotMaterialized(alias, [columns], callback|builder|raw)**

Add a "with" not materialized clause to the query. "With" not materialized clauses are supported by PostgreSQL and SQLite3. An optional column list can be provided after the alias; if provided, it must include at least one column name.

```js
knex
  .withNotMaterialized(
    'with_alias',
    knex.raw('select * from "books" where "author" = ?', 'Test')
  )
  .select('*')
  .from('with_alias');

knex
  .withNotMaterialized(
    'with_alias',
    ['title'],
    knex.raw('select "title" from "books" where "author" = ?', 'Test')
  )
  .select('*')
  .from('with_alias');

knex
  .withNotMaterialized('with_alias', (qb) => {
    qb.select('*').from('books').where('author', 'Test');
  })
  .select('*')
  .from('with_alias');
```

### withSchema

**.withSchema([schemaName])**

Specifies the schema to be used as prefix of table name.

```js
knex.withSchema('public').select('*').from('users');
```

### jsonExtract

**.jsonExtract(column|builder|raw|array[], path, [alias], [singleValue])**

Extract a value from a json column given a JsonPath. An alias can be specified. The singleValue boolean can be used to specify, with Oracle or MSSQL, if the value returned by the function is a single value or an array/object value. An array of arrays can be used to specify multiple extractions with one call to this function.

```js
knex('accounts').jsonExtract('json_col', '$.name');

knex('accounts').jsonExtract('json_col', '$.name', 'accountName');

knex('accounts').jsonExtract('json_col', '$.name', 'accountName', true);

knex('accounts').jsonExtract([
  ['json_col', '$.name', 'accountName'],
  ['json_col', '$.lastName', 'accountLastName'],
]);
```

All json\*() functions can be used directly from knex object and can be nested.

```js
knex('cities').jsonExtract([
  [knex.jsonRemove('population', '$.min'), '$', 'withoutMin'],
  [knex.jsonRemove('population', '$.max'), '$', 'withoutMax'],
  [knex.jsonSet('population', '$.current', '1234'), '$', 'currentModified'],
]);
```

### jsonSet

**.jsonSet(column|builder|raw, path, value, [alias])**

Return a json value/object/array where a given value is set at the given JsonPath. Value can be single value or json object. If a value already exists at the given place, the value is replaced. Not supported by Redshift and versions before Oracle 21c.

```js
knex('accounts').jsonSet('json_col', '$.name', 'newName', 'newNameCol');

knex('accounts').jsonSet(
  'json_col',
  '$.name',
  { name: 'newName' },
  'newNameCol'
);
```

### jsonInsert

**.jsonInsert(column|builder|raw, path, value, [alias])**

Return a json value/object/array where a given value is inserted at the given JsonPath. Value can be single value or json object. If a value exists at the given path, the value is not replaced. Not supported by Redshift and versions before Oracle 21c.

```js
knex('accounts').jsonInsert('json_col', '$.name', 'newName', 'newNameCol');

knex('accounts').jsonInsert(
  'json_col',
  '$.name',
  { name: 'newName' },
  'newNameCol'
);

knex('accounts').jsonInsert(
  knex.jsonExtract('json_col', '$.otherAccount'),
  '$.name',
  { name: 'newName' },
  'newNameCol'
);
```

### jsonRemove

**.jsonRemove(column|builder|raw, path, [alias])**

Return a json value/object/array where a given value is removed at the given JsonPath. Not supported by Redshift and versions before Oracle 21c.

```js
knex('accounts').jsonRemove('json_col', '$.name', 'colWithRemove');

knex('accounts').jsonInsert(
  'json_col',
  '$.name',
  { name: 'newName' },
  'newNameCol'
);
```

### offset

**.offset(value, options={skipBinding: boolean})**

Adds an offset clause to the query. An optional skipBinding parameter may be specified which would avoid setting offset as a prepared value (some databases don't allow prepared values for offset).

```js
knex.select('*').from('users').offset(10);

knex.select('*').from('users').offset(10).toSQL().sql;

// Offset value isn't a prepared value.
knex.select('*').from('users').offset(10, { skipBinding: true }).toSQL().sql;
```

### limit

**.limit(value, options={skipBinding: boolean})**

Adds a limit clause to the query. An optional skipBinding parameter may be specified to avoid adding limit as a prepared value (some databases don't allow prepared values for limit).

```js
knex.select('*').from('users').limit(10).offset(30);

knex.select('*').from('users').limit(10).offset(30).toSQL().sql;

// Limit value isn't a prepared value.
knex
  .select('*')
  .from('users')
  .limit(10, { skipBinding: true })
  .offset(30)
  .toSQL().sql;
```

### union

**.union([\*queries], [wrap])**

Creates a union query, taking an array or a list of callbacks, builders, or raw statements to build the union statement, with optional boolean wrap. If the `wrap` parameter is `true`, the queries will be individually wrapped in parentheses.

```js
knex
  .select('*')
  .from('users')
  .whereNull('last_name')
  .union(function () {
    this.select('*').from('users').whereNull('first_name');
  });

knex
  .select('*')
  .from('users')
  .whereNull('last_name')
  .union([knex.select('*').from('users').whereNull('first_name')]);

knex
  .select('*')
  .from('users')
  .whereNull('last_name')
  .union(
    knex.raw('select * from users where first_name is null'),
    knex.raw('select * from users where email is null')
  );
```

If you want to apply `orderBy`, `groupBy`, `limit`, `offset` or `having` to inputs of the union you need to use `knex.union` as a base statement. If you don't do this, those clauses will get appended to the end of the union.

```js
// example showing how clauses get appended to the end of the query
knex('users')
  .select('id', 'name')
  .groupBy('id')
  .union(knex('invitations').select('id', 'name').orderBy('expires_at'));

knex.union([
  knex('users').select('id', 'name').groupBy('id'),
  knex('invitations').select('id', 'name').orderBy('expires_at'),
]);
```

[before](https://michaelavila.com/knex-querylab/?query=NYOwpgHgFA5ArgZzAJwTAlAOiQGzAYwBdYBLAExgBoACGEAQwFswNMBzZAezgAcAhAJ6kKWOCBKcQUUJFIgAbiUL1CEkGiy4CxGOSq0GzVp2RkUg2JB4lkYBAH0VGdEA) and [after](https://michaelavila.com/knex-querylab/?query=NYOwpgHgdAriCWB7EAKA2qSKDkMDOYATntgJRQEA2YAxgC47wAm2ANAATYgCGAtmGSgBzQohgAHAEIBPRi1IdMERiABu8OtzpIQJclVoNszNpx79BiQkyIyckcfEJg8AfS1kAuqSA)

### unionAll

**.unionAll([\*queries], [wrap])**

Creates a union all query, with the same method signature as the union method. If the `wrap` parameter is `true`, the queries will be individually wrapped in parentheses.

```js
knex
  .select('*')
  .from('users')
  .whereNull('last_name')
  .unionAll(function () {
    this.select('*').from('users').whereNull('first_name');
  });

knex
  .select('*')
  .from('users')
  .whereNull('last_name')
  .unionAll([knex.select('*').from('users').whereNull('first_name')]);

knex
  .select('*')
  .from('users')
  .whereNull('last_name')
  .unionAll(
    knex.raw('select * from users where first_name is null'),
    knex.raw('select * from users where email is null')
  );
```

### intersect

**.intersect([\*queries], [wrap])**

Creates an intersect query, taking an array or a list of callbacks, builders, or raw statements to build the intersect statement, with optional boolean wrap. If the `wrap` parameter is `true`, the queries will be individually wrapped in parentheses. The intersect method is unsupported on MySQL.

```js
knex
  .select('*')
  .from('users')
  .whereNull('last_name')
  .intersect(function () {
    this.select('*').from('users').whereNull('first_name');
  });

knex
  .select('*')
  .from('users')
  .whereNull('last_name')
  .intersect([knex.select('*').from('users').whereNull('first_name')]);

knex
  .select('*')
  .from('users')
  .whereNull('last_name')
  .intersect(
    knex.raw('select * from users where first_name is null'),
    knex.raw('select * from users where email is null')
  );
```

### except

**.except([\*queries], [wrap])**

Creates an except query, taking an array or a list of callbacks, builders, or raw statements to build the except statement, with optional boolean wrap. If the `wrap` parameter is `true`, the queries will be individually wrapped in parentheses. The except method is unsupported on MySQL.

```js
knex
  .select('*')
  .from('users')
  .whereNull('last_name')
  .except(function () {
    this.select('*').from('users').whereNull('first_name');
  });

knex
  .select('*')
  .from('users')
  .whereNull('last_name')
  .except([knex.select('*').from('users').whereNull('first_name')]);

knex
  .select('*')
  .from('users')
  .whereNull('last_name')
  .except(
    knex.raw('select * from users where first_name is null'),
    knex.raw('select * from users where email is null')
  );
```

### insert

**.insert(data, [returning], [options])**

Creates an insert query, taking either a hash of properties to be inserted into the row, or an array of inserts, to be executed as a single insert command. If returning array is passed e.g. \['id', 'title'\], it resolves the promise / fulfills the callback with an array of all the added rows with specified columns. It's a shortcut for [returning method](#returning)

```js
// Returns [1] in "mysql", "sqlite", "oracle";
// [] in "postgresql"
// unless the 'returning' parameter is set.
knex('books').insert({ title: 'Slaughterhouse Five' });

// Normalizes for empty keys on multi-row insert:
knex('coords').insert([{ x: 20 }, { y: 30 }, { x: 10, y: 20 }]);

// Returns [2] in "mysql", "sqlite"; [2, 3] in "postgresql"
knex
  .insert([{ title: 'Great Gatsby' }, { title: 'Fahrenheit 451' }], ['id'])
  .into('books');
```

For MSSQL, triggers on tables can interrupt returning a valid value from the standard insert statements. You can add the `includeTriggerModifications` option to get around this issue. This modifies the SQL so the proper values can be returned. This only modifies the statement if you are using MSSQL, a returning value is specified, and the `includeTriggerModifications` option is set.

```js
// Adding the option includeTriggerModifications
// allows you to run statements on tables
// that contain triggers. Only affects MSSQL.
knex('books').insert({ title: 'Alice in Wonderland' }, ['id'], {
  includeTriggerModifications: true,
});
```

If one prefers that undefined keys are replaced with `NULL` instead of `DEFAULT` one may give `useNullAsDefault` configuration parameter in knex config.

```js
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    port: 3306,
    user: 'your_database_user',
    password: 'your_database_password',
    database: 'myapp_test',
  },
  useNullAsDefault: true,
});

knex('coords').insert([{ x: 20 }, { y: 30 }, { x: 10, y: 20 }]);
```

```sql
insert into `coords` (`x`, `y`) values (20, NULL), (NULL, 30), (10, 20)"
```

### onConflict

**insert(..).onConflict(column)**  
**insert(..).onConflict([column1, column2, ...])**  
**insert(..).onConflict(knex.raw(...))**

Implemented for the PostgreSQL, MySQL, and SQLite databases. A modifier for insert queries that specifies alternative behaviour in the case of a conflict. A conflict occurs when a table has a PRIMARY KEY or a UNIQUE index on a column (or a composite index on a set of columns) and a row being inserted has the same value as a row which already exists in the table in those column(s). The default behaviour in case of conflict is to raise an error and abort the query. Using this method you can change this behaviour to either silently ignore the error by using .onConflict().ignore() or to update the existing row with new data (perform an "UPSERT") by using .onConflict().merge().

::: info
For PostgreSQL and SQLite, the column(s) specified by this method must either be the table's PRIMARY KEY or have a UNIQUE index on them, or the query will fail to execute. When specifying multiple columns, they must be a composite PRIMARY KEY or have composite UNIQUE index. MySQL will ignore the specified columns and always use the table's PRIMARY KEY. For cross-platform support across PostgreSQL, MySQL, and SQLite you must both explicitly specify the columns in .onConflict() and those column(s) must be the table's PRIMARY KEY.

For PostgreSQL and SQLite, you can use knex.raw(...) function in onConflict. It can be useful to specify condition when you have partial index :
:::

```js
knex('tableName')
  .insert({
    email: 'ignore@example.com',
    name: 'John Doe',
    active: true,
  })
  // ignore only on email conflict and active is true.
  .onConflict(knex.raw('(email) where active'))
  .ignore();
```

See documentation on .ignore() and .merge() methods for more details.

#### ignore

**insert(..).onConflict(..).ignore()**

Implemented for the PostgreSQL, MySQL, and SQLite databases. Modifies an insert query, and causes it to be silently dropped without an error if a conflict occurs. Uses INSERT IGNORE in MySQL, and adds an ON CONFLICT (columns) DO NOTHING clause to the insert statement in PostgreSQL and SQLite.

```js
knex('tableName')
  .insert({
    email: 'ignore@example.com',
    name: 'John Doe',
  })
  .onConflict('email')
  .ignore();
```

#### merge

**insert(..).onConflict(..).merge()**  
**insert(..).onConflict(..).merge(updates)**

Implemented for the PostgreSQL, MySQL, and SQLite databases. Modifies an insert query, to turn it into an 'upsert' operation. Uses ON DUPLICATE KEY UPDATE in MySQL, and adds an ON CONFLICT (columns) DO UPDATE clause to the insert statement in PostgreSQL and SQLite. By default, it merges all columns.

```js
knex('tableName')
  .insert({
    email: 'ignore@example.com',
    name: 'John Doe',
  })
  .onConflict('email')
  .merge();
```

This also works with batch inserts:

```js
knex('tableName')
  .insert([
    { email: 'john@example.com', name: 'John Doe' },
    { email: 'jane@example.com', name: 'Jane Doe' },
    { email: 'alex@example.com', name: 'Alex Doe' },
  ])
  .onConflict('email')
  .merge();
```

It is also possible to specify a subset of the columns to merge when a conflict occurs. For example, you may want to set a 'created_at' column when inserting but would prefer not to update it if the row already exists:

```js
const timestamp = Date.now();
knex('tableName')
  .insert({
    email: 'ignore@example.com',
    name: 'John Doe',
    created_at: timestamp,
    updated_at: timestamp,
  })
  .onConflict('email')
  .merge(['email', 'name', 'updated_at']);
```

It is also possible to specify data to update separately from the data to insert. This is useful if you want to update with different data to the insert. For example, you may want to change a value if the row already exists:

```js
const timestamp = Date.now();
knex('tableName')
  .insert({
    email: 'ignore@example.com',
    name: 'John Doe',
    created_at: timestamp,
    updated_at: timestamp,
  })
  .onConflict('email')
  .merge({
    name: 'John Doe The Second',
  });
```

**For PostgreSQL/SQLite databases only**, it is also possible to add [a WHERE clause](#where) to conditionally update only the matching rows:

```js
const timestamp = Date.now();
knex('tableName')
  .insert({
    email: 'ignore@example.com',
    name: 'John Doe',
    created_at: timestamp,
    updated_at: timestamp,
  })
  .onConflict('email')
  .merge({
    name: 'John Doe',
    updated_at: timestamp,
  })
  .where('updated_at', '<', timestamp);
```

### upsert

**.upsert(data, [returning], [options])**

Implemented for the CockroachDB. Creates an upsert query, taking either a hash of properties to be inserted into the row, or an array of upserts, to be executed as a single upsert command. If returning array is passed e.g. \['id', 'title'\], it resolves the promise / fulfills the callback with an array of all the added rows with specified columns. It's a shortcut for [returning method](#returning)

```js
// insert new row with unique index on title column
knex('books').upsert({ title: 'Great Gatsby' });

// update row by unique title 'Great Gatsby'
// and insert row with title 'Fahrenheit 451'
knex('books').upsert(
  [{ title: 'Great Gatsby' }, { title: 'Fahrenheit 451' }],
  ['id']
);

// Normalizes for empty keys on multi-row upsert,
// result sql:
// ("x", "y") values (20, default), (default, 30), (10, 20):
knex('coords').upsert([{ x: 20 }, { y: 30 }, { x: 10, y: 20 }]);
```

### update

**.update(data, [returning], [options])**
**.update(key, value, [returning], [options])**

Creates an update query, taking a hash of properties or a key/value pair to be updated based on the other query constraints. If returning array is passed e.g. \['id', 'title'\], it resolves the promise / fulfills the callback with an array of all the updated rows with specified columns. It's a shortcut for [returning method](#returning)

```js
knex('books').where('published_date', '<', 2000).update({
  status: 'archived',
  thisKeyIsSkipped: undefined,
});

// Returns [1] in "mysql", "sqlite", "oracle";
// [] in "postgresql"
// unless the 'returning' parameter is set.
knex('books').update('title', 'Slaughterhouse Five');

/** Returns
 * [{
 *   id: 42,
 *   title: "The Hitchhiker's Guide to the Galaxy"
 * }] **/
knex('books').where({ id: 42 }).update(
  {
    title: "The Hitchhiker's Guide to the Galaxy",
  },
  ['id', 'title']
);
```

For MSSQL, triggers on tables can interrupt returning a valid value from the standard update statements. You can add the `includeTriggerModifications` option to get around this issue. This modifies the SQL so the proper values can be returned. This only modifies the statement if you are using MSSQL, a returning value is specified, and the `includeTriggerModifications` option is set.

```js
// Adding the option includeTriggerModifications allows you
// to run statements on tables that contain triggers.
// Only affects MSSQL.
knex('books').update({ title: 'Alice in Wonderland' }, ['id', 'title'], {
  includeTriggerModifications: true,
});
```

### updateFrom

**.updateFrom(tableName)**

Can be used to define in PostgreSQL an update statement with explicit 'from' syntax which can be referenced in 'where' conditions.

```js
knex('accounts')
  .update({ enabled: false })
  .updateFrom('clients')
  .where('accounts.id', '=', 'clients.id')
  .where('clients.active', '=', false);
```

### del / delete

**.del([returning], [options])**

Aliased to del as delete is a reserved word in JavaScript, this method deletes one or more rows, based on other conditions specified in the query. Resolves the promise / fulfills the callback with the number of affected rows for the query.

```js
knex('accounts').where('activated', false).del();
```

For MSSQL, triggers on tables can interrupt returning a valid value from the standard delete statements. You can add the `includeTriggerModifications` option to get around this issue. This modifies the SQL so the proper values can be returned. This only modifies the statement if you are using MSSQL, a returning value is specified, and the `includeTriggerModifications` option is set.

```js
// Adding the option includeTriggerModifications allows you
// to run statements on tables that contain triggers.
// Only affects MSSQL.
knex('books')
  .where('title', 'Alice in Wonderland')
  .del(['id', 'title'], { includeTriggerModifications: true });
```

For PostgreSQL, Delete statement with joins is both supported with classic 'join' syntax and 'using' syntax.

```js
knex('accounts')
  .where('activated', false)
  .join('accounts', 'accounts.id', 'users.account_id')
  .del();
```

### using

**.using(tableName|tableNames)**

Can be used to define in PostgreSQL a delete statement with joins with explicit 'using' syntax. Classic join syntax can be used too.

```js
knex('accounts')
  .where('activated', false)
  .using('accounts')
  .whereRaw('accounts.id = users.account_id')
  .del();
```

### returning

**.returning(column, [options])**
**.returning([column1, column2, ...], [options])**

Utilized by PostgreSQL, MSSQL, SQLite, and Oracle databases, the returning method specifies which column should be returned by the insert, update and delete methods. Passed column parameter may be a string or an array of strings. The SQL result be reported as an array of objects, each containing a single property for each of the specified columns. The returning method is not supported on Amazon Redshift.

```js
// Returns [ { id: 1 } ]
knex('books').returning('id').insert({ title: 'Slaughterhouse Five' });

// Returns [{ id: 2 } ] in "mysql", "sqlite";
// [ { id: 2 }, { id: 3 } ] in "postgresql"
knex('books')
  .returning('id')
  .insert([{ title: 'Great Gatsby' }, { title: 'Fahrenheit 451' }]);

// Returns [ { id: 1, title: 'Slaughterhouse Five' } ]
knex('books')
  .returning(['id', 'title'])
  .insert({ title: 'Slaughterhouse Five' });
```

For MSSQL, triggers on tables can interrupt returning a valid value from the standard DML statements. You can add the `includeTriggerModifications` option to get around this issue. This modifies the SQL so the proper values can be returned. This only modifies the statement if you are using MSSQL, a returning value is specified, and the `includeTriggerModifications` option is set.

```js
// Adding the option includeTriggerModifications allows you
// to run statements on tables that contain triggers.
// Only affects MSSQL.
knex('books')
  .returning(['id', 'title'], { includeTriggerModifications: true })
  .insert({ title: 'Slaughterhouse Five' });
```

### transacting

**.transacting(transactionObj)**

Used by knex.transaction, the transacting method may be chained to any query and passed the object you wish to join the query as part of the transaction for.

```js
const Promise = require('bluebird');
knex
  .transaction(function (trx) {
    knex('books')
      .transacting(trx)
      .insert({ name: 'Old Books' })
      .then(function (resp) {
        const id = resp[0];
        return someExternalMethod(id, trx);
      })
      .then(trx.commit)
      .catch(trx.rollback);
  })
  .then(function (resp) {
    console.log('Transaction complete.');
  })
  .catch(function (err) {
    console.error(err);
  });
```

#### forUpdate

**.transacting(t).forUpdate()**

Dynamically added after a transaction is specified, the forUpdate adds a FOR UPDATE in PostgreSQL and MySQL during a select statement. Not supported on Amazon Redshift due to lack of table locks.

```js
knex('tableName').transacting(trx).forUpdate().select('*');
```

#### forShare

**.transacting(t).forShare()**

Dynamically added after a transaction is specified, the forShare adds a FOR SHARE in PostgreSQL and a LOCK IN SHARE MODE for MySQL during a select statement. Not supported on Amazon Redshift due to lack of table locks.

```js
knex('tableName').transacting(trx).forShare().select('*');
```

#### forNoKeyUpdate

**.transacting(t).forNoKeyUpdate()**

Dynamically added after a transaction is specified, the forNoKeyUpdate adds a FOR NO KEY UPDATE in PostgreSQL.

```js
knex('tableName').transacting(trx).forNoKeyUpdate().select('*');
```

#### forKeyShare

**.transacting(t).forKeyShare()**

Dynamically added after a transaction is specified, the forKeyShare adds a FOR KEY SHARE in PostgreSQL.

```js
knex('tableName').transacting(trx).forKeyShare().select('*');
```

### skipLocked

**.skipLocked()**

MySQL 8.0+, MariaDB-10.6+ and PostgreSQL 9.5+ only. This method can be used after a lock mode has been specified with either forUpdate or forShare, and will cause the query to skip any locked rows, returning an empty set if none are available.

```js
knex('tableName').select('*').forUpdate().skipLocked();
```

### noWait

**.noWait()**

MySQL 8.0+, MariaDB-10.3+ and PostgreSQL 9.5+ only. This method can be used after a lock mode has been specified with either forUpdate or forShare, and will cause the query to fail immediately if any selected rows are currently locked.

```js
knex('tableName').select('*').forUpdate().noWait();
```

### count

**.count(column|columns|raw, [options])**

Performs a count on the specified column or array of columns (note that some drivers do not support multiple columns). Also accepts raw expressions. The value returned from count (and other aggregation queries) is an array of objects like: `[{'COUNT(*)': 1}]`. The actual keys are dialect specific, so usually we would want to specify an alias (Refer examples below). Note that in Postgres, count returns a bigint type which will be a String and not a Number ([more info](https://github.com/brianc/node-pg-types#use)).

```js
knex('users').count('active');

knex('users').count('active', { as: 'a' });

knex('users').count('active as a');

knex('users').count({ a: 'active' });

knex('users').count({ a: 'active', v: 'valid' });

knex('users').count('id', 'active');

knex('users').count({ count: ['id', 'active'] });

knex('users').count(knex.raw('??', ['active']));
```

##### Usage with TypeScript

The value of count will, by default, have type of `string | number`. This may be counter-intuitive but some connectors (eg. postgres) will automatically cast BigInt result to string when javascript's Number type is not large enough for the value.

```ts
knex('users').count('age'); // Resolves to: Record<string, number | string>

knex('users').count({ count: '*' }); // Resolves to { count?: string | number | undefined; }
```

Working with `string | number` can be inconvenient if you are not working with large tables. Two alternatives are available:

```ts
// Be explicit about what you want as a result:
knex('users').count<Record<string, number>>('age');

// Setup a one time declaration to make knex use number as result type for all
// count and countDistinct invocations (for any table)
declare module 'knex/types/result' {
  interface Registry {
    Count: number;
  }
}
```

Use **countDistinct** to add a distinct expression inside the aggregate function.

```ts
knex('users').countDistinct('active');
```

### min

**.min(column|columns|raw, [options])**

Gets the minimum value for the specified column or array of columns (note that some drivers do not support multiple columns). Also accepts raw expressions.

```js
knex('users').min('age');

knex('users').min('age', { as: 'a' });

knex('users').min('age as a');

knex('users').min({ a: 'age' });

knex('users').min({ a: 'age', b: 'experience' });

knex('users').min('age', 'logins');

knex('users').min({ min: ['age', 'logins'] });

knex('users').min(knex.raw('??', ['age']));
```

### max

**.max(column|columns|raw, [options])**

Gets the maximum value for the specified column or array of columns (note that some drivers do not support multiple columns). Also accepts raw expressions.

```js
knex('users').max('age');

knex('users').max('age', { as: 'a' });

knex('users').max('age as a');

knex('users').max({ a: 'age' });

knex('users').max('age', 'logins');

knex('users').max({ max: ['age', 'logins'] });

knex('users').max({ max: 'age', exp: 'experience' });

knex('users').max(knex.raw('??', ['age']));
```

### sum

**.sum(column|columns|raw)**

Retrieve the sum of the values of a given column or array of columns (note that some drivers do not support multiple columns). Also accepts raw expressions.

```js
knex('users').sum('products');

knex('users').sum('products as p');

knex('users').sum({ p: 'products' });

knex('users').sum('products', 'orders');

knex('users').sum({ sum: ['products', 'orders'] });

knex('users').sum(knex.raw('??', ['products']));
```

Use **sumDistinct** to add a distinct expression inside the aggregate function.

```js
knex('users').sumDistinct('products');
```

### avg

**.avg(column|columns|raw)**

Retrieve the average of the values of a given column or array of columns (note that some drivers do not support multiple columns). Also accepts raw expressions.

```js
knex('users').avg('age');

knex('users').avg('age as a');

knex('users').avg({ a: 'age' });

knex('users').avg('age', 'logins');

knex('users').avg({ avg: ['age', 'logins'] });

knex('users').avg(knex.raw('??', ['age']));
```

Use **avgDistinct** to add a distinct expression inside the aggregate function.

```js
knex('users').avgDistinct('age');
```

### increment

**.increment(column, amount)**

Increments a column value by the specified amount. Object syntax is supported for `column`.

```js
knex('accounts').where('userid', '=', 1).increment('balance', 10);

knex('accounts').where('id', '=', 1).increment({
  balance: 10,
  times: 1,
});
```

### decrement

**.decrement(column, amount)**

Decrements a column value by the specified amount. Object syntax is supported for `column`.

```js
knex('accounts').where('userid', '=', 1).decrement('balance', 5);

knex('accounts').where('id', '=', 1).decrement({
  balance: 50,
});
```

### truncate

**.truncate()**

Truncates the current table.

```js
knex('accounts').truncate();
```

### pluck

**.pluck(id)**

This will pluck the specified column from each row in your results, yielding a promise which resolves to the array of values selected.

```js
knex
  .table('users')
  .pluck('id')
  .then(function (ids) {
    console.log(ids);
  });
```

### first

**.first([columns])**

Similar to select, but only retrieves & resolves with the first record from the query.

```js
knex
  .table('users')
  .first('id', 'name')
  .then(function (row) {
    console.log(row);
  });
```

### hintComment

**.hintComment(hint|hints)**

Add hints to the query using comment-like syntax `/*+ ... */`. MySQL and Oracle use this syntax for optimizer hints. Also various DB proxies and routers use this syntax to pass hints to alter their behavior. In other dialects the hints are ignored as simple comments.

```js
knex('accounts').where('userid', '=', 1).hintComment('NO_ICP(accounts)');
```

### comment

**.comment(comment)**

Prepend comment to the sql query using the syntax `/* ... */`. Some characters are forbidden such as `/*`, `*/` and `?`.

```js
knex('users').where('id', '=', 1).comment('Get user by id');
```

### clone

**.clone()**

Clones the current query chain, useful for re-using partial query snippets in other queries without mutating the original.

### denseRank

**.denseRank(alias, ~mixed~)**

Add a dense_rank() call to your query. For all the following queries, alias can be set to a falsy value if not needed.

String Syntax — .denseRank(alias, orderByClause, \[partitionByClause\]) :

```js
knex('users').select('*').denseRank('alias_name', 'email', 'firstName');
```

It also accepts arrays of strings as argument :

```js
knex('users')
  .select('*')
  .denseRank('alias_name', ['email', 'address'], ['firstName', 'lastName']);
```

Raw Syntax — .denseRank(alias, rawQuery) :

```js
knex('users')
  .select('*')
  .denseRank('alias_name', knex.raw('order by ??', ['email']));
```

Function Syntax — .denseRank(alias, function) :

Use orderBy() and partitionBy() (both chainable) to build your query :

```js
knex('users')
  .select('*')
  .denseRank('alias_name', function () {
    this.orderBy('email').partitionBy('firstName');
  });
```

### rank

**.rank(alias, ~mixed~)**

Add a rank() call to your query. For all the following queries, alias can be set to a falsy value if not needed.

String Syntax — .rank(alias, orderByClause, \[partitionByClause\]) :

```js
knex('users').select('*').rank('alias_name', 'email', 'firstName');
```

It also accepts arrays of strings as argument :

```js
knex('users')
  .select('*')
  .rank('alias_name', ['email', 'address'], ['firstName', 'lastName']);
```

Raw Syntax — .rank(alias, rawQuery) :

```js
knex('users')
  .select('*')
  .rank('alias_name', knex.raw('order by ??', ['email']));
```

Function Syntax — .rank(alias, function) :

Use orderBy() and partitionBy() (both chainable) to build your query :

```js
knex('users')
  .select('*')
  .rank('alias_name', function () {
    this.orderBy('email').partitionBy('firstName');
  });
```

### rowNumber

**.rowNumber(alias, ~mixed~)**

Add a row_number() call to your query. For all the following queries, alias can be set to a falsy value if not needed.

String Syntax — .rowNumber(alias, orderByClause, \[partitionByClause\]) :

```js
knex('users').select('*').rowNumber('alias_name', 'email', 'firstName');
```

It also accepts arrays of strings as argument :

```js
knex('users')
  .select('*')
  .rowNumber('alias_name', ['email', 'address'], ['firstName', 'lastName']);
```

Raw Syntax — .rowNumber(alias, rawQuery) :

```js
knex('users')
  .select('*')
  .rowNumber('alias_name', knex.raw('order by ??', ['email']));
```

Function Syntax — .rowNumber(alias, function) :

Use orderBy() and partitionBy() (both chainable) to build your query :

```js
knex('users')
  .select('*')
  .rowNumber('alias_name', function () {
    this.orderBy('email').partitionBy('firstName');
  });
```

### partitionBy

**.partitionBy(column, direction)**

Partitions rowNumber, denseRank, rank after a specific column or columns. If direction is not supplied it will default to ascending order.

No direction sort :

```js
knex('users')
  .select('*')
  .rowNumber('alias_name', function () {
    this.partitionBy('firstName');
  });
```

With direction sort :

```js
knex('users')
  .select('*')
  .rowNumber('alias_name', function () {
    this.partitionBy('firstName', 'desc');
  });
```

With multiobject :

```js
knex('users')
  .select('*')
  .rowNumber('alias_name', function () {
    this.partitionBy([
      { column: 'firstName', order: 'asc' },
      { column: 'lastName', order: 'desc' },
    ]);
  });
```

### modify

**.modify(fn, \*arguments)**

Allows encapsulating and re-using query snippets and common behaviors as functions. The callback function should receive the query builder as its first argument, followed by the rest of the (optional) parameters passed to modify.

```js
const withUserName = function (queryBuilder, foreignKey) {
  queryBuilder
    .leftJoin('users', foreignKey, 'users.id')
    .select('users.user_name');
};
knex
  .table('articles')
  .select('title', 'body')
  .modify(withUserName, 'articles_user.id')
  .then(function (article) {
    console.log(article.user_name);
  });
```

### columnInfo

**.columnInfo([columnName])**

Returns an object with the column info about the current table, or an individual column if one is passed, returning an object with the following keys:

- **defaultValue**: the default value for the column
- **type**: the column type
- **maxLength**: the max length set for the column
- **nullable**: whether the column may be null

```js
knex('users')
  .columnInfo()
  .then(function (info) {
    /*...*/
  });
```

### debug

**.debug([enabled])**

Overrides the global debug setting for the current query chain. If enabled is omitted, query debugging will be turned on.

### connection

**.connection(dbConnection)**

The method sets the db connection to use for the query without using the connection pool. You should pass to it the same object that acquireConnection() for the corresponding driver returns

```ts
const Pool = require('pg-pool');
const pool = new Pool({
  /* ... */
});
const connection = await pool.connect();

try {
  return await knex.connection(connection); // knex here is a query builder with query already built
} catch (error) {
  // Process error
} finally {
  connection.release();
}
```

### options

**.options()**

Allows for mixing in additional options as defined by database client specific libraries:

```js
knex('accounts as a1')
  .leftJoin('accounts as a2', function () {
    this.on('a1.email', '<>', 'a2.email');
  })
  .select(['a1.email', 'a2.email'])
  .where(knex.raw('a1.id = 1'))
  .options({ nestTables: true, rowMode: 'array' })
  .limit(2)
  .then({
    /*...*/
  });
```

### queryContext

**.queryContext(context)**

Allows for configuring a context to be passed to the [wrapIdentifier](/guide/#wrapidentifier) and [postProcessResponse](/guide/#postprocessresponse) hooks:

```js
knex('accounts as a1')
  .queryContext({ foo: 'bar' })
  .select(['a1.email', 'a2.email']);
```

The context can be any kind of value and will be passed to the hooks without modification. However, note that **objects will be shallow-cloned** when a query builder instance is [cloned](#clone), which means that they will contain all the properties of the original object but will not be the same object reference. This allows modifying the context for the cloned query builder instance.

Calling `queryContext` with no arguments will return any context configured for the query builder instance.

##### Extending Query Builder

**Important:** this feature is experimental and its API may change in the future.

It allows to add custom function to the Query Builder.

Example:

```ts
const { knex } = require('knex');
knex.QueryBuilder.extend('customSelect', function (value) {
  return this.select(this.client.raw(`${value} as value`));
});

const meaningOfLife = await knex('accounts').customSelect(42);
```

If using TypeScript, you can extend the QueryBuilder interface with your custom method.

1.  Create a `knex.d.ts` file inside a `@types` folder (or any other folder).

```ts
// knex.d.ts

import { Knex as KnexOriginal } from 'knex';

declare module 'knex' {
  namespace Knex {
    interface QueryInterface {
      customSelect<TRecord, TResult>(
        value: number
      ): KnexOriginal.QueryBuilder<TRecord, TResult>;
    }
  }
}
```

2.  Add the new `@types` folder to `typeRoots` in your `tsconfig.json`.

```json
// tsconfig.json
{
  "compilerOptions": {
    "typeRoots": ["node_modules/@types", "@types"]
  }
}
```

## Where Clauses

Several methods exist to assist in dynamic where clauses. In many places functions may be used in place of values, constructing subqueries. In most places existing knex queries may be used to compose sub-queries, etc. Take a look at a few of the examples for each method for instruction on use:

**Important:** Supplying knex with an `undefined` value to any of the `where` functions will cause knex to throw an error during sql compilation. This is both for yours and our sake. Knex cannot know what to do with undefined values in a where clause, and generally it would be a programmatic error to supply one to begin with. The error will throw a message containing the type of query and the compiled query-string. Example:

```js
knex('accounts').where('login', undefined).select().toSQL();
```

### where

**.where(~mixed~)**  
**.orWhere**

Object Syntax:

```js
knex('users')
  .where({
    first_name: 'Test',
    last_name: 'User',
  })
  .select('id');
```

Key, Value:

```js
knex('users').where('id', 1);
```

Functions:

```js
knex('users')
  .where((builder) =>
    builder.whereIn('id', [1, 11, 15]).whereNotIn('id', [17, 19])
  )
  .andWhere(function () {
    this.where('id', '>', 10);
  });
```

Grouped Chain:

```js
knex('users')
  .where(function () {
    this.where('id', 1).orWhere('id', '>', 10);
  })
  .orWhere({ name: 'Tester' });
```

Operator:

```js
knex('users').where('columnName', 'like', '%rowlikeme%');
```

The above query demonstrates the common use case of returning all users for which a specific pattern appears within a designated column.

```js
knex('users').where('votes', '>', 100);

const subquery = knex('users')
  .where('votes', '>', 100)
  .andWhere('status', 'active')
  .orWhere('name', 'John')
  .select('id');

knex('accounts').where('id', 'in', subquery);
```

.orWhere with an object automatically wraps the statement and creates an `or (and - and - and)` clause

```js
knex('users').where('id', 1).orWhere({ votes: 100, user: 'knex' });
```

### whereNot

**.whereNot(~mixed~)**
**.orWhereNot**

Object Syntax:

```js
knex('users')
  .whereNot({
    first_name: 'Test',
    last_name: 'User',
  })
  .select('id');
```

Key, Value:

```js
knex('users').whereNot('id', 1);
```

Grouped Chain:

```js
knex('users')
  .whereNot(function () {
    this.where('id', 1).orWhereNot('id', '>', 10);
  })
  .orWhereNot({ name: 'Tester' });
```

Operator:

```js
knex('users').whereNot('votes', '>', 100);
```

::: warning
WhereNot is not suitable for "in" and "between" type subqueries. You should use "not in" and "not between" instead.
:::

```js
const subquery = knex('users')
  .whereNot('votes', '>', 100)
  .andWhere('status', 'active')
  .orWhere('name', 'John')
  .select('id');

knex('accounts').where('id', 'not in', subquery);
```

### whereIn

**.whereIn(column|columns, array|callback|builder)**  
**.orWhereIn**

Shorthand for .where('id', 'in', obj), the .whereIn and .orWhereIn methods add a "where in" clause to the query. Note that passing empty array as the value results in a query that never returns any rows (`WHERE 1 = 0`)

```js
knex
  .select('name')
  .from('users')
  .whereIn('id', [1, 2, 3])
  .orWhereIn('id', [4, 5, 6]);

knex
  .select('name')
  .from('users')
  .whereIn('account_id', function () {
    this.select('id').from('accounts');
  });

const subquery = knex.select('id').from('accounts');

knex.select('name').from('users').whereIn('account_id', subquery);

knex
  .select('name')
  .from('users')
  .whereIn(
    ['account_id', 'email'],
    [
      [3, 'test3@example.com'],
      [4, 'test4@example.com'],
    ]
  );

knex
  .select('name')
  .from('users')
  .whereIn(
    ['account_id', 'email'],
    knex.select('id', 'email').from('accounts')
  );
```

### whereNotIn

**.whereNotIn(column, array|callback|builder)**
**.orWhereNotIn**

```js
knex('users').whereNotIn('id', [1, 2, 3]);

knex('users').where('name', 'like', '%Test%').orWhereNotIn('id', [1, 2, 3]);
```

### whereNull

**.whereNull(column)**  
**.orWhereNull**

```js
knex('users').whereNull('updated_at');
```

### whereNotNull

**.whereNotNull(column)**  
**.orWhereNotNull**

```js
knex('users').whereNotNull('created_at');
```

### whereExists

**.whereExists(builder | callback)**  
**.orWhereExists**

```js
knex('users').whereExists(function () {
  this.select('*').from('accounts').whereRaw('users.account_id = accounts.id');
});

knex('users').whereExists(
  knex.select('*').from('accounts').whereRaw('users.account_id = accounts.id')
);
```

### whereNotExists

**.whereNotExists(builder | callback)**  
**.orWhereNotExists**

```js
knex('users').whereNotExists(function () {
  this.select('*').from('accounts').whereRaw('users.account_id = accounts.id');
});

knex('users').whereNotExists(
  knex.select('*').from('accounts').whereRaw('users.account_id = accounts.id')
);
```

### whereBetween

**.whereBetween(column, range)**  
**.orWhereBetween**

```js
knex('users').whereBetween('votes', [1, 100]);
```

### whereNotBetween

**.whereNotBetween(column, range)**  
**.orWhereNotBetween**

```js
knex('users').whereNotBetween('votes', [1, 100]);
```

### whereRaw

**.whereRaw(query, [bindings])**

Convenience helper for .where(knex.raw(query)).

```js
knex('users').whereRaw('id = ?', [1]);
```

### whereLike

**.whereLike(column, string|builder|raw)**  
**.orWhereLike**

Adds a where clause with case-sensitive substring comparison on a given column with a given value.

```js
knex('users').whereLike('email', '%mail%');

knex('users')
  .whereLike('email', '%mail%')
  .andWhereLike('email', '%.com')
  .orWhereLike('email', '%name%');
```

### whereILike

**.whereILike(column, string|builder|raw)**  
**.orWhereILike**

Adds a where clause with case-insensitive substring comparison on a given column with a given value.

```js
knex('users').whereILike('email', '%mail%');

knex('users')
  .whereILike('email', '%MAIL%')
  .andWhereILike('email', '%.COM')
  .orWhereILike('email', '%NAME%');
```

### whereJsonObject

**.whereJsonObject(column, string|json|builder|raw)**

Adds a where clause with json object comparison on given json column.

```js
knex('users').whereJsonObject('json_col', { name: 'user_name' });
```

### whereJsonPath

**.whereJsonPath(column, jsonPath, operator, value)**

Adds a where clause with comparison of a value returned by a JsonPath given an operator and a value.

```js
knex('users').whereJsonPath('json_col', '$.age', '>', 18);

knex('users').whereJsonPath('json_col', '$.name', '=', 'username');
```

### whereJsonSupersetOf

**.whereJsonSupersetOf(column, string|json|builder|raw)**

Adds a where clause where the comparison is true if a json given by the column include a given value. Only on MySQL, PostgreSQL and CockroachDB.

```js
knex('users').whereJsonSupersetOf('hobbies', { sport: 'foot' });
```

### whereJsonSubsetOf

**.whereJsonSubsetOf(column, string|json|builder|raw)**

Adds a where clause where the comparison is true if a json given by the column is included in a given value. Only on MySQL, PostgreSQL and CockroachDB.

```js
// given a hobby column with { "sport" : "tennis" },
// the where clause is true
knex('users').whereJsonSubsetOf('hobby', { sport: 'tennis', book: 'fantasy' });
```

## Join Methods

Several methods are provided which assist in building joins.

### join

**.join(table, first, [operator], second)**

The join builder can be used to specify joins between tables, with the first argument being the joining table, the next three arguments being the first join column, the join operator and the second join column, respectively.

```js
knex('users')
  .join('contacts', 'users.id', '=', 'contacts.user_id')
  .select('users.id', 'contacts.phone');

knex('users')
  .join('contacts', 'users.id', 'contacts.user_id')
  .select('users.id', 'contacts.phone');
```

For grouped joins, specify a function as the second argument for the join query, and use `on` with `orOn` or `andOn` to create joins that are grouped with parentheses.

```js
knex
  .select('*')
  .from('users')
  .join('accounts', function () {
    this.on('accounts.id', '=', 'users.account_id').orOn(
      'accounts.owner_id',
      '=',
      'users.id'
    );
  });
```

For nested join statements, specify a function as first argument of `on`, `orOn` or `andOn`

```js
knex
  .select('*')
  .from('users')
  .join('accounts', function () {
    this.on(function () {
      this.on('accounts.id', '=', 'users.account_id');
      this.orOn('accounts.owner_id', '=', 'users.id');
    });
  });
```

It is also possible to use an object to represent the join syntax.

```js
knex
  .select('*')
  .from('users')
  .join('accounts', { 'accounts.id': 'users.account_id' });
```

If you need to use a literal value (string, number, or boolean) in a join instead of a column, use `knex.raw`.

```js
knex
  .select('*')
  .from('users')
  .join('accounts', 'accounts.type', knex.raw('?', ['admin']));
```

### innerJoin

**.innerJoin(table, ~mixed~)**

```js
knex.from('users').innerJoin('accounts', 'users.id', 'accounts.user_id');

knex.table('users').innerJoin('accounts', 'users.id', '=', 'accounts.user_id');

knex('users').innerJoin('accounts', function () {
  this.on('accounts.id', '=', 'users.account_id').orOn(
    'accounts.owner_id',
    '=',
    'users.id'
  );
});
```

### leftJoin

**.leftJoin(table, ~mixed~)**

```js
knex
  .select('*')
  .from('users')
  .leftJoin('accounts', 'users.id', 'accounts.user_id');

knex
  .select('*')
  .from('users')
  .leftJoin('accounts', function () {
    this.on('accounts.id', '=', 'users.account_id').orOn(
      'accounts.owner_id',
      '=',
      'users.id'
    );
  });
```

### leftOuterJoin

**.leftOuterJoin(table, ~mixed~)**

```js
knex
  .select('*')
  .from('users')
  .leftOuterJoin('accounts', 'users.id', 'accounts.user_id');

knex
  .select('*')
  .from('users')
  .leftOuterJoin('accounts', function () {
    this.on('accounts.id', '=', 'users.account_id').orOn(
      'accounts.owner_id',
      '=',
      'users.id'
    );
  });
```

### rightJoin

**.rightJoin(table, ~mixed~)**

```js
knex
  .select('*')
  .from('users')
  .rightJoin('accounts', 'users.id', 'accounts.user_id');

knex
  .select('*')
  .from('users')
  .rightJoin('accounts', function () {
    this.on('accounts.id', '=', 'users.account_id').orOn(
      'accounts.owner_id',
      '=',
      'users.id'
    );
  });
```

### rightOuterJoin

**.rightOuterJoin(table, ~mixed~)**

```js
knex
  .select('*')
  .from('users')
  .rightOuterJoin('accounts', 'users.id', 'accounts.user_id');

knex
  .select('*')
  .from('users')
  .rightOuterJoin('accounts', function () {
    this.on('accounts.id', '=', 'users.account_id').orOn(
      'accounts.owner_id',
      '=',
      'users.id'
    );
  });
```

### fullOuterJoin

**.fullOuterJoin(table, ~mixed~)**

```js
knex
  .select('*')
  .from('users')
  .fullOuterJoin('accounts', 'users.id', 'accounts.user_id');

knex
  .select('*')
  .from('users')
  .fullOuterJoin('accounts', function () {
    this.on('accounts.id', '=', 'users.account_id').orOn(
      'accounts.owner_id',
      '=',
      'users.id'
    );
  });
```

### crossJoin

**.crossJoin(table, ~mixed~)**

Cross join conditions are only supported in MySQL and SQLite3. For join conditions rather use innerJoin.

```js
knex.select('*').from('users').crossJoin('accounts');

knex
  .select('*')
  .from('users')
  .crossJoin('accounts', 'users.id', 'accounts.user_id');

knex
  .select('*')
  .from('users')
  .crossJoin('accounts', function () {
    this.on('accounts.id', '=', 'users.account_id').orOn(
      'accounts.owner_id',
      '=',
      'users.id'
    );
  });
```

### joinRaw

**.joinRaw(sql, [bindings])**

```js
knex
  .select('*')
  .from('accounts')
  .joinRaw('natural full join table1')
  .where('id', 1);

knex
  .select('*')
  .from('accounts')
  .join(knex.raw('natural full join table1'))
  .where('id', 1);
```

## OnClauses

### onIn

**.onIn(column, values)**

Adds a onIn clause to the query.

```js
knex
  .select('*')
  .from('users')
  .join('contacts', function () {
    this.on('users.id', '=', 'contacts.id').onIn(
      'contacts.id',
      [7, 15, 23, 41]
    );
  });
```

### onNotIn

**.onNotIn(column, values)**

Adds a onNotIn clause to the query.

```js
knex
  .select('*')
  .from('users')
  .join('contacts', function () {
    this.on('users.id', '=', 'contacts.id').onNotIn(
      'contacts.id',
      [7, 15, 23, 41]
    );
  });
```

### onNull

**.onNull(column)**

Adds a onNull clause to the query.

```js
knex
  .select('*')
  .from('users')
  .join('contacts', function () {
    this.on('users.id', '=', 'contacts.id').onNull('contacts.email');
  });
```

### onNotNull

**.onNotNull(column)**

Adds a onNotNull clause to the query.

```js
knex
  .select('*')
  .from('users')
  .join('contacts', function () {
    this.on('users.id', '=', 'contacts.id').onNotNull('contacts.email');
  });
```

### onExists

**.onExists(builder | callback)**

Adds a onExists clause to the query.

```js
knex
  .select('*')
  .from('users')
  .join('contacts', function () {
    this.on('users.id', '=', 'contacts.id').onExists(function () {
      this.select('*')
        .from('accounts')
        .whereRaw('users.account_id = accounts.id');
    });
  });
```

### onNotExists

**.onNotExists(builder | callback)**

Adds a onNotExists clause to the query.

```js
knex
  .select('*')
  .from('users')
  .join('contacts', function () {
    this.on('users.id', '=', 'contacts.id').onNotExists(function () {
      this.select('*')
        .from('accounts')
        .whereRaw('users.account_id = accounts.id');
    });
  });
```

### onBetween

**.onBetween(column, range)**

Adds a onBetween clause to the query.

```js
knex
  .select('*')
  .from('users')
  .join('contacts', function () {
    this.on('users.id', '=', 'contacts.id').onBetween('contacts.id', [5, 30]);
  });
```

### onNotBetween

**.onNotBetween(column, range)**

Adds a onNotBetween clause to the query.

```js
knex
  .select('*')
  .from('users')
  .join('contacts', function () {
    this.on('users.id', '=', 'contacts.id').onNotBetween(
      'contacts.id',
      [5, 30]
    );
  });
```

### onJsonPathEquals

**.onJsonPathEquals(column, range)**

Adds a onJsonPathEquals clause to the query. The clause performs a join on value returned by two json paths on two json columns.

```js
knex('cities')
  .select('cities.name as cityName', 'country.name as countryName')
  .join('country', function () {
    this.onJsonPathEquals(
      // json column in cities
      'country_name',
      // json path to country name in 'country_name' column
      '$.country.name',
      // json column in country
      'description',
      // json field in 'description' column
      '$.name'
    );
  });
```

## ClearClauses

### clear

**.clear(statement)**

Clears the specified operator from the query. Available operators: 'select' alias 'columns', 'with', 'select', 'columns', 'where', 'union', 'join', 'group', 'order', 'having', 'limit', 'offset', 'counter', 'counters'. Counter(s) alias for method .clearCounter()

```js
knex
  .select('email', 'name')
  .from('users')
  .where('id', '<', 10)
  .clear('select')
  .clear('where');
```

### clearSelect

**.clearSelect()**

Deprecated, use clear('select'). Clears all select clauses from the query, excluding subqueries.

```js
knex.select('email', 'name').from('users').clearSelect();
```

### clearWhere

**.clearWhere()**

Deprecated, use clear('where'). Clears all where clauses from the query, excluding subqueries.

```js
knex.select('email', 'name').from('users').where('id', 1).clearWhere();
```

### clearGroup

**.clearGroup()**

Deprecated, use clear('group'). Clears all group clauses from the query, excluding subqueries.

```js
knex.select().from('users').groupBy('id').clearGroup();
```

### clearOrder

**.clearOrder()**

Deprecated, use clear('order'). Clears all order clauses from the query, excluding subqueries.

```js
knex.select().from('users').orderBy('name', 'desc').clearOrder();
```

### clearHaving

**.clearHaving()**

Deprecated, use clear('having'). Clears all having clauses from the query, excluding subqueries.

```js
knex.select().from('users').having('id', '>', 5).clearHaving();
```

### clearCounters

**.clearCounters()**

Clears all increments/decrements clauses from the query.

```js
knex('accounts')
  .where('id', '=', 1)
  .update({ email: 'foo@bar.com' })
  .decrement({
    balance: 50,
  })
  .clearCounters();
```

### distinct

**.distinct([\*columns])**

Sets a distinct clause on the query. If the parameter is falsy or empty array, method falls back to '\*'.

```js
// select distinct 'first_name' from customers
knex('customers').distinct('first_name', 'last_name');

// select which eliminates duplicate rows
knex('customers').distinct();
```

### distinctOn

**.distinctOn([\*columns])**

PostgreSQL only. Adds a distinctOn clause to the query.

```js
knex('users').distinctOn('age');
```

### groupBy

**.groupBy(\*names)**

Adds a group by clause to the query.

```js
knex('users').groupBy('count');
```

### groupByRaw

**.groupByRaw(sql)**

Adds a raw group by clause to the query.

```js
knex
  .select('year', knex.raw('SUM(profit)'))
  .from('sales')
  .groupByRaw('year WITH ROLLUP');
```

### orderBy

**.orderBy(column|columns, [direction], [nulls])**

Adds an order by clause to the query. column can be string, or list mixed with string and object. nulls specify where the nulls values are put (can be 'first' or 'last').

Single Column:

```js
knex('users').orderBy('email');

knex('users').orderBy('name', 'desc');

knex('users').orderBy('name', 'desc', 'first');
```

Multiple Columns:

```js
knex('users').orderBy(['email', { column: 'age', order: 'desc' }]);

knex('users').orderBy([{ column: 'email' }, { column: 'age', order: 'desc' }]);

knex('users').orderBy([
  { column: 'email' },
  { column: 'age', order: 'desc', nulls: 'last' },
]);
```

### orderByRaw

**.orderByRaw(sql)**

Adds an order by raw clause to the query.

```js
knex.select('*').from('table').orderByRaw('col DESC NULLS LAST');
```

## Having Clauses

### having

**.having(column, operator, value)**

Adds a having clause to the query.

```js
knex('users')
  .groupBy('count')
  .orderBy('name', 'desc')
  .having('count', '>', 100);
```

### havingIn

**.havingIn(column, values)**

Adds a havingIn clause to the query.

```js
knex.select('*').from('users').havingIn('id', [5, 3, 10, 17]);
```

### havingNotIn

**.havingNotIn(column, values)**

Adds a havingNotIn clause to the query.

```js
knex.select('*').from('users').havingNotIn('id', [5, 3, 10, 17]);
```

### havingNull

**.havingNull(column)**

Adds a havingNull clause to the query.

```js
knex.select('*').from('users').havingNull('email');
```

### havingNotNull

**.havingNotNull(column)**

Adds a havingNotNull clause to the query.

```js
knex.select('*').from('users').havingNotNull('email');
```

### havingExists

**.havingExists(builder | callback)**

Adds a havingExists clause to the query.

```js
knex
  .select('*')
  .from('users')
  .havingExists(function () {
    this.select('*')
      .from('accounts')
      .whereRaw('users.account_id = accounts.id');
  });
```

### havingNotExists

**.havingNotExists(builder | callback)**

Adds a havingNotExists clause to the query.

```js
knex
  .select('*')
  .from('users')
  .havingNotExists(function () {
    this.select('*')
      .from('accounts')
      .whereRaw('users.account_id = accounts.id');
  });
```

### havingBetween

**.havingBetween(column, range)**

Adds a havingBetween clause to the query.

```js
knex.select('*').from('users').havingBetween('id', [5, 10]);
```

### havingNotBetween

**.havingNotBetween(column, range)**

Adds a havingNotBetween clause to the query.

```js
knex.select('*').from('users').havingNotBetween('id', [5, 10]);
```

### havingRaw

**.havingRaw(sql, [bindings])**

Adds a havingRaw clause to the query.

```js
knex('users')
  .groupBy('count')
  .orderBy('name', 'desc')
  .havingRaw('count > ?', [100]);
```
