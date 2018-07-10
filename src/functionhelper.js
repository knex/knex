// FunctionHelper
// -------
class FunctionHelper {
  constructor(client) {
    this.client = client;
  }

  now() {
    return this.client.raw('CURRENT_TIMESTAMP');
  }
}

export default FunctionHelper;
