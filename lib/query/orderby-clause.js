// @ts-check

/** @typedef {import('./querycompiler')} QueryCompiler */

/**
 * @template T
 * @typedef {() => T} FragmentThunk
 */

/** @typedef {FragmentThunk<string>} Expr */
/** @typedef {FragmentThunk<'asc'|'desc'|undefined>} Dir */
/** @typedef {'first'|'last'} NullOrder */
/** @typedef {(this: QueryCompiler, columnOrExpression: Expr, direction: Dir, nulls: NullOrder) => string} OrderByHandler */

/** @param {Dir} thunk */
const spacePrefixedThunkResult = (thunk) => {
  const str = thunk();
  return typeof str === 'string' && str.length > 0 ? ` ${str}` : '';
};

const _ = spacePrefixedThunkResult;

/** @type {OrderByHandler} */
function UseIsNull(columnOrExpression, direction, nulls) {
  switch (nulls) {
    case 'first':
      return `${columnOrExpression()} is not null, ${columnOrExpression()}${_(
        direction
      )}`;
    case 'last':
      return `${columnOrExpression()} is null, ${columnOrExpression()}${_(
        direction
      )}`;
  }
}

/** @type {OrderByHandler} */
function UseNative(columnOrExpression, direction, nulls) {
  return `${columnOrExpression()}${_(direction)} nulls ${nulls}`;
}

module.exports = {
  UseIsNull,
  UseNative,
  spacePrefixedThunkResult,
};
