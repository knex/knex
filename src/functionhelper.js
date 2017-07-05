
// FunctionHelper
// -------
function FunctionHelper(client) {
  this.client = client
}

FunctionHelper.prototype.now = function() {
  return this.client.raw('CURRENT_TIMESTAMP')
}

FunctionHelper.prototype.uuid = function() {
  return this.client.raw('UUID()') 
}

export default FunctionHelper
