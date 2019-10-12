const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const bluebird = require('bluebird');
const { writeJsFileUsingTemplate } = require('../util/template');
const { getMergedConfig } = require('./configuration-merger');

class MigrationGenerator {
  constructor(migrationConfig) {
    this.config = getMergedConfig(migrationConfig);
  }

  // Creates a new migration, with a given name.
  async make(name, config) {
    this.config = getMergedConfig(config, this.config);
    if (!name) {
      return Promise.reject(
        new Error('A name must be specified for the generated migration')
      );
    }
    await this._ensureFolder(config);
    await this._writeNewMigration(name, config);
  }

  // Ensures a folder for the migrations exist, dependent on the migration
  // config settings.
  _ensureFolder() {
    const dirs = this._absoluteConfigDirs();

    const promises = dirs.map((dir) => {
      return bluebird
        .promisify(fs.stat, { context: fs })(dir)
        .catch(() => bluebird.promisify(mkdirp)(dir));
    });

    return Promise.all(promises);
  }

  _getStubPath() {
    return this.config.stub ||
      path.join(__dirname, 'stub', this.config.extension + '.stub');
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
  _writeNewMigration(name, config) {
    return writeJsFileUsingTemplate(
      this._getNewMigrationPath(name),
      this._getStubPath(),
      { variable: 'd' },
      config.variables || {}
    );
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

// Ensure that we have 2 places for each of the date segments.
function padDate(segment) {
  segment = segment.toString();
  return segment[1] ? segment : `0${segment}`;
}

// Get a date object in the correct format, without requiring a full out library
// like "moment.js".
function yyyymmddhhmmss() {
  const d = new Date();
  return (
    d.getFullYear().toString() +
    padDate(d.getMonth() + 1) +
    padDate(d.getDate()) +
    padDate(d.getHours()) +
    padDate(d.getMinutes()) +
    padDate(d.getSeconds())
  );
}

module.exports = MigrationGenerator;
