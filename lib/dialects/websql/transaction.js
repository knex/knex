
function Transaction_WebSQL(client) {
  this.client = client
}

Transaction_WebSQL.prototype.run = function(container) {
  return Promise.try(function() {
    return container(this.client.makeKnex(client))
  })
}

