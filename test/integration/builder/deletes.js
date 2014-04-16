module.exports = function(knex) {

  describe('Deletes', function () {

    it('should handle deletes', function() {
      return knex('accounts')
        .where('id', 1)
        .del()
        .testSql(function(tester) {
          tester('postgresql');
        });
    });

    it('should allow returning for deletes in postgresql', function() {
      return knex('accounts')
        .where('id', 2)
        .del('*')
        .testSql(function(tester) {
          tester('postgresql');
        });
    });

  });

};
