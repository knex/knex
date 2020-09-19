const {
  FsMigrations,
  DEFAULT_LOAD_EXTENSIONS,
} = require('./sources/fs-migrations');
const Logger = require('../logger');
const defaultLogger = new Logger();

const CONFIG_DEFAULT = Object.freeze({
  extension: 'js',
  loadExtensions: DEFAULT_LOAD_EXTENSIONS,
  tableName: 'knex_migrations',
  schemaName: null,
  directory: './migrations',
  disableTransactions: false,
  disableMigrationsListValidation: false,
  sortDirsSeparately: false,
});

function getMergedConfig(config, currentConfig, logger = defaultLogger) {
  // config is the user specified config, mergedConfig has defaults and current config
  // applied to it.
  const mergedConfig = Object.assign(
    {},
    CONFIG_DEFAULT,
    currentConfig || {},
    config
  );

  if (
    config &&
    // If user specifies any FS related config,
    // clear specified migrationSource to avoid ambiguity
    (config.directory ||
      config.sortDirsSeparately !== undefined ||
      config.loadExtensions)
  ) {
    if (config.migrationSource) {
      logger.warn(
        'FS-related option specified for migration configuration. This resets migrationSource to default FsMigrations'
      );
    }
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
