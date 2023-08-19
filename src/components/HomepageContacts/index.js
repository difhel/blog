import React from 'react';
import styles from './styles.module.css';
import Translate from '@docusaurus/Translate';

const ContactList = [
  {
    title: 'Telegram',
    Svg: require('@site/static/img/telegram_logo.svg').default,
    description: 'Telegram Messenger',
    link: "https://t.me/difhel",
    caption: "@difhel"
  },
  {
    title: 'VK',
    Svg: require('@site/static/img/vk_logo.svg').default,
    description: 'VK is a Russian online social media',
    link: "https://vk.com/superdev",
    caption: "@superdev"
  },
  {
    title: 'Mastodon.social',
    Svg: require('@site/static/img/mastodon_logo.svg').default,
    description: 'Mastodon is a self-hosted social networking service',
    link: "https://mastodon.social/@difhel",
    caption: "@difhel@mastodon.social"
  },
  {
    title: 'Email',
    Svg: require('@site/static/icons/email.svg').default,
    description: "The old fashioned way!",
    link: "mailto:mark@difhel.dev",
    caption: "mark@difhel.dev"
  },
];

function Contact({Svg, title, description, link, caption}) {
  return (
    <div className={'col ' + styles.contactItemCol}>
      <div className={"text--center " + styles.contactItem}>
        <Svg className={styles.contactSvg} role="img" />
        <span>{title}</span>
      </div>
      <small class="text-muted"><Translate>{description}</Translate></small>
      <br />
      <a href={link}>{caption}</a>
    </div>
  );
}

export default function HomepageContacts() {
  return (
    <section className={styles.contactsSection}>
      <h1>Contacts</h1>
      <div className={"row " + styles.contactList}>
          {ContactList.map((props, idx) => (
            <Contact key={idx} {...props} />
          ))}
      </div>
    </section>
  );
}
