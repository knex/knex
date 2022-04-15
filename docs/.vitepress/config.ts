import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Knex.js',
  description: 'Beta knex.js documentation.',
  base: '/',
  head: [
    ["link", { rel: "icon", type: "image/png", href: "/knex-logo.png" }],
  ],

  themeConfig: {
    logo: '/knex-logo.png',
    docsRepo: 'knex/knex',  
    docsDir: 'docs',
    docsBranch: 'master',
    editLinks: true,
    editLinkText: 'Edit this page on GitHub',
    lastUpdated: 'Last Updated',
    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '^/$|^/guide/' },
      {
        text: 'F.A.Q.',
        link: '/faq/',
      },
      {
        text: 'Changelog',
        link: '/changelog.html',
      }
    ],
    sidebar: {
      '/guide/': getGuideSidebar(),
      '/faq/': getFaqSidebar(),
    },
  },
})

function getGuideSidebar() {
  return [
    {
      text: 'Installation',
      link: '/guide/'
    },
    {
      text: 'Query Builder',
      link: '/guide/query-builder'
    },
    {
      text: 'Transactions',
      link: '/guide/transactions'
    },
    {
      text: 'Schema Builder',
      link: '/guide/schema-builder'
    },
    {
      text: 'Raw',
      link: '/guide/raw'
    },
    {
      text: 'Ref',
      link: '/guide/ref'
    },
    {
      text: 'Utility',
      link: '/guide/utility'
    },
    {
      text: 'Interfaces',
      link: '/guide/interfaces'
    },
    {
      text: 'Migrations',
      link: '/guide/migrations'
    },
    {
      text: 'F.A.Q.',
      link: '/guide/faq'
    },
  ]
}
function getFaqSidebar() {
  return [
    {
      text: 'F.A.Q.',
      link: '/faq/'
    },
    {
      text: 'Recipes',
      link: '/faq/recipes'
    },
  ]
}