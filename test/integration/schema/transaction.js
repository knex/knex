var Promise = testPromise;

module.exports = function(knex) {

  describe('Schema', function() {

    describe('Transactions', function() {

      it('should be able to run schema methods', function() {
        var id = null;
        var __cid, count = 0;
        return knex.transaction(function(trx) {
          return trx('accounts')
            .returning('id')
            .insert({
              first_name: 'Transacting',
              last_name: 'User3',
              email:'transaction-test5@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: new Date(),
              updated_at: new Date()
            }).then(function(resp) {
              return trx('test_table_two').insert({
                account_id: (id = resp[0]),
                details: '',
                status: 1
              });
            }).then(function() {
              return trx.schema.createTable('test_schema_transactions', function(table) {
                table.increments();
                table.string('name');
                table.timestamps();
              });
            });
        })
        .on('query', function(obj) {
          count++;
          if (!__cid) __cid = obj.__cid;
          expect(__cid).to.equal(obj.__cid);
        }).then(function() {
          expect(count).to.equal(5);
          return knex('accounts').where('id', id).select('first_name');
        }).then(function(resp) {
          expect(resp).to.have.length(1);
        }).finally(function() {
          return Promise.all([
            knex.schema.dropTableIfExists('test_schema_transactions'),
            knex('accounts').truncate(),
            knex('test_table_two').truncate()
          ]);
        });
      });

    });
  });

};
