import Knex from '../types';
import { expectType } from 'tsd';

const clientConfig = {
  client: 'sqlite3',
  connection: {
    filename: './mydb.sqlite',
  },
};

const knex = Knex(clientConfig);

// Use:
// import Knex from 'knex'
// when "esModuleInterop": true

declare module 'knex' {
  interface QueryBuilder {
    customSelect<TRecord, TResult>(value: number): QueryBuilder<TRecord, TResult>;
  }
}

Knex.QueryBuilder.extend('customSelect', function(value: number) {
  return this.select(this.client.raw(`${value} as value`));
});

const main = async () => {
  expectType<number[]> (await knex('users').customSelect<any, number[]>(42));
}
