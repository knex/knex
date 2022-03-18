const getPackageType = require('get-package-type');

module.exports = async function isModuleType(filepath) {
  return (
    filepath.endsWith('.mjs') ||
    (!filepath.endsWith('.cjs') &&
      (process.env.npm_package_type === 'module' ||
        (await getPackageType(filepath)) === 'module'))
  );
};
