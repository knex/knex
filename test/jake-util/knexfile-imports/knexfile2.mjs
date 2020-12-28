
/** 
 * CASE: 'Unexpected token 'export'
 * can't import ../knexfile-esm-package/knexfile.js as ESM Module
 * because package.json is not type 'module'
 */
export default async () => {
  const { default: config } = await import('../knexfile-esm-package/knexfile.js');
  return {
    ...config,
    migrations: {
      ...config.migrations,
      directory: './mjs/migrations',
    },
    seeds: {
      ...config.seeds,
      directory: './mjs/seeds',
    }
  };
}
