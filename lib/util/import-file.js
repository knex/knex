/**
 * imports 'mjs', else requires.
 * NOTE: require me late!
 * @param {string} filepath
 */
module.exports = function importFile(filepath) {
  return filepath.endsWith('.mjs')
    ? import(require('url').pathToFileURL(filepath))
    : require(filepath);
};
