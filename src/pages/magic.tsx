import React, {type ReactNode} from 'react';
import Head from '@docusaurus/Head';
import {Redirect, useLocation} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';

// The animation moved to the homepage; old /magic links (with ?loop, ?force, ?speed) land there
export default function Magic(): ReactNode {
  const home = useBaseUrl('/');
  const {search, hash} = useLocation();
  return (
    <>
      <Head>
        {/* no meta refresh: it would fire before the redirect and drop ?loop and friends */}
        <meta name="robots" content="noindex" />
      </Head>
      <Redirect to={`${home}${search}${hash}`} />
    </>
  );
}
