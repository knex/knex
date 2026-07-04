const DIALECT_CODES = ['PG', 'MY', 'SQ', 'MS', 'OR', 'CR', 'RS'];

type BadgeKind = 'unsupported' | 'emulated';

type BadgeToken = {
  code: string;
  kind: BadgeKind;
};

type ParsedBadges = {
  ordered: BadgeToken[];
  unsupported: string[];
  emulated: string[];
};

export function renderBadges(tokens: string[]) {
  const parsed = parseBadgeTokens(tokens);
  if (!parsed.ordered.length) {
    return '';
  }

  const supported = DIALECT_CODES.filter(
    (code) =>
      !parsed.unsupported.includes(code) && !parsed.emulated.includes(code)
  );
  const onlyBadge = renderOnlyBadge(supported);
  if (onlyBadge) {
    const emulated = parsed.ordered
      .filter((badge) => badge.kind === 'emulated')
      .map((badge) => renderEmulatedBadge(badge.code))
      .join('');
    return `<span class="dialect-badges">${onlyBadge}${emulated}</span>`;
  }

  const badges = parsed.ordered.map((badge) =>
    badge.kind === 'emulated'
      ? renderEmulatedBadge(badge.code)
      : renderUnsupportedBadge(badge.code)
  );
  return `<span class="dialect-badges">${badges.join('')}</span>`;
}

function renderOnlyBadge(supported: string[]): string | null {
  if (supported.length === 1) {
    const onlyCode = supported[0];
    return `<span class="dialect-badge dialect-badge-only" title="Only supported by ${dialectLabel(
      onlyCode
    )}">${onlyCode} only</span>`;
  }
  if (supported.length === 2) {
    const [first, second] = supported;
    return `<span class="dialect-badge dialect-badge-only" title="Only supported by ${dialectLabel(
      first
    )}, ${dialectLabel(second)}">${first}+${second} only</span>`;
  }

  return null;
}

function renderUnsupportedBadge(code: string) {
  return `<span class="dialect-badge" title="Not supported by ${dialectLabel(
    code
  )}">${code}</span>`;
}

function renderEmulatedBadge(code: string) {
  return `<span class="dialect-badge dialect-badge-emulated" title="Emulated by ${dialectLabel(
    code
  )}">~${code}</span>`;
}

function parseBadgeTokens(tokens: string[]): ParsedBadges {
  const ordered: BadgeToken[] = [];
  const unsupported = new Set<string>();
  const emulated = new Set<string>();

  for (const token of tokens) {
    const trimmed = token.trim();
    if (trimmed.length < 3) {
      continue;
    }
    const prefix = trimmed[0];
    const code = trimmed.slice(1);
    if (!DIALECT_CODES.includes(code)) {
      continue;
    }

    if (prefix === '-') {
      if (unsupported.has(code)) {
        continue;
      }
      unsupported.add(code);
      ordered.push({ code, kind: 'unsupported' });
      continue;
    }

    if (prefix === '~') {
      if (emulated.has(code)) {
        continue;
      }
      emulated.add(code);
      ordered.push({ code, kind: 'emulated' });
    }
  }

  return {
    ordered,
    unsupported: Array.from(unsupported),
    emulated: Array.from(emulated),
  };
}

function dialectLabel(code: string) {
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
