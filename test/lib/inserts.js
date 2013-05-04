var Q = require('q');
module.exports = function(Knex, dbName, handler, type) {

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
      }).then(handler(ok), ok).then(function() {

        Knex('test_table_two').insert({
          account_id: 1,
          details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
        }).exec();

      });
    
    });

    it('should handle multi inserts', function (ok) {
    
      Knex('accounts')
        .insert([{
          first_name: 'Test',
          last_name: 'User',
          email:'test@example.com',
          logins: 1,
          about: 'Lorem ipsum Dolore labore incididunt enim.',
          created_at: new Date(),
          updated_at: new Date()
        }, {
          first_name: 'Test',
          last_name: 'User',
          email:'test2@example.com',
          about: 'Lorem ipsum Dolore labore incididunt enim.',
          logins: 2,
          created_at: new Date(),
          updated_at: new Date()
        }]).then(handler(ok), ok);

    });

    it('should take hashes passed into insert and keep them in the correct order', function(ok) {

      Knex('accounts').insert([{
        first_name: 'Test',
        last_name: 'User',
        email:'test2@example.com',
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
        email:'test2@example.com'
      }])
      .then(handler(ok), ok);

    });

    it('should drop any where clause bindings', function(ok) {

      Knex('accounts')
        .where('id', '>', 1)
        .orWhere('x', 2)
        .insert({
          first_name: 'Test',
          last_name: 'User',
          email:'test2@example.com',
          about: 'Lorem ipsum Dolore labore incididunt enim.',
          logins: 2,
          created_at: new Date(),
          updated_at: new Date()
        })
        .then(handler(ok), ok);

    });
  
  });

};