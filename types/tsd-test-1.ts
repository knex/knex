import { knex, Knex } from 'knex';
import { PassThrough } from 'stream';

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// dtslint tests are deprecated, please add new tests for tsd instead (see /test-tsd) //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////

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

declare module './tables' {
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
  // $ExpectType any
  await knexInstance.raw('select * from users');

  // $ExpectType User[]
  await knexInstance.raw<User[]>('select * from users');

  // $ExpectType any
  await knexInstance.raw(
    'select * from users where id in ?',
    knexInstance('contacts').select('name')
  );

  // $ExpectType User[]
  await knexInstance.raw<User[]>(
    'select * from users where id in ?',
    knexInstance('contacts').select('name')
  );

  // $ExpectType User[]
  await knexInstance.raw<User[]>(
    'select * from users where departmentId in ?',
    knexInstance<Department>('departments').select('id')
  );

  // $ExpectType User[]
  await knexInstance.raw<User[]>(
    'select * from users where departmentId in ? & active in ?',
    [knexInstance<Department>('departments').select('name'), [true, false]]
  );

  // $ExpectType Article[]
  await knexInstance.raw<Article[]>(
    'select * from articles where authorId = ?',
    [null]
  );

  // $ExpectType PassThrough & AsyncIterable<User>
  knexInstance<User>('users').select('*').stream();

  // $ExpectType PassThrough
  knexInstance<User>('users').select('*').stream().pipe(new PassThrough());

  // $ExpectType User[]
  await knexInstance<User>('user').where('name', ['a', 'b', 'c']);

  // $ExpectType User[]
  await knexInstance('users_inferred').where('name', ['a', 'b', 'c']);

  // $ExpectType User[]
  await knexInstance('users_composite').where('name', ['a', 'b', 'c']);

  // $ExpectType User[]
  await knexInstance<User>('user').whereRaw('name = ?', 'L');

  // $ExpectType User[]
  await knexInstance('users_inferred').whereRaw('name = ?', 'L');

  // $ExpectType User[]
  await knexInstance('users_composite').whereRaw('name = ?', 'L');

  // $ExpectType User[]
  await knexInstance<User>('user').whereRaw('name = ?', 'L').clearWhere();

  // $ExpectType User[]
  await knexInstance('users_inferred').whereRaw('name = ?', 'L').clearWhere();

  // $ExpectType User[]
  await knexInstance('users_composite').whereRaw('name = ?', 'L').clearWhere();

  // $ExpectType User[]
  await knexInstance<User>('user').whereBetween('id', [1, 2]);

  // $ExpectType User[]
  await knexInstance('users_inferred').whereBetween('id', [1, 2]);

  // $ExpectType User[]
  await knexInstance('users_composite').whereBetween('id', [1, 2]);

  const range = [1, 2] as const;
  // $ExpectType User[]
  await knexInstance<User>('user').whereBetween('id', range);

  // $ExpectType User[]
  await knexInstance('users_inferred').whereBetween('id', range);

  // $ExpectType User[]
  await knexInstance('users_composite').whereBetween('id', range);

  // $ExpectType { id: number; }[]
  const r3 = await knexInstance<User>('users').select(knexInstance.ref('id'));

  // $ExpectType { id: number; }[]
  await knexInstance('users_inferred').select(knexInstance.ref('id'));

  // $ExpectType { id: number; }[]
  await knexInstance('users_composite').select(knexInstance.ref('id'));

  // $ExpectType (Pick<User, "name"> & { id: number; })[]
  const r4 = await knexInstance<User>('users').select(
    knexInstance.ref('id'),
    'name'
  );
  type _TR4 = ExtendsWitness<(typeof r4)[0], Pick<User, 'id' | 'name'>>;

  // $ExpectType (Pick<User, "name"> & { id: number; })[]
  await knexInstance('users_inferred').select(knexInstance.ref('id'), 'name');

  // $ExpectType (Pick<User, "name"> & { id: number; })[]
  await knexInstance('users_composite').select(knexInstance.ref('id'), 'name');

  // $ExpectType (Pick<User, "name"> & { identifier: number; })[]
  const r5 = await knexInstance<User>('users').select(
    knexInstance.ref('id').as('identifier'),
    'name'
  );
  type _TR5 = ExtendsWitness<
    (typeof r5)[0],
    { identifier: number; name: string }
  >;

  // $ExpectType (Pick<User, "name"> & { identifier: number; })[]
  await knexInstance('users_inferred').select(
    knexInstance.ref('id').as('identifier'),
    'name'
  );

  // $ExpectType (Pick<User, "name"> & { identifier: number; })[]
  await knexInstance('users_composite').select(
    knexInstance.ref('id').as('identifier'),
    'name'
  );

  // $ExpectType (Pick<User, "name"> & { identifier: number; yearsSinceBirth: number; })[]
  const r6 = await knexInstance<User>('users').select(
    knexInstance.ref('id').as('identifier'),
    'name',
    knexInstance.ref('age').as('yearsSinceBirth')
  );
  type _TR6 = ExtendsWitness<
    (typeof r6)[0],
    { identifier: number; name: string; yearsSinceBirth: number }
  >;
  // $ExpectType (Pick<User, "name"> & { identifier: number; yearsSinceBirth: number; })[]
  await knexInstance('users_inferred').select(
    knexInstance.ref('id').as('identifier'),
    'name',
    knexInstance.ref('age').as('yearsSinceBirth')
  );
  // $ExpectType (Pick<User, "name"> & { identifier: number; yearsSinceBirth: number; })[]
  await knexInstance('users_composite').select(
    knexInstance.ref('id').as('identifier'),
    'name',
    knexInstance.ref('age').as('yearsSinceBirth')
  );

  // $ExpectType { id: number; }[]
  const r7 = await knexInstance
    .select(knexInstance.ref('id'))
    .from<User>('users');
  type _TR7 = ExtendsWitness<(typeof r7)[0], Pick<User, 'id'>>;

  // $ExpectType { id: number; }[]
  await knexInstance.select(knexInstance.ref('id')).from('users_inferred');

  // $ExpectType { id: number; }[]
  await knexInstance.select(knexInstance.ref('id')).from('users_composite');

  // $ExpectType (Pick<User, "name"> & { id: number; })[]
  const r8 = await knexInstance
    .select(knexInstance.ref('id'), 'name')
    .from<User>('users');
  type _TR8 = ExtendsWitness<(typeof r8)[0], Pick<User, 'id' | 'name'>>;

  // $ExpectType (Pick<User, "name"> & { id: number; })[]
  await knexInstance
    .select(knexInstance.ref('id'), 'name')
    .from('users_inferred');

  // $ExpectType (Pick<User, "name"> & { id: number; })[]
  await knexInstance
    .select(knexInstance.ref('id'), 'name')
    .from('users_composite');

  // $ExpectType (Pick<User, "name"> & { identifier: number; })[]
  const r9 = await knexInstance
    .select(knexInstance.ref('id').as('identifier'), 'name')
    .from<User>('users');
  type _TR9 = ExtendsWitness<
    (typeof r9)[0],
    { identifier: number; name: string }
  >;
};

class ExcelClient extends knex.Client {}
