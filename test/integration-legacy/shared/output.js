module.exports = {
  string: {
    'schema.1': {
      mysql: {
        sql: ['drop table if exists `test_foreign_table_two`'],
        bindings: []
      },
      postgres: {
        sql: ['drop table if exists "test_foreign_table_two"'],
        bindings: []
      },
      sqlite3: {
        sql: ['drop table if exists "test_foreign_table_two"'],
        bindings: []
      }
    },
    'schema.2': {
      mysql: {
        sql: ['create table `test_table_one` (`id` bigint unsigned not null auto_increment primary key, `first_name` varchar(255), `last_name` varchar(255), `email` varchar(255), `logins` int(11) default \'1\', `about` text comment \'A comment.\', `created_at` datetime, `updated_at` datetime) default character set utf8 engine = InnoDB comment = \'A table comment.\'','alter table `test_table_one` add unique test_table_one_email_unique(`email`)','alter table `test_table_one` add index test_table_one_logins_index(`logins`)'],
        bindings: []
      },
      postgres: {
        sql: ['create table "test_table_one" ("id" serial primary key not null, "first_name" varchar(255), "last_name" varchar(255), "email" varchar(255), "logins" integer default \'1\', "about" text, "created_at" timestamp, "updated_at" timestamp)','comment on table "test_table_one" is \'A table comment.\'','comment on column "test_table_one"."about" is \'A comment.\'','alter table "test_table_one" add constraint test_table_one_email_unique unique ("email")','create index test_table_one_logins_index on "test_table_one" ("logins")'],
        bindings: []
      },
      sqlite3: {
        sql: ['create table "test_table_one" ("id" integer primary key autoincrement not null, "first_name" varchar(255), "last_name" varchar(255), "email" varchar(255), "logins" integer default \'1\', "about" text, "created_at" datetime, "updated_at" datetime)','create unique index test_table_one_email_unique on "test_table_one" ("email")','create index test_table_one_logins_index on "test_table_one" ("logins")'],
        bindings: []
      }
    },
    'schema.3': {
      mysql: {
        sql: ['create table `test_table_two` (`id` int(11) unsigned not null auto_increment primary key, `account_id` int(11), `details` text, `status` tinyint) default character set utf8 engine = InnoDB'],
        bindings: []
      },
      postgres: {
        sql: ['create table "test_table_two" ("id" serial primary key not null, "account_id" integer, "details" text, "status" smallint)'],
        bindings: []
      },
      sqlite3: {
        sql: ['create table "test_table_two" ("id" integer primary key autoincrement not null, "account_id" integer, "details" text, "status" tinyint)'],
        bindings: []
      }
    },
    'schema.4': {
      mysql: {
        sql: ['create table `test_table_three` (`main` int(11), `paragraph` text) default character set utf8 engine = InnoDB','alter table `test_table_three` add primary key test_table_three_main_primary(`main`)'],
        bindings: []
      },
      postgres: {
        sql: ['create table "test_table_three" ("main" integer, "paragraph" text default \'Lorem ipsum Qui quis qui in.\')','alter table "test_table_three" add primary key ("main")'],
        bindings: []
      },
      sqlite3: {
        sql: ['create table "test_table_three" ("main" integer, "paragraph" text default \'Lorem ipsum Qui quis qui in.\', primary key ("main"))'],
        bindings: []
      }
    },
    'schema.5': {
      mysql: {
        sql: ['create table `datatype_test` (`enum_value` enum(\'a\', \'b\', \'c\'), `uuid` char(36)) default character set utf8'],
        bindings: []
      },
      postgres: {
        sql: ['create table "datatype_test" ("enum_value" text check("enum_value" in(\'a\', \'b\', \'c\')), "uuid" uuid)'],
        bindings: []
      },
      sqlite3: {
        sql: ['create table "datatype_test" ("enum_value" varchar, "uuid" char(36))'],
        bindings: []
      }
    },
    'schema.6': {
      mysql: {
        sql: ['create table `test_foreign_table_two` (`id` int(11) unsigned not null auto_increment primary key, `fkey_two` int(11) unsigned) default character set utf8','alter table `test_foreign_table_two` add constraint test_foreign_table_two_fkey_two_foreign foreign key (`fkey_two`) references `test_table_two` (`id`)'],
        bindings: []
      },
      postgres: {
        sql: ['create table "test_foreign_table_two" ("id" serial primary key not null, "fkey_two" integer)','alter table "test_foreign_table_two" add constraint test_foreign_table_two_fkey_two_foreign foreign key ("fkey_two") references "test_table_two" ("id")'],
        bindings: []
      },
      sqlite3: {
        sql: ['create table "test_foreign_table_two" ("id" integer primary key autoincrement not null, "fkey_two" integer, foreign key("fkey_two") references "test_table_two"("id"))'],
        bindings: []
      }
    },
    'schema.7': {
      mysql: {
        sql: ['alter table `test_table_one` add `phone` varchar(255)'],
        bindings: []
      },
      postgres: {
        sql: ['alter table "test_table_one" add column "phone" varchar(255)'],
        bindings: []
      },
      sqlite3: {
        sql: ['alter table "test_table_one" add column "phone" varchar(255)'],
        bindings: []
      }
    },
    'schema.8': {
      mysql: {
        sql: ['drop table if exists `items`'],
        bindings: []
      },
      postgres: {
        sql: ['drop table if exists "items"'],
        bindings: []
      },
      sqlite3: {
        sql: ['drop table if exists "items"'],
        bindings: []
      }
    },
    'schema.9': {
      mysql: {
        sql: ['select * from information_schema.tables where table_schema = ? and table_name = ?'],
        bindings: ['test_table_two']
      },
      postgres: {
        sql: ['select * from information_schema.tables where table_name = ?'],
        bindings: ['test_table_two']
      },
      sqlite3: {
        sql: ['select * from sqlite_master where type = \'table\' and name = ?'],
        bindings: ['test_table_two']
      }
    },
    'schema.10': {
      mysql: {
        sql: ['rename table `test_table_one` to `accounts`'],
        bindings: []
      },
      postgres: {
        sql: ['alter table "test_table_one" rename to "accounts"'],
        bindings: []
      },
      sqlite3: {
        sql: ['alter table "test_table_one" rename to "accounts"'],
        bindings: []
      }
    },
    'schema.11': {
      mysql: {
        sql: ['drop table `test_table_three`'],
        bindings: []
      },
      postgres: {
        sql: ['drop table "test_table_three"'],
        bindings: []
      },
      sqlite3: {
        sql: ['drop table "test_table_three"'],
        bindings: []
      }
    },
    'inserts.1': {
      mysql: {
        sql: ['insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?)'],
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date()]
      },
      postgres: {
        sql: ['insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?) returning "id"'],
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date()]
      },
      sqlite3: {
        sql: ['insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?)'],
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date()]
      }
    },
    'inserts.2': {
      mysql: {
        sql: ['insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)'],
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',1,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test3@example.com','Test','User',2,new Date()]
      },
      postgres: {
        sql: ['insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?) returning "id"'],
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',1,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test3@example.com','Test','User',2,new Date()]
      },
      sqlite3: {
        sql: ['insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at" union all select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at"'],
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',1,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test3@example.com','Test','User',2,new Date()]
      }
    },
    'inserts.3': {
      mysql: {
        sql: ['insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)'],
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test4@example.com','Test','User',2,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test5@example.com','Test','User',2,new Date()]
      },
      postgres: {
        sql: ['insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?) returning "id"'],
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test4@example.com','Test','User',2,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test5@example.com','Test','User',2,new Date()]
      },
      sqlite3: {
        sql: ['insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at" union all select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at"'],
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test4@example.com','Test','User',2,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test5@example.com','Test','User',2,new Date()]
      }
    },
    'inserts.4': {
      mysql: {
        sql: ['insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?)'],
        bindings: [1,2,'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test6@example.com','Test','User',2,new Date()]
      },
      postgres: {
        sql: ['insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?) returning "id"'],
        bindings: [1,2,'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test6@example.com','Test','User',2,new Date()]
      },
      sqlite3: {
        sql: ['insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?)'],
        bindings: [1,2,'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test6@example.com','Test','User',2,new Date()]
      }
    },
    'inserts.5': {
      mysql: {
        sql: ['insert into `test_default_table` () values ()'],
        bindings: []
      },
      postgres: {
        sql: ['insert into "test_default_table" default values returning "id"'],
        bindings: []
      },
      sqlite3: {
        sql: ['insert into "test_default_table" default values'],
        bindings: []
      }
    },
    'updates.1': {
      mysql: {
        sql: ['update `accounts` set `email` = ?, `first_name` = ?, `last_name` = ? where `id` = ?'],
        bindings: ['test100@example.com','User','Test',1]
      },
      postgres: {
        sql: ['update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ?'],
        bindings: ['test100@example.com','User','Test',1]
      },
      sqlite3: {
        sql: ['update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ?'],
        bindings: ['test100@example.com','User','Test',1]
      }
    },
    'selects.1': {
      mysql: {
        sql: ['select * from `accounts`'],
        bindings: []
      },
      postgres: {
        sql: ['select * from "accounts"'],
        bindings: []
      },
      sqlite3: {
        sql: ['select * from "accounts"'],
        bindings: []
      }
    },
    'selects.2': {
      mysql: {
        sql: ['select * from `accounts` order by `id` asc'],
        bindings: []
      },
      postgres: {
        sql: ['select * from "accounts" order by "id" asc'],
        bindings: []
      },
      sqlite3: {
        sql: ['select * from "accounts" order by "id" collate nocase asc'],
        bindings: []
      }
    },
    'selects.3': {
      mysql: {
        sql: ['select `first_name`, `last_name` from `accounts` where `id` = ?'],
        bindings: [1]
      },
      postgres: {
        sql: ['select "first_name", "last_name" from "accounts" where "id" = ?'],
        bindings: [1]
      },
      sqlite3: {
        sql: ['select "first_name", "last_name" from "accounts" where "id" = ?'],
        bindings: [1]
      }
    },
    'selects.4': {
      mysql: {
        sql: ['select `email`, `logins` from `accounts` where `id` > ?'],
        bindings: [1]
      },
      postgres: {
        sql: ['select "email", "logins" from "accounts" where "id" > ?'],
        bindings: [1]
      },
      sqlite3: {
        sql: ['select "email", "logins" from "accounts" where "id" > ?'],
        bindings: [1]
      }
    },
    'selects.5': {
      mysql: {
        sql: ['select * from `accounts` where `id` = ?'],
        bindings: [1]
      },
      postgres: {
        sql: ['select * from "accounts" where "id" = ?'],
        bindings: [1]
      },
      sqlite3: {
        sql: ['select * from "accounts" where "id" = ?'],
        bindings: [1]
      }
    },
    'selects.6': {
      mysql: {
        sql: ['select * from `accounts` where `id` = ?'],
        bindings: [undefined]
      },
      postgres: {
        sql: ['select * from "accounts" where "id" = ?'],
        bindings: [undefined]
      },
      sqlite3: {
        sql: ['select * from "accounts" where "id" = ?'],
        bindings: [undefined]
      }
    },
    'selects.7': {
      mysql: {
        sql: ['select `first_name`, `email` from `accounts` where `id` = ?'],
        bindings: [null]
      },
      postgres: {
        sql: ['select "first_name", "email" from "accounts" where "id" = ?'],
        bindings: [null]
      },
      sqlite3: {
        sql: ['select "first_name", "email" from "accounts" where "id" = ?'],
        bindings: [null]
      }
    },
    'selects.8': {
      mysql: {
        sql: ['select * from `accounts` where `id` = ?'],
        bindings: [0]
      },
      postgres: {
        sql: ['select * from "accounts" where "id" = ?'],
        bindings: [0]
      },
      sqlite3: {
        sql: ['select * from "accounts" where "id" = ?'],
        bindings: [0]
      }
    },
    'selects.9': {
      mysql: {
        sql: ['select distinct `email` from `accounts` where `logins` = ? order by `email` asc'],
        bindings: [2]
      },
      postgres: {
        sql: ['select distinct "email" from "accounts" where "logins" = ? order by "email" asc'],
        bindings: [2]
      },
      sqlite3: {
        sql: ['select distinct "email" from "accounts" where "logins" = ? order by "email" collate nocase asc'],
        bindings: [2]
      }
    },
    'selects.10': {
      mysql: {
        sql: ['select distinct `email` from `accounts` order by `email` asc'],
        bindings: []
      },
      postgres: {
        sql: ['select distinct "email" from "accounts" order by "email" asc'],
        bindings: []
      },
      sqlite3: {
        sql: ['select distinct "email" from "accounts" order by "email" collate nocase asc'],
        bindings: []
      }
    },
    'selects.11': {
      mysql: {
        sql: ['select `first_name`, `last_name` from `accounts` where `id` = ? or `id` > ?'],
        bindings: [1,2]
      },
      postgres: {
        sql: ['select "first_name", "last_name" from "accounts" where "id" = ? or "id" > ?'],
        bindings: [1,2]
      },
      sqlite3: {
        sql: ['select "first_name", "last_name" from "accounts" where "id" = ? or "id" > ?'],
        bindings: [1,2]
      }
    },
    'selects.12': {
      mysql: {
        sql: ['select `first_name`, `last_name`, `about` from `accounts` where `id` = ? and `email` = ?'],
        bindings: [1,'test@example.com']
      },
      postgres: {
        sql: ['select "first_name", "last_name", "about" from "accounts" where "id" = ? and "email" = ?'],
        bindings: [1,'test@example.com']
      },
      sqlite3: {
        sql: ['select "first_name", "last_name", "about" from "accounts" where "id" = ? and "email" = ?'],
        bindings: [1,'test@example.com']
      }
    },
    'selects.13': {
      mysql: {
        sql: ['select * from `accounts` where (`id` = ? or `id` = ?)'],
        bindings: [2,3]
      },
      postgres: {
        sql: ['select * from "accounts" where ("id" = ? or "id" = ?)'],
        bindings: [2,3]
      },
      sqlite3: {
        sql: ['select * from "accounts" where ("id" = ? or "id" = ?)'],
        bindings: [2,3]
      }
    },
    'selects.14': {
      mysql: {
        sql: ['select * from `accounts` where `id` in (?, ?, ?)'],
        bindings: [1,2,3]
      },
      postgres: {
        sql: ['select * from "accounts" where "id" in (?, ?, ?)'],
        bindings: [1,2,3]
      },
      sqlite3: {
        sql: ['select * from "accounts" where "id" in (?, ?, ?)'],
        bindings: [1,2,3]
      }
    },
    'selects.15': {
      mysql: {
        sql: ['select * from `accounts` where `email` = ? or `id` in (?, ?, ?)'],
        bindings: ['test@example.com',2,3,4]
      },
      postgres: {
        sql: ['select * from "accounts" where "email" = ? or "id" in (?, ?, ?)'],
        bindings: ['test@example.com',2,3,4]
      },
      sqlite3: {
        sql: ['select * from "accounts" where "email" = ? or "id" in (?, ?, ?)'],
        bindings: ['test@example.com',2,3,4]
      }
    },
    'selects.16': {
      mysql: {
        sql: ['select * from `accounts` where exists (select `id` from `test_table_two` where `id` = ?)'],
        bindings: [1]
      },
      postgres: {
        sql: ['select * from "accounts" where exists (select "id" from "test_table_two" where "id" = ?)'],
        bindings: [1]
      },
      sqlite3: {
        sql: ['select * from "accounts" where exists (select "id" from "test_table_two" where "id" = ?)'],
        bindings: [1]
      }
    },
    'selects.17': {
      mysql: {
        sql: ['select * from `accounts` where `id` between ? and ?'],
        bindings: [1,100]
      },
      postgres: {
        sql: ['select * from "accounts" where "id" between ? and ?'],
        bindings: [1,100]
      },
      sqlite3: {
        sql: ['select * from "accounts" where "id" between ? and ?'],
        bindings: [1,100]
      }
    },
    'selects.18': {
      mysql: {
        sql: ['select * from `accounts` where `id` between ? and ? or `id` between ? and ?'],
        bindings: [1,100,200,300]
      },
      postgres: {
        sql: ['select * from "accounts" where "id" between ? and ? or "id" between ? and ?'],
        bindings: [1,100,200,300]
      },
      sqlite3: {
        sql: ['select * from "accounts" where "id" between ? and ? or "id" between ? and ?'],
        bindings: [1,100,200,300]
      }
    },
    'selects.19': {
      mysql: {
        sql: ['select * from `accounts` where exists (select 1 from `test_table_two` where test_table_two.account_id = accounts.id)'],
        bindings: []
      },
      postgres: {
        sql: ['select * from "accounts" where exists (select 1 from "test_table_two" where test_table_two.account_id = accounts.id)'],
        bindings: []
      },
      sqlite3: {
        sql: ['select * from "accounts" where exists (select 1 from "test_table_two" where test_table_two.account_id = accounts.id)'],
        bindings: []
      }
    },
    'selects.20': {
      mysql: {
        sql: ['select `first_name`, `last_name` from `accounts` where `id` in (select `account_id` from `test_table_two` where `status` = ?)'],
        bindings: [1]
      },
      postgres: {
        sql: ['select "first_name", "last_name" from "accounts" where "id" in (select "account_id" from "test_table_two" where "status" = ?)'],
        bindings: [1]
      },
      sqlite3: {
        sql: ['select "first_name", "last_name" from "accounts" where "id" in (select "account_id" from "test_table_two" where "status" = ?)'],
        bindings: [1]
      }
    },
    'selects.21': {
      mysql: {
        sql: ['select `email`, `logins` from `accounts` where `id` <> ?'],
        bindings: [2]
      },
      postgres: {
        sql: ['select "email", "logins" from "accounts" where "id" <> ?'],
        bindings: [2]
      },
      sqlite3: {
        sql: ['select "email", "logins" from "accounts" where "id" <> ?'],
        bindings: [2]
      }
    },
    'selects.22': {
      mysql: {
        sql: ['select `email`, `logins` from `accounts` where id = 2'],
        bindings: []
      },
      postgres: {
        sql: ['select "email", "logins" from "accounts" where id = 2'],
        bindings: []
      },
      sqlite3: {
        sql: ['select "email", "logins" from "accounts" where id = 2'],
        bindings: []
      }
    },
    'aggregate.1': {
      mysql: {
        sql: ['select sum(`logins`) as aggregate from `accounts`'],
        bindings: []
      },
      postgres: {
        sql: ['select sum("logins") as aggregate from "accounts"'],
        bindings: []
      },
      sqlite3: {
        sql: ['select sum("logins") as aggregate from "accounts"'],
        bindings: []
      }
    },
    'aggregate.2': {
      mysql: {
        sql: ['select count(`id`) as aggregate from `accounts`'],
        bindings: []
      },
      postgres: {
        sql: ['select count("id") as aggregate from "accounts"'],
        bindings: []
      },
      sqlite3: {
        sql: ['select count("id") as aggregate from "accounts"'],
        bindings: []
      }
    },
    'aggregate.3': {
      mysql: {
        sql: ['select count(`id`) as aggregate from `accounts` group by `logins`'],
        bindings: []
      },
      postgres: {
        sql: ['select count("id") as aggregate from "accounts" group by "logins"'],
        bindings: []
      },
      sqlite3: {
        sql: ['select count("id") as aggregate from "accounts" group by "logins"'],
        bindings: []
      }
    },
    'aggregate.4': {
      mysql: {
        sql: ['select count(`id`) as aggregate from `accounts` group by `first_name`'],
        bindings: []
      },
      postgres: {
        sql: ['select count("id") as aggregate from "accounts" group by "first_name"'],
        bindings: []
      },
      sqlite3: {
        sql: ['select count("id") as aggregate from "accounts" group by "first_name"'],
        bindings: []
      }
    },
    'joins.1': {
      mysql: {
        sql: ['select `accounts`.*, `test_table_two`.`details` from `accounts` inner join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id`'],
        bindings: []
      },
      postgres: {
        sql: ['select "accounts".*, "test_table_two"."details" from "accounts" inner join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"'],
        bindings: []
      },
      sqlite3: {
        sql: ['select "accounts".*, "test_table_two"."details" from "accounts" inner join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"'],
        bindings: []
      }
    },
    'joins.2': {
      mysql: {
        sql: ['select `accounts`.*, `test_table_two`.`details` from `accounts` left join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id`'],
        bindings: []
      },
      postgres: {
        sql: ['select "accounts".*, "test_table_two"."details" from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"'],
        bindings: []
      },
      sqlite3: {
        sql: ['select "accounts".*, "test_table_two"."details" from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"'],
        bindings: []
      }
    },
    'joins.3': {
      mysql: {
        sql: ['select * from `accounts` left join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id` or `accounts`.`email` = `test_table_two`.`details`'],
        bindings: []
      },
      postgres: {
        sql: ['select * from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" or "accounts"."email" = "test_table_two"."details"'],
        bindings: []
      },
      sqlite3: {
        sql: ['select * from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" or "accounts"."email" = "test_table_two"."details"'],
        bindings: []
      }
    },
    'joins.4': {
      mysql: {
        sql: ['select `accounts`.`email` as `e1`, `a2`.`email` as `e2` from `accounts` inner join `accounts` as `a2` on `a2`.`email` <> `accounts`.`email`'],
        bindings: []
      },
      postgres: {
        sql: ['select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "a2"."email" <> "accounts"."email"'],
        bindings: []
      },
      sqlite3: {
        sql: ['select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "a2"."email" <> "accounts"."email"'],
        bindings: []
      }
    },
    'joins.5': {
      mysql: {
        sql: ['select `accounts`.`email` as `e1`, `a2`.`email` as `e2` from `accounts` inner join `accounts` as `a2` on `accounts`.`email` <> `a2`.`email` or `accounts`.`id` = 2'],
        bindings: []
      },
      postgres: {
        sql: ['select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "accounts"."email" <> "a2"."email" or "accounts"."id" = 2'],
        bindings: []
      },
      sqlite3: {
        sql: ['select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "accounts"."email" <> "a2"."email" or "accounts"."id" = 2'],
        bindings: []
      }
    },
    'deletes.1': {
      mysql: {
        sql: ['delete from `accounts` where `email` = ?'],
        bindings: ['test2@example.com']
      },
      postgres: {
        sql: ['delete from "accounts" where "email" = ?'],
        bindings: ['test2@example.com']
      },
      sqlite3: {
        sql: ['delete from "accounts" where "email" = ?'],
        bindings: ['test2@example.com']
      }
    },
    'additional.1': {
      mysql: {
        sql: ['truncate `test_table_two`'],
        bindings: []
      },
      postgres: {
        sql: ['truncate "test_table_two" restart identity'],
        bindings: []
      },
      sqlite3: {
        sql: ['delete from sqlite_sequence where name = "test_table_two"','delete from "test_table_two"'],
        bindings: []
      }
    },
    'unions.1': {
      mysql: {
        sql: ['select * from `accounts` where `id` = ? union select * from `accounts` where `id` = ?'],
        bindings: [1,2]
      },
      postgres: {
        sql: ['select * from "accounts" where "id" = ? union select * from "accounts" where "id" = ?'],
        bindings: [1,2]
      },
      sqlite3: {
        sql: ['select * from "accounts" where "id" = ? union select * from "accounts" where "id" = ?'],
        bindings: [1,2]
      }
    }
  },
  object: {
    'inserts.1': {
      mysql: [1],
      postgres: [1],
      sqlite3: [1]
    },
    'inserts.2': {
      mysql: [2],
      postgres: [2,3],
      sqlite3: [3]
    },
    'inserts.3': {
      mysql: [4],
      postgres: [4,5],
      sqlite3: [5]
    },
    'inserts.4': {
      mysql: [7],
      postgres: [7],
      sqlite3: [6]
    },
    'inserts.5': {
      mysql: [1],
      postgres: [1],
      sqlite3: [1]
    },
    'updates.1': {
      mysql: 1,
      postgres: 1,
      sqlite3: 1
    },
    'selects.1': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      postgres: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }]
    },
    'selects.2': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      postgres: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }]
    },
    'selects.3': {
      mysql: [{
        first_name: 'User',
        last_name: 'Test'
      }],
      postgres: [{
        first_name: 'User',
        last_name: 'Test'
      }],
      sqlite3: [{
        first_name: 'User',
        last_name: 'Test'
      }]
    },
    'selects.4': {
      mysql: [{
        email: 'test2@example.com',
        logins: 1
      },{
        email: 'test3@example.com',
        logins: 2
      },{
        email: 'test4@example.com',
        logins: 2
      },{
        email: 'test5@example.com',
        logins: 2
      },{
        email: 'test6@example.com',
        logins: 2
      }],
      postgres: [{
        email: 'test2@example.com',
        logins: 1
      },{
        email: 'test3@example.com',
        logins: 2
      },{
        email: 'test4@example.com',
        logins: 2
      },{
        email: 'test5@example.com',
        logins: 2
      },{
        email: 'test6@example.com',
        logins: 2
      }],
      sqlite3: [{
        email: 'test2@example.com',
        logins: 1
      },{
        email: 'test3@example.com',
        logins: 2
      },{
        email: 'test4@example.com',
        logins: 2
      },{
        email: 'test5@example.com',
        logins: 2
      },{
        email: 'test6@example.com',
        logins: 2
      }]
    },
    'selects.5': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      postgres: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }]
    },
    'selects.6': {
      mysql: [],
      postgres: [],
      sqlite3: []
    },
    'selects.7': {
      mysql: [],
      postgres: [],
      sqlite3: []
    },
    'selects.8': {
      mysql: [],
      postgres: [],
      sqlite3: []
    },
    'selects.9': {
      mysql: [{
        email: 'test3@example.com'
      },{
        email: 'test4@example.com'
      },{
        email: 'test5@example.com'
      },{
        email: 'test6@example.com'
      }],
      postgres: [{
        email: 'test3@example.com'
      },{
        email: 'test4@example.com'
      },{
        email: 'test5@example.com'
      },{
        email: 'test6@example.com'
      }],
      sqlite3: [{
        email: 'test3@example.com'
      },{
        email: 'test4@example.com'
      },{
        email: 'test5@example.com'
      },{
        email: 'test6@example.com'
      }]
    },
    'selects.10': {
      mysql: [{
        email: 'test100@example.com'
      },{
        email: 'test2@example.com'
      },{
        email: 'test3@example.com'
      },{
        email: 'test4@example.com'
      },{
        email: 'test5@example.com'
      },{
        email: 'test6@example.com'
      }],
      postgres: [{
        email: 'test100@example.com'
      },{
        email: 'test2@example.com'
      },{
        email: 'test3@example.com'
      },{
        email: 'test4@example.com'
      },{
        email: 'test5@example.com'
      },{
        email: 'test6@example.com'
      }],
      sqlite3: [{
        email: 'test100@example.com'
      },{
        email: 'test2@example.com'
      },{
        email: 'test3@example.com'
      },{
        email: 'test4@example.com'
      },{
        email: 'test5@example.com'
      },{
        email: 'test6@example.com'
      }]
    },
    'selects.11': {
      mysql: [{
        first_name: 'User',
        last_name: 'Test'
      },{
        first_name: 'Test',
        last_name: 'User'
      },{
        first_name: 'Test',
        last_name: 'User'
      },{
        first_name: 'Test',
        last_name: 'User'
      },{
        first_name: 'Test',
        last_name: 'User'
      }],
      postgres: [{
        first_name: 'Test',
        last_name: 'User'
      },{
        first_name: 'Test',
        last_name: 'User'
      },{
        first_name: 'Test',
        last_name: 'User'
      },{
        first_name: 'Test',
        last_name: 'User'
      },{
        first_name: 'User',
        last_name: 'Test'
      }],
      sqlite3: [{
        first_name: 'User',
        last_name: 'Test'
      },{
        first_name: 'Test',
        last_name: 'User'
      },{
        first_name: 'Test',
        last_name: 'User'
      },{
        first_name: 'Test',
        last_name: 'User'
      },{
        first_name: 'Test',
        last_name: 'User'
      }]
    },
    'selects.12': {
      mysql: [],
      postgres: [],
      sqlite3: []
    },
    'selects.13': {
      mysql: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      postgres: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      sqlite3: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }]
    },
    'selects.14': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      postgres: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }]
    },
    'selects.15': {
      mysql: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      postgres: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      sqlite3: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }]
    },
    'selects.16': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      postgres: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }]
    },
    'selects.17': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      postgres: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }]
    },
    'selects.18': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      postgres: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }]
    },
    'selects.19': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      postgres: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }]
    },
    'selects.20': {
      mysql: [{
        first_name: 'Test',
        last_name: 'User'
      },{
        first_name: 'Test',
        last_name: 'User'
      }],
      postgres: [{
        first_name: 'Test',
        last_name: 'User'
      },{
        first_name: 'Test',
        last_name: 'User'
      }],
      sqlite3: [{
        first_name: 'Test',
        last_name: 'User'
      },{
        first_name: 'Test',
        last_name: 'User'
      }]
    },
    'selects.21': {
      mysql: [{
        email: 'test100@example.com',
        logins: 1
      },{
        email: 'test3@example.com',
        logins: 2
      },{
        email: 'test4@example.com',
        logins: 2
      },{
        email: 'test5@example.com',
        logins: 2
      },{
        email: 'test6@example.com',
        logins: 2
      }],
      postgres: [{
        email: 'test3@example.com',
        logins: 2
      },{
        email: 'test4@example.com',
        logins: 2
      },{
        email: 'test5@example.com',
        logins: 2
      },{
        email: 'test6@example.com',
        logins: 2
      },{
        email: 'test100@example.com',
        logins: 1
      }],
      sqlite3: [{
        email: 'test100@example.com',
        logins: 1
      },{
        email: 'test3@example.com',
        logins: 2
      },{
        email: 'test4@example.com',
        logins: 2
      },{
        email: 'test5@example.com',
        logins: 2
      },{
        email: 'test6@example.com',
        logins: 2
      }]
    },
    'selects.22': {
      mysql: [{
        email: 'test2@example.com',
        logins: 1
      }],
      postgres: [{
        email: 'test2@example.com',
        logins: 1
      }],
      sqlite3: [{
        email: 'test2@example.com',
        logins: 1
      }]
    },
    'aggregate.1': {
      mysql: [{
        aggregate: 10
      }],
      postgres: [{
        aggregate: '10'
      }],
      sqlite3: [{
        aggregate: 10
      }]
    },
    'aggregate.2': {
      mysql: [{
        aggregate: 6
      }],
      postgres: [{
        aggregate: '6'
      }],
      sqlite3: [{
        aggregate: 6
      }]
    },
    'aggregate.3': {
      mysql: [{
        aggregate: 2
      },{
        aggregate: 4
      }],
      postgres: [{
        aggregate: '2'
      },{
        aggregate: '4'
      }],
      sqlite3: [{
        aggregate: 2
      },{
        aggregate: 4
      }]
    },
    'aggregate.4': {
      mysql: [{
        aggregate: 5
      },{
        aggregate: 1
      }],
      postgres: [{
        aggregate: '1'
      },{
        aggregate: '5'
      }],
      sqlite3: [{
        aggregate: 5
      },{
        aggregate: 1
      }]
    },
    'joins.1': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: ''
      }],
      postgres: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: ''
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: ''
      }]
    },
    'joins.2': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: ''
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: null
      }],
      postgres: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: ''
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: ''
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        details: null
      }]
    },
    'joins.3': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: 1,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 0,
        json_data: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: 2,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 1,
        json_data: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: 3,
        details: '',
        status: 1,
        json_data: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: null,
        details: null,
        status: null,
        json_data: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: null,
        details: null,
        status: null,
        json_data: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: null,
        details: null,
        status: null,
        json_data: null
      }],
      postgres: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: 2,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 1,
        json_data: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: 3,
        details: '',
        status: 1,
        json_data: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: null,
        details: null,
        status: null,
        json_data: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: null,
        details: null,
        status: null,
        json_data: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: null,
        details: null,
        status: null,
        json_data: null
      },{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: 1,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 0,
        json_data: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: 1,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 0,
        json_data: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: 2,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 1,
        json_data: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: 3,
        details: '',
        status: 1,
        json_data: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: null,
        details: null,
        status: null,
        json_data: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: null,
        details: null,
        status: null,
        json_data: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null,
        account_id: null,
        details: null,
        status: null,
        json_data: null
      }]
    },
    'joins.4': {
      mysql: [{
        e1: 'test2@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test6@example.com'
      }],
      postgres: [{
        e1: 'test2@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test6@example.com'
      }],
      sqlite3: [{
        e1: 'test100@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test5@example.com'
      }]
    },
    'joins.5': {
      mysql: [{
        e1: 'test2@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test6@example.com'
      }],
      postgres: [{
        e1: 'test2@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test6@example.com'
      }],
      sqlite3: [{
        e1: 'test100@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test100@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test2@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test3@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test4@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test5@example.com',
        e2: 'test6@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test100@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test6@example.com',
        e2: 'test5@example.com'
      }]
    },
    'deletes.1': {
      mysql: 1,
      postgres: 1,
      sqlite3: 1
    },
    'additional.1': {
      mysql: '',
      postgres: '',
      sqlite3: ''
    },
    'unions.1': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      postgres: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        phone: null
      }]
    }
  }
}