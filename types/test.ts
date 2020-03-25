import * as Knex from 'knex';

// Use:
// import Knex from 'knex'
// when "esModuleInterop": true

declare module 'knex' {
  interface QueryBuilder {
    customSelect<TRecord, TResult>(value: number): QueryBuilder<TRecord, TResult>;
  }
}

Knex.QueryBuilder.extend('customSelect', function(value: number) {
  return this.select(this.client.raw(`${value} as value`));
});

const clientConfig = {
  client: 'sqlite3',
  connection: {
    filename: './mydb.sqlite',
  },
};

const knex = Knex(clientConfig);

const knex2 = Knex({
    ...clientConfig,
    log: {
        debug(msg: string) {}
    },
    pool: {
      log: (msg: string, level: string) => {}
    }
});

knex.initialize();
knex.initialize({});

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

const main = async () => {
  // # Select:

  // $ExpectType any[]
  await knex('users');

  // $ExpectType number[]
  await knex('users').customSelect<any, number[]>(42);

  // This test (others similar to it) may seem useless but they are needed
  // to test for left-to-right inference issues eg: #3260
  const u1: User[] = await knex('users');

  // $ExpectType User[]
  await knex<User>('users');

  // $ExpectType any[]
  await knex('users').select('id');

  const u2: Partial<User>[] = await knex('users').select('id');

  // $ExpectType any[]
  await knex('users')
    .select('id')
    .select('age');

  // $ExpectType any
  await knex('users')
    .select('id')
    .select('age')
    .first();

  // $ExpectType any
  await knex('users').first('id');

  // $ExpectType any
  await knex
    .first('*')
    .from('table')
    .where({
      whatever: 'whatever'
    });

  // $ExpectType any
  await knex('users').first('id', 'name');

  const u3: User = await knex('users').first('id', 'name');

  // $ExpectType any
  await knex('users').first(knex.ref('id').as('identifier'));

  // $ExpectType Pick<User, "id"> | undefined
  await knex<User>('users').first('id');

  // $ExpectType Pick<User, "id" | "name"> | undefined
  await knex<User>('users').first('id', 'name');

  // $ExpectType { identifier: number; } | undefined
  await knex<User>('users').first(knex.ref('id').as('identifier'));

  // $ExpectType Pick<User, "id"> | undefined
  await knex.first('id').from<User>('users');

  // $ExpectType Pick<User, "id" | "name"> | undefined
  await knex.first('id', 'name').from<User>('users');

  // $ExpectType { identifier: number; } | undefined
  await knex.first(knex.ref('id').as('identifier')).from<User>('users');

  // $ExpectType Pick<User, "id">[]
  await knex<User>('users').select('id');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users')
    .select('id')
    .select('age');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users').select('id', 'age');

  // $ExpectType any
  await knex.raw('select * from users');

  // $ExpectType User[]
  await knex.raw<User[]>('select * from users');

  // $ExpectType any
  await knex.raw(
      'select * from users where id in ?',
      knex('contacts').select('name')
  );

  // $ExpectType User[]
  await knex.raw<User[]>(
      'select * from users where id in ?',
      knex('contacts').select('name')
  );

  // $ExpectType User[]
  await knex.raw<User[]>(
      'select * from users where departmentId in ?',
      knex<Department>('departments').select('id')
  );

  // $ExpectType User[]
  await knex.raw<User[]>(
      'select * from users where departmentId in ? & active in ?',
      [
          knex<Department>('departments').select('name'),
          [true, false]
      ]
  );

  // $ExpectType User[]
  await knex<User>('user').where('name', ['a', 'b', 'c']);

  // $ExpectType User[]
  await knex<User>('user').whereRaw('name = ?', 'L');

  // $ExpectType User[]
  await knex<User>('user').whereRaw('name = ?', 'L').clearWhere();

  // $ExpectType User[]
  await knex<User>('user').whereBetween("id", [1, 2]);

  const range = [1, 2] as const;
  // $ExpectType User[]
  await knex<User>('user').whereBetween("id", range);

  // $ExpectType { id: number; }[]
  const r3 = await knex<User>('users').select(knex.ref('id'));

  // $ExpectType (Pick<User, "name"> & { id: number; })[]
  const r4 = await knex<User>('users').select(knex.ref('id'), 'name');
  type _TR4 = ExtendsWitness<typeof r4[0], Pick<User, "id" | "name">>;

  // $ExpectType (Pick<User, "name"> & { identifier: number; })[]
  const r5 = await knex<User>('users').select(knex.ref('id').as('identifier'), 'name');
  type _TR5 = ExtendsWitness<typeof r5[0], {identifier: number; name: string}>;

  // $ExpectType (Pick<User, "name"> & { identifier: number; yearsSinceBirth: number; })[]
  const r6 = await knex<User>('users').select(
      knex.ref('id').as('identifier'),
      'name',
      knex.ref('age').as('yearsSinceBirth')
  );
  type _TR6 = ExtendsWitness<typeof r6[0], {identifier: number; name: string; yearsSinceBirth: number}>;

  // $ExpectType { id: number; }[]
  const r7 = await knex.select(knex.ref('id')).from<User>('users');
  type _TR7 = ExtendsWitness<typeof r7[0], Pick<User, "id">>;

  // $ExpectType (Pick<User, "name"> & { id: number; })[]
  const r8 = await knex.select(knex.ref('id'), 'name').from<User>('users');
  type _TR8 = ExtendsWitness<typeof r8[0], Pick<User, "id" | "name">>;

  // $ExpectType (Pick<User, "name"> & { identifier: number; })[]
  const r9 = await knex.select(knex.ref('id').as('identifier'), 'name').from<User>('users');
  type _TR9 = ExtendsWitness<typeof r9[0], {identifier: number; name: string}>;

  // $ExpectType (Pick<User, "name"> & { identifier: number; yearsSinceBirth: number; })[]
  const r10 = await knex.select(
      knex.ref('id').as('identifier'),
      'name',
      knex.ref('age').as('yearsSinceBirth')
  ).from<User>('users');
  type _TR10 = ExtendsWitness<typeof r10[0], {identifier: number; name: string; yearsSinceBirth: number}>;

  // $ExpectType { id: number; age: any; }[]
  await knex<User>('users').select(knex.ref('id'), {age: 'users.age'});

  // $ExpectType { id: number; age: any; } | undefined
  await knex<User>('users').select(knex.ref('id'), {age: 'users.age'}).first();

  // $ExpectType { identifier: number; username: string; }[]
  (await knex<User>('users')
    .select('id', 'name'))
    .map((u) => ({ identifier: u.id, username: u.name }));

  // $ExpectType { identifier: number; username: string; }[]
  (await knex
    .select('id', 'name')
    .from<User>('users'))
    .map((u) => ({ identifier: u.id, username: u.name }));

  // $ExpectType { identifier: any; username: any; }[]
  (await knex
    .select('id', 'name')
    .from('users'))
    .map((u) => ({ identifier: u.id, username: u.name }));

  // $ExpectType number
  (await knex
    .select('id', 'name', 'age')
    .from<User>('users'))
    .reduce((maxAge: number, user) => (user.age > maxAge ? user.age : maxAge), 0);

  // $ExpectType any
  (await knex('table')
    .select('key', 'value')
    .where({ namespace: 'foo' }))
    .reduce(
      (aggr, { value, key }) => ({
        ...aggr,
        [key]: value > 10 ? (aggr[key] || 0) + 1 : aggr[key],
      }),
      {} as any
    );

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users').select(['id', 'age']);

  // $ExpectType Pick<User, "id" | "age"> | undefined
  await knex<User>('users')
    .select(['id', 'age'])
    .first();

  // $ExpectType any[]
  await knex<User>('users').select('users.id');

  // $ExpectType Pick<User, "name">[]
  await knex<User>('users')
    .select(['id', 'age'])
    .clearSelect()
    .select(['name']);

  // $ExpectType Pick<User, "name" | "departmentId">[]
  await knex<User>('users')
    .select('id')
    .select('age')
    .clearSelect()
    .select('name')
    .select('departmentId');

  // $ExpectType Pick<User, "name" | "departmentId">[]
  await knex
    .select('id')
    .select('age')
    .clearSelect()
    .select('name')
    .select('departmentId')
    .from<User>('users');

  // $ExpectType any[]
  await knex<User>('users')
    .select('users.id')
    .select('age');

  // $ExpectType any[]
  await knex<User>('users')
    .select('id')
    .from('departments');

  // $ExpectType Pick<Department, "id">[]
  await knex<User>('users')
    .select('id')
    .from<Department>('departments');

  // $ExpectType any[]
  await knex.select('id').from('users');

  // $ExpectType Pick<User, "id">[]
  await knex.select('id').from<User>('users');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex.select('id', 'age').from<User>('users');

  // $ExpectType Pick<User, "id">[]
  await knex.from<User>('users').select('id');

  // $ExpectType any[]
  await knex.from<User>('users').select('users.id');

  // $ExpectType Pick<User, "id">[]
  await knex.from<User>('users').select<Pick<User, 'id'>[]>('users.id');

  // $ExpectType any[]
  await knex
    .column('id', 'age')
    .select()
    .from('users');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex
    .column('id', 'age')
    .select()
    .from<User>('users');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users')
    .column('id', 'age')
    .select();

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users').column('id', 'age');

  // $ExpectType any[]
  await knex('users').distinct('name', 'age');

  // $ExpectType Pick<User, "age" | "name">[]
  await knex<User>('users').distinct('name', 'age');

  // $ExpectType Pick<User, "id" | "age" | "name" | "active" | "departmentId">[]
  await knex<User>('users').distinct();

  // $ExpectType User[]
  await knex.select('*').from<User>('users');

  const r1 = await knex
    .column('id', { yearsSinceBirth: 'age' })
    .select()
    .from<User>('users');

  type TR1_1 = ExtendsWitness<
    { id: number; yearsSinceBirth: any },
    typeof r1[0]
  >;
  type TR1_2 = ExtendsWitness<number, typeof r1[0]['id']>;
  type TR1_3 = ExtendsWitness<any, typeof r1[0]['yearsSinceBirth']>;

  const r2 = await knex
    .column('id', { yearsSinceBirth: 'age' as 'age' })
    .select()
    .from<User>('users');

  type TR2_1 = ExtendsWitness<
    { id: number; yearsSinceBirth: number },
    typeof r2[0]
  >;
  type TR2_2 = ExtendsWitness<number, typeof r1[0]['id']>;
  type TR2_3 = ExtendsWitness<number, typeof r1[0]['yearsSinceBirth']>;

  // ## Conditional Selection:

  // $ExpectType User[]
  await knex<User>('users').where({ id: 10 });

  // $ExpectType Pick<User, "id" | "name">[]
  await knex<User>('users')
    .select('id', 'name')
    .where({ id: 10 });

  // $ExpectType Partial<User>[]
  await knex
    .select<Partial<User>[]>(['users.*', 'departments.name as depName'])
    .from('users')
    .join('departments', 'departments.id', '=', 'users.department_id')
    .orderBy('name');

  // $ExpectType Partial<User> | undefined
  await knex
    .select<Partial<User>[]>(['users.*', 'departments.name as depName'])
    .from('users')
    .join('departments', 'departments.id', '=', 'users.department_id')
    .orderBy('name')
    .first();

  // $ExpectType Partial<User>[]
  await knex
    .select<Partial<User>[]>(['users.*', 'departments.name as depName'])
    .from('users')
    .join('departments', 'departments.id', '=', 'users.department_id')
    .orderByRaw('name DESC');

  // $ExpectType User | undefined
  await knex<User>('users')
    .where({ id: 10 })
    .first();

  // $ExpectType any[]
  await knex.where({ id: 10 }).from('users');

  // $ExpectType any
  await knex.where({ id: 10 }).from('users').first();

  // $ExpectType User[]
  await knex.where({ id: 10 }).from<User>('users');

  // $ExpectType User | undefined
  await knex
    .where({ id: 10 })
    .from<User>('users')
    .clearWhere()
    .where({ id: 11 })
    .orWhere({ id: 12 })
    .first();

  // $ExpectType User[]
  await knex
    .where({ id: 10 })
    .where('age', '>', 20)
    .from<User>('users');

  // $ExpectType User[]
  await knex<User>('users').whereNot('age', '>', 100);

  // ### Boolean operations

  // $ExpectType User[]
  await knex<User>('users').not.where('id', 10);

  // $ExpectType User[]
  await knex<User>('user').where('name', 'L').and.where('age', 20);

  // $ExpectType User[]
  await knex<User>('user').where('name', 'L').or.where('age', 20);

  // ## Aggregation:

  const u4: User[] = await knex('users')
    .groupBy('count')
    .orderBy('name', 'desc')
    .having('age', '>', 10);

  const u5: User[] = await knex('users')
    .groupBy('count')
    .orderBy('name', 'desc')
    .having(knex.raw('age > ?', 10));

  const u6: User[] = await knex('users')
    .groupBy('count')
    .orderBy('name', 'desc')
    .having(knex.raw('age'), '>', 10);

  // $ExpectType User[]
  await knex<User>('users')
    .groupBy('count')
    .orderBy('name', 'desc')
    .having('age', '>', 10);

  // $ExpectType User[]
  await knex<User>('users')
    .groupByRaw('count')
    .orderBy('name', 'desc')
    .having('age', '>', 10);

  // $ExpectType User[]
  await knex<User>('users')
    .groupByRaw('count')
    .orderBy('name', 'desc')
    .havingRaw('age > ?', [10]);

  // $ExpectType User[]
  await knex<User>('users')
    .select()
    .orderBy(
      knex<User>('users')
        .select('u.id')
        .from('users as u')
        .where('users.id', 'u.id')
    );

  await knex<User>('users')
    .select()
    .orderBy([{
      column: knex<User>('users')
        .select('u.id')
        .from('users as u')
        .where('users.id', 'u.id'),
      order: 'desc'
    }]);

  await knex<User>('users')
    .select()
    .orderBy([{
      column: 'id',
      order: 'desc'
    }, {
      column: 'name',
      order: 'desc'
    }]);

  await knex<User>('users')
    .select()
    .orderBy([{
      column: 'id',
      order: 'desc'
    }, 'name']);

  // $ExpectType Dict<string | number>[]
  await knex<User>('users').count();

  // $ExpectType Dict<string | number>[]
  await knex<User>('users').count('age');

  // $ExpectType Dict<string | number>[]
  await knex('users').count('age');

  // $ExpectType { count: number; }
  await knex('foo').first().count<{count: number}>({count: '*'});

  // $ExpectType { count: number; }
  await knex('foo').first().countDistinct<{count: number}>({count: '*'});

  // $ExpectType { count?: string | number | undefined; }
  await knex('foo').first().count({count: '*'});

  // $ExpectType { count?: string | number | undefined; }
  await knex('foo').first().countDistinct({count: '*'});

  // $ExpectType Dict<string | number>
  await knex<User>('users').first().count('age');

  // $ExpectType Dict<string | number>
  await knex('users').first().count('age', 'id');

  // $ExpectType Dict<string | number>
  await knex<User>('users').first().count();

  // $ExpectType Dict<string | number>[]
  await knex.count().from<User>('users');

  // $ExpectType Dict<string | number>[]
  await knex.count('age').from<User>('users');

  // $ExpectType Dict<string | number>[]
  await knex.count('age').from('users');

  // $ExpectType { count: number; }
  await knex.first().count<{count: number}>({count: '*'}).from('foo');

  // $ExpectType { count: number; }
  await knex.first().countDistinct<{count: number}>({count: '*'}).from('foo');

  // $ExpectType { count?: string | number | undefined; }
  await knex.first().count({count: '*'}).from('foo');

  // $ExpectType { count?: string | number | undefined; }
  await knex.first().countDistinct({count: '*'}).from('foo');

  // $ExpectType Dict<string | number>
  await knex.first().count('age').from<User>('users');

  // $ExpectType Dict<string | number>
  await knex.first().count('age', 'id').from('users');

  // $ExpectType Dict<string | number>
  await knex.first().count().from<User>('users');

  // $ExpectType Dict<number>[]
  await knex<User>('users').max('age');

  // $ExpectType Dict<number>
  await knex<User>('users').first().max('age');

  // $ExpectType Dict<any>[]
  await knex('users').max('age');

  // $ExpectType Dict<number>[]
  await knex<User>('users').min('age');

  // $ExpectType Dict<number>
  await knex<User>('users').first().min('age');

  // $ExpectType Dict<any>[]
  await knex.max('age').from<User>('users');

  // $ExpectType Dict<any>
  await knex.first().max('age').from<User>('users');

  // $ExpectType Dict<any>[]
  await knex.max('age').from('users');

  // $ExpectType Dict<any>[]
  await knex.min('age').from<User>('users');

  // $ExpectType Dict<any>
  await knex.first().min('age').from<User>('users');

  // $ExpectType ({ dep: any; } & { a?: any; } & { b?: any; })[]
  await knex
    .select({dep: 'departmentId'})
    .min({a: 'age'})
    .max({b: 'age'})
    .from<User>('users');

  // $ExpectType ({ dep: number; } & { a?: any; } & { b?: any; })[]
  await knex<User>('users')
    .select({dep: 'departmentId'})
    .min({a: 'age'})
    .max({b: 'age'});

  // $ExpectType ({ dep: number; } & { a?: string | number | undefined; })[]
  await knex<User>('users')
    .select({dep: 'departmentId'})
    .count({a: 'age'});

  // Type of dep can't be inferred if User type is not available
  // at the time of select

  // $ExpectType ({ dep: any; } & { a?: string | number | undefined; })[]
  await knex
    .select({dep: 'departmentId'})
    .count({a: 'age'})
    .from<User>('users');

  // ## With inner query:

  // ### For column selection:

  // $ExpectType any[]
  await knex('users').select(
    knex('foo')
      .select('bar')
      .as('colName')
  );

  // $ExpectType any[]
  await knex<User>('users').select(
    knex('foo')
      .select('bar')
      .as('colName')
  );

  // $ExpectType Pick<User, "age" | "name">[]
  await knex<User>('users').select<Pick<User, 'name' | 'age'>[]>(
    knex('foo')
      .select('bar')
      .as('colName')
  );

  // ### For condition:

  // $ExpectType any[]
  await knex('users').whereNot(function() {
    this.where('id', 1).orWhereNot('id', '>', 10);
  });

  // $ExpectType User[]
  await knex<User>('users').whereNot(function() {
    this.where('id', 1).orWhereNot('id', '>', 10);
  });

  // $ExpectType User[]
  await knex<User>('users')
    .where((builder) =>
      builder.whereIn('id', [1, 11, 15]).whereNotIn('id', [17, 19])
    )
    .andWhere(function() {
      this.where('id', '>', 10);
    });

  // $ExpectType User | undefined
  await knex<User>('users')
    .where((builder) =>
      builder.whereIn('id', [1, 11, 15]).whereNotIn('id', [17, 19])
    )
    .andWhere(function() {
      this.where('id', '>', 10);
    })
    .first();

  const values = [[1, 'a'], [2, 'b']] as const;
  const cols = ['id', 'name'] as const;

  // $ExpectType User[]
  await knex<User>('users')
    .whereIn<"id" | "name">(cols, values);

  // $ExpectType User[]
  await knex<User>('user').whereIn('id', [1, 2]);

  const col = 'id';
  const idList = [1, 2] as const;
  // $ExpectType User[]
  await knex<User>('user').whereIn(col, idList);

  // $ExpectType User[]
  await knex<User>('users').whereNotExists(function() {
    this.select('*')
      .from('accounts')
      .whereRaw('users.account_id = accounts.id');
  });

  // ## Union Queries:

  // $ExpectType any[]
  await knex
    .select('*')
    .from('users')
    .whereNull('last_name')
    .union(function() {
      this.select('*')
        .from('users')
        .whereNull('first_name');
    });

  // $ExpectType User[]
  await knex<User>('users')
    .select('*')
    .whereNull('name')
    .union(function() {
      this.select('*')
        .from<User>('users')
        .whereNull('first_name');
    });

  // ## Joins:

  // $ExpectType any[]
  await knex('users').innerJoin(
    'departments',
    'users.departmentid',
    'departments.id'
  );

  // $ExpectType any[]
  await knex<User>('users').innerJoin(
    'departments',
    'users.departmentid',
    'departments.id'
  );

  // $ExpectType any[]
  await knex('users').innerJoin<Department>(
    'departments',
    'users.departmentid',
    'departments.id'
  );

  // $ExpectType (User & Department)[]
  await knex<User>('users').innerJoin<Department>(
    'departments',
    'users.departmentid',
    'departments.id'
  );

  // $ExpectType (User & Department & Article)[]
  await knex<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentid',
      'departments.id'
    )
    .innerJoin<Article>('articles', 'articles.authorId', 'users.id');

  // $ExpectType any[]
  await knex<User>('users')
    .innerJoin('departments', 'users.departmentid', 'departments.id')
    .innerJoin<Article>('articles', 'articles.authorId', 'users.id');

  // $ExpectType (User & Department)[]
  await knex<User>('users').innerJoin<Department>(
    'departments',
    'users.departmentid',
    '=',
    'departments.id'
  );

  // $ExpectType { username: any; }[]
  (await knex<User>('users')
    .innerJoin('departments', 'users.departmentid', 'departments.id'))
    .map(function(joined) {
      return {
        username: joined.name,
      };
    });

  // $ExpectType { username: string; }[]
  (await knex<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentid',
      'departments.id'
    ))
    .map(function(joined) {
      return {
        username: joined.name,
      };
    });

  // $ExpectType { username: string; }[]
  (await knex<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentid',
      'departments.id'
    )
    .select('*'))
    .map(function(joined) {
      return {
        username: joined.name,
      };
    });

  // $ExpectType { username: string; }[]
  (await knex<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentid',
      'departments.id'
    )
    .select())
    .map(function(joined) {
      return {
        username: joined.name,
      };
    });

  // $ExpectType { username: string; }[]
  (await knex<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentid',
      'departments.id'
    )
    .select('name', 'age'))
    .map(function(joined) {
      return {
        username: joined.name,
      };
    });

  // $ExpectType { username: any; }[]
  (await knex<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentid',
      'departments.id'
    )
    .select('users.name', 'age'))
    .map(function(joined) {
      return {
        username: joined.name,
      };
    });

  // $ExpectType (User & Department)[]
  await knex
    .select<(User & Department)[]>('users')
    .innerJoin('departments', 'users.departmentId', 'departments.id');

  // $ExpectType (User & Department)[]
  await knex<User>('users').innerJoin<Department>('departments', function() {
    this.on('users.id', '=', 'departments.id');
  });

  // $ExpectType any[]
  await knex<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentid',
      'departments.id'
    )
    .select('users.id', 'departments.id');

  // $ExpectType (User & Department)[]
  await knex
    .select('*')
    .from<User>('users')
    .join<Department>('departments', function() {
      this.on(function() {
        this.on('departments.id', '=', 'users.department_id');
        this.orOn('departments.owner_id', '=', 'users.id');
      });
    });

  // # Insertion

  // $ExpectType number[]
  await knex('users').insert({ id: 10 });

  // $ExpectType number[]
  await knex<User>('users').insert({ id: 10 });

  const qb2 = knex<User>('users');
  qb2.returning(['id', 'name']);

  const qb2ReturnCols = ['id', 'name'] as const;
  qb2.returning(qb2ReturnCols);

  // $ExpectType Partial<User>[]
  await qb2.insert<Partial<User>[]>({ id: 10 });

  // ## With returning

  // $ExpectType any[]
  await knex('users')
    .insert({ id: 10 })
    .returning('id');

  // $ExpectType number[]
  await knex('users')
    .insert({ id: 10 })
    .returning<number[]>('id');

  // $ExpectType string[]
  await knex<User>('users')
    .insert({ id: 10 })
    .returning<string[]>('id');

  // $ExpectType number[]
  await knex<User>('users')
    .insert({ id: 10 })
    .returning('id');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users')
    .insert({ id: 10 })
    .returning(['id', 'age']);

  // $ExpectType number[]
  await knex<User>('users').insert({ id: 10 }, 'id');

  // $ExpectType User[]
  await knex<User>('users').insert({ id: 10 }, '*');

  // $ExpectType number[]
  await knex.insert({ id: 10 }, 'id').into<User>('users');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users')
    .insert({ id: 10 })
    .returning(['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users')
    .insert({ id: 10 }, 'id')
    .returning(['id', 'age']);

  // $ExpectType any[]
  await knex('users')
    .insert({id: 10})
    .returning('*');

  // $ExpectType User[]
  await knex<User>('users')
    .insert({id: 10})
    .returning('*');

  // $ExpectType any[]
  await knex
    .insert({id: 10})
    .into('users')
    .returning('*');

  // $ExpectType User[]
  await knex
    .insert({id: 10})
    .into<User>('users')
    .returning('*');

  // $ExpectType User[]
  await knex
    .insert({id: 10})
    .returning('*')
    .into<User>('users');

  // $ExpectType User[]
  await knex<User>('users')
    .insert({id: 10}, 'id')
    .returning('*');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex
    .insert({ id: 10 })
    .returning(['id', 'age'])
    .into<User>('users');

  // $ExpectType any[]
  await knex('users')
    .insert({ id: 10 })
    .returning(['id', 'age']);

  // # Update

  // $ExpectType number
  await knex('users')
    .where('id', 10)
    .update({ active: true });

  const qb1 = knex('users').where('id', 10);
  qb1.returning(['id', 'name']);
  // $ExpectType Partial<User>[]
  await qb1.update<Partial<User>[]>({ active: true });

  // $ExpectType number
  await knex<User>('users')
    .where('id', 10)
    .update({ active: true });

  // $ExpectType number
  await knex
    .where('id', 10)
    .update({ active: true })
    .from('users');

  // ## With Returning

  // $ExpectType any[]
  await knex('users')
    .where('id', 10)
    .update({ active: true })
    .returning(['id', 'age']);

  // $ExpectType any[]
  await knex('users')
    .where('id', 10)
    .update({ active: true })
    .returning('*');

  // $ExpectType User[]
  await knex<User>('users')
    .where('id', 10)
    .update({ active: true })
    .returning('*');

  // $ExpectType any[]
  await knex
    .where('id', 10)
    .update({ active: true })
    .returning('*')
    .from('users');

  // $ExpectType User[]
  await knex
    .where('id', 10)
    .update({ active: true })
    .returning('*')
    .from<User>('users');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users')
    .where('id', 10)
    .update({ active: true })
    .returning(['id', 'age']);

  // $ExpectType number[]
  await knex<User>('users')
    .where('id', 10)
    .update({ active: true }, 'id');

  // $ExpectType number[]
  await knex<User>('users')
    .where('id', 10)
    .update('active', true, 'id');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users')
    .where('id', 10)
    .update({ active: true }, ['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users')
    .where('id', 10)
    .update('active', true, ['id', 'age']);

  const userUpdateReturnCols = ['id', 'age'] as const;
  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users')
    .where('id', 10)
    .update({ active: true }, userUpdateReturnCols);

  // TODO: .update('active', true', ['id', 'age']) does not works correctly
  // $ExpectType Pick<User, "id" | "age">[]
  await knex
    .where('id', 10)
    .update({ active: true }, ['id', 'age'])
    .into<User>('users');

  // # Deletion

  // $ExpectType number
  await knex<User>('users')
    .where('id', 10)
    .delete();

  // $ExpectType number
  await knex<User>('users')
    .where('id', 10)
    .del();

  // $ExpectType number[]
  await knex<User>('users')
    .where('id', 10)
    .delete('id');

  // $ExpectType any[]
  await knex('users')
    .where('id', 10)
    .del()
    .returning('*');

  // $ExpectType any[]
  await knex('users')
    .where('id', 10)
    .delete()
    .returning('*');

  // $ExpectType User[]
  await knex<User>('users')
    .where('id', 10)
    .del()
    .returning('*');

  // $ExpectType User[]
  await knex<User>('users')
    .where('id', 10)
    .delete()
    .returning('*');

  // $ExpectType User[]
  await knex
    .where('id', 10)
    .del()
    .returning('*')
    .from<User>('users');

  // $ExpectType User[]
  await knex
    .where('id', 10)
    .delete()
    .returning('*')
    .from<User>('users');

  // $ExpectType number[]
  await knex
    .where('id', 10)
    .delete('id')
    .from<User>('users');

  // $ExpectType void
  await knex<User>('users').truncate();

  // $ExpectType void
  await knex('users').truncate();

  // # Column Info:

  // $ExpectType ColumnInfo
  await knex('users').columnInfo();

  // $ExpectType ColumnInfo
  await knex<User>('users').columnInfo();

  // # Modify:

  function withUserName(queryBuilder: Knex.QueryBuilder, foreignKey: string) {
    queryBuilder
      .leftJoin('users', foreignKey, 'users.id')
      .select('users.user_name');
  }

  // $ExpectType QueryBuilder<any, any>
  knex
    .table('articles')
    .select('title', 'body')
    .modify(withUserName, 'articles_user.id');

  const withAge = (queryBuilder: Knex.QueryBuilder<User, any[]>) =>
    queryBuilder.select('age');

  // $ExpectType Pick<User, "id" | "age">
  await knex
    .table<User>('users')
    .select('id')
    .modify<User, Pick<User, 'id' | 'age'>>(withAge);

  // Transactions:

  // $ExpectType any[]
  await knex.transaction(async (trx) => {
    return trx.insert({ name: 'Old Books' }, 'id').into('articles');
  });

  // $ExpectType Pick<Article, "id" | "subject">[]
  await knex.transaction(async (trx) => {
    const articles: Article[] = [
      { id: 1, subject: 'Canterbury Tales' },
      { id: 2, subject: 'Moby Dick' },
      { id: 3, subject: 'Hamlet' },
    ];
    return trx
      .insert(articles)
      .into<Article>('articles')
      .returning(['id', 'subject']);
  });

  // $ExpectType Pick<Article, "id" | "subject">[]
  await knex.transaction(async (trx) => {
    const articles = [
      { id: 1, subject: 'Canterbury Tales' },
      { id: 2, subject: 'Moby Dick' },
      { id: 3, subject: 'Hamlet' },
    ] as const;
    return trx
      .insert(articles)
      .into<Article>('articles')
      .returning(['id', 'subject']);
  });

  // $ExpectType any
  await knex.transaction(async (trx) => {
    const articles: Article[] = [
      { id: 1, subject: 'Canterbury Tales' },
      { id: 2, subject: 'Moby Dick' },
      { id: 3, subject: 'Hamlet' },
    ];
    return knex
      .insert(articles, ['id', 'subject'])
      .into<Article>('articles')
      .transacting(trx)
      .then(trx.commit)
      .catch(trx.rollback);
  });

    // $ExpectType any
    await knex.transaction(async (trx) => {
      const articles: ReadonlyArray<Article> = [
        { id: 1, subject: 'Canterbury Tales' },
        { id: 2, subject: 'Moby Dick' },
        { id: 3, subject: 'Hamlet' },
      ];
      return knex
        .insert(articles, ['id', 'subject'])
        .into<Article>('articles')
        .transacting(trx)
        .then(trx.commit)
        .catch(trx.rollback);
    });

  // $ExpectType Pick<Article, "id" | "subject">[]
  await knex.transaction(
    async (
      trx: Knex.Transaction<Article, Pick<Article, 'id' | 'subject'>[]>
    ) => {
      const articles: Article[] = [
        { id: 1, subject: 'Canterbury Tales' },
        { id: 2, subject: 'Moby Dick' },
        { id: 3, subject: 'Hamlet' },
      ];
      return knex
        .insert(articles, ['id', 'subject'])
        .into<Article>('articles')
        .transacting(trx)
        .then(trx.commit)
        .catch(trx.rollback);
    }
  );

  // With:

  // $ExpectType any[]
  await knex
    .with('with_alias', knex.raw('select * from "users" where "id" = ?', 1))
    .select('*')
    .from('with_alias');

  // $ExpectType any[]
  await knex
    .with(
      'with_alias',
      knex.raw<User[]>('select * from "users" where "id" = ?', 1)
    )
    .select('*')
    .from('with_alias');

  // $ExpectType User[]
  await knex
    .with(
      'with_alias',
      knex.raw<User[]>('select * from "users" where "id" = ?', 1)
    )
    .select('*')
    .from<User>('with_alias');

  // $ExpectType any[]
  await knex
    .with('with_alias', (qb) => {
      qb.select('*')
        .from('books')
        .where('author', 'Test');
    })
    .select('*')
    .from('with_alias');

  // $ExpectType any[]
  await knex
    .withRecursive('ancestors', (qb) => {
      qb.select('*')
        .from('users')
        .where('users.id', 1);
    })
    .select('*')
    .from('ancestors');

  // $ExpectType any[]
  await knex
    .withRecursive('ancestors', (qb) => {
      qb.select('*')
        .from<User>('users')
        .where('users.id', 1);
    })
    .select('*')
    .from('ancestors');

  // $ExpectType User[]
  await knex
    .withRecursive('ancestors', (qb) => {
      qb.select('*')
        .from<User>('users')
        .where('users.id', 1);
    })
    .select('*')
    .from<User>('ancestors');

  // $ExpectType User[]
  await knex
    .withRecursive('ancestors', (qb: Knex.QueryBuilder<User, User[]>) => {
      qb.select('*')
        .from<User>('users')
        .where('users.id', 1);
    })
    .select('*')
    .from<User>('ancestors');

  // $ExpectType Pick<User, "id" | "name">[]
  await knex
    .withRecursive('ancestors', (qb) => {
      qb.select('*')
        .from<User>('users')
        .where('users.id', 1);
    })
    .select('id', 'name')
    .from<User>('ancestors');

  // $ExpectType any[]
  await knex
    .withSchema('public')
    .select('*')
    .from('users');

  // $ExpectType User[]
  await knex
    .withSchema('public')
    .select('*')
    .from<User>('users');

  // Seed:

  // $ExpectType string
  await knex.seed.make('test');

  // $ExpectType string
  await knex.seed.make('test', {
      extension: 'ts',
      directory: 'lib/seeds'
  });

  // $ExpectType [string[]]
  await knex.seed.run();

  // $ExpectType [string[]]
  await knex.seed.run({
      extension: 'ts',
      directory: 'lib/seeds'
  });

  // $ExpectType any[]
  await knex('users', { only: true });

  // $ExpectType any[]
  await knex
    .select('*')
    .from('users', { only: true });

  // $ExpectType any
  knex.queryBuilder().queryContext();

  // .raw() support

  // $ExpectType User[]
  await knex<User>('users')
    .where({
      id: knex.raw<number>('a')
    });

  // $ExpectType User[]
  await knex<User>('users')
    .where('id', knex.raw<string>('a'));

  // $ExpectType Ticket[]
  await knex<Ticket>('users')
    .where({
      at: knex.fn.now()
    });

  // $ExpectType User[]
  await knex<User>('users')
    // we can't do anything here for now
    .where('id', knex.raw<string>('string'));

  // $ExpectType number[]
  await knex<User>('users')
    .insert({
      id: knex.raw<number>('a')
    });

  // $ExpectType User[]
  await knex<User>('users')
    .insert([{
      id: knex.raw<number>('a')
    }], '*');

  // $ExpectType number[]
  await knex<User>('users')
    .update({
      id: knex.raw<number>('a')
    }, 'id');

  // $ExpectType string[]
  await knex<User>('users')
    .update<'active', 'name'>('active', knex.raw<boolean>('true'), 'name');

  // $ExpectType Pick<User, "name">[]
  await knex<User>('users')
    .update<'active', 'name'>('active', knex.raw<boolean>('true'), ['name']);
};
