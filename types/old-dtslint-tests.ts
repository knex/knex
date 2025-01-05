import { knex, Knex } from '../types';

const clientConfig = {
  client: 'sqlite3',
  connection: {
    filename: './mydb.sqlite',
  },
};

const knexInstance = knex(clientConfig);

const knex2 = knex({
  ...clientConfig,
  log: {
    debug(msg: string) {},
  },
  pool: {
    log: (msg: string, level: string) => {},
  },
});

knexInstance.initialize();
knexInstance.initialize({});

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

const main = async () => {
  // $ExpectType Pick<User, "id">[]
  await knexInstance<User>('users').insert({ id: 10 }, 'id');

  // $ExpectType User[]
  await knexInstance<User>('users').insert({ id: 10 }, '*');

  // $ExpectType User[]
  await knexInstance('users_inferred').insert({ id: 10 }, '*');

  // $ExpectError
  await knexInstance('users_composite').insert({ id: 10 }, '*');

  // $ExpectError
  await knexInstance('users_composite').insert({}, '*');

  // $ExpectType User[]
  await knexInstance('users_composite').insert({ insert: 'insert' }, '*');

  // $ExpectType User[]
  await knexInstance<User>('users').insert([{ id: 10 }], '*');

  // $ExpectType User[]
  await knexInstance('users_inferred').insert([{ id: 10 }], '*');

  // $ExpectError
  await knexInstance('users_composite').insert([{ id: 10 }], '*');

  // $ExpectError
  await knexInstance('users_composite').insert([{}], '*');

  // $ExpectType User[]
  await knexInstance('users_composite').insert([{ insert: 'insert' }], '*');

  // $ExpectType Pick<User, "id">[]
  await knexInstance.insert({ id: 10 }, 'id').into<User>('users');

  // $ExpectType Pick<User, "id">[]
  await knexInstance.insert({ id: 10 }, 'id').into('users_inferred');

  // $ExpectType Pick<User, "id">[]
  await knexInstance.insert({ insert: 'insert' }, 'id').into('users_composite');

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance<User>('users').insert({ id: 10 }).returning(['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance('users_inferred')
    .insert({ id: 10 })
    .returning(['id', 'age']);

  await knexInstance('users_composite')
    // $ExpectError
    .insert({ id: 10 })
    .returning(['id', 'age']);

  await knexInstance('users_composite')
    // $ExpectError
    .insert({})
    .returning(['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance('users_composite')
    .insert({ insert: 'insert' })
    .returning(['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance<User>('users')
    .insert({ id: 10 }, 'id')
    .returning(['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance('users_inferred')
    .insert({ id: 10 }, 'id')
    .returning(['id', 'age']);

  await knexInstance('users_composite')
    // $ExpectError
    .insert({ id: 10 }, 'id')
    .returning(['id', 'age']);

  await knexInstance('users_composite')
    // $ExpectError
    .insert({}, 'id')
    .returning(['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance('users_composite')
    .insert({ insert: 'insert' }, 'id')
    .returning(['id', 'age']);

  // $ExpectType any[]
  await knexInstance('users').insert({ id: 10 }).returning('*');

  // $ExpectType User[]
  await knexInstance<User>('users').insert({ id: 10 }).returning('*');

  // $ExpectType User[]
  await knexInstance('users_inferred').insert({ id: 10 }).returning('*');

  await knexInstance('users_composite')
    // $ExpectError
    .insert({ id: 10 })
    .returning('*');

  await knexInstance('users_composite')
    // $ExpectError
    .insert({})
    .returning('*');

  // $ExpectType User[]
  await knexInstance('users_composite')
    .insert({ insert: 'insert' })
    .returning('*');

  // $ExpectType any[]
  await knexInstance.insert({ id: 10 }).into('users').returning('*');

  // $ExpectType User[]
  await knexInstance.insert({ id: 10 }).into<User>('users').returning('*');

  // $ExpectType User[]
  await knexInstance.insert({ id: 10 }).into('users_inferred').returning('*');

  // $ExpectType User[]
  await knexInstance
    .insert({ insert: 'insert' })
    .into('users_composite')
    .returning('*');

  // $ExpectType User[]
  await knexInstance.insert({ id: 10 }).returning('*').into<User>('users');

  // $ExpectType User[]
  await knexInstance.insert({ id: 10 }).returning('*').into('users_inferred');

  // $ExpectType User[]
  await knexInstance.insert({ id: 10 }).returning('*').into('users_composite');

  // $ExpectType User[]
  await knexInstance<User>('users').insert({ id: 10 }, 'id').returning('*');

  // $ExpectType User[]
  await knexInstance('users_inferred').insert({ id: 10 }, 'id').returning('*');

  await knexInstance('users_composite')
    // $ExpectError
    .insert({ id: 10 }, 'id')
    .returning('*');

  await knexInstance('users_composite')
    // $ExpectError
    .insert({}, 'id')
    .returning('*');

  // $ExpectType User[]
  await knexInstance('users_composite')
    .insert({ insert: 'insert' }, 'id')
    .returning('*');

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance
    .insert({ id: 10 })
    .returning(['id', 'age'])
    .into<User>('users');

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance
    .insert({ id: 10 })
    .returning(['id', 'age'])
    .into('users_inferred');

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance
    .insert({ id: 10 })
    .returning(['id', 'age'])
    .into('users_composite');

  // $ExpectType any[]
  await knexInstance('users').insert({ id: 10 }).returning(['id', 'age']);

  // # Update

  // $ExpectType number
  await knexInstance('users').where('id', 10).update({ active: true });

  const qb1 = knexInstance('users').where('id', 10);
  qb1.returning(['id', 'name']);
  // $ExpectType Partial<User>[]
  await qb1.update<Partial<User>[]>({ active: true });

  // $ExpectType number
  await knexInstance<User>('users').where('id', 10).update({ active: true });

  // $ExpectType number
  await knexInstance('users_inferred').where('id', 10).update({ active: true });

  // $ExpectType number
  await knexInstance('users_composite')
    .where('id', 10)
    .update({ update: 'update' });

  await knexInstance('users_composite')
    // $ExpectError
    .update({ id: 10 });

  await knexInstance('users_composite')
    // $ExpectError
    .update({});

  // $ExpectType number
  await knexInstance.where('id', 10).update({ active: true }).from('users');

  // ## With Returning

  // $ExpectType any[]
  await knexInstance('users')
    .where('id', 10)
    .update({ active: true })
    .returning(['id', 'age']);

  // $ExpectType any[]
  await knexInstance('users')
    .where('id', 10)
    .update({ active: true })
    .returning('*');

  // $ExpectType User[]
  await knexInstance<User>('users')
    .where('id', 10)
    .update({ active: true })
    .returning('*');

  // $ExpectType User[]
  await knexInstance('users_inferred')
    .where('id', 10)
    .update({ active: true })
    .returning('*');

  // $ExpectType User[]
  await knexInstance('users_composite')
    .where('id', 10)
    // $ExpectError
    .update({})
    .returning('*');

  // $ExpectType User[]
  await knexInstance('users_composite')
    .where('id', 10)
    .update({ update: 'update' })
    .returning('*');

  // $ExpectType any[]
  await knexInstance
    .where('id', 10)
    .update({ active: true })
    .returning('*')
    .from('users');

  // $ExpectType User[]
  await knexInstance
    .where('id', 10)
    .update({ active: true })
    .returning('*')
    .from<User>('users');

  // $ExpectType User[]
  await knexInstance
    .where('id', 10)
    .update({ active: true })
    .returning('*')
    .from('users_inferred');

  // $ExpectType User[]
  await knexInstance
    .where('id', 10)
    .update({ update: 'update' })
    .returning('*')
    .from('users_composite');

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance<User>('users')
    .where('id', 10)
    .update({ active: true })
    .returning(['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance('users_inferred')
    .where('id', 10)
    .update({ active: true })
    .returning(['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance('users_composite')
    .where('id', 10)
    .update({ update: 'update' })
    .returning(['id', 'age']);

  await knexInstance('users_composite')
    .where('id', 10)
    // $ExpectError
    .update({ id: 11 })
    .returning(['id', 'age']);

  await knexInstance('users_composite')
    .where('id', 10)
    // $ExpectError
    .update({})
    .returning(['id', 'age']);

  // $ExpectType Pick<User, "id">[]
  await knexInstance<User>('users')
    .where('id', 10)
    .update({ active: true }, 'id');

  // $ExpectType Pick<User, "id">[]
  await knexInstance('users_inferred')
    .where('id', 10)
    .update({ active: true }, 'id');

  // $ExpectType Pick<User, "id">[]
  await knexInstance('users_composite')
    .where('id', 10)
    .update({ update: 'update' }, 'id');

  await knexInstance('users_composite')
    .where('id', 10)
    // $ExpectError
    .update({ id: 11 }, 'id');

  await knexInstance('users_composite')
    .where('id', 10)
    // $ExpectError
    .update({}, 'id');

  // $ExpectType Pick<User, "id">[]
  await knexInstance<User>('users')
    .where('id', 10)
    .update('active', true, 'id');

  // $ExpectType Pick<User, "id">[]
  await knexInstance('users_inferred')
    .where('id', 10)
    .update('active', true, 'id');

  // $ExpectType Pick<User, "id">[]
  await knexInstance('users_composite')
    .where('id', 10)
    .update('update', 'update', 'id');

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance<User>('users')
    .where('id', 10)
    .update({ active: true }, ['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance('users_inferred')
    .where('id', 10)
    .update({ active: true }, ['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance('users_composite')
    .where('id', 10)
    .update({ update: 'update' }, ['id', 'age']);

  await knexInstance('users_composite')
    .where('id', 10)
    // $ExpectError
    .update({ id: 11 }, ['id', 'age']);

  await knexInstance('users_composite')
    .where('id', 10)
    // $ExpectError
    .update({}, ['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance<User>('users')
    .where('id', 10)
    .update('active', true, ['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance('users_inferred')
    .where('id', 10)
    .update('active', true, ['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance('users_composite')
    .where('id', 10)
    .update('update', 'update', ['id', 'age']);

  const userUpdateReturnCols = ['id', 'age'] as const;
  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance<User>('users')
    .where('id', 10)
    .update({ active: true }, userUpdateReturnCols);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance('users_inferred')
    .where('id', 10)
    .update({ active: true }, userUpdateReturnCols);

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance('users_composite')
    .where('id', 10)
    .update({ update: 'update' }, userUpdateReturnCols);

  await knexInstance('users_composite')
    .where('id', 10)
    // $ExpectError
    .update({ id: 11 }, userUpdateReturnCols);

  await knexInstance('users_composite')
    .where('id', 10)
    // $ExpectError
    .update({}, userUpdateReturnCols);

  // TODO: .update('active', true', ['id', 'age']) does not works correctly
  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance
    .where('id', 10)
    .update({ active: true }, ['id', 'age'])
    .into<User>('users');

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance
    .where('id', 10)
    .update({ active: true }, ['id', 'age'])
    .into('users_inferred');

  // $ExpectType Pick<User, "id" | "age">[]
  await knexInstance
    .where('id', 10)
    .update({ update: 'update' }, ['id', 'age'])
    .into('users_composite');

  // # Insert onConflict
  await knexInstance
    .table<User>('users')
    .insert({ id: 10, active: true })
    .onConflict('id')
    .merge({ active: true })
    .returning('*');

  // # Regression test (https://github.com/knex/knex/issues/4101)
  // # Ensure that .debug() can be called on a query containing an onConflict clause.
  await knexInstance
    .table<User>('users')
    .insert({ id: 10, active: true })
    .onConflict('id')
    .merge({ active: true })
    .debug(true);

  // # Deletion
  // $ExpectType number
  await knexInstance<User>('users').where('id', 10).delete();

  // $ExpectType number
  await knexInstance('users_inferred').where('id', 10).delete();

  // $ExpectType number
  await knexInstance('users_composite').where('id', 10).delete();

  // $ExpectType number
  await knexInstance<User>('users').where('id', 10).del();

  // $ExpectType number
  await knexInstance('users_inferred').where('id', 10).del();

  // $ExpectType number
  await knexInstance('users_composite').where('id', 10).del();

  // $ExpectType Pick<User, "id">[]
  await knexInstance<User>('users').where('id', 10).delete('id');

  // $ExpectType Pick<User, "id">[]
  await knexInstance('users_inferred').where('id', 10).delete('id');

  // $ExpectType Pick<User, "id">[]
  await knexInstance('users_composite').where('id', 10).delete('id');

  // $ExpectType any[]
  await knexInstance('users').where('id', 10).del().returning('*');

  // $ExpectType any[]
  await knexInstance('users').where('id', 10).delete().returning('*');

  // $ExpectType User[]
  await knexInstance<User>('users').where('id', 10).del().returning('*');

  // $ExpectType User[]
  await knexInstance('users_inferred').where('id', 10).del().returning('*');

  // $ExpectType User[]
  await knexInstance('users_composite').where('id', 10).del().returning('*');

  // $ExpectType User[]
  await knexInstance<User>('users').where('id', 10).delete().returning('*');

  // $ExpectType User[]
  await knexInstance('users_inferred').where('id', 10).delete().returning('*');

  // $ExpectType User[]
  await knexInstance('users_composite').where('id', 10).delete().returning('*');

  // $ExpectType User[]
  await knexInstance.where('id', 10).del().returning('*').from<User>('users');

  // $ExpectType User[]
  await knexInstance
    .where('id', 10)
    .del()
    .returning('*')
    .from('users_inferred');

  // $ExpectType User[]
  await knexInstance
    .where('id', 10)
    .del()
    .returning('*')
    .from('users_composite');

  // $ExpectType User[]
  await knexInstance
    .where('id', 10)
    .delete()
    .returning('*')
    .from<User>('users');

  // $ExpectType User[]
  await knexInstance
    .where('id', 10)
    .delete()
    .returning('*')
    .from('users_inferred');

  // $ExpectType User[]
  await knexInstance
    .where('id', 10)
    .delete()
    .returning('*')
    .from('users_composite');

  // $ExpectType Pick<User, "id">[]
  await knexInstance.where('id', 10).delete('id').from<User>('users');

  // $ExpectType Pick<User, "id">[]
  await knexInstance.where('id', 10).delete('id').from('users_inferred');

  // $ExpectType Pick<User, "id">[]
  await knexInstance.where('id', 10).delete('id').from('users_composite');

  // $ExpectType void
  await knexInstance<User>('users').truncate();

  // $ExpectType void
  await knexInstance('users_inferred').truncate();

  // $ExpectType void
  await knexInstance('users_composite').truncate();

  // $ExpectType void
  await knexInstance('users').truncate();

  // # Column Info:

  // $ExpectType ColumnInfo
  await knexInstance('users').columnInfo('id');

  // $ExpectType ColumnInfo
  await knexInstance<User>('users').columnInfo('id');

  // $ExpectType ColumnInfo
  await knexInstance('users_inferred').columnInfo('id');

  // $ExpectType ColumnInfo
  await knexInstance('users_composite').columnInfo('id');

  // # Modify:

  function withUserName(queryBuilder: Knex.QueryBuilder, foreignKey: string) {
    queryBuilder
      .leftJoin('users', foreignKey, 'users.id')
      .select('users.user_name');
  }

  // $ExpectType QueryBuilder<any, any>
  knexInstance
    .table('articles')
    .select('title', 'body')
    .modify(withUserName, 'articles_user.id');

  const withAge = (queryBuilder: Knex.QueryBuilder<User, any[]>) =>
    queryBuilder.select('age');

  // $ExpectType Pick<User, "id" | "age">
  await knexInstance
    .table<User>('users')
    .select('id')
    .modify<User, Pick<User, 'id' | 'age'>>(withAge);

  // With:

  // $ExpectType any[]
  await knexInstance
    .with(
      'with_alias',
      knexInstance.raw('select * from "users" where "id" = ?', 1)
    )
    .select('*')
    .from('with_alias');

  // $ExpectType any[]
  await knexInstance
    .with(
      'with_alias',
      knexInstance.raw<User[]>('select * from "users" where "id" = ?', 1)
    )
    .select('*')
    .from('with_alias');

  // $ExpectType User[]
  await knexInstance
    .with(
      'with_alias',
      knexInstance.raw<User[]>('select * from "users" where "id" = ?', 1)
    )
    .select('*')
    .from<User>('with_alias');

  // $ExpectType any[]
  await knexInstance
    .with('with_alias', (qb) => {
      qb.select('*').from('books').where('author', 'Test');
    })
    .select('*')
    .from('with_alias');

  // $ExpectType any[]
  await knexInstance
    .withRecursive('ancestors', (qb) => {
      qb.select('*').from('users').where('users.id', 1);
    })
    .select('*')
    .from('ancestors');

  // $ExpectType any[]
  await knexInstance
    .withRecursive('ancestors', (qb) => {
      qb.select('*').from<User>('users').where('users.id', 1);
    })
    .select('*')
    .from('ancestors');

  // $ExpectType User[]
  await knexInstance
    .withRecursive('ancestors', (qb) => {
      qb.select('*').from<User>('users').where('users.id', 1);
    })
    .select('*')
    .from<User>('ancestors');

  // $ExpectType User[]
  await knexInstance
    .withRecursive('ancestors', (qb: Knex.QueryBuilder<User, User[]>) => {
      qb.select('*').from<User>('users').where('users.id', 1);
    })
    .select('*')
    .from<User>('ancestors');

  // $ExpectType Pick<User, "name" | "id">[]
  await knexInstance
    .withRecursive('ancestors', (qb) => {
      qb.select('*').from<User>('users').where('users.id', 1);
    })
    .select('id', 'name')
    .from<User>('ancestors');

  // $ExpectType any[]
  await knexInstance.withSchema('public').select('*').from('users');

  // $ExpectType User[]
  await knexInstance.withSchema('public').select('*').from<User>('users');

  // Seed:

  // $ExpectType string
  await knexInstance.seed.make('test');

  // $ExpectType string
  await knexInstance.seed.make('test', {
    extension: 'ts',
    directory: 'lib/seeds',
  });

  // $ExpectType [string[]]
  await knexInstance.seed.run();

  // $ExpectType [string[]]
  await knexInstance.seed.run({
    extension: 'ts',
    directory: 'lib/seeds',
  });

  // $ExpectType any[]
  await knexInstance('users', { only: true });

  // $ExpectType any[]
  await knexInstance.select('*').from('users', { only: true });

  // $ExpectType any
  knexInstance.queryBuilder().queryContext();

  // .raw() support

  // $ExpectType User[]
  await knexInstance<User>('users').where({
    id: knexInstance.raw<number>('a'),
  });

  // $ExpectType User[]
  await knexInstance<User>('users').where('id', knexInstance.raw<string>('a'));

  // $ExpectType Ticket[]
  await knexInstance<Ticket>('users').where({
    at: knexInstance.fn.now(),
  });

  // $ExpectType User[]
  await knexInstance<User>('users')
    // we can't do anything here for now
    .where('id', knexInstance.raw<string>('string'));

  // $ExpectType number[]
  await knexInstance<User>('users').insert({
    id: knexInstance.raw<number>('a'),
  });

  // $ExpectType User[]
  await knexInstance<User>('users').insert(
    [
      {
        id: knexInstance.raw<number>('a'),
      },
    ],
    '*'
  );

  // $ExpectType Pick<User, "id">[]
  await knexInstance<User>('users').update(
    {
      id: knexInstance.raw<number>('a'),
    },
    'id'
  );

  // $ExpectType Pick<User, "name">[]
  await knexInstance<User>('users').update<'active', 'name'>(
    'active',
    knexInstance.raw<boolean>('true'),
    'name'
  );

  // $ExpectType Pick<User, "name">[]
  await knexInstance<User>('users').update<'active', 'name'>(
    'active',
    knexInstance.raw<boolean>('true'),
    ['name']
  );
};

class ExcelClient extends knex.Client {}
