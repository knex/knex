#!/usr/bin/env node

import Knex from 'knex';

const knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: './data.db',
  },
  useNullAsDefault: true,
});

const main = async () => {
  knex('books').insert({title: 'Slaughterhouse Five'});

  const rows = await knex.select('title', 'author', 'year').from('books');
  console.log(rows);
};

main();
