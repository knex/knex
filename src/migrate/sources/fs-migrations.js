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
      const relativeMigrations = allMigrations.reduce(
        (acc, migrationDirectory) => {
          // When true, files inside the folder should be sorted
          if (this.sortDirsSeparately) {
            migrationDirectory.files = migrationDirectory.files.sort();
          }

          migrationDirectory.files
            .map((file) => path.join(migrationDirectory.configDir, file))
            .forEach((relativeMigation) => acc.push(relativeMigation));

          return acc;
        },
        []
      );

      // If true we have already sorted the migrations inside the folders
      if (this.sortDirsSeparately) {
        return relativeMigrations;
      }

      return relativeMigrations.sort();
    });
  }

  getMigration(name) {
    return require(resolveMigrationPath(name));
  }
}

function resolveMigrationPath(migration) {
  return path.join(migration.directory, migration.file);
}
