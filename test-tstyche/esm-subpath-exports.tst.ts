// Tests that ESM consumers can resolve knex/types/* subpath exports.
// This validates the fix for https://github.com/knex/knex/issues/6403
// where Node's package "exports" field blocked access to type files
// needed for module augmentation (e.g. declare module "knex/types/result").

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
    Count: number;
  }
}

test('augmented Registry has Count as number', () => {
  expect<Registry['Count']>().type.toBe<number>();
});

// Verify module augmentation works for table types
declare module 'knex/types/tables' {
  interface Tables {
    users: { id: number; name: string };
  }
}

test('augmented Tables has users table type', () => {
  expect<Tables['users']>().type.toBe<{ id: number; name: string }>();
});
