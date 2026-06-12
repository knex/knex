// ESM-specific types for Knex.js
// This file provides ESM type definitions that wrap the CJS types from index.d.ts
// to match the exports defined in knex.mjs
import type { Knex, knex as _knex } from './types/index.d.ts';

// Re-declare the knex factory function for ESM consumers.
// This matches the call signature from the CJS types.
declare function knex<TRecord extends {} = any, TResult = unknown[]>(
  config: Knex.Config | string
): Knex<TRecord, TResult>;

// Re-declare the public interface for the exported Knex object
declare namespace knex {
  var QueryBuilder: typeof _knex.QueryBuilder;
  var TableBuilder: typeof _knex.TableBuilder;
  var ViewBuilder: typeof _knex.ViewBuilder;
  var SchemaBuilder: typeof _knex.SchemaBuilder;
  var ColumnBuilder: typeof _knex.ColumnBuilder;
  var KnexTimeoutError: typeof _knex.KnexTimeoutError;
  var Client: typeof _knex.Client;
}

export { knex, type Knex };
export default knex;
