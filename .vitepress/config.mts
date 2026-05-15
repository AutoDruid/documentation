import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "docs",
  base: "/documentation/",
  title: "Autodruid",
  description: "Smart Farming Assistant for Albion Online",

  head: [
      ['link', { rel: 'icon', href: '/favicon.png' }]
    ],
  themeConfig: {
    logo: '/logo.png',
    nav: [
          { text: 'Guide', link: '/guide/' },
          { text: 'App', link: '/autodruid/' },
          { text: 'Albion Lens', link: '/albion-lens/' },
          { text: 'Photon Parser', link: '/photon-parser/' }
    ],


    sidebar: {
          '/guide/': [
            {
              text: 'Overview',
              items: [
                { text: 'Introduction', link: '/guide/' },
                { text: 'Architecture', link: '/guide/architecture' },
                { text: 'Getting Started', link: '/guide/getting-started' }
              ]
            }
          ],
          '/autodruid/': [
            {
              text: 'Desktop Client',
              items: [
                { text: 'Overview', link: '/autodruid/' },
                { text: 'Configuration & Biomes', link: '/autodruid/configuration' },
                { text: 'Subscriptions', link: '/autodruid/subscriptions' }
              ]
            }
          ],
          '/albion-lens/': [
            {
              text: 'Albion Lens',
              items: [
                { text: 'Overview', link: '/albion-lens/' },
                { text: 'Event Mapping', link: '/albion-lens/event-mapping' },
                { text: 'API Reference', link: '/albion-lens/api-reference' }
              ]
            }
          ],
          '/photon-parser/': [
            {
              text: 'Photon Parser',
              items: [
                { text: 'Overview', link: '/photon-parser/' },
                { text: 'Photon Protocol', link: '/photon-parser/photon'},
                { text: 'Examples', link: '/photon-parser/examples' },
              ]
            }
          ]
        },

        footer: {
              message: 'Released under the MIT License. Not affiliated with Sandbox Interactive GmbH.',
              copyright: 'Copyright © 2026-present AutoDruid Contributors'
            },

        socialLinks: [
              { icon: 'github', link: 'https://github.com/AutoDruid' }
            ]
  },
});
