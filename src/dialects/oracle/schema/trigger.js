import * as utils from '../utils';

const trigger = {

  renameColumnTrigger: function(tableName, columnName, to) {
    const triggerName = utils.generateCombinedName('autoinc_trg', tableName);
    const sequenceName = utils.generateCombinedName('seq', tableName);
    return `DECLARE ` +
    `PK_NAME VARCHAR(200); ` +
    `IS_AUTOINC NUMBER := 0; ` +
    `BEGIN` +
    `  EXECUTE IMMEDIATE ('ALTER TABLE "${tableName}" RENAME COLUMN "${columnName}" TO "${to}"');` +
    `  SELECT COUNT(*) INTO IS_AUTOINC from "USER_TRIGGERS" where trigger_name = '${triggerName}';`+
    `  IF (IS_AUTOINC > 0) THEN` +
    `    SELECT cols.column_name INTO PK_NAME` +
    `    FROM all_constraints cons, all_cons_columns cols` +
    `    WHERE cons.constraint_type = 'P'` +
    `    AND cons.constraint_name = cols.constraint_name` +
    `    AND cons.owner = cols.owner` +
    `    AND cols.table_name = '${tableName}';` +
    `    IF ('${to}' = PK_NAME) THEN` +
    `      EXECUTE IMMEDIATE ('DROP TRIGGER "${triggerName}"');` +
    `      EXECUTE IMMEDIATE ('create or replace trigger "${triggerName}"` +
    `      BEFORE INSERT on "${tableName}" for each row` +
    `        declare` +
    `        checking number := 1;` +
    `        begin` +
    `          if (:new."${to}" is null) then` +
    `            while checking >= 1 loop` +
    `              select "${sequenceName}".nextval into :new."${to}" from dual;` +
    `              select count("${to}") into checking from "${tableName}"` +
    `              where "${to}" = :new."${to}";` +
    `            end loop;` +
    `          end if;` +
    `        end;');` +
    `    end if;` +
    `  end if;` +
    `END;`;
  },

  createAutoIncrementTrigger: function(tableName) {
    const triggerName = utils.generateCombinedName('autoinc_trg', tableName);
    const sequenceName = utils.generateCombinedName('seq', tableName);
    return `DECLARE ` +
    `PK_NAME VARCHAR(200); ` +
    `BEGIN` +
    `  EXECUTE IMMEDIATE ('CREATE SEQUENCE "${sequenceName}"');` +
    `  SELECT cols.column_name INTO PK_NAME` +
    `  FROM all_constraints cons, all_cons_columns cols` +
    `  WHERE cons.constraint_type = 'P'` +
    `  AND cons.constraint_name = cols.constraint_name` +
    `  AND cons.owner = cols.owner` +
    `  AND cols.table_name = '${tableName}';` +
    `  execute immediate ('create or replace trigger "${triggerName}"` +
    `  BEFORE INSERT on "${tableName}"` +
    `  for each row` +
    `  declare` +
    `  checking number := 1;` +
    `  begin` +
    `    if (:new."' || PK_NAME || '" is null) then` +
    `      while checking >= 1 loop` +
    `        select "${sequenceName}".nextval into :new."' || PK_NAME || '" from dual;` +
    `        select count("' || PK_NAME || '") into checking from "${tableName}"` +
    `        where "' || PK_NAME || '" = :new."' || PK_NAME || '";` +
    `      end loop;` +
    `    end if;` +
    `  end;'); ` +
    `END;`;
  },

  renameTableAndAutoIncrementTrigger: function(tableName, to) {
    const triggerName = utils.generateCombinedName('autoinc_trg', tableName);
    const sequenceName = utils.generateCombinedName('seq', tableName);
    const toTriggerName = utils.generateCombinedName('autoinc_trg', to);
    const toSequenceName = utils.generateCombinedName('seq', to);
    return `DECLARE ` +
    `PK_NAME VARCHAR(200); ` +
    `IS_AUTOINC NUMBER := 0; ` +
    `BEGIN` +
    `  EXECUTE IMMEDIATE ('RENAME "${tableName}" TO "${to}"');` +
    `  SELECT COUNT(*) INTO IS_AUTOINC from "USER_TRIGGERS" where trigger_name = '${triggerName}';`+
    `  IF (IS_AUTOINC > 0) THEN` +
    `    EXECUTE IMMEDIATE ('DROP TRIGGER "${triggerName}"');` +
    `    EXECUTE IMMEDIATE ('RENAME "${sequenceName}" TO "${toSequenceName}"');` +
    `    SELECT cols.column_name INTO PK_NAME` +
    `    FROM all_constraints cons, all_cons_columns cols` +
    `    WHERE cons.constraint_type = 'P'` +
    `    AND cons.constraint_name = cols.constraint_name` +
    `    AND cons.owner = cols.owner` +
    `    AND cols.table_name = '${to}';` +
    `    EXECUTE IMMEDIATE ('create or replace trigger "${toTriggerName}"` +
    `    BEFORE INSERT on "${to}" for each row` +
    `      declare` +
    `      checking number := 1;` +
    `      begin` +
    `        if (:new."' || PK_NAME || '" is null) then` +
    `          while checking >= 1 loop` +
    `            select "${toSequenceName}".nextval into :new."' || PK_NAME || '" from dual;` +
    `            select count("' || PK_NAME || '") into checking from "${to}"` +
    `            where "' || PK_NAME || '" = :new."' || PK_NAME || '";` +
    `          end loop;` +
    `        end if;` +
    `      end;');` +
    `  end if;` +
    `END;`;
  }
}

export default trigger;
