var assert = require('assert');

module.exports = function(Knex, dbName, resolver) {

  it('should be able to commit transactions', function(ok) {
    var id = null;
    Knex.Transaction(function(t) {
      Knex('accounts')
        .transacting(t)
        .returning('id')
        .insert({
          first_name: 'Transacting',
          last_name: 'User',
          email:'transaction-test@example.com',
          logins: 1,
          about: 'Lorem ipsum Dolore labore incididunt enim.',
          created_at: new Date(),
          updated_at: new Date()
        }).then(function(resp) {
          // This is only because of the test suite and the
          // overridden `runQuery`.
          resp = resp.object;
          return Knex('test_table_two').transacting(t).insert({
            account_id: (id = resp[0]),
            details: '',
            status: 1
          });
        }).then(function() {
          t.commit();
        });
    }).then(function() {
      return Knex('accounts')
        .where('id', id)
        .select('first_name')
        .then(function() {
          ok();
        });
    });
  });

  it('should be able to rollback transactions', function(ok) {

    var id = null;

    Knex.Transaction(function(t) {

      Knex('accounts')
        .transacting(t)
        .returning('id')
        .insert({
          first_name: 'Transacting',
          last_name: 'User2',
          email:'transaction-test2@example.com',
          logins: 1,
          about: 'Lorem ipsum Dolore labore incididunt enim.',
          created_at: new Date(),
          updated_at: new Date()
        }).then(function(resp) {
          // This is only because of the test suite and the
          // overridden `runQuery`
          resp = resp.object;
          return Knex('test_table_two').transacting(t).insert({
            account_id: (id = resp[0]),
            details: '',
            status: 1
          });
        }).then(function() {
          t.rollback();
        });
    }).then(null, function() {
      Knex('accounts')
        .where('id', id)
        .select('first_name')
        .then(function(resp) {
          // This is only because of the test suite and the
          // overridden `runQuery`
          assert.equal(resp.object.length, 0);
          ok();
        });
    });

  });

};