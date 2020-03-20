const fs = require('fs');
const { promisify } = require('util');
const mkdirp = require('mkdirp');

/**
 * Promisified verion fs.stat() function.
 *
 * @param {string} path
 * @returns {Promise}
 */
const stat = promisify(fs.stat);

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
  ensureDirectoryExists,
};
