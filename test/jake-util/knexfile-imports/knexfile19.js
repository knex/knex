/**
 * @returns {Promise<import("../../../").Config>}
 * */
export default async () => {
  return {
    ...(await import('../knexfile-esm/knexfile.default.js')).default,
    migrations: {
      directory: './cjs/migrations',
    },
    seeds: {
      directory: './cjs/seeds',
      loadExtensions: ['.cjs'],
    },
  };
};
