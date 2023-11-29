const config = require('../knexfile-esm/knexfile.cjs');
/**
 * static cjs import
 * js: migrations/seeds
 * @returns {Promise<import("../../../").Config>}
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
