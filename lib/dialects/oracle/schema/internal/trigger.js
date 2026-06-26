const { NameHelper } = require('../../utils');

// Escape a value for use inside a PL/SQL single-quoted string literal.
// Doubles any single quotes so that e.g. "it's" becomes "it''s".
function escapeString(value) {
  return (value || '').replace(/'/g, "''");
}

// Escape an identifier for use inside double-quote wrapping ("...")
// within a PL/SQL single-quoted string literal (EXECUTE IMMEDIATE ('...')).
// Doubles any double quotes to prevent breaking out of "identifier" quoting,
// and doubles any single quotes to prevent breaking out of the '...' string.
function escapeIdentInString(value) {
  return (value || '').replace(/"/g, '""').replace(/'/g, "''");
}

class Trigger {
  constructor(oracleVersion) {
    this.nameHelper = new NameHelper(oracleVersion);
  }

  renameColumnTrigger(logger, tableName, columnName, to) {
    const triggerName = this.nameHelper.generateCombinedName(
      logger,
      'autoinc_trg',
      tableName
    );
    const sequenceName = this.nameHelper.generateCombinedName(
      logger,
      'seq',
      tableName
    );
    // Escape identifiers for use inside EXECUTE IMMEDIATE string literals
    const tableNameEsc = escapeIdentInString(tableName);
    const columnNameEsc = escapeIdentInString(columnName);
    const toEsc = escapeIdentInString(to);
    const triggerNameEsc = escapeIdentInString(triggerName);
    const sequenceNameEsc = escapeIdentInString(sequenceName);
    // Escape values for use inside PL/SQL string literals (WHERE clauses)
    const triggerNameStr = escapeString(triggerName);
    const tableNameStr = escapeString(tableName);
    const toStr = escapeString(to);
    return (
      `DECLARE ` +
      `PK_NAME VARCHAR(200); ` +
      `IS_AUTOINC NUMBER := 0; ` +
      `BEGIN` +
      `  EXECUTE IMMEDIATE ('ALTER TABLE "${tableNameEsc}" RENAME COLUMN "${columnNameEsc}" TO "${toEsc}"');` +
      `  SELECT COUNT(*) INTO IS_AUTOINC from "USER_TRIGGERS" where trigger_name = '${triggerNameStr}';` +
      `  IF (IS_AUTOINC > 0) THEN` +
      `    SELECT cols.column_name INTO PK_NAME` +
      `    FROM all_constraints cons, all_cons_columns cols` +
      `    WHERE cons.constraint_type = 'P'` +
      `    AND cons.constraint_name = cols.constraint_name` +
      `    AND cons.owner = cols.owner` +
      `    AND cols.table_name = '${tableNameStr}';` +
      `    IF ('${toStr}' = PK_NAME) THEN` +
      `      EXECUTE IMMEDIATE ('DROP TRIGGER "${triggerNameEsc}"');` +
      `      EXECUTE IMMEDIATE ('create or replace trigger "${triggerNameEsc}"` +
      `      BEFORE INSERT on "${tableNameEsc}" for each row` +
      `        declare` +
      `        checking number := 1;` +
      `        begin` +
      `          if (:new."${toEsc}" is null) then` +
      `            while checking >= 1 loop` +
      `              select "${sequenceNameEsc}".nextval into :new."${toEsc}" from dual;` +
      `              select count("${toEsc}") into checking from "${tableNameEsc}"` +
      `              where "${toEsc}" = :new."${toEsc}";` +
      `            end loop;` +
      `          end if;` +
      `        end;');` +
      `    end if;` +
      `  end if;` +
      `END;`
    );
  }

  createAutoIncrementTrigger(logger, tableName, schemaName) {
    // Escape identifiers for use inside EXECUTE IMMEDIATE string literals
    const tableNameEsc = escapeIdentInString(tableName);
    const tableQuoted = `"${tableNameEsc}"`;
    const schemaNameEsc = schemaName ? escapeIdentInString(schemaName) : '';
    const schemaQuoted = schemaName ? `"${schemaNameEsc}".` : '';
    // Escape values for use inside PL/SQL string literals
    const constraintOwner = schemaName
      ? `'${escapeString(schemaName)}'`
      : 'cols.owner';
    const tableNameStr = escapeString(tableName);
    const triggerName = this.nameHelper.generateCombinedName(
      logger,
      'autoinc_trg',
      tableName
    );
    const sequenceNameUnquoted = this.nameHelper.generateCombinedName(
      logger,
      'seq',
      tableName
    );
    const sequenceNameEsc = escapeIdentInString(sequenceNameUnquoted);
    const sequenceNameQuoted = `"${sequenceNameEsc}"`;
    const triggerNameEsc = escapeIdentInString(triggerName);
    return (
      `DECLARE ` +
      `PK_NAME VARCHAR(200); ` +
      `BEGIN` +
      `  EXECUTE IMMEDIATE ('CREATE SEQUENCE ${schemaQuoted}${sequenceNameQuoted}');` +
      `  SELECT cols.column_name INTO PK_NAME` + // TODO : support autoincrement on table with multiple primary keys
      `  FROM all_constraints cons, all_cons_columns cols` +
      `  WHERE cons.constraint_type = 'P'` +
      `  AND cons.constraint_name = cols.constraint_name` +
      `  AND cons.owner = ${constraintOwner}` +
      `  AND cols.table_name = '${tableNameStr}';` +
      `  execute immediate ('create or replace trigger ${schemaQuoted}"${triggerNameEsc}"` +
      `  BEFORE INSERT on ${schemaQuoted}${tableQuoted}` +
      `  for each row` +
      `  declare` +
      `  checking number := 1;` +
      `  begin` +
      `    if (:new."' || PK_NAME || '" is null) then` +
      `      while checking >= 1 loop` +
      `        select ${schemaQuoted}${sequenceNameQuoted}.nextval into :new."' || PK_NAME || '" from dual;` +
      `        select count("' || PK_NAME || '") into checking from ${schemaQuoted}${tableQuoted}` +
      `        where "' || PK_NAME || '" = :new."' || PK_NAME || '";` +
      `      end loop;` +
      `    end if;` +
      `  end;'); ` +
      `END;`
    );
  }

  renameTableAndAutoIncrementTrigger(logger, tableName, to) {
    const triggerName = this.nameHelper.generateCombinedName(
      logger,
      'autoinc_trg',
      tableName
    );
    const sequenceName = this.nameHelper.generateCombinedName(
      logger,
      'seq',
      tableName
    );
    const toTriggerName = this.nameHelper.generateCombinedName(
      logger,
      'autoinc_trg',
      to
    );
    const toSequenceName = this.nameHelper.generateCombinedName(
      logger,
      'seq',
      to
    );
    // Escape identifiers for use inside EXECUTE IMMEDIATE string literals
    const tableNameEsc = escapeIdentInString(tableName);
    const toEsc = escapeIdentInString(to);
    const triggerNameEsc = escapeIdentInString(triggerName);
    const sequenceNameEsc = escapeIdentInString(sequenceName);
    const toTriggerNameEsc = escapeIdentInString(toTriggerName);
    const toSequenceNameEsc = escapeIdentInString(toSequenceName);
    // Escape values for use inside PL/SQL string literals
    const triggerNameStr = escapeString(triggerName);
    const toStr = escapeString(to);
    return (
      `DECLARE ` +
      `PK_NAME VARCHAR(200); ` +
      `IS_AUTOINC NUMBER := 0; ` +
      `BEGIN` +
      `  EXECUTE IMMEDIATE ('RENAME "${tableNameEsc}" TO "${toEsc}"');` +
      `  SELECT COUNT(*) INTO IS_AUTOINC from "USER_TRIGGERS" where trigger_name = '${triggerNameStr}';` +
      `  IF (IS_AUTOINC > 0) THEN` +
      `    EXECUTE IMMEDIATE ('DROP TRIGGER "${triggerNameEsc}"');` +
      `    EXECUTE IMMEDIATE ('RENAME "${sequenceNameEsc}" TO "${toSequenceNameEsc}"');` +
      `    SELECT cols.column_name INTO PK_NAME` +
      `    FROM all_constraints cons, all_cons_columns cols` +
      `    WHERE cons.constraint_type = 'P'` +
      `    AND cons.constraint_name = cols.constraint_name` +
      `    AND cons.owner = cols.owner` +
      `    AND cols.table_name = '${toStr}';` +
      `    EXECUTE IMMEDIATE ('create or replace trigger "${toTriggerNameEsc}"` +
      `    BEFORE INSERT on "${toEsc}" for each row` +
      `      declare` +
      `      checking number := 1;` +
      `      begin` +
      `        if (:new."' || PK_NAME || '" is null) then` +
      `          while checking >= 1 loop` +
      `            select "${toSequenceNameEsc}".nextval into :new."' || PK_NAME || '" from dual;` +
      `            select count("' || PK_NAME || '") into checking from "${toEsc}"` +
      `            where "' || PK_NAME || '" = :new."' || PK_NAME || '";` +
      `          end loop;` +
      `        end if;` +
      `      end;');` +
      `  end if;` +
      `END;`
    );
  }
}

module.exports = Trigger;
