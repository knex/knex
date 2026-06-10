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
  expectType<Array<Pick<User, 'name'> & { identifier: number }>>(
    await knexInstance
      .select(knexInstance.ref('id').as('identifier'), 'name')
      .from('users_inferred')
  );

  expectType<Array<Pick<User, 'name'> & { identifier: number }>>(
    await knexInstance
      .select(knexInstance.ref('id').as('identifier'), 'name')
      .from('users_composite')
  );

  const r10 = await knexInstance
    .select(
      knexInstance.ref('id').as('identifier'),
      'name',
      knexInstance.ref('age').as('yearsSinceBirth')
    )
    .from<User>('users');
  type _TR10 = ExtendsWitness<
    (typeof r10)[0],
    { identifier: number; name: string; yearsSinceBirth: number }
  >;
  // FixMe
  // expectType<Array<{ identifier: number; name: string; yearsSinceBirth: number }>>(r10);

  expectType<
    Array<{ identifier: number; name: string; yearsSinceBirth: number }>
  >(
    await knexInstance
      .select(
        knexInstance.ref('id').as('identifier'),
        'name',
        knexInstance.ref('age').as('yearsSinceBirth')
      )
      .from('users_inferred')
  );

  expectType<
    Array<{ identifier: number; name: string; yearsSinceBirth: number }>
  >(
    await knexInstance
      .select(
        knexInstance.ref('id').as('identifier'),
        'name',
        knexInstance.ref('age').as('yearsSinceBirth')
      )
      .from('users_composite')
  );

  expectType<Array<{ id: number; age: any }>>(
    await knexInstance<User>('users').select(knexInstance.ref('id'), {
      age: 'users.age',
    })
  );

  expectType<Array<{ id: number; age: any }>>(
    await knexInstance('users_inferred').select(knexInstance.ref('id'), {
      age: 'users.age',
    })
  );

  expectType<Array<{ id: number; age: any }>>(
    await knexInstance('users_composite').select(knexInstance.ref('id'), {
      age: 'users.age',
    })
  );

  expectType<{ id: number; age: any } | undefined>(
    await knexInstance<User>('users')
      .select(knexInstance.ref('id'), { age: 'users.age' })
      .first()
  );

  expectType<{ id: number; age: any } | undefined>(
    await knexInstance('users_inferred')
      .select(knexInstance.ref('id'), { age: 'users.age' })
      .first()
  );

  expectType<{ id: number; age: any } | undefined>(
    await knexInstance('users_composite')
      .select(knexInstance.ref('id'), { age: 'users.age' })
      .first()
  );

  expectType<Array<{ identifier: number; username: string }>>(
    (await knexInstance<User>('users').select('id', 'name')).map((u) => ({
      identifier: u.id,
      username: u.name,
    }))
  );

  expectType<Array<{ identifier: number; username: string }>>(
    (await knexInstance('users_inferred').select('id', 'name')).map((u) => ({
      identifier: u.id,
      username: u.name,
    }))
  );

  expectType<Array<{ identifier: number; username: string }>>(
    (await knexInstance('users_composite').select('id', 'name')).map((u) => ({
      identifier: u.id,
      username: u.name,
    }))
  );

  expectType<Array<{ identifier: number; username: string }>>(
    (await knexInstance.select('id', 'name').from<User>('users')).map((u) => ({
      identifier: u.id,
      username: u.name,
    }))
  );

  expectType<Array<{ identifier: number; username: string }>>(
    (await knexInstance.select('id', 'name').from('users_inferred')).map(
      (u) => ({
        identifier: u.id,
        username: u.name,
      })
    )
  );

  expectType<Array<{ identifier: number; username: string }>>(
    (await knexInstance.select('id', 'name').from('users_composite')).map(
      (u) => ({
        identifier: u.id,
        username: u.name,
      })
    )
  );

  // This one is not strongly typed because `.from('users')` doesn’t reference a typed table
  // so the user type is `any`.
  expectType<Array<{ identifier: any; username: any }>>(
    (await knexInstance.select('id', 'name').from('users')).map((u) => ({
      identifier: u.id,
      username: u.name,
    }))
  );

  expectType<number>(
    (await knexInstance.select('id', 'name', 'age').from<User>('users')).reduce(
      (maxAge: number, user) => (user.age > maxAge ? user.age : maxAge),
      0
    )
  );

  expectType<number>(
    (
      await knexInstance.select('id', 'name', 'age').from('users_inferred')
    ).reduce(
      (maxAge: number, user) => (user.age > maxAge ? user.age : maxAge),
      0
    )
  );

  expectType<number>(
    (
      await knexInstance.select('id', 'name', 'age').from('users_composite')
    ).reduce(
      (maxAge: number, user) => (user.age > maxAge ? user.age : maxAge),
      0
    )
  );

  expectType<any>(
    (
      await knexInstance('table')
        .select('key', 'value')
        .where({ namespace: 'foo' })
    ).reduce(
      (aggr, { value, key }) => ({
        ...aggr,
        [key]: value > 10 ? (aggr[key] || 0) + 1 : aggr[key],
      }),
      {} as any
    )
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance<User>('users').select(['id', 'age'])
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance('users_inferred').select(['id', 'age'])
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance('users_composite').select(['id', 'age'])
  );

  expectType<Pick<User, 'id' | 'age'> | undefined>(
    await knexInstance<User>('users').select(['id', 'age']).first()
  );

  expectType<Pick<User, 'id' | 'age'> | undefined>(
    await knexInstance('users_inferred').select(['id', 'age']).first()
  );

  expectType<Pick<User, 'id' | 'age'> | undefined>(
    await knexInstance('users_composite').select(['id', 'age']).first()
  );

  // Not strongly typed since `'users'` is not referencing a typed table
  expectType<any[]>(await knexInstance<User>('users').select('users.id'));

  expectType<Array<Pick<User, 'name'>>>(
    await knexInstance<User>('users')
      .select(['id', 'age'])
      .clearSelect()
      .select(['name'])
  );

  expectType<Array<Pick<User, 'name'>>>(
    await knexInstance('users_inferred')
      .select(['id', 'age'])
      .clearSelect()
      .select(['name'])
  );

  expectType<Array<Pick<User, 'name'>>>(
    await knexInstance('users_composite')
      .select(['id', 'age'])
      .clearSelect()
      .select(['name'])
  );

  expectType<Array<Pick<User, 'name' | 'departmentId'>>>(
    await knexInstance<User>('users')
      .select('id')
      .select('age')
      .clearSelect()
      .select('name')
      .select('departmentId')
  );

  expectType<Array<Pick<User, 'name' | 'departmentId'>>>(
    await knexInstance('users_inferred')
      .select('id')
      .select('age')
      .clearSelect()
      .select('name')
      .select('departmentId')
  );

  expectType<Array<Pick<User, 'name' | 'departmentId'>>>(
    await knexInstance('users_composite')
      .select('id')
      .select('age')
      .clearSelect()
      .select('name')
      .select('departmentId')
  );

  expectType<Array<Pick<User, 'name' | 'departmentId'>>>(
    await knexInstance
      .select('id')
      .select('age')
      .clearSelect()
      .select('name')
      .select('departmentId')
      .from<User>('users')
  );

  expectType<Array<Pick<User, 'name' | 'departmentId'>>>(
    await knexInstance
      .select('id')
      .select('age')
      .clearSelect()
      .select('name')
      .select('departmentId')
      .from('users_inferred')
  );

  expectType<Array<Pick<User, 'name' | 'departmentId'>>>(
    await knexInstance
      .select('id')
      .select('age')
      .clearSelect()
      .select('name')
      .select('departmentId')
      .from('users_composite')
  );

  // Not strongly typed since `'users'` is not referencing a typed table
  expectType<any[]>(
    await knexInstance<User>('users').select('users.id').select('age')
  );

  // Not strongly typed since `'departments'` is not referencing a typed table
  expectType<any[]>(
    await knexInstance<User>('users').select('id').from('departments')
  );

  // This one is typed because `'departments'` references a typed table
  expectType<Array<Pick<Department, 'id'>>>(
    await knexInstance<User>('users')
      .select('id')
      .from<Department>('departments')
  );

  expectType<Array<Pick<Department, 'id'>>>(
    await knexInstance('users_inferred')
      .select('id')
      .from('departments_inferred')
  );

  expectType<Array<Pick<Department, 'id'>>>(
    await knexInstance('users_composite')
      .select('id')
      .from('departments_composite')
  );

  // Not strongly typed since `'users'` is not referencing a typed table
  expectType<any[]>(await knexInstance.select('id').from('users'));

  expectType<Array<Pick<User, 'id'>>>(
    await knexInstance.select('id').from<User>('users')
  );

  expectType<Array<Pick<User, 'id'>>>(
    await knexInstance.select('id').from('users_inferred')
  );

  expectType<Array<Pick<User, 'id'>>>(
    await knexInstance.select('id').from('users_composite')
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance.select('id', 'age').from<User>('users')
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance.select('id', 'age').from('users_inferred')
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance.select('id', 'age').from('users_composite')
  );

  expectType<Array<Pick<User, 'id'>>>(
    await knexInstance.from<User>('users').select('id')
  );

  expectType<Array<Pick<User, 'id'>>>(
    await knexInstance.from('users_inferred').select('id')
  );

  expectType<Array<Pick<User, 'id'>>>(
    await knexInstance.from('users_composite').select('id')
  );

  // Not strongly typed since `'users'` is not referencing a typed table
  expectType<any[]>(await knexInstance.from<User>('users').select('users.id'));

  // Force-casting the return to a narrower type (less common usage)
  expectType<Array<Pick<User, 'id'>>>(
    await knexInstance
      .from<User>('users')
      .select<Pick<User, 'id'>[]>('users.id')
  );

  // Not strongly typed since `'users'` is not referencing a typed table
  expectType<any[]>(
    await knexInstance.column('id', 'age').select().from('users')
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance.column('id', 'age').select().from<User>('users')
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance.column('id', 'age').select().from('users_inferred')
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance.column('id', 'age').select().from('users_composite')
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance<User>('users').column('id', 'age').select()
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance('users_inferred').column('id', 'age').select()
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance('users_composite').column('id', 'age').select()
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance<User>('users').column('id', 'age')
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance('users_inferred').column('id', 'age')
  );

  expectType<Array<Pick<User, 'id' | 'age'>>>(
    await knexInstance('users_composite').column('id', 'age')
  );

  // Not strongly typed since `'users'` is not referencing a typed table
  expectType<any[]>(await knexInstance('users').distinct('name', 'age'));

  expectType<Array<Pick<User, 'name' | 'age'>>>(
    await knexInstance<User>('users').distinct('name', 'age')
  );

  expectType<Array<Pick<User, 'name' | 'age'>>>(
    await knexInstance('users_inferred').distinct('name', 'age')
  );

  expectType<Array<Pick<User, 'name' | 'age'>>>(
    await knexInstance('users_composite').distinct('name', 'age')
  );

  expectType<
    Array<Pick<User, 'name' | 'id' | 'age' | 'active' | 'departmentId'>>
  >(await knexInstance<User>('users').distinct());

  expectType<
    Array<Pick<User, 'name' | 'id' | 'age' | 'active' | 'departmentId'>>
  >(await knexInstance('users_inferred').distinct());

  expectType<
    Array<Pick<User, 'name' | 'id' | 'age' | 'active' | 'departmentId'>>
  >(await knexInstance('users_composite').distinct());

  expectType<Array<User>>(await knexInstance.select('*').from<User>('users'));

  expectType<Array<User>>(
    await knexInstance.select('*').from('users_inferred')
  );

  expectType<Array<User>>(
    await knexInstance.select('*').from('users_composite')
  );
};

class ExcelClient extends knex.Client {}
