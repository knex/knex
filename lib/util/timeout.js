class KnexTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'KnexTimeoutError';
  }
}

function timeout(promise, ms) {
  return new Promise(function (resolve, reject) {
    const id = setTimeout(function () {
      reject(new KnexTimeoutError('operation timed out'));
    }, ms);

    function wrappedResolve(value) {
      clearTimeout(id);
      resolve(value);
    }

    function wrappedReject(err) {
      clearTimeout(id);
      reject(err);
    }

    promise.then(wrappedResolve, wrappedReject);
  });
}

module.exports.KnexTimeoutError = KnexTimeoutError;
module.exports.timeout = timeout;
