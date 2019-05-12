// Originally based on contributions to DefinitelyTyped:
// Definitions by: Qubo <https://github.com/tkQubo>
//                 Pablo Rodríguez <https://github.com/MeLlamoPablo>
//                 Matt R. Wilson <https://github.com/mastermatt>
//                 Satana Charuwichitratana <https://github.com/micksatana>
//                 Shrey Jain <https://github.com/shreyjain1994>
// TypeScript Version: 3.2

/// <reference types="node" />

import events = require('events');
import stream = require('stream');
import Bluebird = require('bluebird');

type Callback = Function;
type Client = Function;

type Value =
  | string
  | number
  | boolean
  | Date
  | Array<string>
  | Array<number>
  | Array<Date>
  | Array<boolean>
  | Buffer
  | Knex.Raw;

interface ValueMap {
  [key: string]: Value | Knex.QueryBuilder;
}

type ColumnDescriptor<TRecord, TResult> =
  | string
  | Knex.Raw
  | Knex.QueryBuilder<TRecord, TResult>
  | { [key: string]: string };

type TableName = string | Knex.Raw | Knex.QueryBuilder;

type SafePick<T, K extends keyof T> = T extends {} ? Pick<T, K> : any;
type MaybeArray<T> = T | T[];
type ComparisionOperator = '=' | '>' | '>=' | '<' | '<=' | '<>';

type MaybeArrayMember<T> = T extends (infer M)[] ? M : T;

interface Boxed<T> {
  _value: T;
}

interface DeferredKeySelection<TBase, TKeys extends string> {
  _base: TBase;
  _keys: TKeys;
}

declare namespace DeferredKeySelection {
  type SetBase<TSelection, TBase> = TSelection extends DeferredKeySelection<
    any,
    infer TKeys
  >
    ? DeferredKeySelection<TBase, TKeys>
    : DeferredKeySelection<TBase, never>;
  type AddKey<
    TSelection,
    TKey extends string
  > = TSelection extends DeferredKeySelection<infer TBase, infer TKeys>
    ? DeferredKeySelection<TBase, TKeys | TKey>
    : never;
  type Augment<T, TBase, TKey extends string> = AddKey<SetBase<T, TBase>, TKey>;
  type ResolveSingle<TSelection> = TSelection extends DeferredKeySelection<
    infer Base,
    infer Keys
  >
    ? Base extends {}
      ? // Boxing is necessary to prevent distribution of conditional types:
        // https://lorefnon.tech/2019/05/02/using-boxing-to-prevent-distribution-of-conditional-types/
        Boxed<Keys> extends Boxed<keyof Base>
        ? Pick<Base, Keys & keyof Base>
        : any
      : any
    : TSelection;
  type Resolve<TSelection> = TSelection extends DeferredKeySelection<any, any>
    ? ResolveSingle<TSelection>
    : TSelection extends DeferredKeySelection<any, any>[]
    ? ResolveSingle<TSelection[0]>[]
    : TSelection;
}

type ResolveResult<S> = DeferredKeySelection.Resolve<S>;

interface Identifier {
  [alias: string]: string;
}

interface Knex<TRecord extends {} = any, TResult = unknown[]>
  extends Knex.QueryInterface<TRecord, TResult> {
  <TRecord2 = TRecord, TResult2 = TResult>(
    tableName?: TableName | Identifier
  ): Knex.QueryBuilder<TRecord2, TResult2> &
    Knex.ChainableInterface<TRecord2[]>;
  VERSION: string;
  __knex__: string;

  raw: Knex.RawBuilder;
  transaction<T>(
    transactionScope: (
      trx: Knex.Transaction<TResult>
    ) => Promise<T> | Bluebird<T> | void
  ): Bluebird<T>;
  destroy(callback: Function): void;
  destroy(): Bluebird<void>;
  batchInsert(
    tableName: TableName,
    data: any[],
    chunkSize?: number
  ): Knex.QueryBuilder<TRecord, {}>;
  schema: Knex.SchemaBuilder;
  queryBuilder<TRecord2 = TRecord, TResult2 = TResult>(): Knex.QueryBuilder<
    TRecord2,
    TResult2
  >;

  client: any;
  migrate: Knex.Migrator;
  seed: any;
  fn: Knex.FunctionHelper;
  on(
    eventName: string,
    callback: Function
  ): Knex.QueryBuilder<TRecord, TResult>;
}

declare function Knex<TRecord = any, TResult = unknown[]>(
  config: Knex.Config | string
): Knex<TRecord, TResult>;

declare namespace Knex {
  //
  // QueryInterface
  //

  interface QueryInterface<TRecord extends {} = any, TResult = unknown[]> {
    select: Select<TRecord, TResult>;
    as: As<TRecord, TResult>;
    columns: Select<TRecord, TResult>;
    column: Select<TRecord, TResult>;
    from: Table<TRecord, TResult>;
    into: Table<TRecord, TResult>;
    table: Table<TRecord, TResult>;
    distinct: Distinct<TRecord, TResult>;

    // Joins
    join: Join<TRecord, TResult>;
    joinRaw: JoinRaw<TRecord, TResult>;
    innerJoin: Join<TRecord, TResult>;
    leftJoin: Join<TRecord, TResult>;
    leftOuterJoin: Join<TRecord, TResult>;
    rightJoin: Join<TRecord, TResult>;
    rightOuterJoin: Join<TRecord, TResult>;
    outerJoin: Join<TRecord, TResult>;
    fullOuterJoin: Join<TRecord, TResult>;
    crossJoin: Join<TRecord, TResult>;

    // Withs
    with: With<TRecord, TResult>;
    withRaw: WithRaw<TRecord, TResult>;
    withSchema: WithSchema<TRecord, TResult>;
    withWrapped: WithWrapped<TRecord, TResult>;

    // Wheres
    where: Where<TRecord, TResult>;
    andWhere: Where<TRecord, TResult>;
    orWhere: Where<TRecord, TResult>;
    whereNot: Where<TRecord, TResult>;
    andWhereNot: Where<TRecord, TResult>;
    orWhereNot: Where<TRecord, TResult>;
    whereRaw: WhereRaw<TRecord, TResult>;
    orWhereRaw: WhereRaw<TRecord, TResult>;
    andWhereRaw: WhereRaw<TRecord, TResult>;
    whereWrapped: WhereWrapped<TRecord, TResult>;
    havingWrapped: WhereWrapped<TRecord, TResult>;
    whereExists: WhereExists<TRecord, TResult>;
    orWhereExists: WhereExists<TRecord, TResult>;
    whereNotExists: WhereExists<TRecord, TResult>;
    orWhereNotExists: WhereExists<TRecord, TResult>;
    whereIn: WhereIn<TRecord, TResult>;
    orWhereIn: WhereIn<TRecord, TResult>;
    whereNotIn: WhereIn<TRecord, TResult>;
    orWhereNotIn: WhereIn<TRecord, TResult>;
    whereNull: WhereNull<TRecord, TResult>;
    orWhereNull: WhereNull<TRecord, TResult>;
    whereNotNull: WhereNull<TRecord, TResult>;
    orWhereNotNull: WhereNull<TRecord, TResult>;
    whereBetween: WhereBetween<TRecord, TResult>;
    orWhereBetween: WhereBetween<TRecord, TResult>;
    andWhereBetween: WhereBetween<TRecord, TResult>;
    whereNotBetween: WhereBetween<TRecord, TResult>;
    orWhereNotBetween: WhereBetween<TRecord, TResult>;
    andWhereNotBetween: WhereBetween<TRecord, TResult>;

    // Group by
    groupBy: GroupBy<TRecord, TResult>;
    groupByRaw: RawQueryBuilder<TRecord, TResult>;

    // Order by
    orderBy: OrderBy<TRecord, TResult>;
    orderByRaw: RawQueryBuilder<TRecord, TResult>;

    // Intersect
    intersect: Intersect<TRecord, TResult>;

    // Union
    union: Union<TRecord, TResult>;
    unionAll: Union<TRecord, TResult>;

    // Having
    having: Having<TRecord, TResult>;
    andHaving: Having<TRecord, TResult>;
    havingRaw: RawQueryBuilder<TRecord, TResult>;
    orHaving: Having<TRecord, TResult>;
    orHavingRaw: RawQueryBuilder<TRecord, TResult>;
    havingIn: HavingRange<TRecord, TResult>;
    orHavingNotBetween: HavingRange<TRecord, TResult>;
    havingNotBetween: HavingRange<TRecord, TResult>;
    orHavingBetween: HavingRange<TRecord, TResult>;
    havingBetween: HavingRange<TRecord, TResult>;

    // Clear
    clearSelect(): QueryBuilder<TRecord, TResult>;
    clearWhere(): QueryBuilder<TRecord, TResult>;
    clearOrder(): QueryBuilder<TRecord, TResult>;
    clearHaving(): QueryBuilder<TRecord, TResult>;
    clearCounters(): QueryBuilder<TRecord, TResult>;

    // Paging
    offset(offset: number): QueryBuilder<TRecord, TResult>;
    limit(limit: number): QueryBuilder<TRecord, TResult>;

    // Aggregation
    count(...columnNames: (keyof TRecord)[]): CountQueryBuilder<TRecord>;
    count(...columnNames: string[]): CountQueryBuilder<TRecord>;
    count(
      columnName: Record<string, string | string[] | Knex.Raw> | Knex.Raw
    ): CountQueryBuilder<TRecord>;

    countDistinct(columnName: keyof TRecord): CountQueryBuilder<TRecord>;
    countDistinct(
      columnName: string | Record<string, string | Knex.Raw> | Knex.Raw
    ): CountQueryBuilder<TRecord>;

    min<TResult2 extends {} = ValueMap[]>(
      columnName: keyof TRecord,
      ...columnNames: (keyof TRecord)[]
    ): QueryBuilder<TRecord, TResult2>;
    min<TResult2 extends {} = ValueMap[]>(
      columnName: string,
      ...columnNames: string[]
    ): QueryBuilder<TRecord, TResult2>;
    min<TResult2 extends {} = ValueMap[]>(
      columnName: Record<string, string | string[] | Knex.Raw> | Knex.Raw
    ): QueryBuilder<TRecord, TResult2>;

    max<TResult2 extends {} = ValueMap[]>(
      columnName: keyof TRecord,
      ...columnNames: (keyof TRecord)[]
    ): QueryBuilder<TRecord, TResult2>;
    max<TResult2 extends {} = ValueMap[]>(
      columnName: string,
      ...columnNames: string[]
    ): QueryBuilder<TRecord, TResult2>;
    max<TResult2 extends {} = ValueMap[]>(
      columnName: Record<string, string | string[] | Knex.Raw> | Knex.Raw
    ): QueryBuilder<TRecord, TResult2>;

    sum<TResult2 extends {} = ValueMap[]>(
      columnName: keyof TRecord,
      ...columnNames: (keyof TRecord)[]
    ): QueryBuilder<TRecord, TResult2>;
    sum<TResult2 extends {} = ValueMap[]>(
      columnName: string,
      ...columnNames: string[]
    ): QueryBuilder<TRecord, TResult2>;
    sum<TResult2 extends {} = ValueMap[]>(
      columnName: Record<string, string | string[] | Knex.Raw> | Knex.Raw
    ): QueryBuilder<TRecord, TResult2>;

    sumDistinct<TResult2 extends {} = ValueMap[]>(
      columnName: keyof TRecord
    ): QueryBuilder<TRecord, TResult2>;
    sumDistinct<TResult2 extends {} = ValueMap[]>(
      columnName: string | Record<string, string | Knex.Raw> | Knex.Raw
    ): QueryBuilder<TRecord, TResult2>;

    avg<TResult2 extends {} = ValueMap[]>(
      columnName: keyof TRecord,
      ...columnNames: (keyof TRecord)[]
    ): QueryBuilder<TRecord, TResult2>;
    avg<TResult2 extends {} = ValueMap[]>(
      columnName: string,
      ...columnNames: string[]
    ): QueryBuilder<TRecord, TResult2>;
    avg<TResult2 extends {} = ValueMap[]>(
      columnName: Record<string, string | string[] | Knex.Raw> | Knex.Raw
    ): QueryBuilder<TRecord, TResult2>;

    avgDistinct<TResult2 extends {} = ValueMap[]>(
      columnName: keyof TRecord
    ): QueryBuilder<TRecord, TResult2>;
    avgDistinct<TResult2 extends {} = ValueMap[]>(
      columnName: string | Record<string, string | Knex.Raw> | Knex.Raw
    ): QueryBuilder<TRecord, TResult2>;

    increment(
      columnName: keyof TRecord,
      amount?: number
    ): QueryBuilder<TRecord, number>;
    increment(
      columnName: string,
      amount?: number
    ): QueryBuilder<TRecord, number>;

    decrement(
      columnName: keyof TRecord,
      amount?: number
    ): QueryBuilder<TRecord, number>;
    decrement(
      columnName: string,
      amount?: number
    ): QueryBuilder<TRecord, number>;

    // Others
    first: Select<TRecord, TResult>;

    pluck<K extends keyof TRecord>(
      column: K
    ): QueryBuilder<TRecord, TRecord[K][]>;
    pluck<TResult2 extends {}>(column: string): QueryBuilder<TRecord, TResult2>;

    insert<TKey extends keyof TRecord, TResult2 = TRecord[TKey][]>(
      data: MaybeArray<Partial<TRecord>>,
      returning: TKey
    ): QueryBuilder<TRecord, TResult2>;
    insert<TKey extends keyof TRecord, TResult2 = Pick<TRecord, TKey>[]>(
      data: MaybeArray<Partial<TRecord>>,
      returning: TKey[]
    ): QueryBuilder<TRecord, TResult2>;
    insert<TResult2 extends {}>(
      data: MaybeArray<Partial<TRecord>>,
      returning: string | string[]
    ): QueryBuilder<TRecord, TResult2>;
    insert(data: MaybeArray<Partial<TRecord>>): QueryBuilder<TRecord, number>;

    modify<TRecord2 extends {}, TResult2 extends {}>(
      callback: QueryCallbackWithArgs,
      ...args: any[]
    ): QueryBuilder<TRecord2, TResult2>;

    update<TKey extends keyof TRecord, TResult2 = TRecord[TKey][]>(
      data: MaybeArray<Partial<TRecord>>,
      returning: TKey
    ): QueryBuilder<TRecord, TResult2>;
    update<TKey extends keyof TRecord, TResult2 = Pick<TRecord, TKey>[]>(
      data: MaybeArray<Partial<TRecord>>,
      returning: TKey[]
    ): QueryBuilder<TRecord, TResult2>;
    update<TResult2 extends {} = TRecord>(
      data: MaybeArray<Partial<TRecord>>,
      returning: string | string[]
    ): QueryBuilder<TRecord, TResult2>;
    update<TResult2 extends {} = TRecord>(
      data: MaybeArray<Partial<TRecord>>
    ): QueryBuilder<TRecord, number>;
    update<
      K1 extends keyof TRecord,
      K2 extends keyof TRecord,
      TResult2 = TRecord[K2]
    >(
      columnName: K1,
      value: TRecord[K1],
      returning: K1
    ): QueryBuilder<TRecord, TResult2>;
    update<
      K1 extends keyof TRecord,
      K2 extends keyof TRecord,
      TResult2 = Pick<TRecord, K2>
    >(
      columnName: K1,
      value: TRecord[K1],
      returning: K1[]
    ): QueryBuilder<TRecord, TResult2>;
    update<K extends keyof TRecord>(
      columnName: K,
      value: TRecord[K]
    ): QueryBuilder<TRecord, number>;
    update<TResult2 = void>(
      columnName: string,
      value: Value,
      returning: string | string[]
    ): QueryBuilder<TRecord>;
    update<TResult2 = void>(
      columnName: string,
      value: Value
    ): QueryBuilder<TRecord, number>;

    returning<TKey extends keyof TRecord, TResult2 = TRecord[TKey][]>(
      column: TKey
    ): QueryBuilder<TRecord, TResult2>;
    returning<TKey extends keyof TRecord, TResult2 = Pick<TRecord, TKey>[]>(
      columns: TKey[]
    ): QueryBuilder<TRecord, TResult2>;
    returning<TResult2 = Partial<TRecord>[]>(
      column: string | string[]
    ): QueryBuilder<TRecord, TResult2>;

    del<TKey extends keyof TRecord, TResult2 = TRecord[TKey][]>(
      returning: TKey
    ): QueryBuilder<TRecord, TResult2[]>;
    del<TKey extends keyof TRecord, TResult2 = Pick<TRecord, TKey>[]>(
      returning: TKey[]
    ): QueryBuilder<TRecord, TResult2[]>;
    del<TResult2 = void>(
      returning: string | string[]
    ): QueryBuilder<TRecord, TResult2[]>;
    del(): QueryBuilder<TRecord, number>;

    delete<TKey extends keyof TRecord, TResult2 = TRecord[TKey][]>(
      returning: TKey
    ): QueryBuilder<TRecord, TResult2>;
    delete<TKey extends keyof TRecord, TResult2 = Pick<TRecord, TKey>[]>(
      returning: TKey[]
    ): QueryBuilder<TRecord, TResult2>;
    delete<TResult2 = void>(
      returning: string | string[]
    ): QueryBuilder<TRecord, TResult2>;
    delete(): QueryBuilder<TRecord, number>;

    truncate(): QueryBuilder<TRecord, void>;

    clone(): QueryBuilder<TRecord, TResult>;
  }

  interface As<TRecord, TResult> {
    (columnName: keyof TRecord): QueryBuilder<TRecord, TResult>;
    (columnName: string): QueryBuilder<TRecord, TResult>;
  }

  interface Select<TRecord extends {} = any, TResult = unknown[]>
    extends ColumnNameQueryBuilder<TRecord, TResult> {
    <TInnerRecord, TInnerResult, TResult2 = any[]>(
      ...subQueryBuilders: QueryBuilder<TInnerRecord, TInnerResult>[]
    ): QueryBuilder<TRecord, TResult2>;
    <TInnerRecord, TInnerResult, TResult2 = any[]>(
      subQueryBuilders: QueryBuilder<TInnerRecord, TInnerResult>[]
    ): QueryBuilder<TRecord, TResult2>;
    <
      AliasUT extends { [alias: string]: string | Knex.Raw },
      TResult2 = DeferredKeySelection.Augment<
        MaybeArrayMember<TResult>,
        TRecord,
        keyof AliasUT & string
      >[]
    >(
      ...aliases: AliasUT[]
    ): QueryBuilder<TRecord, TResult2>;
  }

  interface Table<TRecord extends {} = any, TResult extends {} = any> {
    <
      TRecord2 = TRecord,
      TResult2 = DeferredKeySelection.SetBase<
        MaybeArrayMember<TResult>,
        TRecord2
      >[]
    >(
      tableName: TableName | Identifier
    ): QueryBuilder<TRecord2, TResult2>;
    <
      TRecord2 = TRecord,
      TResult2 = DeferredKeySelection.SetBase<
        MaybeArrayMember<TResult>,
        TRecord2
      >[]
    >(
      callback: Function
    ): QueryBuilder<TRecord2, TResult2>;
    <
      TRecord2 = TRecord,
      TResult2 = DeferredKeySelection.SetBase<
        MaybeArrayMember<TResult>,
        TRecord2
      >[]
    >(
      raw: Raw
    ): QueryBuilder<TRecord2, TResult2>;
  }

  interface Distinct<TRecord extends {}, TResult = {}[]>
    extends ColumnNameQueryBuilder<TRecord, TResult> {}

  interface JoinCallback {
    (this: JoinClause, join: JoinClause): void;
  }

  interface Join<TRecord extends {} = any, TResult = unknown[]> {
    <
      TJoinTargetRecord extends {} = any,
      TRecord2 extends {} = TRecord & TJoinTargetRecord,
      TResult2 = unknown
    >(
      raw: Raw
    ): QueryBuilder<TRecord2, TResult2> & ChainableInterface<TRecord2[]>;
    <
      TJoinTargetRecord extends {} = any,
      TRecord2 extends {} = TRecord & TJoinTargetRecord,
      TResult2 = unknown
    >(
      tableName: TableName | Identifier | QueryCallback,
      clause: JoinCallback
    ): QueryBuilder<TRecord2, TResult2> & ChainableInterface<TRecord2[]>;
    <
      TJoinTargetRecord extends {} = any,
      TRecord2 extends {} = TRecord & TJoinTargetRecord,
      TResult2 = unknown
    >(
      tableName: TableName | Identifier | QueryCallback,
      columns: { [key: string]: string | number | boolean | Raw }
    ): QueryBuilder<TRecord2, TResult2> & ChainableInterface<TRecord2[]>;
    <
      TJoinTargetRecord extends {} = any,
      TRecord2 extends {} = TRecord & TJoinTargetRecord,
      TResult2 = unknown
    >(
      tableName: TableName | Identifier | QueryCallback,
      raw: Raw
    ): QueryBuilder<TRecord2, TResult2> & ChainableInterface<TRecord2[]>;
    <
      TJoinTargetRecord extends {} = any,
      TRecord2 extends {} = TRecord & TJoinTargetRecord,
      TResult2 = unknown
    >(
      tableName: TableName | Identifier | QueryCallback,
      column1: string,
      column2: string
    ): QueryBuilder<TRecord2, TResult2> & ChainableInterface<TRecord2[]>;
    <
      TJoinTargetRecord extends {} = any,
      TRecord2 extends {} = TRecord & TJoinTargetRecord,
      TResult2 = unknown
    >(
      tableName: TableName | Identifier | QueryCallback,
      column1: string,
      raw: Raw
    ): QueryBuilder<TRecord2, TResult2> & ChainableInterface<TRecord2[]>;
    <
      TJoinTargetRecord extends {} = any,
      TRecord2 extends {} = TRecord & TJoinTargetRecord,
      TResult2 = unknown
    >(
      tableName: TableName | Identifier | QueryCallback,
      column1: string,
      operator: string,
      column2: string
    ): QueryBuilder<TRecord2, TResult2> & ChainableInterface<TRecord2[]>;
  }

  interface JoinClause {
    on(raw: Raw): JoinClause;
    on(callback: JoinCallback): JoinClause;
    on(columns: { [key: string]: string | Raw }): JoinClause;
    on(column1: string, column2: string): JoinClause;
    on(column1: string, raw: Raw): JoinClause;
    on(column1: string, operator: string, column2: string | Raw): JoinClause;
    andOn(raw: Raw): JoinClause;
    andOn(callback: JoinCallback): JoinClause;
    andOn(columns: { [key: string]: string | Raw }): JoinClause;
    andOn(column1: string, column2: string): JoinClause;
    andOn(column1: string, raw: Raw): JoinClause;
    andOn(column1: string, operator: string, column2: string | Raw): JoinClause;
    orOn(raw: Raw): JoinClause;
    orOn(callback: JoinCallback): JoinClause;
    orOn(columns: { [key: string]: string | Raw }): JoinClause;
    orOn(column1: string, column2: string): JoinClause;
    orOn(column1: string, raw: Raw): JoinClause;
    orOn(column1: string, operator: string, column2: string | Raw): JoinClause;
    onIn(column1: string, values: any[]): JoinClause;
    andOnIn(column1: string, values: any[]): JoinClause;
    orOnIn(column1: string, values: any[]): JoinClause;
    onNotIn(column1: string, values: any[]): JoinClause;
    andOnNotIn(column1: string, values: any[]): JoinClause;
    orOnNotIn(column1: string, values: any[]): JoinClause;
    onNull(column1: string): JoinClause;
    andOnNull(column1: string): JoinClause;
    orOnNull(column1: string): JoinClause;
    onNotNull(column1: string): JoinClause;
    andOnNotNull(column1: string): JoinClause;
    orOnNotNull(column1: string): JoinClause;
    onExists(callback: QueryCallback): JoinClause;
    andOnExists(callback: QueryCallback): JoinClause;
    orOnExists(callback: QueryCallback): JoinClause;
    onNotExists(callback: QueryCallback): JoinClause;
    andOnNotExists(callback: QueryCallback): JoinClause;
    orOnNotExists(callback: QueryCallback): JoinClause;
    onBetween(column1: string, range: [any, any]): JoinClause;
    andOnBetween(column1: string, range: [any, any]): JoinClause;
    orOnBetween(column1: string, range: [any, any]): JoinClause;
    onNotBetween(column1: string, range: [any, any]): JoinClause;
    andOnNotBetween(column1: string, range: [any, any]): JoinClause;
    orOnNotBetween(column1: string, range: [any, any]): JoinClause;
    using(
      column: string | string[] | Raw | { [key: string]: string | Raw }
    ): JoinClause;
    type(type: string): JoinClause;
  }

  interface JoinRaw<TRecord = any, TResult = unknown[]> {
    (tableName: string, binding?: Value | ValueMap): QueryBuilder<
      TRecord,
      TResult
    >;
  }

  interface With<TRecordOuter = any, TResultOuter = unknown[]>
    extends WithRaw<TRecordOuter, TResultOuter>,
      WithWrapped<TRecordOuter, TResultOuter> {}

  interface WithRaw<TRecordOuter = any, TResultOuter = unknown[]> {
    <TRecordInner, TResultInner>(
      alias: string,
      raw: Raw | QueryBuilder<TRecordInner, TResultInner>
    ): QueryBuilder<TRecordOuter, TResultOuter>;
    <TRecordInner, TResultInner>(
      alias: string,
      sql: string,
      bindings?: Value[] | Object
    ): QueryBuilder<TRecordOuter, TResultOuter>;
  }

  interface WithSchema<TRecord = any, TResult = unknown[]> {
    (schema: string): QueryBuilder<TRecord, TResult>;
  }

  interface WithWrapped<TRecordOuter = any, TResultOuter = unknown[]> {
    <TRecordInner, TResultInner>(
      alias: string,
      queryBuilder: QueryBuilder<TRecordInner, TResultInner>
    ): QueryBuilder<TRecordOuter, TResultOuter>;
    <TRecordInner, TResultInner>(
      alias: string,
      callback: (queryBuilder: QueryBuilder<TRecordInner, TResultInner>) => any
    ): QueryBuilder<TRecordOuter, TResultOuter>;
  }

  type WhereResult<TRecord = any, TResult = unknown[]> = QueryBuilder<
    TRecord,
    TResult
  > &
    ChainableInterface<TResult extends unknown ? TRecord[] : TResult[]>;

  interface Where<TRecord = any, TResult = unknown[]>
    extends WhereRaw<TRecord, TResult>,
      WhereWrapped<TRecord, TResult>,
      WhereNull<TRecord, TResult> {
    (raw: Raw): WhereResult<TRecord, TResult>;
    (callback: QueryCallback): WhereResult<TRecord, TResult>;

    (object: Partial<TRecord>): WhereResult<TRecord, TResult>;
    (object: Object): WhereResult<TRecord, TResult>;

    <T extends keyof TRecord>(
      columnName: T,
      value: TRecord[T] | null
    ): WhereResult<TRecord, TResult>;
    (columnName: string, value: Value | null): WhereResult<TRecord, TResult>;

    <T extends keyof TRecord>(
      columnName: T,
      operator: ComparisionOperator,
      value: TRecord[T] | null
    ): WhereResult<TRecord, TResult>;
    (columnName: string, operator: string, value: Value | null): WhereResult<
      TRecord,
      TResult
    >;

    <T extends keyof TRecord, TRecordInner, TResultInner>(
      columnName: T,
      operator: ComparisionOperator,
      value: QueryBuilder<TRecordInner, TResultInner>
    ): WhereResult<TRecord, TResult>;
    <TRecordInner, TResultInner>(
      columnName: string,
      operator: string,
      value: QueryBuilder<TRecordInner, TResultInner>
    ): WhereResult<TRecord, TResult>;

    (left: Raw, operator: string, right: Value | null): WhereResult<
      TRecord,
      TResult
    >;
    <TRecordInner, TResultInner>(
      left: Raw,
      operator: string,
      right: QueryBuilder<TRecordInner, TResultInner>
    ): WhereResult<TRecord, TResult>;
  }

  interface WhereRaw<TRecord = any, TResult = unknown[]>
    extends RawQueryBuilder<TRecord, TResult> {
    (condition: boolean): WhereResult<TRecord, TResult>;
  }

  interface WhereWrapped<TRecord = any, TResult = unknown[]> {
    (callback: QueryCallback): WhereResult<TRecord, TResult>;
  }

  interface WhereNull<TRecord = any, TResult = unknown[]> {
    (columnName: keyof TRecord): WhereResult<TRecord, TResult>;
    (columnName: string): WhereResult<TRecord, TResult>;
  }

  interface WhereBetween<TRecord = any, TResult = unknown[]> {
    <K extends keyof TRecord>(
      columnName: K,
      range: [TRecord[K], TRecord[K]]
    ): WhereResult<TRecord, TResult>;
    (columnName: string, range: [Value, Value]): WhereResult<TRecord, TResult>;
  }

  interface WhereExists<TRecord = any, TResult = unknown[]> {
    (callback: QueryCallback): QueryBuilder<TRecord, TResult>;
    <TRecordInner, TResultInner>(
      query: QueryBuilder<TRecordInner, TResultInner>
    ): WhereResult<TRecord, TResult>;
  }

  interface WhereIn<TRecord = any, TResult = unknown[]> {
    <K extends keyof TRecord>(
      columnName: K,
      values: TRecord[K][] | QueryCallback
    ): WhereResult<TRecord, TResult>;
    (columnName: string, values: Value[] | QueryCallback): WhereResult<
      TRecord,
      TResult
    >;
    <K extends keyof TRecord>(
      columnNames: K[],
      values: TRecord[K][][] | QueryCallback
    ): WhereResult<TRecord, TResult>;
    (columnNames: string[], values: Value[][] | QueryCallback): WhereResult<
      TRecord,
      TResult
    >;
    <K extends keyof TRecord, TRecordInner, TResultInner>(
      columnName: K,
      values: QueryBuilder<TRecordInner, TRecord[K]>
    ): WhereResult<TRecord, TResult>;
    <TRecordInner, TResultInner>(
      columnName: string,
      values: QueryBuilder<TRecordInner, TResultInner>
    ): WhereResult<TRecord, TResult>;
    <K extends keyof TRecord, TRecordInner, TResultInner>(
      columnNames: K[],
      values: QueryBuilder<TRecordInner, TRecord[K]>
    ): WhereResult<TRecord, TResult>;
    <TRecordInner, TResultInner>(
      columnNames: string[],
      values: QueryBuilder<TRecordInner, TResultInner>
    ): WhereResult<TRecord, TResult>;
  }

  interface GroupBy<TRecord = any, TResult = unknown[]>
    extends RawQueryBuilder<TRecord, TResult>,
      ColumnNameQueryBuilder<TRecord, TResult> {}

  interface OrderBy<TRecord = any, TResult = unknown[]> {
    (columnName: keyof TRecord, order?: 'asc' | 'desc'): QueryBuilder<
      TRecord,
      TResult
    >;
    (columnName: string, order?: string): QueryBuilder<TRecord, TResult>;
    (
      columnDefs: Array<
        keyof TRecord | { column: keyof TRecord; order?: 'asc' | 'desc' }
      >
    ): QueryBuilder<TRecord, TResult>;
    (
      columnDefs: Array<string | { column: string; order?: string }>
    ): QueryBuilder<TRecord, TResult>;
  }

  interface Intersect<TRecord = any, TResult = unknown[]> {
    (
      callback: QueryCallback | QueryBuilder<TRecord, TResult> | Raw,
      wrap?: boolean
    ): QueryBuilder<TRecord, TResult>;
    (
      callbacks: (QueryCallback | QueryBuilder<TRecord, TResult> | Raw)[],
      wrap?: boolean
    ): QueryBuilder<TRecord, TResult>;
    (
      ...callbacks: (QueryCallback | QueryBuilder<TRecord, TResult> | Raw)[]
    ): QueryBuilder<TRecord, TResult>;
  }

  interface Union<TRecord = any, TResult = unknown[]> {
    (
      callback: QueryCallback | QueryBuilder<TRecord, TResult> | Raw,
      wrap?: boolean
    ): QueryBuilder<TRecord, TResult>;
    (
      callbacks: (QueryCallback | QueryBuilder<TRecord, TResult> | Raw)[],
      wrap?: boolean
    ): QueryBuilder<TRecord, TResult>;
    (
      ...callbacks: (QueryCallback | QueryBuilder<TRecord, TResult> | Raw)[]
    ): QueryBuilder<TRecord, TResult>;
    // (...callbacks: QueryCallback[], wrap?: boolean): QueryInterface;
  }

  interface Having<TRecord = any, TResult = unknown[]>
    extends RawQueryBuilder<TRecord, TResult>,
      WhereWrapped<TRecord, TResult> {
    <K1 extends keyof TRecord, K2 extends keyof TRecord>(
      tableName: string,
      column1: K1,
      operator: ComparisionOperator,
      column2: K2
    ): QueryBuilder<TRecord, TResult>;
    (
      tableName: string,
      column1: string,
      operator: string,
      column2: string
    ): QueryBuilder<TRecord, TResult>;
  }

  interface HavingRange<TRecord = any, TResult = unknown[]> {
    <K extends keyof TRecord>(
      columnName: K,
      values: TRecord[K][]
    ): QueryBuilder<TRecord, TResult>;
    (columnName: string, values: Value[]): QueryBuilder<TRecord, TResult>;
  }

  // commons

  interface ColumnNameQueryBuilder<TRecord = any, TResult = unknown[]> {
    // When all columns are known to be keys of original record,
    // we can extend our selection by these columns
    (columnName: '*'): QueryBuilder<TRecord, TRecord>;
    <
      ColNameUT extends keyof TRecord,
      TResult2 = DeferredKeySelection.Augment<
        MaybeArrayMember<TResult>,
        TRecord,
        ColNameUT & string
      >[]
    >(
      ...columnNames: ColNameUT[]
    ): QueryBuilder<TRecord, TResult2>;
    <
      ColNameUT extends keyof TRecord,
      TResult2 = DeferredKeySelection.Augment<
        MaybeArrayMember<TResult>,
        TRecord,
        ColNameUT & string
      >[]
    >(
      columnNames: ColNameUT[]
    ): QueryBuilder<TRecord, TResult2>;

    // For non-inferrable column selection, we will allow consumer to
    // specify result type and if not widen the result to entire record type with any omissions permitted
    <
      TResult2 = DeferredKeySelection.Augment<
        MaybeArrayMember<TResult>,
        Partial<TRecord>,
        keyof TRecord & string
      >[]
    >(
      ...columnNames: ColumnDescriptor<TRecord, TResult>[]
    ): QueryBuilder<TRecord, TResult2>;
    <
      TResult2 = DeferredKeySelection.Augment<
        MaybeArrayMember<TResult>,
        Partial<TRecord>,
        keyof TRecord & string
      >[]
    >(
      columnNames: ColumnDescriptor<TRecord, TResult>[]
    ): QueryBuilder<TRecord, TResult2>;
  }

  interface RawQueryBuilder<TRecord = any, TResult = unknown[]> {
    <TResult2 = Partial<TRecord>[]>(
      sql: string,
      ...bindings: (Value | QueryBuilder)[]
    ): QueryBuilder<TRecord, TResult2>;
    <TResult2 = Partial<TRecord>[]>(
      sql: string,
      bindings: (Value | QueryBuilder)[] | ValueMap
    ): QueryBuilder<TRecord, TResult2>;
    <TResult2 = Partial<TRecord>[]>(raw: Raw<TResult2>): QueryBuilder<
      TRecord,
      TResult2
    >;
  }

  // Raw

  interface Raw<TResult = any>
    extends events.EventEmitter,
      ChainableInterface<ResolveResult<TResult>> {
    wrap<TResult2 = TResult>(before: string, after: string): Raw<TResult>;
    toSQL(): Sql;
    queryContext(context: any): Raw<TResult>;
  }

  interface RawBuilder {
    <TResult>(value: Value): Raw<TResult>;
    <TResult>(sql: string, ...bindings: Value[]): Raw<TResult>;
    <TResult>(sql: string, bindings: Value[] | ValueMap): Raw<TResult>;
    <TRecord, TResult>(
      sql: string,
      ...bindings: QueryBuilder<TRecord, TResult>[]
    ): Raw<TResult>;
    <TRecord, TResult>(
      sql: string,
      bindings: QueryBuilder<TRecord, TResult>[] | ValueMap
    ): Raw<TResult>;
  }

  //
  // QueryBuilder
  //

  type QueryCallback = <TRecord = any, TResult = unknown[]>(
    this: QueryBuilder<TRecord, TResult>,
    builder: QueryBuilder<TRecord, TResult>
  ) => void;
  type QueryCallbackWithArgs = <TRecord, TResult>(
    this: QueryBuilder<TRecord, TResult>,
    builder: QueryBuilder<TRecord, TResult>,
    ...args: any[]
  ) => void;

  interface QueryBuilder<
    TRecord extends {} = any,
    TResult = Partial<TRecord>[]
  >
    extends QueryInterface<TRecord, TResult>,
      ChainableInterface<ResolveResult<TResult>> {
    // [TODO] Doesn't seem to be available
    // or: QueryBuilder;

    and: QueryBuilder<TRecord, TResult>;

    // TODO: Promise?
    columnInfo(column?: keyof TRecord): Bluebird<ColumnInfo>;

    forUpdate(...tableNames: string[]): QueryBuilder<TRecord, TResult>;
    forUpdate(tableNames: string[]): QueryBuilder<TRecord, TResult>;

    forShare(...tableNames: string[]): QueryBuilder<TRecord, TResult>;
    forShare(tableNames: string[]): QueryBuilder<TRecord, TResult>;

    toSQL(): Sql;

    on(event: string, callback: Function): QueryBuilder<TRecord, TResult>;

    queryContext(context: any): QueryBuilder<TRecord, TResult>;
  }

  type CountQueryBuilder<TRecord> = QueryBuilder<
    TRecord,
    { [key: string]: number | string }[]
  >;

  interface Sql {
    method: string;
    options: any;
    bindings: Value[];
    sql: string;
    toNative(): SqlNative;
  }

  interface SqlNative {
    bindings: Value[];
    sql: string;
  }

  //
  // Chainable interface
  //

  interface ChainableInterface<T = any> extends Bluebird<T> {
    toQuery(): string;
    options(options: { [key: string]: any }): this;
    connection(connection: any): this;
    debug(enabled: boolean): this;
    transacting(trx: Transaction<T>): this;
    stream(handler: (readable: stream.PassThrough) => any): Bluebird<any>;
    stream(
      options: { [key: string]: any },
      handler: (readable: stream.PassThrough) => any
    ): Bluebird<any>;
    stream(options?: { [key: string]: any }): stream.PassThrough;
    pipe<T extends NodeJS.WritableStream>(
      writable: T,
      options?: { [key: string]: any }
    ): stream.PassThrough;
    asCallback(callback: Function): this;
  }

  interface Transaction<T = any> extends Knex<any, T> {
    savepoint(transactionScope: (trx: Transaction<T>) => any): Bluebird<T>;
    commit(value?: any): QueryBuilder<any, T>;
    rollback(error?: any): QueryBuilder<any, T>;
  }

  //
  // Schema builder
  //

  interface SchemaBuilder extends ChainableInterface<void> {
    createTable(
      tableName: string,
      callback: (tableBuilder: CreateTableBuilder) => any
    ): SchemaBuilder;
    createTableIfNotExists(
      tableName: string,
      callback: (tableBuilder: CreateTableBuilder) => any
    ): SchemaBuilder;
    alterTable(
      tableName: string,
      callback: (tableBuilder: CreateTableBuilder) => any
    ): SchemaBuilder;
    renameTable(oldTableName: string, newTableName: string): Bluebird<void>;
    dropTable(tableName: string): SchemaBuilder;
    hasTable(tableName: string): Bluebird<boolean>;
    hasColumn(tableName: string, columnName: string): Bluebird<boolean>;
    table(
      tableName: string,
      callback: (tableBuilder: AlterTableBuilder) => any
    ): Bluebird<void>;
    dropTableIfExists(tableName: string): SchemaBuilder;
    raw(statement: string): SchemaBuilder;
    withSchema(schemaName: string): SchemaBuilder;
    queryContext(context: any): SchemaBuilder;
  }

  interface TableBuilder {
    increments(columnName?: string): ColumnBuilder;
    bigIncrements(columnName?: string): ColumnBuilder;
    dropColumn(columnName: string): TableBuilder;
    dropColumns(...columnNames: string[]): TableBuilder;
    renameColumn(from: string, to: string): ColumnBuilder;
    integer(columnName: string, length?: number): ColumnBuilder;
    bigInteger(columnName: string): ColumnBuilder;
    text(columnName: string, textType?: string): ColumnBuilder;
    string(columnName: string, length?: number): ColumnBuilder;
    float(
      columnName: string,
      precision?: number,
      scale?: number
    ): ColumnBuilder;
    decimal(
      columnName: string,
      precision?: number | null,
      scale?: number
    ): ColumnBuilder;
    boolean(columnName: string): ColumnBuilder;
    date(columnName: string): ColumnBuilder;
    dateTime(columnName: string): ColumnBuilder;
    time(columnName: string): ColumnBuilder;
    timestamp(columnName: string, standard?: boolean): ColumnBuilder;
    timestamps(
      useTimestampType?: boolean,
      makeDefaultNow?: boolean
    ): ColumnBuilder;
    binary(columnName: string, length?: number): ColumnBuilder;
    enum(
      columnName: string,
      values: Value[],
      options?: EnumOptions
    ): ColumnBuilder;
    enu(
      columnName: string,
      values: Value[],
      options?: EnumOptions
    ): ColumnBuilder;
    json(columnName: string): ColumnBuilder;
    jsonb(columnName: string): ColumnBuilder;
    uuid(columnName: string): ColumnBuilder;
    comment(val: string): TableBuilder;
    specificType(columnName: string, type: string): ColumnBuilder;
    primary(columnNames: string[], constraintName?: string): TableBuilder;
    index(
      columnNames: (string | Raw)[],
      indexName?: string,
      indexType?: string
    ): TableBuilder;
    unique(columnNames: (string | Raw)[], indexName?: string): TableBuilder;
    foreign(column: string, foreignKeyName?: string): ForeignConstraintBuilder;
    foreign(
      columns: string[],
      foreignKeyName?: string
    ): MultikeyForeignConstraintBuilder;
    dropForeign(columnNames: string[], foreignKeyName?: string): TableBuilder;
    dropUnique(columnNames: (string | Raw)[], indexName?: string): TableBuilder;
    dropPrimary(constraintName?: string): TableBuilder;
    dropIndex(columnNames: (string | Raw)[], indexName?: string): TableBuilder;
    dropTimestamps(): ColumnBuilder;
    queryContext(context: any): TableBuilder;
  }

  interface CreateTableBuilder extends TableBuilder {}

  interface MySqlTableBuilder extends CreateTableBuilder {
    engine(val: string): CreateTableBuilder;
    charset(val: string): CreateTableBuilder;
    collate(val: string): CreateTableBuilder;
  }

  interface AlterTableBuilder extends TableBuilder {}

  interface MySqlAlterTableBuilder extends AlterTableBuilder {}

  interface ColumnBuilder {
    index(indexName?: string): ColumnBuilder;
    primary(constraintName?: string): ColumnBuilder;
    unique(indexName?: string): ColumnBuilder;
    references(columnName: string): ReferencingColumnBuilder;
    onDelete(command: string): ColumnBuilder;
    onUpdate(command: string): ColumnBuilder;
    defaultTo(value: Value): ColumnBuilder;
    unsigned(): ColumnBuilder;
    notNullable(): ColumnBuilder;
    nullable(): ColumnBuilder;
    comment(value: string): ColumnBuilder;
    alter(): ColumnBuilder;
    queryContext(context: any): ColumnBuilder;
  }

  interface ForeignConstraintBuilder {
    references(columnName: string): ReferencingColumnBuilder;
  }

  interface MultikeyForeignConstraintBuilder {
    references(columnNames: string[]): ReferencingColumnBuilder;
  }

  interface PostgreSqlColumnBuilder extends ColumnBuilder {
    index(indexName?: string, indexType?: string): ColumnBuilder;
  }

  interface ReferencingColumnBuilder extends ColumnBuilder {
    inTable(tableName: string): ColumnBuilder;
  }

  interface AlterColumnBuilder extends ColumnBuilder {}

  interface MySqlAlterColumnBuilder extends AlterColumnBuilder {
    first(): AlterColumnBuilder;
    after(columnName: string): AlterColumnBuilder;
  }

  //
  // Configurations
  //

  interface ColumnInfo {
    defaultValue: Value;
    type: string;
    maxLength: number;
    nullable: boolean;
  }

  interface Config {
    debug?: boolean;
    client?: string | typeof Client;
    dialect?: string;
    version?: string;
    connection?:
      | string
      | ConnectionConfig
      | MariaSqlConnectionConfig
      | MySqlConnectionConfig
      | MsSqlConnectionConfig
      | Sqlite3ConnectionConfig
      | SocketConnectionConfig;
    pool?: PoolConfig;
    migrations?: MigratorConfig;
    postProcessResponse?: (result: any, queryContext: any) => any;
    wrapIdentifier?: (
      value: string,
      origImpl: (value: string) => string,
      queryContext: any
    ) => string;
    seeds?: SeedsConfig;
    acquireConnectionTimeout?: number;
    useNullAsDefault?: boolean;
    searchPath?: string | string[];
    asyncStackTraces?: boolean;
  }

  interface ConnectionConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    domain?: string;
    instanceName?: string;
    debug?: boolean;
    requestTimeout?: number;
  }

  interface MsSqlConnectionConfig {
    user: string;
    password: string;
    server: string;
    database: string;
    options: MsSqlOptionsConfig;
  }

  // Config object for mariasql: https://github.com/mscdex/node-mariasql#client-methods
  interface MariaSqlConnectionConfig {
    user?: string;
    password?: string;
    host?: string;
    port?: number;
    unixSocket?: string;
    protocol?: string;
    db?: string;
    keepQueries?: boolean;
    multiStatements?: boolean;
    connTimeout?: number;
    pingInterval?: number;
    secureAuth?: boolean;
    compress?: boolean;
    ssl?: boolean | MariaSslConfiguration;
    local_infile?: boolean;
    read_default_file?: string;
    read_default_group?: string;
    charset?: string;
    streamHWM?: number;
  }

  interface MariaSslConfiguration {
    key?: string;
    cert?: string;
    ca?: string;
    capath?: string;
    cipher?: string;
    rejectUnauthorized?: boolean;
  }

  // Config object for mysql: https://github.com/mysqljs/mysql#connection-options
  interface MySqlConnectionConfig {
    host?: string;
    port?: number;
    localAddress?: string;
    socketPath?: string;
    user?: string;
    password?: string;
    database?: string;
    charset?: string;
    timezone?: string;
    connectTimeout?: number;
    stringifyObjects?: boolean;
    insecureAuth?: boolean;
    typeCast?: any;
    queryFormat?: (query: string, values: any) => string;
    supportBigNumbers?: boolean;
    bigNumberStrings?: boolean;
    dateStrings?: boolean;
    debug?: boolean;
    trace?: boolean;
    multipleStatements?: boolean;
    flags?: string;
    ssl?: string | MariaSslConfiguration;
  }

  /** Used with SQLite3 adapter */
  interface Sqlite3ConnectionConfig {
    filename: string;
    debug?: boolean;
  }

  interface MsSqlOptionsConfig {
    encrypt?: boolean;
    port?: number;
    domain?: string;
    connectionTimeout?: number;
    requestTimeout?: number;
    stream?: boolean;
    parseJSON?: boolean;
    pool?: PoolConfig;
  }

  interface SocketConnectionConfig {
    socketPath: string;
    user: string;
    password: string;
    database: string;
    debug?: boolean;
  }

  interface PoolConfig {
    name?: string;
    create?: Function;
    afterCreate?: Function;
    destroy?: Function;
    beforeDestroy?: Function;
    min?: number;
    max?: number;
    refreshIdle?: boolean;
    idleTimeoutMillis?: number;
    reapIntervalMillis?: number;
    returnToHead?: boolean;
    priorityRange?: number;
    validate?: Function;
    log?: boolean;

    // generic-pool v3 configs
    maxWaitingClients?: number;
    testOnBorrow?: boolean;
    acquireTimeoutMillis?: number;
    fifo?: boolean;
    autostart?: boolean;
    evictionRunIntervalMillis?: number;
    numTestsPerRun?: number;
    softIdleTimeoutMillis?: number;
    Promise?: any;
  }

  interface MigratorConfig {
    database?: string;
    directory?: string | string[];
    extension?: string;
    tableName?: string;
    schemaName?: string;
    disableTransactions?: boolean;
    sortDirsSeparately?: boolean;
    loadExtensions?: string[];
    migrationSource?: any;
  }

  interface SeedsConfig {
    directory?: string;
  }

  interface Migrator {
    make(name: string, config?: MigratorConfig): Bluebird<string>;
    latest(config?: MigratorConfig): Bluebird<any>;
    rollback(config?: MigratorConfig, all?: boolean): Bluebird<any>;
    status(config?: MigratorConfig): Bluebird<number>;
    currentVersion(config?: MigratorConfig): Bluebird<string>;
  }

  interface FunctionHelper {
    now(): Raw;
  }

  interface EnumOptions {
    useNative: boolean;
    existingType: boolean;
    enumName: string;
  }

  //
  // Clients
  //

  class Client extends events.EventEmitter {
    constructor(config: Config);
    config: Config;
    dialect: string;
    driverName: string;
    connectionSettings: object;

    acquireRawConnection(): Promise<any>;
    destroyRawConnection(connection: any): Promise<void>;
    validateConnection(connection: any): Promise<boolean>;
  }
}

export = Knex;
