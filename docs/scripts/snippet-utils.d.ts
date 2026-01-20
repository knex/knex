import type Knex from 'knex';

export type Capture = { value: unknown } | { error: Error };

export function formatSqlError(error: unknown): string;
export function evaluateSnippet(
  code: string,
  lang: string,
  knex: Knex.Knex
): Capture[];
export function instrumentMarkedStatements(
  code: string,
  lang: string,
  markerRegex: RegExp
): string | null;
