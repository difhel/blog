import React, { type ReactNode } from 'react';
import { translate } from '@docusaurus/Translate';
import ShinyText from '@site/src/components/ShinyText';
import LucideIcon from '@site/src/components/LucideIcon';

import styles from './styles.module.css';

// Lucide "calendar"
function CalendarIcon(): ReactNode {
  return (
    <LucideIcon className={styles.chipIcon}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </LucideIcon>
  );
}

// Lucide "map-pin"
function LocationIcon(): ReactNode {
  return (
    <LucideIcon className={styles.chipIcon}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </LucideIcon>
  );
}
const TonFoundationLogo = require('@site/static/img/talks/ton-foundation.jpg').default;
const TonPiterHubLogo = require('@site/static/img/talks/ton-piter-hub.jpg').default;

type Talk = {
  date: string;
  dateId: string;
  description: string;
  descriptionId: string;
  eventHref: string;
  eventName: string;
  eventNameId: string;
  hostLogo: string;
  hostName: string;
  hostNameId: string;
  location: string;
  locationId: string;
  title: string;
  titleId: string;
};

const talks: Talk[] = [
  {
    titleId: 'homepage.talks.telegramGifts.title',
    title: 'Building Telegram Gifts Support in MyTonWallet: From Fragment Minter to Wallet UI',
    eventNameId: 'homepage.talks.telegramGifts.event',
    eventName: 'HiDeFi',
    eventHref: 'https://t.me/tonpiter/223',
    hostNameId: 'homepage.talks.telegramGifts.host',
    hostName: 'TON Piter Hub',
    hostLogo: TonPiterHubLogo,
    dateId: 'homepage.talks.telegramGifts.date',
    date: 'October 18, 2025',
    locationId: 'homepage.talks.telegramGifts.location',
    location: 'offline, Saint Petersburg, Russia',
    descriptionId: 'homepage.talks.telegramGifts.description',
    description:
      'A technical overview of how Telegram Gifts can be managed as on-chain NFTs, including safer ownership semantics, automatic tracking of new gift collections, and the UX decisions behind showing gifts inside MyTonWallet.',
  },
  {
    titleId: 'homepage.talks.tonUx.title',
    title: 'Speeding up UX in TON applications: how to build the perfect frontend for TMA',
    eventNameId: 'homepage.talks.tonUx.event',
    eventName: 'TON Builders Meetup',
    eventHref: 'https://t.me/toncishub/1713',
    hostNameId: 'homepage.talks.tonUx.host',
    hostName: 'TON Foundation',
    hostLogo: TonFoundationLogo,
    dateId: 'homepage.talks.tonUx.date',
    date: 'July 26, 2025',
    locationId: 'homepage.talks.tonUx.location',
    location: 'offline, Moscow, Russia',
    descriptionId: 'homepage.talks.tonUx.description',
    description:
      'A deep dive into the frontend techniques that improve UX and conversion in TON apps, covering Web Vitals, caching strategy, lazy loading, Telegram UI integration, debugging tools, internationalization, CSP, and optimistic UI.',
  },
];

function t(id: string, message: string): string {
  return translate({ id, message });
}

function TalkCard({ talk }: { talk: Talk }): ReactNode {
  return (
    <a className={styles.talkCard} href={talk.eventHref} rel="noreferrer" target="_blank">
      <header className={styles.talkHeader}>
        <img
          alt=""
          className={styles.hostLogo}
          height="40"
          loading="lazy"
          src={talk.hostLogo}
          width="40"
        />
        <span className={styles.eventBlock}>
          <span className={styles.eventName}>{t(talk.eventNameId, talk.eventName)}</span>
          <span className={styles.hostName}>{t(talk.hostNameId, talk.hostName)}</span>
        </span>
        {/* Lucide "arrow-up-right" */}
        <LucideIcon className={styles.arrow}>
          <path d="M7 7h10v10" />
          <path d="M7 17 17 7" />
        </LucideIcon>
      </header>

      <h3 className={styles.talkTitle}>{t(talk.titleId, talk.title)}</h3>
      <p className={styles.talkDescription}>{t(talk.descriptionId, talk.description)}</p>

      <footer className={styles.talkChips}>
        <span className={styles.chip}>
          <CalendarIcon />
          {t(talk.dateId, talk.date)}
        </span>
        <span className={styles.chip}>
          <LocationIcon />
          {t(talk.locationId, talk.location)}
        </span>
      </footer>
    </a>
  );
}

export default function HomepageTalks(): ReactNode {
  return (
    <section className={styles.talksSection}>
      <h2 className={styles.sectionTitle}>
        <ShinyText color="var(--bgx-fg)" shineColor="var(--bgx-accent)" speed={2.4} spread={120}>
          {t('homepage.talks.title', 'Talks')}
        </ShinyText>
      </h2>

      <div className={styles.talkList}>
        {talks.map((talk) => (
          <TalkCard key={talk.titleId} talk={talk} />
        ))}
      </div>
    </section>
  );
}
