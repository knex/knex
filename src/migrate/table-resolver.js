//Get schema-aware table name
function getTableName(tableName, schemaName) {
  return schemaName ?
    `${schemaName}.${tableName}`
    : tableName;
}

//Get schema-aware query builder for a given table and schema name
function getTable(trxOrKnex, tableName, schemaName) {
  return schemaName ? trxOrKnex(tableName).withSchema(schemaName)
    : trxOrKnex(tableName);
}

module.exports = {
  getTable,
  getTableName
};
