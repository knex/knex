var when = require("when");

module.exports = function(knex) {

  describe('aggregate', function() {

    it('has a sum', function(ok) {

      return Knex('accounts').sum('logins');

    });

    it('has a count', function(ok) {

      return Knex('accounts').count('id');

    });

    it("support the groupBy function", function(ok) {
        when.all([
          Knex('accounts').count('id').groupBy('logins'),
          Knex('accounts').count('id').groupBy('first_name')
        ]).then(resolver(ok, true), ok);
    });



  });


};
