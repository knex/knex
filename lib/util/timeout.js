const Bluebird = require('bluebird');
const delay = require('./delay');

class KnexTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'KnexTimeoutError';
  }
}

module.exports.KnexTimeoutError = KnexTimeoutError;
module.exports.timeout = (promise, ms) =>
  Bluebird.resolve(
    Promise.race([
      promise,
      delay(ms).then(() =>
        Promise.reject(new KnexTimeoutError('operation timed out'))
      ),
    ])
  );
