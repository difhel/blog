import React, {type ReactNode} from 'react';
import Head from '@docusaurus/Head';
import FigmaAnimation from '@site/src/components/FigmaAnimation';
import HomePage from '@site/src/components/HomePage';

// Experimental: the homepage, built live by three Figma-style collaborators
export default function Magic(): ReactNode {
  return (
    <>
      <Head>
        {/* an experiment that duplicates `/`: keep it out of search results */}
        <meta name="robots" content="noindex" />
      </Head>
      <HomePage Stage={FigmaAnimation} />
    </>
  );
}
