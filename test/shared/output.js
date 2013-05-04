module.exports = {
  string: {
    'schema.1': {
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
    'schema.2': {
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
    'schema.3': {
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
    'schema.4': {
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
    'schema.5': {
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
    'schema.6': {
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
        sql: 'select `first_name`, `last_name` from `accounts` where `id` = ?',
        bindings: [1]
      },{
        sql: 'select `email`, `logins` from `accounts` where `id` > ?',
        bindings: [1]
      },{
        sql: 'select * from `accounts` where `id` = ?',
        bindings: [1]
      },{
        sql: 'select * from `accounts` where `id` = ?',
        bindings: [undefined]
      },{
        sql: 'select `first_name`, `email` from `accounts` where `id` = ?',
        bindings: [null]
      },{
        sql: 'select * from `accounts` where `id` = ?',
        bindings: [null]
      }],
      postgres: [{
        sql: 'select "first_name", "last_name" from "accounts" where "id" = ?',
        bindings: [1]
      },{
        sql: 'select "email", "logins" from "accounts" where "id" > ?',
        bindings: [1]
      },{
        sql: 'select * from "accounts" where "id" = ?',
        bindings: [1]
      },{
        sql: 'select * from "accounts" where "id" = ?',
        bindings: [undefined]
      },{
        sql: 'select "first_name", "email" from "accounts" where "id" = ?',
        bindings: [null]
      },{
        sql: 'select * from "accounts" where "id" = ?',
        bindings: [null]
      }],
      sqlite3: [{
        sql: 'select "first_name", "last_name" from "accounts" where "id" = ?',
        bindings: [1]
      },{
        sql: 'select "email", "logins" from "accounts" where "id" > ?',
        bindings: [1]
      },{
        sql: 'select * from "accounts" where "id" = ?',
        bindings: [1]
      },{
        sql: 'select * from "accounts" where "id" = ?',
        bindings: [undefined]
      },{
        sql: 'select "first_name", "email" from "accounts" where "id" = ?',
        bindings: [null]
      },{
        sql: 'select * from "accounts" where "id" = ?',
        bindings: [null]
      }]
    },
    'selects.3': {
      mysql: [{
        sql: 'select `first_name`, `last_name` from `accounts` where `id` = ? or `id` > ?',
        bindings: [1,2]
      }],
      postgres: [{
        sql: 'select "first_name", "last_name" from "accounts" where "id" = ? or "id" > ?',
        bindings: [1,2]
      }],
      sqlite3: [{
        sql: 'select "first_name", "last_name" from "accounts" where "id" = ? or "id" > ?',
        bindings: [1,2]
      }]
    },
    'selects.4': {
      mysql: [{
        sql: 'select `first_name`, `last_name`, `about` from `accounts` where `id` = ? and `email` = ?',
        bindings: [1,'test@example.com']
      }],
      postgres: [{
        sql: 'select "first_name", "last_name", "about" from "accounts" where "id" = ? and "email" = ?',
        bindings: [1,'test@example.com']
      }],
      sqlite3: [{
        sql: 'select "first_name", "last_name", "about" from "accounts" where "id" = ? and "email" = ?',
        bindings: [1,'test@example.com']
      }]
    },
    'selects.5': {
      mysql: [{
        sql: 'select * from `accounts` where (`id` = ? or `id` = ?)',
        bindings: [2,3]
      }],
      postgres: [{
        sql: 'select * from "accounts" where ("id" = ? or "id" = ?)',
        bindings: [2,3]
      }],
      sqlite3: [{
        sql: 'select * from "accounts" where ("id" = ? or "id" = ?)',
        bindings: [2,3]
      }]
    },
    'selects.6': {
      mysql: [{
        sql: 'select * from `accounts` where `id` in (?, ?, ?)',
        bindings: [1,2,3]
      }],
      postgres: [{
        sql: 'select * from "accounts" where "id" in (?, ?, ?)',
        bindings: [1,2,3]
      }],
      sqlite3: [{
        sql: 'select * from "accounts" where "id" in (?, ?, ?)',
        bindings: [1,2,3]
      }]
    },
    'selects.7': {
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
    'selects.8': {
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
    'selects.9': {
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
    'selects.10': {
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
    'selects.11': {
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
    'selects.12': {
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
    'selects.13': {
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
    'schema.1': {
      mysql: '',
      postgres: '',
      sqlite3: ''
    },
    'schema.2': {
      mysql: '',
      postgres: '',
      sqlite3: ''
    },
    'schema.3': {
      mysql: '',
      postgres: '',
      sqlite3: ''
    },
    'schema.4': {
      mysql: '',
      postgres: '',
      sqlite3: ''
    },
    'schema.5': {
      mysql: '',
      postgres: '',
      sqlite3: ''
    },
    'schema.6': {
      mysql: '',
      postgres: '',
      sqlite3: ''
    },
    'schema.7': {
      mysql: '',
      postgres: '',
      sqlite3: ''
    },
    'inserts.1': {
      mysql: 1,
      postgres: '',
      sqlite3: ''
    },
    'inserts.2': {
      mysql: 2,
      postgres: '',
      sqlite3: ''
    },
    'inserts.3': {
      mysql: 2,
      postgres: '',
      sqlite3: ''
    },
    'inserts.4': {
      mysql: 1,
      postgres: '',
      sqlite3: ''
    },
    'updates.1': {
      mysql: 1,
      postgres: '',
      sqlite3: ''
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
        updated_at: new Date()
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      }],
      postgres: '',
      sqlite3: ''
    },
    'selects.2': {
      mysql: [{
        first_name: 'User',
        last_name: 'Test'
      }],
      postgres: '',
      sqlite3: ''
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
      postgres: '',
      sqlite3: ''
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
        updated_at: new Date()
      }],
      postgres: '',
      sqlite3: ''
    },
    'selects.5': {
      mysql: [],
      postgres: '',
      sqlite3: ''
    },
    'selects.6': {
      mysql: [],
      postgres: '',
      sqlite3: ''
    },
    'selects.7': {
      mysql: [],
      postgres: '',
      sqlite3: ''
    },
    'selects.8': {
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
      postgres: '',
      sqlite3: ''
    },
    'selects.9': {
      mysql: [],
      postgres: '',
      sqlite3: ''
    },
    'selects.10': {
      mysql: [{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      }],
      postgres: '',
      sqlite3: ''
    },
    'selects.11': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      }],
      postgres: '',
      sqlite3: ''
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
        updated_at: new Date()
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      }],
      postgres: '',
      sqlite3: ''
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
        updated_at: new Date()
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      }],
      postgres: '',
      sqlite3: ''
    },
    'selects.14': {
      mysql: [{
        id: 1,
        first_name: 'User',
        last_name: 'Test',
        email: 'test-updated@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      }],
      postgres: '',
      sqlite3: ''
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
        updated_at: new Date()
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      }],
      postgres: '',
      sqlite3: ''
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
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      }],
      postgres: '',
      sqlite3: ''
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
        details: null
      }],
      postgres: '',
      sqlite3: ''
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
        account_id: null,
        details: null
      }],
      postgres: '',
      sqlite3: ''
    },
    'deletes.1': {
      mysql: '',
      postgres: '',
      sqlite3: ''
    },
    'unions.1': {
      mysql: '',
      postgres: '',
      sqlite3: ''
    }
  }
}