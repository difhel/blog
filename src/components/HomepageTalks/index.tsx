import React, { type ReactNode } from 'react';
import { translate } from '@docusaurus/Translate';
import ShinyText from '@site/src/components/ShinyText';

import styles from './styles.module.css';

const CalendarIcon = require('@site/static/icons/talks/calendar.svg').default;
const LocationIcon = require('@site/static/icons/talks/location.svg').default;
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
  hostHref?: string;
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
    hostHref: 'https://ton.org',
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

function HostName({ talk }: { talk: Talk }): ReactNode {
  const hostName = t(talk.hostNameId, talk.hostName);

  if (!talk.hostHref) {
    return <span>{hostName}</span>;
  }

  return (
    <a href={talk.hostHref} rel="noreferrer" target="_blank">
      {hostName}
    </a>
  );
}

function TalkCard({ talk }: { talk: Talk }): ReactNode {
  return (
    <article className={styles.talkCard}>
      <a
        aria-label={t(talk.hostNameId, talk.hostName)}
        className={styles.hostLogoLink}
        href={talk.hostHref ?? talk.eventHref}
        rel="noreferrer"
        target="_blank">
        <img
          alt=""
          className={styles.hostLogo}
          height="56"
          loading="lazy"
          src={talk.hostLogo}
          width="56"
        />
      </a>

      <div className={styles.talkBody}>
        <h3 className={styles.talkTitle}>{t(talk.titleId, talk.title)}</h3>
        <p className={styles.talkHostLine}>
          <a href={talk.eventHref} rel="noreferrer" target="_blank">
            {t(talk.eventNameId, talk.eventName)}
          </a>
          <span>{t('homepage.talks.by', 'by')}</span>
          <HostName talk={talk} />
        </p>

        <div className={styles.talkMeta}>
          <span className={styles.metaItem}>
            <span className={styles.metaIcon}>
              <CalendarIcon aria-hidden="true" />
            </span>
            {t(talk.dateId, talk.date)}
          </span>
          <span className={styles.metaItem}>
            <span className={styles.metaIcon}>
              <LocationIcon aria-hidden="true" />
            </span>
            {t(talk.locationId, talk.location)}
          </span>
        </div>

        <p className={styles.talkDescription}>{t(talk.descriptionId, talk.description)}</p>
      </div>
    </article>
  );
}

export default function HomepageTalks(): ReactNode {
  return (
    <section className={styles.talksSection}>
      <h1 className={styles.sectionTitle}>
        <ShinyText
          color="var(--ifm-heading-color, var(--ifm-font-color-base))"
          shineColor="var(--ifm-color-primary-lightest)"
          speed={2.4}
          spread={120}>
          {t('homepage.talks.title', 'Talks')}
        </ShinyText>
      </h1>

      <div className={styles.talkList}>
        {talks.map((talk) => (
          <TalkCard key={talk.titleId} talk={talk} />
        ))}
      </div>
    </section>
  );
}
