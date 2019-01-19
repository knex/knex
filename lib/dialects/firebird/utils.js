'use strict';

exports.__esModule = true;
function generateCombinedName(logger, postfix, name, subNames) {
  var limit = 31;
  if (!Array.isArray(subNames)) subNames = subNames ? [subNames] : [];
  var table = name.replace(/\.|-/g, '_');
  var subNamesPart = subNames.join('_');
  var result = (
    table +
    '_' +
    (subNamesPart.length ? subNamesPart + '_' : '') +
    postfix
  ).toLowerCase();
  if (result.length > limit) {
    logger.warn(
      'Automatically generated name "' +
        result +
        '" exceeds ' +
        limit +
        ' character ' +
        'limit for Oracle. Using base64 encoded sha1 of that name instead.'
    );
  }
  return result;
}

exports.generateCombinedName = generateCombinedName;
