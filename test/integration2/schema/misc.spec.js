'use strict';

const { expect } = require('chai');

const _ = require('lodash');
const { isString, isObject } = require('../../../lib/util/is');
const {
  isPgBased,
  isMysql,
  isOracle,
  isSQLite,
  isRedshift,
  isMssql,
  isCockroachDB,
  isPostgreSQL,
  isBetterSQLite3,
} = require('../../util/db-helpers');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const logger = require('../../integration/logger');
const { assertNumber } = require('../../util/assertHelper');

const wrapIdentifier = (value, wrap) => {
  return wrap(value ? value.toUpperCase() : value);
};

function mapObject(obj) {
  return _.transform(
    obj,
    (result, value, key) => {
      result[key.toUpperCase()] = value;
    },
    {}
  );
}

const postProcessResponse = (response) => {
  if (Array.isArray(response)) {
    return response.map(mapObject);
  } else {
    if (isObject(response)) {
      return mapObject(response);
    }
    return response;
  }
};

describe('Schema (misc)', () => {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;

      before(async () => {
        knex = logger(getKnexForDb(db));
      });

      after(async () => {
        return knex.destroy();
      });

      describe('errors for unsupported dialects', () => {
        it('throws an error if client does not support createSchema', async function () {
          if (isPgBased(knex)) {
            return this.skip();
          }

          let error;
          try {
            await knex.schema.createSchema('test');
          } catch (e) {
            error = e;
          }
          expect(error.message).to.equal(
            'createSchema is not supported for this dialect (only PostgreSQL supports it currently).'
          );
        });

        it('throws an error if client does not support createSchemaIfNotExists', async function () {
          if (isPgBased(knex)) {
            return this.skip();
          }

          let error;
          try {
            await knex.schema.createSchemaIfNotExists('test');
          } catch (e) {
            error = e;
          }
          expect(error.message).to.equal(
            'createSchemaIfNotExists is not supported for this dialect (only PostgreSQL supports it currently).'
          );
        });

        it('throws an error if client does not support dropSchema', async function () {
          if (isPgBased(knex)) {
            return this.skip();
          }

          let error;
          try {
            await knex.schema.dropSchema('test');
          } catch (e) {
            error = e;
          }
          expect(error.message).to.equal(
            'dropSchema is not supported for this dialect (only PostgreSQL supports it currently).'
          );
        });

        it('throws an error if client does not support dropSchemaIfExists', async function () {
          if (isPgBased(knex)) {
            return this.skip();
          }

          let error;
          try {
            await knex.schema.dropSchemaIfExists('test');
          } catch (e) {
            error = e;
          }
          expect(error.message).to.equal(
            'dropSchemaIfExists is not supported for this dialect (only PostgreSQL supports it currently).'
          );
        });
      });

      describe('dropSchema', () => {
        it('has a dropSchema/dropSchemaIfExists method', async function () {
          if (!isPgBased(knex)) {
            return this.skip();
          }

          this.timeout(process.env.KNEX_TEST_TIMEOUT || 30000);
          const dbDropSchema = ['pg', 'cockroachdb'];

          function checkSchemaNotExists(schemaName) {
            knex
              .raw(
                'SELECT schema_name FROM information_schema.schemata WHERE schema_name = ?',
                [schemaName]
              )
              .then((res) => {
                expect(res[0]).to.not.equal(schemaName);
              });
          }

          // Drop schema cascade = false tests.
          await knex.schema.createSchema('schema').then(() => {
            knex.schema
              .dropSchema('schema')
              .testSql((tester) => {
                tester(dbDropSchema, ['drop schema "schema"']);
              })
              .then(() => {
                checkSchemaNotExists('schema');
              });
          });

          await knex.schema.createSchema('schema_2').then(() => {
            knex.schema
              .dropSchemaIfExists('schema_2')
              .testSql((tester) => {
                tester(dbDropSchema, ['drop schema if exists "schema_2"']);
              })
              .then(() => {
                checkSchemaNotExists('schema_2');
              });
          });

          // Drop schema cascade = true tests
          await knex.schema.createSchema('schema_cascade_1').then(() => {
            knex.schema
              .withSchema('schema_cascade_1')
              .createTable('table_cascade_1', () => {}) // created to check if cascade works.
              .then(() => {
                knex.schema
                  .dropSchema('schema_cascade_1', true)
                  .testSql((tester) => {
                    tester(dbDropSchema, [
                      'drop schema "schema_cascade_1" cascade',
                    ]);
                  })
                  .then(() => {
                    checkSchemaNotExists('schema_cascade_1');
                    knex.schema
                      .withSchema('schema_cascade_1')
                      .hasTable('table_cascade_1')
                      .then((exists) => expect(exists).to.equal(false));
                  });
              });
          });

          await knex.schema.createSchema('schema_cascade_2').then(() => {
            knex.schema
              .withSchema('schema_cascade_2')
              .createTable('table_cascade_2', () => {}) // created to check if cascade works.
              .then(() => {
                knex.schema
                  .dropSchemaIfExists('schema_cascade_2', true)
                  .testSql((tester) => {
                    tester(dbDropSchema, [
                      'drop schema if exists "schema_cascade_2" cascade',
                    ]);
                  })
                  .then(() => {
                    checkSchemaNotExists('schema_cascade_2');
                    knex.schema
                      .withSchema('schema_cascade_2')
                      .hasTable('table_cascade_2')
                      .then((exists) => expect(exists).to.equal(false));
                  });
              });
          });
        });
      });

      describe('dropTable', () => {
        it('has a dropTableIfExists method', function () {
          this.timeout(process.env.KNEX_TEST_TIMEOUT || 30000);
          return Promise.all([
            knex.schema
              .dropTableIfExists('test_foreign_table_two')
              .testSql((tester) => {
                tester(
                  ['pg', 'cockroachdb'],
                  ['drop table if exists "test_foreign_table_two"']
                );
                tester(
                  ['pg-redshift'],
                  ['drop table if exists "test_foreign_table_two"']
                );
                tester(
                  ['sqlite3', 'mysql'],
                  ['drop table if exists `test_foreign_table_two`']
                );
                tester('oracledb', [
                  'begin execute immediate \'drop table "test_foreign_table_two"\'; exception when others then if sqlcode != -942 then raise; end if; end;',
                  'begin execute immediate \'drop sequence "test_foreign_table_two_seq"\'; exception when others then if sqlcode != -2289 then raise; end if; end;',
                ]);
                tester('mssql', [
                  "if object_id('[test_foreign_table_two]', 'U') is not null DROP TABLE [test_foreign_table_two]",
                ]);
              }),
            knex.schema
              .dropTableIfExists('test_table_one')
              .dropTableIfExists('catch_test')
              .dropTableIfExists('test_table_two')
              .dropTableIfExists('test_table_three')
              .dropTableIfExists('test_table_four')
              .dropTableIfExists('datatype_test')
              .dropTableIfExists('composite_key_test')
              .dropTableIfExists('charset_collate_test')
              .dropTableIfExists('accounts')
              .dropTableIfExists('migration_test_1')
              .dropTableIfExists('migration_test_2')
              .dropTableIfExists('migration_test_2_1')
              .dropTableIfExists('test_default_table')
              .dropTableIfExists('test_default_table2')
              .dropTableIfExists('test_default_table3')
              .dropTableIfExists('knex_migrations')
              .dropTableIfExists('knex_migrations_lock')
              .dropTableIfExists('bool_test')
              .dropTableIfExists('10_test_table')
              .dropTableIfExists('rename_column_foreign_test')
              .dropTableIfExists('rename_column_test')
              .dropTableIfExists('renamecoltest')
              .dropTableIfExists('should_not_be_run')
              .dropTableIfExists('invalid_inTable_param_test')
              .dropTableIfExists('primarytest')
              .dropTableIfExists('increments_columns_1_test')
              .dropTableIfExists('increments_columns_2_test'),
          ]);
        });
      });

      describe('createTable', () => {
        describe('like another table', () => {
          before(async () => {
            await knex.schema.createTable('table_to_copy', (table) => {
              table.increments('id');
              table.string('data');
              table.index('data', 'data_index');
            });
          });

          after(async () => {
            await knex.schema.dropTableIfExists('table_copied');
            await knex.schema.dropTableIfExists('table_to_copy');
          });

          it('copy table', async () => {
            await knex.schema
              .createTableLike('table_copied', 'table_to_copy')
              .testSql((tester) => {
                tester('mysql', [
                  'create table `table_copied` like `table_to_copy`',
                ]);
                tester(
                  ['pg', 'cockroachdb'],
                  [
                    'create table "table_copied" (like "table_to_copy" including all)',
                  ]
                );
                tester('pg-redshift', [
                  'create table "table_copied" (like "table_to_copy")',
                ]);
                tester('sqlite3', [
                  'create table `table_copied` as select * from `table_to_copy` where 0=1',
                ]);
                tester('oracledb', [
                  'create table "table_copied" as (select * from "table_to_copy" where 0=1)',
                ]);
                tester('mssql', [
                  'SELECT * INTO [table_copied] FROM [table_to_copy] WHERE 0=1',
                ]);
              });

            expect(await knex.schema.hasTable('table_copied')).to.equal(true);

            await knex('table_copied')
              .columnInfo()
              .then((res) => {
                expect(Object.keys(res)).to.have.all.members(['id', 'data']);
              });
          });

          it('copy table with additionnal column', async () => {
            await knex.schema.dropTableIfExists('table_copied');
            await knex.schema
              .createTableLike(
                'table_copied',
                'table_to_copy',
                function (table) {
                  table.text('add_col');
                  table.integer('add_num_col');
                }
              )
              .testSql((tester) => {
                tester('mysql', [
                  'create table `table_copied` like `table_to_copy`',
                  'alter table `table_copied` add `add_col` text, add `add_num_col` int',
                ]);
                tester(
                  ['pg', 'cockroachdb'],
                  [
                    'create table "table_copied" (like "table_to_copy" including all, "add_col" text, "add_num_col" integer)',
                  ]
                );
                tester('pg-redshift', [
                  'create table "table_copied" (like "table_to_copy")',
                  'alter table "table_copied" add column "add_col" varchar(max)',
                  'alter table "table_copied" add column "add_num_col" integer',
                ]);
                tester('sqlite3', [
                  'create table `table_copied` as select * from `table_to_copy` where 0=1',
                  'alter table `table_copied` add column `add_col` text',
                  'alter table `table_copied` add column `add_num_col` integer',
                ]);
                tester('oracledb', [
                  'create table "table_copied" as (select * from "table_to_copy" where 0=1)',
                  'alter table "table_copied" add ("add_col" clob, "add_num_col" integer)',
                ]);
                tester('mssql', [
                  'SELECT * INTO [table_copied] FROM [table_to_copy] WHERE 0=1',
                  'ALTER TABLE [table_copied] ADD [add_col] nvarchar(max), [add_num_col] int',
                ]);
              });

            expect(await knex.schema.hasTable('table_copied')).to.equal(true);

            await knex('table_copied')
              .columnInfo()
              .then((res) => {
                expect(Object.keys(res)).to.have.all.members([
                  'id',
                  'data',
                  'add_col',
                  'add_num_col',
                ]);
              });
          });
        });

        describe('increments types - postgres', () => {
          before(async () => {
            await knex.schema.createTable(
              'increments_columns_1_test',
              (table) => {
                table.increments().comment('comment_1');
              }
            );
            await knex.schema.createTable(
              'increments_columns_2_test',
              (table) => {
                table.increments('named_2').comment('comment_2');
              }
            );
          });

          after(async () => {
            await knex.schema.dropTable('increments_columns_1_test');
            await knex.schema.dropTable('increments_columns_2_test');
          });

          it('#2210 - creates an incrementing column with a comment', function () {
            if (!isPgBased(knex)) {
              return this.skip();
            }

            const table_name = 'increments_columns_1_test';
            const expected_column = 'id';
            const expected_comment = 'comment_1';

            return knex
              .raw(
                'SELECT c.oid FROM pg_catalog.pg_class c WHERE c.relname = ?',
                [table_name]
              )
              .then((res) => {
                const column_oid = res.rows[0].oid;

                return knex
                  .raw('SELECT pg_catalog.col_description(?,?);', [
                    column_oid,
                    '1',
                  ])
                  .then((_res) => {
                    const comment = _res.rows[0].col_description;

                    return knex
                      .raw(
                        'select column_name from INFORMATION_SCHEMA.COLUMNS where table_name = ?;',
                        table_name
                      )
                      .then((res) => {
                        const column_name = res.rows[0].column_name;

                        expect(column_name).to.equal(expected_column);
                        expect(comment).to.equal(expected_comment);
                      });
                  });
              });
          });

          it('#2210 - creates an incrementing column with a specified name and comment', function () {
            if (!isPgBased(knex)) {
              return this.skip();
            }

            const table_name = 'increments_columns_2_test';
            const expected_column = 'named_2';
            const expected_comment = 'comment_2';

            return knex
              .raw(
                'SELECT c.oid FROM pg_catalog.pg_class c WHERE c.relname = ?',
                [table_name]
              )
              .then((res) => {
                const column_oid = res.rows[0].oid;

                return knex
                  .raw('SELECT pg_catalog.col_description(?,?);', [
                    column_oid,
                    '1',
                  ])
                  .then((_res) => {
                    const comment = _res.rows[0].col_description;

                    return knex
                      .raw(
                        'select column_name from INFORMATION_SCHEMA.COLUMNS where table_name = ?;',
                        table_name
                      )
                      .then((res) => {
                        const column_name = res.rows[0].column_name;

                        expect(column_name).to.equal(expected_column);
                        expect(comment).to.equal(expected_comment);
                      });
                  });
              });
          });
        });

        describe('uuid types - postgres', () => {
          after(async () => {
            if (isPgBased(knex)) {
              await knex.schema.dropTable('uuid_column_test');
            }
          });

          it('creates a uuid column as primary using fluid syntax', async function () {
            if (!isPgBased(knex)) {
              return this.skip();
            }
            const table_name = 'uuid_column_test';
            const expected_column = 'id';
            const expected_type = 'uuid';

            await knex.schema.dropTableIfExists(table_name);
            await knex.schema.createTable(table_name, (table) => {
              table.uuid('id').primary();
            });

            const cols = await knex.raw(
              `select c.column_name, c.data_type
                     from INFORMATION_SCHEMA.COLUMNS c
                     join INFORMATION_SCHEMA.KEY_COLUMN_USAGE cu
                     on (c.table_name = cu.table_name and c.column_name = cu.column_name)
                     where c.table_name = ?
                     and (cu.constraint_name like '%_pkey' or cu.constraint_name = 'primary')`,
              table_name
            );
            const column_name = cols.rows[0].column_name;
            const column_type = cols.rows[0].data_type;

            expect(column_name).to.equal(expected_column);
            expect(column_type).to.equal(expected_type);
          });

          it('#5211 - creates an uuid column as primary key', async function () {
            if (!isPgBased(knex)) {
              return this.skip();
            }
            const table_name = 'uuid_column_test';
            const expected_column = 'id';
            const expected_type = 'uuid';

            await knex.schema.dropTableIfExists(table_name);
            await knex.schema.createTable(table_name, (table) => {
              table.uuid('id', { primaryKey: true });
            });

            const cols = await knex.raw(
              `select c.column_name, c.data_type
                     from INFORMATION_SCHEMA.COLUMNS c
                     join INFORMATION_SCHEMA.KEY_COLUMN_USAGE cu
                     on (c.table_name = cu.table_name and c.column_name = cu.column_name)
                     where c.table_name = ?
                     and (cu.constraint_name like '%_pkey' or cu.constraint_name = 'primary')`,
              table_name
            );
            const column_name = cols.rows[0].column_name;
            const column_type = cols.rows[0].data_type;

            expect(column_name).to.equal(expected_column);
            expect(column_type).to.equal(expected_type);
          });
        });

        describe('increments types - mysql', () => {
          before(() =>
            Promise.all([
              knex.schema.createTable('increments_columns_1_test', (table) => {
                table.increments().comment('comment_1');
              }),
              knex.schema.createTable('increments_columns_2_test', (table) => {
                table.increments('named_2').comment('comment_2');
              }),
            ])
          );

          after(() =>
            Promise.all([
              knex.schema.dropTable('increments_columns_1_test'),
              knex.schema.dropTable('increments_columns_2_test'),
            ])
          );

          it('#2210 - creates an incrementing column with a comment', function () {
            if (!isMysql(knex)) {
              return this.skip();
            }

            const table_name = 'increments_columns_1_test';
            const expected_column = 'id';
            const expected_comment = 'comment_1';

            const query = `
                  SELECT COLUMN_COMMENT
                  FROM INFORMATION_SCHEMA.COLUMNS
                  WHERE TABLE_NAME = ?
                    AND COLUMN_NAME = ?
                `;

            return knex
              .raw(query, [table_name, expected_column])
              .then((res) => {
                const comment = res[0][0].COLUMN_COMMENT;
                expect(comment).to.equal(expected_comment);
              });
          });

          it('#2210 - creates an incrementing column with a specified name and comment', function () {
            if (!isMysql(knex)) {
              return this.skip();
            }

            const table_name = 'increments_columns_2_test';
            const expected_column = 'named_2';
            const expected_comment = 'comment_2';

            const query = `
                  SELECT COLUMN_COMMENT
                  FROM INFORMATION_SCHEMA.COLUMNS
                  WHERE TABLE_NAME = ?
                    AND COLUMN_NAME = ?
                `;

            return knex
              .raw(query, [table_name, expected_column])
              .then((res) => {
                const comment = res[0][0].COLUMN_COMMENT;
                expect(comment).to.equal(expected_comment);
              });
          });
        });

        describe('enum - postgres', () => {
          afterEach(async () => {
            if (isPgBased(knex)) {
              await knex.schema
                .dropTableIfExists('native_enum_test')
                .raw('DROP TYPE IF EXISTS "foo_type"')
                .raw('DROP SCHEMA IF EXISTS "test" CASCADE');
            }
          });

          it('uses native type with schema', function () {
            if (!isPgBased(knex)) {
              return this.skip();
            }

            return knex.schema.createSchemaIfNotExists('test').then(() => {
              return knex.schema
                .withSchema('test')
                .createTable('native_enum_test', (table) => {
                  table
                    .enum('foo_column', ['a', 'b', 'c'], {
                      useNative: true,
                      enumName: 'foo_type',
                      schema: true,
                    })
                    .notNull();
                  table.uuid('id').notNull();
                })
                .testSql((tester) => {
                  tester(
                    ['pg', 'cockroachdb'],
                    [
                      "create type \"test\".\"foo_type\" as enum ('a', 'b', 'c')",
                      'create table "test"."native_enum_test" ("foo_column" "test"."foo_type" not null, "id" uuid not null)',
                    ]
                  );
                });
            });
          });

          it('uses native type when useNative is specified', function () {
            if (!isPgBased(knex)) {
              return this.skip();
            }

            return knex.schema
              .createTable('native_enum_test', (table) => {
                table
                  .enum('foo_column', ['a', 'b', 'c'], {
                    useNative: true,
                    enumName: 'foo_type',
                  })
                  .notNull();
                table.uuid('id').notNull();
              })
              .testSql((tester) => {
                tester(
                  ['pg', 'cockroachdb'],
                  [
                    "create type \"foo_type\" as enum ('a', 'b', 'c')",
                    'create table "native_enum_test" ("foo_column" "foo_type" not null, "id" uuid not null)',
                  ]
                );
              });
          });

          it('uses an existing native type when useNative and existingType are specified', function () {
            if (!isPgBased(knex)) {
              return this.skip();
            }
            return knex
              .raw("create type \"foo_type\" as enum ('a', 'b', 'c')")
              .then(() => {
                return knex.schema
                  .createTable('native_enum_test', (table) => {
                    table
                      .enum('foo_column', null, {
                        useNative: true,
                        enumName: 'foo_type',
                        existingType: true,
                      })
                      .notNull();
                    table.uuid('id').notNull();
                  })
                  .testSql((tester) => {
                    tester(
                      ['pg', 'cockroachdb'],
                      [
                        'create table "native_enum_test" ("foo_column" "foo_type" not null, "id" uuid not null)',
                      ]
                    );
                  });
              });
          });
        });

        it('Callback function must be supplied', () => {
          expect(() => {
            knex.schema.createTable('callback_must_be_supplied').toString();
          }).to.throw(TypeError);
          expect(() => {
            knex.schema
              .createTable('callback_must_be_supplied', () => {})
              .toString();
          }).to.not.throw(TypeError);
        });

        it('is possible to chain .catch', () =>
          knex.schema
            .createTable('catch_test', (t) => {
              t.increments();
            })
            .catch((e) => {
              throw e;
            }));

        it('accepts the table name, and a "container" function', () =>
          knex.schema
            .createTable('test_table_one', (table) => {
              if (isMysql(knex)) table.engine('InnoDB');
              table.comment('A table comment.');
              table.bigIncrements('id');
              table.string('first_name').index();
              table.string('last_name');
              table.string('email').unique().nullable();
              table.integer('logins').defaultTo(1).index().comment();
              table.float('balance').defaultTo(0);
              if (isOracle(knex)) {
                // use string instead to force varchar2 to avoid later problems with join and union
                table.string('about', 4000).comment('A comment.');
              } else {
                table.text('about').comment('A comment.');
              }
              table.timestamps();
            })
            .testSql((tester) => {
              tester('mysql', [
                "create table `test_table_one` (`id` bigint unsigned not null auto_increment primary key, `first_name` varchar(255), `last_name` varchar(255), `email` varchar(255) null, `logins` int default '1', `balance` float(8, 2) default '0', `about` text comment 'A comment.', `created_at` datetime, `updated_at` datetime) default character set utf8 engine = InnoDB comment = 'A table comment.'",
                'alter table `test_table_one` add index `test_table_one_first_name_index`(`first_name`)',
                'alter table `test_table_one` add unique `test_table_one_email_unique`(`email`)',
                'alter table `test_table_one` add index `test_table_one_logins_index`(`logins`)',
              ]);
              tester(
                ['pg', 'cockroachdb'],
                [
                  'create table "test_table_one" ("id" bigserial primary key, "first_name" varchar(255), "last_name" varchar(255), "email" varchar(255) null, "logins" integer default \'1\', "balance" real default \'0\', "about" text, "created_at" timestamptz, "updated_at" timestamptz)',
                  'comment on table "test_table_one" is \'A table comment.\'',
                  'comment on column "test_table_one"."logins" is NULL',
                  'comment on column "test_table_one"."about" is \'A comment.\'',
                  'create index "test_table_one_first_name_index" on "test_table_one" ("first_name")',
                  'alter table "test_table_one" add constraint "test_table_one_email_unique" unique ("email")',
                  'create index "test_table_one_logins_index" on "test_table_one" ("logins")',
                ]
              );
              tester('pg-redshift', [
                'create table "test_table_one" ("id" bigint identity(1,1) primary key not null, "first_name" varchar(255), "last_name" varchar(255), "email" varchar(255) null, "logins" integer default \'1\', "balance" real default \'0\', "about" varchar(max), "created_at" timestamptz, "updated_at" timestamptz)',
                'comment on table "test_table_one" is \'A table comment.\'',
                'comment on column "test_table_one"."logins" is NULL',
                'comment on column "test_table_one"."about" is \'A comment.\'',
                'alter table "test_table_one" add constraint "test_table_one_email_unique" unique ("email")',
              ]);
              tester('sqlite3', [
                "create table `test_table_one` (`id` integer not null primary key autoincrement, `first_name` varchar(255), `last_name` varchar(255), `email` varchar(255) null, `logins` integer default '1', `balance` float default '0', `about` text, `created_at` datetime, `updated_at` datetime)",
                'create index `test_table_one_first_name_index` on `test_table_one` (`first_name`)',
                'create unique index `test_table_one_email_unique` on `test_table_one` (`email`)',
                'create index `test_table_one_logins_index` on `test_table_one` (`logins`)',
              ]);
              tester('oracledb', [
                `create table "test_table_one" ("id" number(20, 0) not null primary key, "first_name" varchar2(255), "last_name" varchar2(255), "email" varchar2(255) null, "logins" integer default '1', "balance" float default '0', "about" varchar2(4000), "created_at" timestamp with local time zone, "updated_at" timestamp with local time zone)`,
                'comment on table "test_table_one" is \'A table comment.\'',
                `DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE ('CREATE SEQUENCE "test_table_one_seq"');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = 'P'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = 'test_table_one';  execute immediate ('create or replace trigger "test_table_one_autoinc_trg"  BEFORE INSERT on "test_table_one"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "test_table_one_seq".nextval into :new."' || PK_NAME || '" from dual;        select count("' || PK_NAME || '") into checking from "test_table_one"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'); END;`,
                'comment on column "test_table_one"."logins" is \'\'',
                'comment on column "test_table_one"."about" is \'A comment.\'',
                'create index "NkZo/dGRI9O73/NE2fHo+35d4jk" on "test_table_one" ("first_name")',
                'alter table "test_table_one" add constraint "test_table_one_email_unique" unique ("email")',
                'create index "test_table_one_logins_index" on "test_table_one" ("logins")',
              ]);
              tester('mssql', [
                "CREATE TABLE [test_table_one] ([id] bigint identity(1,1) not null primary key, [first_name] nvarchar(255), [last_name] nvarchar(255), [email] nvarchar(255) null, [logins] int CONSTRAINT [test_table_one_logins_default] DEFAULT '1', [balance] float CONSTRAINT [test_table_one_balance_default] DEFAULT '0', [about] nvarchar(max), [created_at] datetime2, [updated_at] datetime2)",
                "IF EXISTS(SELECT * FROM sys.fn_listextendedproperty(N'MS_Description', N'Schema', N'dbo', N'Table', N'test_table_one', NULL, NULL))\n  EXEC sys.sp_updateextendedproperty N'MS_Description', N'A table comment.', N'Schema', N'dbo', N'Table', N'test_table_one'\nELSE\n  EXEC sys.sp_addextendedproperty N'MS_Description', N'A table comment.', N'Schema', N'dbo', N'Table', N'test_table_one'",
                "IF EXISTS(SELECT * FROM sys.fn_listextendedproperty(N'MS_Description', N'Schema', N'dbo', N'Table', N'test_table_one', N'Column', N'about'))\n  EXEC sys.sp_updateextendedproperty N'MS_Description', N'A comment.', N'Schema', N'dbo', N'Table', N'test_table_one', N'Column', N'about'\nELSE\n  EXEC sys.sp_addextendedproperty N'MS_Description', N'A comment.', N'Schema', N'dbo', N'Table', N'test_table_one', N'Column', N'about'",
                'CREATE INDEX [test_table_one_first_name_index] ON [test_table_one] ([first_name])',
                'CREATE UNIQUE INDEX [test_table_one_email_unique] ON [test_table_one] ([email]) WHERE [email] IS NOT NULL',
                'CREATE INDEX [test_table_one_logins_index] ON [test_table_one] ([logins])',
              ]);
            }));

        it('create table with timestamps options', async () => {
          await knex.schema
            .createTable('test_table_timestamp', (table) => {
              if (isMysql(knex)) table.engine('InnoDB');
              table.bigIncrements('id');
              table.timestamps({
                useTimestamps: false,
                defaultToNow: true,
                useCamelCase: true,
              });
            })
            .testSql((tester) => {
              tester('mysql', [
                'create table `test_table_timestamp` (`id` bigint unsigned not null auto_increment primary key, `createdAt` datetime not null default CURRENT_TIMESTAMP, `updatedAt` datetime not null default CURRENT_TIMESTAMP) default character set utf8 engine = InnoDB',
              ]);
              tester(
                ['pg', 'cockroachdb'],
                [
                  'create table "test_table_timestamp" ("id" bigserial primary key, "createdAt" timestamptz not null default CURRENT_TIMESTAMP, "updatedAt" timestamptz not null default CURRENT_TIMESTAMP)',
                ]
              );
              tester('pg-redshift', [
                'create table "test_table_timestamp" ("id" bigint identity(1,1) primary key not null, "createdAt" timestamptz not null default CURRENT_TIMESTAMP, "updatedAt" timestamptz not null default CURRENT_TIMESTAMP)',
              ]);
              tester('sqlite3', [
                'create table `test_table_timestamp` (`id` integer not null primary key autoincrement, `createdAt` datetime not null default CURRENT_TIMESTAMP, `updatedAt` datetime not null default CURRENT_TIMESTAMP)',
              ]);
              tester('oracledb', [
                `create table "test_table_timestamp" ("id" number(20, 0) not null primary key, "createdAt" timestamp with local time zone default CURRENT_TIMESTAMP not null, "updatedAt" timestamp with local time zone default CURRENT_TIMESTAMP not null)`,
                `DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE ('CREATE SEQUENCE "test_table_timestamp_seq"');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_typ` +
                  `e = 'P'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = 'test_table_timestamp';  execute immediate ('create or replace trigger "gT8ntVvbOANQHra05aYo1kc6cCI"  BEFORE INSERT on` +
                  ` "test_table_timestamp"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "test_table_timestamp_seq".nextval into :new."' || PK_N` +
                  `AME || '" from dual;        select count("' || PK_NAME || '") into checking from "test_table_timestamp"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'); END;`,
              ]);
              tester('mssql', [
                'CREATE TABLE [test_table_timestamp] ([id] bigint identity(1,1) not null primary key, [createdAt] datetime2 not null CONSTRAINT [test_table_timestamp_createdat_default] DEFAULT CURRENT_TIMESTAMP, [updatedAt] datetime2 not null CONSTRAINT [test_table_timestamp_updatedat_default] DEFAULT CURRENT_TIMESTAMP)',
              ]);
            });
          await knex.schema.dropTableIfExists('test_table_timestamp');
        });

        it('is possible to set the db engine with the table.engine', () =>
          knex.schema
            .createTable('test_table_two', (table) => {
              if (isMysql(knex)) {
                table.engine('InnoDB');
              }
              table.increments();
              table.integer('account_id');
              if (isOracle(knex)) {
                // use string instead to force varchar2 to avoid later problems with join and union
                // e.g. where email (varchar2) = details (clob) does not work
                table.string('details', 4000);
              } else {
                table.text('details');
              }
              table.tinyint('status');
            })
            .testSql((tester) => {
              tester('mysql', [
                'create table `test_table_two` (`id` int unsigned not null auto_increment primary key, `account_id` int, `details` text, `status` tinyint) default character set utf8 engine = InnoDB',
              ]);
            }));

        it('sets default values with defaultTo', async () => {
          await knex.schema.dropTableIfExists('test_table_three');

          const defaultMetadata = { a: 10 };
          const defaultDetails = { b: { d: 20 } };
          await knex.schema
            .createTable('test_table_three', (table) => {
              if (isMysql(knex)) {
                table.engine('InnoDB');
              }
              table.integer('main').notNullable().primary();
              table.text('paragraph').defaultTo('Lorem ipsum Qui quis qui in.');
              table.json('metadata').defaultTo(defaultMetadata);
              if (isPgBased(knex)) {
                table.jsonb('details').defaultTo(defaultDetails);
              }
            })
            .testSql((tester) => {
              tester('mysql', [
                'create table `test_table_three` (`main` int not null, `paragraph` text, `metadata` json default (\'{"a":10}\'), primary key (`main`)) default character set utf8 engine = InnoDB',
              ]);
              tester(
                ['pg', 'cockroachdb'],
                [
                  'create table "test_table_three" ("main" integer not null, "paragraph" text default \'Lorem ipsum Qui quis qui in.\', "metadata" json default \'{"a":10}\', "details" jsonb default \'{"b":{"d":20}}\', constraint "test_table_three_pkey" primary key ("main"))',
                ]
              );
              tester('pg-redshift', [
                'create table "test_table_three" ("main" integer not null, "paragraph" varchar(max) default \'Lorem ipsum Qui quis qui in.\',  "metadata" json default \'{"a":10}\', "details" jsonb default \'{"b":{"d":20}}\')',
                'alter table "test_table_three" add constraint "test_table_three_pkey" primary key ("main")',
              ]);
              tester('sqlite3', [
                "create table `test_table_three` (`main` integer not null, `paragraph` text default 'Lorem ipsum Qui quis qui in.', `metadata` json default '{\"a\":10}', primary key (`main`))",
              ]);
              tester('oracledb', [
                'create table "test_table_three" ("main" integer not null, "paragraph" clob default \'Lorem ipsum Qui quis qui in.\', "metadata" clob default \'{"a":10}\')',
                'alter table "test_table_three" add constraint "test_table_three_pkey" primary key ("main")',
              ]);
              tester('mssql', [
                "CREATE TABLE [test_table_three] ([main] int not null, [paragraph] nvarchar(max) CONSTRAINT [test_table_three_paragraph_default] DEFAULT 'Lorem ipsum Qui quis qui in.', [metadata] nvarchar(max) CONSTRAINT [test_table_three_metadata_default] DEFAULT '{\"a\":10}', CONSTRAINT [test_table_three_pkey] PRIMARY KEY ([main]))",
              ]);
            })
            .then(() =>
              knex('test_table_three').insert([
                {
                  main: 1,
                },
              ])
            )
            .then(() => knex('test_table_three').where({ main: 1 }).first())
            .then((result) => {
              assertNumber(knex, result.main, 1);
              if (!isMysql(knex)) {
                // MySQL doesn't support default values in text columns
                expect(result.paragraph).to.eql('Lorem ipsum Qui quis qui in.');
                return;
              }
              if (isPgBased(knex)) {
                expect(result.metadata).to.eql(defaultMetadata);
                expect(result.details).to.eql(defaultDetails);
              } else if (isString(result.metadata)) {
                expect(JSON.parse(result.metadata)).to.eql(defaultMetadata);
              } else {
                expect(result.metadata).to.eql(defaultMetadata);
              }
            });
        });

        it('handles numeric length correctly', () =>
          knex.schema
            .createTable('test_table_numerics', (table) => {
              if (isMysql(knex)) {
                table.engine('InnoDB');
              }
              table.integer('integer_column', 5);
              table.tinyint('tinyint_column', 5);
              table.smallint('smallint_column');
              table.mediumint('mediumint_column');
              table.bigint('bigint_column');
            })
            .testSql((tester) => {
              tester('mysql', [
                'create table `test_table_numerics` (`integer_column` int(5), `tinyint_column` tinyint(5), `smallint_column` smallint, `mediumint_column` mediumint, `bigint_column` bigint) default character set utf8 engine = InnoDB',
              ]);
              tester(
                ['pg', 'cockroachdb'],
                [
                  'create table "test_table_numerics" ("integer_column" integer, "tinyint_column" smallint, "smallint_column" smallint, "mediumint_column" integer, "bigint_column" bigint)',
                ]
              );
              tester('sqlite3', [
                'create table `test_table_numerics` (`integer_column` integer, `tinyint_column` tinyint, `smallint_column` integer, `mediumint_column` integer, `bigint_column` bigint)',
              ]);
              tester('mssql', [
                'CREATE TABLE [test_table_numerics] ([integer_column] int, [tinyint_column] tinyint, [smallint_column] smallint, [mediumint_column] int, [bigint_column] bigint)',
              ]);
            })
            .then(() => knex.schema.dropTable('test_table_numerics')));

        it('supports the enum and uuid columns', () => {
          // NB: redshift does not...
          return knex.schema
            .createTable('datatype_test', (table) => {
              table.enum('enum_value', ['a', 'b', 'c']);
              table.uuid('uuid').notNull();
            })
            .testSql((tester) => {
              tester('mysql', [
                "create table `datatype_test` (`enum_value` enum('a', 'b', 'c'), `uuid` char(36) not null) default character set utf8",
              ]);
              tester(
                ['pg', 'cockroachdb'],
                [
                  'create table "datatype_test" ("enum_value" text check ("enum_value" in (\'a\', \'b\', \'c\')), "uuid" uuid not null)',
                ]
              );
              tester('sqlite3', [
                "create table `datatype_test` (`enum_value` text check (`enum_value` in ('a', 'b', 'c')), `uuid` char(36) not null)",
              ]);
              tester('oracledb', [
                'create table "datatype_test" ("enum_value" varchar2(1) check ("enum_value" in (\'a\', \'b\', \'c\')), "uuid" char(36) not null)',
              ]);
              tester('mssql', [
                'CREATE TABLE [datatype_test] ([enum_value] nvarchar(100), [uuid] uniqueidentifier not null)',
              ]);
            });
        });

        // Depends on previous test
        it('gets the columnInfo', function () {
          return knex('datatype_test')
            .columnInfo()
            .testSql(function (tester) {
              tester(
                'mysql',
                'select * from information_schema.columns where table_name = ? and table_schema = ?',
                null,
                {
                  enum_value: {
                    defaultValue: null,
                    maxLength: 1,
                    nullable: true,
                    type: 'enum',
                  },
                  uuid: {
                    defaultValue: null,
                    maxLength: 36,
                    nullable: false,
                    type: 'char',
                  },
                }
              );
              tester(
                'pg',
                'select * from information_schema.columns where table_name = ? and table_catalog = current_database() and table_schema = current_schema()',
                null,
                {
                  enum_value: {
                    defaultValue: null,
                    maxLength: null,
                    nullable: true,
                    type: 'text',
                  },
                  uuid: {
                    defaultValue: null,
                    maxLength: null,
                    nullable: false,
                    type: 'uuid',
                  },
                }
              );
              tester(
                'pgnative',
                'select * from information_schema.columns where table_name = ? and table_catalog = current_database() and table_schema = current_schema()',
                null,
                {
                  enum_value: {
                    defaultValue: null,
                    maxLength: null,
                    nullable: true,
                    type: 'text',
                  },
                  uuid: {
                    defaultValue: null,
                    maxLength: null,
                    nullable: false,
                    type: 'uuid',
                  },
                }
              );
              tester(
                'pg-redshift',
                'select * from information_schema.columns where table_name = ? and table_catalog = ? and table_schema = current_schema()',
                null,
                {
                  enum_value: {
                    defaultValue: null,
                    maxLength: 255,
                    nullable: true,
                    type: 'character varying',
                  },
                  uuid: {
                    defaultValue: null,
                    maxLength: 36,
                    nullable: false,
                    type: 'character',
                  },
                }
              );
              tester('sqlite3', 'PRAGMA table_info(`datatype_test`)', [], {
                enum_value: {
                  defaultValue: null,
                  maxLength: null,
                  nullable: true,
                  type: 'text',
                },
                uuid: {
                  defaultValue: null,
                  maxLength: '36',
                  nullable: false,
                  type: 'char',
                },
              });
              tester(
                'oracledb',
                "select * from xmltable( '/ROWSET/ROW'\n      passing dbms_xmlgen.getXMLType('\n      select char_col_decl_length, column_name, data_type, data_default, nullable\n      from all_tab_columns where table_name = ''datatype_test'' ')\n      columns\n      CHAR_COL_DECL_LENGTH number, COLUMN_NAME varchar2(200), DATA_TYPE varchar2(106),\n      DATA_DEFAULT clob, NULLABLE varchar2(1))",
                [],
                {
                  enum_value: {
                    defaultValue: null,
                    nullable: true,
                    maxLength: 1,
                    type: 'VARCHAR2',
                  },
                  uuid: {
                    defaultValue: null,
                    nullable: false,
                    maxLength: 36,
                    type: 'CHAR',
                  },
                }
              );
              tester(
                'mssql',
                "select [COLUMN_NAME], [COLUMN_DEFAULT], [DATA_TYPE], [CHARACTER_MAXIMUM_LENGTH], [IS_NULLABLE] from INFORMATION_SCHEMA.COLUMNS where table_name = ? and table_catalog = ? and table_schema = 'dbo'",
                ['datatype_test', 'knex_test'],
                {
                  enum_value: {
                    defaultValue: null,
                    maxLength: 100,
                    nullable: true,
                    type: 'nvarchar',
                  },
                  uuid: {
                    defaultValue: null,
                    maxLength: null,
                    nullable: false,
                    type: 'uniqueidentifier',
                  },
                }
              );
            });
        });

        it('gets the columnInfo with columntype', function () {
          return knex('datatype_test')
            .columnInfo('uuid')
            .testSql(function (tester) {
              tester(
                'mysql',
                'select * from information_schema.columns where table_name = ? and table_schema = ?',
                null,
                {
                  defaultValue: null,
                  maxLength: 36,
                  nullable: false,
                  type: 'char',
                }
              );
              tester(
                'pg',
                'select * from information_schema.columns where table_name = ? and table_catalog = current_database() and table_schema = current_schema()',
                null,
                {
                  defaultValue: null,
                  maxLength: null,
                  nullable: false,
                  type: 'uuid',
                }
              );
              tester(
                'pgnative',
                'select * from information_schema.columns where table_name = ? and table_catalog = current_database() and table_schema = current_schema()',
                null,
                {
                  defaultValue: null,
                  maxLength: null,
                  nullable: false,
                  type: 'uuid',
                }
              );
              tester(
                'pg-redshift',
                'select * from information_schema.columns where table_name = ? and table_catalog = ? and table_schema = current_schema()',
                null,
                {
                  defaultValue: null,
                  maxLength: 36,
                  nullable: false,
                  type: 'character',
                }
              );
              tester('sqlite3', 'PRAGMA table_info(`datatype_test`)', [], {
                defaultValue: null,
                maxLength: '36',
                nullable: false,
                type: 'char',
              });
              tester(
                'oracledb',
                "select * from xmltable( '/ROWSET/ROW'\n      passing dbms_xmlgen.getXMLType('\n      select char_col_decl_length, column_name, data_type, data_default, nullable\n      from all_tab_columns where table_name = ''datatype_test'' ')\n      columns\n      CHAR_COL_DECL_LENGTH number, COLUMN_NAME varchar2(200), DATA_TYPE varchar2(106),\n      DATA_DEFAULT clob, NULLABLE varchar2(1))",
                [],
                {
                  defaultValue: null,
                  maxLength: 36,
                  nullable: false,
                  type: 'CHAR',
                }
              );
              tester(
                'mssql',
                "select [COLUMN_NAME], [COLUMN_DEFAULT], [DATA_TYPE], [CHARACTER_MAXIMUM_LENGTH], [IS_NULLABLE] from INFORMATION_SCHEMA.COLUMNS where table_name = ? and table_catalog = ? and table_schema = 'dbo'",
                null,
                {
                  defaultValue: null,
                  maxLength: null,
                  nullable: false,
                  type: 'uniqueidentifier',
                }
              );
            });
        });

        it('allows for setting foreign keys on schema creation', () =>
          knex.schema
            .createTable('test_foreign_table_two', (table) => {
              table.increments();
              table
                .integer('fkey_two')
                .unsigned()
                .references('id')
                .inTable('test_table_two');
              table
                .integer('fkey_three')
                .unsigned()
                .references('id')
                .inTable('test_table_two')
                .withKeyName('fk_fkey_three');
              table.integer('fkey_four').unsigned();
              table
                .foreign('fkey_four', 'fk_fkey_four')
                .references('test_table_two.id');
            })
            .testSql((tester) => {
              tester('mysql', [
                'create table `test_foreign_table_two` (`id` int unsigned not null auto_increment primary key, `fkey_two` int unsigned, `fkey_three` int unsigned, `fkey_four` int unsigned) default character set utf8',
                'alter table `test_foreign_table_two` add constraint `test_foreign_table_two_fkey_two_foreign` foreign key (`fkey_two`) references `test_table_two` (`id`)',
                'alter table `test_foreign_table_two` add constraint `fk_fkey_three` foreign key (`fkey_three`) references `test_table_two` (`id`)',
                'alter table `test_foreign_table_two` add constraint `fk_fkey_four` foreign key (`fkey_four`) references `test_table_two` (`id`)',
              ]);
              tester(
                ['pg', 'cockroachdb'],
                [
                  'create table "test_foreign_table_two" ("id" serial primary key, "fkey_two" integer, "fkey_three" integer, "fkey_four" integer)',
                  'alter table "test_foreign_table_two" add constraint "test_foreign_table_two_fkey_two_foreign" foreign key ("fkey_two") references "test_table_two" ("id")',
                  'alter table "test_foreign_table_two" add constraint "fk_fkey_three" foreign key ("fkey_three") references "test_table_two" ("id")',
                  'alter table "test_foreign_table_two" add constraint "fk_fkey_four" foreign key ("fkey_four") references "test_table_two" ("id")',
                ]
              );
              tester('pg-redshift', [
                'create table "test_foreign_table_two" ("id" integer identity(1,1) primary key not null, "fkey_two" integer, "fkey_three" integer, "fkey_four" integer)',
                'alter table "test_foreign_table_two" add constraint "test_foreign_table_two_fkey_two_foreign" foreign key ("fkey_two") references "test_table_two" ("id")',
                'alter table "test_foreign_table_two" add constraint "fk_fkey_three" foreign key ("fkey_three") references "test_table_two" ("id")',
                'alter table "test_foreign_table_two" add constraint "fk_fkey_four" foreign key ("fkey_four") references "test_table_two" ("id")',
              ]);
              tester('sqlite3', [
                'create table `test_foreign_table_two` (`id` integer not null primary key autoincrement, `fkey_two` integer, `fkey_three` integer, `fkey_four` integer, ' +
                  'foreign key(`fkey_two`) references `test_table_two`(`id`), ' +
                  'constraint `fk_fkey_three` foreign key(`fkey_three`) references `test_table_two`(`id`), ' +
                  'constraint `fk_fkey_four` foreign key(`fkey_four`) references `test_table_two`(`id`))',
              ]);
              tester('oracledb', [
                'create table "test_foreign_table_two" ("id" integer not null primary key, "fkey_two" integer, "fkey_three" integer, "fkey_four" integer)',
                'DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE (\'CREATE SEQUENCE "test_foreign_table_two_seq"\');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = \'P\'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = \'test_foreign_table_two\';  execute immediate (\'create or replace trigger "m6uvAnbUQqcHvfWTN5IAjip1/vk"  BEFORE INSERT on "test_foreign_table_two"  for each row  declare  checking number := 1;  begin    if (:new."\' || PK_NAME || \'" is null) then      while checking >= 1 loop        select "test_foreign_table_two_seq".nextval into :new."\' || PK_NAME || \'" from dual;        select count("\' || PK_NAME || \'") into checking from "test_foreign_table_two"        where "\' || PK_NAME || \'" = :new."\' || PK_NAME || \'";      end loop;    end if;  end;\'); END;',
                'alter table "test_foreign_table_two" add constraint "q7TfvbIx3HUQbh+l+e5N+J+Guag" foreign key ("fkey_two") references "test_table_two" ("id")',
                'alter table "test_foreign_table_two" add constraint "fk_fkey_three" foreign key ("fkey_three") references "test_table_two" ("id")',
                'alter table "test_foreign_table_two" add constraint "fk_fkey_four" foreign key ("fkey_four") references "test_table_two" ("id")',
              ]);
              tester('mssql', [
                'CREATE TABLE [test_foreign_table_two] ([id] int identity(1,1) not null primary key, [fkey_two] int, [fkey_three] int, [fkey_four] int, ' +
                  'CONSTRAINT [test_foreign_table_two_fkey_two_foreign] FOREIGN KEY ([fkey_two]) REFERENCES [test_table_two] ([id]), ' +
                  'CONSTRAINT [fk_fkey_three] FOREIGN KEY ([fkey_three]) REFERENCES [test_table_two] ([id]), ' +
                  'CONSTRAINT [fk_fkey_four] FOREIGN KEY ([fkey_four]) REFERENCES [test_table_two] ([id]))',
              ]);
            }));

        it('rejects setting foreign key where tableName is not typeof === string', () => {
          const builder = knex.schema.createTable(
            'invalid_inTable_param_test',
            (table) => {
              const createInvalidUndefinedInTableSchema = () => {
                table.increments('id').references('id').inTable();
              };
              const createInvalidObjectInTableSchema = () => {
                table
                  .integer('another_id')
                  .references('id')
                  .inTable({ tableName: 'this_should_fail' });
              };
              expect(createInvalidUndefinedInTableSchema).to.throw(TypeError);
              expect(createInvalidObjectInTableSchema).to.throw(TypeError);

              table
                .integer('yet_another_id')
                .references('id')
                .inTable({ tableName: 'this_should_fail_too' });
            }
          );

          expect(() => builder.toSQL()).to.throw(TypeError);
        });

        it('allows for composite keys', () =>
          knex.schema
            .createTable('composite_key_test', (table) => {
              table.integer('column_a');
              table.integer('column_b');
              table.text('details');
              table.tinyint('status');
              table.unique(['column_a', 'column_b']);
            })
            .testSql((tester) => {
              tester('mysql', [
                'create table `composite_key_test` (`column_a` int, `column_b` int, `details` text, `status` tinyint) default character set utf8',
                'alter table `composite_key_test` add unique `composite_key_test_column_a_column_b_unique`(`column_a`, `column_b`)',
              ]);
              tester(
                ['pg', 'cockroachdb'],
                [
                  'create table "composite_key_test" ("column_a" integer, "column_b" integer, "details" text, "status" smallint)',
                  'alter table "composite_key_test" add constraint "composite_key_test_column_a_column_b_unique" unique ("column_a", "column_b")',
                ]
              );
              tester('pg-redshift', [
                'create table "composite_key_test" ("column_a" integer, "column_b" integer, "details" varchar(max), "status" smallint)',
                'alter table "composite_key_test" add constraint "composite_key_test_column_a_column_b_unique" unique ("column_a", "column_b")',
              ]);
              tester('sqlite3', [
                'create table `composite_key_test` (`column_a` integer, `column_b` integer, `details` text, `status` tinyint)',
                'create unique index `composite_key_test_column_a_column_b_unique` on `composite_key_test` (`column_a`, `column_b`)',
              ]);
              tester('oracledb', [
                'create table "composite_key_test" ("column_a" integer, "column_b" integer, "details" clob, "status" smallint)',
                'alter table "composite_key_test" add constraint "zYmMt0VQwlLZ20XnrMicXZ0ufZk" unique ("column_a", "column_b")',
              ]);
              tester('mssql', [
                'CREATE TABLE [composite_key_test] ([column_a] int, [column_b] int, [details] nvarchar(max), [status] tinyint)',
                'CREATE UNIQUE INDEX [composite_key_test_column_a_column_b_unique] ON [composite_key_test] ([column_a], [column_b]) WHERE [column_a] IS NOT NULL AND [column_b] IS NOT NULL',
              ]);
            })
            .then(() =>
              knex('composite_key_test').insert([
                {
                  column_a: 1,
                  column_b: 1,
                  details: 'One, One, One',
                  status: 1,
                },
                {
                  column_a: 1,
                  column_b: 2,
                  details: 'One, Two, Zero',
                  status: 0,
                },
                {
                  column_a: 1,
                  column_b: 3,
                  details: 'One, Three, Zero',
                  status: 0,
                },
              ])
            ));

        it('is possible to set the table collation with table.charset and table.collate', () =>
          knex.schema
            .createTable('charset_collate_test', (table) => {
              if (isMysql(knex)) {
                table.charset('latin1');
                table.collate('latin1_general_ci');
                table.engine('InnoDB');
              }
              table.increments();
              table.integer('account_id');
              table.text('details');
              table.tinyint('status');
            })
            .testSql((tester) => {
              tester('mysql', [
                'create table `charset_collate_test` (`id` int unsigned not null auto_increment primary key, `account_id` int, `details` text, `status` tinyint) default character set latin1 collate latin1_general_ci engine = InnoDB',
              ]);
              tester(
                ['pg', 'cockroachdb'],
                [
                  'create table "charset_collate_test" ("id" serial primary key, "account_id" integer, "details" text, "status" smallint)',
                ]
              );
              tester('pg-redshift', [
                'create table "charset_collate_test" ("id" integer identity(1,1) primary key not null, "account_id" integer, "details" varchar(max), "status" smallint)',
              ]);
              tester('sqlite3', [
                'create table `charset_collate_test` (`id` integer not null primary key autoincrement, `account_id` integer, `details` text, `status` tinyint)',
              ]);
              tester('oracledb', [
                'create table "charset_collate_test" ("id" integer not null primary key, "account_id" integer, "details" clob, "status" smallint)',
                'DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE (\'CREATE SEQUENCE "charset_collate_test_seq"\');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = \'P\'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = \'charset_collate_test\';  execute immediate (\'create or replace trigger "x9C3VzXH9urIKnTjm32JM7OvYYQ"  BEFORE INSERT on "charset_collate_test"  for each row  declare  checking number := 1;  begin    if (:new."\' || PK_NAME || \'" is null) then      while checking >= 1 loop        select "charset_collate_test_seq".nextval into :new."\' || PK_NAME || \'" from dual;        select count("\' || PK_NAME || \'") into checking from "charset_collate_test"        where "\' || PK_NAME || \'" = :new."\' || PK_NAME || \'";      end loop;    end if;  end;\'); END;',
              ]);
              tester('mssql', [
                'CREATE TABLE [charset_collate_test] ([id] int identity(1,1) not null primary key, [account_id] int, [details] nvarchar(max), [status] tinyint)',
              ]);
            }));

        it('sets booleans & defaults correctly', () =>
          knex.schema
            .createTable('bool_test', (table) => {
              table.bool('one');
              table.bool('two').defaultTo(false);
              table.bool('three').defaultTo(true);
              table.bool('four').defaultTo('true');
              table.bool('five').defaultTo('false');
            })
            .testSql((tester) => {
              tester('mysql', [
                "create table `bool_test` (`one` boolean, `two` boolean default '0', `three` boolean default '1', `four` boolean default '1', `five` boolean default '0') default character set utf8",
              ]);
              tester(
                ['pg', 'cockroachdb'],
                [
                  'create table "bool_test" ("one" boolean, "two" boolean default \'0\', "three" boolean default \'1\', "four" boolean default \'1\', "five" boolean default \'0\')',
                ]
              );
              tester('pg-redshift', [
                'create table "bool_test" ("one" boolean, "two" boolean default \'0\', "three" boolean default \'1\', "four" boolean default \'1\', "five" boolean default \'0\')',
              ]);
              tester('better-sqlite3', [
                "create table `bool_test` (`one` boolean, `two` boolean default '0', `three` boolean default '1', `four` boolean default '1', `five` boolean default '0')",
              ]);
              tester('sqlite3', [
                "create table `bool_test` (`one` boolean, `two` boolean default '0', `three` boolean default '1', `four` boolean default '1', `five` boolean default '0')",
              ]);
              tester('oracledb', [
                "create table \"bool_test\" (\"one\" number(1, 0) check (\"one\" in ('0', '1')), \"two\" number(1, 0) default '0' check (\"two\" in ('0', '1')), \"three\" number(1, 0) default '1' check (\"three\" in ('0', '1')), \"four\" number(1, 0) default '1' check (\"four\" in ('0', '1')), \"five\" number(1, 0) default '0' check (\"five\" in ('0', '1')))",
              ]);
              tester('mssql', [
                "CREATE TABLE [bool_test] ([one] bit, [two] bit CONSTRAINT [bool_test_two_default] DEFAULT '0', [three] bit CONSTRAINT [bool_test_three_default] DEFAULT '1', [four] bit CONSTRAINT [bool_test_four_default] DEFAULT '1', [five] bit CONSTRAINT [bool_test_five_default] DEFAULT '0')",
              ]);
            })
            .then(() => knex.insert({ one: false }).into('bool_test')));

        it('accepts table names starting with numeric values', () =>
          knex.schema
            .createTable('10_test_table', (table) => {
              table.bigIncrements('id');
              table.string('first_name').index();
              table.string('last_name');
              table.string('email').unique().nullable();
              table.integer('logins').defaultTo(1).index().comment();
            })
            .testSql((tester) => {
              tester('mysql', [
                "create table `10_test_table` (`id` bigint unsigned not null auto_increment primary key, `first_name` varchar(255), `last_name` varchar(255), `email` varchar(255) null, `logins` int default '1') default character set utf8",
                'alter table `10_test_table` add index `10_test_table_first_name_index`(`first_name`)',
                'alter table `10_test_table` add unique `10_test_table_email_unique`(`email`)',
                'alter table `10_test_table` add index `10_test_table_logins_index`(`logins`)',
              ]);
              tester(
                ['pg', 'cockroachdb'],
                [
                  'create table "10_test_table" ("id" bigserial primary key, "first_name" varchar(255), "last_name" varchar(255), "email" varchar(255) null, "logins" integer default \'1\')',
                  'comment on column "10_test_table"."logins" is NULL',
                  'create index "10_test_table_first_name_index" on "10_test_table" ("first_name")',
                  'alter table "10_test_table" add constraint "10_test_table_email_unique" unique ("email")',
                  'create index "10_test_table_logins_index" on "10_test_table" ("logins")',
                ]
              );
              tester('sqlite3', [
                "create table `10_test_table` (`id` integer not null primary key autoincrement, `first_name` varchar(255), `last_name` varchar(255), `email` varchar(255) null, `logins` integer default '1')",
                'create index `10_test_table_first_name_index` on `10_test_table` (`first_name`)',
                'create unique index `10_test_table_email_unique` on `10_test_table` (`email`)',
                'create index `10_test_table_logins_index` on `10_test_table` (`logins`)',
              ]);
              tester('oracledb', [
                'create table "10_test_table" ("id" number(20, 0) not null primary key, "first_name" varchar2(255), "last_name" varchar2(255), "email" varchar2(255) null, "logins" integer default \'1\')',
                'DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE (\'CREATE SEQUENCE "10_test_table_seq"\');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = \'P\'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = \'10_test_table\';  execute immediate (\'create or replace trigger "10_test_table_autoinc_trg"  BEFORE INSERT on "10_test_table"  for each row  declare  checking number := 1;  begin    if (:new."\' || PK_NAME || \'" is null) then      while checking >= 1 loop        select "10_test_table_seq".nextval into :new."\' || PK_NAME || \'" from dual;        select count("\' || PK_NAME || \'") into checking from "10_test_table"        where "\' || PK_NAME || \'" = :new."\' || PK_NAME || \'";      end loop;    end if;  end;\'); END;',
                'comment on column "10_test_table"."logins" is \'\'',
                'create index "10_test_table_first_name_index" on "10_test_table" ("first_name")',
                'alter table "10_test_table" add constraint "10_test_table_email_unique" unique ("email")',
                'create index "10_test_table_logins_index" on "10_test_table" ("logins")',
              ]);
            }));

        it('test boolean type with sqlite3 and better sqlite3 #4955', async function () {
          if (!isSQLite(knex)) {
            this.skip();
          }
          await knex.schema
            .dropTableIfExists('test')
            .createTable('test', (table) => {
              table.boolean('value').notNullable();
            });

          await knex('test').insert([{ value: true }, { value: false }]);
          const data = await knex('test').select();
          expect(data[0].value).to.eq(1);
          expect(data[1].value).to.eq(0);
        });
      });

      describe('table', () => {
        it('Callback function must be supplied', () => {
          expect(() => {
            knex.schema.createTable('callback_must_be_supplied').toString();
          }).to.throw(TypeError);
          expect(() => {
            knex.schema
              .createTable('callback_must_be_supplied', () => {})
              .toString();
          }).to.not.throw(TypeError);
        });

        it('allows adding a field', () =>
          knex.schema.table('test_table_two', (t) => {
            t.json('json_data', true);
          }));

        it('allows adding multiple columns at once', function () {
          if (isRedshift(knex)) {
            return this.skip();
          }
          return knex.schema
            .table('test_table_two', (t) => {
              t.string('one');
              t.string('two');
              t.string('three');
            })
            .then(() =>
              knex.schema.table('test_table_two', (t) => {
                t.dropColumn('one');
                t.dropColumn('two');
                t.dropColumn('three');
              })
            );
        });

        it('handles creating numeric columns with specified length correctly', () =>
          knex.schema
            .createTable('test_table_numerics2', (table) => {
              table.integer('integer_column', 5);
              table.tinyint('tinyint_column', 5);
              table.smallint('smallint_column', 5);
              table.mediumint('mediumint_column', 5);
              table.bigint('bigint_column', 5);
            })
            .then(() => knex.schema.dropTable('test_table_numerics2')));

        it('allows alter column syntax', async () => {
          if (
            isSQLite(knex) ||
            isRedshift(knex) ||
            isMssql(knex) ||
            isOracle(knex) ||
            isCockroachDB(knex)
          ) {
            return;
          }

          await knex.schema.table('test_table_two', (t) => {
            t.integer('remove_not_null').notNull().defaultTo(1);
            t.string('remove_default').notNull().defaultTo(1);
            t.dateTime('datetime_to_date').notNull().defaultTo(knex.fn.now());
          });

          await knex.schema.table('test_table_two', (t) => {
            t.integer('remove_not_null').defaultTo(1).alter();
            t.integer('remove_default').notNull().alter();
            t.date('datetime_to_date').alter();
          });

          const info = await knex('test_table_two').columnInfo();
          expect(info.remove_not_null.nullable).to.equal(true);
          expect(info.remove_not_null.defaultValue).to.not.equal(null);
          expect(info.remove_default.nullable).to.equal(false);
          expect(info.remove_default.defaultValue).to.equal(null);
          expect(info.remove_default.type).to.contains('int');

          await knex.schema.table('test_table_two', (t) => {
            t.dropColumn('remove_default');
            t.dropColumn('remove_not_null');
            t.dropColumn('datetime_to_date');
          });
        });

        it('allows adding a field with custom collation after another field', () =>
          knex.schema
            .table('test_table_two', (t) => {
              t.string('ref_column').after('json_data');
            })
            .then(() =>
              knex.schema.table('test_table_two', (t) => {
                t.string('after_column')
                  .after('ref_column')
                  .collate('utf8_bin');
              })
            )
            .then(() =>
              knex.schema.table('test_table_two', (t) => {
                t.dropColumn('ref_column');
                t.dropColumn('after_column');
              })
            ));

        it('allows adding a field with custom collation first', () =>
          knex.schema
            .table('test_table_two', (t) => {
              t.string('first_column').first().collate('utf8_bin');
            })
            .then(() =>
              knex.schema.table('test_table_two', (t) => {
                t.dropColumn('first_column');
              })
            ));

        it('allows changing a field', () =>
          knex.schema.table('test_table_one', (t) => {
            t.string('phone').nullable();
          }));

        it('allows dropping a unique index', () =>
          knex.schema.table('composite_key_test', (t) => {
            t.dropUnique(['column_a', 'column_b']);
          }));

        it('allows dropping a index', () =>
          knex.schema.table('test_table_one', (t) => {
            t.dropIndex('first_name');
          }));

        describe('supports partial indexes - postgres, sqlite, and mssql', function () {
          it('allows creating indexes with predicate', async function () {
            if (!(isPostgreSQL(knex) || isMssql(knex) || isSQLite(knex))) {
              return this.skip();
            }

            await knex.schema.table('test_table_one', function (t) {
              t.index('first_name', 'first_name_idx', {
                predicate: knex.whereRaw("first_name = 'brandon'"),
              });
              t.index('phone', 'phone_idx', {
                predicate: knex.whereNotNull('phone'),
              });
            });
          });

          it('actually stores the predicate in the Postgres server', async function () {
            if (!isPostgreSQL(knex)) {
              return this.skip();
            }
            await knex.schema.table('test_table_one', function (t) {
              t.index('phone', 'phone_idx_2', {
                predicate: knex.whereNotNull('phone'),
              });
            });
            const results = await knex
              .from('pg_class')
              .innerJoin('pg_index', 'pg_index.indexrelid', 'pg_class.oid')
              .where({
                relname: 'phone_idx_2',
                indisvalid: true,
              })
              .whereNotNull('indpred');
            expect(results).to.not.be.empty;
          });
        });

        describe('supports partial unique indexes - postgres, sqlite, and mssql', function () {
          it('allows creating a unique index with predicate', async function () {
            if (!(isPostgreSQL(knex) || isMssql(knex) || isSQLite(knex))) {
              return this.skip();
            }

            await knex.schema.table('test_table_one', function (t) {
              t.unique('email', {
                indexName: 'email_idx',
                predicate: knex.whereNotNull('email'),
              });
            });
          });

          it('actually stores the predicate in the Postgres server', async function () {
            if (!isPostgreSQL(knex)) {
              return this.skip();
            }
            await knex.schema.table('test_table_one', function (t) {
              t.unique('email', {
                indexName: 'email_idx_2',
                predicate: knex.whereNotNull('email'),
              });
            });
            const results = await knex
              .from('pg_class')
              .innerJoin('pg_index', 'pg_index.indexrelid', 'pg_class.oid')
              .where({
                relname: 'email_idx_2',
                indisvalid: true,
                indisunique: true,
              })
              .whereNotNull('indpred');
            expect(results).to.not.be.empty;
          });
        });
      });

      describe('hasTable', () => {
        it('should be true if a table exists', () =>
          knex.schema.hasTable('test_table_two').then((resp) => {
            expect(resp).to.equal(true);
          }));

        it('should be false if a table does not exists', () =>
          knex.schema.hasTable('this_table_is_fake').then((resp) => {
            expect(resp).to.equal(false);
          }));

        it('should be false whether a parameter is not specified', () =>
          knex.schema.hasTable('').then((resp) => {
            expect(resp).to.equal(false);
          }));

        describe('sqlite only', () => {
          it('should not parse table name if wrapIdentifier is not specified', async function () {
            if (!isSQLite(knex)) {
              return this.skip();
            }

            knex.client.config.wrapIdentifier = null;

            const resp = await knex.schema.hasTable('testTableTwo');
            expect(resp).to.be.false;
          });

          it('should parse table name if wrapIdentifier is specified', async function () {
            if (!isSQLite(knex)) {
              return this.skip();
            }

            knex.client.config.wrapIdentifier = (
              value,
              origImpl,
              queryContext
            ) => origImpl(_.snakeCase(value));

            const resp = await knex.schema.hasTable('testTableTwo');
            expect(resp).to.be.true;
          });
        });
      });

      describe('renameTable', () => {
        it('renames the table from one to another', () =>
          knex.schema.renameTable('test_table_one', 'accounts'));
      });

      describe('dropTable', () => {
        it('should drop a table', () =>
          knex.schema.dropTable('test_table_three').then(() => {
            // Drop this here so we don't have foreign key constraints...
            return knex.schema.dropTable('test_foreign_table_two');
          }));
      });

      describe('hasColumn', () => {
        describe('without processors', () => {
          it('checks whether a column exists, resolving with a boolean', () =>
            knex.schema.hasColumn('accounts', 'first_name').then((exists) => {
              expect(exists).to.equal(true);
            }));

          describe('sqlite and mysql only', () => {
            it('checks whether a column exists without being case sensitive, resolving with a boolean', async function () {
              if (!isSQLite(knex) && !isMysql(knex)) {
                return this.skip();
              }

              const exists = await knex.schema.hasColumn(
                'accounts',
                'FIRST_NAME'
              );

              expect(exists).to.equal(true);
            });
          });
        });

        describe('using processorss', () => {
          describe('sqlite and pg only', () => {
            beforeEach(() => {
              knex.client.config.postProcessResponse = postProcessResponse;
              knex.client.config.wrapIdentifier = wrapIdentifier;
            });

            afterEach(() => {
              knex.client.config.postProcessResponse = null;
              knex.client.config.wrapIdentifier = null;
            });

            it('checks whether a column exists, resolving with a boolean', async function () {
              if (!isSQLite(knex) && !isPgBased(knex)) {
                return this.skip();
              }

              const exists = await knex.schema.hasColumn(
                'accounts',
                'firstName'
              );
              expect(exists).to.equal(false);
            });
          });
        });
      });

      describe('addColumn', () => {
        describe('mysql only', () => {
          before(() => {
            if (isMysql(knex)) {
              return knex.schema
                .dropTableIfExists('add_column_test_mysql')
                .createTable('add_column_test_mysql', (tbl) => {
                  tbl.integer('field_foo');
                  tbl.integer('field_bar');
                })
                .then(() =>
                  knex.schema.alterTable('add_column_test_mysql', (tbl) => {
                    tbl.integer('field_foo').comment('foo').alter();
                    tbl.integer('field_bar').comment('bar').alter();
                    tbl.integer('field_first').first().comment('First');
                    tbl
                      .integer('field_after_foo')
                      .after('field_foo')
                      .comment('After');
                    tbl
                      .increments('field_nondefault_increments')
                      .comment('Comment on increment col');
                  })
                );
            }
          });

          after(() => {
            if (isMysql(knex)) {
              knex.schema.dropTable('add_column_test_mysql');
            }
          });

          it('should columns order be correctly with after and first', function () {
            if (!isMysql(knex)) {
              return this.skip();
            }

            return knex
              .raw('SHOW CREATE TABLE `add_column_test_mysql`')
              .then((schema) => {
                // .columnInfo() keys does not guaranteed fields order.
                const fields = schema[0][0]['Create Table']
                  .split('\n')
                  .filter((e) => e.trim().indexOf('`field_') === 0)
                  .map((e) => e.trim())
                  .map((e) => e.slice(1, e.slice(1).indexOf('`') + 1));

                // Fields order
                expect(fields[0]).to.equal('field_first');
                expect(fields[1]).to.equal('field_foo');
                expect(fields[2]).to.equal('field_after_foo');
                expect(fields[3]).to.equal('field_bar');
                expect(fields[4]).to.equal('field_nondefault_increments');

                // .columnInfo() does not included fields comment.
                const comments = schema[0][0]['Create Table']
                  .split('\n')
                  .filter((e) => e.trim().indexOf('`field_') === 0)
                  .map((e) => e.slice(e.indexOf("'")).trim())
                  .map((e) => e.slice(1, e.slice(1).indexOf("'") + 1));

                // Fields comment
                expect(comments[0]).to.equal('First');
                expect(comments[1]).to.equal('foo');
                expect(comments[2]).to.equal('After');
                expect(comments[3]).to.equal('bar');
                expect(comments[4]).to.equal('Comment on increment col');
              });
          });
        });
      });

      describe('renameColumn', () => {
        describe('without mappers', () => {
          before(async () => {
            await knex.schema
              .createTable('rename_column_test', (tbl) => {
                tbl.increments('id_test').unsigned().primary();
                tbl
                  .integer('parent_id_test')
                  .unsigned()
                  .references('id_test')
                  .inTable('rename_column_test');
              })
              .createTable('rename_column_foreign_test', (tbl) => {
                tbl.increments('id').unsigned().primary();
                tbl
                  .integer('foreign_id_test')
                  .unsigned()
                  .references('id_test')
                  .inTable('rename_column_test');
              })
              .createTable('rename_col_test', (tbl) => {
                tbl.integer('colnameint').defaultTo(1);
                tbl.string('colnamestring').defaultTo('knex').notNullable();
              });
          });

          after(async () => {
            await knex.schema
              .dropTable('rename_column_foreign_test')
              .dropTable('rename_column_test')
              .dropTable('rename_col_test');
          });

          it('renames the column', async () => {
            await knex.schema.table('rename_column_test', (tbl) =>
              tbl.renameColumn('id_test', 'id')
            );
            const exists = await knex.schema.hasColumn(
              'rename_column_test',
              'id'
            );
            expect(exists).to.equal(true);
          });

          it('successfully renames a column referenced in a foreign key', () =>
            knex.schema.table('rename_column_test', (tbl) => {
              tbl.renameColumn('parent_id_test', 'parent_id');
            }));

          it('successfully renames a column referenced by another table', () =>
            knex.schema.table('rename_column_test', (tbl) => {
              tbl.renameColumn('id', 'id_new');
            }));

          it('#933 - .renameColumn should not drop null or default value', () => {
            const tableName = 'rename_col_test';
            return knex.transaction((tr) => {
              const getColInfo = () => tr(tableName).columnInfo();
              return getColInfo()
                .then((colInfo) => {
                  expect(String(colInfo.colnameint.defaultValue)).to.contain(
                    '1'
                  );
                  // Using contain because of different response per dialect.
                  // IE mysql 'knex', postgres 'knex::character varying'
                  expect(colInfo.colnamestring.defaultValue).to.contain('knex');
                  expect(colInfo.colnamestring.nullable).to.equal(false);
                  return tr.schema.table(tableName, (table) => {
                    table.renameColumn('colnameint', 'colnameintchanged');
                    table.renameColumn('colnamestring', 'colnamestringchanged');
                  });
                })
                .then(getColInfo)
                .then((columnInfo) => {
                  expect(
                    String(columnInfo.colnameintchanged.defaultValue)
                  ).to.contain('1');
                  expect(
                    columnInfo.colnamestringchanged.defaultValue
                  ).to.contain('knex');
                  expect(columnInfo.colnamestringchanged.nullable).to.equal(
                    false
                  );
                });
            });
          });

          it('#2767 - .renameColumn should not drop the auto incremental', async () => {
            const tableName = 'rename_column_test';

            if (isMssql(knex)) {
              const res = await knex.raw(
                `select COLUMNPROPERTY(object_id(TABLE_SCHEMA + '.' + TABLE_NAME), COLUMN_NAME,
                                             'IsIdentity') as Ident
                       from INFORMATION_SCHEMA.COLUMNS
                       where TABLE_NAME = ?
                         AND COLUMN_NAME = ?;`,
                [tableName, 'id_new']
              );
              const autoinc = res[0].Ident;
              expect(autoinc).to.equal(1);
            } else if (isMysql(knex)) {
              const res = await knex.raw(`show fields from ${tableName}`);
              const autoinc = res[0][0].Extra;
              expect(autoinc).to.equal('auto_increment');
            } else if (isPostgreSQL(knex)) {
              const res = await knex.raw(
                `select pg_get_serial_sequence(table_name, column_name) as ident
                       from INFORMATION_SCHEMA.COLUMNS
                       where table_name = ?
                         AND column_name = ?;`,
                [tableName, 'id_new']
              );

              const autoinc = !!res.rows[0].ident;
              expect(autoinc).to.equal(true);
            } else if (isBetterSQLite3(knex)) {
              const res = await knex.raw(
                `SELECT 'is-autoincrement' as ident
                       FROM sqlite_master
                       WHERE tbl_name = ? AND sql LIKE '%AUTOINCREMENT%'`,
                [tableName]
              );
              const autoinc = !!res[0].ident;
              expect(autoinc).to.equal(true);
            } else if (isSQLite(knex)) {
              const res = await knex.raw(
                `SELECT "is-autoincrement" as ident
                       FROM sqlite_master
                       WHERE tbl_name = ? AND sql LIKE "%AUTOINCREMENT%"`,
                [tableName]
              );
              const autoinc = !!res[0].ident;
              expect(autoinc).to.equal(true);
            }
          });
        });
      });

      describe('dropColumn', () => {
        if (isSQLite(knex)) {
          describe('using wrapIdentifier and postProcessResponse', () => {
            const tableName = 'processor_drop_column_test';

            beforeEach(() => {
              knex.client.config.postProcessResponse = postProcessResponse;
              knex.client.config.wrapIdentifier = wrapIdentifier;

              return knex.schema
                .createTable(tableName, (tbl) => {
                  tbl.integer('other_field');
                  tbl.integer('field_foo');
                })
                .then(() => {
                  // Data is necessary to "force" the sqlite3 dialect to actually
                  // attempt to copy data to the temp table, triggering errors
                  // if columns were not correctly copied/created/dropped.
                  return knex
                    .insert({
                      field_foo: 1,
                      other_field: 1,
                    })
                    .into(tableName);
                });
            });

            afterEach(() => {
              knex.client.config.postProcessResponse = null;
              knex.client.config.wrapIdentifier = null;

              return knex.schema.dropTable(tableName);
            });

            for (const columnName of ['field_foo', 'FIELD_FOO']) {
              it(`drops the column when spelled '${columnName}'`, () =>
                knex.schema
                  .table(tableName, (tbl) => tbl.dropColumn(columnName))
                  .then(() => knex.schema.hasColumn(tableName, 'field_foo'))
                  .then((exists) => {
                    expect(exists).to.equal(false);
                  }));
            }
          });

          context('when table is created using raw create table', () => {
            beforeEach(async () => {
              await knex.schema.raw(`create table bar
                                         (
                                           \`i3\` integer primary key
                                         )`);
              await knex.schema.raw(`create table TEST
                                         (
                                           "i0"   integer, 'i1'
                                           integer, [
                                           i2]
                                           integer,
                                           \`i3\` integer,
                                           i4     integer,
                                           I5     integer,
                                           unique (i4, i5),
                                           constraint i0 primary key ([i3], "i4"),
                                           unique ([i2]),
                                           foreign key (i1) references bar ("i3")
                                         )`);
            });

            afterEach(() => knex.schema.dropTable('TEST'));

            const getCreateTableExpr = async () =>
              (
                await knex.schema.raw(
                  'select name, sql from sqlite_master where type = "table" and name = "TEST"'
                )
              )[0].sql;

            const dropCol = (colName) =>
              knex.schema.alterTable('TEST', (tbl) => tbl.dropColumn(colName));

            const hasCol = (colName) => knex.schema.hasColumn('TEST', colName);

            it('drops the column', async () => {
              await dropCol('i0');
              expect(await hasCol('i0')).to.equal(false);
              // Constraint i0 should be unaffected:
              expect(await getCreateTableExpr()).to.equal(
                'CREATE TABLE "TEST" (`i1` integer, `i2` integer, `i3` integer, `i4` ' +
                  'integer, `I5` integer, UNIQUE (`i4`, `i5`), CONSTRAINT `i0` PRIMARY ' +
                  'KEY (`i3`, `i4`), UNIQUE (`i2`), FOREIGN KEY (`i1`) REFERENCES `bar` ' +
                  '(`i3`))'
              );
              await dropCol('i1');
              expect(await hasCol('i1')).to.equal(false);
              // Foreign key on i1 should also be dropped:
              expect(await getCreateTableExpr()).to.equal(
                'CREATE TABLE "TEST" (`i2` integer, `i3` integer, `i4` integer, `I5` integer, ' +
                  'UNIQUE (`i4`, `i5`), CONSTRAINT `i0` PRIMARY KEY (`i3`, `i4`), UNIQUE (`i2`))'
              );
              await dropCol('i2');
              expect(await hasCol('i2')).to.equal(false);
              expect(await getCreateTableExpr()).to.equal(
                'CREATE TABLE "TEST" (`i3` integer, `i4` integer, `I5` integer, ' +
                  'UNIQUE (`i4`, `i5`), CONSTRAINT `i0` PRIMARY KEY (`i3`, `i4`))'
              );
              await dropCol('i3');
              expect(await hasCol('i3')).to.equal(false);
              expect(await getCreateTableExpr()).to.equal(
                'CREATE TABLE "TEST" (`i4` integer, `I5` integer, UNIQUE (`i4`, `i5`))'
              );
              await dropCol('i4');
              expect(await hasCol('i4')).to.equal(false);
              expect(await getCreateTableExpr()).to.equal(
                'CREATE TABLE "TEST" (`I5` integer)'
              );
              let lastColDeletionError;
              await knex.schema
                .alterTable('TEST', (tbl) => tbl.dropColumn('i5'))
                .catch((e) => {
                  lastColDeletionError = e;
                });
              expect(lastColDeletionError.message).to.eql(
                'Unable to drop last column from table'
              );
            });
          });
        }
      });

      describe('withSchema', () => {
        describe('mssql only', () => {
          if (!isMssql(knex)) {
            return Promise.resolve(true);
          }

          const columnName = 'test';

          function checkTable(schema, tableName, expected) {
            return knex.schema
              .withSchema(schema)
              .hasTable(tableName)
              .then((exists) => expect(exists).to.equal(expected));
          }

          function createTable(schema, tableName) {
            return knex.schema
              .withSchema(schema)
              .createTable(tableName, (table) => {
                table.string(columnName);
              });
          }

          function checkColumn(schema, tableName) {
            return knex.schema
              .withSchema(schema)
              .hasColumn(tableName, columnName)
              .then((exists) => {
                return expect(exists).to.equal(true);
              });
          }

          function renameTable(schema, from, to) {
            return knex.schema.withSchema(schema).renameTable(from, to);
          }

          function createSchema(schema) {
            return knex.schema.raw('CREATE SCHEMA ' + schema);
          }

          const defaultSchemaName = 'public';
          const testSchemaName = 'test_schema';

          before(() => createSchema(testSchemaName));

          afterEach(() =>
            knex.schema.withSchema(testSchemaName).dropTableIfExists('test')
          );
          after(() => knex.schema.raw('DROP SCHEMA ' + testSchemaName));

          it('should not find non-existent tables', () =>
            checkTable(testSchemaName, 'test', false).then(() =>
              checkTable(defaultSchemaName, 'test', false)
            ));

          it('should find existent tables', () =>
            createTable(testSchemaName, 'test').then(() =>
              checkTable(testSchemaName, 'test', true)
            ));

          it('should create and drop tables', () =>
            createTable(testSchemaName, 'test')
              .then(() => checkColumn(testSchemaName, 'test'))
              .then(() => checkTable(testSchemaName, 'test', true))
              .then(() => checkTable(defaultSchemaName, 'test', false))
              .then(() =>
                knex.schema.withSchema(testSchemaName).dropTableIfExists('test')
              )
              .then(() => checkTable(testSchemaName, 'test', false)));

          it('should rename tables', () =>
            createTable(testSchemaName, 'test')
              .then(() => renameTable(testSchemaName, 'test', 'test2'))
              .then(() => checkColumn(testSchemaName, 'test2'))
              .then(() => checkTable(defaultSchemaName, 'test2', false))
              .then(() => checkTable(testSchemaName, 'test', false))
              .then(() => checkTable(testSchemaName, 'test2', true))
              .then(() =>
                knex.schema
                  .withSchema(testSchemaName)
                  .dropTableIfExists('test2')
              ));

          describe('case-sensitive collation support', () => {
            let k;
            const databaseName = 'knex_test_CS_AS_SC';
            const collation = 'Latin1_General_100_CS_AS_SC';
            const tableName = 'Test';
            before(async () => {
              await knex.schema.raw(
                `IF EXISTS(SELECT name FROM sys.databases WHERE name = :databaseName) DROP DATABASE :databaseName:; CREATE DATABASE :databaseName: COLLATE ${collation}`,
                { databaseName }
              );

              const Knex = require('../../../knex');
              const config = require('../../knexfile');
              k = Knex({
                client: 'mssql',
                connection: {
                  ...config.mssql.connection,
                  database: databaseName,
                },
              });

              // Verify configuration is using the correct database.
              const [{ name }] = await k.raw('SELECT DB_NAME() AS name');
              expect(name).to.equal(databaseName);

              await k.schema.createTable(tableName, function () {
                this.increments();
              });
            });
            after(async () => {
              await k.schema.dropTable(tableName);
              await k.destroy();
              await knex.schema.raw(
                `IF EXISTS(SELECT name FROM sys.databases WHERE name = :databaseName) DROP DATABASE :databaseName:`,
                { databaseName }
              );
            });
            it('should get columnInfo from a case-sensitive database', async () => {
              const info = await k(tableName).columnInfo();
              expect(info).not.to.equal(undefined);
            });
          });
        });
      });

      it('should warn attempting to create primary from nonexistent columns', function () {
        // Redshift only
        if (!isRedshift(knex)) {
          return this.skip();
        }
        const tableName = 'no_test_column';
        const constraintName = 'testconstraintname';
        return knex.transaction((tr) =>
          tr.schema
            .dropTableIfExists(tableName)
            .then(() =>
              tr.schema.createTable(tableName, (t) => {
                t.string('test_zero').notNullable();
                t.string('test_one').notNullable();
              })
            )
            .then(() =>
              tr.schema.table(tableName, (u) => {
                u.primary(['test_one', 'test_two'], constraintName);
              })
            )
            .then(() => {
              throw new Error('should have failed');
            })
            .catch((err) => {
              expect(err.code).to.equal('42703');
              expect(err.message).to.equal(
                `alter table "${tableName}"
                      add constraint "${constraintName}" primary key ("test_one", "test_two") - column "test_two" named in key does not exist`
              );
            })
            .then((res) => knex.schema.dropTableIfExists(tableName))
        );
      });

      //Unit tests checks SQL -- This will test running those queries, no hard assertions here.
      it('#1430 - .primary() & .dropPrimary() same for all dialects', async function () {
        if (isSQLite(knex)) {
          return this.skip();
        }
        const constraintName = 'testconstraintname';
        const tableName = 'primarytest';
        await knex.schema.dropTableIfExists(tableName);
        await knex.transaction(async (tr) => {
          await tr.schema.createTable(tableName, (table) => {
            table.string('test').primary(constraintName).notNull();
            table.string('test2').notNullable();
          });
          await tr.schema.table(tableName, (table) => {
            table.dropPrimary(constraintName);
          });
          await tr.schema.table(tableName, (table) => {
            table.primary(['test', 'test2'], constraintName);
          });
        });
      });

      describe('invalid field', () => {
        describe('sqlite3 only', () => {
          const tableName = 'invalid_field_test_sqlite3';
          const fieldName = 'field_foo';

          before(() =>
            knex.schema.createTable(tableName, (tbl) => {
              tbl.integer(fieldName);
            })
          );

          after(() => knex.schema.dropTable(tableName));

          it('should return empty resultset when referencing an existent column', function () {
            if (!isSQLite(knex)) {
              return this.skip();
            }

            return knex(tableName)
              .select()
              .where(fieldName, 'something')
              .then((rows) => {
                expect(rows.length).to.equal(0);
              });
          });

          it('should throw when referencing a non-existent column', function () {
            if (!isSQLite(knex)) {
              return this.skip();
            }

            return knex(tableName)
              .select()
              .where(fieldName + 'foo', 'something')
              .then(() => {
                throw new Error('should have failed');
              })
              .catch((err) => {
                expect(err.code).to.equal('SQLITE_ERROR');
              });
          });
        });
      });

      describe('sqlite ddl', () => {
        before(async () => {
          if (!isSQLite(knex)) {
            return;
          }

          await knex.schema.createTable('CREATE TABLE', (table) => {
            table.primary();
            table.integer('alter_column');
          });

          await knex('CREATE TABLE').insert({ alter_column: 1 });
        });

        after(async () => {
          if (!isSQLite(knex)) {
            return;
          }

          await knex.schema.dropTable('CREATE TABLE');
        });

        it('properly executes any ddl command when the table name is a substring of "CREATE TABLE"', async () => {
          if (!isSQLite(knex)) {
            return;
          }

          await expect(
            knex.schema.alterTable('CREATE TABLE', (table) => {
              table.string('alter_column').alter();
            })
          ).to.not.be.eventually.rejected;
        });
      });

      it('supports named primary keys', async () => {
        const constraintName = 'pk-test';
        const tableName = 'namedpk';
        const expectedRes = [
          {
            type: 'table',
            name: tableName,
            tbl_name: tableName,
            sql:
              'CREATE TABLE `' +
              tableName +
              '` (`test` varchar(255) not null, `test2` varchar(255) not null, constraint `' +
              constraintName +
              '` primary key (`test`))',
          },
        ];

        await knex.transaction((tr) =>
          tr.schema
            .dropTableIfExists(tableName)
            .then(() =>
              tr.schema.createTable(tableName, (table) => {
                table.string('test').primary(constraintName).notNull();
                table.string('test2').notNull();
              })
            )
            .then(() => {
              if (/sqlite/i.test(knex.client.dialect)) {
                //For SQLite inspect metadata to make sure the constraint exists
                return tr
                  .select('type', 'name', 'tbl_name', 'sql')
                  .from('sqlite_master')
                  .where({
                    type: 'table',
                    name: tableName,
                  })
                  .then((value) => {
                    expect(value).to.deep.have.same.members(
                      expectedRes,
                      'Constraint "' +
                        constraintName +
                        '" not correctly created.'
                    );
                    return Promise.resolve();
                  });
              } else {
                return tr.schema.table(tableName, (table) => {
                  // CockroachDB requires primary column to exist
                  if (!isCockroachDB(knex)) {
                    // For everything else just drop the constraint by name to check existence
                    table.dropPrimary(constraintName);
                  }
                });
              }
            })
            .then(() => tr.schema.dropTableIfExists(tableName))
            .then(() =>
              tr.schema.createTable(tableName, (table) => {
                table.string('test').notNull();
                table.string('test2').notNull();
                table.primary('test', constraintName);
              })
            )
            .then(() => {
              if (/sqlite/i.test(knex.client.dialect)) {
                //For SQLite inspect metadata to make sure the constraint exists
                return tr
                  .select('type', 'name', 'tbl_name', 'sql')
                  .from('sqlite_master')
                  .where({
                    type: 'table',
                    name: tableName,
                  })
                  .then((value) => {
                    expect(value).to.deep.have.same.members(
                      expectedRes,
                      'Constraint "' +
                        constraintName +
                        '" not correctly created.'
                    );
                    return Promise.resolve();
                  });
              } else {
                return tr.schema.table(tableName, (table) => {
                  // CockroachDB requires primary column to exist
                  if (!isCockroachDB(knex)) {
                    // For everything else just drop the constraint by name to check existence
                    table.dropPrimary(constraintName);
                  }
                });
              }
            })
            .then(() => tr.schema.dropTableIfExists(tableName))
            .then(() =>
              tr.schema.createTable(tableName, (table) => {
                table.string('test').notNull();
                table.string('test2').notNull();
                table.primary(['test', 'test2'], constraintName);
              })
            )
            .then(() => {
              if (isSQLite(knex)) {
                //For SQLite inspect metadata to make sure the constraint exists
                const expectedRes = [
                  {
                    type: 'table',
                    name: tableName,
                    tbl_name: tableName,
                    sql:
                      'CREATE TABLE `' +
                      tableName +
                      '` (`test` varchar(255) not null, `test2` varchar(255) not null, constraint `' +
                      constraintName +
                      '` primary key (`test`, `test2`))',
                  },
                ];
                return tr
                  .select('type', 'name', 'tbl_name', 'sql')
                  .from('sqlite_master')
                  .where({
                    type: 'table',
                    name: tableName,
                  })
                  .then((value) => {
                    expect(value).to.deep.have.same.members(
                      expectedRes,
                      'Constraint "' +
                        constraintName +
                        '" not correctly created.'
                    );
                    return Promise.resolve();
                  });
              } else {
                return tr.schema.table(tableName, (table) => {
                  // CockroachDB requires primary column to exist
                  if (!isCockroachDB(knex)) {
                    // For everything else just drop the constraint by name to check existence
                    table.dropPrimary(constraintName);
                  }
                });
              }
            })
            .then(() => tr.schema.dropTableIfExists(tableName))
        );
      });

      it('supports named unique keys', () => {
        const singleUniqueName = 'uk-single';
        const multiUniqueName = 'uk-multi';
        const tableName = 'nameduk';
        return knex.transaction((tr) =>
          tr.schema
            .dropTableIfExists(tableName)
            .then(() =>
              tr.schema.createTable(tableName, (table) => {
                table.string('test').unique(singleUniqueName);
              })
            )
            .then(() => {
              if (/sqlite/i.test(knex.client.dialect)) {
                //For SQLite inspect metadata to make sure the constraint exists
                const expectedRes = [
                  {
                    type: 'index',
                    name: singleUniqueName,
                    tbl_name: tableName,
                    sql:
                      'CREATE UNIQUE INDEX `' +
                      singleUniqueName +
                      '` on `' +
                      tableName +
                      '` (`test`)',
                  },
                ];
                return tr
                  .select('type', 'name', 'tbl_name', 'sql')
                  .from('sqlite_master')
                  .where({
                    type: 'index',
                    tbl_name: tableName,
                    name: singleUniqueName,
                  })
                  .then((value) => {
                    expect(value).to.deep.have.same.members(
                      expectedRes,
                      'Constraint "' +
                        singleUniqueName +
                        '" not correctly created.'
                    );
                    return Promise.resolve();
                  });
              } else {
                return tr.schema.table(tableName, (table) => {
                  // For everything else just drop the constraint by name to check existence
                  table.dropUnique('test', singleUniqueName);
                });
              }
            })
            .then(() => tr.schema.dropTableIfExists(tableName))
            .then(() =>
              tr.schema.createTable(tableName, (table) => {
                table.string('test');
                table.string('test2');
              })
            )
            .then(() =>
              tr.schema.table(tableName, (table) => {
                table.unique('test', singleUniqueName);
                table.unique(['test', 'test2'], multiUniqueName);
              })
            )
            .then(() => {
              if (/sqlite/i.test(knex.client.dialect)) {
                //For SQLite inspect metadata to make sure the constraint exists
                const expectedRes = [
                  {
                    type: 'index',
                    name: singleUniqueName,
                    tbl_name: tableName,
                    sql:
                      'CREATE UNIQUE INDEX `' +
                      singleUniqueName +
                      '` on `' +
                      tableName +
                      '` (`test`)',
                  },
                  {
                    type: 'index',
                    name: multiUniqueName,
                    tbl_name: tableName,
                    sql:
                      'CREATE UNIQUE INDEX `' +
                      multiUniqueName +
                      '` on `' +
                      tableName +
                      '` (`test`, `test2`)',
                  },
                ];
                return tr
                  .select('type', 'name', 'tbl_name', 'sql')
                  .from('sqlite_master')
                  .where({
                    type: 'index',
                    tbl_name: tableName,
                  })
                  .then((value) => {
                    expect(value).to.deep.have.same.members(
                      expectedRes,
                      'Either "' +
                        singleUniqueName +
                        '" or "' +
                        multiUniqueName +
                        '" is missing.'
                    );
                    return Promise.resolve();
                  });
              } else {
                return tr.schema.table(tableName, (table) => {
                  // For everything else just drop the constraint by name to check existence
                  table.dropUnique('test', singleUniqueName);
                  table.dropUnique(['test', 'test2'], multiUniqueName);
                });
              }
            })
            .then(() => tr.schema.dropTableIfExists(tableName))
        );
      });

      it('supports named foreign keys', async () => {
        const userTableName = 'nfk_user';
        const groupTableName = 'nfk_group';
        const joinTableName = 'nfk_user_group';
        const userConstraint = ['fk', joinTableName, userTableName].join('-');
        const groupConstraint = ['fk', joinTableName, groupTableName].join('-');
        await knex.transaction((tr) =>
          tr.schema
            .dropTableIfExists(joinTableName)
            .then(() => tr.schema.dropTableIfExists(userTableName))
            .then(() => tr.schema.dropTableIfExists(groupTableName))
            .then(() =>
              tr.schema.createTable(userTableName, (table) => {
                table.uuid('id').primary().notNull();
                table.string('name').unique();
              })
            )
            .then(() =>
              tr.schema.createTable(groupTableName, (table) => {
                table.uuid('id').primary().notNull();
                table.string('name').unique();
              })
            )
            .then(() =>
              tr.schema.createTable(joinTableName, (table) => {
                table
                  .uuid('user')
                  .notNull()
                  .references('id')
                  .inTable(userTableName)
                  .withKeyName(['fk', joinTableName, userTableName].join('-'));
                table.uuid('group').notNull();
                table.primary(['user', 'group']);
                table
                  .foreign(
                    'group',
                    ['fk', joinTableName, groupTableName].join('-')
                  )
                  .references('id')
                  .inTable(groupTableName);
              })
            )
            .then(() => {
              if (/sqlite/i.test(knex.client.dialect)) {
                const expectedRes = [
                  {
                    type: 'table',
                    name: joinTableName,
                    tbl_name: joinTableName,
                    sql:
                      'CREATE TABLE `' +
                      joinTableName +
                      '` (`user` char(36) not null, `group` char(36) not null, constraint `' +
                      userConstraint +
                      '` foreign key(`user`) references `' +
                      userTableName +
                      '`(`id`), constraint `' +
                      groupConstraint +
                      '` foreign key(`group`) references `' +
                      groupTableName +
                      '`(`id`), primary key (`user`, `group`))',
                  },
                ];
                return tr
                  .select('type', 'name', 'tbl_name', 'sql')
                  .from('sqlite_master')
                  .where({
                    type: 'table',
                    name: joinTableName,
                  })
                  .then((value) => {
                    expect(value).to.deep.have.same.members(
                      expectedRes,
                      'Named foreign key not correctly created.'
                    );
                    return Promise.resolve();
                  });
              } else {
                return tr.schema.table(joinTableName, (table) => {
                  table.dropForeign('user', userConstraint);
                  table.dropForeign('group', groupConstraint);
                });
              }
            })
            .then(() =>
              tr.schema
                .dropTableIfExists(userTableName)
                .then(() => tr.schema.dropTableIfExists(groupTableName))
                .then(() => tr.schema.dropTableIfExists(joinTableName))
            )
        );
      });
    });
  });
});
