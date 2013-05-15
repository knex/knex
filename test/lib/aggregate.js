var When = require("when");

module.exports = function(Knex, dbName, resolver) {

  it('has a sum', function(ok) {

    Knex('accounts')
      .sum('logins')
      .then(resolver(ok), ok);

  });

  it('has a count', function(ok) {
      Knex('accounts').count('id').then(resolver(ok), ok);
  });

  it("support the groupBy function", function(ok) {
      When.all([
        Knex('accounts').count('id').groupBy('logins'),
        Knex('accounts').count('id').groupBy('first_name')
      ]).then(resolver(ok, true), ok);
  });

};
