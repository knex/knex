import { knex, Knex } from '../types';
import { PassThrough } from 'stream';
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

// Interface to witness type compatibility
interface ExtendsWitness<T1 extends T2, T2> {
  _t: T1;
}

// Ensure that Knex type with parameters is compatible with Knex with default parameters
//
// This ensures that a value of Parameterized Knex can always be passed to a function that
// consumes unparameterized Knex.
type _T1 = ExtendsWitness<Knex<User>, Knex>;
type _T2 = ExtendsWitness<Knex<User, Partial<User>[]>, Knex>;
type _T3 = ExtendsWitness<Knex.Where<User, Partial<User>[]>, Knex.Where>;
type _T4 = ExtendsWitness<Knex.Where<User, number>, Knex.Where>;
type _T5 = ExtendsWitness<
  Knex.QueryInterface<User, Partial<User[]>>,
  Knex.QueryInterface
>;
type _T6 = ExtendsWitness<Knex.QueryBuilder<User, User[]>, Knex.QueryBuilder>;
type _T7 = ExtendsWitness<
  Knex.QueryBuilder<User, User[]>,
  Knex.QueryBuilder<any, any[]>
>;
type _T8 = ExtendsWitness<Knex.QueryBuilder<User, number[]>, Knex.QueryBuilder>;
type _T9 = ExtendsWitness<Knex.QueryBuilder<any, any[]>, Knex.QueryBuilder>;
type _T10 = ExtendsWitness<Knex.QueryBuilder<User, number>, Knex.QueryBuilder>;

// Ensure the return type of knex() is compatible with Knex with default parameters
type _T2_1 = ExtendsWitness<typeof knexInstance, Knex>;

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
  expectType<any>(await knexInstance.raw('select * from users'));

  expectType<User[]>(await knexInstance.raw<User[]>('select * from users'));

  expectType<any>(
    await knexInstance.raw(
      'select * from users where id in ?',
      knexInstance('contacts').select('name')
    )
  );

  expectType<User[]>(
    await knexInstance.raw<User[]>(
      'select * from users where id in ?',
      knexInstance('contacts').select('name')
    )
  );

  expectType<User[]>(
    await knexInstance.raw<User[]>(
      'select * from users where departmentId in ?',
      knexInstance<Department>('departments').select('id')
    )
  );

  expectType<User[]>(
    await knexInstance.raw<User[]>(
      'select * from users where departmentId in ? & active in ?',
      [knexInstance<Department>('departments').select('name'), [true, false]]
    )
  );

  expectType<Article[]>(
    await knexInstance.raw<Article[]>(
      'select * from articles where authorId = ?',
      [null]
    )
  );

  expectType<PassThrough & AsyncIterable<User>>(
    knexInstance<User>('users').select('*').stream()
  );

  expectType<PassThrough>(
    knexInstance<User>('users').select('*').stream().pipe(new PassThrough())
  );

  expectType<User[]>(
    await knexInstance<User>('user').where('name', ['a', 'b', 'c'])
  );

  expectType<User[]>(
    await knexInstance('users_inferred').where('name', ['a', 'b', 'c'])
  );

  expectType<User[]>(
    await knexInstance('users_composite').where('name', ['a', 'b', 'c'])
  );

  expectType<User[]>(
    await knexInstance<User>('user').whereRaw('name = ?', 'L')
  );

  expectType<User[]>(
    await knexInstance('users_inferred').whereRaw('name = ?', 'L')
  );

  expectType<User[]>(
    await knexInstance('users_composite').whereRaw('name = ?', 'L')
  );

  expectType<User[]>(
    await knexInstance<User>('user').whereRaw('name = ?', 'L').clearWhere()
  );

  expectType<User[]>(
    await knexInstance('users_inferred').whereRaw('name = ?', 'L').clearWhere()
  );

  expectType<User[]>(
    await knexInstance('users_composite').whereRaw('name = ?', 'L').clearWhere()
  );

  expectType<User[]>(
    await knexInstance<User>('user').whereBetween('id', [1, 2])
  );

  expectType<User[]>(
    await knexInstance('users_inferred').whereBetween('id', [1, 2])
  );

  expectType<User[]>(
    await knexInstance('users_composite').whereBetween('id', [1, 2])
  );

  const range = [1, 2] as const;
  expectType<User[]>(
    await knexInstance<User>('user').whereBetween('id', range)
  );

  expectType<User[]>(
    await knexInstance('users_inferred').whereBetween('id', range)
  );

  expectType<User[]>(
    await knexInstance('users_composite').whereBetween('id', range)
  );

  const r3 = await knexInstance<User>('users').select(knexInstance.ref('id'));
  expectType<{ id: number }[]>(r3);

  expectType<{ id: number }[]>(
    await knexInstance('users_inferred').select(knexInstance.ref('id'))
  );

  expectType<{ id: number }[]>(
    await knexInstance('users_composite').select(knexInstance.ref('id'))
  );

  const r4 = await knexInstance<User>('users').select(
    knexInstance.ref('id'),
    'name'
  );
  type _TR4 = ExtendsWitness<(typeof r4)[0], Pick<User, 'id' | 'name'>>;
  // FixMe
  // expectType<(Pick<User, 'id' | 'name'>)[]>(r4);

  expectType<Pick<User, 'id' | 'name'>[]>(
    await knexInstance('users_inferred').select(knexInstance.ref('id'), 'name')
  );

  expectType<Pick<User, 'id' | 'name'>[]>(
    await knexInstance('users_composite').select(knexInstance.ref('id'), 'name')
  );

  const r5 = await knexInstance<User>('users').select(
    knexInstance.ref('id').as('identifier'),
    'name'
  );
  type _TR5 = ExtendsWitness<
    (typeof r5)[0],
    { identifier: number; name: string }
  >;
  // FixMe
  // expectType<{ identifier: number; name: string }[]>(r5);

  expectType<{ identifier: number; name: string }[]>(
    await knexInstance('users_inferred').select(
      knexInstance.ref('id').as('identifier'),
      'name'
    )
  );

  expectType<{ identifier: number; name: string }[]>(
    await knexInstance('users_composite').select(
      knexInstance.ref('id').as('identifier'),
      'name'
    )
  );

  const r6 = await knexInstance<User>('users').select(
    knexInstance.ref('id').as('identifier'),
    'name',
    knexInstance.ref('age').as('yearsSinceBirth')
  );
  type _TR6 = ExtendsWitness<
    (typeof r6)[0],
    { identifier: number; name: string; yearsSinceBirth: number }
  >;
  // FixMe
  //expectType<
  //  { identifier: number; name: string; yearsSinceBirth: number }[]
  //>(r6);

  expectType<{ identifier: number; name: string; yearsSinceBirth: number }[]>(
    await knexInstance('users_inferred').select(
      knexInstance.ref('id').as('identifier'),
      'name',
      knexInstance.ref('age').as('yearsSinceBirth')
    )
  );

  expectType<{ identifier: number; name: string; yearsSinceBirth: number }[]>(
    await knexInstance('users_composite').select(
      knexInstance.ref('id').as('identifier'),
      'name',
      knexInstance.ref('age').as('yearsSinceBirth')
    )
  );

  const r7 = await knexInstance
    .select(knexInstance.ref('id'))
    .from<User>('users');
  type _TR7 = ExtendsWitness<(typeof r7)[0], Pick<User, 'id'>>;
  expectType<{ id: number }[]>(r7);

  expectType<{ id: number }[]>(
    await knexInstance.select(knexInstance.ref('id')).from('users_inferred')
  );

  expectType<{ id: number }[]>(
    await knexInstance.select(knexInstance.ref('id')).from('users_composite')
  );

  const r8 = await knexInstance
    .select(knexInstance.ref('id'), 'name')
    .from<User>('users');
  type _TR8 = ExtendsWitness<(typeof r8)[0], Pick<User, 'id' | 'name'>>;
  // FixMe
  // expectType<(Pick<User, 'id' | 'name'>)[]>(r8);

  expectType<Pick<User, 'id' | 'name'>[]>(
    await knexInstance
      .select(knexInstance.ref('id'), 'name')
      .from('users_inferred')
  );

  expectType<Pick<User, 'id' | 'name'>[]>(
    await knexInstance
      .select(knexInstance.ref('id'), 'name')
      .from('users_composite')
  );

  const r9 = await knexInstance
    .select(knexInstance.ref('id').as('identifier'), 'name')
    .from<User>('users');
  type _TR9 = ExtendsWitness<
    (typeof r9)[0],
    { identifier: number; name: string }
  >;
  // FixMe
  // expectType<{ identifier: number; name: string }[]>(r9);
};

class ExcelClient extends knex.Client {}
