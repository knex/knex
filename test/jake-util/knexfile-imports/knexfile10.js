/**
 * Dynamic ESM 'js' import from commonjs
 * esm: migrations/seeds
 * @returns {Promise<import("../../../").Config>}
 * */
module.exports = async () => {
  const { default: config } = await import(
    '../knexfile-esm/knexfile.default.js'
  );
  return {
    ...config,
    migrations: {
      directory: './esm/migrations',
    },
    seeds: {
      directory: './esm/seeds',
    },
  };
};
