'use strict'

// Use this shim module rather than "bluebird/js/main/promise" 
// when bundling for client
module.exports = function() {
  return require('bluebird')
}