// When run via npm, we can leverage the injected environment variables to infer the import type
const isTypeModule = process.env.npm_package_type === 'module'

/**
 * imports 'mjs', else requires.
 * NOTE: require me late!
 * @param {string} filepath
 * @todo WARN on version 10 and '--experimental-modules' and '--esm'
 */
module.exports = function importFile(filepath) {
  return isTypeModule || filepath.endsWith('.mjs')
    ? import(require('url').pathToFileURL(filepath))
    : require(filepath);
};
