/*global describe, it, expect, testPromise*/

'use strict';

var Promise = testPromise;

module.exports = function(knex) {

  describe('Schema', function() {

    describe('dropTable', function() {

      it('has a dropTableIfExists method', function() {
        return Promise.all([
          knex.schema.dropTableIfExists('test_foreign_table_two').testSql(function(tester) {
            tester(['pg'], ['drop table if exists "test_foreign_table_two"']);
            tester(['sqlite3', 'mysql'], ['drop table if exists `test_foreign_table_two`']);
            tester('oracle', [
              "begin execute immediate 'drop table \"test_foreign_table_two\"'; exception when others then if sqlcode != -942 then raise; end if; end;",
              "begin execute immediate 'drop sequence \"test_foreign_table_two_seq\"'; exception when others then if sqlcode != -2289 then raise; end if; end;"
            ]);
            tester('mssql', ["if object_id('[test_foreign_table_two]', 'U') is not null DROP TABLE [test_foreign_table_two]"]);
          }),
          knex.schema.dropTableIfExists('test_table_one')
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
            .dropTableIfExists('bool_test')
            .dropTableIfExists('10_test_table')
            .dropTableIfExists('rename_column_foreign_test')
            .dropTableIfExists('rename_column_test')
            .dropTableIfExists('should_not_be_run')
            .dropTableIfExists('invalid_inTable_param_test')
        ]);
      });

    });

    describe('createTable', function() {

      it('Callback function must be supplied', function() {
        expect(function() {
          knex.schema.createTable('callback_must_be_supplied').toString()
        })
        .to.throw(TypeError);
        expect(function() {
          knex.schema.createTable('callback_must_be_supplied', function(){}).toString();
        })
        .to.not.throw(TypeError);
      });

      it('is possible to chain .catch', function() {
        return knex.schema
          .createTable('catch_test', function(t) {
            t.increments();
          }).catch(function(e) {
            throw e;
          });
      });

      it('accepts the table name, and a "container" function', function() {
        return knex.schema
          .createTable('test_table_one', function(table) {
            table.engine('InnoDB');
            table.comment('A table comment.');
            table.bigIncrements('id');
            table.string('first_name').index();
            table.string('last_name');
            table.string('email').unique().nullable();
            table.integer('logins').defaultTo(1).index().comment();
            if (knex.client.dialect === 'oracle') {
              // use string instead to force varchar2 to avoid later problems with join and union
              table.string('about', 4000).comment('A comment.');
            } else {
              table.text('about').comment('A comment.');
            }
            table.timestamps();
          }).testSql(function(tester) {
            tester('mysql', ['create table `test_table_one` (`id` bigint unsigned not null auto_increment primary key, `first_name` varchar(255), `last_name` varchar(255), `email` varchar(255) null, `logins` int default \'1\', `about` text comment \'A comment.\', `created_at` datetime, `updated_at` datetime) default character set utf8 engine = InnoDB comment = \'A table comment.\'','alter table `test_table_one` add index `test_table_one_first_name_index`(`first_name`)','alter table `test_table_one` add unique `test_table_one_email_unique`(`email`)','alter table `test_table_one` add index `test_table_one_logins_index`(`logins`)']);
            tester('pg', ['create table "test_table_one" ("id" bigserial primary key, "first_name" varchar(255), "last_name" varchar(255), "email" varchar(255) null, "logins" integer default \'1\', "about" text, "created_at" timestamptz, "updated_at" timestamptz)','comment on table "test_table_one" is \'A table comment.\'',"comment on column \"test_table_one\".\"logins\" is NULL",'comment on column "test_table_one"."about" is \'A comment.\'','create index "test_table_one_first_name_index" on "test_table_one" ("first_name")','alter table "test_table_one" add constraint "test_table_one_email_unique" unique ("email")','create index "test_table_one_logins_index" on "test_table_one" ("logins")']);
            tester('sqlite3', ['create table `test_table_one` (`id` integer not null primary key autoincrement, `first_name` varchar(255), `last_name` varchar(255), `email` varchar(255) null, `logins` integer default \'1\', `about` text, `created_at` datetime, `updated_at` datetime)','create index `test_table_one_first_name_index` on `test_table_one` (`first_name`)','create unique index `test_table_one_email_unique` on `test_table_one` (`email`)','create index `test_table_one_logins_index` on `test_table_one` (`logins`)']);
            tester('oracle', [
              'create table "test_table_one" ("id" number(20, 0) not null primary key, "first_name" varchar2(255), "last_name" varchar2(255), "email" varchar2(255) null, "logins" integer default \'1\', "about" varchar2(4000), "created_at" timestamp with time zone, "updated_at" timestamp with time zone)',
              'comment on table "test_table_one" is \'A table comment.\'',
              "begin execute immediate 'create sequence \"test_table_one_seq\"'; exception when others then if sqlcode != -955 then raise; end if; end;",
              "create or replace trigger \"test_table_one_id_trg\" before insert on \"test_table_one\" for each row when (new.\"id\" is null)  begin select \"test_table_one_seq\".nextval into :new.\"id\" from dual; end;",
              "comment on column \"test_table_one\".\"logins\" is \'\'",
              'comment on column "test_table_one"."about" is \'A comment.\'',
              'create index "NkZo/dGRI9O73/NE2fHo+35d4jk" on "test_table_one" ("first_name")',
              'alter table "test_table_one" add constraint "test_table_one_email_unique" unique ("email")',
              'create index "test_table_one_logins_index" on "test_table_one" ("logins")']);
            tester('mssql', ['CREATE TABLE [test_table_one] ([id] bigint identity(1,1) not null primary key, [first_name] nvarchar(255), [last_name] nvarchar(255), [email] nvarchar(255) null, [logins] int default \'1\', [about] nvarchar(max), [created_at] datetime, [updated_at] datetime, CONSTRAINT [test_table_one_email_unique] UNIQUE ([email]))',
              'CREATE INDEX [test_table_one_first_name_index] ON [test_table_one] ([first_name])',
              'CREATE INDEX [test_table_one_logins_index] ON [test_table_one] ([logins])']);
          });
      });

      it('is possible to set the db engine with the table.engine', function() {
        return knex.schema
          .createTable('test_table_two', function(table) {
            table.engine('InnoDB');
            table.increments();
            table.integer('account_id');
            if (knex.client.dialect === 'oracle') {
              // use string instead to force varchar2 to avoid later problems with join and union
              // e.g. where email (varchar2) = details (clob) does not work
              table.string('details', 4000);
            } else {
              table.text('details');
            }
            table.tinyint('status');
          }).testSql(function(tester){
            tester('mysql', ['create table `test_table_two` (`id` int unsigned not null auto_increment primary key, `account_id` int, `details` text, `status` tinyint) default character set utf8 engine = InnoDB']);
            tester('mssql', ['CREATE TABLE [test_table_two] ([id] int identity(1,1) not null primary key, [account_id] int, [details] nvarchar(max), [status] tinyint)']);
          });
      });

      it('sets default values with defaultTo', function() {
        return knex.schema
          .createTable('test_table_three', function(table) {
            table.engine('InnoDB');
            table.integer('main').notNullable().primary();
            table.text('paragraph').defaultTo('Lorem ipsum Qui quis qui in.');
          }).testSql(function(tester) {
            tester('mysql', ['create table `test_table_three` (`main` int not null, `paragraph` text) default character set utf8 engine = InnoDB','alter table `test_table_three` add primary key `test_table_three_pkey`(`main`)']);
            tester('pg', ['create table "test_table_three" ("main" integer not null, "paragraph" text default \'Lorem ipsum Qui quis qui in.\')','alter table "test_table_three" add constraint "test_table_three_pkey" primary key ("main")']);
            tester('sqlite3', ['create table `test_table_three` (`main` integer not null, `paragraph` text default \'Lorem ipsum Qui quis qui in.\', primary key (`main`))']);
            tester('oracle', ['create table "test_table_three" ("main" integer not null, "paragraph" clob default \'Lorem ipsum Qui quis qui in.\')','alter table "test_table_three" add constraint "test_table_three_pkey" primary key ("main")']);
            tester('mssql', ['CREATE TABLE [test_table_three] ([main] int not null, [paragraph] nvarchar(max), CONSTRAINT [test_table_three_pkey] PRIMARY KEY ([main]))']);
          });
      });

      it('supports the enum and uuid columns', function() {
        return knex.schema
          .createTable('datatype_test', function(table) {
            table.enum('enum_value', ['a', 'b', 'c']);
            table.uuid('uuid').notNull();
          }).testSql(function(tester) {
            tester('mysql', ['create table `datatype_test` (`enum_value` enum(\'a\', \'b\', \'c\'), `uuid` char(36) not null) default character set utf8']);
            tester('pg', ['create table "datatype_test" ("enum_value" text check ("enum_value" in (\'a\', \'b\', \'c\')), "uuid" uuid not null)']);
            tester('sqlite3', ['create table `datatype_test` (`enum_value` text check (`enum_value` in (\'a\', \'b\', \'c\')), `uuid` char(36) not null)']);
            tester('oracle', ['create table "datatype_test" ("enum_value" varchar2(1) check ("enum_value" in (\'a\', \'b\', \'c\')), "uuid" char(36) not null)']);
            tester('mssql', ['CREATE TABLE [datatype_test] ([enum_value] nvarchar(100), [uuid] uniqueidentifier not null)']);
          });
      });

      it('allows for setting foreign keys on schema creation', function() {
        return knex.schema.createTable('test_foreign_table_two', function(table) {
          table.increments();
          table.integer('fkey_two')
            .unsigned()
            .references('id')
            .inTable('test_table_two');
          table.integer('fkey_three')
            .unsigned()
            .references('id')
            .inTable('test_table_two')
            .withKeyName('fk_fkey_three');
          table.integer('fkey_four')
            .unsigned()
          table.foreign('fkey_four', 'fk_fkey_four').references('test_table_two.id')
        }).testSql(function(tester) {
          tester('mysql', [
            'create table `test_foreign_table_two` (`id` int unsigned not null auto_increment primary key, `fkey_two` int unsigned, `fkey_three` int unsigned, `fkey_four` int unsigned) default character set utf8',
            'alter table `test_foreign_table_two` add constraint `test_foreign_table_two_fkey_two_foreign` foreign key (`fkey_two`) references `test_table_two` (`id`)',
            'alter table `test_foreign_table_two` add constraint `fk_fkey_three` foreign key (`fkey_three`) references `test_table_two` (`id`)',
            'alter table `test_foreign_table_two` add constraint `fk_fkey_four` foreign key (`fkey_four`) references `test_table_two` (`id`)'
          ]);
          tester('pg', [
            'create table "test_foreign_table_two" ("id" serial primary key, "fkey_two" integer, "fkey_three" integer, "fkey_four" integer)',
            'alter table "test_foreign_table_two" add constraint "test_foreign_table_two_fkey_two_foreign" foreign key ("fkey_two") references "test_table_two" ("id")',
            'alter table "test_foreign_table_two" add constraint "fk_fkey_three" foreign key ("fkey_three") references "test_table_two" ("id")',
            'alter table "test_foreign_table_two" add constraint "fk_fkey_four" foreign key ("fkey_four") references "test_table_two" ("id")'
          ]);
          tester('sqlite3', [
            'create table `test_foreign_table_two` (`id` integer not null primary key autoincrement, `fkey_two` integer, `fkey_three` integer, `fkey_four` integer, ' +
            'foreign key(`fkey_two`) references `test_table_two`(`id`), ' +
            'foreign key(`fkey_three`) references `test_table_two`(`id`), ' +
            'foreign key(`fkey_four`) references `test_table_two`(`id`))'
          ]);
          tester('oracle', [
            'create table "test_foreign_table_two" ("id" integer not null primary key, "fkey_two" integer, "fkey_three" integer, "fkey_four" integer)',
            "begin execute immediate 'create sequence \"test_foreign_table_two_seq\"'; exception when others then if sqlcode != -955 then raise; end if; end;",
            "create or replace trigger \"test_foreign_table_two_id_trg\" before insert on \"test_foreign_table_two\" for each row when (new.\"id\" is null)  begin select \"test_foreign_table_two_seq\".nextval into :new.\"id\" from dual; end;",
            'alter table "test_foreign_table_two" add constraint "q7TfvbIx3HUQbh+l+e5N+J+Guag" foreign key ("fkey_two") references "test_table_two" ("id")',
            'alter table "test_foreign_table_two" add constraint "fk_fkey_three" foreign key ("fkey_three") references "test_table_two" ("id")',
            'alter table "test_foreign_table_two" add constraint "fk_fkey_four" foreign key ("fkey_four") references "test_table_two" ("id")'
          ]);
          tester('mssql', [
            'CREATE TABLE [test_foreign_table_two] ([id] int identity(1,1) not null primary key, [fkey_two] int, [fkey_three] int, [fkey_four] int, ' +
            'CONSTRAINT [test_foreign_table_two_fkey_two_foreign] FOREIGN KEY ([fkey_two]) REFERENCES [test_table_two] ([id]), ' +
            'CONSTRAINT [fk_fkey_three] FOREIGN KEY ([fkey_three]) REFERENCES [test_table_two] ([id]), ' +
            'CONSTRAINT [fk_fkey_four] FOREIGN KEY ([fkey_four]) REFERENCES [test_table_two] ([id]))'
          ]);
        });
      });

      it('rejects setting foreign key where tableName is not typeof === string', function() {
        return knex.schema.createTable('invalid_inTable_param_test', function(table) {
          var createInvalidUndefinedInTableSchema = function() {
            table.increments('id').references('id').inTable()
          };
          var createInvalidObjectInTableSchema = function () {
            table.integer('another_id').references('id').inTable({tableName: 'this_should_fail'})
          };
          expect(createInvalidUndefinedInTableSchema).to.throw(TypeError);
          expect(createInvalidObjectInTableSchema).to.throw(TypeError);
        })
      });


      it('allows for composite keys', function() {
        return knex.schema
          .createTable('composite_key_test', function(table) {
            table.integer('column_a');
            table.integer('column_b');
            table.text('details');
            table.tinyint('status');
            table.unique(['column_a', 'column_b']);
          }).testSql(function(tester) {
            tester('mysql', ['create table `composite_key_test` (`column_a` int, `column_b` int, `details` text, `status` tinyint) default character set utf8','alter table `composite_key_test` add unique `composite_key_test_column_a_column_b_unique`(`column_a`, `column_b`)']);
            tester('pg', ['create table "composite_key_test" ("column_a" integer, "column_b" integer, "details" text, "status" smallint)','alter table "composite_key_test" add constraint "composite_key_test_column_a_column_b_unique" unique ("column_a", "column_b")']);
            tester('sqlite3', ['create table `composite_key_test` (`column_a` integer, `column_b` integer, `details` text, `status` tinyint)','create unique index `composite_key_test_column_a_column_b_unique` on `composite_key_test` (`column_a`, `column_b`)']);
            tester('oracle', ['create table "composite_key_test" ("column_a" integer, "column_b" integer, "details" clob, "status" smallint)','alter table "composite_key_test" add constraint "zYmMt0VQwlLZ20XnrMicXZ0ufZk" unique ("column_a", "column_b")']);
            tester('mssql', ['CREATE TABLE [composite_key_test] ([column_a] int, [column_b] int, [details] nvarchar(max), [status] tinyint, CONSTRAINT [composite_key_test_column_a_column_b_unique] UNIQUE ([column_a], [column_b]))']);
          }).then(function() {
            return knex('composite_key_test').insert([{
              column_a: 1,
              column_b: 1,
              details: 'One, One, One',
              status: 1
            }, {
              column_a: 1,
              column_b: 2,
              details: 'One, Two, Zero',
              status: 0
            }, {
              column_a: 1,
              column_b: 3,
              details: 'One, Three, Zero',
              status: 0
            }]);
          });
      });

      it('is possible to set the table collation with table.charset and table.collate', function() {
        return knex.schema
          .createTable('charset_collate_test', function(table) {
            table.charset('latin1');
            table.collate('latin1_general_ci');
            table.engine('InnoDB');
            table.increments();
            table.integer('account_id');
            table.text('details');
            table.tinyint('status');
          }).testSql(function(tester) {
            tester('mysql', ['create table `charset_collate_test` (`id` int unsigned not null auto_increment primary key, `account_id` int, `details` text, `status` tinyint) default character set latin1 collate latin1_general_ci engine = InnoDB']);
            tester('pg', ['create table "charset_collate_test" ("id" serial primary key, "account_id" integer, "details" text, "status" smallint)']);
            tester('sqlite3', ['create table `charset_collate_test` (`id` integer not null primary key autoincrement, `account_id` integer, `details` text, `status` tinyint)']);
            tester('oracle', [
              "create table \"charset_collate_test\" (\"id\" integer not null primary key, \"account_id\" integer, \"details\" clob, \"status\" smallint)",
              "begin execute immediate 'create sequence \"charset_collate_test_seq\"'; exception when others then if sqlcode != -955 then raise; end if; end;",
              "create or replace trigger \"charset_collate_test_id_trg\" before insert on \"charset_collate_test\" for each row when (new.\"id\" is null)  begin select \"charset_collate_test_seq\".nextval into :new.\"id\" from dual; end;"
            ]);
            tester('mssql', ['CREATE TABLE [charset_collate_test] ([id] int identity(1,1) not null primary key, [account_id] int, [details] nvarchar(max), [status] tinyint)']);
          });
      });

      it('sets booleans & defaults correctly', function() {
          return knex.schema
            .createTable('bool_test', function(table) {
              table.bool('one');
              table.bool('two').defaultTo(false);
              table.bool('three').defaultTo(true);
              table.bool('four').defaultTo('true');
              table.bool('five').defaultTo('false');
            }).testSql(function(tester) {
              tester('mysql', ['create table `bool_test` (`one` boolean, `two` boolean default \'0\', `three` boolean default \'1\', `four` boolean default \'1\', `five` boolean default \'0\') default character set utf8']);
              tester('pg', ['create table "bool_test" ("one" boolean, "two" boolean default \'0\', "three" boolean default \'1\', "four" boolean default \'1\', "five" boolean default \'0\')']);
              tester('sqlite3', ['create table `bool_test` (`one` boolean, `two` boolean default \'0\', `three` boolean default \'1\', `four` boolean default \'1\', `five` boolean default \'0\')']);
              tester('oracle', ['create table "bool_test" ("one" number(1, 0) check ("one" in (\'0\', \'1\')), "two" number(1, 0) default \'0\' check ("two" in (\'0\', \'1\')), "three" number(1, 0) default \'1\' check ("three" in (\'0\', \'1\')), "four" number(1, 0) default \'1\' check ("four" in (\'0\', \'1\')), "five" number(1, 0) default \'0\' check ("five" in (\'0\', \'1\')))']);
              tester('mssql', ['CREATE TABLE [bool_test] ([one] bit, [two] bit default \'0\', [three] bit default \'1\', [four] bit default \'1\', [five] bit default \'0\')']);
            }).then(function() {
              return knex.insert({one: false}).into('bool_test');
            });
      });

      it('accepts table names starting with numeric values', function() {
        return knex.schema
          .createTable('10_test_table', function(table) {
            table.bigIncrements('id');
            table.string('first_name').index();
            table.string('last_name');
            table.string('email').unique().nullable();
            table.integer('logins').defaultTo(1).index().comment();
          }).testSql(function(tester) {
            tester('mysql', [
              'create table `10_test_table` (`id` bigint unsigned not null auto_increment primary key, `first_name` varchar(255), `last_name` varchar(255), `email` varchar(255) null, `logins` int default \'1\') default character set utf8',
              'alter table `10_test_table` add index `10_test_table_first_name_index`(`first_name`)',
              'alter table `10_test_table` add unique `10_test_table_email_unique`(`email`)',
              'alter table `10_test_table` add index `10_test_table_logins_index`(`logins`)'
            ]);
            tester('pg', [
              'create table "10_test_table" ("id" bigserial primary key, "first_name" varchar(255), "last_name" varchar(255), "email" varchar(255) null, "logins" integer default \'1\')',
              'comment on column \"10_test_table\".\"logins\" is NULL',
              'create index "10_test_table_first_name_index" on "10_test_table" ("first_name")',
              'alter table "10_test_table" add constraint "10_test_table_email_unique" unique ("email")',
              'create index "10_test_table_logins_index" on "10_test_table" ("logins")'
            ]);
            tester('sqlite3', [
              'create table `10_test_table` (`id` integer not null primary key autoincrement, `first_name` varchar(255), `last_name` varchar(255), `email` varchar(255) null, `logins` integer default \'1\')',
              'create index `10_test_table_first_name_index` on `10_test_table` (`first_name`)',
              'create unique index `10_test_table_email_unique` on `10_test_table` (`email`)',
              'create index `10_test_table_logins_index` on `10_test_table` (`logins`)'
            ]);
            tester('oracle', [
              'create table "10_test_table" ("id" number(20, 0) not null primary key, "first_name" varchar2(255), "last_name" varchar2(255), "email" varchar2(255) null, "logins" integer default \'1\')',
              "begin execute immediate 'create sequence \"10_test_table_seq\"'; exception when others then if sqlcode != -955 then raise; end if; end;",
              "create or replace trigger \"10_test_table_id_trg\" before insert on \"10_test_table\" for each row when (new.\"id\" is null)  begin select \"10_test_table_seq\".nextval into :new.\"id\" from dual; end;",
              "comment on column \"10_test_table\".\"logins\" is \'\'",
              'create index "NkZo/dGRI9O73/NE2fHo+35d4jk" on "10_test_table" ("first_name")',
              'alter table "10_test_table" add constraint "10_test_table_email_unique" unique ("email")',
              'create index "10_test_table_logins_index" on "10_test_table" ("logins")'
            ]);
          });
      });
    });

    describe('table', function() {

      it('Callback function must be supplied', function() {
        expect(function() {
          knex.schema.createTable('callback_must_be_supplied').toString()
        })
          .to.throw(TypeError);
        expect(function() {
          knex.schema.createTable('callback_must_be_supplied', function(){}).toString();
        })
          .to.not.throw(TypeError);
      });

      it('allows adding a field', function () {
        return knex.schema.table('test_table_two', function(t) {
          t.json('json_data', true);
        });
      });

      it('allows adding multiple columns at once', function () {
        return knex.schema.table('test_table_two', function(t) {
          t.string('one');
          t.string('two');
          t.string('three');
        }).then(function () {
          return knex.schema.table('test_table_two', function(t) {
            t.dropColumn('one');
            t.dropColumn('two');
            t.dropColumn('three');
          });
        });
      });

      it('allows alter column syntax', function () {
        if (knex.client.dialect.match('sqlite') !== null ||
            knex.client.dialect.match('oracle') !== null) {
          return;
        }

        return knex.schema.table('test_table_two', function(t) {
          t.integer('remove_not_null').notNull().defaultTo(1);
          t.string('remove_default').notNull().defaultTo(1);
          t.dateTime('datetime_to_date').notNull().defaultTo(knex.fn.now());
        }).then(function () {
          return knex.schema.table('test_table_two', function(t) {
            t.integer('remove_not_null').defaultTo(1).alter();
            t.integer('remove_default').notNull().alter();
            t.date('datetime_to_date').alter();
          });
        }).then(function () {
          return knex('test_table_two').columnInfo();
        }).then(function(info) {
          expect(info.remove_not_null.nullable).to.equal(true);
          expect(info.remove_not_null.defaultValue).to.not.equal(null);
          expect(info.remove_default.nullable).to.equal(false);
          expect(info.remove_default.defaultValue).to.equal(null);
          expect(info.remove_default.type).to.contains('int');
          return knex.schema.table('test_table_two', function (t) {
            t.dropColumn('remove_default');
            t.dropColumn('remove_not_null');
            t.dropColumn('datetime_to_date');
          });
        });
      });

      it('allows changing a field', function() {
        return knex.schema.table('test_table_one', function(t) {
          t.string('phone').nullable();
        });
      });

      it('allows dropping a unique index', function() {
        return knex.schema.table('composite_key_test', function(t) {
          t.dropUnique(['column_a', 'column_b']);
        });
      });

      it('allows dropping a index', function() {
        return knex.schema.table('test_table_one', function(t) {
          t.dropIndex('first_name');
        });
      });
    });


    describe('hasTable', function() {

      it('checks whether a table exists', function() {
        return knex.schema.hasTable('test_table_two').then(function(resp) {
          expect(resp).to.equal(true);
        });
      });

      it('should be false if a table does not exists', function() {
        return knex.schema.hasTable('this_table_is_fake').then(function(resp) {
          expect(resp).to.equal(false);
        });
      });

      it('should be false whether a parameter is not specified', function() {
        return knex.schema.hasTable('').then(function(resp) {
          expect(resp).to.equal(false);
        });
      });

    });

    describe('renameTable', function() {

      it('renames the table from one to another', function () {
        return knex.schema.renameTable('test_table_one', 'accounts');
      });

    });

    describe('dropTable', function() {
      it('should drop a table', function() {
        return knex.schema.dropTable('test_table_three').then(function() {

          // Drop this here so we don't have foreign key constraints...
          return knex.schema.dropTable('test_foreign_table_two');
        });
      });
    });

    describe('hasColumn', function() {
      it('checks whether a column exists, resolving with a boolean', function() {
        return knex.schema.hasColumn('accounts', 'first_name').then(function(exists) {
          expect(exists).to.equal(true);
        });
      });
    });

    describe('addColumn', function() {
      describe('mysql only', function() {
        if(!knex || !knex.client || (!(/mysql/i.test(knex.client.dialect)) && !(/maria/i.test(knex.client.dialect)))) {
          return Promise.resolve();
        }

        before(function() {
          return knex.schema.createTable('add_column_test_mysql', function (tbl) {
            tbl.integer('field_foo');
            tbl.integer('field_bar');
          }).then(function() {
            return knex.schema.alterTable('add_column_test_mysql', function (tbl) {
              tbl.integer('field_foo').comment('foo').alter();
              tbl.integer('field_bar').comment('bar').alter();
              tbl.integer('field_first').first().comment('First');
              tbl.integer('field_after_foo').after('field_foo').comment('After');
            });
          });
        });

        after(function() {
          return knex.schema.dropTable('add_column_test_mysql');
        });

        it('should columns order be correctly with after and first', function() {
          return knex.raw('SHOW CREATE TABLE `add_column_test_mysql`').then(function(schema) {
            // .columnInfo() keys does not guaranteed fields order.
            var fields = schema[0][0]['Create Table'].split('\n')
            .filter(function(e) { return e.trim().indexOf('`field_') === 0 })
            .map(function(e) { return e.trim() })
            .map(function(e) { return e.slice(1, e.slice(1).indexOf('`') + 1) });

            // Fields order
            expect(fields[0]).to.equal('field_first');
            expect(fields[1]).to.equal('field_foo');
            expect(fields[2]).to.equal('field_after_foo');
            expect(fields[3]).to.equal('field_bar');

            // .columnInfo() does not included fields comment.
            var comments = schema[0][0]['Create Table'].split('\n')
            .filter(function(e) { return e.trim().indexOf('`field_') === 0 })
            .map(function(e) { return e.slice(e.indexOf("'")).trim() })
            .map(function(e) { return e.slice(1, e.slice(1).indexOf("'") + 1) });

            // Fields comment
            expect(comments[0]).to.equal('First');
            expect(comments[1]).to.equal('foo');
            expect(comments[2]).to.equal('After');
            expect(comments[3]).to.equal('bar');
          });
        });
      });
    });

    describe('renameColumn', function () {
      before(function () {
        return knex.schema.createTable('rename_column_test', function (tbl) {
          tbl.increments('id_test').unsigned()
            .primary();
          tbl.integer('parent_id_test').unsigned()
            .references('id_test')
            .inTable('rename_column_test');
        })
        .createTable('rename_column_foreign_test', function(tbl) {
          tbl.increments('id').unsigned()
            .primary();
          tbl.integer('foreign_id_test').unsigned()
            .references('id_test')
            .inTable('rename_column_test');
        })
        .then(function () {
          // without data, the column isn't found??
          return knex.insert({parent_id_test: 1}).into('rename_column_test');
        });
      });

      after(function () {
        return knex.schema.dropTable('rename_column_foreign_test').dropTable('rename_column_test');
      });

      it('renames the column', function () {
        return knex.schema.table('rename_column_test', function (tbl) {
          return tbl.renameColumn('id_test', 'id');
        })
        .then(function () {
          return knex.schema.hasColumn('rename_column_test', 'id');
        })
        .then(function (exists) {
          expect(exists).to.equal(true);
        });
      });

      it('successfully renames a column referenced in a foreign key', function () {
        return knex.schema.table('rename_column_test', function (tbl) {
          tbl.renameColumn('parent_id_test', 'parent_id');
        });
      });

      it('successfully renames a column referenced by another table', function () {
        return knex.schema.table('rename_column_test', function (tbl) {
          tbl.renameColumn('id', 'id_new');
        });
      });

      it('#933 - .renameColumn should not drop null or default value', function() {
        return knex.transaction(function (tr) {
          var getColInfo = function() { return tr('renameColTest').columnInfo()};
          return tr.schema.dropTableIfExists('renameColTest')
            .createTable('renameColTest', function (table) {
              table.integer('colnameint').defaultTo(1);
              table.string('colnamestring').defaultTo('knex').notNullable();
            })
            .then(getColInfo)
            .then(function (colInfo) {
              expect(String(colInfo.colnameint.defaultValue)).to.contain('1');
              expect(colInfo.colnamestring.defaultValue).to.contain('knex'); //Using contain because of different response per dialect. IE mysql 'knex', postgres 'knex::character varying'
              expect(colInfo.colnamestring.nullable).to.equal(false);
              return tr.schema.table('renameColTest', function (table) {
                table.renameColumn('colnameint', 'colnameintchanged');
                table.renameColumn('colnamestring', 'colnamestringchanged');
              })
            })
            .then(getColInfo)
            .then(function (columnInfo) {
              expect(String(columnInfo.colnameintchanged.defaultValue)).to.contain('1');
              expect(columnInfo.colnamestringchanged.defaultValue).to.contain('knex');
              expect(columnInfo.colnamestringchanged.nullable).to.equal(false);
            });
        });
      });
    });


    //Unit tests checks SQL -- This will test running those queries, no hard assertions here.
    it('#1430 - .primary() & .dropPrimary() same for all dialects', function() {
      if(/sqlite/i.test(knex.client.dialect)) {
        return Promise.resolve();
      }
      var constraintName = 'testconstraintname';
      var tableName = 'primarytest';
      return knex.transaction(function(tr) {
        return tr.schema.dropTableIfExists(tableName)
        .then(function() {
            return tr.schema.createTable(tableName, function(table) {
              table.string('test').primary(constraintName);
              table.string('test2').notNullable();
            })
          })
          .then(function() {
            return tr.schema.table(tableName, function(table) {
              table.dropPrimary(constraintName);
            })
          })
          .then(function() {
            return tr.schema.table(tableName, function(table) {
              table.primary(['test', 'test2'], constraintName)
            })
          });
      });
    });


    describe('invalid field', function() {
      describe('sqlite3 only', function() {
        var tableName = 'invalid_field_test_sqlite3';
        var fieldName = 'field_foo';
        if(!knex || !knex.client || (!(/sqlite3/i.test(knex.client.dialect)))) {
          return Promise.resolve();
        }

        before(function() {
          return knex.schema.createTable(tableName, function (tbl) {
            tbl.integer(fieldName);
          });
        });

        after(function() {
          return knex.schema.dropTable(tableName);
        });

        it('should return empty resultset when referencing an existent column', function() {

          return knex(tableName).select().where(fieldName, "something").then(function(rows){
            expect(rows.length).to.equal(0);
          })

        });

        it('should throw when referencing a non-existent column', function() {

          return knex(tableName).select().where(fieldName+"foo", "something")
            .then(function(){
               throw new Error("should have failed");
            })
            .catch(function(err){
                expect(err.code).to.equal("SQLITE_ERROR");
            })

        });


      });
    });


  });
};
