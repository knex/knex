import Knex from 'knex';
import type { PluginOption } from 'vite';
import * as ts from 'typescript';

const dialects = {
  'better-sqlite3': Knex({ client: 'better-sqlite3' }),
  cockroachdb: Knex({ client: 'cockroachdb' }),
  mssql: Knex({ client: 'mssql' }),
  mysql: Knex({ client: 'mysql' }),
  mysql2: Knex({ client: 'mysql2' }),
  oracledb: Knex({ client: 'oracledb' }),
  pgnative: Knex({ client: 'pgnative' }),
  postgres: Knex({ client: 'postgres' }),
  redshift: Knex({ client: 'redshift' }),
  sqlite3: Knex({ client: 'sqlite3' }),
};

const SQL_MARKER_LINE = /^\s*\/\/\s*@sql\b/m;
const FENCE_LANGUAGES = new Set(['js', 'javascript', 'ts', 'typescript']);
const ERROR_STACK_LINES = 3;

export default function knexDialects(): PluginOption {
  const sqlOutputTagRegex = /<SqlOutput[\s]*code="([^"]+)"[\s]*\/>/gi;
  const codeFenceRegex = /```([a-zA-Z0-9_-]+)([^\n]*)\n([\s\S]*?)```/g;

  return {
    name: 'transform-file',
    enforce: 'pre',

    transform(src, id) {
      if (id.endsWith('.md')) {
        const matches = src.matchAll(sqlOutputTagRegex);
        for (const match of matches) {
          let markdown = '';
          const getCode = Function('knex', `return knex.raw(${match[1]});`);

          for (const [dialect, knex] of Object.entries(dialects)) {
            const { sql } = getCode(knex);
            const output = sql.toString();

            markdown += `<div class="sql-output" data-dialect="${dialect}">\n\n\`\`\`sql\n${output}\n\`\`\`\n\n</div>\n`;
          }

          src = src.replace(match[0], markdown);
        }

        src = src.replace(
          codeFenceRegex,
          (match, lang, meta, code: string): string => {
            const normalizedLang = String(lang).toLowerCase();
            if (!FENCE_LANGUAGES.has(normalizedLang)) {
              return match;
            }

            if (!SQL_MARKER_LINE.test(code)) {
              return match;
            }

            const cleanedCode = stripSqlMarkers(code);
            const fenced = `\`\`\`${lang}${meta}\n${cleanedCode}\`\`\``;
            const outputs = renderSqlOutputs(code, normalizedLang);
            if (!outputs) {
              return fenced;
            }

            return `${fenced}\n\n${outputs}`;
          }
        );
      }

      return src;
    },
  };
}

function stripSqlMarkers(code: string): string {
  return code.replace(/^\s*\/\/\s*@sql\b.*(?:\r?\n|$)/gm, '');
}

function renderSqlOutputs(code: string, lang: string): string | null {
  const instrumented = instrumentMarkedStatements(code, lang);
  if (!instrumented) {
    return null;
  }

  const outputs: string[] = [];
  for (const [dialect, knex] of Object.entries(dialects)) {
    const captures = evaluateSnippet(instrumented, lang, knex);

    const sqlBlocks: string[] = [];
    for (const capture of captures) {
      try {
        const rendered = renderCaptureOutput(capture);
        if (rendered.length) {
          sqlBlocks.push(...rendered);
        }
      } catch (error) {
        sqlBlocks.push(formatSqlError(error));
      }
    }

    if (!sqlBlocks.length) {
      continue;
    }

    outputs.push(
      `<div class="sql-output" data-dialect="${dialect}">\n\n\`\`\`sql\n${sqlBlocks.join(
        '\n\n'
      )}\n\`\`\`\n\n</div>`
    );
  }

  if (!outputs.length) {
    return null;
  }

  return `${outputs.join('\n')}\n`;
}

function instrumentMarkedStatements(code: string, lang: string): string | null {
  const markerLines = findMarkerLines(code);
  if (!markerLines.length) {
    return null;
  }

  const scriptKind = isTypeScript(lang) ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  const sourceFile = ts.createSourceFile(
    'snippet',
    code,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );

  const statementInfos = sourceFile.statements.map((statement) => {
    const start = statement.getStart(sourceFile);
    const startLine =
      sourceFile.getLineAndCharacterOfPosition(start).line;
    return {
      statement,
      startLine,
    };
  });

  const markedIndices = mapMarkersToStatements(markerLines, statementInfos);
  if (!markedIndices.length) {
    return null;
  }

  const inserts: Array<{ pos: number; text: string }> = [];
  let captures = 0;

  for (const index of markedIndices) {
    const statement = statementInfos[index]?.statement;
    if (!statement) {
      continue;
    }

    if (ts.isExpressionStatement(statement)) {
      const expr = statement.expression;
      inserts.push({ pos: expr.getStart(sourceFile), text: '__capture(() => ' });
      inserts.push({ pos: expr.getEnd(), text: ')' });
      captures += 1;
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      const declarations = statement.declarationList.declarations;
      if (declarations.length !== 1) {
        continue;
      }
      const initializer = declarations[0].initializer;
      if (!initializer) {
        continue;
      }
      inserts.push({
        pos: initializer.getStart(sourceFile),
        text: '__capture(() => ',
      });
      inserts.push({ pos: initializer.getEnd(), text: ')' });
      captures += 1;
    }
  }

  if (!captures) {
    return null;
  }

  return applyInserts(code, inserts);
}

function findMarkerLines(code: string): number[] {
  const lines = code.split(/\r?\n/);
  const markers: number[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (SQL_MARKER_LINE.test(lines[i])) {
      markers.push(i);
    }
  }
  return markers;
}

function mapMarkersToStatements(
  markerLines: number[],
  statementInfos: Array<{ startLine: number }>
): number[] {
  const indices: number[] = [];
  let statementIndex = 0;

  for (const markerLine of markerLines) {
    while (
      statementIndex < statementInfos.length &&
      statementInfos[statementIndex].startLine <= markerLine
    ) {
      statementIndex += 1;
    }

    if (statementIndex < statementInfos.length) {
      indices.push(statementIndex);
      statementIndex += 1;
    }
  }

  return indices;
}

function applyInserts(
  source: string,
  inserts: Array<{ pos: number; text: string }>
): string {
  const ordered = inserts
    .slice()
    .sort((a, b) => (a.pos === b.pos ? 0 : b.pos - a.pos));
  let output = source;

  for (const insert of ordered) {
    output = `${output.slice(0, insert.pos)}${insert.text}${output.slice(
      insert.pos
    )}`;
  }

  return output;
}

function evaluateSnippet(
  code: string,
  lang: string,
  knex: Knex.Knex
): Capture[] {
  try {
    const jsCode = isTypeScript(lang)
      ? ts.transpileModule(code, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2019,
            module: ts.ModuleKind.CommonJS,
          },
        }).outputText
      : code;
    const fn = new Function(
      'knex',
      `"use strict";
      const captures = [];
      const __capture = (fn) => {
        try {
          const value = fn();
          captures.push({ value });
          return value;
        } catch (error) {
          captures.push({ error });
          return undefined;
        }
      };
      try {
        ${jsCode}
        return { captures, error: null };
      } catch (error) {
        return { captures, error };
      }`
    );
    const result = fn(knex) as {
      captures?: unknown[];
      error?: unknown;
    };
    const captures = Array.isArray(result?.captures)
      ? result.captures.map(normalizeCapture)
      : [];
    if (result?.error) {
      captures.push({ error: normalizeError(result.error) });
    }
    return captures;
  } catch (error) {
    return [{ error: normalizeError(error) }];
  }
}

function isTypeScript(lang: string): boolean {
  return lang === 'ts' || lang === 'typescript';
}

function renderCaptureOutput(capture: Capture): string[] {
  if ('error' in capture) {
    return [formatSqlError(capture.error)];
  }

  return toSqlStrings(capture.value);
}

function toSqlStrings(value: unknown): string[] {
  if (
    !value ||
    typeof (value as { toSQL?: () => unknown }).toSQL !== 'function'
  ) {
    return [];
  }

  const sqlValue = (value as { toSQL: () => unknown }).toSQL();
  if (Array.isArray(sqlValue)) {
    return sqlValue
      .map((entry) => getSqlEntry(entry))
      .filter((sql): sql is string => typeof sql === 'string');
  }

  const singleSql = getSqlEntry(sqlValue);
  if (singleSql) {
    return [singleSql];
  }

  if (typeof (value as { toString?: () => string }).toString === 'function') {
    return [String(value.toString())];
  }

  return [];
}

function getSqlEntry(entry: unknown): string | null {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  if ('sql' in entry && typeof (entry as { sql: unknown }).sql === 'string') {
    return (entry as { sql: string }).sql;
  }

  return null;
}

function normalizeCapture(capture: unknown): Capture {
  if (capture && typeof capture === 'object' && 'error' in capture) {
    return { error: normalizeError((capture as { error: unknown }).error) };
  }

  if (capture && typeof capture === 'object' && 'value' in capture) {
    return { value: (capture as { value: unknown }).value };
  }

  return { value: capture };
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

function formatSqlError(error: unknown): string {
  const normalized = normalizeError(error);
  const lines = ['-- Error evaluating SQL snippet'];

  if (normalized.message) {
    for (const line of normalized.message.split(/\r?\n/)) {
      if (line.trim()) {
        lines.push(`-- ${line}`);
      }
    }
  }

  if (normalized.stack) {
    const stackLines = normalized.stack.split(/\r?\n/).slice(1, 1 + ERROR_STACK_LINES);
    for (const line of stackLines) {
      if (line.trim()) {
        lines.push(`-- ${line.trim()}`);
      }
    }
  }

  return lines.join('\n');
}

type Capture = { value: unknown } | { error: Error };
