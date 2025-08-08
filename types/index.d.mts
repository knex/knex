// ESM-specific types for Knex.js
// This file provides ESM type definitions that wrap the CJS types from index.d.ts
// to match the exports defined in knex.mjs

import type knexCjs from './index.d.ts';

// Re-export the named export as defined in knex.mjs, without circular self-reference
export const knex: Omit<typeof knexCjs, 'default' | 'knex'>;

// Re-export the default export as defined in knex.mjs: export default knex
export default knex;
