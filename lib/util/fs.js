const fs = require('fs');
const os = require('os');
const path = require('path');
const { promisify } = require('util');
const mkdirp = require('mkdirp');

// Promisify common fs functions.
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);

/**
 * Creates a temporary directory and returns it path.
 *
 * @returns {Promise<string>}
 */
function createTemp() {
  return promisify(fs.mkdtemp)(`${os.tmpdir()}${path.sep}`);
}

/**
 * Ensures the given path exists.
 *  - If the path already exist, it's fine - it does nothing.
 *  - If the path doesn't exist, it will create it.
 *
 * @param {string} path
 * @returns {Promise}
 */
function ensureDirectoryExists(dir) {
  return stat(dir).catch(() => mkdirp(dir));
}

/**
 * Read a directory,
 * sorting folders and files by alphabetically order.
 * Can be browsed recursively.
 *
 * @param {string} dir
 * The directory to analyse
 *
 * @param {boolean} recursive
 * Browse directory recursively
 *
 * @returns {Promise<[string]>}
 * All found files, concatenated to the current dir
 */
async function getFilepathsInFolder(dir, recursive = false) {
  const results = [];
  const pathsList = await readdir(dir);
  await Promise.all(
    pathsList.sort().map(async (currentPath) => {
      const currentFile = path.resolve(dir, currentPath);
      const statFile = await stat(currentFile);
      if (statFile && statFile.isDirectory()) {
        if (recursive) {
          const subFiles = await getFilepathsInFolder(currentFile, true);
          results.push(...subFiles);
        }
      } else {
        results.push(currentFile);
      }
    })
  );
  return results;
}

module.exports = {
  stat,
  readdir,
  readFile,
  writeFile,
  createTemp,
  ensureDirectoryExists,
  getFilepathsInFolder,
};
