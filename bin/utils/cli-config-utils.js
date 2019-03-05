const { DEFAULT_EXT } = require('./constants');
const { resolveClientNameWithAliases } = require('../../lib/helpers');
const fs = require('fs');

function mkConfigObj(opts) {
  if (!opts.client) {
    const path = resolveDefaultKnexfilePath();
    throw new Error(
      `No default configuration file '${path}' found and no commandline connection parameters passed`
    );
  }

  const envName = opts.env || process.env.NODE_ENV || 'development';
  const resolvedClientName = resolveClientNameWithAliases(opts.client);
  const useNullAsDefault = resolvedClientName === 'sqlite3';
  return {
    ext: DEFAULT_EXT,
    [envName]: {
      useNullAsDefault,
      client: opts.client,
      connection: opts.connection,
      migrations: {
        directory: opts.migrationsDirectory,
      },
    },
  };
}

function tryLoadingDefaultConfiguration() {
  const path = resolveDefaultKnexfilePath();
  if (fs.existsSync(path)) {
    return require(path);
  }
}

function resolveDefaultKnexfilePath() {
  return process.cwd() + '/knexfile.js';
}

module.exports = {
  mkConfigObj,
  tryLoadingDefaultConfiguration,
};
