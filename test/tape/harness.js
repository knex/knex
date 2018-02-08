'use strict';
var tape    = require('tape')
var Promise = require('bluebird')
var debug   = require('debug')('knex:tests')

module.exports = function(tableName, knex) {

  return function(name, dialects, cb) {

    if (arguments.length === 2) {
      cb = dialects
    } else {
      if (!Array.isArray(dialects)) {
        dialects = [dialects]
      }
      if (dialects.indexOf(knex.client.dialect) === -1) {
        debug('Skipping dialect ' + knex.client.dialect + ' for test ' + name)
        return;
      }
    }

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
