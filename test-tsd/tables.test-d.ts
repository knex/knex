import Knex from '../types';
import { clientConfig } from './common';
import { expectType } from 'tsd';

const knex = Knex(clientConfig);

interface User {
  id: number;
  age: number;
  name: string;
  active: boolean;
  departmentId: number;
}

interface Department {
  id: number;
  departmentName: string;
}

interface Article {
  id: number;
  subject: string;
  body?: string;
  authorId?: string;
}

interface Ticket {
  name: string;
  from: string;
  to: string;
  at: Date;
}

declare module '../types/tables' {
  interface Tables {
    users_inferred: User;
    departments_inferred: Department;
    articles_inferred: Article;
    users_composite: Knex.CompositeTableType<
      User,
      { insert: 'insert' },
      { update: 'update' }
    >;
    departments_composite: Knex.CompositeTableType<
      Department,
      { insert: 'insert' },
      { update: 'update' }
    >;
    articles_composite: Knex.CompositeTableType<
      Article,
      { insert: 'insert' },
      { update: 'update' }
    >;
  }
}

const main = async () => {
  // # Select:

  expectType<any[]>(await knex('users'));

  // This test (others similar to it) may seem useless but they are needed
  // to test for left-to-right inference issues eg: #3260
  expectType<User[]>(await knex('users'));
  expectType<User[]>(await knex<User>('users'));
  expectType<User[]>(await knex('users_inferred'));
  expectType<User[]>(await knex('users_composite'));

  expectType<any[]>(await knex('users').select('id'));
  expectType<Partial<User>[]>(await knex('users').select('id'));

  expectType<Pick<User, 'id'>[]>(await knex('users_inferred').select('id'));
  expectType<Pick<User, 'id'>[]>(await knex('users_composite').select('id'));
  expectType<Pick<User, 'id' | 'age'>[]>(
    await knex('users_inferred').select('id').select('age')
  );

  expectType<Pick<User, 'id' | 'age'>[]>(
    await knex('users_composite').select('id').select('age')
  );

  expectType<Pick<User, 'id' | 'age'>[]>(
    await knex('users_inferred').select('id', 'age')
  );
  expectType<Pick<User, 'id' | 'age'>[]>(
    await knex('users_composite').select('id', 'age')
  );

  expectType<Pick<User, 'id'> | undefined>(
    await knex.first('id').from('users_inferred')
  );
  expectType<Pick<User, 'id'> | undefined>(
    await knex.first('id').from('users_composite')
  );
};
