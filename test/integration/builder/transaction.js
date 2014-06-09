var Promise = testPromise;

module.exports = function(knex) {

  describe('Transactions', function() {

    it('can run with exec', function(ok) {

      knex.transaction(function(t) {
        t.commit();
      }).exec(ok);

    });

    it('should be able to commit transactions', function() {

      var id = null;
      return knex.transaction(function(t) {

        knex('accounts')
          .transacting(t)
          .returning('id')
          .insert({
            first_name: 'Transacting',
            last_name: 'User',
            email:'transaction-test1@example.com',
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
      });
    });

    it('should be able to rollback transactions', function() {
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
      }).catch(function(msg) {
        expect(msg).to.equal(err);
        return knex('accounts').where('id', id).select('first_name');
      }).then(function(resp) {
        expect(resp).to.be.empty;
      });
    });

    it('should be able to commit transactions with a resolved trx query', function() {

      var id = null;
      return knex.transaction(function(trx) {
        return trx('accounts')
          .returning('id')
          .insert({
            first_name: 'Transacting',
            last_name: 'User',
            email:'transaction-test3@example.com',
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
            return 'Hello World';
          });
      }).then(function(commitMessage) {
        expect(commitMessage).to.equal('Hello World');
        return knex('accounts').where('id', id).select('first_name');
      }).then(function(resp) {
        expect(resp).to.have.length(1);
      });
    });

    it('should be able to rollback transactions with rejected trx query', function() {
      var id = null;
      var err = new Error('error message');
      var __cid, count = 0;
      return knex.transaction(function(trx) {
        return trx('accounts')
          .returning('id')
          .insert({
            first_name: 'Transacting',
            last_name: 'User2',
            email:'transaction-test4@example.com',
            logins: 1,
            about: 'Lorem ipsum Dolore labore incididunt enim.',
            created_at: new Date(),
            updated_at: new Date()
          })
          .then(function(resp) {
            return trx.insert({
              account_id: (id = resp[0]),
              details: '',
              status: 1
            }).into('test_table_two');
          })
          .then(function() {
            throw err;
          });
      })
      .on('query', function(obj) {
        count++;
        if (!__cid) __cid = obj.__cid;
        expect(__cid).to.equal(obj.__cid);
      })
      .catch(function(msg) {
        expect(count).to.equal(4);
        expect(msg).to.equal(err);
        return knex('accounts').where('id', id).select('first_name');
      })
      .then(function(resp) {
        expect(resp).to.eql([]);
      });
    });

    it('should be able to run schema methods', function() {
      var __cid, count = 0;
      var err = new Error('error message');
      if (knex.client.dialect === 'postgresql') {
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
      } else {
        var id = null;
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
          return knex.schema.dropTableIfExists('test_schema_transactions');
        });
      }
    });

    it('should resolve with the correct value, #298', function() {
      return knex.transaction(function(trx) {
        trx.debugging = true;
        return Promise.resolve(null);
      }).then(function(result) {
        expect(result).to.equal(null);
      });
    });

  });

};