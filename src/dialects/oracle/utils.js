function generateCombinedName(logger, postfix, name, subNames) {
  const crypto = require('crypto');
  const limit = 30;
  if (!Array.isArray(subNames)) subNames = subNames ? [subNames] : [];
  const table = name.replace(/\.|-/g, '_');
  const subNamesPart = subNames.join('_');
  let result = `${table}_${
    subNamesPart.length ? subNamesPart + '_' : ''
  }${postfix}`.toLowerCase();
  if (result.length > limit) {
    logger.warn(
      `Automatically generated name "${result}" exceeds ${limit} character ` +
        `limit for Oracle. Using base64 encoded sha1 of that name instead.`
    );
    // generates the sha1 of the name and encode it with base64
    result = crypto
      .createHash('sha1')
      .update(result)
      .digest('base64')
      .replace('=', '');
  }
  return result;
}

function wrapSqlWithCatch(sql, errorNumberToCatch) {
  return (
    `begin execute immediate '${sql.replace(/'/g, "''")}'; ` +
    `exception when others then if sqlcode != ${errorNumberToCatch} then raise; ` +
    `end if; ` +
    `end;`
  );
}

function ReturningHelper(columnName) {
  this.columnName = columnName;
}

ReturningHelper.prototype.toString = function() {
  return `[object ReturningHelper:${this.columnName}]`;
};

export { generateCombinedName, wrapSqlWithCatch, ReturningHelper };
