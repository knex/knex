import { defineConfig } from 'vitepress';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import KnexDialectsPlugins from './knexDialects';

const HEADING_RE = /^(#{2,3})\s+(.+)$/;
const FENCE_RE = /^(```|~~~)/;
const BADGE_RE = /\s*\[((?:-[A-Z]{2}\s*)+)\]\s*$/;
const rControl = /[\u0000-\u001f]/g;
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g;
const rCombining = /[\u0300-\u036f]/g;
const DIALECT_CODES = ['PG', 'MY', 'SQ', 'MS', 'OR', 'CR', 'RS'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '..', 'src');

export default defineConfig({
  title: 'Knex.js',
  description: 'Beta knex.js documentation.',
  base: '/',
  srcDir: 'src',
  lastUpdated: true,
  head: [['link', { rel: 'icon', type: 'image/png', href: '/knex-logo.png' }]],
  themeConfig: {
    logo: '/knex-logo.png',
    repo: 'knex/knex',
    editLink: {
      pattern: 'https://github.com/knex/knex/edit/master/docs/src/:path',
      text: 'Edit this page on GitHub',
    },
    lastUpdated: {
      text: 'Last Updated',
    },
    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '^/guide/' },
      {
        text: 'F.A.Q.',
        link: '/faq/',
      },
      {
        text: 'Changelog',
        link: '/changelog.html',
      },
    ],
    sidebar: {
      '/guide/': getGuideSidebar(),
      '/faq/': getFaqSidebar(),
    },
    search: {
      provider: 'algolia',
      options: {
        appId: 'V7E3EHUPD6',
        apiKey: '44b5077836c1c8fba0f364383dde7fb4',
        indexName: 'knex',
        initialQuery: '',
      },
    },
  },
  vite: {
    plugins: [KnexDialectsPlugins()],
  },
});

function getGuideSidebar() {
  const guidePages = [
    { text: 'Installation', link: '/guide/', file: 'index.md' },
    {
      text: 'Query Builder',
      link: '/guide/query-builder',
      file: 'query-builder.md',
    },
    {
      text: 'Transactions',
      link: '/guide/transactions',
      file: 'transactions.md',
    },
    {
      text: 'Schema Builder',
      link: '/guide/schema-builder',
      file: 'schema-builder.md',
    },
    { text: 'Raw', link: '/guide/raw', file: 'raw.md' },
    { text: 'Ref', link: '/guide/ref', file: 'ref.md' },
    { text: 'Utility', link: '/guide/utility', file: 'utility.md' },
    { text: 'Interfaces', link: '/guide/interfaces', file: 'interfaces.md' },
    { text: 'Migrations', link: '/guide/migrations', file: 'migrations.md' },
    { text: 'Extending', link: '/guide/extending', file: 'extending.md' },
  ];
  const guideDir = path.join(srcDir, 'guide');
  return guidePages.map((page) => ({
    text: page.text,
    link: page.link,
    collapsed: true,
    items: extractHeaders(path.join(guideDir, page.file), page.link),
  }));
}
function getFaqSidebar() {
  const faqPages = [
    { text: 'F.A.Q.', link: '/faq/', file: 'index.md' },
    { text: 'Recipes', link: '/faq/recipes', file: 'recipes.md' },
    { text: 'Support', link: '/faq/support', file: 'support.md' },
  ];
  const faqDir = path.join(srcDir, 'faq');
  return faqPages.map((page) => ({
    text: page.text,
    link: page.link,
    collapsed: true,
    items: extractHeaders(path.join(faqDir, page.file), page.link),
  }));
}

function extractHeaders(filePath: string, pageLink: string) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const headers: Array<{
    level: number;
    text: string;
    explicitId?: string;
    badges?: string[];
  }> = [];
  let inFence = false;

  for (const line of lines) {
    if (FENCE_RE.test(line.trim())) {
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

    const level = match[1].length;
    let text = match[2].trim();
    let explicitId: string | null = null;
    let badges: string[] = [];
    const explicitMatch = text.match(/\s*\{#([^}]+)\}\s*$/);
    if (explicitMatch) {
      explicitId = explicitMatch[1];
      text = text.replace(/\s*\{#([^}]+)\}\s*$/, '').trim();
    }
    const badgeMatch = text.match(BADGE_RE);
    if (badgeMatch) {
      badges = badgeMatch[1]
        .trim()
        .split(/\s+/)
        .map((entry) => entry.replace(/^-/, ''))
        .filter(Boolean);
      text = text.replace(BADGE_RE, '').trim();
    }
    text = text.replace(/\s+#+\s*$/, '').trim();

    headers.push({
      level,
      text,
      ...(explicitId ? { explicitId } : {}),
      ...(badges.length ? { badges } : {}),
    });
  }

  const slugCounts = new Map<string, number>();
  const items: Array<{
    text: string;
    link: string;
    items?: Array<{ text: string; link: string }>;
  }> = [];
  let currentGroup: {
    text: string;
    link: string;
    items?: Array<{ text: string; link: string }>;
  } | null = null;

  for (const header of headers) {
    const slugBase = header.explicitId ?? slugify(header.text);
    const slug = uniqueSlug(slugBase, slugCounts);
    const link = `${pageLink}#${slug}`;
    const label = header.badges?.length
      ? `${header.text} ${renderBadges(header.badges)}`
      : header.text;

    if (header.level === 2) {
      currentGroup = { text: header.text, link, items: [] };
      items.push(currentGroup);
      continue;
    }

    if (!currentGroup) {
      items.push({ text: label, link });
      continue;
    }

    currentGroup.items?.push({ text: label, link });
  }

  return items;
}

function slugify(text: string) {
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

function uniqueSlug(base: string, counts: Map<string, number>) {
  const current = counts.get(base);
  if (current == null) {
    counts.set(base, 0);
    return base;
  }

  const next = current + 1;
  counts.set(base, next);
  return `${base}-${next}`;
}

function renderBadges(codes: string[]) {
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
