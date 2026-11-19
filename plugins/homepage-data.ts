import type {LoadContext, Plugin} from '@docusaurus/types';

/**
 * Data for the homepage "Start here" cards, exposed as global data:
 * - the latest blog posts (title, permalink, source folder for the cover);
 * - the Telegram channel title and subscriber count, read from its public t.me page at
 *   build time. Offline or on a markup change it is null and the card falls back.
 */

export const CHANNEL = 'difhel_b';

export type HomepageData = {
  posts: {title: string; permalink: string; dir: string; date: string}[];
  channel: {title: string; subscribers: number} | null;
};

type BlogPost = {
  metadata: {title: string; permalink: string; source: string; date: string | Date};
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

async function loadChannel(): Promise<HomepageData['channel']> {
  try {
    const response = await fetch(`https://t.me/${CHANNEL}`, {signal: AbortSignal.timeout(5000)});
    if (!response.ok) {
      return null;
    }
    const html = await response.text();
    const title = html.match(/tgme_page_title[^>]*>\s*<span[^>]*>([^<]+)</)?.[1];
    const subscribers = html.match(/tgme_page_extra">\s*([\d\s,]+)\s+subscribers?/)?.[1];
    if (!title || !subscribers) {
      return null;
    }
    return {title: decodeEntities(title), subscribers: Number(subscribers.replace(/\D/g, ''))};
  } catch {
    return null;
  }
}

export default function homepageDataPlugin(_context: LoadContext): Plugin<HomepageData['channel']> {
  return {
    name: 'homepage-data',

    loadContent: loadChannel,

    async allContentLoaded({allContent, actions}) {
      const blog = allContent['docusaurus-plugin-content-blog']?.default as
        | {blogPosts: BlogPost[]}
        | undefined;
      const posts = (blog?.blogPosts ?? []).slice(0, 3).map(({metadata}) => ({
        title: metadata.title,
        permalink: metadata.permalink,
        // '@site/blog/<dir>/index.mdx' -> '<dir>', to find the cover next to the post
        dir: metadata.source.split('/').slice(-2, -1)[0] ?? '',
        date: new Date(metadata.date).toISOString(),
      }));
      const channel = (allContent['homepage-data']?.default as HomepageData['channel']) ?? null;
      actions.setGlobalData({posts, channel} satisfies HomepageData);
    },
  };
}
