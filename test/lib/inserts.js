var Q = require('q');
module.exports = function(Knex, item, handler) {
  
  describe(item, function() {

    it("should handle simple inserts", function(ok) {
      
      Knex('accounts').insert({
        first_name: 'Test',
        last_name: 'User',
        email:'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date()
      }).then(handler(ok), ok);
    
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

    it('should drop any where clauses', function(ok) {

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