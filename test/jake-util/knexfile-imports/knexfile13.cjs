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
      directory: './js/migrations',
    },
    seeds: {
      directory: './js/seeds',
    },
  };
};