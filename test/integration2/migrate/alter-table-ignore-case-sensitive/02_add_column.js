exports.up = async (knex) => {
  // Use the same table but different case.
  await knex.schema.table('Some_Table', (table) => {
    table.string('other_id').after('id');
    table.string('name').after('other_id');
  });
};

exports.down = async (knex) => {
  await knex.schema.table('Some_Table', (table) => {
    table.dropColumns('other_id', 'name');
  });
};
