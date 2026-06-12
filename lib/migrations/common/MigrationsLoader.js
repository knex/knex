const path = require('path');
const DEFAULT_LOAD_EXTENSIONS = Object.freeze([
  '.co',
  '.coffee',
  '.eg',
  '.iced',
  '.js',
  '.cjs',
  '.litcoffee',
  '.ls',
  '.ts',
]);

class AbstractMigrationsLoader {
  constructor(migrationDirectories, sortDirsSeparately, loadExtensions) {
    this.sortDirsSeparately = sortDirsSeparately;

    if (!Array.isArray(migrationDirectories)) {
      migrationDirectories = [migrationDirectories];
    }
    this.migrationsPaths = migrationDirectories;
    this.loadExtensions = loadExtensions || DEFAULT_LOAD_EXTENSIONS;
  }

  getFile(migrationsInfo) {
    const absoluteDir = path.resolve(process.cwd(), migrationsInfo.directory);
    const _path = path.join(absoluteDir, migrationsInfo.file);
    const importFile = require('../util/import-file'); // late import
    return importFile(_path);
  }
}

module.exports = {
  DEFAULT_LOAD_EXTENSIONS,
  AbstractMigrationsLoader,
};
