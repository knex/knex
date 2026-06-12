import { expectAssignable, expectType } from 'tsd';
import { clientConfig, User } from './common';

import knexDefault, { Knex, knex } from '../types';
import * as knexStar from '../types';
import knexCjsImport = require('../');
import QueryBuilder = Knex.QueryBuilder;
import KnexTimeoutError = knex.KnexTimeoutError;

const knexCjs = require('../knex');
const { knex: knexCjsNamed } = require('../knex');

expectType<Knex<any, unknown[]>>(knexDefault({}));
expectType<Knex<any, unknown[]>>(knex({}));
expectType<Knex<any, unknown[]>>(knexStar.default({}));
expectType<Knex<any, unknown[]>>(knexStar.knex({}));
expectType<Knex<any, unknown[]>>(knexCjsImport.default({}));
expectType<Knex<any, unknown[]>>(knexCjsImport.knex({}));
expectType<KnexTimeoutError>(new knex.KnexTimeoutError());
expectType<KnexTimeoutError>(new knex.KnexTimeoutError());

// Knex instances need to be assigned first so their generic types aren't inferred
const k1 = knex({});
expectAssignable<Knex>(k1);
const k2 = knexStar.default({});
expectAssignable<Knex>(k2);
const k3 = knexStar.knex({});
expectAssignable<Knex>(k3);
const k4 = knexCjsImport.default({});
expectAssignable<Knex>(k4);
const k5 = knexCjsImport.knex({});
expectAssignable<Knex>(k5);

// eslint-disable-next-line
expectType<any>(knexCjs({}));
// eslint-disable-next-line
expectType<any>(knexCjsNamed({}));

knex({}).schema.createTable('table', (t: Knex.AlterTableBuilder) => {});

const knexInstance = knexDefault(clientConfig);

// ToDo remove this copy-pasted type after we can export it as a named properly
type DeferredKeySelection<
  // The base of selection. In intermediate stages this may be unknown.
  // If it remains unknown at the point of resolution, the selection will fall back to any
  TBase,
  // Union of keys to be selected
  // In intermediate stages this may be never.
  TKeys extends string,
  // Changes how the resolution should behave if TKeys is never.
  // If true, then we assume that some keys were selected, and if TKeys is never, we will fall back to any.
  // If false, and TKeys is never, then we select TBase in its entirety
  THasSelect extends true | false = false,
  // Mapping of aliases <key in result> -> <key in TBase>
  TAliasMapping extends {} = {},
  // If enabled, then instead of extracting a partial, during resolution
  // we will pick just a single property.
  TSingle extends boolean = false,
  // Extra props which will be intersected with the result
  TIntersectProps extends {} = {},
  // Extra props which will be unioned with the result
  TUnionProps = never
> = {
  // These properties are not actually used, but exist simply because
  // typescript doesn't end up happy when type parameters are unused
  _base: TBase;
  _hasSelection: THasSelect;
  _keys: TKeys;
  _aliases: TAliasMapping;
  _single: TSingle;
  _intersectProps: TIntersectProps;
  _unionProps: TUnionProps;
};

// # Insert onConflict
expectType<
  QueryBuilder<
    User,
    DeferredKeySelection<User, never, false, {}, false, {}, never>[]
  >
>(
  knexInstance
    .table<User>('users')
    .insert({ id: 10, active: true })
    .onConflict('id')
    .merge({ active: true })
    .returning('*')
);

expectAssignable<QueryBuilder>(
  knexInstance
    .insert({ col: 'x' })
    .into('table')
    .onConflict('col')
    .merge({ x: 'x' })
    .debug(true)
);

expectAssignable<QueryBuilder>(
  knexInstance
    .insert({ id: 10, active: true })
    .into('table')
    .onConflict(['id'])
    .merge({ x: 'x' })
    .debug(true)
);

expectAssignable<QueryBuilder>(
  knexInstance
    .table<User>('users')
    .insert({ id: 10, active: true })
    .onConflict('id')
    .ignore()
);

expectAssignable<QueryBuilder>(
  knexInstance
    .insert({ id: 10, active: true })
    .into('table')
    .onConflict(['id'])
    .merge(['active', 'id'])
    .debug(true)
);

knexInstance.withWrapped('qb', knexInstance.select('column').from('table'));
knexInstance.withWrapped('callback', (qb) => qb.select('column').from('table'));

knexInstance.withWrapped('columnList+qb', ['columnName'], (qb) =>
  qb.select('column').from('table')
);
knexInstance.withWrapped('columnList+callback', ['columnName'], (qb) =>
  qb.select('column').from('table')
);

// FIXME: The withRaw function does not exist any more. with handles raw directly now.
knexInstance.withRaw('raw', knexInstance.raw('raw'));
knexInstance.withRaw('sql', 'just sql');
knexInstance.withRaw('sql+bindingsObj', 'sql with named bindings', { x: 1 });
knexInstance.withRaw('sql+bindingsArr', 'sql with positional bindings', [1]);

knexInstance.withRaw('columnList+raw', ['columnName'], knexInstance.raw('raw'));
knexInstance.withRaw('columnList+sql', ['columnName'], 'just sql');
knexInstance.withRaw(
  'columnList+sql+bindingsObj',
  ['columnName'],
  'sql with named bindings',
  { x: 1 }
);
knexInstance.withRaw(
  'columnList+sql+bindingsArr',
  ['columnName'],
  'sql with positional bindings',
  [1]
);

// the With type is used both for with and withRecursive. With extends both withWrapped and withRaw, so should support all the same variants:
// those inherited from WithWrapped
knexInstance.with('qb', knexInstance.select('column').from('table'));
knexInstance.with('callback', (qb) => qb.select('column').from('table'));
knexInstance.with('columnList+qb', ['columnName'], (qb) =>
  qb.select('column').from('table')
);
knexInstance.with('columnList+callback', ['columnName'], (qb) =>
  qb.select('column').from('table')
);
// those inherited from withRaw
knexInstance.with('raw', knexInstance.raw('raw'));
knexInstance.with('sql', 'just sql');
knexInstance.with('sql+bindingsObj', 'sql with named bindings', { x: 1 });
knexInstance.with('sql+bindingsArr', 'sql with positional bindings', [1]);
knexInstance.with('columnList+raw', ['columnName'], knexInstance.raw('raw'));
knexInstance.with('columnList+sql', ['columnName'], 'just sql');
knexInstance.with(
  'columnList+sql+bindingsObj',
  ['columnName'],
  'sql with named bindings',
  { x: 1 }
);
knexInstance.with(
  'columnList+sql+bindingsArr',
  ['columnName'],
  'sql with positional bindings',
  [1]
);
