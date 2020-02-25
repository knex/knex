const noop = require('./noop');

const finallyMixin = (prototype) =>
  Object.assign(prototype, {
    finally(onFinally) {
      return this.then().finally(onFinally);
    },
  });

module.exports = Promise.prototype.finally ? noop : finallyMixin;
