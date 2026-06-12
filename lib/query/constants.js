/**
 * internal constants, do not use in application code
 */
module.exports = {
  lockMode: {
    forShare: 'forShare',
    forUpdate: 'forUpdate',
    forNoKeyUpdate: 'forNoKeyUpdate',
    forKeyShare: 'forKeyShare',
  },
  waitMode: {
    skipLocked: 'skipLocked',
    noWait: 'noWait',
  },
};
