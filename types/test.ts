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

const main = async () => {
  // $ExpectType any[]
  await knex('users');

  // $ExpectType User[]
  await knex<User>('users');

  // $ExpectType any[]
  await knex('users').select('id');

  // $ExpectType any[]
  await knex('users').select('users.id');

  // $ExpectType Pick<User, "id">[]
  await knex<User>('users').select('id');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users').select('id', 'age');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users').select(['id', 'age']);

  // $ExpectType Pick<Partial<User>, "id" | "age" | "name" | "active" | "departmentId">[]
  await knex<User>('users').select('users.id');

  // $ExpectType any[]
  await knex.select('id').from('users');

  // $ExpectType Pick<User, "id">[]
  await knex.select('id').from<User>('users');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex.select('id', 'age').from<User>('users');

  // $ExpectType Pick<User, "id">[]
  await knex.from<User>('users').select('id');

  // $ExpectType Pick<Partial<User>, "id" | "age" | "name" | "active" | "departmentId">[]
  await knex.from<User>('users').select('users.id');

  // $ExpectType User[]
  await knex<User>('users').where({ id: 10 });

  const r = await knex.where({ id: 10 }).from('users');

  // $ExpectType Partial<User>[]
  await knex<User>('users')
    .groupBy('count')
    .orderBy('name', 'desc')
    .having('age', '>', 10);

  // $ExpectType User[]
  await knex<User>('users').whereNot('age', '>', 100);

  // $ExpectType { [key: string]: string | number; }[]
  await knex<User>('users').count();

  // $ExpectType (User & Department)[]
  await knex<User>('users').innerJoin<Department>(
    'departments',
    'users.departmentid',
    'departments.id',
  );

  // $ExpectType (User & Department)[]
  await knex<User>('users').innerJoin<Department>(
    'departments',
    'users.departmentid',
    '=',
    'departments.id',
  );

  // $ExpectType (User & Department)[]
  await knex<User>('users').innerJoin<Department>('departments', function() {
    this.on('users.id', '=', 'departments.id');
  });

  // $ExpectType Pick<Partial<User & Department>, "id" | "age" | "name" | "active" | "departmentId" | "departmentName">[]
  await knex<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentid',
      'departments.id',
    )
    .select('users.id', 'departments.id');

  // $ExpectType number
  await knex<User>('users').insert({ id: 10 });

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

  // $ExpectType number
  await knex<User>('users')
    .where('id', 10)
    .update({ active: true });

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

  // $ExpectType ValueMap[]
  await knex<User>('users').max('age');

  // $ExpectType ValueMap[]
  await knex('users').max('age');

  // $ExpectType ValueMap[]
  await knex<User>('users').min('age');

  // $ExpectType { [key: string]: string | number; }[]
  await knex<User>('users').count('age');

  // $ExpectType { [key: string]: string | number; }[]
  await knex('users').count('age');

  // $ExpectType any[]
  await knex('users').select(knex('foo').select('bar').as('colName'));

  // $ExpectType any[]
  await knex('users').whereNot(function() {
    this.where('id', 1).orWhereNot('id', '>', 10);
  });
};
