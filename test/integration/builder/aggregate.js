module.exports = function(knex) {

  describe('Aggregate', function() {

    it('has a sum', function() {

      return knex('accounts').logMe().sum('logins');

    });

    it('has a count', function() {

      return knex('accounts').logMe().count('id');

    });

    it('supports multiple aggregate functions', function() {

      return knex('accounts').logMe().count('id').max('logins').min('logins');

    });

    it("support the groupBy function", function() {

      return knex('accounts').logMe().count('id').groupBy('logins').then(function() {
        return knex('accounts').logMe().count('id').groupBy('first_name');
      });

    });


  });


};
