import React, { type ComponentType, type ReactNode, type SVGProps } from 'react';
import Translate from '@docusaurus/Translate';
import ShinyText from '@site/src/components/ShinyText';
import LucideIcon from '@site/src/components/LucideIcon';

import styles from './styles.module.css';

type Contact = {
  title: string;
  // Full-bleed square logo, clipped by the tile; absent = Lucide glyph on a tonal tile
  Logo?: ComponentType<SVGProps<SVGSVGElement>>;
  description: string;
  link: string;
  caption: string;
};

const ContactList: Contact[] = [
  {
    title: 'Telegram',
    Logo: require('@site/static/img/telegram_logo.svg').default,
    description: 'Telegram Messenger',
    link: 'https://t.me/difhel',
    caption: '@difhel',
  },
  {
    title: 'LinkedIn',
    Logo: require('@site/static/img/linkedin_logo.svg').default,
    description: "Let's connect and build something great together!",
    link: 'https://linkedin.com/in/difhel',
    caption: '@difhel',
  },
  {
    title: 'X (Twitter)',
    Logo: require('@site/static/img/x_logo.svg').default,
    description: 'Some shitposting',
    link: 'https://x.com/difhel',
    caption: '@difhel',
  },
  {
    title: 'Email',
    description: 'The old fashioned way!',
    link: 'mailto:mark@difhel.dev',
    caption: 'mark@difhel.dev',
  },
  {
    title: 'Habr',
    Logo: require('@site/static/img/habr_logo.svg').default,
    description: 'Some technical articles that are not published on /blog',
    link: 'https://habr.com/ru/users/difhel/',
    caption: '@difhel',
  },
  {
    title: 'GitHub',
    Logo: require('@site/static/img/github_logo.svg').default,
    description: 'Some code',
    link: 'https://github.com/difhel',
    caption: '@difhel',
  },
];

function ContactCard({ Logo, title, description, link, caption }: Contact): ReactNode {
  const external = !link.startsWith('mailto:');
  return (
    <a
      className={styles.contactCard}
      href={link}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      <span className={Logo ? styles.logoTile : styles.glyphTile} aria-hidden="true">
        {Logo ? (
          <Logo className={styles.logo} preserveAspectRatio="xMidYMid slice" />
        ) : (
          // Lucide "mail"
          <LucideIcon className={styles.glyph}>
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
          </LucideIcon>
        )}
      </span>
      <span className={styles.contactBody}>
        <span className={styles.contactTitle}>{title}</span>
        <span className={styles.contactDescription}>
          <Translate>{description}</Translate>
        </span>
        <span className={styles.contactHandle}>{caption}</span>
      </span>
      {/* Lucide "arrow-up-right" */}
      <LucideIcon className={styles.arrow}>
        <path d="M7 7h10v10" />
        <path d="M7 17 17 7" />
      </LucideIcon>
    </a>
  );
}

export default function HomepageContacts(): ReactNode {
  return (
    <section className={styles.contactsSection}>
      <h2 className={styles.sectionTitle}>
        <ShinyText color="var(--bgx-fg)" shineColor="var(--bgx-accent)" speed={2.4} spread={120}>
          <Translate>Contacts</Translate>
        </ShinyText>
      </h2>
      <div className={styles.contactList}>
        {ContactList.map((contact) => (
          <ContactCard key={contact.title} {...contact} />
        ))}
      </div>
    </section>
  );
}
