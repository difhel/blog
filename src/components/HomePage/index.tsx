import React, {type ComponentType, type ReactNode} from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Translate, {translate} from '@docusaurus/Translate';
import HomepageContacts from '@site/src/components/HomepageContacts';
import HomepageStart from '@site/src/components/HomepageStart';
import HomepageTalks from '@site/src/components/HomepageTalks';
import SideRays from '@site/src/components/SideRays';

import styles from './styles.module.css';

const logo: string = require('@site/static/img/avatar.webp').default;

function HomepageHeader(): ReactNode {
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
        <div className={styles.metaContainerHome}>
          <img className={styles.avatarImage} src={logo} alt="" />
          <h1 className="hero__title">
            <Translate>Mark Fomin</Translate>
          </h1>
        </div>
      </div>
    </header>
  );
}

function HomeContent(): ReactNode {
  return (
    <>
      <HomepageHeader />
      <main>
        <div className="container">
          <HomepageStart />
          <HomepageTalks />
          <HomepageContacts />
        </div>
      </main>
    </>
  );
}

/**
 * The homepage. `/` passes the Figma-style animation as `Stage`; without one the page
 * renders as is.
 */
export default function HomePage({Stage}: {Stage?: ComponentType<{children: ReactNode}>}): ReactNode {
  return (
    <Layout title={translate({message: 'Mark Fomin'})} description="Mark Fomin's">
      {Stage ? (
        <Stage>
          <HomeContent />
        </Stage>
      ) : (
        <HomeContent />
      )}
    </Layout>
  );
}
