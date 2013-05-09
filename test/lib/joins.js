
module.exports = function(Knex, dbName, handler, type) {

  describe(dbName, function() {

    it('uses inner join by default', function(ok) {
      Knex('accounts')
        .join('test_table_two', 'accounts.id', '=', 'test_table_two.account_id')
        .select('accounts.*', 'test_table_two.details')
        .then(handler(ok), ok);
    });

    it('takes a fifth parameter to specify the join type', function(ok) {
      Knex('accounts')
        .join('test_table_two', 'accounts.id', '=', 'test_table_two.account_id', 'left')
        .select('accounts.*', 'test_table_two.details')
        .then(handler(ok), ok);
    });

    it('accepts a callback as the second argument for advanced joins', function(ok) {
      Knex('accounts').join('test_table_two', function(join) {
        join.on('accounts.id', '=', 'test_table_two.account_id');
        join.orOn('accounts.email', '=', 'test_table_two.details');
      }, 'left')
      .select()
      .then(handler(ok), ok);
    });

  });

};