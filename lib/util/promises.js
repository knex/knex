function availablePromiseMethods() {
  return Promise.prototype.finally ? ['catch', 'finally'] : ['catch'];
}

module.exports = { availablePromiseMethods };
