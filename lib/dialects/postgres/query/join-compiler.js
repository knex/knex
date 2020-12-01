function buildUpdateJoin(queryCompiler) {
  const { returning } = queryCompiler.single;
  const joins = queryCompiler.grouped.join;

  const sql = '';

  return {
    sql,
    returning,
  };
}

module.exports = {
  buildUpdateJoin,
};

/*

UPDATE foreign_keys_table_one
SET name = 'bahaha2'
FROM foreign_keys_table_three
WHERE foreign_keys_table_one.fkey_three = foreign_keys_table_three.id
AND foreign_keys_table_three.name = 'fk_three-2'

 */
