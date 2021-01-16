const config = require('../knexfile-esm/knexfile.cjs');
/**
 * static cjs import
 * cjs: migrations/seeds
 * @returns {Promise<import("../../../").Config>}
 * */
module.exports = async () => {

  return {
    ...config,
    migrations: {
      directory: './cjs/migrations',
    },
    seeds: {
      directory: './cjs/seeds',
      loadExtensions: ['.cjs']
    },
  };
};