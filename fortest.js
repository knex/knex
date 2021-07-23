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
  try {
    const tableSQL = client
      .schemaBuilder()
      .createTable('person', function (table) {
        table.integer('user_id').unique({ deferrable: 'immediate' });
      })
      .toSQL();
    console.log(tableSQL);
  } catch (error) {
    //console.log(error);
  } finally {
    // await knex.schema.dropTable('my_table');
    // knex.destroy();
  }
}

main();
