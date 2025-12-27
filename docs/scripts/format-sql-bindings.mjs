const DIALECT_PLACEHOLDER_STYLE = new Map([
  ['mysql', 'question'],
  ['mysql2', 'question'],
  ['sqlite3', 'question'],
  ['better-sqlite3', 'question'],
  ['postgres', 'dollar'],
  ['postgresql', 'dollar'],
  ['cockroachdb', 'dollar'],
  ['redshift', 'dollar'],
  ['mssql', 'at'],
  ['oracledb', 'colon'],
  ['oracle', 'colon'],
]);

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

function getPlaceholderStyle(dialect) {
  const style = DIALECT_PLACEHOLDER_STYLE.get(dialect);
  if (!style) {
    throw new Error(`Unknown dialect for SQL bindings: ${dialect}`);
  }
  return style;
}

function replaceNumberedPlaceholders(sql, bindings, escape, regex, baseIndex) {
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

function formatPositionalBindings(sql, bindings, escape, style) {
  if (style === 'dollar') {
    return replaceNumberedPlaceholders(sql, bindings, escape, /\$(\d+)/g, 1);
  }
  if (style === 'colon') {
    return replaceNumberedPlaceholders(sql, bindings, escape, /:(\d+)/g, 1);
  }
  if (style === 'at') {
    return replaceNumberedPlaceholders(sql, bindings, escape, /@p(\d+)/gi, 0);
  }
  return null;
}

export default function formatSqlWithBindings(sql, bindings, dialect, knex) {
  if (!dialect) {
    throw new Error('formatSqlWithBindings requires a dialect');
  }

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

  const style = getPlaceholderStyle(dialect);

  if (hasQuestionBindings(sql)) {
    return knex.raw(sql, bindings).toString();
  }

  if (Array.isArray(bindings)) {
    const client = knex?.client;
    if (!client || typeof client._escapeBinding !== 'function') {
      return sql;
    }
    const escape = (value) => client._escapeBinding(value, {});
    const formatted = formatPositionalBindings(sql, bindings, escape, style);
    if (formatted) {
      return formatted;
    }
  }

  return sql;
}
