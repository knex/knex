exports.up = function up(knex) {
  if(knex.client.dialect !== 'mssql') {
    throw new Error('mssql only supported for this test setup at the moment')
  }
  return knex.raw('CREATE SCHEMA testSchema')
}

exports.down = function down(knex) {
  if(knex.client.dialect !== 'mssql') {
    throw new Error('mssql only supported for this test setup at the moment')
  }
  return knex.raw('DROP SCHEMA testSchema');
}
