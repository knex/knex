// Spanner runs a dedicated, self-contained spec instead of the shared
// integration suite (which assumes schemas and migrations that Spanner's
// PostgreSQL interface does not support).
module.exports = {
  spec: ['test/integration2/dialects/postgres-spanner.spec.js'],
};
