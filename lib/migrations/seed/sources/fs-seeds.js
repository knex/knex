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
  _getConfigDirectories() {
    const directories = this.migrationsPaths;
    return directories.map((directory) => {
      if (!directory) {
        console.warn(
          'Failed to resolve config file, knex cannot determine where to run or make seeds'
        );
      }
      return path.resolve(process.cwd(), directory);
    });
  }

  async getSeeds(loadExtensions, recursive, runSpecificSeed) {
    const seeds = flatten(
      await Promise.all(
        this._getConfigDirectories().map((d) =>
          getFilepathsInFolder(d, recursive)
        )
      )
    );

    let files;
    // if true, each dir are already sorted
    // (getFilepathsInFolderRecursively does this)
    // if false, we need to sort all the seeds
    if (this.sortDirsSeparately) {
      files = seeds.filter(filterByLoadExtensions(loadExtensions));
    } else {
      files = seeds.filter(filterByLoadExtensions(loadExtensions)).sort();
    }

    if (runSpecificSeed) {
      files = files.filter((file) => path.basename(file) === runSpecificSeed);
      if (files.length === 0) {
        throw new Error(
          `Invalid argument provided: the specific seed "${runSpecificSeed}" does not exist.`
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
