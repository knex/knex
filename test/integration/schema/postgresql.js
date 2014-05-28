module.exports = function(knex) {

  describe('Schema', function() {

    describe('searchPath', function() {
      it('returns current search path', function() {
        return knex.schema.searchPath().then(function(resp) {
          expect(resp).to.equal('"$user",public');
        });
      });

      it('sets search path', function() {
        return knex.schema.searchPath('public');
      });

      it('sets local search path', function() {
        return knex.schema.searchPath('public', {local: true});
      });
    });
  });

};
