module.exports = {
  'should handle simple inserts': {
    mysql: {
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date()],
      sql: 'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?)',
      result: [1]
    },
    postgresql: {
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date()],
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?) returning "id"',
      result: ['1']
    },
    sqlite3: {
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test@example.com','Test','User',1,new Date()],
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?)',
      result: [1]
    }
  },
  'should handle multi inserts': {
    mysql: {
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',1,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test3@example.com','Test','User',2,new Date()],
      sql: 'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)',
      result: [2]
    },
    postgresql: {
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',1,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test3@example.com','Test','User',2,new Date()],
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?) returning "id"',
      result: ['2','3']
    },
    sqlite3: {
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test2@example.com','Test','User',1,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test3@example.com','Test','User',2,new Date()],
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at" union all select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at"',
      result: [3]
    }
  },
  'should take hashes passed into insert and keep them in the correct order': {
    mysql: {
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test4@example.com','Test','User',2,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test5@example.com','Test','User',2,new Date()],
      sql: 'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)',
      result: [4]
    },
    postgresql: {
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test4@example.com','Test','User',2,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test5@example.com','Test','User',2,new Date()],
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?) returning "id"',
      result: ['4','5']
    },
    sqlite3: {
      bindings: ['Lorem ipsum Dolore labore incididunt enim.',new Date(),'test4@example.com','Test','User',2,new Date(),'Lorem ipsum Dolore labore incididunt enim.',new Date(),'test5@example.com','Test','User',2,new Date()],
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at" union all select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at"',
      result: [5]
    }
  },
  'will fail when multple inserts are made into a unique column': {
    mysql: {
      bindings: ['test5@example.com','Test','User',2,new Date()],
      sql: 'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?)'
    },
    postgresql: {
      bindings: ['test5@example.com','Test','User',2,new Date()],
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?) returning "id"'
    },
    sqlite3: {
      bindings: ['test5@example.com','Test','User',2,new Date()],
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?)'
    }
  },
  'should drop any where clause bindings': {
    mysql: {
      bindings: ['test6@example.com','Test','User',2,new Date()],
      sql: 'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?)',
      result: [7]
    },
    postgresql: {
      bindings: ['test6@example.com','Test','User',2,new Date()],
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?) returning "id"',
      result: ['7']
    },
    sqlite3: {
      bindings: ['test6@example.com','Test','User',2,new Date()],
      sql: 'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?)',
      result: [6]
    }
  },
  'should not allow inserting invalid values into enum fields': {
    mysql: {
      bindings: ['d'],
      sql: 'insert into `datatype_test` (`enum_value`) values (?)'
    },
    postgresql: {
      bindings: ['d'],
      sql: 'insert into "datatype_test" ("enum_value") values (?)'
    },
    sqlite3: {
      bindings: ['d'],
      sql: 'insert into "datatype_test" ("enum_value") values (?)',
      result: [1]
    }
  },
  'should handle empty inserts': {
    mysql: {
      bindings: [],
      sql: 'insert into `test_default_table` () values ()',
      result: [1]
    },
    postgresql: {
      bindings: [],
      sql: 'insert into "test_default_table" default values returning "id"',
      result: [1]
    },
    sqlite3: {
      bindings: [],
      sql: 'insert into "test_default_table" default values',
      result: [1]
    }
  },
  'should take an array of columns to return in postgres': {
    mysql: {
      bindings: [10,'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',0],
      sql: 'insert into `test_table_two` (`account_id`, `details`, `status`) values (?, ?, ?)',
      result: [4]
    },
    postgresql: {
      bindings: [10,'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',0],
      sql: 'insert into "test_table_two" ("account_id", "details", "status") values (?, ?, ?) returning "account_id","details"',
      result: [{
        account_id: 10,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      }]
    },
    sqlite3: {
      bindings: [10,'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',0],
      sql: 'insert into "test_table_two" ("account_id", "details", "status") values (?, ?, ?)',
      result: [4]
    }
  },
  'should allow a * for returning in postgres': {
    mysql: {
      bindings: [10,'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',0],
      sql: 'insert into `test_table_two` (`account_id`, `details`, `status`) values (?, ?, ?)',
      result: [5]
    },
    postgresql: {
      bindings: [10,'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',0],
      sql: 'insert into "test_table_two" ("account_id", "details", "status") values (?, ?, ?) returning *',
      result: [{
        id: 5,
        account_id: 10,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 0,
        json_data: null
      }]
    },
    sqlite3: {
      bindings: [10,'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',0],
      sql: 'insert into "test_table_two" ("account_id", "details", "status") values (?, ?, ?)',
      result: [5]
    }
  }
};