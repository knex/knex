// Database Capabilities Registry
// -----
// This file defines the capabilities of different database dialects
// for features like multi-table DELETE operations.

const DATABASE_CAPABILITIES = {
  // MySQL family
  mysql: {
    multiTableDelete: {
      supported: true,
      strategy: 'mysql_style', // DELETE table1, table2 FROM table1 JOIN table2 WHERE ...
      description: 'MySQL supports multi-table DELETE using DELETE table1, table2 FROM syntax'
    }
  },
  mysql2: {
    multiTableDelete: {
      supported: true,
      strategy: 'mysql_style',
      description: 'MySQL2 supports multi-table DELETE using DELETE table1, table2 FROM syntax'
    }
  },

  // MSSQL family
  mssql: {
    multiTableDelete: {
      supported: true,
      strategy: 'mssql_style', // DELETE table1, table2 FROM table1 JOIN table2 WHERE ...
      description: 'MSSQL supports multi-table DELETE with optional trigger modifications'
    }
  },

  // PostgreSQL family
  postgres: {
    multiTableDelete: {
      supported: true,
      strategy: 'postgres_using', // DELETE FROM table1 USING table2 WHERE ...
      description: 'PostgreSQL supports multi-table DELETE using USING clause'
    }
  },
  pg: {
    multiTableDelete: {
      supported: true,
      strategy: 'postgres_using',
      description: 'PostgreSQL supports multi-table DELETE using USING clause'
    }
  },
  pgnative: {
    multiTableDelete: {
      supported: true,
      strategy: 'postgres_using',
      description: 'PostgreSQL native supports multi-table DELETE using USING clause'
    }
  },

  // SQLite family - does not support multi-table DELETE
  sqlite3: {
    multiTableDelete: {
      supported: false,
      strategy: null,
      description: 'SQLite does not support multi-table DELETE operations'
    }
  },
  'better-sqlite3': {
    multiTableDelete: {
      supported: false,
      strategy: null,
      description: 'Better-SQLite3 does not support multi-table DELETE operations'
    }
  },

  // Oracle family - capabilities to be implemented
  oracle: {
    multiTableDelete: {
      supported: false, // TODO: Research Oracle multi-table DELETE syntax
      strategy: null,
      description: 'Oracle multi-table DELETE support not yet implemented'
    }
  },
  oracledb: {
    multiTableDelete: {
      supported: false, // TODO: Research Oracle multi-table DELETE syntax
      strategy: null,
      description: 'OracleDB multi-table DELETE support not yet implemented'
    }
  },

  // CockroachDB - inherits PostgreSQL capabilities
  cockroachdb: {
    multiTableDelete: {
      supported: true,
      strategy: 'postgres_using',
      description: 'CockroachDB supports PostgreSQL-compatible multi-table DELETE using USING clause'
    }
  },

  // Redshift - inherits PostgreSQL capabilities with potential differences
  redshift: {
    multiTableDelete: {
      supported: true,
      strategy: 'postgres_using',
      description: 'Redshift supports PostgreSQL-compatible multi-table DELETE using USING clause'
    }
  }
};

/**
 * Get database capabilities for a specific dialect
 * @param {string} driverName - The database driver name
 * @returns {object|null} - The capabilities object or null if not found
 */
function getDatabaseCapabilities(driverName) {
  return DATABASE_CAPABILITIES[driverName] || null;
}

/**
 * Check if a database supports multi-table DELETE operations
 * @param {string} driverName - The database driver name
 * @returns {boolean} - True if supported, false otherwise
 */
function supportsMultiTableDelete(driverName) {
  const capabilities = getDatabaseCapabilities(driverName);
  return capabilities?.multiTableDelete?.supported || false;
}

/**
 * Get the multi-table DELETE strategy for a database
 * @param {string} driverName - The database driver name
 * @returns {string|null} - The strategy name or null if not supported
 */
function getMultiTableDeleteStrategy(driverName) {
  const capabilities = getDatabaseCapabilities(driverName);
  return capabilities?.multiTableDelete?.strategy || null;
}

/**
 * Get a description of multi-table DELETE support for a database
 * @param {string} driverName - The database driver name
 * @returns {string} - Description of support status
 */
function getMultiTableDeleteDescription(driverName) {
  const capabilities = getDatabaseCapabilities(driverName);
  return capabilities?.multiTableDelete?.description || 
         `Multi-table DELETE support for ${driverName} is not defined`;
}

/**
 * Register or update capabilities for a database dialect
 * @param {string} driverName - The database driver name
 * @param {object} capabilities - The capabilities object
 */
function registerDatabaseCapabilities(driverName, capabilities) {
  DATABASE_CAPABILITIES[driverName] = capabilities;
}

/**
 * Get list of all databases that support multi-table DELETE
 * @returns {string[]} - Array of database driver names
 */
function getSupportedDatabases() {
  return Object.keys(DATABASE_CAPABILITIES).filter(driverName => 
    supportsMultiTableDelete(driverName)
  );
}

module.exports = {
  DATABASE_CAPABILITIES,
  getDatabaseCapabilities,
  supportsMultiTableDelete,
  getMultiTableDeleteStrategy,
  getMultiTableDeleteDescription,
  registerDatabaseCapabilities,
  getSupportedDatabases
};