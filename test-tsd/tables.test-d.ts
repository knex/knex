import { knex, Knex } from '../types';
import { clientConfig, User, Department, Article } from './common';
import { expectType } from 'tsd';
import { expectTypeOf } from 'expect-type';
import type { Tables } from '../types/tables';

const knexInstance = knex(clientConfig);

declare module '../types/tables' {
  type CompositeDiscrete = {
    col_select: 'selectable';
    col_insert: 'insertable';
    col_update: 'updateable';
    col_upsert: 'upsertable';
  };

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
    composite: Knex.CompositeTableType<
      CompositeDiscrete,
      Pick<CompositeDiscrete, 'col_insert'>,
      Pick<CompositeDiscrete, 'col_update'>,
      Pick<CompositeDiscrete, 'col_upsert'>
    >;
  }
}

type Values<T> = T[keyof T];
type Simplify<T> = { [K in keyof T]: T[K] } & {};
type Scopes = Simplify<keyof Knex.CompositeTableType<any>>;
type Columns<Table extends keyof Tables, Scope extends Scopes> = Values<
  Knex.ResolveTableType<Tables[Table], Scope>
>;

const main = async () => {
  // validate Tables.composite
  expectTypeOf<
    'selectable' | 'insertable' | 'updateable' | 'upsertable'
  >().toEqualTypeOf<Columns<'composite', 'base'>>();
  expectTypeOf<'insertable'>().toEqualTypeOf<Columns<'composite', 'insert'>>();
  expectTypeOf<'updateable'>().toEqualTypeOf<Columns<'composite', 'update'>>();
  expectTypeOf<'upsertable'>().toEqualTypeOf<Columns<'composite', 'upsert'>>();

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

  expectTypeOf(
    await knexInstance.from('users_inferred').pluck('id')
  ).toEqualTypeOf<number[]>();
  expectTypeOf(
    await knexInstance.from('users_composite').pluck('id')
  ).toEqualTypeOf<number[]>();

  // these assertions can't currently fail, since `string` is an overload on increment/decrement
  expectTypeOf(
    await knexInstance.from('composite').increment('col_update')
  ).toEqualTypeOf<number>();
  expectTypeOf(
    await knexInstance.from('composite').decrement('col_update')
  ).toEqualTypeOf<number>();

  // these can, since they use the record form
  expectTypeOf(
    await knexInstance.from('composite').increment({ col_update: 1 })
  ).toEqualTypeOf<number>();
  expectTypeOf(
    await knexInstance.from('composite').decrement({ col_update: 1 })
  ).toEqualTypeOf<number>();

  // @ts-expect-error
  knexInstance.from('composite').increment({ col_select: 1 });
  // @ts-expect-error
  knexInstance.from('composite').decrement({ col_select: 1 });

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
