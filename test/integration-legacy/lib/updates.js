
module.exports = function(Knex, dbName, resolver) {

  describe(dbName, function() {

    it('should handle updates', function(ok) {
      
      Knex('accounts')
        .where('id', 1)
        .update({
          first_name: 'User',
          last_name: 'Test',
          email:'test100@example.com'
        })
        .then(resolver(ok), ok);
      
    });

  });

};