import { knex, Knex } from '../types';
import { expectType } from 'tsd';

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
    debug(msg: string) {
      //
    },
  },
  pool: {
    log: (msg: string, level: string) => {
      //
    },
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
  const userUpdateReturnCols = ['id', 'age'] as const;
  {
    // $ExpectType Pick<User, "id" | "age">[]
    const r = await knexInstance<User>('users')
      .where('id', 10)
      .update({ active: true }, userUpdateReturnCols);
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    // $ExpectType Pick<User, "id" | "age">[]
    const r = await knexInstance('users_inferred')
      .where('id', 10)
      .update({ active: true }, userUpdateReturnCols);
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    // $ExpectType Pick<User, "id" | "age">[]
    const r = await knexInstance('users_composite')
      .where('id', 10)
      .update({ update: 'update' }, userUpdateReturnCols);
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  // $ExpectError in original code
  // await knexInstance('users_composite').where('id', 10).update({ id: 11 }, userUpdateReturnCols);
  // await knexInstance('users_composite').where('id', 10).update({}, userUpdateReturnCols);

  {
    // $ExpectType Pick<User, "id" | "age">[]
    const r = await knexInstance
      .where('id', 10)
      .update({ active: true }, ['id', 'age'])
      .into<User>('users');
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    // $ExpectType Pick<User, "id" | "age">[]
    const r = await knexInstance
      .where('id', 10)
      .update({ active: true }, ['id', 'age'])
      .into('users_inferred');
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    // $ExpectType Pick<User, "id" | "age">[]
    const r = await knexInstance
      .where('id', 10)
      .update({ update: 'update' }, ['id', 'age'])
      .into('users_composite');
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  // # Insert onConflict

  {
    // Just ensures no type errors occur. You could do additional validations if you want.
    const r = await knexInstance
      .table<User>('users')
      .insert({ id: 10, active: true })
      .onConflict('id')
      .merge({ active: true })
      .returning('*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  // # Regression test (issue #4101), ensuring .debug() can be called
  {
    const r = await knexInstance
      .table<User>('users')
      .insert({ id: 10, active: true })
      .onConflict('id')
      .merge({ active: true })
      .debug(true);
    // No specific return type check here, but confirm no error
  }

  // # Deletion

  {
    // $ExpectType number
    const r = await knexInstance<User>('users').where('id', 10).delete();
    expectType<number>(r);
  }

  {
    // $ExpectType number
    const r = await knexInstance('users_inferred').where('id', 10).delete();
    expectType<number>(r);
  }

  {
    // $ExpectType number
    const r = await knexInstance('users_composite').where('id', 10).delete();
    expectType<number>(r);
  }

  {
    // $ExpectType number
    const r = await knexInstance<User>('users').where('id', 10).del();
    expectType<number>(r);
  }

  {
    // $ExpectType number
    const r = await knexInstance('users_inferred').where('id', 10).del();
    expectType<number>(r);
  }

  {
    // $ExpectType number
    const r = await knexInstance('users_composite').where('id', 10).del();
    expectType<number>(r);
  }

  {
    // $ExpectType Pick<User, "id">[]
    const r = await knexInstance<User>('users').where('id', 10).delete('id');
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    // $ExpectType Pick<User, "id">[]
    const r = await knexInstance('users_inferred').where('id', 10).delete('id');
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    // $ExpectType Pick<User, "id">[]
    const r = await knexInstance('users_composite')
      .where('id', 10)
      .delete('id');
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    // $ExpectType any[]
    const r = await knexInstance('users').where('id', 10).del().returning('*');
    expectType<any[]>(r);
  }

  {
    // $ExpectType any[]
    const r = await knexInstance('users')
      .where('id', 10)
      .delete()
      .returning('*');
    expectType<any[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance<User>('users')
      .where('id', 10)
      .del()
      .returning('*');
    expectType<User[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance('users_inferred')
      .where('id', 10)
      .del()
      .returning('*');
    expectType<User[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance('users_composite')
      .where('id', 10)
      .del()
      .returning('*');
    expectType<User[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance<User>('users')
      .where('id', 10)
      .delete()
      .returning('*');
    expectType<User[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance('users_inferred')
      .where('id', 10)
      .delete()
      .returning('*');
    expectType<User[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance('users_composite')
      .where('id', 10)
      .delete()
      .returning('*');
    expectType<User[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance
      .where('id', 10)
      .del()
      .returning('*')
      .from<User>('users');
    expectType<User[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance
      .where('id', 10)
      .del()
      .returning('*')
      .from('users_inferred');
    expectType<User[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance
      .where('id', 10)
      .del()
      .returning('*')
      .from('users_composite');
    expectType<User[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance
      .where('id', 10)
      .delete()
      .returning('*')
      .from<User>('users');
    expectType<User[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance
      .where('id', 10)
      .delete()
      .returning('*')
      .from('users_inferred');
    expectType<User[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance
      .where('id', 10)
      .delete()
      .returning('*')
      .from('users_composite');
    expectType<User[]>(r);
  }

  {
    // $ExpectType Pick<User, "id">[]
    const r = await knexInstance
      .where('id', 10)
      .delete('id')
      .from<User>('users');
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    // $ExpectType Pick<User, "id">[]
    const r = await knexInstance
      .where('id', 10)
      .delete('id')
      .from('users_inferred');
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    // $ExpectType Pick<User, "id">[]
    const r = await knexInstance
      .where('id', 10)
      .delete('id')
      .from('users_composite');
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    // $ExpectType void
    const r = await knexInstance<User>('users').truncate();
    expectType<void>(r);
  }

  {
    // $ExpectType void
    const r = await knexInstance('users_inferred').truncate();
    expectType<void>(r);
  }

  {
    // $ExpectType void
    const r = await knexInstance('users_composite').truncate();
    expectType<void>(r);
  }

  {
    // $ExpectType void
    const r = await knexInstance('users').truncate();
    expectType<void>(r);
  }

  // # Column Info:

  {
    // $ExpectType ColumnInfo
    const c = await knexInstance('users').columnInfo('id');
    // No need to further check the type in test code, we trust the $ExpectType from above
  }

  {
    // $ExpectType ColumnInfo
    const c = await knexInstance<User>('users').columnInfo('id');
  }

  {
    // $ExpectType ColumnInfo
    const c = await knexInstance('users_inferred').columnInfo('id');
  }

  {
    // $ExpectType ColumnInfo
    const c = await knexInstance('users_composite').columnInfo('id');
  }

  // # Modify:

  function withUserName(queryBuilder: Knex.QueryBuilder, foreignKey: string) {
    queryBuilder
      .leftJoin('users', foreignKey, 'users.id')
      .select('users.user_name');
  }

  {
    // $ExpectType QueryBuilder<any, any>
    const qb = knexInstance
      .table('articles')
      .select('title', 'body')
      .modify(withUserName, 'articles_user.id');
    expectType<Knex.QueryBuilder<any, any>>(qb);
  }

  {
    const withAge = (queryBuilder: Knex.QueryBuilder<User, any[]>) =>
      queryBuilder.select('age');

    // $ExpectType Pick<User, "id" | "age">
    const r = await knexInstance
      .table<User>('users')
      .select('id')
      .modify<User, Pick<User, 'id' | 'age'>>(withAge);

    expectType<Pick<User, 'id' | 'age'>>(r);
  }

  // With:

  {
    // $ExpectType any[]
    const r = await knexInstance
      .with(
        'with_alias',
        knexInstance.raw('select * from "users" where "id" = ?', 1)
      )
      .select('*')
      .from('with_alias');
    expectType<any[]>(r);
  }

  {
    // $ExpectType any[]
    const r = await knexInstance
      .with(
        'with_alias',
        knexInstance.raw<User[]>('select * from "users" where "id" = ?', 1)
      )
      .select('*')
      .from('with_alias');
    expectType<any[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance
      .with(
        'with_alias',
        knexInstance.raw<User[]>('select * from "users" where "id" = ?', 1)
      )
      .select('*')
      .from<User>('with_alias');
    expectType<User[]>(r);
  }

  {
    // $ExpectType any[]
    const r = await knexInstance
      .with('with_alias', (qb) => {
        qb.select('*').from('books').where('author', 'Test');
      })
      .select('*')
      .from('with_alias');
    expectType<any[]>(r);
  }

  {
    // $ExpectType any[]
    const r = await knexInstance
      .withRecursive('ancestors', (qb) => {
        qb.select('*').from('users').where('users.id', 1);
      })
      .select('*')
      .from('ancestors');
    expectType<any[]>(r);
  }

  {
    // $ExpectType any[]
    const r = await knexInstance
      .withRecursive('ancestors', (qb) => {
        qb.select('*').from<User>('users').where('users.id', 1);
      })
      .select('*')
      .from('ancestors');
    expectType<any[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance
      .withRecursive('ancestors', (qb) => {
        qb.select('*').from<User>('users').where('users.id', 1);
      })
      .select('*')
      .from<User>('ancestors');
    expectType<User[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance
      .withRecursive('ancestors', (qb: Knex.QueryBuilder<User, User[]>) => {
        qb.select('*').from<User>('users').where('users.id', 1);
      })
      .select('*')
      .from<User>('ancestors');
    expectType<User[]>(r);
  }

  {
    // $ExpectType Pick<User, "name" | "id">[]
    const r = await knexInstance
      .withRecursive('ancestors', (qb) => {
        qb.select('*').from<User>('users').where('users.id', 1);
      })
      .select('id', 'name')
      .from<User>('ancestors');
    expectType<Array<Pick<User, 'id' | 'name'>>>(r);
  }

  {
    // $ExpectType any[]
    const r = await knexInstance.withSchema('public').select('*').from('users');
    expectType<any[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance
      .withSchema('public')
      .select('*')
      .from<User>('users');
    expectType<User[]>(r);
  }

  // Seed:

  {
    // $ExpectType string
    const res = await knexInstance.seed.make('test');
    expectType<string>(res);
  }

  {
    // $ExpectType string
    const res = await knexInstance.seed.make('test', {
      extension: 'ts',
      directory: 'lib/seeds',
    });
    expectType<string>(res);
  }

  {
    // $ExpectType [string[]]
    const res = await knexInstance.seed.run();
    expectType<[string[]]>(res);
  }

  {
    // $ExpectType [string[]]
    const res = await knexInstance.seed.run({
      extension: 'ts',
      directory: 'lib/seeds',
    });
    expectType<[string[]]>(res);
  }

  {
    // $ExpectType any[]
    const r = await knexInstance('users', { only: true });
    expectType<any[]>(r);
  }

  {
    // $ExpectType any[]
    const r = await knexInstance.select('*').from('users', { only: true });
    expectType<any[]>(r);
  }

  {
    // $ExpectType any
    const ctx = knexInstance.queryBuilder().queryContext();
    expectType<any>(ctx);
  }

  // .raw() support

  {
    // $ExpectType User[]
    const r = await knexInstance<User>('users').where({
      id: knexInstance.raw<number>('a'),
    });
    expectType<User[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance<User>('users').where(
      'id',
      knexInstance.raw<string>('a')
    );
    expectType<User[]>(r);
  }

  {
    // $ExpectType Ticket[]
    const r = await knexInstance<Ticket>('users').where({
      at: knexInstance.fn.now(),
    });
    expectType<Ticket[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance<User>('users').where(
      'id',
      knexInstance.raw<string>('string')
    );
    expectType<User[]>(r);
  }

  {
    // $ExpectType number[]
    const r = await knexInstance<User>('users').insert({
      id: knexInstance.raw<number>('a'),
    });
    expectType<number[]>(r);
  }

  {
    // $ExpectType User[]
    const r = await knexInstance<User>('users').insert(
      [
        {
          id: knexInstance.raw<number>('a'),
        },
      ],
      '*'
    );
    expectType<User[]>(r);
  }

  {
    // $ExpectType Pick<User, "id">[]
    const r = await knexInstance<User>('users').update(
      {
        id: knexInstance.raw<number>('a'),
      },
      'id'
    );
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    // $ExpectType Pick<User, "name">[]
    const r = await knexInstance<User>('users').update<'active', 'name'>(
      'active',
      knexInstance.raw<boolean>('true'),
      'name'
    );
    expectType<Array<Pick<User, 'name'>>>(r);
  }

  {
    // $ExpectType Pick<User, "name">[]
    const r = await knexInstance<User>('users').update<'active', 'name'>(
      'active',
      knexInstance.raw<boolean>('true'),
      ['name']
    );
    expectType<Array<Pick<User, 'name'>>>(r);
  }
};

class ExcelClient extends knex.Client {}
