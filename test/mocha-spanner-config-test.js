// Spanner runs a dedicated spec instead of the shared integration suite.
module.exports = {
  spec: ['test/integration2/dialects/postgres-spanner.spec.js'],
};
