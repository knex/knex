module.exports = {
  string: {
    'schema.1': {
      mysql: {
        sql: ['drop table if exists `test_table_one`'],
        bindings: []
      },
      postgres: {
        sql: ['drop table if exists "test_table_one"'],
        bindings: []
      },
      sqlite3: {
        sql: ['drop table if exists "test_table_one"'],
        bindings: []
      }
    },
    'schema.2': {
      mysql: {
        sql: ['drop table if exists `test_table_two`'],
        bindings: []
      },
      postgres: {
        sql: ['drop table if exists "test_table_two"'],
        bindings: []
      },
      sqlite3: {
        sql: ['drop table if exists "test_table_two"'],
        bindings: []
      }
    },
    'schema.3': {
      mysql: {
        sql: ['drop table if exists `test_table_three`'],
        bindings: []
      },
      postgres: {
        sql: ['drop table if exists "test_table_three"'],
        bindings: []
      },
      sqlite3: {
        sql: ['drop table if exists "test_table_three"'],
        bindings: []
      }
    },
    'schema.4': {
      mysql: {
        sql: ['drop table if exists `accounts`'],
        bindings: []
      },
      postgres: {
        sql: ['drop table if exists "accounts"'],
        bindings: []
      },
      sqlite3: {
        sql: ['drop table if exists "accounts"'],
        bindings: []
      }
    },
    'schema.5': {
      mysql: {
        sql: ['create table `test_table_one` (`id` int(11) not null auto_increment primary key, `first_name` varchar(255) not null, `last_name` varchar(255) not null, `email` varchar(255) null, `logins` int(11) not null default \'1\', `about` text not null, `created_at` timestamp default 0 not null, `updated_at` timestamp default 0 not null)','alter table `test_table_one` add index test_table_one_logins_index(`logins`)'],
        bindings: []
      },
      postgres: {
        sql: ['create table "test_table_one" ("id" serial primary key not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "email" varchar(255) null, "logins" integer not null default \'1\', "about" text not null, "created_at" timestamp not null, "updated_at" timestamp not null)','create index test_table_one_logins_index on "test_table_one" ("logins")'],
        bindings: []
      },
      sqlite3: {
        sql: ['create table "test_table_one" ("id" integer null primary key autoincrement, "first_name" varchar null, "last_name" varchar null, "email" varchar null, "logins" integer null default \'1\', "about" text null, "created_at" datetime null, "updated_at" datetime null)','create index test_table_one_logins_index on "test_table_one" ("logins")'],
        bindings: []
      }
    },
    'schema.6': {
      mysql: {
        sql: ['create table `test_table_two` (`id` int(11) not null auto_increment primary key, `account_id` int(11) not null, `details` text not null)'],
        bindings: []
      },
      postgres: {
        sql: ['create table "test_table_two" ("id" serial primary key not null, "account_id" integer not null, "details" text not null)'],
        bindings: []
      },
      sqlite3: {
        sql: ['create table "test_table_two" ("id" integer null primary key autoincrement, "account_id" integer null, "details" text null)'],
        bindings: []
      }
    },
    'schema.7': {
      mysql: {
        sql: ['create table `test_table_three` (`main` int(11) not null, `paragraph` text not null)','alter table `test_table_three` add primary key test_table_three_main_primary(`main`)'],
        bindings: []
      },
      postgres: {
        sql: ['create table "test_table_three" ("main" integer not null, "paragraph" text not null default \'Lorem ipsum Qui quis qui in.\')','alter table "test_table_three" add primary key ("main")'],
        bindings: []
      },
      sqlite3: {
        sql: ['create table "test_table_three" ("main" integer null, "paragraph" text null default \'Lorem ipsum Qui quis qui in.\')'],
        bindings: []
      }
    },
    'schema.8': {
      mysql: {
        sql: ['alter table `test_table_one` add `phone` varchar(255) null'],
        bindings: []
      },
      postgres: {
        sql: ['alter table "test_table_one" add column "phone" varchar(255) null'],
        bindings: []
      },
      sqlite3: {
        sql: ['alter table "test_table_one" add column "phone" varchar null'],
        bindings: []
      }
    },
    'schema.9': {
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
    'schema.10': {
      mysql: {
        sql: ['select * from information_schema.tables where table_schema = ? and table_name = ?'],
        bindings: ['knex_test','test_table_two']
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
    'schema.11': {
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
    'schema.12': {
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
        sql: 'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?)',
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date()]
      },
      postgres: {
        sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?) returning "id"',
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
        sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?) returning "id"',
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
      },
      sqlite3: {
        sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at" union select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at"',
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
      }
    },
    'inserts.3': {
      mysql: {
        sql: 'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)',
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
      },
      postgres: {
        sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?) returning "id"',
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
      },
      sqlite3: {
        sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at" union select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at"',
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
      }
    },
    'inserts.4': {
      mysql: {
        sql: 'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?)',
        bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',2,new Date()]
      },
      postgres: {
        sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?) returning "id"',
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
      mysql: {
        sql: 'select `first_name`, `last_name` from `accounts` where `id` = ?',
        bindings: [1]
      },
      postgres: {
        sql: 'select "first_name", "last_name" from "accounts" where "id" = ?',
        bindings: [1]
      },
      sqlite3: {
        sql: 'select "first_name", "last_name" from "accounts" where "id" = ?',
        bindings: [1]
      }
    },
    'selects.3': {
      mysql: {
        sql: 'select `email`, `logins` from `accounts` where `id` > ?',
        bindings: [1]
      },
      postgres: {
        sql: 'select "email", "logins" from "accounts" where "id" > ?',
        bindings: [1]
      },
      sqlite3: {
        sql: 'select "email", "logins" from "accounts" where "id" > ?',
        bindings: [1]
      }
    },
    'selects.4': {
      mysql: {
        sql: 'select * from `accounts` where `id` = ?',
        bindings: [1]
      },
      postgres: {
        sql: 'select * from "accounts" where "id" = ?',
        bindings: [1]
      },
      sqlite3: {
        sql: 'select * from "accounts" where "id" = ?',
        bindings: [1]
      }
    },
    'selects.5': {
      mysql: {
        sql: 'select * from `accounts` where `id` = ?',
        bindings: [undefined]
      },
      postgres: {
        sql: 'select * from "accounts" where "id" = ?',
        bindings: [undefined]
      },
      sqlite3: {
        sql: 'select * from "accounts" where "id" = ?',
        bindings: [undefined]
      }
    },
    'selects.6': {
      mysql: {
        sql: 'select `first_name`, `email` from `accounts` where `id` = ?',
        bindings: [null]
      },
      postgres: {
        sql: 'select "first_name", "email" from "accounts" where "id" = ?',
        bindings: [null]
      },
      sqlite3: {
        sql: 'select "first_name", "email" from "accounts" where "id" = ?',
        bindings: [null]
      }
    },
    'selects.7': {
      mysql: {
        sql: 'select * from `accounts` where `id` = ?',
        bindings: [0]
      },
      postgres: {
        sql: 'select * from "accounts" where "id" = ?',
        bindings: [0]
      },
      sqlite3: {
        sql: 'select * from "accounts" where "id" = ?',
        bindings: [0]
      }
    },
    'selects.8': {
      mysql: {
        sql: 'select distinct `email` from `accounts` where `logins` = ?',
        bindings: [2]
      },
      postgres: {
        sql: 'select distinct "email" from "accounts" where "logins" = ?',
        bindings: [2]
      },
      sqlite3: {
        sql: 'select distinct "email" from "accounts" where "logins" = ?',
        bindings: [2]
      }
    },
    'selects.9': {
      mysql: {
        sql: 'select distinct `email` from `accounts`',
        bindings: []
      },
      postgres: {
        sql: 'select distinct "email" from "accounts"',
        bindings: []
      },
      sqlite3: {
        sql: 'select distinct "email" from "accounts"',
        bindings: []
      }
    },
    'selects.10': {
      mysql: {
        sql: 'select `first_name`, `last_name` from `accounts` where `id` = ? or `id` > ?',
        bindings: [1,2]
      },
      postgres: {
        sql: 'select "first_name", "last_name" from "accounts" where "id" = ? or "id" > ?',
        bindings: [1,2]
      },
      sqlite3: {
        sql: 'select "first_name", "last_name" from "accounts" where "id" = ? or "id" > ?',
        bindings: [1,2]
      }
    },
    'selects.11': {
      mysql: {
        sql: 'select `first_name`, `last_name`, `about` from `accounts` where `id` = ? and `email` = ?',
        bindings: [1,'test@example.com']
      },
      postgres: {
        sql: 'select "first_name", "last_name", "about" from "accounts" where "id" = ? and "email" = ?',
        bindings: [1,'test@example.com']
      },
      sqlite3: {
        sql: 'select "first_name", "last_name", "about" from "accounts" where "id" = ? and "email" = ?',
        bindings: [1,'test@example.com']
      }
    },
    'selects.12': {
      mysql: {
        sql: 'select * from `accounts` where (`id` = ? or `id` = ?)',
        bindings: [2,3]
      },
      postgres: {
        sql: 'select * from "accounts" where ("id" = ? or "id" = ?)',
        bindings: [2,3]
      },
      sqlite3: {
        sql: 'select * from "accounts" where ("id" = ? or "id" = ?)',
        bindings: [2,3]
      }
    },
    'selects.13': {
      mysql: {
        sql: 'select * from `accounts` where `id` in (?, ?, ?)',
        bindings: [1,2,3]
      },
      postgres: {
        sql: 'select * from "accounts" where "id" in (?, ?, ?)',
        bindings: [1,2,3]
      },
      sqlite3: {
        sql: 'select * from "accounts" where "id" in (?, ?, ?)',
        bindings: [1,2,3]
      }
    },
    'selects.14': {
      mysql: {
        sql: 'select * from `accounts` where `email` = ? or `id` in (?, ?, ?)',
        bindings: ['test@example.com',2,3,4]
      },
      postgres: {
        sql: 'select * from "accounts" where "email" = ? or "id" in (?, ?, ?)',
        bindings: ['test@example.com',2,3,4]
      },
      sqlite3: {
        sql: 'select * from "accounts" where "email" = ? or "id" in (?, ?, ?)',
        bindings: ['test@example.com',2,3,4]
      }
    },
    'selects.15': {
      mysql: {
        sql: 'select * from `accounts` where exists (select `id` from `test_table_two` where `id` = ?)',
        bindings: [1]
      },
      postgres: {
        sql: 'select * from "accounts" where exists (select "id" from "test_table_two" where "id" = ?)',
        bindings: [1]
      },
      sqlite3: {
        sql: 'select * from "accounts" where exists (select "id" from "test_table_two" where "id" = ?)',
        bindings: [1]
      }
    },
    'selects.16': {
      mysql: {
        sql: 'select * from `accounts` where `id` between ? and ?',
        bindings: [1,100]
      },
      postgres: {
        sql: 'select * from "accounts" where "id" between ? and ?',
        bindings: [1,100]
      },
      sqlite3: {
        sql: 'select * from "accounts" where "id" between ? and ?',
        bindings: [1,100]
      }
    },
    'selects.17': {
      mysql: {
        sql: 'select * from `accounts` where `id` between ? and ? or `id` between ? and ?',
        bindings: [1,100,200,300]
      },
      postgres: {
        sql: 'select * from "accounts" where "id" between ? and ? or "id" between ? and ?',
        bindings: [1,100,200,300]
      },
      sqlite3: {
        sql: 'select * from "accounts" where "id" between ? and ? or "id" between ? and ?',
        bindings: [1,100,200,300]
      }
    },
    'selects.18': {
      mysql: {
        sql: 'select `accounts`.*, `test_table_two`.`details` from `accounts` inner join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id`',
        bindings: []
      },
      postgres: {
        sql: 'select "accounts".*, "test_table_two"."details" from "accounts" inner join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"',
        bindings: []
      },
      sqlite3: {
        sql: 'select "accounts".*, "test_table_two"."details" from "accounts" inner join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"',
        bindings: []
      }
    },
    'selects.19': {
      mysql: {
        sql: 'select `accounts`.*, `test_table_two`.`details` from `accounts` left join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id`',
        bindings: []
      },
      postgres: {
        sql: 'select "accounts".*, "test_table_two"."details" from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"',
        bindings: []
      },
      sqlite3: {
        sql: 'select "accounts".*, "test_table_two"."details" from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"',
        bindings: []
      }
    },
    'selects.20': {
      mysql: {
        sql: 'select * from `accounts` left join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id` or `accounts`.`email` = `test_table_two`.`details`',
        bindings: []
      },
      postgres: {
        sql: 'select * from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" or "accounts"."email" = "test_table_two"."details"',
        bindings: []
      },
      sqlite3: {
        sql: 'select * from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" or "accounts"."email" = "test_table_two"."details"',
        bindings: []
      }
    },
    'deletes.1': {
      mysql: {
        sql: 'delete from `accounts` where `email` = ?',
        bindings: ['test2@example.com']
      },
      postgres: {
        sql: 'delete from "accounts" where "email" = ?',
        bindings: ['test2@example.com']
      },
      sqlite3: {
        sql: 'delete from "accounts" where "email" = ?',
        bindings: ['test2@example.com']
      }
    },
    'unions.1': {
      mysql: {
        sql: 'select * from `accounts` where `id` = ? union select * from `accounts` where `id` = ?',
        bindings: [1,2]
      },
      postgres: {
        sql: 'select * from "accounts" where "id" = ? union select * from "accounts" where "id" = ?',
        bindings: [1,2]
      },
      sqlite3: {
        sql: 'select * from "accounts" where "id" = ? union select * from "accounts" where "id" = ?',
        bindings: [1,2]
      }
    }
  },
  db: {
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
      sqlite3: [4]
    },
    'inserts.4': {
      mysql: [6],
      postgres: [6],
      sqlite3: [5]
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
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      postgres: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784267,
        updated_at: 1367709784267,
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784281,
        updated_at: 1367709784281,
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784285,
        updated_at: 1367709784285,
        phone: null
      }]
    },
    'selects.2': {
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
    'selects.3': {
      mysql: [{
        email: 'test@example.com',
        logins: 1
      },{
        email: 'test2@example.com',
        logins: 2
      },{
        email: 'test2@example.com',
        logins: 2
      },{
        email: 'test2@example.com',
        logins: 2
      },{
        email: 'test2@example.com',
        logins: 2
      }],
      postgres: [{
        email: 'test@example.com',
        logins: 1
      },{
        email: 'test2@example.com',
        logins: 2
      },{
        email: 'test2@example.com',
        logins: 2
      },{
        email: 'test2@example.com',
        logins: 2
      },{
        email: 'test2@example.com',
        logins: 2
      }],
      sqlite3: [{
        email: 'test2@example.com',
        logins: 2
      },{
        email: 'test@example.com',
        logins: 1
      },{
        email: 'test2@example.com',
        logins: 2
      },{
        email: 'test2@example.com',
        logins: 2
      }]
    },
    'selects.4': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      postgres: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784267,
        updated_at: 1367709784267,
        phone: null
      }]
    },
    'selects.5': {
      mysql: [],
      postgres: [],
      sqlite3: []
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
      mysql: [{
        email: 'test2@example.com'
      }],
      postgres: [{
        email: 'test2@example.com'
      }],
      sqlite3: [{
        email: 'test2@example.com'
      }]
    },
    'selects.9': {
      mysql: [{
        email: 'test-updated@example.com'
      },{
        email: 'test@example.com'
      },{
        email: 'test2@example.com'
      }],
      postgres: [{
        email: 'test-updated@example.com'
      },{
        email: 'test2@example.com'
      },{
        email: 'test@example.com'
      }],
      sqlite3: [{
        email: 'test-updated@example.com'
      },{
        email: 'test2@example.com'
      },{
        email: 'test@example.com'
      }]
    },
    'selects.10': {
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
      }]
    },
    'selects.11': {
      mysql: [],
      postgres: [],
      sqlite3: []
    },
    'selects.12': {
      mysql: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      postgres: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      sqlite3: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      }]
    },
    'selects.13': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      postgres: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784267,
        updated_at: 1367709784267,
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      }]
    },
    'selects.14': {
      mysql: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      postgres: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      sqlite3: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784281,
        updated_at: 1367709784281,
        phone: null
      }]
    },
    'selects.15': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      postgres: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784267,
        updated_at: 1367709784267,
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784281,
        updated_at: 1367709784281,
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784285,
        updated_at: 1367709784285,
        phone: null
      }]
    },
    'selects.16': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      postgres: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784267,
        updated_at: 1367709784267,
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784281,
        updated_at: 1367709784281,
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784285,
        updated_at: 1367709784285,
        phone: null
      }]
    },
    'selects.17': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      postgres: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784267,
        updated_at: 1367709784267,
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784281,
        updated_at: 1367709784281,
        phone: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784285,
        updated_at: 1367709784285,
        phone: null
      }]
    },
    'selects.18': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      }],
      postgres: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784267,
        updated_at: 1367709784267,
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      }]
    },
    'selects.19': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      }],
      postgres: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784267,
        updated_at: 1367709784267,
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null,
        details: null
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null,
        details: null
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784281,
        updated_at: 1367709784281,
        phone: null,
        details: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784285,
        updated_at: 1367709784285,
        phone: null,
        details: null
      }]
    },
    'selects.20': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: 1,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: null,
        details: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: null,
        details: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: null,
        details: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: null,
        details: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: null,
        details: null
      }],
      postgres: [{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: null,
        details: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: null,
        details: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: null,
        details: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: null,
        details: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: null,
        details: null
      },{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: 1,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784267,
        updated_at: 1367709784267,
        phone: null,
        account_id: 1,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null,
        account_id: null,
        details: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784278,
        updated_at: 1367709784278,
        phone: null,
        account_id: null,
        details: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784281,
        updated_at: 1367709784281,
        phone: null,
        account_id: null,
        details: null
      },{
        id: null,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784285,
        updated_at: 1367709784285,
        phone: null,
        account_id: null,
        details: null
      }]
    },
    'deletes.1': {
      mysql: 4,
      postgres: 4,
      sqlite3: undefined
    },
    'unions.1': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      postgres: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }],
      sqlite3: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1367709784267,
        updated_at: 1367709784267,
        phone: null
      }]
    }
  }
}