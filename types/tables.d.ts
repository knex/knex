// Placeholder interface for Table -> Record mapping
// Allows to define the mapping of tables and interfaces in one place
// and to have correct types when using `knex.from('table')`
export interface Tables {}

// Utility type for creating composite table types
export type CompositeTableType<TBase, TInsert = TBase, TUpdate = Partial<TInsert>> = {
  base: TBase,
  insert: TInsert,
  update: TUpdate,
};
