// Tests that ESM consumers can resolve knex/types/* subpath exports
// as documented in https://knexjs.org/guide/#typescript

import { expect, test } from 'tstyche';
import type { Registry } from 'knex/types/result';
import type { Tables } from 'knex/types/tables';

test('knex/types/result Registry is importable and augmentable', () => {
  expect<Registry>().type.not.toBe<never>();
});

test('knex/types/tables Tables is importable and augmentable', () => {
  expect<Tables>().type.not.toBe<never>();
});

// Verify module augmentation works for result types
declare module 'knex/types/result' {
  interface Registry {
    CountCJS: number;
  }
}

test('augmented Registry has Count as number', () => {
  expect<Registry['CountCJS']>().type.toBe<number>();
});

// Verify module augmentation works for table types
declare module 'knex/types/tables' {
  interface Tables {
    users_cjs: { id: number; name: string };
  }
}

test('augmented Tables has users table type', () => {
  expect<Tables['users_cjs']>().type.toBe<{ id: number; name: string }>();
});
