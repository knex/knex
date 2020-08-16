/** @returns {Promise<import("../../../").Config>}*/
export default async () => {
  const { default: config } = await import('../knexfile-esm-module/knexfile.js');
  return ({
    ...config,
    migrations: {
      directory: './mjs/migrations',
      extension: "mjs",
      loadExtensions: ['.mjs']
    },
    seeds: {
      directory: './mjs/seeds', // re-dir
      extension: "mjs",
      loadExtensions: ['.mjs']
    }
  })
}