import Knex from '../types';
import { clientConfig, User } from './common';
import { expectType } from 'tsd';

const knex = Knex(clientConfig);

const main = async () => {
  expectType<User[]>(
    await knex<User>('users')
      .groupBy('count')
      .orderBy('name', 'desc')
      .havingNull('age')
  );

  expectType<User[]>(
    await knex<User>('users')
      .groupBy('count')
      .orderBy('name', 'desc')
      .havingNull('age')
      .orHavingNull('name')
  );

  expectType<User[]>(
    await knex<User>('users')
      .groupBy('count')
      .orderBy('name', 'desc')
      .havingNotNull('age')
  );

  expectType<User[]>(
    await knex<User>('users')
      .groupBy('count')
      .orderBy('name', 'desc')
      .havingNotNull('age')
      .orHavingNotNull('name')
  );
};
