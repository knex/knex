const {
  getTable,
  getLockTableName,
  getLockTableNameWithSchema,
  getTableName,
} = require('./table-resolver');

const lockColumns = {
  lock_id: (t) => t.string('lock_id', 64),
  locked_by: (t) => t.string('locked_by'),
  lock_expires_at: (t) => t.bigInteger('lock_expires_at'),
};

function ensureTable(tableName, schemaName, trxOrKnex) {
  const lockTable = getLockTableName(tableName);
  return getSchemaBuilder(trxOrKnex, schemaName)
    .hasTable(tableName)
    .then((exists) => {
      return (
        !exists &&
        _createUnlessCreated(tableName, schemaName, trxOrKnex, () =>
          _createMigrationTable(tableName, schemaName, trxOrKnex)
        )
      );
    })
    .then(() => {
      return getSchemaBuilder(trxOrKnex, schemaName).hasTable(lockTable);
    })
    .then((exists) => {
      return exists
        ? upgradeLockTable(lockTable, schemaName, trxOrKnex)
        : _createUnlessCreated(lockTable, schemaName, trxOrKnex, () =>
            _createMigrationLockTable(lockTable, schemaName, trxOrKnex)
          );
    })
    .then(() => {
      return getTable(trxOrKnex, lockTable, schemaName).select('*');
    })
    .then(async (data) => {
      if (!data.length) {
        return _insertLockRowIfNeeded(tableName, schemaName, trxOrKnex);
      }
      if (data.length > 1) {
        await _keepOneLockRow(tableName, schemaName, trxOrKnex);
      }
      return false;
    });
}

function _createMigrationTable(tableName, schemaName, trxOrKnex) {
  return getSchemaBuilder(trxOrKnex, schemaName).createTable(
    getTableName(tableName),
    function (t) {
      t.increments();
      t.string('name');
      t.integer('batch');
      t.timestamp('migration_time');
    }
  );
}

function _createMigrationLockTable(tableName, schemaName, trxOrKnex) {
  return getSchemaBuilder(trxOrKnex, schemaName).createTable(
    tableName,
    function (t) {
      t.increments('index').primary();
      t.integer('is_locked');
      Object.values(lockColumns).forEach((addColumn) => addColumn(t));
    }
  );
}

// Several processes may start migrating a fresh database at once; a table
// another one created in the meantime is not an error.
async function _createUnlessCreated(tableName, schemaName, trxOrKnex, create) {
  try {
    await create();
  } catch (error) {
    const exists = await getSchemaBuilder(trxOrKnex, schemaName).hasTable(
      tableName
    );
    if (!exists) {
      throw error;
    }
  }
}

// Adds the holder columns to a lock table created by an earlier version.
async function upgradeLockTable(tableName, schemaName, trxOrKnex) {
  const missingColumns = async () => {
    const columns = await getTable(
      trxOrKnex,
      tableName,
      schemaName
    ).columnInfo();
    return Object.keys(lockColumns).filter((column) => !columns[column]);
  };
  const missing = await missingColumns();
  if (!missing.length) {
    return;
  }
  try {
    await getSchemaBuilder(trxOrKnex, schemaName).alterTable(tableName, (t) =>
      missing.forEach((column) => lockColumns[column](t))
    );
  } catch (error) {
    if ((await missingColumns()).length) {
      throw error;
    }
  }
}

function _insertLockRowIfNeeded(tableName, schemaName, trxOrKnex) {
  const lockTableWithSchema = getLockTableNameWithSchema(tableName, schemaName);
  return trxOrKnex
    .select('*')
    .from(lockTableWithSchema)
    .then(async (data) => {
      if (data.length) {
        return null;
      }
      const inserted = await trxOrKnex
        .from(lockTableWithSchema)
        .insert({ is_locked: 0 });
      await _keepOneLockRow(tableName, schemaName, trxOrKnex);
      return inserted;
    });
}

// Starters that raced to insert the first row leave several rows. Rows that
// hold a lock are never removed; the free ones are cut so that the held row,
// or else the oldest one, is left.
async function _keepOneLockRow(tableName, schemaName, trxOrKnex) {
  const lockTableWithSchema = getLockTableNameWithSchema(tableName, schemaName);
  const rows = await trxOrKnex
    .select('index', 'is_locked')
    .from(lockTableWithSchema)
    .orderBy('index');
  if (rows.length > 1) {
    const kept = rows.find((row) => Number(row.is_locked)) || rows[0];
    await trxOrKnex
      .from(lockTableWithSchema)
      .whereNot('index', kept.index)
      .where('is_locked', 0)
      .del();
  }
}

//Get schema-aware schema builder for a given schema nam
function getSchemaBuilder(trxOrKnex, schemaName) {
  return schemaName
    ? trxOrKnex.schema.withSchema(schemaName)
    : trxOrKnex.schema;
}

module.exports = {
  ensureTable,
  getSchemaBuilder,
  upgradeLockTable,
};
