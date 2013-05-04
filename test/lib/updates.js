var Q = require('q');
module.exports = function(Knex, item, handler, type) {

  describe(item, function() {

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