const { assign } = require('lodash');
const {
  FsMigrations,
  DEFAULT_LOAD_EXTENSIONS,
} = require('./sources/fs-migrations');

const CONFIG_DEFAULT = Object.freeze({
  extension: 'js',
  loadExtensions: DEFAULT_LOAD_EXTENSIONS,
  tableName: 'knex_migrations',
  schemaName: null,
  directory: './migrations',
  disableTransactions: false,
  sortDirsSeparately: false,
});

function getMergedConfig(config, currentConfig) {
  // config is the user specified config, mergedConfig has defaults and current config
  // applied to it.
  const mergedConfig = assign({}, CONFIG_DEFAULT, currentConfig || {}, config);

  if (
    config &&
    // If user specifies any FS related config,
    // clear existing FsMigrations migrationSource
    (config.directory ||
      config.sortDirsSeparately !== undefined ||
      config.loadExtensions)
  ) {
    mergedConfig.migrationSource = null;
  }

  // If the user has not specified any configs, we need to
  // default to fs migrations to maintain compatibility
  if (!mergedConfig.migrationSource) {
    mergedConfig.migrationSource = new FsMigrations(
      mergedConfig.directory,
      mergedConfig.sortDirsSeparately,
      mergedConfig.loadExtensions
    );
  }

  return mergedConfig;
}

module.exports = {
  getMergedConfig,
};
