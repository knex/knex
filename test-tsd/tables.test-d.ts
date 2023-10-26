import { knex, Knex } from '../types';
import { clientConfig, User, Department, Article } from './common';
import { expectType, expectAssignable } from 'tsd';

const knexInstance = knex(clientConfig);

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

  expectType<any[]>(await knexInstance('users'));

  // This test (others similar to it) may seem useless but they are needed
  // to test for left-to-right inference issues eg: #3260
  expectType<User[]>(await knexInstance('users'));
  expectType<User[]>(await knexInstance<User>('users'));
  expectType<User[]>(await knexInstance('users_inferred'));
  expectType<User[]>(await knexInstance('users_composite'));

  expectType<any[]>(await knexInstance('users').select('id'));
  expectType<Partial<User>[]>(await knexInstance('users').select('id'));

  expectType<Pick<User, 'id'>[]>(
    await knexInstance('users_inferred').select('id')
  );
  expectType<Pick<User, 'id'>[]>(
    await knexInstance('users_composite').select('id')
  );
  expectType<Pick<User, 'id' | 'age'>[]>(
    await knexInstance('users_inferred').select('id').select('age')
  );

  expectType<Pick<User, 'id' | 'age'>[]>(
    await knexInstance('users_composite').select('id').select('age')
  );

  expectType<Pick<User, 'id' | 'age'>[]>(
    await knexInstance('users_inferred').select('id', 'age')
  );
  expectType<Pick<User, 'id' | 'age'>[]>(
    await knexInstance('users_composite').select('id', 'age')
  );

  expectType<Pick<User, 'id'> | undefined>(
    await knexInstance.first('id').from('users_inferred')
  );
  expectType<Pick<User, 'id'> | undefined>(
    await knexInstance.first('id').from('users_composite')
  );

  expectType<Record<keyof User, Knex.ColumnInfo>>(
    await knexInstance<User>('users').columnInfo()
  );
  expectType<Record<string | number | symbol, Knex.ColumnInfo>>(
    await knexInstance('users').columnInfo()
  );
  expectType<Record<keyof User, Knex.ColumnInfo>>(
    await knexInstance('users_inferred').columnInfo()
  );
  expectType<Record<keyof User, Knex.ColumnInfo>>(
    await knexInstance('users_composite').columnInfo()
  );
  expectType<Knex.ColumnInfo>(
    await knexInstance('users_inferred').columnInfo('id')
  );
  expectType<Knex.ColumnInfo>(
    await knexInstance('users_composite').columnInfo('id')
  );
  expectType<Knex.ColumnInfo>(await knexInstance('users').columnInfo('id'));
  expectType<Knex.ColumnInfo>(
    await knexInstance<User>('users').columnInfo('id')
  );

  //These tests simply check if type work by showing that it does not throw syntax error

  knexInstance.schema.createTable('testTable', (table) => {
    table
      .foreign('fkey_three')
      .references('non_exist.id')
      .withKeyName('non_for1')
      .deferrable('deferred');
    table
      .foreign('fkey_threee')
      .references('non_exist.id')
      .deferrable('deferred')
      .withKeyName('non_for2');
    table
      .integer('num')
      .references('non_exist.id')
      .deferrable('immediate')
      .withKeyName('non_for3');
    table
      .integer('num')
      .references('non_exist.id')
      .withKeyName('non_for4')
      .deferrable('deferred')
      .onDelete('CASCADE');
    table
      .integer('num')
      .references('non_exist.id')
      .withKeyName('non_for5')
      .deferrable('deferred')
      .onDelete('CASCADE');
    table
      .integer('num')
      .references('id')
      .inTable('non_exist')
      .withKeyName('non_for6')
      .deferrable('deferred')
      .onDelete('CASCADE');
    table
      .integer('num')
      .references('id')
      .withKeyName('non_for7')
      .deferrable('deferred')
      .inTable('non_exist')
      .onDelete('CASCADE');
    table
      .integer('num')
      .references('id')
      .inTable('non_exist')
      .onDelete('CASCADE')
      .withKeyName('non_for6')
      .deferrable('deferred');
    table
      .integer('num')
      .references('id')
      .withKeyName('non_for7')
      .onDelete('CASCADE')
      .deferrable('deferred')
      .inTable('non_exist');

    table.enu('myenum', null, {
      enumName: 'MyEnum',
      useNative: true,
      existingType: true,
    });

    expectType<Knex.ReferencingColumnBuilder>(
      table
        .integer('num')
        .references('id')
        .withKeyName('non_for7')
        .onDelete('CASCADE')
        .index('idx') // this shouldn't break type in chain
        .deferrable('deferred')
        .inTable('non_exist')
    );
  });
};
