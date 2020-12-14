const knex = require('./lib/index');

const database = knex({
  client: 'sqlite3',
  connection: {
    filename: './mydb.sqlite',
  },
});

async function run() {
  await database.schema.alterTable('test', (table) => {
    table.string(`test_${Math.floor(Math.random() * 100000)}`).primary();
  });

  database.destroy();
}

run();
