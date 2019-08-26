const { isFunction, cloneDeep } = require('lodash');

class ConnectionConfigProvider {
  constructor(client) {
    this.client = client;
    this.resolvedConnectionSettings = null;
  }

  async resolveConnectionConfig() {
    if (this.resolvedConnectionSettings) return this.resolvedConnectionSettings;
    if (isFunction(this.client.config.connection)) {
      // if the config is a function, execute the function and resolve the connection settings
      this.resolvedConnectionSettings = await this.client.config.connection();
      this.client.connectionSettings = this.resolvedConnectionSettings;
    } else {
      this.client.connectionSettings = cloneDeep(
        this.client.config.connection || {}
      );
      this.resolvedConnectionSettings = this.client.connectionSettings;
    }
    return this.resolvedConnectionSettings;
  }
}

module.exports = ConnectionConfigProvider;
