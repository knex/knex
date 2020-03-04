const delay = require('./delay');

class KnexTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'KnexTimeoutError';
  }
}

function timeout(promise, ms) {
  return new Promise(async function(resolve, reject) {
    const id = setTimeout(function() {
      reject(new KnexTimeoutError('operation timed out'));
    }, ms);

    try {
      resolve(await promise);
    } catch (err) {
      reject(err);
    } finally {
      clearTimeout(id);
    }
  });
}

module.exports.KnexTimeoutError = KnexTimeoutError;
module.exports.timeout = timeout;
