exports.up = function up(knex) {
  return knex.schema
    .withSchema('testSchema')
    .createTable('LeftSide', (table) => {
      table.increments('LeftSideId').primary();
      table.string('EmailAddress').unique().notNullable();
    })
    .createTable('RightSide', (table) => {
      table.increments('RightSideId').primary();
      table.string('EmailAddress').unique().notNullable();
    })
    .createTable('ConnectionTable', (table) => {
      table.integer('LeftSideId').notNullable();
      table
        .foreign('LeftSideId')
        .references('testSchema.LeftSide.LeftSideId');
      table.integer('RightSideId').notNullable();
      table
        .foreign('RightSideId')
        .references('testSchema.RightSide.RightSideId');
      table.primary(['LeftSideId', 'RightSideId']);
    });
}

exports.down = function down(knex) {
  return knex.schema
    .withSchema('testSchema')
    .dropTable('ConnectionTable')
    .dropTable('RightSide')
    .dropTable('LeftSide');
}
