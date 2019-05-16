import * as Knex from 'knex';

const knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: './mydb.sqlite',
  },
});

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

const main = async () => {
  // # Select:

  // $ExpectType any[]
  await knex('users');

  // $ExpectType User[]
  await knex<User>('users');

  // $ExpectType any[]
  await knex('users').select('id');

  // $ExpectType any[]
  await knex('users').select('id').select('age');

  // $ExpectType any[]
  await knex('users').select('users.id');

  // $ExpectType Pick<User, "id">[]
  await knex<User>('users').select('id');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users').select('id').select('age');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users').select('id', 'age');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users').select(['id', 'age']);

  // $ExpectType any[]
  await knex<User>('users').select('users.id');

  // $ExpectType any[]
  await knex<User>('users').select('users.id').select('age');

  // $ExpectType any[]
  await knex<User>('users').select('id').from('departments');

  // $ExpectType Pick<Department, "id">[]
  await knex<User>('users').select('id').from<Department>('departments');

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

  // $ExpectType any[]
  await knex.column('id', 'age').select().from('users');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex.column('id', 'age').select().from<User>('users');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users').column('id', 'age').select();

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users').column('id', 'age');

  const r1 = await knex.column('id', {yearsSinceBirth: 'age'}).select().from<User>('users');
  type TR1_1 = ExtendsWitness<{id: number; yearsSinceBirth: any}, typeof r1[0]>;
  type TR1_2 = ExtendsWitness<number, typeof r1[0]["id"]>;
  type TR1_3 = ExtendsWitness<any, typeof r1[0]["yearsSinceBirth"]>;

  const r2 = await knex.column('id', {yearsSinceBirth: 'age' as 'age'}).select().from<User>('users');
  type TR2_1 = ExtendsWitness<{id: number; yearsSinceBirth: number}, typeof r2[0]>;
  type TR2_2 = ExtendsWitness<number, typeof r1[0]["id"]>;
  type TR2_3 = ExtendsWitness<number, typeof r1[0]["yearsSinceBirth"]>;

  // ## Conditional Selection:

  // $ExpectType User[]
  await knex<User>('users').where({ id: 10 });

  // $ExpectType any[]
  await knex.where({ id: 10 }).from('users');

  // $ExpectType User[]
  await knex.where({ id: 10 }).from<User>('users');

  // $ExpectType User[]
  await knex.where({ id: 10 }).where('age', '>', 20).from<User>('users');

  // $ExpectType User[]
  await knex<User>('users').whereNot('age', '>', 100);

  // ## Aggregation:

  // $ExpectType Partial<User>[]
  await knex<User>('users')
    .groupBy('count')
    .orderBy('name', 'desc')
    .having('age', '>', 10);

  // $ExpectType { [key: string]: string | number; }[]
  await knex<User>('users').count();

  // $ExpectType ValueDict[]
  await knex<User>('users').max('age');

  // $ExpectType ValueDict[]
  await knex('users').max('age');

  // $ExpectType ValueDict[]
  await knex<User>('users').min('age');

  // $ExpectType { [key: string]: string | number; }[]
  await knex<User>('users').count('age');

  // $ExpectType { [key: string]: string | number; }[]
  await knex('users').count('age');

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

  // ## Joins:

  // $ExpectType (User & Department)[]
  await knex<User>('users').innerJoin<Department>(
    'departments',
    'users.departmentid',
    'departments.id'
  );

  // $ExpectType (User & Department)[]
  await knex<User>('users').innerJoin<Department>(
    'departments',
    'users.departmentid',
    '=',
    'departments.id'
  );

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

  // # Insertion

  // $ExpectType number
  await knex('users').insert({ id: 10 });

  // $ExpectType number
  await knex<User>('users').insert({ id: 10 });

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

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users')
    .insert({ id: 10 })
    .returning(['id', 'age']);

  // $ExpectType any[]
  await knex('users')
    .insert({ id: 10 })
    .returning(['id', 'age']);

  // # Update

  // $ExpectType number
  await knex('users')
    .where('id', 10)
    .update({ active: true });

  // $ExpectType number
  await knex<User>('users')
    .where('id', 10)
    .update({ active: true });

  // ## With Returning

  // $ExpectType any[]
  await knex('users')
    .where('id', 10)
    .update({ active: true })
    .returning(['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users')
    .where('id', 10)
    .update({ active: true })
    .returning(['id', 'age']);

  // $ExpectType number[]
  await knex<User>('users')
    .where('id', 10)
    .update({ active: true }, 'id');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users')
    .where('id', 10)
    .update({ active: true }, ['id', 'age']);

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

  // $ExpectType void
  await knex<User>('users').truncate();

  // $ExpectType void
  await knex('users').truncate();
};
