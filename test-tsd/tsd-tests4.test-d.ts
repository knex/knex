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

/**
 * Dict is used in these tests to denote an object with string keys and values of various types.
 * If you need a formal definition, you can do something like:
 *
 * type Dict<T> = Record<string, T>;
 *
 * But for the purpose of these tests, we keep it as is.
 */

const main = async () => {
  // $ExpectType Dict<string | number>[]
  const c1 = await knexInstance<User>('users').count();
  expectType<Array<Record<string, string | number>>>(c1);

  // $ExpectType Dict<string | number>[]
  const c2 = await knexInstance('users_inferred').count();
  expectType<Array<Record<string, string | number>>>(c2);

  // $ExpectType Dict<string | number>[]
  const c3 = await knexInstance('users_composite').count();
  expectType<Array<Record<string, string | number>>>(c3);

  // $ExpectType Dict<string | number>[]
  const c4 = await knexInstance<User>('users').count('age');
  expectType<Array<Record<string, string | number>>>(c4);

  // $ExpectType Dict<string | number>[]
  const c5 = await knexInstance('users_inferred').count('age');
  expectType<Array<Record<string, string | number>>>(c5);

  // $ExpectType Dict<string | number>[]
  const c6 = await knexInstance('users_composite').count('age');
  expectType<Array<Record<string, string | number>>>(c6);

  // $ExpectType Dict<string | number>[]
  const c7 = await knexInstance('users').count('age');
  expectType<Array<Record<string, string | number>>>(c7);

  // $ExpectType { c: string | number; }[]
  const c8 = await knexInstance<User>('users').count('id', { as: 'c' });
  expectType<Array<{ c: string | number }>>(c8);

  // $ExpectType (Pick<User, "departmentId"> & { c: string | number; })[]
  const c9 = await knexInstance<User>('users')
    .select('departmentId')
    .count('id', { as: 'c' });
  expectType<Array<Pick<User, 'departmentId'> & { c: string | number }>>(c9);

  // $ExpectType { count: number; }
  const c10 = await knexInstance('foo')
    .first()
    .count<{ count: number }>({ count: '*' });
  expectType<{ count: number }>(c10);

  // $ExpectType { count: number; }
  const c11 = await knexInstance('foo')
    .first()
    .countDistinct<{ count: number }>({ count: '*' });
  expectType<{ count: number }>(c11);

  // $ExpectType { count?: string | number | undefined; }
  const c12 = await knexInstance('foo').first().count({ count: '*' });
  expectType<{ count?: string | number }>(c12);

  // $ExpectType { count?: string | number | undefined; }
  const c13 = await knexInstance('foo').first().countDistinct({ count: '*' });
  expectType<{ count?: string | number }>(c13);

  // $ExpectType Dict<string | number>
  const c14 = await knexInstance<User>('users').first().count('age');
  expectType<Record<string, string | number>>(c14);

  // $ExpectType Dict<string | number>
  const c15 = await knexInstance('users_inferred').first().count('age');
  expectType<Record<string, string | number>>(c15);

  // $ExpectType Dict<string | number>
  const c16 = await knexInstance('users_composite').first().count('age');
  expectType<Record<string, string | number>>(c16);

  // $ExpectType Dict<string | number>
  const c17 = await knexInstance('users').first().count('age', 'id');
  expectType<Record<string, string | number>>(c17);

  // $ExpectType Dict<string | number>
  const c18 = await knexInstance<User>('users').first().count();
  expectType<Record<string, string | number>>(c18);

  // $ExpectType Dict<string | number>
  const c19 = await knexInstance('users_inferred').first().count();
  expectType<Record<string, string | number>>(c19);

  // $ExpectType Dict<string | number>
  const c20 = await knexInstance('users_composite').first().count();
  expectType<Record<string, string | number>>(c20);

  // $ExpectType Dict<string | number>[]
  const c21 = await knexInstance.count().from<User>('users');
  expectType<Array<Record<string, string | number>>>(c21);

  // $ExpectType Dict<string | number>[]
  const c22 = await knexInstance.count().from('users_inferred');
  expectType<Array<Record<string, string | number>>>(c22);

  // $ExpectType Dict<string | number>[]
  const c23 = await knexInstance.count().from('users_composite');
  expectType<Array<Record<string, string | number>>>(c23);

  // $ExpectType Dict<string | number>[]
  const c24 = await knexInstance.count('age').from<User>('users');
  expectType<Array<Record<string, string | number>>>(c24);

  // $ExpectType Dict<string | number>[]
  const c25 = await knexInstance.count('age').from('users_inferred');
  expectType<Array<Record<string, string | number>>>(c25);

  // $ExpectType Dict<string | number>[]
  const c26 = await knexInstance.count('age').from('users_composite');
  expectType<Array<Record<string, string | number>>>(c26);

  // $ExpectType Dict<string | number>[]
  const c27 = await knexInstance.count('age').from('users');
  expectType<Array<Record<string, string | number>>>(c27);

  // $ExpectType { count: number; }
  const c28 = await knexInstance
    .first()
    .count<{ count: number }>({ count: '*' })
    .from('foo');
  expectType<{ count: number }>(c28);

  // $ExpectType { count: number; }
  const c29 = await knexInstance
    .first()
    .countDistinct<{ count: number }>({ count: '*' })
    .from('foo');
  expectType<{ count: number }>(c29);

  // $ExpectType { count?: string | number | undefined; }
  const c30 = await knexInstance.first().count({ count: '*' }).from('foo');
  expectType<{ count?: string | number }>(c30);

  // $ExpectType { count?: string | number | undefined; }
  const c31 = await knexInstance
    .first()
    .countDistinct({ count: '*' })
    .from('foo');
  expectType<{ count?: string | number }>(c31);

  // $ExpectType Dict<string | number>
  const c32 = await knexInstance.first().count('age').from<User>('users');
  expectType<Record<string, string | number>>(c32);

  // $ExpectType Dict<string | number>
  const c33 = await knexInstance.first().count('age').from('users_inferred');
  expectType<Record<string, string | number>>(c33);

  // $ExpectType Dict<string | number>
  const c34 = await knexInstance.first().count('age').from('users_composite');
  expectType<Record<string, string | number>>(c34);

  // $ExpectType Dict<string | number>
  const c35 = await knexInstance.first().count('age', 'id').from('users');
  expectType<Record<string, string | number>>(c35);

  // $ExpectType Dict<string | number>
  const c36 = await knexInstance.first().count().from<User>('users');
  expectType<Record<string, string | number>>(c36);

  // $ExpectType Dict<string | number>
  const c37 = await knexInstance.first().count().from('users_inferred');
  expectType<Record<string, string | number>>(c37);

  // $ExpectType Dict<string | number>
  const c38 = await knexInstance.first().count().from('users_composite');
  expectType<Record<string, string | number>>(c38);

  // $ExpectType Dict<number>[]
  const m1 = await knexInstance<User>('users').max('age');
  expectType<Array<Record<string, number>>>(m1);

  // $ExpectType Dict<number>[]
  const m2 = await knexInstance('users_inferred').max('age');
  expectType<Array<Record<string, number>>>(m2);

  // $ExpectType Dict<number>[]
  const m3 = await knexInstance('users_composite').max('age');
  expectType<Array<Record<string, number>>>(m3);

  // $ExpectType Dict<number>
  const m4 = await knexInstance<User>('users').first().max('age');
  expectType<Record<string, number>>(m4);

  // $ExpectType Dict<number>
  const m5 = await knexInstance('users_inferred').first().max('age');
  expectType<Record<string, number>>(m5);

  // $ExpectType Dict<number>
  const m6 = await knexInstance('users_composite').first().max('age');
  expectType<Record<string, number>>(m6);

  // $ExpectType Dict<any>[]
  const m7 = await knexInstance('users').max('age');
  expectType<Array<Record<string, any>>>(m7);

  // $ExpectType Dict<number>[]
  const mn1 = await knexInstance<User>('users').min('age');
  expectType<Array<Record<string, number>>>(mn1);

  // $ExpectType Dict<number>[]
  const mn2 = await knexInstance('users_inferred').min('age');
  expectType<Array<Record<string, number>>>(mn2);

  // $ExpectType Dict<number>[]
  const mn3 = await knexInstance('users_composite').min('age');
  expectType<Array<Record<string, number>>>(mn3);

  // $ExpectType Dict<number>
  const mn4 = await knexInstance<User>('users').first().min('age');
  expectType<Record<string, number>>(mn4);

  // $ExpectType Dict<number>
  const mn5 = await knexInstance('users_inferred').first().min('age');
  expectType<Record<string, number>>(mn5);

  // $ExpectType Dict<number>
  const mn6 = await knexInstance('users_composite').first().min('age');
  expectType<Record<string, number>>(mn6);

  // $ExpectType Dict<any>[]
  const m8 = await knexInstance.max('age').from<User>('users');
  expectType<Array<Record<string, any>>>(m8);

  // $ExpectType Dict<any>[]
  const m9 = await knexInstance.max('age').from('users_inferred');
  expectType<Array<Record<string, any>>>(m9);

  // $ExpectType Dict<any>[]
  const m10 = await knexInstance.max('age').from('users_composite');
  expectType<Array<Record<string, any>>>(m10);

  // $ExpectType Dict<any>
  const m11 = await knexInstance.first().max('age').from<User>('users');
  expectType<Record<string, any>>(m11);

  // $ExpectType Dict<any>
  const m12 = await knexInstance.first().max('age').from('users_inferred');
  expectType<Record<string, any>>(m12);

  // $ExpectType Dict<any>
  const m13 = await knexInstance.first().max('age').from('users_composite');
  expectType<Record<string, any>>(m13);

  // $ExpectType Dict<any>[]
  const m14 = await knexInstance.max('age').from('users');
  expectType<Array<Record<string, any>>>(m14);

  // $ExpectType Dict<any>[]
  const mn7 = await knexInstance.min('age').from<User>('users');
  expectType<Array<Record<string, any>>>(mn7);

  // $ExpectType Dict<any>[]
  const mn8 = await knexInstance.min('age').from('users_inferred');
  expectType<Array<Record<string, any>>>(mn8);

  // $ExpectType Dict<any>[]
  const mn9 = await knexInstance.min('age').from('users_composite');
  expectType<Array<Record<string, any>>>(mn9);

  // $ExpectType Dict<any>
  const mn10 = await knexInstance.first().min('age').from<User>('users');
  expectType<Record<string, any>>(mn10);

  // $ExpectType ({ a: Date; } & { b: Date; })[]
  const t1 = await knexInstance<Ticket>('tickets')
    .min('at', { as: 'a' })
    .max('at', { as: 'b' });
  // FixMe
  // expectType<Array<{ a: Date; b: Date }>>(t1);

  // $ExpectType ({ dep: any; } & { a: any; } & { b: any; })[]
  const ab1 = await knexInstance
    .select({ dep: 'departmentId' })
    .min('age', { as: 'a' })
    .max('age', { as: 'b' })
    .from<User>('users');
  expectType<Array<{ dep: any } & { a: any } & { b: any }>>(ab1);

  // $ExpectType ({ dep: any; } & { a?: any; } & { b?: any; })[]
  const ab2 = await knexInstance
    .select({ dep: 'departmentId' })
    .min({ a: 'age' })
    .max({ b: 'age' })
    .from<User>('users');
  expectType<Array<{ dep: any } & { a?: any } & { b?: any }>>(ab2);

  // $ExpectType ({ dep: any; } & { a?: any; } & { b?: any; })[]
  const ab3 = await knexInstance
    .select({ dep: 'departmentId' })
    .min({ a: 'age' })
    .max({ b: 'age' })
    .from('users_inferred');
  expectType<Array<{ dep: any } & { a?: any } & { b?: any }>>(ab3);

  // $ExpectType ({ dep: any; } & { a?: any; } & { b?: any; })[]
  const ab4 = await knexInstance
    .select({ dep: 'departmentId' })
    .min({ a: 'age' })
    .max({ b: 'age' })
    .from('users_composite');
  expectType<Array<{ dep: any } & { a?: any } & { b?: any }>>(ab4);

  // $ExpectType ({ dep: number; } & { a?: any; } & { b?: any; })[]
  const ab5 = await knexInstance<User>('users')
    .select({ dep: 'departmentId' })
    .min({ a: 'age' })
    .max({ b: 'age' });
  expectType<Array<{ dep: number } & { a?: any } & { b?: any }>>(ab5);

  // $ExpectType ({ dep: number; } & { a?: any; } & { b?: any; })[]
  const ab6 = await knexInstance('users_inferred')
    .select({ dep: 'departmentId' })
    .min({ a: 'age' })
    .max({ b: 'age' });
  expectType<Array<{ dep: number } & { a?: any } & { b?: any }>>(ab6);

  // $ExpectType ({ dep: number; } & { a?: any; } & { b?: any; })[]
  const ab7 = await knexInstance('users_composite')
    .select({ dep: 'departmentId' })
    .min({ a: 'age' })
    .max({ b: 'age' });
  expectType<Array<{ dep: number } & { a?: any } & { b?: any }>>(ab7);

  // $ExpectType ({ dep: number; } & { a?: string | number | undefined; })[]
  const ab8 = await knexInstance<User>('users')
    .select({ dep: 'departmentId' })
    .count({ a: 'age' });
  expectType<Array<{ dep: number } & { a?: string | number }>>(ab8);

  // $ExpectType ({ dep: number; } & { a?: string | number | undefined; })[]
  const ab9 = await knexInstance('users_inferred')
    .select({ dep: 'departmentId' })
    .count({ a: 'age' });
  expectType<Array<{ dep: number } & { a?: string | number }>>(ab9);

  // $ExpectType ({ dep: number; } & { a?: string | number | undefined; })[]
  const ab10 = await knexInstance('users_composite')
    .select({ dep: 'departmentId' })
    .count({ a: 'age' });
  expectType<Array<{ dep: number } & { a?: string | number }>>(ab10);

  // $ExpectType ({ dep: any; } & { a?: string | number | undefined; })[]
  const ab11 = await knexInstance
    .select({ dep: 'departmentId' })
    .count({ a: 'age' })
    .from<User>('users');
  expectType<Array<{ dep: any } & { a?: string | number }>>(ab11);

  // $ExpectType ({ dep: any; } & { a?: string | number | undefined; })[]
  const ab12 = await knexInstance
    .select({ dep: 'departmentId' })
    .count({ a: 'age' })
    .from('users_inferred');
  expectType<Array<{ dep: any } & { a?: string | number }>>(ab12);

  // $ExpectType ({ dep: any; } & { a?: string | number | undefined; })[]
  const ab13 = await knexInstance
    .select({ dep: 'departmentId' })
    .count({ a: 'age' })
    .from('users_composite');
  expectType<Array<{ dep: any } & { a?: string | number }>>(ab13);

  // Analytic
  // $ExpectType (Pick<User, "age"> & { rowNum: number; })[]
  const rNum1 = await knexInstance<User>('users')
    .select('age')
    .rowNumber('rowNum', 'age');
  expectType<Array<Pick<User, 'age'> & { rowNum: number }>>(rNum1);

  // $ExpectError (we won't actually run expectError here, it's just a comment from the original code)
  // .rowNumber('rowNum', 'non_existing_field');

  // $ExpectType (Pick<User, "age"> & { rowNum: number; })[]
  const rNum2 = await knexInstance<User>('users')
    .select('age')
    .rowNumber('rowNum', ['age']);
  expectType<Array<Pick<User, 'age'> & { rowNum: number }>>(rNum2);

  // $ExpectType (Pick<User, "age"> & { rowNum: number; })[]
  const rNum3 = await knexInstance<User>('users')
    .select('age')
    .rowNumber('rowNum', (builder) => {
      builder.orderBy('age');
    });
  expectType<Array<Pick<User, 'age'> & { rowNum: number }>>(rNum3);

  // $ExpectType (Pick<User, "age"> & { rowNum: number; })[]
  const rNum4 = await knexInstance<User>('users')
    .select('age')
    .rowNumber('rowNum', 'age', 'departmentId');
  expectType<Array<Pick<User, 'age'> & { rowNum: number }>>(rNum4);

  // $ExpectError (again, just a comment from original)
  // .rowNumber('rowNum', 'age', 'non_existing_field');

  // $ExpectType (Pick<User, "age"> & { rowNum: number; })[]
  const rNum5 = await knexInstance<User>('users')
    .select('age')
    .rowNumber('rowNum', 'age', ['departmentId', 'active']);
  expectType<Array<Pick<User, 'age'> & { rowNum: number }>>(rNum5);

  // $ExpectType (Pick<User, "age"> & { rowNum: number; })[]
  const rNum6 = await knexInstance<User>('users')
    .select('age')
    .rowNumber('rowNum', (builder) => {
      builder.orderBy('age').partitionBy('departmentId');
    });
  expectType<Array<Pick<User, 'age'> & { rowNum: number }>>(rNum6);

  // ## With inner query:

  // ### For column selection:

  // $ExpectType any[]
  const colSel1 = await knexInstance('users').select(
    knexInstance('foo').select('bar').as('colName')
  );
  expectType<any[]>(colSel1);

  // $ExpectType any[]
  const colSel2 = await knexInstance<User>('users').select(
    knexInstance('foo').select('bar').as('colName')
  );
  expectType<any[]>(colSel2);

  // $ExpectType Pick<User, "name" | "age">[]
  const colSel3 = await knexInstance<User>('users').select<
    Pick<User, 'name' | 'age'>[]
  >(knexInstance('foo').select('bar').as('colName'));
  expectType<Array<Pick<User, 'name' | 'age'>>>(colSel3);

  // ### For condition:

  // $ExpectType any[]
  const cond1 = await knexInstance('users').whereNot(function () {
    this.where('id', 1).orWhereNot('id', '>', 10);
  });
  expectType<any[]>(cond1);

  // $ExpectType User[]
  const cond2 = await knexInstance<User>('users').whereNot(function () {
    this.where('id', 1).orWhereNot('id', '>', 10);
  });
  expectType<User[]>(cond2);

  // $ExpectType User[]
  const cond3 = await knexInstance('users_inferred').whereNot(function () {
    this.where('id', 1).orWhereNot('id', '>', 10);
  });
  expectType<User[]>(cond3);
};

class ExcelClient extends knex.Client {}
