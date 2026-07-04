const { Pool } = require('tarn');

class KnexPool extends Pool {
  constructor(config) {
    super(config);
  }
}

// Check if an object is a tarn Pool (or KnexPool) vs a native driver pool.
// Uses instanceof plus a duck-type fallback checking tarn-specific methods.
function isTarnPool(obj) {
  if (obj instanceof Pool) return true;
  // Duck-type: tarn pools expose these numeric methods that native pools don't
  return (
    typeof obj.acquire === 'function' &&
    typeof obj.release === 'function' &&
    typeof obj.destroy === 'function' &&
    typeof obj.numFree === 'function' &&
    typeof obj.numUsed === 'function' &&
    typeof obj.numPendingAcquires === 'function'
  );
}

module.exports = { KnexPool, isTarnPool };
