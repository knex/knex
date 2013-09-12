module.exports = {
  'has a dropTableIfExists method': {
    mysql: {
      bindings: [[],[]],
      sql: [['drop table if exists `test_foreign_table_two`'],['drop table if exists `test_table_one`']]
    },
    postgresql: {
      bindings: [[],[]],
      sql: [['drop table if exists "test_foreign_table_two"'],['drop table if exists "test_table_one"']]
    },
    sqlite3: {
      bindings: [[],[]],
      sql: [['drop table if exists "test_foreign_table_two"'],['drop table if exists "test_table_one"']]
    }
  },
  'accepts the table name, and a "container" function': {
    mysql: {
      bindings: [],
      sql: ['create table `test_table_one` (`id` bigint unsigned not null auto_increment primary key, `first_name` varchar(255), `last_name` varchar(255), `email` varchar(255), `logins` int(11) default \'1\', `about` text comment \'A comment.\', `created_at` datetime, `updated_at` datetime) default character set utf8 engine = InnoDB comment = \'A table comment.\'','alter table `test_table_one` add unique test_table_one_email_unique(`email`)','alter table `test_table_one` add index test_table_one_logins_index(`logins`)','alter table `test_table_one` add unique test_table_one_email_unique(`email`)','alter table `test_table_one` add index test_table_one_logins_index(`logins`)']
    },
    postgresql: {
      bindings: [],
      sql: ['create table "test_table_one" ("id" serial primary key not null, "first_name" varchar(255), "last_name" varchar(255), "email" varchar(255), "logins" integer default \'1\', "about" text, "created_at" timestamp, "updated_at" timestamp)','comment on table "test_table_one" is \'A table comment.\'','comment on column "test_table_one"."about" is \'A comment.\'','alter table "test_table_one" add constraint test_table_one_email_unique unique ("email")','create index test_table_one_logins_index on "test_table_one" ("logins")','comment on column "test_table_one"."about" is \'A comment.\'','alter table "test_table_one" add constraint test_table_one_email_unique unique ("email")','create index test_table_one_logins_index on "test_table_one" ("logins")']
    },
    sqlite3: {
      bindings: [],
      sql: ['create table "test_table_one" ("id" integer primary key autoincrement not null, "first_name" varchar(255), "last_name" varchar(255), "email" varchar(255), "logins" integer default \'1\', "about" text, "created_at" datetime, "updated_at" datetime)','create unique index test_table_one_email_unique on "test_table_one" ("email")','create index test_table_one_logins_index on "test_table_one" ("logins")','create unique index test_table_one_email_unique on "test_table_one" ("email")','create index test_table_one_logins_index on "test_table_one" ("logins")']
    }
  },
  'is possible to set the db engine with the table.engine': {
    mysql: {
      bindings: [],
      sql: ['create table `test_table_two` (`id` int(11) unsigned not null auto_increment primary key, `account_id` int(11), `details` text, `status` tinyint) default character set utf8 engine = InnoDB']
    },
    postgresql: {
      bindings: [],
      sql: ['create table "test_table_two" ("id" serial primary key not null, "account_id" integer, "details" text, "status" smallint)']
    },
    sqlite3: {
      bindings: [],
      sql: ['create table "test_table_two" ("id" integer primary key autoincrement not null, "account_id" integer, "details" text, "status" tinyint)']
    }
  },
  'sets default values with defaultTo': {
    mysql: {
      bindings: [],
      sql: ['create table `test_table_three` (`main` int(11), `paragraph` text) default character set utf8 engine = InnoDB','alter table `test_table_three` add primary key test_table_three_main_primary(`main`)','alter table `test_table_three` add primary key test_table_three_main_primary(`main`)']
    },
    postgresql: {
      bindings: [],
      sql: ['create table "test_table_three" ("main" integer, "paragraph" text default \'Lorem ipsum Qui quis qui in.\')','alter table "test_table_three" add primary key ("main")','alter table "test_table_three" add primary key ("main")']
    },
    sqlite3: {
      bindings: [],
      sql: ['create table "test_table_three" ("main" integer, "paragraph" text default \'Lorem ipsum Qui quis qui in.\', primary key ("main"))']
    }
  },
  'supports the enum and uuid columns': {
    mysql: {
      bindings: [],
      sql: ['create table `datatype_test` (`enum_value` enum(\'a\', \'b\', \'c\'), `uuid` char(36)) default character set utf8']
    },
    postgresql: {
      bindings: [],
      sql: ['create table "datatype_test" ("enum_value" text check("enum_value" in(\'a\', \'b\', \'c\')), "uuid" uuid)']
    },
    sqlite3: {
      bindings: [],
      sql: ['create table "datatype_test" ("enum_value" varchar, "uuid" char(36))']
    }
  },
  'allows for setting foreign keys on schema creation': {
    mysql: {
      bindings: [],
      sql: ['create table `test_foreign_table_two` (`id` int(11) unsigned not null auto_increment primary key, `fkey_two` int(11) unsigned) default character set utf8','alter table `test_foreign_table_two` add constraint test_foreign_table_two_fkey_two_foreign foreign key (`fkey_two`) references `test_table_two` (`id`)','alter table `test_foreign_table_two` add constraint test_foreign_table_two_fkey_two_foreign foreign key (`fkey_two`) references `test_table_two` (`id`)']
    },
    postgresql: {
      bindings: [],
      sql: ['create table "test_foreign_table_two" ("id" serial primary key not null, "fkey_two" integer)','alter table "test_foreign_table_two" add constraint test_foreign_table_two_fkey_two_foreign foreign key ("fkey_two") references "test_table_two" ("id")','alter table "test_foreign_table_two" add constraint test_foreign_table_two_fkey_two_foreign foreign key ("fkey_two") references "test_table_two" ("id")']
    },
    sqlite3: {
      bindings: [],
      sql: ['create table "test_foreign_table_two" ("id" integer primary key autoincrement not null, "fkey_two" integer, foreign key("fkey_two") references "test_table_two"("id"), foreign key("fkey_two") references "test_table_two"("id"))']
    }
  },
  'allows adding a field': {
    mysql: {
      bindings: [],
      sql: ['alter table `test_table_two` add `json_data` text','alter table `test_table_two` add `json_data` text']
    },
    postgresql: {
      bindings: [],
      sql: ['alter table "test_table_two" add column "json_data" json','alter table "test_table_two" add column "json_data" json']
    },
    sqlite3: {
      bindings: [],
      sql: ['alter table "test_table_two" add column "json_data" text','alter table "test_table_two" add column "json_data" text']
    }
  },
  'checks whether a table exists': {
    mysql: {
      bindings: ['db_test','db_test','test_table_two'],
      sql: ['select * from information_schema.tables where table_schema = ? and table_name = ?'],
      result: true
    },
    postgresql: {
      bindings: ['test_table_two'],
      sql: ['select * from information_schema.tables where table_name = $1'],
      result: true
    },
    sqlite3: {
      bindings: ['test_table_two'],
      sql: ['select * from sqlite_master where type = \'table\' and name = ?'],
      result: true
    }
  }
};