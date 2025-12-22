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
const HEADING_RE = /^(#{2,3})\s+(.+)$/;
const FENCE_RE = /^(```|~~~)/;
const BADGE_RE = /\s*\[((?:-[A-Z]{2}\s*)+)\]\s*$/;
const rControl = /[\u0000-\u001f]/g;
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g;
const rCombining = /[\u0300-\u036f]/g;
const DIALECT_CODES = ['PG', 'MY', 'SQ', 'MS', 'OR', 'CR', 'RS'];

export default function knexDialects(): PluginOption {
  const sqlOutputTagRegex = /<SqlOutput[\s]*code="([^"]+)"[\s]*\/>/gi;
  const codeFenceRegex = /```([a-zA-Z0-9_-]+)([^\n]*)\n([\s\S]*?)```/g;

  return {
    name: 'transform-file',
    enforce: 'pre',

    transform(src, id) {
      if (id.endsWith('.md')) {
        src = replaceBadgeTokens(src);
        const matches = src.matchAll(sqlOutputTagRegex);
        for (const match of matches) {
          let markdown = '';
          const getCode = Function('knex', `return knex.raw(${match[1]});`);
          const headingId = findNearestHeadingId(src, match.index ?? 0);

          markdown += `<div class="sql-output-group"${formatHeadingAttr(
            headingId
          )}>\n`;
          for (const [dialect, knex] of Object.entries(dialects)) {
            const { sql } = getCode(knex);
            const output = sql.toString();

            markdown += `<div class="sql-output" data-dialect="${dialect}"${formatHeadingAttr(
              headingId
            )}>\n\n\`\`\`sql\n${output}\n\`\`\`\n\n</div>\n`;
          }
          markdown += `</div>\n`;

          src = src.replace(match[0], markdown);
        }

        src = src.replace(
          codeFenceRegex,
          (match, lang, meta, code: string, offset: number): string => {
            const normalizedLang = String(lang).toLowerCase();
            if (!FENCE_LANGUAGES.has(normalizedLang)) {
              return match;
            }

            if (!SQL_MARKER_LINE.test(code)) {
              return match;
            }

            const cleanedCode = stripSqlMarkers(code);
            const fenced = `\`\`\`${lang}${meta}\n${cleanedCode}\`\`\``;
            const headingId = findNearestHeadingId(src, offset);
            const outputs = renderSqlOutputs(code, normalizedLang, headingId);
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

function replaceBadgeTokens(source: string): string {
  const lines = source.split(/\r?\n/);
  let inFence = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (FENCE_RE.test(trimmed)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }

    const headingMatch = line.match(/^(#{2,6})\s+(.+)$/);
    if (!headingMatch) {
      continue;
    }

    let text = headingMatch[2].trim();
    let explicitId: string | null = null;
    const explicitMatch = text.match(/\s*\{#([^}]+)\}\s*$/);
    if (explicitMatch) {
      explicitId = explicitMatch[1];
      text = text.replace(/\s*\{#([^}]+)\}\s*$/, '').trim();
    }

    const badgeMatch = text.match(BADGE_RE);
    if (!badgeMatch) {
      continue;
    }

    const items = badgeMatch[1]
      .trim()
      .split(/\s+/)
      .map((entry) => entry.replace(/^-/, ''))
      .filter(Boolean);
    if (!items.length) {
      continue;
    }

    const cleaned = text.replace(BADGE_RE, '').trim();
    const headingId = explicitId ?? slugify(cleaned);
    lines[i] = `${headingMatch[1]} ${cleaned} ${renderBadges(
      items
    )} {#${headingId}}`;
  }

  return lines.join('\n');
}

function renderBadges(codes: string[]): string {
  const onlyBadge = renderOnlyBadge(codes);
  if (onlyBadge) {
    return onlyBadge;
  }

  const badges = codes
    .map(
      (code) =>
        `<span class="dialect-badge" title="Not supported by ${dialectLabel(
          code
        )}">${code}</span>`
    )
    .join('');
  return `<span class="dialect-badges">${badges}</span>`;
}

function renderOnlyBadge(codes: string[]): string | null {
  const supported = DIALECT_CODES.filter((code) => !codes.includes(code));
  if (supported.length === 1) {
    const onlyCode = supported[0];
    return `<span class="dialect-badges"><span class="dialect-badge dialect-badge-only" title="Only supported by ${dialectLabel(
      onlyCode
    )}">${onlyCode} only</span></span>`;
  }
  if (supported.length === 2) {
    const [first, second] = supported;
    return `<span class="dialect-badges"><span class="dialect-badge dialect-badge-only" title="Only supported by ${dialectLabel(
      first
    )}, ${dialectLabel(second)}">${first}+${second} only</span></span>`;
  }

  return null;
}

function dialectLabel(code: string): string {
  switch (code) {
    case 'PG':
      return 'PostgreSQL';
    case 'MY':
      return 'MySQL';
    case 'SQ':
      return 'SQLite';
    case 'MS':
      return 'MSSQL';
    case 'OR':
      return 'Oracle';
    case 'CR':
      return 'CockroachDB';
    case 'RS':
      return 'Redshift';
    default:
      return code;
  }
}

function stripSqlMarkers(code: string): string {
  return code.replace(/^\s*\/\/\s*@sql\b.*(?:\r?\n|$)/gm, '');
}

function renderSqlOutputs(
  code: string,
  lang: string,
  headingId?: string | null
): string | null {
  const instrumented = instrumentMarkedStatements(code, lang);
  if (!instrumented) {
    return null;
  }

  const outputs: string[] = [];
  for (const [dialect, knex] of Object.entries(dialects)) {
    const captures = evaluateSnippet(instrumented, lang, knex);

    const chunks: RenderChunk[] = [];
    for (const capture of captures) {
      try {
        const rendered = renderCaptureOutput(capture);
        if (rendered.length) {
          chunks.push(...rendered);
        }
      } catch (error) {
        chunks.push({ type: 'error', text: formatSqlError(error) });
      }
    }

    if (!chunks.length) {
      outputs.push(
        `<div class="sql-output sql-output-empty" data-dialect="${dialect}"${formatHeadingAttr(
          headingId
        )}>No output for this dialect. Try selecting a different one.</div>`
      );
      continue;
    }

    const hasError = chunks.some((chunk) => chunk.type === 'error');
    if (hasError) {
      outputs.push(
        `<div class="sql-output" data-dialect="${dialect}"${formatHeadingAttr(
          headingId
        )}>\n\n${renderPlainOutput(chunks)}\n\n</div>`
      );
      continue;
    }

    const sqlBlocks = chunks.map((chunk) => chunk.text);
    outputs.push(
      `<div class="sql-output" data-dialect="${dialect}"${formatHeadingAttr(
        headingId
      )}>\n\n\`\`\`sql\n${sqlBlocks.join('\n\n')}\n\`\`\`\n\n</div>`
    );
  }

  if (!outputs.length) {
    return null;
  }

  return `<div class="sql-output-group"${formatHeadingAttr(
    headingId
  )}>\n${outputs.join('\n')}\n</div>\n`;
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
    const startLine = sourceFile.getLineAndCharacterOfPosition(start).line;
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
      inserts.push({
        pos: expr.getStart(sourceFile),
        text: '__capture(() => ',
      });
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
      const trx = { client: knex.client };
      trx.client.transacting = true;
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

function renderCaptureOutput(capture: Capture): RenderChunk[] {
  if ('error' in capture) {
    return [{ type: 'error', text: formatSqlError(capture.error) }];
  }

  return toSqlStrings(capture.value).map((text) => ({ type: 'sql', text }));
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
  const raw = normalized.stack || normalized.message || String(normalized);
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('at '));
  let message = lines[0] || 'Unknown error';

  if (/^Error evaluating SQL snippet$/i.test(message) && lines.length > 1) {
    message = lines[1];
  }

  if (!message.startsWith('Error:')) {
    message = `Error: ${message}`;
  }

  return message;
}

type Capture = { value: unknown } | { error: Error };

type RenderChunk = { type: 'sql' | 'error'; text: string };

function renderPlainOutput(chunks: RenderChunk[]): string {
  const body = chunks
    .map((chunk) => {
      const escaped = escapeHtml(chunk.text);
      if (chunk.type === 'error') {
        return `<span class="sql-output-error-line">${escaped}</span>`;
      }
      return escaped;
    })
    .join('\n\n');
  return `<pre class="sql-output-plain"><code>${body}</code></pre>`;
}

function formatHeadingAttr(headingId?: string | null): string {
  return headingId ? ` data-heading="${headingId}"` : '';
}

function findNearestHeadingId(source: string, offset: number): string | null {
  const prefix = source.slice(0, offset);
  const lines = prefix.split(/\r?\n/);
  let inFence = false;
  let lastHeading: { text: string; explicitId?: string } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (FENCE_RE.test(trimmed)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    const match = line.match(HEADING_RE);
    if (!match) {
      continue;
    }
    let text = match[2].trim();
    let explicitId: string | undefined;
    const explicitMatch = text.match(/\s*\{#([^}]+)\}\s*$/);
    if (explicitMatch) {
      explicitId = explicitMatch[1];
      text = text.replace(/\s*\{#([^}]+)\}\s*$/, '').trim();
    }
    text = text.replace(/\s+#+\s*$/, '').trim();
    lastHeading = { text, explicitId };
  }

  if (!lastHeading) {
    return null;
  }

  return lastHeading.explicitId ?? slugify(lastHeading.text);
}

function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(rCombining, '')
    .replace(rControl, '')
    .replace(rSpecial, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
