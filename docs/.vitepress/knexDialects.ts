import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Knex from 'knex';
import type { PluginOption } from 'vite';
import { renderBadges } from './badges';
import { slugify } from './slugify';
import {
  evaluateSnippet,
  formatSqlError,
  instrumentMarkedStatements,
} from '../scripts/snippet-utils.mjs';

const dialects = {
  cockroachdb: Knex({ client: 'cockroachdb' }),
  mssql: Knex({ client: 'mssql' }),
  mysql: Knex({ client: 'mysql' }),
  oracledb: Knex({ client: 'oracledb' }),
  postgres: Knex({ client: 'postgres' }),
  redshift: Knex({ client: 'redshift' }),
  sqlite3: Knex({
    client: 'sqlite3',
    connection: { filename: ':memory:' },
    useNullAsDefault: true,
  }),
};

const SQL_MARKER_LINE = /^\s*\/\/\s*@sql\b/m;
const FENCE_LANGUAGES = new Set(['js', 'ts']);
const CODE_FENCE_RE = /```([a-zA-Z0-9_-]+)([^\n]*)\n([\s\S]*?)```/g;
const HEADING_RE = /^(#{2,3})\s+(.+)$/;
const FENCE_RE = /^```/;
const BADGE_RE = /\s*\[((?:[~-][A-Z]{2}\s*)+)\]\s*$/;
const RESOLVED_SNIPPETS_VERSION = 1;
const MISSING_SNIPPET_MESSAGE = 'Snippet not available.';
const SQL_OUTPUT_SEPARATOR = '-- ----';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
// Schema builder snippets are resolved ahead of time because some dialects need live introspection.
const schemaDocKey = path.posix.join(
  'docs',
  'src',
  'guide',
  'schema-builder.md'
);
const resolvedSnippetsPath = path.resolve(
  repoRoot,
  'docs',
  'generated',
  'schema-snippets.json'
);

export default function knexDialects(): PluginOption {
  return {
    name: 'transform-file',
    enforce: 'pre',

    async transform(src, id) {
      const cleanId = id.split('?')[0];
      if (cleanId.endsWith('.md')) {
        src = replaceBadgeTokens(src);
        const relativeId = path
          .relative(repoRoot, cleanId)
          .split(path.sep)
          .join('/');
        const isSchemaBuilderDoc = relativeId === schemaDocKey;
        const resolvedSnippets = isSchemaBuilderDoc
          ? safeLoadResolvedSnippets((message) => this.warn(message))
          : null;

        let sqlFenceIndex = 0; // Keep in sync with the resolver's fence ordering.
        src = await replaceCodeFences(
          src,
          CODE_FENCE_RE,
          async (match, lang, meta, code, offset) => {
            const normalizedLang = lang.toLowerCase();
            if (!FENCE_LANGUAGES.has(normalizedLang)) {
              return match;
            }

            if (!SQL_MARKER_LINE.test(code)) {
              return match;
            }

            const cleanedCode = code.replace(
              /^\s*\/\/\s*@sql\b.*(?:\r?\n|$)/gm,
              ''
            );
            const fenced = `\`\`\`${lang}${meta}\n${cleanedCode}\`\`\``;
            const headingId = findNearestHeadingId(src, offset);
            const instrumented = instrumentMarkedStatements(
              code,
              normalizedLang,
              SQL_MARKER_LINE
            );
            if (!instrumented) {
              return fenced;
            }
            const currentIndex = sqlFenceIndex;
            sqlFenceIndex += 1;

            let outputs: string | null = null;
            try {
              outputs = isSchemaBuilderDoc
                ? renderResolvedOutputs(
                    resolvedSnippets,
                    relativeId,
                    currentIndex,
                    headingId,
                    (message) => this.warn(message)
                  )
                : await renderSqlOutputs(
                    instrumented,
                    normalizedLang,
                    headingId
                  );
            } catch (error) {
              if (isSchemaBuilderDoc) {
                this.warn(String(error));
              }
              throw error;
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

    const items = badgeMatch[1].trim().split(/\s+/).filter(Boolean);

    const cleaned = text.replace(BADGE_RE, '').trim();
    const headingId = explicitId ?? slugify(cleaned);
    lines[i] = `${headingMatch[1]} ${cleaned} ${renderBadges(
      items
    )} {#${headingId}}`;
  }

  return lines.join('\n');
}

function safeLoadResolvedSnippets(
  warn: (message: string) => void
): ResolvedSnippets | null {
  try {
    if (!fs.existsSync(resolvedSnippetsPath)) {
      warn(
        'Schema builder SQL snippets are missing. Snippets will render as "Snippet not available". Run `npm run resolve-schema-snippets` to generate docs/generated/schema-snippets.json.'
      );
      return null;
    }
    const raw = fs.readFileSync(resolvedSnippetsPath, 'utf8');
    const data = JSON.parse(raw) as ResolvedSnippets;
    if (data.version !== RESOLVED_SNIPPETS_VERSION) {
      throw new Error(
        `Resolved schema snippets version ${data.version} does not match ${RESOLVED_SNIPPETS_VERSION}.`
      );
    }
    if (!data.files || typeof data.files !== 'object') {
      throw new Error('Resolved schema snippets are missing file entries.');
    }
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    warn(
      `Schema builder SQL snippets could not be loaded (${message}). Snippets will render as "Snippet not available".`
    );
    return null;
  }
}

async function replaceCodeFences(
  source: string,
  regex: RegExp,
  replacer: (
    match: string,
    lang: string,
    meta: string,
    code: string,
    offset: number
  ) => Promise<string>
): Promise<string> {
  regex.lastIndex = 0;
  const matches = Array.from(source.matchAll(regex));
  if (!matches.length) {
    return source;
  }

  let lastIndex = 0;
  let output = '';

  for (const match of matches) {
    const matchText = match[0];
    const index = match.index ?? 0;
    const lang = match[1] ?? '';
    const meta = match[2] ?? '';
    const code = match[3] ?? '';
    output += source.slice(lastIndex, index);
    output += await replacer(matchText, lang, meta, code, index);
    lastIndex = index + matchText.length;
  }

  output += source.slice(lastIndex);
  return output;
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

function renderResolvedOutputs(
  resolved: ResolvedSnippets | null,
  fileKey: string,
  index: number,
  headingId?: string | null,
  warn?: (message: string) => void
): string {
  // Precomputed outputs avoid running schema builder introspection during docs build.
  if (!resolved) {
    return renderMissingSnippetGroup(headingId);
  }
  const snippetEntry = resolved.files?.[fileKey]?.snippets?.[String(index)];
  if (!snippetEntry) {
    warn?.(`Resolved schema snippet ${fileKey}#${index} is missing.`);
    return renderMissingSnippetGroup(headingId);
  }

  const headingAttr = headingId ? ` data-heading="${headingId}"` : '';
  const outputs: string[] = [];
  for (const dialect of Object.keys(dialects)) {
    const chunks = snippetEntry.dialects?.[dialect];
    if (!Array.isArray(chunks)) {
      warn?.(
        `Resolved schema snippet ${fileKey}#${index} is missing output for ${dialect}.`
      );
      outputs.push(
        `<div class="sql-output sql-output-empty" data-dialect="${dialect}"${headingAttr}>${MISSING_SNIPPET_MESSAGE}</div>`
      );
      continue;
    }

    if (!chunks.length) {
      outputs.push(
        `<div class="sql-output sql-output-empty" data-dialect="${dialect}"${headingAttr}>No output for this dialect. Try selecting a different one.</div>`
      );
      continue;
    }

    const hasError = chunks.some((chunk) => chunk.type === 'error');
    if (hasError) {
      outputs.push(
        `<div class="sql-output" data-dialect="${dialect}"${headingAttr}>\n\n${renderPlainOutput(
          chunks as RenderChunk[]
        )}\n\n</div>`
      );
      continue;
    }

    const sqlBlocks = chunks.map((chunk) => chunk.text);
    outputs.push(
      `<div class="sql-output" data-dialect="${dialect}"${headingAttr}>\n\n\`\`\`sql\n${sqlBlocks.join(
        '\n\n'
      )}\n\`\`\`\n\n</div>`
    );
  }

  return `<div class="sql-output-group"${headingAttr}>\n${outputs.join(
    '\n'
  )}\n</div>\n`;
}

function renderMissingSnippetGroup(
  headingId?: string | null,
  message: string = MISSING_SNIPPET_MESSAGE
): string {
  const headingAttr = headingId ? ` data-heading="${headingId}"` : '';
  const outputs = Object.keys(dialects).map(
    (dialect) =>
      `<div class="sql-output sql-output-empty" data-dialect="${dialect}"${headingAttr}>${message}</div>`
  );
  return `<div class="sql-output-group"${headingAttr}>\n${outputs.join(
    '\n'
  )}\n</div>\n`;
}

type ResolvedChunk = { type: 'sql' | 'error'; text: string };

type ResolvedSnippet = { dialects: Record<string, ResolvedChunk[]> };

type ResolvedSnippets = {
  version: number;
  files: Record<string, { snippets: Record<string, ResolvedSnippet> }>;
};

async function renderSqlOutputs(
  instrumented: string,
  lang: string,
  headingId?: string | null
): Promise<string> {
  const headingAttr = headingId ? ` data-heading="${headingId}"` : '';
  const outputs: string[] = [];
  for (const [dialect, knex] of Object.entries(dialects)) {
    const captures = evaluateSnippet(instrumented, lang, knex);

    const groups: RenderChunk[][] = [];
    for (const capture of captures) {
      const group: RenderChunk[] = [];
      try {
        if ('error' in capture) {
          group.push({ type: 'error', text: formatSqlError(capture.error) });
        } else {
          const sqlStrings = await toSqlStringsAsync(capture.value);
          if (sqlStrings.length) {
            for (const text of sqlStrings) {
              group.push({ type: 'sql', text });
            }
          }
        }
      } catch (error) {
        group.push({ type: 'error', text: formatSqlError(error) });
      }

      if (group.length) {
        groups.push(group);
      }
    }

    const chunks: RenderChunk[] = [];
    for (let i = 0; i < groups.length; i += 1) {
      if (i > 0) {
        chunks.push({ type: 'sql', text: SQL_OUTPUT_SEPARATOR });
      }
      chunks.push(...groups[i]);
    }

    if (!chunks.length) {
      outputs.push(
        `<div class="sql-output sql-output-empty" data-dialect="${dialect}"${headingAttr}>No output for this dialect. Try selecting a different one.</div>`
      );
      continue;
    }

    const hasError = chunks.some((chunk) => chunk.type === 'error');
    if (hasError) {
      outputs.push(
        `<div class="sql-output" data-dialect="${dialect}"${headingAttr}>\n\n${renderPlainOutput(
          chunks
        )}\n\n</div>`
      );
      continue;
    }

    const sqlBlocks = chunks.map((chunk) => chunk.text);
    outputs.push(
      `<div class="sql-output" data-dialect="${dialect}"${headingAttr}>\n\n\`\`\`sql\n${sqlBlocks.join(
        '\n\n'
      )}\n\`\`\`\n\n</div>`
    );
  }

  return `<div class="sql-output-group"${headingAttr}>\n${outputs.join(
    '\n'
  )}\n</div>\n`;
}

async function toSqlStringsAsync(value: unknown): Promise<string[]> {
  if (
    value &&
    typeof value === 'object' &&
    'generateDdlCommands' in value &&
    typeof (value as { generateDdlCommands?: () => unknown })
      .generateDdlCommands === 'function'
  ) {
    try {
      // generateDdlCommands yields full DDL (including multi-statement outputs) for schema builders.
      const ddlCommands = await (
        value as { generateDdlCommands: () => Promise<unknown> }
      ).generateDdlCommands();
      let ddlSql: string[] = [];
      if (ddlCommands) {
        if (!Array.isArray(ddlCommands) && typeof ddlCommands !== 'object') {
          ddlSql = collectSqlEntries(ddlCommands);
        } else if (Array.isArray(ddlCommands)) {
          ddlSql = collectSqlEntries(ddlCommands);
        } else {
          const { pre, sql, check, post } = ddlCommands as {
            pre?: unknown;
            sql?: unknown;
            check?: unknown;
            post?: unknown;
          };
          ddlSql = [
            ...collectSqlEntries(pre),
            ...collectSqlEntries(sql),
            ...collectSqlEntries(check),
            ...collectSqlEntries(post),
          ];
        }
      }
      if (ddlSql.length) {
        return ddlSql;
      }
    } catch (error) {
      const fallback = toSqlStrings(value);
      if (fallback.length) {
        return fallback;
      }
      throw error;
    }
  }

  return toSqlStrings(value);
}

function collectSqlEntries(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectSqlEntries(entry));
  }

  if (typeof value === 'string') {
    return [value];
  }

  if (typeof value === 'object' && 'sql' in value) {
    const sqlValue = (value as { sql?: unknown }).sql;
    if (typeof sqlValue === 'string') {
      return [sqlValue];
    }
  }

  return [];
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
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }
        if (
          'sql' in entry &&
          typeof (entry as { sql: unknown }).sql === 'string'
        ) {
          return (entry as { sql: string }).sql;
        }
        return null;
      })
      .filter((sql): sql is string => typeof sql === 'string');
  }

  if (sqlValue && typeof sqlValue === 'object') {
    if (
      'sql' in sqlValue &&
      typeof (sqlValue as { sql: unknown }).sql === 'string'
    ) {
      return [(sqlValue as { sql: string }).sql];
    }
  }

  if (typeof (value as { toString?: () => string }).toString === 'function') {
    return [String(value.toString())];
  }

  return [];
}

type RenderChunk = { type: 'sql' | 'error'; text: string };

function renderPlainOutput(chunks: RenderChunk[]): string {
  const body = chunks
    .map((chunk) => {
      const escaped = chunk.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      if (chunk.type === 'error') {
        return `<span class="sql-output-error-line">${escaped}</span>`;
      }
      return escaped;
    })
    .join('\n\n');
  return `<pre class="sql-output-plain"><code>${body}</code></pre>`;
}
