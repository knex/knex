const bluebirdPromisesMethods = [
  'bind',
  'catch',
  'finally',
  'asCallback',
  'spread',
  'map',
  'reduce',
  'thenReturn',
  'return',
  'yield',
  'ensure',
  'reflect',
  'get',
  'mapSeries',
  'delay',
];

function availablePromiseMethods(promiseLibrary, promiseInterfaceMethodsInput) {
  if (promiseInterfaceMethodsInput === 'bluebird') {
    return bluebirdPromisesMethods;
  }

  if (Array.isArray(promiseInterfaceMethodsInput)) {
    return promiseInterfaceMethodsInput.filter((method) => method !== 'then');
  }

  return Promise.prototype.finally ? ['catch', 'finally'] : ['catch'];
}

module.exports = { availablePromiseMethods };
