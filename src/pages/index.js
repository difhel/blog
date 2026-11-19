import React from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Translate, { translate } from '@docusaurus/Translate';
import HomepageContacts from '@site/src/components/HomepageContacts';
import HomepageStart from '@site/src/components/HomepageStart';
import HomepageTalks from '@site/src/components/HomepageTalks';
import SideRays from '@site/src/components/SideRays';
import logo from './../../static/img/avatar.webp';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <SideRays
        className={styles.heroRays}
        speed={3.4}
        rayColor1="#A5B4FF"
        rayColor2="#5B5BD6"
        intensity={2}
        spread={2}
        origin="top-right"
        tilt={0}
        saturation={1.5}
        blend={0.75}
        falloff={1.6}
        opacity={1}
      />
      <div className={clsx('container', styles.heroContent)}>
        <div className={clsx(styles.metaContainerHome)}>
          <img className={clsx(styles.avatarImage)} src={logo} alt="" />
          <h1 className="hero__title">
            <Translate>Mark Fomin</Translate>
          </h1>
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
          <HomepageStart />
          <HomepageTalks />
          <HomepageContacts />
        </div>

        {/* <HomepageFeatures /> */}
      </main>
    </Layout>
  );
}
