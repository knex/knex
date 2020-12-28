import Knex from '../types';
import { expectType } from 'tsd';
import { clientConfig } from './common';

const knex = Knex(clientConfig);

// Use:
// import Knex from 'knex'
// when "esModuleInterop": true

// This would be `declare module 'knex'` in runtime code
declare module '../types' {
  interface QueryBuilder {
    customSelect<TRecord, TResult>(
      value: number
    ): QueryBuilder<TRecord, TResult>;
  }
}

Knex.QueryBuilder.extend('customSelect', function (value: number) {
  return this.select(this.client.raw(`${value} as value`));
});

const main = async () => {
  expectType<number[]>(await knex('users').customSelect<any, number[]>(42));
};
