import config from '../knexfile-esm/knexfile.cjs';
/**
 * Static 'cjs' import from js ESM with --esm interop
 * @returns {import("../../../").Config}
 * NOTE: this is NOT supported by NODE
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
