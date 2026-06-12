const getPackageType = require('get-package-type');

module.exports = async function isModuleType(filepath) {
  return (
    filepath.endsWith('.mjs') ||
    (!filepath.endsWith('.cjs') &&
      (await getPackageType(filepath)) === 'module')
  );
};
