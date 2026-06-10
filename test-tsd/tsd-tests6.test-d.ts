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
  const r1 = await knexInstance('users_composite').innerJoin(
    'departments_composite',
    'users_composite.departmentId',
    'departments_composite.id'
  );
  expectType<Array<{ username: string }>>(
    r1.map((joined) => ({
      username: joined.name,
    }))
  );

  const r2 = await knexInstance<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentId',
      'departments.id'
    )
    .select('*');
  expectType<Array<{ username: string }>>(
    r2.map((joined) => ({
      username: joined.name,
    }))
  );

  const r3 = await knexInstance('users_inferred')
    .innerJoin(
      'departments_inferred',
      'users_inferred.departmentId',
      'departments_inferred.id'
    )
    .select('*');
  expectType<Array<{ username: string }>>(
    r3.map((joined) => ({
      username: joined.name,
    }))
  );

  const r4 = await knexInstance('users_composite')
    .innerJoin<Department>(
      'departments_composite',
      'users_composite.departmentId',
      'departments_composite.id'
    )
    .select('*');
  expectType<Array<{ username: string }>>(
    r4.map((joined) => ({
      username: joined.name,
    }))
  );

  const r5 = await knexInstance<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentId',
      'departments.id'
    )
    .select();
  expectType<Array<{ username: string }>>(
    r5.map((joined) => ({
      username: joined.name,
    }))
  );

  const r6 = await knexInstance('users_inferred')
    .innerJoin(
      'departments_inferred',
      'users_inferred.departmentId',
      'departments_inferred.id'
    )
    .select();
  expectType<Array<{ username: string }>>(
    r6.map((joined) => ({
      username: joined.name,
    }))
  );

  const r7 = await knexInstance('users_composite')
    .innerJoin(
      'departments_composite',
      'users_composite.departmentId',
      'departments_composite.id'
    )
    .select();
  expectType<Array<{ username: string }>>(
    r7.map((joined) => ({
      username: joined.name,
    }))
  );

  const r8 = await knexInstance<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentId',
      'departments.id'
    )
    .select('name', 'age');
  expectType<Array<{ username: string }>>(
    r8.map((joined) => ({
      username: joined.name,
    }))
  );

  const r9 = await knexInstance('users_inferred')
    .innerJoin(
      'departments_inferred',
      'users_inferred.departmentId',
      'departments_inferred.id'
    )
    .select('name', 'age');
  expectType<Array<{ username: string }>>(
    r9.map((joined) => ({
      username: joined.name,
    }))
  );

  const r10 = await knexInstance('users_composite')
    .innerJoin(
      'departments_composite',
      'users_composite.departmentId',
      'departments_composite.id'
    )
    .select('name', 'age');
  expectType<Array<{ username: string }>>(
    r10.map((joined) => ({
      username: joined.name,
    }))
  );

  const r11 = await knexInstance<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentId',
      'departments.id'
    )
    .select('users.name', 'age');
  expectType<Array<{ username: any }>>(
    r11.map((joined) => ({
      username: joined.name,
    }))
  );

  const r12 = await knexInstance('users_inferred')
    .innerJoin(
      'departments_inferred',
      'users_inferred.departmentId',
      'departments_inferred.id'
    )
    .select('users_inferred.name', 'age');
  expectType<Array<{ username: any }>>(
    r12.map((joined) => ({
      username: joined.name,
    }))
  );

  const r13 = await knexInstance('users_composite')
    .innerJoin(
      'departments_composite',
      'users_composite.departmentId',
      'departments_composite.id'
    )
    .select('users_composite.name', 'age');
  expectType<Array<{ username: any }>>(
    r13.map((joined) => ({
      username: joined.name,
    }))
  );

  const j14 = await knexInstance
    .select<(User & Department)[]>('users')
    .innerJoin('departments', 'users.departmentId', 'departments.id');
  expectType<Array<User & Department>>(j14);

  const j15 = await knexInstance<User>('users').innerJoin<Department>(
    'departments',
    function () {
      this.on('users.id', '=', 'departments.id');
    }
  );
  expectType<Array<User & Department>>(j15);

  const j16 = await knexInstance('users_inferred').innerJoin(
    'departments_inferred',
    function () {
      this.on('users_inferred.id', '=', 'departments_inferred.id');
    }
  );
  expectType<Array<User & Department>>(j16);

  const j17 = await knexInstance('users_composite').innerJoin(
    'departments_composite',
    function () {
      this.on('users_composite.id', '=', 'departments_composite.id');
    }
  );
  expectType<Array<User & Department>>(j17);

  const j18 = await knexInstance<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentId',
      'departments.id'
    )
    .select('users.id', 'departments.id');
  expectType<any[]>(j18);

  const j19 = await knexInstance
    .select('*')
    .from<User>('users')
    .join<Department>('departments', function () {
      this.on(function () {
        this.on('departments.id', '=', 'users.department_id');
        this.orOn('departments.owner_id', '=', 'users.id');
      });
    });
  expectType<Array<User & Department>>(j19);

  const j20 = await knexInstance
    .select('*')
    .from('users_inferred')
    .join('departments_inferred', function () {
      this.on(function () {
        this.on('departments_inferred.id', '=', 'users_inferred.department_id');
        this.orOn('departments_inferred.owner_id', '=', 'users_inferred.id');
      });
    });
  expectType<Array<User & Department>>(j20);

  const j21 = await knexInstance
    .select('*')
    .from('users_composite')
    .join('departments_composite', function () {
      this.on(function () {
        this.on(
          'departments_composite.id',
          '=',
          'users_composite.department_id'
        );
        this.orOn('departments_composite.owner_id', '=', 'users_composite.id');
      });
    });
  expectType<Array<User & Department>>(j21);

  // # Insertion

  const i1 = await knexInstance('users').insert({ id: 10 });
  expectType<number[]>(i1);

  const i2 = await knexInstance<User>('users').insert({ id: 10 });
  expectType<number[]>(i2);

  const i3 = await knexInstance('users_inferred').insert({ id: 10 });
  expectType<number[]>(i3);

  // $ExpectError in original code -> checking that these lines would produce a type error
  // await knexInstance('users_composite').insert({ id: 10 });
  // await knexInstance('users_composite').insert({});

  const i4 = await knexInstance('users_composite').insert({ insert: 'insert' });
  expectType<number[]>(i4);

  const i5 = await knexInstance('users').insert([{ id: 10 }]);
  expectType<number[]>(i5);

  const i6 = await knexInstance<User>('users').insert([{ id: 10 }]);
  expectType<number[]>(i6);

  const i7 = await knexInstance('users_inferred').insert([{ id: 10 }]);
  expectType<number[]>(i7);

  // $ExpectError
  // await knexInstance('users_composite').insert([{ id: 10 }]);
  // await knexInstance('users_composite').insert([{}]);

  const i8 = await knexInstance('users_composite').insert([
    { insert: 'insert' },
  ]);
  expectType<number[]>(i8);

  const qb2 = knexInstance<User>('users');
  qb2.returning(['id', 'name']);

  const qb2ReturnCols = ['id', 'name'] as const;
  qb2.returning(qb2ReturnCols);

  const i9 = await qb2.insert<Partial<User>[]>({ id: 10 });
  expectType<Array<Partial<User>>>(i9);

  // ## With returning

  const rReturn1 = await knexInstance('users')
    .insert({ id: 10 })
    .returning('id');
  expectType<any[]>(rReturn1);

  const rReturn2 = await knexInstance('users')
    .insert({ id: 10 })
    .returning<number[]>('id');
  expectType<number[]>(rReturn2);

  const rReturn3 = await knexInstance<User>('users')
    .insert({ id: 10 })
    .returning<string[]>('id');
  expectType<string[]>(rReturn3);

  const rReturn4 = await knexInstance<User>('users')
    .insert({ id: 10 })
    .returning('id');
  expectType<Array<Pick<User, 'id'>>>(rReturn4);

  const rReturn5 = await knexInstance('users_inferred')
    .insert({ id: 10 })
    .returning('id');
  expectType<Array<Pick<User, 'id'>>>(rReturn5);

  const rReturn6 = await knexInstance('users_composite')
    .insert({ insert: 'insert' })
    .returning('id');
  expectType<Array<Pick<User, 'id'>>>(rReturn6);

  // $ExpectError
  // await knexInstance('users_composite').insert({ id: 10 }).returning('id');
  // await knexInstance('users_composite').insert({}).returning('id');

  const rReturn7 = await knexInstance('users')
    .insert([{ id: 10 }])
    .returning('id');
  expectType<any[]>(rReturn7);

  const rReturn8 = await knexInstance('users')
    .insert([{ id: 10 }])
    .returning<number[]>('id');
  expectType<number[]>(rReturn8);

  const rReturn9 = await knexInstance<User>('users')
    .insert([{ id: 10 }])
    .returning<string[]>('id');
  expectType<string[]>(rReturn9);

  const rReturn10 = await knexInstance<User>('users')
    .insert([{ id: 10 }])
    .returning('id');
  expectType<Array<Pick<User, 'id'>>>(rReturn10);

  const rReturn11 = await knexInstance('users_inferred')
    .insert([{ id: 10 }])
    .returning('id');
  expectType<Array<Pick<User, 'id'>>>(rReturn11);

  const rReturn12 = await knexInstance('users_composite')
    .insert([{ insert: 'insert' }])
    .returning('id');
  expectType<Array<Pick<User, 'id'>>>(rReturn12);

  // $ExpectError
  // await knexInstance('users_composite').insert([{ id: 10 }]).returning('id');
  // await knexInstance('users_composite').insert({}).returning('id');

  const rReturn13 = await knexInstance<User>('users')
    .insert({ id: 10 })
    .returning(['id', 'age']);
  expectType<Array<Pick<User, 'id' | 'age'>>>(rReturn13);
};

class ExcelClient extends knex.Client {}
