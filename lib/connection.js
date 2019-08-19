class Connection {
  constructor(client) {
    this.client = client;
    this.resolvedConnectionSettings = null;
  }

  async resolveConnectionConfig() {
    if (typeof this.client.connectionSettings === 'function') {
      // if the config is a function, execute the function and resolve the connection settings
      if (!this.resolvedConnectionSettings) {
        this.resolvedConnectionSettings = await this.client.connectionSettings();
        this.client.connectionSettings = this.resolvedConnectionSettings;
      }
    }
  }
}

module.exports = Connection;
