module.exports = {
  'uses inner join by default': {
    mysql: {
      bindings: [],
      sql: 'select `accounts`.*, `test_table_two`.`details` from `accounts` inner join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id`',
      result: [{
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
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
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: ''
      }]
    },
    postgresql: {
      bindings: [],
      sql: 'select "accounts".*, "test_table_two"."details" from "accounts" inner join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"',
      result: [{
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
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
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: ''
      }]
    },
    sqlite3: {
      bindings: [],
      sql: 'select "accounts".*, "test_table_two"."details" from "accounts" inner join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"',
      result: [{
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1379006972474,
        updated_at: 1379006972474,
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1379006972476,
        updated_at: 1379006972476,
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1379006972476,
        updated_at: 1379006972476,
        phone: null,
        details: ''
      }]
    }
  },
  'takes a fifth parameter to specify the join type': {
    mysql: {
      bindings: [],
      sql: 'select `accounts`.*, `test_table_two`.`details` from `accounts` left join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id`',
      result: [{
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
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
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: ''
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
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
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      }]
    },
    postgresql: {
      bindings: [],
      sql: 'select "accounts".*, "test_table_two"."details" from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"',
      result: [{
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
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
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: ''
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
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
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      },{
        id: 7,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        details: null
      }]
    },
    sqlite3: {
      bindings: [],
      sql: 'select "accounts".*, "test_table_two"."details" from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"',
      result: [{
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1379006972474,
        updated_at: 1379006972474,
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1379006972476,
        updated_at: 1379006972476,
        phone: null,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
      },{
        id: 3,
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1379006972476,
        updated_at: 1379006972476,
        phone: null,
        details: ''
      },{
        id: 4,
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1379006972477,
        updated_at: 1379006972477,
        phone: null,
        details: null
      },{
        id: 5,
        first_name: 'Test',
        last_name: 'User',
        email: 'test5@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1379006972477,
        updated_at: 1379006972477,
        phone: null,
        details: null
      },{
        id: 6,
        first_name: 'Test',
        last_name: 'User',
        email: 'test6@example.com',
        logins: 2,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1379006972479,
        updated_at: 1379006972479,
        phone: null,
        details: null
      }]
    }
  },
  'accepts a callback as the second argument for advanced joins': {
    mysql: {
      bindings: [],
      sql: 'select * from `accounts` left join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id` or `accounts`.`email` = `test_table_two`.`details`',
      result: [{
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
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
        created_at: new Date(),
        updated_at: new Date(),
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
        created_at: new Date(),
        updated_at: new Date(),
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
        created_at: new Date(),
        updated_at: new Date(),
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
        created_at: new Date(),
        updated_at: new Date(),
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
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: null,
        details: null,
        status: null,
        json_data: null
      }]
    },
    postgresql: {
      bindings: [],
      sql: 'select * from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" or "accounts"."email" = "test_table_two"."details"',
      result: [{
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
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
        created_at: new Date(),
        updated_at: new Date(),
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
        created_at: new Date(),
        updated_at: new Date(),
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
        created_at: new Date(),
        updated_at: new Date(),
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
        created_at: new Date(),
        updated_at: new Date(),
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
        created_at: new Date(),
        updated_at: new Date(),
        phone: null,
        account_id: null,
        details: null,
        status: null,
        json_data: null
      }]
    },
    sqlite3: {
      bindings: [],
      sql: 'select * from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" or "accounts"."email" = "test_table_two"."details"',
      result: [{
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: 1379006972474,
        updated_at: 1379006972474,
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
        created_at: 1379006972476,
        updated_at: 1379006972476,
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
        created_at: 1379006972476,
        updated_at: 1379006972476,
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
        created_at: 1379006972477,
        updated_at: 1379006972477,
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
        created_at: 1379006972477,
        updated_at: 1379006972477,
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
        created_at: 1379006972479,
        updated_at: 1379006972479,
        phone: null,
        account_id: null,
        details: null,
        status: null,
        json_data: null
      }]
    }
  },
  'supports join aliases': {
    mysql: {
      bindings: [],
      sql: 'select `accounts`.`email` as `e1`, `a2`.`email` as `e2` from `accounts` inner join `accounts` as `a2` on `a2`.`email` <> `accounts`.`email` limit 5',
      result: [{
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
        e1: 'test@example.com',
        e2: 'test2@example.com'
      }]
    },
    postgresql: {
      bindings: [],
      sql: 'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "a2"."email" <> "accounts"."email" limit 5',
      result: [{
        e1: 'test@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test@example.com',
        e2: 'test6@example.com'
      }]
    },
    sqlite3: {
      bindings: [],
      sql: 'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "a2"."email" <> "accounts"."email" limit 5',
      result: [{
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
        e2: 'test@example.com'
      }]
    }
  },
  'supports join aliases with advanced joins': {
    mysql: {
      bindings: [],
      sql: 'select `accounts`.`email` as `e1`, `a2`.`email` as `e2` from `accounts` inner join `accounts` as `a2` on `accounts`.`email` <> `a2`.`email` or `accounts`.`id` = 2 limit 5',
      result: [{
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
      }]
    },
    postgresql: {
      bindings: [],
      sql: 'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "accounts"."email" <> "a2"."email" or "accounts"."id" = 2 limit 5',
      result: [{
        e1: 'test@example.com',
        e2: 'test2@example.com'
      },{
        e1: 'test@example.com',
        e2: 'test3@example.com'
      },{
        e1: 'test@example.com',
        e2: 'test4@example.com'
      },{
        e1: 'test@example.com',
        e2: 'test5@example.com'
      },{
        e1: 'test@example.com',
        e2: 'test6@example.com'
      }]
    },
    sqlite3: {
      bindings: [],
      sql: 'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "accounts"."email" <> "a2"."email" or "accounts"."id" = 2 limit 5',
      result: [{
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
      }]
    }
  }
};