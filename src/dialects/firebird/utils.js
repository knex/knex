function generateCombinedName(logger, postfix, name, subNames) {
  const limit = 31;
  if (!Array.isArray(subNames)) subNames = subNames ? [subNames] : [];
  const table = name.replace(/\.|-/g, '_');
  const subNamesPart = subNames.join('_');
  const result = `${table}_${
    subNamesPart.length ? subNamesPart + '_' : ''
  }${postfix}`.toLowerCase();
  if (result.length > limit) {
    logger.warn(
      `Automatically generated name "${result}" exceeds ${limit} character ` +
        `limit for Oracle. Using base64 encoded sha1 of that name instead.`
    );
  }
  return result;
}

export { generateCombinedName };
