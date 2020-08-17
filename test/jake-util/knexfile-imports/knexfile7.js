import config from '../knexfile-esm/knexfile.default.js';
/**
 * @returns {import("../../../").Config}
 * */
export default {
  ...config,
  migrations: {
    directory: './esm/migrations',
  },
  seeds: {
    directory: './esm/seeds',
  },
};
