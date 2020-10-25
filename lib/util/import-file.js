/**
 * imports 'mjs', else requires.
 * NOTE: require me late!
 * @param {string} filepath
 * @todo WARN on version 10 and '--experimental-modules' and '--esm'
 */
const pkgDir = require('pkg-dir');

const consumingPackageIsModule = async () => {
  const packageDirectory = await pkgDir(process.cwd());
  const consumingPackageJson = require(path.resolve(
    packageDirectory,
    'package.json'
  ));
  return consumingPackageJson.type === 'module';
};

module.exports = async function importFile(filepath) {
  if (await consumingPackageIsModule) {
    return import(require('url').pathToFileURL(filepath));
  }
  return filepath.endsWith('.mjs')
    ? import(require('url').pathToFileURL(filepath))
    : require(filepath);
};
