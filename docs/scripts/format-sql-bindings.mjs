const PLACEHOLDER_STYLE_CACHE = new WeakMap();

function hasQuestionBindings(sql) {
  const regex = /\\?\?\??/g;
  let match = null;
  while ((match = regex.exec(sql)) !== null) {
    if (match[0] !== '\\?') {
      return true;
    }
  }
  return false;
}

function getPlaceholderStyle(knex) {
  const client = knex?.client;
  if (!client || typeof client.positionBindings !== 'function') {
    return 'question';
  }

  const cached = PLACEHOLDER_STYLE_CACHE.get(client);
  if (cached) {
    return cached;
  }

  const sample = client.positionBindings('select ? as a, ? as b');
  let style = 'question';
  if (/\$1\b/.test(sample)) {
    style = 'dollar';
  } else if (/:1\b/.test(sample)) {
    style = 'colon';
  } else if (/@p0\b/i.test(sample)) {
    style = 'at';
  }
  PLACEHOLDER_STYLE_CACHE.set(client, style);
  return style;
}

function replaceNumberedPlaceholders(
  sql,
  bindings,
  escape,
  regex,
  baseIndex
) {
  let replaced = false;
  const output = sql.replace(regex, (match, rawIndex) => {
    const parsed = Number(rawIndex);
    if (!Number.isFinite(parsed)) {
      return match;
    }
    const index = parsed - baseIndex;
    if (index < 0 || index >= bindings.length) {
      return match;
    }
    replaced = true;
    return escape(bindings[index]);
  });
  return replaced ? output : null;
}

function formatPositionalBindings(sql, bindings, knex) {
  const client = knex?.client;
  if (!client || typeof client._escapeBinding !== 'function') {
    return null;
  }

  const style = getPlaceholderStyle(knex);
  const escape = (value) => client._escapeBinding(value, {});

  if (style === 'dollar') {
    return replaceNumberedPlaceholders(
      sql,
      bindings,
      escape,
      /\$(\d+)/g,
      1
    );
  }
  if (style === 'colon') {
    return replaceNumberedPlaceholders(
      sql,
      bindings,
      escape,
      /:(\d+)/g,
      1
    );
  }
  if (style === 'at') {
    return replaceNumberedPlaceholders(
      sql,
      bindings,
      escape,
      /@p(\d+)/gi,
      0
    );
  }

  return null;
}

export default function formatSqlWithBindings(sql, bindings, knex) {
  if (!bindings) {
    return sql;
  }

  if (Array.isArray(bindings)) {
    if (bindings.length === 0) {
      return sql;
    }
  } else if (typeof bindings === 'object') {
    if (Object.keys(bindings).length === 0) {
      return sql;
    }
  } else {
    return sql;
  }

  if (!knex || typeof knex.raw !== 'function') {
    return sql;
  }

  if (hasQuestionBindings(sql)) {
    return knex.raw(sql, bindings).toString();
  }

  if (Array.isArray(bindings)) {
    const formatted = formatPositionalBindings(sql, bindings, knex);
    if (formatted) {
      return formatted;
    }
  }

  return sql;
}
