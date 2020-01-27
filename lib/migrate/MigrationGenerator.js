const path = require('path');
const pkgDir = require('pkg-dir');
const { promisify } = require('util');
const mkdirp = require('mkdirp');
const { writeJsFileUsingTemplate } = require('../util/template');
const { getMergedConfig } = require('./configuration-merger');
const { ensureDirectoryExists } = require('../util/fs');
const { yyyymmddhhmmss } = require('../util/timestamp');

class MigrationGenerator {
  constructor(migrationConfig, logger) {
    this.config = getMergedConfig(migrationConfig, undefined, logger);
  }

  // Creates a new migration, with a given name.
  async make(name, config, logger) {
    this.config = getMergedConfig(config, this.config, logger);
    if (!name) {
      return Promise.reject(
        new Error('A name must be specified for the generated migration')
      );
    }
    await this._ensureFolder();
    const createdMigrationFilePath = await this._writeNewMigration(name);
    return createdMigrationFilePath;
  }

  // Ensures a folder for the migrations exist, dependent on the migration
  // config settings.
  _ensureFolder() {
    const dirs = this._absoluteConfigDirs();

    const promises = dirs.map(ensureDirectoryExists);

    return Promise.all(promises);
  }

  async _getStubPath() {
    const packageDirectory = await pkgDir(process.cwd());
    const consumingPackageJson = require(path.resolve(
      packageDirectory,
      'package.json'
    ));
    const consumingPackageIsModule = consumingPackageJson.type === 'module';
    const stubExtension = this.config.extension;
    const stubFormat =
      stubExtension === 'js'
        ? consumingPackageIsModule
          ? 'mjs'
          : 'cjs'
        : stubExtension;

    const stubPath =
      this.config.stub || path.join(__dirname, 'stub', stubFormat + '.stub');
    return stubPath;
  }

  _getNewMigrationName(name) {
    if (name[0] === '-') name = name.slice(1);
    return yyyymmddhhmmss() + '_' + name + '.' + this.config.extension;
  }

  _getNewMigrationPath(name) {
    const fileName = this._getNewMigrationName(name);
    const dirs = this._absoluteConfigDirs();
    const dir = dirs.slice(-1)[0]; // Get last specified directory
    return path.join(dir, fileName);
  }

  // Write a new migration to disk, using the config and generated filename,
  // passing any `variables` given in the config to the template.
  async _writeNewMigration(name) {
    console.log(name);
    const migrationPath = this._getNewMigrationPath(name);
    await writeJsFileUsingTemplate(
      migrationPath,
      await this._getStubPath(),
      { variable: 'd' },
      this.config.variables || {}
    );
    return migrationPath;
  }

  _absoluteConfigDirs() {
    const directories = Array.isArray(this.config.directory)
      ? this.config.directory
      : [this.config.directory];
    return directories.map((directory) => {
      if (!directory) {
        // eslint-disable-next-line no-console
        console.warn(
          'Failed to resolve config file, knex cannot determine where to generate migrations'
        );
      }
      return path.resolve(process.cwd(), directory);
    });
  }
}

module.exports = MigrationGenerator;
