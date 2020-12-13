/**
 * imports 'mjs', else requires.
 * NOTE: require me late!
 * @param {string} filepath
 * @todo WARN on version 10 and '--experimental-modules' and '--esm'
 */
module.exports = function importFile(filepath) {
  return filepath.endsWith('.mjs') || process.env.npm_package_type === 'module'
    ? import(require('url').pathToFileURL(filepath))
    : require(filepath);
};
