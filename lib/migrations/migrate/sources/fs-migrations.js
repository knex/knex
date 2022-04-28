const path = require('path');
const sortBy = require('lodash/sortBy');

const { readdir } = require('../../util/fs');
const { AbstractMigrationsLoader } = require('../../common/MigrationsLoader');

class FsMigrations extends AbstractMigrationsLoader {
  /**
   * Gets the migration names
   * @returns Promise<string[]>
   */
  getMigrations(loadExtensions) {
    // Get a list of files in all specified migration directories
    const readMigrationsPromises = this.migrationsPaths.map((configDir) => {
      const absoluteDir = path.resolve(process.cwd(), configDir);
      return readdir(absoluteDir).then((files) => ({
        files,
        configDir,
        absoluteDir,
      }));
    });

    return Promise.all(readMigrationsPromises).then((allMigrations) => {
      const migrations = allMigrations.reduce((acc, migrationDirectory) => {
        // When true, files inside the folder should be sorted
        if (this.sortDirsSeparately) {
          migrationDirectory.files = migrationDirectory.files.sort();
        }

        migrationDirectory.files.forEach((file) =>
          acc.push({ file, directory: migrationDirectory.configDir })
        );

        return acc;
      }, []);

      // If true we have already sorted the migrations inside the folders
      // return the migrations fully qualified
      if (this.sortDirsSeparately) {
        return filterMigrations(
          migrations,
          loadExtensions || this.loadExtensions
        );
      }

      return filterMigrations(
        sortBy(migrations, 'file'),
        loadExtensions || this.loadExtensions
      );
    });
  }

  getMigrationName(migration) {
    return path.parse(migration.file).name;
  }

  getMigration(migrationInfo) {
    return this.getFile(migrationInfo);
  }
}

function filterMigrations(migrations, loadExtensions) {
  return migrations.filter((migration) => {
    const extension = path.extname(migration.file);
    return loadExtensions.includes(extension);
  });
}

module.exports = {
  FsMigrations,
};
