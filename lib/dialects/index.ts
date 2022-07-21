const { resolveClientNameWithAliases } = require('../util/helpers')

const dbNameToDialectLoader: Record<string, () => any> = Object.freeze({
  'better-sqlite3': () => require('./better-sqlite3'),
  cockroachdb: () => require('./cockroachdb'),
  mssql: () => require('./mssql'),
  mysql: () => require('./mysql'),
  mysql2: () => require('./mysql2'),
  oracle: () => require('./oracle'),
  oracledb: () => require('./oracledb'),
  pgnative: () => require('./pgnative'),
  postgres: () => require('./postgres'),
  redshift: () => require('./redshift'),
  sqlite3: () => require('./sqlite3'),
  clickhouse: () => require('./clickhouse'),
})

/**
 * Gets the Dialect object with the given client name or throw an
 * error if not found.
 *
 * NOTE: This is a replacement for prior practice of doing dynamic
 * string construction for imports of Dialect objects.
 */
export function getDialectByNameOrAlias(clientName: string) {
  const resolvedClientName = resolveClientNameWithAliases(clientName)
  const dialectLoader = dbNameToDialectLoader[resolvedClientName]
  if (!dialectLoader) {
    throw new Error(`Invalid clientName given: ${clientName}`)
  }
  return dialectLoader();
}
