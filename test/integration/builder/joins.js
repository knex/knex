module.exports = function(knex) {

  describe('Joins', function() {

    it('uses inner join by default', function() {
      return knex('accounts')
        .join('test_table_two', 'accounts.id', '=', 'test_table_two.account_id')
        .select('accounts.*', 'test_table_two.details')
        .testSql(function(tester) {
          tester(
            'mysql',
            'select `accounts`.*, `test_table_two`.`details` from `accounts` inner join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id`', [], [{
              id: 1,
              first_name: 'Test',
              last_name: 'User',
              email: 'test@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
            }, {
              id: 2,
              first_name: 'Test',
              last_name: 'User',
              email: 'test2@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
            }, {
              id: 3,
              first_name: 'Test',
              last_name: 'User',
              email: 'test3@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: ''
            }]
          );

          tester(
            'postgresql',
            'select "accounts".*, "test_table_two"."details" from "accounts" inner join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"', [], [{
              id: '1',
              first_name: 'Test',
              last_name: 'User',
              email: 'test@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
            }, {
              id: '2',
              first_name: 'Test',
              last_name: 'User',
              email: 'test2@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
            }, {
              id: '3',
              first_name: 'Test',
              last_name: 'User',
              email: 'test3@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: ''
            }]
          );
          tester(
            'sqlite3',
            'select "accounts".*, "test_table_two"."details" from "accounts" inner join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"', [], [{
              id: 1,
              first_name: 'Test',
              last_name: 'User',
              email: 'test@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
            }, {
              id: 2,
              first_name: 'Test',
              last_name: 'User',
              email: 'test2@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
            }, {
              id: 3,
              first_name: 'Test',
              last_name: 'User',
              email: 'test3@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: ''
            }]
          );
        });
    });

    it('has a leftJoin method parameter to specify the join type', function() {
      return knex('accounts')
        .leftJoin('test_table_two', 'accounts.id', '=', 'test_table_two.account_id')
        .select('accounts.*', 'test_table_two.details')
        .testSql(function(tester) {
          tester(
            'mysql',
            'select `accounts`.*, `test_table_two`.`details` from `accounts` left join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id`', [], [{
              id: 1,
              first_name: 'Test',
              last_name: 'User',
              email: 'test@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
            }, {
              id: 2,
              first_name: 'Test',
              last_name: 'User',
              email: 'test2@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
            }, {
              id: 3,
              first_name: 'Test',
              last_name: 'User',
              email: 'test3@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: ''
            }, {
              id: 4,
              first_name: 'Test',
              last_name: 'User',
              email: 'test4@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: null
            }, {
              id: 5,
              first_name: 'Test',
              last_name: 'User',
              email: 'test5@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: null
            }, {
              id: 7,
              first_name: 'Test',
              last_name: 'User',
              email: 'test6@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: null
            }]
          );
          tester(
            'postgresql',
            'select "accounts".*, "test_table_two"."details" from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"', [], [{
              id: '1',
              first_name: 'Test',
              last_name: 'User',
              email: 'test@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
            }, {
              id: '2',
              first_name: 'Test',
              last_name: 'User',
              email: 'test2@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
            }, {
              id: '3',
              first_name: 'Test',
              last_name: 'User',
              email: 'test3@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: ''
            }, {
              id: '5',
              first_name: 'Test',
              last_name: 'User',
              email: 'test5@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: null
            }, {
              id: '4',
              first_name: 'Test',
              last_name: 'User',
              email: 'test4@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: null
            }, {
              id: '7',
              first_name: 'Test',
              last_name: 'User',
              email: 'test6@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: null
            }]
          );
          tester(
            'sqlite3',
            'select "accounts".*, "test_table_two"."details" from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id"', [], [{
              id: 1,
              first_name: 'Test',
              last_name: 'User',
              email: 'test@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
            }, {
              id: 2,
              first_name: 'Test',
              last_name: 'User',
              email: 'test2@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
            }, {
              id: 3,
              first_name: 'Test',
              last_name: 'User',
              email: 'test3@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: ''
            }, {
              id: 4,
              first_name: 'Test',
              last_name: 'User',
              email: 'test4@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: null
            }, {
              id: 5,
              first_name: 'Test',
              last_name: 'User',
              email: 'test5@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: null
            }, {
              id: 6,
              first_name: 'Test',
              last_name: 'User',
              email: 'test6@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              details: null
            }]
          );
        });
    });

    it('accepts a callback as the second argument for advanced joins', function() {
      return knex('accounts').leftJoin('test_table_two', function(join) {
        join.on('accounts.id', '=', 'test_table_two.account_id');
        join.orOn('accounts.email', '=', 'test_table_two.details');
      })
        .select()
        .testSql(function(tester) {
          tester(
            'mysql',
            'select * from `accounts` left join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id` or `accounts`.`email` = `test_table_two`.`details`', [], [{
              id: 1,
              first_name: 'Test',
              last_name: 'User',
              email: 'test@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: 1,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              status: 0,
              json_data: null
            }, {
              id: 2,
              first_name: 'Test',
              last_name: 'User',
              email: 'test2@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: 2,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              status: 1,
              json_data: null
            }, {
              id: 3,
              first_name: 'Test',
              last_name: 'User',
              email: 'test3@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: 3,
              details: '',
              status: 1,
              json_data: null
            }, {
              id: null,
              first_name: 'Test',
              last_name: 'User',
              email: 'test4@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: null,
              details: null,
              status: null,
              json_data: null
            }, {
              id: null,
              first_name: 'Test',
              last_name: 'User',
              email: 'test5@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: null,
              details: null,
              status: null,
              json_data: null
            }, {
              id: null,
              first_name: 'Test',
              last_name: 'User',
              email: 'test6@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: null,
              details: null,
              status: null,
              json_data: null
            }]
          );
          tester(
            'postgresql',
            'select * from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" or "accounts"."email" = "test_table_two"."details"', [], [{
              id: 1,
              first_name: 'Test',
              last_name: 'User',
              email: 'test@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: 1,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              status: 0,
              json_data: null
            }, {
              id: 2,
              first_name: 'Test',
              last_name: 'User',
              email: 'test2@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: 2,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              status: 1,
              json_data: null
            }, {
              id: 3,
              first_name: 'Test',
              last_name: 'User',
              email: 'test3@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: 3,
              details: '',
              status: 1,
              json_data: null
            }, {
              id: null,
              first_name: 'Test',
              last_name: 'User',
              email: 'test4@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: null,
              details: null,
              status: null,
              json_data: null
            }, {
              id: null,
              first_name: 'Test',
              last_name: 'User',
              email: 'test5@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: null,
              details: null,
              status: null,
              json_data: null
            }, {
              id: null,
              first_name: 'Test',
              last_name: 'User',
              email: 'test6@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: null,
              details: null,
              status: null,
              json_data: null
            }]
          );
          tester(
            'sqlite3',
            'select * from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" or "accounts"."email" = "test_table_two"."details"', [], [{
              id: 1,
              first_name: 'Test',
              last_name: 'User',
              email: 'test@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: 1,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              status: 0,
              json_data: null
            }, {
              id: 2,
              first_name: 'Test',
              last_name: 'User',
              email: 'test2@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: 2,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              status: 1,
              json_data: null
            }, {
              id: 3,
              first_name: 'Test',
              last_name: 'User',
              email: 'test3@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: 3,
              details: '',
              status: 1,
              json_data: null
            }, {
              id: null,
              first_name: 'Test',
              last_name: 'User',
              email: 'test4@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: null,
              details: null,
              status: null,
              json_data: null
            }, {
              id: null,
              first_name: 'Test',
              last_name: 'User',
              email: 'test5@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: null,
              details: null,
              status: null,
              json_data: null
            }, {
              id: null,
              first_name: 'Test',
              last_name: 'User',
              email: 'test6@example.com',
              logins: 2,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null,
              account_id: null,
              details: null,
              status: null,
              json_data: null
            }]
          );
        });
    });

    it('supports join aliases', function() {
      //Expected output: all pairs of account emails, excluding pairs where the emails are the same.
      return knex('accounts')
        .join('accounts as a2', 'a2.email', '<>', 'accounts.email')
        .select(['accounts.email as e1', 'a2.email as e2'])
        .where('a2.email', 'test2@example.com')
        .orderBy('e1')
        .limit(5)
        .testSql(function(tester) {
          tester(
            'mysql',
            'select `accounts`.`email` as `e1`, `a2`.`email` as `e2` from `accounts` inner join `accounts` as `a2` on `a2`.`email` <> `accounts`.`email` where `a2`.`email` = ? order by `e1` asc limit ?',
            ['test2@example.com', 5],
            [{
              e1: 'test3@example.com',
              e2: 'test2@example.com'
            }, {
              e1: 'test4@example.com',
              e2: 'test2@example.com'
            }, {
              e1: 'test5@example.com',
              e2: 'test2@example.com'
            }, {
              e1: 'test6@example.com',
              e2: 'test2@example.com'
            }, {
              e1: 'test@example.com',
              e2: 'test2@example.com'
            }]
          );
          tester(
            'postgresql',
            'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "a2"."email" <> "accounts"."email" where "a2"."email" = ? order by "e1" asc limit ?',
            ['test2@example.com', 5],
            [{
              e1: 'test3@example.com',
              e2: 'test2@example.com'
            }, {
              e1: 'test4@example.com',
              e2: 'test2@example.com'
            }, {
              e1: 'test5@example.com',
              e2: 'test2@example.com'
            }, {
              e1: 'test6@example.com',
              e2: 'test2@example.com'
            }, {
              e1: 'test@example.com',
              e2: 'test2@example.com'
            }]
          );
          tester(
            'sqlite3',
            'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "a2"."email" <> "accounts"."email" where "a2"."email" = ? order by "e1" collate nocase asc limit ?',
            ['test2@example.com', 5],
            [{
              e1: 'test3@example.com',
              e2: 'test2@example.com'
            }, {
              e1: 'test4@example.com',
              e2: 'test2@example.com'
            }, {
              e1: 'test5@example.com',
              e2: 'test2@example.com'
            }, {
              e1: 'test6@example.com',
              e2: 'test2@example.com'
            }, {
              e1: 'test@example.com',
              e2: 'test2@example.com'
            }]
          );
        });
    });

    it('supports join aliases with advanced joins', function() {
      //Expected output: all pairs of account emails, excluding pairs where the emails are the same.
      //But also include the case where the emails are the same, for account 2.
      return knex('accounts')
        .join('accounts as a2', function() {
          this.on('accounts.email', '<>', 'a2.email').orOn('accounts.id', '=', 2);
        })
        .where('a2.email', 'test2@example.com')
        .select(['accounts.email as e1', 'a2.email as e2'])
        .limit(5)
        .testSql(function(tester) {
          tester(
            'mysql',
            'select `accounts`.`email` as `e1`, `a2`.`email` as `e2` from `accounts` inner join `accounts` as `a2` on `accounts`.`email` <> `a2`.`email` or `accounts`.`id` = 2 where `a2`.`email` = ? limit ?',
            ['test2@example.com', 5],
            [{
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
          );
          tester(
            'postgresql',
            'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "accounts"."email" <> "a2"."email" or "accounts"."id" = 2 where "a2"."email" = ? limit ?',
            ['test2@example.com', 5],
            [{
                e1: 'test@example.com',
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
            }]
          );
          tester(
            'sqlite3',
            'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "accounts"."email" <> "a2"."email" or "accounts"."id" = 2 where "a2"."email" = ? limit ?',
            ['test2@example.com', 5],
            [{
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
          );
        });
    });

    it('supports joins with overlapping column names', function() {
      return knex('accounts as a1')
        .leftJoin('accounts as a2', function() {
          this.on('a1.email', '<>', 'a2.email');
        })
        .select(['a1.email', 'a2.email'])
        .where(knex.raw('a1.id = 1'))
        .options({
          nestTables: true,
          rowMode: 'array'
        })
        .limit(2)
        .testSql(function(tester) {
          tester(
            'mysql',
            'select `a1`.`email`, `a2`.`email` from `accounts` as `a1` left join `accounts` as `a2` on `a1`.`email` <> `a2`.`email` where a1.id = 1 limit ?',
            [2],
            [{
              a1: {
                email: 'test@example.com'
              },
              a2: {
                email: 'test2@example.com'
              }
            },{
              a1: {
                email: 'test@example.com'
              },
              a2: {
                email: 'test3@example.com'
              }
            }]
          );
          tester(
            'postgres',
            'select "a1"."email", "a2"."email" from "accounts" as "a1" left join "accounts" as "a2" on "a1"."email" <> "a2"."email" where a1.id = 1 limit ?',
            [2],
            [{
              0: 'test@example.com',
              1: 'test2@example.com'
            },{
              0: 'test@example.com',
              1: 'test3@example.com'
            }]
          );
          tester(
            'sqlite3',
            'select "a1"."email", "a2"."email" from "accounts" as "a1" left join "accounts" as "a2" on "a1"."email" <> "a2"."email" where a1.id = 1 limit ?',
            [2],
            [{
              email: 'test2@example.com'
            },{
              email: 'test3@example.com'
            }]
          );
        });
    });

  });

};