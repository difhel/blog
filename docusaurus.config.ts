import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes } from 'prism-react-renderer';
import homepageDataPlugin from './plugins/homepage-data';

const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

const config: Config = {
  title: 'Mark Fomin',
  tagline: 'I hate seafood',
  favicon: 'img/favicon.png',

  // Set the production url of your site here
  url: 'https://difhel.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'facebook', // Usually your GitHub org/user name.
  projectName: 'docusaurus', // Usually your repo name.

  // Geist + Geist Mono: the Black Glass typefaces (used by the blog pages)
  headTags: [
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.googleapis.com'}},
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous'}},
  ],
  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Geist:wght@400..700&family=Geist+Mono:wght@400..600&display=swap',
  ],

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    // en-US is a default language that is not really used on production.
    // It is used to move english version of the site to /en, not /.
    // In the `middleware.ts` all requests to / are rewriting either to /en or /ru.
    defaultLocale: 'en-US',
    locales: ['en-US', 'en', 'ru'],
  },

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: {
          showReadingTime: true,
          readingTime: ({content, frontMatter, defaultReadingTime}) =>
            defaultReadingTime({content, options: {wordsPerMinute: 150}}),
            blogSidebarTitle: 'All posts',
            blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: [
            require.resolve('./src/css/custom.css'),
            // Black Glass design system: tokens, page background
            require.resolve('./src/css/black-glass.css'),
            // Blog list and post pages in the Black Glass design system
            require.resolve('./src/css/blog-black-glass.css'),
          ],
        },
      } satisfies Preset.Options as Preset.Options,
    ],
  ],

  // latest posts and Telegram channel stats for the homepage "Start here" cards
  plugins: [homepageDataPlugin],

  themeConfig: {
      image: 'img/difhel-social-card.png',
      navbar: {
        title: '',
        logo: {
          alt: 'Site Logo',
          src: 'img/logo.svg',
        },
        items: [
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/difhel',
            label: 'GitHub',
            position: 'right',
          },
          {
            type: 'localeDropdown',
          }
        ],
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      colorMode: {
        respectPrefersColorScheme: false,
      }
    },
};

module.exports = config;
