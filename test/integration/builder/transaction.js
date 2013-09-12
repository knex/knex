
module.exports = function(knex) {

  describe('Transactions', function() {

    it('should be able to commit transactions', function(ok) {

      var id = null;

      return knex.transaction(function(t) {

        knex('accounts')
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

            return knex('test_table_two').transacting(t).insert({
              account_id: (id = resp[0]),
              details: '',
              status: 1
            });

          }).then(function() {

            t.commit('Hello world');

          });

      }).then(function(commitMessage) {

        expect(commitMessage).to.equal('Hello world');

        return knex('accounts').where('id', id).select('first_name');

      }).then(function(resp) {

        expect(resp).to.have.length(1);

      }).otherwise(function(err) {

        console.log(err);

      });

    });

    it('should be able to rollback transactions', function(ok) {

      var id = null;

      var err = new Error('error message');

      return knex.transaction(function(t) {

        knex('accounts')
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

            return knex('test_table_two').transacting(t).insert({
              account_id: (id = resp[0]),
              details: '',
              status: 1
            });

          }).then(function() {

            t.rollback(err);

          });

      }).otherwise(function(msg) {

        expect(msg).to.equal(err);

        return knex('accounts').where('id', id).select('first_name');

      }).then(function(resp) {

        expect(resp).to.be.empty;

      });

    });

  });

};