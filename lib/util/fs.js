const fs = require('fs');
const os = require('os');
const path = require('path');
const { promisify } = require('util');
const mkdirp = require('mkdirp');

/**
 * Promisified version of fs.stat() function.
 *
 * @param {string} path
 * @returns {Promise}
 */
const stat = promisify(fs.stat);

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

module.exports = {
  stat,
  createTemp,
  ensureDirectoryExists,
};
