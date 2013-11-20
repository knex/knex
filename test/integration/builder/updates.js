module.exports = function(knex) {

  describe('Updates', function () {

    it('should handle updates', function() {
      return knex('accounts')
        .logMe()
        .where('id', 1)
        .update({
          first_name: 'User',
          last_name: 'Test',
          email:'test100@example.com'
        });
    });

    it('should increment a value', function() {

      return knex('accounts').select('logins').where('id', 1).tap(function() {

        return knex('accounts').where('id', 1).increment('logins');

      }).then(function(attrs1) {

        return knex('accounts').select('logins').where('id', 1).then(function(attrs2) {

          expect(attrs1[0].logins).to.equal(attrs2[0].logins - 1);

        });

      });

    });


    it('should decrement a value', function() {

      return knex('accounts').select('logins').where('id', 1).tap(function() {

        return knex('accounts').where('id', 1).decrement('logins');

      }).then(function(attrs1) {

        return knex('accounts').select('logins').where('id', 1).then(function(attrs2) {

          expect(attrs1[0].logins).to.equal(attrs2[0].logins + 1);

        });

      });

    });

  });

};