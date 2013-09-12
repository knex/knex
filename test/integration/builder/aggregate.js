var when = require("when");

module.exports = function(knex) {

  describe('aggregate', function() {

    it('has a sum', function() {

      return knex('accounts').sum('logins');

    });

    it('has a count', function() {

      return knex('accounts').count('id');

    });

    it("support the groupBy function", function() {

      return when.all([
        knex('accounts').count('id').groupBy('logins'),
        knex('accounts').count('id').groupBy('first_name')
      ]);

    });


  });


};
