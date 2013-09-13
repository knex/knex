module.exports = function(knex) {

  describe('deletes', function () {

    it('should delete an item', function() {

      return knex('accounts')
        .where({'email':'test2@example.com'})
        .del();

    });

  });

};