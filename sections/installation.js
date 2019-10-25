export default [
  {
    type: "heading",
    size: "lg",
    content: "Installation",
    href: "Installation"
  },
  {
    type: "text",
    content: "Knex can be used as an SQL query builder in both Node.JS and the browser, limited to WebSQL's constraints (like the inability to drop tables or read schemas). Composing SQL queries in the browser for execution on the server is highly discouraged, as this can be the cause of serious security vulnerabilities. The browser builds outside of WebSQL are primarily for learning purposes - for example, you can pop open the console and build queries on this page using the <a href=\"javascript:alert(knex)\">knex</a> object."
  },
  {
    type: "heading",
    size: "md",
    content: "Node.js",
    href: "Installation-node"
  },
  {
    type: "text",
    content: "The primary target environment for Knex is Node.js, you will need to install the `knex` library, and then install the appropriate database library: [`pg`](https://github.com/brianc/node-postgres) for PostgreSQL and Amazon Redshift, [`mysql`](https://github.com/felixge/node-mysql) for MySQL or MariaDB, [`sqlite3`](https://github.com/mapbox/node-sqlite3) for SQLite3, or [`mssql`](https://github.com/patriksimek/node-mssql) for MSSQL."
  },
  {
    type: "code",
    content: `
      $ npm install knex --save

      # Then add one of the following (adding a --save) flag:
      $ npm install pg
      $ npm install sqlite3
      $ npm install mysql
      $ npm install mysql2
      $ npm install oracledb
      $ npm install mssql
    `
  },
  {
    type: "text",
    content: "*If you want to use a MariaDB instance, you can use the `mysql` driver.*"
  },
  {
    type: "heading",
    size: "md",
    content: "Browser",
    href: "Installation-browser"
  },
  {
    type: "text",
    content: "Knex can be built using a JavaScript build tool such as [browserify](http://browserify.org/) or [webpack](https://github.com/webpack/webpack). In fact, this documentation uses a webpack build which [includes knex](https://github.com/knex/documentation/blob/a4de1b2eb50d6699f126be8d134f3d1acc4fc69d/components/Container.jsx#L3). View source on this page to see the browser build in-action (the global `knex` variable)."
  },
  {
    type: "heading",
    size: "md",
    content: "Initializing the Library",
    href: "Installation-client"
  },
  {
    type: "text",
    content: "The `knex` module is itself a function which takes a configuration object for Knex, accepting a few parameters. The `client` parameter is required and determines which client adapter will be used with the library."
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        client: 'mysql',
        connection: {
          host : '127.0.0.1',
          user : 'your_database_user',
          password : 'your_database_password',
          database : 'myapp_test'
        }
      });
    `
  },
  {
    type: "text",
    content: "The connection options are passed directly to the appropriate database client to create the connection, and may be either an object, or a connection string:"
  },
  {
    type: "info",
    content: "Note: Knex's PostgreSQL client allows you to set the initial search path for each connection automatically using an additional option \"searchPath\" as shown below."
  },
  {
    type: "code",
    language: "js",
    content: `
      var pg = require('knex')({
        client: 'pg',
        connection: process.env.PG_CONNECTION_STRING,
        searchPath: ['knex', 'public'],
      });
    `
  },
  {
    type: "info",
    content: "Note: When you use the SQLite3 adapter, there is a filename required, not a network connection. For example:"
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        client: 'sqlite3',
        connection: {
          filename: "./mydb.sqlite"
        }
      });
    `
  },
  {
    type: "info",
    content: "Note: The database version can be added in knex configuration, when you use the PostgreSQL adapter to connect a non-standard database."
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        client: 'pg',
        version: '7.2',
        connection: {
          host : '127.0.0.1',
          user : 'your_database_user',
          password : 'your_database_password',
          database : 'myapp_test'
        }
      });
    `
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        client: 'mysql',
        version: '5.7',
        connection: {
          host : '127.0.0.1',
          user : 'your_database_user',
          password : 'your_database_password',
          database : 'myapp_test'
        }
      });
    `
  },
  {
    type: "text",
    content: "You can also connect via an unix domain socket, which will ignore host and port."
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        client: 'mysql',
        connection: {
          socketPath : '/path/to/socket.sock',
          user : 'your_database_user',
          password : 'your_database_password',
          database : 'myapp_test'
        }
      });
    `
  },
  {
    type: "text",
    content: "`userParams` is an optional parameter that allows you to pass arbitrary parameters which will be accessible via `knex.userParams` property:"
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        client: 'mysql',
        connection: {
          host : '127.0.0.1',
          user : 'your_database_user',
          password : 'your_database_password',
          database : 'myapp_test'
        },
        userParams: {
          userParam1: '451'
        }
      });
    `
  },
  {
    type: "info",
    content: "Initializing the library should normally only ever happen once in your application, as it creates a connection pool for the current database, you should use the instance returned from the initialize call throughout your library."
  },
  {
    type: "text",
    content: "Specify the client for the particular flavour of SQL you are interested in."
  },
  {
    type: "code",
    language: "js",
    content: `
      var pg = require('knex')({client: 'pg'});
      knex('table').insert({a: 'b'}).returning('*').toString();
      // "insert into "table" ("a") values ('b')"

      pg('table').insert({a: 'b'}).returning('*').toString();
      // "insert into "table" ("a") values ('b') returning *"
    `
  },
  {
    type: "heading",
    size: "md",
    content: "Getting parametrized instance",
    href: "Installation-parametrization"
  },
  {
    type: "text",
    content: "You can call method `withUserParams` on a Knex instance if you want to get a copy (with same connections) with custom parameters (e. g. to execute same migrations with different parameters)"
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        // Params
      });
      
      var knexWithParams = knex.withUserParams({customUserParam: 'table1'});
      var customUserParam = knexWithParams.userParams.customUserParam;
    `
  },
  {
    type: "heading",
    size: "md",
    content: "Debugging",
    href: "Installation-debug"
  },
  {
    type: "text",
    content: "Passing a `debug: true` flag on your initialization object will turn on [debugging](#Builder-debug) for all queries."
  },
  {
    type: "heading",
    size: "md",
    content: "asyncStackTraces",
    href: "Installation-asyncStackTraces"
  },
  {
    type: "text",
    content: "Passing an `asyncStackTraces: true` flag on your initialization object will turn on stack trace capture for all query builders, raw queries and schema builders. When a DB driver returns an error, this previously captured stack trace is thrown instead of a new one. This helps to mitigate default behaviour of `await` in node.js/V8 which blows the stack away. \n This has small performance overhead, so it is advised to use only for development. Turned off by default."
  },
  {
    type: "heading",
    size: "md",
    content: "Pooling",
    href: "Installation-pooling"
  },
  {
    type: "text",
    content: [
      "The client created by the configuration initializes a connection pool, using the [tarn.js](https://github.com/vincit/tarn.js) library. This connection pool has a default setting of a `min: 2, max: 10` for the MySQL and PG libraries, and a single connection for sqlite3 (due to issues with utilizing multiple connections on a single file). To change the config settings for the pool, pass a `pool` option as one of the keys in the initialize block.",
      "Checkout the [tarn.js](https://github.com/vincit/tarn.js) library for more information."
    ]
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        client: 'mysql',
        connection: {
          host : '127.0.0.1',
          user : 'your_database_user',
          password : 'your_database_password',
          database : 'myapp_test'
        },
        pool: { min: 0, max: 7 }
      });
    `
  },
  {
    type: "text",
    content: "If you ever need to explicitly teardown the connection pool, you may use `knex.destroy([callback])`. You may use `knex.destroy` by passing a callback, or by chaining as a promise, just not both. To manually initialize a destroyed connection pool, you may use knex.initialize([config]), if no config is passed, it will use the first knex configuration used."
  },
  {
    type: "heading",
    size: "md",
    content: "afterCreate",
    href: "Installation-pooling-afterCreate"
  },
  {
    type: "text",
    content: "`afterCreate` callback (rawDriverConnection, done) is called when the pool aquires a new connection from the database server. done(err, connection) callback must be called for `knex` to be able to decide if the connection is ok or if it should be discarded right away from the pool."
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        client: 'pg',
        connection: {...},
        pool: {
          afterCreate: function (conn, done) {
            // in this example we use pg driver's connection API
            conn.query('SET timezone="UTC";', function (err) {
              if (err) {
                // first query failed, return error and don't try to make next query
                done(err, conn);
              } else {
                // do the second query...
                conn.query('SELECT set_limit(0.01);', function (err) {
                  // if err is not falsy, connection is discarded from pool
                  // if connection aquire was triggered by a query the error is passed to query promise
                  done(err, conn);
                });
              }
            });
          }
        }
      });
    `
  },
  {
    type: "heading",
    size: "md",
    content: "acquireConnectionTimeout",
    href: "Installation-acquireConnectionTimeout"
  },
  {
    type: "text",
    content: "`acquireConnectionTimeout` defaults to 60000ms and is used to determine how long knex should wait before throwing a timeout error when acquiring a connection is not possible. The most common cause for this is using up all the pool for transaction connections and then attempting to run queries outside of transactions while the pool is still full. The error thrown will provide information on the query the connection was for to simplify the job of locating the culprit."
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        client: 'pg',
        connection: {...},
        pool: {...},
        acquireConnectionTimeout: 10000
      });
    `
  },
  {
    type: "heading",
    size: "md",
    content: "fetchAsString",
    href: "Installation-fetchAsString"
  },
  {
    type: "text",
    content: "Utilized by Oracledb. An array of types. The valid types are 'DATE', 'NUMBER' and 'CLOB'. When any column having one of the specified types is queried, the column data is returned as a string instead of the default representation."
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        client: 'oracledb',
        connection: {...},
        fetchAsString: [ 'number', 'clob' ]
      });
    `
  },
  {
    type: "heading",
    size: "md",
    content: "Migrations",
    href: "Installation-migrations"
  },
  {
    type: "text",
    content: "For convenience, the any migration configuration may be specified when initializing the library. Read the [Migrations](#Migrations) section for more information and a full list of configuration options."
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        client: 'mysql',
        connection: {
          host : '127.0.0.1',
          user : 'your_database_user',
          password : 'your_database_password',
          database : 'myapp_test'
        },
        migrations: {
          tableName: 'migrations'
        }
      });
    `
  },
  {
    type: "heading",
    size: "md",
    content: "postProcessResponse",
    href: "Installation-post-process-response"
  },
  {
    type: "text",
    content: [
      "Hook for modifying returned rows, before passing them forward to user. One can do for example",
      "snake_case -> camelCase conversion for returned columns with this hook.",
      "The `queryContext` is only available if configured for a query builder instance via [queryContext](#Builder-queryContext)."
    ].join(' ')
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        client: 'mysql',
        // overly simplified snake_case -> camelCase converter
        postProcessResponse: (result, queryContext) => {
          // TODO: add special case for raw results (depends on dialect)
          if (Array.isArray(result)) {
            return result.map(row => convertToCamel(row));
          } else {
            return convertToCamel(result);
          }
        }
      });
    `
  },
  {
    type: "heading",
    size: "md",
    content: "wrapIdentifier",
    href: "Installation-wrap-identifier"
  },
  {
    type: "text",
    content: [
      "Knex supports transforming identifier names automatically to quoted versions for each dialect.",
      "For example `'Table.columnName as foo'` for PostgreSQL is converted to \"Table\".\"columnName\" as \"foo\".",
    ].join(' ')
  },
  {
    type: "text",
    content: [
      "With `wrapIdentifier` one may override the way how identifiers are transformed.",
      "It can be used to override default functionality and for example to help doing `camelCase` -> `snake_case` conversion.",
    ].join(' ')
  },
  {
    type: "text",
    content: [
      "Conversion function `wrapIdentifier(value, dialectImpl, context): string` gets each part of the identifier",
      "as a single `value`, the original conversion function from the dialect implementation and the `queryContext`,",
      "which is only available if configured for a query builder instance via [builder.queryContext](#Builder-queryContext),",
      "and for schema builder instances via [schema.queryContext](#Schema-queryContext) or [table.queryContext](#Schema-table-queryContext).",
      "For example, with the query builder, `knex('table').withSchema('foo').select('table.field as otherName').where('id', 1)` will call",
      "`wrapIdentifier` converter for following values `'table'`, `'foo'`, `'table'`, `'field'`, `'otherName'` and `'id'`.",
    ].join(' ')
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
        client: 'mysql',
        // overly simplified camelCase -> snake_case converter
        wrapIdentifier: (value, origImpl, queryContext) => origImpl(convertToSnakeCase(value))
      });
    `
  },
  {
    type: "heading",
    size: "md",
    content: "log",
    href: "Installation-log"
  },
  {
    type: "text",
    content: [
      "Knex contains some internal log functions for printing warnings, errors, deprecations, and debug information when applicable.",
      "These log functions typically log to the console, but can be overwritten using the log option and providing alternative functions.",
      "Different log functions can be used for separate knex instances.",
    ].join(' ')
  },
  {
    type: "code",
    language: "js",
    content: `
      var knex = require('knex')({
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
    `
  },
]
