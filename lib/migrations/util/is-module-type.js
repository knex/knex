const { readFile } = require('./fs');

module.exports = async function isModuleType(filepath) {
  if (process.env.npm_package_json) {
    // npm >= 7.0.0
    const packageJson = JSON.parse(
      await readFile(process.env.npm_package_json, 'utf-8')
    );
    if (packageJson.type === 'module') {
      return true;
    }
  }
  return process.env.npm_package_type === 'module' || filepath.endsWith('.mjs');
};
