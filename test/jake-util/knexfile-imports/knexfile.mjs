import config from '../knexfile-mjs/knexfile.mjs'
/** Named exports */
export const { 
  client, 
  connection, 
  useNullAsDefault, 
  migrations, 
  seeds
} = {
  ...config,
  migrations: {
    ...config.migrations,
    directory: './mjs/migrations', // re-dir
  },
  seeds: {
    ...config.seeds,
    directory: './mjs/seeds', // re-dir
  }
};
