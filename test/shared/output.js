module.exports = {
  'schema.1': {
    mysql: {
      sql: ['create table `test_table` (`id` int(11) not null auto_increment primary key, `first_name` varchar(255) not null, `last_name` varchar(255) not null, `email` varchar(255) null, `logins` int(11) not null default \'1\', `about` text not null, `created_at` timestamp default 0 not null, `updated_at` timestamp default 0 not null)','alter table `test_table` add index test_table_logins_index(`logins`)'],
      bindings: []
    },
    postgres: {
      sql: ['create table "test_table" ("id" serial primary key not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "email" varchar(255) null, "logins" integer not null default \'1\', "about" text not null, "created_at" timestamp not null, "updated_at" timestamp not null)','create index test_table_logins_index on "test_table" ("logins")'],
      bindings: []
    },
    sqlite3: {
      sql: ['create table "test_table" ("id" integer null primary key autoincrement, "first_name" varchar null, "last_name" varchar null, "email" varchar null, "logins" integer null default \'1\', "about" text null, "created_at" datetime null, "updated_at" datetime null)','create index test_table_logins_index on "test_table" ("logins")'],
      bindings: []
    }
  },
  'schema.2': {
    mysql: {
      sql: ['create table `other_table` (`main` int(11) not null, `paragraph` text not null default \'Lorem ipsum Qui quis qui in.\')','alter table `other_table` add primary key other_table_main_primary(`main`)'],
      bindings: []
    },
    postgres: {
      sql: ['create table "other_table" ("main" integer not null, "paragraph" text not null default \'Lorem ipsum Qui quis qui in.\')','alter table "other_table" add primary key ("main")'],
      bindings: []
    },
    sqlite3: {
      sql: ['create table "other_table" ("main" integer null, "paragraph" text null default \'Lorem ipsum Qui quis qui in.\')'],
      bindings: []
    }
  },
  'schema.3': {
    mysql: {
      sql: ['drop table `accounts`'],
      bindings: []
    },
    postgres: {
      sql: ['drop table "accounts"'],
      bindings: []
    },
    sqlite3: {
      sql: ['drop table "accounts"'],
      bindings: []
    }
  },
  'schema.4': {
    mysql: {
      sql: ['drop table if exists `other_accounts`'],
      bindings: []
    },
    postgres: {
      sql: ['drop table if exists "other_accounts"'],
      bindings: []
    },
    sqlite3: {
      sql: ['drop table if exists "other_accounts"'],
      bindings: []
    }
  },
  'schema.5': {
    mysql: {
      sql: ['rename table `accounts` to `new_accounts`'],
      bindings: []
    },
    postgres: {
      sql: ['alter table "accounts" rename to "new_accounts"'],
      bindings: []
    },
    sqlite3: {
      sql: ['alter table "accounts" rename to "new_accounts"'],
      bindings: []
    }
  },
  'inserts.1': {
    mysql: {
      sql: 'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?)',
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date()]
    },
    postgres: {
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?)',
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date()]
    },
    sqlite3: {
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?)',
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date()]
    }
  },
  'inserts.2': {
    mysql: {
      sql: 'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)',
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
    },
    postgres: {
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)',
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
    },
    sqlite3: {
      sql: 'insert into "accounts" ("first_name", "last_name", "email", "logins", "about", "created_at", "updated_at") select ? as "first_name", ? as "last_name", ? as "email", ? as "logins", ? as "about", ? as "created_at", ? as "updated_at" union select ? as "first_name", ? as "last_name", ? as "email", ? as "logins", ? as "about", ? as "created_at", ? as "updated_at"',
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
    }
  },
  'inserts.3': {
    mysql: {
      sql: 'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)',
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
    },
    postgres: {
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)',
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
    },
    sqlite3: {
      sql: 'insert into "accounts" ("first_name", "last_name", "email", "about", "logins", "created_at", "updated_at") select ? as "first_name", ? as "last_name", ? as "email", ? as "about", ? as "logins", ? as "created_at", ? as "updated_at" union select ? as "first_name", ? as "last_name", ? as "email", ? as "about", ? as "logins", ? as "created_at", ? as "updated_at"',
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
    }
  },
  'inserts.4': {
    mysql: {
      sql: 'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?)',
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
    },
    postgres: {
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?)',
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
    },
    sqlite3: {
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?)',
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
    }
  },
  'updates.1': {
    mysql: {
      sql: 'update `accounts` set `email` = ?, `first_name` = ?, `last_name` = ? where `id` = ?',
      bindings: ['test-updated@example.com','User','Test',1]
    },
    postgres: {
      sql: 'update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ?',
      bindings: ['test-updated@example.com','User','Test',1]
    },
    sqlite3: {
      sql: 'update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ?',
      bindings: ['test-updated@example.com','User','Test',1]
    }
  },
  'selects.1': {
    mysql: {
      sql: 'select * from `accounts`',
      bindings: []
    },
    postgres: {
      sql: 'select * from "accounts"',
      bindings: []
    },
    sqlite3: {
      sql: 'select * from "accounts"',
      bindings: []
    }
  },
  'selects.2': {
    mysql: [{
      sql: 'select `first_name`, `last_name` from `table` where `id` = ?',
      bindings: [1]
    },{
      sql: 'select `email`, `logins` from `table` where `id` > ?',
      bindings: [1]
    },{
      sql: 'select * from `table` where `id` = ?',
      bindings: [1]
    },{
      sql: 'select * from `table` where `id` = ?',
      bindings: [undefined]
    },{
      sql: 'select `first_name`, `email` from `table` where `id` = ?',
      bindings: [null]
    },{
      sql: 'select * from `table` where `id` = ?',
      bindings: ['']
    }],
    postgres: [{
      sql: 'select "first_name", "last_name" from "table" where "id" = ?',
      bindings: [1]
    },{
      sql: 'select "email", "logins" from "table" where "id" > ?',
      bindings: [1]
    },{
      sql: 'select * from "table" where "id" = ?',
      bindings: [1]
    },{
      sql: 'select * from "table" where "id" = ?',
      bindings: [undefined]
    },{
      sql: 'select "first_name", "email" from "table" where "id" = ?',
      bindings: [null]
    },{
      sql: 'select * from "table" where "id" = ?',
      bindings: ['']
    }],
    sqlite3: [{
      sql: 'select "first_name", "last_name" from "table" where "id" = ?',
      bindings: [1]
    },{
      sql: 'select "email", "logins" from "table" where "id" > ?',
      bindings: [1]
    },{
      sql: 'select * from "table" where "id" = ?',
      bindings: [1]
    },{
      sql: 'select * from "table" where "id" = ?',
      bindings: [undefined]
    },{
      sql: 'select "first_name", "email" from "table" where "id" = ?',
      bindings: [null]
    },{
      sql: 'select * from "table" where "id" = ?',
      bindings: ['']
    }]
  },
  'selects.3': {
    mysql: [{
      sql: 'select `column1`, `column2` from `table` where `id` = ? or `id` > ?',
      bindings: [1,2]
    }],
    postgres: [{
      sql: 'select "column1", "column2" from "table" where "id" = ? or "id" > ?',
      bindings: [1,2]
    }],
    sqlite3: [{
      sql: 'select "column1", "column2" from "table" where "id" = ? or "id" > ?',
      bindings: [1,2]
    }]
  },
  'selects.4': {
    mysql: [{
      sql: 'select `first_name`, `last_name`, `about` from `table` where `id` = ? and `email` = ?',
      bindings: [1,'test@example.com']
    }],
    postgres: [{
      sql: 'select "first_name", "last_name", "about" from "table" where "id" = ? and "email" = ?',
      bindings: [1,'test@example.com']
    }],
    sqlite3: [{
      sql: 'select "first_name", "last_name", "about" from "table" where "id" = ? and "email" = ?',
      bindings: [1,'test@example.com']
    }]
  },
  'selects.5': {
    mysql: [{
      sql: 'select * from `table` where (`x` = ? or `x` = ?)',
      bindings: [2,3]
    }],
    postgres: [{
      sql: 'select * from "table" where ("x" = ? or "x" = ?)',
      bindings: [2,3]
    }],
    sqlite3: [{
      sql: 'select * from "table" where ("x" = ? or "x" = ?)',
      bindings: [2,3]
    }]
  },
  'selects.6': {
    mysql: [{
      sql: 'select * from `accounts` where `x` in (?, ?, ?)',
      bindings: [1,2,3]
    }],
    postgres: [{
      sql: 'select * from "accounts" where "x" in (?, ?, ?)',
      bindings: [1,2,3]
    }],
    sqlite3: [{
      sql: 'select * from "accounts" where "x" in (?, ?, ?)',
      bindings: [1,2,3]
    }]
  },
  'selects.7': {
    mysql: {
      sql: 'select * from `table` where `id` = ? or `id` in (?, ?, ?)',
      bindings: [1,2,3,4]
    },
    postgres: {
      sql: 'select * from "table" where "id" = ? or "id" in (?, ?, ?)',
      bindings: [1,2,3,4]
    },
    sqlite3: {
      sql: 'select * from "table" where "id" = ? or "id" in (?, ?, ?)',
      bindings: [1,2,3,4]
    }
  },
  'selects.8': {
    mysql: {
      sql: 'select * from `accounts` where exists (select `column1` from `table2` where `id` = ? and `otherItem` = ?)',
      bindings: [1,2]
    },
    postgres: {
      sql: 'select * from "accounts" where exists (select "column1" from "table2" where "id" = ? and "otherItem" = ?)',
      bindings: [1,2]
    },
    sqlite3: {
      sql: 'select * from "accounts" where exists (select "column1" from "table2" where "id" = ? and "otherItem" = ?)',
      bindings: [1,2]
    }
  },
  'selects.9': {
    mysql: {
      sql: 'select * from `table` where `id` between ? and ?',
      bindings: [1,100]
    },
    postgres: {
      sql: 'select * from "table" where "id" between ? and ?',
      bindings: [1,100]
    },
    sqlite3: {
      sql: 'select * from "table" where "id" between ? and ?',
      bindings: [1,100]
    }
  },
  'selects.10': {
    mysql: {
      sql: 'select * from `table` where `id` between ? and ? or `id` between ? and ?',
      bindings: [1,100,200,300]
    },
    postgres: {
      sql: 'select * from "table" where "id" between ? and ? or "id" between ? and ?',
      bindings: [1,100,200,300]
    },
    sqlite3: {
      sql: 'select * from "table" where "id" between ? and ? or "id" between ? and ?',
      bindings: [1,100,200,300]
    }
  },
  'selects.11': {
    mysql: {
      sql: 'select `tableName`.*, `otherTable`.`name` from `tableName` inner join `otherTable` on `tableName`.`id` = `otherTable`.`otherId`',
      bindings: []
    },
    postgres: {
      sql: 'select "tableName".*, "otherTable"."name" from "tableName" inner join "otherTable" on "tableName"."id" = "otherTable"."otherId"',
      bindings: []
    },
    sqlite3: {
      sql: 'select "tableName".*, "otherTable"."name" from "tableName" inner join "otherTable" on "tableName"."id" = "otherTable"."otherId"',
      bindings: []
    }
  },
  'selects.12': {
    mysql: {
      sql: 'select `tableName`.*, `otherTable`.`name` from `tableName` left join `otherTable` on `tableName`.`id` = `otherTable`.`otherId`',
      bindings: []
    },
    postgres: {
      sql: 'select "tableName".*, "otherTable"."name" from "tableName" left join "otherTable" on "tableName"."id" = "otherTable"."otherId"',
      bindings: []
    },
    sqlite3: {
      sql: 'select "tableName".*, "otherTable"."name" from "tableName" left join "otherTable" on "tableName"."id" = "otherTable"."otherId"',
      bindings: []
    }
  },
  'selects.13': {
    mysql: {
      sql: 'select * from `tableName` left join `table2` on `tableName`.`one_id` = `table2`.`tableName_id` or `tableName`.`other_id` = `table2`.`tableName_id2`',
      bindings: []
    },
    postgres: {
      sql: 'select * from "tableName" left join "table2" on "tableName"."one_id" = "table2"."tableName_id" or "tableName"."other_id" = "table2"."tableName_id2"',
      bindings: []
    },
    sqlite3: {
      sql: 'select * from "tableName" left join "table2" on "tableName"."one_id" = "table2"."tableName_id" or "tableName"."other_id" = "table2"."tableName_id2"',
      bindings: []
    }
  },
  'deletes.1': {
    mysql: {
      sql: 'delete from `users` where `email` = ?',
      bindings: ['new_email@gmail.com']
    },
    postgres: {
      sql: 'delete from "users" where "email" = ?',
      bindings: ['new_email@gmail.com']
    },
    sqlite3: {
      sql: 'delete from "users" where "email" = ?',
      bindings: ['new_email@gmail.com']
    }
  },
  'unions.1': {
    mysql: {
      sql: 'select * from `users` where `id` = ? union select * from `users` where `id` = ?',
      bindings: [1,2]
    },
    postgres: {
      sql: 'select * from "users" where "id" = ? union select * from "users" where "id" = ?',
      bindings: [1,2]
    },
    sqlite3: {
      sql: 'select * from "users" where "id" = ? union select * from "users" where "id" = ?',
      bindings: [1,2]
    }
  }
}