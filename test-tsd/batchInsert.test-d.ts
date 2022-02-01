import Knex from '../types';
import { expectError, expectType } from 'tsd';
import { clientConfig } from './common';

const knex = Knex(clientConfig);

// Use:
// import Knex from 'knex'
// when "esModuleInterop": true

const main = async () => {
  // default returning is number[]
  expectType<number[]>(await knex.batchInsert('table', [{a: 2, id: 3}] as const, 12));

  // allows any data
  expectType<any[]>(await knex.batchInsert('table', [{a: 2, id: 3}] as any[], 12).returning('abc'));

  // allows any data
  expectType<any[]>(await knex.batchInsert('table', [{a: 2, id: 3}] as any, 12).returning('abc'));

  // returning '*' allowed, return full record
  expectType<Array<{a: boolean, id: number}>>(await knex.batchInsert('table', [{a: false, id: 3}], 12).returning('*'));

  // one column for returning
  expectType<Array<{aa2: string}>>(await knex.batchInsert('table', [{aa2: 'string', b: 3}], 12).returning('aa2'));

  // many columns for returning
  expectType<Array<{aa2: string, b: boolean}>>(await knex.batchInsert('table', [{aa2: 'string', b: false, c: 12}], 12).returning(['aa2', 'b']));

  // assert bad column in returning gives error
  expectError(
    knex.batchInsert('table', [{aa2: 'string', b: false, c: 12}], 12)
      .returning('bad_column')
  );

  // assert any bad column from returning list gives error
  expectError(
    knex.batchInsert('table', [{aa2: 'string', b: false, c: 12}], 12)
      .returning(['aa2', 'bad_column'] as const)
  );

  // validates insert data
  expectError(knex.batchInsert<{aa2: string, c: number}>('table', [{aa2: 'string', b: false, c: 12}], 12));

  expectType<number[]>(await knex.batchInsert('table', [{a: 2, id: 3}] as const, 12).transacting(await knex.transaction()));
};
