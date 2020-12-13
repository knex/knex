/**
 * imports 'mjs', else requires.
 * NOTE: require me late!
 * @param {string} filepath
 * @todo WARN on version 10 and '--experimental-modules' and '--esm'
 */
const isTypeModule = process.env.npm_package_type === 'module'
module.exports = function importFile(filepath) {
  return isTypeModule || filepath.endsWith('.mjs')
    ? import(require('url').pathToFileURL(filepath))
    : require(filepath);
};
