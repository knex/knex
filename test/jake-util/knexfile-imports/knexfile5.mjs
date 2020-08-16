import module from "module";
/** 
 *  Importing commonjs from a mjs module
 * @returns {Promise<import("../../../").Config>}
 * */
export default async () => {
  const require = module.createRequire(
    import.meta.url
  )
  const config = require('../knexfile-esm/knexfile.cjs');
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