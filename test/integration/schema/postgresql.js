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

    describe('Transactions', function() {

      it('should be able to rollback a create table', function() {
        var err = new Error('error message');
        var __cid, count = 0;
        return knex.transaction(function(trx) {
          return trx.schema.createTable('test_schema_transactions', function(table) {
              table.increments();
              table.string('name');
              table.timestamps();
            }).then(function() {
              return trx('test_schema_transactions').insert({name: 'bob'});
            }).then(function() {
              return trx('test_schema_transactions').count('*');
            }).then(function(resp) {
              var _count = parseInt(resp[0].count, 10);
              expect(_count).to.equal(1);
              throw err;
            });
        })
        .on('query', function(obj) {
          count++;
          if (!__cid) __cid = obj.__cid;
          expect(__cid).to.equal(obj.__cid);
        })
        .catch(function(msg) {
          expect(msg).to.equal(err);
          expect(count).to.equal(5);
          return knex('test_schema_migrations').count('*');
        })
        .catch(function(e) {
          expect(e.message).to.equal('relation "test_schema_migrations" does not exist');
        });
      });

    });

  });

};
