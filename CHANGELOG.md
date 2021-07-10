# Master (Unreleased)

# 0.95.7 - 10 July, 2021

### New features:

- Add ability to omit columns on an onConflict().ignore() #4557
- CLI: Log error message #4534

### Typings:

- Export Knex.TransactionConfig #4498
- Include options object in count(Distinct) typings #4491
- Add types for analytic functions #4544

# 0.95.6 - 17 May, 2021

### Typings:

- Export TransactionProvider type #4489

# 0.95.5 - 11 May, 2021

### New features:

- SQLite: Add support for file open flags #4446
- Add .cjs extension to Seeder.js to support Node ESM #4381 #4382

### Bug fixes:

- Remove peerDependencies to avoid auto-install on npm 7 #4480

### Typings:

- Fix typing for increments and bigIncrements #4406
- Add typings for on JoinClause for onVal #4436
- Adding Type Definition for isTransaction #4418
- Export client class from knex namespace #4479

# 0.95.4 - 26 March, 2021

### Typings:

- Fix mistyping of stream #4400

# 0.95.3 - 25 March, 2021

### New features:

- PostgreSQL: Add "same" as operator #4372
- MSSQL: Improve an estimate of the max comment length #4362
- Throw an error if negative offset is provided #4361

### Bug fixes:

- Fix timeout method #4324
- SQLite: prevent dropForeign from being silently ignored #4376

### Typings:

- Allow config.client to be non-client instance #4367
- Add dropForeign arg type for single column #4363
- Update typings for TypePreservingAggregation and stream #4377

# 0.95.2 - 11 March, 2021

### New features:

- Improve ESM import support #4350

### Bug fixes:

- CLI: update ts.stub files to new TypeScript namespace #4344
- CLI: fix TypeScript migration stub after 0.95.0 changes #4366

### Typings:

- Move QueryBuilder and KnexTimeoutError into knex namespace #4358

### Test / internal changes:

- Unify db test helpers #4356

# 0.95.1 - 04 March, 2021

### Bug fixes:

- CLI: fix `knex init` not finding default knexfile #4339

# 0.95.0 - 03 March, 2021

Note: there are many breaking changes in this version, particularly in TypeScript support. Please see `UPGRADING.md` for details.

### New features:

- Add transaction isolation support #4185
- Add analytic functions #4188
- Change default to not trigger a promise rejection for transactions with a specified handler #4195
- Make toSQL().toNative() work for Raw to match the API for QueryBuilder #4058
- Allow 'match' operator #3569
- Support optimizer hints #4243  
- Add parameter to prevent autoincrement columns from being primary keys #4266
- Make "first" and "pluck" mutually exclusive #4280  
- Added merge strategy to allow selecting columns to upsert. #4252
- Throw error if the array passed to insert is empty #4289
- Events: introduce queryContext on query-error #4301
- CLI: Use UTC timestamp for new migrations #4245  
- MSSQL: Replace MSSQL dialect with Tedious.js implementation #2857 #4281
- MSSQL: Use "nvarchar(max)" for ".json()" #4278
- MSSQL: Schema builder - add predictable constraint names for default values #4319
- MSSQL: Schema builder - attempt to drop default constraints when changing default value on columns #4321
- SQLite: Fallback to json for sqlite3 when using jsonb #4186
- SQLite: Return complete list of DDL commands for creating foreign keys #4194
- SQLite: Support dropping composite foreign keys #4202
- SQLite: Recreate indices when altering a table #4277
- SQLite: Add support for altering columns #4322

### Bug fixes:

- Fix issue with .withSchema usage with joins on a subquery #4267
- Fix issue with schema usage with FROM clause contain QueryBuilder, function or Raw #4268
- CLI: Address raised security warnings by dropping liftoff #4122
- CLI: Fix an issue with npm@7 and ESM when `type` was set to `'module'` in `package.json` #4295
- PostgreSQL: Add check to only create native enum once #3658
- SQLite: Fix foreign key "on delete" when altering a table #4225
- SQLite: Made the constraint detection case-insensitive #4330
- MySQL: Keep auto increment after rename #4266
- MSSQL: don't raise query-error twice #4314
- MSSQL: Alter column must have its own query #4317

### Typings:

- TypeScript 4.1+ is now required
- Add missing onConflict overrides #4182
- Introduce the "infamous triplet" export #4181
- Fix type definition of Transaction #4172
- Add typedefinitions for havingNotIn #4265
- Include 'name' property in MigratorConfig #4300
- Improve join and conflict types #4318
- Fix ArrayIfAlready type #4331

### Test / internal changes:

- Drop global Knex.raw #4180
- Stop using legacy url.parse API #3702
- Various internal refactorings #4175 #4177 #4178 #4192
- Refactor to classes #4190 #4191 #4193 #4210 #4253
- Move transaction type tests to TSD #4208
- Clean up destroy logic #4248  
- Colorize code snippets in readme files #4234  
- Add "Ecosystem" documentation for Knex plugins #4183  
- Documentation cleanup
- SQLite: Use SQLite "rename column" instead of a DDL helper #4200
- SQLite: Simplify reinsert logic when altering a table #4272

# 0.21.19 - 02 March, 2021

- SQLite: Made the constraint detection case-insensitive #4332

# 0.21.18 - 22 February, 2021

- CLI: Fix an issue with npm@7 and ESM when type was set to 'module' in package.json #4295

# 0.21.17 - 30 January, 2021

### Bug fixes:

- SQLite: Fix SQLite foreign on delete when altering a table #4261

### New features:

- Add support for optimizer hints (see https://github.com/knex/documentation/pull/306 for documentation) #4243

# 0.21.16 - 17 January, 2021

### Bug fixes:

- MSSQL: Avoid passing unsupported pool param. Fixes node-mssql 7+ support #4236

# 0.21.15 - 26 December, 2020

### New features:

- SQLite: Add primary/foreign support on alterTable #4162
- SQLite: Add dropPrimary/dropForeign support on alterTable #4162

### Typings:

- Add "after" and "first" to columnBuilder types #3549 #4169

### Test / internal changes:

- Extract knex config resolution logic #4166
- Run CI using GitHub Actions #4168
- Add Node.js 15 to CI matrix #4173

# 0.21.14 - 18 December, 2020

### New features:

- MSSQL: support "returning" on inserts, updates and deletes on tables with triggers #4152
- Use esm import if package.json type is "module" #4158

### Bug fixes:

- Make sure query-response and query-error events contain _knexTxId #4160

### Test / internal changes:

- Improved integration test framework #4161

# 0.21.13 - 12 December, 2020

### New features:

- SQLite: Add support for `dropForeign` #4092
- Add support for WHERE clauses to "upsert" queries #4148

### Bug fixes:

- MSSQL: Avoid connection getting stuck on socket hangup #4157
- Oracle: Support specifying non-default DB port #4147
- Oracle: Support inserts with only default values (empty body) #4092
- CLI: fix irregular seed file execution order #4156
- Fix performance of asyncStackTraces with enable-source-maps node flag #4154

### Typings:

- PostgreSQL: Add support for application_name #4153
- Fix types for insert to allow array #4105
- Add types for userParams and withUserParams #4119
- Added type for withKeyName #4139
- Fix batchInsert definitions #4131
- Fix types for WhereIn signature (value or query builder) #3863
- Add types for connection config of mysql2 driver #4144

### Test / internal changes:

- Move TS tests to tsd (WIP) #4109 #4110

# 0.21.12 - 02 November, 2020

### Typings:

- Reintroduce support for globally defining table/record mapping #4100
- Add a few missing types for MSSQL Connection #4103
- Make .ignore() and .merge() return QueryBuilder rather than QueryInterface #4102
- Use tarn config TS types instead of generic-pool #4064

# 0.21.11 - 01 November, 2020

### Typings:

- Revert support for globally defining table/record mapping #4099

# 0.21.10 - 31 October, 2020

### New features:

- Upsert support (Postgres/MySQL/Sqlite) #3763

### Bug fixes:

- Switch to non-uuid knexQueryUids to avoid issues when mocking global date #4089

### Typings:

- Allow to globally define table/record mapping #4071

# 0.21.9 - 27 October, 2020

### New features:

- add method clear(statement) to QueryBuilder #4051

### Bug fixes:

- CLI: fix help text being printed twice #4072
- Oracle: columnInfo() no longer requires an Owner User #4053
- Add missing "start" event propagation from transaction #4087

# 0.21.8 - 27 October, 2020

### Bug fixes:

- MSSQL: Escape properly if literal '?' is needed #4053
- Make toQuery behavior consistent with pre-0.21.7 (do not break on empty builder) #4083
- Fix comment escaping for MySQL and PostgreSQL #4084

# 0.21.7 - 25 October, 2020

### New features:

- CLI: Add migration stub for .cjs extension #4065

### Bug fixes:

- MSSQL: Add dynamic scaling for decimal values and prevents a UInt64 overflow #3910
- MSSQL: Fix apostrophe escaping #4077
- Ensure that semicolon is not appended to statements that already end with a semicolon #4052

### Typings:

- Add arguments to QueryCallback in Where #4034

### Test / internal changes:

- Replace lodash type-checks with native solutions #4056
- Replace mkdirp with native recursive flag #4060
- Replace inherits package with builtin utility #4059

# 0.21.6 - 27 September, 2020

### New features:

- CLI: New config parameter / CLI flag to prefixing seed filename with timestamp #3873
- CLI: throw an error when specific seed file cannot be found #4011
- Warn if whereNot is used with 'in' or 'between' #4038

### Bug fixes:

- CLI: Fix double merging of config for migrator #4040

### Typings:

- Unify SeedsConfig and SeederConfig #4003
- Allow string[] type for directory in SeedsConfig #4033

# 0.21.5 - 17 August, 2020

### New features:

- CLI: Improve Esm interop #3985
- CLI: Improve mjs module support #3980

### Test / internal changes:

- Bump version of dtslint #3984
- Test/document esm interop mixed formats (knexfile/migrations/seeds) #3986

# 0.21.4 - 10 August, 2020

### New features:

- CLI: Add new option for seed: recursive #3974

### Bug fixes:

- CLI: Do not load seeds from subfolders recursively by default #3974

# 0.21.3 - 08 August, 2020

### New features:

- CLI: Support multiple directories for seeds #3967

### Bug fixes:

- Ensure DB stream is destroyed when the PassThrough is destroyed #2324
- Support postProcessResponse for streams #3931
- Fix ESM module interop for calling module/package of type 'module' #3938
- CLI: Fix migration source name in rollback all #3956
- Fix getMergedConfig calls to include client logger #3920
- Escape single quoted values passed to defaultTo function #3899

### Typings:

- Add .timeout(ms) to .raw()'s typescript typings #3885
- Add typing for double table column builder #3950
- Add a phantom tag to Ref type to mark received type parameters as used #3934
- Add `null` as valid binding type #3946

### Test / internal changes:

- Change query lab link to https #3933

# 0.21.2 - 10 July, 2020

### New features:

- Warn user if custom migration source is being reset #3839
- Prefer `void` as return type on migration generator ts stub #3865
- MSSQL: Added the removal of a columns default constraint, before dropping the column #3855

### Typings:

- Fix definition for raw querybuilders #3846

### Test / internal changes:

- Refactor migration logic to use async/await #3838

# 0.21.1 - 28 April, 2020

### New features:

- CLI: Add migrate:unlock command, truncate on forceFreeMigrationsLock #3822
- CLI: Add support for cjs files by default #3829

### Bug fixes:

- CLI: Fix inference of seed/migration extension from knexfile extension #3814
- rewrite delay to not node-only version. Fixes compatibility with browsers #3820

### Test / internal changes:

- Update dependencies. Explicitly support Node.js 14 #3825 #3830

# 0.21.0 - 18 April, 2020

### Improvements

- Reduce size of lodash in bundle #3804

### Breaking changes

- Dropped support for Node 8
- Breaking upstream change in `pg-query-stream`: `Changed stream.close to stream.destroy which is the official way to terminate a readable stream. This is a breaking change if you rely on the stream.close method on pg-query-stream...though should be just a find/replace type operation to upgrade as the semantics remain very similar (not exactly the same, since internals are rewritten, but more in line with how streams are "supposed" to behave).`

### Test / internal changes:

- Updated Tarn.js to a version 3.0.0
- Updated mkdirp to a version 1.0.4
- Updated examples to use ES2015 style #3810

# 0.20.15 - 16 April, 2020

### Bug fixes:

- Support for `.finally(..)` on knex's Promise-alikes #3800

### Typings:

- Add types for `.distinctOn` #3784

# 0.20.14 - 13 April, 2020

### New features:

- CLI: adds support for asynchronous knexfile loading #3748
- Add clearGroup method #3771

### Typings:

- Support Raw types for insert, where, update #3730
- Add typings for MigrationSource #3756
- Update signature of orderBy to support QueryBuilder inside array #3757
- Add toSQL and toString to SchemaBuilder #3758
- `interface Knex` and `function Knex` should have the same types #3787
- Fix minor issues around typings #3765

### Test / internal changes:

- Minor test internal enhancements #3747
- Minor improvements on the usage of fs utilities #3749
- Split tests in groups #3785

# 0.20.13 - 23 March, 2020

### Bug fixes:

- Correctly handle dateToString escaping without timezone passed #3742 
- Make protocol length check more defensive #3744

### Typings:

- Make the ChainableInterface conform to Promise<T> #3724

# 0.20.12 - 19 March, 2020

### Bug fixes:

- Added missing call to _reject in Transactor#transaction #3706
- Fix method binding on knex proxy #3717
- Oracle: Transaction_OracleDB can use config.connection #3731

### Typings:

- Fix incorrect type signature of Having #3719

### Test / internal changes:

- Cleanup/remove transaction stalling #3716
- Rewrote Transaction#acquireConnection() methods to use async #3707 

# 0.20.11 - 26 February, 2020

### Breaking changes:

- Knex returns native JS promises instead of Bluebird ones. This means that you no longer use such methods as `map`, `spread` and `reduce` on QueryBuilder instance.

### New features:

- Oracle: Add OracleDB handling for buffer type in fetchAsString #3685

### Bug fixes:

- Fix race condition in non-container transactions #3671

### Typings:

- Mark knex arguments of composite/collection types to be readonly #3680

### Test / internal changes:

- Remove dependency on Bluebird methods from sources #3683
- Cleanup and extract Transaction Workflow logic #3674

# 0.20.10 - 13 February, 2020

### Bug fixes:

- Oracle: commit was a no-op causing race conditions #3668
- CLI: Knex calls process.chdir() before opening Knexfile #3661
- Fixed unresolved promise in cancelQuery() #3666

### Typings:

- `fn.now` takes optionally a precision argument. #3662
- PG: Include SSL in connection definition #3659 

### Test / internal changes:

- replace Bluebird.timeout #3634

# 0.20.9 - 08 February, 2020

### Bug fixes:

- CLI: Improve Support for Liftoff's Preloaders - this should fix some cases like using TS for your migrations #3613

### Typings:

- MSSQL: Add `enableArithAbort` to `MsSqlConnectionConfig` 

### Test / internal changes:

- Refactor more tests to use cli-testlab #3640
- Update QueryCompiler implementation to use classes #3647

# 0.20.8 - 14 January, 2020

### New features:

- CLI: Support ES6 modules via flag --esm #3616

### Bug fixes:

- CLI: Print help only when there are no arguments #3617

### Typings:

- Fix incorrect type of QueryBuilder.first('*') result #3621

# 0.20.7 - 07 January, 2020

### New features:

- Throw better error when trying to modify schema while using unsupported dialect #3609

### Bug fixes:

- Oracle: dispose connection on connection error #3611
- Oracle: fix not releasing connection from pool on disconnect #3605
- CLI: prevent warning with root command #3604

### Typings:

- Add create/drop schema methods to SchemaBuilder #3579

# 0.20.6 - 29 December, 2019

### Bug fixes:

- Enforce Unix (lf) line terminators #3598

# 0.20.5 - 29 December, 2019

### New features:

- Return more information about empty updates #3597

### Bug fixes:

- Fix colors in debug logs #3592

### Test / internal changes:

- Use more efficient algorithm for generating internal ids #3595 #3596
- Use Buffer.alloc() instead of deprecated constructor #3574

# 0.20.4 - 08 December, 2019

### Bug fixes:

- Fix debug logger messing up queries with % #3566
- Make logger methods mutually consistent #3567

### Typings:

- Add missing methods to client type #3565
- Fix queryContext function defintion #3562
- Fix QueryBuilder.extend this type #3526 #3528

### Test / internal changes:

- Remove bluebird.using #3552

# 0.20.3 - 27 November, 2019

### New features:

- MSSQL, MySQL: Add connection string qs to connection params #3547

### Bug fixes:

- Oracle: Fix issue retrieving BLOB from database #3545
- PostgreSQL: Timeout for postgresql use cancel instead of terminate #3518
- Make sure CLI works for namespaced knex packages #2539

### Typings:

- Lift up dialect specific methods in the CreateTableBuilder #3532
- Add client property to QueryBuilder type #3541
- Support 'only' option #3551

# 0.20.2 - 14 November, 2019

### New features:

- Add support for distinct on for postgres #3513

### Bug fixes:

- Make sqlite3 hasColumn case insensitive #3435

### Typings:

- Fix PoolConfig typing #3505
- Expand SeedsConfig types #3531
- Make the default type parameters of QueryBuilder less strict #3520
- Fix regression in older version of node when Promise#finally was not available #3507

# 0.20.1 - 29 October, 2019

### New features:

- Declare drivers as optional peerDependencies #3081
- Dynamic connection configuration resolution #3497

### Bug fixes:

- Wrap subQuery with parenthesis when it appears as table name #3496
- Fix Oracle error codes #3498

### Typings:

- Add interface for PG Connection object #3372
- Gracefully handle global promise pollution #3502

# 0.20.0 - 25 October, 2019

### New features:

- orderBy accepts QueryBuilder #3491
- Add validation in `.offset()` #2908
- disable_migrations_list_validation feature #3448

### Bug fixes:

- Fix oracledb driver v4 support #3480
- Fix some issues around seed and migration generation #3479
- Fix bugs in replacement logic used when dropping columns in SQLite #3476

### Typings:

- Add types to the Migrator interface #3459
- Fix typings of index and dropIndex TableBuilder methods #3486
- Fixes types for Seeder#run #3438

### Test / internal changes:

- Execute CI on Node.js 13
- Bluebird: remove usage of `return`, `reflect`, `fromCallback` methods #3483
- Bluebird: remove Bluebird.bind #3477
- Bluebird: use util.promisify instead of Bluebird.promisify #3470
- Bluebird: remove Bluebird.each #3471
- Bluebird: remove Bluebird.map and Bluebird.mapSeries #3474
- Bluebird: replace Bluebird.map with Promise.all #3469
- Update badges #3482

# 0.19.5 - 06 October, 2019

### New features:

- CLI: Migrations up/down commands - filename parameter #3416
- Oracle: Support stored procedures #3449

### Bug fixes:

- MSSQL: Escape column ids correctly in all cases (reported by Snyk Security Research Team) #3382
- SQLite: Fix handling of multiline SQL in SQLite3 schema #3411
- Fix concurrent child transactions failing #2213 #3440

### Typings:

- Add missing Migrator.list typing #3460
- Fix Typescript type inference for to better support wildcard (*) calls #3444
- Make options argument optional in timeout #3442

### Test / internal changes:

- Enable linting in CI #3450

# 0.19.4 - 09 September, 2019

### New features:

- Add undefined columns to undefined binding(s) error #3425

### Typings:

- Add `specific` to SeederConfig type #3429
- Fix some issues with QueryBuilder types #3427

# 0.19.3 - 25 August, 2019

### Bug fixes:

- Fix migrations for native enums to use table schema #3307

### New features:

- Add ability to manually define schema for native enums #3307
- Add SSL/TLS support for Postgres connection string #3410
- CLI: new command that lists all migrations with status #3390

### Typings:

- Include schemaName in EnumOptions #3415
- Allow `ColumnBuilder.defaultTo()` to be `null` #3407

### Changes:

- migrate: Refactor _lockMigrations to avoid forUpdate - makes migrations compatible with CockroachDB #3395

# 0.19.2 - 17 August, 2019

### Changes:

- Make transaction rejection consistent across dialects #3399
- More consistent handling of nested transactions #3393

### New features:

- Fallback to JSON when using JSONB in MySQL #3394 

# 0.19.1 - 23 July, 2019

### New features:

- Allow to extend knex query builder #3334
- Add .isCompleted() to transaction #3368
- Minor enhancements around aliasing of aggregates #3354

### Typings:

- Update configuration typings to allow for oracle db connectionstring #3361
- Update Knex.raw type to be any by default because the actual type is dialect specific #3349

# 0.19.0 - 11 July, 2019

### Changes:

- Pooling: tarn.js connection pool was updated to version 2.0.0. This fixes issue with destroying connections and introduces support for connection pool event handlers. Please see tarn.js documentation for more details #3345 
- Pooling: Passing unsupported pooling configuration options now throws an error
- Pooling: `beforeDestroy` configuration option was removed

# 0.18.4 - 10 July, 2019

### New features:

- Seeds: Option to run specific seed file #3335
- Implement "skipLocked()" and "noWait()" #2961

### Bug fixes:

- CLI: Respect the knexfile stub option while generating a migration #3337
- Fix mssql import not being ignored, breaking webpack builds #3336

# 0.18.3 - 04 July, 2019

### New features:

- CLI: add --stub option to migration:make #3316

### Bug fixes:

- Fix return duplicate transaction promise for standalone transactions #3328

# 0.18.2 - 03 July, 2019

### Bug fixes:

- Fix remove duplicate transaction rejection #3324
- Fix issues around specifying default values for columns #3318
- CLI: Fix empty --version output #3312

# 0.18.1 - 30 June, 2019

### Bug fixes:

- Do not reject duplicate promise on transaction rollback #3319

# 0.18.0 - 26 June, 2019

### Bug fixes:

- Do not reject promise on transaction rollback (by default only for new, non-callback, style of transactions for now to avoid breaking old code) #3235

### New features:

- Added `doNotRejectOnRollback` options for starting transactions, to prevent rejecting promises on rollback for callback-style transactions.
- Use extension from knexfile for generating migrations unless overriden #3282
- Use migrations.extension from config when generating migration #3242
- Expose executionPromise for transactors #3297

### Bug fixes:

- Oracle: Updated handling of connection errors for disposal #2608
- Fix extension resolution from env configs #3294

### Test / internal changes:

- Drop support for Node.js 6 #3227
- Remove Babel #3227
- Remove Bluebird #3290 #3287 #3285 #3267 #3266 #3263
- Fix comments that were modified by find & replace #3308

### Typings:

- Add workarounds for degraded inference when strictNullChecks is set to false #3275
- Add stub type definition for Migrator config #3279
- Add stub to seeds type #3296
- Fix MSSQL config typings #3269
- Add pgsql specific table builder method typings #3146

# 0.17.5 - 8 June, 2019

### Typings:

- Include result.d.ts in published package #3271

# 0.17.4 - 8 June, 2019

### Typings:

- Fix some cases of left-to-right inference causing type mismatch #3265
- Improve count typings #3249

### Bug fixes:

- Fix error message bubbling up on seed error #3248

# 0.17.3 - 2 June, 2019

### Typings:

- Improve typings for aggregations #3245
- Add decimalNumbers to MySqlConnectionConfig interface #3244

# 0.17.2 - 1 June, 2019

### Typings

- Improve count typings #3239

### Bug fixes:

- "colorette" dependency breaks browserify builds #3238

# 0.17.1 - 31 May, 2019

### New features:

- Add migrate:down functionality #3228

### Typings:

- Update type of aggregation results to not be arrays when first has been invoked before #3237
- Include undefined in type of single row results #3231
- Fix incorrect type definitions for single row queries #3230

# 0.17.0 - 28 May, 2019

### New features:

- Add support for returning started transaction without immediately executing it #3099
- Add support for passing transaction around with only starting it when needed #3099
- Add clearHaving function #3141
- Add --all flag for rollback in CLI #3187
- Add error detail log to knex CLI #3149
- Support multi-column whereIn in sqlite through values clause #3220
- Allow users to specify the migrations "tableName" parameter via the CLI #3214
- Unify object options handling for datetime/timestamp across dialects #3181
- Add "up" command for migrations #3205

### Typings:

- Add default values for generic types (fixes backwards compatibility broken by 0.16.6) #3189
- Make function types generic in type definitions #3168
- Add missing types to MigratorConfig #3174
- Add types for havingBetween, orHavingBetween, havingNotBetween and orHavingNotBetween #3144
- Update Knex.Config types to include log #3221
- Fix some more cases of missing typings #3223
- Support type safe refs #3215
- Expose some utility types #3211
- Fix issues with typings of joins and some conflicts with Bluebird typings #3209

### Bug fixes:

- Fix order of migration rollback #3172

### Test / internal changes:

- Execute CI tests on Node.js 12 #3171
- Docker-based test dbs #3157
- Use cli-testlab for testing CLI #3191

# 0.16.5 - 11 Apr, 2019

- Bundle polyfills with knex for 0.16.x line again #3139

# 0.16.4 - 11 Apr, 2019

### New features:

- Boolean param for rollback() to rollback all migrations #2968
- seed:run print the file name of the failing seed #2972 #2973
- verbose option to CLI commands #2887
- add intersect() #3023
- Improved format for TS stubs #3080
- MySQL: Support nullable timestamps #3100
- MySQL: Warn `.returning()` does not have any effect #3039

### Bug fixes:

- Respect "loadExtensions" configuration #2969
- Fix event listener duplication when using Migrator #2982
- Fix fs-migrations breaking docs #3022
- Fix sqlite3 drop/renameColumn() breaks with postProcessResponse #3040
- Fix transaction support for migrations #3084
- Fix queryContext not being passed to raw queries #3111
- Typings: Allow to pass query builders, identifiers and raw in various places as parameters #2960
- Typings: toNative() definition #2996
- Typings: asCallback() definition #2963
- Typings: queryContext() type definition Knex.Raw #3002
- Typings: Add "constraintName" arg to primary() definition #3006
- Typings: Add missing schemaName in MigratorConfig #3016
- Typings: Add missing supported parameter types and toSQL method #2960
- Typings: Update enum arguments to reflect latest signature #3043
- Typings: Add size parameter to integer method #3074
- Typings: Add 'string' as accepted Knex constructor type definition #3105
- Typings: Add boolean as a column name in join #3121
- Typings: Add missing clearOrder & clearCounters types #3109
- Dependencies: Fix security warning #3082 
- Do not use unsupported column width/length arguments on data types int and tinyint in MSSQL #2738

### Changes:

- Make unionAll()'s call signature match union() #3055

### Test / internal changes:

- Swap chalk→colorette / minimist→getopts #2718
- Always use well documented pg client query() config argument #3004
- Do not bundle polyfills with knex #3024

# 0.16.3 - 19 Dec, 2018

### Bug fixes:

- @babel/polyfill loaded multiple times #2955
- Resolve migrations and seeds relatively to knexfile directory when specified (the way it used to be before 0.16.1) #2952

# 0.16.2 - 10 Dec, 2018

### Bug fixes:

- Add TypeScript types to the "files" entry so they are properly included in the release #2943

# 0.16.1 - 28 Nov, 2018

### Breaking Changes:

- Use datetime2 for MSSQL datetime + timestamp types. This change is incompatible with MSSQL older than 2008 #2757
- Knex.VERSION() method was removed, run "require('knex/package').version" instead #2776
- Knex transpilation now targets Node.js 6, meaning it will no longer run on older Node.js versions #2813
- Add json type support for SQLite 3.9+ (tested to work with Node package 'sqlite3' 4.0.2+) #2814

### New features:

- Support passing explicit connection to query builder (#2817)
- Introduced abstraction for getting migrations to make migration bundling easier #2775
- Allow timestamp with timezone on mssql databases #2724
- Allow specifying multiple migration directories #2735
- Allow cloning query builder with .userParams({}) assigned to it #2802
- Allow chaining of increment, decrement, and update #2740
- Allow table names with `forUpdate`/`forShare` #2834
- Added `whereColumn` and the associated `not` / `and` / `or` methods for using columns on the right side of a where clause #2837
- Added `whereRecursive` method to make self-referential CTEs possible #2889
- Added support for named unique, primary and foreign keys to SQLite3 #2840
- Added support for generating new migration and seed files without knexfile #2884 #2905 #2935
- Added support for multiple columns in `.orderBy()` #2881
- Added option of `existingType` to `.enum()` method to support repeated use of enums #2719
- Added option to pass `indexType` for MySQL dialect #2890
- Added `onVal` and the associated `not` / `and` / `or` methods for using values in `on` clauses within joins #2746
- Kill queries after timeout for PostgreSQL #2636
- Manage TypeScript types internally #2845
- Support 5.0.0+ versions of mssql driver #2861
- Typescript migration stub #2816
- Options object for passing timestamp parameters + regression tests #2919

### Bug fixes:

- Implement fail-fast logic for dialect resolution #2776
- Fixed identifier wrapping for `using()`. Use columnize instead of wrap in using() #2713
- Fix issues with warnPromise when migration does not return a promise #2730
- Compile with before update so that bindings are put in correct order #2733
- Fix join using builder withSchema #2744
- Throw instead of process.exit when client module missing #2843
- Display correct filename of a migration that failed #2910
- Fixed support of knexSnakeCaseWrappers in migrations #2914
- SQlite3 renameColunm quote fix #2833
- Adjust typing for forUpdate()/forShare() variant with table names #2858
- Fix execution of Oracle tests on Node 11 #2920
- Fix failures in oracle test bench and added it back to mandatory CI tests #2924
- Knex client knexfile resolution fix #2923
- Add queryContext to type declarations #2931

### Test / internal changes:

- Add tests for multiple union arguments with callbacks and builders #2749
- Update dependencies #2772 #2810 #2842 #2848 #2893 #2904
- Separate migration generator #2786
- Do not postprocess internal queries in Migrator #2914 #2934
- Use Babel 7 #2813
- Introduce LGTM.com badge #2755
- Cleanup based on analysis by https://lgtm.com #2870
- Add test for retrieving null dates #2865
- Add link to wiki #2866
- Add tests for specifying explicit pg version #2895
- Execute tests on Node.js 11 #2873
- Version upgrade guide #2894

# 0.16.0 - 27 Nov, 2018

### Changes:

- THIS RELEASE WAS UNPUBLISHED FROM NPM BECAUSE IT HAD BROKEN MIGRATIONS USING `postprocessResponse` FEATURE (#2644)

# 0.15.2 - 19 Jul, 2018

### Changes:

- Rolled back changes introduced by #2542, in favor of opt-in behavior by adding a precision option in `date` / `timestamp` / `datetime` / `knex.fn.now` (#2715, #2721)

# 0.15.1 - 12 Jul, 2018

### Bug fixes:

- Fix warning erroneously displayed for mysql #2705

# 0.15.0 - 1 Jul, 2018

### Breaking Changes:

- Stop executing tests on Node 4 and 5. #2451 (not supported anymore)
- `json` data type is no longer converted to `text` within a schema builder migration for MySQL databases (note that JSON data type is only supported for MySQL 5.7.8+) #2635
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
- Added 'ref' function #2509, no need for knex.raw('??', ['id']) anymore, one can do knex.ref('id')
- Support postgresql connection uri protocol #2609
- Add support for native enums on Postgres #2632
- Allow overwriting log functions #2625

### Test / internal changes:

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

### Test / internal changes:

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

### Test / internal changes:

- Added stress test, which uses TCP proxy to simulate flaky connection #2460
- Removed old docker tests, new stress test setup (#2474)
- Removed unused property \_\_cid on the base client (#2481)
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

### Test / internal changes:

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

### Test / internal changes:

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
- Add more having* methods / join clause on* methods #1674
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

### New Features:

- Oracle support, #419
- Database seed file support, #391
- Improved support for sub-raw queries within raw statements

### Breaking Changes:

- "collate nocase" no longer used by default in sqlite3 #396

### Other Changes:

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

- Add missing \_ require to WebSQL builds

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

- The [returning](#Builder-returning) in PostgreSQL may now accept \* or an array of columns to return. If either of these are passed, the response will be an array of objects rather than an array of values. Updates may also now use a `returning` value. (#132)
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
