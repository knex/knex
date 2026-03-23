// Tests that ESM consumers can use the standard import patterns
// and access all commonly-used Knex types.
import { expect, test } from 'tstyche';
import knex, { type Knex } from 'knex';

test('knex is callable with config object', () => {
  expect(knex({ client: 'pg' })).type.toBe<Knex<any, unknown[]>>();
});

test('knex is callable with string', () => {
  expect(knex('postgres://localhost/test')).type.toBe<Knex<any, unknown[]>>();
});

test('Knex.Config is usable', () => {
  const config: Knex.Config = { client: 'pg' };
  expect(config).type.toBeAssignableTo<Knex.Config>();
});

test('Knex.Transaction is available', () => {
  expect<Knex.Transaction>().type.not.toBe<never>();
});

test('Knex.QueryBuilder is available', () => {
  expect<Knex.QueryBuilder>().type.not.toBe<never>();
});

test('Knex.Raw is available', () => {
  expect<Knex.Raw>().type.not.toBe<never>();
});
