/*global describe, expect, it, d*/

'use strict';

module.exports = function(knex) {

  describe('Updates', function () {

    it('should handle updates', function() {
      return knex('accounts')
        .where('id', 1)
        .update({
          first_name: 'User',
          last_name: 'Test',
          email:'test100@example.com'
        }).testSql(function(tester) {
          tester(
            'mysql',
            'update `accounts` set `first_name` = ?, `last_name` = ?, `email` = ? where `id` = ?',
            ['User','Test','test100@example.com',1],
            1
          );
          tester(
            'postgresql',
            'update "accounts" set "first_name" = ?, "last_name" = ?, "email" = ? where "id" = ?',
            ['User','Test','test100@example.com',1],
            1
          );
          tester(
            'pg-redshift',
            'update "accounts" set "first_name" = ?, "last_name" = ?, "email" = ? where "id" = ?',
            ['User','Test','test100@example.com',1],
            1
          );
          tester(
            'sqlite3',
            'update `accounts` set `first_name` = ?, `last_name` = ?, `email` = ? where `id` = ?',
            ['User','Test','test100@example.com',1],
            1
          );
          tester(
            'mssql',
            'update [accounts] set [first_name] = ?, [last_name] = ?, [email] = ? where [id] = ?;select @@rowcount',
            ['User','Test','test100@example.com',1],
            1
          );
        });
    });

    it('should allow for null updates', function() {
      return knex('accounts')
        .where('id', 1000)
        .update({
          email:'test100@example.com',
          first_name: null,
          last_name: 'Test'
        }).testSql(function(tester) {
          tester(
            'mysql',
            'update `accounts` set `email` = ?, `first_name` = ?, `last_name` = ? where `id` = ?',
            ['test100@example.com', null, 'Test', 1000],
            0
          );
          tester(
            'mssql',
            'update [accounts] set [email] = ?, [first_name] = ?, [last_name] = ? where [id] = ?;select @@rowcount',
            ['test100@example.com', null, 'Test', 1000],
            0
          );
        });
    });

    it('should increment a value', function() {
      return knex('accounts').select('logins').where('id', 1).then(function(accounts) {
        return knex('accounts').where('id', 1).increment('logins').then(function(rowsAffected) {
          expect(rowsAffected).to.equal(1);
          return knex('accounts').select('logins').where('id', 1);
        }).then(function(accounts2) {
          expect(accounts[0].logins + 1).to.equal(accounts2[0].logins);
        });
      });
    });

    it('should increment a negative value', function() {
      return knex('accounts').select('logins').where('id', 1).then(function(accounts) {
        return knex('accounts').where('id', 1).increment('logins', -2).then(function(rowsAffected) {
          expect(rowsAffected).to.equal(1);
          return knex('accounts').select('logins').where('id', 1);
        }).then(function(accounts2) {
          expect(accounts[0].logins - 2).to.equal(accounts2[0].logins);
        });
      });
    });

    it('should decrement a value', function() {
      return knex('accounts').select('logins').where('id', 1).then(function(accounts) {
        return knex('accounts').where('id', 1).decrement('logins').then(function(rowsAffected) {
          expect(rowsAffected).to.equal(1);
          return knex('accounts').select('logins').where('id', 1);
        }).then(function(accounts2) {
          expect(accounts[0].logins - 1).to.equal(accounts2[0].logins);
        });
      });
    });

    it('should decrement a negative value', function() {
      return knex('accounts').select('logins').where('id', 1).then(function(accounts) {
        return knex('accounts').where('id', 1).decrement('logins', -2).then(function(rowsAffected) {
          expect(rowsAffected).to.equal(1);
          return knex('accounts').select('logins').where('id', 1);
        }).then(function(accounts2) {
          expect(accounts[0].logins + 2).to.equal(accounts2[0].logins);
        });
      });
    });

    it('should allow returning for updates in postgresql', function() {

      return knex('accounts').where('id', 1).update({
        email:'test100@example.com',
        first_name: 'UpdatedUser',
        last_name: 'UpdatedTest'
      }, '*').testSql(function(tester) {
        tester(
          'mysql',
          'update `accounts` set `email` = ?, `first_name` = ?, `last_name` = ? where `id` = ?',
          ['test100@example.com','UpdatedUser','UpdatedTest',1],
          1
        );
        tester(
          'postgresql',
          'update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ? returning *',
          ['test100@example.com','UpdatedUser','UpdatedTest',1],
          [{
            id: '1',
            first_name: 'UpdatedUser',
            last_name: 'UpdatedTest',
            email: 'test100@example.com',
            logins: 1,
            about: 'Lorem ipsum Dolore labore incididunt enim.',
            created_at: d,
            updated_at: d,
            phone: null
          }]
        );
        tester(
          'pg-redshift',
          'update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ?',
          ['test100@example.com','UpdatedUser','UpdatedTest',1],
          1
        );
        tester(
          'sqlite3',
          'update `accounts` set `email` = ?, `first_name` = ?, `last_name` = ? where `id` = ?',
          ['test100@example.com','UpdatedUser','UpdatedTest',1],
          1
        );
        tester(
          'oracle',
          'update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ?',
          ['test100@example.com','UpdatedUser','UpdatedTest',1],
          1
        );
        tester(
          'mssql',
          'update [accounts] set [email] = ?, [first_name] = ?, [last_name] = ? output inserted.* where [id] = ?',
          ['test100@example.com','UpdatedUser','UpdatedTest',1],
          [{
            id: '1',
            first_name: 'UpdatedUser',
            last_name: 'UpdatedTest',
            email: 'test100@example.com',
            logins: 1,
            about: 'Lorem ipsum Dolore labore incididunt enim.',
            created_at: d,
            updated_at: d,
            phone: null
          }]
        );
      });

    });

    it('should allow `update from` for updates in postgresql', function () {
      if (knex.client.driverName !== 'postgresql') {
        return this.skip();
      }

      const query = knex('accounts')
        .update({
          first_name: knex.raw('??', ['a.first_name']),
          last_name: knex.raw('??', ['a.last_name'])
        })
        .from(knex.raw(`(values (?, ?, ?)) as ??(??, ??, ??)`, ['test100@example.com', 'UpdatedFromValuesUser', 'UpdatedFromValuesTest', 'a', 'email', 'first_name', 'last_name']))
        .where(knex.raw('?? = ??', ['accounts.email', 'a.email']))
        .returning('*');

      return query.testSql(function (tester) {
        tester(
          'postgresql',
          'update "accounts" set "first_name" = "a"."first_name", "last_name" = "a"."last_name" from (values (?, ?, ?)) as "a"("email", "first_name", "last_name") where "accounts"."email" = "a"."email" returning *',
          ['test100@example.com', 'UpdatedFromValuesUser', 'UpdatedFromValuesTest'],
          [{
            id: '1',
            first_name: 'UpdatedFromValuesUser',
            last_name: 'UpdatedFromValuesTest',
            email: 'test100@example.com',
            logins: 1,
            about: 'Lorem ipsum Dolore labore incididunt enim.',
            created_at: d,
            updated_at: d,
            phone: null
          }]
        );
      });
    });
  });

};
