const Client = require('./client');
const { SUPPORTED_CLIENTS } = require('./constants');

const parseConnection = require('./util/parse-connection');
const { resolveClientNameWithAliases } = require('./helpers');

function resolveConfig(config) {
  let Dialect;
  let resolvedConfig;

  // If config is a string, try to parse it
  const parsedConfig =
    typeof config === 'string'
      ? Object.assign(parseConnection(config), arguments[2])
      : config;

  // If user provided no relevant parameters, use generic client
  if (
    arguments.length === 0 ||
    (!parsedConfig.client && !parsedConfig.dialect)
  ) {
    Dialect = Client;
  }
  // If user provided Client constructor as a parameter, use it
  else if (
    typeof parsedConfig.client === 'function' &&
    parsedConfig.client.prototype instanceof Client
  ) {
    Dialect = parsedConfig.client;
  }
  // If neither applies, let's assume user specified name of a client or dialect as a string
  else {
    const clientName = parsedConfig.client || parsedConfig.dialect;
    if (!SUPPORTED_CLIENTS.includes(clientName)) {
      throw new Error(
        `knex: Unknown configuration option 'client' value ${clientName}. Note that it is case-sensitive, check documentation for supported values.`
      );
    }

    const resolvedClientName = resolveClientNameWithAliases(clientName);
    Dialect = require(`./dialects/${resolvedClientName}/index.js`);
  }

  // If config connection parameter is passed as string, try to parse it
  if (typeof parsedConfig.connection === 'string') {
    resolvedConfig = Object.assign({}, parsedConfig, {
      connection: parseConnection(parsedConfig.connection).connection,
    });
  } else {
    resolvedConfig = Object.assign({}, parsedConfig);
  }

  return {
    resolvedConfig,
    Dialect,
  };
}

module.exports = {
  resolveConfig,
};
