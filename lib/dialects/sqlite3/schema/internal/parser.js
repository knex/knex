const { tokenize } = require('./tokenizer');
const { s, a, m, o, l, n, t, e, f } = require('./parser-combinator');

const TOKENS = {
  keyword: /(?:ABORT|ADD|AFTER|ALL|ALTER|ANALYZE|AND|AS|ASC|ATTACH|AUTOINCREMENT|BEFORE|BEGIN|BETWEEN|BY|CASCADE|CASE|CAST|CHECK|COLLATE|COLUMN|COMMIT|CONFLICT|CONSTRAINT|CREATE|CROSS|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|DATABASE|DEFAULT|DEFERRED|DEFERRABLE|DELETE|DESC|DETACH|DISTINCT|DROP|END|EACH|ELSE|ESCAPE|EXCEPT|EXCLUSIVE|EXISTS|EXPLAIN|FAIL|FOR|FOREIGN|FROM|FULL|GLOB|GROUP|HAVING|IF|IGNORE|IMMEDIATE|IN|INDEX|INITIALLY|INNER|INSERT|INSTEAD|INTERSECT|INTO|IS|ISNULL|JOIN|KEY|LEFT|LIKE|LIMIT|MATCH|NATURAL|NOT|NOTNULL|NULL|OF|OFFSET|ON|OR|ORDER|OUTER|PLAN|PRAGMA|PRIMARY|QUERY|RAISE|REFERENCES|REGEXP|REINDEX|RENAME|REPLACE|RESTRICT|RIGHT|ROLLBACK|ROW|SELECT|SET|TABLE|TEMP|TEMPORARY|THEN|TO|TRANSACTION|TRIGGER|UNION|UNIQUE|UPDATE|USING|VACUUM|VALUES|VIEW|VIRTUAL|WHEN|WHERE)(?=\s+|-|\(|\)|;|\+|\*|\/|%|==|=|<=|<>|<<|<|>=|>>|>|!=|,|&|~|\|\||\||\.)/,
  id: /"[^"]*(?:""[^"]*)*"|`[^`]*(?:``[^`]*)*`|\[[^[\]]*\]|[a-z_][a-z0-9_$]*/,
  string: /'[^']*(?:''[^']*)*'/,
  blob: /x'(?:[0-9a-f][0-9a-f])+'/,
  numeric: /(?:\d+(?:\.\d*)?|\.\d+)(?:e(?:\+|-)?\d+)?|0x[0-9a-f]+/,
  variable: /\?\d*|[@$:][a-z0-9_$]+/,
  operator: /-|\(|\)|;|\+|\*|\/|%|==|=|<=|<>|<<|<|>=|>>|>|!=|,|&|~|\|\||\||\./,
  _ws: /\s+/,
};

function parseCreateIndex(sql) {
  const result = createIndex({ input: tokenize(sql, TOKENS) });

  if (!result.success) {
    throw new Error(
      `Parsing CREATE INDEX failed at: [${result.input
        .slice(result.index)
        .map((t) => t.text)
        .join(' ')}]`
    );
  }

  return result.ast;
}

function createIndex(ctx) {
  return s(
    [
      t({ text: 'CREATE' }, (v) => null),
      unique,
      t({ text: 'INDEX' }, (v) => null),
      exists,
      schema,
      index,
      t({ text: 'ON' }, (v) => null),
      table,
      t({ text: '(' }, (v) => null),
      indexedColumnList,
      t({ text: ')' }, (v) => null),
      where,
      f,
    ],
    (v) => Object.assign({}, ...v.filter((x) => x !== null))
  )(ctx);
}

function unique(ctx) {
  return o(t({ text: 'UNIQUE' }), (v) => ({ unique: v !== null }))(ctx);
}

function exists(ctx) {
  return o(
    s([t({ text: 'IF' }), t({ text: 'NOT' }), t({ text: 'EXISTS' })]),
    (v) => ({ exists: v !== null })
  )(ctx);
}

function schema(ctx) {
  return o(
    s([identifier, t({ text: '.' })], (v) => v[0]),
    (v) => ({ schema: v })
  )(ctx);
}

function index(ctx) {
  return s([identifier], (v) => ({ index: v[0] }))(ctx);
}

function table(ctx) {
  return s([identifier], (v) => ({ table: v[0] }))(ctx);
}

function where(ctx) {
  return o(
    s([t({ text: 'WHERE' }), expression], (v) => v[1]),
    (v) => ({ where: v })
  )(ctx);
}

function indexedColumnList(ctx) {
  return a([
    s([indexedColumn, t({ text: ',' }), indexedColumnList], (v) => ({
      columns: [v[0]].concat(v[2].columns),
    })),
    s([indexedColumnExpression, t({ text: ',' }), indexedColumnList], (v) => ({
      columns: [v[0]].concat(v[2].columns),
    })),
    l({ do: indexedColumn, next: t({ text: ')' }) }, (v) => ({
      columns: [v],
    })),
    l({ do: indexedColumnExpression, next: t({ text: ')' }) }, (v) => ({
      columns: [v],
    })),
  ])(ctx);
}

function indexedColumn(ctx) {
  return s(
    [
      s([identifier], (v) => ({ name: v[0], expression: false })),
      collation,
      order,
    ],
    (v) => Object.assign({}, ...v.filter((x) => x !== null))
  )(ctx);
}

function indexedColumnExpression(ctx) {
  return s(
    [
      s([indexedExpression], (v) => ({ name: v[0], expression: true })),
      collation,
      order,
    ],
    (v) => Object.assign({}, ...v.filter((x) => x !== null))
  )(ctx);
}

function collation(ctx) {
  return o(
    s([t({ text: 'COLLATE' }), identifier], (v) => v[1]),
    (v) => ({ collation: v })
  )(ctx);
}

function order(ctx) {
  return a([t({ text: 'ASC' }), t({ text: 'DESC' }), e], (v) => ({
    order: v ? v.toUpperCase() : null,
  }))(ctx);
}

function indexedExpression(ctx) {
  return m(
    a([
      n({
        do: t({ type: 'keyword' }),
        not: a([
          t({ text: 'COLLATE' }),
          t({ text: 'ASC' }),
          t({ text: 'DESC' }),
        ]),
      }),
      t({ type: 'id' }),
      t({ type: 'string' }),
      t({ type: 'blob' }),
      t({ type: 'numeric' }),
      t({ type: 'variable' }),
      n({
        do: t({ type: 'operator' }),
        not: a([t({ text: '(' }), t({ text: ')' }), t({ text: ',' })]),
      }),
      s([t({ text: '(' }), o(expression), t({ text: ')' })], (v) => v[1] || []),
    ])
  )(ctx);
}

function expression(ctx) {
  return m(
    a([
      t({ type: 'keyword' }),
      t({ type: 'id' }),
      t({ type: 'string' }),
      t({ type: 'blob' }),
      t({ type: 'numeric' }),
      t({ type: 'variable' }),
      n({
        do: t({ type: 'operator' }),
        not: a([t({ text: '(' }), t({ text: ')' })]),
      }),
      s([t({ text: '(' }), o(expression), t({ text: ')' })], (v) => v[1] || []),
    ])
  )(ctx);
}

function identifier(ctx) {
  return t({ type: 'id' }, (v) =>
    /^["`[][^]*["`\]]$/.test(v.text)
      ? v.text.substring(1, v.text.length - 1)
      : v.text
  )(ctx);
}

module.exports = {
  parseCreateIndex,
};
