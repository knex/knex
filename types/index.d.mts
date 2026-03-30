// ESM-specific types for Knex.js
// This file provides ESM type definitions that wrap the CJS types from index.d.ts
// to match the exports defined in knex.mjs

import type { Knex } from './index.d.ts';

// Re-declare the knex factory function for ESM consumers.
// This matches the call signature from the CJS types.
declare function knex<TRecord extends {} = any, TResult = unknown[]>(
  config: Knex.Config | string
): Knex<TRecord, TResult>;

export { knex, Knex };
export default knex;
