/** @type {import("../../../").Config} */
import { URL } from 'url';
import { dirname, resolve as resolvePath } from 'path';
const DIRNAME = dirname(new URL(import.meta.url).pathname);
const config = {
  client: 'sqlite3',
  connection: {
    filename: resolvePath(DIRNAME, '../test.sqlite3'),
  },
  migrations: {
    directory: resolvePath(DIRNAME, 'migrations'),
  },
  seeds: {
    directory: resolvePath(DIRNAME, 'seeds'),
  },
};
/** Named exports */
export const { client, connection, migrations, seeds } = config;
