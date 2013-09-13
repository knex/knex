
module.exports = function(knex) {

  describe('Joins', function() {

    it('uses inner join by default', function() {
      return knex('accounts')
        .logMe()
        .join('test_table_two', 'accounts.id', '=', 'test_table_two.account_id')
        .select('accounts.*', 'test_table_two.details');
    });

    it('takes a fifth parameter to specify the join type', function() {
      return knex('accounts')
        .logMe()
        .join('test_table_two', 'accounts.id', '=', 'test_table_two.account_id', 'left')
        .select('accounts.*', 'test_table_two.details');
    });

    it('accepts a callback as the second argument for advanced joins', function() {
      return knex('accounts').logMe().join('test_table_two', function(join) {
        join.on('accounts.id', '=', 'test_table_two.account_id');
        join.orOn('accounts.email', '=', 'test_table_two.details');
      }, 'left')
      .select();
    });

    it('supports join aliases', function() {
      //Expected output: all pairs of account emails, excluding pairs where the emails are the same.
      return knex('accounts')
          .logMe()
          .join('accounts as a2', 'a2.email', '<>', 'accounts.email')
          .select(['accounts.email as e1', 'a2.email as e2'])
          .where('a2.email', 'test2@example.com')
          .limit(5);
    });

    it('supports join aliases with advanced joins', function() {
      //Expected output: all pairs of account emails, excluding pairs where the emails are the same.
      //But also include the case where the emails are the same, for account 2.
      return knex('accounts')
          .logMe()
          .join('accounts as a2', function() {
              this.on('accounts.email', '<>', 'a2.email').orOn('accounts.id','=',2);
          })
          .where('a2.email', 'test2@example.com')
          .select(['accounts.email as e1', 'a2.email as e2'])
          .limit(5);
    });

    it('supports joins with overlapping column names', function() {
      var blah = knex('accounts as a1')
        .logMe()
        .join('accounts as a2', function() {
          this.on('a1.email', '<>', 'a2.email');
        }, 'left')
        .select(['a1.email', 'a2.email'])
        .where(knex.raw('a1.id = 1'))
        .options({ nestTables: true, rowMode: 'array' })
        .limit(2);
    });

  });

};