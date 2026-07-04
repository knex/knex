import * as ts from 'typescript';

function normalizeError(error) {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

function normalizeCapture(capture) {
  if (capture && typeof capture === 'object' && 'error' in capture) {
    return { error: normalizeError(capture.error) };
  }

  if (capture && typeof capture === 'object' && 'value' in capture) {
    return { value: capture.value };
  }

  return { value: capture };
}

export function formatSqlError(error) {
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

export function evaluateSnippet(code, lang, knex) {
  try {
    const jsCode =
      lang === 'ts'
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
    const result = fn(knex);
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

export function instrumentMarkedStatements(code, lang, markerRegex) {
  const markerLines = findMarkerLines(code, markerRegex);
  if (!markerLines.length) {
    return null;
  }

  const scriptKind = lang === 'ts' ? ts.ScriptKind.TS : ts.ScriptKind.JS;
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

  const inserts = [];
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

function findMarkerLines(code, markerRegex) {
  const lines = code.split(/\r?\n/);
  const markers = [];
  for (let i = 0; i < lines.length; i += 1) {
    markerRegex.lastIndex = 0;
    if (markerRegex.test(lines[i])) {
      markers.push(i);
    }
  }
  return markers;
}

function mapMarkersToStatements(markerLines, statementInfos) {
  const indices = [];
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

function applyInserts(source, inserts) {
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
