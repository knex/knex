const config = require('../knexfile-esm/knexfile.cjs');
/**
 * static cjs import
 * cjs: migrations/seeds
 * @returns {import("../../../").Config}
 * */
module.exports = async () => {

  return {
    ...config,
    migrations: {
      directory: './cjs/migrations',
    },
    seeds: {
      directory: './cjs/seeds',
    },
  };
};