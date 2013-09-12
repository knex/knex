module.exports = function(knex) {

  describe('updates', function () {

    it('should handle updates', function(ok) {
      return knex('accounts')
        .where('id', 1)
        .update({
          first_name: 'User',
          last_name: 'Test',
          email:'test100@example.com'
        });
    });

  });

};