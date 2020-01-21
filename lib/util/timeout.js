const pTimeout = require('p-timeout');

class KnexTimeoutError extends pTimeout.TimeoutError {
  constructor(message) {
    super(message);
    this.name = 'KnexTimeoutError';
  }
}

module.exports.KnexTimeoutError = KnexTimeoutError;
module.exports.timeout = (promise, ms) =>
  pTimeout(promise, ms, new KnexTimeoutError('operation timed out'));
