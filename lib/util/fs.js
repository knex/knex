const fs = require('fs');
const { promisify } = require('util');
const mkdirp = require('mkdirp');

/**
 * Ensures the given path exists.
 *  - If the path already exist, it's fine - it does nothing.
 *  - If the path doesn't exist, it will create it.
 *
 * @param {string} path
 * @returns {boolean}
 */
function ensureDirectoryExists(dir) {
  return promisify(fs.stat)(dir).catch(() => mkdirp(dir));
}

module.exports = {
  ensureDirectoryExists,
};
