#!/usr/bin/env node

import Knex from 'knex';

const knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: './data.db',
  },
});
