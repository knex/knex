// Detects whether a MySQL column default value is an expression that should NOT
// be quoted in ALTER TABLE statements.
//
// When Knex reads column metadata from MySQL via SHOW FULL FIELDS, the Default
// column is returned as a string, losing the distinction between literal string
// defaults and SQL expressions. This function uses multiple heuristics:
//
// 1. The EXTRA field from SHOW FULL FIELDS (or INFORMATION_SCHEMA.COLUMNS)
//    contains 'DEFAULT_GENERATED' for expression defaults in MySQL 8.0.13+
// 2. CURRENT_TIMESTAMP and its variants are special-cased by MySQL and not
//    marked as DEFAULT_GENERATED, so they must be detected by pattern matching
// 3. MySQL 8.0+ expression defaults are wrapped in parentheses
//
// @param {string} defaultValue - The default value string from MySQL metadata
// @param {string} [extra]      - The Extra field from SHOW FULL FIELDS
// @returns {boolean} True if the default is an expression that should not be quoted

// Known MySQL expression patterns that should never be quoted.
// These cover temporal functions, UUID functions, and parenthesized expressions.
const EXPRESSION_PATTERNS = [
  // Temporal functions with optional fractional-seconds precision
  /^CURRENT_TIMESTAMP(?:\(\d*\))?$/i,
  /^CURRENT_DATE(?:\(\d*\))?$/i,
  /^CURRENT_TIME(?:\(\d*\))?$/i,
  /^NOW\(\d*\)$/i,
  /^LOCALTIME(?:\(\d*\))?$/i,
  /^LOCALTIMESTAMP(?:\(\d*\))?$/i,
  /^UTC_TIMESTAMP(?:\(\d*\))?$/i,
  /^UTC_DATE(?:\(\d*\))?$/i,
  /^UTC_TIME(?:\(\d*\))?$/i,

  // UUID functions (MySQL 8.0+)
  /^UUID\(\)$/i,
  /^UUID_SHORT\(\)$/i,
  /^UUID_TO_BIN\(.*\)$/i,
  /^BIN_TO_UUID\(.*\)$/i,

  // MySQL 8.0+ expression defaults are wrapped in parentheses
  // e.g. (10 + 5), (UUID()), (CURRENT_TIMESTAMP)
  /^\(.*\)$/,
];

function isExpressionDefault(defaultValue, extra) {
  if (defaultValue === null || defaultValue === undefined) {
    return false;
  }

  const value = String(defaultValue);

  // MySQL 8.0.13+ marks expression defaults with DEFAULT_GENERATED in Extra
  if (extra && /DEFAULT_GENERATED/i.test(extra)) {
    return true;
  }

  // Check against known expression patterns
  for (const pattern of EXPRESSION_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }

  return false;
}

module.exports = isExpressionDefault;
