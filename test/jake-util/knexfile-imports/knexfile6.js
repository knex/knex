import module from 'module';
const NODE_VERSION = Number((/v(\d+)/i.exec(process.version) || [])[1]);
const isNode10 = NODE_VERSION === 10;
/**
 *  Importing commonjs from a js ESM module
 * @returns {Promise<import("../../../").Config>}
 * */
export default async () => {
  let config;
  if (typeof require === 'undefined') {
    // This shouldn't happen
    // you could NOT load this knexfile
    // if you didn't  pass the '--esm' flag
    // unless you are transpiling it
    if (isNode10) {
      require = (await import('esm')).default(
        new module.Module(import.meta.url)
      );
    } else {
      // Node 12 & 14
      require = module.createRequire(import.meta.url);
    }
  }
  config = require('../knexfile-esm/knexfile.cjs');
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
