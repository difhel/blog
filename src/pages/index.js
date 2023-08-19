import React from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Translate, { translate } from '@docusaurus/Translate';
import HomepageContacts from '@site/src/components/HomepageContacts';
import logo from './../../static/img/avatar.jpg';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={clsx(styles.metaContainerHome)}>
          <img className={clsx(styles.avatarImage)} src={ logo } />
          <h1 className="hero__title">
            <Translate>Mark Fomin</Translate>
          </h1>
          <p className="hero__subtitle">
          </p>
        </div>
        
      </div>
    </header>
  );
}


export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={translate({message: "Mark Fomin"})}
      description="Mark Fomin's">
      <HomepageHeader />
      <main>
        {/* <HomepageWhoAmiI /> */}
        <div className='container'>
          <HomepageContacts />
        </div>

        {/* <HomepageFeatures /> */}
      </main>
    </Layout>
  );
}
