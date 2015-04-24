'use strict';

var tape    = require('tape')
var Promise = require('bluebird')

module.exports = function(tableName, knex) {
  
  return function(name, cb) {
    
    return tape(name, function(t) {
      
      var hasPlanned = false
      
      t.on('plan', function() { hasPlanned = true })

      var disposable = Promise.resolve(true).disposer(function() {
        return knex.truncate(tableName).finally(function() {
          t.end()
        })
      })

      Promise.using(disposable, function() {
        var val = cb(t)
        if (val && typeof val.then === 'function') {
          return val.catch(function(err) {
            t.error(err)
          })
        } else {
          t.error(new Error('A promise should be returned to test ' + name))
          t.end()
        }
      })

    })

  }

}