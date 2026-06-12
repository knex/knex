
export const seed = async (knex) => {
  // Deletes ALL existing entries
  await knex('table_name').del();
  
  // Inserts seed entries
  await knex('table_name').insert([
    {id: 1, colName: 'rowValue1'},
    {id: 2, colName: 'rowValue2'},
    {id: 3, colName: 'rowValue3'}
  ]);
};
