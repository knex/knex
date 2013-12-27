create table `test_table_one` (
  `id` bigint unsigned not null auto_increment primary key,
  `first_name` varchar(255),
  `last_name` varchar(255),
  `email` varchar(255),
  `logins` int(11) default '1',
  `about` text comment 'A comment.',
  `created_at` datetime,
  `updated_at` datetime
)
default character set utf8
engine = InnoDB
comment = 'A table comment.'

alter table `test_table_one` add index test_table_one_first_name_index(`first_name`)
alter table `test_table_one` add unique test_table_one_email_unique(`email`)
alter table `test_table_one` add index test_table_one_logins_index(`logins`)

create table "test_table_one" (
  "id" bigserial primary key not null,
  "first_name" varchar(255),
  "last_name" varchar(255),
  "email" varchar(255),
  "logins" integer default '1',
  "about" text,
  "created_at" timestamp,
  "updated_at" timestamp
)

comment on table "test_table_one" is 'A table comment.'
comment on column "test_table_one"."about" is 'A comment.'

create index test_table_one_first_name_index on "test_table_one" ("first_name")
alter table "test_table_one" add constraint test_table_one_email_unique unique ("email")
create index test_table_one_logins_index on "test_table_one" ("logins")

create table "test_table_one" (
  "id" integer primary key autoincrement not null,
  "first_name" varchar(255),
  "last_name" varchar(255),
  "email" varchar(255),
  "logins" integer default '1',
  "about" text,
  "created_at" datetime,
  "updated_at" datetime
)

create index test_table_one_first_name_index on "test_table_one" ("first_name")
create unique index test_table_one_email_unique on "test_table_one" ("email")
create index test_table_one_logins_index on "test_table_one" ("logins")

alter table "users" add column "id" serial primary key not null, add column "email" varchar(255) not null
alter table "users" add column "id" integer not null primary key autoincrement
alter table "users" add column "email" varchar not null


CREATE TABLE `annotations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `layer_id` bigint(20) unsigned NOT NULL,
  `file_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `type` enum('highlight','point','rect','stamp') NOT NULL,
  `data` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `layer_id` (`layer_id`),
  KEY `file_id` (`file_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8;