
module.exports = function(Knex, dbName, resolver) {

  describe(dbName, function() {

    it('uses inner join by default', function(ok) {
      Knex('accounts')
        .join('test_table_two', 'accounts.id', '=', 'test_table_two.account_id')
        .select('accounts.*', 'test_table_two.details')
        .then(resolver(ok), ok);
    });

    it('takes a fifth parameter to specify the join type', function(ok) {
      Knex('accounts')
        .join('test_table_two', 'accounts.id', '=', 'test_table_two.account_id', 'left')
        .select('accounts.*', 'test_table_two.details')
        .then(resolver(ok), ok);
    });

    it('accepts a callback as the second argument for advanced joins', function(ok) {
      Knex('accounts').join('test_table_two', function(join) {
        join.on('accounts.id', '=', 'test_table_two.account_id');
        join.orOn('accounts.email', '=', 'test_table_two.details');
      }, 'left')
      .select()
      .then(resolver(ok), ok);
    });

    it('supports join aliases', function(ok) {
        //Expected output: all pairs of account emails, excluding pairs where the emails are the same.
        Knex('accounts')
            .join('accounts as a2', 'a2.email', '<>', 'accounts.email')
            .select(['accounts.email as e1', 'a2.email as e2'])
            .then(resolver(ok), ok);
    });
    it('supports join aliases with advanced joins', function(ok) {
        //Expected output: all pairs of account emails, excluding pairs where the emails are the same.
        //But also include the case where the emails are the same, for account 2.
        Knex('accounts')
            .join('accounts as a2', function() {
                this.on('accounts.email', '<>', 'a2.email').orOn('accounts.id','=',2);
            })
            .select(['accounts.email as e1', 'a2.email as e2'])
            .then(resolver(ok), ok);
    });
  });

};