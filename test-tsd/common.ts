import type { Knex } from "../types";

export const clientConfig: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: './mydb.sqlite',
  },
};
