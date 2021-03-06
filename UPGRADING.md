## Upgrading to new knex.js versions

### Upgrading to version 0.95.0+

* TypeScript type exports changed significantly. While `import Knex from 'knex';` used to import the knex instantiation function, the namespace and the interface for the knex instantiation function/object, there is now a clear distinction between them:
```typescript
import { knex } from 'knex' // this is a function that you call to instantiate knex
import { Knex } from 'knex' // this is a namespace, and a type of a knex object
import KnexTimeoutError = Knex.KnexTimeoutError; // this is a class from the Knex namespace

const config: Knex.Config = {} // this is a type from the Knex namespace
const knexInstance: Knex = knex(config)
```

If your code looked like this:
```typescript
import knex from 'knex'

const config: knex.Config = {} // this is a type from the Knex namespace
const knexInstance = knex(config)
```

Change it to
```typescript
import { knex, Knex } from 'knex'

const config: Knex.Config = {} // this is a type from the Knex namespace
const knexInstance = knex(config)
```

* If you were importing types such as `Config` or `QueryBuilder` directly, use `Knex` namespace instead.

So change this:
```ts
import { QueryBuilder } from 'knex'

const qb: QueryBuilder = knex('table').select('*')
```

to this:
```ts
import { Knex } from 'knex'

const qb: Knex.QueryBuilder = knex('table').select('*')
```

* Syntax for QueryBuilder augmentation changed. Previously it looked like this:

```ts
declare module 'knex' {
    interface QueryBuilder {
      paginate<TResult = any[]>(params: IPaginateParams): KnexQB<any, IWithPagination<TResult>>;
  }
}
```

This should be changed into this:

```ts
declare module 'knex' {
  namespace Knex {
    interface QueryBuilder {
      paginate<TResult = any[]>(params: IPaginateParams): KnexQB<any, IWithPagination<TResult>>;
    }
  }
}
```

* TypeScript version 4.1+ is needed when using knex types now.

* MSSQL driver was completely reworked in order to address the multitude of connection pool, error handling and performance issues. Since the new implementation uses `tedious` library directly instead of `mssql`, please replace `mssql` with `tedious` in your dependencies if you are using a MSSQL database.

* Transaction rollback does not trigger a promise rejection for transactions with specified handler. If you want to preserve previous behavior, pass `config` object with `doNotRejectOnRollback: false`:
```js
  await knex.transaction(async trx => {
    const ids = await trx('catalogues')
      .insert({
        name: 'Old Books'
      }, 'id')
  }, { doNotRejectOnRollback: false });
```

* Connection url parsing changed from legacy [url.parse](https://nodejs.org/docs/latest-v10.x/api/url.html#url_legacy_url_api) to [WHATWG URL](https://nodejs.org/docs/latest-v10.x/api/url.html#url_the_whatwg_url_api). If you have symbols, unusual for a URL (not A-z, not digits, not dot, not dash) - check [Node.js docs](https://nodejs.org/docs/latest-v10.x/api/url.html#url_percent_encoding_in_urls) for details

* Global static `Knex.raw` support dropped, use instance `knex.raw` instead. (`require('knex').raw()` won't work anymore)

* v8 flags are no longer supported in cli. To pass these flags use [`NODE_OPTIONS` environment variable](https://nodejs.org/api/cli.html#cli_node_options_options).
  For example `NODE_OPTIONS="--max-old-space-size=1536" npm run knex`

* Clients are now classes instead of new-able functions. Please migrate your custom clients to classes.

```js
const Client = require('knex')
const {inherits} = require('util')

// old
function CustomClient(config) {
  Client.call(this, config);
  // construction logic
}
inherits(CustomClient, Client);
CustomClient.prototype.methodOverride = function () {
  // logic
}

// new
class CustomClient extends Client {
  // node 12+
  driverName = 'abcd';
  constructor(config) {
    super(config);
    this.driverName = 'abcd'; // bad way, will not work
    // construction logic
  }
  methodOverride() {
    // logic
  }
}
// alternative to declare driverName
CustomClient.prototype.driverName = 'abcd';
```

* There was a major internal restructuring and renaming effort. Most dialect-specific compilers/builder have dialect name as a prefix now. Also some files were moved. Make sure to make adjustments accordingly if you were referencing specific knex library files directly from your code.

* "first" and "pluck" can no longer be both chained on the same operation. Previously only the last one chained was used, now this would throw an error. 

* Trying to execute an operation resulting in an empty query such as inserting an empty array, will now throw an error on all database drivers.

### Upgrading to version 0.21.0+

* Node.js older than 10 is no longer supported, make sure to update your environment; 

### Upgrading to version 0.19.0+

* Passing unknown properties to connection pool configuration now throws errors (see https://github.com/Vincit/tarn.js/issues/19 for details);
* `beforeDestroy` pool configuration option was removed. You should use tarn.js event handlers if you still need similar functionality.

### Upgrading to version 0.18.0+

* Node.js older than 8 is no longer supported, make sure to update your environment;
* Knex returns native promises instead of bluebird ones now. You will need to update your code not to rely on bluebird-specific functionality;
* Knex.Promise was removed, use native promises;
* Promise is no longer passed to migrations and seeds, use native one;
* If you are using TypeScript, make sure to include 'es6' in compilerOptions.lib, otherwise you may get errors for methods `.catch()` and `then()` not being recognized.

### Upgrading to version 0.17.0+

* Generic support was implemented for TypeScript bindings, which may break TS builds in some edge cases. Please refer to https://knexjs.org/#typescript-support for more elaborate documentation.

### Upgrading to version 0.16.0+

* MSSQL: DB versions older than 2008 are no longer supported, make sure to update your DB;
* PostgreSQL|MySQL: it is recommended to use options object for `table.datetime` and `table.timestamp` methods instead of argument options. See documentation for these methods for more details; 
* Node 6: There are known issues with duplicate event listeners when using knex.js with Node.js 6 (resulting in MaxListenersExceededWarning under certain use-cases (such as reusing single knex instance to run migrations or seeds multiple times)). Please upgrade to Node.js 8+ as soon as possible (knex 0.17.0 will be dropping Node.js 6 support altogether);

### Upgrading to version 0.15.0+

* Node.js older than 6 is no longer supported, make sure to update your environment;

* MSSQL: Creating a unique index on the table targeted by stored procedures that were created with QUOTED_IDENTIFIER = OFF fails.

You can use this query to identify all affected stored procedures:

```
SELECT name = OBJECT_NAME([object_id]), uses_quoted_identifier
FROM sys.sql_modules
WHERE uses_quoted_identifier = 0;
```

The only known solution is to recreate all stored procedures with QUOTED_IDENTIFIER = OFF

* MariaDB: `mariadb` dialect is no longer supported;

Instead, use "mysql" or "mysql2" dialects.

### Upgrading to version 0.14.4+

* Including schema in tableName parameter in migrations no longer works, so this is invalid:

```js
await knex.migrate.latest({
    directory: 'src/services/orders/database/migrations',
    tableName: 'orders.orders_migrations'
})
```

Instead, starting from 0.14.5 you should use new parameter schemaName:

```js
await knex.migrate.latest({
    directory: 'src/services/orders/database/migrations',
    tableName: 'orders_migrations',
    schemaName: 'orders'
})
```

