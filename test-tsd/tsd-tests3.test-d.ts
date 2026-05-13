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

const main = async () => {
  const r1 = await knexInstance
    .column('id', { yearsSinceBirth: 'age' })
    .select()
    .from<User>('users');

  // Checking that the returned type is { id: number; yearsSinceBirth: any }
  // FixMe
  // expectType<{ id: number; yearsSinceBirth: any }[]>(r1);
  // Further type checks
  type TR1_1 = ExtendsWitness<
    { id: number; yearsSinceBirth: any },
    (typeof r1)[0]
  >;
  type TR1_2 = ExtendsWitness<number, (typeof r1)[0]['id']>;
  type TR1_3 = ExtendsWitness<any, (typeof r1)[0]['yearsSinceBirth']>;

  expectType<Array<Pick<User, 'id'> & { yearsSinceBirth: any }>>(
    await knexInstance
      .column('id', { yearsSinceBirth: 'age' })
      .select()
      .from('users_inferred')
  );

  expectType<Array<Pick<User, 'id'> & { yearsSinceBirth: any }>>(
    await knexInstance
      .column('id', { yearsSinceBirth: 'age' })
      .select()
      .from('users_composite')
  );

  const r2 = await knexInstance
    .column('id', { yearsSinceBirth: 'age' as 'age' })
    .select()
    .from<User>('users');

  // Checking that the returned type is { id: number; yearsSinceBirth: number }
  // FixMe
  // expectType<{ id: number; yearsSinceBirth: number }[]>(r2);
  // Further type checks
  type TR2_1 = ExtendsWitness<
    { id: number; yearsSinceBirth: number },
    (typeof r2)[0]
  >;
  type TR2_2 = ExtendsWitness<number, (typeof r1)[0]['id']>;
  type TR2_3 = ExtendsWitness<number, (typeof r1)[0]['yearsSinceBirth']>;

  expectType<Array<Pick<User, 'id'> & { yearsSinceBirth: number }>>(
    await knexInstance
      .column('id', { yearsSinceBirth: 'age' as 'age' })
      .select()
      .from('users_inferred')
  );

  expectType<Array<Pick<User, 'id'> & { yearsSinceBirth: number }>>(
    await knexInstance
      .column('id', { yearsSinceBirth: 'age' as 'age' })
      .select()
      .from('users_composite')
  );

  // ## Conditional Selection:

  expectType<User[]>(await knexInstance<User>('users').where({ id: 10 }));
  expectType<User[]>(await knexInstance('users_inferred').where({ id: 10 }));
  expectType<User[]>(await knexInstance('users_composite').where({ id: 10 }));

  expectType<Array<Pick<User, 'name' | 'id'>>>(
    await knexInstance<User>('users').select('id', 'name').where({ id: 10 })
  );
  expectType<Array<Pick<User, 'name' | 'id'>>>(
    await knexInstance('users_inferred').select('id', 'name').where({ id: 10 })
  );
  expectType<Array<Pick<User, 'name' | 'id'>>>(
    await knexInstance('users_composite').select('id', 'name').where({ id: 10 })
  );

  expectType<Partial<User>[]>(
    await knexInstance
      .select<Partial<User>[]>(['users.*', 'departments.name as depName'])
      .from('users')
      .join('departments', 'departments.id', '=', 'users.department_id')
      .orderBy('name')
  );

  expectType<Partial<User> | undefined>(
    await knexInstance
      .select<Partial<User>[]>(['users.*', 'departments.name as depName'])
      .from('users')
      .join('departments', 'departments.id', '=', 'users.department_id')
      .orderBy('name')
      .first()
  );

  expectType<Partial<User>[]>(
    await knexInstance
      .select<Partial<User>[]>(['users.*', 'departments.name as depName'])
      .from('users')
      .join('departments', 'departments.id', '=', 'users.department_id')
      .orderByRaw('name DESC')
  );

  expectType<User | undefined>(
    await knexInstance<User>('users').where({ id: 10 }).first()
  );
  expectType<User | undefined>(
    await knexInstance('users_inferred').where({ id: 10 }).first()
  );
  expectType<User | undefined>(
    await knexInstance('users_composite').where({ id: 10 }).first()
  );

  // Not strongly typed: 'users' isn't typed here
  expectType<any[]>(await knexInstance.where({ id: 10 }).from('users'));

  expectType<any>(await knexInstance.where({ id: 10 }).from('users').first());

  expectType<User[]>(await knexInstance.where({ id: 10 }).from<User>('users'));
  expectType<User[]>(
    await knexInstance.where({ id: 10 }).from('users_inferred')
  );
  expectType<User[]>(
    await knexInstance.where({ id: 10 }).from('users_composite')
  );

  expectType<User | undefined>(
    await knexInstance
      .where({ id: 10 })
      .from<User>('users')
      .clearWhere()
      .where({ id: 11 })
      .orWhere({ id: 12 })
      .first()
  );
  expectType<User | undefined>(
    await knexInstance
      .where({ id: 10 })
      .from('users_inferred')
      .clearWhere()
      .where({ id: 11 })
      .orWhere({ id: 12 })
      .first()
  );
  expectType<User | undefined>(
    await knexInstance
      .where({ id: 10 })
      .from('users_composite')
      .clearWhere()
      .where({ id: 11 })
      .orWhere({ id: 12 })
      .first()
  );

  expectType<User[]>(
    await knexInstance
      .where({ id: 10 })
      .where('age', '>', 20)
      .from<User>('users')
  );
  expectType<User[]>(
    await knexInstance
      .where({ id: 10 })
      .where('age', '>', 20)
      .from('users_inferred')
  );
  expectType<User[]>(
    await knexInstance
      .where({ id: 10 })
      .where('age', '>', 20)
      .from('users_composite')
  );

  expectType<User[]>(
    await knexInstance<User>('users').whereNot('age', '>', 100)
  );
  expectType<User[]>(
    await knexInstance('users_inferred').whereNot('age', '>', 100)
  );
  expectType<User[]>(
    await knexInstance('users_composite').whereNot('age', '>', 100)
  );

  // ### Boolean operations

  expectType<User[]>(await knexInstance<User>('users').not.where('id', 10));
  expectType<User[]>(await knexInstance('users_inferred').not.where('id', 10));
  expectType<User[]>(await knexInstance('users_composite').not.where('id', 10));

  expectType<User[]>(
    await knexInstance<User>('user').where('name', 'L').and.where('age', 20)
  );
  expectType<User[]>(
    await knexInstance('users_inferred').where('name', 'L').and.where('age', 20)
  );
  expectType<User[]>(
    await knexInstance('users_composite')
      .where('name', 'L')
      .and.where('age', 20)
  );

  expectType<User[]>(
    await knexInstance<User>('user').where('name', 'L').or.where('age', 20)
  );
  expectType<User[]>(
    await knexInstance('users_inferred').where('name', 'L').or.where('age', 20)
  );
  expectType<User[]>(
    await knexInstance('users_composite').where('name', 'L').or.where('age', 20)
  );

  // ## Aggregation:

  const u4: User[] = await knexInstance('users')
    .groupBy('count')
    .orderBy('name', 'desc')
    .having('age', '>', 10);
  expectType<User[]>(u4);

  const u5: User[] = await knexInstance('users')
    .groupBy('count')
    .orderBy('name', 'desc')
    .having(knexInstance.raw('age > ?', 10));
  expectType<User[]>(u5);

  const u6: User[] = await knexInstance('users')
    .groupBy('count')
    .orderBy('name', 'desc')
    .having(knexInstance.raw('age'), '>', 10);
  expectType<User[]>(u6);

  expectType<User[]>(
    await knexInstance<User>('users')
      .groupBy('count')
      .orderBy('name', 'desc')
      .having('age', '>', 10)
  );
  expectType<User[]>(
    await knexInstance('users_inferred')
      .groupBy('count')
      .orderBy('name', 'desc')
      .having('age', '>', 10)
  );
  expectType<User[]>(
    await knexInstance('users_composite')
      .groupBy('count')
      .orderBy('name', 'desc')
      .having('age', '>', 10)
  );

  expectType<User[]>(
    await knexInstance<User>('users')
      .groupByRaw('count')
      .orderBy('name', 'desc')
      .having('age', '>', 10)
  );
  expectType<User[]>(
    await knexInstance('users_inferred')
      .groupByRaw('count')
      .orderBy('name', 'desc')
      .having('age', '>', 10)
  );
  expectType<User[]>(
    await knexInstance('users_composite')
      .groupByRaw('count')
      .orderBy('name', 'desc')
      .having('age', '>', 10)
  );

  expectType<User[]>(
    await knexInstance<User>('users')
      .groupByRaw('count')
      .orderBy('name', 'desc')
      .havingRaw('age > ?', [10])
  );
  expectType<User[]>(
    await knexInstance('users_inferred')
      .groupByRaw('count')
      .orderBy('name', 'desc')
      .havingRaw('age > ?', [10])
  );
  expectType<User[]>(
    await knexInstance('users_composite')
      .groupByRaw('count')
      .orderBy('name', 'desc')
      .havingRaw('age > ?', [10])
  );

  expectType<User[]>(
    await knexInstance<User>('users')
      .select()
      .orderBy(
        knexInstance<User>('users')
          .select('u.id')
          .from('users as u')
          .where('users.id', 'u.id')
      )
  );
  expectType<User[]>(
    await knexInstance('users_inferred')
      .select()
      .orderBy(
        knexInstance('users_inferred')
          .select('u.id')
          .from('users as u')
          .where('users.id', 'u.id')
      )
  );
  expectType<User[]>(
    await knexInstance('users_composite')
      .select()
      .orderBy(
        knexInstance('users_composite')
          .select('u.id')
          .from('users as u')
          .where('users.id', 'u.id')
      )
  );

  expectType<User[]>(
    await knexInstance<User>('users')
      .select()
      .orderBy([
        {
          column: knexInstance<User>('users')
            .select('u.id')
            .from('users as u')
            .where('users.id', 'u.id'),
          order: 'desc',
        },
      ])
  );
  expectType<User[]>(
    await knexInstance('users_inferred')
      .select()
      .orderBy([
        {
          column: knexInstance('users_inferred')
            .select('u.id')
            .from('users as u')
            .where('users.id', 'u.id'),
          order: 'desc',
        },
      ])
  );
  expectType<User[]>(
    await knexInstance('users_composite')
      .select()
      .orderBy([
        {
          column: knexInstance('users_composite')
            .select('u.id')
            .from('users as u')
            .where('users.id', 'u.id'),
          order: 'desc',
        },
      ])
  );

  expectType<User[]>(
    await knexInstance<User>('users')
      .select()
      .orderBy([
        {
          column: 'id',
          order: 'desc',
        },
        {
          column: 'name',
          order: 'desc',
        },
      ])
  );
  expectType<User[]>(
    await knexInstance('users_inferred')
      .select()
      .orderBy([
        {
          column: 'id',
          order: 'desc',
        },
        {
          column: 'name',
          order: 'desc',
        },
      ])
  );
  expectType<User[]>(
    await knexInstance('users_composite')
      .select()
      .orderBy([
        {
          column: 'id',
          order: 'desc',
        },
        {
          column: 'name',
          order: 'desc',
        },
      ])
  );

  expectType<User[]>(
    await knexInstance<User>('users')
      .select()
      .orderBy([
        {
          column: 'id',
          order: 'desc',
        },
        'name',
      ])
  );
  expectType<User[]>(
    await knexInstance('users_inferred')
      .select()
      .orderBy([
        {
          column: 'id',
          order: 'desc',
        },
        'name',
      ])
  );
  expectType<User[]>(
    await knexInstance('users_composite')
      .select()
      .orderBy([
        {
          column: 'id',
          order: 'desc',
        },
        'name',
      ])
  );
};

class ExcelClient extends knex.Client {}
