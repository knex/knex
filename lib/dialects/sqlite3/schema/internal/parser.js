const { tokenize } = require('./tokenizer');
const { s, a, m, o, l, n, t, e, f } = require('./parser-combinator');

const TOKENS = {
  keyword:
    /(?:ABORT|ACTION|ADD|AFTER|ALL|ALTER|ALWAYS|ANALYZE|AND|AS|ASC|ATTACH|AUTOINCREMENT|BEFORE|BEGIN|BETWEEN|BY|CASCADE|CASE|CAST|CHECK|COLLATE|COLUMN|COMMIT|CONFLICT|CONSTRAINT|CREATE|CROSS|CURRENT|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|DATABASE|DEFAULT|DEFERRED|DEFERRABLE|DELETE|DESC|DETACH|DISTINCT|DO|DROP|END|EACH|ELSE|ESCAPE|EXCEPT|EXCLUSIVE|EXCLUDE|EXISTS|EXPLAIN|FAIL|FILTER|FIRST|FOLLOWING|FOR|FOREIGN|FROM|FULL|GENERATED|GLOB|GROUP|GROUPS|HAVING|IF|IGNORE|IMMEDIATE|IN|INDEX|INDEXED|INITIALLY|INNER|INSERT|INSTEAD|INTERSECT|INTO|IS|ISNULL|JOIN|KEY|LAST|LEFT|LIKE|LIMIT|MATCH|MATERIALIZED|NATURAL|NO|NOT|NOTHING|NOTNULL|NULL|NULLS|OF|OFFSET|ON|OR|ORDER|OTHERS|OUTER|OVER|PARTITION|PLAN|PRAGMA|PRECEDING|PRIMARY|QUERY|RAISE|RANGE|RECURSIVE|REFERENCES|REGEXP|REINDEX|RELEASE|RENAME|REPLACE|RESTRICT|RETURNING|RIGHT|ROLLBACK|ROW|ROWS|SAVEPOINT|SELECT|SET|TABLE|TEMP|TEMPORARY|THEN|TIES|TO|TRANSACTION|TRIGGER|UNBOUNDED|UNION|UNIQUE|UPDATE|USING|VACUUM|VALUES|VIEW|VIRTUAL|WHEN|WHERE|WINDOW|WITH|WITHOUT)(?=\s+|-|\(|\)|;|\+|\*|\/|%|==|=|<=|<>|<<|<|>=|>>|>|!=|,|&|~|\|\||\||\.)/,
  id: /"[^"]*(?:""[^"]*)*"|`[^`]*(?:``[^`]*)*`|\[[^[\]]*\]|[a-z_][a-z0-9_$]*/,
  string: /'[^']*(?:''[^']*)*'/,
  blob: /x'(?:[0-9a-f][0-9a-f])+'/,
  numeric: /(?:\d+(?:\.\d*)?|\.\d+)(?:e(?:\+|-)?\d+)?|0x[0-9a-f]+/,
  variable: /\?\d*|[@$:][a-z0-9_$]+/,
  operator: /-|\(|\)|;|\+|\*|\/|%|==|=|<=|<>|<<|<|>=|>>|>|!=|,|&|~|\|\||\||\./,
  _ws: /\s+/,
};

function parseCreateTable(sql) {
  const result = createTable({ input: tokenize(sql, TOKENS) });

  if (!result.success) {
    throw new Error(
      `Parsing CREATE TABLE failed at [${result.input
        .slice(result.index)
        .map((t) => t.text)
        .join(' ')}] of "${sql}"`
    );
  }

  return result.ast;
}

function parseCreateIndex(sql) {
  const result = createIndex({ input: tokenize(sql, TOKENS) });

  if (!result.success) {
    throw new Error(
      `Parsing CREATE INDEX failed at [${result.input
        .slice(result.index)
        .map((t) => t.text)
        .join(' ')}] of "${sql}"`
    );
  }

  return result.ast;
}

function createTable(ctx) {
  return s(
    [
      t({ text: 'CREATE' }, (v) => null),
      temporary,
      t({ text: 'TABLE' }, (v) => null),
      exists,
      schema,
      table,
      t({ text: '(' }, (v) => null),
      columnDefinitionList,
      tableConstraintList,
      t({ text: ')' }, (v) => null),
      rowid,
      f,
    ],
    (v) => Object.assign({}, ...v.filter((x) => x !== null))
  )(ctx);
}

function temporary(ctx) {
  return a([t({ text: 'TEMP' }), t({ text: 'TEMPORARY' }), e], (v) => ({
    temporary: v !== null,
  }))(ctx);
}

function rowid(ctx) {
  return o(s([t({ text: 'WITHOUT' }), t({ text: 'ROWID' })]), (v) => ({
    rowid: v !== null,
  }))(ctx);
}

function columnDefinitionList(ctx) {
  return a([
    s([columnDefinition, t({ text: ',' }), columnDefinitionList], (v) => ({
      columns: [v[0]].concat(v[2].columns),
    })),
    s([columnDefinition], (v) => ({ columns: [v[0]] })),
  ])(ctx);
}

function columnDefinition(ctx) {
  return s(
    [s([identifier], (v) => ({ name: v[0] })), typeName, columnConstraintList],
    (v) => Object.assign({}, ...v)
  )(ctx);
}

function typeName(ctx) {
  return o(
    s(
      [
        m(t({ type: 'id' })),
        a([
          s(
            [
              t({ text: '(' }),
              signedNumber,
              t({ text: ',' }),
              signedNumber,
              t({ text: ')' }),
            ],
            (v) => `(${v[1]}, ${v[3]})`
          ),
          s(
            [t({ text: '(' }), signedNumber, t({ text: ')' })],
            (v) => `(${v[1]})`
          ),
          e,
        ]),
      ],
      (v) => `${v[0].join(' ')}${v[1] || ''}`
    ),
    (v) => ({ type: v })
  )(ctx);
}

function columnConstraintList(ctx) {
  return o(m(columnConstraint), (v) => ({
    constraints: Object.assign(
      {
        primary: null,
        notnull: null,
        null: null,
        unique: null,
        check: null,
        default: null,
        collate: null,
        references: null,
        as: null,
      },
      ...(v || [])
    ),
  }))(ctx);
}

function columnConstraint(ctx) {
  return a([
    primaryColumnConstraint,
    notnullColumnConstraint,
    nullColumnConstraint,
    uniqueColumnConstraint,
    checkColumnConstraint,
    defaultColumnConstraint,
    collateColumnConstraint,
    referencesColumnConstraint,
    asColumnConstraint,
  ])(ctx);
}

function primaryColumnConstraint(ctx) {
  return s(
    [
      constraintName,
      t({ text: 'PRIMARY' }, (v) => null),
      t({ text: 'KEY' }, (v) => null),
      order,
      conflictClause,
      autoincrement,
    ],
    (v) => ({ primary: Object.assign({}, ...v.filter((x) => x !== null)) })
  )(ctx);
}

function autoincrement(ctx) {
  return o(t({ text: 'AUTOINCREMENT' }), (v) => ({
    autoincrement: v !== null,
  }))(ctx);
}

function notnullColumnConstraint(ctx) {
  return s(
    [
      constraintName,
      t({ text: 'NOT' }, (v) => null),
      t({ text: 'NULL' }, (v) => null),
      conflictClause,
    ],
    (v) => ({ notnull: Object.assign({}, ...v.filter((x) => x !== null)) })
  )(ctx);
}

function nullColumnConstraint(ctx) {
  return s(
    [constraintName, t({ text: 'NULL' }, (v) => null), conflictClause],
    (v) => ({ null: Object.assign({}, ...v.filter((x) => x !== null)) })
  )(ctx);
}

function uniqueColumnConstraint(ctx) {
  return s(
    [constraintName, t({ text: 'UNIQUE' }, (v) => null), conflictClause],
    (v) => ({ unique: Object.assign({}, ...v.filter((x) => x !== null)) })
  )(ctx);
}

function checkColumnConstraint(ctx) {
  return s(
    [
      constraintName,
      t({ text: 'CHECK' }, (v) => null),
      t({ text: '(' }, (v) => null),
      s([expression], (v) => ({ expression: v[0] })),
      t({ text: ')' }, (v) => null),
    ],
    (v) => ({ check: Object.assign({}, ...v.filter((x) => x !== null)) })
  )(ctx);
}

function defaultColumnConstraint(ctx) {
  return s(
    [
      constraintName,
      t({ text: 'DEFAULT' }, (v) => null),
      a([
        s([t({ text: '(' }), expression, t({ text: ')' })], (v) => ({
          value: v[1],
          expression: true,
        })),
        s([literalValue], (v) => ({ value: v[0], expression: false })),
        s([signedNumber], (v) => ({ value: v[0], expression: false })),
      ]),
    ],
    (v) => ({ default: Object.assign({}, ...v.filter((x) => x !== null)) })
  )(ctx);
}

function collateColumnConstraint(ctx) {
  return s(
    [
      constraintName,
      t({ text: 'COLLATE' }, (v) => null),
      t({ type: 'id' }, (v) => ({ collation: v.text })),
    ],
    (v) => ({ collate: Object.assign({}, ...v.filter((x) => x !== null)) })
  )(ctx);
}

function referencesColumnConstraint(ctx) {
  return s(
    [constraintName, s([foreignKeyClause], (v) => v[0].references)],
    (v) => ({
      references: Object.assign({}, ...v.filter((x) => x !== null)),
    })
  )(ctx);
}

function asColumnConstraint(ctx) {
  return s(
    [
      constraintName,
      o(s([t({ text: 'GENERATED' }), t({ text: 'ALWAYS' })]), (v) => ({
        generated: v !== null,
      })),
      t({ text: 'AS' }, (v) => null),
      t({ text: '(' }, (v) => null),
      s([expression], (v) => ({ expression: v[0] })),
      t({ text: ')' }, (v) => null),
      a([t({ text: 'STORED' }), t({ text: 'VIRTUAL' }), e], (v) => ({
        mode: v ? v.toUpperCase() : null,
      })),
    ],
    (v) => ({ as: Object.assign({}, ...v.filter((x) => x !== null)) })
  )(ctx);
}

function tableConstraintList(ctx) {
  return o(m(s([t({ text: ',' }), tableConstraint], (v) => v[1])), (v) => ({
    constraints: v || [],
  }))(ctx);
}

function tableConstraint(ctx) {
  return a([
    primaryTableConstraint,
    uniqueTableConstraint,
    checkTableConstraint,
    foreignTableConstraint,
  ])(ctx);
}

function primaryTableConstraint(ctx) {
  return s(
    [
      constraintName,
      t({ text: 'PRIMARY' }, (v) => null),
      t({ text: 'KEY' }, (v) => null),
      t({ text: '(' }, (v) => null),
      indexedColumnList,
      t({ text: ')' }, (v) => null),
      conflictClause,
    ],
    (v) =>
      Object.assign({ type: 'PRIMARY KEY' }, ...v.filter((x) => x !== null))
  )(ctx);
}

function uniqueTableConstraint(ctx) {
  return s(
    [
      constraintName,
      t({ text: 'UNIQUE' }, (v) => null),
      t({ text: '(' }, (v) => null),
      indexedColumnList,
      t({ text: ')' }, (v) => null),
      conflictClause,
    ],
    (v) => Object.assign({ type: 'UNIQUE' }, ...v.filter((x) => x !== null))
  )(ctx);
}

function conflictClause(ctx) {
  return o(
    s(
      [
        t({ text: 'ON' }),
        t({ text: 'CONFLICT' }),
        a([
          t({ text: 'ROLLBACK' }),
          t({ text: 'ABORT' }),
          t({ text: 'FAIL' }),
          t({ text: 'IGNORE' }),
          t({ text: 'REPLACE' }),
        ]),
      ],
      (v) => v[2]
    ),
    (v) => ({ conflict: v ? v.toUpperCase() : null })
  )(ctx);
}

function checkTableConstraint(ctx) {
  return s(
    [
      constraintName,
      t({ text: 'CHECK' }, (v) => null),
      t({ text: '(' }, (v) => null),
      s([expression], (v) => ({ expression: v[0] })),
      t({ text: ')' }, (v) => null),
    ],
    (v) => Object.assign({ type: 'CHECK' }, ...v.filter((x) => x !== null))
  )(ctx);
}

function foreignTableConstraint(ctx) {
  return s(
    [
      constraintName,
      t({ text: 'FOREIGN' }, (v) => null),
      t({ text: 'KEY' }, (v) => null),
      t({ text: '(' }, (v) => null),
      columnNameList,
      t({ text: ')' }, (v) => null),
      foreignKeyClause,
    ],
    (v) =>
      Object.assign({ type: 'FOREIGN KEY' }, ...v.filter((x) => x !== null))
  )(ctx);
}

function foreignKeyClause(ctx) {
  return s(
    [
      t({ text: 'REFERENCES' }, (v) => null),
      table,
      columnNameListOptional,
      o(m(a([deleteReference, updateReference, matchReference])), (v) =>
        Object.assign({ delete: null, update: null, match: null }, ...(v || []))
      ),
      deferrable,
    ],
    (v) => ({ references: Object.assign({}, ...v.filter((x) => x !== null)) })
  )(ctx);
}

function columnNameListOptional(ctx) {
  return o(
    s([t({ text: '(' }), columnNameList, t({ text: ')' })], (v) => v[1]),
    (v) => ({ columns: v ? v.columns : [] })
  )(ctx);
}

function columnNameList(ctx) {
  return s(
    [
      o(m(s([identifier, t({ text: ',' })], (v) => v[0])), (v) =>
        v !== null ? v : []
      ),
      identifier,
    ],
    (v) => ({ columns: v[0].concat([v[1]]) })
  )(ctx);
}

function deleteReference(ctx) {
  return s([t({ text: 'ON' }), t({ text: 'DELETE' }), onAction], (v) => ({
    delete: v[2],
  }))(ctx);
}

function updateReference(ctx) {
  return s([t({ text: 'ON' }), t({ text: 'UPDATE' }), onAction], (v) => ({
    update: v[2],
  }))(ctx);
}

function matchReference(ctx) {
  return s(
    [t({ text: 'MATCH' }), a([t({ type: 'keyword' }), t({ type: 'id' })])],
    (v) => ({ match: v[1] })
  )(ctx);
}

function deferrable(ctx) {
  return o(
    s([
      o(t({ text: 'NOT' })),
      t({ text: 'DEFERRABLE' }),
      o(
        s(
          [
            t({ text: 'INITIALLY' }),
            a([t({ text: 'DEFERRED' }), t({ text: 'IMMEDIATE' })]),
          ],
          (v) => v[1].toUpperCase()
        )
      ),
    ]),
    (v) => ({ deferrable: v ? { not: v[0] !== null, initially: v[2] } : null })
  )(ctx);
}

function constraintName(ctx) {
  return o(
    s([t({ text: 'CONSTRAINT' }), identifier], (v) => v[1]),
    (v) => ({ name: v })
  )(ctx);
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
    s([t({ text: 'COLLATE' }), t({ type: 'id' })], (v) => v[1]),
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
  return a([t({ type: 'id' }), t({ type: 'string' })], (v) =>
    /^["`['][^]*["`\]']$/.test(v) ? v.substring(1, v.length - 1) : v
  )(ctx);
}

function onAction(ctx) {
  return a(
    [
      s([t({ text: 'SET' }), t({ text: 'NULL' })], (v) => `${v[0]} ${v[1]}`),
      s([t({ text: 'SET' }), t({ text: 'DEFAULT' })], (v) => `${v[0]} ${v[1]}`),
      t({ text: 'CASCADE' }),
      t({ text: 'RESTRICT' }),
      s([t({ text: 'NO' }), t({ text: 'ACTION' })], (v) => `${v[0]} ${v[1]}`),
    ],
    (v) => v.toUpperCase()
  )(ctx);
}

function literalValue(ctx) {
  return a([
    t({ type: 'numeric' }),
    t({ type: 'string' }),
    t({ type: 'id' }),
    t({ type: 'blob' }),
    t({ text: 'NULL' }),
    t({ text: 'TRUE' }),
    t({ text: 'FALSE' }),
    t({ text: 'CURRENT_TIME' }),
    t({ text: 'CURRENT_DATE' }),
    t({ text: 'CURRENT_TIMESTAMP' }),
  ])(ctx);
}

function signedNumber(ctx) {
  return s(
    [a([t({ text: '+' }), t({ text: '-' }), e]), t({ type: 'numeric' })],
    (v) => `${v[0] || ''}${v[1]}`
  )(ctx);
}

module.exports = {
  parseCreateTable,
  parseCreateIndex,
};
