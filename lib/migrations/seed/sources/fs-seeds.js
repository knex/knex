const path = require('path');
const flatten = require('lodash/flatten');
const includes = require('lodash/includes');
const { AbstractMigrationsLoader } = require('../../common/MigrationsLoader');
const { getFilepathsInFolder } = require('../../util/fs');

const filterByLoadExtensions = (extensions) => (value) => {
  const extension = path.extname(value);
  return includes(extensions, extension);
};

class FsSeeds extends AbstractMigrationsLoader {
  _getConfigDirectories(logger) {
    const directories = this.migrationsPaths;
    return directories.map((directory) => {
      if (!directory) {
        logger.warn(
          'Empty value passed as a directory for Seeder, this is not supported.'
        );
      }
      return path.resolve(process.cwd(), directory);
    });
  }

  async getSeeds(config) {
    const { loadExtensions, recursive, specific } = config;

    const seeds = flatten(
      await Promise.all(
        this._getConfigDirectories(config.logger).map((d) =>
          getFilepathsInFolder(d, recursive)
        )
      )
    );

    // if true, each dir are already sorted
    // (getFilepathsInFolderRecursively does this)
    // if false, we need to sort all the seeds
    let files = seeds.filter(filterByLoadExtensions(loadExtensions));
    if (!this.sortDirsSeparately) {
      files.sort();
    }

    if (specific) {
      files = files.filter((file) => path.basename(file) === specific);
      if (files.length === 0) {
        throw new Error(
          `Invalid argument provided: the specific seed "${specific}" does not exist.`
        );
      }
    }

    return files;
  }

  async getSeed(filepath) {
    const importFile = require('../../util/import-file'); // late import
    const seed = await importFile(filepath);
    return seed;
  }
}

module.exports = {
  FsSeeds,
};
