#!/usr/bin/env node

const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './data.db',
  },
});
