/**
 * @returns {Promise<import("../../../").Config>}
 * */
export default async () => {
  return {
    ...(await import('../knexfile-esm/knexfile.default.js')).default,
    migrations: {
      directory: './mjs/migrations',
      loadExtensions: ['.mjs'],
    },
    seeds: {
      directory: './mjs/seeds',
      loadExtensions: ['.mjs'],
    },
  };
};
