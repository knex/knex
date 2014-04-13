module.exports = function(knex) {

  describe('Deletes', function () {

    it('should handle deletes', function() {
      return knex('accounts')
        .logMe()
        .where('id', 1)
        .del();
    });

    it('should allow returning for deletes in postgresql', function() {
      return knex('accounts')
        .logMe()
        .where('id', 2)
        .del('*');
    });

  });

};
