const NODE_VERSION = Number((/v(\d+)/i.exec(process.version) || [])[1]);
const isNode10 = NODE_VERSION === 10;
/** @returns {Promise<import("../../../").Config>}*/
export default async () => {
  const { default: config } = await import(
    isNode10
      ? '../knexfile-esm-module/knexfile'
      : '../knexfile-esm-module/knexfile.js'
  );
  return ({
    ...config,
    migrations: {
      directory: './mjs/migrations',
      extension: "mjs",
      loadExtensions: ['.mjs']
    },
    seeds: {
      directory: './mjs/seeds',
      extension: "mjs",
      loadExtensions: ['.mjs']
    }
  })
}