// Tests that ESM consumers can resolve knex/types/* subpath exports
// as documented in https://knexjs.org/guide/#typescript

import { expect, test } from 'tstyche';
import type { Registry } from 'knex/types/result.js';
import type { Tables } from 'knex/types/tables.js';

test('knex/types/result.js Registry is importable and augmentable', () => {
  expect<Registry>().type.not.toBe<never>();
});

test('knex/types/tables.js Tables is importable and augmentable', () => {
  expect<Tables>().type.not.toBe<never>();
});

// Verify module augmentation works for result types
declare module 'knex/types/result.js' {
  interface Registry {
    Count: number;
  }
}

test('augmented Registry has Count as number', () => {
  expect<Registry['Count']>().type.toBe<number>();
});

// Verify module augmentation works for table types
declare module 'knex/types/tables.js' {
  interface Tables {
    users: { id: number; name: string };
  }
}

test('augmented Tables has users table type', () => {
  expect<Tables['users']>().type.toBe<{ id: number; name: string }>();
});
