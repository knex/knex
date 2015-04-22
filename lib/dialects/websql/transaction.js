
var makeKnex = require('../../util/make-knex')

function Transaction_WebSQL(client) {
  this.client = client
}

Transaction_WebSQL.prototype.run = function(container) {
  var client = this.client
  return Promise.try(function() {
    return container(makeKnex(client))
  })
}


module.exports = Transaction_WebSQL