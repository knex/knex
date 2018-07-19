
# Master (Unreleased)

# 0.15.2 - 19 Jul, 2018

### Changes:

- Rolled back changes introduced by #2542, in favor of opt-in behavior by adding a precision option in `date` / `timestamp` / `datetime` / `knex.fn.now` (#2715, #2721)

# 0.15.1 - 12 Jul, 2018

### Bug fixes:

- Fix warning erroneously displayed for mysql #2705

# 0.15.0 - 1 Jul, 2018

### Breaking Changes:

- Stop executing tests on Node 4 and 5. #2451 (not supported anymore)
- `json` data type is no longer converted to `text` within a schema builder migration for MySQL databases (note that JSON data type is only supported for MySQL 5.7.8+)  #2635
- Removed WebSQL dialect #2461
- Drop mariadb support #2681
- Primary Key for Migration Lock Table #2569. This shouldn't affect to old loc tables, but if you like to have your locktable to have primary key, delete the old table and it will be recreated when migrations are ran next time.
- Ensure knex.destroy() returns a bluebird promise #2589
- Increment floats #2614
- Testing removal of 'skim' #2520, Now rows are not converted to plain js objects, returned row objects might have changed type with oracle, mssql, mysql and sqlite3
- Drop support for strong-oracle #2487
- Timeout errors doesn't silently ignore the passed errors anymore #2626
- Removed WebSQL dialect #2647
- Various fixes to mssql dialect to make it compatible with other dialects #2653, Unique constraint now allow multiple null values, float type is now float instaed of decimal, rolling back transaction with undefined rejects with Error, select for update and select for share actually locks selected row, so basically old schema migrations will work a lot different and produce different schema like before. Also now MSSQL is included in CI tests.

### Bug fixes:

- Fixes onIn with empty values array #2513
- fix wrapIdentifier not being called in postgres alter column #2612
- fixes wrapIdentifier to work with postgres `returning` statement 2630 #2642
- Fix mssql driver crashing in certain cases when conneciton is closed unexpectedly #2637
- Removed semicolon from rollback stmt for oracle #2564
- Make the stream catch errors in the query #2638

### New Features:

- Create timestamp columns with microsecond precision on MySQL 5.6 and newer #2542
- Allow storing stacktrace, where builder is initialized to be able trace back where certain query was created #2500 #2505
- Added 'ref' function #2509, no need for knex.raw('??', ['id']) anymore, one can do  knex.ref('id')
- Support postgresql connection uri protocol #2609
- Add support for native enums on Postgres #2632
- Allow overwriting log functions #2625

### Test / internal changes

- chore: cache node_modules #2595
- Remove babel-plugin-lodash #2634
- Remove readable-stream and safe-buffer #2640
- chore: add Node.js 10 #2594
- add homepage field to package.json #2650

# 0.14.6 - 12 Apr, 2018

### Bug fixes:

- Restored functionality of query event #2566 (#2549)

# 0.14.5 - 8 Apr, 2018

### Bug fixes:

- Fix wrapping returning column on oracledb #2554

### New Features:

- Support passing DB schema name for migrations #2499 #2559
- add clearOrder method #2360 #2553
- Added knexTxId to query events and debug calls #2476
- Support multi-column `whereIn` with query #1390
- Added error if chaining update/insert/etc with first() #2506
- Checks for an empty, undefined or null object on transacting #2494
- countDistinct with multiple columns #2449

### Test / internal changes

- Added npm run test:oracledb command that runs oracledb tests in docker #2491
- Runnin mssql tests in docker #2496
- Update dependencies #2561

# 0.14.4 - 19 Feb, 2018

### Bug fixes:

- containsUndefined only validate plain objects. Fixes #1898 (#2468)
- Add warning when using .returning() in sqlite3. Fixes #1660 (#2471)
- Throw an error if .update() results in an empty sql (#2472)
- Removed unnecessary createTableIfNotExist and replaced with createTable (#2473)

### New Features:

- Allow calling lock procedures (such as forUpdate) outside of transaction. Fixes #2403. (#2475)
- Added test and documentation for Event 'start' (#2488)

### Test / internal changes

- Added stress test, which uses TCP proxy to simulate flaky connection #2460
- Removed old docker tests, new stress test setup (#2474)
- Removed unused property __cid on the base client (#2481)
- Changed rm to rimraf in 'npm run dev' (#2483)
- Changed babel preset and use latest node as target when running dev (#2484)

# 0.14.3 - 8 Feb, 2018

### Bug fixes:

- Use tarn as pool instead of generic-pool which has been given various problems #2450
- Fixed mysql issue where add columns failed if using both after and collate #2432
- CLI sets exit-code 1 if the command supplied was not parseable #2358
- Set toNative() to be not enumerable #2388
- Use wrapIdentifier in columnInfo. fixes #2402 #2405
- Fixed a bug when using .returning (OUTPUT) in an update query with joins in MSSQL #2399
- Better error message when running migrations fail before even starting run migrations #2373
- Read oracle's UV_THREADPOOL_SIZE env variable correctly #2372
- Added decimal variable precision / scale support #2353

### New Features:

- Added queryContext to schema and query builders #2314
- Added redshift dialect #2233
- Added warning when one uses .createTableIfNotExist and deprecated it from docs #2458

### Test / internal changes

- Update dependencies and fix ESLint warnings accordingly #2433
- Disable oracledb tests from non LTS nodes #2407
- Update dependencies #2422

# 0.14.2 - 24 Nov, 2017

### Bug fixes:

- Fix sqlite3 truncate method to work again #2348

# 0.14.1 - 19 Nov, 2017

### Bug fixes:

- Fix support for multiple schema names in in postgres `searchPath` #2340
- Fix create new connection to pass errors to query instead of retry loop #2336
- Fix recognition of connections closed by server #2341

# 0.14.0 - 6 Nov, 2017

### Breaking Changes:

- Remove sorting of statements from update queries #2171
- Updated allowed operator list with some missing operators and make all to lower case #2239
- Use node-mssql 4.0.0 #2029
- Support for enum columns to SQlite3 dialect #2055
- Better identifier quoting in Sqlite3 #2087
- Migration Errors - Display filename of of failed migration #2272

### Other Features:

- Post processing hook for query result #2261
- Build native SQL where binding parameters are dialect specific #2237
- Configuration option to allow override identifier wrapping #2217
- Implemented select syntax: select({ alias: 'column' }) #2227
- Allows to filter seeds and migrations by extensions #2168
- Reconnecting after database server disconnect/reconnect + tests #2017
- Removed filering from allowed configuration settings of mysql2 #2040
- Allow raw expressions in query builder aggregate methods #2257
- Throw error on non-string table comment #2126
- Support for mysql stream query options #2301

### Bug fixes:

- Allow update queries and passing query builder to with statements #2298
- Fix escape table name in SQLite columnInfo call #2281
- Preventing containsUndefined from going to recursion loop #1711
- Fix error caused by call to knex.migrate.currentVersion #2123
- Upgraded generic-pool to 3.1.7 (did resolve some memory issues) #2208
- Allow using NOT ILIKE operator #2195
- Fix postgres searchPath to be case-sensitive #2172
- Fix drop of multiple columns in sqlite3 #2107
- Fix adding multiple columns in Oracle #2115
- Use selected schema when dropping indices in Postgres. #2105
- Fix hasTable for MySQL to not do partial matches #2097
- Fix setting autoTransaction in batchInsert #2113
- Fix connection error propagation when streaming #2199
- Fix comments not being applied to increments columns #2243
- Fix mssql wrong binding order of queries that combine a limit with select raw or update #2066
- Fixed mysql alter table attributes order #2062

### Test / internal changes

- Update each out-of-date dependency according to david-dm.org #2297
- Update v8flags to version 3.0.0 #2288
- Update interpret version #2283
- Fix debug output typo #2187
- Docker CI tests #2164
- Unit test for right/rightOuterJoin combination #2117
- Unit test for fullOuterJoin #2118
- Unit tests for table comment #2098
- Test referencing non-existent column with sqlite3 #2104
- Unit test for renaming column in postgresql #2099
- Unit test for cross-join #2102
- Fix incorrect parameter name #2068

# 0.13.0 - 29 Apr, 2017

### Breaking Changes:
- Multiple concurrent migration runners blocks instead of throwing error when possible #1962
- Fixed transaction promise mutation issue #1991

### Other Changes:
- Allow passing version of connected db in configuration file #1993
- Bugfixes on batchInsert and transactions for mysql/maria #1992
- Add fetchAsString optional parameter to oracledb dialect #1998
- fix: escapeObject parameter order for Postgres dialect. #2003

# 0.12.9 - 23 Mar, 2017
- Fixed unhandled exception in batchInsert when the rows to be inserted resulted in duplicate key violation #1880

# 0.12.8 - 15 Mar, 2017
- Added clearSelect and clearWhere to query builder #1912
- Properly close Postgres query streams on error #1935
- Transactions should never reject with undefined #1970
- Clear acquireConnectionTimeout if an error occurs when acquiring a connection #1973

# 0.12.7 - 17 Feb, 2017

### Accidental Breaking Change:
- Ensure that 'client' is provided in knex config object #1822

### Other Changes:
- Support custom foreign key names #1311, #1726
- Fixed named bindings to work with queries containing `:`-chars #1890
- Exposed more promise functions #1896
- Pass rollback errors to transaction promise in mssql #1885
- ONLY keyword support for PostgreSQL (for table inheritance) #1874
- Fixed Mssql update with join syntax #1777
- Replace migrations and seed for react-native packager #1813
- Support knexfile, migration and seeds in TypeScript #1769
- Fix float to integer conversion of decimal fields in MSSQL #1781
- External authentication capability when using oracledb driver #1716
- Fixed MSSQL incorect query build when locks are used #1707
- Allow to use `first` method as aliased select #1784
- Alter column for nullability, type and default value #46, #1759
- Add more having* methods / join clause on* methods  #1674
- Compatibility fixes and cleanups #1788, #1792, #1794, #1814, #1857, #1649

# 0.12.6 - 19 Oct, 2016
- Address warnings mentioned in #1388 (#1740)
- Remove postinstall script (#1746)

# 0.12.5 - 12 Oct, 2016
- Fix broken 0.12.4 build (removed from npm)
- Fix #1733, #920, incorrect postgres array bindings

# 0.12.3 - 9 Oct, 2016
- Fix #1703, #1694 - connections should be returned to pool if acquireConnectionTimeout is triggered
- Fix #1710 regression in postgres array escaping

# 0.12.2 - 27 Sep, 2016
- Restore pool min: 1 for sqlite3, #1701
- Fix for connection error after it's closed / released, #1691
- Fix oracle prefetchRowCount setting, #1675

# 0.12.1 - 16 Sep, 2016
- Fix MSSQL sql execution error, #1669
- Added DEBUG=knex:bindings for debugging query bindings, #1557

# 0.12.0 - 13 Sep, 2016

- Remove build / built files, #1616
- Upgrade to Babel 6, #1617
- Reference Bluebird module directly, remove deprecated .exec method, #1618
- Remove documentation files from main repo
- Fix broken behavior on WebSQL build, #1638
- Oracle id sequence now handles manual inserts, #906
- Cleanup PG escaping, fix #1602, #1548
- Added [`with`](#Builder-with) to builder for [common table expressions](https://www.postgresql.org/docs/9.4/static/queries-with.html), #1599
- Fix #1619, pluck with explicit column names
- Switching back to [generic-pool](https://github.com/coopernurse/node-pool) for pooling resource management
- Removed index.html, please direct all PR's for docs against the files in [knex/documentation](https://github.com/knex/documentation)

# 0.11.10 - 9 Aug, 2016

- Added CHANGELOG.md for a [new documentation](https://github.com/knex/documentation) builder coming soon, #1615
- Minor documentation tweaks
- PG: Fix Uint8Array being considered undefined, #1601
- MSSQL: Make columnInfo schema dynamic, #1585

# 0.11.9 - 21 Jul, 2016

- Reverted knex client breaking change (commit b74cd69e906), fixes #1587

# 0.11.8 - 21 Jul, 2016

- Oracledb dialect #990
- Documentation fix #1532
- Allow named bindings to be escaped. #1576
- Several bugs with MS SQL schema creation and installing from gihub fix #1577
- Fix incorrect escaping of backslashes in SqlString.escape #1545

# 0.11.7 - 19 Jun, 2016

- Add missing dependency. #1516

# 0.11.6 - 18 Jun, 2016

- Allow cancellation on timeout (MySQL) #1454
- Better bigint support. (MSSQL) #1445
- More consistent handling of `undefined` values in `QueryBuilder#where` and `Raw`. #1459
- Fix Webpack build. #1447
- Fix code that triggered Bluebird warnings. #1460, #1489
- Fix `ping` function. (Oracle) #1486
- Fix `columnInfo`. (MSSQL) #1464
- Fix `ColumnCompiler#binary`. (MSSQL) #1464
- Allow connection strings that do not contain a password. #1473
- Fix race condition in seed stubs. #1493
- Give each query a UUID. #1510

# 0.11.5 - 26 May, 2016

- Bugfix: Using `Raw` or `QueryBuilder` as a binding to `Raw` now works as intended

# 0.11.4 - 22 May, 2016

- Bugfix: Inconsistency of `.primary()` and `.dropPrimary()` between dialects #1430
- Feature: Allow using custom Client/Dialect (you can pass your own client in knex config) #1428
- Docs: Add documentation for .dropTimestamps #1432
- Bugfix: Fixed passing undefined fields for insert/update inside transaction #1423
- Feature: `batchInsert` with existing transaction #1354
- Build: eslint instead of jshint #1416
- Bugfix: Pooled connections not releasing #1382
- Bugfix: Support passing `knex.raw` to `.whereNot` #1402
- Docs: Fixed list of dialects which supports `.returning` #1398
- Bugfix: rename table does not fail anymore even with schema defined #1403

# 0.11.3 - 14 May, 2016

- Support nested joins. #1397

# 0.11.2 - 14 May, 2016

- Prevent crash on `knex seed:make`. #1389
- Improvements to `batchInsert`. #1391
- Improvements to inserting `DEFAULT` with `undefined` binding. #1396
- Correct generated code for adding/dropping multiple columns. (MSSQL) #1401

# 0.11.1 - 6 May, 2016

- Fix error in CLI command `migrate:make`. #1386

# 0.11.0 - 5 May, 2016

### Breaking Changes:

- `QueryBuilder#orWhere` joins multiple arguments with `AND`. #1164

### Other Changes:

- Collate for columns. (MySQL) #1147
- Add `QueryBuilder#timeout`, `Raw#timeout`. #1201 #1260
- Exit with error code when appropriate. #1238
- MSSQL connection accepts `host` as an alias for `server` in accordance with other dialects. #1239
- Add `query-response` event. #1231
- Correct behaviour of sibling nested transactions. #1226
- Support `RETURNING` with `UPDATE`. (Oracle) #1253
- Throwing callbacks from transactions automatically rolls them back. #1257
- Fixes to named `Raw` bindings. #1251
- `timestamps` accepts an argument to set `NOT NULL` and default to current timestamp.
- Add `TableBuilder#inherits` for PostgreSQL. #601
- Wrap index names. #1289
- Restore coffeescript knexfiles and configurations. #1292
- Add `andWhereBetween` and `andWhereNotBetween` #1132
- Fix `valueForUndefined` failure. #1269
- `renameColumn` no longer drops default value or nullability. #1326
- Correct MySQL2 error handling. #1315
- Fix MSSQL `createTableIfNotExists`. #1362
- Fix MSSQL URL parsing. #1342
- Update Lodash to 4.6.0 #1242
- Update Bluebird to 3.3.4 #1279

# 0.10.0 - 15 Feb, 2016

### Breaking Changes:

- `insert` and `update` now ignore `undefined` values. Back compatibility is provided through the option `useNullAsDefault`. #1174, #1043

### Other Changes:

- Add [`countDistinct`](#Builder-countDistinct), [`avgDistinct`](#Builder-avgDistinct) and [`sumDistinct`](#Builder-sumDistinct). #1046
- Add [`schema.jsonb`](#Schema-jsonb). Deprecated `schema.json(column, true)`. #991
- Support binding identifiers with `??`. #1103
- Restore `query` event when triggered by transactions. #855
- Correct question mark escaping in rendered queries. #519, #1058
- Add per-dialect escaping, allowing quotes to be escaped correctly. #886, #1095
- Add MSSQL support. #1090
- Add migration locking. #1094
- Allow column aliases to contain `.`. #1181
- Add `batchInsert`. #1182
- Support non-array arguments to [`knex.raw`](#Raw-Bindings).
- Global `query-error` event. #1163
- Add `batchInsert`. #1182
- Better support for Mysql2 dialect options. #980
- Support for `acquireConnectionTimeout` default 60 seconds preventing #1040 from happening. #1177
- Fixed constraint name escaping when dropping a constraint. #1177
- Show also `.raw` queries in debug output. #1169
- Support for `cli` to use basic configuration without specific environment set. #1101

# 0.9.0 - Nov 2, 2015

- Fix error when merging `knex.raw` instances without arguments. #853
- Fix error that caused the connection to time out while streaming. #849
- Correctly parse SSL query parameter for PostgreSQL. #852
- Pass `compress` option to MySQL2. #843
- Schema: Use `timestamp with timezone` by default for `time`, `datetime` and `timestamp` for Oracle. #876
- Add [`QueryBuilder#modify`](#Builder-modify) #881
- Add LiveScript and Early Gray support for seeds and migrations.
- Add [`QueryBuilder#withSchema`](#Builder-withSchema) #518
- Allow escaping of `?` in `knex.raw` queries. #946
- Allow `0` in join clause. #953
- Add migration config to allow disabling/enabling transactions per migration. #834

# 0.8.6 - May 20, 2015

- Fix for several transaction / migration issues, #832, #833, #834, #835

# 0.8.5 - May 14, 2015

- Pool should be initialized if no pool options are specified

# 0.8.4 - May 13, 2015

- Pool should not be initialized if {max: 0} is sent in config options

# 0.8.3 - May 2, 2015

- Alias postgresql -> postgres in connection config options

# 0.8.2 - May 1, 2015

- Fix regression in using query string in connection config

# 0.8.1 - May 1, 2015

- Warn rather than error when implicit commits wipe out savepoints in mysql / mariadb, #805.
- Fix for incorrect seed config reference, #804

# 0.8.0 - Apr 30, 2015

### New Features:

- Fixes several major outstanding bugs with the connection pool, switching to [Pool2](https://github.com/myndzi/pool2) in place of generic-pool-redux
- strong-oracle module support
- Nested transactions automatically become savepoints, with `commit` & `rollback` releasing or rolling back the current savepoint.
- Database seed file support, #391
- Improved support for sub-raw queries within raw statements
- Migrations are now wrapped in transactions where possible
- Subqueries supported in insert statements, #627
- Support for nested having, #572
- Support object syntax for joins, similar to "where" #743

### Major Changes:

- Transactions are immediately invoked as A+ promises, #470 (this is a feature and should not actually break anything in practice)
- Heavy refactoring internal APIs (public APIs should not be affected)

### "Other Changes:
- Allow mysql2 to use non-default port, #588
- Support creating & dropping extensions in PostgreSQL, #540
- CLI support for knexfiles that do not provide environment keys, #527
- Added sqlite3 dialect version of whereRaw/andWhereRaw (#477)

# 0.7.5 - Mar 9, 2015

- Fix bug in validateMigrationList, (#697)

# 0.7.4 - Feb 25, 2015

- Fix incorrect order of query parameters when using subqueries, #704
- Properly handle limit 0, (#655)
- Apply promise args from then instead of [explicitly passing](https://github.com/petkaantonov/bluebird/issues/482).
- Respect union parameter as last argument (#660).
- Added sqlite3 dialect version of whereRaw/andWhereRaw (#477).
- Fix SQLite dropColumn doesn't work for last column (#544).
- Add POSIX operator support for Postgres (#562)
- Sample seed files now correctly (#391)

# 0.7.3 - Oct 3, 2014

- Support for `join(table, rawOrBuilder)` syntax.
- Fix for regression in PostgreSQL connection (#516)

# 0.7.2 - Oct 1, 2014

- Fix for regression in migrations

# 0.7.1 - Oct 1, 2014

- Better disconnect handling & pool removal for MySQL clients, #452

# 0.7.0 - Oct 1, 2014

### New Features

- Oracle support, #419
- Database seed file support, #391
- Improved support for sub-raw queries within raw statements

### Breaking Changes

- "collate nocase" no longer used by default in sqlite3 #396

### Other Changes

- Bumping Bluebird to ^2.x
- Transactions in websql are now a no-op (unsupported) #375
- Improved test suite
- knex.fn namespace as function helper (knex.fn.now), #372
- Better handling of disconnect errors
- Support for offset without limit, #446
- Chainable first method for mysql schema, #406
- Support for empty array in `whereIn`
- Create/drop schema for postgres, #511
- Inserting multiple rows with default values, #468
- Join columns are optional for cross-join, #508
- Flag for creating jsonb columns in Postgresql, #500

# 0.6.22 - July 10, 2014

- Bug fix for properly binding postgresql streaming queries, (#363)

# 0.6.21 - July 9, 2014

- Bug fix for raw queries not being transaction context aware, (#351).
- Properly forward stream errors in sqlite3 runner, (#359)

# 0.6.20 - June 30, 2014

- Allow case insensitive operators in sql clauses, (#344)

# 0.6.19 - June 27, 2014

- Add `groupByRaw` / `orderByRaw` methods, better support for raw statements in group / order (#282).
- Support more config options for node-mysql2 dialect (#341).
- CLI help text fix, (#342)

# 0.6.18 - June 25, 2014

- Patch for the method, calling without a handler should return the stream, not a promise (#337)

# 0.6.17 - June 23, 2014

- Adding missing map / reduce proxies to bluebird's implementation

# 0.6.16 - June 18, 2014

- Increment / decrement returns the number of affectedRows (#330).
- Allow --cwd option flag to be passed to CLI tool (#326)

# 0.6.15 - June 14, 2014

- Added the as method for aliasing subqueries

# 0.6.14 - June 14, 2014

- whereExists / whereNotExists may now take a query builder instance as well as a callback

# 0.6.13 - June 12, 2014

- Fix regression with onUpdate / onDelete in PostgreSQL, (#308).
- Add missing `Promise` require to knex.js, unit test for knex.destroy (#314)

# 0.6.12 - June 10, 2014

- Fix for regression with boolean default types in PostgreSQL

# 0.6.11 - June 10, 2014

- Fix for regression with queries containing multiple order by statements in sqlite3

# 0.6.10 - June 10, 2014

- Fix for big regression in memoization of column names from 0.5 -> 0.6

# 0.6.9 - June 9, 2014

- Fix for regression in specificType method

# 0.6.8 - June 9, 2014

- Package.json fix for CLI

# 0.6.7 - June 9, 2014

- Adds support for [node-mysql2](https://github.com/sidorares/node-mysql2) library.
- Bundles CLI with the knex install, various related migrate CLI fixes

# 0.6.6 - June 9, 2014

- console.warn rather than throw when adding foreignKeys in SQLite3.
- Add support for dropColumn in SQLite3.
- Document `raw.wrap`

# 0.6.5 - June 9, 2014

- Add missing _ require to WebSQL builds

# 0.6.4 - June 9, 2014

- Fix & document schema.raw method

# 0.6.3 - June 6, 2014

- Schema methods on transaction object are now transaction aware (#301).
- Fix for resolved value from transactions, (#298).
- Undefined columns are not added to builder

# 0.6.2 - June 4, 2014

- Fix regression in raw query output, (#297).
- Fix regression in "pluck" method (#296).
- Document [first](#Builder-first) method

# 0.6.1 - June 4, 2014

- Reverting to using .npmignore, the "files" syntax forgot the knex.js file

# 0.6.0 - June 4, 2014

### Major Library refactor:

- Major internal overhaul to clean up the various dialect code.
- Improved unit test suite.
- Support for the [mariasql](https://github.com/mscdex/node-mariasql) driver.
- More consistent use of raw query bindings throughout the library.
- Queries are more composable, may be injected in various points throughout the builder.
- Added [streaming](#Interfaces-Streams) interface
- Deprecated 5 argument [join](#Builder-join) in favor of additional join methods.
- The wrapValue function to allow for array column operations in PostgreSQL (#287).
- An explicit connection can be passed for any query (#56).
- Drop column support for sqlite3
- All schema actions are run sequentially on the same connection if chained.
- Schema actions can now be wrapped in a transaction
- `.references(tableName.columnName)` as shorthand for `.references(columnName).inTable(tableName)`
- `.join('table.column', 'otherTable.column')` as shorthand for .join('table.column', '=', 'otherTable.column')
- Streams are supported for selects, passing through to the streaming capabilities of node-mysql and node-postgres
- For More information, see this [pull-request](https://github.com/tgriesser/knex/pull/252)


# 0.5.15 - June 4, 2014

- Dropped indexes feature now functions correctly, (#278)

# 0.5.14 - May 6, 2014

- Remove the charset encoding if it's utf8 for mysql, as it's the default but also currently causes some issues in recent versions of node-mysql

# 0.5.13 - April 2, 2014

- Fix regression in array bindings for postgresql (#228)

# 0.5.12 - Mar 31, 2014

- Add more operators for where clauses, including && (#226)

# 0.5.11 - Mar 25, 2014

- `.where(col, 'is', null)` or `.where(col, 'is not', null)` are not supported (#221).
- Case insensitive `where` operators now allowed (#212).
- Fix bug in increment/decrement truncating to an integer (#210).
- Disconnected connections are now properly handled & removed from the pool (#206).
- Internal tweaks to binding concatenations for performance (#207)

# 0.5.10 - Mar 19, 2014

- Add the .exec method to the internal promise shim

# 0.5.9 - Mar 18, 2014

- Remove error'ed connections from the connection pool (#206), added support for node-postgres-pure (pg.js) (#200)

# 0.5.8 - Feb 27, 2014

- Fix for chaining on forUpdate / forShare, adding map & reduce from bluebird

# 0.5.7 - Feb 18, 2014

- Fix for a null limit / offset breaking query chain (#182)

# 0.5.6 - Feb 5, 2014

- Bump bluebird dependency to ~1.0.0, fixing regression in Bluebird 1.0.2 (#176)

# 0.5.5 - Jan 28, 2014

- Fix for the exit code on the migrations cli (#151).
- The `init` method in `knex.migrate` now uses `this.config` if one isn't passed in (#156)

# 0.5.4 - Jan 7, 2014

- Fix for using raw statements in defaultTo schema builder methods (#146)

# 0.5.3 - Jan 2, 2014

- Fix for incorrectly formed sql when aggregates are used with columns (#144)

# 0.5.2 - Dec 18, 2013

- Adding passthrough "catch", "finally" to bluebird implementations, use bluebird's "nodeify" internally for exec

# 0.5.1 - Dec 12, 2013

- The [returning](#Builder-returning) in PostgreSQL may now accept * or an array of columns to return. If either of these are passed, the response will be an array of objects rather than an array of values. Updates may also now use a `returning` value. (#132)
- Added `bigint` and `bigserial` type to PostgreSQL. (#111)
- Fix for the [specificType](#Schema-specificType) schema call (#118)
- Several fixes for migrations, including migration file path fixes, passing a Promise constructor to the migration `up` and `down` methods, allowing the "knex" module to be used globally, file ordering on migrations, and other small improvements. (#112-115, #125, #135)

# 0.5.0 - Nov 25, 2013

- Initial pass at a [migration](#Migrations) api.
- Aggregate methods are no longer aliased as "aggregate", but may now be aliased and have more than one aggregate in a query (#108, #110).
- Adding bigint and bigserial to PostgreSQL (#111).
- Bugfix on increment/decrement values (#100).
- Bugfix with having method (#107).
- Switched from when.js to [bluebird](https://github.com/petkaantonov/bluebird) for promise implementation, with shim for backward compatibility.
- Switched from underscore to lodash, for semver reliability

# 0.4.13 - Oct 31, 2013

- Fix for aggregate methods on toString and clone, (#98)

# 0.4.12 - Oct 29, 2013

- Fix incorrect values passed to float in MySQL and decimal in PostgreSQL

# 0.4.11 - Oct 15, 2013

- Fix potential sql injection vulnerability in orderBy, thanks to @sebgie

# 0.4.10 - Oct 14, 2013

- Added [forUpdate](#Builder-forUpdate) and [forShare](#Builder-forShare) for select modes in transactions. (#84)
- Fix bug where current query chain type is not copied on [clone](#Builder-clone). (#90)
- Charset and collate are now added as methods on the schema builder. (#89)
- Added `into` as an alias of [from](#Builder-from), for builder syntax of: `insert(value).into(tableName)`
- Internal pool fixes. (#90)

# 0.4.9 - Oct 7, 2013

- Fix for documentation of [hasColumn](#Schema-hasColumn), ensure that `hasColumn` works with MySQL (#87).
- More cleanup of error messages, showing the original error message concatenated with the sql and bindings

# 0.4.8 - Oct 2, 2013

- Connections are no longer pushed back into the pool if they never existed to begin with (#85)

# 0.4.7 - Sep 27, 2013

- The column is now a documented method on the builder api, and takes either an individual column or an array of columns to select

# 0.4.6 - Sep 25, 2013

- Standardizing handling of errors for easier debugging, as noted in (#39)

# 0.4.5 - Sep 24, 2013

- Fix for hasTable always returning true in MySQL (#82), fix where sql queries were duplicated with multiple calls on toSql with the schema builder

# 0.4.4 - Sep 22, 2013

- Fix for debug method not properly debugging individual queries

# 0.4.3 - Sep 18, 2013

- Fix for underscore not being defined in various grammar files

# 0.4.2 - Sep 17, 2013

- Fix for an error being thrown when an initialized ClientBase instance was passed into Knex.initialize. pool.destroy now optionally accepts a callback to notify when it has completed draining and destroying all connections

# 0.4.1 - Sep 16, 2013

- Cleanup from the 0.4.0 release, fix a potential exploit in "where" clauses pointed out by Andri Möll, fix for clients not being properly released from the pool #70, fix for where("foo", "<>", null) doing an "IS NULL" statement

# 0.4.0 - Sep 13, 2013

### Breaking Changes:

- Global state is no longer stored in the library, an instance is returned from `Knex.initialize`, so you will need to call this once and then reference this `knex` client elsewhere in your application.
- Lowercasing of `knex.raw`, `knex.transaction`, and `knex.schema`.
- Created columns are now nullable by default, unless `notNullable` is chained as an option.
- Keys created with `increments` are now assumed to be unsigned (MySQL) by default.
- The `destroyAllNow` is no longer called by the library on `process.exit` event. If you need to call it explicitly yourself, you may use `knex.client.destroyPool`

# 0.2.6 - Aug 29, 2013

- Reject the transaction promise if the transaction "commit" fails, (#50)

# 0.2.5 - Aug 25, 2013

- Fix error if a callback isn't specified for exec, (#49)

# 0.2.4 - Aug 22, 2013

- Fix SQLite3 delete not returning affected row count, (#45)

# 0.2.3 - Aug 22, 2013

- Fix insert with default values in PostgreSQL and SQLite3, (#44)

# 0.2.2 - Aug 20, 2013

- Allowing Raw queries to be passed as the primary table names

# 0.2.1 - Aug 13, 2013

- Fix for an array passed to insert being mutated

# 0.2.0 - Aug 7, 2013

### Breaking changes:

- [hasTable](#Schema-hasTable) now returns a boolean rather than a failed promise.
- Changed syntax for insert in postgresql, where the `id` is not assumed on inserts (#18). The second parameter of [insert](#Builder-insert) is now required to return an array of insert id's for the last insert.
- The [timestamp](#Schema-timestamp) method on the schema builder now uses a `dateTime` rather than a `timestamp`

# 0.1.8 - July 7, 2013

- Somehow missing the != operator. Using _.find rather than _.where in getCommandsByName(#22)

# 0.1.7 - June 12, 2013

- Ensures unhandled errors in the exec callback interface are re-thrown

# 0.1.6 - June 9, 2013

- Renaming beforeCreate to afterCreate. Better handling of errors in the connection pooling

# 0.1.5 - June 9, 2013

- Added the ability to specify beforeCreate and beforeDestroy hooks on the initialize's options.pool to perform any necessary database setup/teardown on connections before use (#14). where and having may now accept Knex.Raw instances, for consistency (#15). Added an orHaving method to the builder. The ability to specify bindings on Raw queries has been removed

# 0.1.4 - May 22, 2013

- defaultTo now accepts "false" for boolean columns, allows for empty strings as default values

# 0.1.3 - May 18, 2013

- Enabling table aliases (#11). Fix for issues with transactions not functioning (#12)

# 0.1.2 - May 15, 2013

- Bug fixes for groupBy (#7). Mysql using collation, charset config settings in createTable. Added engine on schemaBuilder specifier (#6). Other doc fixes, tests

# 0.1.1 - May 14, 2013

- Bug fixes for sub-queries, minor changes to initializing "main" instance, adding "pg" as a valid parameter for the client name in the connection settings

# 0.1.0 - May 13, 2013

- Initial Knex release
