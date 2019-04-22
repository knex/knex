import * as utils from '../utils';

const trigger = {
  createAutoIncrementSequence: function(logger, tableName) {
    const sequenceName = utils
      .generateCombinedName(logger, 'seq', tableName)
      .toUpperCase();
    return `
      CREATE SEQUENCE ${sequenceName};
    `;
  },
  dropAutoIncrementSequence: function(logger, tableName) {
    const sequenceName = utils
      .generateCombinedName(logger, 'seq', tableName)
      .toUpperCase();
    return `
      DROP SEQUENCE ${sequenceName};
    `;
  },
  createAutoIncrementTrigger: function(
    logger,
    tableName,
    autoIncrementColumnName
  ) {
    autoIncrementColumnName = (autoIncrementColumnName || 'id').toUpperCase();
    const triggerName = utils.generateCombinedName(logger, 'incr', tableName);
    const sequenceName = utils
      .generateCombinedName(logger, 'seq', tableName)
      .toUpperCase();
    return `
      CREATE OR ALTER TRIGGER ${triggerName} FOR ${tableName}
      ACTIVE BEFORE INSERT POSITION 0
      AS
      BEGIN
        IF (NEW."${autoIncrementColumnName}" IS NULL) THEN
        BEGIN
          NEW."${autoIncrementColumnName}" = NEXT VALUE FOR ${sequenceName};
        END
      END;
    `;
  },
};

export default trigger;
