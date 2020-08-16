/** 
 * CASE: 'Unexpected token 'export'
 * can't import ../knexfile-esm-package/knexfile.js as ESM Module
 * because package.json is not type 'module'
 */
import config from '../knexfile-esm-package/knexfile.js'
/** */
export default {
  ...config,
  migrations: {
    ...config.migrations,
    directory: './mjs/migrations', // re-dir
  },
  seeds: {
    ...config.seeds,
    directory: './mjs/seeds', // re-dir
  }
}
