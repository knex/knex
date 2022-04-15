# Installation


Knex can be used as an SQL query builder in both Node.JS and the browser, limited to WebSQL's constraints (like the inability to drop tables or read schemas). Composing SQL queries in the browser for execution on the server is highly discouraged, as this can be the cause of serious security vulnerabilities. The browser builds outside of WebSQL are primarily for learning purposes - for example, you can pop open the console and build queries on this page using the **knex** object.

## Node.js

The primary target environment for Knex is Node.js, you will need to install the `knex` library, and then install the appropriate database library: [`pg`](https://github.com/brianc/node-postgres) for PostgreSQL, CockroachDB and Amazon Redshift, [`pg-native`](https://github.com/brianc/node-pg-native) for PostgreSQL with native C++ `libpq` bindings (requires PostgresSQL installed to link against), [`mysql`](https://github.com/felixge/node-mysql) for MySQL or MariaDB, [`sqlite3`](https://github.com/mapbox/node-sqlite3) for SQLite3, or [`tedious`](https://github.com/tediousjs/tedious) for MSSQL.

```bash
$ npm install knex --save

# Then add one of the following (adding a --save) flag:
$ npm install pg
$ npm install pg-native
$ npm install @vscode/sqlite3 # required for sqlite
$ npm install better-sqlite3
$ npm install mysql
$ npm install mysql2
$ npm install oracledb
$ npm install tedious
```

_If you want to use CockroachDB or Redshift instance, you can use the `pg` driver._

_If you want to use a MariaDB instance, you can use the `mysql` driver._

## Browser

Knex can be built using a JavaScript build tool such as [browserify](http://browserify.org/) or [webpack](https://github.com/webpack/webpack). In fact, this documentation uses a webpack build which [includes knex](https://github.com/knex/documentation/blob/a4de1b2eb50d6699f126be8d134f3d1acc4fc69d/components/Container.jsx#L3). View source on this page to see the browser build in-action (the global `knex` variable).

## Configuration Options

The `knex` module is itself a function which takes a configuration object for Knex, accepting a few parameters. The `client` parameter is required and determines which client adapter will be used with the library.

```js
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test'
  }
});
```

The connection options are passed directly to the appropriate database client to create the connection, and may be either an object, a connection string, or a function returning an object:

::: info PostgreSQL
Knex's PostgreSQL client allows you to set the initial search path for each connection automatically using an additional option "searchPath" as shown below.

```js
const pg = require('knex')({
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
  searchPath: ['knex', 'public'],
});
```
:::

::: info SQLite3 or Better-SQLite3
When you use the SQLite3 or Better-SQLite3 adapter, there is a filename required, not a network connection. For example:

```js
const knex = require('knex')({
  client: 'sqlite3', // or 'better-sqlite3'
  connection: {
    filename: "./mydb.sqlite"
  }
});
```

 You can also run either SQLite3 or Better-SQLite3 with an in-memory database by providing `:memory:` as the filename. For example:

```js
const knex = require('knex')({
  client: 'sqlite3', // or 'better-sqlite3'
  connection: {
    filename: ":memory:"
  }
});
```
::: 

::: info SQLite3
When you use the SQLite3 adapter, you can set flags used to open the connection. For example:

```js
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: "file:memDb1?mode=memory&cache=shared",
    flags: ['OPEN_URI', 'OPEN_SHAREDCACHE']
  }
});
```
::: 

::: info 
The database version can be added in knex configuration, when you use the PostgreSQL adapter to connect a non-standard database.

```js
const knex = require('knex')({
  client: 'pg',
  version: '7.2',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test'
  }
});
```

```js
const knex = require('knex')({
  client: 'mysql',
  version: '5.7',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test'
  }
});
```
::: 

A function can be used to determine the connection configuration dynamically. This function receives no parameters, and returns either a configuration object or a promise for a configuration object.

```js
const knex = require('knex')({
  client: 'sqlite3',
  connection: () => ({
    filename: process.env.SQLITE_FILENAME
  })
});
```

By default, the configuration object received via a function is cached and reused for all connections. To change this behavior, an `expirationChecker` function can be returned as part of the configuration object. The `expirationChecker` is consulted before trying to create new connections, and in case it returns `true`, a new configuration object is retrieved. For example, to work with an authentication token that has a limited lifespan:

```js
const knex = require('knex')({
  client: 'postgres',
  connection: async () => {
    const { 
      token, 
      tokenExpiration 
    } = await someCallToGetTheToken();

    return {
      host : 'your_host',
      port : 3306,
      user : 'your_database_user',
      password : token,
      database : 'myapp_test',
      expirationChecker: () => {
        return tokenExpiration <= Date.now();
      }
    };
  }
});
```

You can also connect via an unix domain socket, which will ignore host and port.

```js
const knex = require('knex')({
  client: 'mysql',
  connection: {
    socketPath : '/path/to/socket.sock',
    user : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test'
  }
});
```

`userParams` is an optional parameter that allows you to pass arbitrary parameters which will be accessible via `knex.userParams` property:

```js
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test'
  },
  userParams: {
    userParam1: '451'
  }
});
```

Initializing the library should normally only ever happen once in your application, as it creates a connection pool for the current database, you should use the instance returned from the initialize call throughout your library.

Specify the client for the particular flavour of SQL you are interested in.

```js
const pg = require('knex')({client: 'pg'});

knex('table')
  .insert({a: 'b'})
  .returning('*')
  .toString();
// "insert into "table" ("a") values ('b')"

pg('table')
  .insert({a: 'b'})
  .returning('*')
  .toString();
// "insert into "table" ("a") values ('b') returning *"
```

### withUserParams

You can call method `withUserParams` on a Knex instance if you want to get a copy (with same connections) with custom parameters (e. g. to execute same migrations with different parameters)

```js
const knex = require('knex')({
  // Params
});

const knexWithParams = knex.withUserParams({ 
  customUserParam: 'table1'
});
const customUserParam = knexWithParams
  .userParams
  .customUserParam;
```

### debug

Passing a `debug: true` flag on your initialization object will turn on [debugging](#Builder-debug) for all queries.

### asyncStackTraces

Passing an `asyncStackTraces: true` flag on your initialization object will turn on stack trace capture for all query builders, raw queries and schema builders. When a DB driver returns an error, this previously captured stack trace is thrown instead of a new one. This helps to mitigate default behaviour of `await` in node.js/V8 which blows the stack away. This has small performance overhead, so it is advised to use only for development. Turned off by default.

### pool

The client created by the configuration initializes a connection pool, using the [tarn.js](https://github.com/vincit/tarn.js) library. This connection pool has a default setting of a `min: 2, max: 10` for the MySQL and PG libraries, and a single connection for sqlite3 (due to issues with utilizing multiple connections on a single file). To change the config settings for the pool, pass a `pool` option as one of the keys in the initialize block.

Checkout the [tarn.js](https://github.com/vincit/tarn.js) library for more information.

```js
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test'
  },
  pool: { min: 0, max: 7 }
});
```

If you ever need to explicitly teardown the connection pool, you may use `knex.destroy([callback])`. You may use `knex.destroy` by passing a callback, or by chaining as a promise, just not both. To manually initialize a destroyed connection pool, you may use knex.initialize(\[config\]), if no config is passed, it will use the first knex configuration used.

### afterCreate

`afterCreate` callback (rawDriverConnection, done) is called when the pool aquires a new connection from the database server. done(err, connection) callback must be called for `knex` to be able to decide if the connection is ok or if it should be discarded right away from the pool.

```js
const knex = require('knex')({
  client: 'pg',
  connection: {/*...*/},
  pool: {
    afterCreate: function (conn, done) {
      // in this example we use pg driver's connection API
      conn.query('SET timezone="UTC";', function (err) {
        if (err) {
          // first query failed, 
          // return error and don't try to make next query
          done(err, conn);
        } else {
          // do the second query...
          conn.query(
            'SELECT set_limit(0.01);', 
            function (err) {
              // if err is not falsy, 
              //  connection is discarded from pool
              // if connection aquire was triggered by a 
              // query the error is passed to query promise
              done(err, conn);
            });
        }
      });
    }
  }
});
```

### acquireConnectionTimeout

`acquireConnectionTimeout` defaults to 60000ms and is used to determine how long knex should wait before throwing a timeout error when acquiring a connection is not possible. The most common cause for this is using up all the pool for transaction connections and then attempting to run queries outside of transactions while the pool is still full. The error thrown will provide information on the query the connection was for to simplify the job of locating the culprit.

```js
const knex = require('knex')({
  client: 'pg',
  connection: {/*...*/},
  pool: {/*...*/},
  acquireConnectionTimeout: 10000
});
```

### fetchAsString

Utilized by Oracledb. An array of types. The valid types are 'DATE', 'NUMBER' and 'CLOB'. When any column having one of the specified types is queried, the column data is returned as a string instead of the default representation.

```js
const knex = require('knex')({
  client: 'oracledb',
  connection: {/*...*/},
  fetchAsString: [ 'number', 'clob' ]
});
```

### migrations

For convenience, the any migration configuration may be specified when initializing the library. Read the [Migrations](#Migrations) section for more information and a full list of configuration options.

```js
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test'
  },
  migrations: {
    tableName: 'migrations'
  }
});
```

### postProcessResponse

Hook for modifying returned rows, before passing them forward to user. One can do for example snake\_case -> camelCase conversion for returned columns with this hook. The `queryContext` is only available if configured for a query builder instance via [queryContext](#Builder-queryContext).

```js
const knex = require('knex')({
  client: 'mysql',
  // overly simplified snake_case -> camelCase converter
  postProcessResponse: (result, queryContext) => {
    // TODO: add special case for raw results 
    // (depends on dialect)
    if (Array.isArray(result)) {
      return result.map(row => convertToCamel(row));
    } else {
      return convertToCamel(result);
    }
  }
});
```

### wrapIdentifier

Knex supports transforming identifier names automatically to quoted versions for each dialect. For example `'Table.columnName as foo'` for PostgreSQL is converted to "Table"."columnName" as "foo".

With `wrapIdentifier` one may override the way how identifiers are transformed. It can be used to override default functionality and for example to help doing `camelCase` -> `snake_case` conversion.

Conversion function `wrapIdentifier(value, dialectImpl, context): string` gets each part of the identifier as a single `value`, the original conversion function from the dialect implementation and the `queryContext`, which is only available if configured for a query builder instance via [builder.queryContext](#Builder-queryContext), and for schema builder instances via [schema.queryContext](#Schema-queryContext) or [table.queryContext](#Schema-table-queryContext). For example, with the query builder, `knex('table').withSchema('foo').select('table.field as otherName').where('id', 1)` will call `wrapIdentifier` converter for following values `'table'`, `'foo'`, `'table'`, `'field'`, `'otherName'` and `'id'`.

```js
const knex = require('knex')({
  client: 'mysql',
  // overly simplified camelCase -> snake_case converter
  wrapIdentifier: (
    value, 
    origImpl, 
    queryContext
  ) => origImpl(convertToSnakeCase(value))
});
```

### log

Knex contains some internal log functions for printing warnings, errors, deprecations, and debug information when applicable. These log functions typically log to the console, but can be overwritten using the log option and providing alternative functions. Different log functions can be used for separate knex instances.

```js
const knex = require('knex')({
  log: {
    warn(message) {
    },
    error(message) {
    },
    deprecate(message) {
    },
    debug(message) {
    },
  }
});
```

## TypeScript 

While knex is written in JavaScript, officially supported TypeScript bindings are available (within the knex npm package).

However it is to be noted that TypeScript support is currently best-effort. Knex has a very flexible API and not all usage patterns can be type-checked and in most such cases we err on the side of flexibility. In particular, lack of type errors doesn't currently guarantee that the generated queries will be correct and therefore writing tests for them is recommended even if you are using TypeScript.

Many of the APIs accept `TRecord` and `TResult` type parameters, using which we can specify the type of a row in the database table and the type of the result of the query respectively. This is helpful for auto-completion when using TypeScript-aware editors like VSCode.

To reduce boilerplate and add inferred types, you can augment `Tables` interface in `'knex/types/tables'` module.

```ts
import { knex } from 'knex';

declare module 'knex/types/tables' {
  interface User {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
  }
  
  interface Tables {
    // This is same as specifying `knex<User>('users')`
    users: User;
    // For more advanced types, you can specify separate type
    // for base model, "insert" type and "update" type.
    // But first: notice that if you choose to use this, 
    // the basic typing showed above can be ignored.
    // So, this is like specifying
    //    knex
    //    .insert<{ name: string }>({ name: 'name' })
    //    .into<{ name: string, id: number }>('users')
    users_composite: Knex.CompositeTableType<
      // This interface will be used for return type and 
      // `where`, `having` etc where full type is required 
      User,
      // Specifying "insert" type will also make sure
      // data matches interface in full. Meaning
      // if interface is `{ a: string, b: string }`,
      // `insert({ a: '' })` will complain about missing fields.
      // 
      // For example, this will require only "name" field when inserting
      // and make created_at and updated_at optional.
      // And "id" can't be provided at all.
      // Defaults to "base" type.
      Pick<User, 'name'> & Partial<Pick<User, 'created_at' | 'updated_at'>>,
      // This interface is used for "update()" calls.
      // As opposed to regular specifying interface only once,
      // when specifying separate update interface, user will be
      // required to match it  exactly. So it's recommended to
      // provide partial interfaces for "update". Unless you want to always
      // require some field (e.g., `Partial<User> & { updated_at: string }`
      // will allow updating any field for User but require updated_at to be
      // always provided as well.
      // 
      // For example, this wil allow updating all fields except "id".
      // "id" will still be usable for `where` clauses so
      //      knex('users_composite')
      //      .update({ name: 'name2' })
      //      .where('id', 10)`
      // will still work.
      // Defaults to Partial "insert" type
      Partial<Omit<User, 'id'>>
    >;
  }
}
```
