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

interface Article {
  id: number;
  subject: string;
  body?: string;
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

const main = async () => {
  // # Select:

  // $ExpectType any[]
  await knex('users');

  // $ExpectType User[]
  await knex<User>('users');

  // $ExpectType any[]
  await knex('users').select('id');

  // $ExpectType any[]
  await knex('users')
    .select('id')
    .select('age');

  // $ExpectType any
  await knex('users')
    .select('id')
    .select('age')
    .first();

  // $ExpectType any[]
  await knex('users').select('users.id');

  // $ExpectType Pick<User, "id">[]
  await knex<User>('users').select('id');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users')
    .select('id')
    .select('age');

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users').select('id', 'age');

  // $ExpectType { identifier: number; username: string; }[]
  await knex<User>('users')
    .select('id', 'name')
    .map((u) => ({ identifier: u.id, username: u.name }));

  // $ExpectType { identifier: number; username: string; }[]
  await knex
    .select('id', 'name')
    .from<User>('users')
    .map((u) => ({ identifier: u.id, username: u.name }));

  // $ExpectType { identifier: any; username: any; }[]
  await knex
    .select('id', 'name')
    .from('users')
    .map((u) => ({ identifier: u.id, username: u.name }));

  // $ExpectType Pick<User, "id" | "age">[]
  await knex<User>('users').select(['id', 'age']);

  // $ExpectType Pick<User, "id" | "age">
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

  // $ExpectType User
  await knex<User>('users')
    .where({ id: 10 })
    .first();

  // $ExpectType any[]
  await knex.where({ id: 10 }).from('users');

  // $ExpectType User[]
  await knex.where({ id: 10 }).from<User>('users');

  // $ExpectType User[]
  await knex
    .where({ id: 10 })
    .where('age', '>', 20)
    .from<User>('users');

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

  // $ExpectType User[]
  await knex<User>('users')
    .where((builder) =>
      builder.whereIn('id', [1, 11, 15]).whereNotIn('id', [17, 19])
    )
    .andWhere(function() {
      this.where('id', '>', 10);
    });

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

  // Using trx as a query builder:

  // $ExpectType any[]
  await knex.transaction(async (trx) => {
    const articles: Article[] = [
      { id: 1, subject: 'Canterbury Tales' },
      { id: 2, subject: 'Moby Dick' },
      { id: 3, subject: 'Hamlet' },
    ];
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
};
