import config from '../knexfile-mjs/knexfile.mjs';
/** Named exports */
export const { client, connection, useNullAsDefault, migrations, seeds } = {
  ...config,
  migrations: {
    ...config.migrations,
    directory: './mjs/migrations',
  },
  seeds: {
    ...config.seeds,
    directory: './mjs/seeds',
  },
};
