const { FsSeeds } = require('./sources/fs-seeds');
const Logger = require('../../logger');
const { DEFAULT_LOAD_EXTENSIONS } = require('../common/MigrationsLoader');
const defaultLogger = new Logger();

const CONFIG_DEFAULT = Object.freeze({
  extension: 'js',
  directory: './seeds',
  loadExtensions: DEFAULT_LOAD_EXTENSIONS,
  specific: null,
  timestampFilenamePrefix: false,
  recursive: false,
  sortDirsSeparately: false,
});

function getMergedConfig(config, currentConfig, logger = defaultLogger) {
  // config is the user specified config, mergedConfig has defaults and current config
  // applied to it.
  const mergedConfig = Object.assign(
    {},
    CONFIG_DEFAULT,
    currentConfig || {},
    config,
    {
      logger,
    }
  );

  if (
    config &&
    // If user specifies any FS related config,
    // clear specified migrationSource to avoid ambiguity
    (config.directory ||
      config.sortDirsSeparately !== undefined ||
      config.loadExtensions)
  ) {
    if (config.seedSource) {
      logger.warn(
        'FS-related option specified for seed configuration. This resets seedSource to default FsMigrations'
      );
    }
    mergedConfig.seedSource = null;
  }

  // If the user has not specified any configs, we need to
  // default to fs migrations to maintain compatibility
  if (!mergedConfig.seedSource) {
    mergedConfig.seedSource = new FsSeeds(
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
