# Recipes

## Using non-standard database that is compatible with PostgreSQL wire protocol (such as CockroachDB)

Specify PostgreSQL version that database you are using is compatible with protocol-wise using `version` option, e. g.:

```js
const knex = require('knex')({
  client: 'pg',
  version: '7.2',
  connection: {
    host: '127.0.0.1',
    user: 'your_database_user',
    password: 'your_database_password',
    database: 'myapp_test',
  },
});
```

Note that value of `version` option should be not the version of the database that you are using, but version of PostgreSQL that most closely matches functionality of the database that you are using. If not provided by database vendor, try using '7.2' as a baseline and keep increasing (within the range of existing PostgreSQL versions) until it starts (or stops) working.

There are also known incompatibilities with migrations for databases that do not support select for update. See https://github.com/tgriesser/knex/issues/2002 for a workaround.

## Connecting to MSSQL on Azure SQL Database

`{encrypt: true}` should be included in options branch of connection configuration:

```js
knex({
  client: 'mssql',
  connection: {
    database: 'mydatabase',
    server: 'myserver.database.windows.net',
    user: 'myuser',
    password: 'mypass',
    port: 1433,
    connectionTimeout: 30000,
    options: {
      encrypt: true,
    },
  },
});
```

[See all of node-mssql's connection options](https://github.com/tediousjs/node-mssql#configuration-1)

## Adding a full-text index for PostgreSQL

```js
exports.up = (knex) => {
  return knex.schema.createTable('foo', (table) => {
    table.increments('id');
    table.specificType('fulltext', 'tsvector');
    table.index('fulltext', null, 'gin');
  });
};
```

## DB access using SQLite and SQLCipher

After you build the SQLCipher source and the npm SQLite3 package, and encrypt your DB (look elsewhere for these things), then anytime you open your database, you need to provide your encryption key using the SQL statement:

```sql
PRAGMA KEY = 'secret'
```

This PRAGMA is more completely documented in the SQLCipher site. When working with Knex this is best done when opening the DB, via the following:

```js
const myDBConfig = {
  client: 'sqlite3',
  connection: {
    filename: 'myEncryptedSQLiteDbFile.db',
  },
  pool: {
    afterCreate: function (conn, done) {
      conn.run("PRAGMA KEY = 'secret'");
      done();
    },
  },
};
const knex = require('knex')(myDBConfig);
```

Of course embedding the key value in your code is a poor security practice. Instead, retrieve the 'secret' from elsewhere.

The key Knex thing to note here is the "afterCreate" function. This is documented in the knexjs.org site, but is not in the Table of Contents at this time, so do a browser find when on the site to get to it. It allows auto-updating DB settings when creating any new pool connections (of which there will only ever be one per file for Knex-SQLite).

If you don't use the "afterCreate" configuration, then you will need to run a knex.raw statement with each and every SQL you execute, something like as follows:

```js
return knex.raw("PRAGMA KEY = 'secret'").then(() =>
  knex('some_table')
    .select()
    .on('query-error', function (ex, obj) {
      console.log('KNEX select from some_table ERR ex:', ex, 'obj:', obj);
    })
);
```

## Maintaining changelog for seeds (version >= 0.16.0-next1)

In case you would like to use Knex.js changelog functionality to ensure your environments are only seeded once, but don't want to mix seed files with migration files, you can specify multiple directories as a source for your migrations:

```ts
await knex.migrate.latest({
  directory: [
    'src/services/orders/database/migrations',
    'src/services/orders/database/seeds',
  ],
  sortDirsSeparately: true,
  tableName: 'orders_migrations',
  schemaName: 'orders',
});
```

## Using explicit transaction management together with async code

```ts
await knex.transaction((trx) => {
  async function stuff() {
    trx.rollback(new Error('Foo'));
  }
  stuff().then(() => {
    // do something
  });
});
```

Or alternatively:

```ts
try {
  await knex.transaction((trx) => {
    async function stuff() {
      trx.rollback(new Error('always explicit rollback this time'));
    }
    stuff();
  });
  // transaction was committed
} catch (err) {
  // transaction was rolled back
}
```

(note that promise for `knex.transaction` resolves after transaction is rolled back or committed)

## Using parentheses with AND operator

In order to generate query along the lines of

```sql
SELECT "firstName", "lastName", "status"
FROM "userInfo"
WHERE "status" = 'active'
AND ("firstName" ILIKE '%Ali%' OR "lastName" ILIKE '%Ali%');
```

you need to use following approach:

```js
queryBuilder
  .where('status', status.uuid)
  .andWhere((qB) =>
    qB
      .where('firstName', 'ilike', `%${q}%`)
      .orWhere('lastName', 'ilike', `%${q}%`)
  );
```

## Calling an oracle stored procedure with bindout variables

How to call and retrieve output from an oracle stored procedure

```ts
const oracle = require('oracledb');
const bindVars = {
  input_var1: 6,
  input_var2: 7,
  output_var: {
    dir: oracle.BIND_OUT,
  },
  output_message: {
    dir: oracle.BIND_OUT,
  },
};

const sp =
  'BEGIN MULTIPLY_STORED_PROCEDURE(:input_var1, :input_var2, :output_var, :output_message); END;';
const results = await knex.raw(sp, bindVars);
console.log(results[0]); // 42
console.log(results[1]); // 6 * 7 is the answer to life
```

## Node instance doesn't stop after using knex

Make sure to close knex instance after execution to avoid Node process hanging due to open connections:

```js
async function migrate() {
  try {
    await knex.migrate.latest({
      /**config**/
    });
  } catch (e) {
    process.exit(1);
  } finally {
    try {
      knex.destroy();
    } catch (e) {
      // ignore
    }
  }
}

migrate();
```

## Manually Closing Streams

When using Knex's [stream interface](/guide/interfaces#streams), you can typically just `pipe` the return stream to any writable stream. However, with [`HTTPIncomingMessage`](http://nodejs.org/api/http.html#http_http_incomingmessage), you'll need to take special care to handle aborted requests.

An `HTTPIncomingMessage` object is typically called `request`. This is the first argument in `'request'` events emitted on `http.Server` instances. [Express's `req`](http://expressjs.com/4x/api.html#request) implements a compatible interface and Hapi exposes this object on [its request objects](http://hapijs.com/api#request-object) as `request.raw.req`.

You need to explicitly handle the case where an `HTTPIncomingMessage` is closed prematurely when streaming from a database with Knex. The easiest way to cause this is:

1. Visit an endpoint that takes several seconds to fully transmit a response
2. Close the browser window immediately after beginning the request

When this happens while you are streaming a query to a client, you need to manually tell Knex that it can release the database connection in use back to the connection pool.

```js
server.on('request', function (request, response) {
  const stream = knex.select('*').from('items').stream();
  request.on('close', stream.end.bind(stream));
});
```
