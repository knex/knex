
// FunctionHelper
// -------
function FunctionHelper(client) {
  this.client = client
}

FunctionHelper.prototype.now = function() {
  return this.client.raw('CURRENT_TIMESTAMP')
}

module.exports = FunctionHelper