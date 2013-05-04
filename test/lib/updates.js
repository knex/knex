var Q = require('q');
module.exports = function(Knex, dbName, handler, type) {

  describe(dbName, function() {

    it('should handle updates', function(ok) {
      
      Knex('accounts')
        .where('id', 1)
        .update({
          first_name: 'User',
          last_name: 'Test',
          email:'test-updated@example.com'
        })
        .then(handler(ok), ok);
      
    });

  });

};