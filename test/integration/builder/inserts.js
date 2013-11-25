var uuid = require('node-uuid');

module.exports = function(knex) {

  describe('Inserts', function() {

    it("should handle simple inserts", function() {

      return knex('accounts').logMe().insert({
        first_name: 'Test',
        last_name: 'User',
        email:'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      }, 'id');

    });

    it('should handle multi inserts', function() {

      return knex('accounts')
        .logMe()
        .insert([{
          first_name: 'Test',
          last_name: 'User',
          email:'test2@example.com',
          logins: 1,
          about: 'Lorem ipsum Dolore labore incididunt enim.',
          created_at: new Date(),
          updated_at: new Date()
        }, {
          first_name: 'Test',
          last_name: 'User',
          email:'test3@example.com',
          about: 'Lorem ipsum Dolore labore incididunt enim.',
          logins: 2,
          created_at: new Date(),
          updated_at: new Date()
        }], 'id');

    });

    it('should allow for using the `exec` interface', function(ok) {

      knex('test_table_two').insert([{
        account_id: 1,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 0
      }, {
        account_id: 2,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 1
      }, {
        account_id: 3,
        details: '',
        status: 1
      }], 'id').exec(function(err, resp) {
        if (err) return ok(err);
        ok();
      });

    });

    it('should take hashes passed into insert and keep them in the correct order', function() {

      return knex('accounts').logMe().insert([{
        first_name: 'Test',
        last_name: 'User',
        email:'test4@example.com',
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        logins: 2,
        created_at: new Date(),
        updated_at: new Date()
      },{
        first_name: 'Test',
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        logins: 2,
        created_at: new Date(),
        updated_at: new Date(),
        last_name: 'User',
        email:'test5@example.com'
      }], 'id');

    });

    it('will fail when multple inserts are made into a unique column', function() {

      return knex('accounts')
        .logMe()
        .where('id', '>', 1)
        .orWhere('x', 2)
        .insert({
          first_name: 'Test',
          last_name: 'User',
          email:'test5@example.com',
          about: 'Lorem ipsum Dolore labore incididunt enim.',
          logins: 2,
          created_at: new Date(),
          updated_at: new Date()
        }, 'id').then(function() {
          throw new Error('There should be a fail when multi-insert are made in unique col.');
        }, function() {});

    });

    it('should drop any where clause bindings', function() {

      return knex('accounts')
        .logMe()
        .where('id', '>', 1)
        .orWhere('x', 2)
        .insert({
          first_name: 'Test',
          last_name: 'User',
          email:'test6@example.com',
          about: 'Lorem ipsum Dolore labore incididunt enim.',
          logins: 2,
          created_at: new Date(),
          updated_at: new Date()
        }, 'id');

    });

    it('should not allow inserting invalid values into enum fields', function() {

      return knex('datatype_test')
        .logMe()
        .insert({'enum_value': 'd'})
        .then(function() {
          // No errors happen in sqlite3, which doesn't have native support
          // for the enum type.
          if (knex.client.dialect !== 'sqlite3') {
            throw new Error('There should be an error for invalid enum inserts');
          }
        }, function() {});

    });

    it('should not allow invalid uuids in postgresql', function() {

      return knex('datatype_test')
        .insert({
          enum_value: 'c',
          uuid: uuid.v4()
        }).then(function() {
          return knex('datatype_test').insert({enum_value: 'c', uuid: 'test'});
        }).then(function() {
          // No errors happen in sqlite3 or mysql, which dont have native support
          // for the uuid type.
          if (knex.client.dialect === 'postgresql') {
            throw new Error('There should be an error in postgresql for uuids');
          }
        }, function() {});

    });

    it('should not mutate the array passed in', function() {

      var a = {enum_value: 'a', uuid: uuid.v4()};
      var b = {enum_value: 'c', uuid: uuid.v4()};
      var x = [a, b];

      return knex('datatype_test')
        .insert(x)
        .then(function() {
          expect(x).to.eql([a, b]);
        });
    });

    it('should handle empty inserts', function() {

      return knex.schema.createTable('test_default_table', function(qb) {
        qb.increments().primary();
        qb.string('string').defaultTo('hello');
        qb.tinyint('tinyint').defaultTo(0);
        qb.text('text').nullable();
      }).then(function() {
        return knex('test_default_table').logMe().insert({}, 'id');
      });

    });

  });

};