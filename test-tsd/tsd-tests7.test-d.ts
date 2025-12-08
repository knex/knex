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
  {
    const r = await knexInstance<User>('users').insert({ id: 10 }, 'id');
    // $ExpectType Pick<User, "id">[]
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    const r = await knexInstance<User>('users').insert({ id: 10 }, '*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance('users_inferred').insert({ id: 10 }, '*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  // $ExpectError in original code: not valid for 'users_composite'
  // await knexInstance('users_composite').insert({ id: 10 }, '*');
  // await knexInstance('users_composite').insert({}, '*');

  {
    const r = await knexInstance('users_composite').insert(
      { insert: 'insert' },
      '*'
    );
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance<User>('users').insert([{ id: 10 }], '*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance('users_inferred').insert([{ id: 10 }], '*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  // $ExpectError in original code
  // await knexInstance('users_composite').insert([{ id: 10 }], '*');
  // await knexInstance('users_composite').insert([{}], '*');

  {
    const r = await knexInstance('users_composite').insert(
      [{ insert: 'insert' }],
      '*'
    );
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance.insert({ id: 10 }, 'id').into<User>('users');
    // $ExpectType Pick<User, "id">[]
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    const r = await knexInstance
      .insert({ id: 10 }, 'id')
      .into('users_inferred');
    // $ExpectType Pick<User, "id">[]
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    const r = await knexInstance
      .insert({ insert: 'insert' }, 'id')
      .into('users_composite');
    // $ExpectType Pick<User, "id">[]
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    const r = await knexInstance<User>('users')
      .insert({ id: 10 })
      .returning(['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    const r = await knexInstance('users_inferred')
      .insert({ id: 10 })
      .returning(['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  // $ExpectError in original code
  // await knexInstance('users_composite').insert({ id: 10 }).returning(['id', 'age']);
  // await knexInstance('users_composite').insert({}).returning(['id', 'age']);

  {
    const r = await knexInstance('users_composite')
      .insert({ insert: 'insert' })
      .returning(['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    const r = await knexInstance<User>('users')
      .insert({ id: 10 }, 'id')
      .returning(['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    const r = await knexInstance('users_inferred')
      .insert({ id: 10 }, 'id')
      .returning(['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  // $ExpectError in original code
  // await knexInstance('users_composite').insert({ id: 10 }, 'id').returning(['id', 'age']);
  // await knexInstance('users_composite').insert({}, 'id').returning(['id', 'age']);

  {
    const r = await knexInstance('users_composite')
      .insert({ insert: 'insert' }, 'id')
      .returning(['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    const r = await knexInstance('users').insert({ id: 10 }).returning('*');
    // $ExpectType any[]
    expectType<any[]>(r);
  }

  {
    const r = await knexInstance<User>('users')
      .insert({ id: 10 })
      .returning('*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance('users_inferred')
      .insert({ id: 10 })
      .returning('*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  // $ExpectError in original code
  // await knexInstance('users_composite').insert({ id: 10 }).returning('*');
  // await knexInstance('users_composite').insert({}).returning('*');

  {
    const r = await knexInstance('users_composite')
      .insert({ insert: 'insert' })
      .returning('*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance
      .insert({ id: 10 })
      .into('users')
      .returning('*');
    // $ExpectType any[]
    expectType<any[]>(r);
  }

  {
    const r = await knexInstance
      .insert({ id: 10 })
      .into<User>('users')
      .returning('*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance
      .insert({ id: 10 })
      .into('users_inferred')
      .returning('*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance
      .insert({ insert: 'insert' })
      .into('users_composite')
      .returning('*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance
      .insert({ id: 10 })
      .returning('*')
      .into<User>('users');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance
      .insert({ id: 10 })
      .returning('*')
      .into('users_inferred');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance
      .insert({ id: 10 })
      .returning('*')
      .into('users_composite');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance<User>('users')
      .insert({ id: 10 }, 'id')
      .returning('*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance('users_inferred')
      .insert({ id: 10 }, 'id')
      .returning('*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  // $ExpectError in original code
  // await knexInstance('users_composite').insert({ id: 10 }, 'id').returning('*');
  // await knexInstance('users_composite').insert({}, 'id').returning('*');

  {
    const r = await knexInstance('users_composite')
      .insert({ insert: 'insert' }, 'id')
      .returning('*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance
      .insert({ id: 10 })
      .returning(['id', 'age'])
      .into<User>('users');
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    const r = await knexInstance
      .insert({ id: 10 })
      .returning(['id', 'age'])
      .into('users_inferred');
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    const r = await knexInstance
      .insert({ id: 10 })
      .returning(['id', 'age'])
      .into('users_composite');
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    const r = await knexInstance('users')
      .insert({ id: 10 })
      .returning(['id', 'age']);
    // $ExpectType any[]
    expectType<any[]>(r);
  }

  // # Update

  {
    const r = await knexInstance('users')
      .where('id', 10)
      .update({ active: true });
    // $ExpectType number
    expectType<number>(r);
  }

  {
    const qb1 = knexInstance('users').where('id', 10);
    qb1.returning(['id', 'name']);
    const r = await qb1.update<Partial<User>[]>({ active: true });
    // $ExpectType Partial<User>[]
    expectType<Array<Partial<User>>>(r);
  }

  {
    const r = await knexInstance<User>('users')
      .where('id', 10)
      .update({ active: true });
    // $ExpectType number
    expectType<number>(r);
  }

  {
    const r = await knexInstance('users_inferred')
      .where('id', 10)
      .update({ active: true });
    // $ExpectType number
    expectType<number>(r);
  }

  {
    const r = await knexInstance('users_composite')
      .where('id', 10)
      .update({ update: 'update' });
    // $ExpectType number
    expectType<number>(r);
  }

  // $ExpectError in original code
  // await knexInstance('users_composite').update({ id: 10 });
  // await knexInstance('users_composite').update({});

  {
    const r = await knexInstance
      .where('id', 10)
      .update({ active: true })
      .from('users');
    // $ExpectType number
    expectType<number>(r);
  }

  // ## With Returning

  {
    const r = await knexInstance('users')
      .where('id', 10)
      .update({ active: true })
      .returning(['id', 'age']);
    // $ExpectType any[]
    expectType<any[]>(r);
  }

  {
    const r = await knexInstance('users')
      .where('id', 10)
      .update({ active: true })
      .returning('*');
    // $ExpectType any[]
    expectType<any[]>(r);
  }

  {
    const r = await knexInstance<User>('users')
      .where('id', 10)
      .update({ active: true })
      .returning('*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance('users_inferred')
      .where('id', 10)
      .update({ active: true })
      .returning('*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  // $ExpectError in original code
  // await knexInstance('users_composite').where('id', 10).update({}).returning('*');

  {
    const r = await knexInstance('users_composite')
      .where('id', 10)
      .update({ update: 'update' })
      .returning('*');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance
      .where('id', 10)
      .update({ active: true })
      .returning('*')
      .from('users');
    // $ExpectType any[]
    expectType<any[]>(r);
  }

  {
    const r = await knexInstance
      .where('id', 10)
      .update({ active: true })
      .returning('*')
      .from<User>('users');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance
      .where('id', 10)
      .update({ active: true })
      .returning('*')
      .from('users_inferred');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance
      .where('id', 10)
      .update({ update: 'update' })
      .returning('*')
      .from('users_composite');
    // $ExpectType User[]
    expectType<User[]>(r);
  }

  {
    const r = await knexInstance<User>('users')
      .where('id', 10)
      .update({ active: true })
      .returning(['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    const r = await knexInstance('users_inferred')
      .where('id', 10)
      .update({ active: true })
      .returning(['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    const r = await knexInstance('users_composite')
      .where('id', 10)
      .update({ update: 'update' })
      .returning(['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  // $ExpectError in original code
  // await knexInstance('users_composite').where('id', 10).update({ id: 11 }).returning(['id', 'age']);
  // await knexInstance('users_composite').where('id', 10).update({}).returning(['id', 'age']);

  {
    const r = await knexInstance<User>('users')
      .where('id', 10)
      .update({ active: true }, 'id');
    // $ExpectType Pick<User, "id">[]
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    const r = await knexInstance('users_inferred')
      .where('id', 10)
      .update({ active: true }, 'id');
    // $ExpectType Pick<User, "id">[]
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    const r = await knexInstance('users_composite')
      .where('id', 10)
      .update({ update: 'update' }, 'id');
    // $ExpectType Pick<User, "id">[]
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  // $ExpectError in original code
  // await knexInstance('users_composite').where('id', 10).update({ id: 11 }, 'id');
  // await knexInstance('users_composite').where('id', 10).update({}, 'id');

  {
    const r = await knexInstance<User>('users')
      .where('id', 10)
      .update('active', true, 'id');
    // $ExpectType Pick<User, "id">[]
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    const r = await knexInstance('users_inferred')
      .where('id', 10)
      .update('active', true, 'id');
    // $ExpectType Pick<User, "id">[]
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    const r = await knexInstance('users_composite')
      .where('id', 10)
      .update('update', 'update', 'id');
    // $ExpectType Pick<User, "id">[]
    expectType<Array<Pick<User, 'id'>>>(r);
  }

  {
    const r = await knexInstance<User>('users')
      .where('id', 10)
      .update({ active: true }, ['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    const r = await knexInstance('users_inferred')
      .where('id', 10)
      .update({ active: true }, ['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    const r = await knexInstance('users_composite')
      .where('id', 10)
      .update({ update: 'update' }, ['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  // $ExpectError in original code
  // await knexInstance('users_composite').where('id', 10).update({ id: 11 }, ['id', 'age']);
  // await knexInstance('users_composite').where('id', 10).update({}, ['id', 'age']);

  {
    const r = await knexInstance<User>('users')
      .where('id', 10)
      .update('active', true, ['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    const r = await knexInstance('users_inferred')
      .where('id', 10)
      .update('active', true, ['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }

  {
    const r = await knexInstance('users_composite')
      .where('id', 10)
      .update('update', 'update', ['id', 'age']);
    // $ExpectType Pick<User, "id" | "age">[]
    expectType<Array<Pick<User, 'id' | 'age'>>>(r);
  }
};

class ExcelClient extends knex.Client {}
