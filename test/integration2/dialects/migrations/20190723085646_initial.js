async function up(knex) {
  await knex.schema.createTable('users', t => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('email').notNullable();
    t.string('password').notNullable();
    t.jsonb('json_key').notNullable();
  });
}

async function down(knex) {
  await knex.schema.dropTable('users');
}

module.exports = { up, down };