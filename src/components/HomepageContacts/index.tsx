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
    title: 'LinkedIn',
    Svg: require('@site/static/img/linkedin_logo.svg').default,
    description: 'Let\'s connect and build something great together!',
    link: "https://linkedin.com/in/difhel",
    caption: "@difhel"
  },
  {
    title: 'X (Twitter)',
    Svg: require('@site/static/img/x_logo.svg').default,
    description: 'Some shitposting',
    link: "https://x.com/difhel",
    caption: "@difhel"
  },
  {
    title: 'Email',
    Svg: require('@site/static/icons/email.svg').default,
    description: "The old fashioned way!",
    link: "mailto:mark@difhel.dev",
    caption: "mark@difhel.dev"
  },
  {
    title: 'Habr',
    Svg: require('@site/static/img/habr_logo.svg').default,
    description: "Some technical articles that are not published on /blog",
    link: "https://habr.com/ru/users/difhel/",
    caption: "@difhel"
  },
  {
    title: 'GitHub',
    Svg: require('@site/static/img/github_logo.svg').default,
    description: "Some code",
    link: "https://github.com/difhel",
    caption: "@difhel"
  }
];

function Contact({Svg, title, description, link, caption}) {
  return (
    <div className={styles.contactItemCol}>
      <div className={styles.contactItemLeft}>
        <Svg className={styles.contactSvg} role="img" style={title === 'Habr' ? {borderRadius: '50%'} : {}} />
      </div>
      <div className={styles.contactItemRight}>
        <span className={styles.contactItemTitle}>{title}</span>
        <small className="text-muted"><Translate>{description}</Translate></small>
        <a href={link}>{caption}</a>
      </div>
    </div>
  );
}

export default function HomepageContacts() {
  return (
    <section className={styles.contactsSection}>
      <h1>
        <Translate>Contacts</Translate>
      </h1>
      <div className={styles.contactList}>
          {ContactList.map((props, idx) => (
            <Contact key={idx} {...props} />
          ))}
      </div>
    </section>
  );
}
