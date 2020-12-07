import { expectType } from 'tsd';
import Knex, { QueryBuilder } from '../types';
import { clientConfig } from './common';

const knex = Knex(clientConfig);

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

interface User {
  id: number;
  age: number;
  name: string;
  active: boolean;
  departmentId: number;
}

// # Insert onConflict
expectType<
  QueryBuilder<
    User,
    DeferredKeySelection<User, never, false, {}, false, {}, never>[]
  >
>(
  knex
    .table<User>('users')
    .insert({ id: 10, active: true })
    .onConflict('id')
    .merge({ active: true })
    .returning('*')
);
