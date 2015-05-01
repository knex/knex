'use strict';

var harness    = require('./harness')
var tape       = require('tape')
var async      = require('async')
var JSONStream = require('JSONStream')

module.exports = function(knex) {

  tape(knex.client.driverName + ' - transactions: before', function(t) {
    knex.schema.dropTableIfExists('test_table')
      .createTable('test_table', function(t) {
        t.integer('id')
        t.string('name')
      })
      .then(function() { 
        t.end() 
      })
  })

  var test = harness('test_table', knex)

  test('transaction', function (t) {
    return knex.transaction(function(trx) {
      return trx.insert({id: 1, name: 'A'}).into('test_table')
    })
    .then(function() {
      return knex.select('*').from('test_table').then(function(results) {
        t.equal(results.length, 1)
      })
    })
  })

  test('transaction rollback', function(t) {
    return knex.transaction(function(trx) {
      return trx.insert({id: 1, name: 'A'}).into('test_table').then(function() {
        throw new Error('Not inserting')
      })
    })
    .catch(function() {})
    .finally(function() {
      return knex.select('*').from('test_table').then(function(results) {
        t.equal(results.length, 0, 'No rows were inserted')
      })
    })
  })

  test('transaction savepoint', function(t) {
    
    return knex.transaction(function(trx) {
      
      return trx.insert({id: 1, name: 'A'}).into('test_table').then(function() {
        
        // Nested transaction (savepoint)
        return trx.transaction(function(trx2) {
          
          // Insert and then roll back the savepoint
          return trx2.table('test_table').insert({id: 2, name: 'B'}).then(function() {
            return trx2('test_table').then(function(results) {
              t.equal(results.length, 2, 'Two Rows inserted')
            })
            .throw(new Error('Rolling Back Savepoint'))
          })

        })

      }).catch(function(err) {
        t.equal(err.message, 'Rolling Back Savepoint')
      })

    })
    .catch(function() {})
    .finally(function() {
      return knex.select('*').from('test_table').then(function(results) {
        t.equal(results.length, 1, 'One row inserted')
      })
    })
  
  })

  test('#625 - streams/transactions', 'postgresql', function(t) {

    var cid, queryCount = 0;

    return knex.transaction(function(tx) { 
      async.eachSeries([
        'SET join_collapse_limit to 1',
        'SET enable_nestloop = off'
      ],
      function (request, cb) {
        knex.raw(request).transacting(tx).asCallback(cb);
      },
      function (err) {
        if (err) return tx.rollback(err)
        var stream = knex('test_table').transacting(tx).stream();
        stream.on('end', function () {
          tx.commit();
          t.equal(queryCount, 5, 'Five queries run')
        });
        stream.pipe(JSONStream.stringify());
      })
    })
    .on('query', function(q) {
      if (!cid) {
        cid = q.__knexUid
      } else {
        if (cid !== q.__knexUid) {
          throw new Error('Invalid connection ID')
        }
      }
      queryCount++
    })

  })

  test('#785 - skipping extra transaction statements after commit / rollback', function(t) {
    
    var queryCount = 0

    return knex.transaction(function(trx) {    
      knex('test_table')
        .transacting(trx)
        .insert({name: 'Inserted before rollback called.'})
        .then(function() { 
          trx.rollback(new Error('Rolled back'));
        })
        .then(function() {
          return knex('test_table')
            .transacting(trx)
            .insert({name: 'Inserted after rollback called.'})
            .then(function(resp) { 
              t.error(resp)
            })
            .catch(function() {})
        })
    })
    .on('query', function() {
      queryCount++
    })
    .catch(function(err) {
      t.equal(err.message, 'Rolled back')
    })
    .finally(function() {
      t.equal(queryCount, knex.client.dialect === 'oracle' ? 1 : 3)
    })

  })

  test('#805 - nested ddl transaction', function(t) {
    return knex.transaction(function(knex) {
      return knex.transaction(function(trx) {
        return trx.schema.createTable('ages', function(t) {
          t.increments('id').primary();
          t.string('name').unique().notNull();
        });
      })  
    })
    .finally(function() {
      return knex.schema.dropTableIfExists('ages')
    });    
  });

}
