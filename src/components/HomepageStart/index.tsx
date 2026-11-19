import React, {type CSSProperties, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {translate} from '@docusaurus/Translate';
import {usePluginData} from '@docusaurus/useGlobalData';
import {usePluralForm} from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ShinyText from '@site/src/components/ShinyText';
import LucideIcon from '@site/src/components/LucideIcon';
import type {HomepageData} from '@site/plugins/homepage-data';

import styles from './styles.module.css';

const CHANNEL_URL = 'https://t.me/difhel_b';

// Post covers live next to each post: blog/<dir>/cover.png. require.context is webpack's,
// so it has no Node typings: describe the part we use.
type CoverContext = {keys(): string[]; (id: string): string | {default: string}};
const coverModules = (
  require as unknown as {context(dir: string, deep: boolean, filter: RegExp): CoverContext}
).context('@site/blog', true, /^\.\/[^/]+\/cover\.(png|jpe?g|webp)$/);

function coverFor(dir: string): string | undefined {
  const key = coverModules.keys().find((k) => k.startsWith(`./${dir}/`));
  if (!key) {
    return undefined;
  }
  const mod = coverModules(key);
  return typeof mod === 'string' ? mod : mod.default;
}

// M3 Expressive "cookie": a circle with soft scalloped lobes, 200x200 box
function cookiePath(lobes = 9, radius = 86, depth = 8, steps = 180): string {
  const points = Array.from({length: steps}, (_, i) => {
    const t = (2 * Math.PI * i) / steps;
    const r = radius + depth * Math.cos(lobes * t);
    return `${(100 + r * Math.cos(t)).toFixed(1)} ${(100 + r * Math.sin(t)).toFixed(1)}`;
  });
  return `M${points.join(' L')} Z`;
}

const COOKIE = cookiePath();

function t(id: string, message: string): string {
  return translate({id, message});
}

function ArrowRight(): ReactNode {
  return (
    <LucideIcon className={styles.ctaIcon}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </LucideIcon>
  );
}

function BlogCard({posts}: {posts: HomepageData['posts']}): ReactNode {
  // back to front: the newest post ends up on top of the fan
  const covers = posts
    .map((post) => ({post, src: coverFor(post.dir)}))
    .filter((c): c is {post: HomepageData['posts'][number]; src: string} => Boolean(c.src))
    .reverse();

  return (
    <Link className={styles.card} to="/blog">
      <div className={`${styles.art} ${styles.blogArt}`} aria-hidden="true">
        <svg className={styles.cookie} viewBox="0 0 200 200">
          <path d={COOKIE} />
        </svg>
        {covers.map(({post, src}, i) => (
          <img
            key={post.permalink}
            className={styles.cover}
            data-depth={covers.length - 1 - i}
            src={src}
            alt=""
            loading="lazy"
          />
        ))}
      </div>
      <div className={styles.body}>
        <h3 className={styles.cardTitle}>{t('homepage.start.blog.title', 'Read the blog')}</h3>
        <p className={styles.cardText}>
          {t(
            'homepage.start.blog.text',
            'Write-ups on what I build, break and benchmark along the way.',
          )}
        </p>
      </div>
      <span className={`${styles.cta} ${styles.ctaTonal}`}>
        {t('homepage.start.blog.cta', 'Open the blog')}
        <ArrowRight />
      </span>
    </Link>
  );
}

function TelegramCard({
  channel,
  latest,
}: {
  channel: HomepageData['channel'];
  latest?: HomepageData['posts'][number];
}): ReactNode {
  const {selectMessage} = usePluralForm();
  const {i18n} = useDocusaurusContext();
  const avatar = useBaseUrl('/img/logo.svg');
  // the post's own date and time, in UTC so server and client render the same text
  const published = latest ? new Date(latest.date) : undefined;
  const day = published?.toLocaleDateString(i18n.currentLocale, {month: 'long', day: 'numeric', timeZone: 'UTC'});
  const time = published?.toLocaleTimeString(i18n.currentLocale, {hour: '2-digit', minute: '2-digit', timeZone: 'UTC'});
  const title = channel?.title ?? '@difhel_b';
  const subtitle = channel
    ? selectMessage(
        channel.subscribers,
        translate(
          {
            id: 'homepage.start.telegram.subscribers',
            message: '{count} subscriber|{count} subscribers',
          },
          {count: channel.subscribers},
        ),
      )
    : t('homepage.start.telegram.channel', 'Telegram channel');

  return (
    <a className={styles.card} href={CHANNEL_URL} target="_blank" rel="noreferrer">
      {/* a tiny Telegram channel window: header with avatar and subscribers, one post */}
      <div className={`${styles.art} ${styles.tgArt}`} aria-hidden="true">
        <div className={styles.tgHeader}>
          <span className={styles.tgAvatar}>
            <img src={avatar} alt="" />
          </span>
          <span className={styles.tgHeaderText}>
            <span className={styles.tgName}>{title}</span>
            <span className={styles.tgSubs}>{subtitle}</span>
          </span>
        </div>
        {day && <span className={styles.tgDate}>{day}</span>}
        <div className={styles.tgBubble}>
          <span className={styles.tgBubbleText}>
            {t('homepage.start.telegram.bubble', 'New post on the blog')}
          </span>
          {latest && (
            <span className={styles.tgPreview}>
              <span className={styles.tgPreviewSite}>difhel.dev</span>
              <span className={styles.tgPreviewTitle}>{latest.title}</span>
            </span>
          )}
          {time && <span className={styles.tgTime}>{time}</span>}
        </div>
      </div>
      <div className={styles.body}>
        <h3 className={styles.cardTitle}>
          {t('homepage.start.telegram.title', 'Follow the channel')}
        </h3>
        <p className={styles.cardText}>
          {t(
            'homepage.start.telegram.text',
            'New posts land here first, plus the shorter stuff that never makes it to the blog.',
          )}
        </p>
      </div>
      <span className={`${styles.cta} ${styles.ctaFilled}`}>
        {t('homepage.start.telegram.cta', 'Subscribe')}
        <ArrowRight />
      </span>
    </a>
  );
}

export default function HomepageStart(): ReactNode {
  const {posts, channel} = usePluginData('homepage-data') as HomepageData;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <ShinyText color="var(--bgx-fg)" shineColor="var(--bgx-accent)" speed={2.4} spread={120}>
          {t('homepage.start.title', 'Start here')}
        </ShinyText>
      </h2>
      <div className={styles.cards}>
        <BlogCard posts={posts} />
        <TelegramCard channel={channel} latest={posts[0]} />
      </div>
    </section>
  );
}
