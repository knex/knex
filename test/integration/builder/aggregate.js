var when = require("when");

module.exports = function(knex) {

  describe('Aggregate', function() {

    it('has a sum', function() {

      return knex('accounts').logMe().sum('logins');

    });

    it('has a count', function() {

      return knex('accounts').logMe().count('id');

    });

    it("support the groupBy function", function() {

      return knex('accounts').logMe().count('id').groupBy('logins').then(function() {
        return knex('accounts').logMe().count('id').groupBy('first_name');
      });

    });


  });


};
