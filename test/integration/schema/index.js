var Promise = testPromise;

module.exports = function(knex) {

  describe('Schema', function() {

    describe('dropTable', function() {

      it('has a dropTableIfExists method', function() {
        return Promise.all([
          knex.schema.dropTableIfExists('test_foreign_table_two').testSql(function(tester) {
            tester(['sqlite3', 'postgresql'], ['drop table if exists "test_foreign_table_two"']);
            tester('mysql', ['drop table if exists `test_foreign_table_two`']);
          }),
          knex.schema.dropTableIfExists('test_table_one')
            .dropTableIfExists('catch_test')
            .dropTableIfExists('test_table_two')
            .dropTableIfExists('test_table_three')
            .dropTableIfExists('datatype_test')
            .dropTableIfExists('composite_key_test')
            .dropTableIfExists('charset_collate_test')
            .dropTableIfExists('accounts')
            .dropTableIfExists('migration_test_1')
            .dropTableIfExists('migration_test_2')
            .dropTableIfExists('migration_test_2_1')
            .dropTableIfExists('test_default_table')
            .dropTableIfExists('knex_migrations')
        ]);
      });

    });

    describe('createTable', function() {

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
            table.text('about').comment('A comment.');
            table.timestamps();
          }).testSql(function(tester) {
            tester('mysql', ['create table `test_table_one` (`id` bigint unsigned not null auto_increment primary key, `first_name` varchar(255), `last_name` varchar(255), `email` varchar(255) null, `logins` int default \'1\', `about` text comment \'A comment.\', `created_at` datetime, `updated_at` datetime) default character set utf8 engine = InnoDB comment = \'A table comment.\'','alter table `test_table_one` add index test_table_one_first_name_index(`first_name`)','alter table `test_table_one` add unique test_table_one_email_unique(`email`)','alter table `test_table_one` add index test_table_one_logins_index(`logins`)']);
            tester('postgresql', ['create table "test_table_one" ("id" bigserial primary key, "first_name" varchar(255), "last_name" varchar(255), "email" varchar(255) null, "logins" integer default \'1\', "about" text, "created_at" timestamptz, "updated_at" timestamptz)','comment on table "test_table_one" is \'A table comment.\'',"comment on column \"test_table_one\".\"logins\" is NULL",'comment on column "test_table_one"."about" is \'A comment.\'','create index test_table_one_first_name_index on "test_table_one" ("first_name")','alter table "test_table_one" add constraint test_table_one_email_unique unique ("email")','create index test_table_one_logins_index on "test_table_one" ("logins")']);
            tester('sqlite3', ['create table "test_table_one" ("id" integer not null primary key autoincrement, "first_name" varchar(255), "last_name" varchar(255), "email" varchar(255) null, "logins" integer default \'1\', "about" text, "created_at" datetime, "updated_at" datetime)','create index test_table_one_first_name_index on "test_table_one" ("first_name")','create unique index test_table_one_email_unique on "test_table_one" ("email")','create index test_table_one_logins_index on "test_table_one" ("logins")']);
          });
      });

      it('is possible to set the db engine with the table.engine', function() {
        return knex.schema
          .createTable('test_table_two', function(table) {
            table.engine('InnoDB');
            table.increments();
            table.integer('account_id');
            table.text('details');
            table.tinyint('status');
          }).testSql(function(tester){
            tester('mysql', ['create table `test_table_two` (`id` int unsigned not null auto_increment primary key, `account_id` int, `details` text, `status` tinyint) default character set utf8 engine = InnoDB']);
          });
      });

      it('sets default values with defaultTo', function() {
        return knex.schema
          .createTable('test_table_three', function(table) {
            table.engine('InnoDB');
            table.integer('main').primary();
            table.text('paragraph').defaultTo('Lorem ipsum Qui quis qui in.');
          }).testSql(function(tester) {
            tester('mysql', ['create table `test_table_three` (`main` int, `paragraph` text) default character set utf8 engine = InnoDB','alter table `test_table_three` add primary key test_table_three_main_primary(`main`)']);
            tester('postgresql', ['create table "test_table_three" ("main" integer, "paragraph" text default \'Lorem ipsum Qui quis qui in.\')','alter table "test_table_three" add primary key ("main")']);
            tester('sqlite3', ['create table "test_table_three" ("main" integer, "paragraph" text default \'Lorem ipsum Qui quis qui in.\', primary key ("main"))']);
          });
      });

      it('supports the enum and uuid columns', function() {
        return knex.schema
          .createTable('datatype_test', function(table) {
            table.enum('enum_value', ['a', 'b', 'c']);
            table.uuid('uuid').notNull();
          }).testSql(function(tester) {
            tester('mysql', ['create table `datatype_test` (`enum_value` enum(\'a\', \'b\', \'c\'), `uuid` char(36) not null) default character set utf8']);
            tester('postgresql', ['create table "datatype_test" ("enum_value" text check (enum_value in (\'a\', \'b\', \'c\')), "uuid" uuid not null)']);
            tester('sqlite3', ['create table "datatype_test" ("enum_value" varchar, "uuid" char(36) not null)']);
          });
      });

      it('allows for setting foreign keys on schema creation', function() {
        return knex.schema.createTable('test_foreign_table_two', function(table) {
          table.increments();
          table.integer('fkey_two')
            .unsigned()
            .references('id')
            .inTable('test_table_two');
        }).testSql(function(tester) {
          tester('mysql', ['create table `test_foreign_table_two` (`id` int unsigned not null auto_increment primary key, `fkey_two` int unsigned) default character set utf8','alter table `test_foreign_table_two` add constraint test_foreign_table_two_fkey_two_foreign foreign key (`fkey_two`) references `test_table_two` (`id`)']);
          tester('postgresql', ['create table "test_foreign_table_two" ("id" serial primary key, "fkey_two" integer)','alter table "test_foreign_table_two" add constraint test_foreign_table_two_fkey_two_foreign foreign key ("fkey_two") references "test_table_two" ("id")']);
          tester('sqlite3', ['create table "test_foreign_table_two" ("id" integer not null primary key autoincrement, "fkey_two" integer, foreign key("fkey_two") references "test_table_two"("id"))']);
        });
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
            tester('mysql', ['create table `composite_key_test` (`column_a` int, `column_b` int, `details` text, `status` tinyint) default character set utf8','alter table `composite_key_test` add unique composite_key_test_column_a_column_b_unique(`column_a`, `column_b`)']);
            tester('postgresql', ['create table "composite_key_test" ("column_a" integer, "column_b" integer, "details" text, "status" smallint)','alter table "composite_key_test" add constraint composite_key_test_column_a_column_b_unique unique ("column_a", "column_b")']);
            tester('sqlite3', ['create table "composite_key_test" ("column_a" integer, "column_b" integer, "details" text, "status" tinyint)','create unique index composite_key_test_column_a_column_b_unique on "composite_key_test" ("column_a", "column_b")']);
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
            tester('postgresql', ['create table "charset_collate_test" ("id" serial primary key, "account_id" integer, "details" text, "status" smallint)']);
            tester('sqlite3', ['create table "charset_collate_test" ("id" integer not null primary key autoincrement, "account_id" integer, "details" text, "status" tinyint)']);
          });
      });

    });

    describe('table', function() {

      it('allows adding a field', function () {
        return knex.schema.table('test_table_two', function(t) {
          t.json('json_data').nullable();
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
          expect(exists).to.be.true;
        });
      });
    });

  });

};
