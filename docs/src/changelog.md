## Changelog

### 2.5.1 - 12 July, 2023

**Bug fixes**

- Fix Linting [#5455](https://github.com/knex/knex/issues/5460) - [#5460](https://github.com/knex/knex/issues/5460)

### 2.5.0 - 08 July, 2023

**New features**

- Add uuid helper function [#5617](https://github.com/knex/knex/issues/5617)
- Add `nativeBindings` option to `better-sqlite3` options [#5461](https://github.com/knex/knex/issues/5461)
- Add QueryBuilder#updateFrom [#5386](https://github.com/knex/knex/issues/5386)
- Add readonly transaction access mode [#5445](https://github.com/knex/knex/issues/5445)
- Add readonly option to Better-SQLite3 [#5530](https://github.com/knex/knex/issues/5530)
- Add EXCEPT as a valid keyword [#5357](https://github.com/knex/knex/issues/5357)
- Add ability to prepend query comments [#5289](https://github.com/knex/knex/issues/5289)
- Add fetchAsString option [#5484](https://github.com/knex/knex/issues/5484)

**Bug fixes**

- Avoid password leaks on query logs [#5559](https://github.com/knex/knex/issues/5559)
- Add knex.mjs to files in package.json [#5518](https://github.com/knex/knex/issues/5518)
- Handle numeric array elements in .orderBy() [#5551](https://github.com/knex/knex/issues/5551)
- Attach error handler early enough [#5552](https://github.com/knex/knex/issues/5552)
- Fix Returning \* in Oracle [#5598](https://github.com/knex/knex/issues/5598)
- Fix indexType option in `Postgres` [#5601](https://github.com/knex/knex/issues/5601)
- Add mjs extension type [#5616](https://github.com/knex/knex/issues/5616)
- Use implicit check on json fields for OracleDB [#5478](https://github.com/knex/knex/issues/5478)
- Fix when manually close source stream [#5466](https://github.com/knex/knex/issues/5466)
- Fix case sensitive issue with get table [#5509](https://github.com/knex/knex/issues/5509)

**Typings**

- Add Object syntax overload to increment method [#5512](https://github.com/knex/knex/issues/5512)
- Add object syntax overload to decrement method [#5555](https://github.com/knex/knex/issues/5555)
- Fix typing for toSql [#5594](https://github.com/knex/knex/issues/5594)
- Add ResolveTableType for `.merge()` [#5605](https://github.com/knex/knex/issues/5605)
- Add missing types for havingNull and havingNotNull [#5529](https://github.com/knex/knex/issues/5529)
- Add collate to the columnbuilder interface [#5568](https://github.com/knex/knex/issues/5568)
- TableBuilder methods return the SchemaBuilder. [#5486](https://github.com/knex/knex/issues/5486)

### 2.4.2 - 22 January, 2023

**Bug fixes**

- CLI: Fix incorrent EOL causing errors on Linux [#5455](https://github.com/knex/knex/issues/5455)

### 2.4.1 - 18 January, 2023

**Bug fixes**

- Fix Postgres Malformed array literal 2.4.0 Regression - [#5439](https://github.com/knex/knex/issues/5439)

### 2.4.0 - 6 January, 2023

**New features**

- Support partial unique indexes [#5316](https://github.com/knex/knex/issues/5316)
- Make compiling SQL in error message optional [#5282](https://github.com/knex/knex/issues/5282)

**Bug fixes**

- Insert array into json column [#5321](https://github.com/knex/knex/issues/5321)
- Fix unexpected max acquire-timeout [#5377](https://github.com/knex/knex/issues/5377)
- Fix: orWhereJson [#5361](https://github.com/knex/knex/issues/5361)
- MySQL: Add assertion for basic where clause not to be object or array [#1227](https://github.com/knex/knex/issues/1227)
- SQLite: Fix changing the default value of a boolean column in SQLite [#5319](https://github.com/knex/knex/issues/5319)

**Typings**

- add missing type for 'expirationChecker' on PgConnectionConfig [#5334](https://github.com/knex/knex/issues/5334)

### 2.3.0 - 31 August, 2022

**New features**

- PostgreSQL: Explicit jsonb support for custom pg clients [#5201](https://github.com/knex/knex/issues/5201)
- SQLite: Support returning with sqlite3 and better-sqlite3 [#5285](https://github.com/knex/knex/issues/5285)
- MSSQL: Implement mapBinding mssql dialect option [#5292](https://github.com/knex/knex/issues/5292)

**Typings**

- Update types for TS 4.8 [#5279](https://github.com/knex/knex/issues/5279)
- Fix typo [#5267](https://github.com/knex/knex/issues/5267)
- Fix WhereJsonObject withCompositeTableType [#5306](https://github.com/knex/knex/issues/5306)
- Fix AnalyticFunction type [#5304](https://github.com/knex/knex/issues/5304)
- Infer specific column value type in aggregations [#5297](https://github.com/knex/knex/issues/5297)

### 2.2.0 - 18 July, 2022

**New features**

- Inline primary key creation for postgres flavours [#5233](https://github.com/knex/knex/issues/5233)
- SQLite: Add warning for undefined connection file [#5223](https://github.com/knex/knex/issues/5223)
- MSSQL: Add JSON parameter support for connection [#5200](https://github.com/knex/knex/issues/5200)

**Bug fixes**

- PostgreSQL: add primaryKey option for uuid [#5212](https://github.com/knex/knex/issues/5212)

**Typings**

- Add promisable and better types [#5222](https://github.com/knex/knex/issues/5222)
- Update raw query bind parameter type [#5208](https://github.com/knex/knex/issues/5208)

### 2.1.0 - 26 May, 2022

**New features**

- Improve bundling experience to safely import dialects while using static paths [#5142](https://github.com/knex/knex/issues/5142)
- Implement extendable builders [#5041](https://github.com/knex/knex/issues/5041)
- PostgreSQL: Refresh materialized view concurrently [#5166](https://github.com/knex/knex/issues/5166)

**Bug fixes**

- Use correct paths in package.json browser field [#5174](https://github.com/knex/knex/issues/5174)
- MariaDB: Fix 'NULL' returned instead of NULL on MariaDB 10.2.6+ [#5181](https://github.com/knex/knex/issues/5181)
- MySQL: fix hasColumn Error (hasColumn ('a_id') is true, but hasColumn('a_Id') is false) [#5148](https://github.com/knex/knex/issues/5148)
- MSSQL: Fix .hasTable result when using .withSchema [#5176](https://github.com/knex/knex/issues/5176)
- Oracle: correctly INSERTS Buffer [#4869](https://github.com/knex/knex/issues/4869)

**Typings**

- Update type definitions for pg connection [#5139](https://github.com/knex/knex/issues/5139)

### 2.0.0 - 21 April, 2022

**Breaking changes**

- Restore sqlite3 package [#5136](https://github.com/knex/knex/issues/5136)

**Test / internal changes**

- Migrate Husky from 4 to 7 [#5137](https://github.com/knex/knex/issues/5137)
- Migrate Jake to 10.8.5 [#5138](https://github.com/knex/knex/issues/5138)

### 1.0.7 - 13 March, 2022

**Bug fixes**

- CLI: Fix cli migrate:make SQLite dependency [#5106](https://github.com/knex/knex/issues/5106)

### 1.0.6 - 12 March, 2022

**Bug fixes**

- PostgreSQL: Wait for search path to be set before returning connection [#5107](https://github.com/knex/knex/issues/5107)
- CLI: No client override during migrate:make [#5109](https://github.com/knex/knex/issues/5109)

### 1.0.5 - 05 March, 2022

**New features**

- Override knexfile options with CLI options [#4047](https://github.com/knex/knex/issues/4047)

**Bug fixes**

- Stringify json value in update [#5063](https://github.com/knex/knex/issues/5063)
- Fix isModuleType() for yarn [#4447](https://github.com/knex/knex/issues/4447)
- Wrapped Unions Fixes [#5072](https://github.com/knex/knex/issues/5072)
- SQLite: Fix @vscode-sqlite3 error message [#5081](https://github.com/knex/knex/issues/5081)
- CLI: Fix completed migration listing [#5060](https://github.com/knex/knex/issues/5060)

**Typings**

- Make default generic parameters of `Knex` match the generic parameter types of `knex` [#5021](https://github.com/knex/knex/issues/5021)
- Update knex types for TS 4.7 [#5095](https://github.com/knex/knex/issues/5095)

### 1.0.4 - 13 March, 2022

**New features**

- Add whereLike functions [#5044](https://github.com/knex/knex/issues/5044)

**Bug fixes**

- Fix orWhereJsonPath clause [#5022](https://github.com/knex/knex/issues/5022)
- Subquery in on clause missing parenthesis [#5049](https://github.com/knex/knex/issues/5049)
- Rework Union Wrapping [#5030](https://github.com/knex/knex/issues/5030)
- Oracle: Fix batch inserts with DEFAULT values with OracleDB [#2592](https://github.com/knex/knex/issues/2592) [#5037](https://github.com/knex/knex/issues/5037)

**Typings**

- Fix types for "returning" methods [#5031](https://github.com/knex/knex/issues/5031)
- createTableLike callback should be optional [#5055](https://github.com/knex/knex/issues/5055)

**Documentation**

- Website URL changed to https://knex.github.io/documentation/

### 1.0.3 - 11 February, 2022

**Bug fixes**

- Fix error message for missing migration files [#4937](https://github.com/knex/knex/issues/4937)
- Add withMaterialized and withNotMaterialized to method-constants [#5009](https://github.com/knex/knex/issues/5009)
- PostgreSQL: Fix whereJsonPath queries [#5011](https://github.com/knex/knex/issues/5011)
- PostgreSQL: Fix delete joins [#5016](https://github.com/knex/knex/issues/5016)
- CockroachDB: Fix whereJsonPath queries [#5011](https://github.com/knex/knex/issues/5011)
- MySQL: Create primary keys in same statement [#5017](https://github.com/knex/knex/issues/5017)

**Typings**

- Fix type definition for getMigration in MigrationSource [#4998](https://github.com/knex/knex/issues/4998)
- Fix argument type of alter method [#4996](https://github.com/knex/knex/issues/4996)

**Improvements**

- Use async / await syntax in seeds as default [#5005](https://github.com/knex/knex/issues/5005)

**Documentation**

- Add Firebird dialect to ECOSYSTEM.md [#5003](https://github.com/knex/knex/issues/5003)

### 1.0.2 - 02 February, 2022

**New features**

- Support of MATERIALIZED and NOT MATERIALIZED with WITH/CTE [#4940](https://github.com/knex/knex/issues/4940)
- Add raw support in onConflict clause [#4960](https://github.com/knex/knex/issues/4960)
- Alter nullable constraint when alterNullable is set to true [#4730](https://github.com/knex/knex/issues/4730)
- Add alterType parameter for alter function [#4967](https://github.com/knex/knex/issues/4967)
- Support string json in json values [#4988](https://github.com/knex/knex/issues/4988)
- MySQL: add with clause [#4508](https://github.com/knex/knex/issues/4508)

**Bug fixes**

- Fix error message for missing migration files [#4937](https://github.com/knex/knex/issues/4937)
- Move deferrable to after on update/on delete [#4976](https://github.com/knex/knex/issues/4976)
- Do not use sys.tables to find if a table exists [#2328](https://github.com/knex/knex/issues/2328)
- PostgreSQL: Fix Order nulls [#4989](https://github.com/knex/knex/issues/4989)
- MySQL: Fix collation when renaming column [#2666](https://github.com/knex/knex/issues/2666)
- SQLite: Same boolean handling in better-sqlite3 as in sqlite3 [#4982](https://github.com/knex/knex/issues/4982)

**Typings**

- WhereILike - fix typo [#4941](https://github.com/knex/knex/issues/4941)

### 1.0.1 - 16 January, 2022

**Bug fixes**

- Fix package.json metadata

### 1.0.0 - 16 January, 2022

**Breaking changes**

- Dropped support for Node 10;
- Replaced unsupported `sqlite3` driver with `@vscode/sqlite3`;
- Changed data structure from `RETURNING` operation to be consistent with `SELECT`;
- Changed Migrator to return list of migrations as objects consistently.

**New features**

- Support fromRaw [#4781](https://github.com/knex/knex/issues/4781)
- Support zero precision in timestamp/datetime [#4784](https://github.com/knex/knex/issues/4784)
- Support whereLike and whereILike [#4779](https://github.com/knex/knex/issues/4779)
- Add JSDoc (TS flavor) to stub files [#4809](https://github.com/knex/knex/issues/4809)
- Allow skip binding in limit and offset [#4811](https://github.com/knex/knex/issues/4811)
- Support creating a new table in the database based on another table [#4821](https://github.com/knex/knex/issues/4821)
- Accept Raw on onIn joins [#4830](https://github.com/knex/knex/issues/4830)
- Implement support for custom seed sources [#4842](https://github.com/knex/knex/issues/4842)
- Add binary uuid option [#4836](https://github.com/knex/knex/issues/4836)
- ForUpdate array parameter [#4882](https://github.com/knex/knex/issues/4882)
- Add camel case to timestamps method [#4803](https://github.com/knex/knex/issues/4803)
- Advanced JSON support [#4859](https://github.com/knex/knex/issues/4859)
- Add type to TypeScript knexfile [#4909](https://github.com/knex/knex/issues/4909)
- Checks Constraints Support [#4874](https://github.com/knex/knex/issues/4874)
- Support creating multiple PKs with increments [#4903](https://github.com/knex/knex/issues/4903)
- Enable wrapIdentifier for SQLite .hasTable [#4915](https://github.com/knex/knex/issues/4915)
- MSSQL: Add support for unique constraint [#4887](https://github.com/knex/knex/issues/4887)
- SQLite: New dialect, using better-sqlite3 driver [#4871](https://github.com/knex/knex/issues/4871)
- SQLite: Switch to @vscode/sqlite3 [#4866](https://github.com/knex/knex/issues/4866)
- SQLite: Support createViewOrReplace [#4856](https://github.com/knex/knex/issues/4856)
- SQLite: Support RETURNING statements for better-sqlite3 driver [#4934](https://github.com/knex/knex/issues/4934)
- PostgreSQL: Support JOIN and USING syntax for Delete Statement [#4800](https://github.com/knex/knex/issues/4800)

**Bug fixes**

- Fix overzealous warning on use of whereNot with "in" or "between" [#4780](https://github.com/knex/knex/issues/4780)
- Fix Union all + first syntax error [#4799](https://github.com/knex/knex/issues/4799)
- Make view columns optional in create view like [#4829](https://github.com/knex/knex/issues/4829)
- Insert lock row fix during migration [#4865](https://github.com/knex/knex/issues/4865)
- Fix for createViewOrReplace [#4856](https://github.com/knex/knex/issues/4856)
- SQLite: Fix foreign key constraints when altering a table [#4189](https://github.com/knex/knex/issues/4189)
- MySQL: Validate connection fix [#4794](https://github.com/knex/knex/issues/4794)
- MySQL: Set comment size warning limit to 1024 [#4867](https://github.com/knex/knex/issues/4867)

**Typings**

- Allow string indexType in index creation [#4791](https://github.com/knex/knex/issues/4791)
- Add missing ints typings [#4832](https://github.com/knex/knex/issues/4832)
- Returning method types [#4881](https://github.com/knex/knex/issues/4881)
- Improve columnInfo type [#4868](https://github.com/knex/knex/issues/4868)

### 0.95.15 - 22 December, 2021

**Bug fixes**

- Oracle:
- MariaDB: lock row fix during migration in MariaDB and Oracle [#4865](https://github.com/knex/knex/issues/4865)

### 0.95.14 - 09 November, 2021

**Bug fixes**

- MySQL: mysql2 dialect validate connection fix [#4794](https://github.com/knex/knex/issues/4794)

### 0.95.13 - 02 November, 2021

**Bug fixes**

- PostgreSQL: Support zero precision in timestamp/datetime [#4784](https://github.com/knex/knex/issues/4784)

**Typings**

- Allow string indexType in index creation [#4791](https://github.com/knex/knex/issues/4791)

### 0.95.12 - 28 October, 2021

**New features**

- New dialect: CockroachDB [#4742](https://github.com/knex/knex/issues/4742)
- New dialect: pg-native [#4327](https://github.com/knex/knex/issues/4327)
- CockroachDB: add support for upsert [#4767](https://github.com/knex/knex/issues/4767)
- PostgreSQL: Support SELECT .. FOR NO KEY UPDATE / KEY SHARE row level locking clauses [#4755](https://github.com/knex/knex/issues/4755)
- PostgreSQL: Add support for 'CASCADE' in PostgreSQL 'DROP SCHEMA' queries [#4713](https://github.com/knex/knex/issues/4713)
- MySQL: Add storage engine index Type support to index() and unique() schema [#4756](https://github.com/knex/knex/issues/4756)
- MSSQL: Support table.primary, table.unique variant with options object [#4710](https://github.com/knex/knex/issues/4710)
- SQLite: Add setNullable support to SQLite [#4684](https://github.com/knex/knex/issues/4684)
- Add geometry column building [#4776](https://github.com/knex/knex/issues/4776)
- Add support for creating table copies [#1373](https://github.com/knex/knex/issues/1373)
- Implement support for views and materialized views [#1626](https://github.com/knex/knex/issues/1626)
- Implement partial index support [#4768](https://github.com/knex/knex/issues/4768)
- Support for 'is null' in 'order by' [#3667](https://github.com/knex/knex/issues/3667)

**Bug fixes**

- Fix support for Oracle connections passed via knex.connection() [#4757](https://github.com/knex/knex/issues/4757)
- Avoid inserting multiple locks if a migration lock already exists [#4694](https://github.com/knex/knex/issues/4694)

**Typings**

- Some TableBuilder methods return wrong types [#4764](https://github.com/knex/knex/issues/4764)
- Update JoinRaw bindings type to accept arrays [#4752](https://github.com/knex/knex/issues/4752)
- fix onDelete/onUpdate for ColumnBuilder [#4656](https://github.com/knex/knex/issues/4656)

### 0.95.11 - 03 September, 2021

**New features**

- Add support for nullability modification via schema builder (table.setNullable() and table.dropNullable()) [#4657](https://github.com/knex/knex/issues/4657)
- MySQL: Add support for mysql/mariadb-client JSON parameters in connectionURIs [#4629](https://github.com/knex/knex/issues/4629)
- MSSQL: Support comments as MS_Description properties [#4632](https://github.com/knex/knex/issues/4632)

**Bug fixes**

- Fix Analytic orderBy and partitionBy to follow the SQL documentation [#4602](https://github.com/knex/knex/issues/4602)
- CLI: fix migrate:up for migrations disabling transactions [#4550](https://github.com/knex/knex/issues/4550)
- SQLite: Fix adding a column with a foreign key constraint in SQLite [#4649](https://github.com/knex/knex/issues/4649)
- MSSQL: columnInfo() support case-sensitive database collations [#4633](https://github.com/knex/knex/issues/4633)
- MSSQL: Generate valid SQL for withRecursive() [#4514](https://github.com/knex/knex/issues/4514)
- Oracle: withRecursive: omit invalid RECURSIVE keyword, include column list [#4514](https://github.com/knex/knex/issues/4514)

**Improvements**

- Add .mjs migration and seed stubs [#4631](https://github.com/knex/knex/issues/4631)
- SQLite: Clean up DDL handling and move all operations to the parser-based approach [#4648](https://github.com/knex/knex/issues/4648)

### 0.95.10 - 20 August, 2021

**Improvements**

- Use sys info function instead of connection db name [#4623](https://github.com/knex/knex/issues/4623)

**Typings**

- Deferrable and withkeyName should not be in ColumnBuilder [#4600](https://github.com/knex/knex/issues/4600)

### 0.95.9 - 31 July, 2021

**New features**

- Oracle: support specifying schema for dropTable and dropSequence [#4596](https://github.com/knex/knex/issues/4596)
- Oracle: support specifying schema for autoincrement [#4594](https://github.com/knex/knex/issues/4594)

**Typings**

- Add TypeScript support for deferrable, new Primary/Unique syntax [#4589](https://github.com/knex/knex/issues/4589)

### 0.95.8 - 25 July, 2021

**New features**

- Add deferrable support for constraint [#4584](https://github.com/knex/knex/issues/4584)
- Implement delete with join [#4568](https://github.com/knex/knex/issues/4568)
- Add DPI error codes for Oracle [#4536](https://github.com/knex/knex/issues/4536)

**Bug fixes**

- Fixing PostgreSQL datetime and timestamp column created with wrong format [#4578](https://github.com/knex/knex/issues/4578)

**Typings**

- Improve analytic types [#4576](https://github.com/knex/knex/issues/4576)
- MSSQL: Add trustServerCertificate option [#4500](https://github.com/knex/knex/issues/4500)

### 0.95.7 - 10 July, 2021

**New features**

- Add ability to omit columns on an onConflict().ignore() [#4557](https://github.com/knex/knex/issues/4557)
- CLI: Log error message [#4534](https://github.com/knex/knex/issues/4534)

**Typings**

- Export Knex.TransactionConfig [#4498](https://github.com/knex/knex/issues/4498)
- Include options object in count(Distinct) typings [#4491](https://github.com/knex/knex/issues/4491)
- Add types for analytic functions [#4544](https://github.com/knex/knex/issues/4544)

### 0.95.6 - 17 May, 2021

**Typings**

- Export TransactionProvider type [#4489](https://github.com/knex/knex/issues/4489)

### 0.95.5 - 11 May, 2021

**New features**

- SQLite: Add support for file open flags [#4446](https://github.com/knex/knex/issues/4446)
- Add .cjs extension to Seeder.js to support Node ESM [#4381](https://github.com/knex/knex/issues/4381) [#4382](https://github.com/knex/knex/issues/4382)

**Bug fixes**

- Remove peerDependencies to avoid auto-install on npm 7 [#4480](https://github.com/knex/knex/issues/4480)

**Typings**

- Fix typing for increments and bigIncrements [#4406](https://github.com/knex/knex/issues/4406)
- Add typings for on JoinClause for onVal [#4436](https://github.com/knex/knex/issues/4436)
- Adding Type Definition for isTransaction [#4418](https://github.com/knex/knex/issues/4418)
- Export client class from knex namespace [#4479](https://github.com/knex/knex/issues/4479)

### 0.95.4 - 26 March, 2021

**Typings**

- Fix mistyping of stream [#4400](https://github.com/knex/knex/issues/4400)

### 0.95.3 - 25 March, 2021

**New features**

- PostgreSQL: Add "same" as operator [#4372](https://github.com/knex/knex/issues/4372)
- MSSQL: Improve an estimate of the max comment length [#4362](https://github.com/knex/knex/issues/4362)
- Throw an error if negative offset is provided [#4361](https://github.com/knex/knex/issues/4361)

**Bug fixes**

- Fix timeout method [#4324](https://github.com/knex/knex/issues/4324)
- SQLite: prevent dropForeign from being silently ignored [#4376](https://github.com/knex/knex/issues/4376)

**Typings**

- Allow config.client to be non-client instance [#4367](https://github.com/knex/knex/issues/4367)
- Add dropForeign arg type for single column [#4363](https://github.com/knex/knex/issues/4363)
- Update typings for TypePreservingAggregation and stream [#4377](https://github.com/knex/knex/issues/4377)

### 0.95.2 - 11 March, 2021

**New features**

- Improve ESM import support [#4350](https://github.com/knex/knex/issues/4350)

**Bug fixes**

- CLI: update ts.stub files to new TypeScript namespace [#4344](https://github.com/knex/knex/issues/4344)
- CLI: fix TypeScript migration stub after 0.95.0 changes [#4366](https://github.com/knex/knex/issues/4366)

**Typings**

- Move QueryBuilder and KnexTimeoutError into knex namespace [#4358](https://github.com/knex/knex/issues/4358)

**Test / internal changes**

- Unify db test helpers [#4356](https://github.com/knex/knex/issues/4356)

### 0.95.1 - 04 March, 2021

**Bug fixes**

- CLI: fix `knex init` not finding default knexfile [#4339](https://github.com/knex/knex/issues/4339)

### 0.95.0 - 03 March, 2021

Note: there are many breaking changes in this version, particularly in TypeScript support. Please see `UPGRADING.md` for details.

**New features**

- Add transaction isolation support [#4185](https://github.com/knex/knex/issues/4185)
- Add analytic functions [#4188](https://github.com/knex/knex/issues/4188)
- Change default to not trigger a promise rejection for transactions with a specified handler [#4195](https://github.com/knex/knex/issues/4195)
- Make toSQL().toNative() work for Raw to match the API for QueryBuilder [#4058](https://github.com/knex/knex/issues/4058)
- Allow 'match' operator [#3569](https://github.com/knex/knex/issues/3569)
- Support optimizer hints [#4243](https://github.com/knex/knex/issues/4243)
- Add parameter to prevent autoincrement columns from being primary keys [#4266](https://github.com/knex/knex/issues/4266)
- Make "first" and "pluck" mutually exclusive [#4280](https://github.com/knex/knex/issues/4280)
- Added merge strategy to allow selecting columns to upsert. [#4252](https://github.com/knex/knex/issues/4252)
- Throw error if the array passed to insert is empty [#4289](https://github.com/knex/knex/issues/4289)
- Events: introduce queryContext on query-error [#4301](https://github.com/knex/knex/issues/4301)
- CLI: Use UTC timestamp for new migrations [#4245](https://github.com/knex/knex/issues/4245)
- MSSQL: Replace MSSQL dialect with Tedious.js implementation [#2857](https://github.com/knex/knex/issues/2857) [#4281](https://github.com/knex/knex/issues/4281)
- MSSQL: Use "nvarchar(max)" for ".json()" [#4278](https://github.com/knex/knex/issues/4278)
- MSSQL: Schema builder - add predictable constraint names for default values [#4319](https://github.com/knex/knex/issues/4319)
- MSSQL: Schema builder - attempt to drop default constraints when changing default value on columns [#4321](https://github.com/knex/knex/issues/4321)
- SQLite: Fallback to json for sqlite3 when using jsonb [#4186](https://github.com/knex/knex/issues/4186)
- SQLite: Return complete list of DDL commands for creating foreign keys [#4194](https://github.com/knex/knex/issues/4194)
- SQLite: Support dropping composite foreign keys [#4202](https://github.com/knex/knex/issues/4202)
- SQLite: Recreate indices when altering a table [#4277](https://github.com/knex/knex/issues/4277)
- SQLite: Add support for altering columns [#4322](https://github.com/knex/knex/issues/4322)

**Bug fixes**

- Fix issue with .withSchema usage with joins on a subquery [#4267](https://github.com/knex/knex/issues/4267)
- Fix issue with schema usage with FROM clause contain QueryBuilder, function or Raw [#4268](https://github.com/knex/knex/issues/4268)
- CLI: Address raised security warnings by dropping liftoff [#4122](https://github.com/knex/knex/issues/4122)
- CLI: Fix an issue with npm@7 and ESM when `type` was set to `'module'` in `package.json` [#4295](https://github.com/knex/knex/issues/4295)
- PostgreSQL: Add check to only create native enum once [#3658](https://github.com/knex/knex/issues/3658)
- SQLite: Fix foreign key "on delete" when altering a table [#4225](https://github.com/knex/knex/issues/4225)
- SQLite: Made the constraint detection case-insensitive [#4330](https://github.com/knex/knex/issues/4330)
- MySQL: Keep auto increment after rename [#4266](https://github.com/knex/knex/issues/4266)
- MSSQL: don't raise query-error twice [#4314](https://github.com/knex/knex/issues/4314)
- MSSQL: Alter column must have its own query [#4317](https://github.com/knex/knex/issues/4317)

**Typings**

- TypeScript 4.1+ is now required
- Add missing onConflict overrides [#4182](https://github.com/knex/knex/issues/4182)
- Introduce the "infamous triplet" export [#4181](https://github.com/knex/knex/issues/4181)
- Fix type definition of Transaction [#4172](https://github.com/knex/knex/issues/4172)
- Add typedefinitions for havingNotIn [#4265](https://github.com/knex/knex/issues/4265)
- Include 'name' property in MigratorConfig [#4300](https://github.com/knex/knex/issues/4300)
- Improve join and conflict types [#4318](https://github.com/knex/knex/issues/4318)
- Fix ArrayIfAlready type [#4331](https://github.com/knex/knex/issues/4331)

**Test / internal changes**

- Drop global Knex.raw [#4180](https://github.com/knex/knex/issues/4180)
- Stop using legacy url.parse API [#3702](https://github.com/knex/knex/issues/3702)
- Various internal refactorings [#4175](https://github.com/knex/knex/issues/4175) [#4177](https://github.com/knex/knex/issues/4177) [#4178](https://github.com/knex/knex/issues/4178) [#4192](https://github.com/knex/knex/issues/4192)
- Refactor to classes [#4190](https://github.com/knex/knex/issues/4190) [#4191](https://github.com/knex/knex/issues/4191) [#4193](https://github.com/knex/knex/issues/4193) [#4210](https://github.com/knex/knex/issues/4210) [#4253](https://github.com/knex/knex/issues/4253)
- Move transaction type tests to TSD [#4208](https://github.com/knex/knex/issues/4208)
- Clean up destroy logic [#4248](https://github.com/knex/knex/issues/4248)
- Colorize code snippets in readme files [#4234](https://github.com/knex/knex/issues/4234)
- Add "Ecosystem" documentation for Knex plugins [#4183](https://github.com/knex/knex/issues/4183)
- Documentation cleanup
- SQLite: Use SQLite "rename column" instead of a DDL helper [#4200](https://github.com/knex/knex/issues/4200)
- SQLite: Simplify reinsert logic when altering a table [#4272](https://github.com/knex/knex/issues/4272)

### 0.21.19 - 02 March, 2021

- SQLite: Made the constraint detection case-insensitive [#4332](https://github.com/knex/knex/issues/4332)

### 0.21.18 - 22 February, 2021

- CLI: Fix an issue with npm@7 and ESM when type was set to 'module' in package.json [#4295](https://github.com/knex/knex/issues/4295)

### 0.21.17 - 30 January, 2021

**Bug fixes**

- SQLite: Fix SQLite foreign on delete when altering a table [#4261](https://github.com/knex/knex/issues/4261)

**New features**

- Add support for optimizer hints (see https://github.com/knex/documentation/pull/306 for documentation) [#4243](https://github.com/knex/knex/issues/4243)

### 0.21.16 - 17 January, 2021

**Bug fixes**

- MSSQL: Avoid passing unsupported pool param. Fixes node-mssql 7+ support [#4236](https://github.com/knex/knex/issues/4236)

### 0.21.15 - 26 December, 2020

**New features**

- SQLite: Add primary/foreign support on alterTable [#4162](https://github.com/knex/knex/issues/4162)
- SQLite: Add dropPrimary/dropForeign support on alterTable [#4162](https://github.com/knex/knex/issues/4162)

**Typings**

- Add "after" and "first" to columnBuilder types [#3549](https://github.com/knex/knex/issues/3549) [#4169](https://github.com/knex/knex/issues/4169)

**Test / internal changes**

- Extract knex config resolution logic [#4166](https://github.com/knex/knex/issues/4166)
- Run CI using GitHub Actions [#4168](https://github.com/knex/knex/issues/4168)
- Add Node.js 15 to CI matrix [#4173](https://github.com/knex/knex/issues/4173)

### 0.21.14 - 18 December, 2020

**New features**

- MSSQL: support "returning" on inserts, updates and deletes on tables with triggers [#4152](https://github.com/knex/knex/issues/4152)
- Use esm import if package.json type is "module" [#4158](https://github.com/knex/knex/issues/4158)

**Bug fixes**

- Make sure query-response and query-error events contain \_knexTxId [#4160](https://github.com/knex/knex/issues/4160)

**Test / internal changes**

- Improved integration test framework [#4161](https://github.com/knex/knex/issues/4161)

### 0.21.13 - 12 December, 2020

**New features**

- SQLite: Add support for `dropForeign` [#4092](https://github.com/knex/knex/issues/4092)
- Add support for WHERE clauses to "upsert" queries [#4148](https://github.com/knex/knex/issues/4148)

**Bug fixes**

- MSSQL: Avoid connection getting stuck on socket hangup [#4157](https://github.com/knex/knex/issues/4157)
- Oracle: Support specifying non-default DB port [#4147](https://github.com/knex/knex/issues/4147)
- Oracle: Support inserts with only default values (empty body) [#4092](https://github.com/knex/knex/issues/4092)
- CLI: fix irregular seed file execution order [#4156](https://github.com/knex/knex/issues/4156)
- Fix performance of asyncStackTraces with enable-source-maps node flag [#4154](https://github.com/knex/knex/issues/4154)

**Typings**

- PostgreSQL: Add support for application_name [#4153](https://github.com/knex/knex/issues/4153)
- Fix types for insert to allow array [#4105](https://github.com/knex/knex/issues/4105)
- Add types for userParams and withUserParams [#4119](https://github.com/knex/knex/issues/4119)
- Added type for withKeyName [#4139](https://github.com/knex/knex/issues/4139)
- Fix batchInsert definitions [#4131](https://github.com/knex/knex/issues/4131)
- Fix types for WhereIn signature (value or query builder) [#3863](https://github.com/knex/knex/issues/3863)
- Add types for connection config of mysql2 driver [#4144](https://github.com/knex/knex/issues/4144)

**Test / internal changes**

- Move TS tests to tsd (WIP) [#4109](https://github.com/knex/knex/issues/4109) [#4110](https://github.com/knex/knex/issues/4110)

### 0.21.12 - 02 November, 2020

**Typings**

- Reintroduce support for globally defining table/record mapping [#4100](https://github.com/knex/knex/issues/4100)
- Add a few missing types for MSSQL Connection [#4103](https://github.com/knex/knex/issues/4103)
- Make .ignore() and .merge() return QueryBuilder rather than QueryInterface [#4102](https://github.com/knex/knex/issues/4102)
- Use tarn config TS types instead of generic-pool [#4064](https://github.com/knex/knex/issues/4064)

### 0.21.11 - 01 November, 2020

**Typings**

- Revert support for globally defining table/record mapping [#4099](https://github.com/knex/knex/issues/4099)

### 0.21.10 - 31 October, 2020

**New features**

- Upsert support (Postgres/MySQL/Sqlite) [#3763](https://github.com/knex/knex/issues/3763)

**Bug fixes**

- Switch to non-uuid knexQueryUids to avoid issues when mocking global date [#4089](https://github.com/knex/knex/issues/4089)

**Typings**

- Allow to globally define table/record mapping [#4071](https://github.com/knex/knex/issues/4071)

### 0.21.9 - 27 October, 2020

**New features**

- add method clear(statement) to QueryBuilder [#4051](https://github.com/knex/knex/issues/4051)

**Bug fixes**

- CLI: fix help text being printed twice [#4072](https://github.com/knex/knex/issues/4072)
- Oracle: columnInfo() no longer requires an Owner User [#4053](https://github.com/knex/knex/issues/4053)
- Add missing "start" event propagation from transaction [#4087](https://github.com/knex/knex/issues/4087)

### 0.21.8 - 27 October, 2020

**Bug fixes**

- MSSQL: Escape properly if literal '?' is needed [#4053](https://github.com/knex/knex/issues/4053)
- Make toQuery behavior consistent with pre-0.21.7 (do not break on empty builder) [#4083](https://github.com/knex/knex/issues/4083)
- Fix comment escaping for MySQL and PostgreSQL [#4084](https://github.com/knex/knex/issues/4084)

### 0.21.7 - 25 October, 2020

**New features**

- CLI: Add migration stub for .cjs extension [#4065](https://github.com/knex/knex/issues/4065)

**Bug fixes**

- MSSQL: Add dynamic scaling for decimal values and prevents a UInt64 overflow [#3910](https://github.com/knex/knex/issues/3910)
- MSSQL: Fix apostrophe escaping [#4077](https://github.com/knex/knex/issues/4077)
- Ensure that semicolon is not appended to statements that already end with a semicolon [#4052](https://github.com/knex/knex/issues/4052)

**Typings**

- Add arguments to QueryCallback in Where [#4034](https://github.com/knex/knex/issues/4034)

**Test / internal changes**

- Replace lodash type-checks with native solutions [#4056](https://github.com/knex/knex/issues/4056)
- Replace mkdirp with native recursive flag [#4060](https://github.com/knex/knex/issues/4060)
- Replace inherits package with builtin utility [#4059](https://github.com/knex/knex/issues/4059)

### 0.21.6 - 27 September, 2020

**New features**

- CLI: New config parameter / CLI flag to prefixing seed filename with timestamp [#3873](https://github.com/knex/knex/issues/3873)
- CLI: throw an error when specific seed file cannot be found [#4011](https://github.com/knex/knex/issues/4011)
- Warn if whereNot is used with 'in' or 'between' [#4038](https://github.com/knex/knex/issues/4038)

**Bug fixes**

- CLI: Fix double merging of config for migrator [#4040](https://github.com/knex/knex/issues/4040)

**Typings**

- Unify SeedsConfig and SeederConfig [#4003](https://github.com/knex/knex/issues/4003)
- Allow string[] type for directory in SeedsConfig [#4033](https://github.com/knex/knex/issues/4033)

### 0.21.5 - 17 August, 2020

**New features**

- CLI: Improve Esm interop [#3985](https://github.com/knex/knex/issues/3985)
- CLI: Improve mjs module support [#3980](https://github.com/knex/knex/issues/3980)

**Test / internal changes**

- Bump version of dtslint [#3984](https://github.com/knex/knex/issues/3984)
- Test/document esm interop mixed formats (knexfile/migrations/seeds) [#3986](https://github.com/knex/knex/issues/3986)

### 0.21.4 - 10 August, 2020

**New features**

- CLI: Add new option for seed: recursive [#3974](https://github.com/knex/knex/issues/3974)

**Bug fixes**

- CLI: Do not load seeds from subfolders recursively by default [#3974](https://github.com/knex/knex/issues/3974)

### 0.21.3 - 08 August, 2020

**New features**

- CLI: Support multiple directories for seeds [#3967](https://github.com/knex/knex/issues/3967)

**Bug fixes**

- Ensure DB stream is destroyed when the PassThrough is destroyed [#2324](https://github.com/knex/knex/issues/2324)
- Support postProcessResponse for streams [#3931](https://github.com/knex/knex/issues/3931)
- Fix ESM module interop for calling module/package of type 'module' [#3938](https://github.com/knex/knex/issues/3938)
- CLI: Fix migration source name in rollback all [#3956](https://github.com/knex/knex/issues/3956)
- Fix getMergedConfig calls to include client logger [#3920](https://github.com/knex/knex/issues/3920)
- Escape single quoted values passed to defaultTo function [#3899](https://github.com/knex/knex/issues/3899)

**Typings**

- Add .timeout(ms) to .raw()'s typescript typings [#3885](https://github.com/knex/knex/issues/3885)
- Add typing for double table column builder [#3950](https://github.com/knex/knex/issues/3950)
- Add a phantom tag to Ref type to mark received type parameters as used [#3934](https://github.com/knex/knex/issues/3934)
- Add `null` as valid binding type [#3946](https://github.com/knex/knex/issues/3946)

**Test / internal changes**

- Change query lab link to https [#3933](https://github.com/knex/knex/issues/3933)

### 0.21.2 - 10 July, 2020

**New features**

- Warn user if custom migration source is being reset [#3839](https://github.com/knex/knex/issues/3839)
- Prefer `void` as return type on migration generator ts stub [#3865](https://github.com/knex/knex/issues/3865)
- MSSQL: Added the removal of a columns default constraint, before dropping the column [#3855](https://github.com/knex/knex/issues/3855)

**Typings**

- Fix definition for raw querybuilders [#3846](https://github.com/knex/knex/issues/3846)

**Test / internal changes**

- Refactor migration logic to use async/await [#3838](https://github.com/knex/knex/issues/3838)

### 0.21.1 - 28 April, 2020

**New features**

- CLI: Add migrate:unlock command, truncate on forceFreeMigrationsLock [#3822](https://github.com/knex/knex/issues/3822)
- CLI: Add support for cjs files by default [#3829](https://github.com/knex/knex/issues/3829)

**Bug fixes**

- CLI: Fix inference of seed/migration extension from knexfile extension [#3814](https://github.com/knex/knex/issues/3814)
- rewrite delay to not node-only version. Fixes compatibility with browsers [#3820](https://github.com/knex/knex/issues/3820)

**Test / internal changes**

- Update dependencies. Explicitly support Node.js 14 [#3825](https://github.com/knex/knex/issues/3825) [#3830](https://github.com/knex/knex/issues/3830)

### 0.21.0 - 18 April, 2020

**Improvements**

- Reduce size of lodash in bundle [#3804](https://github.com/knex/knex/issues/3804)

**Breaking changes**

- Dropped support for Node 8
- Breaking upstream change in `pg-query-stream`: `Changed stream.close to stream.destroy which is the official way to terminate a readable stream. This is a breaking change if you rely on the stream.close method on pg-query-stream...though should be just a find/replace type operation to upgrade as the semantics remain very similar (not exactly the same, since internals are rewritten, but more in line with how streams are "supposed" to behave).`

**Test / internal changes**

- Updated Tarn.js to a version 3.0.0
- Updated mkdirp to a version 1.0.4
- Updated examples to use ES2015 style [#3810](https://github.com/knex/knex/issues/3810)

### 0.20.15 - 16 April, 2020

**Bug fixes**

- Support for `.finally(..)` on knex's Promise-alikes [#3800](https://github.com/knex/knex/issues/3800)

**Typings**

- Add types for `.distinctOn` [#3784](https://github.com/knex/knex/issues/3784)

### 0.20.14 - 13 April, 2020

**New features**

- CLI: adds support for asynchronous knexfile loading [#3748](https://github.com/knex/knex/issues/3748)
- Add clearGroup method [#3771](https://github.com/knex/knex/issues/3771)

**Typings**

- Support Raw types for insert, where, update [#3730](https://github.com/knex/knex/issues/3730)
- Add typings for MigrationSource [#3756](https://github.com/knex/knex/issues/3756)
- Update signature of orderBy to support QueryBuilder inside array [#3757](https://github.com/knex/knex/issues/3757)
- Add toSQL and toString to SchemaBuilder [#3758](https://github.com/knex/knex/issues/3758)
- `interface Knex` and `function Knex` should have the same types [#3787](https://github.com/knex/knex/issues/3787)
- Fix minor issues around typings [#3765](https://github.com/knex/knex/issues/3765)

**Test / internal changes**

- Minor test internal enhancements [#3747](https://github.com/knex/knex/issues/3747)
- Minor improvements on the usage of fs utilities [#3749](https://github.com/knex/knex/issues/3749)
- Split tests in groups [#3785](https://github.com/knex/knex/issues/3785)

### 0.20.13 - 23 March, 2020

**Bug fixes**

- Correctly handle dateToString escaping without timezone passed [#3742](https://github.com/knex/knex/issues/3742)
- Make protocol length check more defensive [#3744](https://github.com/knex/knex/issues/3744)

**Typings**

- Make the ChainableInterface conform to `Promise<T>` [#3724](https://github.com/knex/knex/issues/3724)

### 0.20.12 - 19 March, 2020

**Bug fixes**

- Added missing call to \_reject in Transactor#transaction [#3706](https://github.com/knex/knex/issues/3706)
- Fix method binding on knex proxy [#3717](https://github.com/knex/knex/issues/3717)
- Oracle: Transaction_OracleDB can use config.connection [#3731](https://github.com/knex/knex/issues/3731)

**Typings**

- Fix incorrect type signature of Having [#3719](https://github.com/knex/knex/issues/3719)

**Test / internal changes**

- Cleanup/remove transaction stalling [#3716](https://github.com/knex/knex/issues/3716)
- Rewrote Transaction#acquireConnection() methods to use async [#3707](https://github.com/knex/knex/issues/3707)

### 0.20.11 - 26 February, 2020

**Breaking changes**

- Knex returns native JS promises instead of Bluebird ones. This means that you no longer use such methods as `map`, `spread` and `reduce` on QueryBuilder instance.

**New features**

- Oracle: Add OracleDB handling for buffer type in fetchAsString [#3685](https://github.com/knex/knex/issues/3685)

**Bug fixes**

- Fix race condition in non-container transactions [#3671](https://github.com/knex/knex/issues/3671)

**Typings**

- Mark knex arguments of composite/collection types to be readonly [#3680](https://github.com/knex/knex/issues/3680)

**Test / internal changes**

- Remove dependency on Bluebird methods from sources [#3683](https://github.com/knex/knex/issues/3683)
- Cleanup and extract Transaction Workflow logic [#3674](https://github.com/knex/knex/issues/3674)

### 0.20.10 - 13 February, 2020

**Bug fixes**

- Oracle: commit was a no-op causing race conditions [#3668](https://github.com/knex/knex/issues/3668)
- CLI: Knex calls process.chdir() before opening Knexfile [#3661](https://github.com/knex/knex/issues/3661)
- Fixed unresolved promise in cancelQuery() [#3666](https://github.com/knex/knex/issues/3666)

**Typings**

- `fn.now` takes optionally a precision argument. [#3662](https://github.com/knex/knex/issues/3662)
- PG: Include SSL in connection definition [#3659](https://github.com/knex/knex/issues/3659)

**Test / internal changes**

- replace Bluebird.timeout [#3634](https://github.com/knex/knex/issues/3634)

### 0.20.9 - 08 February, 2020

**Bug fixes**

- CLI: Improve Support for Liftoff's Preloaders - this should fix some cases like using TS for your migrations [#3613](https://github.com/knex/knex/issues/3613)

**Typings**

- MSSQL: Add `enableArithAbort` to `MsSqlConnectionConfig`

**Test / internal changes**

- Refactor more tests to use cli-testlab [#3640](https://github.com/knex/knex/issues/3640)
- Update QueryCompiler implementation to use classes [#3647](https://github.com/knex/knex/issues/3647)

### 0.20.8 - 14 January, 2020

**New features**

- CLI: Support ES6 modules via flag --esm [#3616](https://github.com/knex/knex/issues/3616)

**Bug fixes**

- CLI: Print help only when there are no arguments [#3617](https://github.com/knex/knex/issues/3617)

**Typings**

- Fix incorrect type of QueryBuilder.first('\*') result [#3621](https://github.com/knex/knex/issues/3621)

### 0.20.7 - 07 January, 2020

**New features**

- Throw better error when trying to modify schema while using unsupported dialect [#3609](https://github.com/knex/knex/issues/3609)

**Bug fixes**

- Oracle: dispose connection on connection error [#3611](https://github.com/knex/knex/issues/3611)
- Oracle: fix not releasing connection from pool on disconnect [#3605](https://github.com/knex/knex/issues/3605)
- CLI: prevent warning with root command [#3604](https://github.com/knex/knex/issues/3604)

**Typings**

- Add create/drop schema methods to SchemaBuilder [#3579](https://github.com/knex/knex/issues/3579)

### 0.20.6 - 29 December, 2019

**Bug fixes**

- Enforce Unix (lf) line terminators [#3598](https://github.com/knex/knex/issues/3598)

### 0.20.5 - 29 December, 2019

**New features**

- Return more information about empty updates [#3597](https://github.com/knex/knex/issues/3597)

**Bug fixes**

- Fix colors in debug logs [#3592](https://github.com/knex/knex/issues/3592)

**Test / internal changes**

- Use more efficient algorithm for generating internal ids [#3595](https://github.com/knex/knex/issues/3595) [#3596](https://github.com/knex/knex/issues/3596)
- Use Buffer.alloc() instead of deprecated constructor [#3574](https://github.com/knex/knex/issues/3574)

### 0.20.4 - 08 December, 2019

**Bug fixes**

- Fix debug logger messing up queries with % [#3566](https://github.com/knex/knex/issues/3566)
- Make logger methods mutually consistent [#3567](https://github.com/knex/knex/issues/3567)

**Typings**

- Add missing methods to client type [#3565](https://github.com/knex/knex/issues/3565)
- Fix queryContext function defintion [#3562](https://github.com/knex/knex/issues/3562)
- Fix QueryBuilder.extend this type [#3526](https://github.com/knex/knex/issues/3526) [#3528](https://github.com/knex/knex/issues/3528)

**Test / internal changes**

- Remove bluebird.using [#3552](https://github.com/knex/knex/issues/3552)

### 0.20.3 - 27 November, 2019

**New features**

- MSSQL, MySQL: Add connection string qs to connection params [#3547](https://github.com/knex/knex/issues/3547)

**Bug fixes**

- Oracle: Fix issue retrieving BLOB from database [#3545](https://github.com/knex/knex/issues/3545)
- PostgreSQL: Timeout for postgresql use cancel instead of terminate [#3518](https://github.com/knex/knex/issues/3518)
- Make sure CLI works for namespaced knex packages [#2539](https://github.com/knex/knex/issues/2539)

**Typings**

- Lift up dialect specific methods in the CreateTableBuilder [#3532](https://github.com/knex/knex/issues/3532)
- Add client property to QueryBuilder type [#3541](https://github.com/knex/knex/issues/3541)
- Support 'only' option [#3551](https://github.com/knex/knex/issues/3551)

### 0.20.2 - 14 November, 2019

**New features**

- Add support for distinct on for postgres [#3513](https://github.com/knex/knex/issues/3513)

**Bug fixes**

- Make sqlite3 hasColumn case insensitive [#3435](https://github.com/knex/knex/issues/3435)

**Typings**

- Fix PoolConfig typing [#3505](https://github.com/knex/knex/issues/3505)
- Expand SeedsConfig types [#3531](https://github.com/knex/knex/issues/3531)
- Make the default type parameters of QueryBuilder less strict [#3520](https://github.com/knex/knex/issues/3520)
- Fix regression in older version of node when Promise#finally was not available [#3507](https://github.com/knex/knex/issues/3507)

### 0.20.1 - 29 October, 2019

**New features**

- Declare drivers as optional peerDependencies [#3081](https://github.com/knex/knex/issues/3081)
- Dynamic connection configuration resolution [#3497](https://github.com/knex/knex/issues/3497)

**Bug fixes**

- Wrap subQuery with parenthesis when it appears as table name [#3496](https://github.com/knex/knex/issues/3496)
- Fix Oracle error codes [#3498](https://github.com/knex/knex/issues/3498)

**Typings**

- Add interface for PG Connection object [#3372](https://github.com/knex/knex/issues/3372)
- Gracefully handle global promise pollution [#3502](https://github.com/knex/knex/issues/3502)

### 0.20.0 - 25 October, 2019

**New features**

- orderBy accepts QueryBuilder [#3491](https://github.com/knex/knex/issues/3491)
- Add validation in `.offset()` [#2908](https://github.com/knex/knex/issues/2908)
- disable_migrations_list_validation feature [#3448](https://github.com/knex/knex/issues/3448)

**Bug fixes**

- Fix oracledb driver v4 support [#3480](https://github.com/knex/knex/issues/3480)
- Fix some issues around seed and migration generation [#3479](https://github.com/knex/knex/issues/3479)
- Fix bugs in replacement logic used when dropping columns in SQLite [#3476](https://github.com/knex/knex/issues/3476)

**Typings**

- Add types to the Migrator interface [#3459](https://github.com/knex/knex/issues/3459)
- Fix typings of index and dropIndex TableBuilder methods [#3486](https://github.com/knex/knex/issues/3486)
- Fixes types for Seeder#run [#3438](https://github.com/knex/knex/issues/3438)

**Test / internal changes**

- Execute CI on Node.js 13
- Bluebird: remove usage of `return`, `reflect`, `fromCallback` methods [#3483](https://github.com/knex/knex/issues/3483)
- Bluebird: remove Bluebird.bind [#3477](https://github.com/knex/knex/issues/3477)
- Bluebird: use util.promisify instead of Bluebird.promisify [#3470](https://github.com/knex/knex/issues/3470)
- Bluebird: remove Bluebird.each [#3471](https://github.com/knex/knex/issues/3471)
- Bluebird: remove Bluebird.map and Bluebird.mapSeries [#3474](https://github.com/knex/knex/issues/3474)
- Bluebird: replace Bluebird.map with Promise.all [#3469](https://github.com/knex/knex/issues/3469)
- Update badges [#3482](https://github.com/knex/knex/issues/3482)

### 0.19.5 - 06 October, 2019

**New features**

- CLI: Migrations up/down commands - filename parameter [#3416](https://github.com/knex/knex/issues/3416)
- Oracle: Support stored procedures [#3449](https://github.com/knex/knex/issues/3449)

**Bug fixes**

- MSSQL: Escape column ids correctly in all cases (reported by Snyk Security Research Team) [#3382](https://github.com/knex/knex/issues/3382)
- SQLite: Fix handling of multiline SQL in SQLite3 schema [#3411](https://github.com/knex/knex/issues/3411)
- Fix concurrent child transactions failing [#2213](https://github.com/knex/knex/issues/2213) [#3440](https://github.com/knex/knex/issues/3440)

**Typings**

- Add missing Migrator.list typing [#3460](https://github.com/knex/knex/issues/3460)
- Fix Typescript type inference for to better support wildcard (\*) calls [#3444](https://github.com/knex/knex/issues/3444)
- Make options argument optional in timeout [#3442](https://github.com/knex/knex/issues/3442)

**Test / internal changes**

- Enable linting in CI [#3450](https://github.com/knex/knex/issues/3450)

### 0.19.4 - 09 September, 2019

**New features**

- Add undefined columns to undefined binding(s) error [#3425](https://github.com/knex/knex/issues/3425)

**Typings**

- Add `specific` to SeederConfig type [#3429](https://github.com/knex/knex/issues/3429)
- Fix some issues with QueryBuilder types [#3427](https://github.com/knex/knex/issues/3427)

### 0.19.3 - 25 August, 2019

**Bug fixes**

- Fix migrations for native enums to use table schema [#3307](https://github.com/knex/knex/issues/3307)

**New features**

- Add ability to manually define schema for native enums [#3307](https://github.com/knex/knex/issues/3307)
- Add SSL/TLS support for Postgres connection string [#3410](https://github.com/knex/knex/issues/3410)
- CLI: new command that lists all migrations with status [#3390](https://github.com/knex/knex/issues/3390)

**Typings**

- Include schemaName in EnumOptions [#3415](https://github.com/knex/knex/issues/3415)
- Allow `ColumnBuilder.defaultTo()` to be `null` [#3407](https://github.com/knex/knex/issues/3407)

**Other Changes**

- migrate: Refactor \_lockMigrations to avoid forUpdate - makes migrations compatible with CockroachDB [#3395](https://github.com/knex/knex/issues/3395)

### 0.19.2 - 17 August, 2019

**Other Changes**

- Make transaction rejection consistent across dialects [#3399](https://github.com/knex/knex/issues/3399)
- More consistent handling of nested transactions [#3393](https://github.com/knex/knex/issues/3393)

**New features**

- Fallback to JSON when using JSONB in MySQL [#3394](https://github.com/knex/knex/issues/3394)

### 0.19.1 - 23 July, 2019

**New features**

- Allow to extend knex query builder [#3334](https://github.com/knex/knex/issues/3334)
- Add .isCompleted() to transaction [#3368](https://github.com/knex/knex/issues/3368)
- Minor enhancements around aliasing of aggregates [#3354](https://github.com/knex/knex/issues/3354)

**Typings**

- Update configuration typings to allow for oracle db connectionstring [#3361](https://github.com/knex/knex/issues/3361)
- Update Knex.raw type to be any by default because the actual type is dialect specific [#3349](https://github.com/knex/knex/issues/3349)

### 0.19.0 - 11 July, 2019

**Other Changes**

- Pooling: tarn.js connection pool was updated to version 2.0.0. This fixes issue with destroying connections and introduces support for connection pool event handlers. Please see tarn.js documentation for more details [#3345](https://github.com/knex/knex/issues/3345)
- Pooling: Passing unsupported pooling configuration options now throws an error
- Pooling: `beforeDestroy` configuration option was removed

### 0.18.4 - 10 July, 2019

**New features**

- Seeds: Option to run specific seed file [#3335](https://github.com/knex/knex/issues/3335)
- Implement "skipLocked()" and "noWait()" [#2961](https://github.com/knex/knex/issues/2961)

**Bug fixes**

- CLI: Respect the knexfile stub option while generating a migration [#3337](https://github.com/knex/knex/issues/3337)
- Fix mssql import not being ignored, breaking webpack builds [#3336](https://github.com/knex/knex/issues/3336)

### 0.18.3 - 04 July, 2019

**New features**

- CLI: add --stub option to migration:make [#3316](https://github.com/knex/knex/issues/3316)

**Bug fixes**

- Fix return duplicate transaction promise for standalone transactions [#3328](https://github.com/knex/knex/issues/3328)

### 0.18.2 - 03 July, 2019

**Bug fixes**

- Fix remove duplicate transaction rejection [#3324](https://github.com/knex/knex/issues/3324)
- Fix issues around specifying default values for columns [#3318](https://github.com/knex/knex/issues/3318)
- CLI: Fix empty --version output [#3312](https://github.com/knex/knex/issues/3312)

### 0.18.1 - 30 June, 2019

**Bug fixes**

- Do not reject duplicate promise on transaction rollback [#3319](https://github.com/knex/knex/issues/3319)

### 0.18.0 - 26 June, 2019

**Bug fixes**

- Do not reject promise on transaction rollback (by default only for new, non-callback, style of transactions for now to avoid breaking old code) [#3235](https://github.com/knex/knex/issues/3235)

**New features**

- Added `doNotRejectOnRollback` options for starting transactions, to prevent rejecting promises on rollback for callback-style transactions.
- Use extension from knexfile for generating migrations unless overriden [#3282](https://github.com/knex/knex/issues/3282)
- Use migrations.extension from config when generating migration [#3242](https://github.com/knex/knex/issues/3242)
- Expose executionPromise for transactors [#3297](https://github.com/knex/knex/issues/3297)

**Bug fixes**

- Oracle: Updated handling of connection errors for disposal [#2608](https://github.com/knex/knex/issues/2608)
- Fix extension resolution from env configs [#3294](https://github.com/knex/knex/issues/3294)

**Test / internal changes**

- Drop support for Node.js 6 [#3227](https://github.com/knex/knex/issues/3227)
- Remove Babel [#3227](https://github.com/knex/knex/issues/3227)
- Remove Bluebird [#3290](https://github.com/knex/knex/issues/3290) [#3287](https://github.com/knex/knex/issues/3287) [#3285](https://github.com/knex/knex/issues/3285) [#3267](https://github.com/knex/knex/issues/3267) [#3266](https://github.com/knex/knex/issues/3266) [#3263](https://github.com/knex/knex/issues/3263)
- Fix comments that were modified by find & replace [#3308](https://github.com/knex/knex/issues/3308)

**Typings**

- Add workarounds for degraded inference when strictNullChecks is set to false [#3275](https://github.com/knex/knex/issues/3275)
- Add stub type definition for Migrator config [#3279](https://github.com/knex/knex/issues/3279)
- Add stub to seeds type [#3296](https://github.com/knex/knex/issues/3296)
- Fix MSSQL config typings [#3269](https://github.com/knex/knex/issues/3269)
- Add pgsql specific table builder method typings [#3146](https://github.com/knex/knex/issues/3146)

### 0.17.5 - 8 June, 2019

**Typings**

- Include result.d.ts in published package [#3271](https://github.com/knex/knex/issues/3271)

### 0.17.4 - 8 June, 2019

**Typings**

- Fix some cases of left-to-right inference causing type mismatch [#3265](https://github.com/knex/knex/issues/3265)
- Improve count typings [#3249](https://github.com/knex/knex/issues/3249)

**Bug fixes**

- Fix error message bubbling up on seed error [#3248](https://github.com/knex/knex/issues/3248)

### 0.17.3 - 2 June, 2019

**Typings**

- Improve typings for aggregations [#3245](https://github.com/knex/knex/issues/3245)
- Add decimalNumbers to MySqlConnectionConfig interface [#3244](https://github.com/knex/knex/issues/3244)

### 0.17.2 - 1 June, 2019

**Typings**

- Improve count typings [#3239](https://github.com/knex/knex/issues/3239)

**Bug fixes**

- "colorette" dependency breaks browserify builds [#3238](https://github.com/knex/knex/issues/3238)

### 0.17.1 - 31 May, 2019

**New features**

- Add migrate:down functionality [#3228](https://github.com/knex/knex/issues/3228)

**Typings**

- Update type of aggregation results to not be arrays when first has been invoked before [#3237](https://github.com/knex/knex/issues/3237)
- Include undefined in type of single row results [#3231](https://github.com/knex/knex/issues/3231)
- Fix incorrect type definitions for single row queries [#3230](https://github.com/knex/knex/issues/3230)

### 0.17.0 - 28 May, 2019

**New features**

- Add support for returning started transaction without immediately executing it [#3099](https://github.com/knex/knex/issues/3099)
- Add support for passing transaction around with only starting it when needed [#3099](https://github.com/knex/knex/issues/3099)
- Add clearHaving function [#3141](https://github.com/knex/knex/issues/3141)
- Add --all flag for rollback in CLI [#3187](https://github.com/knex/knex/issues/3187)
- Add error detail log to knex CLI [#3149](https://github.com/knex/knex/issues/3149)
- Support multi-column whereIn in sqlite through values clause [#3220](https://github.com/knex/knex/issues/3220)
- Allow users to specify the migrations "tableName" parameter via the CLI [#3214](https://github.com/knex/knex/issues/3214)
- Unify object options handling for datetime/timestamp across dialects [#3181](https://github.com/knex/knex/issues/3181)
- Add "up" command for migrations [#3205](https://github.com/knex/knex/issues/3205)

**Typings**

- Add default values for generic types (fixes backwards compatibility broken by 0.16.6) [#3189](https://github.com/knex/knex/issues/3189)
- Make function types generic in type definitions [#3168](https://github.com/knex/knex/issues/3168)
- Add missing types to MigratorConfig [#3174](https://github.com/knex/knex/issues/3174)
- Add types for havingBetween, orHavingBetween, havingNotBetween and orHavingNotBetween [#3144](https://github.com/knex/knex/issues/3144)
- Update Knex.Config types to include log [#3221](https://github.com/knex/knex/issues/3221)
- Fix some more cases of missing typings [#3223](https://github.com/knex/knex/issues/3223)
- Support type safe refs [#3215](https://github.com/knex/knex/issues/3215)
- Expose some utility types [#3211](https://github.com/knex/knex/issues/3211)
- Fix issues with typings of joins and some conflicts with Bluebird typings [#3209](https://github.com/knex/knex/issues/3209)

**Bug fixes**

- Fix order of migration rollback [#3172](https://github.com/knex/knex/issues/3172)

**Test / internal changes**

- Execute CI tests on Node.js 12 [#3171](https://github.com/knex/knex/issues/3171)
- Docker-based test dbs [#3157](https://github.com/knex/knex/issues/3157)
- Use cli-testlab for testing CLI [#3191](https://github.com/knex/knex/issues/3191)

### 0.16.5 - 11 Apr, 2019

- Bundle polyfills with knex for 0.16.x line again [#3139](https://github.com/knex/knex/issues/3139)

### 0.16.4 - 11 Apr, 2019

**New features**

- Boolean param for rollback() to rollback all migrations [#2968](https://github.com/knex/knex/issues/2968)
- seed:run print the file name of the failing seed [#2972](https://github.com/knex/knex/issues/2972) [#2973](https://github.com/knex/knex/issues/2973)
- verbose option to CLI commands [#2887](https://github.com/knex/knex/issues/2887)
- add intersect() [#3023](https://github.com/knex/knex/issues/3023)
- Improved format for TS stubs [#3080](https://github.com/knex/knex/issues/3080)
- MySQL: Support nullable timestamps [#3100](https://github.com/knex/knex/issues/3100)
- MySQL: Warn `.returning()` does not have any effect [#3039](https://github.com/knex/knex/issues/3039)

**Bug fixes**

- Respect "loadExtensions" configuration [#2969](https://github.com/knex/knex/issues/2969)
- Fix event listener duplication when using Migrator [#2982](https://github.com/knex/knex/issues/2982)
- Fix fs-migrations breaking docs [#3022](https://github.com/knex/knex/issues/3022)
- Fix sqlite3 drop/renameColumn() breaks with postProcessResponse [#3040](https://github.com/knex/knex/issues/3040)
- Fix transaction support for migrations [#3084](https://github.com/knex/knex/issues/3084)
- Fix queryContext not being passed to raw queries [#3111](https://github.com/knex/knex/issues/3111)
- Typings: Allow to pass query builders, identifiers and raw in various places as parameters [#2960](https://github.com/knex/knex/issues/2960)
- Typings: toNative() definition [#2996](https://github.com/knex/knex/issues/2996)
- Typings: asCallback() definition [#2963](https://github.com/knex/knex/issues/2963)
- Typings: queryContext() type definition Knex.Raw [#3002](https://github.com/knex/knex/issues/3002)
- Typings: Add "constraintName" arg to primary() definition [#3006](https://github.com/knex/knex/issues/3006)
- Typings: Add missing schemaName in MigratorConfig [#3016](https://github.com/knex/knex/issues/3016)
- Typings: Add missing supported parameter types and toSQL method [#2960](https://github.com/knex/knex/issues/2960)
- Typings: Update enum arguments to reflect latest signature [#3043](https://github.com/knex/knex/issues/3043)
- Typings: Add size parameter to integer method [#3074](https://github.com/knex/knex/issues/3074)
- Typings: Add 'string' as accepted Knex constructor type definition [#3105](https://github.com/knex/knex/issues/3105)
- Typings: Add boolean as a column name in join [#3121](https://github.com/knex/knex/issues/3121)
- Typings: Add missing clearOrder & clearCounters types [#3109](https://github.com/knex/knex/issues/3109)
- Dependencies: Fix security warning [#3082](https://github.com/knex/knex/issues/3082)
- Do not use unsupported column width/length arguments on data types int and tinyint in MSSQL [#2738](https://github.com/knex/knex/issues/2738)

**Other Changes**

- Make unionAll()'s call signature match union() [#3055](https://github.com/knex/knex/issues/3055)

**Test / internal changes**

- Swap chalk→colorette / minimist→getopts [#2718](https://github.com/knex/knex/issues/2718)
- Always use well documented pg client query() config argument [#3004](https://github.com/knex/knex/issues/3004)
- Do not bundle polyfills with knex [#3024](https://github.com/knex/knex/issues/3024)

### 0.16.3 - 19 Dec, 2018

**Bug fixes**

- @babel/polyfill loaded multiple times [#2955](https://github.com/knex/knex/issues/2955)
- Resolve migrations and seeds relatively to knexfile directory when specified (the way it used to be before 0.16.1) [#2952](https://github.com/knex/knex/issues/2952)

### 0.16.2 - 10 Dec, 2018

**Bug fixes**

- Add TypeScript types to the "files" entry so they are properly included in the release [#2943](https://github.com/knex/knex/issues/2943)

### 0.16.1 - 28 Nov, 2018

**Breaking changes**

- Use datetime2 for MSSQL datetime + timestamp types. This change is incompatible with MSSQL older than 2008 [#2757](https://github.com/knex/knex/issues/2757)
- Knex.VERSION() method was removed, run "require('knex/package').version" instead [#2776](https://github.com/knex/knex/issues/2776)
- Knex transpilation now targets Node.js 6, meaning it will no longer run on older Node.js versions [#2813](https://github.com/knex/knex/issues/2813)
- Add json type support for SQLite 3.9+ (tested to work with Node package 'sqlite3' 4.0.2+) [#2814](https://github.com/knex/knex/issues/2814)

**New features**

- Support passing explicit connection to query builder ([#2817](https://github.com/knex/knex/issues/2817))
- Introduced abstraction for getting migrations to make migration bundling easier [#2775](https://github.com/knex/knex/issues/2775)
- Allow timestamp with timezone on mssql databases [#2724](https://github.com/knex/knex/issues/2724)
- Allow specifying multiple migration directories [#2735](https://github.com/knex/knex/issues/2735)
- Allow cloning query builder with .userParams({}) assigned to it [#2802](https://github.com/knex/knex/issues/2802)
- Allow chaining of increment, decrement, and update [#2740](https://github.com/knex/knex/issues/2740)
- Allow table names with `forUpdate`/`forShare` [#2834](https://github.com/knex/knex/issues/2834)
- Added `whereColumn` and the associated `not` / `and` / `or` methods for using columns on the right side of a where clause [#2837](https://github.com/knex/knex/issues/2837)
- Added `whereRecursive` method to make self-referential CTEs possible [#2889](https://github.com/knex/knex/issues/2889)
- Added support for named unique, primary and foreign keys to SQLite3 [#2840](https://github.com/knex/knex/issues/2840)
- Added support for generating new migration and seed files without knexfile [#2884](https://github.com/knex/knex/issues/2884) [#2905](https://github.com/knex/knex/issues/2905) [#2935](https://github.com/knex/knex/issues/2935)
- Added support for multiple columns in `.orderBy()` [#2881](https://github.com/knex/knex/issues/2881)
- Added option of `existingType` to `.enum()` method to support repeated use of enums [#2719](https://github.com/knex/knex/issues/2719)
- Added option to pass `indexType` for MySQL dialect [#2890](https://github.com/knex/knex/issues/2890)
- Added `onVal` and the associated `not` / `and` / `or` methods for using values in `on` clauses within joins [#2746](https://github.com/knex/knex/issues/2746)
- Kill queries after timeout for PostgreSQL [#2636](https://github.com/knex/knex/issues/2636)
- Manage TypeScript types internally [#2845](https://github.com/knex/knex/issues/2845)
- Support 5.0.0+ versions of mssql driver [#2861](https://github.com/knex/knex/issues/2861)
- Typescript migration stub [#2816](https://github.com/knex/knex/issues/2816)
- Options object for passing timestamp parameters + regression tests [#2919](https://github.com/knex/knex/issues/2919)

**Bug fixes**

- Implement fail-fast logic for dialect resolution [#2776](https://github.com/knex/knex/issues/2776)
- Fixed identifier wrapping for `using()`. Use columnize instead of wrap in using() [#2713](https://github.com/knex/knex/issues/2713)
- Fix issues with warnPromise when migration does not return a promise [#2730](https://github.com/knex/knex/issues/2730)
- Compile with before update so that bindings are put in correct order [#2733](https://github.com/knex/knex/issues/2733)
- Fix join using builder withSchema [#2744](https://github.com/knex/knex/issues/2744)
- Throw instead of process.exit when client module missing [#2843](https://github.com/knex/knex/issues/2843)
- Display correct filename of a migration that failed [#2910](https://github.com/knex/knex/issues/2910)
- Fixed support of knexSnakeCaseWrappers in migrations [#2914](https://github.com/knex/knex/issues/2914)
- SQlite3 renameColunm quote fix [#2833](https://github.com/knex/knex/issues/2833)
- Adjust typing for forUpdate()/forShare() variant with table names [#2858](https://github.com/knex/knex/issues/2858)
- Fix execution of Oracle tests on Node 11 [#2920](https://github.com/knex/knex/issues/2920)
- Fix failures in oracle test bench and added it back to mandatory CI tests [#2924](https://github.com/knex/knex/issues/2924)
- Knex client knexfile resolution fix [#2923](https://github.com/knex/knex/issues/2923)
- Add queryContext to type declarations [#2931](https://github.com/knex/knex/issues/2931)

**Test / internal changes**

- Add tests for multiple union arguments with callbacks and builders [#2749](https://github.com/knex/knex/issues/2749)
- Update dependencies [#2772](https://github.com/knex/knex/issues/2772) [#2810](https://github.com/knex/knex/issues/2810) [#2842](https://github.com/knex/knex/issues/2842) [#2848](https://github.com/knex/knex/issues/2848) [#2893](https://github.com/knex/knex/issues/2893) [#2904](https://github.com/knex/knex/issues/2904)
- Separate migration generator [#2786](https://github.com/knex/knex/issues/2786)
- Do not postprocess internal queries in Migrator [#2914](https://github.com/knex/knex/issues/2914) [#2934](https://github.com/knex/knex/issues/2934)
- Use Babel 7 [#2813](https://github.com/knex/knex/issues/2813)
- Introduce LGTM.com badge [#2755](https://github.com/knex/knex/issues/2755)
- Cleanup based on analysis by https://lgtm.com [#2870](https://github.com/knex/knex/issues/2870)
- Add test for retrieving null dates [#2865](https://github.com/knex/knex/issues/2865)
- Add link to wiki [#2866](https://github.com/knex/knex/issues/2866)
- Add tests for specifying explicit pg version [#2895](https://github.com/knex/knex/issues/2895)
- Execute tests on Node.js 11 [#2873](https://github.com/knex/knex/issues/2873)
- Version upgrade guide [#2894](https://github.com/knex/knex/issues/2894)

### 0.16.0 - 27 Nov, 2018

**Other Changes**

- THIS RELEASE WAS UNPUBLISHED FROM NPM BECAUSE IT HAD BROKEN MIGRATIONS USING `postprocessResponse` FEATURE ([#2644](https://github.com/knex/knex/issues/2644))

### 0.15.2 - 19 Jul, 2018

**Other Changes**

- Rolled back changes introduced by [#2542](https://github.com/knex/knex/issues/2542), in favor of opt-in behavior by adding a precision option in `date` / `timestamp` / `datetime` / `knex.fn.now` ([#2715](https://github.com/knex/knex/issues/2715), [#2721](https://github.com/knex/knex/issues/2721))

### 0.15.1 - 12 Jul, 2018

**Bug fixes**

- Fix warning erroneously displayed for mysql [#2705](https://github.com/knex/knex/issues/2705)

### 0.15.0 - 1 Jul, 2018

**Breaking changes**

- Stop executing tests on Node 4 and 5. [#2451](https://github.com/knex/knex/issues/2451) (not supported anymore)
- `json` data type is no longer converted to `text` within a schema builder migration for MySQL databases (note that JSON data type is only supported for MySQL 5.7.8+) [#2635](https://github.com/knex/knex/issues/2635)
- Removed WebSQL dialect [#2461](https://github.com/knex/knex/issues/2461)
- Drop mariadb support [#2681](https://github.com/knex/knex/issues/2681)
- Primary Key for Migration Lock Table [#2569](https://github.com/knex/knex/issues/2569). This shouldn't affect to old loc tables, but if you like to have your locktable to have primary key, delete the old table and it will be recreated when migrations are ran next time.
- Ensure knex.destroy() returns a bluebird promise [#2589](https://github.com/knex/knex/issues/2589)
- Increment floats [#2614](https://github.com/knex/knex/issues/2614)
- Testing removal of 'skim' [#2520](https://github.com/knex/knex/issues/2520), Now rows are not converted to plain js objects, returned row objects might have changed type with oracle, mssql, mysql and sqlite3
- Drop support for strong-oracle [#2487](https://github.com/knex/knex/issues/2487)
- Timeout errors doesn't silently ignore the passed errors anymore [#2626](https://github.com/knex/knex/issues/2626)
- Removed WebSQL dialect [#2647](https://github.com/knex/knex/issues/2647)
- Various fixes to mssql dialect to make it compatible with other dialects [#2653](https://github.com/knex/knex/issues/2653), Unique constraint now allow multiple null values, float type is now float instaed of decimal, rolling back transaction with undefined rejects with Error, select for update and select for share actually locks selected row, so basically old schema migrations will work a lot different and produce different schema like before. Also now MSSQL is included in CI tests.

**Bug fixes**

- Fixes onIn with empty values array [#2513](https://github.com/knex/knex/issues/2513)
- fix wrapIdentifier not being called in postgres alter column [#2612](https://github.com/knex/knex/issues/2612)
- fixes wrapIdentifier to work with postgres `returning` statement 2630 [#2642](https://github.com/knex/knex/issues/2642)
- Fix mssql driver crashing in certain cases when conneciton is closed unexpectedly [#2637](https://github.com/knex/knex/issues/2637)
- Removed semicolon from rollback stmt for oracle [#2564](https://github.com/knex/knex/issues/2564)
- Make the stream catch errors in the query [#2638](https://github.com/knex/knex/issues/2638)

**New features**

- Create timestamp columns with microsecond precision on MySQL 5.6 and newer [#2542](https://github.com/knex/knex/issues/2542)
- Allow storing stacktrace, where builder is initialized to be able trace back where certain query was created [#2500](https://github.com/knex/knex/issues/2500) [#2505](https://github.com/knex/knex/issues/2505)
- Added 'ref' function [#2509](https://github.com/knex/knex/issues/2509), no need for knex.raw('??', ['id']) anymore, one can do knex.ref('id')
- Support postgresql connection uri protocol [#2609](https://github.com/knex/knex/issues/2609)
- Add support for native enums on Postgres [#2632](https://github.com/knex/knex/issues/2632)
- Allow overwriting log functions [#2625](https://github.com/knex/knex/issues/2625)

**Test / internal changes**

- chore: cache node_modules [#2595](https://github.com/knex/knex/issues/2595)
- Remove babel-plugin-lodash [#2634](https://github.com/knex/knex/issues/2634)
- Remove readable-stream and safe-buffer [#2640](https://github.com/knex/knex/issues/2640)
- chore: add Node.js 10 [#2594](https://github.com/knex/knex/issues/2594)
- add homepage field to package.json [#2650](https://github.com/knex/knex/issues/2650)

### 0.14.6 - 12 Apr, 2018

**Bug fixes**

- Restored functionality of query event [#2566](https://github.com/knex/knex/issues/2566) ([#2549](https://github.com/knex/knex/issues/2549))

### 0.14.5 - 8 Apr, 2018

**Bug fixes**

- Fix wrapping returning column on oracledb [#2554](https://github.com/knex/knex/issues/2554)

**New features**

- Support passing DB schema name for migrations [#2499](https://github.com/knex/knex/issues/2499) [#2559](https://github.com/knex/knex/issues/2559)
- add clearOrder method [#2360](https://github.com/knex/knex/issues/2360) [#2553](https://github.com/knex/knex/issues/2553)
- Added knexTxId to query events and debug calls [#2476](https://github.com/knex/knex/issues/2476)
- Support multi-column `whereIn` with query [#1390](https://github.com/knex/knex/issues/1390)
- Added error if chaining update/insert/etc with first() [#2506](https://github.com/knex/knex/issues/2506)
- Checks for an empty, undefined or null object on transacting [#2494](https://github.com/knex/knex/issues/2494)
- countDistinct with multiple columns [#2449](https://github.com/knex/knex/issues/2449)

**Test / internal changes**

- Added npm run test:oracledb command that runs oracledb tests in docker [#2491](https://github.com/knex/knex/issues/2491)
- Runnin mssql tests in docker [#2496](https://github.com/knex/knex/issues/2496)
- Update dependencies [#2561](https://github.com/knex/knex/issues/2561)

### 0.14.4 - 19 Feb, 2018

**Bug fixes**

- containsUndefined only validate plain objects. Fixes [#1898](https://github.com/knex/knex/issues/1898) ([#2468](https://github.com/knex/knex/issues/2468))
- Add warning when using .returning() in sqlite3. Fixes [#1660](https://github.com/knex/knex/issues/1660) ([#2471](https://github.com/knex/knex/issues/2471))
- Throw an error if .update() results in an empty sql ([#2472](https://github.com/knex/knex/issues/2472))
- Removed unnecessary createTableIfNotExist and replaced with createTable ([#2473](https://github.com/knex/knex/issues/2473))

**New features**

- Allow calling lock procedures (such as forUpdate) outside of transaction. Fixes [#2403](https://github.com/knex/knex/issues/2403). ([#2475](https://github.com/knex/knex/issues/2475))
- Added test and documentation for Event 'start' ([#2488](https://github.com/knex/knex/issues/2488))

**Test / internal changes**

- Added stress test, which uses TCP proxy to simulate flaky connection [#2460](https://github.com/knex/knex/issues/2460)
- Removed old docker tests, new stress test setup ([#2474](https://github.com/knex/knex/issues/2474))
- Removed unused property \_\_cid on the base client ([#2481](https://github.com/knex/knex/issues/2481))
- Changed rm to rimraf in 'npm run dev' ([#2483](https://github.com/knex/knex/issues/2483))
- Changed babel preset and use latest node as target when running dev ([#2484](https://github.com/knex/knex/issues/2484))

### 0.14.3 - 8 Feb, 2018

**Bug fixes**

- Use tarn as pool instead of generic-pool which has been given various problems [#2450](https://github.com/knex/knex/issues/2450)
- Fixed mysql issue where add columns failed if using both after and collate [#2432](https://github.com/knex/knex/issues/2432)
- CLI sets exit-code 1 if the command supplied was not parseable [#2358](https://github.com/knex/knex/issues/2358)
- Set toNative() to be not enumerable [#2388](https://github.com/knex/knex/issues/2388)
- Use wrapIdentifier in columnInfo. fixes [#2402](https://github.com/knex/knex/issues/2402) [#2405](https://github.com/knex/knex/issues/2405)
- Fixed a bug when using .returning (OUTPUT) in an update query with joins in MSSQL [#2399](https://github.com/knex/knex/issues/2399)
- Better error message when running migrations fail before even starting run migrations [#2373](https://github.com/knex/knex/issues/2373)
- Read oracle's UV_THREADPOOL_SIZE env variable correctly [#2372](https://github.com/knex/knex/issues/2372)
- Added decimal variable precision / scale support [#2353](https://github.com/knex/knex/issues/2353)

**New features**

- Added queryContext to schema and query builders [#2314](https://github.com/knex/knex/issues/2314)
- Added redshift dialect [#2233](https://github.com/knex/knex/issues/2233)
- Added warning when one uses .createTableIfNotExist and deprecated it from docs [#2458](https://github.com/knex/knex/issues/2458)

**Test / internal changes**

- Update dependencies and fix ESLint warnings accordingly [#2433](https://github.com/knex/knex/issues/2433)
- Disable oracledb tests from non LTS nodes [#2407](https://github.com/knex/knex/issues/2407)
- Update dependencies [#2422](https://github.com/knex/knex/issues/2422)

### 0.14.2 - 24 Nov, 2017

**Bug fixes**

- Fix sqlite3 truncate method to work again [#2348](https://github.com/knex/knex/issues/2348)

### 0.14.1 - 19 Nov, 2017

**Bug fixes**

- Fix support for multiple schema names in in postgres `searchPath` [#2340](https://github.com/knex/knex/issues/2340)
- Fix create new connection to pass errors to query instead of retry loop [#2336](https://github.com/knex/knex/issues/2336)
- Fix recognition of connections closed by server [#2341](https://github.com/knex/knex/issues/2341)

### 0.14.0 - 6 Nov, 2017

**Breaking changes**

- Remove sorting of statements from update queries [#2171](https://github.com/knex/knex/issues/2171)
- Updated allowed operator list with some missing operators and make all to lower case [#2239](https://github.com/knex/knex/issues/2239)
- Use node-mssql 4.0.0 [#2029](https://github.com/knex/knex/issues/2029)
- Support for enum columns to SQlite3 dialect [#2055](https://github.com/knex/knex/issues/2055)
- Better identifier quoting in Sqlite3 [#2087](https://github.com/knex/knex/issues/2087)
- Migration Errors - Display filename of of failed migration [#2272](https://github.com/knex/knex/issues/2272)

**Other Features**

- Post processing hook for query result [#2261](https://github.com/knex/knex/issues/2261)
- Build native SQL where binding parameters are dialect specific [#2237](https://github.com/knex/knex/issues/2237)
- Configuration option to allow override identifier wrapping [#2217](https://github.com/knex/knex/issues/2217)
- Implemented select syntax: select({ alias: 'column' }) [#2227](https://github.com/knex/knex/issues/2227)
- Allows to filter seeds and migrations by extensions [#2168](https://github.com/knex/knex/issues/2168)
- Reconnecting after database server disconnect/reconnect + tests [#2017](https://github.com/knex/knex/issues/2017)
- Removed filering from allowed configuration settings of mysql2 [#2040](https://github.com/knex/knex/issues/2040)
- Allow raw expressions in query builder aggregate methods [#2257](https://github.com/knex/knex/issues/2257)
- Throw error on non-string table comment [#2126](https://github.com/knex/knex/issues/2126)
- Support for mysql stream query options [#2301](https://github.com/knex/knex/issues/2301)

**Bug fixes**

- Allow update queries and passing query builder to with statements [#2298](https://github.com/knex/knex/issues/2298)
- Fix escape table name in SQLite columnInfo call [#2281](https://github.com/knex/knex/issues/2281)
- Preventing containsUndefined from going to recursion loop [#1711](https://github.com/knex/knex/issues/1711)
- Fix error caused by call to knex.migrate.currentVersion [#2123](https://github.com/knex/knex/issues/2123)
- Upgraded generic-pool to 3.1.7 (did resolve some memory issues) [#2208](https://github.com/knex/knex/issues/2208)
- Allow using NOT ILIKE operator [#2195](https://github.com/knex/knex/issues/2195)
- Fix postgres searchPath to be case-sensitive [#2172](https://github.com/knex/knex/issues/2172)
- Fix drop of multiple columns in sqlite3 [#2107](https://github.com/knex/knex/issues/2107)
- Fix adding multiple columns in Oracle [#2115](https://github.com/knex/knex/issues/2115)
- Use selected schema when dropping indices in Postgres. [#2105](https://github.com/knex/knex/issues/2105)
- Fix hasTable for MySQL to not do partial matches [#2097](https://github.com/knex/knex/issues/2097)
- Fix setting autoTransaction in batchInsert [#2113](https://github.com/knex/knex/issues/2113)
- Fix connection error propagation when streaming [#2199](https://github.com/knex/knex/issues/2199)
- Fix comments not being applied to increments columns [#2243](https://github.com/knex/knex/issues/2243)
- Fix mssql wrong binding order of queries that combine a limit with select raw or update [#2066](https://github.com/knex/knex/issues/2066)
- Fixed mysql alter table attributes order [#2062](https://github.com/knex/knex/issues/2062)

**Test / internal changes**

- Update each out-of-date dependency according to david-dm.org [#2297](https://github.com/knex/knex/issues/2297)
- Update v8flags to version 3.0.0 [#2288](https://github.com/knex/knex/issues/2288)
- Update interpret version [#2283](https://github.com/knex/knex/issues/2283)
- Fix debug output typo [#2187](https://github.com/knex/knex/issues/2187)
- Docker CI tests [#2164](https://github.com/knex/knex/issues/2164)
- Unit test for right/rightOuterJoin combination [#2117](https://github.com/knex/knex/issues/2117)
- Unit test for fullOuterJoin [#2118](https://github.com/knex/knex/issues/2118)
- Unit tests for table comment [#2098](https://github.com/knex/knex/issues/2098)
- Test referencing non-existent column with sqlite3 [#2104](https://github.com/knex/knex/issues/2104)
- Unit test for renaming column in postgresql [#2099](https://github.com/knex/knex/issues/2099)
- Unit test for cross-join [#2102](https://github.com/knex/knex/issues/2102)
- Fix incorrect parameter name [#2068](https://github.com/knex/knex/issues/2068)

### 0.13.0 - 29 Apr, 2017

**Breaking changes**

- Multiple concurrent migration runners blocks instead of throwing error when possible [#1962](https://github.com/knex/knex/issues/1962)
- Fixed transaction promise mutation issue [#1991](https://github.com/knex/knex/issues/1991)

**Other Changes**

- Allow passing version of connected db in configuration file [#1993](https://github.com/knex/knex/issues/1993)
- Bugfixes on batchInsert and transactions for mysql/maria [#1992](https://github.com/knex/knex/issues/1992)
- Add fetchAsString optional parameter to oracledb dialect [#1998](https://github.com/knex/knex/issues/1998)
- fix: escapeObject parameter order for Postgres dialect. [#2003](https://github.com/knex/knex/issues/2003)

### 0.12.9 - 23 Mar, 2017

- Fixed unhandled exception in batchInsert when the rows to be inserted resulted in duplicate key violation [#1880](https://github.com/knex/knex/issues/1880)

### 0.12.8 - 15 Mar, 2017

- Added clearSelect and clearWhere to query builder [#1912](https://github.com/knex/knex/issues/1912)
- Properly close Postgres query streams on error [#1935](https://github.com/knex/knex/issues/1935)
- Transactions should never reject with undefined [#1970](https://github.com/knex/knex/issues/1970)
- Clear acquireConnectionTimeout if an error occurs when acquiring a connection [#1973](https://github.com/knex/knex/issues/1973)

### 0.12.7 - 17 Feb, 2017

**Accidental Breaking Change**

- Ensure that 'client' is provided in knex config object [#1822](https://github.com/knex/knex/issues/1822)

**Other Changes**

- Support custom foreign key names [#1311](https://github.com/knex/knex/issues/1311), [#1726](https://github.com/knex/knex/issues/1726)
- Fixed named bindings to work with queries containing `:`-chars [#1890](https://github.com/knex/knex/issues/1890)
- Exposed more promise functions [#1896](https://github.com/knex/knex/issues/1896)
- Pass rollback errors to transaction promise in mssql [#1885](https://github.com/knex/knex/issues/1885)
- ONLY keyword support for PostgreSQL (for table inheritance) [#1874](https://github.com/knex/knex/issues/1874)
- Fixed Mssql update with join syntax [#1777](https://github.com/knex/knex/issues/1777)
- Replace migrations and seed for react-native packager [#1813](https://github.com/knex/knex/issues/1813)
- Support knexfile, migration and seeds in TypeScript [#1769](https://github.com/knex/knex/issues/1769)
- Fix float to integer conversion of decimal fields in MSSQL [#1781](https://github.com/knex/knex/issues/1781)
- External authentication capability when using oracledb driver [#1716](https://github.com/knex/knex/issues/1716)
- Fixed MSSQL incorect query build when locks are used [#1707](https://github.com/knex/knex/issues/1707)
- Allow to use `first` method as aliased select [#1784](https://github.com/knex/knex/issues/1784)
- Alter column for nullability, type and default value [#46](https://github.com/knex/knex/issues/46), [#1759](https://github.com/knex/knex/issues/1759)
- Add more having* methods / join clause on* methods [#1674](https://github.com/knex/knex/issues/1674)
- Compatibility fixes and cleanups [#1788](https://github.com/knex/knex/issues/1788), [#1792](https://github.com/knex/knex/issues/1792), [#1794](https://github.com/knex/knex/issues/1794), [#1814](https://github.com/knex/knex/issues/1814), [#1857](https://github.com/knex/knex/issues/1857), [#1649](https://github.com/knex/knex/issues/1649)

### 0.12.6 - 19 Oct, 2016

- Address warnings mentioned in [#1388](https://github.com/knex/knex/issues/1388) ([#1740](https://github.com/knex/knex/issues/1740))
- Remove postinstall script ([#1746](https://github.com/knex/knex/issues/1746))

### 0.12.5 - 12 Oct, 2016

- Fix broken 0.12.4 build (removed from npm)
- Fix [#1733](https://github.com/knex/knex/issues/1733), [#920](https://github.com/knex/knex/issues/920), incorrect postgres array bindings

### 0.12.3 - 9 Oct, 2016

- Fix [#1703](https://github.com/knex/knex/issues/1703), [#1694](https://github.com/knex/knex/issues/1694) - connections should be returned to pool if acquireConnectionTimeout is triggered
- Fix [#1710](https://github.com/knex/knex/issues/1710) regression in postgres array escaping

### 0.12.2 - 27 Sep, 2016

- Restore pool min: 1 for sqlite3, [#1701](https://github.com/knex/knex/issues/1701)
- Fix for connection error after it's closed / released, [#1691](https://github.com/knex/knex/issues/1691)
- Fix oracle prefetchRowCount setting, [#1675](https://github.com/knex/knex/issues/1675)

### 0.12.1 - 16 Sep, 2016

- Fix MSSQL sql execution error, [#1669](https://github.com/knex/knex/issues/1669)
- Added DEBUG=knex:bindings for debugging query bindings, [#1557](https://github.com/knex/knex/issues/1557)

### 0.12.0 - 13 Sep, 2016

- Remove build / built files, [#1616](https://github.com/knex/knex/issues/1616)
- Upgrade to Babel 6, [#1617](https://github.com/knex/knex/issues/1617)
- Reference Bluebird module directly, remove deprecated .exec method, [#1618](https://github.com/knex/knex/issues/1618)
- Remove documentation files from main repo
- Fix broken behavior on WebSQL build, [#1638](https://github.com/knex/knex/issues/1638)
- Oracle id sequence now handles manual inserts, [#906](https://github.com/knex/knex/issues/906)
- Cleanup PG escaping, fix [#1602](https://github.com/knex/knex/issues/1602), [#1548](https://github.com/knex/knex/issues/1548)
- Added [`with`](/guide/query-builder#with) to builder for [common table expressions](https://www.postgresql.org/docs/9.4/static/queries-with.html), [#1599](https://github.com/knex/knex/issues/1599)
- Fix [#1619](https://github.com/knex/knex/issues/1619), pluck with explicit column names
- Switching back to [generic-pool](https://github.com/coopernurse/node-pool) for pooling resource management
- Removed index.html, please direct all PR's for docs against the files in [knex/documentation](https://github.com/knex/documentation)

### 0.11.10 - 9 Aug, 2016

- Added CHANGELOG.md for a [new documentation](https://github.com/knex/documentation) builder coming soon, [#1615](https://github.com/knex/knex/issues/1615)
- Minor documentation tweaks
- PG: Fix Uint8Array being considered undefined, [#1601](https://github.com/knex/knex/issues/1601)
- MSSQL: Make columnInfo schema dynamic, [#1585](https://github.com/knex/knex/issues/1585)

### 0.11.9 - 21 Jul, 2016

- Reverted knex client breaking change (commit b74cd69e906), fixes [#1587](https://github.com/knex/knex/issues/1587)

### 0.11.8 - 21 Jul, 2016

- Oracledb dialect [#990](https://github.com/knex/knex/issues/990)
- Documentation fix [#1532](https://github.com/knex/knex/issues/1532)
- Allow named bindings to be escaped. [#1576](https://github.com/knex/knex/issues/1576)
- Several bugs with MS SQL schema creation and installing from gihub fix [#1577](https://github.com/knex/knex/issues/1577)
- Fix incorrect escaping of backslashes in SqlString.escape [#1545](https://github.com/knex/knex/issues/1545)

### 0.11.7 - 19 Jun, 2016

- Add missing dependency. [#1516](https://github.com/knex/knex/issues/1516)

### 0.11.6 - 18 Jun, 2016

- Allow cancellation on timeout (MySQL) [#1454](https://github.com/knex/knex/issues/1454)
- Better bigint support. (MSSQL) [#1445](https://github.com/knex/knex/issues/1445)
- More consistent handling of `undefined` values in `QueryBuilder#where` and `Raw`. [#1459](https://github.com/knex/knex/issues/1459)
- Fix Webpack build. [#1447](https://github.com/knex/knex/issues/1447)
- Fix code that triggered Bluebird warnings. [#1460](https://github.com/knex/knex/issues/1460), [#1489](https://github.com/knex/knex/issues/1489)
- Fix `ping` function. (Oracle) [#1486](https://github.com/knex/knex/issues/1486)
- Fix `columnInfo`. (MSSQL) [#1464](https://github.com/knex/knex/issues/1464)
- Fix `ColumnCompiler#binary`. (MSSQL) [#1464](https://github.com/knex/knex/issues/1464)
- Allow connection strings that do not contain a password. [#1473](https://github.com/knex/knex/issues/1473)
- Fix race condition in seed stubs. [#1493](https://github.com/knex/knex/issues/1493)
- Give each query a UUID. [#1510](https://github.com/knex/knex/issues/1510)

### 0.11.5 - 26 May, 2016

- Bugfix: Using `Raw` or `QueryBuilder` as a binding to `Raw` now works as intended

### 0.11.4 - 22 May, 2016

- Bugfix: Inconsistency of `.primary()` and `.dropPrimary()` between dialects [#1430](https://github.com/knex/knex/issues/1430)
- Feature: Allow using custom Client/Dialect (you can pass your own client in knex config) [#1428](https://github.com/knex/knex/issues/1428)
- Docs: Add documentation for .dropTimestamps [#1432](https://github.com/knex/knex/issues/1432)
- Bugfix: Fixed passing undefined fields for insert/update inside transaction [#1423](https://github.com/knex/knex/issues/1423)
- Feature: `batchInsert` with existing transaction [#1354](https://github.com/knex/knex/issues/1354)
- Build: eslint instead of jshint [#1416](https://github.com/knex/knex/issues/1416)
- Bugfix: Pooled connections not releasing [#1382](https://github.com/knex/knex/issues/1382)
- Bugfix: Support passing `knex.raw` to `.whereNot` [#1402](https://github.com/knex/knex/issues/1402)
- Docs: Fixed list of dialects which supports `.returning` [#1398](https://github.com/knex/knex/issues/1398)
- Bugfix: rename table does not fail anymore even with schema defined [#1403](https://github.com/knex/knex/issues/1403)

### 0.11.3 - 14 May, 2016

- Support nested joins. [#1397](https://github.com/knex/knex/issues/1397)

### 0.11.2 - 14 May, 2016

- Prevent crash on `knex seed:make`. [#1389](https://github.com/knex/knex/issues/1389)
- Improvements to `batchInsert`. [#1391](https://github.com/knex/knex/issues/1391)
- Improvements to inserting `DEFAULT` with `undefined` binding. [#1396](https://github.com/knex/knex/issues/1396)
- Correct generated code for adding/dropping multiple columns. (MSSQL) [#1401](https://github.com/knex/knex/issues/1401)

### 0.11.1 - 6 May, 2016

- Fix error in CLI command `migrate:make`. [#1386](https://github.com/knex/knex/issues/1386)

### 0.11.0 - 5 May, 2016

**Breaking changes**

- `QueryBuilder#orWhere` joins multiple arguments with `AND`. [#1164](https://github.com/knex/knex/issues/1164)

**Other Changes**

- Collate for columns. (MySQL) [#1147](https://github.com/knex/knex/issues/1147)
- Add `QueryBuilder#timeout`, `Raw#timeout`. [#1201](https://github.com/knex/knex/issues/1201) [#1260](https://github.com/knex/knex/issues/1260)
- Exit with error code when appropriate. [#1238](https://github.com/knex/knex/issues/1238)
- MSSQL connection accepts `host` as an alias for `server` in accordance with other dialects. [#1239](https://github.com/knex/knex/issues/1239)
- Add `query-response` event. [#1231](https://github.com/knex/knex/issues/1231)
- Correct behaviour of sibling nested transactions. [#1226](https://github.com/knex/knex/issues/1226)
- Support `RETURNING` with `UPDATE`. (Oracle) [#1253](https://github.com/knex/knex/issues/1253)
- Throwing callbacks from transactions automatically rolls them back. [#1257](https://github.com/knex/knex/issues/1257)
- Fixes to named `Raw` bindings. [#1251](https://github.com/knex/knex/issues/1251)
- `timestamps` accepts an argument to set `NOT NULL` and default to current timestamp.
- Add `TableBuilder#inherits` for PostgreSQL. [#601](https://github.com/knex/knex/issues/601)
- Wrap index names. [#1289](https://github.com/knex/knex/issues/1289)
- Restore coffeescript knexfiles and configurations. [#1292](https://github.com/knex/knex/issues/1292)
- Add `andWhereBetween` and `andWhereNotBetween` [#1132](https://github.com/knex/knex/issues/1132)
- Fix `valueForUndefined` failure. [#1269](https://github.com/knex/knex/issues/1269)
- `renameColumn` no longer drops default value or nullability. [#1326](https://github.com/knex/knex/issues/1326)
- Correct MySQL2 error handling. [#1315](https://github.com/knex/knex/issues/1315)
- Fix MSSQL `createTableIfNotExists`. [#1362](https://github.com/knex/knex/issues/1362)
- Fix MSSQL URL parsing. [#1342](https://github.com/knex/knex/issues/1342)
- Update Lodash to 4.6.0 [#1242](https://github.com/knex/knex/issues/1242)
- Update Bluebird to 3.3.4 [#1279](https://github.com/knex/knex/issues/1279)

### 0.10.0 - 15 Feb, 2016

**Breaking changes**

- `insert` and `update` now ignore `undefined` values. Back compatibility is provided through the option `useNullAsDefault`. [#1174](https://github.com/knex/knex/issues/1174), [#1043](https://github.com/knex/knex/issues/1043)

**Other Changes**

- [`countDistinct`](/guide/query-builder#countdistinct), [`avgDistinct`](/guide/query-builder#avgdistinct) and [`sumDistinct`](/guide/query-builder#sumdistinct). [#1046](https://github.com/knex/knex/issues/1046)
- Add [`schema.jsonb`](#Schema-jsonb). Deprecated `schema.json(column, true)`. [#991](https://github.com/knex/knex/issues/991)
- Support binding identifiers with `??`. [#1103](https://github.com/knex/knex/issues/1103)
- Restore `query` event when triggered by transactions. [#855](https://github.com/knex/knex/issues/855)
- Correct question mark escaping in rendered queries. [#519](https://github.com/knex/knex/issues/519), [#1058](https://github.com/knex/knex/issues/1058)
- Add per-dialect escaping, allowing quotes to be escaped correctly. [#886](https://github.com/knex/knex/issues/886), [#1095](https://github.com/knex/knex/issues/1095)
- Add MSSQL support. [#1090](https://github.com/knex/knex/issues/1090)
- Add migration locking. [#1094](https://github.com/knex/knex/issues/1094)
- Allow column aliases to contain `.`. [#1181](https://github.com/knex/knex/issues/1181)
- Add `batchInsert`. [#1182](https://github.com/knex/knex/issues/1182)
- Support non-array arguments to [`knex.raw`](#Raw-Bindings).
- Global `query-error` event. [#1163](https://github.com/knex/knex/issues/1163)
- Add `batchInsert`. [#1182](https://github.com/knex/knex/issues/1182)
- Better support for Mysql2 dialect options. [#980](https://github.com/knex/knex/issues/980)
- Support for `acquireConnectionTimeout` default 60 seconds preventing [#1040](https://github.com/knex/knex/issues/1040) from happening. [#1177](https://github.com/knex/knex/issues/1177)
- Fixed constraint name escaping when dropping a constraint. [#1177](https://github.com/knex/knex/issues/1177)
- Show also `.raw` queries in debug output. [#1169](https://github.com/knex/knex/issues/1169)
- Support for `cli` to use basic configuration without specific environment set. [#1101](https://github.com/knex/knex/issues/1101)

### 0.9.0 - Nov 2, 2015

- Fix error when merging `knex.raw` instances without arguments. [#853](https://github.com/knex/knex/issues/853)
- Fix error that caused the connection to time out while streaming. [#849](https://github.com/knex/knex/issues/849)
- Correctly parse SSL query parameter for PostgreSQL. [#852](https://github.com/knex/knex/issues/852)
- Pass `compress` option to MySQL2. [#843](https://github.com/knex/knex/issues/843)
- Schema: Use `timestamp with timezone` by default for `time`, `datetime` and `timestamp` for Oracle. [#876](https://github.com/knex/knex/issues/876)
- Add [`QueryBuilder#modify`](/guide/query-builder#modify) [#881](https://github.com/knex/knex/issues/881)
- Add LiveScript and Early Gray support for seeds and migrations.
- Add [`QueryBuilder#withSchema`](/guide/query-builder#withSchema) [#518](https://github.com/knex/knex/issues/518)
- Allow escaping of `?` in `knex.raw` queries. [#946](https://github.com/knex/knex/issues/946)
- Allow `0` in join clause. [#953](https://github.com/knex/knex/issues/953)
- Add migration config to allow disabling/enabling transactions per migration. [#834](https://github.com/knex/knex/issues/834)

### 0.8.6 - May 20, 2015

- Fix for several transaction / migration issues, [#832](https://github.com/knex/knex/issues/832), [#833](https://github.com/knex/knex/issues/833), [#834](https://github.com/knex/knex/issues/834), [#835](https://github.com/knex/knex/issues/835)

### 0.8.5 - May 14, 2015

- Pool should be initialized if no pool options are specified

### 0.8.4 - May 13, 2015

- Pool should not be initialized if {max: 0} is sent in config options

### 0.8.3 - May 2, 2015

- Alias postgresql -> postgres in connection config options

### 0.8.2 - May 1, 2015

- Fix regression in using query string in connection config

### 0.8.1 - May 1, 2015

- Warn rather than error when implicit commits wipe out savepoints in mysql / mariadb, [#805](https://github.com/knex/knex/issues/805).
- Fix for incorrect seed config reference, [#804](https://github.com/knex/knex/issues/804)

### 0.8.0 - Apr 30, 2015

**New features**

- Fixes several major outstanding bugs with the connection pool, switching to [Pool2](https://github.com/myndzi/pool2) in place of generic-pool-redux
- strong-oracle module support
- Nested transactions automatically become savepoints, with `commit` & `rollback` releasing or rolling back the current savepoint.
- Database seed file support, [#391](https://github.com/knex/knex/issues/391)
- Improved support for sub-raw queries within raw statements
- Migrations are now wrapped in transactions where possible
- Subqueries supported in insert statements, [#627](https://github.com/knex/knex/issues/627)
- Support for nested having, [#572](https://github.com/knex/knex/issues/572)
- Support object syntax for joins, similar to "where" [#743](https://github.com/knex/knex/issues/743)

**Major Changes**

- Transactions are immediately invoked as A+ promises, [#470](https://github.com/knex/knex/issues/470) (this is a feature and should not actually break anything in practice)
- Heavy refactoring internal APIs (public APIs should not be affected)

**Other Changes**

- Allow mysql2 to use non-default port, [#588](https://github.com/knex/knex/issues/588)
- Support creating & dropping extensions in PostgreSQL, [#540](https://github.com/knex/knex/issues/540)
- CLI support for knexfiles that do not provide environment keys, [#527](https://github.com/knex/knex/issues/527)
- Added sqlite3 dialect version of whereRaw/andWhereRaw ([#477](https://github.com/knex/knex/issues/477))

### 0.7.5 - Mar 9, 2015

- Fix bug in validateMigrationList, ([#697](https://github.com/knex/knex/issues/697))

### 0.7.4 - Feb 25, 2015

- Fix incorrect order of query parameters when using subqueries, [#704](https://github.com/knex/knex/issues/704)
- Properly handle limit 0, ([#655](https://github.com/knex/knex/issues/655))
- Apply promise args from then instead of [explicitly passing](https://github.com/petkaantonov/bluebird/issues/482).
- Respect union parameter as last argument ([#660](https://github.com/knex/knex/issues/660)).
- Added sqlite3 dialect version of whereRaw/andWhereRaw ([#477](https://github.com/knex/knex/issues/477)).
- Fix SQLite dropColumn doesn't work for last column ([#544](https://github.com/knex/knex/issues/544)).
- Add POSIX operator support for Postgres ([#562](https://github.com/knex/knex/issues/562))
- Sample seed files now correctly ([#391](https://github.com/knex/knex/issues/391))

### 0.7.3 - Oct 3, 2014

- Support for `join(table, rawOrBuilder)` syntax.
- Fix for regression in PostgreSQL connection ([#516](https://github.com/knex/knex/issues/516))

### 0.7.2 - Oct 1, 2014

- Fix for regression in migrations

### 0.7.1 - Oct 1, 2014

- Better disconnect handling & pool removal for MySQL clients, [#452](https://github.com/knex/knex/issues/452)

### 0.7.0 - Oct 1, 2014

**New features**

- Oracle support, [#419](https://github.com/knex/knex/issues/419)
- Database seed file support, [#391](https://github.com/knex/knex/issues/391)
- Improved support for sub-raw queries within raw statements

**Breaking changes**

- "collate nocase" no longer used by default in sqlite3 [#396](https://github.com/knex/knex/issues/396)

**Other Changes**

- Bumping Bluebird to ^2.x
- Transactions in websql are now a no-op (unsupported) [#375](https://github.com/knex/knex/issues/375)
- Improved test suite
- knex.fn namespace as function helper (knex.fn.now), [#372](https://github.com/knex/knex/issues/372)
- Better handling of disconnect errors
- Support for offset without limit, [#446](https://github.com/knex/knex/issues/446)
- Chainable first method for mysql schema, [#406](https://github.com/knex/knex/issues/406)
- Support for empty array in `whereIn`
- Create/drop schema for postgres, [#511](https://github.com/knex/knex/issues/511)
- Inserting multiple rows with default values, [#468](https://github.com/knex/knex/issues/468)
- Join columns are optional for cross-join, [#508](https://github.com/knex/knex/issues/508)
- Flag for creating jsonb columns in Postgresql, [#500](https://github.com/knex/knex/issues/500)

### 0.6.22 - July 10, 2014

- Bug fix for properly binding postgresql streaming queries, ([#363](https://github.com/knex/knex/issues/363))

### 0.6.21 - July 9, 2014

- Bug fix for raw queries not being transaction context aware, ([#351](https://github.com/knex/knex/issues/351)).
- Properly forward stream errors in sqlite3 runner, ([#359](https://github.com/knex/knex/issues/359))

### 0.6.20 - June 30, 2014

- Allow case insensitive operators in sql clauses, ([#344](https://github.com/knex/knex/issues/344))

### 0.6.19 - June 27, 2014

- Add `groupByRaw` / `orderByRaw` methods, better support for raw statements in group / order ([#282](https://github.com/knex/knex/issues/282)).
- Support more config options for node-mysql2 dialect ([#341](https://github.com/knex/knex/issues/341)).
- CLI help text fix, ([#342](https://github.com/knex/knex/issues/342))

### 0.6.18 - June 25, 2014

- Patch for the method, calling without a handler should return the stream, not a promise ([#337](https://github.com/knex/knex/issues/337))

### 0.6.17 - June 23, 2014

- Adding missing map / reduce proxies to bluebird's implementation

### 0.6.16 - June 18, 2014

- Increment / decrement returns the number of affectedRows ([#330](https://github.com/knex/knex/issues/330)).
- Allow --cwd option flag to be passed to CLI tool ([#326](https://github.com/knex/knex/issues/326))

### 0.6.15 - June 14, 2014

- Added the as method for aliasing subqueries

### 0.6.14 - June 14, 2014

- whereExists / whereNotExists may now take a query builder instance as well as a callback

### 0.6.13 - June 12, 2014

- Fix regression with onUpdate / onDelete in PostgreSQL, ([#308](https://github.com/knex/knex/issues/308)).
- Add missing `Promise` require to knex.js, unit test for knex.destroy ([#314](https://github.com/knex/knex/issues/314))

### 0.6.12 - June 10, 2014

- Fix for regression with boolean default types in PostgreSQL

### 0.6.11 - June 10, 2014

- Fix for regression with queries containing multiple order by statements in sqlite3

### 0.6.10 - June 10, 2014

- Fix for big regression in memoization of column names from 0.5 -> 0.6

### 0.6.9 - June 9, 2014

- Fix for regression in specificType method

### 0.6.8 - June 9, 2014

- Package.json fix for CLI

### 0.6.7 - June 9, 2014

- Adds support for [node-mysql2](https://github.com/sidorares/node-mysql2) library.
- Bundles CLI with the knex install, various related migrate CLI fixes

### 0.6.6 - June 9, 2014

- console.warn rather than throw when adding foreignKeys in SQLite3.
- Add support for dropColumn in SQLite3.
- Document `raw.wrap`

### 0.6.5 - June 9, 2014

- Add missing \_ require to WebSQL builds

### 0.6.4 - June 9, 2014

- Fix & document schema.raw method

### 0.6.3 - June 6, 2014

- Schema methods on transaction object are now transaction aware ([#301](https://github.com/knex/knex/issues/301)).
- Fix for resolved value from transactions, ([#298](https://github.com/knex/knex/issues/298)).
- Undefined columns are not added to builder

### 0.6.2 - June 4, 2014

- Fix regression in raw query output, ([#297](https://github.com/knex/knex/issues/297)).
- Fix regression in "pluck" method ([#296](https://github.com/knex/knex/issues/296)).
- Document [first](/guide/query-builder#first) method

### 0.6.1 - June 4, 2014

- Reverting to using .npmignore, the "files" syntax forgot the knex.js file

### 0.6.0 - June 4, 2014

**Major Library refactor**

- Major internal overhaul to clean up the various dialect code.
- Improved unit test suite.
- Support for the [mariasql](https://github.com/mscdex/node-mariasql) driver.
- More consistent use of raw query bindings throughout the library.
- Queries are more composable, may be injected in various points throughout the builder.
- Added [streaming](/guide/interfaces#streams) interface
- Deprecated 5 argument [join](/guide/query-builder#join) in favor of additional join methods.
- The wrapValue function to allow for array column operations in PostgreSQL ([#287](https://github.com/knex/knex/issues/287)).
- An explicit connection can be passed for any query ([#56](https://github.com/knex/knex/issues/56)).
- Drop column support for sqlite3
- All schema actions are run sequentially on the same connection if chained.
- Schema actions can now be wrapped in a transaction
- `.references(tableName.columnName)` as shorthand for `.references(columnName).inTable(tableName)`
- `.join('table.column', 'otherTable.column')` as shorthand for .join('table.column', '=', 'otherTable.column')
- Streams are supported for selects, passing through to the streaming capabilities of node-mysql and node-postgres
- For More information, see this [pull-request](https://github.com/tgriesser/knex/pull/252)

### 0.5.15 - June 4, 2014

- Dropped indexes feature now functions correctly, ([#278](https://github.com/knex/knex/issues/278))

### 0.5.14 - May 6, 2014

- Remove the charset encoding if it's utf8 for mysql, as it's the default but also currently causes some issues in recent versions of node-mysql

### 0.5.13 - April 2, 2014

- Fix regression in array bindings for postgresql ([#228](https://github.com/knex/knex/issues/228))

### 0.5.12 - Mar 31, 2014

- Add more operators for where clauses, including && ([#226](https://github.com/knex/knex/issues/226))

### 0.5.11 - Mar 25, 2014

- `.where(col, 'is', null)` or `.where(col, 'is not', null)` are not supported ([#221](https://github.com/knex/knex/issues/221)).
- Case insensitive `where` operators now allowed ([#212](https://github.com/knex/knex/issues/212)).
- Fix bug in increment/decrement truncating to an integer ([#210](https://github.com/knex/knex/issues/210)).
- Disconnected connections are now properly handled & removed from the pool ([#206](https://github.com/knex/knex/issues/206)).
- Internal tweaks to binding concatenations for performance ([#207](https://github.com/knex/knex/issues/207))

### 0.5.10 - Mar 19, 2014

- Add the .exec method to the internal promise shim

### 0.5.9 - Mar 18, 2014

- Remove error'ed connections from the connection pool ([#206](https://github.com/knex/knex/issues/206)), added support for node-postgres-pure (pg.js) ([#200](https://github.com/knex/knex/issues/200))

### 0.5.8 - Feb 27, 2014

- Fix for chaining on forUpdate / forShare, adding map & reduce from bluebird

### 0.5.7 - Feb 18, 2014

- Fix for a null limit / offset breaking query chain ([#182](https://github.com/knex/knex/issues/182))

### 0.5.6 - Feb 5, 2014

- Bump bluebird dependency to ~1.0.0, fixing regression in Bluebird 1.0.2 ([#176](https://github.com/knex/knex/issues/176))

### 0.5.5 - Jan 28, 2014

- Fix for the exit code on the migrations cli ([#151](https://github.com/knex/knex/issues/151)).
- The `init` method in `knex.migrate` now uses `this.config` if one isn't passed in ([#156](https://github.com/knex/knex/issues/156))

### 0.5.4 - Jan 7, 2014

- Fix for using raw statements in defaultTo schema builder methods ([#146](https://github.com/knex/knex/issues/146))

### 0.5.3 - Jan 2, 2014

- Fix for incorrectly formed sql when aggregates are used with columns ([#144](https://github.com/knex/knex/issues/144))

### 0.5.2 - Dec 18, 2013

- Adding passthrough "catch", "finally" to bluebird implementations, use bluebird's "nodeify" internally for exec

### 0.5.1 - Dec 12, 2013

- The [returning](/guide/query-builder#returning) in PostgreSQL may now accept \* or an array of columns to return. If either of these are passed, the response will be an array of objects rather than an array of values. Updates may also now use a `returning` value. ([#132](https://github.com/knex/knex/issues/132))
- Added `bigint` and `bigserial` type to PostgreSQL. ([#111](https://github.com/knex/knex/issues/111))
- Fix for the [specificType](/guide/schema-builder#specifictype) schema call ([#118](https://github.com/knex/knex/issues/118))
- Several fixes for migrations, including migration file path fixes, passing a Promise constructor to the migration `up` and `down` methods, allowing the "knex" module to be used globally, file ordering on migrations, and other small improvements. ([#112](https://github.com/knex/knex/issues/112)-115, [#125](https://github.com/knex/knex/issues/125), [#135](https://github.com/knex/knex/issues/135))

### 0.5.0 - Nov 25, 2013

- Initial pass at a [migration](/guide/migrations) api.
- Aggregate methods are no longer aliased as "aggregate", but may now be aliased and have more than one aggregate in a query ([#108](https://github.com/knex/knex/issues/108), [#110](https://github.com/knex/knex/issues/110)).
- Adding bigint and bigserial to PostgreSQL ([#111](https://github.com/knex/knex/issues/111)).
- Bugfix on increment/decrement values ([#100](https://github.com/knex/knex/issues/100)).
- Bugfix with having method ([#107](https://github.com/knex/knex/issues/107)).
- Switched from when.js to [bluebird](https://github.com/petkaantonov/bluebird) for promise implementation, with shim for backward compatibility.
- Switched from underscore to lodash, for semver reliability

### 0.4.13 - Oct 31, 2013

- Fix for aggregate methods on toString and clone, ([#98](https://github.com/knex/knex/issues/98))

### 0.4.12 - Oct 29, 2013

- Fix incorrect values passed to float in MySQL and decimal in PostgreSQL

### 0.4.11 - Oct 15, 2013

- Fix potential sql injection vulnerability in orderBy, thanks to @sebgie

### 0.4.10 - Oct 14, 2013

- Added [forUpdate](/guide/query-builder#forupdate) and [forShare](#Builder-forShare) for select modes in transactions. ([#84](https://github.com/knex/knex/issues/84))
- Fix bug where current query chain type is not copied on [clone](#Builder-clone). ([#90](https://github.com/knex/knex/issues/90))
- Charset and collate are now added as methods on the schema builder. ([#89](https://github.com/knex/knex/issues/89))
- Added `into` as an alias of [from](/guide/query-builder#from), for builder syntax of: `insert(value).into(tableName)`
- Internal pool fixes. ([#90](https://github.com/knex/knex/issues/90))

### 0.4.9 - Oct 7, 2013

- Fix for documentation of [hasColumn](/guide/schema-builder#hascolumn), ensure that `hasColumn` works with MySQL ([#87](https://github.com/knex/knex/issues/87)).
- More cleanup of error messages, showing the original error message concatenated with the sql and bindings

### 0.4.8 - Oct 2, 2013

- Connections are no longer pushed back into the pool if they never existed to begin with ([#85](https://github.com/knex/knex/issues/85))

### 0.4.7 - Sep 27, 2013

- The column is now a documented method on the builder api, and takes either an individual column or an array of columns to select

### 0.4.6 - Sep 25, 2013

- Standardizing handling of errors for easier debugging, as noted in ([#39](https://github.com/knex/knex/issues/39))

### 0.4.5 - Sep 24, 2013

- Fix for hasTable always returning true in MySQL ([#82](https://github.com/knex/knex/issues/82)), fix where sql queries were duplicated with multiple calls on toSql with the schema builder

### 0.4.4 - Sep 22, 2013

- Fix for debug method not properly debugging individual queries

### 0.4.3 - Sep 18, 2013

- Fix for underscore not being defined in various grammar files

### 0.4.2 - Sep 17, 2013

- Fix for an error being thrown when an initialized ClientBase instance was passed into Knex.initialize. pool.destroy now optionally accepts a callback to notify when it has completed draining and destroying all connections

### 0.4.1 - Sep 16, 2013

- Cleanup from the 0.4.0 release, fix a potential exploit in "where" clauses pointed out by Andri Möll, fix for clients not being properly released from the pool [#70](https://github.com/knex/knex/issues/70), fix for where("foo", "<>", null) doing an "IS NULL" statement

### 0.4.0 - Sep 13, 2013

**Breaking changes**

- Global state is no longer stored in the library, an instance is returned from `Knex.initialize`, so you will need to call this once and then reference this `knex` client elsewhere in your application.
- Lowercasing of `knex.raw`, `knex.transaction`, and `knex.schema`.
- Created columns are now nullable by default, unless `notNullable` is chained as an option.
- Keys created with `increments` are now assumed to be unsigned (MySQL) by default.
- The `destroyAllNow` is no longer called by the library on `process.exit` event. If you need to call it explicitly yourself, you may use `knex.client.destroyPool`

### 0.2.6 - Aug 29, 2013

- Reject the transaction promise if the transaction "commit" fails, ([#50](https://github.com/knex/knex/issues/50))

### 0.2.5 - Aug 25, 2013

- Fix error if a callback isn't specified for exec, ([#49](https://github.com/knex/knex/issues/49))

### 0.2.4 - Aug 22, 2013

- Fix SQLite3 delete not returning affected row count, ([#45](https://github.com/knex/knex/issues/45))

### 0.2.3 - Aug 22, 2013

- Fix insert with default values in PostgreSQL and SQLite3, ([#44](https://github.com/knex/knex/issues/44))

### 0.2.2 - Aug 20, 2013

- Allowing Raw queries to be passed as the primary table names

### 0.2.1 - Aug 13, 2013

- Fix for an array passed to insert being mutated

### 0.2.0 - Aug 7, 2013

**Breaking changes**

- [hasTable](/guide/schema-builder#hastable) now returns a boolean rather than a failed promise.
- Changed syntax for insert in postgresql, where the `id` is not assumed on inserts ([#18](https://github.com/knex/knex/issues/18)). The second parameter of [insert](#Builder-insert) is now required to return an array of insert id's for the last insert.
- The [timestamp](/guide/schema-builder#timestamp) method on the schema builder now uses a `dateTime` rather than a `timestamp`

### 0.1.8 - July 7, 2013

- Somehow missing the != operator. Using _.find rather than _.where in getCommandsByName([#22](https://github.com/knex/knex/issues/22))

### 0.1.7 - June 12, 2013

- Ensures unhandled errors in the exec callback interface are re-thrown

### 0.1.6 - June 9, 2013

- Renaming beforeCreate to afterCreate. Better handling of errors in the connection pooling

### 0.1.5 - June 9, 2013

- Added the ability to specify beforeCreate and beforeDestroy hooks on the initialize's options.pool to perform any necessary database setup/teardown on connections before use ([#14](https://github.com/knex/knex/issues/14)). where and having may now accept Knex.Raw instances, for consistency ([#15](https://github.com/knex/knex/issues/15)). Added an orHaving method to the builder. The ability to specify bindings on Raw queries has been removed

### 0.1.4 - May 22, 2013

- defaultTo now accepts "false" for boolean columns, allows for empty strings as default values

### 0.1.3 - May 18, 2013

- Enabling table aliases ([#11](https://github.com/knex/knex/issues/11)). Fix for issues with transactions not functioning ([#12](https://github.com/knex/knex/issues/12))

### 0.1.2 - May 15, 2013

- Bug fixes for groupBy ([#7](https://github.com/knex/knex/issues/7)). Mysql using collation, charset config settings in createTable. Added engine on schemaBuilder specifier ([#6](https://github.com/knex/knex/issues/6)). Other doc fixes, tests

### 0.1.1 - May 14, 2013

- Bug fixes for sub-queries, minor changes to initializing "main" instance, adding "pg" as a valid parameter for the client name in the connection settings

### 0.1.0 - May 13, 2013

- Initial Knex release
