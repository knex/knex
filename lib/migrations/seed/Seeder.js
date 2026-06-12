// Seeder
// -------

const path = require('path');
const { ensureDirectoryExists } = require('../util/fs');
const { writeJsFileUsingTemplate } = require('../util/template');
const { yyyymmddhhmmss } = require('../util/timestamp');
const { getMergedConfig } = require('./seeder-configuration-merger');

// The new seeds we're performing, typically called from the `knex.seed`
// interface on the main `knex` object. Passes the `knex` instance performing
// the seeds.
class Seeder {
  constructor(knex) {
    this.knex = knex;
    this.config = this.resolveConfig(knex.client.config.seeds);
  }

  // Runs seed files for the given environment.
  async run(config) {
    this.config = this.resolveConfig(config);
    const files = await this.config.seedSource.getSeeds(this.config);
    return this._runSeeds(files);
  }

  // Creates a new seed file, with a given name.
  async make(name, config) {
    this.config = this.resolveConfig(config);
    if (!name)
      throw new Error('A name must be specified for the generated seed');
    await this._ensureFolder(config);
    const seedPath = await this._writeNewSeed(name);
    return seedPath;
  }

  // Ensures a folder for the seeds exist, dependent on the
  // seed config settings.
  _ensureFolder() {
    const dirs = this.config.seedSource._getConfigDirectories(
      this.config.logger
    );
    const promises = dirs.map(ensureDirectoryExists);
    return Promise.all(promises);
  }

  // Run seed files, in sequence.
  async _runSeeds(seeds) {
    for (const seed of seeds) {
      await this._validateSeedStructure(seed);
    }
    return this._waterfallBatch(seeds);
  }

  async _validateSeedStructure(filepath) {
    const seed = await this.config.seedSource.getSeed(filepath);
    if (typeof seed.seed !== 'function') {
      throw new Error(
        `Invalid seed file: ${filepath} must have a seed function`
      );
    }
    return filepath;
  }

  _getStubPath() {
    return (
      this.config.stub ||
      path.join(__dirname, 'stub', this.config.extension + '.stub')
    );
  }

  _getNewStubFileName(name) {
    if (name[0] === '-') name = name.slice(1);

    if (this.config.timestampFilenamePrefix === true) {
      name = `${yyyymmddhhmmss()}_${name}`;
    }

    return `${name}.${this.config.extension}`;
  }

  _getNewStubFilePath(name) {
    const fileName = this._getNewStubFileName(name);
    const dirs = this.config.seedSource._getConfigDirectories(
      this.config.logger
    );
    const dir = dirs.slice(-1)[0]; // Get last specified directory
    return path.join(dir, fileName);
  }

  // Write a new seed to disk, using the config and generated filename,
  // passing any `variables` given in the config to the template.
  async _writeNewSeed(name) {
    const seedPath = this._getNewStubFilePath(name);
    await writeJsFileUsingTemplate(
      seedPath,
      this._getStubPath(),
      { variable: 'd' },
      this.config.variables || {}
    );
    return seedPath;
  }

  async _listAll(config) {
    this.config = this.resolveConfig(config);
    return this.config.seedSource.getSeeds(this.config);
  }

  // Runs a batch of seed files.
  async _waterfallBatch(seeds) {
    const { knex } = this;
    const log = [];
    for (const seedPath of seeds) {
      const seed = await this.config.seedSource.getSeed(seedPath);
      try {
        await seed.seed(knex);
        log.push(seedPath);
      } catch (originalError) {
        const error = new Error(
          `Error while executing "${seedPath}" seed: ${originalError.message}`
        );
        error.original = originalError;
        error.stack =
          error.stack.split('\n').slice(0, 2).join('\n') +
          '\n' +
          originalError.stack;
        throw error;
      }
    }
    return [log];
  }

  resolveConfig(config) {
    return getMergedConfig(config, this.config, this.knex.client.logger);
  }
}

module.exports = Seeder;
