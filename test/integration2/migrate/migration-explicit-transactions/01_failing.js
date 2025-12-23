const tableName = 'knex_test_cond_mig_trans';
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    await trx.schema.createTable(tableName, (tb) => {
      tb.increments('id');
    });
    await trx.insert({ id: 1 }).into(tableName);
    await trx.raw('oh noes');
  });
};
exports.down = function () {};
exports.config = { transaction: false };
