import fs from 'fs';
import path from 'path';
import Promise from 'bluebird';

const readDirAsync = Promise.promisify(fs.readdir, { context: fs });

export class FsMigrations {
  constructor(migrationDirectories, sortDirsSeparately) {
    this.sortDirsSeparately = sortDirsSeparately;

    if (!Array.isArray(migrationDirectories)) {
      migrationDirectories = [migrationDirectories];
    }
    this.migrationsPaths = migrationDirectories;
  }

  /**
   * Gets the migration names
   * @returns Promise<string[]>
   */
  getMigrations() {
    // Get a list of files in all specified migration directories
    const readMigrationsPromises = this.migrationsPaths.map((configDir) => {
      const absoluteDir = path.resolve(process.cwd(), configDir);
      return readDirAsync(absoluteDir).then((files) => ({
        files,
        configDir,
        absoluteDir,
      }));
    });

    return Promise.all(readMigrationsPromises).then((allMigrations) => {
      const migrations = allMigrations.reduce(
        (acc, migrationDirectory) => {
          // When true, files inside the folder should be sorted
          if (this.sortDirsSeparately) {
            migrationDirectory.files = migrationDirectory.files.sort();
          }

          migrationDirectory.files
            .forEach((file) => acc.push({ file, directory: migrationDirectory.configDir }));

          return acc;
        },
        []
      );

      // If true we have already sorted the migrations inside the folders
      // return the migrations fully qualified
      if (this.sortDirsSeparately) {
        return migrations
          .map((migration) => path.join(migration.configDir, migration.file));
      }

      return migrations.map(migration => migration.file).sort();
    });
  }

  getMigrationName(migration) {
    return require(migration.file);
  }

  getMigration(migration) {
    return require(path.join(migration.directory, migration.file));
  }
}
