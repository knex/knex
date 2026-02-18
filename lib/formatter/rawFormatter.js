const { columnize } = require('./wrappingFormatter');

function replaceRawArrBindings(raw, client) {
  const bindingsHolder = {
    bindings: [],
  };
  const builder = raw;

  const expectedBindings = raw.bindings.length;
  const values = raw.bindings;
  let index = 0;

  const sql = raw.sql.replace(/(\\*)(\?\??)/g, function (match, escapes, placeholder) {
    if (escapes.length % 2) {
      // Odd number of backslashes: the placeholder is escaped.
      // Return the match unchanged so that positionBindings can later
      // strip the escape backslash.
      return match;
    }

    // Even number of backslashes (including zero): real placeholder.
    // Backslashes are consumed by the escape mechanism.
    const value = values[index++];

    if (placeholder === '??') {
      return columnize(value, builder, client, bindingsHolder);
    }
    return client.parameter(value, builder, bindingsHolder);
  });

  if (expectedBindings !== index) {
    throw new Error(`Expected ${expectedBindings} bindings, saw ${index}`);
  }

  return {
    method: 'raw',
    sql,
    bindings: bindingsHolder.bindings,
  };
}

function replaceKeyBindings(raw, client) {
  const bindingsHolder = {
    bindings: [],
  };
  const builder = raw;

  const values = raw.bindings;
  const regex = /(\\*)(:(\w+):(?=::)|:(\w+):(?!:)|:(\w+))/g;

  const sql = raw.sql.replace(regex, function (match, escapes, p1, p2, p3, p4) {
    if (escapes.length % 2) {
      // Odd number of backslashes: the named binding is escaped.
      // Strip one backslash (the escape char) and return the literal text.
      return escapes.slice(1) + p1;
    }

    const part = p2 || p3 || p4;
    const key = match.trim();
    const isIdentifier = key[key.length - 1] === ':';
    const value = values[part];

    if (value === undefined) {
      if (Object.prototype.hasOwnProperty.call(values, part)) {
        bindingsHolder.bindings.push(value);
      }

      return match;
    }

    if (isIdentifier) {
      return match.replace(
        p1,
        columnize(value, builder, client, bindingsHolder)
      );
    }

    return match.replace(p1, client.parameter(value, builder, bindingsHolder));
  });

  return {
    method: 'raw',
    sql,
    bindings: bindingsHolder.bindings,
  };
}

module.exports = {
  replaceKeyBindings,
  replaceRawArrBindings,
};
