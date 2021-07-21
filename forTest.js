const Knex = require('./knex');
const PG_Client = require('./lib/dialects/postgres');
const client = new PG_Client({ client: 'pg' });

const knex = Knex({
  client: 'postgres',
  connection: {
    adapter: 'postgresql',
    port: 25432,
    host: 'localhost',
    database: 'knex_test',
    user: 'testuser',
    password: 'knextest',
  },
});

async function main() {
  const tableSql = client
    .schemaBuilder()
    .table('users', function (table) {
      table.string('email').primary().index().unique();
      table
        .foreign('fkey_two')
        .deferrable('deferred')
        .references('foreign_keys_table_two.id');
    })
    .toSQL();
  console.log(tableSql);
}

main();
