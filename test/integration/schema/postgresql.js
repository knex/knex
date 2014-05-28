module.exports = function(knex) {

  describe('Schema', function() {

    describe('searchPath', function() {
      it('returns current search path', function() {
        return knex.schema.searchPath().then(function(resp) {
          expect(resp).to.equal('"$user",public');
        });
      });

      it('creates schema', function() {
        return knex.schema.createSchema('bogart');
      });

      it('sets local search path', function() {
        return knex.schema.searchPath('bogart', {local: true});
      });

      it('drops schema', function() {
        return knex.schema.dropSchema('bogart');
      });

      it('sets search path', function() {
        return knex.schema.searchPath('public');
      });
    });
  });

};
