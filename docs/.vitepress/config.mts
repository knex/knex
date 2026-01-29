import { defineConfig } from 'vitepress';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import KnexDialectsPlugins from './knexDialects';
import { renderBadges } from './badges';
import { slugify } from './slugify';

const HEADING_RE = /^(#{2,3})\s+(.+)$/;
const FENCE_RE = /^```/;
const BADGE_RE = /\s*\[((?:[~-][A-Z]{2}\s*)+)\]\s*$/;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '..', 'src');

export default defineConfig({
  title: 'Knex.js',
  description: 'Beta knex.js documentation.',
  base: '/',
  srcDir: 'src',
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '96x96',
        href: '/favicon-96x96.png',
      },
    ],
    ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
    [
      'link',
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
    ],
    ['link', { rel: 'manifest', href: '/site.webmanifest' }],
  ],
  themeConfig: {
    logo: '/knex-logo.svg',
    socialLinks: [{ icon: 'github', link: 'https://github.com/knex/knex' }],
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
      badges = badgeMatch[1].trim().split(/\s+/).filter(Boolean);
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
