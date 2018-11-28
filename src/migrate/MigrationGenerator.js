import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import Promise from 'bluebird';
import { each, template } from 'lodash';
import { getMergedConfig } from './Migrator';

export default class MigrationGenerator {
  constructor(migrationConfig) {
    this.config = getMergedConfig(migrationConfig);
  }

  // Creates a new migration, with a given name.
  make(name, config) {
    this.config = getMergedConfig(config, this.config);
    if (!name) {
      return Promise.reject(
        new Error('A name must be specified for the generated migration')
      );
    }

    return this._ensureFolder(config)
      .then((val) => this._generateStubTemplate(val))
      .then((val) => this._writeNewMigration(name, val));
  }

  print(migrationListResolver, config, direction) {
    return migrationListResolver
      .listAll(config.migrationSource)
      .then((migrationFiles) => {
        let current = Promise.bind({ failed: false, failedOn: 0 });

        each(migrationFiles, (migrationFile) => {
          const directory = config.directory;
          const migration = require(directory + '/' + migrationFile);

          if (direction === 'up' || direction === 'all') {
            current = current.then(() => {
              /* eslint-disable no-console */
              console.log(`\n${migrationFile}`);
              console.log('======== UP ==========');
              /* eslint-enable no-console */
              return migration['up'](this.knex, Promise);
            });
          }

          if (direction === 'down' || direction === 'all') {
            current = current.then(() => {
              /* eslint-disable no-console */
              console.log(`\n${migrationFile}`);
              console.log('======== DOWN ==========');
              /* eslint-enable no-console */
              return migration['down'](this.knex, Promise);
            });
          }
        });

        return current.thenReturn();
      });
  }

  // Ensures a folder for the migrations exist, dependent on the migration
  // config settings.
  _ensureFolder() {
    const dirs = this._absoluteConfigDirs();

    const promises = dirs.map((dir) => {
      return Promise.promisify(fs.stat, { context: fs })(dir).catch(() =>
        Promise.promisify(mkdirp)(dir)
      );
    });

    return Promise.all(promises);
  }

  // Generates the stub template for the current migration, returning a compiled
  // template.
  _generateStubTemplate() {
    const stubPath =
      this.config.stub ||
      path.join(__dirname, 'stub', this.config.extension + '.stub');

    return Promise.promisify(fs.readFile, { context: fs })(stubPath).then(
      (stub) => template(stub.toString(), { variable: 'd' })
    );
  }

  // Write a new migration to disk, using the config and generated filename,
  // passing any `variables` given in the config to the template.
  _writeNewMigration(name, tmpl) {
    const { config } = this;
    const dirs = this._absoluteConfigDirs();
    const dir = dirs.slice(-1)[0]; // Get last specified directory

    if (name[0] === '-') name = name.slice(1);
    const filename = yyyymmddhhmmss() + '_' + name + '.' + config.extension;

    return Promise.promisify(fs.writeFile, { context: fs })(
      path.join(dir, filename),
      tmpl(config.variables || {})
    ).return(path.join(dir, filename));
  }

  _absoluteConfigDirs() {
    const directories = Array.isArray(this.config.directory)
      ? this.config.directory
      : [this.config.directory];
    return directories.map((directory) => {
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
