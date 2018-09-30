import path from 'path';
import globby from 'globby';
import { sortBy, assign, flatMap, groupBy } from 'lodash';

export const DEFAULT_GLOB_PATTERNS = Object.freeze([
  './migrations/*.{co,coffee,eg,iced,js,litcoffee,ls,ts}',
  '!*.{spec,test}.{co,coffee,eg,iced,js,litcoffee,ls,ts}',
]);

export const DEFAULT_GLOB_OPTIONS = {
  gitignore: false,
};

export default class FsMigrations {
  constructor(globPatterns, sortDirsSeparately, globbyConfig) {
    if (globPatterns && !Array.isArray(globPatterns)) {
      globPatterns = [globPatterns];
    }

    this.globPatterns = globPatterns || DEFAULT_GLOB_PATTERNS;
    this.sortDirsSeparately = sortDirsSeparately || false;
    this.globbyConfig = assign({}, DEFAULT_GLOB_OPTIONS, globbyConfig || {});
  }

  /**
   * Gets the migration names
   * @returns Promise<string[]>
   */
  getMigrations(globPatterns = this.globPatterns) {
    // Get a list of files in all specified migration directories
    return globby(globPatterns, this.globbyConfig)
      .then((matches) => {
        return matches.map((file) => ({
          file: path.basename(file),
          directory: path.dirname(file),
        }));
      })
      .then((matches) => {
        if (this.sortDirsSeparately) {
          return flatMap(groupBy(matches, 'directory'));
        } else {
          return sortBy(matches, 'file');
        }
      });
  }

  getMigrationName(migration) {
    return migration.file;
  }

  getMigration(migration) {
    const absoluteDir = path.resolve(process.cwd(), migration.directory);
    return require(path.join(absoluteDir, migration.file));
  }
}
