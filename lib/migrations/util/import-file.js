const isModuleType = require('./is-module-type');

/**
 * imports 'mjs', else requires.
 * NOTE: require me late!
 * @param {string} filepath
 */
module.exports = async function importFile(filepath) {
  return (await isModuleType(filepath))
    ? import(require('url').pathToFileURL(filepath))
    : require(filepath);
};
