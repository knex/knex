import { isArray, isObject, snakeCase, camelCase, mapKeys } from 'lodash';

function mapResponseItem(item) {
  if (!isObject(item)) {
    return item;
  }

  return mapKeys(item, (val, key) => {
    return camelCase(key);
  });
}

export function postProcessResponse(response) {
  if (isArray(response)) {
    return response.map(mapResponseItem);
  } else {
    return mapResponseItem(response);
  }
}

export function wrapIdentifier(id, origImpl) {
  // _.snakeCase removes the leading _ and places _ in front of numbers,
  // mangling the temp table names.
  if (id.startsWith('_knex_temp_alter')) {
    return origImpl(id);
  }

  const parts = id.split('.', 2);
  const prefix = parts.length === 2 ? parts[0] + '.' : '';
  const toWrap = prefix ? parts[1] : parts[0];
  return origImpl(
    prefix + (toWrap.startsWith('_') ? '_' : '') + snakeCase(toWrap)
  );
}
