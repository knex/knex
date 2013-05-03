module.exports = {
  'schema.1': {
    mysql: [{
      sql: 'create table `test_table` (`id` int(11) not null auto_increment primary key, `first_name` varchar(255) not null, `last_name` varchar(255) not null, `email` varchar(255) null, `logins` int(11) not null default \'1\', `about` text not null, `created_at` timestamp default 0 not null, `updated_at` timestamp default 0 not null)'
    },{
      sql: 'alter table `test_table` add index test_table_logins_index(`logins`)'
    }],
    sqlite3: [{
      sql: 'create table "test_table" ("id" integer null primary key autoincrement, "first_name" varchar null, "last_name" varchar null, "email" varchar null, "logins" integer null default \'1\', "about" text null, "created_at" datetime null, "updated_at" datetime null)'
    },{
      sql: 'create index test_table_logins_index on "test_table" ("logins")'
    }],
    postgres: [{
      sql: 'create table "test_table" ("id" serial primary key not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "email" varchar(255) null, "logins" integer not null default \'1\', "about" text not null, "created_at" timestamp not null, "updated_at" timestamp not null)'
    },{
      sql: 'create index test_table_logins_index on "test_table" ("logins")'
    }]
  },
  'schema.2': {
    mysql: [{
      sql: 'drop table `accounts`'
    }],
    sqlite3: [{
      sql: 'drop table "accounts"'
    }],
    postgres: [{
      sql: 'drop table "accounts"'
    }]
  },
  'schema.3': {
    mysql: [{
      sql: 'drop table if exists `other_accounts`'
    }],
    sqlite3: [{
      sql: 'drop table if exists "other_accounts"'
    }],
    postgres: [{
      sql: 'drop table if exists "other_accounts"'
    }]
  },
  'schema.4': {
    mysql: {
      sql: 'select * from information_schema.tables where table_schema = ? and table_name = ?',
      bindings: ['users']
    },
    sqlite3: {
      sql: 'select * from sqlite_master where type = \'table\' and name = ?',
      bindings: ['users']
    },
    postgres: {
      sql: 'select * from information_schema.tables where table_name = ?',
      bindings: ['users']
    }
  },
  'schema.5': {
    mysql: [{
      sql: 'rename table `accounts` to `new_accounts`'
    }],
    sqlite3: [{
      sql: 'alter table "accounts" rename to "new_accounts"'
    }],
    postgres: [{
      sql: 'alter table "accounts" rename to "new_accounts"'
    }]
  },
  'inserts.1': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  },
  'inserts.2': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  },
  'inserts.3': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  },
  'inserts.4': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  },
  'updates.1': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  },
  'selects.1': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  },
  'selects.2': {
    mysql: [undefined,undefined,undefined,undefined,undefined,undefined],
    sqlite3: [undefined,undefined,undefined,undefined,undefined,undefined],
    postgres: [undefined,undefined,undefined,undefined,undefined,undefined]
  },
  'selects.3': {
    mysql: [undefined],
    sqlite3: [undefined],
    postgres: [undefined]
  },
  'selects.4': {
    mysql: [undefined],
    sqlite3: [undefined],
    postgres: [undefined]
  },
  'selects.5': {
    mysql: [undefined],
    sqlite3: [undefined],
    postgres: [undefined]
  },
  'selects.6': {
    mysql: [undefined],
    sqlite3: [undefined],
    postgres: [undefined]
  },
  'selects.7': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  },
  'selects.8': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  },
  'selects.9': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  },
  'selects.10': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  },
  'selects.11': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  },
  'selects.12': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  },
  'deletes.1': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  },
  'unions.1': {
    mysql: undefined,
    sqlite3: undefined,
    postgres: undefined
  }
}