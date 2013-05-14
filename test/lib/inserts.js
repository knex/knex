
module.exports = function(Knex, dbName, resolver) {

  describe(dbName, function() {

    it("should handle simple inserts", function(ok) {
      
      Knex('accounts').insert({
        first_name: 'Test',
        last_name: 'User',
        email:'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      }).then(resolver(ok), ok);
    
    });

    it('should allow for using the `exec` interface', function(ok) {
      
      Knex('test_table_two').insert([{
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
      }]).exec(function(err, resp) {
        if (err) return ok(err);
        ok();
      });
    
    });

    it('should handle multi inserts', function (ok) {
    
      Knex('accounts')
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
        }]).then(resolver(ok), ok);

    });

    it('should take hashes passed into insert and keep them in the correct order', function(ok) {

      Knex('accounts').insert([{
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
      }])
      .then(resolver(ok), ok);

    });

    it('will fail when multple inserts are made into a unique column', function(ok) {

      Knex('accounts')
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
        })
        .then(ok, function() {
          ok();
        });

    });

    it('should drop any where clause bindings', function(ok) {

      Knex('accounts')
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
        })
        .then(resolver(ok), ok);

    });
  
  });

};