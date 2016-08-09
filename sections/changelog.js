export default [
  {
    version: "master",
    date: "(unreleased)",
    changes: []
  },
  {
    version: "0.11.9",
    date: "21 Jul, 2016",
    changes: [
      "Reverted knex client breaking change (commit b74cd69e906), fixes #1587"
    ]
  },
  {
    version: "0.11.8",
    date: "21 Jul, 2016",
    changes: [
      "Oracledb dialect #990",
      "Documentation fix #1532",
      "Allow named bindings to be escaped. #1576",
      "Several bugs with MS SQL schema creation and installing from gihub fix #1577",
      "Fix incorrect escaping of backslashes in SqlString.escape #1545"
    ]
  },
  {
    version: "0.11.7",
    date: "19 Jun, 2016",
    changes: [
      "Add missing dependency. #1516"
    ]
  },
  {
    version: "0.11.6",
    date: "18 Jun, 2016",
    changes: [
      "Allow cancellation on timeout (MySQL) #1454",
      "Better bigint support. (MSSQL) #1445",
      "More consistent handling of `undefined` values in `QueryBuilder#where` and `Raw`. #1459",
      "Fix Webpack build. #1447",
      "Fix code that triggered Bluebird warnings. #1460, #1489",
      "Fix `ping` function. (Oracle) #1486",
      "Fix `columnInfo`. (MSSQL) #1464",
      "Fix `ColumnCompiler#binary`. (MSSQL) #1464",
      "Allow connection strings that do not contain a password. #1473",
      "Fix race condition in seed stubs. #1493",
      "Give each query a UUID. #1510"
    ]
  },
  {
    version: "0.11.5",
    date: "26 May, 2016",
    changes: [
      "Bugfix: Using `Raw` or `QueryBuilder` as a binding to `Raw` now works as intended."
    ]
  },
  {
    version: "0.11.4",
    date: "22 May, 2016",
    changes: [
      "Bugfix: Inconsistency of `.primary()` and `.dropPrimary()` between dialects #1430",
      "Feature: Allow using custom Client/Dialect (you can pass your own client in knex config) #1428",
      "Docs: Add documentation for .dropTimestamps #1432",
      "Bugfix: Fixed passing undefined fields for insert/update inside transaction #1423",
      "Feature: `batchInsert` with existing transaction #1354",
      "Build: eslint instead of jshint #1416",
      "Bugfix: Pooled connections not releasing #1382",
      "Bugfix: Support passing `knex.raw` to `.whereNot` #1402",
      "Docs: Fixed list of dialects which supports `.returning` #1398",
      "Bugfix: rename table does not fail anymore even with schema defined #1403"
    ]
  },
  {
    version: "0.11.3",
    date: "14 May, 2016",
    changes: [
      "Support nested joins. #1397"
    ]
  },
  {
    version: "0.11.2",
    date: "14 May, 2016",
    changes: [
      "Prevent crash on `knex seed:make`. #1389",
      "Improvements to `batchInsert`. #1391",
      "Improvements to inserting `DEFAULT` with `undefined` binding. #1396",
      "Correct generated code for adding/dropping multiple columns. (MSSQL) #1401"
    ]
  },
  {
    version: "0.11.1",
    date: "6 May, 2016",
    changes: [
      "Fix error in CLI command `migrate:make`. #1386"
    ]
  },
  {
    version: "0.11.0",
    date: "5 May, 2016",
    changes: [
      {
        title: "Breaking Changes:",
        items: [
          "`QueryBuilder#orWhere` joins multiple arguments with `AND`. #1164"
        ]
      },
      {
        title: "Other Changes:",
        items: [
          "Collate for columns. (MySQL) #1147",
          "Add `QueryBuilder#timeout`, `Raw#timeout`. #1201 #1260",
          "Exit with error code when appropriate. #1238",
          "MSSQL connection accepts `host` as an alias for `server` in accordance with other dialects. #1239",
          "Add `query-response` event. #1231",
          "Correct behaviour of sibling nested transactions. #1226",
          "Support `RETURNING` with `UPDATE`. (Oracle) #1253",
          "Throwing callbacks from transactions automatically rolls them back. #1257",
          "Fixes to named `Raw` bindings. #1251",
          "`timestamps` accepts an argument to set `NOT NULL` and default to current timestamp.",
          "Add `TableBuilder#inherits` for PostgreSQL. #601",
          "Wrap index names. #1289",
          "Restore coffeescript knexfiles and configurations. #1292",
          "Add `andWhereBetween` and `andWhereNotBetween` #1132",
          "Fix `valueForUndefined` failure. #1269",
          "`renameColumn` no longer drops default value or nullability. #1326",
          "Correct MySQL2 error handling. #1315",
          "Fix MSSQL `createTableIfNotExists`. #1362",
          "Fix MSSQL URL parsing. #1342",
          "Update Lodash to 4.6.0 #1242",
          "Update Bluebird to 3.3.4 #1279"
        ]
      }
    ]
  },
  {
    version: "0.10.0",
    date: "15 Feb, 2016",
    changes: [
      {
        title: "Breaking Changes:",
        items: [
          "`insert` and `update` now ignore `undefined` values. Back compatibility is provided through the option `useNullAsDefault`. #1174, #1043"
        ]
      },
      {
        title: "Other Changes:",
        items: [
          "Add [`countDistinct`](#Builder-countDistinct), [`avgDistinct`](#Builder-avgDistinct) and [`sumDistinct`](#Builder-sumDistinct). #1046",
          "Add [`schema.jsonb`](#Schema-jsonb). Deprecated `schema.json(column, true)`. #991",
          "Support binding identifiers with `??`. #1103",
          "Restore `query` event when triggered by transactions. #855",
          "Correct question mark escaping in rendered queries. #519, #1058",
          "Add per-dialect escaping, allowing quotes to be escaped correctly. #886, #1095",
          "Add MSSQL support. #1090",
          "Add migration locking. #1094",
          "Allow column aliases to contain `.`. #1181",
          "Add `batchInsert`. #1182",
          "Support non-array arguments to [`knex.raw`](#Raw-Bindings).",
          "Global `query-error` event. #1163",
          "Add `batchInsert`. #1182",
          "Better support for Mysql2 dialect options. #980",
          "Support for `acquireConnectionTimeout` default 60 seconds preventing #1040 from happening. #1177",
          "Fixed constraint name escaping when dropping a constraint. #1177",
          "Show also `.raw` queries in debug output. #1169",
          "Support for `cli` to use basic configuration without specific environment set. #1101"
        ]
      }
    ]
  },
  {
    version: "0.9.0",
    date: "Nov 2, 2015",
    changes: [
      "Fix error when merging `knex.raw` instances without arguments. #853",
      "Fix error that caused the connection to time out while streaming. #849",
      "Correctly parse SSL query parameter for PostgreSQL. #852",
      "Pass `compress` option to MySQL2\\. #843",
      "Schema: Use `timestamp with timezone` by default for `time`, `datetime` and `timestamp` for Oracle. #876",
      "Add [`QueryBuilder#modify`](#Builder-modify) #881",
      "Add LiveScript and Early Gray support for seeds and migrations.",
      "Add [`QueryBuilder#withSchema`](#Builder-withSchema) #518",
      "Allow escaping of `?` in `knex.raw` queries. #946",
      "Allow `0` in join clause. #953",
      "Add migration config to allow disabling/enabling transactions per migration. #834"
    ]
  },
  {
    version: "0.8.6",
    date: "May 20, 2015",
    changes: [
      "Fix for several transaction / migration issues, #832, #833, #834, #835."
    ]
  },
  {
    version: "0.8.5",
    date: "May 14, 2015",
    changes: [
      "Pool should be initialized if no pool options are specified."
    ]
  },
  {
    version: "0.8.4",
    date: "May 13, 2015",
    changes: [
      "Pool should not be initialized if {max: 0} is sent in config options."
    ]
  },
  {
    version: "0.8.3",
    date: "May 2, 2015",
    changes: [
      "Alias postgresql -> postgres in connection config options."
    ]
  },
  {
    version: "0.8.2",
    date: "May 1, 2015",
    changes: [
      "Fix regression in using query string in connection config."
    ]
  },
  {
    version: "0.8.1",
    date: "May 1, 2015",
    changes: [
      "Warn rather than error when implicit commits wipe out savepoints in mysql / mariadb, #805.",
      "Fix for incorrect seed config reference, #804."
    ]
  },
  {
    version: "0.8.0",
    date: "Apr 30, 2015",
    changes: [
      {
        title: "New Features:",
        items: [
          "Fixes several major outstanding bugs with the connection pool, switching to [Pool2](https://github.com/myndzi/pool2) in place of generic-pool-redux",
          "strong-oracle module support",
          "Nested transactions automatically become savepoints, with `commit` & `rollback` releasing or rolling back the current savepoint.",
          "Database seed file support, #391",
          "Improved support for sub-raw queries within raw statements",
          "Migrations are now wrapped in transactions where possible",
          "Subqueries supported in insert statements, #627",
          "Support for nested having, #572",
          "Support object syntax for joins, similar to \"where\" #743"
        ]
      },
      {
        title: "Major Changes:",
        items: [
          "Transactions are immediately invoked as A+ promises, #470 (this is a feature and should not actually break anything in practice)",
          "Heavy refactoring internal APIs (public APIs should not be affected)"
        ]
      },
      {
        title: "Other Changes:",
        items: [
          "Allow mysql2 to use non-default port, #588",
          "Support creating & dropping extensions in PostgreSQL, #540",
          "CLI support for knexfiles that do not provide environment keys, #527",
          "Added sqlite3 dialect version of whereRaw/andWhereRaw (#477)."
        ]
      }
    ]
  },
  {
    version: "0.7.5",
    date: "Mar 9, 2015",
    changes: [
      "Fix bug in validateMigrationList, (#697)."
    ]
  },
  {
    version: "0.7.4",
    date: "Feb 25, 2015",
    changes: [
      "Fix incorrect order of query parameters when using subqueries, #704",
      "Properly handle limit 0, (#655)",
      "Apply promise args from then instead of [explicitly passing](https://github.com/petkaantonov/bluebird/issues/482).",
      "Respect union parameter as last argument (#660).",
      "Added sqlite3 dialect version of whereRaw/andWhereRaw (#477).",
      "Fix SQLite dropColumn doesn't work for last column (#544).",
      "Add POSIX operator support for Postgres (#562)",
      "Sample seed files now correctly (#391)"
    ]
  },
  {
    version: "0.7.3",
    date: "Oct 3, 2014",
    changes: [
      "Support for `join(table, rawOrBuilder)` syntax.",
      "Fix for regression in PostgreSQL connection (#516)."
    ]
  },
  {
    version: "0.7.2",
    date: "Oct 1, 2014",
    changes: [
      "Fix for regression in migrations."
    ]
  },
  {
    version: "0.7.1",
    date: "Oct 1, 2014",
    changes: [
      "Better disconnect handling & pool removal for MySQL clients, #452."
    ]
  },
  {
    version: "0.7.0",
    date: "Oct 1, 2014",
    changes: [
      {
        title: "New Features:",
        items: [
          "Oracle support, #419",
          "Database seed file support, #391",
          "Improved support for sub-raw queries within raw statements"
        ]
      },
      {
        title: "Breaking Changes:",
        items: [
          "\"collate nocase\" no longer used by default in sqlite3 #396"
        ]
      },
      {
        title: "Other Changes:",
        items: [
          "Bumping Bluebird to ^2.x",
          "Transactions in websql are now a no-op (unsupported) #375",
          "Improved test suite",
          "knex.fn namespace as function helper (knex.fn.now), #372",
          "Better handling of disconnect errors",
          "Support for offset without limit, #446",
          "Chainable first method for mysql schema, #406",
          "Support for empty array in `whereIn`",
          "Create/drop schema for postgres, #511",
          "Inserting multiple rows with default values, #468",
          "Join columns are optional for cross-join, #508",
          "Flag for creating jsonb columns in Postgresql, #500"
        ]
      }
    ]
  },
  {
    version: "0.6.22",
    date: "July 10, 2014",
    changes: [
      "Bug fix for properly binding postgresql streaming queries, (#363)."
    ]
  },
  {
    version: "0.6.21",
    date: "July 9, 2014",
    changes: [
      "Bug fix for raw queries not being transaction context aware, (#351).",
      "Properly forward stream errors in sqlite3 runner, (#359)."
    ]
  },
  {
    version: "0.6.20",
    date: "June 30, 2014",
    changes: [
      "Allow case insensitive operators in sql clauses, (#344)."
    ]
  },
  {
    version: "0.6.19",
    date: "June 27, 2014",
    changes: [
      "Add `groupByRaw` / `orderByRaw` methods, better support for raw statements in group / order (#282).",
      "Support more config options for node-mysql2 dialect (#341).",
      "CLI help text fix, (#342)."
    ]
  },
  {
    version: "0.6.18",
    date: "June 25, 2014",
    changes: [
      "Patch for the method, calling without a handler should return the stream, not a promise (#337)."
    ]
  },
  {
    version: "0.6.17",
    date: "June 23, 2014",
    changes: [
      "Adding missing map / reduce proxies to bluebird's implementation."
    ]
  },
  {
    version: "0.6.16",
    date: "June 18, 2014",
    changes: [
      "Increment / decrement returns the number of affectedRows (#330).",
      "Allow --cwd option flag to be passed to CLI tool (#326)."
    ]
  },
  {
    version: "0.6.15",
    date: "June 14, 2014",
    changes: [
      "Added the as method for aliasing subqueries."
    ]
  },
  {
    version: "0.6.14",
    date: "June 14, 2014",
    changes: [
      "whereExists / whereNotExists may now take a query builder instance as well as a callback."
    ]
  },
  {
    version: "0.6.13",
    date: "June 12, 2014",
    changes: [
      "Fix regression with onUpdate / onDelete in PostgreSQL, (#308).",
      "Add missing `Promise` require to knex.js, unit test for knex.destroy (#314)."
    ]
  },
  {
    version: "0.6.12",
    date: "June 10, 2014",
    changes: [
      "Fix for regression with boolean default types in PostgreSQL."
    ]
  },
  {
    version: "0.6.11",
    date: "June 10, 2014",
    changes: [
      "Fix for regression with queries containing multiple order by statements in sqlite3."
    ]
  },
  {
    version: "0.6.10",
    date: "June 10, 2014",
    changes: [
      "Fix for big regression in memoization of column names from 0.5 -> 0.6."
    ]
  },
  {
    version: "0.6.9",
    date: "June 9, 2014",
    changes: [
      "Fix for regression in specificType method."
    ]
  },
  {
    version: "0.6.8",
    date: "June 9, 2014",
    changes: [
      "Package.json fix for CLI."
    ]
  },
  {
    version: "0.6.7",
    date: "June 9, 2014",
    changes: [
      "Adds support for [node-mysql2](https://github.com/sidorares/node-mysql2) library.",
      "Bundles CLI with the knex install, various related migrate CLI fixes."
    ]
  },
  {
    version: "0.6.6",
    date: "June 9, 2014",
    changes: [
      "console.warn rather than throw when adding foreignKeys in SQLite3.",
      "Add support for dropColumn in SQLite3.",
      "Document `raw.wrap`."
    ]
  },
  {
    version: "0.6.5",
    date: "June 9, 2014",
    changes: [
      "Add missing _ require to WebSQL builds."
    ]
  },
  {
    version: "0.6.4",
    date: "June 9, 2014",
    changes: [
      "Fix & document schema.raw method."
    ]
  },
  {
    version: "0.6.3",
    date: "June 6, 2014",
    changes: [
      "Schema methods on transaction object are now transaction aware (#301).",
      "Fix for resolved value from transactions, (#298).",
      "Undefined columns are not added to builder."
    ]
  },
  {
    version: "0.6.2",
    date: "June 4, 2014",
    changes: [
      "Fix regression in raw query output, (#297).",
      "Fix regression in \"pluck\" method (#296).",
      "Document [first](#Builder-first) method."
    ]
  },
  {
    version: "0.6.1",
    date: "June 4, 2014",
    changes: [
      "Reverting to using .npmignore, the \"files\" syntax forgot the knex.js file"
    ]
  },
  {
    version: "0.6.0",
    date: "June 4, 2014",
    changes: [
      {
        title: "Major Library refactor:",
        items: [
          "Major internal overhaul to clean up the various dialect code.",
          "Improved unit test suite.",
          "Support for the [mariasql](https://github.com/mscdex/node-mariasql) driver.",
          "More consistent use of raw query bindings throughout the library.",
          "Queries are more composable, may be injected in various points throughout the builder.",
          "Added [streaming](#Interfaces-Streams) interface",
          "Deprecated 5 argument [join](#Builder-join) in favor of additional join methods.",
          "The wrapValue function to allow for array column operations in PostgreSQL (#287).",
          "An explicit connection can be passed for any query (#56).",
          "Drop column support for sqlite3",
          "All schema actions are run sequentially on the same connection if chained.",
          "Schema actions can now be wrapped in a transaction",
          "`.references(tableName.columnName)` as shorthand for `.references(columnName).inTable(tableName)`",
          "`.join('table.column', 'otherTable.column')` as shorthand for .join('table.column', '=', 'otherTable.column')",
          "Streams are supported for selects, passing through to the streaming capabilities of node-mysql and node-postgres",
          "For More information, see this [pull-request](https://github.com/tgriesser/knex/pull/252)."
        ]
      }
    ]
  },
  {
    version: "0.5.15",
    date: "June 4, 2014",
    changes: [
      "Dropped indexes feature now functions correctly, (#278)."
    ]
  },
  {
    version: "0.5.14",
    date: "May 6, 2014",
    changes: [
      "Remove the charset encoding if it's utf8 for mysql, as it's the default but also currently causes some issues in recent versions of node-mysql."
    ]
  },
  {
    version: "0.5.13",
    date: "April 2, 2014",
    changes: [
      "Fix regression in array bindings for postgresql (#228)."
    ]
  },
  {
    version: "0.5.12",
    date: "Mar 31, 2014",
    changes: [
      "Add more operators for where clauses, including && (#226)."
    ]
  },
  {
    version: "0.5.11",
    date: "Mar 25, 2014",
    changes: [
      "`.where(col, 'is', null)` or `.where(col, 'is not', null)` are not supported (#221).",
      "Case insensitive `where` operators now allowed (#212).",
      "Fix bug in increment/decrement truncating to an integer (#210).",
      "Disconnected connections are now properly handled & removed from the pool (#206).",
      "Internal tweaks to binding concatenations for performance (#207)."
    ]
  },
  {
    version: "0.5.10",
    date: "Mar 19, 2014",
    changes: [
      "Add the .exec method to the internal promise shim."
    ]
  },
  {
    version: "0.5.9",
    date: "Mar 18, 2014",
    changes: [
      "Remove error'ed connections from the connection pool (#206), added support for node-postgres-pure (pg.js) (#200)."
    ]
  },
  {
    version: "0.5.8",
    date: "Feb 27, 2014",
    changes: [
      "Fix for chaining on forUpdate / forShare, adding map & reduce from bluebird."
    ]
  },
  {
    version: "0.5.7",
    date: "Feb 18, 2014",
    changes: [
      "Fix for a null limit / offset breaking query chain (#182)."
    ]
  },
  {
    version: "0.5.6",
    date: "Feb 5, 2014",
    changes: [
      "Bump bluebird dependency to ~1.0.0, fixing regression in Bluebird 1.0.2 (#176)."
    ]
  },
  {
    version: "0.5.5",
    date: "Jan 28, 2014",
    changes: [
      "Fix for the exit code on the migrations cli (#151).",
      "The `init` method in `knex.migrate` now uses `this.config` if one isn't passed in (#156)."
    ]
  },
  {
    version: "0.5.4",
    date: "Jan 7, 2014",
    changes: [
      "Fix for using raw statements in defaultTo schema builder methods (#146)."
    ]
  },
  {
    version: "0.5.3",
    date: "Jan 2, 2014",
    changes: [
      "Fix for incorrectly formed sql when aggregates are used with columns (#144)."
    ]
  },
  {
    version: "0.5.2",
    date: "Dec 18, 2013",
    changes: [
      "Adding passthrough \"catch\", \"finally\" to bluebird implementations, use bluebird's \"nodeify\" internally for exec."
    ]
  },
  {
    version: "0.5.1",
    date: "Dec 12, 2013",
    changes: [
      "The [returning](#Builder-returning) in PostgreSQL may now accept * or an array of columns to return. If either of these are passed, the response will be an array of objects rather than an array of values. Updates may also now use a `returning` value. (#132)",
      "Added `bigint` and `bigserial` type to PostgreSQL. (#111)",
      "Fix for the [specificType](#Schema-specificType) schema call (#118)",
      "Several fixes for migrations, including migration file path fixes, passing a Promise constructor to the migration `up` and `down` methods, allowing the \"knex\" module to be used globally, file ordering on migrations, and other small improvements. (#112-115, #125, #135)"
    ]
  },
  {
    version: "0.5.0",
    date: "Nov 25, 2013",
    changes: [
      "Initial pass at a [migration](#Migrations) api.",
      "Aggregate methods are no longer aliased as \"aggregate\", but may now be aliased and have more than one aggregate in a query (#108, #110).",
      "Adding bigint and bigserial to PostgreSQL (#111).",
      "Bugfix on increment/decrement values (#100).",
      "Bugfix with having method (#107).",
      "Switched from when.js to [bluebird](https://github.com/petkaantonov/bluebird) for promise implementation, with shim for backward compatibility.",
      "Switched from underscore to lodash, for semver reliability."
    ]
  },
  {
    version: "0.4.13",
    date: "Oct 31, 2013",
    changes: [
      "Fix for aggregate methods on toString and clone, (#98)."
    ]
  },
  {
    version: "0.4.12",
    date: "Oct 29, 2013",
    changes: [
      "Fix incorrect values passed to float in MySQL and decimal in PostgreSQL."
    ]
  },
  {
    version: "0.4.11",
    date: "Oct 15, 2013",
    changes: [
      "Fix potential sql injection vulnerability in orderBy, thanks to @sebgie."
    ]
  },
  {
    version: "0.4.10",
    date: "Oct 14, 2013",
    changes: [
      "Added [forUpdate](#Builder-forUpdate) and [forShare](#Builder-forShare) for select modes in transactions. (#84)",
      "Fix bug where current query chain type is not copied on [clone](#Builder-clone). (#90)",
      "Charset and collate are now added as methods on the schema builder. (#89)",
      "Added `into` as an alias of [from](#Builder-from), for builder syntax of: `insert(value).into(tableName)`",
      "Internal pool fixes. (#90)"
    ]
  },
  {
    version: "0.4.9",
    date: "Oct 7, 2013",
    changes: [
      "Fix for documentation of [hasColumn](#Schema-hasColumn), ensure that `hasColumn` works with MySQL (#87).",
      "More cleanup of error messages, showing the original error message concatenated with the sql and bindings."
    ]
  },
  {
    version: "0.4.8",
    date: "Oct 2, 2013",
    changes: [
      "Connections are no longer pushed back into the pool if they never existed to begin with (#85)."
    ]
  },
  {
    version: "0.4.7",
    date: "Sep 27, 2013",
    changes: [
      "The column is now a documented method on the builder api, and takes either an individual column or an array of columns to select."
    ]
  },
  {
    version: "0.4.6",
    date: "Sep 25, 2013",
    changes: [
      "Standardizing handling of errors for easier debugging, as noted in (#39)."
    ]
  },
  {
    version: "0.4.5",
    date: "Sep 24, 2013",
    changes: [
      "Fix for hasTable always returning true in MySQL (#82), fix where sql queries were duplicated with multiple calls on toSql with the schema builder."
    ]
  },
  {
    version: "0.4.4",
    date: "Sep 22, 2013",
    changes: [
      "Fix for debug method not properly debugging individual queries."
    ]
  },
  {
    version: "0.4.3",
    date: "Sep 18, 2013",
    changes: [
      "Fix for underscore not being defined in various grammar files."
    ]
  },
  {
    version: "0.4.2",
    date: "Sep 17, 2013",
    changes: [
      "Fix for an error being thrown when an initialized ClientBase instance was passed into Knex.initialize. pool.destroy now optionally accepts a callback to notify when it has completed draining and destroying all connections."
    ]
  },
  {
    version: "0.4.1",
    date: "Sep 16, 2013",
    changes: [
      "Cleanup from the 0.4.0 release, fix a potential exploit in \"where\" clauses pointed out by Andri Möll, fix for clients not being properly released from the pool #70, fix for where(\"foo\", \"<>\", null) doing an \"IS NULL\" statement."
    ]
  },
  {
    version: "0.4.0",
    date: "Sep 13, 2013",
    changes: [
      {
        title: "Breaking Changes:",
        items: [
          "Global state is no longer stored in the library, an instance is returned from `Knex.initialize`, so you will need to call this once and then reference this `knex` client elsewhere in your application.",
          "Lowercasing of `knex.raw`, `knex.transaction`, and `knex.schema`.",
          "Created columns are now nullable by default, unless `notNullable` is chained as an option.",
          "Keys created with `increments` are now assumed to be unsigned (MySQL) by default.",
          "The `destroyAllNow` is no longer called by the library on `process.exit` event. If you need to call it explicitly yourself, you may use `knex.client.destroyPool`"
        ]
      }
    ]
  },
  {
    version: "0.2.6",
    date: "Aug 29, 2013",
    changes: [
      "Reject the transaction promise if the transaction \"commit\" fails, (#50)."
    ]
  },
  {
    version: "0.2.5",
    date: "Aug 25, 2013",
    changes: [
      "Fix error if a callback isn't specified for exec, (#49)."
    ]
  },
  {
    version: "0.2.4",
    date: "Aug 22, 2013",
    changes: [
      "Fix SQLite3 delete not returning affected row count, (#45)."
    ]
  },
  {
    version: "0.2.3",
    date: "Aug 22, 2013",
    changes: [
      "Fix insert with default values in PostgreSQL and SQLite3, (#44)."
    ]
  },
  {
    version: "0.2.2",
    date: "Aug 20, 2013",
    changes: [
      "Allowing Raw queries to be passed as the primary table names."
    ]
  },
  {
    version: "0.2.1",
    date: "Aug 13, 2013",
    changes: [
      "Fix for an array passed to insert being mutated."
    ]
  },
  {
    version: "0.2.0",
    date: "Aug 7, 2013",
    changes: [
      {
        title: "Breaking changes:",
        items: [
          "[hasTable](#Schema-hasTable) now returns a boolean rather than a failed promise.",
          "Changed syntax for insert in postgresql, where the `id` is not assumed on inserts (#18). The second parameter of [insert](#Builder-insert) is now required to return an array of insert id's for the last insert.",
          "The [timestamp](#Schema-timestamp) method on the schema builder now uses a `dateTime` rather than a `timestamp`."
        ]
      }
    ]
  },
  {
    version: "0.1.8",
    date: "July 7, 2013",
    changes: [
      "Somehow missing the != operator. Using _.find rather than _.where in getCommandsByName(#22)."
    ]
  },
  {
    version: "0.1.7",
    date: "June 12, 2013",
    changes: [
      "Ensures unhandled errors in the exec callback interface are re-thrown."
    ]
  },
  {
    version: "0.1.6",
    date: "June 9, 2013",
    changes: [
      "Renaming beforeCreate to afterCreate. Better handling of errors in the connection pooling."
    ]
  },
  {
    version: "0.1.5",
    date: "June 9, 2013",
    changes: [
      "Added the ability to specify beforeCreate and beforeDestroy hooks on the initialize's options.pool to perform any necessary database setup/teardown on connections before use (#14). where and having may now accept Knex.Raw instances, for consistency (#15). Added an orHaving method to the builder. The ability to specify bindings on Raw queries has been removed."
    ]
  },
  {
    version: "0.1.4",
    date: "May 22, 2013",
    changes: [
      "defaultTo now accepts \"false\" for boolean columns, allows for empty strings as default values."
    ]
  },
  {
    version: "0.1.3",
    date: "May 18, 2013",
    changes: [
      "Enabling table aliases (#11). Fix for issues with transactions not functioning (#12)."
    ]
  },
  {
    version: "0.1.2",
    date: "May 15, 2013",
    changes: [
      "Bug fixes for groupBy (#7). Mysql using collation, charset config settings in createTable. Added engine on schemaBuilder specifier (#6). Other doc fixes, tests."
    ]
  },
  {
    version: "0.1.1",
    date: "May 14, 2013",
    changes: [
      "Bug fixes for sub-queries, minor changes to initializing \"main\" instance, adding \"pg\" as a valid parameter for the client name in the connection settings."
    ]
  },
  {
    version: "0.1.0",
    date: "May 13, 2013",
    changes: [
      "Initial Knex release."
    ]
  }
]
