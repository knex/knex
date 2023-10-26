import { knex } from '../types';
import { expectType } from 'tsd';
import { clientConfig } from './common';

const knexInstance = knex(clientConfig);

// Use:
// import { Knex } from 'knex'

// This would be `declare module 'knex'` in runtime code
declare module '../types' {
  namespace Knex {
    interface QueryBuilder {
      customSelect<TRecord extends {}, TResult>(
        value: number
      ): Promise<Knex.QueryBuilder<TRecord, TResult>>;
    }
  }
}

knex.QueryBuilder.extend('customSelect', function (value: number) {
  return new Promise((r) =>
    r(this.select(this.client.raw(`${value} as value`)))
  );
});

const main = async () => {
  expectType<number[]>(
    await await knexInstance('users').customSelect<any, number[]>(42)
  );
};
