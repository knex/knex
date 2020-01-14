const config = {
  client: 'sqlite3',
  connection: {
    filename: '../test.sqlite3',
  },
  migrations: {
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  },
};
/** Named exports */
export const { client, connection, migrations, seeds } = config;
