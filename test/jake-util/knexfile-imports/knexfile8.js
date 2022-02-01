/**
 * @returns {Promise<import("../../../").Config>}
 * */
export default async () => {
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
