import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes } from 'prism-react-renderer';

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

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    // en-US is a default language that is not really used on production.
    // It is used to move english version of the site to /en, not /.
    // In the `middleware.ts` all requests to / are rewriting either to /en or /ru.
    defaultLocale: 'en-US',
    locales: ['en', 'ru'],
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
          customCss: require.resolve('./src/css/custom.css'),
        },
      } satisfies Preset.Options as Preset.Options,
    ],
  ],

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
      footer: {
        style: 'dark',
        links: [],
        copyright: `${new Date().getFullYear()}, Mark Fomin`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      colorMode: {
        respectPrefersColorScheme: true,
      }
    },
};

module.exports = config;
