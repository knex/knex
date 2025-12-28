// @ts-check

/** @typedef {import('./querycompiler')} QueryCompiler */
/** @typedef {(this: QueryCompiler, direction: 'asc'|'desc'|undefined, nulls: 'first'|'last') => string} NativeOrderByNulls */
/** @typedef {(this: QueryCompiler, columnOrExpression: string, nulls: 'first'|'last') => string} EmulatedOrderByNulls */
/** @typedef {{type: 'native', fn: NativeOrderByNulls}|{type: 'emulated', fn: EmulatedOrderByNulls}} OrderByHandler */

/** @type {OrderByHandler} */
const UseIsNull = {
  type: 'emulated',
  fn(columnOrExpression, nulls) {
    switch (nulls) {
      case 'first':
        return `(${columnOrExpression} is not null)`;
      case 'last':
        return `(${columnOrExpression} is null)`;
      default:
        throw new Error(`Unknown nulls ordering: ${nulls}`);
    }
  },
};

/**
 * @typedef {(columnOrExpression: string, nulls: 'first'|'last') => string} ExpressionFn
 * @type {(fn: ExpressionFn) => OrderByHandler} */
const UseExpression = (expressionFn) => ({
  type: 'emulated',
  fn(columnOrExpression, nulls) {
    return expressionFn(columnOrExpression, nulls);
  },
});

/** @type {OrderByHandler} */
const UseNative = {
  type: 'native',
  fn(direction, nulls) {
    return `${direction} nulls ${nulls}`;
  },
};

/**
 * istanbul ignore next: backstop / abstract behavior
 * @type {OrderByHandler}
 */
const AlwaysFail = {
  type: 'emulated',
  fn(columnOrExpression, nulls) {
    throw new Error(
      `Order by nulls is not supported on ${this.client.dialect}`
    );
  },
};

module.exports = { UseIsNull, UseExpression, UseNative, AlwaysFail };
