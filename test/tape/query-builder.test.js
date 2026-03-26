'use strict';

const omit = require('lodash/omit');
const QueryBuilder = require('../../lib/query/querybuilder');
const Client = require('../../lib/client');

describe('QueryBuilder', () => {
  it('accumulates multiple update calls #647', () => {
    const qb = new QueryBuilder({});
    qb.update('a', 1).update('b', 2);
    expect(qb._single.update).toEqual({ a: 1, b: 2 });
  });

  it('allows for object syntax in join', () => {
    const qb = new QueryBuilder(new Client({ client: 'mysql' }));
    const sql = qb
      .table('users')
      .innerJoin('accounts', {
        'accounts.id': 'users.account_id',
        'accounts.owner_id': 'users.id',
      })
      .toSQL('join');
    expect(sql.sql).toBe(
      'inner join "accounts" on "accounts"."id" = "users"."account_id" and "accounts"."owner_id" = "users"."id"'
    );
  });

  it('clones correctly', () => {
    const qb = new QueryBuilder(new Client({ client: 'mysql' }));
    const original = qb.table('users').debug().innerJoin('accounts', {
      'accounts.id': 'users.account_id',
      'accounts.owner_id': 'users.id',
    });

    const cloned = original.clone();

    expect(cloned).not.toBe(original);

    // `deepEqual` freezes when it encounters circular references,
    // so they must be omitted.
    expect(omit(cloned, 'client', 'and')).toEqual(
      omit(original, 'client', 'and')
    );

    expect(cloned.client).toBe(original.client);

    expect(cloned.and).toBe(cloned);
  });
});
