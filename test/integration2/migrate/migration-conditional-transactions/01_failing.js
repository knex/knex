const tableName = 'knex_test_cond_mig_trans';
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (tb) => {
    tb.increments('id');
  });
  await knex.insert({ id: 1 }).into(tableName);
  await knex.raw('oh noes');
};
exports.down = function () {};
exports.config = { transaction: 'false_if_sqlite' };
