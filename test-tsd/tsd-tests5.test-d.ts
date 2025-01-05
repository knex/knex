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
  // $ExpectType User[]
  const r1 = await knexInstance('users_composite').whereNot(function () {
    this.where('id', 1).orWhereNot('id', '>', 10);
  });
  expectType<User[]>(r1);

  // $ExpectType User[]
  const r2 = await knexInstance<User>('users')
    .where((builder) =>
      builder.whereIn('id', [1, 11, 15]).whereNotIn('id', [17, 19])
    )
    .andWhere(function () {
      this.where('id', '>', 10);
    });
  expectType<User[]>(r2);

  // $ExpectType User[]
  const r3 = await knexInstance('users_inferred')
    .where((builder) =>
      builder.whereIn('id', [1, 11, 15]).whereNotIn('id', [17, 19])
    )
    .andWhere(function () {
      this.where('id', '>', 10);
    });
  expectType<User[]>(r3);

  // $ExpectType User[]
  const r4 = await knexInstance('users_composite')
    .where((builder) =>
      builder.whereIn('id', [1, 11, 15]).whereNotIn('id', [17, 19])
    )
    .andWhere(function () {
      this.where('id', '>', 10);
    });
  expectType<User[]>(r4);

  // $ExpectType User | undefined
  const r5 = await knexInstance<User>('users')
    .where((builder) =>
      builder.whereIn('id', [1, 11, 15]).whereNotIn('id', [17, 19])
    )
    .andWhere(function () {
      this.where('id', '>', 10);
    })
    .first();
  expectType<User | undefined>(r5);

  // $ExpectType User | undefined
  const r6 = await knexInstance('users_inferred')
    .where((builder) =>
      builder.whereIn('id', [1, 11, 15]).whereNotIn('id', [17, 19])
    )
    .andWhere(function () {
      this.where('id', '>', 10);
    })
    .first();
  expectType<User | undefined>(r6);

  // $ExpectType User | undefined
  const r7 = await knexInstance('users_composite')
    .where((builder) =>
      builder.whereIn('id', [1, 11, 15]).whereNotIn('id', [17, 19])
    )
    .andWhere(function () {
      this.where('id', '>', 10);
    })
    .first();
  expectType<User | undefined>(r7);

  const values = [
    [1, 'a'],
    [2, 'b'],
  ] as const;
  const cols = ['id', 'name'] as const;

  // $ExpectType User[]
  const r8 = await knexInstance<User>('users').whereIn<'id' | 'name'>(
    cols,
    values
  );
  expectType<User[]>(r8);

  // $ExpectType User[]
  const r9 = await knexInstance('users_inferred').whereIn<'id' | 'name'>(
    cols,
    values
  );
  expectType<User[]>(r9);

  // $ExpectType User[]
  const r10 = await knexInstance('users_composite').whereIn<'id' | 'name'>(
    cols,
    values
  );
  expectType<User[]>(r10);

  // $ExpectType User[]
  const r11 = await knexInstance<User>('user').whereIn('id', [1, 2]);
  expectType<User[]>(r11);

  const col = 'id';
  const idList = [1, 2] as const;

  // $ExpectType User[]
  const r12 = await knexInstance<User>('user').whereIn(col, idList);
  expectType<User[]>(r12);

  // $ExpectType User[]
  const r13 = await knexInstance('users_inferred').whereIn(col, idList);
  expectType<User[]>(r13);

  // $ExpectType User[]
  const r14 = await knexInstance('users_composite').whereIn(col, idList);
  expectType<User[]>(r14);

  // $ExpectType User[]
  const r15 = await knexInstance<User>('users').whereNotExists(function () {
    this.select('*')
      .from('accounts')
      .whereRaw('users.account_id = accounts.id');
  });
  expectType<User[]>(r15);

  // $ExpectType User[]
  const r16 = await knexInstance('users_inferred').whereNotExists(function () {
    this.select('*')
      .from('accounts')
      .whereRaw('users.account_id = accounts.id');
  });
  expectType<User[]>(r16);

  // $ExpectType User[]
  const r17 = await knexInstance('users_composite').whereNotExists(function () {
    this.select('*')
      .from('accounts')
      .whereRaw('users.account_id = accounts.id');
  });
  expectType<User[]>(r17);

  // ## Union Queries:

  // $ExpectType any[]
  const r18 = await knexInstance
    .select('*')
    .from('users')
    .whereNull('last_name')
    .union(function () {
      this.select('*').from('users').whereNull('first_name');
    });
  expectType<any[]>(r18);

  // $ExpectType User[]
  const r19 = await knexInstance<User>('users')
    .select('*')
    .whereNull('name')
    .union(function () {
      this.select('*').from<User>('users').whereNull('first_name');
    });
  expectType<User[]>(r19);

  // $ExpectType User[]
  const r20 = await knexInstance('users_inferred')
    .select('*')
    .whereNull('name')
    .union(function () {
      this.select('*').from('users_inferred').whereNull('first_name');
    });
  expectType<User[]>(r20);

  // $ExpectType User[]
  const r21 = await knexInstance('users_composite')
    .select('*')
    .whereNull('name')
    .union(function () {
      this.select('*').from('users_composite').whereNull('first_name');
    });
  expectType<User[]>(r21);

  // ## Joins:

  // $ExpectType any[]
  const j1 = await knexInstance('users').innerJoin(
    'departments',
    'users.departmentId',
    'departments.id'
  );
  expectType<any[]>(j1);

  // $ExpectType any[]
  const j2 = await knexInstance<User>('users').innerJoin(
    'departments',
    'users.departmentId',
    'departments.id'
  );
  expectType<any[]>(j2);

  // $ExpectType any[]
  const j3 = await knexInstance('users').innerJoin<Department>(
    'departments',
    'users.departmentId',
    'departments.id'
  );
  expectType<any[]>(j3);

  // $ExpectType (User & Department)[]
  const j4 = await knexInstance<User>('users').innerJoin<Department>(
    'departments',
    'users.departmentId',
    'departments.id'
  );
  expectType<Array<User & Department>>(j4);

  // $ExpectType (User & Department)[]
  const j5 = await knexInstance('users_inferred').innerJoin(
    'departments_inferred',
    'users_inferred.departmentId',
    'departments_inferred.id'
  );
  expectType<Array<User & Department>>(j5);

  // $ExpectType (User & Department)[]
  const j6 = await knexInstance('users_composite').innerJoin(
    'departments_composite',
    'users_composite.departmentId',
    'departments_composite.id'
  );
  expectType<Array<User & Department>>(j6);

  // $ExpectType (User & Department & Article)[]
  const j7 = await knexInstance<User>('users')
    .innerJoin<Department>(
      'departments',
      'users.departmentId',
      'departments.id'
    )
    .innerJoin<Article>('articles', 'articles.authorId', 'users.id');
  expectType<Array<User & Department & Article>>(j7);

  // $ExpectType (User & Department & Article)[]
  const j8 = await knexInstance('users_inferred')
    .innerJoin(
      'departments_inferred',
      'users_inferred.departmentId',
      'departments_inferred.id'
    )
    .innerJoin(
      'articles_inferred',
      'articles_inferred.authorId',
      'users_inferred.id'
    );
  expectType<Array<User & Department & Article>>(j8);

  // $ExpectType (User & Department & Article)[]
  const j9 = await knexInstance('users_composite')
    .innerJoin(
      'departments_composite',
      'users_composite.departmentId',
      'departments_composite.id'
    )
    .innerJoin(
      'articles_composite',
      'articles_composite.authorId',
      'users_composite.id'
    );
  expectType<Array<User & Department & Article>>(j9);

  // $ExpectType any[]
  const j10 = await knexInstance<User>('users')
    .innerJoin('departments', 'users.departmentId', 'departments.id')
    .innerJoin<Article>('articles', 'articles.authorId', 'users.id');
  expectType<any[]>(j10);

  // $ExpectType any[]
  const j11 = await knexInstance('users_inferred')
    .innerJoin('departments', 'users_inferred.departmentId', 'departments.id')
    .innerJoin('articles_inferred', 'articles_inferred.authorId', 'users.id');
  expectType<any[]>(j11);

  // $ExpectType (User & Department)[]
  const j12 = await knexInstance<User>('users').innerJoin<Department>(
    'departments',
    'users.departmentId',
    '=',
    'departments.id'
  );
  expectType<Array<User & Department>>(j12);

  // $ExpectType (User & Department)[]
  const j13 = await knexInstance('users_inferred').innerJoin(
    'departments_inferred',
    'users_inferred.departmentId',
    '=',
    'departments_inferred.id'
  );
  expectType<Array<User & Department>>(j13);

  // $ExpectType (User & Department)[]
  const j14 = await knexInstance('users_composite').innerJoin(
    'departments_composite',
    'users_composite.departmentId',
    '=',
    'departments_composite.id'
  );
  expectType<Array<User & Department>>(j14);

  // $ExpectType { username: any; }[]
  const map1 = (
    await knexInstance<User>('users').innerJoin(
      'departments',
      'users.departmentId',
      'departments.id'
    )
  ).map(function (joined) {
    return {
      username: joined.name,
    };
  });
  expectType<Array<{ username: any }>>(map1);

  // $ExpectType { username: string; }[]
  const map2 = (
    await knexInstance<User>('users').innerJoin<Department>(
      'departments',
      'users.departmentId',
      'departments.id'
    )
  ).map(function (joined) {
    return {
      username: joined.name,
    };
  });
  expectType<Array<{ username: string }>>(map2);

  // $ExpectType { username: string; }[]
  const map3 = (
    await knexInstance('users_inferred').innerJoin(
      'departments_inferred',
      'users_inferred.departmentId',
      'departments_inferred.id'
    )
  ).map(function (joined) {
    return {
      username: joined.name,
    };
  });
  expectType<Array<{ username: string }>>(map3);

  // $ExpectType { username: string; }[]
  const map4 = (
    await knexInstance('users_composite').innerJoin(
      'departments_composite',
      'users_composite.departmentId',
      'departments_composite.id'
    )
  ).map(function (joined) {
    return {
      username: joined.name,
    };
  });
  expectType<Array<{ username: string }>>(map4);

  // $ExpectType { username: string; }[]
  const map5 = (
    await knexInstance<User>('users')
      .innerJoin<Department>(
        'departments',
        'users.departmentId',
        'departments.id'
      )
      .select('*')
  ).map(function (joined) {
    return {
      username: joined.name,
    };
  });
  expectType<Array<{ username: string }>>(map5);

  // $ExpectType { username: string; }[]
  const map6 = (
    await knexInstance('users_inferred')
      .innerJoin(
        'departments_inferred',
        'users_inferred.departmentId',
        'departments_inferred.id'
      )
      .select('*')
  ).map(function (joined) {
    return {
      username: joined.name,
    };
  });
  expectType<Array<{ username: string }>>(map6);

  // $ExpectType { username: string; }[]
  const map7 = (
    await knexInstance('users_composite')
      .innerJoin<Department>(
        'departments_composite',
        'users_composite.departmentId',
        'departments_composite.id'
      )
      .select('*')
  ).map(function (joined) {
    return {
      username: joined.name,
    };
  });
  expectType<Array<{ username: string }>>(map7);

  // $ExpectType { username: string; }[]
  const map8 = (
    await knexInstance<User>('users')
      .innerJoin<Department>(
        'departments',
        'users.departmentId',
        'departments.id'
      )
      .select()
  ).map(function (joined) {
    return {
      username: joined.name,
    };
  });
  expectType<Array<{ username: string }>>(map8);

  // $ExpectType { username: string; }[]
  const map9 = (
    await knexInstance('users_inferred')
      .innerJoin(
        'departments_inferred',
        'users_inferred.departmentId',
        'departments_inferred.id'
      )
      .select()
  ).map(function (joined) {
    return {
      username: joined.name,
    };
  });
  expectType<Array<{ username: string }>>(map9);
};

class ExcelClient extends knex.Client {}
