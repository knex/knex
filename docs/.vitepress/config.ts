import path from 'node:path';
import { defineConfig } from 'vitepress';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import KnexDialectsPlugins from './knexDialects';

export default defineConfig({
  title: 'Knex.js',
  description: 'Beta knex.js documentation.',
  base: '/',
  srcDir: 'src',
  head: [['link', { rel: 'icon', type: 'image/png', href: '/knex-logo.png' }]],
  themeConfig: {
    logo: '/knex-logo.png',
    repo: 'knex/knex',
    docsRepo: 'knex/knex',
    docsDir: 'docs/src',
    docsBranch: 'master',
    editLinks: true,
    editLinkText: 'Edit this page on GitHub',
    lastUpdated: 'Last Updated',
    nav: [
      { text: 'Playground', link: '/playground/' },
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
    algolia: {
      appId: 'V7E3EHUPD6',
      apiKey: '44b5077836c1c8fba0f364383dde7fb4',
      indexName: 'knex',
      initialQuery: '',
    },
  },
  vite: {
    plugins: [
      KnexDialectsPlugins(),
      viteStaticCopy({
        targets: [
          {
            src: path.resolve(
              path.join(__dirname, '..', 'node_modules', 'knex', 'types')
            ),
            dest: 'playground-assets',
          },
        ],
      }),
    ],
    define: {
      process: {
        env: {},
      },
    },
    build: {
      target: ['es2020'],
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2020',
      },
    },
  },
});

function getGuideSidebar() {
  return [
    {
      text: 'Installation',
      link: '/guide/',
    },
    {
      text: 'Query Builder',
      link: '/guide/query-builder',
    },
    {
      text: 'Transactions',
      link: '/guide/transactions',
    },
    {
      text: 'Schema Builder',
      link: '/guide/schema-builder',
    },
    {
      text: 'Raw',
      link: '/guide/raw',
    },
    {
      text: 'Ref',
      link: '/guide/ref',
    },
    {
      text: 'Utility',
      link: '/guide/utility',
    },
    {
      text: 'Interfaces',
      link: '/guide/interfaces',
    },
    {
      text: 'Migrations',
      link: '/guide/migrations',
    },
    {
      text: 'Extending',
      link: '/guide/extending',
    },
  ];
}
function getFaqSidebar() {
  return [
    {
      text: 'F.A.Q.',
      link: '/faq/',
    },
    {
      text: 'Recipes',
      link: '/faq/recipes',
    },
    {
      text: 'Support',
      link: '/faq/support',
    },
  ];
}
