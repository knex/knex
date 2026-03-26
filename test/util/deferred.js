/**
 * Creates a deferred promise — useful for converting callback-style tests
 * to promise-based tests without losing the callback semantics.
 */
function pDefer() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

module.exports = { pDefer };
